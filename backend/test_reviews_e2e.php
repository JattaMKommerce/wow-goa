<?php
// Comprehensive Review & Rating End-to-End Backend Verification

$baseUrl = 'http://localhost:8000/api.php';
$testsPassed = 0;
$testsFailed = 0;

function assertTest($condition, $message) {
    global $testsPassed, $testsFailed;
    if ($condition) {
        echo "✅ PASS: $message\n";
        $testsPassed++;
    } else {
        echo "❌ FAIL: $message\n";
        $testsFailed++;
    }
}

function apiCall($url, $method = 'GET', $data = null, $headers = []) {
    $headerLines = ["Content-Type: application/json"];
    foreach ($headers as $k => $v) {
        $headerLines[] = "$k: $v";
    }
    
    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headerLines) . "\r\n",
            'ignore_errors' => true,
            'timeout' => 5
        ]
    ];
    
    if ($data !== null) {
        $opts['http']['content'] = is_string($data) ? $data : json_encode($data);
    }
    
    $context = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $context);
    
    $headersList = function_exists('http_get_last_response_headers') ? @http_get_last_response_headers() : (isset($http_response_header) ? $http_response_header : []);
    $httpCode = 200;
    if (!empty($headersList)) {
        if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headersList[0], $m)) {
            $httpCode = intval($m[1]);
        }
    }
    
    return [
        'code' => $httpCode,
        'body' => json_decode($resp, true) ?: $resp,
        'raw' => $resp
    ];
}

$pdo = new PDO("sqlite:" . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "====================================================\n";
echo "WOW GOA REVIEW SYSTEM — END-TO-END QA TEST SUITE\n";
echo "====================================================\n\n";

// Setup test fixtures in database
$testPendingId = 'BK-TEST-PENDING-' . time();
$testConfirmedId = 'BK-TEST-CONFIRMED-' . time();
$testCancelledId = 'BK-TEST-CANCELLED-' . time();
$testCompleted1 = 'BK-TEST-COMP-1-' . time();
$testCompleted2 = 'BK-TEST-COMP-2-' . time();
$testCompleted3 = 'BK-TEST-COMP-3-' . time();

$customerPhone = '9991112233';
$customerEmail = 'alice@example.com';
$otherPhone = '8880001122';

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testPendingId, 'Alice Tester', $customerPhone, $customerEmail, 'Test Scooter', 'bike', 'Pending', 1200]);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testConfirmedId, 'Alice Tester', $customerPhone, $customerEmail, 'Test Sedan', 'car', 'Confirmed', 2500]);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testCancelledId, 'Alice Tester', $customerPhone, $customerEmail, 'Test SUV', 'car', 'Cancelled', 3500]);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testCompleted1, 'Alice Tester', $customerPhone, $customerEmail, 'Mahindra Thar 4x4', 'vehicle', 'Completed', 4500]);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testCompleted2, 'Alice Tester', $customerPhone, $customerEmail, 'Royal Enfield GT 650', 'vehicle', 'Completed', 1800]);

$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
    ->execute([$testCompleted3, 'Alice Tester', $customerPhone, $customerEmail, 'Goa Beach Resort Package', 'package', 'Completed', 15000]);

// Clean up any test reviews if any existed
$pdo->prepare("DELETE FROM customer_reviews WHERE booking_id IN (?, ?, ?, ?, ?, ?)")
    ->execute([$testPendingId, $testConfirmedId, $testCancelledId, $testCompleted1, $testCompleted2, $testCompleted3]);

// 1. Check eligible bookings for Alice
$resEligible = apiCall($baseUrl . "?resource=eligible_review_bookings&phone=$customerPhone");
assertTest($resEligible['code'] === 200, "Eligible bookings endpoint returns HTTP 200");
$bIds = array_column($resEligible['body']['bookings'] ?? [], 'id');
assertTest(in_array($testCompleted1, $bIds) && in_array($testCompleted2, $bIds) && in_array($testCompleted3, $bIds), "Eligible bookings contains only completed bookings ($testCompleted1, $testCompleted2, $testCompleted3)");
assertTest(!in_array($testPendingId, $bIds), "Eligible bookings DOES NOT include Pending booking ($testPendingId)");
assertTest(!in_array($testConfirmedId, $bIds), "Eligible bookings DOES NOT include Confirmed booking ($testConfirmedId)");
assertTest(!in_array($testCancelledId, $bIds), "Eligible bookings DOES NOT include Cancelled booking ($testCancelledId)");

