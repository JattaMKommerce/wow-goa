<?php
// backend/test_vendor_wallet_system.php
// Comprehensive verification test suite for Vendor Wallet, Offline Recharge, Platform Fee & Negative Wallet System

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/BookingService.php';

$sqlitePath = __DIR__ . '/database.sqlite';

function getDb(): PDO {
    global $sqlitePath;
    $pdo = new PDO("sqlite:" . $sqlitePath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("PRAGMA busy_timeout = 5000;");
    return $pdo;
}

$passed = 0;
$failed = 0;

function assertTest(string $description, bool $condition, ?string $detail = null) {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo " [PASS] $description\n";
    } else {
        $failed++;
        echo " [FAIL] $description" . ($detail ? " - $detail" : "") . "\n";
    }
}

echo "======================================================================\n";
echo "   WOW GOA VENDOR WALLET & NEGATIVE BOOKING SYSTEM TEST SUITE\n";
echo "======================================================================\n\n";

// Helper to create test booking
function createTestBooking(string $id, string $vendorId, float $platformFee = 500.00, float $total = 2500.00): string {
    $pdo = getDb();
    $stmt = $pdo->prepare("INSERT OR REPLACE INTO bookings (
        id, name, phone, vendor_id, item_id, item_name, type, status, 
        pickup_date, drop_date, total_amount, wow_goa_platform_fee, 
        wallet_deduction_status, payment_status, created_at
    ) VALUES (
        ?, 'Test Customer', '9876543210', ?, 'item-101', 'Test Service', 'hotel', 'Pending',
        '2026-10-01', '2026-10-03', ?, ?, 'Pending', 'Paid', datetime('now')
    )");
    $stmt->execute([$id, $vendorId, $total, $platformFee]);
    return $id;
}

// Reset vendor wallet
function resetVendorWallet(string $vendorId, float $initialBalance = 0.00, int $negCount = 0) {
    $pdo = getDb();
    $pdo->prepare("DELETE FROM vendor_wallets WHERE vendor_id = ?")->execute([$vendorId]);
    $stmt = $pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance) VALUES (?, ?, ?, ?, 5000)");
    $stmt->execute(['wall_' . uniqid(), $vendorId, $initialBalance, $negCount]);
}

// Set global max negative bookings
$pdo = getDb();
$pdo->prepare("UPDATE global_settings SET max_negative_bookings = 2 WHERE id = 1")->execute();
$pdo->prepare("UPDATE site_configs SET max_negative_bookings = 2 WHERE id = 1")->execute();

// --- TEST 1: Vendor with ₹1,000 confirms ₹500-fee booking -> wallet ₹500 ---
echo "\n--- TEST 1: Positive Balance Platform Fee Deduction ---\n";
$v1 = 'test_vendor_pos_' . uniqid();
resetVendorWallet($v1, 1000.00, 0);
$b1 = createTestBooking('bk_' . uniqid(), $v1, 500.00);

$res1 = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $b1, $v1);
assertTest("Confirmation succeeds", $res1['success'] === true);
assertTest("Fee deducted is ₹500", floatval($res1['platform_fee']) === 500.00);

$stmtW = getDb()->prepare("SELECT balance, negative_booking_count FROM vendor_wallets WHERE vendor_id = ?");
$stmtW->execute([$v1]);
$w1 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Vendor wallet balance is ₹500", floatval($w1['balance']) === 500.00, "Got: " . $w1['balance']);
assertTest("Negative count remains 0", intval($w1['negative_booking_count']) === 0);

// --- TEST 2: Vendor with ₹0 confirms ₹500-fee booking -> wallet -₹500 ---
echo "\n--- TEST 2 & 3: Zero Balance to Negative Balance (First Negative Booking) ---\n";
$v2 = 'test_vendor_neg_' . uniqid();
resetVendorWallet($v2, 0.00, 0);
$b2 = createTestBooking('bk_' . uniqid(), $v2, 500.00);

$res2 = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $b2, $v2);
assertTest("Zero balance confirmation succeeds (first negative booking)", $res2['success'] === true);

$stmtW->execute([$v2]);
$w2 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Vendor wallet becomes -₹500", floatval($w2['balance']) === -500.00, "Got: " . $w2['balance']);
assertTest("Negative booking count is 1", intval($w2['negative_booking_count']) === 1, "Got: " . $w2['negative_booking_count']);

// --- TEST 4: Second negative booking allowed (count = 2) ---
echo "\n--- TEST 4: Second Negative Booking Allowed ---\n";
$b3 = createTestBooking('bk_' . uniqid(), $v2, 300.00);
$res3 = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $b3, $v2);
assertTest("Second negative booking confirmation succeeds", $res3['success'] === true);

