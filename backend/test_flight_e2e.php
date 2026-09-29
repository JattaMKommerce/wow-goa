<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/BookingService.php';

$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "========================================================\n";
echo "   FLIGHT VENDOR END-TO-END QA & VERIFICATION SUITE    \n";
echo "========================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertTest($name, $condition, $details = '') {
    global $passCount, $failCount;
    if ($condition) {
        echo " [PASS] $name\n";
        $passCount++;
    } else {
        echo " [FAIL] $name" . ($details ? " -> $details" : "") . "\n";
        $failCount++;
    }
}

function getDb() {
    $sqlitePath = __DIR__ . '/database.sqlite';
    $pdo = new PDO("sqlite:$sqlitePath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("PRAGMA busy_timeout = 5000;");
    return $pdo;
}

// Helper to make POST request to api.php via file_get_contents
function callApiPost($payload) {
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($payload),
            'ignore_errors' => true,
            'timeout' => 5
        ]
    ];
    $context  = stream_context_create($options);
    $res = @file_get_contents('http://localhost:8000/api.php', false, $context);
    $httpCode = 200;
    $headers = function_exists('http_get_last_response_headers') ? http_get_last_response_headers() : (isset($http_response_header) ? $http_response_header : []);
    if (is_array($headers)) {
        foreach ($headers as $hdr) {
            if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $hdr, $m)) {
                $httpCode = intval($m[1]);
            }
        }
    }
    return ['code' => $httpCode, 'data' => json_decode($res, true), 'raw' => $res];
}

function callApiGet($qs) {
    $options = [
        'http' => [
            'header'  => "Accept: application/json\r\n",
            'method'  => 'GET',
            'ignore_errors' => true,
            'timeout' => 5
        ]
    ];
    $context  = stream_context_create($options);
    $res = @file_get_contents('http://localhost:8000/api.php?' . $qs, false, $context);
    $httpCode = 200;
    $headers = function_exists('http_get_last_response_headers') ? http_get_last_response_headers() : (isset($http_response_header) ? $http_response_header : []);
    if (is_array($headers)) {
        foreach ($headers as $hdr) {
            if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $hdr, $m)) {
                $httpCode = intval($m[1]);
            }
        }
    }
    return ['code' => $httpCode, 'data' => json_decode($res, true), 'raw' => $res];
}

// -------------------------------------------------------------
// 1. DATABASE SCHEMA & AUTHORITATIVE DB VERIFICATION
// -------------------------------------------------------------
echo "\n--- 1. DATABASE INTEGRITY ---\n";
$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='flights'");
assertTest("Flights table exists in database.sqlite", !empty($stmt->fetch()));

$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='flight_bookings'");
assertTest("Flight_bookings table exists in database.sqlite", !empty($stmt->fetch()));

$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='vendor_wallets'");
assertTest("Vendor_wallets table exists in database.sqlite", !empty($stmt->fetch()));

$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='wallet_transactions'");
assertTest("Wallet_transactions table exists in database.sqlite", !empty($stmt->fetch()));

echo "Wallet Transactions Columns:\n";
$stmtCols = $pdo->query("PRAGMA table_info(wallet_transactions)");
foreach ($stmtCols->fetchAll(PDO::FETCH_ASSOC) as $col) {
    echo "  - {$col['name']} ({$col['type']})\n";
}

// -------------------------------------------------------------
// 2. VENDOR REGISTRATION & APPROVAL
// -------------------------------------------------------------
echo "\n--- 2. VENDOR REGISTRATION & APPROVAL ---\n";
$testVendorUser = 'test_flt_vnd_' . time();
$testVendorEmail = $testVendorUser . '@testflight.com';
$regPayload = [
    'action' => 'vendor_register',
    'vendor_type' => 'flight_vendor',
    'company_name' => 'SkyJet Airways Ltd',
    'contact_name' => 'Captain Vikram',
    'name' => 'Captain Vikram',
    'email' => $testVendorEmail,
    'phone' => '9890' . rand(100000, 999999),
    'operating_hub' => 'GOI',
    'city' => 'Vasco Da Gama',
    'state' => 'Goa',
    'pincode' => '403802',
    'username' => $testVendorUser,
    'password' => 'SkyJet@Pass2026',
    'confirm_password' => 'SkyJet@Pass2026',
    'terms_accepted' => 1
];

$regRes = callApiPost($regPayload);
assertTest("Vendor registration returns HTTP 200 or 201", in_array($regRes['code'], [200, 201]), "Code: " . $regRes['code'] . " Raw: " . $regRes['raw']);

