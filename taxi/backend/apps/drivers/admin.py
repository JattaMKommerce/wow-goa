from django.contrib import admin
from .models import DriverProfile, ShiftLog

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'duty_status', 'assigned_vehicle', 'safety_score', 'rating')
    list_filter = ('duty_status',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number')

@admin.register(ShiftLog)
class ShiftLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver', 'vehicle', 'shift_start', 'shift_end', 'status')
    list_filter = ('status',)
    search_fields = ('driver__user__username', 'vehicle__registration_number')