$stmtW->execute([$v2]);
$w3 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Vendor wallet becomes -₹800 (-500 - 300)", floatval($w3['balance']) === -800.00, "Got: " . $w3['balance']);
assertTest("Negative booking count reaches 2", intval($w3['negative_booking_count']) === 2, "Got: " . $w3['negative_booking_count']);

// --- TEST 5 & 6: Third booking blocked when limit = 2 with WALLET_BLOCKED ---
echo "\n--- TEST 5 & 6: Third Booking Blocked (WALLET_BLOCKED) ---\n";
$b4 = createTestBooking('bk_' . uniqid(), $v2, 500.00);
$res4 = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $b4, $v2);

assertTest("Third booking is BLOCKED", $res4['success'] === false);
assertTest("Blocked response code is 'WALLET_BLOCKED'", ($res4['code'] ?? '') === 'WALLET_BLOCKED', "Got code: " . ($res4['code'] ?? 'none'));

$stmtW->execute([$v2]);
$w4 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Wallet balance unchanged after blocked booking (-₹800)", floatval($w4['balance']) === -800.00);

$stmtB = getDb()->prepare("SELECT status, wallet_deduction_status FROM bookings WHERE id = ?");
$stmtB->execute([$b4]);
$bkRow = $stmtB->fetch(PDO::FETCH_ASSOC);
assertTest("Blocked booking status remains Pending", $bkRow['status'] === 'Pending');
assertTest("Blocked booking fee was not deducted", $bkRow['wallet_deduction_status'] === 'Pending');

// --- TEST 7 & 8: Wallet recharge validation (requires UTR and Screenshot) ---
echo "\n--- TEST 7 & 8: Offline Recharge Validation ---\n";
function postApi(string $url, array $payload): array {
    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => json_encode($payload),
            'ignore_errors' => true
        ]
    ]);
    $response = @file_get_contents($url, false, $context);
    $httpCode = 200;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('#HTTP/\S+\s+(\d+)#', $hdr, $m)) {
                $httpCode = (int)$m[1];
            }
        }
    }
    return ['code' => $httpCode, 'data' => json_decode($response ?: '{}', true)];
}

$apiUrl = 'http://127.0.0.1:8000/api.php';

// Missing UTR
$rech1 = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $v2,
    'amount' => 2000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/test_proof.png',
    'reference_id' => ''
]);
assertTest("Recharge without UTR is rejected (400)", $rech1['code'] === 400);

// Missing Screenshot
$rech2 = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $v2,
    'amount' => 2000,
    'payment_method' => 'UPI',
    'payment_proof' => '',
    'reference_id' => 'UTR_' . uniqid()
]);
assertTest("Recharge without screenshot is rejected (400)", $rech2['code'] === 400);

// --- TEST 9: Pending recharge does not change wallet ---
echo "\n--- TEST 9: Pending Recharge Does Not Credit Wallet ---\n";
$validUtr = 'UTR_TEST_' . uniqid();
$rech3 = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $v2,
    'amount' => 2000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_valid.png',
    'reference_id' => $validUtr
]);
assertTest("Valid recharge submission creates Pending Verification (200)", $rech3['code'] === 200 && ($rech3['data']['status'] ?? '') === 'Pending Verification');
$txnId = $rech3['data']['id'] ?? null;

$stmtW->execute([$v2]);
$wPending = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Vendor wallet balance is STILL -₹800 at submission time", floatval($wPending['balance']) === -800.00);

// --- TEST 10, 12, 14: Approved recharge credits wallet and unblocks vendor ---
echo "\n--- TEST 10, 12, 14: Super Admin Approval, Settlement & Unblock ---\n";
$apprRes = postApi($apiUrl, [
    'action' => 'approve_recharge',
    'id' => $txnId,
    'status' => 'Completed'
]);
assertTest("Recharge approval succeeds (200)", $apprRes['code'] === 200 && !empty($apprRes['data']['success']));

$stmtW->execute([$v2]);
$wApproved = $stmtW->fetch(PDO::FETCH_ASSOC);
// -800 + 2000 = 1200
assertTest("Vendor balance is now ₹1,200 (-800 + 2000)", floatval($wApproved['balance']) === 1200.00, "Got: " . $wApproved['balance']);
assertTest("Negative booking count resets to 0 (Unblocked)", intval($wApproved['negative_booking_count']) === 0, "Got: " . $wApproved['negative_booking_count']);

// Check transaction audit trail
$stmtTxAud = getDb()->prepare("SELECT balance_before, balance_after FROM wallet_transactions WHERE id = ?");
$stmtTxAud->execute([$txnId]);
$txAud = $stmtTxAud->fetch(PDO::FETCH_ASSOC);
assertTest("Audit trail recorded balance_before = -800", floatval($txAud['balance_before']) === -800.00);
assertTest("Audit trail recorded balance_after = 1200", floatval($txAud['balance_after']) === 1200.00);

