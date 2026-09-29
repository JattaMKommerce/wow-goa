<?php
$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== 1. ALL TABLES IN DATABASE ===\n";
$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name ASC");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    if (stripos($t, 'review') !== false || stripos($t, 'rate') !== false || stripos($t, 'feedback') !== false) {
        echo " -> FOUND REVIEW-RELATED TABLE: $t\n";
    }
}

echo "\n=== 2. BOOKINGS TABLE STATUS VALUES ===\n";
$stmt = $pdo->query("SELECT status, count(*) as count FROM bookings GROUP BY status");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo " - Status: '{$r['status']}' | Count: {$r['count']}\n";
}

echo "\n=== 3. VEHICLE BOOKINGS SAMPLE IN BOOKINGS TABLE ===\n";
$stmt = $pdo->query("SELECT id, name, phone, email, item_name, type, package_type, status, vendor_id, created_at FROM bookings WHERE type IN ('car', 'bike', 'selfdrive') OR package_type LIKE '%self%' OR package_type LIKE '%car%' OR package_type LIKE '%bike%' LIMIT 5");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo " - ID: {$r['id']} | Customer: {$r['name']} ({$r['phone']}) | Item: {$r['item_name']} | Type: {$r['type']} | Status: {$r['status']} | Vendor: {$r['vendor_id']}\n";
}

echo "\n=== 4. COMPLETED BOOKINGS SAMPLE ===\n";
$stmt = $pdo->query("SELECT id, name, phone, email, item_name, type, package_type, status, vendor_id FROM bookings WHERE LOWER(status) = 'completed' LIMIT 5");
$completedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total completed bookings found: " . count($completedRows) . "\n";
foreach ($completedRows as $r) {
    echo " - ID: {$r['id']} | Customer: {$r['name']} ({$r['phone']}) | Item: {$r['item_name']} | Type: {$r['type']} | Status: {$r['status']} | Vendor: {$r['vendor_id']}\n";
}

echo "\n=== 5. ANY EXISTING REVIEWS IN DB ===\n";
foreach (['reviews', 'customer_reviews', 'booking_reviews', 'hotel_reviews', 'package_reviews'] as $t) {
    $exists = in_array($t, $tables);
    echo "Table [$t]: " . ($exists ? "EXISTS" : "DOES NOT EXIST") . "\n";
    if ($exists) {
        $cnt = $pdo->query("SELECT count(*) FROM $t")->fetchColumn();
        echo "   Row count in $t: $cnt\n";
    }
}

echo "\n=== 6. BOOKINGS TABLE COLUMNS ===\n";
$cols = $pdo->query("PRAGMA table_info(bookings)")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo " - {$col['name']} ({$col['type']})\n";
}

