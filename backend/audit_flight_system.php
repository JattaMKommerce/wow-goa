<?php
$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== 1. TABLES CHECK ===\n";
$tables = ['flights', 'flight_bookings', 'users', 'vendors', 'bookings', 'vendor_wallets', 'wallet_transactions', 'markups', 'notifications'];
foreach ($tables as $t) {
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$t'");
    $exists = $stmt->fetch();
    echo "Table [$t]: " . ($exists ? "EXISTS" : "MISSING") . "\n";
}

echo "\n=== 2. FLIGHTS TABLE SCHEMA ===\n";
$stmt = $pdo->query("PRAGMA table_info(flights)");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo " - {$c['name']} ({$c['type']}) default: {$c['dflt_value']} notnull: {$c['notnull']}\n";
}

echo "\n=== 3. FLIGHT RECORDS IN DB ===\n";
$stmt = $pdo->query("SELECT * FROM flights ORDER BY id ASC");
$flights = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total flights count: " . count($flights) . "\n";
foreach ($flights as $f) {
    echo " - ID: {$f['id']} | Airline: {$f['airline']} | Flight#: {$f['flight_number']} | {$f['from_loc']}->{$f['to_loc']} | {$f['departure_time']}-{$f['arrival_time']} | ₹{$f['price']} | Seats: {$f['seats']} | Vendor: {$f['vendor_id']}\n";
}

echo "\n=== 4. FLIGHT VENDOR USERS IN DB ===\n";
$stmt = $pdo->query("SELECT id, username, name, email, role, status FROM users WHERE role = 'flight_vendor' OR username LIKE '%flight%' OR id = 'u-6' OR id = 'vendor-4'");
$fUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($fUsers as $u) {
    echo " - User ID: {$u['id']} | Username: {$u['username']} | Name: {$u['name']} | Email: {$u['email']} | Role: {$u['role']} | Status: {$u['status']}\n";
}

echo "\n=== 5. FLIGHT VENDORS IN VENDORS TABLE ===\n";
$stmt = $pdo->query("SELECT * FROM vendors WHERE role = 'flight_vendor' OR id = 'vendor-4' OR id = 'u-6'");
$fVendors = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($fVendors as $v) {
    echo " - Vendor ID: {$v['id']} | Name: {$v['name']} | Role: {$v['role']} | Email: {$v['email']}\n";
}

echo "\n=== 6. BOOKINGS TABLE SCHEMA ===\n";
$stmt = $pdo->query("PRAGMA table_info(bookings)");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo " - {$col['name']} ({$col['type']})\n";
}

echo "\n=== 7. FLIGHT_BOOKINGS TABLE SCHEMA ===\n";
$stmt = $pdo->query("PRAGMA table_info(flight_bookings)");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo " - {$col['name']} ({$col['type']})\n";
}

echo "\n=== 8. BOOKINGS WHERE TYPE = 'flight' ===\n";
$stmt = $pdo->query("SELECT * FROM bookings WHERE type = 'flight' OR package_type LIKE '%flight%' LIMIT 10");
$bks = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total flight bookings found in bookings table: " . count($bks) . "\n";
foreach ($bks as $b) {
    echo " - Booking ID: {$b['id']} | Type: {$b['type']} | Item: {$b['item_name']} | Vendor: " . ($b['vendor_id'] ?? 'none') . " | Status: {$b['status']} | ₹" . ($b['total_amount'] ?? $b['price'] ?? 0) . "\n";
}

echo "\n=== 9. FLIGHT_BOOKINGS TABLE RECORDS ===\n";
$stmt = $pdo->query("SELECT * FROM flight_bookings LIMIT 10");
$fbks = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total records in flight_bookings table: " . count($fbks) . "\n";
foreach ($fbks as $fb) {
    echo " - Order ID: {$fb['id']} | Ref/PNR: {$fb['booking_reference']} | Total: {$fb['total_amount']} {$fb['currency']}\n";
}

