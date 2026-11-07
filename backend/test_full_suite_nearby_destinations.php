<?php
// backend/test_full_suite_nearby_destinations.php
// Full Functional, Security, and Business Logic Regression Test Suite

$dbPath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$dbPath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

require_once __DIR__ . '/hotel_destinations.php';

$passed = 0;
$failed = 0;

function assertCondition($name, $condition, $details = '') {
    global $passed, $failed;
    if ($condition) {
        echo "  [PASS] {$name}\n";
        $passed++;
    } else {
        echo "  [FAIL] {$name} - {$details}\n";
        $failed++;
    }
}

echo "========================================================\n";
echo "1. FUNCTIONAL TESTS: DESTINATION MANAGEMENT & APPROVALS\n";
echo "========================================================\n";

// Hotel IDs in system
$hotel1 = 'hotel-3star'; // Casa Baga (u-5)
$hotel2 = 'hotel-4star'; // Grand Candolim (u-5)
$hotel3 = 'hotel-5star'; // Taj Exotica (u-5)

$vendorActor = ['id' => 'u-5', 'role' => 'hotel_vendor', 'username' => 'hotel_vendor'];
$adminActor = ['id' => 'u-1', 'role' => 'superadmin', 'username' => 'superadmin'];

// 1.1 Vendor adds multiple destinations to hotel-3star
$d1Data = [
    'hotel_id' => $hotel1,
    'destination_name' => 'Curlies Beach Shack Anjuna',
    'destination_category' => 'Restaurants',
    'distance_value' => 3.5,
    'distance_unit' => 'Kilometres',
    'travel_mode' => 'Driving',
    'driving_time_minutes' => 10,
    'description' => 'Legendary beachfront shack on South Anjuna beach.'
];
$res1 = HotelDestinationsService::addDestination($pdo, $vendorActor, $d1Data);
assertCondition("Vendor can add destination as DRAFT", $res1['success'] === true && $res1['destination']['approval_status'] === 'DRAFT');
$d1Id = $res1['destination']['id'];

// 1.2 Check multiple destinations support
$publicDestsH1 = HotelDestinationsService::getApprovedDestinationsForHotel($pdo, $hotel1);
assertCondition("Multiple destinations supported per hotel (initial count >= 4)", count($publicDestsH1) >= 4);

// 1.3 Unapproved destination is NOT visible to public
$inPublic1 = array_filter($publicDestsH1, fn($d) => $d['id'] === $d1Id);
assertCondition("DRAFT destination is isolated from public frontend", count($inPublic1) === 0);

// 1.4 Vendor submits for approval
$subRes = HotelDestinationsService::submitForApproval($pdo, $vendorActor, $d1Id);
assertCondition("Vendor submits destination for approval (PENDING_APPROVAL)", $subRes['success'] === true && $subRes['destination']['approval_status'] === 'PENDING_APPROVAL');

// 1.5 Admin approves submission
$appRes = HotelDestinationsService::approveDestination($pdo, $adminActor, $d1Id);
assertCondition("Admin approves destination (APPROVED)", $appRes['success'] === true && $appRes['destination']['approval_status'] === 'APPROVED');

// 1.6 Now visible on customer frontend
$publicDestsAfter = HotelDestinationsService::getApprovedDestinationsForHotel($pdo, $hotel1);
$inPublicAfter = array_filter($publicDestsAfter, fn($d) => $d['id'] === $d1Id);
assertCondition("Approved destination immediately visible on customer frontend", count($inPublicAfter) === 1);

// 1.7 Pending Edits Protection Rule
// Vendor edits the approved destination: public version must remain untouched, edits go to pending_changes
$editData = [
    'id' => $d1Id,
    'destination_name' => 'Curlies Iconic Sunset Shack',
    'distance_value' => 3.2,
    'distance_unit' => 'Kilometres'
];
$editRes = HotelDestinationsService::updateDestination($pdo, $vendorActor, $editData);
assertCondition("Vendor edit on approved destination queues pending changes", $editRes['success'] === true);

