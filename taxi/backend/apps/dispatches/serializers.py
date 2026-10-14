from rest_framework import serializers
from .models import CorporateClient, DispatchBooking

class CorporateClientSerializer(serializers.ModelSerializer):
    active_bookings_count = serializers.SerializerMethodField()

    class Meta:
        model = CorporateClient
        fields = '__all__'

    def get_active_bookings_count(self, obj):
        return obj.bookings.exclude(status=DispatchBooking.DispatchStatus.COMPLETED).count()


class DispatchBookingSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_gstin = serializers.CharField(source='client.gstin', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_type_display = serializers.CharField(source='get_booking_type_display', read_only=True)
    vehicle_class_requested_display = serializers.CharField(source='get_vehicle_class_requested_display', read_only=True)
    
    assigned_vehicle_detail = serializers.SerializerMethodField()
    assigned_driver_detail = serializers.SerializerMethodField()

    class Meta:
        model = DispatchBooking
        fields = '__all__'
        extra_kwargs = {
            'booking_reference': {'required': False, 'allow_blank': True}
        }

    def get_assigned_vehicle_detail(self, obj):
        if obj.assigned_vehicle:
            return {
                'id': obj.assigned_vehicle.id,
                'registration_number': obj.assigned_vehicle.registration_number,
                'make': obj.assigned_vehicle.make,
                'model': obj.assigned_vehicle.model,
                'vehicle_class': obj.assigned_vehicle.vehicle_class,
                'fuel_type': obj.assigned_vehicle.fuel_type,
                'image_url': obj.assigned_vehicle.image_url,
                'current_odometer': float(obj.assigned_vehicle.current_odometer)
            }
        return None

    def get_assigned_driver_detail(self, obj):
        if obj.assigned_driver:
            driver = obj.assigned_driver
            name = f"{driver.user.first_name} {driver.user.last_name}".strip()
            return {
                'id': driver.id,
                'full_name': name if name else driver.user.username,
                'phone_number': driver.user.phone_number,
                'license_number': driver.license_number,
                'badge_number': driver.badge_number,
                'rating': float(driver.rating),
                'safety_score': float(driver.safety_score),
                'avatar_url': driver.avatar_url
            }
        return None
