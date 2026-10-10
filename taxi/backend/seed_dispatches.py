import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.fleet.models import Vehicle
from apps.drivers.models import DriverProfile
from apps.dispatches.models import CorporateClient, DispatchBooking

def seed_dispatches():
    print("🚀 Seeding Phase 3: B2B Corporate Clients and Dispatch Bookings...")

    clients_data = [
        {
            'name': 'Infosys Technologies Ltd',
            'contact_person': 'Vikram Malhotra',
            'contact_email': 'travel.desk@infosys.com',
            'contact_phone': '+91 98221 44550',
            'gstin': '30AABCI1234F1Z1',
            'billing_address': 'Plot 44, Electronic City Phase 1, Bangalore / Goa DC',
            'credit_limit_inr': 750000.00,
            'payment_terms_days': 30
        },
        {
            'name': 'Taj Exotica Resort & Spa Goa',
            'contact_person': 'Rajesh D\'Souza',
            'contact_email': 'concierge.exotica@tajhotels.com',
            'contact_phone': '+91 832 668 3333',
            'gstin': '30AABCT9988P1Z9',
            'billing_address': 'Calwaddo, Benaulim, Salcete, Goa 403716',
            'credit_limit_inr': 1200000.00,
            'payment_terms_days': 15
        },
        {
            'name': 'IndiGo Airlines Crew Operations',
            'contact_person': 'Capt. Rohit Verma',
            'contact_email': 'crew.ops.goa@goindigo.in',
            'contact_phone': '+91 98110 99882',
            'gstin': '30AABCI7744Q1Z2',
            'billing_address': 'Terminal 1 Operations Hub, Dabolim & Mopa Airports',
            'credit_limit_inr': 500000.00,
            'payment_terms_days': 30
        },
        {
            'name': 'Tata Consultancy Services',
            'contact_person': 'Ananya Sen',
            'contact_email': 'corporate.mobility@tcs.com',
            'contact_phone': '+91 98450 11223',
            'gstin': '30AABCT5678K1Z5',
            'billing_address': 'TCS Innovation Hub, Patto Plaza, Panaji, Goa',
            'credit_limit_inr': 600000.00,
            'payment_terms_days': 45
        },
        {
            'name': 'Goa Tourism Development Corp (GTDC)',
            'contact_person': 'Sanjeev Naik',
            'contact_email': 'protocol@goa-tourism.com',
            'contact_phone': '+91 832 242 4001',
            'gstin': '30AABCG3322R1Z8',
            'billing_address': 'Paryatan Bhavan, EDC Complex, Patto, Panaji, Goa',
            'credit_limit_inr': 900000.00,
            'payment_terms_days': 60
        }
    ]

    clients = []
    for cd in clients_data:
        client, _ = CorporateClient.objects.get_or_create(
            name=cd['name'],
            defaults=cd
        )
        clients.append(client)

    print(f"✅ Created/Verified {len(clients)} Corporate Client Accounts.")

    vehicles = list(Vehicle.objects.all())
    drivers = list(DriverProfile.objects.all())

    now = timezone.now()

    bookings_data = [
        # PENDING ALLOCATION
        {
            'client': clients[0], # Infosys
            'booking_type': DispatchBooking.BookingType.AIRPORT_TRANSFER,
            'vehicle_class_requested': Vehicle.VehicleClass.SEDAN,
            'pickup_time': now + timedelta(hours=2),
            'pickup_location': 'Manohar International Airport (GOX Mopa)',
            'dropoff_location': 'Infosys DC, Verna Industrial Estate',
            'flight_number': '6E-6184',
            'passenger_name': 'Dr. Subhash Chandra (VP Engineering)',
            'passenger_phone': '+91 98230 44991',
            'passenger_count': 1,
            'special_instructions': 'VIP Delegate. Chauffeur to carry name placard at Gate 4 Arrival.',
            'status': DispatchBooking.DispatchStatus.PENDING,
            'base_rate_inr': 2800.00,
            'extra_km_rate_inr': 15.00
        },
        {
            'client': clients[1], # Taj Exotica
            'booking_type': DispatchBooking.BookingType.CORP_CHARTER,
            'vehicle_class_requested': Vehicle.VehicleClass.SUV,
            'pickup_time': now + timedelta(hours=4),
            'pickup_location': 'Taj Exotica Resort, Benaulim',
            'dropoff_location': 'North Goa Heritage Tour & Dinner at Thalassa',
            'flight_number': None,
            'passenger_name': 'Sir Arthur Davies (Suite 104)',
            'passenger_phone': '+44 7911 123456',
            'passenger_count': 4,
            'special_instructions': '8h/80km Luxury Charter. English-fluent chauffeur with cold bottled water.',
            'status': DispatchBooking.DispatchStatus.PENDING,
            'base_rate_inr': 5500.00,
            'extra_km_rate_inr': 22.00
        },
        # DISPATCHED / EN ROUTE
        {
            'client': clients[2], # IndiGo
            'booking_type': DispatchBooking.BookingType.EMPLOYEE_SHUTTLE,
            'vehicle_class_requested': Vehicle.VehicleClass.EV,
            'pickup_time': now + timedelta(minutes=40),
            'pickup_location': 'Radisson Blu Hotel, Cavelossim',
            'dropoff_location': 'Dabolim Airport Terminal 1 Departure Gate 2',
            'flight_number': '6E-452 Crew Pickup',
            'passenger_name': 'Flight Officer Meera Nambiar & Crew',
            'passenger_phone': '+91 98710 33441',
            'passenger_count': 3,
            'special_instructions': 'Flight departure strictly on-time. No delays permitted.',
            'status': DispatchBooking.DispatchStatus.DISPATCHED,
            'assigned_vehicle': vehicles[0] if vehicles else None,
            'assigned_driver': drivers[0] if drivers else None,
            'start_odometer': vehicles[0].current_odometer if vehicles else 12400.00,
            'base_rate_inr': 2200.00,
            'extra_km_rate_inr': 14.00
        },
        # ON TRIP (Meter Running)
        {
            'client': clients[3], # TCS
            'booking_type': DispatchBooking.BookingType.POINT_TO_POINT,
            'vehicle_class_requested': Vehicle.VehicleClass.SEDAN,
            'pickup_time': now - timedelta(minutes=25),
            'pickup_location': 'TCS Patto Center, Panaji',
            'dropoff_location': 'Goa State Secretariat, Porvorim',
            'flight_number': None,
            'passenger_name': 'Rakesh Sharma (Delivery Head)',
            'passenger_phone': '+91 98455 67890',
            'passenger_count': 2,
            'special_instructions': 'Priority executive client. Meter currently live.',
            'status': DispatchBooking.DispatchStatus.ON_TRIP,
            'assigned_vehicle': vehicles[1] if len(vehicles) > 1 else None,
            'assigned_driver': drivers[1] if len(drivers) > 1 else None,
            'start_odometer': 18520.00,
            'base_rate_inr': 1800.00,
            'extra_km_rate_inr': 15.00
        },
        # COMPLETED & INVOICED
        {
            'client': clients[1], # Taj Exotica
            'booking_type': DispatchBooking.BookingType.AIRPORT_TRANSFER,
            'vehicle_class_requested': Vehicle.VehicleClass.SUV,
            'pickup_time': now - timedelta(hours=6),
            'pickup_location': 'Dabolim Airport (GOI)',
            'dropoff_location': 'Taj Exotica Resort, Benaulim',
            'flight_number': 'AI-842 Air India',
            'passenger_name': 'Mr. Heinrich Mueller (Villa 12)',
            'passenger_phone': '+49 151 2345678',
            'passenger_count': 2,
            'special_instructions': 'Luggage assistance required.',
            'status': DispatchBooking.DispatchStatus.COMPLETED,
            'assigned_vehicle': vehicles[2] if len(vehicles) > 2 else None,
            'assigned_driver': drivers[2] if len(drivers) > 2 else None,
            'start_odometer': 42100.00,
            'end_odometer': 42148.00,
            'distance_km': 48.00,
            'base_rate_inr': 3500.00,
            'extra_km_rate_inr': 20.00,
            'extra_km_charge_inr': 160.00,
            'toll_parking_inr': 120.00,
            'tax_gst_inr': 189.00,
            'total_fare_inr': 3969.00
        },
        {
            'client': clients[0], # Infosys
            'booking_type': DispatchBooking.BookingType.CORP_CHARTER,
            'vehicle_class_requested': Vehicle.VehicleClass.EV,
            'pickup_time': now - timedelta(hours=14),
            'pickup_location': 'Vivanta Panaji',
            'dropoff_location': 'Full Day Client Meetings (Panaji - Verna - Margao)',
            'flight_number': None,
            'passenger_name': 'Siddharth Roy (Senior Partner)',
            'passenger_phone': '+91 98200 12345',
            'passenger_count': 1,
            'special_instructions': 'Full day green EV corporate mobility.',
            'status': DispatchBooking.DispatchStatus.COMPLETED,
            'assigned_vehicle': vehicles[3] if len(vehicles) > 3 else None,
            'assigned_driver': drivers[3] if len(drivers) > 3 else None,
            'start_odometer': 8920.00,
            'end_odometer': 9015.00,
            'distance_km': 95.00,
            'base_rate_inr': 3200.00,
            'extra_km_rate_inr': 16.00,
            'extra_km_charge_inr': 240.00,
            'toll_parking_inr': 90.00,
            'tax_gst_inr': 176.50,
            'total_fare_inr': 3706.50
        }
    ]

    for bd in bookings_data:
        booking = DispatchBooking.objects.create(**bd)
        print(f"  ✨ Seeded Booking: {booking.booking_reference} ({booking.get_status_display()}) for {booking.client.name}")

    print("🎉 Phase 3 Dispatch Seeding Successfully Completed!")

if __name__ == '__main__':
    seed_dispatches()
