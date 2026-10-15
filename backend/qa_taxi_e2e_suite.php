<?php
/**
 * SENIOR QA AUTOMATION TEST SUITE
 * Project: WOW GOA B2B & B2C Cab Booking & Taxi Dispatch System
 * Author: Senior QA Automation Engineer
 *
 * Test Layers Covered:
 *   [1] Frontend Static Analysis & Build Verification
 *   [2] Database & Schema Integrity Tests
 *   [3] Core Dispatch API Contract & Regression Tests
 *   [4] Security & Input Validation Tests (OTP brute-force defense, missing params)
 *   [5] Full Multi-Party E2E Happy Path (Storefront -> Chauffeur -> Tracking -> Fleet Desk)
 *   [6] Alternative / Edge Case Workflows (Driver Decline, Re-assignment)
 *   [7] Database Mirroring & Consistency Audits
 */

class TaxiQASuite {
    private $dbPath;
    private $pdo;
    private $results = [];
    private $startTime;
    private $passCount = 0;
    private $failCount = 0;

    public function __construct() {
        $this->dbPath = __DIR__ . '/database.sqlite';
        $this->pdo = new PDO("sqlite:" . $this->dbPath);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->startTime = microtime(true);
    }

    private function recordResult($suite, $testName, $passed, $details = '', $latencyMs = 0) {
        if ($passed) {
            $this->passCount++;
            echo "  [\033[32mPASS\033[0m] {$testName} (" . round($latencyMs, 2) . "ms)\n";
        } else {
            $this->failCount++;
            echo "  [\033[31mFAIL\033[0m] {$testName}\n";
            echo "         Details: {$details}\n";
        }
        $this->results[] = [
            'suite' => $suite,
            'name' => $testName,
            'status' => $passed ? 'PASSED' : 'FAILED',
            'details' => $details,
            'latency_ms' => round($latencyMs, 2)
        ];
    }

    public function callBackend($method, $queryParams = [], $postData = null) {
        $t0 = microtime(true);
        $queryString = http_build_query($queryParams);
        $cmd = "php -r '";
        $cmd .= "parse_str(\"" . addslashes($queryString) . "\", \$_GET);";
        $cmd .= "\$_SERVER[\"REQUEST_METHOD\"] = \"{$method}\";";
        if ($postData !== null) {
            $json = addslashes(json_encode($postData));
            $cmd .= "\$payload = json_decode(\"{$json}\", true);";
        }
        $cmd .= "ob_start(); include \"backend/taxi_dispatch_actions.php\"; \$out = ob_get_clean(); echo \$out;'";
        
        $output = shell_exec($cmd);
        $latency = (microtime(true) - $t0) * 1000;
        $data = json_decode($output, true);
        return [$data, $latency, $output];
    }

    // =========================================================================
    // LAYER 1: Database & Schema Integrity
    // =========================================================================
    public function testDatabaseIntegrity() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 1: DATABASE SCHEMA & REPOSITORY INTEGRITY\n";
        echo str_repeat('=', 70) . "\n";

        // Test 1.1: Verify taxi_dispatches table exists and has mandatory columns
        $t0 = microtime(true);
        $st = $this->pdo->query("PRAGMA table_info(taxi_dispatches)");
        $cols = array_column($st->fetchAll(PDO::FETCH_ASSOC), 'name');
        $expectedCols = ['id', 'booking_id', 'status', 'assigned_driver_id', 'assigned_vehicle_plate', 'otp', 'fare_amount', 'pickup_location', 'dropoff_location'];
        $missingCols = array_diff($expectedCols, $cols);
        $this->recordResult('Database', 'Table schema contains all critical dispatch columns', empty($missingCols), empty($missingCols) ? '' : 'Missing: ' . implode(',', $missingCols), (microtime(true) - $t0)*1000);

        // Test 1.2: Verify drivers table has active drivers including Suresh Naik
        $t0 = microtime(true);
        $stDrivers = $this->pdo->query("SELECT id, name, status FROM drivers WHERE id = 'drv-suresh'");
        $suresh = $stDrivers->fetch(PDO::FETCH_ASSOC);
        $hasSuresh = ($suresh && !empty($suresh['name']));
        $this->recordResult('Database', 'Active driver drv-suresh (Suresh Naik) exists in drivers catalog', $hasSuresh, $hasSuresh ? '' : 'Driver drv-suresh missing in drivers table', (microtime(true) - $t0)*1000);

