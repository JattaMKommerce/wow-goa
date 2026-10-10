from django.db import models
from django.utils import timezone
from apps.fleet.models import Vehicle
from apps.drivers.models import DriverProfile

class CorporateClient(models.Model):
    name = models.CharField(max_length=150, unique=True, help_text="Corporate Enterprise / Hotel / Airline Account Name")
    contact_person = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=25)
    gstin = models.CharField(max_length=20, blank=True, null=True, help_text="Goods & Services Tax Identification Number")
    billing_address = models.TextField(blank=True, null=True)
    credit_limit_inr = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00, help_text="Corporate Credit Buffer (₹)")
    payment_terms_days = models.PositiveIntegerField(default=30, help_text="Net 30 / Net 45 Payment Terms")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class DispatchBooking(models.Model):
    class BookingType(models.TextChoices):
        AIRPORT_TRANSFER = 'AIRPORT_TRANSFER', 'Airport Flight Transfer'
        CORP_CHARTER = 'CORP_CHARTER', 'Executive Charter (8h / 80km)'
        EMPLOYEE_SHUTTLE = 'EMPLOYEE_SHUTTLE', 'Employee Roaster Dispatch'
        INTERCITY = 'INTERCITY', 'Outstation Business Delegation'
        POINT_TO_POINT = 'POINT_TO_POINT', 'Point-to-Point City Transfer'

    class DispatchStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Allocation'
        DISPATCHED = 'DISPATCHED', 'Dispatched / En Route'
        ON_TRIP = 'ON_TRIP', 'Active Trip (Meter Running)'
        COMPLETED = 'COMPLETED', 'Completed & Invoiced'
        CANCELLED = 'CANCELLED', 'Cancelled'

    booking_reference = models.CharField(max_length=40, unique=True, blank=True, help_text="e.g. DISP-2026-1001")
    client = models.ForeignKey(CorporateClient, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(max_length=30, choices=BookingType.choices, default=BookingType.AIRPORT_TRANSFER)
    vehicle_class_requested = models.CharField(max_length=20, choices=Vehicle.VehicleClass.choices, default=Vehicle.VehicleClass.SEDAN)
    
    # Allocated Chauffeur & Fleet Car
    assigned_vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='dispatches')
    assigned_driver = models.ForeignKey(DriverProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='dispatches')
    
    # Timing & Routing
    pickup_time = models.DateTimeField()
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    flight_number = models.CharField(max_length=30, blank=True, null=True, help_text="e.g. 6E-241 Indigo")
    
    # Passenger Details
    passenger_name = models.CharField(max_length=100)
    passenger_phone = models.CharField(max_length=25)
    passenger_count = models.PositiveIntegerField(default=1)
    special_instructions = models.TextField(blank=True, null=True)

    # Operational Status
    status = models.CharField(max_length=25, choices=DispatchStatus.choices, default=DispatchStatus.PENDING)
    cancelled_by = models.CharField(max_length=50, blank=True, null=True, help_text="User or role who cancelled the dispatch")
    cancellation_reason = models.TextField(blank=True, null=True, help_text="Reason for trip cancellation")
    
    # Odometer & Metered Trip Details
    start_odometer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    end_odometer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    # Financials & Billing (₹ INR)
    base_rate_inr = models.DecimalField(max_digits=10, decimal_places=2, default=2500.00)
    extra_km_rate_inr = models.DecimalField(max_digits=6, decimal_places=2, default=15.00)
    extra_km_charge_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    toll_parking_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_gst_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="5% GST on transport")
    total_fare_inr = models.DecimalField(max_digits=10, decimal_places=2, default=2625.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_total_fare(self):
        """Calculates extra km, GST (5%), and total billed fare."""
        extra_kms = max(0, float(self.distance_km) - 80.0) if self.booking_type == self.BookingType.CORP_CHARTER else max(0, float(self.distance_km) - 40.0)
        extra_charge = extra_kms * float(self.extra_km_rate_inr)
        self.extra_km_charge_inr = extra_charge
        
        subtotal = float(self.base_rate_inr) + extra_charge + float(self.toll_parking_inr)
        gst = round(subtotal * 0.05, 2)
        self.tax_gst_inr = gst
        self.total_fare_inr = round(subtotal + gst, 2)

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            import random
            ref_num = random.randint(1000, 9999)
            self.booking_reference = f"DISP-{timezone.now().strftime('%Y%m%d')}-{ref_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_reference} - {self.client.name} ({self.get_status_display()})"