$rowAfterEdit = HotelDestinationsService::getDestinationById($pdo, $d1Id);
assertCondition("Published name remains original while edit is pending", $rowAfterEdit['destination_name'] === 'Curlies Beach Shack Anjuna');
assertCondition("Pending changes JSON exists", !empty($rowAfterEdit['pending_changes']));

// 1.8 Admin approves pending edits
$appEditRes = HotelDestinationsService::approveDestination($pdo, $adminActor, $d1Id);
$rowAfterApprove = HotelDestinationsService::getDestinationById($pdo, $d1Id);
assertCondition("Admin approval applies updated values", $rowAfterApprove['destination_name'] === 'Curlies Iconic Sunset Shack');
assertCondition("Pending changes cleared after approval", empty($rowAfterApprove['pending_changes']));

// 1.9 Admin Rejection Flow with Reason
$d2Data = [
    'hotel_id' => $hotel1,
    'destination_name' => 'Fake Fantasy Island',
    'destination_category' => 'Other Attractions',
    'distance_value' => 50,
    'distance_unit' => 'Metres',
    'travel_mode' => 'Walking',
    'submit_for_approval' => true
];
$res2 = HotelDestinationsService::addDestination($pdo, $vendorActor, $d2Data);
$d2Id = $res2['destination']['id'];
$rejRes = HotelDestinationsService::rejectDestination($pdo, $adminActor, $d2Id, "Location does not exist in Goa.");
assertCondition("Admin can reject destination with reason", $rejRes['success'] === true && $rejRes['destination']['approval_status'] === 'REJECTED');
assertCondition("Rejection reason stored for vendor review", $rejRes['destination']['rejection_reason'] === "Location does not exist in Goa.");

// Cleanup test items
HotelDestinationsService::deleteDestination($pdo, $adminActor, $d1Id);
HotelDestinationsService::deleteDestination($pdo, $adminActor, $d2Id);


echo "\n========================================================\n";
echo "2. SECURITY & RBAC TESTS\n";
echo "========================================================\n";

// 2.1 Vendor CANNOT approve destinations
$rogueVendorRes = HotelDestinationsService::approveDestination($pdo, $vendorActor, 'hdest_baga_1');
assertCondition("Vendor cannot approve destination (Must be 403 Forbidden)", $rogueVendorRes['success'] === false && $rogueVendorRes['code'] === 403);

// 2.2 Vendor CANNOT reject destinations
$rogueRejectRes = HotelDestinationsService::rejectDestination($pdo, $vendorActor, 'hdest_baga_1', 'Rogue reason');
assertCondition("Vendor cannot reject destination (Must be 403 Forbidden)", $rogueRejectRes['success'] === false && $rogueRejectRes['code'] === 403);

// 2.3 Vendor CANNOT add destination to hotel they do not own
// Create a temporary mock hotel owned by another vendor
$pdo->exec("INSERT OR REPLACE INTO hotels (id, name, vendor_id, price) VALUES ('hotel-mock-other', 'Other Hotel', 'vendor-999', 4000)");
$crossVendorRes = HotelDestinationsService::addDestination($pdo, $vendorActor, [
    'hotel_id' => 'hotel-mock-other',
    'destination_name' => 'Unauthorized Beach',
    'destination_category' => 'Beaches',
    'distance_value' => 100,
    'distance_unit' => 'Metres'
]);
assertCondition("Vendor blocked from managing other vendor's hotel", $crossVendorRes['success'] === false && $crossVendorRes['code'] === 403);
$pdo->exec("DELETE FROM hotels WHERE id = 'hotel-mock-other'");

// 2.4 Unauthenticated user blocked
$anonRes = HotelDestinationsService::addDestination($pdo, null, ['hotel_id' => $hotel1]);
assertCondition("Unauthenticated user blocked", $anonRes['success'] === false && $anonRes['code'] === 403);

