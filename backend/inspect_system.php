<?php
require_once __DIR__ . '/config.php';

$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== TABLES ===\n";
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
echo implode(', ', $tables) . "\n\n";

function getColumns($pdo, $table) {
    try {
        $cols = $pdo->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
        return array_map(function($c) { return $c['name'] . ' (' . $c['type'] . ')'; }, $cols);
    } catch(Exception $e) {
        return ["ERROR: " . $e->getMessage()];
    }
}

echo "=== VENDORS / USERS TABLE ===\n";
if (in_array('vendors', $tables)) {
    echo "Table 'vendors':\n" . implode(", ", getColumns($pdo, 'vendors')) . "\n";
    $sample = $pdo->query("SELECT * FROM vendors LIMIT 2")->fetchAll(PDO::FETCH_ASSOC);
    print_r($sample);
}
if (in_array('users', $tables)) {
    echo "Table 'users':\n" . implode(", ", getColumns($pdo, 'users')) . "\n";
    $sample = $pdo->query("SELECT id, name, email, role, company_name FROM users WHERE role LIKE '%vendor%' LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    print_r($sample);
}

echo "=== BOOKINGS TABLE ===\n";
if (in_array('bookings', $tables)) {
    echo "Table 'bookings':\n" . implode(", ", getColumns($pdo, 'bookings')) . "\n";
    $sample = $pdo->query("SELECT id, name, vendor_id, type, total_amount, vendor_base_price, wow_markup_amount, customer_price, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
    print_r($sample);
}

echo "=== VENDOR SETTLEMENTS / PAYMENTS ===\n";
foreach (['vendor_settlements', 'settlements', 'payments', 'vendor_payouts', 'transactions'] as $t) {
    if (in_array($t, $tables)) {
        echo "Table '$t':\n" . implode(", ", getColumns($pdo, $t)) . "\n";
    }
}

echo "=== PAYMENT SETTINGS & GATEWAYS ===\n";
try {
    $ps = $pdo->query("SELECT * FROM payment_settings LIMIT 1")->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    echo "Payment settings error: " . $e->getMessage() . "\n";
}
echo "=== NOTIFICATIONS COLUMNS ===\n";
echo implode(", ", getColumns($pdo, 'notifications')) . "\n";


