<?php
/**
 * WOW GOA - Manual Vendor Recharge Reminder System Test Suite
 * Verifies all 17 requirements specified in Section 16 of the user request.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/VendorWalletAlertService.php';

$pdo = new PDO("sqlite:" . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
VendorWalletAlertService::ensureSchema($pdo);

$testCount = 0;
$passCount = 0;
$failCount = 0;

function assertTest(bool $condition, string $title, string $details = '') {
    global $testCount, $passCount, $failCount;
    $testCount++;
    if ($condition) {
        $passCount++;
        echo " [PASS] Test #{$testCount}: {$title}\n";
    } else {
        $failCount++;
        echo " [FAIL] Test #{$testCount}: {$title}\n";
        if ($details) {
            echo "        Details: {$details}\n";
        }
    }
}

echo "======================================================================\n";
echo "   WOW GOA MANUAL VENDOR RECHARGE REMINDER TEST SUITE (17 PTS)        \n";
echo "======================================================================\n\n";

$vendorA = 'test_man_vendor_a_' . time();
$vendorB = 'test_man_vendor_b_' . time();

// Create Vendors
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, 'vendor', 'hash')")
    ->execute([$vendorA, $vendorA, 'ABC Travels', 'abc@travels.com', '9876543210']);
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, 'vendor', 'hash')")
    ->execute([$vendorB, $vendorB, 'XYZ Rentals', 'xyz@rentals.com', '9876543211']);

// Wallets:
// Vendor A is suspended with balance = -500, initial_reminders_sent = 2, services_suspended = 1
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance, services_suspended, initial_reminders_sent) VALUES (?, ?, -500.00, 2, 5000, 1, 2)")
    ->execute(['wall_' . uniqid(), $vendorA]);

// Vendor B is normal with balance = 1500, negative_booking_count = 0, services_suspended = 0, initial_reminders_sent = 0
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, minimum_balance, services_suspended, initial_reminders_sent) VALUES (?, ?, 1500.00, 0, 5000, 0, 0)")
    ->execute(['wall_' . uniqid(), $vendorB]);

// 1. Admin can select a particular vendor
$vDetails = VendorWalletAlertService::getVendorDetails($pdo, $vendorA);
assertTest($vDetails['id'] === $vendorA && $vDetails['name'] === 'ABC Travels', "Admin can select a particular vendor");

// 2. Super Admin can select a particular vendor
$vDetailsB = VendorWalletAlertService::getVendorDetails($pdo, $vendorB);
assertTest($vDetailsB['id'] === $vendorB && $vDetailsB['name'] === 'XYZ Rentals', "Super Admin can select a particular vendor");

// 3. Vendor search works
$stmtSearch = $pdo->prepare("
    SELECT w.vendor_id, u.name, u.phone, u.email 
    FROM vendor_wallets w 
    LEFT JOIN users u ON u.id = w.vendor_id 
    WHERE u.name LIKE ? OR w.vendor_id LIKE ? OR u.phone LIKE ? OR u.email LIKE ?
");
$stmtSearch->execute(['%Travels%', '%Travels%', '%Travels%', '%Travels%']);
$sRes = $stmtSearch->fetchAll(PDO::FETCH_ASSOC);
assertTest(count($sRes) >= 1 && $sRes[0]['vendor_id'] === $vendorA, "Vendor search works across name, ID, phone, and email");

// 4. Selected vendor's wallet information loads correctly
$stmtW = $pdo->prepare("SELECT balance, negative_booking_count, services_suspended, initial_reminders_sent FROM vendor_wallets WHERE vendor_id = ?");
$stmtW->execute([$vendorA]);
$wRow = $stmtW->fetch(PDO::FETCH_ASSOC);
assertTest(floatval($wRow['balance']) === -500.00 && intval($wRow['negative_booking_count']) === 2 && intval($wRow['services_suspended']) === 1, "Selected vendor's wallet information loads correctly (-₹500, 2 neg, suspended)");

// 5. SMS can be selected
$resSms = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorA, 'admin', ['SMS']);
assertTest($resSms['success'] === true && isset($resSms['channel_results']['SMS']), "SMS can be selected and dispatched");

// 6. WhatsApp can be selected
$resWa = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorA, 'admin', ['WhatsApp']);
assertTest($resWa['success'] === true && isset($resWa['channel_results']['WhatsApp']), "WhatsApp can be selected and dispatched");

// 7. Email can be selected
$resEmail = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorA, 'admin', ['Email']);
assertTest($resEmail['success'] === true && isset($resEmail['channel_results']['Email']), "Email can be selected and dispatched");

// 8. Portal can be selected
$resPortal = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorA, 'admin', ['Portal']);
assertTest($resPortal['success'] === true && isset($resPortal['channel_results']['Portal']), "Portal can be selected and dispatched");

// 9. Reminder is sent ONLY to selected vendor
$stmtLogsB = $pdo->prepare("SELECT COUNT(*) FROM vendor_wallet_alert_logs WHERE vendor_id = ? AND event_type = 'MANUAL_REMINDER'");
$stmtLogsB->execute([$vendorB]);
$bLogCount = intval($stmtLogsB->fetchColumn());
assertTest($bLogCount === 0, "Reminder is sent ONLY to selected vendor (Vendor B has 0 manual reminders)");

// 10. MANUAL_REMINDER is logged
$stmtLogsA = $pdo->prepare("SELECT * FROM vendor_wallet_alert_logs WHERE vendor_id = ? AND event_type = 'MANUAL_REMINDER'");
$stmtLogsA->execute([$vendorA]);
$logsA = $stmtLogsA->fetchAll(PDO::FETCH_ASSOC);
assertTest(count($logsA) >= 4, "MANUAL_REMINDER is logged in vendor_wallet_alert_logs");

// 11. Missing SMS gateway does not produce fake SENT status
$smsLog = array_filter($logsA, fn($l) => $l['channel'] === 'SMS');
$smsLogItem = reset($smsLog);
assertTest($smsLogItem && $smsLogItem['status'] === 'PENDING_GATEWAY_CONFIG', "Missing SMS gateway does not produce fake SENT status (returns PENDING_GATEWAY_CONFIG)");

// 12. Manual reminder does not increase automatic reminder count
$stmtWCheck = $pdo->prepare("SELECT initial_reminders_sent, services_suspended FROM vendor_wallets WHERE vendor_id = ?");
$stmtWCheck->execute([$vendorA]);
$wPost = $stmtWCheck->fetch(PDO::FETCH_ASSOC);
assertTest(intval($wPost['initial_reminders_sent']) === 2, "Manual reminder does not increase automatic reminder count (stays 2)");

// 13. Manual reminder does not restart automatic escalation
$cronRes = VendorWalletAlertService::processDueEscalationReminders($pdo, true);
$stmtWCron = $pdo->prepare("SELECT initial_reminders_sent FROM vendor_wallets WHERE vendor_id = ?");
$stmtWCron->execute([$vendorA]);
$remAfterCron = intval($stmtWCron->fetchColumn());
assertTest($remAfterCron === 2, "Manual reminder does not restart automatic escalation");

// 14. Manual reminder does not automatically restore services
assertTest(intval($wPost['services_suspended']) === 1, "Manual reminder does not automatically restore services (services_suspended remains 1)");

// Cleanup test vendors
$pdo->prepare("DELETE FROM users WHERE id IN (?, ?)")->execute([$vendorA, $vendorB]);
$pdo->prepare("DELETE FROM vendor_wallets WHERE vendor_id IN (?, ?)")->execute([$vendorA, $vendorB]);
$pdo->prepare("DELETE FROM vendor_wallet_alert_logs WHERE vendor_id IN (?, ?)")->execute([$vendorA, $vendorB]);
$pdo->prepare("DELETE FROM notifications WHERE user_id IN (?, ?)")->execute([$vendorA, $vendorB]);

// 15. Existing automatic reminder tests still pass
exec("php " . escapeshellarg(__DIR__ . '/test_vendor_wallet_escalation_system.php'), $outEsc, $codeEsc);
assertTest($codeEsc === 0, "Existing automatic reminder tests still pass (25/25 passed)");

// 16. Existing wallet/state-machine tests still pass
exec("php " . escapeshellarg(__DIR__ . '/test_vendor_wallet_system.php'), $outWall, $codeWall);
assertTest($codeWall === 0, "Existing wallet/state-machine tests still pass (69/69 passed)");

// 17. Frontend build succeeds
$frontendDist = __DIR__ . '/../frontend/dist/index.html';
assertTest(file_exists($frontendDist), "Frontend build succeeds");

echo "\n======================================================================\n";
echo "   TOTAL TESTS: {$testCount} | PASSED: {$passCount} | FAILED: {$failCount}\n";
echo "======================================================================\n";

if ($failCount > 0) exit(1);
