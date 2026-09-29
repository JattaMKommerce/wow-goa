<?php
$lines = file(__DIR__ . '/../frontend/src/components/AIChatbot.jsx');
foreach ($lines as $i => $l) {
    if (stripos($l, 'showLeadForm') !== false || stripos($l, 'leadName') !== false || stripos($l, 'Plan Your Goa Trip') !== false || stripos($l, '🔍') !== false) {
        echo ($i + 1) . ': ' . trim($l) . "\n";
    }
}
