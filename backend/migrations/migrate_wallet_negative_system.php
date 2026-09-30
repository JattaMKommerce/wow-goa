<?php
// backend/migrations/migrate_wallet_negative_system.php

require_once __DIR__ . '/../config.php';

$sqlitePath = __DIR__ . '/../database.sqlite';
$pdo = new PDO("sqlite:" . $sqlitePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Starting Wallet & Negative Booking Migration...\n";

function columnExists(PDO $pdo, string $table, string $column): bool {
    try {
        $stmt = $pdo->query("PRAGMA table_info($table)");
        $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $c) {
            if (strcasecmp($c['name'], $column) === 0) {
                return true;
            }
        }
    } catch (Exception $e) {}
    return false;
}

// 1. vendor_wallets: negative_booking_count
if (!columnExists($pdo, 'vendor_wallets', 'negative_booking_count')) {
    $pdo->exec("ALTER TABLE vendor_wallets ADD COLUMN negative_booking_count INT DEFAULT 0");
    echo "Added negative_booking_count to vendor_wallets\n";
} else {
    echo "vendor_wallets.negative_booking_count already exists\n";
}

// 2. bookings: wallet_deduction_status
if (!columnExists($pdo, 'bookings', 'wallet_deduction_status')) {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN wallet_deduction_status VARCHAR(50) DEFAULT 'Pending'");
    echo "Added wallet_deduction_status to bookings\n";
} else {
    echo "bookings.wallet_deduction_status already exists\n";
}

// Ensure wow_goa_platform_fee exists in bookings
if (!columnExists($pdo, 'bookings', 'wow_goa_platform_fee')) {
    $pdo->exec("ALTER TABLE bookings ADD COLUMN wow_goa_platform_fee DECIMAL(10,2) DEFAULT 0.00");
    echo "Added wow_goa_platform_fee to bookings\n";
}

// 3. global_settings: max_negative_bookings
if (!columnExists($pdo, 'global_settings', 'max_negative_bookings')) {
    $pdo->exec("ALTER TABLE global_settings ADD COLUMN max_negative_bookings INT DEFAULT 2");
    echo "Added max_negative_bookings to global_settings\n";
} else {
    echo "global_settings.max_negative_bookings already exists\n";
}

// Ensure global_settings has row 1 with max_negative_bookings = 2
$pdo->exec("UPDATE global_settings SET max_negative_bookings = 2 WHERE max_negative_bookings IS NULL OR max_negative_bookings <= 0");

// 4. site_configs: max_negative_bookings & default row
if (!columnExists($pdo, 'site_configs', 'max_negative_bookings')) {
    $pdo->exec("ALTER TABLE site_configs ADD COLUMN max_negative_bookings INT DEFAULT 2");
    echo "Added max_negative_bookings to site_configs\n";
} else {
    echo "site_configs.max_negative_bookings already exists\n";
}

$stmtConfig = $pdo->query("SELECT COUNT(*) FROM site_configs");
if ($stmtConfig->fetchColumn() == 0) {
    $pdo->exec("INSERT INTO site_configs (id, admin_id, booking_fee_deduction, min_wallet_recharge, max_negative_bookings) VALUES (1, 'admin', 500, 2000, 2)");
    echo "Seeded default row into site_configs\n";
}

// 5. wallet_transactions: balance_before, balance_after, rejection_reason
if (!columnExists($pdo, 'wallet_transactions', 'balance_before')) {
    $pdo->exec("ALTER TABLE wallet_transactions ADD COLUMN balance_before DECIMAL(12,2) DEFAULT NULL");
    echo "Added balance_before to wallet_transactions\n";
}
if (!columnExists($pdo, 'wallet_transactions', 'balance_after')) {
    $pdo->exec("ALTER TABLE wallet_transactions ADD COLUMN balance_after DECIMAL(12,2) DEFAULT NULL");
    echo "Added balance_after to wallet_transactions\n";
}
if (!columnExists($pdo, 'wallet_transactions', 'rejection_reason')) {
    $pdo->exec("ALTER TABLE wallet_transactions ADD COLUMN rejection_reason TEXT DEFAULT NULL");
    echo "Added rejection_reason to wallet_transactions\n";
}

echo "Migration finished successfully!\n";
