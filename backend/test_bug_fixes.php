<?php
/**
 * Test Suite for WOW GOA Phase 2 Bug Fixes
 * Bug 1: Customer Booking Vendor QR Separation & Fallback Prevention
 * Bug 2: Admin / Super Admin Vendor Wallets Display & Fields
 * Bug 3: Approved Wallet Recharge Moving to Approved Section & Idempotency
 */

$baseUrl = 'http://127.0.0.1:8000';
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$passed = 0;
$failed = 0;

function assertCheck($desc, $cond, $extra = '') {
    global $passed, $failed;
    if ($cond) {
        echo " [PASS] $desc\n";
        $passed++;
    } else {
        echo " [FAIL] $desc " . ($extra ? "($extra)" : "") . "\n";
        $failed++;
    }
}

function postReq($url, $data) {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($data),
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    $statusLine = $http_response_header[0] ?? '';
    preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m);
    $code = intval($m[1] ?? 200);
    return ['code' => $code, 'data' => json_decode($res, true)];
}

function getReq($url) {
    $opts = [
        'http' => [
            'method' => 'GET',
            'ignore_errors' => true
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    $statusLine = $http_response_header[0] ?? '';
    preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m);
    $code = intval($m[1] ?? 200);
    return ['code' => $code, 'data' => json_decode($res, true)];
}

echo "======================================================================\n";
echo "   WOW GOA - PHASE 2 BUG FIXES VERIFICATION TEST SUITE\n";
echo "======================================================================\n\n";

// ─── BUG 1 TESTS ──────────────────────────────────────────────────────────
echo "--- BUG 1: Vendor Payment QR & Fallback Prevention ---\n";

// 1.1 Vendor with configured payment method (u-4)
$resVpmU4 = getReq("$baseUrl/api.php?resource=vendor_payment_methods&vendor_id=u-4");
assertCheck("Vendor u-4 payment methods query succeeds (200)", $resVpmU4['code'] === 200);
$methodsU4 = array_filter($resVpmU4['data'] ?? [], fn($m) => $m['status'] === 'Active');
assertCheck("Vendor u-4 has active configured payment method", count($methodsU4) > 0);
$upiIds = array_map(fn($m) => $m['upi_id'] ?? '', $methodsU4);
assertCheck("Vendor u-4 payment method has active UPI ID ('aaa@upi' or 'bbb@upi')", in_array('aaa@upi', $upiIds) || in_array('bbb@upi', $upiIds));
assertCheck("Vendor u-4 payment method is NOT 'wowgoa@upi'", !in_array('wowgoa@upi', $upiIds));
$mWithQr = array_filter($methodsU4, fn($m) => !empty($m['qr_image_url']));
assertCheck("Vendor u-4 has QR image configured", count($mWithQr) > 0);

// 1.2 Vendor alias resolution: vendor-1 (cars) and vendor-2 (bikes) resolve to u-4 configured QR
$resVpmVendor1 = getReq("$baseUrl/api.php?resource=vendor_payment_methods&vendor_id=vendor-1");
assertCheck("Vendor-1 alias query succeeds (200)", $resVpmVendor1['code'] === 200);
$methodsV1 = array_filter($resVpmVendor1['data'] ?? [], fn($m) => $m['status'] === 'Active');
assertCheck("Vendor-1 resolves u-4 payment methods (count > 0)", count($methodsV1) > 0);

$resVpmVendor2 = getReq("$baseUrl/api.php?resource=vendor_payment_methods&vendor_id=vendor-2");
$methodsV2 = array_filter($resVpmVendor2['data'] ?? [], fn($m) => $m['status'] === 'Active');
assertCheck("Vendor-2 resolves u-4 payment methods (count > 0)", count($methodsV2) > 0);

// 1.3 Vendor without configured payment method (e.g. unconfigured vendor)
$testUnconfVnd = 'unconf_vnd_' . uniqid();
$resUnconf = getReq("$baseUrl/api.php?resource=vendor_payment_methods&vendor_id=$testUnconfVnd");
assertCheck("Unconfigured vendor returns empty list (no methods)", empty($resUnconf['data']));

// ─── BUG 2 TESTS ──────────────────────────────────────────────────────────
echo "\n--- BUG 2: Admin & Super Admin Vendor Wallet Endpoint ---\n";
$resWallets = getReq("$baseUrl/api.php?resource=wallets");
assertCheck("Wallets endpoint /api.php?resource=wallets returns 200", $resWallets['code'] === 200);
assertCheck("Wallets list is an array and not empty", is_array($resWallets['data']) && count($resWallets['data']) > 0);

$firstWallet = $resWallets['data'][0];
assertCheck("Wallet item contains 'vendor_name'", isset($firstWallet['vendor_name']) && !empty($firstWallet['vendor_name']));
assertCheck("Wallet item contains 'vendor_type'", isset($firstWallet['vendor_type']) && !empty($firstWallet['vendor_type']));
assertCheck("Wallet item contains numeric 'balance'", isset($firstWallet['balance']) && is_numeric($firstWallet['balance']));
assertCheck("Wallet item contains 'negative_booking_count'", isset($firstWallet['negative_booking_count']) && is_numeric($firstWallet['negative_booking_count']));
assertCheck("Wallet item contains 'max_negative_booking_limit'", isset($firstWallet['max_negative_booking_limit']) && is_numeric($firstWallet['max_negative_booking_limit']));
assertCheck("Wallet item contains 'wallet_status'", isset($firstWallet['wallet_status']) && !empty($firstWallet['wallet_status']));

// Verify known vendor types
$hotelVendors = array_filter($resWallets['data'], fn($w) => $w['vendor_type'] === 'Hotel Vendor');
$vehicleVendors = array_filter($resWallets['data'], fn($w) => $w['vendor_type'] === 'Vehicle Vendor');
$flightVendors = array_filter($resWallets['data'], fn($w) => $w['vendor_type'] === 'Flight Vendor');
assertCheck("Found Hotel Vendors with correct type label", count($hotelVendors) > 0);
assertCheck("Found Vehicle Vendors with correct type label", count($vehicleVendors) > 0);
assertCheck("Found Flight Vendors with correct type label", count($flightVendors) > 0);

// Verify blocked status format when negative limit exceeded
$testBlockVnd = 'test_vnd_block_' . uniqid();
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance) VALUES (?, ?, -800.00, 2, 5000)")
    ->execute(['wall_' . $testBlockVnd, $testBlockVnd]);

