<?php
// backend/vendor_storefront_actions.php
// Dedicated controller for Multi-Vendor Dynamic Websites & Live Booking Handover / Stay Tracker

if (!isset($pdo) || !$pdo) {
    return;
}

// ─── 1. SELF-HEALING DATABASE SCHEMA ──────────────────────────────────────────
try {
    // 1.1 Create vendor_websites table
    $createTableSql = "CREATE TABLE IF NOT EXISTS vendor_websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id VARCHAR(100) NOT NULL UNIQUE,
        vendor_type VARCHAR(50) NOT NULL DEFAULT 'vehicle',
        slug VARCHAR(100) NOT NULL UNIQUE,
        site_title VARCHAR(255) NOT NULL,
        tagline VARCHAR(255) DEFAULT NULL,
        about_us TEXT DEFAULT NULL,
        logo_url TEXT DEFAULT NULL,
        banner_url TEXT DEFAULT NULL,
        theme_preset VARCHAR(50) DEFAULT 'sunset',
        primary_color VARCHAR(20) DEFAULT '#FF6333',
        style_mode VARCHAR(20) DEFAULT 'light',
        base_address TEXT DEFAULT NULL,
        city_region VARCHAR(100) DEFAULT 'Goa',
        service_radius_km INT DEFAULT 25,
        delivery_charge_policy TEXT DEFAULT NULL,
        google_maps_url TEXT DEFAULT NULL,
        phone VARCHAR(50) NOT NULL DEFAULT '',
        whatsapp_number VARCHAR(50) NOT NULL DEFAULT '',
        email VARCHAR(150) DEFAULT NULL,
        instagram_url VARCHAR(255) DEFAULT NULL,
        operating_hours VARCHAR(100) DEFAULT '24/7',
        enabled_categories TEXT DEFAULT NULL,
        featured_items TEXT DEFAULT NULL,
        hotel_checkin_time VARCHAR(20) DEFAULT '01:00 PM',
        hotel_checkout_time VARCHAR(20) DEFAULT '11:00 AM',
        hotel_wifi_network VARCHAR(100) DEFAULT NULL,
        hotel_wifi_password VARCHAR(100) DEFAULT NULL,
        is_published INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";

    // Adjust for MySQL if needed
    if (defined('DB_CONNECTION') && strtolower(DB_CONNECTION) === 'mysql') {
        $createTableSql = "CREATE TABLE IF NOT EXISTS vendor_websites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_id VARCHAR(100) NOT NULL UNIQUE,
            vendor_type VARCHAR(50) NOT NULL DEFAULT 'vehicle',
            slug VARCHAR(100) NOT NULL UNIQUE,
            site_title VARCHAR(255) NOT NULL,
            tagline VARCHAR(255) DEFAULT NULL,
            about_us TEXT DEFAULT NULL,
            logo_url TEXT DEFAULT NULL,
            banner_url TEXT DEFAULT NULL,
            theme_preset VARCHAR(50) DEFAULT 'sunset',
            primary_color VARCHAR(20) DEFAULT '#FF6333',
            style_mode VARCHAR(20) DEFAULT 'light',
            base_address TEXT DEFAULT NULL,
            city_region VARCHAR(100) DEFAULT 'Goa',
            service_radius_km INT DEFAULT 25,
            delivery_charge_policy TEXT DEFAULT NULL,
            google_maps_url TEXT DEFAULT NULL,
            phone VARCHAR(50) NOT NULL DEFAULT '',
            whatsapp_number VARCHAR(50) NOT NULL DEFAULT '',
            email VARCHAR(150) DEFAULT NULL,
            instagram_url VARCHAR(255) DEFAULT NULL,
            operating_hours VARCHAR(100) DEFAULT '24/7',
            enabled_categories TEXT DEFAULT NULL,
            featured_items TEXT DEFAULT NULL,
            hotel_checkin_time VARCHAR(20) DEFAULT '01:00 PM',
            hotel_checkout_time VARCHAR(20) DEFAULT '11:00 AM',
            hotel_wifi_network VARCHAR(100) DEFAULT NULL,
            hotel_wifi_password VARCHAR(100) DEFAULT NULL,
            is_published INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
    $pdo->exec($createTableSql);

    // 1.2 Create storefront_leads table (Captures visitor leads on vendor dynamic websites for Admin & Super Admin)
    $createLeadsTableSql = "CREATE TABLE IF NOT EXISTS storefront_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        vendor_id VARCHAR(100) DEFAULT NULL,
        vendor_slug VARCHAR(100) DEFAULT NULL,
        vendor_title VARCHAR(255) DEFAULT NULL,
        vendor_type VARCHAR(50) DEFAULT 'vehicle',
        discount_code VARCHAR(50) DEFAULT 'WOW500',
        discount_amount DECIMAL(10,2) DEFAULT 500.00,
        status VARCHAR(50) DEFAULT 'unbooked',
        converted_booking_id VARCHAR(100) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )";

    if (defined('DB_CONNECTION') && strtolower(DB_CONNECTION) === 'mysql') {
        $createLeadsTableSql = "CREATE TABLE IF NOT EXISTS storefront_leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(150) DEFAULT NULL,
            vendor_id VARCHAR(100) DEFAULT NULL,
            vendor_slug VARCHAR(100) DEFAULT NULL,
            vendor_title VARCHAR(255) DEFAULT NULL,
            vendor_type VARCHAR(50) DEFAULT 'vehicle',
            discount_code VARCHAR(50) DEFAULT 'WOW500',
            discount_amount DECIMAL(10,2) DEFAULT 500.00,
            status VARCHAR(50) DEFAULT 'unbooked',
            converted_booking_id VARCHAR(100) DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
    $pdo->exec($createLeadsTableSql);

    // 1.3 Add Handover & Stay Tracking Columns to bookings table
    $trackingColumns = [
        "ALTER TABLE bookings ADD COLUMN assigned_vehicle_plate VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN handover_status VARCHAR(50) DEFAULT 'Confirmed'",
        "ALTER TABLE bookings ADD COLUMN handover_odometer INT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN return_odometer INT DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN handover_fuel VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN return_fuel VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE bookings ADD COLUMN deposit_status VARCHAR(50) DEFAULT 'Unpaid'",
        "ALTER TABLE bookings ADD COLUMN delivery_agent_name VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN delivery_agent_phone VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN assigned_room_no VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN checkin_status VARCHAR(50) DEFAULT 'Confirmed'",
        "ALTER TABLE bookings ADD COLUMN meal_plan VARCHAR(50) DEFAULT 'Room Only'",
        "ALTER TABLE bookings ADD COLUMN handed_over_at VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN returned_at VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN voucher_email_sent INT DEFAULT 0",
        "ALTER TABLE bookings ADD COLUMN voucher_email_sent_at VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE bookings ADD COLUMN voucher_email_recipient VARCHAR(150) DEFAULT NULL"
    ];

    foreach ($trackingColumns as $alt) {
        try {
            $pdo->exec($alt);
        } catch (Exception $e) {}
    }
} catch (Exception $e) {}

// Parse request payload safely
$rawInput = file_get_contents('php://input');
$jsonPayload = json_decode($rawInput, true);

if (!isset($reqPayload) || empty($reqPayload)) {
    $reqPayload = is_array($jsonPayload) ? array_merge($_POST, $jsonPayload) : $_POST;
    if (isset($payload) && is_array($payload)) {
        $reqPayload = array_merge($reqPayload, $payload);
    }
}

$resourceVar = isset($resource) ? $resource : ($_GET['resource'] ?? '');
$actionVar = isset($action) ? $action : ($reqPayload['action'] ?? ($_GET['action'] ?? ''));

$currentAction = $actionVar ?: ($reqPayload['action'] ?? ($_GET['action'] ?? ''));
$currentResource = $resourceVar ?: ($_GET['resource'] ?? '');

// Helper: slugify text
function cleanSlug($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'store-' . substr(uniqid(), -6) : $text;
}

if (!function_exists('formatWebsiteRow')) {
    function formatWebsiteRow($row) {
        if (!$row) return null;
        if (isset($row['enabled_categories'])) {
            if (is_string($row['enabled_categories'])) {
                $decoded = json_decode($row['enabled_categories'], true);
                $row['enabled_categories'] = is_array($decoded) ? $decoded : ($row['enabled_categories'] ? [$row['enabled_categories']] : []);
            }
        } else {
            $row['enabled_categories'] = [];
        }

        if (isset($row['featured_items'])) {
            if (is_string($row['featured_items'])) {
                $decoded = json_decode($row['featured_items'], true);
                $row['featured_items'] = is_array($decoded) ? $decoded : [];
            }
        } else {
            $row['featured_items'] = [];
        }

        if (empty($row['site_title']) || strtolower(trim($row['site_title'])) === 'abc' || strtolower(trim($row['site_title'])) === 'test') {
            $row['site_title'] = !empty($row['slug']) ? ucwords(str_replace('-', ' ', $row['slug'])) : 'Goa Royal Rentals';
        }
        if (empty($row['banner_url'])) {
            $row['banner_url'] = 'https://images.pexels.com/photos/6348018/pexels-photo-6348018.jpeg?auto=compress&cs=tinysrgb&w=1600';
        }
        return $row;
    }
}

// ─── 2. ACTION: GET VENDOR WEBSITE (Portal Editor) ────────────────────────────
if ($currentAction === 'get_vendor_website' || $currentResource === 'vendor_website') {
    $vId = trim($reqPayload['vendor_id'] ?? ($_GET['vendor_id'] ?? ''));
    if (!$vId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "vendor_id is required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM vendor_websites WHERE vendor_id = ?");
        $stmt->execute([$vId]);
        $site = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$site) {
            // Check users or vendors table for prefill defaults
            $uStmt = $pdo->prepare("SELECT id, username, name, company_name, phone, email, city, address, role FROM users WHERE id = ? OR username = ? LIMIT 1");
            $uStmt->execute([$vId, $vId]);
            $u = $uStmt->fetch(PDO::FETCH_ASSOC);

            $vendorType = 'vehicle';
            if ($u && ($u['role'] === 'hotel_vendor' || strpos(strtolower($u['role']), 'hotel') !== false)) {
                $vendorType = 'hotel';
            }

            $defTitle = $u['company_name'] ?? ($u['name'] ?? ($u['username'] ?? 'My Storefront'));
            $defSlug = cleanSlug($defTitle);

            // Ensure default slug is unique
            $slugCheck = $pdo->prepare("SELECT id FROM vendor_websites WHERE slug = ?");
            $slugCheck->execute([$defSlug]);
            if ($slugCheck->fetch()) {
                $defSlug .= '-' . substr(uniqid(), -4);
            }

            $site = [
                'id' => null,
                'vendor_id' => $vId,
                'vendor_type' => $vendorType,
                'slug' => $defSlug,
                'site_title' => $defTitle,
                'tagline' => $vendorType === 'hotel' ? 'Experience Authentic Luxury & Comfort in Goa' : 'Self-Drive Cars, Bikes & Luxury Fleet in Goa',
                'about_us' => 'Welcome to our verified travel service. We offer top-notch hospitality and verified vehicles across Goa with doorstep delivery and 24/7 dedicated customer assistance.',
                'logo_url' => '',
                'banner_url' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
                'theme_preset' => 'sunset',
                'primary_color' => '#FF6333',
                'style_mode' => 'light',
                'base_address' => $u['address'] ?? 'Goa, India',
                'city_region' => $u['city'] ?? 'Goa',
                'service_radius_km' => 25,
                'delivery_charge_policy' => 'Free delivery within 10 km. Airport pickup/drop available.',
                'google_maps_url' => '',
                'phone' => $u['phone'] ?? '',
                'whatsapp_number' => $u['phone'] ?? '',
                'email' => $u['email'] ?? '',
                'instagram_url' => '',
                'operating_hours' => '24/7',
                'enabled_categories' => $vendorType === 'hotel' ? ['Deluxe Room', 'Luxury Suite', 'Private Villa'] : ['Two Wheelers', 'Four Wheelers', 'Luxury'],
                'featured_items' => [],
                'hotel_checkin_time' => '01:00 PM',
                'hotel_checkout_time' => '11:00 AM',
                'hotel_wifi_network' => 'Guest_HighSpeed_WiFi',
                'hotel_wifi_password' => 'WelcomeToGoa',
                'is_published' => 1,
                'is_new' => true
            ];
        } else {
            $site['is_new'] = false;
        }

        echo json_encode(["success" => true, "website" => formatWebsiteRow($site)]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 3. ACTION: SAVE VENDOR WEBSITE ───────────────────────────────────────────
if ($currentAction === 'save_vendor_website') {
    $vId = trim($reqPayload['vendor_id'] ?? '');
    $siteTitle = trim($reqPayload['site_title'] ?? '');
    $slug = cleanSlug(trim($reqPayload['slug'] ?? ''));

    if (!$vId || !$siteTitle || !$slug) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Vendor ID, Website Title, and a valid URL slug are required."]);
        exit;
    }

    try {
        // Validate Slug uniqueness for OTHER vendors
        $chkStmt = $pdo->prepare("SELECT vendor_id FROM vendor_websites WHERE slug = ? AND vendor_id != ?");
        $chkStmt->execute([$slug, $vId]);
        if ($chkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "The URL slug '$slug' is already taken by another vendor. Please choose a different slug."]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $vendorType = trim($reqPayload['vendor_type'] ?? 'vehicle');
        $tagline = trim($reqPayload['tagline'] ?? '');
        $aboutUs = trim($reqPayload['about_us'] ?? '');
        $logoUrl = trim($reqPayload['logo_url'] ?? '');
        $bannerUrl = trim($reqPayload['banner_url'] ?? '');
        $themePreset = trim($reqPayload['theme_preset'] ?? 'sunset');
        $primaryColor = trim($reqPayload['primary_color'] ?? '#FF6333');
        $styleMode = trim($reqPayload['style_mode'] ?? 'light');
        $baseAddress = trim($reqPayload['base_address'] ?? '');
        $cityRegion = trim($reqPayload['city_region'] ?? 'Goa');
        $serviceRadiusKm = intval($reqPayload['service_radius_km'] ?? 25);
        $deliveryChargePolicy = trim($reqPayload['delivery_charge_policy'] ?? '');
        $googleMapsUrl = trim($reqPayload['google_maps_url'] ?? '');
        $phone = trim($reqPayload['phone'] ?? '');
        $whatsappNumber = trim($reqPayload['whatsapp_number'] ?? '');
        $email = trim($reqPayload['email'] ?? '');
        $instagramUrl = trim($reqPayload['instagram_url'] ?? '');
        $operatingHours = trim($reqPayload['operating_hours'] ?? '24/7');
        $enabledCats = is_array($reqPayload['enabled_categories'] ?? null) 
            ? json_encode($reqPayload['enabled_categories']) 
            : (trim($reqPayload['enabled_categories'] ?? '') ?: json_encode(['Two Wheelers', 'Four Wheelers', 'Luxury']));
        $featuredItems = is_array($reqPayload['featured_items'] ?? null) 
            ? json_encode($reqPayload['featured_items']) 
            : (trim($reqPayload['featured_items'] ?? '') ?: json_encode([]));
        
        $hotelCheckin = trim($reqPayload['hotel_checkin_time'] ?? '01:00 PM');
        $hotelCheckout = trim($reqPayload['hotel_checkout_time'] ?? '11:00 AM');
        $hotelWifiNet = trim($reqPayload['hotel_wifi_network'] ?? '');
        $hotelWifiPass = trim($reqPayload['hotel_wifi_password'] ?? '');
        $isPublished = isset($reqPayload['is_published']) ? intval($reqPayload['is_published']) : 1;

        // Upsert
        $existStmt = $pdo->prepare("SELECT id FROM vendor_websites WHERE vendor_id = ?");
        $existStmt->execute([$vId]);
        $existing = $existStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $upSql = "UPDATE vendor_websites SET 
                vendor_type = ?, slug = ?, site_title = ?, tagline = ?, about_us = ?, logo_url = ?, banner_url = ?,
                theme_preset = ?, primary_color = ?, style_mode = ?, base_address = ?, city_region = ?,
                service_radius_km = ?, delivery_charge_policy = ?, google_maps_url = ?, phone = ?,
                whatsapp_number = ?, email = ?, instagram_url = ?, operating_hours = ?, enabled_categories = ?,
                featured_items = ?, hotel_checkin_time = ?, hotel_checkout_time = ?, hotel_wifi_network = ?,
                hotel_wifi_password = ?, is_published = ?, updated_at = ?
                WHERE vendor_id = ?";
            $upStmt = $pdo->prepare($upSql);
            $upStmt->execute([
                $vendorType, $slug, $siteTitle, $tagline, $aboutUs, $logoUrl, $bannerUrl,
                $themePreset, $primaryColor, $styleMode, $baseAddress, $cityRegion,
                $serviceRadiusKm, $deliveryChargePolicy, $googleMapsUrl, $phone,
                $whatsappNumber, $email, $instagramUrl, $operatingHours, $enabledCats,
                $featuredItems, $hotelCheckin, $hotelCheckout, $hotelWifiNet,
                $hotelWifiPass, $isPublished, $now, $vId
            ]);
        } else {
            $insSql = "INSERT INTO vendor_websites (
                vendor_id, vendor_type, slug, site_title, tagline, about_us, logo_url, banner_url,
                theme_preset, primary_color, style_mode, base_address, city_region, service_radius_km,
                delivery_charge_policy, google_maps_url, phone, whatsapp_number, email, instagram_url,
                operating_hours, enabled_categories, featured_items, hotel_checkin_time, hotel_checkout_time,
                hotel_wifi_network, hotel_wifi_password, is_published, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $insStmt = $pdo->prepare($insSql);
            $insStmt->execute([
                $vId, $vendorType, $slug, $siteTitle, $tagline, $aboutUs, $logoUrl, $bannerUrl,
                $themePreset, $primaryColor, $styleMode, $baseAddress, $cityRegion, $serviceRadiusKm,
                $deliveryChargePolicy, $googleMapsUrl, $phone, $whatsappNumber, $email, $instagramUrl,
                $operatingHours, $enabledCats, $featuredItems, $hotelCheckin, $hotelCheckout,
                $hotelWifiNet, $hotelWifiPass, $isPublished, $now, $now
            ]);
        }

        // Return updated row
        $fetchStmt = $pdo->prepare("SELECT * FROM vendor_websites WHERE vendor_id = ?");
        $fetchStmt->execute([$vId]);
        $saved = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => "Vendor website saved and published successfully!",
            "website" => formatWebsiteRow($saved)
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 4. ACTION: GET PUBLIC STOREFRONT (Customer-Facing Website) ───────────────
if ($currentAction === 'get_public_storefront' || $currentResource === 'public_storefront') {
    $slug = trim($reqPayload['slug'] ?? ($_GET['slug'] ?? ''));
    if (!$slug) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Storefront slug is required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM vendor_websites WHERE slug = ?");
        $stmt->execute([$slug]);
        $site = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$site) {
            http_response_code(404);
            echo json_encode(["success" => false, "not_found" => true, "error" => "Storefront '$slug' does not exist."]);
            exit;
        }

        $vendorId = $site['vendor_id'];
        $vendorType = $site['vendor_type'];

        $inventory = [];

        if ($vendorType === 'vehicle') {
            // Fetch isolated cars & bikes
            $isOwnerSql = "(vendor_id = ? OR vendor_id = ? OR (? = 'u-4' AND (vendor_id IS NULL OR vendor_id = '' OR vendor_id = 'vendor-1' OR vendor_id = 'vendor-2')))";
            
            $cStmt = $pdo->prepare("SELECT *, 'car' AS vehicle_type FROM cars WHERE $isOwnerSql");
            $cStmt->execute([$vendorId, 'vnd_' . $vendorId, $vendorId]);
            $cars = $cStmt->fetchAll(PDO::FETCH_ASSOC);

            $bStmt = $pdo->prepare("SELECT *, 'bike' AS vehicle_type FROM bikes WHERE $isOwnerSql");
            $bStmt->execute([$vendorId, 'vnd_' . $vendorId, $vendorId]);
            $bikes = $bStmt->fetchAll(PDO::FETCH_ASSOC);

            // Tag each vehicle with category: 'Two Wheelers', 'Four Wheelers', 'Luxury'
            foreach ($bikes as $b) {
                $b['vehicle_group'] = 'Two Wheelers';
                $b['type'] = 'bike';
                $inventory[] = $b;
            }

            foreach ($cars as $c) {
                $cat = strtolower($c['category'] ?? '');
                $name = strtolower($c['name'] ?? '');
                $price = floatval($c['price'] ?? 0);

                $isLux = strpos($cat, 'luxury') !== false || 
                         strpos($cat, 'vip') !== false || 
                         strpos($name, 'bmw') !== false || 
                         strpos($name, 'mercedes') !== false || 
                         strpos($name, 'audi') !== false || 
                         strpos($name, 'thar') !== false || 
                         strpos($name, 'defender') !== false || 
                         strpos($name, 'fortuner') !== false || 
                         $price >= 4000;

                $c['vehicle_group'] = $isLux ? 'Luxury' : 'Four Wheelers';
                $c['type'] = 'car';
                $inventory[] = $c;
            }
        } else {
            // Hotel Vendor inventory
            $hStmt = $pdo->prepare("SELECT * FROM hotels WHERE vendor_id = ? OR vendor_id = ?");
            $hStmt->execute([$vendorId, 'u-5']);
            $hotels = $hStmt->fetchAll(PDO::FETCH_ASSOC);

            $rStmt = $pdo->prepare("SELECT * FROM hotel_room_types WHERE vendor_id = ? OR vendor_id = ?");
            $rStmt->execute([$vendorId, 'u-5']);
            $rooms = $rStmt->fetchAll(PDO::FETCH_ASSOC);

            $inventory = [
                'hotels' => $hotels,
                'rooms' => $rooms
            ];
        }

        // Fetch Verified Reviews for this Vendor
        $reviews = [];
        try {
            $revStmt = $pdo->prepare("SELECT id, customer_name, rating, review_text, created_at FROM customer_reviews WHERE (vendor_id = ? OR item_id IN (SELECT id FROM cars WHERE vendor_id = ?) OR item_id IN (SELECT id FROM bikes WHERE vendor_id = ?)) ORDER BY created_at DESC LIMIT 10");
            $revStmt->execute([$vendorId, $vendorId, $vendorId]);
            $reviews = $revStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Fallback for simple reviews query or empty
            try {
                $revStmt = $pdo->prepare("SELECT * FROM customer_reviews WHERE vendor_id = ? LIMIT 10");
                $revStmt->execute([$vendorId]);
                $reviews = $revStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e2) {
                $reviews = [];
            }
        }

        echo json_encode([
            "success" => true,
            "website" => formatWebsiteRow($site),
            "inventory" => $inventory,
            "reviews" => $reviews
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 5. ACTION: TRACK VENDOR BOOKING (Live Customer Tracking) ─────────────────
if ($currentAction === 'track_vendor_booking' || $currentResource === 'track_vendor_booking') {
    $bookingId = trim($reqPayload['booking_id'] ?? ($_GET['booking_id'] ?? ''));
    $phone = trim($reqPayload['phone'] ?? ($_GET['phone'] ?? ''));
    $slug = trim($reqPayload['slug'] ?? ($_GET['slug'] ?? ''));

    if (!$bookingId && !$phone) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Please enter your Booking ID or registered Mobile Number."]);
        exit;
    }

    $rawBookingId = trim($bookingId);
    $cleanBookingId = trim(ltrim($rawBookingId, '#'));
    $numericBookingId = preg_replace('/\D/', '', $cleanBookingId);

    $cleanPhone = preg_replace('/\D/', '', $phone);
    $last10 = strlen($cleanPhone) >= 10 ? substr($cleanPhone, -10) : $cleanPhone;
    $last4 = strlen($cleanPhone) >= 4 ? substr($cleanPhone, -4) : $cleanPhone;

    try {
        $bookings = [];

        if ($cleanBookingId && $cleanPhone) {
            // Case 1: Both Booking ID and Phone provided -> exact match
            $sql = "SELECT * FROM bookings WHERE 
                (
                    id = ? 
                    OR id = ? 
                    OR id LIKE ? 
                    OR id LIKE ? 
                    OR (? != '' AND id LIKE ?)
                ) 
                AND 
                (
                    phone = ? 
                    OR phone LIKE ? 
                    OR phone LIKE ? 
                    OR phone LIKE ? 
                    OR (? != '' AND phone LIKE ?)
                    OR phone = ?
                )
                ORDER BY id DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $cleanBookingId,
                $rawBookingId,
                "%$cleanBookingId%",
                "%$rawBookingId%",
                $numericBookingId,
                "%$numericBookingId%",
                $cleanPhone,
                "%$cleanPhone%",
                "%$last10%",
                "%$last4%",
                $last10,
                "%$last10%",
                $phone
            ]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($cleanPhone) {
            // Case 2: Only Phone provided -> find all bookings for this customer
            $sql = "SELECT * FROM bookings WHERE 
                (
                    phone = ? 
                    OR phone LIKE ? 
                    OR phone LIKE ? 
                    OR phone LIKE ? 
                    OR (? != '' AND phone LIKE ?)
                    OR phone = ?
                )
                ORDER BY id DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $cleanPhone,
                "%$cleanPhone%",
                "%$last10%",
                "%$last4%",
                $last10,
                "%$last10%",
                $phone
            ]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // Case 3: Only Booking ID provided
            $sql = "SELECT * FROM bookings WHERE 
                (
                    id = ? 
                    OR id = ? 
                    OR id LIKE ? 
                    OR id LIKE ? 
                    OR (? != '' AND id LIKE ?)
                )
                ORDER BY id DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $cleanBookingId,
                $rawBookingId,
                "%$cleanBookingId%",
                "%$rawBookingId%",
                $numericBookingId,
                "%$numericBookingId%"
            ]);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        if (empty($bookings)) {
            http_response_code(404);
            $searchDesc = $bookingId && $phone ? "ID $rawBookingId and mobile $phone" : ($phone ? "mobile $phone" : "Booking ID $rawBookingId");
            echo json_encode(["success" => false, "error" => "No booking found matching $searchDesc. Please check your details."]);
            exit;
        }

        // Fetch vendor website branding for the first booking
        $primaryBooking = $bookings[0];
        $website = null;
        if (!empty($primaryBooking['vendor_id'])) {
            $wStmt = $pdo->prepare("SELECT site_title, phone, whatsapp_number, hotel_wifi_network, hotel_wifi_password, hotel_checkin_time, hotel_checkout_time, logo_url, banner_url, google_maps_url FROM vendor_websites WHERE vendor_id = ? LIMIT 1");
            $wStmt->execute([$primaryBooking['vendor_id']]);
            $website = $wStmt->fetch(PDO::FETCH_ASSOC);
        }

        if (count($bookings) > 1) {
            echo json_encode([
                "success" => true,
                "multiple" => true,
                "count" => count($bookings),
                "bookings" => $bookings,
                "booking" => $primaryBooking,
                "website" => $website
            ]);
        } else {
            echo json_encode([
                "success" => true,
                "booking" => $primaryBooking,
                "website" => $website
            ]);
        }
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 6. ACTION: UPDATE VEHICLE HANDOVER DETAILS (Vendor Handover Console) ─────
if ($currentAction === 'update_booking_handover') {
    $rawBookingId = trim($reqPayload['booking_id'] ?? '');
    $cleanBookingId = trim(ltrim($rawBookingId, '#'));

    if (!$cleanBookingId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "booking_id is required."]);
        exit;
    }

    try {
        // Fetch current booking record to validate against
        $bStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
        $bStmt->execute([$cleanBookingId, $rawBookingId]);
        $currentBooking = $bStmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentBooking) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Booking #$rawBookingId not found."]);
            exit;
        }

        $assignedPlate = trim($reqPayload['assigned_vehicle_plate'] ?? '');
        $physicalUnitId = trim($reqPayload['physical_unit_id'] ?? ($currentBooking['physical_unit_id'] ?? ''));
        $handoverStatus = trim($reqPayload['handover_status'] ?? ($currentBooking['handover_status'] ?? 'Confirmed'));
        
        $handoverOdo = isset($reqPayload['handover_odometer']) && $reqPayload['handover_odometer'] !== '' ? intval($reqPayload['handover_odometer']) : ($currentBooking['handover_odometer'] !== null ? intval($currentBooking['handover_odometer']) : null);
        $returnOdo = isset($reqPayload['return_odometer']) && $reqPayload['return_odometer'] !== '' ? intval($reqPayload['return_odometer']) : ($currentBooking['return_odometer'] !== null ? intval($currentBooking['return_odometer']) : null);
        
        $handoverFuel = trim($reqPayload['handover_fuel'] ?? ($currentBooking['handover_fuel'] ?? ''));
        $returnFuel = trim($reqPayload['return_fuel'] ?? ($currentBooking['return_fuel'] ?? ''));
        $depositAmt = isset($reqPayload['deposit_amount']) ? floatval($reqPayload['deposit_amount']) : floatval($currentBooking['deposit_amount'] ?? 0);
        $depositStatus = trim($reqPayload['deposit_status'] ?? ($currentBooking['deposit_status'] ?? 'Unpaid'));
        $agentName = trim($reqPayload['delivery_agent_name'] ?? ($currentBooking['delivery_agent_name'] ?? ''));
        $agentPhone = trim($reqPayload['delivery_agent_phone'] ?? ($currentBooking['delivery_agent_phone'] ?? ''));
        $handedOverAt = trim($reqPayload['handed_over_at'] ?? ($currentBooking['handed_over_at'] ?? ''));
        $returnedAt = trim($reqPayload['returned_at'] ?? ($currentBooking['returned_at'] ?? ''));
        $nowTs = date('Y-m-d H:i:s');

        // 1. Odometer Validations
        if ($handoverOdo !== null && $handoverOdo < 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Starting odometer reading cannot be negative."]);
            exit;
        }
        if ($returnOdo !== null && $returnOdo < 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Return odometer reading cannot be negative."]);
            exit;
        }
        if ($returnOdo !== null && $handoverOdo !== null && $returnOdo < $handoverOdo) {
            http_response_code(400);
            echo json_encode([
                "success" => false, 
                "error" => "Return odometer ($returnOdo KM) cannot be less than starting odometer ($handoverOdo KM)."
            ]);
            exit;
        }
        if (in_array(strtolower($handoverStatus), ['returned', 'completed']) && $returnOdo === null) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Return odometer is required when marking the vehicle as Returned."]);
            exit;
        }

        // 2. Physical Vehicle Unit Association & Overlapping Booking Conflict Check
        $bItemId = $currentBooking['item_id'] ?? '';
        $bPickup = substr(trim($currentBooking['pickup_date'] ?? ''), 0, 10);
        $bDrop = substr(trim($currentBooking['drop_date'] ?? ''), 0, 10);

        // If physical unit selected, sync its plate number
        if ($physicalUnitId) {
            $uStmt = $pdo->prepare("SELECT id, registration_no, unit_name FROM vehicle_units WHERE id = ? LIMIT 1");
            $uStmt->execute([$physicalUnitId]);
            $unitRow = $uStmt->fetch(PDO::FETCH_ASSOC);
            if ($unitRow && !$assignedPlate) {
                $assignedPlate = $unitRow['registration_no'];
            }
        } elseif ($assignedPlate && $bItemId) {
            // If plate entered manually, check if it matches a registered vehicle_units record
            $uStmt = $pdo->prepare("SELECT id FROM vehicle_units WHERE (registration_no = ? OR registration_no = ?) AND vehicle_id = ? LIMIT 1");
            $uStmt->execute([$assignedPlate, strtoupper($assignedPlate), $bItemId]);
            $unitRow = $uStmt->fetch(PDO::FETCH_ASSOC);
            if ($unitRow) {
                $physicalUnitId = $unitRow['id'];
            }
        }

        // Check if physical unit or plate is already assigned to another overlapping active booking
        if (($physicalUnitId || $assignedPlate) && $bPickup && $bDrop) {
            $confSql = "SELECT id, name, pickup_date, drop_date, assigned_vehicle_plate FROM bookings 
                        WHERE id != ? AND id != ? 
                          AND status NOT IN ('Cancelled', 'Rejected') 
                          AND (
                            (? != '' AND physical_unit_id = ?) 
                            OR (? != '' AND UPPER(assigned_vehicle_plate) = UPPER(?))
                          )
                          AND (pickup_date < ? AND drop_date > ?) LIMIT 1";
            $confStmt = $pdo->prepare($confSql);
            $confStmt->execute([
                $cleanBookingId, $rawBookingId,
                $physicalUnitId, $physicalUnitId,
                $assignedPlate, $assignedPlate,
                $bDrop, $bPickup
            ]);
            $conflict = $confStmt->fetch(PDO::FETCH_ASSOC);

            if ($conflict) {
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "error" => "Vehicle plate {$assignedPlate} is already assigned to active booking #{$conflict['id']} for dates {$conflict['pickup_date']} to {$conflict['drop_date']}."
                ]);
                exit;
            }
        }

        // 3. Handover & Return Timestamps
        if (!$handedOverAt && in_array(strtolower($handoverStatus), ['handed over', 'active trip', 'completed', 'returned'])) {
            $handedOverAt = $nowTs;
        }
        if (!$returnedAt && (in_array(strtolower($handoverStatus), ['returned', 'completed']) || $returnOdo !== null)) {
            $returnedAt = $nowTs;
        }

        // 4. Update Booking Record
        $sql = "UPDATE bookings SET 
            assigned_vehicle_plate = ?,
            physical_unit_id = COALESCE(NULLIF(?, ''), physical_unit_id),
            handover_status = ?,
            handover_odometer = ?,
            return_odometer = ?,
            handover_fuel = ?,
            return_fuel = ?,
            deposit_amount = ?,
            deposit_status = ?,
            delivery_agent_name = ?,
            delivery_agent_phone = ?,
            handed_over_at = ?,
            returned_at = ?
            WHERE id = ? OR id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $assignedPlate,
            $physicalUnitId,
            $handoverStatus,
            $handoverOdo,
            $returnOdo,
            $handoverFuel,
            $returnFuel,
            $depositAmt,
            $depositStatus,
            $agentName,
            $agentPhone,
            $handedOverAt,
            $returnedAt,
            $cleanBookingId,
            $rawBookingId
        ]);

        // 5. Status Workflow Synchronization
        require_once __DIR__ . '/BookingService.php';

        if (in_array(strtolower($handoverStatus), ['returned', 'completed']) || $returnOdo !== null) {
            $pdo->prepare("UPDATE bookings SET status = 'Completed', returned_at = COALESCE(NULLIF(returned_at, ''), ?) WHERE id = ? OR id = ?")
                ->execute([$nowTs, $cleanBookingId, $rawBookingId]);
        } elseif (in_array(strtolower($handoverStatus), ['handed over', 'active trip'])) {
            // If booking was unconfirmed, confirm and deduct platform fee
            if (($currentBooking['wallet_deduction_status'] ?? '') !== 'Completed') {
                try {
                    BookingService::confirmBookingAndDeductPlatformFee($pdo, $cleanBookingId, $currentBooking['vendor_id'] ?? null);
                } catch (Exception $e) {
                    // Non-fatal if already handled
                }
            }
            $pdo->prepare("UPDATE bookings SET status = CASE WHEN status = 'Completed' THEN 'Completed' ELSE 'Pickup' END, handed_over_at = COALESCE(NULLIF(handed_over_at, ''), ?) WHERE id = ? OR id = ?")
                ->execute([$nowTs, $cleanBookingId, $rawBookingId]);
        } elseif (in_array(strtolower($handoverStatus), ['dispatched', 'confirmed'])) {
            if (($currentBooking['status'] ?? '') === 'Pending') {
                if (($currentBooking['wallet_deduction_status'] ?? '') !== 'Completed') {
                    try {
                        BookingService::confirmBookingAndDeductPlatformFee($pdo, $cleanBookingId, $currentBooking['vendor_id'] ?? null);
                    } catch (Exception $e) {
                        // Non-fatal
                    }
                }
                $pdo->prepare("UPDATE bookings SET status = 'Confirmed' WHERE id = ? OR id = ?")
                    ->execute([$cleanBookingId, $rawBookingId]);
            }
        }

        // Return authoritative updated booking
        $fetchStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
        $fetchStmt->execute([$cleanBookingId, $rawBookingId]);
        $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => "Vehicle handover details updated and synced successfully!",
            "booking" => $updated
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 7. ACTION: UPDATE HOTEL CHECK-IN DETAILS (Front Desk Console) ─────────────
if ($currentAction === 'update_booking_checkin') {
    $rawBookingId = trim($reqPayload['booking_id'] ?? '');
    $cleanBookingId = trim(ltrim($rawBookingId, '#'));

    if (!$cleanBookingId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "booking_id is required."]);
        exit;
    }

    try {
        $assignedRoom = trim($reqPayload['assigned_room_no'] ?? '');
        $checkinStatus = trim($reqPayload['checkin_status'] ?? 'Checked In');
        $mealPlan = trim($reqPayload['meal_plan'] ?? '');

        $sql = "UPDATE bookings SET 
            assigned_room_no = COALESCE(NULLIF(?, ''), assigned_room_no),
            checkin_status = ?,
            meal_plan = COALESCE(NULLIF(?, ''), meal_plan)
            WHERE id = ? OR id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$assignedRoom, $checkinStatus, $mealPlan, $cleanBookingId, $rawBookingId]);

        $fetchStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
        $fetchStmt->execute([$cleanBookingId, $rawBookingId]);
        $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "message" => "Hotel guest check-in & room details updated successfully!",
            "booking" => $updated
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 8. ACTION: DISPATCH CUSTOMER BOOKING VOUCHER EMAIL ────────────────────────
function dispatchBookingVoucherEmail($pdo, $bookingId, $recipientOverride = null) {
    $rawBookingId = trim($bookingId ?? '');
    $cleanBookingId = trim(ltrim($rawBookingId, '#'));
    
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
    $stmt->execute([$cleanBookingId, $rawBookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        return ["success" => false, "error" => "Booking #$rawBookingId not found."];
    }

    $recipient = trim($recipientOverride ?: ($booking['email'] ?? ''));
    if (empty($recipient) || stripos($recipient, '@guest.wowgoa.com') !== false || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        return ["success" => false, "error" => "A valid customer email address is required to dispatch the voucher."];
    }

    // Update booking email if new email provided
    if ($recipient !== ($booking['email'] ?? '')) {
        $pdo->prepare("UPDATE bookings SET email = ? WHERE id = ? OR id = ?")->execute([$recipient, $cleanBookingId, $rawBookingId]);
    }

    $vendorId = $booking['vendor_id'] ?? '';
    $siteTitle = 'WOW GOA Rentals & Stays';
    $vendorPhone = '+91 9916933476';
    if ($vendorId) {
        $wStmt = $pdo->prepare("SELECT site_title, phone, whatsapp_number, slug FROM vendor_websites WHERE vendor_id = ? LIMIT 1");
        $wStmt->execute([$vendorId]);
        $wRow = $wStmt->fetch(PDO::FETCH_ASSOC);
        if ($wRow) {
            $siteTitle = $wRow['site_title'] ?: $siteTitle;
            $vendorPhone = $wRow['phone'] ?: $vendorPhone;
        }
    }

    $bId = htmlspecialchars($booking['id'] ?? $cleanBookingId);
    $custName = htmlspecialchars($booking['name'] ?? ($booking['customer_name'] ?? 'Valued Customer'));
    $itemName = htmlspecialchars($booking['item_name'] ?? 'Vehicle Rental');
    $pickupLoc = htmlspecialchars($booking['pickup_loc'] ?? ($booking['pickup_location'] ?? 'Goa Delivery'));
    $dropLoc = htmlspecialchars($booking['drop_loc'] ?? ($booking['drop_location'] ?? $pickupLoc));
    $pickupDate = htmlspecialchars($booking['pickup_date'] ?? '—');
    $pickupTime = htmlspecialchars($booking['pickup_time'] ?? '10:00 AM');
    $dropDate = htmlspecialchars($booking['drop_date'] ?? ($booking['return_date'] ?? '—'));
    $dropTime = htmlspecialchars($booking['drop_time'] ?? '10:00 AM');
    $totalAmt = number_format(floatval($booking['total_amount'] ?? ($booking['total_paid'] ?? 0)), 2);
    $payMode = htmlspecialchars($booking['payment_method'] ?? ($booking['payment_mode'] ?? 'UPI'));
    $payStatus = htmlspecialchars($booking['payment_status'] ?? 'Paid');
    $plate = htmlspecialchars($booking['assigned_vehicle_plate'] ?? 'Allocating on Dispatch');
    $nowFmt = date('d M Y, h:i A');

    $subject = "🎟️ Booking Voucher & Confirmation #{$bId} — {$itemName} | WOW GOA";

    $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
.card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
.header { background: linear-gradient(135deg, #0D1B2E 0%, #1e3a5f 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
.badge { display: inline-block; background: #FF6333; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
.content { padding: 24px; }
.section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.info-label { color: #64748b; font-weight: 500; }
.info-val { color: #0f172a; font-weight: 600; text-align: right; }
.highlight-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0; }
.footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
.btn-cta { display: inline-block; background: #FF6333; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-top: 14px; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WOW GOA RENTALS & EXPERIENCES</h2>
    <div style="font-size: 13px; opacity: 0.85; margin-top: 4px;">Official Travel Reservation Voucher</div>
    <div class="badge">Booking #{$bId} • Confirmed</div>
  </div>
  <div class="content">
    <p style="font-size: 14px; margin-top: 0;">Dear <strong>{$custName}</strong>,</p>
    <p style="font-size: 13px; color: #475569; line-height: 1.5;">Thank you for booking with WOW GOA! Your reservation is confirmed. Please keep this voucher handy during vehicle pickup or service coordination.</p>
    
    <div class="highlight-box">
      <div class="section-title">Reserved Vehicle / Service Details</div>
      <div style="font-size: 16px; font-weight: 700; color: #0D1B2E; margin-bottom: 8px;">{$itemName}</div>
      <div class="info-row"><span class="info-label">Commercial Plate</span><span class="info-val" style="color: #ea580c; font-family: monospace;">{$plate}</span></div>
      <div class="info-row"><span class="info-label">Pickup Schedule</span><span class="info-val">{$pickupDate} at {$pickupTime}</span></div>
      <div class="info-row"><span class="info-label">Pickup Location</span><span class="info-val">📍 {$pickupLoc}</span></div>
      <div class="info-row"><span class="info-label">Return Schedule</span><span class="info-val">{$dropDate} at {$dropTime}</span></div>
      <div class="info-row"><span class="info-label">Return Location</span><span class="info-val">📍 {$dropLoc}</span></div>
    </div>

    <div class="highlight-box">
      <div class="section-title">Payment & Billing Summary</div>
      <div class="info-row"><span class="info-label">Total Amount</span><span class="info-val" style="color: #16a34a; font-size: 15px;">₹{$totalAmt}</span></div>
      <div class="info-row"><span class="info-label">Payment Mode</span><span class="info-val">{$payMode}</span></div>
      <div class="info-row"><span class="info-label">Payment Status</span><span class="info-val" style="color: #16a34a;">✓ {$payStatus}</span></div>
    </div>

    <div class="highlight-box" style="border-left: 4px solid #FF6333;">
      <div class="section-title" style="color: #ea580c;">Important Guidelines for Goa Rentals</div>
      <ul style="font-size: 12px; color: #475569; margin: 0; padding-left: 18px; line-height: 1.6;">
        <li>Please present your <strong>Original Physical Driving License</strong> at key handover.</li>
        <li>Helmets are mandatory for both rider and pillion on all 2-wheelers across Goa.</li>
        <li>Vehicle should be returned with the same fuel level as recorded during handover.</li>
        <li>For airport delivery, our handover executive coordinates directly outside arrivals.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="http://localhost:5173" class="btn-cta">Track Booking Live & Manage Rental →</a>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Helpline: {$vendorPhone} • Email: bookings@wowgoa.com</div>
    </div>
  </div>
  <div class="footer">
    © 2026 WOW GOA • Goa Airport (Dabolim & Mopa) • Panaji • Calangute<br>
    Official Customer Reservation Voucher
  </div>
</div>
</body>
</html>
HTML;

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: WOW GOA Bookings <bookings@wowgoa.com>\r\n";
    $headers .= "Reply-To: support@wowgoa.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    @mail($recipient, $subject, $html, $headers);

    // Save dispatch record to backend/uploads/voucher_emails.log
    $logDir = __DIR__ . '/uploads';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    $logEntry = "[" . date('Y-m-d H:i:s') . "] TO: $recipient | BOOKING: $cleanBookingId | ITEM: $itemName\n";
    @file_put_contents($logDir . '/voucher_emails.log', $logEntry, FILE_APPEND);

    // Update database
    $pdo->prepare("UPDATE bookings SET 
        voucher_email_sent = 1, 
        voucher_email_sent_at = ?, 
        voucher_email_recipient = ? 
        WHERE id = ? OR id = ?")
        ->execute([$nowFmt, $recipient, $cleanBookingId, $rawBookingId]);

    // Fetch updated record
    $fetchStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR id = ? LIMIT 1");
    $fetchStmt->execute([$cleanBookingId, $rawBookingId]);
    $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    return [
        "success" => true,
        "message" => "Booking voucher successfully emailed to $recipient!",
        "sent_at" => $nowFmt,
        "recipient" => $recipient,
        "booking" => $updated
    ];
}

if ($currentAction === 'send_booking_voucher_email') {
    $rawBookingId = trim($reqPayload['booking_id'] ?? '');
    $recipient = trim($reqPayload['recipient_email'] ?? '');

    if (!$rawBookingId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "booking_id is required."]);
        exit;
    }

    try {
        $res = dispatchBookingVoucherEmail($pdo, $rawBookingId, $recipient);
        if (!$res['success']) {
            http_response_code(400);
            echo json_encode($res);
            exit;
        }

        echo json_encode($res);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 9. ACTION: RECORD STOREFRONT VISITOR LEAD (Public from /v/:slug) ────────
if ($currentAction === 'record_storefront_lead') {
    $name = trim($reqPayload['name'] ?? '');
    $phone = preg_replace('/\D/', '', $reqPayload['phone'] ?? '');
    $email = strtolower(trim($reqPayload['email'] ?? ''));
    $slug = trim($reqPayload['slug'] ?? '');
    $vendorId = trim($reqPayload['vendor_id'] ?? '');

    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Please enter your name to claim your discount."]);
        exit;
    }
    if (empty($phone) || strlen($phone) < 10) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Please enter a valid 10-digit mobile number."]);
        exit;
    }

    $last10 = substr($phone, -10);

    try {
        // Resolve vendor details if slug provided
        $vendorTitle = 'Verified Partner';
        $vendorType = 'vehicle';
        if ($slug || $vendorId) {
            $stmtSite = $pdo->prepare("SELECT vendor_id, site_title, vendor_type, slug FROM vendor_websites WHERE slug = ? OR vendor_id = ? LIMIT 1");
            $stmtSite->execute([$slug, $vendorId]);
            $siteRow = $stmtSite->fetch(PDO::FETCH_ASSOC);
            if ($siteRow) {
                $vendorId = $siteRow['vendor_id'];
                $vendorTitle = $siteRow['site_title'];
                $vendorType = $siteRow['vendor_type'];
                $slug = $siteRow['slug'];
            }
        }

        // Check if customer already has a completed booking with this phone
        $chkBook = $pdo->prepare("SELECT id, status, total_amount, item_name, created_at FROM bookings WHERE (phone LIKE ? OR phone LIKE ?) AND status NOT IN ('Cancelled', 'Rejected') ORDER BY id DESC LIMIT 1");
        $chkBook->execute(["%$last10", "%$phone"]);
        $existingBook = $chkBook->fetch(PDO::FETCH_ASSOC);

        $leadStatus = 'unbooked';
        $convBookingId = null;
        if ($existingBook) {
            $leadStatus = 'converted';
            $convBookingId = $existingBook['id'];
        }

        // Check if a lead record already exists for this phone and vendor
        $chkLead = $pdo->prepare("SELECT id FROM storefront_leads WHERE (phone LIKE ? OR phone LIKE ?) AND (vendor_slug = ? OR vendor_id = ?) LIMIT 1");
        $chkLead->execute(["%$last10", "%$phone", $slug, $vendorId]);
        $existingLead = $chkLead->fetch(PDO::FETCH_ASSOC);

        $nowStr = date('Y-m-d H:i:s');
        if ($existingLead) {
            $upd = $pdo->prepare("UPDATE storefront_leads SET 
                name = ?, 
                email = COALESCE(NULLIF(?, ''), email),
                vendor_title = ?, 
                vendor_type = ?,
                status = CASE WHEN status = 'converted' THEN 'converted' ELSE ? END,
                converted_booking_id = COALESCE(?, converted_booking_id),
                updated_at = ?
                WHERE id = ?");
            $upd->execute([$name, $email, $vendorTitle, $vendorType, $leadStatus, $convBookingId, $nowStr, $existingLead['id']]);
            $leadId = $existingLead['id'];
        } else {
            $ins = $pdo->prepare("INSERT INTO storefront_leads 
                (name, phone, email, vendor_id, vendor_slug, vendor_title, vendor_type, discount_code, discount_amount, status, converted_booking_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'WOW500', 500.00, ?, ?, ?, ?)");
            $ins->execute([$name, $phone, $email, $vendorId, $slug, $vendorTitle, $vendorType, $leadStatus, $convBookingId, $nowStr, $nowStr]);
            $leadId = $pdo->lastInsertId();
        }

        echo json_encode([
            "success" => true,
            "message" => "Congratulations! ₹500 discount voucher has been unlocked for {$vendorTitle}.",
            "discount_code" => "WOW500",
            "discount_amount" => 500,
            "lead_id" => $leadId,
            "customer" => [
                "name" => $name,
                "phone" => $phone
            ]
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 10. ACTION: GET STOREFRONT LEADS (Admin & Super Admin ONLY) ─────────────
if ($currentAction === 'get_storefront_leads') {
    try {
        $stmt = $pdo->query("SELECT * FROM storefront_leads ORDER BY id DESC LIMIT 500");
        $leads = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        // Cross-check dynamically with bookings table to ensure up-to-the-minute conversion status
        $enriched = [];
        foreach ($leads as $l) {
            $rawP = preg_replace('/\D/', '', $l['phone'] ?? '');
            $l10 = strlen($rawP) >= 10 ? substr($rawP, -10) : $rawP;

            $bookingMatch = null;
            if ($l10) {
                $bStmt = $pdo->prepare("SELECT id, status, item_name, total_amount, created_at FROM bookings WHERE (phone LIKE ? OR phone LIKE ?) AND status NOT IN ('Cancelled', 'Rejected') ORDER BY id DESC LIMIT 1");
                $bStmt->execute(["%$l10", "%$rawP"]);
                $bookingMatch = $bStmt->fetch(PDO::FETCH_ASSOC);
            }

            if ($bookingMatch) {
                $l['status'] = 'converted';
                $l['converted_booking_id'] = $bookingMatch['id'];
                $l['converted_booking_item'] = $bookingMatch['item_name'];
                $l['converted_booking_amount'] = $bookingMatch['total_amount'];
                $l['converted_booking_status'] = $bookingMatch['status'];
                $l['converted_booking_date'] = $bookingMatch['created_at'];
            } else {
                $l['status'] = 'unbooked';
                $l['converted_booking_id'] = null;
            }

            $enriched[] = $l;
        }

        echo json_encode(["success" => true, "leads" => $enriched]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// ─── 11. ACTION: UPDATE STOREFRONT LEAD NOTES/STATUS (Admin action) ───────────
if ($currentAction === 'update_storefront_lead') {
    $leadId = intval($reqPayload['id'] ?? 0);
    $notes = trim($reqPayload['notes'] ?? '');

    if (!$leadId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Lead ID is required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE storefront_leads SET notes = ?, updated_at = ? WHERE id = ?");
        $stmt->execute([$notes, date('Y-m-d H:i:s'), $leadId]);
        echo json_encode(["success" => true, "message" => "Lead notes updated successfully."]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}


