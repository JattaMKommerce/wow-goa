from rest_framework import serializers
from .models import GeofenceZone, VehicleTelemetry, TelematicsAlert
from apps.fleet.models import Vehicle
from apps.dispatches.models import DispatchBooking


class GeofenceZoneSerializer(serializers.ModelSerializer):
    zone_type_display = serializers.CharField(source='get_zone_type_display', read_only=True)

    class Meta:
        model = GeofenceZone
        fields = '__all__'


class VehicleTelemetrySerializer(serializers.ModelSerializer):
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)
    zone_name = serializers.CharField(source='current_zone.name', read_only=True)
    engine_status_display = serializers.CharField(source='get_engine_status_display', read_only=True)

    class Meta:
        model = VehicleTelemetry
        fields = '__all__'


class TelematicsAlertSerializer(serializers.ModelSerializer):
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = TelematicsAlert
        fields = '__all__'


class LiveFleetVehicleSerializer(serializers.ModelSerializer):
    """Rich consolidated live telematics profile for radar map & HUD."""
    latest_telemetry = serializers.SerializerMethodField()
    assigned_driver = serializers.SerializerMethodField()
    active_dispatch = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'registration_number', 'make', 'model', 'vehicle_class', 
            'fuel_type', 'status', 'current_odometer', 'image_url', 
            'latest_telemetry', 'assigned_driver', 'active_dispatch'
        ]

    def get_latest_telemetry(self, obj):
        telemetry = obj.telemetry_logs.first()
        if telemetry:
            return {
                'latitude': float(telemetry.latitude),
                'longitude': float(telemetry.longitude),
                'speed_kmh': float(telemetry.speed_kmh),
                'heading': telemetry.heading,
                'engine_status': telemetry.engine_status,
                'battery_pct': float(telemetry.battery_pct),
                'fuel_pct': float(telemetry.fuel_pct),
                'odometer_km': float(telemetry.odometer_km),
                'current_zone_id': telemetry.current_zone_id,
                'current_zone_name': telemetry.current_zone.name if telemetry.current_zone else None,
                'timestamp': telemetry.timestamp
            }
        return None

    def get_assigned_driver(self, obj):
        # Driver currently assigned to this vehicle (RelatedManager)
        driver = obj.current_driver.first()
        if driver and driver.user:
            return {
                'id': driver.id,
                'name': f"{driver.user.first_name} {driver.user.last_name}".strip() or driver.user.username,
                'phone': driver.user.phone_number,
                'badge': driver.badge_number,
                'rating': float(driver.rating),
                'avatar': driver.avatar_url
            }
        return None

    def get_active_dispatch(self, obj):
        active_booking = obj.dispatches.filter(status__in=[
            DispatchBooking.DispatchStatus.DISPATCHED,
            DispatchBooking.DispatchStatus.ON_TRIP
        ]).first()
        if active_booking:
            return {
                'id': active_booking.id,
                'booking_reference': active_booking.booking_reference,
                'client_name': active_booking.client.name,
                'passenger_name': active_booking.passenger_name,
                'pickup_location': active_booking.pickup_location,
                'dropoff_location': active_booking.dropoff_location,
                'status': active_booking.status,
                'status_display': active_booking.get_status_display()
            }
        return None
