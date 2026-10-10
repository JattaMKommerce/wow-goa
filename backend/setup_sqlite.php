<?php
// backend/setup_sqlite.php

$dbFile = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$dbFile");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "1. Initializing SQLite tables...\n";

$pdo->exec("
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  name VARCHAR(255) DEFAULT '',
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(50) DEFAULT '',
  city VARCHAR(100) DEFAULT 'Goa',
  password_hash VARCHAR(255),
  role VARCHAR(50),
  billing_price DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  kyc_status VARCHAR(50) DEFAULT 'verified',
  plain_password VARCHAR(255),
  is_online INT DEFAULT 0,
  last_active_at DATETIME,
  date_of_birth VARCHAR(50) DEFAULT NULL,
  admin_id VARCHAR(50),
  created_at DATETIME
);

DROP TABLE IF EXISTS vendors;
CREATE TABLE vendors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  role VARCHAR(50) DEFAULT 'vendor',
  admin_id VARCHAR(50),
  allow_hold_booking INT DEFAULT 1,
  hold_type VARCHAR(20) DEFAULT 'percentage',
  hold_value DECIMAL(10,2) DEFAULT 20.00,
  hold_due_policy VARCHAR(100) DEFAULT 'checkin',
  min_booking_amount DECIMAL(10,2) DEFAULT 500.00,
  created_at DATE
);

CREATE TABLE IF NOT EXISTS vendor_hold_settings (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50) NOT NULL UNIQUE,
  allow_hold_booking INT DEFAULT 1,
  hold_type VARCHAR(20) DEFAULT 'percentage',
  hold_value DECIMAL(10,2) DEFAULT 20.00,
  hold_due_policy VARCHAR(100) DEFAULT 'checkin',
  min_booking_amount DECIMAL(10,2) DEFAULT 500.00,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS hotels (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50),
  name VARCHAR(255),
  area VARCHAR(255),
  location VARCHAR(255),
  price INT,
  stars INT DEFAULT 4,
  amenities TEXT,
  rating DECIMAL(3,2) DEFAULT 4.60,
  badge VARCHAR(50) DEFAULT 'Premium',
  image TEXT,
  description TEXT,
  is_available INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50),
  name VARCHAR(255),
  duration VARCHAR(100),
  car_included VARCHAR(255),
  hotel_included VARCHAR(255),
  price INT,
  description TEXT,
  tag VARCHAR(100) DEFAULT 'Popular',
  image TEXT,
  image_url VARCHAR(255),
  images_json TEXT,
  package_type VARCHAR(100) DEFAULT 'Trip Package',
  flights_included VARCHAR(255) DEFAULT '1',
  food_included VARCHAR(255) DEFAULT 'Breakfast Included',
  pickup_drop_included VARCHAR(255) DEFAULT 'Free Airport Pickup & Drop',
  places_included TEXT DEFAULT 'Goa & Surroundings',
  price_with_flight INT DEFAULT 18999,
  is_flight_customizable INT DEFAULT 1,
  base_flight_price INT DEFAULT 4500,
  is_cab_customizable INT DEFAULT 1,
  company_cab_price INT DEFAULT 2500,
  pickup_drop_price INT DEFAULT 0,
  pickup_drop_image VARCHAR(255),
  day_wise_itinerary TEXT,
  cancellation_policy TEXT,
  highlights_json TEXT,
  inclusions_exclusions_json TEXT,
  advance_percentage INT DEFAULT 25,
  package_addons_json TEXT,
  destination VARCHAR(100) DEFAULT 'Goa',
  pax VARCHAR(50) DEFAULT '2A 0C 0I',
  costing_type VARCHAR(100) DEFAULT 'Service Wise Cost',
  currency VARCHAR(20) DEFAULT 'INR',
  admin_id VARCHAR(50) DEFAULT 'admin',
  status VARCHAR(50) DEFAULT 'published',
  hotel_source VARCHAR(50) DEFAULT 'inventory',
  hotel_inventory_id VARCHAR(50),
  hotel_selection_type VARCHAR(50) DEFAULT 'specific',
  hotel_category VARCHAR(50) DEFAULT '3_star',
  hotel_room_type VARCHAR(100),
  hotel_custom_json TEXT,
  vehicle_source VARCHAR(50) DEFAULT 'inventory',
  vehicle_inventory_id VARCHAR(50),
  vehicle_type VARCHAR(50) DEFAULT 'car',
  vehicle_custom_json TEXT,
  driver_included INT DEFAULT 0,
  driver_type VARCHAR(100),
  driver_pricing_type VARCHAR(50) DEFAULT 'included',
  driver_amount INT DEFAULT 0,
  sightseeing_custom_json TEXT,
  activity_source VARCHAR(50) DEFAULT 'inventory',
  activity_inventory_id VARCHAR(50),
  activity_custom_json TEXT,
  flight_source VARCHAR(50) DEFAULT 'inventory',
  flight_inventory_id VARCHAR(50),
  flight_custom_json TEXT
);

