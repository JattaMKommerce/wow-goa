import os
import sys
import django
from datetime import date, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.fleet.models import Vehicle, VehicleCompliance
from apps.drivers.models import DriverProfile

User = get_user_model()

def seed_data():
    print("🌱 Seeding 50 Fleet Vehicles with multi-angle photos, rates & telematics equipment...")

    # 1. Admin User
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@fleetops.b2b',
            'first_name': 'Fleet',
            'last_name': 'Manager',
            'role': User.Roles.FLEET_ADMIN,
            'phone_number': '+1 (555) 019-2831',
            'company_name': 'Metro Fleet Logistics Ltd',
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()

    # 2. Dispatcher User
    dispatcher, created = User.objects.get_or_create(
        username='dispatcher1',
        defaults={
            'email': 'dispatcher@fleetops.b2b',
            'first_name': 'Alex',
            'last_name': 'Morgan',
            'role': User.Roles.DISPATCHER,
            'phone_number': '+1 (555) 014-9922',
            'company_name': 'Metro Fleet Logistics Ltd'
        }
    )
    dispatcher.set_password('pass123')
    dispatcher.save()

    # Default Telematics & Features list
    default_features = [
        "GPS Realtime Telemetry Tracker",
        "Automated FASTag Toll Pass",
        "Dual-Zone Climate Control",
        "Commercial Fleet Insurance Included",
        "Reverse HD Camera & Sensors",
        "Speed Governor & Dashcam"
    ]

    # Reusable multi-angle gallery photo sets
    sedan_galleries = [
        ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'],
        ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80']
    ]

    ev_galleries = [
        ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80'],
        ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80']
    ]

    suv_galleries = [
        ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'],
        ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80']
    ]

    van_galleries = [
        ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'],
        ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80']
    ]

    luxury_galleries = [
        ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'],
        ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80']
    ]

    # Clear existing demo vehicles for clean 50 distinct model seeding
    Vehicle.objects.all().delete()
    print("  ✓ Cleared previous vehicle records")

    raw_vehicles = [
        # --- EXECUTIVE SEDANS (10 Models) ---
        ('B2B-SED-101', '1HGCR2F83HA001001', 'Toyota', 'Camry Hybrid', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 14250.00, 4, 2500.00, 15.00, sedan_galleries[0]),
        ('B2B-SED-102', '1HGCR2F83HA001002', 'Honda', 'Accord Executive', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 19800.00, 4, 2500.00, 15.00, sedan_galleries[1]),
        ('B2B-SED-103', '1HGCR2F83HA001003', 'Hyundai', 'Sonata Limited', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 11200.00, 4, 2400.00, 14.00, sedan_galleries[0]),
        ('B2B-SED-104', '1HGCR2F83HA001004', 'Nissan', 'Altima SL', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 22100.00, 4, 2350.00, 14.00, sedan_galleries[1]),
        ('B2B-SED-105', '1HGCR2F83HA001005', 'Mazda', 'Mazda 6 Signature', 2023, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 28400.00, 4, 2600.00, 15.00, sedan_galleries[0]),
        ('B2B-SED-106', '1HGCR2F83HA001006', 'Kia', 'K5 GT-Line', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 9500.00, 4, 2500.00, 15.00, sedan_galleries[1]),
        ('B2B-SED-107', '1HGCR2F83HA001007', 'Volkswagen', 'Passat Elegance', 2023, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.IN_MAINTENANCE, 34100.00, 4, 2700.00, 16.00, sedan_galleries[0]),
        ('B2B-SED-108', '1HGCR2F83HA001008', 'Subaru', 'Legacy Limited', 2024, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 15600.00, 4, 2550.00, 15.00, sedan_galleries[1]),
        ('B2B-SED-109', '1HGCR2F83HA001009', 'Chevrolet', 'Malibu Premier', 2023, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 31000.00, 4, 2400.00, 14.00, sedan_galleries[0]),
        ('B2B-SED-110', '1HGCR2F83HA001010', 'Audi', 'A4 Executive Line', 2025, Vehicle.VehicleClass.SEDAN, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 6200.00, 4, 3800.00, 22.00, sedan_galleries[1]),

        # --- ELECTRIC FLEET (10 Models) ---
        ('B2B-EV-201', '5YJ3E1EA7KF002001', 'Tesla', 'Model 3 Long Range', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.ON_DUTY, 8920.00, 4, 3200.00, 18.00, ev_galleries[0]),
        ('B2B-EV-202', '5YJ3E1EA7KF002002', 'Hyundai', 'Ioniq 5 EV', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 5400.00, 5, 3000.00, 17.00, ev_galleries[1]),
        ('B2B-EV-203', '5YJ3E1EA7KF002003', 'Kia', 'EV6 GT Line', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 7100.00, 5, 3100.00, 17.00, ev_galleries[0]),
        ('B2B-EV-204', '5YJ3E1EA7KF002004', 'Ford', 'Mustang Mach-E Premium', 2024, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.ON_DUTY, 12400.00, 5, 3300.00, 18.00, ev_galleries[1]),
        ('B2B-EV-205', '5YJ3E1EA7KF002005', 'Nissan', 'Ariya Empower+', 2024, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 14900.00, 5, 2900.00, 16.00, ev_galleries[0]),
        ('B2B-EV-206', '5YJ3E1EA7KF002006', 'Polestar', 'Polestar 2 Pilot', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 4800.00, 5, 3400.00, 19.00, ev_galleries[1]),
        ('B2B-EV-207', '5YJ3E1EA7KF002007', 'Tesla', 'Model Y Long Range', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.ON_DUTY, 9300.00, 5, 3500.00, 19.00, ev_galleries[0]),
        ('B2B-EV-208', '5YJ3E1EA7KF002008', 'Audi', 'Q4 e-tron 50', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 3900.00, 5, 4100.00, 22.00, ev_galleries[1]),
        ('B2B-EV-209', '5YJ3E1EA7KF002009', 'BMW', 'i4 eDrive40', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.AVAILABLE, 6100.00, 5, 4500.00, 25.00, ev_galleries[0]),
        ('B2B-EV-210', '5YJ3E1EA7KF002010', 'Porsche', 'Taycan Performance', 2025, Vehicle.VehicleClass.EV, Vehicle.FuelType.ELECTRIC, Vehicle.VehicleStatus.ON_DUTY, 2900.00, 4, 6800.00, 35.00, ev_galleries[1]),

        # --- PREMIUM SUVS (10 Models) ---
        ('B2B-SUV-301', '4T1B11HK5JU003001', 'Toyota', 'Highlander Hybrid', 2023, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 32410.00, 6, 4500.00, 22.00, suv_galleries[0]),
        ('B2B-SUV-302', '4T1B11HK5JU003002', 'Ford', 'Explorer Limited', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.ON_DUTY, 21150.00, 7, 4600.00, 23.00, suv_galleries[1]),
        ('B2B-SUV-303', '4T1B11HK5JU003003', 'Honda', 'Pilot Elite', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 18900.00, 7, 4400.00, 22.00, suv_galleries[0]),
        ('B2B-SUV-304', '4T1B11HK5JU003004', 'Kia', 'Telluride SX Prestige', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 16400.00, 7, 4500.00, 22.00, suv_galleries[1]),
        ('B2B-SUV-305', '4T1B11HK5JU003005', 'Hyundai', 'Palisade Calligraphy', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 14200.00, 7, 4500.00, 22.00, suv_galleries[0]),
        ('B2B-SUV-306', '4T1B11HK5JU003006', 'Chevrolet', 'Traverse High Country', 2023, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.IN_MAINTENANCE, 38900.00, 7, 4300.00, 21.00, suv_galleries[1]),
        ('B2B-SUV-307', '4T1B11HK5JU003007', 'Jeep', 'Grand Cherokee L', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 23500.00, 6, 4800.00, 24.00, suv_galleries[0]),
        ('B2B-SUV-308', '4T1B11HK5JU003008', 'Mazda', 'CX-90 Turbo S', 2025, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 5800.00, 6, 4700.00, 23.00, suv_galleries[1]),
        ('B2B-SUV-309', '4T1B11HK5JU003009', 'Subaru', 'Ascent Touring', 2024, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 19100.00, 7, 4400.00, 22.00, suv_galleries[0]),
        ('B2B-SUV-310', '4T1B11HK5JU003010', 'Volvo', 'XC90 Recharge AWD', 2025, Vehicle.VehicleClass.SUV, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 7300.00, 7, 5600.00, 28.00, suv_galleries[1]),

        # --- PASSENGER VANS (10 Models) ---
        ('B2B-VAN-401', 'W1W44770313004001', 'Mercedes-Benz', 'Metris Passenger', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.IN_MAINTENANCE, 45100.00, 8, 5500.00, 25.00, van_galleries[0]),
        ('B2B-VAN-402', 'W1W44770313004002', 'Toyota', 'HiAce Commuter 12s', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 28900.00, 10, 5200.00, 24.00, van_galleries[1]),
        ('B2B-VAN-403', 'W1W44770313004003', 'Ford', 'Transit Pass XLT', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.ON_DUTY, 32100.00, 12, 5800.00, 26.00, van_galleries[0]),
        ('B2B-VAN-404', 'W1W44770313004004', 'RAM', 'ProMaster Passenger', 2023, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 39400.00, 9, 5300.00, 24.00, van_galleries[1]),
        ('B2B-VAN-405', 'W1W44770313004005', 'Hyundai', 'Staria Lounge', 2025, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 8100.00, 9, 5600.00, 25.00, van_galleries[0]),
        ('B2B-VAN-406', 'W1W44770313004006', 'Chevrolet', 'Express Passenger', 2023, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.ON_DUTY, 48200.00, 12, 5400.00, 24.00, van_galleries[1]),
        ('B2B-VAN-407', 'W1W44770313004007', 'Nissan', 'NV350 Caravan', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 24100.00, 10, 5100.00, 23.00, van_galleries[0]),
        ('B2B-VAN-408', 'W1W44770313004008', 'Volkswagen', 'Multivan Business', 2025, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 6700.00, 8, 6200.00, 28.00, van_galleries[1]),
        ('B2B-VAN-409', 'W1W44770313004009', 'Peugeot', 'Traveller VIP Line', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.ON_DUTY, 17800.00, 8, 5900.00, 26.00, van_galleries[0]),
        ('B2B-VAN-410', 'W1W44770313004100', 'Renault', 'Master Bus Edition', 2024, Vehicle.VehicleClass.VAN, Vehicle.FuelType.DIESEL, Vehicle.VehicleStatus.AVAILABLE, 21900.00, 12, 5300.00, 24.00, van_galleries[1]),

        # --- LUXURY FLEET (10 Models) ---
        ('B2B-LUX-501', 'WBA71CH0508005001', 'Mercedes-Benz', 'S-Class S580', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 4100.00, 4, 8500.00, 40.00, luxury_galleries[0]),
        ('B2B-LUX-502', 'WBA71CH0508005002', 'BMW', '7 Series 740i', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 7200.00, 4, 8200.00, 38.00, luxury_galleries[1]),
        ('B2B-LUX-503', 'WBA71CH0508005003', 'Audi', 'A8 L Quattro', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 5800.00, 4, 7900.00, 36.00, luxury_galleries[0]),
        ('B2B-LUX-504', 'WBA71CH0508005004', 'Porsche', 'Panamera Executive', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 3200.00, 4, 8900.00, 42.00, luxury_galleries[1]),
        ('B2B-LUX-505', 'WBA71CH0508005005', 'Lexus', 'LS 500h Hybrid', 2024, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 11400.00, 4, 7600.00, 35.00, luxury_galleries[0]),
        ('B2B-LUX-506', 'WBA71CH0508005006', 'Genesis', 'G90 Prestige', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 4900.00, 4, 7200.00, 34.00, luxury_galleries[1]),
        ('B2B-LUX-507', 'WBA71CH0508005007', 'Mercedes-Maybach', 'S 680 V12', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 1800.00, 4, 15000.00, 75.00, luxury_galleries[0]),
        ('B2B-LUX-508', 'WBA71CH0508005008', 'Bentley', 'Flying Spur V8', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.ON_DUTY, 2600.00, 4, 14000.00, 70.00, luxury_galleries[1]),
        ('B2B-LUX-509', 'WBA71CH0508005009', 'Maserati', 'Quattroporte Trofeo', 2024, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 8700.00, 4, 9800.00, 45.00, luxury_galleries[0]),
        ('B2B-LUX-510', 'WBA71CH0508005100', 'Rolls-Royce', 'Ghost Series II', 2025, Vehicle.VehicleClass.LUXURY, Vehicle.FuelType.PETROL, Vehicle.VehicleStatus.AVAILABLE, 1200.00, 4, 18000.00, 90.00, luxury_galleries[1]),
    ]

    vehicles = []
    for reg, vin, make, model, yr, vclass, fuel, status, odo, cap, srate, kmrate, gallery in raw_vehicles:
        v, created = Vehicle.objects.get_or_create(
            registration_number=reg,
            defaults={
                'vin': vin,
                'make': make,
                'model': model,
                'year': yr,
                'vehicle_class': vclass,
                'fuel_type': fuel,
                'status': status,
                'current_odometer': odo,
                'seating_capacity': cap,
                'transmission': 'AUTOMATIC',
                'shift_rate_inr': srate,
                'extra_km_rate_inr': kmrate,
                'features': default_features,
                'image_url': gallery[0],
                'gallery_images': gallery,
                'notes': f'Commercial B2B Specification - {make} {model}'
            }
        )
        if not created:
            v.image_url = gallery[0]
            v.gallery_images = gallery
            v.shift_rate_inr = srate
            v.extra_km_rate_inr = kmrate
            v.features = default_features
            v.status = status
            v.save()
        vehicles.append(v)

    print(f"  ✓ Seeded {len(vehicles)} Vehicles with full rate & telematics specs!")

    # 4. Compliance Docs
    today = date.today()
    for idx, v in enumerate(vehicles):
        VehicleCompliance.objects.get_or_create(
            vehicle=v,
            document_type=VehicleCompliance.DocType.INSURANCE,
            defaults={
                'document_number': f'INS-2026-{8800 + idx}',
                'issue_date': today - timedelta(days=180),
                'expiry_date': today + timedelta(days=185),
                'issuer_authority': 'Global Fleet Assurance Corp'
            }
        )
        VehicleCompliance.objects.get_or_create(
            vehicle=v,
            document_type=VehicleCompliance.DocType.PUC,
            defaults={
                'document_number': f'PUC-2026-{1100 + idx}',
                'issue_date': today - timedelta(days=330),
                'expiry_date': today + timedelta(days=15 if idx % 4 == 0 else 120),
                'issuer_authority': 'Department of Motor Vehicles'
            }
        )

    print("  ✓ Seeded Legal Compliance Vault Records")

    # 5. Drivers
    drivers_info = [
        ('driver_john', 'John', 'Doe', 'DL-NY-9823145', 4.92, 98.50, DriverProfile.DutyStatus.ON_DUTY_AVAILABLE, vehicles[0], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'),
        ('driver_sarah', 'Sarah', 'Jenkins', 'DL-CA-4451299', 4.88, 96.00, DriverProfile.DutyStatus.OFF_DUTY, None, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'),
        ('driver_marcus', 'Marcus', 'Vance', 'DL-TX-7712301', 4.95, 99.20, DriverProfile.DutyStatus.ON_DUTY_AVAILABLE, vehicles[10], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'),
    ]

    for username, fname, lname, lic, rating, safety, dstatus, assigned_v, avatar in drivers_info:
        duser, ucreated = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@fleetops.b2b',
                'first_name': fname,
                'last_name': lname,
                'role': User.Roles.DRIVER,
                'phone_number': '+1 (555) 302-8811'
            }
        )
        duser.set_password('pass123')
        duser.save()

        dp, created = DriverProfile.objects.get_or_create(
            user=duser,
            defaults={
                'license_number': lic,
                'license_expiry': today + timedelta(days=400),
                'badge_number': f"BDG-{lic[-4:]}",
                'badge_expiry': today + timedelta(days=300),
                'duty_status': dstatus,
                'assigned_vehicle': assigned_v,
                'rating': rating,
                'safety_score': safety,
                'total_trips': 142,
                'avatar_url': avatar
            }
        )
        if not created:
            dp.avatar_url = avatar
            dp.assigned_vehicle = assigned_v
            dp.save()

    print("  ✓ Seeded Driver Profiles")
    print("🎉 Seeding 50 Vehicles Completed Successfully!")

if __name__ == '__main__':
    seed_data()
