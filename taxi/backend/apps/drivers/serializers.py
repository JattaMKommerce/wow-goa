from rest_framework import serializers
from .models import DriverProfile, ShiftLog
from apps.authentication.serializers import UserSerializer
from apps.fleet.serializers import VehicleSerializer

class DriverProfileSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    vehicle_detail = VehicleSerializer(source='assigned_vehicle', read_only=True)
    duty_status_display = serializers.CharField(source='get_duty_status_display', read_only=True)

    class Meta:
        model = DriverProfile
        fields = '__all__'

class ShiftLogSerializer(serializers.ModelSerializer):
    driver_detail = DriverProfileSerializer(source='driver', read_only=True)
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = ShiftLog
        fields = '__all__'
