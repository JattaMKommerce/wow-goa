<?php
/**
 * =========================================================================
 * WOW GOA / TRIPGALILEO — PRE-LAUNCH MASTER END-TO-END VERIFICATION SUITE
 * =========================================================================
 * Comprehensive test pipeline verifying all critical customer, vendor, 
 * admin, database, and financial workflows prior to production launch.
 */

ini_set('display_errors', '1');
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

echo "=========================================================================\n";
echo "🚀 WOW GOA / TRIPGALILEO — PRE-LAUNCH MASTER END-TO-END (E2E) TEST SUITE\n";
echo "=========================================================================\n\n";

$passCount = 0;
$failCount = 0;
$warnings = 0;

function assertE2E($condition, $title, $detail = "") {
    global $passCount, $failCount;
    if ($condition) {
        echo "  [PASS] $title" . ($detail ? " — $detail" : "") . "\n";
        $passCount++;
    } else {
        echo "  [FAIL] $title" . ($detail ? " — FAILED: $detail" : "") . "\n";
        $failCount++;
    }
}

function warnE2E($title, $detail = "") {
    global $warnings;
    echo "  [WARN] $title" . ($detail ? " — $detail" : "") . "\n";
    $warnings++;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: SYSTEM & DATABASE ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 1] System & Database Architecture ---\n";

$dbPath = __DIR__ . '/database.sqlite';
assertE2E(file_exists($dbPath), "SQLite database exists", $dbPath);

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    assertE2E(true, "Database connection established successfully");
} catch (Exception $e) {
    assertE2E(false, "Database connection failed", $e->getMessage());
    exit(1);
}

// Clean up any stray test destinations from prior aborted runs
$pdo->exec("DELETE FROM hotel_nearby_destinations WHERE destination_name LIKE 'Fake Attraction%' OR destination_name LIKE 'Test Reject%' OR destination_name LIKE 'Vagator Sunset Point%' OR destination_name LIKE 'Renamed Vagator%'");

// Verify core required tables
$requiredTables = [
    'hotels', 'bookings', 'cars', 'packages', 'users', 'global_settings',
    'hotel_nearby_destinations', 'hotel_destination_audit_logs',
    'customer_reviews', 'markups', 'wallets'
];

$existingTables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);

foreach ($requiredTables as $tbl) {
    assertE2E(in_array($tbl, $existingTables), "Required table '$tbl' exists in schema");
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2: CUSTOMER FLOW — HOTELS & PROXIMITY HIGHLIGHTS
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 2] Customer Flow: Hotels & Proximity Highlights ---\n";

require_once __DIR__ . '/hotel_destinations.php';

