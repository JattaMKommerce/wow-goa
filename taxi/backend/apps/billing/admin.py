from django.contrib import admin
from .models import ContractPricingCard, CorporateInvoice, DriverPayout


@admin.register(ContractPricingCard)
class ContractPricingCardAdmin(admin.ModelAdmin):
    list_display = ('client', 'service_type', 'vehicle_class', 'base_rate_inr', 'extra_km_rate_inr', 'is_active')
    list_filter = ('service_type', 'vehicle_class', 'is_active')
    search_fields = ('client__name',)


@admin.register(CorporateInvoice)
class CorporateInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'client', 'billing_period_start', 'billing_period_end', 'total_inr', 'status', 'due_date')
    list_filter = ('status', 'billing_period_end')
    search_fields = ('invoice_number', 'client__name', 'payment_reference')


@admin.register(DriverPayout)
class DriverPayoutAdmin(admin.ModelAdmin):
    list_display = ('driver', 'period_start', 'period_end', 'total_trips', 'total_km', 'net_pay_inr', 'status')
    list_filter = ('status', 'period_end')
    search_fields = ('driver__user__first_name', 'driver__user__last_name', 'driver__badge_number')