// 2. Test Booking Completion Trigger: Attempt to review a Pending booking
$resPending = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testPendingId,
    'rating' => 5,
    'review_text' => 'Should fail because pending',
    'customer_phone' => $customerPhone
]);
assertTest($resPending['code'] === 400, "Reviewing Pending booking rejected with HTTP 400");
assertTest(strpos(json_encode($resPending['body']), 'Only completed bookings') !== false, "Error message confirms only completed bookings can be reviewed");

// 3. Test Booking Completion Trigger: Attempt to review a Confirmed booking
$resConfirmed = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testConfirmedId,
    'rating' => 4,
    'review_text' => 'Should fail because confirmed',
    'customer_phone' => $customerPhone
]);
assertTest($resConfirmed['code'] === 400, "Reviewing Confirmed booking rejected with HTTP 400");

// 4. Test Booking Completion Trigger: Attempt to review a Cancelled booking
$resCancelled = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCancelledId,
    'rating' => 1,
    'review_text' => 'Should fail because cancelled',
    'customer_phone' => $customerPhone
]);
assertTest($resCancelled['code'] === 400, "Reviewing Cancelled booking rejected with HTTP 400");

// 5. Test Unauthorized review: Different customer tries to review Alice's booking
$resUnauth = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted1,
    'rating' => 5,
    'review_text' => 'Impersonating Alice',
    'customer_phone' => $otherPhone
]);
assertTest($resUnauth['code'] === 403, "Reviewing another customer's booking rejected with HTTP 403");

// 6. Test Rating validation (0 stars or 6 stars)
$resInvalid0 = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted1,
    'rating' => 0,
    'customer_phone' => $customerPhone
]);
assertTest($resInvalid0['code'] === 400, "Rating 0 stars rejected with HTTP 400");

$resInvalid6 = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted1,
    'rating' => 6,
    'customer_phone' => $customerPhone
]);
assertTest($resInvalid6['code'] === 400, "Rating 6 stars rejected with HTTP 400");

// 7. Successful Review Submission 1: 5-star review on $testCompleted1
$resSubmit1 = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted1,
    'rating' => 5,
    'review_text' => 'Absolutely amazing Thar experience in Goa! Perfectly maintained vehicle.',
    'customer_phone' => $customerPhone,
    'customer_name' => 'Alice Tester'
]);
assertTest($resSubmit1['code'] === 200, "5-star review submitted successfully with HTTP 200");
assertTest(!empty($resSubmit1['body']['review_id']), "Review ID returned: " . ($resSubmit1['body']['review_id'] ?? ''));

// 8. Test Duplicate Protection: Alice cannot review $testCompleted1 again
$resDup = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted1,
    'rating' => 5,
    'review_text' => 'Trying to submit duplicate',
    'customer_phone' => $customerPhone
]);
assertTest($resDup['code'] === 400, "Duplicate review for same completed booking rejected with HTTP 400");
assertTest(strpos(json_encode($resDup['body']), 'already been submitted') !== false, "Error message confirms multiple reviews are prevented");

// 9. Successful Review Submission 2: 1-star review on $testCompleted2
$resSubmit2 = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted2,
    'rating' => 1,
    'review_text' => 'Disappointing delivery time for the bike.',
    'customer_phone' => $customerPhone,
    'customer_name' => 'Alice Tester'
]);
assertTest($resSubmit2['code'] === 200, "1-star review submitted successfully with HTTP 200");

// 10. Successful Review Submission 3: 4-star review on $testCompleted3
$resSubmit3 = apiCall($baseUrl . "?action=submit_customer_review", 'POST', [
    'booking_id' => $testCompleted3,
    'rating' => 4,
    'review_text' => 'Great Goa package overall, hotel was great.',
    'customer_phone' => $customerPhone,
    'customer_name' => 'Alice Tester'
]);
assertTest($resSubmit3['code'] === 200, "4-star review submitted successfully with HTTP 200");

// 11. Verify Eligible bookings now excludes all 3 reviewed bookings
$resEligibleAfter = apiCall($baseUrl . "?resource=eligible_review_bookings&phone=$customerPhone");
$bIdsAfter = array_column($resEligibleAfter['body']['bookings'] ?? [], 'id');
assertTest(!in_array($testCompleted1, $bIdsAfter), "$testCompleted1 no longer eligible after review");
assertTest(!in_array($testCompleted2, $bIdsAfter), "$testCompleted2 no longer eligible after review");
assertTest(!in_array($testCompleted3, $bIdsAfter), "$testCompleted3 no longer eligible after review");