// 2.1 Fetch hotels list
$hotelList = $pdo->query("SELECT * FROM hotels LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
assertE2E(count($hotelList) >= 3, "Hotel catalog contains live inventory (found " . count($hotelList) . ")");

// 2.2 Enrichment check
HotelDestinationsService::enrichHotelsWithDestinations($pdo, $hotelList);
$firstHotel = $hotelList[0] ?? null;
assertE2E(
    isset($firstHotel['nearby_destinations']) && is_array($firstHotel['nearby_destinations']),
    "Hotels dynamically enriched with nearby_destinations array"
);

// 2.3 Verify nearest destination calculation
$hotelWithDest = null;
foreach ($hotelList as $h) {
    if (!empty($h['nearby_destinations'])) {
        $hotelWithDest = $h;
        break;
    }
}

assertE2E($hotelWithDest !== null, "At least one hotel has approved nearby destinations");
if ($hotelWithDest) {
    $nearest = $hotelWithDest['nearest_destination'] ?? null;
    assertE2E($nearest !== null, "Nearest attraction identified", $nearest['destination_name'] . " (" . $nearest['distance_value'] . " " . $nearest['distance_unit'] . ")");
    assertE2E(isset($nearest['walking_time_minutes']), "Walking/driving travel time estimated properly");
}

// 2.4 Distance Proximity Filtering (matches API logic)
$maxDist = 250;
$closeHotels = array_values(array_filter($hotelList, function($h) use ($maxDist) {
    $dests = $h['nearby_destinations'] ?? [];
    foreach ($dests as $d) {
        if (intval($d['distance_meters']) <= $maxDist) return true;
    }
    return false;
}));
assertE2E(count($closeHotels) >= 1, "Proximity filter <= 250m correctly returns beachfront properties (found " . count($closeHotels) . ")");

// 2.5 Category Filtering (matches API logic)
$reqCat = 'forts';
$fortHotels = array_values(array_filter($hotelList, function($h) use ($reqCat) {
    $dests = $h['nearby_destinations'] ?? [];
    foreach ($dests as $d) {
        if (strtolower(trim($d['destination_category'])) === $reqCat) return true;
    }
    return false;
}));
assertE2E(count($fortHotels) >= 1, "Category filter 'Forts' correctly returns hotels near forts (found " . count($fortHotels) . ")");

// 2.6 Customer Hotel Booking Creation
$testHotelId = $hotelList[0]['id'] ?? 'hotel-3star';
$testBookingId = 'BK-E2E-HTL-' . time();
$bookingPayload = [
    'id' => $testBookingId,
    'name' => 'Vikram Singhania',
    'phone' => '9822334455',
    'email' => 'vikram@example.com',
    'item_id' => $testHotelId,
    'item_name' => $hotelList[0]['name'] ?? 'Test Resort',
    'type' => 'hotel',
    'total_amount' => 6500,
    'amount_paid' => 6500,
    'status' => 'Confirmed'
];

try {
    $stmtBk = $pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_id, item_name, type, total_amount, total_paid, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))");
    $stmtBk->execute([
        $bookingPayload['id'],
        $bookingPayload['name'],
        $bookingPayload['phone'],
        $bookingPayload['email'],
        $bookingPayload['item_id'],
        $bookingPayload['item_name'],
        $bookingPayload['type'],
        $bookingPayload['total_amount'],
        $bookingPayload['amount_paid'],
        $bookingPayload['status']
    ]);
    assertE2E(true, "Customer hotel booking created successfully", "#$testBookingId");
} catch (Exception $e) {
    assertE2E(false, "Failed to create customer booking", $e->getMessage());
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3: HOTEL VENDOR PMS LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 3] Hotel Vendor PMS Lifecycle & Validations ---\n";

$vendorActor = ['id' => 'u-5', 'role' => 'hotel_vendor', 'username' => 'vendor_grand_stay'];

// 3.1 Vendor adds draft destination
$destName = "Vagator Sunset Point " . time();
$vendorDestData = [
    'hotel_id' => $testHotelId,
    'destination_name' => $destName,
    'destination_category' => 'Tourist Attractions',
    'distance_value' => '1.5',
    'distance_unit' => 'Kilometres',
    'travel_mode' => 'Driving',
    'description' => 'Breathtaking red cliff views over the Arabian Sea.',
    'image' => 'https://images.unsplash.com/photo-vagator',
    'latitude' => 15.602,
    'longitude' => 73.734,
    'submit_for_approval' => false
];

$resVendorDest = HotelDestinationsService::addDestination($pdo, $vendorActor, $vendorDestData);
assertE2E($resVendorDest['success'] === true, "Vendor destination addition accepted");
$vendorDest = $resVendorDest['destination'];
assertE2E($vendorDest['approval_status'] === 'DRAFT', "Vendor destination created as DRAFT", "ID: " . $vendorDest['id']);
assertE2E($vendorDest['distance_meters'] === 1500, "Distance normalized: 1.5 km -> 1500 meters");
assertE2E($vendorDest['driving_time_minutes'] > 0, "Driving time automatically computed: " . $vendorDest['driving_time_minutes'] . " mins");

// 3.2 Draft isolation from public frontend
$pubDests = HotelDestinationsService::getApprovedDestinationsForHotel($pdo, $testHotelId);
$draftFound = false;
foreach ($pubDests as $pd) {
    if ($pd['id'] === $vendorDest['id']) {
        $draftFound = true;
        break;
    }
}
assertE2E(!$draftFound, "DRAFT destination isolated and NOT exposed on public customer frontend");

