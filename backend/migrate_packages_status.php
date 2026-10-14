<?php
/**
 * Migration: Add missing columns to packages and auto-clean localhost URLs in SQLite database.
 */
$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Starting Packages & Database Auto-Heal Migration...\n";

function addCol($pdo, $table, $column, $definition) {
    try {
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
    } catch (Exception $e) {
        echo "[ERR] Error adding '$column' to '$table': " . $e->getMessage() . "\n";
    }
}

// 1. Packages table missing columns
addCol($pdo, 'packages', 'status', "VARCHAR(50) DEFAULT 'published'");
addCol($pdo, 'packages', 'admin_id', "VARCHAR(100) DEFAULT 'admin'");
addCol($pdo, 'packages', 'hotel_source', "VARCHAR(50) DEFAULT 'inventory'");
addCol($pdo, 'packages', 'hotel_inventory_id', "VARCHAR(50) DEFAULT NULL");
addCol($pdo, 'packages', 'hotel_selection_type', "VARCHAR(50) DEFAULT 'specific'");
addCol($pdo, 'packages', 'hotel_category', "VARCHAR(100) DEFAULT NULL");
addCol($pdo, 'packages', 'hotel_room_type', "VARCHAR(100) DEFAULT NULL");
addCol($pdo, 'packages', 'hotel_custom_json', "TEXT DEFAULT NULL");
addCol($pdo, 'packages', 'vehicle_source', "VARCHAR(50) DEFAULT 'inventory'");
addCol($pdo, 'packages', 'vehicle_inventory_id', "VARCHAR(50) DEFAULT NULL");
addCol($pdo, 'packages', 'vehicle_type', "VARCHAR(50) DEFAULT 'car'");
addCol($pdo, 'packages', 'vehicle_custom_json', "TEXT DEFAULT NULL");
addCol($pdo, 'packages', 'driver_included', "BOOLEAN DEFAULT 0");
addCol($pdo, 'packages', 'driver_type', "VARCHAR(50) DEFAULT NULL");
addCol($pdo, 'packages', 'driver_pricing_type', "VARCHAR(50) DEFAULT 'included'");
addCol($pdo, 'packages', 'driver_amount', "INT DEFAULT 0");
addCol($pdo, 'packages', 'sightseeing_custom_json', "TEXT DEFAULT NULL");
addCol($pdo, 'packages', 'activity_source', "VARCHAR(50) DEFAULT 'inventory'");
addCol($pdo, 'packages', 'activity_inventory_id', "VARCHAR(50) DEFAULT NULL");
addCol($pdo, 'packages', 'activity_custom_json', "TEXT DEFAULT NULL");
addCol($pdo, 'packages', 'flight_source', "VARCHAR(50) DEFAULT 'inventory'");
addCol($pdo, 'packages', 'flight_inventory_id', "VARCHAR(50) DEFAULT NULL");
addCol($pdo, 'packages', 'flight_custom_json', "TEXT DEFAULT NULL");

// 2. Auto-heal localhost image URLs in cars, bikes, hotels, packages
try {
    $c = $pdo->exec("UPDATE cars SET image = REPLACE(image, 'http://localhost:8000', '') WHERE image LIKE '%localhost:8000%'");
    $pdo->exec("UPDATE cars SET images_json = REPLACE(images_json, 'http:\/\/localhost:8000', '') WHERE images_json LIKE '%localhost:8000%'");
    $pdo->exec("UPDATE cars SET images_json = REPLACE(images_json, 'http://localhost:8000', '') WHERE images_json LIKE '%localhost:8000%'");
    echo "[OK] Cleaned $c car localhost URLs.\n";
} catch (Exception $e) {
    echo "[ERR] Car URL cleanup: " . $e->getMessage() . "\n";
}

try {
    $b = $pdo->exec("UPDATE bikes SET image = REPLACE(image, 'http://localhost:8000', '') WHERE image LIKE '%localhost:8000%'");
    $pdo->exec("UPDATE bikes SET images_json = REPLACE(images_json, 'http:\/\/localhost:8000', '') WHERE images_json LIKE '%localhost:8000%'");
    echo "[OK] Cleaned $b bike localhost URLs.\n";
} catch (Exception $e) {
    echo "[ERR] Bike URL cleanup: " . $e->getMessage() . "\n";
}

echo "Packages & Auto-heal migration completed successfully!\n";
