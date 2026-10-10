from rest_framework import serializers
from django.utils import timezone
from .models import ContractPricingCard, CorporateInvoice, DriverPayout
from apps.dispatches.models import DispatchBooking


class ContractPricingCardSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)

    class Meta:
        model = ContractPricingCard
        fields = '__all__'


class InvoiceBookingLineSerializer(serializers.ModelSerializer):
    """Slim booking representation for invoice line items."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_type_display = serializers.CharField(source='get_booking_type_display', read_only=True)

    class Meta:
        model = DispatchBooking
        fields = [
            'id', 'booking_reference', 'booking_type', 'booking_type_display', 
            'pickup_time', 'pickup_location', 'dropoff_location', 'passenger_name', 
            'distance_km', 'base_rate_inr', 'extra_km_charge_inr', 'toll_parking_inr', 
            'tax_gst_inr', 'total_fare_inr', 'status', 'status_display'
        ]


class CorporateInvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_gstin = serializers.CharField(source='client.gstin', read_only=True)
    client_billing_address = serializers.CharField(source='client.billing_address', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_count = serializers.SerializerMethodField()
    bookings_detail = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = CorporateInvoice
        fields = '__all__'

    def get_booking_count(self, obj):
        return obj.bookings.count()

    def get_bookings_detail(self, obj):
        return InvoiceBookingLineSerializer(obj.bookings.all(), many=True).data

    def get_is_overdue(self, obj):
        if obj.due_date and obj.status in [CorporateInvoice.InvoiceStatus.SENT, CorporateInvoice.InvoiceStatus.OVERDUE]:
            return obj.due_date < timezone.now().date()
        return False


class DriverPayoutSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    driver_badge = serializers.CharField(source='driver.badge_number', read_only=True)
    driver_license = serializers.CharField(source='driver.license_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DriverPayout
        fields = '__all__'

    def get_driver_name(self, obj):
        if obj.driver and obj.driver.user:
            name = f"{obj.driver.user.first_name} {obj.driver.user.last_name}".strip()
            return name if name else obj.driver.user.username
        return "Unknown Driver"