// Check user status in DB
$db = getDb();
$stmtU = $db->prepare("SELECT id, username, role, status FROM users WHERE username = ?");
$stmtU->execute([$testVendorUser]);
$createdUser = $stmtU->fetch(PDO::FETCH_ASSOC);
assertTest("Registered vendor found in users table with role 'flight_vendor'", $createdUser && $createdUser['role'] === 'flight_vendor');
assertTest("Registered vendor initial status is 'pending'", $createdUser && in_array(strtolower($createdUser['status']), ['pending', 'pending_approval']));

$newVendorId = $createdUser ? $createdUser['id'] : null;

// Test Admin Approval
if ($newVendorId) {
    $approvePayload = [
        'action' => 'approve_vendor',
        'vendor_id' => $newVendorId,
        'user_role' => 'superadmin'
    ];
    $appRes = callApiPost($approvePayload);
    
    // Verify status updated to active in DB
    $db = getDb();
    $stmtU = $db->prepare("SELECT id, username, role, status FROM users WHERE username = ?");
    $stmtU->execute([$testVendorUser]);
    $approvedUser = $stmtU->fetch(PDO::FETCH_ASSOC);
    assertTest("Vendor status updated to 'active' after admin approval", $approvedUser && strtolower($approvedUser['status']) === 'active', "Status: " . ($approvedUser['status'] ?? 'null'));
}

// -------------------------------------------------------------
// 3. FLIGHT ROUTE CREATION (VALID & INVALID VALIDATION)
// -------------------------------------------------------------
echo "\n--- 3. FLIGHT ROUTE CREATION VALIDATION ---\n";

// A. Empty airline validation
$res1 = callApiPost(['action' => 'add_flight', 'airline' => '', 'flight_number' => 'SK-101', 'price' => 4500, 'from_loc' => 'GOI', 'to_loc' => 'DEL']);
assertTest("Rejects empty airline name (400)", $res1['code'] === 400);

// B. Empty flight number validation
$res2 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => '', 'price' => 4500, 'from_loc' => 'GOI', 'to_loc' => 'DEL']);
assertTest("Rejects empty flight number (400)", $res2['code'] === 400);

// C. Invalid IATA length
$res3 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => 'SK-101', 'price' => 4500, 'from_loc' => 'GO', 'to_loc' => 'DEL']);
assertTest("Rejects invalid IATA length < 3 (400)", $res3['code'] === 400);

// D. Same origin and destination
$res4 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => 'SK-101', 'price' => 4500, 'from_loc' => 'GOI', 'to_loc' => 'GOI']);
assertTest("Rejects identical origin and destination (400)", $res4['code'] === 400);

// E. Zero or negative fare
$res5 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => 'SK-101', 'price' => 0, 'from_loc' => 'GOI', 'to_loc' => 'DEL']);
assertTest("Rejects zero fare (400)", $res5['code'] === 400);

$res6 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => 'SK-101', 'price' => -100, 'from_loc' => 'GOI', 'to_loc' => 'DEL']);
assertTest("Rejects negative fare (400)", $res6['code'] === 400);

// F. Zero seats
$res7 = callApiPost(['action' => 'add_flight', 'airline' => 'SkyJet', 'flight_number' => 'SK-101', 'price' => 4500, 'seats' => 0, 'from_loc' => 'GOI', 'to_loc' => 'DEL']);
assertTest("Rejects zero seats (400)", $res7['code'] === 400);

// G. VALID FLIGHT CREATION
$validFlightPayload = [
    'action' => 'add_flight',
    'airline' => 'SkyJet Express',
    'flight_number' => 'SJ-' . rand(100, 999),
    'from_loc' => 'GOI',
    'to_loc' => 'DEL',
    'departure_time' => '07:30',
    'arrival_time' => '10:00',
    'price' => 4950,
    'seats' => 180,
    'vendor_id' => $newVendorId ?: 'u-6'
];
$resValid = callApiPost($validFlightPayload);
assertTest("Valid route creation returns success (200)", $resValid['code'] === 200 && !empty($resValid['data']['success']), "Raw: " . $resValid['raw']);

$createdFlightId = $resValid['data']['id'] ?? null;
assertTest("Route ID returned on creation", !empty($createdFlightId));

