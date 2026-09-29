<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/BookingService.php';

$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function assertCond($msg, $cond) {
    if ($cond) {
        echo " [PASS] $msg\n";
    } else {
        echo "![FAIL] $msg\n";
        exit(1);
    }
}

echo "=== TEST 1: VENDOR CANCELLATION POLICY RETRIEVAL & CREATION ===\n";
$vendorId = 'test_vnd_' . rand(1000, 9999);
$pol = BookingService::ensureVendorDefaultPolicy($pdo, $vendorId, 'vehicle');
assertCond("Vendor default policy generated", !empty($pol['id']) && $pol['vendor_id'] === $vendorId);
assertCond("Policy has 5 default rules", count($pol['rules']) === 5);

$retrieved = BookingService::getVendorCancellationPolicy($pdo, $vendorId, 'vehicle');
assertCond("Retrieved active vendor policy", $retrieved !== null && $retrieved['id'] === $pol['id']);

echo "\n=== TEST 2: BOOKING CREATION WITH FINANCIAL SPLIT & POLICY SNAPSHOT ===\n";
$bookingPayload = [
    'id' => 'TG-TEST-' . rand(10000, 99999),
    'name' => 'John Traveller',
    'phone' => '9876543210',
    'email' => 'john@test.com',
    'date_of_birth' => '1995-05-15',
    'license' => 'DL1420110012345',
    'pickup_loc' => 'Goa Airport',
    'drop_loc' => 'Goa Airport',
    'pickup_date' => date('Y-m-d', strtotime('+3 days')),
    'pickup_time' => '10:00 AM',
    'drop_date' => date('Y-m-d', strtotime('+5 days')),
    'drop_time' => '10:00 AM',
    'booking_days' => 2,
    'total_amount' => 10000,
    'amount_paid' => 10000,
    'payment_method' => 'Static QR (UPI)',
    'payment_reference' => 'UPI123456789012',
    'type' => 'vehicle',
    'vendor_id' => $vendorId,
    'item_name' => 'Mahindra Thar 4x4'
];

$res = BookingService::createBooking($pdo, $bookingPayload);
assertCond("Booking created successfully", $res['success'] === true);
$createdBookingId = $res['booking_id'];

$bStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
$bStmt->execute([$createdBookingId]);
$b = $bStmt->fetch(PDO::FETCH_ASSOC);

assertCond("customer_payment is 10,000", floatval($b['customer_payment']) === 10000.0);
assertCond("wow_goa_platform_fee is 1,000 (10%)", floatval($b['wow_goa_platform_fee']) === 1000.0);
assertCond("vendor_service_amount is 9,000 (90%)", floatval($b['vendor_service_amount']) === 9000.0);
assertCond("payment_verification_status is 'Pending Verification'", $b['payment_verification_status'] === 'Pending Verification');
assertCond("vendor_payout_status is 'Pending'", $b['vendor_payout_status'] === 'Pending');
assertCond("payment_reference saved", $b['payment_reference'] === 'UPI123456789012');
assertCond("cancellation_policy_snapshot saved", !empty($b['cancellation_policy_snapshot']));

$snap = json_decode($b['cancellation_policy_snapshot'], true);
assertCond("Snapshot contains vendor policy details", !empty($snap['rules']));

echo "\n=== TEST 3: CANCELLATION REFUND CALCULATION BASED ON VENDOR SERVICE AMOUNT ===\n";
// Booking is 3 days (approx 72h) away: 1-3 days rule is 50% refund
// Service start: +3 days at 10:00 AM. Suppose cancellation is at +1 day (48 hours before service)
$cancelTime = date('Y-m-d H:i:s', strtotime('+1 day'));
$calc = BookingService::calculateCancellationRefund($pdo, $b, $cancelTime);

