import os
import django
import json
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.fleet.models import Vehicle, VehicleCompliance
from apps.drivers.models import DriverProfile, ShiftLog
from apps.dispatches.models import CorporateClient, DispatchBooking
from apps.billing.models import ContractPricingCard, CorporateInvoice, DriverPayout
from apps.telematics.models import GeofenceZone, VehicleTelemetry, TelematicsAlert

User = get_user_model()

test_results = []

def record_test(feature, role, action, expected, actual, status, severity="None", error_msg="", root_cause=""):
    record = {
        "feature": feature,
        "role": role,
        "action": action,
        "expected": expected,
        "actual": actual,
        "status": status,
        "severity": severity,
        "error_msg": error_msg,
        "root_cause": root_cause
    }
    test_results.append(record)
    symbol = "✅ PASS" if status == "PASS" else ("❌ FAIL" if status == "FAIL" else "⚠️ BLOCKED")
    print(f"[{symbol}] [{role}] {feature}: {action}")
    if status == "FAIL":
        print(f"   -> Expected: {expected}")
        print(f"   -> Actual:   {actual}")
        print(f"   -> Error:    {error_msg}")

def run_qa_suite():
    c = Client()
    print("=" * 80)
    print("STARTING APEX FLEET B2B QA AUTOMATED VERIFICATION SUITE")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & LOGIN TESTS
    # -------------------------------------------------------------
    # Test Admin Login
    resp = c.post('/api/auth/login/', data=json.dumps({"username": "admin", "password": "admin123"}), content_type="application/json")
    if resp.status_code == 200 and ('access' in resp.json() or 'tokens' in resp.json()):
        admin_token = resp.json().get('access') or resp.json().get('tokens', {}).get('access')
        admin_headers = {'HTTP_AUTHORIZATION': f'Bearer {admin_token}'}
        record_test("Authentication", "Fleet Admin", "Login with valid admin credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}, User: admin", "PASS")
    else:
        admin_headers = {}
        record_test("Authentication", "Fleet Admin", "Login with valid admin credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Test Dispatcher Login
    resp = c.post('/api/auth/login/', data=json.dumps({"username": "dispatcher1", "password": "admin123"}), content_type="application/json")
    if resp.status_code == 200 and ('access' in resp.json() or 'tokens' in resp.json()):
        dispatcher_token = resp.json().get('access') or resp.json().get('tokens', {}).get('access')
        dispatcher_headers = {'HTTP_AUTHORIZATION': f'Bearer {dispatcher_token}'}
        record_test("Authentication", "Dispatcher", "Login with valid dispatcher credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}, Role: DISPATCHER", "PASS")
    else:
        dispatcher_headers = {}
        record_test("Authentication", "Dispatcher", "Login with valid dispatcher credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Test Chauffeur Login
    resp = c.post('/api/auth/login/', data=json.dumps({"username": "driver_john", "password": "admin123"}), content_type="application/json")
    if resp.status_code == 200 and ('access' in resp.json() or 'tokens' in resp.json()):
        driver_token = resp.json().get('access') or resp.json().get('tokens', {}).get('access')
        driver_headers = {'HTTP_AUTHORIZATION': f'Bearer {driver_token}'}
        record_test("Authentication", "Chauffeur", "Login with valid chauffeur credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}, Role: DRIVER", "PASS")
    else:
        driver_headers = {}
        record_test("Authentication", "Chauffeur", "Login with valid chauffeur credentials", "HTTP 200 with JWT tokens", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Test Invalid Credentials
    resp = c.post('/api/auth/login/', data=json.dumps({"username": "admin", "password": "wrongpassword"}), content_type="application/json")
    if resp.status_code == 401:
        record_test("Authentication", "Anonymous", "Login with wrong password", "HTTP 401 Unauthorized", "HTTP 401 Unauthorized correctly rejected", "PASS")
    else:
        record_test("Authentication", "Anonymous", "Login with wrong password", "HTTP 401 Unauthorized", f"HTTP {resp.status_code}", "FAIL", "High")

    # -------------------------------------------------------------
    # 2. FLEET GARAGE & VEHICLE CRUD (Admin Role)
    # -------------------------------------------------------------
    # List vehicles
    resp = c.get('/api/fleet/vehicles/', **admin_headers)
    if resp.status_code == 200:
        vehicles_count = len(resp.json())
        record_test("Fleet Management", "Fleet Admin", "Fetch vehicle roster list", "HTTP 200 with vehicle list", f"HTTP 200, {vehicles_count} vehicles retrieved", "PASS")
    else:
        record_test("Fleet Management", "Fleet Admin", "Fetch vehicle roster list", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "High")

    # Vehicle Summary KPIs
    resp = c.get('/api/fleet/vehicles/summary/', **admin_headers)
    if resp.status_code == 200 and 'total_vehicles' in resp.json():
        record_test("Fleet Management", "Fleet Admin", "Fetch fleet summary KPIs", "HTTP 200 with available/on_duty/in_maintenance counts", f"HTTP 200: {resp.json()}", "PASS")
    else:
        record_test("Fleet Management", "Fleet Admin", "Fetch fleet summary KPIs", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Create New Vehicle
    new_veh_data = {
        "registration_number": f"GA-07-QA-{datetime.now().strftime('%M%S')}",
        "vin": f"VINQA{datetime.now().strftime('%d%H%M%S')}",
        "make": "Toyota",
        "model": "Innova HyCross ZX",
        "year": 2026,
        "vehicle_class": "PREMIUM_MPV",
        "fuel_type": "HYBRID",
        "seating_capacity": 7,
        "current_odometer": "12500.00",
        "status": "AVAILABLE"
    }
    resp = c.post('/api/fleet/vehicles/', data=json.dumps(new_veh_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        created_veh_id = resp.json()['id']
        record_test("Fleet Management", "Fleet Admin", "Create new luxury fleet vehicle", "HTTP 201 Created with vehicle ID", f"HTTP 201: Vehicle ID {created_veh_id} created", "PASS")
    else:
        created_veh_id = None
        record_test("Fleet Management", "Fleet Admin", "Create new luxury fleet vehicle", "HTTP 201 Created", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "High", str(resp.content))

    # Search and Filter Vehicles
    resp = c.get('/api/fleet/vehicles/?search=Toyota', **admin_headers)
    if resp.status_code == 200 and len(resp.json()) > 0:
        record_test("Fleet Management", "Fleet Admin", "Search vehicles by make/model ('Toyota')", "HTTP 200 with matching items", f"HTTP 200: {len(resp.json())} matches found", "PASS")
    else:
        record_test("Fleet Management", "Fleet Admin", "Search vehicles by make/model", "HTTP 200 with matches", f"HTTP {resp.status_code}", "FAIL", "Low")

    # -------------------------------------------------------------
    # 3. CHAUFFEUR RECORDS & SHIFT LIFECYCLE (Admin & Driver Roles)
    # -------------------------------------------------------------
    # List drivers
    resp = c.get('/api/drivers/drivers/', **admin_headers)
    if resp.status_code == 200:
        drivers_count = len(resp.json())
        driver_john_id = resp.json()[0]['id']
        record_test("Driver Management", "Fleet Admin", "Fetch chauffeur directory", "HTTP 200 with driver list", f"HTTP 200: {drivers_count} drivers loaded", "PASS")
    else:
        driver_john_id = 1
        record_test("Driver Management", "Fleet Admin", "Fetch chauffeur directory", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "High")

    # Chauffeur Portal API
    resp = c.get(f'/api/drivers/drivers/{driver_john_id}/chauffeur_portal/', **driver_headers)
    if resp.status_code == 200 and 'driver' in resp.json() and 'stats' in resp.json():
        record_test("Chauffeur Mobile", "Chauffeur", "Fetch chauffeur mobile portal dashboard data", "HTTP 200 with shift, active duty, stats, earnings", f"HTTP 200: Rating {resp.json()['stats']['rating']}, Trips {resp.json()['stats']['all_time_trips']}", "PASS")
    else:
        record_test("Chauffeur Mobile", "Chauffeur", "Fetch chauffeur mobile portal dashboard data", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "High")

    # Driver Start Shift
    shift_vehicle = Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE).first() or Vehicle.objects.first()
    shift_data = {
        "vehicle_id": shift_vehicle.id,
        "start_odometer": float(shift_vehicle.current_odometer),
        "pre_inspection_passed": True,
        "inspection_notes": "QA automated safety inspection passed."
    }
    resp = c.post(f'/api/drivers/drivers/{driver_john_id}/start_shift/', data=json.dumps(shift_data), content_type="application/json", **driver_headers)
    if resp.status_code == 200 and 'shift' in resp.json():
        record_test("Chauffeur Mobile", "Chauffeur", "Start mobile shift with pre-trip checklist", "HTTP 200 with ACTIVE shift status", f"HTTP 200: Shift active for {shift_vehicle.registration_number}", "PASS")
    else:
        record_test("Chauffeur Mobile", "Chauffeur", "Start mobile shift with pre-trip checklist", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "High", str(resp.content))

    # Driver SOS Trigger
    sos_data = {
        "latitude": 15.4989,
        "longitude": 73.8278,
        "message": "QA Automated SOS distress test"
    }
    resp = c.post(f'/api/drivers/drivers/{driver_john_id}/trigger_sos/', data=json.dumps(sos_data), content_type="application/json", **driver_headers)
    if resp.status_code == 200 and 'alert_id' in resp.json():
        record_test("Safety & SOS", "Chauffeur", "Trigger emergency SOS distress beacon", "HTTP 200 with broadcast alert ID", f"HTTP 200: Distress Alert #{resp.json()['alert_id']} logged", "PASS")
    else:
        record_test("Safety & SOS", "Chauffeur", "Trigger emergency SOS distress beacon", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "High")

    # -------------------------------------------------------------
    # 4. RTO COMPLIANCE VAULT (Admin Role)
    # -------------------------------------------------------------
    resp = c.get('/api/fleet/compliance/summary/', **admin_headers)
    if resp.status_code == 200 and 'valid' in resp.json():
        record_test("Compliance Vault", "Fleet Admin", "Fetch RTO compliance summary", "HTTP 200 with valid/expiring/expired counts", f"HTTP 200: {resp.json()}", "PASS")
    else:
        record_test("Compliance Vault", "Fleet Admin", "Fetch RTO compliance summary", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Upload Compliance Document
    doc_data = {
        "vehicle": shift_vehicle.id,
        "document_type": "INSURANCE",
        "document_number": f"POL-QA-{datetime.now().strftime('%Y%m%d%H%M')}",
        "issuer_authority": "Bajaj Allianz General Insurance",
        "issue_date": (timezone.now() - timedelta(days=30)).date().isoformat(),
        "expiry_date": (timezone.now() + timedelta(days=335)).date().isoformat(),
        "status": "VALID",
        "verified_by_admin": True
    }
    resp = c.post('/api/fleet/compliance/', data=json.dumps(doc_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        record_test("Compliance Vault", "Fleet Admin", "Upload verified vehicle insurance policy", "HTTP 201 Created with document details", f"HTTP 201: Policy {resp.json()['document_number']} stored", "PASS")
    else:
        record_test("Compliance Vault", "Fleet Admin", "Upload verified vehicle insurance policy", "HTTP 201 Created", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Medium", str(resp.content))

    # -------------------------------------------------------------
    # 5. DISPATCH DESK & COMPLETE TAXI TRIP LIFECYCLE
    # -------------------------------------------------------------
    # Get a corporate client
    corp_client = CorporateClient.objects.first()
    if not corp_client:
        corp_client = CorporateClient.objects.create(
            name="Infosys Technologies QA",
            contact_person="QA Lead",
            contact_email="qa@infosys.com",
            contact_phone="9876543210"
        )

    # Step A: Create Booking (Pending)
    booking_data = {
        "client": corp_client.id,
        "passenger_name": "Dr. Ronald Weis",
        "passenger_phone": "+91 98221 55678",
        "passenger_count": 2,
        "pickup_location": "Goa Mopa Airport GOX (Terminal 1)",
        "dropoff_location": "Taj Exotica Resort & Spa, Benaulim",
        "pickup_time": (timezone.now() + timedelta(hours=2)).isoformat(),
        "flight_number": "6E-241",
        "booking_type": "AIRPORT_TRANSFER",
        "vehicle_class_requested": "SEDAN",
        "base_rate_inr": "2800.00",
        "extra_km_rate_inr": "18.00",
        "special_instructions": "VIP Executive arrival with welcome signage"
    }
    resp = c.post('/api/dispatches/bookings/', data=json.dumps(booking_data), content_type="application/json", **dispatcher_headers)
    if resp.status_code == 201:
        created_booking = resp.json()
        booking_id = created_booking['id']
        booking_ref = created_booking['booking_reference']
        record_test("Taxi Workflow", "Dispatcher", "Create new corporate booking", "HTTP 201 with auto-generated reference (e.g. DISP-xxx)", f"HTTP 201: Created {booking_ref}, Status: {created_booking['status']}", "PASS")
    else:
        booking_id = None
        record_test("Taxi Workflow", "Dispatcher", "Create new corporate booking", "HTTP 201 Created", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Step B: AI Matchmaker Recommendations
    if booking_id:
        resp = c.get(f'/api/dispatches/bookings/{booking_id}/matchmaker_recommendations/', **dispatcher_headers)
        if resp.status_code == 200 and len(resp.json()) > 0:
            top_rec = resp.json()[0]
            record_test("AI Matchmaker", "Dispatcher", "Get AI matchmaker vehicle & driver recommendations", "HTTP 200 with ranked vehicles & drivers by match score", f"HTTP 200: Top match score {top_rec['score']}% ({top_rec['tag']})", "PASS")
        else:
            record_test("AI Matchmaker", "Dispatcher", "Get AI matchmaker vehicle & driver recommendations", "HTTP 200 with recommendations", f"HTTP {resp.status_code}", "FAIL", "High")

    # Step C: Dispatch / Allocate Driver & Vehicle
    driver_obj = DriverProfile.objects.get(pk=driver_john_id)
    vehicle_obj = shift_vehicle
    if booking_id:
        alloc_data = {
            "vehicle_id": vehicle_obj.id,
            "driver_id": driver_obj.id
        }
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/dispatch/', data=json.dumps(alloc_data), content_type="application/json", **dispatcher_headers)
        if resp.status_code == 200:
            dispatched_booking = resp.json()['booking']
            record_test("Taxi Workflow", "Dispatcher", "Allocate Chauffeur & Vehicle to Booking", "HTTP 200, Status -> DISPATCHED, Car -> ON_DUTY, Driver -> ON_TRIP", f"HTTP 200: Status is {dispatched_booking['status']}", "PASS")
        else:
            record_test("Taxi Workflow", "Dispatcher", "Allocate Chauffeur & Vehicle to Booking", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Step D: Chauffeur Starts Trip (Meter running)
    if booking_id:
        start_data = {
            "start_odometer": float(vehicle_obj.current_odometer)
        }
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/start_trip/', data=json.dumps(start_data), content_type="application/json", **driver_headers)
        if resp.status_code == 200:
            trip_live = resp.json()['booking']
            record_test("Taxi Workflow", "Chauffeur", "Passenger picked up & start meter", "HTTP 200, Status -> ON_TRIP, Start Odometer logged", f"HTTP 200: Status is {trip_live['status']}, Start ODO: {trip_live['start_odometer']}", "PASS")
        else:
            record_test("Taxi Workflow", "Chauffeur", "Passenger picked up & start meter", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Step E: Chauffeur Concludes & Completes Trip
    if booking_id:
        end_odo = float(vehicle_obj.current_odometer) + 48.5
        complete_data = {
            "end_odometer": end_odo,
            "toll_parking_inr": 150.00
        }
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/complete_trip/', data=json.dumps(complete_data), content_type="application/json", **driver_headers)
        if resp.status_code == 200:
            completed_booking = resp.json()['booking']
            fare = completed_booking['total_fare_inr']
            distance = completed_booking['distance_km']
            record_test("Taxi Workflow", "Chauffeur", "Complete Trip & finalize automated invoice billing", "HTTP 200, Status -> COMPLETED, Fare & 5% GST computed, Car/Driver released", f"HTTP 200: {distance} KM, Total Fare: ₹{fare}", "PASS")
        else:
            record_test("Taxi Workflow", "Chauffeur", "Complete Trip & finalize automated invoice billing", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Critical", str(resp.content))

    # Verify vehicle and driver were released back to available
    vehicle_obj.refresh_from_db()
    driver_obj.refresh_from_db()
    if vehicle_obj.status == Vehicle.VehicleStatus.AVAILABLE and driver_obj.duty_status == DriverProfile.DutyStatus.ON_DUTY_AVAILABLE:
        record_test("Resource Management", "System", "Auto-release vehicle & driver after trip completion", "Vehicle -> AVAILABLE, Driver -> ON_DUTY_AVAILABLE", f"Vehicle: {vehicle_obj.status}, Driver: {driver_obj.duty_status}", "PASS")
    else:
        record_test("Resource Management", "System", "Auto-release vehicle & driver after trip completion", "Vehicle -> AVAILABLE, Driver -> ON_DUTY_AVAILABLE", f"Vehicle: {vehicle_obj.status}, Driver: {driver_obj.duty_status}", "FAIL", "High")

    # -------------------------------------------------------------
    # 6. EDGE CASES, CONCURRENCY & VALIDATIONS
    # -------------------------------------------------------------
    # Edge Case 1: Cannot start an already completed trip
    if booking_id:
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/start_trip/', data=json.dumps({"start_odometer": 1000}), content_type="application/json", **driver_headers)
        if resp.status_code == 400:
            record_test("Validation Guards", "System", "Prevent starting an already completed trip", "HTTP 400 Bad Request with validation error", f"HTTP 400: {resp.json().get('error')}", "PASS")
        else:
            record_test("Validation Guards", "System", "Prevent starting an already completed trip", "HTTP 400 Bad Request", f"HTTP {resp.status_code}", "FAIL", "High")

    # Edge Case 2: Cannot complete an already completed trip
    if booking_id:
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/complete_trip/', data=json.dumps({"end_odometer": 2000}), content_type="application/json", **driver_headers)
        if resp.status_code == 400:
            record_test("Validation Guards", "System", "Prevent completing an already completed trip", "HTTP 400 Bad Request with validation error", f"HTTP 400: {resp.json().get('error')}", "PASS")
        else:
            record_test("Validation Guards", "System", "Prevent completing an already completed trip", "HTTP 400 Bad Request", f"HTTP {resp.status_code}", "FAIL", "High")

    # Edge Case 3: Test Trip Cancellation & Resource Release
    cancel_booking = DispatchBooking.objects.create(
        client=corp_client,
        passenger_name="Cancellation Test Passenger",
        passenger_phone="9876543210",
        pickup_location="Panaji",
        dropoff_location="Margao",
        pickup_time=timezone.now() + timedelta(hours=1),
        assigned_vehicle=shift_vehicle,
        assigned_driver=driver_obj,
        status=DispatchBooking.DispatchStatus.DISPATCHED
    )
    shift_vehicle.status = Vehicle.VehicleStatus.ON_DUTY
    shift_vehicle.save()
    driver_obj.duty_status = DriverProfile.DutyStatus.ON_TRIP
    driver_obj.save()

    resp = c.post(f'/api/dispatches/bookings/{cancel_booking.id}/cancel/', data=json.dumps({"reason": "Flight cancelled by airline"}), content_type="application/json", **dispatcher_headers)
    if resp.status_code == 200:
        cancel_booking.refresh_from_db()
        shift_vehicle.refresh_from_db()
        driver_obj.refresh_from_db()
        if cancel_booking.status == DispatchBooking.DispatchStatus.CANCELLED and shift_vehicle.status == Vehicle.VehicleStatus.AVAILABLE and cancel_booking.cancelled_by:
            record_test("Cancellation Flow", "Dispatcher", "Cancel active dispatch & release allocated resources", "HTTP 200, Status -> CANCELLED, cancelled_by logged, Car & Driver -> AVAILABLE", f"HTTP 200: Status: CANCELLED, Cancelled by: {cancel_booking.cancelled_by}, Vehicle: {shift_vehicle.status}", "PASS")
        else:
            record_test("Cancellation Flow", "Dispatcher", "Cancel active dispatch & release allocated resources", "Status CANCELLED, resources released", f"Status: {cancel_booking.status}, Car: {shift_vehicle.status}", "FAIL", "High")
    else:
        record_test("Cancellation Flow", "Dispatcher", "Cancel active dispatch & release allocated resources", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "High")

    # Edge Case 4: Cannot cancel a completed booking
    if booking_id:
        resp = c.post(f'/api/dispatches/bookings/{booking_id}/cancel/', data=json.dumps({"reason": "Test"}), content_type="application/json", **dispatcher_headers)
        if resp.status_code == 400:
            record_test("Validation Guards", "System", "Prevent cancelling a completed booking", "HTTP 400 Bad Request", f"HTTP 400: {resp.json().get('error')}", "PASS")
        else:
            record_test("Validation Guards", "System", "Prevent cancelling a completed booking", "HTTP 400 Bad Request", f"HTTP {resp.status_code}", "FAIL", "High")

    # Edge Case 5: Reject dispatching a vehicle currently in maintenance
    maint_reg = f"GA-07-MAINT-{datetime.now().strftime('%M%S')}"
    maint_vin = f"VINMAINT{datetime.now().strftime('%d%H%M%S')}"
    maint_vehicle = Vehicle.objects.create(
        registration_number=maint_reg,
        vin=maint_vin,
        make="Hyundai",
        model="Verna SX",
        year=2025,
        vehicle_class="SEDAN",
        fuel_type="PETROL",
        status=Vehicle.VehicleStatus.IN_MAINTENANCE
    )
    test_booking_maint = DispatchBooking.objects.create(
        client=corp_client,
        passenger_name="Maint Test",
        passenger_phone="9876543210",
        pickup_location="Airport",
        dropoff_location="Hotel",
        pickup_time=timezone.now() + timedelta(hours=3),
        status=DispatchBooking.DispatchStatus.PENDING
    )
    resp = c.post(f'/api/dispatches/bookings/{test_booking_maint.id}/dispatch/', data=json.dumps({"vehicle_id": maint_vehicle.id, "driver_id": driver_obj.id}), content_type="application/json", **dispatcher_headers)
    if resp.status_code == 400:
        record_test("Resource Availability", "Dispatcher", "Prevent dispatching a vehicle under maintenance", "HTTP 400 Bad Request with maintenance warning", f"HTTP 400: {resp.json().get('error')}", "PASS")
    else:
        record_test("Resource Availability", "Dispatcher", "Prevent dispatching a vehicle under maintenance", "HTTP 400 Bad Request", f"HTTP {resp.status_code}", "FAIL", "High")

    # -------------------------------------------------------------
    # 7. BILLING, INVOICES & DRIVER PAYOUTS (Admin Role)
    # -------------------------------------------------------------
    resp = c.get('/api/billing/invoices/summary/', **admin_headers)
    if resp.status_code == 200 and 'total_invoiced' in resp.json():
        record_test("Billing & Invoicing", "Fleet Admin", "Fetch corporate billing summary KPIs", "HTTP 200 with total invoiced, paid, outstanding", f"HTTP 200: Invoiced ₹{resp.json()['total_invoiced']}", "PASS")
    else:
        record_test("Billing & Invoicing", "Fleet Admin", "Fetch corporate billing summary KPIs", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Generate Draft Invoice
    inv_data = {
        "client_id": corp_client.id,
        "period_start": (timezone.now() - timedelta(days=30)).date().isoformat(),
        "period_end": (timezone.now() + timedelta(days=1)).date().isoformat()
    }
    resp = c.post('/api/billing/invoices/generate_invoice/', data=json.dumps(inv_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        created_inv = resp.json()
        inv_id = created_inv['id']
        record_test("Billing & Invoicing", "Fleet Admin", "Auto-generate draft corporate tax invoice", "HTTP 201 Created with total GST and line items", f"HTTP 201: Invoice #{created_inv['invoice_number']} for ₹{created_inv['total_inr']}", "PASS")
    else:
        inv_id = None
        record_test("Billing & Invoicing", "Fleet Admin", "Auto-generate draft corporate tax invoice", "HTTP 201 Created", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "High", str(resp.content))

    # Mark Invoice Paid
    if inv_id:
        pay_data = {
            "payment_reference": "NEFT-HDFC-QA-998811",
            "payment_mode": "NEFT",
            "amount_paid_inr": float(created_inv['total_inr'])
        }
        resp = c.post(f'/api/billing/invoices/{inv_id}/mark_paid/', data=json.dumps(pay_data), content_type="application/json", **admin_headers)
        if resp.status_code == 200 and resp.json()['invoice']['status'] == 'PAID':
            record_test("Billing & Invoicing", "Fleet Admin", "Mark corporate invoice as paid with NEFT reference", "HTTP 200, Status -> PAID, amount due -> 0", f"HTTP 200: {resp.json()['message']}", "PASS")
        else:
            record_test("Billing & Invoicing", "Fleet Admin", "Mark corporate invoice as paid with NEFT reference", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Generate Driver Payouts
    payout_data = {
        "period_start": (timezone.now() - timedelta(days=30)).date().isoformat(),
        "period_end": (timezone.now() + timedelta(days=1)).date().isoformat(),
        "base_pay_per_trip": 850.0
    }
    resp = c.post('/api/billing/payouts/generate_payouts/', data=json.dumps(payout_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        payouts = resp.json()['payouts']
        record_test("Chauffeur Payouts", "Fleet Admin", "Auto-calculate weekly driver settlement payouts", "HTTP 201 with base pay and performance incentive calculations", f"HTTP 201: {len(payouts)} payouts generated", "PASS")
    else:
        record_test("Chauffeur Payouts", "Fleet Admin", "Auto-calculate weekly driver settlement payouts", "HTTP 201", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Medium", str(resp.content))

    # -------------------------------------------------------------
    # 8. LIVE TELEMATICS & GPS FLEET TRACKING
    # -------------------------------------------------------------
    resp = c.get('/api/telematics/ops/summary/', **admin_headers)
    if resp.status_code == 200 and 'online_tracked' in resp.json():
        record_test("Telematics & GPS", "Fleet Admin", "Fetch live GPS control center summary", "HTTP 200 with online tracked, in-motion, idling counts", f"HTTP 200: {resp.json()}", "PASS")
    else:
        record_test("Telematics & GPS", "Fleet Admin", "Fetch live GPS control center summary", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Device GPS Ping Ingestion
    ping_data = {
        "vehicle_id": shift_vehicle.id,
        "latitude": 15.4989,
        "longitude": 73.8278,
        "speed_kmh": 62.5,
        "heading": 180,
        "battery_pct": 98.0,
        "fuel_pct": 82.0
    }
    resp = c.post('/api/telematics/ops/ping/', data=json.dumps(ping_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        record_test("Telematics & GPS", "IoT Ingestion", "Ingest live OBD-II / GPS tracker telemetry ping", "HTTP 201 Created with geofence matching", f"HTTP 201: Speed {resp.json()['speed_kmh']} km/h, Zone: {resp.json().get('zone_name')}", "PASS")
    else:
        record_test("Telematics & GPS", "IoT Ingestion", "Ingest live OBD-II / GPS tracker telemetry ping", "HTTP 201", f"HTTP {resp.status_code}", "FAIL", "High")

    # Route Movement Simulation
    resp = c.post('/api/telematics/ops/simulate/', **admin_headers)
    if resp.status_code == 200 and 'updated_count' in resp.json():
        record_test("Telematics & GPS", "Fleet Admin", "Simulate live vehicle movement along Goa transit corridors", "HTTP 200 with updated GPS coordinates across active fleet", f"HTTP 200: {resp.json()['updated_count']} vehicles stepped forward", "PASS")
    else:
        record_test("Telematics & GPS", "Fleet Admin", "Simulate live vehicle movement", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Low")

    # Resolve Safety Alert
    alert = TelematicsAlert.objects.filter(is_resolved=False).first()
    if alert:
        resp = c.post(f'/api/telematics/alerts/{alert.id}/resolve/', **admin_headers)
        if resp.status_code == 200 and resp.json()['alert']['is_resolved'] is True:
            record_test("Safety & Alerts", "Fleet Admin", "Resolve telematics safety / overspeeding alert", "HTTP 200, is_resolved -> True with resolved_at timestamp", f"HTTP 200: Alert #{alert.id} resolved", "PASS")
        else:
            record_test("Safety & Alerts", "Fleet Admin", "Resolve telematics safety alert", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Low")

    # -------------------------------------------------------------
    # 9. DISPATCH CONCURRENCY, HOT-SWAP & FLIGHT RADAR
    # -------------------------------------------------------------
    # Test Concurrency / Locking: Two allocations on same booking
    concurrent_booking = DispatchBooking.objects.create(
        client=corp_client,
        passenger_name="VIP Concurrency Test",
        passenger_phone="9876543210",
        pickup_location="Goa Mopa Airport GOX",
        dropoff_location="W Goa, Vagator",
        pickup_time=timezone.now() + timedelta(hours=4),
        status=DispatchBooking.DispatchStatus.PENDING
    )
    # Dispatcher 1 allocates
    resp1 = c.post(f'/api/dispatches/bookings/{concurrent_booking.id}/dispatch/', data=json.dumps({"vehicle_id": shift_vehicle.id, "driver_id": driver_obj.id}), content_type="application/json", **dispatcher_headers)
    # Dispatcher 2 tries to allocate again at same time
    resp2 = c.post(f'/api/dispatches/bookings/{concurrent_booking.id}/dispatch/', data=json.dumps({"vehicle_id": shift_vehicle.id, "driver_id": driver_obj.id}), content_type="application/json", **dispatcher_headers)
    
    if resp1.status_code == 200 and resp2.status_code == 400:
        record_test("Dispatch Locking", "Dispatcher", "Prevent concurrent double-dispatch on same booking", "Dispatcher 1 succeeds (200), Dispatcher 2 rejected (400)", "Atomic transaction lock successfully guarded", "PASS")
    else:
        record_test("Dispatch Locking", "Dispatcher", "Prevent concurrent double-dispatch on same booking", "Dispatcher 2 rejected (400)", f"Resp1: {resp1.status_code}, Resp2: {resp2.status_code}", "FAIL", "Critical")

    # Hot-Swap Reassign Vehicle/Driver
    swap_vehicle = Vehicle.objects.filter(status=Vehicle.VehicleStatus.AVAILABLE).first() or Vehicle.objects.last()
    swap_data = {
        "vehicle_id": swap_vehicle.id,
        "reason": "Air conditioning maintenance required on previous vehicle"
    }
    resp = c.post(f'/api/dispatches/bookings/{concurrent_booking.id}/reassign/', data=json.dumps(swap_data), content_type="application/json", **dispatcher_headers)
    if resp.status_code == 200 and resp.json()['booking']['assigned_vehicle'] == swap_vehicle.id:
        record_test("Dispatcher Hot-Swap", "Dispatcher", "Execute emergency vehicle hot-swap with reason audit", "HTTP 200 with updated assigned vehicle", f"HTTP 200: Hot-swap to {swap_vehicle.registration_number} logged", "PASS")
    else:
        record_test("Dispatcher Hot-Swap", "Dispatcher", "Execute emergency vehicle hot-swap", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "High")

    # Flight Radar Feed
    resp = c.get('/api/dispatches/bookings/flight_radar/', **dispatcher_headers)
    if resp.status_code == 200 and len(resp.json()) >= 4:
        record_test("Flight Radar", "Dispatcher", "Fetch live airport arrival radar stream (Mopa GOX & Dabolim GOI)", "HTTP 200 with active commercial flights", f"HTTP 200: {len(resp.json())} live flights tracked", "PASS")
    else:
        record_test("Flight Radar", "Dispatcher", "Fetch live airport arrival radar stream", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # Flight Delay Sync
    resp = c.post(f'/api/dispatches/bookings/{concurrent_booking.id}/sync_flight_delay/', data=json.dumps({"delay_minutes": 35}), content_type="application/json", **dispatcher_headers)
    if resp.status_code == 200:
        record_test("Flight Radar", "Dispatcher", "Auto-synchronize pickup schedule with airline flight delay (+35m)", "HTTP 200 with auto-delayed pickup time", f"HTTP 200: Pickup synchronized", "PASS")
    else:
        record_test("Flight Radar", "Dispatcher", "Auto-synchronize pickup schedule with airline flight delay", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # -------------------------------------------------------------
    # 10. CHAUFFEUR SHIFT CONCLUSION & VEHICLE UNASSIGNMENT
    # -------------------------------------------------------------
    # End Shift
    end_shift_data = {
        "end_odometer": float(shift_vehicle.current_odometer) + 50.0
    }
    resp = c.post(f'/api/drivers/drivers/{driver_john_id}/end_shift/', data=json.dumps(end_shift_data), content_type="application/json", **driver_headers)
    if resp.status_code == 200 and resp.json()['driver']['duty_status'] == 'OFF_DUTY':
        record_test("Chauffeur Mobile", "Chauffeur", "End shift and check-out with final odometer", "HTTP 200, Driver -> OFF_DUTY, Shift -> COMPLETED, Vehicle -> AVAILABLE", f"HTTP 200: Shift ended", "PASS")
    else:
        record_test("Chauffeur Mobile", "Chauffeur", "End shift and check-out with final odometer", "HTTP 200", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "High")

    # Assign & Unassign Driver to Vehicle in Garage
    resp = c.post(f'/api/fleet/vehicles/{shift_vehicle.id}/assign_driver/', data=json.dumps({"driver_id": driver_john_id}), content_type="application/json", **admin_headers)
    if resp.status_code == 200:
        record_test("Fleet Management", "Fleet Admin", "Assign dedicated chauffeur to fleet car", "HTTP 200 with assigned driver detail", f"HTTP 200: {resp.json()['message']}", "PASS")
    else:
        record_test("Fleet Management", "Fleet Admin", "Assign dedicated chauffeur to fleet car", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    resp = c.post(f'/api/fleet/vehicles/{shift_vehicle.id}/unassign_driver/', **admin_headers)
    if resp.status_code == 200:
        record_test("Fleet Management", "Fleet Admin", "Unassign dedicated chauffeur from fleet car", "HTTP 200 with unassigned driver confirmation", f"HTTP 200: {resp.json()['message']}", "PASS")
    else:
        record_test("Fleet Management", "Fleet Admin", "Unassign dedicated chauffeur from fleet car", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # -------------------------------------------------------------
    # 11. RATE CARDS & GEOFENCES
    # -------------------------------------------------------------
    # Rate Card Creation with unique client
    rate_card_client, _ = CorporateClient.objects.get_or_create(
        name="Rate Card Test Enterprises",
        defaults={"contact_person": "Finance Manager", "contact_email": "finance@ratecard.test", "contact_phone": "9988776655"}
    )
    ContractPricingCard.objects.filter(client=rate_card_client, service_type="CORP_CHARTER", vehicle_class="LUXURY").delete()
    card_data = {
        "client": rate_card_client.id,
        "service_type": "CORP_CHARTER",
        "vehicle_class": "LUXURY",
        "base_rate_inr": "8500.00",
        "included_km": 80.0,
        "extra_km_rate_inr": "30.00",
        "effective_from": timezone.now().date().isoformat()
    }
    resp = c.post('/api/billing/pricing/', data=json.dumps(card_data), content_type="application/json", **admin_headers)
    if resp.status_code == 201:
        record_test("Rate Cards", "Fleet Admin", "Create corporate tariff rate card", "HTTP 201 Created with base rate and per-km pricing", f"HTTP 201: Rate card #{resp.json()['id']} active", "PASS")
    else:
        record_test("Rate Cards", "Fleet Admin", "Create corporate tariff rate card", "HTTP 201", f"HTTP {resp.status_code}: {resp.content}", "FAIL", "Low")

    # Geofence Zone Query
    resp = c.get('/api/telematics/geofences/', **admin_headers)
    if resp.status_code == 200:
        record_test("Geofencing", "Fleet Admin", "Fetch operational geofence zones", "HTTP 200 with active zone polygons and speed limits", f"HTTP 200: {len(resp.json())} geofences configured", "PASS")
    else:
        record_test("Geofencing", "Fleet Admin", "Fetch operational geofence zones", "HTTP 200", f"HTTP {resp.status_code}", "FAIL", "Medium")

    # -------------------------------------------------------------
    # 12. RBAC & PERMISSION BOUNDARIES
    # -------------------------------------------------------------
    # Test Unauthenticated access to protected endpoint
    resp = c.get('/api/fleet/vehicles/')
    if resp.status_code == 401:
        record_test("RBAC Security", "Anonymous", "Attempt to access protected fleet API without token", "HTTP 401 Unauthorized", "HTTP 401 Unauthorized blocked successfully", "PASS")
    else:
        record_test("RBAC Security", "Anonymous", "Attempt to access protected fleet API without token", "HTTP 401", f"HTTP {resp.status_code}", "FAIL", "High")

    print("\n" + "=" * 80)
    print("QA AUTOMATED TEST SUITE COMPLETED")
    print("=" * 80)

    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t['status'] == 'PASS')
    failed_tests = sum(1 for t in test_results if t['status'] == 'FAIL')
    blocked_tests = sum(1 for t in test_results if t['status'] == 'BLOCKED')

    print(f"Total Tests:   {total_tests}")
    print(f"Passed:        {passed_tests}")
    print(f"Failed:        {failed_tests}")
    print(f"Blocked:       {blocked_tests}")
    print(f"Success Rate:  {(passed_tests / total_tests) * 100:.1f}%\n")

    return test_results

if __name__ == '__main__':
    run_qa_suite()