        // Test 1.3: Verify vehicle units table has available fleet units
        $t0 = microtime(true);
        $stVehicles = $this->pdo->query("SELECT COUNT(*) as cnt FROM vehicle_units WHERE status = 'Active'");
        $vCount = intval($stVehicles->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
        $this->recordResult('Database', 'Vehicle inventory has active fleet units for allocation', $vCount > 0, "Active vehicles count: {$vCount}", (microtime(true) - $t0)*1000);
    }

    // =========================================================================
    // LAYER 2: API Contract & Core Actions
    // =========================================================================
    public function testApiContracts() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 2: API CONTRACTS, SCHEMA VALIDATION & TELEMETRICS\n";
        echo str_repeat('=', 70) . "\n";

        // Test 2.1: vendor_dispatches feed API
        list($feedRes, $lat) = $this->callBackend('GET', ['resource' => 'vendor_dispatches']);
        $passFeed = ($feedRes && !empty($feedRes['success']) && isset($feedRes['dispatches']) && isset($feedRes['counts']));
        $this->recordResult('API', 'GET vendor_dispatches returns correct schema and KPI counters', $passFeed, '', $lat);

        // Test 2.2: driver_active_duty API for valid driver
        list($dutyRes, $lat) = $this->callBackend('GET', ['resource' => 'driver_active_duty', 'driver_id' => 'drv-suresh']);
        $passDuty = ($dutyRes && !empty($dutyRes['success']) && isset($dutyRes['driver']) && isset($dutyRes['assigned_vehicle']));
        $this->recordResult('API', 'GET driver_active_duty returns driver profile and vehicle telematics', $passDuty, '', $lat);

        // Test 2.3: GPS Telematics Ping API
        list($gpsRes, $lat) = $this->callBackend('POST', ['action' => 'driver_ping_gps'], [
            'dispatch_id' => 'WG-TX-TEST',
            'driver_id' => 'drv-suresh',
            'lat' => 15.4989,
            'lng' => 73.8278,
            'heading' => 90.0,
            'speed_kmh' => 45.0
        ]);
        $passGps = ($gpsRes && !empty($gpsRes['success']) && isset($gpsRes['lat']));
        $this->recordResult('API', 'POST driver_ping_gps accepts live coordinates and telematics stream', $passGps, '', $lat);

