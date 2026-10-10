<?php
/**
 * Migration: Create vendor_hold_settings table and add hold booking columns to vendors and bookings.
 */
$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Starting Hold Amount Feature Migration...\n";

// 1. Create vendor_hold_settings table
$pdo->exec("CREATE TABLE IF NOT EXISTS vendor_hold_settings (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL UNIQUE,
    allow_hold_booking INT DEFAULT 1,
    hold_type VARCHAR(20) DEFAULT 'percentage',
    hold_value DECIMAL(10,2) DEFAULT 20.00,
    hold_due_policy VARCHAR(100) DEFAULT 'checkin',
    min_booking_amount DECIMAL(10,2) DEFAULT 500.00,
    created_at DATETIME,
    updated_at DATETIME
)");
echo "[OK] Table 'vendor_hold_settings' created/verified.\n";

// Helper function to safely add column if not exists
function addColumnIfNotExists($pdo, $table, $column, $definition) {
    $stmt = $pdo->query("PRAGMA table_info($table)");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $exists = false;
    foreach ($cols as $c) {
        if (strtolower($c['name']) === strtolower($column)) {
            $exists = true;
            break;
        }
    }
    if (!$exists) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo "[OK] Added column '$column' to '$table'.\n";
    } else {
        echo "[SKIP] Column '$column' already exists in '$table'.\n";
    }
}

// 2. Add columns to vendors table
addColumnIfNotExists($pdo, 'vendors', 'allow_hold_booking', 'INT DEFAULT 1');
addColumnIfNotExists($pdo, 'vendors', 'hold_type', "VARCHAR(20) DEFAULT 'percentage'");
addColumnIfNotExists($pdo, 'vendors', 'hold_value', 'DECIMAL(10,2) DEFAULT 20.00');
addColumnIfNotExists($pdo, 'vendors', 'hold_due_policy', "VARCHAR(100) DEFAULT 'checkin'");
addColumnIfNotExists($pdo, 'vendors', 'min_booking_amount', 'DECIMAL(10,2) DEFAULT 500.00');

// 3. Add columns to bookings table
addColumnIfNotExists($pdo, 'bookings', 'is_hold_booking', 'INT DEFAULT 0');
addColumnIfNotExists($pdo, 'bookings', 'hold_amount', 'DECIMAL(10,2) DEFAULT 0.00');
addColumnIfNotExists($pdo, 'bookings', 'remaining_due_amount', 'DECIMAL(10,2) DEFAULT 0.00');
addColumnIfNotExists($pdo, 'bookings', 'hold_due_policy', "VARCHAR(100) DEFAULT 'checkin'");

// 4. Seed default hold settings for known vendors (u-4, u-5, vendor-1, vendor-2, vendor-3)
$vendors = ['u-4', 'u-5', 'vendor-1', 'vendor-2', 'vendor-3', 'vnd_6aacc9a265454'];
$ins = $pdo->prepare("INSERT OR IGNORE INTO vendor_hold_settings (id, vendor_id, allow_hold_booking, hold_type, hold_value, hold_due_policy, min_booking_amount, created_at, updated_at) VALUES (?, ?, 1, 'percentage', 20.00, 'checkin', 500.00, datetime('now'), datetime('now'))");

foreach ($vendors as $vId) {
    $ins->execute(['vhs_' . substr(md5($vId), 0, 10), $vId]);
}
echo "[OK] Default hold settings seeded for primary vendors.\n";
echo "Migration completed successfully!\n";