CREATE TABLE IF NOT EXISTS cars (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50),
  name VARCHAR(255),
  category VARCHAR(100),
  price INT,
  seating VARCHAR(50),
  fuel VARCHAR(50),
  transmission VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 4.80,
  badge VARCHAR(50) DEFAULT 'Popular',
  image TEXT,
  location VARCHAR(255) DEFAULT 'Goa Delivery',
  is_available INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bikes (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50),
  name VARCHAR(255),
  category VARCHAR(100),
  price INT,
  engine VARCHAR(50),
  fuel VARCHAR(50),
  mileage VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 4.70,
  badge VARCHAR(50) DEFAULT 'Popular',
  image TEXT,
  location VARCHAR(255) DEFAULT 'Goa Delivery',
  is_available INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS destinations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  region VARCHAR(255),
  description TEXT,
  tag VARCHAR(255),
  image TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  license VARCHAR(100),
  pickup_loc VARCHAR(255),
  drop_loc VARCHAR(255),
  pickup_date VARCHAR(50),
  pickup_time VARCHAR(50),
  drop_date VARCHAR(50),
  drop_time VARCHAR(50),
  item_id VARCHAR(50),
  item_name VARCHAR(255),
  booking_days INT,
  total_amount INT DEFAULT 0,
  amount_paid INT DEFAULT 0,
  remaining_amount INT DEFAULT 0,
  total_paid INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Confirmed',
  payment_status VARCHAR(50) DEFAULT 'Full',
  customizations TEXT,
  created_at DATETIME
);

