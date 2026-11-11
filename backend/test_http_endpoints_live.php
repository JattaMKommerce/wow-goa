<?php
/**
 * Live HTTP Integration Test for WOW GOA Web Server (http://localhost:8000)
 */

error_reporting(E_ALL & ~E_DEPRECATED);

$baseUrl = 'http://localhost:8000/api.php';
$testsPassed = 0;
$testsFailed = 0;

function testHttp($title, $url, $method = 'GET', $data = null) {
    global $testsPassed, $testsFailed;
    
    $opts = [
        'http' => [
            'method' => $method,
            'header' => "Content-Type: application/json\r\n",
            'timeout' => 5,
            'ignore_errors' => true
        ]
    ];
    if ($data !== null) {
        $opts['http']['content'] = json_encode($data);
    }
    
    $ctx = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $ctx);
    
    $headersList = function_exists('http_get_last_response_headers') ? @http_get_last_response_headers() : (isset($http_response_header) ? $http_response_header : []);
    $code = 200;
    if (!empty($headersList) && preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headersList[0], $m)) {
        $code = intval($m[1]);
    }
    
    $json = json_decode($resp, true);
    $isJson = ($json !== null);
    
    if (($code === 200 || $code === 201) && $isJson) {
        echo "  [PASS] $title (HTTP $code, JSON Valid)\n";
        $testsPassed++;
        return $json;
    } else {
        echo "  [FAIL] $title (HTTP $code, Output: " . substr($resp, 0, 80) . ")\n";
        $testsFailed++;
        return null;
    }
}

echo "=========================================================\n";
echo "🌐 LIVE HTTP ENDPOINT VERIFICATION (http://localhost:8000)\n";
echo "=========================================================\n\n";

// 1. Health status
$st = testHttp("API Health & DB Ping", "$baseUrl?action=status");

// 2. Hotels Catalog & Proximity
$hotels = testHttp("Customer Hotels Catalog", "$baseUrl?action=hotels");
if ($hotels && is_array($hotels)) {
    $hasDests = false;
    foreach ($hotels as $h) {
        if (!empty($h['nearby_destinations'])) {
            $hasDests = true;
            break;
        }
    }
    if ($hasDests) {
        echo "    ↳ Confirmed: Hotels contain dynamic nearby_destinations array\n";
    }
}

// 3. Hotel Destinations Resource
testHttp("Hotel-3star Approved Nearby Destinations", "$baseUrl?resource=hotel_destinations&hotel_id=hotel-3star");

// 4. Vehicles Catalog
testHttp("Vehicles Inventory Catalog", "$baseUrl?action=cars");

// 5. Packages Catalog
testHttp("Holiday Packages Catalog", "$baseUrl?action=packages");

// 6. Public Reviews
testHttp("Public Customer Reviews", "$baseUrl?resource=public_reviews");

// 7. Live Booking Creation
$bkTestId = 'BK-HTTP-' . time();
$bkPayload = [
    'id' => $bkTestId,
    'name' => 'Aditya Kashyap',
    'customer_name' => 'Aditya Kashyap',
    'phone' => '9810022334',
    'customer_phone' => '9810022334',
    'email' => 'aditya@example.com',
    'customer_email' => 'aditya@example.com',
    'pickup_loc' => 'Panaji, Goa',
    'pickup_date' => date('Y-m-d', strtotime('+1 day')),
    'drop_date' => date('Y-m-d', strtotime('+3 days')),
    'item_id' => 'hotel-3star',
    'item_name' => 'Casa Baga Resort',
    'type' => 'hotel',
    'total_amount' => 12050,
    'amount_paid' => 12050,
    'total_paid' => 12050,
    'status' => 'Confirmed'
];
$bkRes = testHttp("Live Booking Creation API", "$baseUrl?action=book", 'POST', $bkPayload);

// Clean up live test booking
if ($bkRes && !empty($bkRes['id'])) {
    try {
        $dbPath = __DIR__ . '/database.sqlite';
        $pdo = new PDO("sqlite:$dbPath");
        $pdo->prepare("DELETE FROM bookings WHERE id = ?")->execute([$bkRes['id']]);
        echo "    ↳ Test booking #{$bkRes['id']} cleaned up successfully\n";
    } catch (Exception $e) {}
}

echo "\n=========================================================\n";
echo "HTTP TESTS SUMMARY: Passed: $testsPassed | Failed: $testsFailed\n";
echo "=========================================================\n";
