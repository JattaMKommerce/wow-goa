<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$reviews = $pdo->query('SELECT * FROM customer_reviews')->fetchAll(PDO::FETCH_ASSOC);
echo "Total reviews in customer_reviews: " . count($reviews) . "\n";
foreach ($reviews as $r) {
    echo " - ID: {$r['id']} | Booking: {$r['booking_id']} | Rating: {$r['rating']} | Customer: {$r['customer_name']} | Text: {$r['review_text']}\n";
}
