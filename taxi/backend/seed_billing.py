import os
import sys
import django
from datetime import date, timedelta
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.fleet.models import Vehicle
from apps.drivers.models import DriverProfile
from apps.dispatches.models import CorporateClient, DispatchBooking
from apps.billing.models import ContractPricingCard, CorporateInvoice, DriverPayout

def seed_billing():
    print("💳 Seeding Phase 3: Contract Pricing Cards, Corporate Invoices & Driver Payouts...")

    clients = list(CorporateClient.objects.all())
    if not clients:
        print("❌ No corporate clients found. Run seed_dispatches.py first.")
        return

    vehicles = list(Vehicle.objects.all())
    drivers = list(DriverProfile.objects.all())

    # 1. Contract Pricing Cards
    pricing_matrix = [
        # Infosys
        {
            'client_name': 'Infosys Technologies Ltd',
            'service_type': ContractPricingCard.ServiceType.AIRPORT_TRANSFER,
            'vehicle_class': 'SEDAN',
            'base_rate_inr': 2800.00,
            'extra_km_rate_inr': 15.00,
            'included_km': 45,
            'night_surcharge_pct': 15.00,
            'weekend_surcharge_pct': 5.00,
            'gst_pct': 5.00,
            'notes': 'Contracted Airport Mopa/Dabolim transfer rate for Tech Lead delegates.'
        },
        {
            'client_name': 'Infosys Technologies Ltd',
            'service_type': ContractPricingCard.ServiceType.EMPLOYEE_SHUTTLE,
            'vehicle_class': 'EV',
            'base_rate_inr': 2400.00,
            'extra_km_rate_inr': 13.00,
            'included_km': 50,
            'night_surcharge_pct': 10.00,
            'weekend_surcharge_pct': 0.00,
            'gst_pct': 5.00,
            'notes': 'Daily campus shift shuttle with zero-emission EV fleet.'
        },
        # Taj Exotica
        {
            'client_name': 'Taj Exotica Resort & Spa Goa',
            'service_type': ContractPricingCard.ServiceType.CORP_CHARTER,
            'vehicle_class': 'SUV',
            'base_rate_inr': 5500.00,
            'extra_km_rate_inr': 22.00,
            'included_km': 80,
            'night_surcharge_pct': 20.00,
            'weekend_surcharge_pct': 10.00,
            'gst_pct': 5.00,
            'notes': '8h/80km luxury sightseeing charter for VIP hotel guests.'
        },
        {
            'client_name': 'Taj Exotica Resort & Spa Goa',
            'service_type': ContractPricingCard.ServiceType.AIRPORT_TRANSFER,
            'vehicle_class': 'LUXURY_SUV',
            'base_rate_inr': 6500.00,
            'extra_km_rate_inr': 28.00,
            'included_km': 50,
            'night_surcharge_pct': 20.00,
            'weekend_surcharge_pct': 15.00,
            'gst_pct': 5.00,
            'notes': 'Airport VIP Chauffeur arrival with cold towel & Fiji water.'
        },
        # IndiGo
        {
            'client_name': 'IndiGo Airlines Crew Operations',
            'service_type': ContractPricingCard.ServiceType.EMPLOYEE_SHUTTLE,
            'vehicle_class': 'SEDAN',
            'base_rate_inr': 1850.00,
            'extra_km_rate_inr': 14.00,
            'included_km': 35,
            'night_surcharge_pct': 12.00,
            'weekend_surcharge_pct': 0.00,
            'gst_pct': 5.00,
            'notes': 'Hotel to Airport flight crew roster transfers.'
        },
        # TCS
        {
            'client_name': 'Tata Consultancy Services',
            'service_type': ContractPricingCard.ServiceType.INTERCITY,
            'vehicle_class': 'PREMIUM_SEDAN',
            'base_rate_inr': 7200.00,
            'extra_km_rate_inr': 18.00,
            'included_km': 150,
            'night_surcharge_pct': 15.00,
            'weekend_surcharge_pct': 10.00,
            'gst_pct': 5.00,
            'notes': 'Panaji to Belgaum/Hubli business trip delegation.'
        },
        # GTDC
        {
            'client_name': 'Goa Tourism Development Corp (GTDC)',
            'service_type': ContractPricingCard.ServiceType.POINT_TO_POINT,
            'vehicle_class': 'SEDAN',
            'base_rate_inr': 1600.00,
            'extra_km_rate_inr': 15.00,
            'included_km': 30,
            'night_surcharge_pct': 10.00,
            'weekend_surcharge_pct': 5.00,
            'gst_pct': 5.00,
            'notes': 'Inter-office protocol travel for state officials.'
        }
    ]

    card_count = 0
    for item in pricing_matrix:
        client_obj = next((c for c in clients if c.name == item['client_name']), None)
        if not client_obj:
            continue

        card, created = ContractPricingCard.objects.get_or_create(
            client=client_obj,
            service_type=item['service_type'],
            vehicle_class=item['vehicle_class'],
            defaults={
                'base_rate_inr': item['base_rate_inr'],
                'extra_km_rate_inr': item['extra_km_rate_inr'],
                'included_km': item['included_km'],
                'night_surcharge_pct': item['night_surcharge_pct'],
                'weekend_surcharge_pct': item['weekend_surcharge_pct'],
                'gst_pct': item['gst_pct'],
                'notes': item['notes'],
                'is_active': True
            }
        )
        card_count += 1

    print(f"✅ Created/Verified {card_count} Contract Pricing Cards.")

    # 2. Add extra completed bookings to give rich invoice history
    now = timezone.now()
    extra_bookings_data = [
        {
            'client_name': 'Infosys Technologies Ltd',
            'type': DispatchBooking.BookingType.AIRPORT_TRANSFER,
            'class': 'SEDAN',
            'passenger': 'Raghavendra Joshi (Director QA)',
            'phone': '+91 98220 11990',
            'pickup': 'Taj Cidade de Goa, Dona Paula',
            'dropoff': 'Dabolim Airport Terminal 1',
            'dist': 38.0,
            'base': 2800.0,
            'toll': 150.0,
            'days_ago': 20
        },
        {
            'client_name': 'Infosys Technologies Ltd',
            'type': DispatchBooking.BookingType.EMPLOYEE_SHUTTLE,
            'class': 'EV',
            'passenger': 'Verna DC Core Engineering Team',
            'phone': '+91 98221 44550',
            'pickup': 'Margao City Center Hub',
            'dropoff': 'Infosys DC, Verna Industrial Estate',
            'dist': 24.5,
            'base': 2400.0,
            'toll': 50.0,
            'days_ago': 18
        },
        {
            'client_name': 'Taj Exotica Resort & Spa Goa',
            'type': DispatchBooking.BookingType.CORP_CHARTER,
            'class': 'SUV',
            'passenger': 'Lady Victoria & Guests',
            'phone': '+44 7922 881122',
            'pickup': 'Taj Exotica Resort, Benaulim',
            'dropoff': 'Dudhsagar Waterfalls Day Tour',
            'dist': 112.0,
            'base': 5500.0,
            'toll': 320.0,
            'days_ago': 22
        },
        {
            'client_name': 'IndiGo Airlines Crew Operations',
            'type': DispatchBooking.BookingType.EMPLOYEE_SHUTTLE,
            'class': 'SEDAN',
            'passenger': 'Capt. Amit Roy & First Officer',
            'phone': '+91 98110 99882',
            'pickup': 'Mopa Airport Terminal 1',
            'dropoff': 'Vivanta Goa, Panaji',
            'dist': 42.0,
            'base': 2200.0,
            'toll': 180.0,
            'days_ago': 12
        },
        {
            'client_name': 'Tata Consultancy Services',
            'type': DispatchBooking.BookingType.INTERCITY,
            'class': 'PREMIUM_SEDAN',
            'passenger': 'Rajeev Nair (Partner Mobility)',
            'phone': '+91 98450 11223',
            'pickup': 'TCS Innovation Hub, Patto Plaza',
            'dropoff': 'Belgaum Airport (IXG)',
            'dist': 148.0,
            'base': 7200.0,
            'toll': 360.0,
            'days_ago': 15
        },
        {
            'client_name': 'Goa Tourism Development Corp (GTDC)',
            'type': DispatchBooking.BookingType.POINT_TO_POINT,
            'class': 'SEDAN',
            'passenger': 'Shri P. Kamat (Tourism Board)',
            'phone': '+91 832 242 4001',
            'pickup': 'Secretariat, Porvorim',
            'dropoff': 'Calangute Tourism Residency',
            'dist': 18.0,
            'base': 1600.0,
            'toll': 0.0,
            'days_ago': 40
        }
    ]

    for b in extra_bookings_data:
        client_obj = next((c for c in clients if c.name == b['client_name']), None)
        if not client_obj:
            continue
        p_time = now - timedelta(days=b['days_ago'])
        booking_ref = f"DISP-{p_time.strftime('%Y%m%d')}-{b['phone'][-4:]}"
        
        booking, created = DispatchBooking.objects.get_or_create(
            booking_reference=booking_ref,
            defaults={
                'client': client_obj,
                'booking_type': b['type'],
                'vehicle_class_requested': b['class'],
                'assigned_vehicle': vehicles[0] if vehicles else None,
                'assigned_driver': drivers[0] if drivers else None,
                'pickup_time': p_time,
                'pickup_location': b['pickup'],
                'dropoff_location': b['dropoff'],
                'passenger_name': b['passenger'],
                'passenger_phone': b['phone'],
                'passenger_count': 2,
                'status': DispatchBooking.DispatchStatus.COMPLETED,
                'start_odometer': 12000.0,
                'end_odometer': 12000.0 + b['dist'],
                'distance_km': b['dist'],
                'base_rate_inr': b['base'],
                'extra_km_rate_inr': 15.0,
                'toll_parking_inr': b['toll']
            }
        )
        if created:
            booking.calculate_total_fare()
            booking.save()

    completed_bookings = list(DispatchBooking.objects.filter(status=DispatchBooking.DispatchStatus.COMPLETED))
    print(f"✅ Total completed bookings ready for billing: {len(completed_bookings)}")

    # 3. Seed Corporate Invoices
    today = timezone.now().date()
    sep_start = today.replace(day=1) - timedelta(days=30)
    sep_end = today.replace(day=1) - timedelta(days=1)
    oct_start = today.replace(day=1)

    # Invoice 1: Infosys September Invoice (PAID)
    infosys = next((c for c in clients if 'Infosys' in c.name), None)
    if infosys:
        inv1, _ = CorporateInvoice.objects.get_or_create(
            invoice_number='INV-202609-INF-001',
            defaults={
                'client': infosys,
                'billing_period_start': sep_start,
                'billing_period_end': sep_end,
                'status': CorporateInvoice.InvoiceStatus.PAID,
                'due_date': sep_end + timedelta(days=30),
                'payment_date': sep_end + timedelta(days=18),
                'payment_reference': 'NEFT-ICICI-INF-9811204',
                'payment_mode': 'NEFT',
                'notes': 'Monthly billing statement for Verna DC airport delegations & employee roaster.'
            }
        )
        inf_bookings = DispatchBooking.objects.filter(client=infosys, status=DispatchBooking.DispatchStatus.COMPLETED)
        inv1.bookings.set(inf_bookings)
        inv1.recalculate_totals()
        inv1.amount_paid_inr = inv1.total_inr
        inv1.amount_due_inr = 0.0
        inv1.save()

    # Invoice 2: Taj Exotica September Invoice (PAID)
    taj = next((c for c in clients if 'Taj' in c.name), None)
    if taj:
        inv2, _ = CorporateInvoice.objects.get_or_create(
            invoice_number='INV-202609-TAJ-002',
            defaults={
                'client': taj,
                'billing_period_start': sep_start,
                'billing_period_end': sep_end,
                'status': CorporateInvoice.InvoiceStatus.PAID,
                'due_date': sep_end + timedelta(days=15),
                'payment_date': sep_end + timedelta(days=10),
                'payment_reference': 'RTGS-HDFC-TAJ-4433109',
                'payment_mode': 'RTGS',
                'notes': 'Luxury Guest Sightseeing Charters & Airport Chauffeur transfers.'
            }
        )
        taj_bookings = DispatchBooking.objects.filter(client=taj, status=DispatchBooking.DispatchStatus.COMPLETED)
        inv2.bookings.set(taj_bookings)
        inv2.recalculate_totals()
        inv2.amount_paid_inr = inv2.total_inr
        inv2.amount_due_inr = 0.0
        inv2.save()

    # Invoice 3: IndiGo October Invoice (SENT, Due in 2 weeks)
    indigo = next((c for c in clients if 'IndiGo' in c.name), None)
    if indigo:
        inv3, _ = CorporateInvoice.objects.get_or_create(
            invoice_number='INV-202610-IND-003',
            defaults={
                'client': indigo,
                'billing_period_start': oct_start,
                'billing_period_end': oct_start + timedelta(days=15),
                'status': CorporateInvoice.InvoiceStatus.SENT,
                'due_date': oct_start + timedelta(days=45),
                'payment_reference': None,
                'payment_mode': None,
                'notes': 'Flight Crew Hotel-Airport Roaster Shuttles Fortnightly Run.'
            }
        )
        ind_bookings = DispatchBooking.objects.filter(client=indigo, status=DispatchBooking.DispatchStatus.COMPLETED)
        inv3.bookings.set(ind_bookings)
        inv3.recalculate_totals()
        inv3.save()

    # Invoice 4: GTDC Overdue Invoice (OVERDUE)
    gtdc = next((c for c in clients if 'Tourism' in c.name), None)
    if gtdc:
        aug_start = sep_start - timedelta(days=31)
        aug_end = sep_start - timedelta(days=1)
        inv4, _ = CorporateInvoice.objects.get_or_create(
            invoice_number='INV-202608-GTD-004',
            defaults={
                'client': gtdc,
                'billing_period_start': aug_start,
                'billing_period_end': aug_end,
                'status': CorporateInvoice.InvoiceStatus.OVERDUE,
                'due_date': aug_end + timedelta(days=30), # Due in September, overdue now
                'notes': 'Protocol Transport Services for Tourism Department Delegates. Overdue payment reminder sent.'
            }
        )
        gtdc_bookings = DispatchBooking.objects.filter(client=gtdc, status=DispatchBooking.DispatchStatus.COMPLETED)
        inv4.bookings.set(gtdc_bookings)
        inv4.recalculate_totals()
        inv4.save()

    print(f"✅ Created/Verified 4 Corporate Invoices (Paid, Sent, Overdue).")

    # 4. Seed Driver Payouts
    for d in drivers[:3]:
        payout1, _ = DriverPayout.objects.get_or_create(
            driver=d,
            period_start=sep_start,
            period_end=sep_end,
            defaults={
                'total_trips': 14,
                'total_km': 640.0,
                'base_pay_inr': 11200.0,
                'incentive_inr': 1500.0,
                'deductions_inr': 0.0,
                'net_pay_inr': 12700.0,
                'status': DriverPayout.PayoutStatus.PAID,
                'payment_date': sep_end + timedelta(days=5),
                'notes': 'Fortnightly settlement via Bank Transfer.'
            }
        )

        payout2, _ = DriverPayout.objects.get_or_create(
            driver=d,
            period_start=oct_start,
            period_end=oct_start + timedelta(days=15),
            defaults={
                'total_trips': 6,
                'total_km': 280.0,
                'base_pay_inr': 4800.0,
                'incentive_inr': 500.0,
                'deductions_inr': 0.0,
                'net_pay_inr': 5300.0,
                'status': DriverPayout.PayoutStatus.PENDING,
                'payment_date': None,
                'notes': 'Current cycle accrued earnings.'
            }
        )

    print(f"✅ Created/Verified Driver Payouts for top active chauffeurs.")
    print("🎉 Phase 3 Billing Seeding Complete!")

if __name__ == '__main__':
    seed_billing()
