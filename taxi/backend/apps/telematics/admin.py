from django.contrib import admin
from .models import GeofenceZone, VehicleTelemetry, TelematicsAlert


@admin.register(GeofenceZone)
class GeofenceZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'zone_type', 'radius_meters', 'speed_limit_kmh', 'is_active')
    list_filter = ('zone_type', 'is_active')
    search_fields = ('name',)


@admin.register(VehicleTelemetry)
class VehicleTelemetryAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'speed_kmh', 'heading', 'engine_status', 'current_zone', 'timestamp')
    list_filter = ('engine_status', 'current_zone')
    search_fields = ('vehicle__registration_number',)


@admin.register(TelematicsAlert)
class TelematicsAlertAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'alert_type', 'severity', 'speed_kmh', 'is_resolved', 'created_at')
    list_filter = ('alert_type', 'severity', 'is_resolved')
    search_fields = ('vehicle__registration_number', 'message')
