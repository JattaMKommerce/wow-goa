from datetime import timedelta, date
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ContractPricingCard, CorporateInvoice, DriverPayout
from .serializers import (
    ContractPricingCardSerializer, 
    CorporateInvoiceSerializer, 
    DriverPayoutSerializer
)
from apps.dispatches.models import DispatchBooking, CorporateClient
from apps.drivers.models import DriverProfile


class ContractPricingCardViewSet(viewsets.ModelViewSet):
    queryset = ContractPricingCard.objects.all().order_by('client__name', 'service_type')
    serializer_class = ContractPricingCardSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['client__name', 'service_type', 'vehicle_class', 'notes']
    ordering_fields = ['base_rate_inr', 'effective_from', 'client__name']

    def get_queryset(self):
        qs = super().get_queryset()
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        service_type = self.request.query_params.get('service_type')
        if service_type:
            qs = qs.filter(service_type=service_type)
        return qs


class CorporateInvoiceViewSet(viewsets.ModelViewSet):
    queryset = CorporateInvoice.objects.all().order_by('-billing_period_end', '-created_at')
    serializer_class = CorporateInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'client__name', 'payment_reference', 'notes']
    ordering_fields = ['billing_period_end', 'total_inr', 'due_date', 'status', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Revenue summary for billing dashboard KPIs."""
        today = timezone.now().date()
        qs = self.get_queryset()

        total_invoiced_agg = qs.aggregate(t=Sum('total_inr'))['t'] or 0.0
        total_paid_agg = qs.aggregate(t=Sum('amount_paid_inr'))['t'] or 0.0
        total_outstanding_agg = qs.filter(status__in=[
            CorporateInvoice.InvoiceStatus.SENT,
            CorporateInvoice.InvoiceStatus.OVERDUE
        ]).aggregate(t=Sum('amount_due_inr'))['t'] or 0.0

        overdue_count = qs.filter(
            Q(status=CorporateInvoice.InvoiceStatus.OVERDUE) |
            Q(status=CorporateInvoice.InvoiceStatus.SENT, due_date__lt=today)
        ).count()
        draft_count = qs.filter(status=CorporateInvoice.InvoiceStatus.DRAFT).count()

        # Monthly revenue trends (last 6 months)
        monthly_revenue = []
        for i in range(5, -1, -1):
            target_date = today.replace(day=1) - timedelta(days=i * 28)
            month_start = target_date.replace(day=1)
            # Find last day of month
            next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            month_end = next_month - timedelta(days=1)

            month_invoiced = qs.filter(
                billing_period_end__gte=month_start,
                billing_period_end__lte=month_end
            ).aggregate(t=Sum('total_inr'))['t'] or 0.0

            monthly_revenue.append({
                'month': month_start.strftime('%b %Y'),
                'revenue': float(month_invoiced)
            })

        # Top corporate accounts by invoiced volume
        top_clients_qs = CorporateClient.objects.annotate(
            billed=Sum('invoices__total_inr'),
            trips=Count('bookings', filter=Q(bookings__status=DispatchBooking.DispatchStatus.COMPLETED))
        ).filter(billed__gt=0).order_by('-billed')[:5]

        top_clients = [
            {
                'name': c.name,
                'billed': float(c.billed or 0.0),
                'trips': c.trips
            }
            for c in top_clients_qs
        ]

        return Response({
            'total_invoiced': float(total_invoiced_agg),
            'total_paid': float(total_paid_agg),
            'total_outstanding': float(total_outstanding_agg),
            'overdue_count': overdue_count,
            'draft_count': draft_count,
            'monthly_revenue': monthly_revenue,
            'top_clients': top_clients
        })

    @action(detail=False, methods=['post'])
    def generate_invoice(self, request):
        """
        Auto-generate a draft invoice for a client and billing period.
        POST body: { client_id, period_start, period_end }
        """
        client_id = request.data.get('client_id')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')

        if not client_id or not period_start or not period_end:
            return Response(
                {'error': 'client_id, period_start, period_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = CorporateClient.objects.get(pk=client_id)
        except CorporateClient.DoesNotExist:
            return Response({'error': 'Corporate client not found'}, status=status.HTTP_404_NOT_FOUND)

        completed_bookings = DispatchBooking.objects.filter(
            client=client,
            status=DispatchBooking.DispatchStatus.COMPLETED,
            pickup_time__date__gte=period_start,
            pickup_time__date__lte=period_end
        )

        if not completed_bookings.exists():
            return Response(
                {'error': f"No completed bookings found for {client.name} between {period_start} and {period_end}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice = CorporateInvoice(
            client=client,
            billing_period_start=period_start,
            billing_period_end=period_end,
            status=CorporateInvoice.InvoiceStatus.DRAFT
        )
        invoice.save()
        invoice.bookings.set(completed_bookings)
        invoice.recalculate_totals()
        invoice.save()

        return Response(
            CorporateInvoiceSerializer(invoice).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        """Mark invoice as sent to client."""
        invoice = self.get_object()
        invoice.status = CorporateInvoice.InvoiceStatus.SENT
        invoice.save(update_fields=['status', 'updated_at'])
        return Response({
            'message': f"Invoice {invoice.invoice_number} marked as Sent",
            'invoice': CorporateInvoiceSerializer(invoice).data
        })

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Record receipt of corporate payment."""
        invoice = self.get_object()
        ref = request.data.get('payment_reference', '')
        mode = request.data.get('payment_mode', 'NEFT')
        amount_paid = request.data.get('amount_paid_inr')

        invoice.status = CorporateInvoice.InvoiceStatus.PAID
        invoice.payment_date = timezone.now().date()
        invoice.payment_reference = ref
        invoice.payment_mode = mode
        if amount_paid is not None:
            invoice.amount_paid_inr = round(float(amount_paid), 2)
            invoice.amount_due_inr = max(0.0, float(invoice.total_inr) - float(invoice.amount_paid_inr))
        else:
            invoice.amount_paid_inr = invoice.total_inr
            invoice.amount_due_inr = 0.0
        invoice.save()

        return Response({
            'message': f"Invoice {invoice.invoice_number} marked as Paid ₹{float(invoice.amount_paid_inr):,.2f}",
            'invoice': CorporateInvoiceSerializer(invoice).data
        })

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Recalculate invoice totals from line items."""
        invoice = self.get_object()
        invoice.recalculate_totals()
        invoice.save()
        return Response({
            'message': 'Invoice totals recalculated',
            'invoice': CorporateInvoiceSerializer(invoice).data
        })


class DriverPayoutViewSet(viewsets.ModelViewSet):
    queryset = DriverPayout.objects.all().order_by('-period_end', '-created_at')
    serializer_class = DriverPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['driver__user__first_name', 'driver__user__last_name', 'driver__badge_number', 'notes']
    ordering_fields = ['period_end', 'net_pay_inr', 'total_trips', 'status']

    @action(detail=False, methods=['post'])
    def generate_payouts(self, request):
        """
        Auto-generate pending payouts for all drivers for a given period.
        POST: { period_start, period_end, base_pay_per_trip=800.0 }
        """
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')
        base_pay_per_trip = float(request.data.get('base_pay_per_trip', 800.0))

        if not period_start or not period_end:
            return Response(
                {'error': 'period_start and period_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        active_drivers = DriverProfile.objects.filter(user__is_active=True).exclude(duty_status=DriverProfile.DutyStatus.SUSPENDED)
        generated_payouts = []

        for driver in active_drivers:
            completed_trips = DispatchBooking.objects.filter(
                assigned_driver=driver,
                status=DispatchBooking.DispatchStatus.COMPLETED,
                pickup_time__date__gte=period_start,
                pickup_time__date__lte=period_end
            )

            trip_count = completed_trips.count()
            if trip_count == 0:
                continue

            km_agg = completed_trips.aggregate(t=Sum('distance_km'))['t'] or 0.0
            total_km = float(km_agg)
            base_pay = trip_count * base_pay_per_trip
            # Performance incentive: ₹500 if > 5 trips, plus ₹2 per km over 300km
            incentive = (500.0 if trip_count >= 5 else 0.0) + max(0.0, (total_km - 300.0) * 2.0)
            net_pay = base_pay + incentive

            # Avoid duplicates for same driver and period
            existing = DriverPayout.objects.filter(
                driver=driver,
                period_start=period_start,
                period_end=period_end
            ).first()

            if existing:
                existing.total_trips = trip_count
                existing.total_km = total_km
                existing.base_pay_inr = base_pay
                existing.incentive_inr = incentive
                existing.net_pay_inr = net_pay
                existing.save()
                generated_payouts.append(existing)
            else:
                payout = DriverPayout.objects.create(
                    driver=driver,
                    period_start=period_start,
                    period_end=period_end,
                    total_trips=trip_count,
                    total_km=total_km,
                    base_pay_inr=base_pay,
                    incentive_inr=incentive,
                    deductions_inr=0.0,
                    net_pay_inr=net_pay,
                    status=DriverPayout.PayoutStatus.PENDING
                )
                generated_payouts.append(payout)

        return Response({
            'message': f"Generated {len(generated_payouts)} driver payouts for {period_start} to {period_end}",
            'payouts': DriverPayoutSerializer(generated_payouts, many=True).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark driver payout as PAID."""
        payout = self.get_object()
        payout.status = DriverPayout.PayoutStatus.PAID
        payout.payment_date = timezone.now().date()
        payout.save(update_fields=['status', 'payment_date'])
        return Response({
            'message': f"Payout for {payout.driver.user.get_full_name() or payout.driver.user.username} marked as PAID",
            'payout': DriverPayoutSerializer(payout).data
        })
