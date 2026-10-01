<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$cols = $pdo->query('PRAGMA table_info(bookings)')->fetchAll(PDO::FETCH_ASSOC);
echo "=== BOOKINGS COLUMNS ===\n";
foreach ($cols as $c) {
    echo "{$c['name']} ({$c['type']})\n";
}

echo "\n=== SAMPLE BOOKING ROW ===\n";
$b = $pdo->query('SELECT * FROM bookings ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
print_r($b);
