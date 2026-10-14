from django.contrib import admin
from .models import Vehicle, VehicleCompliance

class VehicleComplianceInline(admin.TabularInline):
    model = VehicleCompliance
    extra = 1

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'make', 'model', 'vehicle_class', 'fuel_type', 'status', 'current_odometer')
    list_filter = ('vehicle_class', 'fuel_type', 'status')
    search_fields = ('registration_number', 'vin', 'make', 'model')
    inlines = [VehicleComplianceInline]

@admin.register(VehicleCompliance)
class VehicleComplianceAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'document_type', 'document_number', 'expiry_date', 'computed_status')
    list_filter = ('document_type',)
    search_fields = ('vehicle__registration_number', 'document_number')