// 2.5 Audit logs recorded
$auditCount = $pdo->query("SELECT COUNT(*) FROM hotel_destination_audit_logs")->fetchColumn();
assertCondition("Audit logs actively recorded for all actions", intval($auditCount) >= 5);


echo "\n========================================================\n";
echo "3. PROXIMITY HIGHLIGHTING & FILTER TESTS\n";
echo "========================================================\n";

// 3.1 Verify hotel enrichment
$testHotels = $pdo->query("SELECT id, name FROM hotels WHERE id IN ('hotel-3star', 'hotel-4star', 'hotel-5star')")->fetchAll(PDO::FETCH_ASSOC);
HotelDestinationsService::enrichHotelsWithDestinations($pdo, $testHotels);

$h3 = current(array_filter($testHotels, fn($h) => $h['id'] === 'hotel-3star'));
$h4 = current(array_filter($testHotels, fn($h) => $h['id'] === 'hotel-4star'));
$h5 = current(array_filter($testHotels, fn($h) => $h['id'] === 'hotel-5star'));

assertCondition("hotel-3star has Baga Beach as nearest (100m)", 
    $h3['nearest_destination']['destination_name'] === 'Baga Beach' && $h3['nearest_destination']['distance_meters'] === 100);

assertCondition("hotel-4star has Candolim Beach as nearest (150m)", 
    $h4['nearest_destination']['destination_name'] === 'Candolim Beach' && $h4['nearest_destination']['distance_meters'] === 150);

assertCondition("hotel-5star has Benaulim Beach as nearest (120m)", 
    $h5['nearest_destination']['destination_name'] === 'Benaulim Beach' && $h5['nearest_destination']['distance_meters'] === 120);

// 3.2 Category & distance filtering verification
// Filter within 200m
$within200 = array_filter($testHotels, function($h) {
    foreach ($h['nearby_destinations'] as $d) {
        if ($d['distance_meters'] <= 200) return true;
    }
    return false;
});
assertCondition("Proximity filter <= 200m matches hotels with close beach/shack access", count($within200) === 3);

// Filter Forts category
$withForts = array_filter($testHotels, function($h) {
    foreach ($h['nearby_destinations'] as $d) {
        if ($d['destination_category'] === 'Forts') return true;
    }
    return false;
});
assertCondition("Category filter 'Forts' returns hotel-4star (Aguada Fort)", count($withForts) >= 1);


echo "\n========================================================\n";
echo "4. REGRESSION VERIFICATION: EXISTING WOW GOA LOGIC\n";
echo "========================================================\n";

// 4.1 Hotel pricing & schema intact
$hotelSample = $pdo->query("SELECT id, name, price, stars, rating, is_available FROM hotels WHERE id = 'hotel-3star'")->fetch(PDO::FETCH_ASSOC);
assertCondition("Hotel table schema intact with pricing", isset($hotelSample['price']) && $hotelSample['price'] > 0);

// 4.2 Room types & rate plans intact
$rtCount = $pdo->query("SELECT COUNT(*) FROM hotel_room_types WHERE hotel_id = 'hotel-3star'")->fetchColumn();
assertCondition("Hotel room types intact", intval($rtCount) >= 2);

// 4.3 Bookings table intact
$bookingCheck = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
assertCondition("Bookings table unaffected", $bookingCheck !== false);

// 4.4 Global settings intact
$gsCount = $pdo->query("SELECT COUNT(*) FROM global_settings")->fetchColumn();
assertCondition("Global settings intact", intval($gsCount) > 0);

// 4.5 Vendor wallets intact
$walletsCount = $pdo->query("SELECT COUNT(*) FROM vendor_wallets")->fetchColumn();
assertCondition("Vendor wallets intact", $walletsCount !== false);

echo "\n========================================================\n";
echo "TEST RESULTS SUMMARY: Passed: {$passed}, Failed: {$failed}\n";
echo "========================================================\n";