// Check DB record
if ($createdFlightId) {
    $db = getDb();
    $stmtF = $db->prepare("SELECT * FROM flights WHERE id = ?");
    $stmtF->execute([$createdFlightId]);
    $savedFlight = $stmtF->fetch(PDO::FETCH_ASSOC);
    assertTest("Route persisted in DB with correct airline", $savedFlight && $savedFlight['airline'] === 'SkyJet Express');
    assertTest("Auto-duration calculated correctly (2h 30m)", $savedFlight && $savedFlight['duration'] === '2h 30m', "Duration: " . ($savedFlight['duration'] ?? 'null'));
    assertTest("Route has correct vendor_id", $savedFlight && $savedFlight['vendor_id'] === ($newVendorId ?: 'u-6'));
}

// -------------------------------------------------------------
// 4. FLIGHT ROUTE EDITING & DELETION
// -------------------------------------------------------------
echo "\n--- 4. FLIGHT ROUTE EDITING & DELETION ---\n";
if ($createdFlightId && !empty($savedFlight)) {
    // Edit route
    $editPayload = [
        'action' => 'update_flight',
        'id' => $createdFlightId,
        'airline' => 'SkyJet Express Premium',
        'flight_number' => $savedFlight['flight_number'],
        'from_loc' => 'GOI',
        'to_loc' => 'BOM',
        'departure_time' => '08:00',
        'arrival_time' => '09:15',
        'price' => 3800,
        'duration' => '1h 15m',
        'seats' => 170,
        'vendor_id' => $newVendorId ?: 'u-6'
    ];
    $editRes = callApiPost($editPayload);
    assertTest("Route update returns success (200)", $editRes['code'] === 200 && !empty($editRes['data']['success']));

    // Verify in DB
    $db = getDb();
    $stmtF = $db->prepare("SELECT * FROM flights WHERE id = ?");
    $stmtF->execute([$createdFlightId]);
    $updatedFlight = $stmtF->fetch(PDO::FETCH_ASSOC);
    assertTest("Route updated in DB with new destination BOM", $updatedFlight && $updatedFlight['to_loc'] === 'BOM');
    assertTest("Route updated in DB with new price ₹3800", $updatedFlight && intval($updatedFlight['price']) === 3800);

    // Delete route
    $delPayload = [
        'action' => 'delete_flight',
        'id' => $createdFlightId,
        'vendor_id' => $newVendorId ?: 'u-6'
    ];
    $delRes = callApiPost($delPayload);
    assertTest("Route deletion returns success (200)", $delRes['code'] === 200 && !empty($delRes['data']['success']));

    // Verify removed from DB
    $db = getDb();
    $stmtF = $db->prepare("SELECT * FROM flights WHERE id = ?");
    $stmtF->execute([$createdFlightId]);
    $deletedFlight = $stmtF->fetch(PDO::FETCH_ASSOC);
    assertTest("Route confirmed deleted from DB", empty($deletedFlight));
}

// -------------------------------------------------------------
// 5. CUSTOMER BOOKING FLOW & VENDOR ATTRIBUTION
// -------------------------------------------------------------
echo "\n--- 5. CUSTOMER FLIGHT BOOKING & ATTRIBUTION ---\n";
// Let's create an active flight route specifically for booking test
$activeRoutePayload = [
    'action' => 'add_flight',
    'airline' => 'Akasa Air Direct',
    'flight_number' => 'QP-888',
    'from_loc' => 'GOI',
    'to_loc' => 'DEL',
    'departure_time' => '11:00',
    'arrival_time' => '13:30',
    'price' => 4500,
    'seats' => 180,
    'vendor_id' => 'u-6'
];
$rAct = callApiPost($activeRoutePayload);
$testFlightId = $rAct['data']['id'] ?? null;

// Customer books this flight via BookingService::createBooking
$bookingId = 'BK-FLT-' . time();
$bookingPayload = [
    'id' => $bookingId,
    'name' => 'Rahul Sharma',
    'phone' => '9876543210',
    'email' => 'rahul.sharma@example.com',
    'type' => 'flight',
    'package_type' => 'Flight Booking',
    'item_id' => "flight-$testFlightId",
    'item_name' => 'Akasa Air Direct Flight (GOI → DEL)',
    'flight_number' => 'QP-888',
    'pickup_loc' => 'GOI',
    'drop_loc' => 'DEL',
    'pickup_date' => '2026-10-20',
    'drop_date' => '2026-10-20',
    'total_amount' => 4500,
    'amount_paid' => 4500,
    'booking_days' => 1,
    'status' => 'Pending'
];

$db = getDb();
$createResult = BookingService::createBooking($db, $bookingPayload);
assertTest("BookingService creates flight booking successfully", !empty($createResult['success']));

