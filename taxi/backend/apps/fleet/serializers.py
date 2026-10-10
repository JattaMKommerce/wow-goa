from rest_framework import serializers
from .models import Vehicle, VehicleCompliance

class VehicleComplianceSerializer(serializers.ModelSerializer):
    computed_status = serializers.CharField(read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    vehicle_registration = serializers.CharField(source='vehicle.registration_number', read_only=True)
    vehicle_make = serializers.CharField(source='vehicle.make', read_only=True)
    vehicle_model = serializers.CharField(source='vehicle.model', read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = VehicleCompliance
        fields = '__all__'

    def get_days_remaining(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return (obj.expiry_date - today).days

class VehicleSerializer(serializers.ModelSerializer):
    compliance_docs = VehicleComplianceSerializer(many=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    vehicle_class_display = serializers.CharField(source='get_vehicle_class_display', read_only=True)
    current_driver = serializers.SerializerMethodField()
    assigned_driver = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = '__all__'

    def get_current_driver(self, obj):
        driver = obj.current_driver.first()
        if driver:
            return [
                {
                    'id': driver.id,
                    'license_number': driver.license_number,
                    'badge_number': driver.badge_number,
                    'duty_status': driver.duty_status,
                    'duty_status_display': driver.get_duty_status_display(),
                    'safety_score': float(driver.safety_score),
                    'rating': float(driver.rating),
                    'avatar_url': driver.avatar_url,
                    'user_detail': {
                        'id': driver.user.id,
                        'username': driver.user.username,
                        'first_name': driver.user.first_name,
                        'last_name': driver.user.last_name,
                        'phone_number': driver.user.phone_number,
                        'email': driver.user.email
                    }
                }
            ]
        return []

    def get_assigned_driver(self, obj):
        drivers = self.get_current_driver(obj)
        return drivers[0] if drivers else None

    def create(self, validated_data):
        compliance_docs_data = validated_data.pop('compliance_docs', [])
        vehicle = Vehicle.objects.create(**validated_data)
        for doc_data in compliance_docs_data:
            VehicleCompliance.objects.create(vehicle=vehicle, **doc_data)
        return vehicle