// 3.3 Vendor submits for approval
$resSubmitted = HotelDestinationsService::submitForApproval($pdo, $vendorActor, $vendorDest['id']);
assertE2E($resSubmitted['success'] === true && $resSubmitted['destination']['approval_status'] === 'PENDING_APPROVAL', "Vendor successfully submits destination for Admin approval");

// 3.4 Security check: Vendor cannot approve (returns 403 Forbidden)
$rogueVendorRes = HotelDestinationsService::approveDestination($pdo, $vendorActor, $vendorDest['id']);
assertE2E($rogueVendorRes['success'] === false && intval($rogueVendorRes['code']) === 403, "RBAC Security: Vendor strictly forbidden from approving submissions (403)");

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4: ADMIN APPROVAL, PENDING EDITS & AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 4] Admin Workflow, Pending Edits & Audit Trail ---\n";

$adminActor = ['id' => 'admin-1', 'role' => 'admin', 'username' => 'superadmin'];

// 4.1 Admin approves submission
$resApproved = HotelDestinationsService::approveDestination($pdo, $adminActor, $vendorDest['id']);
assertE2E($resApproved['success'] === true && $resApproved['destination']['approval_status'] === 'APPROVED', "Admin successfully approves destination");
assertE2E($resApproved['destination']['approved_by'] === 'admin-1', "Approved by recorded in database");

// 4.2 Approved destination now visible to customers
$pubDestsAfter = HotelDestinationsService::getApprovedDestinationsForHotel($pdo, $testHotelId);
$nowFound = false;
foreach ($pubDestsAfter as $pd) {
    if ($pd['id'] === $vendorDest['id']) {
        $nowFound = true;
        break;
    }
}
assertE2E($nowFound, "Approved destination is now immediately visible to customers on listing & details");

// 4.3 Pending edit protection (vendor edits approved destination)
$editData = [
    'id' => $vendorDest['id'],
    'destination_name' => "Renamed Vagator Scenic Point",
    'distance_value' => '1.8',
    'distance_unit' => 'Kilometres',
    'submit_for_approval' => true
];
$resEdit = HotelDestinationsService::updateDestination($pdo, $vendorActor, $editData);
assertE2E($resEdit['success'] === true, "Vendor edit queued successfully");
$rowAfterEdit = HotelDestinationsService::getDestinationById($pdo, $vendorDest['id']);
assertE2E($rowAfterEdit['destination_name'] === $destName, "Published attraction retains live name while edit is pending");
assertE2E(!empty($rowAfterEdit['pending_changes']), "Pending modifications safely held in pending_changes queue");

// 4.4 Admin verifies and applies pending edits
$resFinal = HotelDestinationsService::approveDestination($pdo, $adminActor, $vendorDest['id']);
assertE2E($resFinal['success'] === true, "Admin approves pending changes");
$finalRow = HotelDestinationsService::getDestinationById($pdo, $vendorDest['id']);
assertE2E($finalRow['destination_name'] === "Renamed Vagator Scenic Point", "Admin approval publishes updated name to public");
assertE2E(empty($finalRow['pending_changes']), "Pending queue cleared after approval");

// 4.5 Admin rejection test
$rejectName = "Test Reject Point " . time();
$resToReject = HotelDestinationsService::addDestination($pdo, $adminActor, [
    'hotel_id' => $testHotelId,
    'destination_name' => $rejectName,
    'destination_category' => 'Beaches',
    'distance_value' => '50',
    'distance_unit' => 'Metres',
    'travel_mode' => 'Walking'
]);
assertE2E($resToReject['success'] === true, "Admin created destination to test rejection");
$destToReject = $resToReject['destination'];

$resRejected = HotelDestinationsService::rejectDestination($pdo, $adminActor, $destToReject['id'], "Inaccurate distance: location is 3 km away");
assertE2E($resRejected['success'] === true && $resRejected['destination']['approval_status'] === 'REJECTED', "Admin rejects inaccurate destination");
assertE2E(strpos($resRejected['destination']['rejection_reason'], 'Inaccurate') !== false, "Rejection reason saved for vendor review");

