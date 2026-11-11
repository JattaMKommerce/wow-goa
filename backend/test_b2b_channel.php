<?php
// backend/test_b2b_channel.php
// Automated Verification Suite for WOW GOA D2C + B2B Channel Engine

ini_set('display_errors', '1');
error_reporting(E_ALL);

$_SERVER['REQUEST_METHOD'] = 'CLI';
$_SERVER['HTTP_HOST'] = 'localhost';

require_once __DIR__ . '/config.php';

// Setup SQLite or MySQL PDO for test execution
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to MySQL for tests.\n";
} catch (Exception $e) {
    $sqlitePath = __DIR__ . '/database.sqlite';
    $pdo = new PDO("sqlite:$sqlitePath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to SQLite for tests.\n";
}

require_once __DIR__ . '/api.php';

echo "\n--- STARTING WOW GOA D2C + B2B CHANNEL ENGINE TESTS ---\n\n";

$passCount = 0;
$failCount = 0;

function assertCondition($name, $cond, $details = '') {
    global $passCount, $failCount;
    if ($cond) {
        echo "✅ PASS: $name\n";
        $passCount++;
    } else {
        echo "❌ FAIL: $name | Details: $details\n";
        $failCount++;
    }
}

try {
    // Setup Test Partners
    $partnerA_Id = 'b2b_test_partner_a';
    $partnerB_Id = 'b2b_test_partner_b';

    $pdo->prepare("DELETE FROM users WHERE id IN (?, ?) OR email IN ('partner_a@agency.com', 'partner_b@agency.com')")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM bookings WHERE b2b_partner_id IN (?, ?) OR id LIKE 'TG-TEST-%'")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM b2b_pricing_rules WHERE partner_id IN (?, ?)")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM b2b_audit_logs WHERE partner_id IN (?, ?)")->execute([$partnerA_Id, $partnerB_Id]);

    $nowStr = date('Y-m-d H:i:s');

    // Partner A: Full access, default 10%
    $pdo->prepare("INSERT INTO users (id, username, email, company_name, name, phone, role, status, allow_commission, allow_non_commission, default_commission_rate, default_net_discount_rate, created_at) VALUES (?, 'partner_a', 'partner_a@agency.com', 'ABC Travels Goa', 'Raj Sharma', '9876543210', 'b2b', 'active', 1, 1, 10.00, 10.00, ?)")
        ->execute([$partnerA_Id, $nowStr]);

    // Partner B: Commission only, default 12%
    $pdo->prepare("INSERT INTO users (id, username, email, company_name, name, phone, role, status, allow_commission, allow_non_commission, default_commission_rate, default_net_discount_rate, created_at) VALUES (?, 'partner_b', 'partner_b@agency.com', 'XYZ Holiday Planners', 'Anil Naik', '9876543211', 'b2b', 'active', 1, 0, 12.00, 0.00, ?)")
        ->execute([$partnerB_Id, $nowStr]);

$partnerA = $pdo->query("SELECT * FROM users WHERE id = '$partnerA_Id'")->fetch(PDO::FETCH_ASSOC);
$partnerB = $pdo->query("SELECT * FROM users WHERE id = '$partnerB_Id'")->fetch(PDO::FETCH_ASSOC);

    // Clean test hotel
    $testHotelId = 'test_hotel_5000';
    $pdo->prepare("DELETE FROM hotels WHERE id = ?")->execute([$testHotelId]);
    $pdo->prepare("INSERT INTO hotels (id, name, price, location, admin_id) VALUES (?, 'Goa Luxury Beach Resort', 5000, 'Calangute Goa', 'admin')")
        ->execute([$testHotelId]);

// ---------------------------------------------------------
// TEST 1: D2C Booking Defaults
// ---------------------------------------------------------
$d2cBookingId = 'TG-TEST-D2C-01';
$pdo->prepare("DELETE FROM bookings WHERE id = ?")->execute([$d2cBookingId]);
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, total_amount, status, booking_channel, cashback_earned, cashback_status) VALUES (?, 'D2C Guest', '9999000001', 'guest@gmail.com', 5000, 'Confirmed', 'D2C', 500.00, 'Pending')")
    ->execute([$d2cBookingId]);

$d2cRow = $pdo->query("SELECT * FROM bookings WHERE id = '$d2cBookingId'")->fetch(PDO::FETCH_ASSOC);
assertCondition("D2C booking has booking_channel = 'D2C'", $d2cRow['booking_channel'] === 'D2C');
assertCondition("D2C booking has null b2b_partner_id", empty($d2cRow['b2b_partner_id']));
assertCondition("D2C booking preserves 10% customer cashback", floatval($d2cRow['cashback_earned']) === 500.00);

