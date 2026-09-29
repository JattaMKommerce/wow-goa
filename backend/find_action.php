<?php
$lines = file(__DIR__ . '/api.php');
foreach ($lines as $i => $l) {
    if (strpos($l, 'action ===') !== false) {
        echo ($i + 1) . ': ' . trim($l) . "\n";
    }
}
