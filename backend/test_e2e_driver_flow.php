<?php
// backend/test_e2e_driver_flow.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/BookingService.php';

echo "=== STARTING E2E DRIVER FLOW VERIFICATION ===\n\n";

$sqlitePath = __DIR__ . '/database.sqlite';
$db = new PDO("sqlite:$sqlitePath");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 10000;");

// 1. Verify UNIQUE index exists on driver_assignments(booking_id)
echo "[CHECK 1] Verifying UNIQUE index on driver_assignments(booking_id)...\n";
$indexes = $db->query("PRAGMA index_list(driver_assignments)")->fetchAll(PDO::FETCH_ASSOC);
$hasUnique = false;
foreach ($indexes as $idx) {
    if ($idx['name'] === 'idx_driver_assignments_booking_id' && $idx['unique'] == 1) {
        $hasUnique = true;
        break;
    }
}
if (!$hasUnique) {
    echo "FAILED: Unique index idx_driver_assignments_booking_id missing or not unique!\n";
    exit(1);
}
echo "PASS: Unique index idx_driver_assignments_booking_id is active.\n\n";

// 2. Setup verified drivers for tests
$stmt = $db->query("SELECT * FROM drivers WHERE status = 'active' OR status = 'approved' LIMIT 1");
$driver = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$driver) {
    $driverId = 'DRV_TEST_' . time();
    $db->prepare("INSERT INTO drivers (id, name, phone, email, status, vehicle_details) VALUES (?, ?, ?, ?, 'active', 'Sedan (GA-01-AA-1111)')")
       ->execute([$driverId, 'Ramesh Naik', '9876543210', 'ramesh@driver.com']);
    $stmt = $db->query("SELECT * FROM drivers WHERE id = '$driverId'");
    $driver = $stmt->fetch(PDO::FETCH_ASSOC);
}
echo "PASS: Test driver 1 identified: ID={$driver['id']}, Name={$driver['name']}, Phone={$driver['phone']}\n";

$stmt2 = $db->query("SELECT * FROM drivers WHERE id != '{$driver['id']}' AND (status = 'active' OR status = 'approved') LIMIT 1");
$driver2 = $stmt2->fetch(PDO::FETCH_ASSOC);
if (!$driver2) {
    $driverId2 = 'DRV_TEST_2_' . time();
    $db->prepare("INSERT INTO drivers (id, name, phone, email, status, vehicle_details) VALUES (?, ?, ?, ?, 'active', 'Ertiga (GA-02-BB-2222)')")
       ->execute([$driverId2, 'Sunil Gaonkar', '9822001122', 'sunil@driver.com']);
    $stmt2 = $db->query("SELECT * FROM drivers WHERE id = '$driverId2'");
    $driver2 = $stmt2->fetch(PDO::FETCH_ASSOC);
}
echo "PASS: Test driver 2 identified: ID={$driver2['id']}, Name={$driver2['name']}, Phone={$driver2['phone']}\n\n";

// 3. Test Customer Booking with PICKUP, DROP, FULL, and NONE
$bookingTypes = ['PICKUP', 'DROP', 'FULL', ''];
$createdBookings = [];