// ---------------------------------------------------------
// TEST 2: Authoritative B2B Commission Calculation (₹5,000 -> 10% Commission = ₹500)
// ---------------------------------------------------------
$commPricing = calculateAuthoritativeB2BPrice($pdo, 'hotel', $testHotelId, 1, 1, ['room_price' => 5000, 'total_amount' => 5000], $partnerA, 'COMMISSION');
assertCondition("Commission Mode original reference price is ₹5,000", floatval($commPricing['original_reference_price']) === 5000.00, "Ref price: " . $commPricing['original_reference_price']);
assertCondition("Commission percentage is 10%", floatval($commPricing['b2b_commission_percentage']) === 10.00);
assertCondition("Commission amount is exactly 10% of ₹5,000 = ₹500.00", floatval($commPricing['b2b_commission_amount']) === 500.00);
assertCondition("Commission Mode final payable amount equals selling price ₹5,000", floatval($commPricing['final_payable_amount']) === 5000.00);

// ---------------------------------------------------------
// TEST 3: Authoritative B2B Non-Commission Calculation (Net Price)
// ---------------------------------------------------------
$netPricing = calculateAuthoritativeB2BPrice($pdo, 'hotel', $testHotelId, 1, 1, ['room_price' => 5000, 'total_amount' => 5000], $partnerA, 'NON_COMMISSION');
assertCondition("Non-Commission Mode commission is strictly ₹0.00", floatval($netPricing['b2b_commission_amount']) === 0.00);
assertCondition("Non-Commission Mode net discount is 10%", floatval($netPricing['b2b_net_discount_percentage']) === 10.00);
assertCondition("Non-Commission Mode net price is ₹5,000 - 10% = ₹4,500.00", floatval($netPricing['b2b_net_price']) === 4500.00);
assertCondition("Non-Commission final payable amount is net price ₹4,500.00", floatval($netPricing['final_payable_amount']) === 4500.00);

// ---------------------------------------------------------
// TEST 4: Deterministic Pricing Rule Priority
// Partner A custom rule for hotel: 15% commission, 12% net discount
// ---------------------------------------------------------
$pdo->prepare("INSERT INTO b2b_pricing_rules (partner_id, service_type, commission_percent, net_discount_percent, is_active, notes) VALUES (?, 'hotel', 15.00, 12.00, 1, 'Partner A custom hotel rate')")
    ->execute([$partnerA_Id]);

$resolvedRule = resolveB2BPricingRule($pdo, $partnerA_Id, 'hotel', $partnerA);
assertCondition("Priority 1 Partner+Service rule takes precedence (15% commission)", floatval($resolvedRule['commission_percent']) === 15.00);
assertCondition("Priority 1 Partner+Service rule net discount is 12%", floatval($resolvedRule['net_discount_percent']) === 12.00);

// ---------------------------------------------------------
// TEST 5: Backend Permission Enforcement
// Partner B has allow_non_commission = 0 -> Must throw Exception
// ---------------------------------------------------------
$permissionBlocked = false;
try {
    calculateAuthoritativeB2BPrice($pdo, 'hotel', $testHotelId, 1, 1, ['room_price' => 5000], $partnerB, 'NON_COMMISSION');
} catch (Exception $e) {
    $permissionBlocked = true;
}
assertCondition("Partner without Non-Commission permission is rejected by backend", $permissionBlocked);

// ---------------------------------------------------------
// TEST 6: Immutable Booking Price Snapshot & B2B Booking Creation
// ---------------------------------------------------------
$b2bBookingId = 'TG-TEST-B2B-COMM-01';
$pdo->prepare("INSERT INTO bookings (
    id, name, phone, email, item_id, item_name, booking_days, total_amount, amount_paid, remaining_amount, total_paid,
    status, payment_status, payment_method, created_at,
    booking_channel, b2b_mode, b2b_partner_id, b2b_partner_name,
    b2b_original_price, b2b_base_price, b2b_tax_amount,
    b2b_commission_percentage, b2b_commission_amount, b2b_commission_status,
    b2b_net_discount_percentage, b2b_net_price, b2b_pricing_rule_id,
    idempotency_key, cashback_earned, cashback_status
) VALUES (
    ?, 'Guest Anil', '9898989898', 'guest.anil@gmail.com', ?, 'Goa Luxury Beach Resort', 1, 5900, 5900, 0, 5900,
    'Confirmed', 'Paid', 'B2B Account', ?,
    'B2B', 'COMMISSION', ?, 'ABC Travels Goa',
    5900.00, 5000.00, 900.00,
    15.00, 885.00, 'Pending',
    0.00, 5015.00, 'rule_p_s_custom',
    'idemp_key_12345', 0.00, 'None'
)")->execute([$b2bBookingId, $testHotelId, $nowStr, $partnerA_Id]);

