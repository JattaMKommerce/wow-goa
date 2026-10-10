from django.db import models
from django.conf import settings
from apps.fleet.models import Vehicle

class DriverProfile(models.Model):
    class DutyStatus(models.TextChoices):
        OFF_DUTY = 'OFF_DUTY', 'Off Duty'
        ON_DUTY_AVAILABLE = 'ON_DUTY_AVAILABLE', 'On Duty (Available)'
        ON_TRIP = 'ON_TRIP', 'On Active Trip'
        SUSPENDED = 'SUSPENDED', 'Suspended / Inactive'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    badge_number = models.CharField(max_length=50, blank=True, null=True)
    badge_expiry = models.DateField(blank=True, null=True)
    duty_status = models.CharField(max_length=20, choices=DutyStatus.choices, default=DutyStatus.OFF_DUTY)
    assigned_vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='current_driver')
    safety_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00, help_text="Safety score out of 100")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_trips = models.PositiveIntegerField(default=0)
    avatar_url = models.URLField(max_length=500, blank=True, null=True, help_text="Driver Avatar Photo URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Driver: {self.user.get_full_name() or self.user.username} ({self.license_number})"


class ShiftLog(models.Model):
    class ShiftStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active Shift'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    driver = models.ForeignKey(DriverProfile, on_delete=models.CASCADE, related_name='shift_logs')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='shift_logs')
    shift_start = models.DateTimeField(auto_now_add=True)
    shift_end = models.DateTimeField(null=True, blank=True)
    start_odometer = models.DecimalField(max_digits=10, decimal_places=2)
    end_odometer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pre_inspection_passed = models.BooleanField(default=True)
    inspection_notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ShiftStatus.choices, default=ShiftStatus.ACTIVE)

    def __str__(self):
        return f"Shift #{self.id} - {self.driver.user.username} with {self.vehicle.registration_number}"