$resWalletsBlock = getReq("$baseUrl/api.php?resource=wallets");
$blockedItem = null;
foreach ($resWalletsBlock['data'] as $w) {
    if ($w['vendor_id'] === $testBlockVnd) {
        $blockedItem = $w;
        break;
    }
}
assertCheck("Blocked vendor found in wallets list", !empty($blockedItem));
assertCheck("Blocked vendor balance is -₹800", floatval($blockedItem['balance'] ?? 0) === -800.00);
assertCheck("Blocked vendor negative booking count is 2 / 2", intval($blockedItem['negative_booking_count'] ?? 0) === 2);
assertCheck("Blocked vendor wallet_status is 'WALLET RECHARGE REQUIRED'", ($blockedItem['wallet_status'] ?? '') === 'WALLET RECHARGE REQUIRED');
assertCheck("Blocked vendor is_blocked is true", !empty($blockedItem['is_blocked']));

// ─── BUG 3 TESTS ──────────────────────────────────────────────────────────
echo "\n--- BUG 3: Wallet Recharge Approval, Moving to Approved Section & Idempotency ---\n";

$testRechVnd = 'test_rech_vnd_' . uniqid();
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance) VALUES (?, ?, -500.00, 1, 5000)")
    ->execute(['wall_' . $testRechVnd, $testRechVnd]);

$testUtr = 'UTR_BUG3_' . uniqid();
$rechSubmit = postReq("$baseUrl/api.php", [
    'action' => 'recharge_wallet',
    'vendor_id' => $testRechVnd,
    'amount' => 1500,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/test_proof.png',
    'reference_id' => $testUtr
]);

assertCheck("Recharge request submission returns 200", $rechSubmit['code'] === 200);
$txId = $rechSubmit['data']['id'] ?? null;
assertCheck("Transaction ID generated", !empty($txId));

// Check in pending list
$resPending = getReq("$baseUrl/api.php?resource=wallet_transactions&status_filter=pending");
$pendingTxIds = array_column($resPending['data'] ?? [], 'id');
assertCheck("Recharge transaction appears in Pending list", in_array($txId, $pendingTxIds));

// Check it does NOT appear in approved/Completed list before approval
$resApprovedBefore = getReq("$baseUrl/api.php?resource=wallet_transactions&status_filter=Completed");
$approvedTxIdsBefore = array_column($resApprovedBefore['data'] ?? [], 'id');
assertCheck("Recharge transaction DOES NOT appear in Approved list before approval", !in_array($txId, $approvedTxIdsBefore));

