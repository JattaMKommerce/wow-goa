<?php
// backend/migrations/20261107_hotel_nearby_destinations.php
// Migration for Hotel Nearby Destinations & Distance Highlight System

function runHotelNearbyDestinationsMigration($pdo) {
    $isCli = (php_sapi_name() === 'cli');
    if ($isCli) echo "Running Hotel Nearby Destinations migration...\n";

    // 1. Create hotel_nearby_destinations table
    $sql1 = "CREATE TABLE IF NOT EXISTS hotel_nearby_destinations (
        id VARCHAR(50) PRIMARY KEY,
        hotel_id VARCHAR(50) NOT NULL,
        destination_name VARCHAR(255) NOT NULL,
        destination_category VARCHAR(100) NOT NULL,
        distance_value DECIMAL(10,2) NOT NULL,
        distance_unit VARCHAR(20) NOT NULL DEFAULT 'km',
        distance_meters INT NOT NULL,
        travel_mode VARCHAR(50) NOT NULL DEFAULT 'Walking',
        walking_time_minutes INT DEFAULT NULL,
        driving_time_minutes INT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image TEXT DEFAULT NULL,
        latitude DECIMAL(10,8) DEFAULT NULL,
        longitude DECIMAL(11,8) DEFAULT NULL,
        approval_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        rejection_reason TEXT DEFAULT NULL,
        pending_changes TEXT DEFAULT NULL,
        submitted_by VARCHAR(50) DEFAULT NULL,
        approved_by VARCHAR(50) DEFAULT NULL,
        approved_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql1);

    // Create Indexes
    try {
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_hdest_hotel_id ON hotel_nearby_destinations(hotel_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_hdest_approval ON hotel_nearby_destinations(approval_status)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_hdest_category ON hotel_nearby_destinations(destination_category)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_hdest_dist ON hotel_nearby_destinations(distance_meters)");
    } catch (Exception $e) {
        // Some SQLite versions or MySQL might format index differently
    }

    // 2. Create hotel_destination_audit_logs table
    $sql2 = "CREATE TABLE IF NOT EXISTS hotel_destination_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        destination_id VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        old_values TEXT DEFAULT NULL,
        new_values TEXT DEFAULT NULL,
        performed_by VARCHAR(50) NOT NULL,
        remarks TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql2);

    try {
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_hdest_audit_dest ON hotel_destination_audit_logs(destination_id)");
    } catch (Exception $e) {}

    // 3. Seed initial verified destinations if table is empty
    $count = $pdo->query("SELECT COUNT(*) FROM hotel_nearby_destinations")->fetchColumn();
    if ($count == 0) {
        echo "Seeding initial verified destinations for live hotels...\n";
        $seedData = [
            // hotel-3star: Casa Baga Boutique Resort
            [
                'id' => 'hdest_baga_1',
                'hotel_id' => 'hotel-3star',
                'destination_name' => 'Baga Beach',
                'destination_category' => 'Beaches',
                'distance_value' => 100,
                'distance_unit' => 'Metres',
                'distance_meters' => 100,
                'travel_mode' => 'Walking',
                'walking_time_minutes' => 2,
                'driving_time_minutes' => 1,
                'description' => 'Direct access to the famous Baga Beach, known for vibrant shacks and golden sands.',
                'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.5553,
                'longitude' => 73.7517,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_baga_2',
                'hotel_id' => 'hotel-3star',
                'destination_name' => 'Calangute Beach',
                'destination_category' => 'Beaches',
                'distance_value' => 850,
                'distance_unit' => 'Metres',
                'distance_meters' => 850,
                'travel_mode' => 'Walking',
                'walking_time_minutes' => 11,
                'driving_time_minutes' => 3,
                'description' => 'The Queen of Beaches with water sports, beach beds, and seaside dining.',
                'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.5441,
                'longitude' => 73.7552,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_baga_3',
                'hotel_id' => 'hotel-3star',
                'destination_name' => "Britto's Seaside Restaurant & Bakery",
                'destination_category' => 'Restaurants',
                'distance_value' => 200,
                'distance_unit' => 'Metres',
                'distance_meters' => 200,
                'travel_mode' => 'Walking',
                'walking_time_minutes' => 3,
                'driving_time_minutes' => 1,
                'description' => 'Iconic beachfront seafood institution serving fresh crabs, calamari, and Goan curry.',
                'image' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.5574,
                'longitude' => 73.7514,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_baga_4',
                'hotel_id' => 'hotel-3star',
                'destination_name' => "Mackie's Saturday Nite Bazaar",
                'destination_category' => 'Markets',
                'distance_value' => 1.4,
                'distance_unit' => 'Kilometres',
                'distance_meters' => 1400,
                'travel_mode' => 'Driving',
                'walking_time_minutes' => 18,
                'driving_time_minutes' => 5,
                'description' => 'Lively night flea market by the Baga River with live music, crafts, and gourmet stalls.',
                'image' => 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.5647,
                'longitude' => 73.7612,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],

            // hotel-4star: The Grand Candolim Beachfront Resort
            [
                'id' => 'hdest_cand_1',
                'hotel_id' => 'hotel-4star',
                'destination_name' => 'Candolim Beach',
                'destination_category' => 'Beaches',
                'distance_value' => 150,
                'distance_unit' => 'Metres',
                'distance_meters' => 150,
                'travel_mode' => 'Walking',
                'walking_time_minutes' => 2,
                'driving_time_minutes' => 1,
                'description' => 'Pristine dunes and serene waters with easy beach shack access and sunbeds.',
                'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.5186,
                'longitude' => 73.7629,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_cand_2',
                'hotel_id' => 'hotel-4star',
                'destination_name' => 'Aguada Fort & Lighthouse',
                'destination_category' => 'Forts',
                'distance_value' => 2.4,
                'distance_unit' => 'Kilometres',
                'distance_meters' => 2400,
                'travel_mode' => 'Driving',
                'walking_time_minutes' => 32,
                'driving_time_minutes' => 7,
                'description' => '17th-century Portuguese fortress overlooking the Arabian Sea with panoramic cliff views.',
                'image' => 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.4924,
                'longitude' => 73.7735,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_cand_3',
                'hotel_id' => 'hotel-4star',
                'destination_name' => 'Sinquerim Beach & Jet Ski Hub',
                'destination_category' => 'Water Sports',
                'distance_value' => 1.2,
                'distance_unit' => 'Kilometres',
                'distance_meters' => 1200,
                'travel_mode' => 'Driving',
                'walking_time_minutes' => 15,
                'driving_time_minutes' => 4,
                'description' => 'Center for parasailing, banana rides, jet skiing, and dolphin spotting cruises.',
                'image' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.4996,
                'longitude' => 73.7684,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],

            // hotel-5star: Taj Exotica Resort & Spa Goa
            [
                'id' => 'hdest_bena_1',
                'hotel_id' => 'hotel-5star',
                'destination_name' => 'Benaulim Beach',
                'destination_category' => 'Beaches',
                'distance_value' => 120,
                'distance_unit' => 'Metres',
                'distance_meters' => 120,
                'travel_mode' => 'Walking',
                'walking_time_minutes' => 2,
                'driving_time_minutes' => 1,
                'description' => 'Quiet, clean, powdery white sand beach in South Goa, famous for calm waters and sunsets.',
                'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.2575,
                'longitude' => 73.9167,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_bena_2',
                'hotel_id' => 'hotel-5star',
                'destination_name' => 'Colva Beach Promenade',
                'destination_category' => 'Beaches',
                'distance_value' => 3.2,
                'distance_unit' => 'Kilometres',
                'distance_meters' => 3200,
                'travel_mode' => 'Driving',
                'walking_time_minutes' => 42,
                'driving_time_minutes' => 8,
                'description' => 'Classic South Goa beach with palm groves, water sports, and beachside souvenir stalls.',
                'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.2797,
                'longitude' => 73.9118,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 'hdest_bena_3',
                'hotel_id' => 'hotel-5star',
                'destination_name' => 'Our Lady of Grace Church Margao',
                'destination_category' => 'Churches',
                'distance_value' => 6.8,
                'distance_unit' => 'Kilometres',
                'distance_meters' => 6800,
                'travel_mode' => 'Driving',
                'walking_time_minutes' => 90,
                'driving_time_minutes' => 15,
                'description' => 'Historic Goan Catholic church in the heart of Margao with Renaissance style architecture.',
                'image' => 'https://images.unsplash.com/photo-1548625361-195feee132f8?auto=format&fit=crop&w=800&q=80',
                'latitude' => 15.2743,
                'longitude' => 73.9576,
                'approval_status' => 'APPROVED',
                'submitted_by' => 'admin',
                'approved_by' => 'admin',
                'approved_at' => date('Y-m-d H:i:s')
            ]
        ];

        $stmtIns = $pdo->prepare("INSERT INTO hotel_nearby_destinations 
            (id, hotel_id, destination_name, destination_category, distance_value, distance_unit, distance_meters, travel_mode, walking_time_minutes, driving_time_minutes, description, image, latitude, longitude, approval_status, submitted_by, approved_by, approved_at, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmtLog = $pdo->prepare("INSERT INTO hotel_destination_audit_logs 
            (id, destination_id, action, old_values, new_values, performed_by, remarks, created_at) 
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?)");

        $now = date('Y-m-d H:i:s');
        foreach ($seedData as $item) {
            $stmtIns->execute([
                $item['id'],
                $item['hotel_id'],
                $item['destination_name'],
                $item['destination_category'],
                $item['distance_value'],
                $item['distance_unit'],
                $item['distance_meters'],
                $item['travel_mode'],
                $item['walking_time_minutes'],
                $item['driving_time_minutes'],
                $item['description'],
                $item['image'],
                $item['latitude'],
                $item['longitude'],
                $item['approval_status'],
                $item['submitted_by'],
                $item['approved_by'],
                $item['approved_at'],
                $now,
                $now
            ]);

            $stmtLog->execute([
                'hlog_' . uniqid(),
                $item['id'],
                'SEEDED_APPROVED',
                json_encode($item),
                'admin',
                'Initial verified seed for live production hotel inventory',
                $now
            ]);
        }
        if ($isCli) echo "Successfully seeded " . count($seedData) . " destinations.\n";
    }

    if ($isCli) echo "Migration completed successfully.\n";
}

// If run directly via CLI
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $dbPath = __DIR__ . '/../database.sqlite';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    runHotelNearbyDestinationsMigration($pdo);
}

