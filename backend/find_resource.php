<?php
$lines = file(__DIR__ . '/api.php');
foreach ($lines as $i => $l) {
    if (strpos($l, 'resource ===') !== false) {
        echo ($i + 1) . ': ' . trim($l) . "\n";
    }
}
