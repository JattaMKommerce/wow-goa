<?php
// backend/test_taxi_dispatch_e2e.php
// End-to-end automated test verifying Customer Cab Booking,
// Vendor Dispatch Desk allocation, Chauffeur Companion lifecycle,
// and Live GPS Telematics synchronization.

require_once __DIR__ . '/config.php';

echo "=== STARTING E2E TAXI DISPATCH & TELEMATICS BACKEND TEST ===\n\n";

$dbFile = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Helper for HTTP simulation against live PHP server on port 8000
function testPost($action, $data) {
    $url = "http://127.0.0.1:8000/api.php?action=" . urlencode($action);
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($data),
            'timeout' => 5,
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    return json_decode($res, true) ?: $res;
}

function testGet($action, $params = []) {
    $qs = http_build_query(array_merge(['resource' => $action], $params));
    $url = "http://127.0.0.1:8000/api.php?" . $qs;
    $opts = [
        'http' => [
            'method' => 'GET',
            'timeout' => 5,
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    return json_decode($res, true) ?: $res;
}

// -----------------------------------------------------------------------------
// STEP 1: Tourist Books Cab
// -----------------------------------------------------------------------------
echo "[STEP 1] Customer books a cab (Mopa Airport -> Candolim Beach)...\n";
$bookRes = testPost('cab_create_booking', [
    'customer_name' => 'Rahul Sharma',
    'customer_phone' => '+91 98111 22334',
    'pickup_location' => 'Manohar Intl Airport, Mopa (GOX)',
    'dropoff_location' => 'Candolim Beach Resort',
    'pickup_time' => 'Immediate',
    'vehicle_tier' => 'Innova Crysta',
    'fare_amount' => 2450.00
]);

if (empty($bookRes['success']) || empty($bookRes['dispatch_id'])) {
    echo "FAILED Step 1: " . json_encode($bookRes) . "\n";
    exit(1);
}
$dispId = $bookRes['dispatch_id'];
$otp = $bookRes['otp'];
echo "   PASS: Created Dispatch ID: $dispId with Ride OTP: $otp\n\n";

// -----------------------------------------------------------------------------
// STEP 2: Vendor Fetches Live Feed & Sees Booking
// -----------------------------------------------------------------------------
echo "[STEP 2] Vendor checks Dispatch Kanban feed...\n";
$vendorFeed = testGet('vendor_dispatches', ['vendor_id' => 'taxi_vendor_goa']);
if (empty($vendorFeed['success']) || !is_array($vendorFeed['dispatches'])) {
    echo "FAILED Step 2: " . json_encode($vendorFeed) . "\n";
    exit(1);
}

$foundBooking = false;
foreach ($vendorFeed['dispatches'] as $d) {
    if ($d['id'] === $dispId) {
        $foundBooking = true;
        break;
    }
}
if (!$foundBooking) {
    echo "FAILED Step 2: Booking $dispId not found in vendor dispatches feed!\n";
    exit(1);
}
echo "   PASS: Booking $dispId appeared in Vendor Dispatch Desk feed.\n";
echo "   Available fleet units: " . count($vendorFeed['available_vehicles']) . "\n";
echo "   Available on-duty drivers: " . count($vendorFeed['available_drivers']) . "\n\n";

// -----------------------------------------------------------------------------
// STEP 3: Vendor Allocates Specific Vehicle & Chauffeur
// -----------------------------------------------------------------------------
echo "[STEP 3] Vendor allocates Toyota Innova (GA-03-Z-8899) and Chauffeur Suresh Naik...\n";
$assignRes = testPost('vendor_assign_dispatch', [
    'dispatch_id' => $dispId,
    'vehicle_id' => 'VEH-INNOVA-8899',
    'vehicle_plate' => 'GA-03-Z-8899',
    'vehicle_model' => 'Toyota Innova Crysta',
    'driver_id' => 'drv-suresh',
    'driver_name' => 'Suresh Naik',
    'driver_phone' => '+91 98221 44510'
]);

if (empty($assignRes['success']) || $assignRes['status'] !== 'ALLOCATED') {
    echo "FAILED Step 3: " . json_encode($assignRes) . "\n";
    exit(1);
}
echo "   PASS: Duty allocated to driver Suresh Naik.\n\n";

// -----------------------------------------------------------------------------
// STEP 4: Chauffeur Companion Receives Duty
// -----------------------------------------------------------------------------
echo "[STEP 4] Chauffeur Companion app polls for active duties...\n";
$driverDuty = testGet('driver_active_duty', ['driver_id' => 'drv-suresh']);
if (empty($driverDuty['success']) || empty($driverDuty['active_booking'])) {
    echo "FAILED Step 4: " . json_encode($driverDuty) . "\n";
    exit(1);
}
$activeDuty = $driverDuty['active_booking'];
echo "   PASS: Chauffeur app retrieved duty {$activeDuty['id']} (Status: {$activeDuty['status']})\n\n";

// -----------------------------------------------------------------------------
// STEP 5: Chauffeur Accepts Duty & Marks Arrived
// -----------------------------------------------------------------------------
echo "[STEP 5] Chauffeur accepts duty and marks 'En Route'...\n";
$acceptRes = testPost('driver_update_status', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'status' => 'DISPATCHED'
]);
if (empty($acceptRes['success']) || $acceptRes['status'] !== 'DISPATCHED') {
    echo "FAILED Step 5 (Accept): " . json_encode($acceptRes) . "\n";
    exit(1);
}
echo "   PASS: Status updated to DISPATCHED.\n";

echo "   Chauffeur reaches pickup spot and marks 'ARRIVED'...\n";
$arrivedRes = testPost('driver_update_status', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'status' => 'ARRIVED'
]);
if (empty($arrivedRes['success']) || $arrivedRes['status'] !== 'ARRIVED') {
    echo "FAILED Step 5 (Arrived): " . json_encode($arrivedRes) . "\n";
    exit(1);
}
echo "   PASS: Status updated to ARRIVED.\n\n";