// --- TEST 11: Rejected recharge does not change wallet ---
echo "\n--- TEST 11: Rejected Recharge Does Not Change Wallet ---\n";
$vRej = 'test_vendor_rej_' . uniqid();
resetVendorWallet($vRej, 500.00, 0);
$rejUtr = 'UTR_REJ_' . uniqid();
$rechRej = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vRej,
    'amount' => 1000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/fake_proof.png',
    'reference_id' => $rejUtr
]);
$rejTxId = $rechRej['data']['id'] ?? null;

$apprRej = postApi($apiUrl, [
    'action' => 'approve_recharge',
    'id' => $rejTxId,
    'status' => 'Rejected',
    'rejection_reason' => 'Invalid transaction reference in bank statement.'
]);
assertTest("Recharge rejection succeeds", $apprRej['code'] === 200);

$stmtW->execute([$vRej]);
$wRej = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Wallet balance unchanged at ₹500 after rejection", floatval($wRej['balance']) === 500.00);

$stmtTxRej = getDb()->prepare("SELECT rejection_reason, status FROM wallet_transactions WHERE id = ?");
$stmtTxRej->execute([$rejTxId]);
$rejRow = $stmtTxRej->fetch(PDO::FETCH_ASSOC);
assertTest("Rejection reason is stored in transaction record", !empty($rejRow['rejection_reason']));

// --- TEST 13: Partial recharge leaving balance negative remains blocked ---
echo "\n--- TEST 13: Partial Recharge Leaves Balance Negative & Remains Blocked ---\n";
$vPart = 'test_vendor_part_' . uniqid();
resetVendorWallet($vPart, -1500.00, 2); // Blocked with 2 negative bookings
$partUtr = 'UTR_PART_' . uniqid();

$rechPart = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vPart,
    'amount' => 500, // +500 results in -1000
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_part.png',
    'reference_id' => $partUtr
]);
$partTxId = $rechPart['data']['id'];

$apprPart = postApi($apiUrl, [
    'action' => 'approve_recharge',
    'id' => $partTxId,
    'status' => 'Completed'
]);

$stmtW->execute([$vPart]);
$wPart = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Balance after partial recharge is -₹1,000 (-1500 + 500)", floatval($wPart['balance']) === -1000.00, "Got: " . $wPart['balance']);
assertTest("Negative booking count remains 2 (not reset)", intval($wPart['negative_booking_count']) === 2);

// Confirming new booking is still blocked
$bPart = createTestBooking('bk_' . uniqid(), $vPart, 500.00);
$resPart = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $bPart, $vPart);
assertTest("Vendor remains BLOCKED on next booking", $resPart['success'] === false && ($resPart['code'] ?? '') === 'WALLET_BLOCKED');

// --- TEST 15 & 16: WOW GOA Revenue separation & No double revenue on recharge ---
echo "\n--- TEST 15 & 16: Revenue Separation (Platform Fee vs Recharge Settlement) ---\n";
$stmtRevCountBefore = getDb()->query("SELECT COUNT(*) FROM wallet_transactions WHERE type = 'platform_revenue'");
$revCountBefore = intval($stmtRevCountBefore->fetchColumn());

$vRev = 'test_vendor_rev_' . uniqid();
resetVendorWallet($vRev, 1000.00, 0);
$bRev = createTestBooking('bk_' . uniqid(), $vRev, 500.00);
BookingService::confirmBookingAndDeductPlatformFee(getDb(), $bRev, $vRev);

$stmtRevCountAfter = getDb()->query("SELECT COUNT(*) FROM wallet_transactions WHERE type = 'platform_revenue'");
$revCountAfter = intval($stmtRevCountAfter->fetchColumn());
assertTest("Platform fee creates 1 platform revenue record (+₹500)", $revCountAfter === $revCountBefore + 1);

// Now vendor recharges ₹1,000
$revUtr = 'UTR_REV_' . uniqid();
$rechRev = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vRev,
    'amount' => 1000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_rev.png',
    'reference_id' => $revUtr
]);
postApi($apiUrl, [
    'action' => 'approve_recharge',
    'id' => $rechRev['data']['id'],
    'status' => 'Completed'
]);

$stmtRevCountFinal = getDb()->query("SELECT COUNT(*) FROM wallet_transactions WHERE type = 'platform_revenue'");
$revCountFinal = intval($stmtRevCountFinal->fetchColumn());
assertTest("Wallet recharge DOES NOT create platform revenue", $revCountFinal === $revCountAfter);

