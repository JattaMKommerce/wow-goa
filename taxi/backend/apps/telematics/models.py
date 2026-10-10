import math
from django.db import models
from django.utils import timezone
from apps.fleet.models import Vehicle


class GeofenceZone(models.Model):
    class ZoneType(models.TextChoices):
        AIRPORT = 'AIRPORT', 'International Airport Hub'
        HOTEL_CLUSTER = 'HOTEL_CLUSTER', 'Luxury Resort & Hotel Cluster'
        TECH_PARK = 'TECH_PARK', 'Corporate Tech Park / DC'
        DEPOT = 'DEPOT', 'Fleet Operations Hub / Depot'
        RESTRICTED = 'RESTRICTED', 'Restricted / Low-Speed Zone'

    name = models.CharField(max_length=120, unique=True)
    zone_type = models.CharField(max_length=30, choices=ZoneType.choices, default=ZoneType.TECH_PARK)
    center_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    center_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    radius_meters = models.PositiveIntegerField(default=1200, help_text="Circular geofence radius in meters")
    speed_limit_kmh = models.PositiveIntegerField(default=60, help_text="Maximum permissible speed inside zone")
    color_hex = models.CharField(max_length=15, default='#1e293b')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def contains_point(self, lat, lng):
        """Haversine distance calculation in meters."""
        try:
            lat1 = math.radians(float(self.center_latitude))
            lon1 = math.radians(float(self.center_longitude))
            lat2 = math.radians(float(lat))
            lon2 = math.radians(float(lng))

            dlat = lat2 - lat1
            dlon = lon2 - lon1

            a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = 6371000 * c  # Earth radius in meters
            return distance <= self.radius_meters
        except Exception:
            return False

    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()} - {self.radius_meters}m)"


class VehicleTelemetry(models.Model):
    class EngineStatus(models.TextChoices):
        RUNNING = 'RUNNING', 'Engine Running / In Motion'
        IDLE = 'IDLE', 'Idling (Engine ON, Stopped)'
        OFF = 'OFF', 'Ignition OFF'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='telemetry_logs')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    heading = models.PositiveSmallIntegerField(default=0, help_text="Bearing 0-360 degrees")
    engine_status = models.CharField(max_length=15, choices=EngineStatus.choices, default=EngineStatus.IDLE)
    battery_pct = models.DecimalField(max_digits=5, decimal_places=2, default=96.0)
    fuel_pct = models.DecimalField(max_digits=5, decimal_places=2, default=85.0)
    odometer_km = models.DecimalField(max_digits=10, decimal_places=2, default=12000.0)
    current_zone = models.ForeignKey(GeofenceZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='active_vehicles')
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['vehicle', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.vehicle.registration_number} @ ({self.latitude}, {self.longitude}) - {self.speed_kmh} km/h"


class TelematicsAlert(models.Model):
    class AlertType(models.TextChoices):
        OVERSPEEDING = 'OVERSPEEDING', 'Speed Governor Limit Exceeded'
        GEOFENCE_ENTER = 'GEOFENCE_ENTER', 'Entered Operational Geofence'
        GEOFENCE_EXIT = 'GEOFENCE_EXIT', 'Exited Operational Geofence'
        IDLE_TIMEOUT = 'IDLE_TIMEOUT', 'Excessive Engine Idle (>15 mins)'
        HARD_BRAKING = 'HARD_BRAKING', 'Harsh Acceleration / Braking Event'
        SOS_EMERGENCY = 'SOS_EMERGENCY', 'SOS Driver / Passenger Panic Alert'

    class Severity(models.TextChoices):
        INFO = 'INFO', 'Informational'
        WARNING = 'WARNING', 'Warning Alert'
        CRITICAL = 'CRITICAL', 'Critical High Priority'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='telematics_alerts', null=True, blank=True)
    alert_type = models.CharField(max_length=30, choices=AlertType.choices, default=AlertType.OVERSPEEDING)
    severity = models.CharField(max_length=15, choices=Severity.choices, default=Severity.WARNING)
    speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    message = models.CharField(max_length=255)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.vehicle.registration_number}: {self.message}"
