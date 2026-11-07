<?php
// backend/cron_wallet.php
// WOW GOA Standalone Customer Cashback Wallet Daily Expiry Cron Runner

// --- Access guard ---------------------------------------------------------------
// From the command line (cPanel cron "php /home/.../cron_wallet.php") it always runs.
// Opened by URL it needs ?key=<CRON_SECRET> (or header "X-Cron-Key"), where CRON_SECRET
// is set in backend/.env. If no CRON_SECRET is configured, URL access is refused.
if (PHP_SAPI !== 'cli') {
    require_once __DIR__ . '/config.php'; // loads backend/.env
    $wgCronSecret = (string)(getenv('CRON_SECRET') ?: '');
    $wgCronKey = (string)($_GET['key'] ?? ($_SERVER['HTTP_X_CRON_KEY'] ?? ''));
    if ($wgCronSecret === '' || !hash_equals($wgCronSecret, $wgCronKey)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit;
    }
}

ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    try {
        $sqlitePath = __DIR__ . '/database.sqlite';
        $pdo = new PDO("sqlite:$sqlitePath");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (Exception $sqle) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Database connection failure."]);
        exit(1);
    }
}

try {
    $now = date('Y-m-d H:i:s');
    // Identify and update all expired cashback records
    $stmt = $pdo->prepare("UPDATE customer_wallet_transactions SET status = 'EXPIRED', remaining_amount = 0.00, updated_at = ? WHERE status IN ('AVAILABLE', 'PARTIALLY_USED') AND expires_at <= ?");
    $stmt->execute([$now, $now]);
    $expiredCount = $stmt->rowCount();

    echo json_encode([
        "success" => true,
        "date" => date('Y-m-d'),
        "server_time" => date('c'),
        "expired_transactions_count" => $expiredCount,
        "message" => "Customer Cashback Wallet 30-Day Expiry process executed successfully."
    ]);
} catch (Exception $ex) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
}