// Super Admin clicks APPROVE
$apprRes = postReq("$baseUrl/api.php", [
    'action' => 'approve_recharge',
    'id' => $txId,
    'status' => 'Completed'
]);
assertCheck("Super Admin approval call returns 200", $apprRes['code'] === 200 && !empty($apprRes['data']['success']));

// Check wallet balance is updated: -500 + 1500 = 1000
$stmtW = $pdo->prepare("SELECT balance, negative_booking_count FROM vendor_wallets WHERE vendor_id = ?");
$stmtW->execute([$testRechVnd]);
$wRow = $stmtW->fetch(PDO::FETCH_ASSOC);
assertCheck("Wallet balance credited to ₹1,000 (-500 + 1500)", floatval($wRow['balance']) === 1000.00);
assertCheck("Negative booking count reset to 0", intval($wRow['negative_booking_count']) === 0);

// Check that transaction NOW appears in Approved section
$resApprovedAfter = getReq("$baseUrl/api.php?resource=wallet_transactions&status_filter=Completed");
$approvedTxIdsAfter = array_column($resApprovedAfter['data'] ?? [], 'id');
assertCheck("Approved recharge transaction NOW appears in Approved list", in_array($txId, $approvedTxIdsAfter));

// Check that transaction NO LONGER appears in Pending section
$resPendingAfter = getReq("$baseUrl/api.php?resource=wallet_transactions&status_filter=pending");
$pendingTxIdsAfter = array_column($resPendingAfter['data'] ?? [], 'id');
assertCheck("Approved recharge transaction NO LONGER appears in Pending list", !in_array($txId, $pendingTxIdsAfter));

// Check transaction audit trail fields
$stmtTx = $pdo->prepare("SELECT * FROM wallet_transactions WHERE id = ?");
$stmtTx->execute([$txId]);
$txRow = $stmtTx->fetch(PDO::FETCH_ASSOC);
assertCheck("Transaction status in DB is 'Completed'", $txRow['status'] === 'Completed');
assertCheck("Transaction audit balance_before is -500", floatval($txRow['balance_before']) === -500.00);
assertCheck("Transaction audit balance_after is 1000", floatval($txRow['balance_after']) === 1000.00);

// IDEMPOTENCY TEST: Super Admin clicks APPROVE a second time
$secondAppr = postReq("$baseUrl/api.php", [
    'action' => 'approve_recharge',
    'id' => $txId,
    'status' => 'Completed'
]);
assertCheck("Second approval succeeds with already processed message", $secondAppr['code'] === 200);

// Verify wallet was NOT double credited
$stmtW->execute([$testRechVnd]);
$wRow2 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertCheck("Wallet balance remains ₹1,000 (NOT double-credited)", floatval($wRow2['balance']) === 1000.00);

// REJECTION TEST:
$testRejUtr = 'UTR_REJ_' . uniqid();
$rechRej = postReq("$baseUrl/api.php", [
    'action' => 'recharge_wallet',
    'vendor_id' => $testRechVnd,
    'amount' => 500,
    'payment_method' => 'UPI',
    'payment_proof' => '/uploads/test_fake_proof.png',
    'reference_id' => $testRejUtr
]);
$rejTxId = $rechRej['data']['id'] ?? null;
assertCheck("Rejection test recharge created", !empty($rejTxId));

$rejAppr = postReq("$baseUrl/api.php", [
    'action' => 'approve_recharge',
    'id' => $rejTxId,
    'status' => 'Rejected',
    'rejection_reason' => 'Invalid UTR reference'
]);
assertCheck("Recharge rejection succeeds", $rejAppr['code'] === 200);

// Verify rejected transaction appears in Rejected list
$resRejected = getReq("$baseUrl/api.php?resource=wallet_transactions&status_filter=Rejected");
$rejTxIds = array_column($resRejected['data'] ?? [], 'id');
assertCheck("Rejected transaction appears in Rejected list", in_array($rejTxId, $rejTxIds));

// Verify wallet balance unchanged after rejection
$stmtW->execute([$testRechVnd]);
$wRow3 = $stmtW->fetch(PDO::FETCH_ASSOC);
assertCheck("Wallet balance unchanged at ₹1,000 after rejection", floatval($wRow3['balance']) === 1000.00);

echo "\n======================================================================\n";
echo "   TOTAL ASSERTIONS: " . ($passed + $failed) . " | PASSED: $passed | FAILED: $failed\n";
echo "======================================================================\n";
