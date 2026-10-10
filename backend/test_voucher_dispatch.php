<?php
/**
 * WOW GOA — Booking Voucher Delivery Test Utility (Email & WhatsApp)
 * 
 * Usage:
 *   php test_voucher_dispatch.php [booking_id] [recipient_email] [customer_phone]
 * 
 * Example:
 *   php test_voucher_dispatch.php TG-647409 myemail@gmail.com 9876543210
 */

require_once __DIR__ . '/vendor_storefront_actions.php';

$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$targetBookingId = $argv[1] ?? null;
$targetEmail = $argv[2] ?? 'test@gmail.com';
$targetPhone = $argv[3] ?? '9876543210';

if ($targetBookingId) {
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
    $stmt->execute([ltrim($targetBookingId, '#'), $targetBookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
} else {
    // Get latest booking
    $stmt = $pdo->query("SELECT * FROM bookings ORDER BY rowid DESC LIMIT 1");
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
}

if (!$booking) {
    echo "❌ No booking found to test.\n";
    exit(1);
}

$bId = $booking['id'];
$cName = $booking['name'] ?? ($booking['customer_name'] ?? 'Valued Customer');
$phone = $targetPhone ?: ($booking['phone'] ?? '9876543210');
$itemName = $booking['item_name'] ?? ($booking['hotel_name'] ?? ($booking['vehicle_name'] ?? 'Reservation'));
$total = number_format(floatval($booking['total_amount'] ?? 0), 2);
$dates = ($booking['check_in_date'] ?? $booking['pickup_date'] ?? 'Scheduled') . ' to ' . ($booking['check_out_date'] ?? $booking['drop_date'] ?? 'Scheduled');

echo "=================================================================\n";
echo "🎟️ WOW GOA — BOOKING VOUCHER DELIVERY TEST\n";
echo "=================================================================\n";
echo "Booking ID   : #$bId\n";
echo "Customer     : $cName\n";
echo "Phone        : $phone\n";
echo "Item / Stay  : $itemName\n";
echo "Dates        : $dates\n";
echo "Total Amount : ₹$total\n";
echo "=================================================================\n\n";

// ─────────────────────────────────────────────────────────────────
// 1. TEST GMAIL / EMAIL VOUCHER DISPATCH
// ─────────────────────────────────────────────────────────────────
echo "📧 [1/2] TESTING GMAIL / EMAIL VOUCHER DISPATCH...\n";
$emailRes = dispatchBookingVoucherEmail($pdo, $bId, $targetEmail);

if ($emailRes['success']) {
    echo "  ✓ Email function executed successfully!\n";
    echo "  ✓ Recipient: {$emailRes['recipient']}\n";
    echo "  ✓ Sent timestamp: {$emailRes['sent_at']}\n";
    echo "  ✓ Logged to: backend/uploads/voucher_emails.log\n";
    echo "  ✓ HTML preview saved to: backend/uploads/last_voucher_email.html\n";
    echo "  🌐 Preview URL: http://localhost:8000/uploads/last_voucher_email.html\n";
} else {
    echo "  ❌ Email dispatch failed: " . ($emailRes['error'] ?? 'Unknown error') . "\n";
}

echo "\n";

// ─────────────────────────────────────────────────────────────────
// 2. TEST WHATSAPP VOUCHER DISPATCH
// ─────────────────────────────────────────────────────────────────
echo "💬 [2/2] TESTING WHATSAPP VOUCHER LINK GENERATION...\n";

$cleanPhone = preg_replace('/\D/', '', $phone);
$waPhone = strlen($cleanPhone) === 10 ? '91' . $cleanPhone : $cleanPhone;

$waText = 
    "🎟️ *WOW GOA — OFFICIAL BOOKING VOUCHER*\n\n" .
    "*Booking ID:* #{$bId}\n" .
    "*Customer:* {$cName}\n" .
    "*Service / Stay:* {$itemName}\n" .
    "*Schedule:* {$dates}\n" .
    "*Total Amount:* ₹{$total}\n" .
    "*Booking Status:* " . ($booking['status'] ?? 'Confirmed') . "\n\n" .
    "Track your booking live or download your official A4 Voucher PDF:\n" .
    "http://localhost:5173/customer\n\n" .
    "*WOW GOA Rentals & Stays* • 24x7 Helpline: +91 9916933476";

$waUrl = "https://wa.me/{$waPhone}?text=" . rawurlencode($waText);

echo "  ✓ WhatsApp direct link generated!\n";
echo "  ✓ Recipient Phone: +$waPhone\n";
echo "  📲 WhatsApp Link (click to test):\n";
echo "     $waUrl\n\n";
echo "  📝 WhatsApp Message Body:\n";
echo "-----------------------------------------------------------------\n";
echo $waText . "\n";
echo "-----------------------------------------------------------------\n\n";

echo "=================================================================\n";
echo "✅ TEST COMPLETE!\n";
echo "1. To view the Email Voucher visually, open:\n";
echo "   http://localhost:8000/uploads/last_voucher_email.html\n\n";
echo "2. To view the log of sent emails:\n";
echo "   backend/uploads/voucher_emails.log\n\n";
echo "3. To test WhatsApp sending, paste the WhatsApp link above into your browser.\n";
echo "=================================================================\n";