CREATE TABLE IF NOT EXISTS markups (
  id VARCHAR(50) PRIMARY KEY,
  vendor_id VARCHAR(50),
  entity_type VARCHAR(50),
  item_id VARCHAR(50) DEFAULT 'all',
  markup_type VARCHAR(50) DEFAULT 'percentage',
  markup_value DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_enquiries (
  enquiry_id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  departure_city VARCHAR(100),
  destinations VARCHAR(255) DEFAULT 'Goa',
  travel_dates VARCHAR(100),
  flexible_dates INT DEFAULT 0,
  adults INT DEFAULT 2,
  children INT DEFAULT 0,
  infants INT DEFAULT 0,
  budget_range VARCHAR(100),
  hotel_category VARCHAR(100),
  room_type VARCHAR(100),
  meal_pref VARCHAR(100),
  req_flight INT DEFAULT 0,
  req_train INT DEFAULT 0,
  req_car INT DEFAULT 0,
  req_bike INT DEFAULT 0,
  req_airport_pickup INT DEFAULT 0,
  req_sightseeing INT DEFAULT 0,
  req_adventure INT DEFAULT 0,
  trip_type VARCHAR(100) DEFAULT 'Holiday Tour',
  special_requests TEXT,
  documents_json TEXT,
  status VARCHAR(50) DEFAULT 'New Enquiry',
  assigned_to VARCHAR(100),
  admin_id VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiry_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id VARCHAR(50),
  action_type VARCHAR(100),
  notes TEXT,
  follow_up_date VARCHAR(50),
  attachment_url TEXT,
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_leads (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  destination VARCHAR(255),
  dates VARCHAR(100),
  budget VARCHAR(100),
  pax VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Hot Lead',
  source VARCHAR(50) DEFAULT 'AI Chatbot',
  assigned_to VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotel_room_types (
  id VARCHAR(50) PRIMARY KEY,
  hotel_id VARCHAR(50),
  vendor_id VARCHAR(100),
  name VARCHAR(255),
  internal_code VARCHAR(50),
  description TEXT,
  total_rooms INT DEFAULT 10,
  max_adults INT DEFAULT 2,
  max_children INT DEFAULT 1,
  max_occupancy INT DEFAULT 3,
  base_occupancy INT DEFAULT 2,
  bed_type VARCHAR(100) DEFAULT 'King',
  num_beds INT DEFAULT 1,
  room_size DECIMAL(10,2) DEFAULT 350,
  room_size_unit VARCHAR(20) DEFAULT 'sqft',
  view_type VARCHAR(100) DEFAULT 'Garden View',
  smoking INT DEFAULT 0,
  air_conditioned INT DEFAULT 1,
  private_bathroom INT DEFAULT 1,
  extra_bed_available INT DEFAULT 0,
  base_price INT DEFAULT 5000,
  selling_price INT DEFAULT 5000,
  weekend_price INT DEFAULT 5000,
  extra_adult_charge INT DEFAULT 0,
  extra_child_charge INT DEFAULT 0,
  extra_bed_charge INT DEFAULT 0,
  amenities_json TEXT,
  images_json TEXT,
  price INT DEFAULT 5000,
  status VARCHAR(50) DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotel_rooms (
  id VARCHAR(50) PRIMARY KEY,
  hotel_id VARCHAR(50),
  room_type_id VARCHAR(50),
  vendor_id VARCHAR(100),
  room_number VARCHAR(50),
  floor VARCHAR(20) DEFAULT '1',
  status VARCHAR(50) DEFAULT 'Available',
  internal_note TEXT
);

CREATE TABLE IF NOT EXISTS hotel_availability_calendar (
  id VARCHAR(100) PRIMARY KEY,
  hotel_id VARCHAR(50),
  room_type_id VARCHAR(50),
  vendor_id VARCHAR(100),
  date VARCHAR(20),
  available_rooms INT,
  price_override INT,
  status VARCHAR(50) DEFAULT 'Available',
  min_stay INT DEFAULT 1,
  stop_sale INT DEFAULT 0,
  block_reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(20) DEFAULT 'fixed',
  discount_value DECIMAL(10,2) DEFAULT 0,
  min_booking_amount DECIMAL(10,2) DEFAULT 0,
  is_active INT DEFAULT 1,
  admin_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS add_ons (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(100),
  price INT,
  description TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS hotel_payment_methods (
  id VARCHAR(100) PRIMARY KEY,
  hotel_id VARCHAR(100),
  vendor_id VARCHAR(100),
  method_type VARCHAR(50),
  details_json TEXT,
  is_active INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Draft',
  superadmin_remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_payment_methods (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100),
  method_type VARCHAR(50),
  display_name VARCHAR(100),
  account_name VARCHAR(100),
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  ifsc_code VARCHAR(50),
  upi_id VARCHAR(100),
  qr_image_url TEXT,
  instructions TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  price INT DEFAULT 0,
  monthly_price INT DEFAULT 0,
  quarterly_price INT DEFAULT 0,
  yearly_price INT DEFAULT 0,
  duration_days INT DEFAULT 30,
  features_json TEXT,
  max_hotels INT DEFAULT 10,
  max_vehicles INT DEFAULT 10,
  max_packages INT DEFAULT 10,
  max_leads INT DEFAULT 100,
  max_staff INT DEFAULT 5,
  storage_mb INT DEFAULT 500,
  commission_percent INT DEFAULT 10,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_wallets (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100) UNIQUE,
  balance DECIMAL(12,2) DEFAULT 0.00,
  reserved_commission INT DEFAULT 0,
  minimum_balance INT DEFAULT 0,
  negative_limit INT DEFAULT -1000,
  negative_booking_count INT DEFAULT 0,
  low_balance_alert_sent INT DEFAULT 0,
  last_low_balance_alert_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(100) PRIMARY KEY,
  vendor_id VARCHAR(100),
  amount DECIMAL(12,2),
  type VARCHAR(50),
  reference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Completed',
  description TEXT,
  balance_before DECIMAL(12,2) DEFAULT NULL,
  balance_after DECIMAL(12,2) DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS global_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siteName VARCHAR(255) DEFAULT 'TripGalileo',
  supportEmail VARCHAR(255) DEFAULT 'support@tripgalileo.com',
  supportPhone VARCHAR(50) DEFAULT '+91 99999 88888',
  logoUrl TEXT,
  faviconUrl TEXT,
  hotel_booking_driver_enabled INT DEFAULT 1,
  max_negative_bookings INT DEFAULT 2,
  min_vendor_wallet_balance DECIMAL(10,2) DEFAULT 1000.00
);

CREATE TABLE IF NOT EXISTS vendor_wallet_alert_logs (
  id VARCHAR(100) PRIMARY KEY,
  alert_id VARCHAR(100) NOT NULL,
  vendor_id VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  wallet_balance DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  provider VARCHAR(100) DEFAULT NULL,
  provider_message_id VARCHAR(255) DEFAULT NULL,
  recipient VARCHAR(255) DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  payload_preview TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS vendor_wallet_alert_dismissals (
  vendor_id VARCHAR(100) NOT NULL,
  alert_id VARCHAR(100) NOT NULL,
  dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_id, alert_id)
);

CREATE TABLE IF NOT EXISTS site_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id VARCHAR(100) DEFAULT 'superadmin',
  booking_fee_deduction INT DEFAULT 500,
  min_wallet_recharge INT DEFAULT 2000,
  max_negative_bookings INT DEFAULT 2
);

CREATE TABLE IF NOT EXISTS flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airline VARCHAR(100) NOT NULL,
  flight_number VARCHAR(100) NOT NULL,
  departure_time VARCHAR(100) DEFAULT '',
  arrival_time VARCHAR(100) DEFAULT '',
  price INT DEFAULT 0,
  from_loc VARCHAR(50) DEFAULT 'GOI',
  to_loc VARCHAR(50) DEFAULT 'DEL',
  duration VARCHAR(50) DEFAULT '',
  seats INT DEFAULT 180,
  vendor_id VARCHAR(100) DEFAULT 'admin',
  admin_id VARCHAR(100) DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flight_bookings (
  id VARCHAR(255) PRIMARY KEY,
  booking_reference VARCHAR(255),
  pnr VARCHAR(100),
  total_amount VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'INR',
  passengers_json TEXT,
  slices_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_reviews (
  id VARCHAR(100) PRIMARY KEY,
  booking_id VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(100) DEFAULT '',
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) DEFAULT '',
  customer_email VARCHAR(255) DEFAULT '',
  service_type VARCHAR(50) DEFAULT '',
  service_name VARCHAR(255) DEFAULT '',
  vendor_id VARCHAR(100) DEFAULT '',
  rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cust_rev_booking ON customer_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_cust_rev_rating ON customer_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_cust_rev_created ON customer_reviews(created_at DESC);
");

$alterColumns = [
    "ALTER TABLE packages ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE destinations ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE hotel_room_types ADD COLUMN base_price INT DEFAULT 5000",
    "ALTER TABLE hotel_room_types ADD COLUMN selling_price INT DEFAULT 5000",
    "ALTER TABLE hotel_room_types ADD COLUMN weekend_price INT DEFAULT 5000",
    "ALTER TABLE hotel_room_types ADD COLUMN extra_adult_charge INT DEFAULT 0",
    "ALTER TABLE hotel_room_types ADD COLUMN extra_child_charge INT DEFAULT 0",
    "ALTER TABLE hotel_room_types ADD COLUMN extra_bed_charge INT DEFAULT 0",
    "ALTER TABLE hotel_room_types ADD COLUMN amenities_json TEXT",
    "ALTER TABLE hotel_room_types ADD COLUMN images_json TEXT",
    "ALTER TABLE hotel_room_types ADD COLUMN status VARCHAR(50) DEFAULT 'Active'",
    "ALTER TABLE hotels ADD COLUMN images_json TEXT",
    "ALTER TABLE hotels ADD COLUMN blocked_dates TEXT",
    "ALTER TABLE hotels ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE cars ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE cars ADD COLUMN images_json TEXT",
    "ALTER TABLE cars ADD COLUMN mileage VARCHAR(50) DEFAULT ''",
    "ALTER TABLE bikes ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE bikes ADD COLUMN images_json TEXT",
    "ALTER TABLE bookings ADD COLUMN admin_id VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN name VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN phone VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN email VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN item_id VARCHAR(100)",
    "ALTER TABLE bookings ADD COLUMN item_name VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN pickup_date VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN drop_date VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN pickup_loc VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN drop_loc VARCHAR(255)",
    "ALTER TABLE bookings ADD COLUMN total_amount INT DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN total_paid INT DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN amount_paid INT DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN remaining_amount INT DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash'",
    "ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT 'Confirmed'",
    "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Paid'",
    "ALTER TABLE bookings ADD COLUMN customizations TEXT",
    "ALTER TABLE bookings ADD COLUMN driver_required INT DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN assigned_driver_id VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN driver_assigned_at DATETIME DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN driver_job_status VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN driver_notes TEXT DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN package_type VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN type VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN package_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN hotel_name VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN vehicle_name VARCHAR(255) DEFAULT NULL",
    "CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        plain_password VARCHAR(255),
        address TEXT,
        profile_photo TEXT,
        aadhaar_card TEXT,
        pan_card TEXT,
        license_number VARCHAR(100),
        license_card TEXT,
        experience_years VARCHAR(50),
        vehicle_details TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        admin_id VARCHAR(50) DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS driver_assignments (
        id VARCHAR(50) PRIMARY KEY,
        driver_id VARCHAR(50) NOT NULL,
        booking_id VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        pickup_loc VARCHAR(255),
        drop_loc VARCHAR(255),
        date VARCHAR(50),
        time VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Assigned',
        assigned_by VARCHAR(50) DEFAULT 'admin',
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )"
];
foreach ($alterColumns as $q) {
    try { $pdo->exec($q); } catch (Exception $e) {}
}

echo "2. Seeding default data...\n";

// Users
$stmt = $pdo->prepare("INSERT OR REPLACE INTO users (id, username, email, password_hash, plain_password, role, billing_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))");
$stmt->execute(['u-1', 'superadmin', 'superadmin@gmail.com', password_hash('superadmin', PASSWORD_DEFAULT), 'superadmin', 'superadmin', 0, 'active']);
$stmt->execute(['u-2', 'admin', 'admin@gmail.com', password_hash('admin@2026', PASSWORD_DEFAULT), 'admin@2026', 'admin', 5000, 'active']);
$stmt->execute(['u-3', 'goa_operations', 'operations@wowgoa.com', password_hash('Ops@Goa2026', PASSWORD_DEFAULT), 'Ops@Goa2026', 'admin', 4500, 'active']);
$stmt->execute(['u-4', 'vendor', 'vendor@tripgalileo.com', password_hash('admin@2026', PASSWORD_DEFAULT), 'Vendor@Fleet26', 'vendor', 2500, 'active']);
$stmt->execute(['u-5', 'hotel_vendor', 'hotel_vendor@tripgalileo.com', password_hash('admin@2026', PASSWORD_DEFAULT), 'Hotel@Goa2026', 'hotel_vendor', 3500, 'active']);
$stmt->execute(['u-6', 'flight_vendor', 'flight_vendor@tripgalileo.com', password_hash('admin@2026', PASSWORD_DEFAULT), 'Flight@Goa2026', 'flight_vendor', 4000, 'active']);
$stmt->execute(['u-sub-1', 'rahul_subadmin', 'subadmin@tripgalileo.com', password_hash('admin@2026', PASSWORD_DEFAULT), 'admin@2026', 'subadmin', 3000, 'active']);
$stmt->execute(['u-drv-1', 'driver', 'driver@wowgoa.com', password_hash('Driver@123', PASSWORD_DEFAULT), 'Driver@123', 'driver', 0, 'active']);

// Drivers
$stmt = $pdo->prepare("INSERT OR REPLACE INTO drivers (id, name, phone, email, password_hash, plain_password, address, profile_photo, aadhaar_card, pan_card, license_number, license_card, experience_years, vehicle_details, status, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    'drv-1',
    'Rajesh Naik',
    '+91 98221 23456',
    'driver@wowgoa.com',
    password_hash('Driver@123', PASSWORD_DEFAULT),
    'Driver@123',
    'House No. 42, Near Calangute Beach, North Goa, 403516',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    'GA-01-20180012345',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    '6 Years in Goa Sightseeing & Airport Transfers',
    'Toyota Innova Crysta (Commercial Tourist Permit)',
    'Approved',
    'admin'
]);
$stmt->execute([
    'drv-2',
    'Suresh Gawde',
    '+91 97654 89012',
    'suresh@wowgoa.com',
    password_hash('Driver@123', PASSWORD_DEFAULT),
    'Driver@123',
    'Plot 18, Near Panaji Bus Stand, Central Goa, 403001',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    'GA-07-20200054321',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    '3 Years Local Goa Driving',
    'Maruti Ertiga (Commercial)',
    'Pending',
    'admin'
]);

// Vendors
$stmt = $pdo->prepare("INSERT OR REPLACE INTO vendors (id, name, email, phone, city, role, created_at) VALUES (?, ?, ?, ?, ?, ?, date('now'))");
$stmt->execute(['vendor-1', 'Goa Premium Wheels Ltd', 'wheels@goa.com', '+91 9999988888', 'Calangute, Goa', 'vendor']);
$stmt->execute(['vendor-2', 'Breeze Rider Co', 'ride@goabreeze.com', '+91 9888877777', 'Vagator, Goa', 'vendor']);
$stmt->execute(['vendor-3', 'Taj Hospitality Partner', 'taj.partner@goa.com', '+91 9777766666', 'Benaulim, Goa', 'hotel_vendor']);
$stmt->execute(['vendor-4', 'IndiGo Flight Connect', 'flights@goa.com', '+91 9666655555', 'Dabolim Airport', 'flight_vendor']);

// Hotels
$stmt = $pdo->prepare("INSERT OR REPLACE INTO hotels (id, vendor_id, name, area, location, price, stars, amenities, rating, badge, image, images_json, description, is_available, admin_id, hotel_status, property_type, city, state, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'admin', 'Live', 'Resort', 'Goa', 'Goa', 'India')");
$stmt->execute(['hotel-3star', 'u-5', 'Casa Baga Boutique Resort', 'Baga (North Goa)', 'Baga Beach, North Goa', 3499, 3, 'Swimming Pool, Free High-Speed Wi-Fi, Complimentary Breakfast, Air Conditioning, Restaurant & Bar, 24/7 Front Desk', 4.40, '3-Star Value', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', json_encode(['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80']), 'A charming boutique tropical getaway nestled moments away from vibrant Baga Beach.']);
$stmt->execute(['hotel-4star', 'u-5', 'The Grand Candolim Beachfront Resort', 'Candolim (North Goa)', 'Candolim Beach, North Goa', 7999, 4, 'Lagoon Pool, Free Buffet Breakfast, Beach Access, Spa & Wellness Centre, Cocktail Bar, Free High-Speed Wi-Fi, Airport Shuttle', 4.70, '4-Star Premium', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', json_encode(['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80']), 'An exquisite 4-star coastal sanctuary overlooking Candolim beachfront with expansive lagoon pools.']);
$stmt->execute(['hotel-5star', 'u-5', 'Taj Exotica Resort & Spa Goa', 'Benaulim (South Goa)', 'Benaulim Beach, South Goa', 17500, 5, 'Private Beach Front, Olympic Infinity Pool, Jiva Luxury Spa, Fine Dining Pavilions, 24/7 Butler Service, Golf Course, Tennis Courts, Valet Parking', 4.90, '5-Star Luxury', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', json_encode(['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80']), 'Mediterranean-inspired 5-star palatial oasis sprawled over 56 landscaped oceanfront acres on the pristine sands of Benaulim Beach.']);

// Packages
$stmt = $pdo->prepare("INSERT OR REPLACE INTO packages (id, name, duration, car_included, hotel_included, price, description, tag, image, images_json, package_type, flights_included, food_included, pickup_drop_included, places_included, price_with_flight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(['package-1', 'Coastal Goa Explorer Pack', '4 Days / 3 Nights', 'Mahindra Thar 4x4', '4-Star Candolim Beach Resort', 14999, 'Explore the sun-kissed beaches of North Goa with a premium 4x4 Thar at your disposal and stays next to the lively coast.', 'Most Popular', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', json_encode(['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80']), 'Trip Package', '1', 'Breakfast Included', 'Free Airport Pickup & Drop', 'Calangute, Baga, Candolim, Fort Aguada', 18999]);
$stmt->execute(['package-2', 'Romantic Sunset Escape', '3 Days / 2 Nights', 'Audi Cabriolet Convertible', 'W Goa Luxury Resort (Vagator)', 29999, 'Drive in style under the open skies with a luxury convertible. Includes a candlelight beach dinner and a couples spa.', 'Luxury Honeymoon', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80', json_encode(['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=1200&q=80']), 'Trip Package', '1', 'All Meals & Candlelight Dinner', 'Free Airport Pickup & Drop', 'Vagator, Anjuna, Chapora Fort', 34999]);

// Cars
$stmt = $pdo->prepare("INSERT OR REPLACE INTO cars (id, vendor_id, name, category, price, seating, fuel, transmission, rating, badge, image, location, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(['car-1', 'vendor-1', 'Mahindra Thar 4x4 Soft Top', 'SUV / 4x4', 3200, '4', 'Diesel', 'Manual', 4.90, 'Top Rated', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'North Goa / Airport', 1]);
$stmt->execute(['car-2', 'vendor-1', 'Maruti Suzuki Swift VXi', 'Hatchback', 1400, '5', 'Petrol', 'Manual', 4.70, 'Best Value', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 'All Goa Delivery', 1]);
$stmt->execute(['car-3', 'vendor-1', 'Hyundai Creta SX Automatic', 'SUV', 2600, '5', 'Diesel', 'Automatic', 4.85, 'Family Choice', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', 'Airport / Calangute', 1]);
$stmt->execute(['car-4', 'vendor-1', 'Maruti Suzuki Ertiga (7 Seater)', 'MUV / 7-Seater', 2800, '7', 'Petrol', 'Manual', 4.75, 'Group Travel', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 'Dabolim / Mopa Airport', 1]);
$stmt->execute(['car-5', 'vendor-1', 'Toyota Fortuner 4x4 AT', 'Luxury SUV', 5500, '7', 'Diesel', 'Automatic', 4.95, 'VIP Luxury', 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=800&q=80', 'Free Airport Delivery', 1]);

// Bikes
$stmt = $pdo->prepare("INSERT OR REPLACE INTO bikes (id, vendor_id, name, category, price, engine, fuel, mileage, rating, badge, image, location, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(['bike-1', 'vendor-2', 'Royal Enfield Classic 350 (Reborn)', 'Cruiser', 800, '350cc', 'Petrol', '35 kmpl', 4.85, 'Top Choice', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80', 'Calangute / Baga', 1]);
$stmt->execute(['bike-2', 'vendor-2', 'Honda Activa 6G', 'Scooter', 450, '110cc', 'Petrol', '50 kmpl', 4.70, 'Most Popular', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80', 'All Goa', 1]);
$stmt->execute(['bike-3', 'vendor-2', 'Yamaha FZ-S V3', 'Sports', 700, '150cc', 'Petrol', '45 kmpl', 4.75, 'Youth Choice', 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80', 'Panaji / North Goa', 1]);
$stmt->execute(['bike-4', 'vendor-2', 'Royal Enfield Himalayan 450', 'Adventure', 1100, '450cc', 'Petrol', '30 kmpl', 4.90, 'Explorer', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80', 'Airport / North Goa', 1]);

// Hotel Room Types
$stmt = $pdo->prepare("INSERT OR REPLACE INTO hotel_room_types (id, hotel_id, vendor_id, name, total_rooms, base_occupancy, max_occupancy, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(['rt-1', 'hotel-3star', 'u-5', 'Deluxe Sea View Villa', 8, 2, 3, 18000]);
$stmt->execute(['rt-2', 'hotel-3star', 'u-5', 'Luxury Presidential Suite', 4, 2, 4, 28000]);
$stmt->execute(['rt-3', 'hotel-4star', 'u-5', 'Wonderful Garden Room', 12, 2, 3, 22000]);
$stmt->execute(['rt-4', 'hotel-4star', 'u-5', 'Standard AC Resort Room', 15, 2, 3, 7500]);
$stmt->execute(['rt-5', 'hotel-5star', 'u-5', 'Superior Heritage Room', 10, 2, 3, 6800]);

// Flight Routes
$stmt = $pdo->prepare("INSERT OR REPLACE INTO flights (id, airline, flight_number, departure_time, arrival_time, price, from_loc, to_loc, duration, seats, vendor_id, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([1, 'IndiGo', '6E-204', '06:15', '08:45', 4850, 'GOI', 'DEL', '2h 30m', 180, 'vendor-4', 'admin']);
$stmt->execute([2, 'Air India', 'AI-840', '09:30', '10:45', 3950, 'GOI', 'BOM', '1h 15m', 160, 'admin', 'admin']);
$stmt->execute([3, 'Akasa Air', 'QP-1302', '14:20', '16:05', 4200, 'GOX', 'BLR', '1h 45m', 189, 'vendor-4', 'admin']);

echo "3. SQLite database created and populated successfully!\n";