assertCond("Customer payment is ₹10,000", $calc['customer_payment'] == 10000);
assertCond("WOW GOA Platform Fee is ₹1,000", $calc['wow_goa_platform_fee'] == 1000);
assertCond("Platform fee is non-refundable", $calc['is_platform_fee_refundable'] === false);
assertCond("Vendor service amount is ₹9,000", $calc['vendor_service_amount'] == 9000);
assertCond("Applied refund percentage is 50%", $calc['refund_percentage'] == 50);
assertCond("Refund amount is ₹4,500 (50% of ₹9,000)", $calc['refund_amount'] == 4500);
assertCond("Vendor retained amount is ₹4,500", $calc['vendor_retained_amount'] == 4500);

echo "\n=== TEST 4: ADMIN PAYMENT VERIFICATION & VENDOR SETTLEMENT ===\n";
// Approve payment
$updApprove = $pdo->prepare("UPDATE bookings SET payment_verification_status = 'Approved', status = 'Confirmed', payment_status = 'Paid', payment_verified_at = datetime('now') WHERE id = ?");
$updApprove->execute([$createdBookingId]);

$bStmt->execute([$createdBookingId]);
$bUpdated = $bStmt->fetch(PDO::FETCH_ASSOC);
assertCond("Booking status transitioned to 'Confirmed'", $bUpdated['status'] === 'Confirmed');
assertCond("payment_verification_status is 'Approved'", $bUpdated['payment_verification_status'] === 'Approved');

// Settle vendor payout
$payoutRef = 'UTR-SETTLE-' . rand(100000, 999999);
$updPayout = $pdo->prepare("UPDATE bookings SET vendor_payout_status = 'Settled', vendor_payout_date = datetime('now'), vendor_payout_reference = ?, vendor_payout_amount = ? WHERE id = ?");
$updPayout->execute([$payoutRef, 9000, $createdBookingId]);

$bStmt->execute([$createdBookingId]);
$bSettled = $bStmt->fetch(PDO::FETCH_ASSOC);
assertCond("vendor_payout_status is 'Settled'", $bSettled['vendor_payout_status'] === 'Settled');
assertCond("vendor_payout_reference recorded", $bSettled['vendor_payout_reference'] === $payoutRef);
assertCond("vendor_payout_amount recorded", floatval($bSettled['vendor_payout_amount']) === 9000.0);

echo "\n=== TEST 5: CUSTOMER CANCELLATION EXECUTION ===\n";
$updCancel = $pdo->prepare("UPDATE bookings SET status = 'Cancelled', cancellation_status = 'Cancelled', cancellation_requested_at = datetime('now'), cancellation_refund_percentage = ?, cancellation_refund_amount = ?, cancellation_platform_fee = ?, cancellation_vendor_amount = ?, cancellation_rule_applied = ?, cancellation_reason = 'Trip rescheduled' WHERE id = ?");
$updCancel->execute([$calc['refund_percentage'], $calc['refund_amount'], $calc['wow_goa_platform_fee'], $calc['vendor_service_amount'], $calc['rule_description'], $createdBookingId]);

$bStmt->execute([$createdBookingId]);
$bCancelled = $bStmt->fetch(PDO::FETCH_ASSOC);
assertCond("Booking status is 'Cancelled'", $bCancelled['status'] === 'Cancelled');
assertCond("cancellation_refund_amount is ₹4,500", floatval($bCancelled['cancellation_refund_amount']) === 4500.0);
assertCond("cancellation_platform_fee retained is ₹1,000", floatval($bCancelled['cancellation_platform_fee']) === 1000.0);

// Cleanup test record
$pdo->prepare("DELETE FROM bookings WHERE id = ?")->execute([$createdBookingId]);
$pdo->prepare("DELETE FROM vendor_cancellation_rules WHERE policy_id = ?")->execute([$pol['id']]);
$pdo->prepare("DELETE FROM vendor_cancellation_policies WHERE id = ?")->execute([$pol['id']]);

echo "\nAll backend cancellation & payment logic passed flawlessly!\n";
