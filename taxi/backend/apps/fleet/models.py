from django.db import models
from django.utils import timezone

class Vehicle(models.Model):
    class VehicleClass(models.TextChoices):
        SEDAN = 'SEDAN', 'Executive Sedan'
        SUV = 'SUV', 'Premium SUV'
        PREMIUM_MPV = 'PREMIUM_MPV', 'Premium MPV / Innova'
        EV = 'EV', 'Electric Vehicle'
        VAN = 'VAN', 'Multi-Passenger Van'
        LUXURY = 'LUXURY', 'Luxury Class'

    class FuelType(models.TextChoices):
        PETROL = 'PETROL', 'Petrol'
        DIESEL = 'DIESEL', 'Diesel'
        CNG = 'CNG', 'CNG'
        ELECTRIC = 'ELECTRIC', 'Electric (EV)'
        HYBRID = 'HYBRID', 'Strong Hybrid'

    class VehicleStatus(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available for Assignment'
        ON_DUTY = 'ON_DUTY', 'On Duty / Dispatched'
        IN_MAINTENANCE = 'IN_MAINTENANCE', 'In Maintenance'
        DECOMMISSIONED = 'DECOMMISSIONED', 'Decommissioned'

    registration_number = models.CharField(max_length=30, unique=True, help_text="License Plate Registration Number")
    vin = models.CharField(max_length=50, unique=True, help_text="Vehicle Identification Number")
    make = models.CharField(max_length=50, help_text="e.g. Toyota, Hyundai, Tata")
    model = models.CharField(max_length=50, help_text="e.g. Camry, Innova Crysta, Tigor EV")
    year = models.PositiveIntegerField()
    vehicle_class = models.CharField(max_length=20, choices=VehicleClass.choices, default=VehicleClass.SEDAN)
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices, default=FuelType.DIESEL)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.AVAILABLE)
    current_odometer = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Current Odometer Reading (KM)")
    seating_capacity = models.PositiveIntegerField(default=4)
    transmission = models.CharField(max_length=20, default='AUTOMATIC', help_text="AUTOMATIC / MANUAL")
    shift_rate_inr = models.DecimalField(max_digits=10, decimal_places=2, default=2500.00, help_text="Shift Rate in INR (₹)")
    extra_km_rate_inr = models.DecimalField(max_digits=6, decimal_places=2, default=15.00, help_text="Extra KM Rate in INR (₹)")
    features = models.JSONField(default=list, blank=True, help_text="List of vehicle features & telematics equipment")
    image_url = models.TextField(blank=True, null=True, help_text="Main Vehicle Thumbnail Image URL or Data URI")
    gallery_images = models.JSONField(default=list, blank=True, help_text="List of gallery image URLs or Data URIs")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.registration_number} ({self.make} {self.model})"


class VehicleCompliance(models.Model):
    class DocType(models.TextChoices):
        RC_BOOK = 'RC_BOOK', 'Registration Certificate (RC Book)'
        PUC = 'PUC', 'Pollution Under Control Certificate'
        INSURANCE = 'INSURANCE', 'Vehicle Insurance Policy'
        FITNESS = 'FITNESS', 'Fitness Certificate'
        PERMIT = 'PERMIT', 'Commercial Transport Permit'
        TAX_REC = 'TAX_REC', 'Road Tax Receipt'

    class ComplianceStatus(models.TextChoices):
        VALID = 'VALID', 'Valid'
        EXPIRING_SOON = 'EXPIRING_SOON', 'Expiring Soon (<30 Days)'
        EXPIRED = 'EXPIRED', 'Expired'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='compliance_docs')
    document_type = models.CharField(max_length=20, choices=DocType.choices)
    document_number = models.CharField(max_length=100)
    issue_date = models.DateField()
    expiry_date = models.DateField()
    issuer_authority = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def computed_status(self):
        today = timezone.now().date()
        if self.expiry_date < today:
            return self.ComplianceStatus.EXPIRED
        elif (self.expiry_date - today).days <= 30:
            return self.ComplianceStatus.EXPIRING_SOON
        return self.ComplianceStatus.VALID

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.get_document_type_display()} (Exp: {self.expiry_date})"