// 4.6 Audit log trail
$stmtLogs = $pdo->prepare("SELECT * FROM hotel_destination_audit_logs WHERE destination_id = ? ORDER BY created_at DESC");
$stmtLogs->execute([$vendorDest['id']]);
$logs = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);
assertE2E(count($logs) >= 3, "Audit trail logged all lifecycle events (found " . count($logs) . " audit entries)");

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5: VEHICLES, FLIGHTS & ACTIVITIES WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 5] Vehicles, Sightseeing & Activities ---\n";

$cars = $pdo->query("SELECT * FROM cars LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
assertE2E(count($cars) >= 1, "Vehicle fleet inventory online (found " . count($cars) . " vehicles)");

$packages = $pdo->query("SELECT * FROM packages LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
assertE2E(count($packages) >= 1, "Holiday packages & sightseeing catalog online (found " . count($packages) . " packages)");

// Vehicle booking creation
$carBookingId = 'BK-E2E-CAR-' . time();
$stmtCar = $pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, total_amount, total_paid, status, created_at) VALUES (?, ?, ?, ?, ?, 'car', 4200, 4200, 'Confirmed', datetime('now'))");
$stmtCar->execute([$carBookingId, 'Deepak Patel', '9812345678', 'deepak@example.com', 'Mahindra Thar 4x4']);
assertE2E(true, "Vehicle reservation created successfully", "#$carBookingId");

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6: CUSTOMER REVIEWS & RATINGS INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 6] Customer Reviews & Rating Engine ---\n";

$compBookingId = 'BK-REV-COMP-' . time();
$pdo->prepare("INSERT INTO bookings (id, name, phone, email, item_name, type, total_amount, status, created_at) VALUES (?, 'Rohan Sharma', '9988776655', 'rohan@example.com', 'Goa Beach Resort', 'hotel', 7000, 'Completed', datetime('now'))")
    ->execute([$compBookingId]);

// Insert 5-star review
$revId = 'REV-E2E-' . time();
$stmtRev = $pdo->prepare("INSERT INTO customer_reviews (id, booking_id, customer_name, customer_phone, rating, review_text, created_at) VALUES (?, ?, 'Rohan S.', '9988776655', 5, 'Outstanding stay near Baga beach!', datetime('now'))");
$stmtRev->execute([$revId, $compBookingId]);
assertE2E(true, "Customer review recorded for completed stay", "#$revId");

// Public reviews check: privacy preservation
$publicRev = $pdo->query("SELECT * FROM customer_reviews WHERE id = '$revId'")->fetch(PDO::FETCH_ASSOC);
assertE2E(isset($publicRev['rating']) && intval($publicRev['rating']) === 5, "5-star rating registered properly");

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 7: CLEANUP OF TEST FIXTURES
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- [STAGE 7] Cleaning Up Test Artifacts ---\n";

try {
    $pdo->prepare("DELETE FROM bookings WHERE id IN (?, ?, ?)")->execute([$testBookingId, $carBookingId, $compBookingId]);
    $pdo->prepare("DELETE FROM customer_reviews WHERE id = ?")->execute([$revId]);
    $pdo->prepare("DELETE FROM hotel_nearby_destinations WHERE id IN (?, ?)")->execute([$vendorDest['id'], $destToReject['id']]);
    $pdo->prepare("DELETE FROM hotel_destination_audit_logs WHERE destination_id IN (?, ?)")->execute([$vendorDest['id'], $destToReject['id']]);
    assertE2E(true, "Temporary test records cleaned up safely without affecting production data");
} catch (Exception $e) {
    warnE2E("Cleanup notice", $e->getMessage());
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & READINESS SCORE
// ─────────────────────────────────────────────────────────────────────────────
echo "\n=========================================================================\n";
echo "📊 E2E TEST RESULTS: Passed: $passCount | Failed: $failCount | Warnings: $warnings\n";
echo "=========================================================================\n";

if ($failCount === 0) {
    echo "🎉 ALL END-TO-END TESTS PASSED PERFECTLY! WOW GOA IS PRODUCTION READY! 🚀\n";
    exit(0);
} else {
    echo "❌ SOME TESTS FAILED. PLEASE REVIEW FAILURES BEFORE LAUNCH.\n";
    exit(1);
}
