<?php
// backend/migrate_taxi_dispatch_system.php
// Creates authoritative taxi_dispatches and taxi_gps_logs tables,
// adds columns to bookings, and seeds verified drivers and fleet units.

require_once __DIR__ . '/config.php';

echo "=== MIGRATING TAXI DISPATCH & TELEMATICS BACKEND ===\n\n";

$dbFile = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 10000;");

// 1. Create taxi_dispatches Table
echo "1. Creating taxi_dispatches table...\n";
$pdo->exec("
CREATE TABLE IF NOT EXISTS taxi_dispatches (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50),
    vendor_id VARCHAR(50) DEFAULT 'taxi_vendor_goa',
    customer_name VARCHAR(150),
    customer_phone VARCHAR(50),
    service_type VARCHAR(100) DEFAULT 'Point-to-Point',
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    pickup_time VARCHAR(100),
    vehicle_tier VARCHAR(100) DEFAULT 'Sedan Prime',
    assigned_vehicle_id VARCHAR(50),
    assigned_vehicle_plate VARCHAR(50),
    assigned_vehicle_model VARCHAR(100),
    assigned_driver_id VARCHAR(50),
    assigned_driver_name VARCHAR(100),
    assigned_driver_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING_ALLOCATION',
    otp VARCHAR(10) DEFAULT '4821',
    fare_amount DECIMAL(10,2) DEFAULT 0,
    toll_parking_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    current_lat DECIMAL(10,6) DEFAULT 15.4989,
    current_lng DECIMAL(10,6) DEFAULT 73.8278,
    heading DECIMAL(6,2) DEFAULT 0,
    speed_kmh DECIMAL(6,2) DEFAULT 0,
    last_gps_at DATETIME,
    trip_started_at DATETIME,
    trip_completed_at DATETIME,
    start_odometer INT DEFAULT 0,
    end_odometer INT DEFAULT 0,
    rating INT DEFAULT 0,
    rating_feedback TEXT,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_taxi_disp_status ON taxi_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_taxi_disp_vendor ON taxi_dispatches(vendor_id);
CREATE INDEX IF NOT EXISTS idx_taxi_disp_driver ON taxi_dispatches(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_taxi_disp_booking ON taxi_dispatches(booking_id);
");
echo "   [DONE] taxi_dispatches table and indexes created.\n\n";

// 2. Create taxi_gps_logs Table (for Breadcrumbs & Route Replay)
echo "2. Creating taxi_gps_logs table...\n";
$pdo->exec("
CREATE TABLE IF NOT EXISTS taxi_gps_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_id VARCHAR(50),
    driver_id VARCHAR(50),
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    speed_kmh DECIMAL(6,2) DEFAULT 0,
    heading DECIMAL(6,2) DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_taxi_gps_disp ON taxi_gps_logs(dispatch_id);
");
echo "   [DONE] taxi_gps_logs table created.\n\n";

// 3. Ensure columns exist on bookings table
echo "3. Verifying/adding columns on bookings table...\n";
$bookingCols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
$existingColNames = array_map(function($c) { return $c['name']; }, $bookingCols);

$columnsToAdd = [
    'ride_otp' => 'VARCHAR(10) DEFAULT "4821"',
    'assigned_vehicle_id' => 'VARCHAR(50)',
    'assigned_vehicle_model' => 'VARCHAR(100)',
    'assigned_driver_name' => 'VARCHAR(100)',
    'assigned_driver_phone' => 'VARCHAR(50)',
    'current_lat' => 'DECIMAL(10,6) DEFAULT 15.4989',
    'current_lng' => 'DECIMAL(10,6) DEFAULT 73.8278',
    'last_gps_at' => 'DATETIME',
    'trip_started_at' => 'DATETIME',
    'trip_completed_at' => 'DATETIME',
    'trip_start_odo' => 'INT DEFAULT 0',
    'trip_end_odo' => 'INT DEFAULT 0',
    'toll_parking_amount' => 'DECIMAL(10,2) DEFAULT 0',
    'trip_rating' => 'INT DEFAULT 0',
    'trip_rating_feedback' => 'TEXT'
];

foreach ($columnsToAdd as $col => $def) {
    if (!in_array($col, $existingColNames)) {
        try {
            $pdo->exec("ALTER TABLE bookings ADD COLUMN $col $def");
            echo "   Added column $col to bookings.\n";
        } catch (Exception $e) {
            echo "   Note: column $col already exists or skipped.\n";
        }
    }
}
echo "   [DONE] bookings table columns verified.\n\n";

// 4. Seed Verified Drivers
echo "4. Seeding verified drivers...\n";
$driverSeeds = [
    [
        'id' => 'drv-suresh',
        'name' => 'Suresh Naik',
        'phone' => '+91 98221 44510',
        'email' => 'suresh.chauffeur@wowgoa.com',
        'plain_password' => '1234',
        'status' => 'Active',
        'experience_years' => '8 Years VIP & Airport Chauffeur',
        'vehicle_details' => 'Toyota Innova Crysta (GA-03-Z-8899)',
        'license_number' => 'GA-03-20160088990'
    ],
    [
        'id' => 'drv-ramesh',
        'name' => 'Ramesh V. Gaonkar',
        'phone' => '+91 98225 66778',
        'email' => 'ramesh.driver@wowgoa.com',
        'plain_password' => '1234',
        'status' => 'Active',
        'experience_years' => '5 Years Coastal & Sightseeing',
        'vehicle_details' => 'Maruti Suzuki Ertiga (GA-01-C-4521)',
        'license_number' => 'GA-01-20190045210'
    ],
    [
        'id' => 'drv-anil',
        'name' => 'Anil D’Souza',
        'phone' => '+91 98901 22334',
        'email' => 'anil.dsouza@wowgoa.com',
        'plain_password' => '1234',
        'status' => 'Active',
        'experience_years' => '10 Years South Goa Luxury',
        'vehicle_details' => 'Hyundai Aura / Sedan (GA-02-B-9988)',
        'license_number' => 'GA-02-20140099880'
    ]
];

foreach ($driverSeeds as $d) {
    $chk = $pdo->prepare("SELECT id FROM drivers WHERE id = ?");
    $chk->execute([$d['id']]);
    if (!$chk->fetch()) {
        $ins = $pdo->prepare("
            INSERT INTO drivers (id, name, phone, email, plain_password, status, experience_years, vehicle_details, license_number, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ");
        $ins->execute([
            $d['id'], $d['name'], $d['phone'], $d['email'], $d['plain_password'],
            $d['status'], $d['experience_years'], $d['vehicle_details'], $d['license_number']
        ]);
        echo "   Seeded driver: {$d['name']} ({$d['id']})\n";
    } else {
        $upd = $pdo->prepare("UPDATE drivers SET status = 'Active', plain_password = '1234' WHERE id = ?");
        $upd->execute([$d['id']]);
        echo "   Updated driver: {$d['name']}\n";
    }
}
echo "   [DONE] Drivers verified.\n\n";

// 5. Seed Verified Taxi Fleet Units in vehicle_units
echo "5. Seeding verified taxi vehicles in vehicle_units...\n";
$fleetSeeds = [
    [
        'id' => 'VEH-INNOVA-8899',
        'vehicle_id' => 'car_innova_crysta',
        'vendor_id' => 'taxi_vendor_goa',
        'unit_name' => 'Toyota Innova Crysta (VIP Executive)',
        'registration_no' => 'GA-03-Z-8899',
        'status' => 'Active'
    ],
    [
        'id' => 'VEH-ERTIGA-4521',
        'vehicle_id' => 'car_ertiga_prime',
        'vendor_id' => 'taxi_vendor_goa',
        'unit_name' => 'Maruti Suzuki Ertiga (Prime Plus)',
        'registration_no' => 'GA-01-C-4521',
        'status' => 'Active'
    ],
    [
        'id' => 'VEH-SEDAN-9988',
        'vehicle_id' => 'car_sedan_dzire',
        'vendor_id' => 'taxi_vendor_goa',
        'unit_name' => 'Sedan Prime (Dzire / Aura)',
        'registration_no' => 'GA-02-B-9988',
        'status' => 'Active'
    ],
    [
        'id' => 'VEH-EV6-1010',
        'vehicle_id' => 'car_luxury_ev',
        'vendor_id' => 'taxi_vendor_goa',
        'unit_name' => 'Luxury Electric EV (BYD / Kia EV6)',
        'registration_no' => 'GA-07-E-1010',
        'status' => 'Active'
    ],
    [
        'id' => 'VEH-URBANIA-7700',
        'vehicle_id' => 'car_maxi_coach',
        'vendor_id' => 'taxi_vendor_goa',
        'unit_name' => 'Force Urbania Maxi Coach (13-Seater)',
        'registration_no' => 'GA-08-T-7700',
        'status' => 'Active'
    ]
];

foreach ($fleetSeeds as $f) {
    $chk = $pdo->prepare("SELECT id FROM vehicle_units WHERE id = ?");
    $chk->execute([$f['id']]);
    if (!$chk->fetch()) {
        $ins = $pdo->prepare("
            INSERT INTO vehicle_units (id, vehicle_id, vendor_id, unit_name, registration_no, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $ins->execute([$f['id'], $f['vehicle_id'], $f['vendor_id'], $f['unit_name'], $f['registration_no'], $f['status']]);
        echo "   Seeded vehicle: {$f['unit_name']} ({$f['registration_no']})\n";
    } else {
        $upd = $pdo->prepare("UPDATE vehicle_units SET status = 'Active', registration_no = ? WHERE id = ?");
        $upd->execute([$f['registration_no'], $f['id']]);
        echo "   Updated vehicle: {$f['unit_name']}\n";
    }
}
echo "   [DONE] Fleet units verified.\n\n";

// 6. Seed Sample Active Dispatches
echo "6. Seeding initial live dispatches in taxi_dispatches...\n";
$dispatchSeeds = [
    [
        'id' => 'WG-TX-104928',
        'booking_id' => 'BK-GOA-9011',
        'vendor_id' => 'taxi_vendor_goa',
        'customer_name' => 'Aditya Kashyap',
        'customer_phone' => '+91 98200 44556',
        'service_type' => 'Airport Transfer',
        'pickup_location' => 'Manohar Intl Airport, Mopa (GOX)',
        'dropoff_location' => 'Taj Fort Aguada Resort, Sinquerim',
        'pickup_time' => 'Immediate (Flight 6E-241 Arrived)',
        'vehicle_tier' => 'Innova Crysta',
        'assigned_vehicle_id' => 'VEH-INNOVA-8899',
        'assigned_vehicle_plate' => 'GA-03-Z-8899',
        'assigned_vehicle_model' => 'Toyota Innova Crysta',
        'assigned_driver_id' => 'drv-suresh',
        'assigned_driver_name' => 'Suresh Naik',
        'assigned_driver_phone' => '+91 98221 44510',
        'status' => 'DISPATCHED',
        'otp' => '4821',
        'fare_amount' => 2450.00,
        'current_lat' => 15.7621,
        'current_lng' => 73.8654,
        'heading' => 195.0,
        'speed_kmh' => 45.0
    ],
    [
        'id' => 'WG-TX-104929',
        'booking_id' => 'BK-GOA-9012',
        'vendor_id' => 'taxi_vendor_goa',
        'customer_name' => 'Neha & Vikram Malhotra',
        'customer_phone' => '+91 98711 22334',
        'service_type' => 'Point-to-Point',
        'pickup_location' => 'Dabolim International Airport (GOI)',
        'dropoff_location' => 'Alila Diwa Resort, Majorda',
        'pickup_time' => '14:30 PM Today',
        'vehicle_tier' => 'Sedan Prime',
        'assigned_vehicle_id' => 'VEH-SEDAN-9988',
        'assigned_vehicle_plate' => 'GA-02-B-9988',
        'assigned_vehicle_model' => 'Hyundai Aura / Sedan Prime',
        'assigned_driver_id' => 'drv-anil',
        'assigned_driver_name' => 'Anil D’Souza',
        'assigned_driver_phone' => '+91 98901 22334',
        'status' => 'ALLOCATED',
        'otp' => '7392',
        'fare_amount' => 1650.00,
        'current_lat' => 15.3808,
        'current_lng' => 73.8313,
        'heading' => 150.0,
        'speed_kmh' => 0.0
    ],
    [
        'id' => 'WG-TX-104930',
        'booking_id' => 'BK-GOA-9013',
        'vendor_id' => 'taxi_vendor_goa',
        'customer_name' => 'Sunita Rao (Family of 5)',
        'customer_phone' => '+91 99450 88991',
        'service_type' => 'Sightseeing Tour',
        'pickup_location' => 'Calangute Beach Road',
        'dropoff_location' => 'Dudhsagar Waterfalls & Spice Plantation',
        'pickup_time' => 'Tomorrow 08:30 AM',
        'vehicle_tier' => 'Tourist Maxi Coach',
        'assigned_vehicle_id' => null,
        'assigned_vehicle_plate' => null,
        'assigned_vehicle_model' => 'Pending Assignment',
        'assigned_driver_id' => null,
        'assigned_driver_name' => null,
        'assigned_driver_phone' => null,
        'status' => 'PENDING_ALLOCATION',
        'otp' => '5521',
        'fare_amount' => 5800.00,
        'current_lat' => 15.5439,
        'current_lng' => 73.7554,
        'heading' => 0.0,
        'speed_kmh' => 0.0
    ]
];

foreach ($dispatchSeeds as $dsp) {
    $chk = $pdo->prepare("SELECT id FROM taxi_dispatches WHERE id = ?");
    $chk->execute([$dsp['id']]);
    if (!$chk->fetch()) {
        $ins = $pdo->prepare("
            INSERT INTO taxi_dispatches (
                id, booking_id, vendor_id, customer_name, customer_phone, service_type,
                pickup_location, dropoff_location, pickup_time, vehicle_tier,
                assigned_vehicle_id, assigned_vehicle_plate, assigned_vehicle_model,
                assigned_driver_id, assigned_driver_name, assigned_driver_phone,
                status, otp, fare_amount, current_lat, current_lng, heading, speed_kmh,
                last_gps_at, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                datetime('now'), datetime('now'), datetime('now')
            )
        ");
        $ins->execute([
            $dsp['id'], $dsp['booking_id'], $dsp['vendor_id'], $dsp['customer_name'], $dsp['customer_phone'], $dsp['service_type'],
            $dsp['pickup_location'], $dsp['dropoff_location'], $dsp['pickup_time'], $dsp['vehicle_tier'],
            $dsp['assigned_vehicle_id'], $dsp['assigned_vehicle_plate'], $dsp['assigned_vehicle_model'],
            $dsp['assigned_driver_id'], $dsp['assigned_driver_name'], $dsp['assigned_driver_phone'],
            $dsp['status'], $dsp['otp'], $dsp['fare_amount'], $dsp['current_lat'], $dsp['current_lng'], $dsp['heading'], $dsp['speed_kmh']
        ]);
        echo "   Seeded dispatch: {$dsp['id']} ({$dsp['status']})\n";
    }
}
echo "   [DONE] Initial dispatches seeded.\n\n";

echo "=== TAXI DISPATCH & TELEMATICS MIGRATION COMPLETED SUCCESSFULLY! ===\n";
