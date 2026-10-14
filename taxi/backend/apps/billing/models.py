from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
from apps.dispatches.models import CorporateClient, DispatchBooking
from apps.drivers.models import DriverProfile


class ContractPricingCard(models.Model):
    class ServiceType(models.TextChoices):
        AIRPORT_TRANSFER = 'AIRPORT_TRANSFER', 'Airport Flight Transfer'
        CORP_CHARTER = 'CORP_CHARTER', 'Executive Charter (8h/80km)'
        EMPLOYEE_SHUTTLE = 'EMPLOYEE_SHUTTLE', 'Employee Roaster Dispatch'
        INTERCITY = 'INTERCITY', 'Outstation Business Delegation'
        POINT_TO_POINT = 'POINT_TO_POINT', 'Point-to-Point City Transfer'

    client = models.ForeignKey(CorporateClient, on_delete=models.CASCADE, related_name='pricing_cards')
    service_type = models.CharField(max_length=30, choices=ServiceType.choices)
    vehicle_class = models.CharField(max_length=20)
    base_rate_inr = models.DecimalField(max_digits=10, decimal_places=2, default=2500.00)
    extra_km_rate_inr = models.DecimalField(max_digits=6, decimal_places=2, default=15.00)
    included_km = models.PositiveIntegerField(default=40, help_text="Free km included in base rate")
    night_surcharge_pct = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, help_text="Night surcharge %")
    weekend_surcharge_pct = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    gst_pct = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="GST % on transport")
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['client__name', 'service_type']
        unique_together = ('client', 'service_type', 'vehicle_class')

    def __str__(self):
        return f"{self.client.name} - {self.get_service_type_display()} ({self.vehicle_class}) ₹{self.base_rate_inr}"


class CorporateInvoice(models.Model):
    class InvoiceStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent to Client'
        PAID = 'PAID', 'Paid'
        OVERDUE = 'OVERDUE', 'Overdue'
        DISPUTED = 'DISPUTED', 'Disputed'

    invoice_number = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(CorporateClient, on_delete=models.PROTECT, related_name='invoices')
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    bookings = models.ManyToManyField(
        DispatchBooking, 
        blank=True, 
        limit_choices_to={'status': 'COMPLETED'}, 
        related_name='invoices'
    )
    subtotal_inr = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    toll_reimbursements_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst_inr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_inr = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    amount_paid_inr = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    amount_due_inr = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    status = models.CharField(max_length=15, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    due_date = models.DateField(blank=True, null=True)
    payment_date = models.DateField(blank=True, null=True)
    payment_reference = models.CharField(max_length=80, blank=True, null=True)
    payment_mode = models.CharField(max_length=30, blank=True, null=True, help_text="NEFT / RTGS / Cheque / UPI")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-billing_period_end']

    def generate_invoice_number(self):
        client_code = "".join([w[0] for w in self.client.name.split()[:3]]).upper() or "CORP"
        year_str = timezone.now().strftime('%Y%m')
        rand_suffix = random.randint(100, 999)
        count = CorporateInvoice.objects.filter(client=self.client).count() + 1
        return f"INV-{year_str}-{client_code}-{count:03d}-{rand_suffix}"

    def recalculate_totals(self):
        """Sum subtotal from all associated completed bookings, add toll reimbursements and 5% GST."""
        booking_list = self.bookings.all()
        subtotal = sum(float(b.base_rate_inr) + float(b.extra_km_charge_inr) for b in booking_list)
        tolls = sum(float(b.toll_parking_inr) for b in booking_list)
        gst = round((subtotal + tolls) * 0.05, 2)
        total = round(subtotal + tolls + gst, 2)
        paid = float(self.amount_paid_inr or 0.0)
        due = max(0.0, total - paid)

        self.subtotal_inr = round(subtotal, 2)
        self.toll_reimbursements_inr = round(tolls, 2)
        self.gst_inr = gst
        self.total_inr = total
        self.amount_due_inr = round(due, 2)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        if not self.due_date and self.billing_period_end:
            terms = getattr(self.client, 'payment_terms_days', 30) or 30
            end_date = self.billing_period_end
            if isinstance(end_date, str):
                from datetime import datetime
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            self.due_date = end_date + timedelta(days=terms)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.client.name} (₹{self.total_inr:,.2f}) [{self.get_status_display()}]"


class DriverPayout(models.Model):
    class PayoutStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSED = 'PROCESSED', 'Processed'
        PAID = 'PAID', 'Paid'

    driver = models.ForeignKey(DriverProfile, on_delete=models.CASCADE, related_name='payouts')
    period_start = models.DateField()
    period_end = models.DateField()
    total_trips = models.PositiveIntegerField(default=0)
    total_km = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    base_pay_inr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    incentive_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deductions_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_pay_inr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=15, choices=PayoutStatus.choices, default=PayoutStatus.PENDING)
    payment_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        driver_name = f"{self.driver.user.first_name} {self.driver.user.last_name}".strip() or self.driver.user.username
        return f"Payout {driver_name} ({self.period_start} to {self.period_end}) - ₹{self.net_pay_inr:,.2f}"