// 12. Public Reviews Display: Strictly Ordered 5★ -> 4★ -> 3★ -> 2★ -> 1★
$resPublic = apiCall($baseUrl . "?resource=public_reviews");
assertTest($resPublic['code'] === 200, "Public reviews endpoint returns HTTP 200");
$pubList = $resPublic['body']['reviews'] ?? [];
assertTest(count($pubList) >= 3, "Public reviews returned at least 3 reviews");

$ratings = array_column($pubList, 'rating');
$isSortedDesc = true;
for ($i = 0; $i < count($ratings) - 1; $i++) {
    if ($ratings[$i] < $ratings[$i + 1]) {
        $isSortedDesc = false;
        break;
    }
}
assertTest($isSortedDesc, "Public reviews strictly ordered: 5-Star first, then 4-Star, 3-Star, 2-Star, 1-Star (Ratings: " . implode(', ', $ratings) . ")");

// 13. Public Reviews Privacy: No phone or email exposed
$hasLeakedData = false;
foreach ($pubList as $rev) {
    if (isset($rev['phone']) || isset($rev['customer_phone']) || isset($rev['email']) || isset($rev['customer_email'])) {
        $hasLeakedData = true;
        break;
    }
    if (strpos(json_encode($rev), $customerPhone) !== false || strpos(json_encode($rev), $customerEmail) !== false) {
        $hasLeakedData = true;
        break;
    }
}
assertTest(!$hasLeakedData, "Public reviews strictly NEVER expose customer phone or email");

// 14. Vendor Access Restriction: Vendor cannot access reviews
$resVendor = apiCall($baseUrl . "?resource=admin_reviews", 'GET', null, ['X-User-Role' => 'vendor']);
assertTest($resVendor['code'] === 403, "Vendor access to review dashboard rejected with HTTP 403");

$resHotelVendor = apiCall($baseUrl . "?resource=admin_reviews", 'GET', null, ['X-User-Role' => 'hotel_vendor']);
assertTest($resHotelVendor['code'] === 403, "Hotel vendor access to review dashboard rejected with HTTP 403");

// 15. Admin & Super Admin Dynamic Dashboard: Real dynamic counts
$resAdmin = apiCall($baseUrl . "?resource=admin_reviews", 'GET', null, ['X-User-Role' => 'admin']);
assertTest($resAdmin['code'] === 200, "Admin access to review dashboard returns HTTP 200");
$stats = $resAdmin['body']['stats'] ?? [];
assertTest(isset($stats['total_reviews']) && $stats['total_reviews'] >= 3, "Admin stats total_reviews is dynamic count (>= 3, got: {$stats['total_reviews']})");
assertTest(isset($stats['star_5']) && $stats['star_5'] >= 1, "Admin stats star_5 dynamically counted (>= 1, got: {$stats['star_5']})");
assertTest(isset($stats['star_4']) && $stats['star_4'] >= 1, "Admin stats star_4 dynamically counted (>= 1, got: {$stats['star_4']})");
assertTest(isset($stats['star_1']) && $stats['star_1'] >= 1, "Admin stats star_1 dynamically counted (>= 1, got: {$stats['star_1']})");
assertTest(isset($stats['average_rating']), "Admin stats average_rating dynamically calculated: {$stats['average_rating']} ⭐");

// 16. Immutability: Verify no action exists to edit reviews or change ratings
$resEdit = apiCall($baseUrl . "?action=update_review", 'POST', ['id' => $resSubmit1['body']['review_id'], 'rating' => 1]);
assertTest($resEdit['code'] !== 200 || !isset($resEdit['body']['success']) || $resEdit['body']['success'] !== true, "Editing reviews is not supported (immutability preserved)");

// Clean up test data
$pdo->prepare("DELETE FROM customer_reviews WHERE booking_id IN (?, ?, ?, ?, ?, ?)")
    ->execute([$testPendingId, $testConfirmedId, $testCancelledId, $testCompleted1, $testCompleted2, $testCompleted3]);
$pdo->prepare("DELETE FROM bookings WHERE id IN (?, ?, ?, ?, ?, ?)")
    ->execute([$testPendingId, $testConfirmedId, $testCancelledId, $testCompleted1, $testCompleted2, $testCompleted3]);

echo "\n====================================================\n";
echo "TEST RESULTS: $testsPassed Passed, $testsFailed Failed\n";
echo "====================================================\n";
