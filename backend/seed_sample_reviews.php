<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Seed 5-star review
$pdo->prepare("INSERT OR IGNORE INTO customer_reviews 
    (id, booking_id, customer_id, customer_name, customer_phone, customer_email, service_type, service_name, vendor_id, rating, review_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))")
    ->execute([
        'REV-5STAR01',
        'BK-FLT-1790575157',
        'c-rahul',
        'Rahul Sharma',
        '9876543210',
        'rahul@example.com',
        'Flight',
        'Akasa Air Direct Flight (GOI → DEL)',
        'u-6',
        5,
        'Seamless flight booking with WOW GOA! On-time departure and great support.'
    ]);

// Seed 4-star review
$pdo->prepare("INSERT OR IGNORE INTO customer_reviews 
    (id, booking_id, customer_id, customer_name, customer_phone, customer_email, service_type, service_name, vendor_id, rating, review_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 day'))")
    ->execute([
        'REV-4STAR02',
        'BK-FLT-1790575235',
        'c-rahul',
        'Rahul Sharma',
        '9876543210',
        'rahul@example.com',
        'Flight',
        'Akasa Air Direct Flight (GOI → DEL)',
        'u-6',
        4,
        'Good experience and smooth check-in process.'
    ]);

echo "Sample reviews seeded successfully.\n";