foreach ($bookingTypes as $st) {
    echo "[TEST 3] Creating Customer Booking with driver_service_type='{$st}'...\n";
    $testPhone = '9988776655';
    $testEmail = 'customer_test@example.com';
    
    $payload = [
        'type' => 'vehicle',
        'item_id' => 'car_thar_01',
        'item_name' => 'Mahindra Thar 4x4',
        'start_date' => date('Y-m-d', strtotime('+1 day')),
        'end_date' => date('Y-m-d', strtotime('+3 days')),
        'booking_days' => 2,
        'total_amount' => 6000,
        'dob' => '1995-05-15',
        'driving_license' => 'DL1420110012345',
        'driver_service_type' => $st,
        'customer' => [
            'name' => 'Sanjay Verma',
            'phone' => $testPhone,
            'email' => $testEmail,
            'city' => 'Mumbai',
            'dob' => '1995-05-15',
            'driving_license' => 'DL1420110012345'
        ],
        'payment' => [
            'method' => 'card',
            'status' => 'paid',
            'paid_amount' => 6000
        ]
    ];
    
    $res = BookingService::createBooking($db, $payload, null, 'D2C');
    if (empty($res['success'])) {
        echo "FAILED to create booking: " . json_encode($res) . "\n";
        exit(1);
    }
    
    $bookingId = $res['booking_id'];
    // Verify booking in DB
    $bStmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
    $bStmt->execute([$bookingId]);
    $bRecord = $bStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "  Created Booking ID: {$bookingId}\n";
    echo "  DB driver_service_type: '{$bRecord['driver_service_type']}'\n";
    echo "  DB driver_required: {$bRecord['driver_required']}\n";
    echo "  DB driver_charge: ₹{$bRecord['driver_charge']}\n";
    
    if ($st !== '') {
        if ($bRecord['driver_service_type'] !== $st) {
            echo "FAILED: driver_service_type mismatch: expected {$st}, got {$bRecord['driver_service_type']}\n";
            exit(1);
        }
        if ($bRecord['driver_required'] != 1) {
            echo "FAILED: driver_required should be 1 for {$st}\n";
            exit(1);
        }
        $expectedCharge = ($st === 'FULL') ? (800 * 2) : 400; // 2 days * 800 or flat 400
        if ($bRecord['driver_charge'] != $expectedCharge) {
            echo "FAILED: driver_charge expected {$expectedCharge}, got {$bRecord['driver_charge']}\n";
            exit(1);
        }
    } else {
        if (!empty($bRecord['driver_service_type'])) {
            echo "FAILED: driver_service_type should be empty\n";
            exit(1);
        }
        if ($bRecord['driver_required'] != 0) {
            echo "FAILED: driver_required should be 0 when no driver requested\n";
            exit(1);
        }
    }
    $createdBookings[$st] = $bookingId;
    echo "  PASS: Customer booking for '{$st}' validated.\n\n";
}

// 4. Verify Customer Identity Linking for B2B Bookings
echo "[TEST 4] Testing B2B Booking and Customer User Identity Linking...\n";
$b2bPartnerId = 'B2B_PARTNER_GOA_01';
$chkPartner = $db->prepare("SELECT * FROM users WHERE id = ?");
$chkPartner->execute([$b2bPartnerId]);
if (!$chkPartner->fetch()) {
    $db->prepare("INSERT INTO users (id, username, name, email, phone, role, status) VALUES (?, 'b2b_partner_goa', 'Goa Travels B2B', 'b2b@goatest.com', '9811002233', 'b2b', 'active')")
       ->execute([$b2bPartnerId]);
}

// Ensure a known customer exists in users
$custPhone = '9822114477';
$custEmail = 'existing_b2b_client@test.com';
$cStmt = $db->prepare("SELECT * FROM users WHERE phone = ? OR email = ?");
$cStmt->execute([$custPhone, $custEmail]);
$existingUser = $cStmt->fetch(PDO::FETCH_ASSOC);

if (!$existingUser) {
    $cUserId = 'c_' . substr(preg_replace('/[^0-9]/', '', $custPhone), -10);
    $db->prepare("INSERT INTO users (id, username, name, phone, email, role, status, date_of_birth) VALUES (?, ?, 'Existing Client', ?, ?, 'customer', 'active', '1990-05-15')")
       ->execute([$cUserId, $custPhone, $custPhone, $custEmail]);
    $existingUserId = $cUserId;
} else {
    $existingUserId = $existingUser['id'];
}
echo "  Known Customer User ID in DB: {$existingUserId}\n";

$usersCountBefore = (int)$db->query("SELECT COUNT(*) FROM users WHERE phone = '$custPhone' OR email = '$custEmail'")->fetchColumn();

// Create B2B booking for this customer with FULL driver
$b2bPayload = [
    'type' => 'vehicle',
    'b2b_partner_id' => $b2bPartnerId,
    'item_id' => 'car_innova_crysta',
    'item_name' => 'Toyota Innova Crysta',
    'start_date' => date('Y-m-d', strtotime('+2 days')),
    'end_date' => date('Y-m-d', strtotime('+4 days')),
    'booking_days' => 2,
    'total_amount' => 9600,
    'driver_service_type' => 'FULL',
    'customer' => [
        'name' => 'Existing Client',
        'phone' => $custPhone,
        'email' => $custEmail,
        'city' => 'Delhi'
    ],
    'payment' => [
        'method' => 'wallet',
        'status' => 'paid',
        'paid_amount' => 9600
    ]
];

