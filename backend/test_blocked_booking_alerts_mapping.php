<?php
/**
 * WOW GOA - Test Suite for Vendor Recharge Reminder Messages & Blocked Booking Alerts Data Mapping
 *
 * Verifies:
 * Part A:
 * 1. Default template for Low Balance
 * 2. Urgent template for Wallet Blocked
 * 3. Notice template for Services Hidden
 * 4. Dynamic replacement of {Vendor Name} and {Balance}
 * 5. Normalization of negative zero to ₹0
 * 6. Absence of automatic service suspension statements
 *
 * Part B:
 * 7. Real booking ID preservation (No "Booking #N/A")
 * 8. Real customer resolution (Name, Phone, Email)
 * 9. Real vendor resolution (Name, Phone, Email, Type)
 * 10. Real wallet balance resolution (Authoritative, no "-₹0")
 * 11. Deduplication of alerts (No duplicate cards for same booking event)
 * 12. Idempotent trigger protection
 * 13. Contact actions resolution (Vendor & Customer phone/email)
 * 14. View booking action resolution
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/VendorWalletAlertService.php';
require_once __DIR__ . '/BookingService.php';

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
echo "   WOW GOA REMINDER MESSAGES & BLOCKED BOOKING ALERTS TEST SUITE      \n";
echo "======================================================================\n\n";

// ─────────────────────────────────────────────────────────────────────────────
// PART A: MANUAL RECHARGE REMINDER MESSAGE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

$vendorLow = 'test_v_low_' . uniqid();
$vendorBlocked = 'test_v_blk_' . uniqid();
$vendorHidden = 'test_v_hid_' . uniqid();

// Create test vendors in users
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'vendor')")
    ->execute([$vendorLow, $vendorLow, 'Goa Low Motors', "low_{$vendorLow}@goamotors.com", '9811111111']);
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'vendor')")
    ->execute([$vendorBlocked, $vendorBlocked, 'Goa Blocked Rentals', "blk_{$vendorBlocked}@goarentals.com", '9822222222']);
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'vendor')")
    ->execute([$vendorHidden, $vendorHidden, 'Goa Hidden Services', "hid_{$vendorHidden}@goaservices.com", '9833333333']);

// Wallets
// 1. Low Balance: balance = 500, negative_booking_count = 0, services_suspended = 0
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, services_suspended) VALUES (?, ?, 500.00, 0, 0)")
    ->execute(['wall_' . uniqid(), $vendorLow]);

// 2. Blocked: balance = -1200, negative_booking_count = 2, services_suspended = 0
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, services_suspended) VALUES (?, ?, -1200.00, 2, 0)")
    ->execute(['wall_' . uniqid(), $vendorBlocked]);

// 3. Hidden: balance = -2000, services_suspended = 1
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, services_suspended) VALUES (?, ?, -2000.00, 2, 1)")
    ->execute(['wall_' . uniqid(), $vendorHidden]);

// TEST 1: Low Balance default template
$resLow = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorLow, 'admin', ['Portal'], '');
assertTest(
    $resLow['success'] === true &&
    strpos($resLow['message'], 'WOW GOA – Wallet Recharge Reminder') !== false &&
    strpos($resLow['message'], 'Dear Goa Low Motors') !== false &&
    strpos($resLow['message'], '₹500') !== false &&
    strpos($resLow['message'], 'services may be hidden from the main WOW GOA website by the Admin') !== false,
    "Low Balance vendor selects Wallet Recharge Reminder with dynamic name and balance"
);

// TEST 2: Wallet Blocked default template
$resBlocked = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorBlocked, 'admin', ['Portal'], '');
assertTest(
    $resBlocked['success'] === true &&
    strpos($resBlocked['message'], 'WOW GOA – Urgent Wallet Recharge Reminder') !== false &&
    strpos($resBlocked['message'], 'Dear Goa Blocked Rentals') !== false &&
    strpos($resBlocked['message'], '-₹1,200') !== false &&
    strpos($resBlocked['message'], 'booking confirmation is currently restricted because your wallet has reached the allowed negative booking limit') !== false &&
    strpos($resBlocked['message'], 'Admin may manually hide your services') !== false,
    "Wallet Blocked vendor selects Urgent Wallet Recharge Reminder with dynamic negative balance and restriction notice"
);

// TEST 3: Services Hidden default template
$resHidden = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorHidden, 'admin', ['Portal'], '');
assertTest(
    $resHidden['success'] === true &&
    strpos($resHidden['message'], 'WOW GOA – Service Visibility Notice') !== false &&
    strpos($resHidden['message'], 'Dear Goa Hidden Services') !== false &&
    strpos($resHidden['message'], 'services are currently not visible to customers on the main WOW GOA website') !== false &&
    strpos($resHidden['message'], 'submit a Service Reactivation Request') !== false &&
    strpos($resHidden['message'], 'restored after Admin/Super Admin approval') !== false,
    "Services Hidden vendor selects Service Visibility Notice with reactivation instructions"
);

// TEST 4: No automatic suspension statements in any reminder
$allMsgs = $resLow['message'] . $resBlocked['message'] . $resHidden['message'];
$hasAutoSus = (
    stripos($allMsgs, 'automatically be hidden') !== false ||
    stripos($allMsgs, 'suspended automatically') !== false ||
    stripos($allMsgs, 'After 2 reminders your services will be hidden') !== false
);
assertTest(!$hasAutoSus, "Strict rule enforced: No false statements of automatic service suspension/hiding");

// TEST 5: Variable substitution in custom messages
$customTpl = "Hello {Vendor Name}, your balance is ₹{Balance}. Please note!";
$resCustom = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorLow, 'admin', ['Portal'], $customTpl);
assertTest(
    strpos($resCustom['message'], 'Hello Goa Low Motors, your balance is ₹500. Please note!') !== false,
    "Custom message properly replaces {Vendor Name} and ₹{Balance}"
);

// ─────────────────────────────────────────────────────────────────────────────
// PART B: REAL BLOCKED BOOKING ALERT DATA MAPPING & DEDUPLICATION
// ─────────────────────────────────────────────────────────────────────────────

$testBookingId = 'WG' . rand(10000, 99999);
$realCustName = 'Rohan Sharma';
$realCustPhone = '+919876543210';
$realCustEmail = 'rohan.sharma@example.com';
$realServiceName = 'Mahindra Thar 4x4 (Automatic)';

// Insert real booking record into bookings table
$pdo->prepare("
    INSERT INTO bookings (
        id, name, phone, email, type, item_name, vehicle_name, vendor_id, 
        pickup_date, drop_date, status, customer_payment, total_amount
    ) VALUES (
        ?, ?, ?, ?, 'vehicle', ?, ?, ?, 
        '2026-10-15', '2026-10-18', 'Pending', 4500.00, 4500.00
    )
")->execute([
    $testBookingId,
    $realCustName,
    $realCustPhone,
    $realCustEmail,
    $realServiceName,
    $realServiceName,
    $vendorBlocked
]);

// Clear any previous notifications for this booking
$pdo->prepare("DELETE FROM notifications WHERE reference_id = ?")->execute([$testBookingId]);

// Trigger blocked booking alert
$trigRes = VendorWalletAlertService::triggerBookingBlockedAlert(
    $pdo,
    $vendorBlocked,
    $testBookingId,
    -1200.00,
    2,
    2
);
assertTest($trigRes['triggered'] === true, "Booking blocked alert triggered successfully");

// Fetch alerts through the official API method
$alerts = VendorWalletAlertService::getBlockedBookingAlerts($pdo);

// Find our alert card
$card = null;
foreach ($alerts as $a) {
    if ($a['booking_id'] === $testBookingId) {
        $card = $a;
        break;
    }
}

// TEST 6: Real booking ID
assertTest(
    $card !== null && $card['booking_id'] === $testBookingId && $card['booking']['id'] === $testBookingId,
    "Alert preserves authoritative Booking ID (#{$testBookingId}, never #N/A)",
    "Found booking_id: " . ($card['booking_id'] ?? 'none')
);

// TEST 7: Customer information resolution
assertTest(
    $card['customer']['name'] === $realCustName &&
    $card['customer']['phone'] === $realCustPhone &&
    $card['customer']['email'] === $realCustEmail,
    "Alert resolves real Customer information (Name: {$realCustName}, Phone: {$realCustPhone}, Email: {$realCustEmail})",
    json_encode($card['customer'] ?? [])
);

// TEST 8: Vendor information resolution
assertTest(
    $card['vendor']['name'] === 'Goa Blocked Rentals' &&
    $card['vendor']['phone'] === '9822222222' &&
    $card['vendor']['email'] === "blk_{$vendorBlocked}@goarentals.com" &&
    $card['vendor']['vendor_id'] === $vendorBlocked,
    "Alert resolves real Vendor information (Name: Goa Blocked Rentals, Phone: 9822222222, ID: {$vendorBlocked})",
    json_encode($card['vendor'] ?? [])
);

// TEST 9: Authoritative wallet balance and no "-₹0"
assertTest(
    floatval($card['vendor']['balance']) === -1200.00 &&
    floatval($card['wallet']['balance']) === -1200.00,
    "Alert provides authoritative wallet balance (-₹1,200.00)"
);

// TEST 10: Deduplication - Exactly ONE operational alert card for this booking
$matchingCards = array_filter($alerts, fn($a) => $a['booking_id'] === $testBookingId);
assertTest(
    count($matchingCards) === 1,
    "Deduplication works: exactly ONE operational card exists for booking #{$testBookingId} (No duplicates between Admin and Super Admin)"
);

// TEST 11: Idempotent re-trigger protection
$retrigger = VendorWalletAlertService::triggerBookingBlockedAlert(
    $pdo,
    $vendorBlocked,
    $testBookingId,
    -1200.00,
    2,
    2
);
assertTest(
    $retrigger['triggered'] === false && strpos($retrigger['reason'], 'Duplicate blocked booking') !== false,
    "Idempotency: Re-triggering the same blocked booking event is prevented without spamming duplicate alerts"
);

// TEST 12: Contact actions mapping
$actions = $card['actions'] ?? [];
$hasContactVendor = false;
$hasContactCust = false;
$hasViewBooking = false;
foreach ($actions as $act) {
    if ($act['type'] === 'contact_vendor' && !empty($act['phone'])) $hasContactVendor = true;
    if ($act['type'] === 'contact_customer' && !empty($act['phone'])) $hasContactCust = true;
    if ($act['type'] === 'view_booking' && $act['booking_id'] === $testBookingId) $hasViewBooking = true;
}
assertTest(
    $hasContactVendor && $hasContactCust && $hasViewBooking,
    "Actions properly wired: [CONTACT VENDOR], [CONTACT CUSTOMER], and [VIEW BOOKING] with real targets"
);

// TEST 13: Normalization of zero balance (never "-₹0")
$vendorZero = 'test_v_zero_' . uniqid();
$pdo->prepare("INSERT INTO users (id, username, name, email, phone, role) VALUES (?, ?, 'Zero Bal Vendor', ?, '9844444444', 'vendor')")
    ->execute([$vendorZero, $vendorZero, "zero_{$vendorZero}@v.com"]);
$pdo->prepare("INSERT INTO vendor_wallets (id, vendor_id, balance, negative_booking_count, services_suspended) VALUES (?, ?, 0.00, 0, 0)")
    ->execute(['wall_' . uniqid(), $vendorZero]);
$resZero = VendorWalletAlertService::sendManualVendorReminder($pdo, $vendorZero, 'admin', ['Portal'], '');
assertTest(
    strpos($resZero['message'], '₹0') !== false && strpos($resZero['message'], '-₹0') === false,
    "Zero balance normalized: Displays '₹0', NEVER '-₹0'"
);

// Clean up test records
$pdo->prepare("DELETE FROM users WHERE id IN (?, ?, ?, ?)")->execute([$vendorLow, $vendorBlocked, $vendorHidden, $vendorZero]);
$pdo->prepare("DELETE FROM vendor_wallets WHERE vendor_id IN (?, ?, ?, ?)")->execute([$vendorLow, $vendorBlocked, $vendorHidden, $vendorZero]);
$pdo->prepare("DELETE FROM bookings WHERE id = ?")->execute([$testBookingId]);
$pdo->prepare("DELETE FROM notifications WHERE reference_id = ?")->execute([$testBookingId]);
$pdo->prepare("DELETE FROM vendor_wallet_alert_logs WHERE vendor_id IN (?, ?, ?, ?)")->execute([$vendorLow, $vendorBlocked, $vendorHidden, $vendorZero]);

echo "\n======================================================================\n";
echo "   TOTAL TESTS: {$testCount} | PASSED: {$passCount} | FAILED: {$failCount}\n";
echo "======================================================================\n";

if ($failCount > 0) exit(1);
exit(0);