// --- TEST 17: Double booking confirmation cannot charge twice (Idempotency) ---
echo "\n--- TEST 17: Idempotent Booking Confirmation ---\n";
$vIdemp = 'test_vendor_idemp_' . uniqid();
resetVendorWallet($vIdemp, 1000.00, 0);
$bIdemp = createTestBooking('bk_' . uniqid(), $vIdemp, 500.00);

$firstConf = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $bIdemp, $vIdemp);
assertTest("First confirmation succeeds", $firstConf['success'] === true);

$stmtW->execute([$vIdemp]);
$wIdemp1 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Balance is ₹500", floatval($wIdemp1['balance']) === 500.00);

// Second confirmation attempt on same booking
$secondConf = BookingService::confirmBookingAndDeductPlatformFee(getDb(), $bIdemp, $vIdemp);
assertTest("Second confirmation returns idempotent success", $secondConf['success'] === true && !empty($secondConf['already_confirmed']));

$stmtW->execute([$vIdemp]);
$wIdemp2 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Balance remains ₹500 (fee NOT charged twice)", floatval($wIdemp2['balance']) === 500.00);

// --- TEST 18: Double recharge approval cannot credit twice ---
echo "\n--- TEST 18: Idempotent Recharge Approval ---\n";
$vDblAppr = 'test_vendor_dbl_' . uniqid();
resetVendorWallet($vDblAppr, 1000.00, 0);
$dblUtr = 'UTR_DBL_' . uniqid();

$rechDbl = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vDblAppr,
    'amount' => 1000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_dbl.png',
    'reference_id' => $dblUtr
]);
$dblTxId = $rechDbl['data']['id'];

$firstAppr = postApi($apiUrl, ['action' => 'approve_recharge', 'id' => $dblTxId, 'status' => 'Completed']);
assertTest("First approval succeeds", $firstAppr['code'] === 200);

$stmtW->execute([$vDblAppr]);
$wDbl1 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Wallet balance is ₹2,000 (1000 + 1000)", floatval($wDbl1['balance']) === 2000.00);

// Second approval attempt on already approved transaction
$secondAppr = postApi($apiUrl, ['action' => 'approve_recharge', 'id' => $dblTxId, 'status' => 'Completed']);
assertTest("Second approval acknowledges already processed", $secondAppr['code'] === 200);

$stmtW->execute([$vDblAppr]);
$wDbl2 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest("Wallet balance remains ₹2,000 (NOT credited twice)", floatval($wDbl2['balance']) === 2000.00);

// --- TEST 19: Duplicate UTR is rejected ---
echo "\n--- TEST 19: Duplicate UTR Protection ---\n";
$dupUtr = 'UTR_UNIQUE_' . uniqid();
$firstUtrSubmit = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vDblAppr,
    'amount' => 1000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_u1.png',
    'reference_id' => $dupUtr
]);
assertTest("First submission with UTR succeeds (200)", $firstUtrSubmit['code'] === 200);

$secondUtrSubmit = postApi($apiUrl, [
    'action' => 'recharge_wallet',
    'vendor_id' => $vRev,
    'amount' => 1000,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/proof_u2.png',
    'reference_id' => $dupUtr
]);
assertTest("Second submission with same UTR is REJECTED (400)", $secondUtrSubmit['code'] === 400);

// --- TEST 20: Vendor Isolation ---
echo "\n--- TEST 20: Vendor Isolation ---\n";
$vA = 'vendor_isolated_A_' . uniqid();
$vB = 'vendor_isolated_B_' . uniqid();
resetVendorWallet($vA, 5000.00, 0);
resetVendorWallet($vB, 2000.00, 0);

$bIso = createTestBooking('bk_' . uniqid(), $vA, 500.00);
BookingService::confirmBookingAndDeductPlatformFee(getDb(), $bIso, $vA);

$stmtWA = getDb()->prepare("SELECT balance FROM vendor_wallets WHERE vendor_id = ?");
$stmtWA->execute([$vA]);
$wA = $stmtWA->fetch(PDO::FETCH_ASSOC);

$stmtWB = getDb()->prepare("SELECT balance FROM vendor_wallets WHERE vendor_id = ?");
$stmtWB->execute([$vB]);
$wB = $stmtWB->fetch(PDO::FETCH_ASSOC);

assertTest("Vendor A balance deducted to ₹4,500", floatval($wA['balance']) === 4500.00);
assertTest("Vendor B balance strictly untouched at ₹2,000", floatval($wB['balance']) === 2000.00);

echo "\n======================================================================\n";
echo "   TOTAL TESTS: " . ($passed + $failed) . " | PASSED: $passed | FAILED: $failed\n";
echo "======================================================================\n";

if ($failed > 0) {
    exit(1);
} else {
    exit(0);
}
