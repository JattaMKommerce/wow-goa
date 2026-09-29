<?php
$lines = file(__DIR__ . '/api.php');
foreach ($lines as $i => $l) {
    if (strpos($l, 'function authenticateRequest') !== false) {
        echo ($i + 1) . ': ' . trim($l) . "\n";
    }
}
