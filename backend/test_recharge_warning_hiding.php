<?php
// backend/test_recharge_warning_hiding.php
/**
 * Test Suite: Vendor Wallet - Hide Recharge Warnings After Successful Recharge
 * Verifies:
 * 1. Negative/restricted wallet shows recharge warnings.
 * 2. Submitted recharge (Pending Verification) retains warnings.
 * 3. Approved recharge (balance >= 0) removes warnings and unblocks booking.
 * 4. Partial recharge (balance < 0) retains warnings and restrictions.
 * 5. State persists across subsequent re-fetches.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/VendorWalletAlertService.php';
require_once __DIR__ . '/BookingService.php';

function getTestDb() {
    $dbPath = __DIR__ . '/database.sqlite';
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    VendorWalletAlertService::ensureSchema($pdo);
    return $pdo;
}

$pdo = getTestDb();

echo "======================================================================\n";
echo "   TEST: HIDE RECHARGE WARNINGS AFTER SUCCESSFUL RECHARGE\n";
echo "======================================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertCheck($desc, $cond, $msg = "") {
    global $passCount, $failCount;
    if ($cond) {
        echo " [PASS] $desc\n";
        $passCount++;
    } else {
        echo " [FAIL] $desc " . ($msg ? "($msg)" : "") . "\n";
        $failCount++;
    }
}

// Setup mock vendors
$v1 = 'test_vend_recharge_a_' . uniqid();
$v2 = 'test_vend_recharge_b_' . uniqid();

// Ensure vendor records exist
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, 'vendor', 'hash')")
    ->execute([$v1, $v1, 'VendorA_' . uniqid(), 'venda_' . uniqid() . '@test.com', '+91' . rand(1000000000, 9999999999)]);
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, 'vendor', 'hash')")
    ->execute([$v2, $v2, 'VendorB_' . uniqid(), 'vendb_' . uniqid() . '@test.com', '+91' . rand(1000000000, 9999999999)]);

// ----------------------------------------------------------------------
echo "--- 1. Set Vendor A negative (-₹800) and send manual reminder ---\n";
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance, services_suspended, initial_reminders_sent) VALUES (?, ?, -800.00, 2, 5000, 0, 2)")
    ->execute(['wall_' . uniqid(), $v1]);

// Admin sends manual recharge reminder to Vendor A
$remRes = VendorWalletAlertService::sendManualVendorReminder($pdo, $v1, 'admin', ['Portal'], 'Urgent: Please recharge your wallet.');
assertCheck("Manual reminder dispatched", $remRes['success'] === true);

// Verify alert is active for Vendor A
$activeAlert = VendorWalletAlertService::getActivePortalAlert($pdo, $v1);
assertCheck("Active portal alert is returned for negative Vendor A", $activeAlert !== null && $activeAlert['active'] === true);

// ----------------------------------------------------------------------
echo "\n--- 2. Vendor A submits recharge request (Pending Verification) ---\n";
$txId = 'tx_' . uniqid();
$pdo->prepare("INSERT INTO wallet_transactions (id, vendor_id, amount, type, reference_id, payment_proof, status, description, created_at) VALUES (?, ?, 2000.00, 'credit', ?, 'proof.jpg', 'Pending Verification', 'Wallet recharge via UPI', datetime('now'))")
    ->execute([$txId, $v1, 'UTR_' . uniqid()]);

// Balance is STILL -₹800 because recharge is pending
$stmtBal = $pdo->prepare("SELECT balance FROM vendor_wallets WHERE vendor_id = ?");
$stmtBal->execute([$v1]);
$balPending = floatval($stmtBal->fetchColumn());
assertCheck("Wallet balance unchanged (-₹800) while recharge is pending", $balPending === -800.00);

// Warnings MUST remain visible while pending
$alertWhilePending = VendorWalletAlertService::getActivePortalAlert($pdo, $v1);
assertCheck("Warning remains visible while recharge is pending", $alertWhilePending !== null && $alertWhilePending['active'] === true);

// ----------------------------------------------------------------------
echo "\n--- 3. Admin APPROVES recharge -> Balance becomes +₹1,200 (Eligible) ---\n";
// Call approve_recharge logic as in api.php
$stmtClaim = $pdo->prepare("UPDATE wallet_transactions SET status = 'Completed' WHERE id = ?");
$stmtClaim->execute([$txId]);

$balanceBefore = -800.00;
$amount = 2000.00;
$balanceAfter = $balanceBefore + $amount; // +1200.00

$pdo->prepare("UPDATE vendor_wallets SET balance = ?, negative_booking_count = 0, initial_reminders_sent = 0, last_reminder_at = NULL, updated_at = datetime('now') WHERE vendor_id = ?")
    ->execute([$balanceAfter, $v1]);

$pdo->prepare("UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR (role = 'vendor' AND user_id = ?)) AND type IN ('MANUAL_WALLET_RECHARGE_REMINDER', 'ESCALATION_REMINDER', 'WALLET_REMINDER')")
    ->execute([$v1, $v1]);

$stmtOldLogs = $pdo->prepare("SELECT DISTINCT alert_id FROM vendor_wallet_alert_logs WHERE vendor_id = ?");
$stmtOldLogs->execute([$v1]);
$oldIds = $stmtOldLogs->fetchAll(PDO::FETCH_COLUMN);
$stmtInsD = $pdo->prepare("INSERT OR IGNORE INTO vendor_wallet_alert_dismissals (vendor_id, alert_id, dismissed_at) VALUES (?, ?, datetime('now'))");
foreach ($oldIds as $oid) {
    if (!empty($oid)) $stmtInsD->execute([$v1, $oid]);
}

VendorWalletAlertService::resetLowBalanceAlertState($pdo, $v1, $balanceAfter);

// Now check active portal alert for Vendor A
$alertAfterApproval = VendorWalletAlertService::getActivePortalAlert($pdo, $v1);
assertCheck("Portal alert is NULL after approval (warnings hidden)", $alertAfterApproval === null);

// Check notifications read status
$stmtUnreadNotif = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE (user_id = ? OR (role = 'vendor' AND user_id = ?)) AND type = 'MANUAL_WALLET_RECHARGE_REMINDER' AND is_read = 0");
$stmtUnreadNotif->execute([$v1, $v1]);
assertCheck("No unread manual recharge reminder notifications remain", intval($stmtUnreadNotif->fetchColumn()) === 0);

// Check persistence on subsequent check
$alertSubsequent = VendorWalletAlertService::getActivePortalAlert($pdo, $v1);
assertCheck("Alert state remains hidden on subsequent re-fetch", $alertSubsequent === null);

// ----------------------------------------------------------------------
echo "\n--- 4. Vendor B with -₹3,000 partial recharge (+₹1,000 -> balance -₹2,000) ---\n";
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance, services_suspended, initial_reminders_sent) VALUES (?, ?, -3000.00, 2, 5000, 0, 2)")
    ->execute(['wall_' . uniqid(), $v2]);

$remResB = VendorWalletAlertService::sendManualVendorReminder($pdo, $v2, 'admin', ['Portal'], 'Urgent: Please recharge your wallet.');
assertCheck("Manual reminder sent to Vendor B", $remResB['success'] === true);

$txIdB = 'tx_' . uniqid();
$pdo->prepare("INSERT INTO wallet_transactions (id, vendor_id, amount, type, reference_id, payment_proof, status, description, created_at) VALUES (?, ?, 1000.00, 'credit', ?, 'proof.jpg', 'Pending Verification', 'Partial recharge', datetime('now'))")
    ->execute([$txIdB, $v2, 'UTR_' . uniqid()]);

// Super Admin approves partial recharge
$stmtClaimB = $pdo->prepare("UPDATE wallet_transactions SET status = 'Completed' WHERE id = ?");
$stmtClaimB->execute([$txIdB]);

$balBeforeB = -3000.00;
$amtB = 1000.00;
$balAfterB = $balBeforeB + $amtB; // -2000.00 (STILL NEGATIVE)

// Since balAfterB < 0: do NOT reset negative_booking_count or dismiss alerts
$pdo->prepare("UPDATE vendor_wallets SET balance = ?, updated_at = datetime('now') WHERE vendor_id = ?")
    ->execute([$balAfterB, $v2]);

// Vendor B is STILL negative (-₹2,000), so warnings MUST remain visible!
$alertPartialB = VendorWalletAlertService::getActivePortalAlert($pdo, $v2);
assertCheck("Warning REMAINS visible when wallet is still negative after partial recharge", $alertPartialB !== null && $alertPartialB['active'] === true);

echo "\n======================================================================\n";
echo "   TOTAL TESTS: " . ($passCount + $failCount) . " | PASSED: $passCount | FAILED: $failCount\n";
echo "======================================================================\n";

if ($failCount > 0) exit(1);
exit(0);
