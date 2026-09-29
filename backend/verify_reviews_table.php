<?php
require_once __DIR__ . '/api.php';
$cnt = $pdo->query("SELECT count(*) FROM customer_reviews")->fetchColumn();
echo "customer_reviews table verified, count: $cnt\n";