$b2bRes = BookingService::createBooking($db, $b2bPayload, ['id' => $b2bPartnerId, 'name' => 'Goa Travels B2B', 'role' => 'b2b', 'tenant_id' => 'admin'], 'B2B');
if (empty($b2bRes['success'])) {
    echo "FAILED to create B2B booking: " . json_encode($b2bRes) . "\n";
    exit(1);
}
$b2bBookingId = $b2bRes['booking_id'];
$b2bStmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
$b2bStmt->execute([$b2bBookingId]);
$b2bRow = $b2bStmt->fetch(PDO::FETCH_ASSOC);

echo "  Created B2B Booking ID: {$b2bBookingId}\n";
echo "  Booking phone: {$b2bRow['phone']}\n";
echo "  Booking email: {$b2bRow['email']}\n";
echo "  Booking b2b_partner_id: {$b2bRow['b2b_partner_id']}\n";

$usersCountAfter = (int)$db->query("SELECT COUNT(*) FROM users WHERE phone = '$custPhone' OR email = '$custEmail'")->fetchColumn();
if ($usersCountAfter > $usersCountBefore) {
    echo "FAILED: Duplicate customer user account was created in users table! Before: $usersCountBefore, After: $usersCountAfter\n";
    exit(1);
}
echo "  PASS: User count verified ({$usersCountAfter}). No unnecessary duplicate customer accounts created.\n\n";

// 5. Test Available Driver Jobs API
echo "[TEST 5] Testing available_driver_jobs API...\n";
$availUrl = 'http://localhost:8000/api.php?resource=available_driver_jobs';
$availJson = file_get_contents($availUrl);
$availData = json_decode($availJson, true);

if (!is_array($availData)) {
    echo "FAILED to retrieve available driver jobs: {$availJson}\n";
    exit(1);
}

$foundPickup = false;
$foundDrop = false;
$foundFull = false;
$foundNone = false;

foreach ($availData as $job) {
    if ($job['id'] == $createdBookings['PICKUP']) $foundPickup = true;
    if ($job['id'] == $createdBookings['DROP']) $foundDrop = true;
    if ($job['id'] == $createdBookings['FULL']) $foundFull = true;
    if (!empty($createdBookings['']) && $job['id'] == $createdBookings['']) $foundNone = true;
}

if (!$foundPickup || !$foundDrop || !$foundFull) {
    echo "FAILED: Not all driver jobs appeared in available_driver_jobs (Pickup:$foundPickup, Drop:$foundDrop, Full:$foundFull)\n";
    exit(1);
}
if ($foundNone) {
    echo "FAILED: Booking with empty driver_service_type appeared in available driver jobs!\n";
    exit(1);
}
echo "  PASS: Authoritative source verified! PICKUP, DROP, and FULL appeared; empty service type excluded.\n\n";

function httpPostJson($url, $data, $headers = []) {
    $headerLines = array_merge(['Content-Type: application/json'], $headers);
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headerLines) . "\r\n",
            'content' => is_string($data) ? $data : json_encode($data),
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    
    $statusLine = $http_response_header[0] ?? '';
    preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m);
    $code = isset($m[1]) ? intval($m[1]) : 200;
    
    return ['code' => $code, 'body' => $res];
}

function httpGetJson($url, $headers = []) {
    $headerLines = array_merge(['Content-Type: application/json'], $headers);
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headerLines) . "\r\n",
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    
    $statusLine = $http_response_header[0] ?? '';
    preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m);
    $code = isset($m[1]) ? intval($m[1]) : 200;
    
    return ['code' => $code, 'body' => $res];
}

// 6. Test Driver Job Acceptance & Concurrency / Conflict handling
echo "[TEST 6] Testing Driver Job Acceptance & Concurrency 409 Conflict...\n";
$testBookingId = $createdBookings['PICKUP'];

// First acceptance: Driver Ramesh Naik accepts job
$postData = [
    'booking_id' => $testBookingId,
    'driver_id' => $driver['id'],
    'driver_name' => $driver['name'],
    'driver_phone' => $driver['phone']
];

$r1 = httpPostJson('http://localhost:8000/api.php?action=driver_accept_job', $postData);
echo "  Accept attempt 1 Response (HTTP {$r1['code']}): {$r1['body']}\n";
$resp1Arr = json_decode($r1['body'], true);
if ($r1['code'] !== 200 || empty($resp1Arr['success'])) {
    echo "FAILED: Driver 1 accept failed\n";
    exit(1);
}
echo "  PASS: Driver 1 accepted job successfully.\n";