// -----------------------------------------------------------------------------
// STEP 6: Chauffeur Verifies Ride OTP & Starts Trip
// -----------------------------------------------------------------------------
echo "[STEP 6] Testing OTP Verification security...\n";
// Attempt wrong OTP -> MUST fail
$wrongOtpRes = testPost('driver_update_status', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'status' => 'ON_TRIP',
    'otp' => '9999' // wrong
]);
if (!empty($wrongOtpRes['success'])) {
    echo "FAILED: Trip started with invalid OTP!\n";
    exit(1);
}
echo "   PASS: Invalid OTP was correctly rejected with error: '{$wrongOtpRes['error']}'\n";

// Attempt correct OTP -> MUST succeed
$correctOtpRes = testPost('driver_update_status', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'status' => 'ON_TRIP',
    'otp' => $otp,
    'start_odometer' => 14200
]);
if (empty($correctOtpRes['success']) || $correctOtpRes['status'] !== 'ON_TRIP') {
    echo "FAILED: Valid OTP start failed: " . json_encode($correctOtpRes) . "\n";
    exit(1);
}
echo "   PASS: Trip successfully started with Ride OTP $otp! Live meter is active.\n\n";

// -----------------------------------------------------------------------------
// STEP 7: Live GPS Telematics Stream
// -----------------------------------------------------------------------------
echo "[STEP 7] Chauffeur phone sends GPS coordinates (Heading towards Candolim)...\n";
$gpsRes = testPost('driver_ping_gps', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'lat' => 15.5204,
    'lng' => 73.7650,
    'heading' => 210.5,
    'speed_kmh' => 52.0
]);
if (empty($gpsRes['success'])) {
    echo "FAILED Step 7: " . json_encode($gpsRes) . "\n";
    exit(1);
}
echo "   PASS: GPS ping recorded (Lat: {$gpsRes['lat']}, Lng: {$gpsRes['lng']})\n\n";

// -----------------------------------------------------------------------------
// STEP 8: Customer Live Ride Tracker Fetches Moving Vehicle
// -----------------------------------------------------------------------------
echo "[STEP 8] Customer app fetches live tracking and moving car coordinates...\n";
$custTrack = testGet('ride_live_track', ['id' => $dispId]);
if (empty($custTrack['success'])) {
    echo "FAILED Step 8: " . json_encode($custTrack) . "\n";
    exit(1);
}
echo "   PASS: Customer sees:\n";
echo "         Driver: {$custTrack['driver']['name']} ({$custTrack['driver']['phone']})\n";
echo "         Vehicle: {$custTrack['vehicle']['model']} - Plate: {$custTrack['vehicle']['plate']}\n";
echo "         Live GPS Position: Lat {$custTrack['telematics']['lat']}, Lng {$custTrack['telematics']['lng']}\n";
echo "         Speed: {$custTrack['telematics']['speed_kmh']} km/h\n";
echo "         Trip Status: {$custTrack['status']}\n\n";

// -----------------------------------------------------------------------------
// STEP 9: Trip Conclusion, Fare Collection & Customer 5★ Rating
// -----------------------------------------------------------------------------
echo "[STEP 9] Trip reached destination. Chauffeur concludes trip and collects UPI fare...\n";
$completeRes = testPost('driver_update_status', [
    'dispatch_id' => $dispId,
    'driver_id' => 'drv-suresh',
    'status' => 'COMPLETED',
    'end_odometer' => 14245,
    'toll_parking_inr' => 150,
    'payment_method' => 'UPI',
    'payment_status' => 'PAID'
]);
if (empty($completeRes['success']) || $completeRes['status'] !== 'COMPLETED') {
    echo "FAILED Step 9: " . json_encode($completeRes) . "\n";
    exit(1);
}
echo "   PASS: Trip completed & payment settled via UPI.\n";

echo "   Customer submits 5★ rating...\n";
$rateRes = testPost('customer_rate_trip', [
    'dispatch_id' => $dispId,
    'rating' => 5,
    'feedback' => 'Suresh was exceptionally polite, clean car, smooth driving!'
]);
if (empty($rateRes['success'])) {
    echo "FAILED Step 9 (Rating): " . json_encode($rateRes) . "\n";
    exit(1);
}
echo "   PASS: Customer rating saved.\n\n";

echo "=== ALL E2E TAXI DISPATCH, ALLOCATION & TELEMATICS TESTS PASSED 100%! ===\n";