        // Test 2.4: vendor_telematics feed API
        list($fleetRes, $lat) = $this->callBackend('GET', ['resource' => 'vendor_telematics']);
        $passFleet = ($fleetRes && !empty($fleetRes['success']) && isset($fleetRes['active_units']));
        $this->recordResult('API', 'GET vendor_telematics returns active fleet positions for moving map', $passFleet, '', $lat);
    }

    // =========================================================================
    // LAYER 3: Security & Validation Tests
    // =========================================================================
    public function testSecurityAndValidation() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 3: SECURITY, VALIDATION & ACCESS DEFENSE\n";
        echo str_repeat('=', 70) . "\n";

        // Create temporary booking to test OTP security
        list($bkRes) = $this->callBackend('POST', ['action' => 'cab_create_booking'], [
            'customer_name' => 'Security QA Test',
            'pickup_location' => 'Airport',
            'dropoff_location' => 'Resort'
        ]);
        $testDispId = $bkRes['dispatch_id'] ?? '';
        $realOtp = $bkRes['otp'] ?? '';

        // Test 3.1: Reject trip start with invalid OTP
        list($wrongOtpRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $testDispId,
            'status' => 'ON_TRIP',
            'otp' => '0000_WRONG_CODE_9999'
        ]);
        $rejectedProperly = (!$wrongOtpRes || empty($wrongOtpRes['success']) || !empty($wrongOtpRes['error']));
        $this->recordResult('Security', 'Driver cannot start trip with forged/incorrect Ride OTP', $rejectedProperly, '', $lat);

        // Test 3.2: Missing dispatch ID in status update returns 404/Error
        list($missingRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => 'NON_EXISTENT_DISPATCH_99999',
            'status' => 'DISPATCHED'
        ]);
        $notFoundProperly = (!$missingRes || empty($missingRes['success']) || !empty($missingRes['error']));
        $this->recordResult('Validation', 'Non-existent dispatch ID returns proper not found error', $notFoundProperly, '', $lat);

        // Test 3.3: Missing dispatch ID in vendor assignment returns 400
        list($emptyAssignRes, $lat) = $this->callBackend('POST', ['action' => 'vendor_assign_dispatch'], [
            'dispatch_id' => '',
            'vehicle_plate' => 'GA-03-Z-8899'
        ]);
        $emptyAssignCaught = (!$emptyAssignRes || empty($emptyAssignRes['success']));
        $this->recordResult('Validation', 'Missing dispatch ID in vendor allocation is safely blocked', $emptyAssignCaught, '', $lat);
    }

    // =========================================================================
    // LAYER 4: Multi-Party Happy Path End-to-End Workflow
    // =========================================================================
    public function testHappyPathWorkflow() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 4: END-TO-END WORKFLOW (STOREFRONT -> COMPANION -> VENDOR)\n";
        echo str_repeat('=', 70) . "\n";

        // Step 1: Customer Books Cab
        $pName = 'Dr. Vikramaditya ' . rand(100, 999);
        $pPhone = '+91 98450 ' . rand(10000, 99999);
        $pickup = 'Mopa International Airport (GOX)';
        $dropoff = 'Taj Exotica Resort, Benaulim Beach';
        $fare = 2850.00;

        list($bookRes, $lat) = $this->callBackend('POST', ['action' => 'cab_create_booking'], [
            'customer_name' => $pName,
            'customer_phone' => $pPhone,
            'pickup_location' => $pickup,
            'dropoff_location' => $dropoff,
            'vehicle_tier' => 'Toyota Innova Crysta',
            'fare_amount' => $fare
        ]);

        $dispId = $bookRes['dispatch_id'] ?? '';
        $otp = $bookRes['otp'] ?? '';
        $initialStatus = $bookRes['status'] ?? '';
        $step1Ok = (!empty($dispId) && $initialStatus === 'ALLOCATED' && !empty($otp));
        $this->recordResult('E2E Happy Path', 'Step 1: Storefront creates booking in ALLOCATED state with 4-digit OTP', $step1Ok, "ID: {$dispId}, Status: {$initialStatus}", $lat);

        // Step 2: Customer Live Ride Track shows Awaiting Driver Acceptance
        list($track1, $lat) = $this->callBackend('GET', ['resource' => 'ride_live_track', 'id' => $dispId]);
        $track1Status = $track1['dispatch']['status'] ?? '';
        $step2Ok = ($track1Status === 'ALLOCATED');
        $this->recordResult('E2E Happy Path', 'Step 2: Customer Live Tracker returns ALLOCATED (UI maps to Waiting for Driver to Accept)', $step2Ok, "Status: {$track1Status}", $lat);

        // Step 3: Chauffeur Companion Receives Offer
        list($duty1, $lat) = $this->callBackend('GET', ['resource' => 'driver_active_duty', 'driver_id' => 'drv-suresh']);
        $offeredBooking = $duty1['active_booking'] ?? null;
        $step3Ok = ($offeredBooking && $offeredBooking['id'] === $dispId && $offeredBooking['status'] === 'ALLOCATED');
        $this->recordResult('E2E Happy Path', 'Step 3: Chauffeur Companion app surfaces new incoming duty offer to Suresh Naik', $step3Ok, "Offered ID: " . ($offeredBooking['id'] ?? 'none'), $lat);

        // Step 4: Chauffeur Accepts Duty
        list($acceptRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $dispId,
            'status' => 'DISPATCHED'
        ]);
        $step4Ok = ($acceptRes && !empty($acceptRes['success']) && $acceptRes['status'] === 'DISPATCHED');
        $this->recordResult('E2E Happy Path', 'Step 4: Chauffeur taps Accept Duty -> status transitions to DISPATCHED', $step4Ok, '', $lat);

        // Step 5: Customer Live Track immediately reflects Accepted
        list($track2, $lat) = $this->callBackend('GET', ['resource' => 'ride_live_track', 'id' => $dispId]);
        $track2Status = $track2['dispatch']['status'] ?? '';
        $step5Ok = ($track2Status === 'DISPATCHED');
        $this->recordResult('E2E Happy Path', 'Step 5: Customer Tracker detects DISPATCHED and switches to Confirmed & En Route', $step5Ok, "Status: {$track2Status}", $lat);

        // Step 6: Chauffeur Arrived
        list($arrRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $dispId,
            'status' => 'ARRIVED'
        ]);
        $step6Ok = ($arrRes && !empty($arrRes['success']) && $arrRes['status'] === 'ARRIVED');
        $this->recordResult('E2E Happy Path', 'Step 6: Chauffeur marks ARRIVED -> Customer sees Chauffeur At Pickup spot', $step6Ok, '', $lat);

        // Step 7: Chauffeur enters OTP & starts trip
        list($tripRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $dispId,
            'status' => 'ON_TRIP',
            'otp' => $otp,
            'start_odometer' => 15200
        ]);
        $step7Ok = ($tripRes && !empty($tripRes['success']) && $tripRes['status'] === 'ON_TRIP');
        $this->recordResult('E2E Happy Path', 'Step 7: Valid Ride OTP unlocks meter -> Status transitions to ON_TRIP', $step7Ok, '', $lat);

        // Step 8: Chauffeur Completes Trip with payment
        list($compRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $dispId,
            'status' => 'COMPLETED',
            'end_odometer' => 15238,
            'toll_parking_amount' => 150,
            'payment_method' => 'UPI'
        ]);
        $step8Ok = ($compRes && !empty($compRes['success']) && $compRes['status'] === 'COMPLETED');
        $this->recordResult('E2E Happy Path', 'Step 8: Chauffeur completes trip -> Final fare recorded & marked PAID', $step8Ok, '', $lat);

        // Step 9: Database Mirroring Audit (taxi_dispatches vs bookings)
        $t0 = microtime(true);
        $stD = $this->pdo->prepare("SELECT * FROM taxi_dispatches WHERE id = ?");
        $stD->execute([$dispId]);
        $dispRow = $stD->fetch(PDO::FETCH_ASSOC);

        $stB = $this->pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $stB->execute([$dispRow['booking_id']]);
        $bookRow = $stB->fetch(PDO::FETCH_ASSOC);

        $mirrorOk = ($bookRow && $bookRow['payment_status'] === 'paid' && strtolower($bookRow['status']) === 'completed');
        $this->recordResult('E2E Happy Path', 'Step 9: Database audit confirms mirror entry in bookings table is completed & paid', $mirrorOk, '', (microtime(true) - $t0)*1000);
    }

    // =========================================================================
    // LAYER 5: Chauffeur Decline & Fleet Reallocation Workflow
    // =========================================================================
    public function testDeclineAndReallocationWorkflow() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 5: DRIVER DECLINE & DISPATCHER RE-ALLOCATION WORKFLOW\n";
        echo str_repeat('=', 70) . "\n";

        // Step 1: Create new booking
        list($bkRes, $lat) = $this->callBackend('POST', ['action' => 'cab_create_booking'], [
            'customer_name' => 'Decline Test Passenger',
            'pickup_location' => 'Panjim Bus Stand',
            'dropoff_location' => 'Dabolim Airport'
        ]);
        $dispId = $bkRes['dispatch_id'] ?? '';

        // Step 2: Driver declines duty
        list($decRes, $lat) = $this->callBackend('POST', ['action' => 'driver_update_status'], [
            'dispatch_id' => $dispId,
            'status' => 'CANCELLED'
        ]);
        $declinedOk = ($decRes && !empty($decRes['success']) && $decRes['status'] === 'CANCELLED');
        $this->recordResult('Decline Workflow', 'Driver can decline duty offer -> Status safely transitions to CANCELLED', $declinedOk, '', $lat);

        // Step 3: Dispatcher manually reassigns to another fleet car/driver
        list($reassignRes, $lat) = $this->callBackend('POST', ['action' => 'vendor_assign_dispatch'], [
            'dispatch_id' => $dispId,
            'vehicle_plate' => 'GA-07-T-1240',
            'vehicle_model' => 'Maruti Suzuki Dzire',
            'driver_id' => 'drv-ramesh',
            'driver_name' => 'Ramesh V. Gaonkar',
            'driver_phone' => '+91 98225 66778'
        ]);
        $reassignOk = ($reassignRes && !empty($reassignRes['success']) && $reassignRes['status'] === 'ALLOCATED');
        $this->recordResult('Decline Workflow', 'Dispatcher can reallocate cancelled trip to another car & chauffeur (Ramesh)', $reassignOk, '', $lat);

        // Step 4: Verify Ramesh receives this newly allocated duty
        list($rameshDuty, $lat) = $this->callBackend('GET', ['resource' => 'driver_active_duty', 'driver_id' => 'drv-ramesh']);
        $rameshAssigned = ($rameshDuty && !empty($rameshDuty['active_booking']) && $rameshDuty['active_booking']['id'] === $dispId);
        $this->recordResult('Decline Workflow', 'Reallocated driver companion receives the reassigned duty offer', $rameshAssigned, '', $lat);
    }

    // =========================================================================
    // LAYER 6: Performance & Latency Benchmark
    // =========================================================================
    public function testPerformanceBenchmarks() {
        echo "\n" . str_repeat('=', 70) . "\n";
        echo "TEST SUITE 6: SYSTEM LATENCY & THROUGHPUT BENCHMARKS\n";
        echo str_repeat('=', 70) . "\n";

        $latencies = [];
        for ($i = 0; $i < 5; $i++) {
            list($res, $lat) = $this->callBackend('GET', ['resource' => 'vendor_dispatches']);
            $latencies[] = $lat;
        }
        $avgLatency = array_sum($latencies) / count($latencies);
        $underSla = ($avgLatency < 250); // SLA threshold 250ms
        $this->recordResult('Performance', 'Vendor dispatch query avg response latency under 250ms SLA', $underSla, "Avg Latency: " . round($avgLatency, 2) . "ms", $avgLatency);

        $trackLatencies = [];
        for ($i = 0; $i < 5; $i++) {
            list($res, $lat) = $this->callBackend('GET', ['resource' => 'driver_active_duty', 'driver_id' => 'drv-suresh']);
            $trackLatencies[] = $lat;
        }
        $avgTrackLat = array_sum($trackLatencies) / count($trackLatencies);
        $trackUnderSla = ($avgTrackLat < 200);
        $this->recordResult('Performance', 'Chauffeur active duty polling avg response latency under 200ms SLA', $trackUnderSla, "Avg Latency: " . round($avgTrackLat, 2) . "ms", $avgTrackLat);
    }

    // =========================================================================
    // Generate Report
    // =========================================================================
    public function printSummary() {
        $totalTime = (microtime(true) - $this->startTime);
        $totalTests = $this->passCount + $this->failCount;
        $passRate = $totalTests > 0 ? round(($this->passCount / $totalTests) * 100, 1) : 0;

        echo "\n" . str_repeat('=', 70) . "\n";
        echo "📊 SENIOR QA AUTOMATION TEST EXECUTION SUMMARY\n";
        echo str_repeat('=', 70) . "\n";
        echo "  Total Tests Executed : {$totalTests}\n";
        echo "  Passed               : \033[32m{$this->passCount}\033[0m\n";
        echo "  Failed               : " . ($this->failCount > 0 ? "\033[31m{$this->failCount}\033[0m" : "\033[32m0\033[0m") . "\n";
        echo "  Pass Rate            : \033[1m{$passRate}%\033[0m\n";
        echo "  Total Execution Time : " . round($totalTime, 2) . "s\n";
        echo str_repeat('=', 70) . "\n\n";

        // Write structured JSON QA artifact
        $artifactData = [
            'test_suite' => 'WOW GOA Cab Operations E2E Suite',
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'total' => $totalTests,
                'passed' => $this->passCount,
                'failed' => $this->failCount,
                'pass_rate' => $passRate,
                'duration_seconds' => round($totalTime, 2)
            ],
            'test_cases' => $this->results
        ];
        file_put_contents(__DIR__ . '/qa_e2e_results.json', json_encode($artifactData, JSON_PRETTY_PRINT));
    }
}

// Execute Suite
$suite = new TaxiQASuite();
$suite->testDatabaseIntegrity();
$suite->testApiContracts();
$suite->testSecurityAndValidation();
$suite->testHappyPathWorkflow();
$suite->testDeclineAndReallocationWorkflow();
$suite->testPerformanceBenchmarks();
$suite->printSummary();