// Second acceptance attempt by another valid driver on the same booking -> MUST return 409 Conflict

$postData2 = [
    'booking_id' => $testBookingId,
    'driver_id' => $driver2['id'],
    'driver_name' => $driver2['name'],
    'driver_phone' => $driver2['phone']
];

$r2 = httpPostJson('http://localhost:8000/api.php?action=driver_accept_job', $postData2);
echo "  Accept attempt 2 (Conflict) Response (HTTP {$r2['code']}): {$r2['body']}\n";
if ($r2['code'] !== 409) {
    echo "FAILED: Expected HTTP 409 Conflict, got {$r2['code']}\n";
    exit(1);
}
echo "  PASS: Double acceptance was correctly blocked with HTTP 409 Conflict!\n\n";

// 7. Verify exactly ONE assignment in driver_assignments for this booking
echo "[TEST 7] Verifying exactly ONE assignment record exists...\n";
$freshDb = new PDO("sqlite:$sqlitePath");
$chkAssign = $freshDb->prepare("SELECT * FROM driver_assignments WHERE booking_id = ?");
$chkAssign->execute([$testBookingId]);
$assignRows = $chkAssign->fetchAll(PDO::FETCH_ASSOC);
if (count($assignRows) !== 1) {
    echo "FAILED: Expected 1 assignment row, got " . count($assignRows) . "\n";
    exit(1);
}
echo "  PASS: Exactly 1 driver assignment record exists for booking {$testBookingId}.\n";
echo "  driver_service_type in assignment: {$assignRows[0]['driver_service_type']}\n\n";

// 8. Accept B2B Booking as well to test B2B portal driver details
echo "[TEST 8] Driver accepts B2B Booking ({$b2bBookingId})...\n";
$b2bPost = [
    'booking_id' => $b2bBookingId,
    'driver_id' => $driver['id'],
    'driver_name' => $driver['name'],
    'driver_phone' => $driver['phone']
];
$rB2B = httpPostJson('http://localhost:8000/api.php?action=driver_accept_job', $b2bPost);
echo "  B2B Accept Response (HTTP {$rB2B['code']}): {$rB2B['body']}\n";
if ($rB2B['code'] !== 200) {
    echo "FAILED to accept B2B job\n";
    exit(1);
}
echo "  PASS: Driver accepted B2B job.\n\n";

// 9. Verify Driver Name and Mobile Number in All Portals
echo "[TEST 9] Verifying Driver Name and Phone in APIs for all Portals...\n";

// A. Customer Portal / Customer Driver Trips (resource=bookings&mobile=...)
$cleanCustPhone = preg_replace('/\D/', '', $custPhone);
$custRes = httpGetJson('http://localhost:8000/api.php?resource=bookings&mobile=' . urlencode($cleanCustPhone));
$custBookings = json_decode($custRes['body'], true);
$foundInCust = false;
foreach ($custBookings as $b) {
    if ($b['id'] == $b2bBookingId) {
        $foundInCust = true;
        echo "  [Customer Portal] Found Booking #{$b['id']}:\n";
        echo "    Driver Name: '{$b['assigned_driver_name']}'\n";
        echo "    Driver Phone: '{$b['assigned_driver_phone']}'\n";
        echo "    Driver Service: '{$b['driver_service_type']}'\n";
        if (empty($b['assigned_driver_name']) || empty($b['assigned_driver_phone'])) {
            echo "FAILED: Missing driver contact details in Customer Portal response!\n";
            exit(1);
        }
        break;
    }
}
if (!$foundInCust) {
    echo "FAILED: B2B Booking #{$b2bBookingId} not found under customer phone {$cleanCustPhone} in Customer Portal query!\n";
    exit(1);
}
echo "  PASS: Driver Name and Mobile verified in Customer Portal API.\n\n";

function makeFlowToken($id, $role) {
    $secret = (defined('AUTH_SECRET') && is_string(AUTH_SECRET) && strlen(AUTH_SECRET) >= 32) ? AUTH_SECRET : 'wowgoa_production_super_secret_jwt_key_2026_antigravity';
    $payload = [
        'id' => $id,
        'username' => $id,
        'role' => $role,
        'phone' => '',
        'tenant_id' => 'admin',
        'time' => time(),
        'exp' => time() + 86400
    ];
    $json = json_encode($payload);
    $b64 = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $b64, $secret);
    return $b64 . '.' . $sig;
}

