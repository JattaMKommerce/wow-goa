<?php
require_once __DIR__ . '/config.php';

$sqlitePath = __DIR__ . '/database.sqlite';
$pdo = new PDO("sqlite:$sqlitePath");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "Starting migration for Vendor Cancellation Policy & Static QR Payments...\n";

// 1. Create vendor_cancellation_policies table
$pdo->exec("CREATE TABLE IF NOT EXISTS vendor_cancellation_policies (
    id VARCHAR(50) PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL DEFAULT 'all',
    policy_name VARCHAR(255) NOT NULL,
    allow_after_service_starts TINYINT(1) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");
echo "Table 'vendor_cancellation_policies' verified/created.\n";

// 2. Create vendor_cancellation_rules table
$pdo->exec("CREATE TABLE IF NOT EXISTS vendor_cancellation_rules (
    id VARCHAR(50) PRIMARY KEY,
    policy_id VARCHAR(50) NOT NULL,
    minimum_hours_before INT NOT NULL,
    maximum_hours_before INT DEFAULT NULL,
    refund_percentage DECIMAL(5,2) NOT NULL,
    cancellation_charge_percentage DECIMAL(5,2) NOT NULL,
    rule_description VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");
echo "Table 'vendor_cancellation_rules' verified/created.\n";

// 3. Helper to safely add column if not exists in bookings
function addColumnIfNotExists($pdo, $table, $column, $type) {
    $cols = $pdo->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
    $existing = array_map(function($c) { return strtolower($c['name']); }, $cols);
    if (!in_array(strtolower($column), $existing)) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $type");
        echo "Added column '$column' to '$table'.\n";
    } else {
        echo "Column '$column' already exists in '$table'.\n";
    }
}

// 4. Add columns to bookings
$columnsToAdd = [
    'customer_payment' => 'DECIMAL(10,2) DEFAULT 0.00',
    'wow_goa_platform_fee' => 'DECIMAL(10,2) DEFAULT 0.00',
    'vendor_service_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
    'payment_reference' => 'VARCHAR(100) DEFAULT NULL',
    'payment_screenshot' => 'TEXT DEFAULT NULL',
    'payment_verification_status' => 'VARCHAR(50) DEFAULT "Pending Verification"',
    'payment_verified_at' => 'DATETIME DEFAULT NULL',
    'payment_verified_by' => 'VARCHAR(100) DEFAULT NULL',
    'vendor_payout_status' => 'VARCHAR(50) DEFAULT "Pending"',
    'vendor_payout_date' => 'DATETIME DEFAULT NULL',
    'vendor_payout_reference' => 'VARCHAR(100) DEFAULT NULL',
    'vendor_payout_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
    'vendor_payout_notes' => 'TEXT DEFAULT NULL',
    'cancellation_policy_snapshot' => 'TEXT DEFAULT NULL',
    'cancellation_status' => 'VARCHAR(50) DEFAULT NULL',
    'cancellation_requested_at' => 'DATETIME DEFAULT NULL',
    'cancellation_refund_percentage' => 'DECIMAL(5,2) DEFAULT NULL',
    'cancellation_refund_amount' => 'DECIMAL(10,2) DEFAULT NULL',
    'cancellation_platform_fee' => 'DECIMAL(10,2) DEFAULT NULL',
    'cancellation_vendor_amount' => 'DECIMAL(10,2) DEFAULT NULL',
    'cancellation_rule_applied' => 'VARCHAR(255) DEFAULT NULL',
    'cancellation_reason' => 'TEXT DEFAULT NULL'
];

foreach ($columnsToAdd as $col => $type) {
    addColumnIfNotExists($pdo, 'bookings', $col, $type);
}

// 5. Seed default/sample policies for existing vendors if they don't have one
$vendors = ['vendor-1', 'vendor-2', 'u-4', 'u-5', 'u-6'];
foreach ($vendors as $vId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM vendor_cancellation_policies WHERE vendor_id = ?");
    $stmt->execute([$vId]);
    if ($stmt->fetchColumn() == 0) {
        $policyId = 'vpol_' . substr(md5($vId . '_default'), 0, 12);
        $ins = $pdo->prepare("INSERT INTO vendor_cancellation_policies (id, vendor_id, service_type, policy_name, allow_after_service_starts, status, created_at, updated_at) VALUES (?, ?, 'all', 'Standard Cancellation Policy', 0, 'Active', datetime('now'), datetime('now'))");
        $ins->execute([$policyId, $vId]);

        $rules = [
            ['rule_id' => 'vrule_' . uniqid(), 'min' => 168, 'max' => null, 'refund' => 90.00, 'charge' => 10.00, 'desc' => 'More than 7 days before service: 90% refund'],
            ['rule_id' => 'vrule_' . uniqid(), 'min' => 72, 'max' => 168, 'refund' => 75.00, 'charge' => 25.00, 'desc' => '3–7 days before service: 75% refund'],
            ['rule_id' => 'vrule_' . uniqid(), 'min' => 24, 'max' => 72, 'refund' => 50.00, 'charge' => 50.00, 'desc' => '1–3 days before service: 50% refund'],
            ['rule_id' => 'vrule_' . uniqid(), 'min' => 0, 'max' => 24, 'refund' => 25.00, 'charge' => 75.00, 'desc' => 'Less than 24 hours before service: 25% refund'],
            ['rule_id' => 'vrule_' . uniqid(), 'min' => -999999, 'max' => 0, 'refund' => 0.00, 'charge' => 100.00, 'desc' => 'After service starts: No refund']
        ];

        $insRule = $pdo->prepare("INSERT INTO vendor_cancellation_rules (id, policy_id, minimum_hours_before, maximum_hours_before, refund_percentage, cancellation_charge_percentage, rule_description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))");
        foreach ($rules as $r) {
            $insRule->execute([$r['rule_id'], $policyId, $r['min'], $r['max'], $r['refund'], $r['charge'], $r['desc']]);
        }
        echo "Seeded default cancellation policy for vendor '$vId'.\n";
    }
}

// 6. Backfill existing bookings with financial split if not already filled
$stmt = $pdo->query("SELECT id, total_amount, customer_payment, wow_goa_platform_fee, vendor_service_amount FROM bookings WHERE customer_payment = 0 OR customer_payment IS NULL");
$bookingsToUpdate = $stmt->fetchAll(PDO::FETCH_ASSOC);
$upd = $pdo->prepare("UPDATE bookings SET customer_payment = ?, wow_goa_platform_fee = ?, vendor_service_amount = ?, payment_verification_status = 'Approved' WHERE id = ?");
foreach ($bookingsToUpdate as $b) {
    $custPay = floatval($b['total_amount'] ?: 0);
    $fee = round($custPay * 0.10, 2);
    $vendorAmt = round($custPay * 0.90, 2);
    $upd->execute([$custPay, $fee, $vendorAmt, $b['id']]);
}
echo "Backfilled " . count($bookingsToUpdate) . " past bookings with 10% fee / 90% vendor split.\n";

echo "Migration completed successfully!\n";