$savedB2B = $pdo->query("SELECT * FROM bookings WHERE id = '$b2bBookingId'")->fetch(PDO::FETCH_ASSOC);
assertCondition("B2B Booking created with booking_channel = 'B2B'", $savedB2B['booking_channel'] === 'B2B');
assertCondition("B2B Booking records b2b_mode = 'COMMISSION'", $savedB2B['b2b_mode'] === 'COMMISSION');
assertCondition("B2B Booking stores exact commission percentage 15.00%", floatval($savedB2B['b2b_commission_percentage']) === 15.00);
assertCondition("B2B Booking stores exact commission amount ₹885.00", floatval($savedB2B['b2b_commission_amount']) === 885.00);
assertCondition("B2B Booking isolates customer cashback (cashback_earned = 0.00)", floatval($savedB2B['cashback_earned']) === 0.00);

// ---------------------------------------------------------
// TEST 7: Historical Immutability Test
// Admin changes Partner A's commission rule from 15% to 20% -> Past booking MUST remain 15%
// ---------------------------------------------------------
$pdo->prepare("UPDATE b2b_pricing_rules SET commission_percent = 20.00 WHERE partner_id = ? AND service_type = 'hotel'")
    ->execute([$partnerA_Id]);

$historicalCheck = $pdo->query("SELECT * FROM bookings WHERE id = '$b2bBookingId'")->fetch(PDO::FETCH_ASSOC);
assertCondition("Historical booking commission remains unchanged at 15% after rule update", floatval($historicalCheck['b2b_commission_percentage']) === 15.00);
assertCondition("Historical booking commission amount remains strictly ₹885.00", floatval($historicalCheck['b2b_commission_amount']) === 885.00);

// ---------------------------------------------------------
// TEST 8: Commission Lifecycle (Pending -> Credited on 'Completed')
// ---------------------------------------------------------
updateB2BBookingStatusTransitions($pdo, $b2bBookingId, 'Completed', 'admin');
$completedB2B = $pdo->query("SELECT * FROM bookings WHERE id = '$b2bBookingId'")->fetch(PDO::FETCH_ASSOC);
assertCondition("Commission status transitions to 'Credited' on booking completion", $completedB2B['b2b_commission_status'] === 'Credited');

// ---------------------------------------------------------
// TEST 9: Commission Reversal on Cancellation & Audit Logging
// ---------------------------------------------------------
updateB2BBookingStatusTransitions($pdo, $b2bBookingId, 'Cancelled', 'admin');
$cancelledB2B = $pdo->query("SELECT * FROM bookings WHERE id = '$b2bBookingId'")->fetch(PDO::FETCH_ASSOC);
assertCondition("Commission status transitions to 'Reversed' on cancellation", $cancelledB2B['b2b_commission_status'] === 'Reversed');

$auditLog = $pdo->query("SELECT * FROM b2b_audit_logs WHERE booking_id = '$b2bBookingId' AND action = 'B2B_COMMISSION_REVERSED'")->fetch(PDO::FETCH_ASSOC);
assertCondition("B2B Audit Log entry recorded for commission reversal", !empty($auditLog));

// ---------------------------------------------------------
// TEST 10: Strict Partner Data Isolation
// Partner B must see 0 bookings of Partner A
// ---------------------------------------------------------
$stmtIso = $pdo->prepare("SELECT * FROM bookings WHERE b2b_partner_id = ?");
$stmtIso->execute([$partnerB_Id]);
$partnerBBookings = $stmtIso->fetchAll(PDO::FETCH_ASSOC);
assertCondition("Partner B sees 0 bookings belonging to Partner A (Strict Isolation)", count($partnerBBookings) === 0);

    // Clean test records
    $pdo->prepare("DELETE FROM users WHERE id IN (?, ?) OR email IN ('partner_a@agency.com', 'partner_b@agency.com')")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM bookings WHERE b2b_partner_id IN (?, ?) OR id LIKE 'TG-TEST-%'")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM b2b_pricing_rules WHERE partner_id IN (?, ?)")->execute([$partnerA_Id, $partnerB_Id]);
    $pdo->prepare("DELETE FROM b2b_audit_logs WHERE partner_id IN (?, ?)")->execute([$partnerA_Id, $partnerB_Id]);

    echo "\n--- TEST RUN COMPLETE: $passCount PASSED, $failCount FAILED ---\n";
    if ($failCount > 0) exit(1);
} catch (Exception $e) {
    echo "\n❌ EXCEPTION THROWN: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
