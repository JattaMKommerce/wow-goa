<?php
// backend/deploy_receiver.php
ini_set('display_errors', '0');
error_reporting(0);
ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');

$SECRET_KEY = 'WowGoaDeploySecret_2026_SecureKey';

$providedKey = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? $_GET['secret'] ?? '';

if (empty($providedKey) || !hash_equals($SECRET_KEY, $providedKey)) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tempZip = tempnam(sys_get_temp_dir(), 'deploy_') . '.zip';
    
    // Support raw binary stream upload (bypasses upload_max_filesize limit)
    $input = fopen('php://input', 'rb');
    $output = fopen($tempZip, 'wb');
    if ($input && $output) {
        stream_copy_to_stream($input, $output);
        fclose($input);
        fclose($output);
    }

    if (!file_exists($tempZip) || filesize($tempZip) < 100) {
        if (isset($_FILES['package']) && $_FILES['package']['error'] === UPLOAD_ERR_OK) {
            move_uploaded_file($_FILES['package']['tmp_name'], $tempZip);
        }
    }

    if (!file_exists($tempZip) || filesize($tempZip) < 100) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid package received or file is empty', 'size' => @filesize($tempZip)]);
        @unlink($tempZip);
        exit;
    }

    $zip = new ZipArchive();
    if ($zip->open($tempZip) === TRUE) {
        $targetDir = dirname(__DIR__); // Root public_html
        $zip->extractTo($targetDir);
        $zip->close();
        @unlink($tempZip);
        
        echo json_encode(['success' => true, 'message' => 'Deployment deployed and extracted successfully!']);
        
        // Execute database migration if script exists
        $migrateScript = __DIR__ . '/migrate_taxi_dispatch_system.php';
        if (file_exists($migrateScript)) {
            try {
                include_once $migrateScript;
            } catch (\Throwable $t) {
                // Non-fatal if already migrated
            }
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to extract package']);
        @unlink($tempZip);
    }
    exit;
}

echo json_encode(['status' => 'Deploy endpoint is ready']);