// Verify booking in DB
$stmtB = $db->prepare("SELECT * FROM bookings WHERE id = ?");
$stmtB->execute([$bookingId]);
$savedBooking = $stmtB->fetch(PDO::FETCH_ASSOC);
assertTest("Flight booking persisted in bookings table", !empty($savedBooking));
assertTest("Flight booking attributed to vendor 'u-6'", $savedBooking && $savedBooking['vendor_id'] === 'u-6', "Actual Vendor: " . ($savedBooking['vendor_id'] ?? 'null'));

// Test Booking Status Transitions: Pending -> Confirmed -> Completed
$updateStatusPayload = [
    'action' => 'update_booking_status',
    'id' => $bookingId,
    'status' => 'Confirmed'
];
$sRes1 = callApiPost($updateStatusPayload);
$stmtB->execute([$bookingId]);
$bConf = $stmtB->fetch(PDO::FETCH_ASSOC);
assertTest("Status updated to 'Confirmed'", $bConf && $bConf['status'] === 'Confirmed');

$updateStatusPayload2 = [
    'action' => 'update_booking_status',
    'id' => $bookingId,
    'status' => 'Completed'
];
$sRes2 = callApiPost($updateStatusPayload2);
$stmtB->execute([$bookingId]);
$bComp = $stmtB->fetch(PDO::FETCH_ASSOC);
assertTest("Status updated to 'Completed'", $bComp && $bComp['status'] === 'Completed');

// -------------------------------------------------------------
// 6. WALLET & RECHARGE / UTR LIFECYCLE
// -------------------------------------------------------------
echo "\n--- 6. WALLET & RECHARGE UTR LIFECYCLE ---\n";
// Test vendor_wallet_info
$wInfo = callApiGet('resource=vendor_wallet_info&vendor_id=u-6');
assertTest("vendor_wallet_info returns HTTP 200", $wInfo['code'] === 200 && isset($wInfo['data']['balance']));
$initialBalance = floatval($wInfo['data']['balance'] ?? 0);

// Test Recharge with UTR
$testUtr = 'UTR' . time() . rand(100, 999);
$rechargePayload = [
    'action' => 'recharge_wallet',
    'vendor_id' => 'u-6',
    'amount' => 5000,
    'reference_id' => $testUtr,
    'description' => 'Working capital topup'
];
$rRes = callApiPost($rechargePayload);
assertTest("Recharge request submitted successfully (200)", $rRes['code'] === 200 && !empty($rRes['data']['success']));

// Test DUPLICATE UTR Prevention
$rResDup = callApiPost($rechargePayload);
assertTest("Duplicate UTR rejected (400)", $rResDup['code'] === 400, "Code: " . $rResDup['code'] . " Res: " . $rResDup['raw']);

// Admin approves recharge
$db = getDb();
$stmtTx = $db->prepare("SELECT id FROM wallet_transactions WHERE vendor_id = 'u-6' AND reference_id = ?");
$stmtTx->execute([$testUtr]);
$txRow = $stmtTx->fetch(PDO::FETCH_ASSOC);
$txId = $txRow ? $txRow['id'] : null;
assertTest("Recharge transaction recorded in wallet_transactions", !empty($txId));

if ($txId) {
    $approveRechargePayload = [
        'action' => 'approve_recharge',
        'transaction_id' => $txId,
        'approved_by' => 'admin'
    ];
    $apprRes = callApiPost($approveRechargePayload);
    assertTest("Admin approve_recharge returns success (200)", $apprRes['code'] === 200 && !empty($apprRes['data']['success']));

    // Check updated balance
    $wInfoAfter = callApiGet('resource=vendor_wallet_info&vendor_id=u-6');
    $newBalance = floatval($wInfoAfter['data']['balance'] ?? 0);
    assertTest("Wallet balance increased by exactly recharge amount (₹5000)", $newBalance === ($initialBalance + 5000), "Initial: $initialBalance, New: $newBalance");
}

// -------------------------------------------------------------
// 7. SUMMARY
// -------------------------------------------------------------
echo "\n========================================================\n";
echo "   TOTAL TESTS: " . ($passCount + $failCount) . " | PASSED: $passCount | FAILED: $failCount\n";
echo "========================================================\n";

if ($failCount === 0) {
    echo "STATUS: ALL BACKEND INTEGRATION TESTS PASSED!\n";
} else {
    echo "STATUS: SOME TESTS FAILED. PLEASE REVIEW LOGS.\n";
}