// B. B2B Portal (resource=b2b_bookings with authenticated Bearer token)
$b2bToken = makeFlowToken($b2bPartnerId, 'b2b');
$b2bRes = httpGetJson('http://localhost:8000/api.php?resource=b2b_bookings', ["Authorization: Bearer {$b2bToken}"]);
$b2bRaw = json_decode($b2bRes['body'], true);
$b2bList = isset($b2bRaw['bookings']) ? $b2bRaw['bookings'] : (is_array($b2bRaw) ? $b2bRaw : []);
$foundInB2B = false;
foreach ($b2bList as $b) {
    if ($b['id'] == $b2bBookingId) {
        $foundInB2B = true;
        echo "  [B2B Portal] Found Booking #{$b['id']}:\n";
        echo "    Driver Name: '{$b['assigned_driver_name']}'\n";
        echo "    Driver Phone: '{$b['assigned_driver_phone']}'\n";
        echo "    Driver Service: '{$b['driver_service_type']}'\n";
        if (empty($b['assigned_driver_name']) || empty($b['assigned_driver_phone'])) {
            echo "FAILED: Missing driver contact details in B2B Portal response!\n";
            exit(1);
        }
        break;
    }
}
if (!$foundInB2B) {
    echo "FAILED: Booking #{$b2bBookingId} not found in B2B Portal bookings list!\n";
    exit(1);
}
echo "  PASS: Driver Name and Mobile verified in B2B Portal API.\n\n";

// C. Admin Portal (resource=bookings with admin auth)
$chkAdmin = $db->query("SELECT * FROM users WHERE role IN ('admin', 'superadmin') AND status = 'active' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$adminId = $chkAdmin ? $chkAdmin['id'] : 'u-2';
$adminRole = $chkAdmin ? $chkAdmin['role'] : 'admin';
$adminToken = makeFlowToken($adminId, $adminRole);
$adminRes = httpGetJson('http://localhost:8000/api.php?resource=bookings', ["Authorization: Bearer {$adminToken}"]);
$adminRaw = json_decode($adminRes['body'], true);
$adminList = isset($adminRaw['bookings']) ? $adminRaw['bookings'] : (is_array($adminRaw) ? $adminRaw : []);
$foundInAdmin = false;
foreach ($adminList as $b) {
    if ($b['id'] == $testBookingId) {
        $foundInAdmin = true;
        echo "  [Admin Portal] Found Booking #{$b['id']}:\n";
        echo "    Driver Name: '{$b['assigned_driver_name']}'\n";
        echo "    Driver Phone: '{$b['assigned_driver_phone']}'\n";
        echo "    Driver Service: '{$b['driver_service_type']}'\n";
        if (empty($b['assigned_driver_name']) || empty($b['assigned_driver_phone'])) {
            echo "FAILED: Missing driver contact details in Admin Portal response!\n";
            exit(1);
        }
        break;
    }
}
if (!$foundInAdmin) {
    echo "FAILED: Booking #{$testBookingId} not found in Admin Portal bookings list!\n";
    exit(1);
}
echo "  PASS: Driver Name and Mobile verified in Admin Portal API.\n\n";

// D. Driver Portal Accepted Jobs (resource=driver_details)
$drvRes = httpGetJson('http://localhost:8000/api.php?resource=driver_details&driver_id=' . urlencode($driver['id']));
$drvDetails = json_decode($drvRes['body'], true);
$foundInDriver = false;
foreach ($drvDetails['assignments'] as $t) {
    if ($t['id'] == $testBookingId || $t['booking_id'] == $testBookingId) {
        $foundInDriver = true;
        echo "  [Driver Portal] Found Assignment for Booking #{$testBookingId}:\n";
        echo "    Service Type: '{$t['driver_service_type']}'\n";
        echo "    Status: '{$t['driver_job_status']}'\n";
        if (empty($t['driver_service_type'])) {
            echo "FAILED: Missing driver_service_type in driver details assignments!\n";
            exit(1);
        }
        break;
    }
}
if (!$foundInDriver) {
    echo "FAILED: Accepted booking #{$testBookingId} not found in driver assignments!\n";
    exit(1);
}
echo "  PASS: Driver Portal assignments verified.\n\n";

echo "==================================================\n";
echo "ALL E2E SAFETY AND FUNCTIONALITY CHECKS PASSED!\n";
echo "==================================================\n";

