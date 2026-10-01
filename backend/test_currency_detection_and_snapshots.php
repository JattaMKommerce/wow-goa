<?php
/**
 * Test Suite: Customer Country Code & Automatic Currency Display for WOW GOA
 */
require_once __DIR__ . '/country_currency.php';
require_once __DIR__ . '/ExchangeRateService.php';
require_once __DIR__ . '/BookingService.php';

$pdo = new PDO('sqlite:' . __DIR__ . '/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Ensure schema columns exist
$migrationStatements = [
    "ALTER TABLE bookings ADD COLUMN customer_country VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN customer_country_code VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN customer_currency VARCHAR(10) DEFAULT 'INR'",
    "ALTER TABLE bookings ADD COLUMN customer_category VARCHAR(20) DEFAULT 'INDIAN'",
    "ALTER TABLE bookings ADD COLUMN exchange_rate_used DECIMAL(14,6) DEFAULT 1.000000",
    "ALTER TABLE bookings ADD COLUMN converted_display_amount DECIMAL(12,2) DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN currency_rate_timestamp DATETIME DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'India'",
    "ALTER TABLE users ADD COLUMN country_code VARCHAR(10) DEFAULT 'IN'",
    "ALTER TABLE users ADD COLUMN dial_code VARCHAR(10) DEFAULT '+91'",
    "ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(10) DEFAULT 'INR'",
    "ALTER TABLE users ADD COLUMN customer_category VARCHAR(20) DEFAULT 'INDIAN'",
    "ALTER TABLE custom_enquiries ADD COLUMN customer_country VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE custom_enquiries ADD COLUMN customer_country_code VARCHAR(10) DEFAULT NULL",
    "ALTER TABLE custom_enquiries ADD COLUMN customer_currency VARCHAR(10) DEFAULT 'INR'",
    "ALTER TABLE custom_enquiries ADD COLUMN customer_category VARCHAR(20) DEFAULT 'INDIAN'",
    "ALTER TABLE custom_enquiries ADD COLUMN exchange_rate_used DECIMAL(14,6) DEFAULT 1.000000",
    "ALTER TABLE custom_enquiries ADD COLUMN converted_display_amount DECIMAL(12,2) DEFAULT NULL"
];
foreach ($migrationStatements as $sql) {
    try { $pdo->exec($sql); } catch (Exception $e) {}
}

$passed = 0;
$total = 0;

function assertTest($condition, $message) {
    global $passed, $total;
    $total++;
    if ($condition) {
        echo " [PASS] $message\n";
        $passed++;
    } else {
        echo " [FAIL] $message\n";
    }
}

echo "\n======================================================================\n";
echo "   WOW GOA CUSTOMER COUNTRY & AUTOMATIC CURRENCY TEST SUITE\n";
echo "======================================================================\n\n";

// --- TEST 1: Country to ISO 4217 Currency Mappings ---
echo "--- TEST 1: Country to ISO 4217 Currency Mappings ---\n";
assertTest(CountryCurrencyRegistry::getByCode('IN')['currency'] === 'INR', "India (IN) maps to INR");
assertTest(CountryCurrencyRegistry::getByCode('US')['currency'] === 'USD', "United States (US) maps to USD");
assertTest(CountryCurrencyRegistry::getByCode('GB')['currency'] === 'GBP', "United Kingdom (GB) maps to GBP");
assertTest(CountryCurrencyRegistry::getByCode('AE')['currency'] === 'AED', "UAE (AE) maps to AED");
assertTest(CountryCurrencyRegistry::getByCode('CA')['currency'] === 'CAD', "Canada (CA) maps to CAD");
assertTest(CountryCurrencyRegistry::getByCode('AU')['currency'] === 'AUD', "Australia (AU) maps to AUD");
assertTest(CountryCurrencyRegistry::getByCode('SG')['currency'] === 'SGD', "Singapore (SG) maps to SGD");
assertTest(CountryCurrencyRegistry::getByCode('DE')['currency'] === 'EUR', "Germany (DE) maps to EUR");
assertTest(CountryCurrencyRegistry::getByCode('FR')['currency'] === 'EUR', "France (FR) maps to EUR");

// --- TEST 2: Shared Dial Code Handling (+1 for US vs CA) ---
echo "\n--- TEST 2: Shared Dial Code Resolution ---\n";
$usInfo = CountryCurrencyRegistry::getByDialCode('+1', 'US');
$caInfo = CountryCurrencyRegistry::getByDialCode('+1', 'CA');
assertTest($usInfo['code'] === 'US' && $usInfo['currency'] === 'USD', "+1 with US hint maps to USD");
assertTest($caInfo['code'] === 'CA' && $caInfo['currency'] === 'CAD', "+1 with CA hint maps to CAD");

// --- TEST 3: Phone Number Auto-Detection ---
echo "\n--- TEST 3: Phone Number Auto-Detection ---\n";
$detectedIndia = CountryCurrencyRegistry::detectFromPhone('+919876543210');
$detectedUK = CountryCurrencyRegistry::detectFromPhone('+447911123456');
$detectedUAE = CountryCurrencyRegistry::detectFromPhone('+971501234567');
assertTest($detectedIndia['code'] === 'IN' && $detectedIndia['currency'] === 'INR', "+91 auto-detects India (INR)");
assertTest($detectedUK['code'] === 'GB' && $detectedUK['currency'] === 'GBP', "+44 auto-detects UK (GBP)");
assertTest($detectedUAE['code'] === 'AE' && $detectedUAE['currency'] === 'AED', "+971 auto-detects UAE (AED)");

// --- TEST 4: Exchange Rate Engine & Financial Rounding ---
echo "\n--- TEST 4: Exchange Rate Engine & Decimals ---\n";
$rates = ExchangeRateService::getExchangeRates();
assertTest(!empty($rates['rates']), "Exchange rates loaded successfully");
assertTest(isset($rates['rates']['USD']) && $rates['rates']['USD'] > 0, "USD exchange rate is positive");
assertTest(isset($rates['rates']['GBP']) && $rates['rates']['GBP'] > 0, "GBP exchange rate is positive");
assertTest(isset($rates['rates']['AED']) && $rates['rates']['AED'] > 0, "AED exchange rate is positive");

// JPY should have 0 decimals, KWD should have 3 decimals, USD should have 2
assertTest(CountryCurrencyRegistry::getDecimalsForCurrency('INR') === 0, "INR uses 0 decimals");
assertTest(CountryCurrencyRegistry::getDecimalsForCurrency('USD') === 2, "USD uses 2 decimals");
assertTest(CountryCurrencyRegistry::getDecimalsForCurrency('JPY') === 0, "JPY uses 0 decimals");
assertTest(CountryCurrencyRegistry::getDecimalsForCurrency('KWD') === 3, "KWD uses 3 decimals");

// --- TEST 5: Authoritative Booking Snapshot Generation & Customer Categories ---
echo "\n--- TEST 5: Authoritative Booking Snapshot Generation & Customer Categories ---\n";
$snapIndia = ExchangeRateService::calculateBookingSnapshot(10000, 'IN', 'INR');
assertTest($snapIndia['customer_country'] === 'India', "Snapshot country is India");
assertTest($snapIndia['customer_country_iso'] === 'IN', "Snapshot country ISO is IN");
assertTest($snapIndia['customer_category'] === 'INDIAN', "India customer category is strictly INDIAN");
assertTest($snapIndia['customer_currency'] === 'INR', "India customer currency is INR");
assertTest($snapIndia['base_amount_inr'] === 10000.0, "India maintains INR base 10,000");
assertTest($snapIndia['exchange_rate_used'] === 1.0, "India exchange rate is exactly 1.0");
assertTest($snapIndia['converted_display_amount'] === 10000.0, "India display amount equals base amount");

$snapUS = ExchangeRateService::calculateBookingSnapshot(10000, 'US', 'USD');
assertTest($snapUS['customer_country'] === 'United States', "Snapshot country is United States");
assertTest($snapUS['customer_category'] === 'FOREIGN', "US customer category is strictly FOREIGN");
assertTest($snapUS['customer_currency'] === 'USD', "Snapshot currency is USD");
assertTest($snapUS['base_amount_inr'] === 10000.0, "Snapshot maintains INR base 10,000");
assertTest($snapUS['exchange_rate_used'] > 0, "Snapshot rate is positive");
assertTest($snapUS['converted_display_amount'] == round(10000 * $snapUS['exchange_rate_used'], 2), "Converted amount matches financial rounding");

$snapUK = ExchangeRateService::calculateBookingSnapshot(10000, 'GB', 'GBP');
assertTest($snapUK['customer_country'] === 'United Kingdom', "Snapshot country is United Kingdom");
assertTest($snapUK['customer_category'] === 'FOREIGN', "UK customer category is strictly FOREIGN");
assertTest($snapUK['customer_currency'] === 'GBP', "Snapshot currency is GBP");

$snapUAE = ExchangeRateService::calculateBookingSnapshot(10000, 'AE', 'AED');
assertTest($snapUAE['customer_country'] === 'United Arab Emirates', "Snapshot country is UAE");
assertTest($snapUAE['customer_category'] === 'FOREIGN', "UAE customer category is strictly FOREIGN");
assertTest($snapUAE['customer_currency'] === 'AED', "Snapshot currency is AED");

// --- TEST 6: Master Booking Creation with Snapshot Persistence ---
echo "\n--- TEST 6: Master Booking Persistence with Snapshot ---\n";
// 6A: Indian Customer Booking
$bookingPayloadIN = [
    'name' => 'Rahul Sharma Indian Resident',
    'phone' => '+919876543210',
    'email' => 'rahul.sharma@india.com',
    'customer_country' => 'India',
    'customer_country_code' => 'IN',
    'customer_currency' => 'INR',
    'date_of_birth' => '1990-05-15',
    'license' => 'DL-IN-12345',
    'item_id' => 'car-thar-01',
    'item_name' => 'Mahindra Thar 4x4',
    'type' => 'vehicle',
    'pickup_date' => date('Y-m-d', strtotime('+3 days')),
    'drop_date' => date('Y-m-d', strtotime('+5 days')),
    'pickup_loc' => 'Goa Airport',
    'total_amount' => 10000,
    'payment_method' => 'Static QR (UPI)',
    'payment_reference' => 'UTR-IN-123456789012'
];

$resIN = BookingService::createBooking($pdo, $bookingPayloadIN);
assertTest($resIN['success'] === true, "Indian booking created successfully");
$bIdIN = $resIN['booking_id'];

$stmtBIN = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
$stmtBIN->execute([$bIdIN]);
$dbBookingIN = $stmtBIN->fetch(PDO::FETCH_ASSOC);

assertTest($dbBookingIN['customer_category'] === 'INDIAN', "Indian booking stored customer_category is strictly INDIAN");
assertTest($dbBookingIN['customer_country'] === 'India', "Indian booking stored country is India");
assertTest($dbBookingIN['customer_currency'] === 'INR', "Indian booking stored currency is INR");
assertTest($dbBookingIN['total_amount'] == 10000, "Base INR amount is strictly preserved (₹10,000)");

// 6B: Foreign (US) Customer Booking
$bookingPayloadUS = [
    'name' => 'Michael US Traveler',
    'phone' => '+12025550199',
    'email' => 'michael.travel@us.com',
    'customer_country' => 'United States',
    'customer_country_code' => 'US',
    'customer_currency' => 'USD',
    'date_of_birth' => '1992-07-20',
    'license' => 'DL-US-99112233',
    'item_id' => 'car-thar-01',
    'item_name' => 'Mahindra Thar 4x4',
    'type' => 'vehicle',
    'pickup_date' => date('Y-m-d', strtotime('+5 days')),
    'drop_date' => date('Y-m-d', strtotime('+8 days')),
    'pickup_loc' => 'Goa Airport',
    'total_amount' => 12000,
    'payment_method' => 'International Online Payment Gateway (Pending Integration)',
    'payment_reference' => 'RES-INTL-US-998877'
];

$res = BookingService::createBooking($pdo, $bookingPayloadUS);
assertTest($res['success'] === true, "US booking created successfully");
$bId = $res['booking_id'];

$stmtB = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
$stmtB->execute([$bId]);
$dbBooking = $stmtB->fetch(PDO::FETCH_ASSOC);

assertTest($dbBooking['total_amount'] == 12000, "Base INR amount is strictly preserved (₹12,000)");
assertTest($dbBooking['customer_category'] === 'FOREIGN', "US booking stored customer_category is strictly FOREIGN");
assertTest($dbBooking['customer_country'] === 'United States', "Stored customer country is United States");
assertTest($dbBooking['customer_currency'] === 'USD', "Stored customer currency is USD");
assertTest(floatval($dbBooking['exchange_rate_used']) > 0, "Stored exchange rate snapshot is positive");
assertTest(floatval($dbBooking['converted_display_amount']) > 0, "Stored display amount snapshot is positive");
assertTest(!empty($dbBooking['currency_rate_timestamp']), "Snapshot timestamp is recorded");

// --- TEST 7: Anti-Tampering Check ---
echo "\n--- TEST 7: Anti-Tampering Validation ---\n";
// Attempt to submit a manipulated display amount and exchange rate from frontend
$tamperedPayload = [
    'name' => 'Hacker Tamper',
    'phone' => '+12025550188',
    'email' => 'hacker@tamper.com',
    'customer_country_code' => 'US',
    'customer_currency' => 'USD',
    'date_of_birth' => '1995-01-15',
    'license' => 'DL-HACK-1122',
    'exchange_rate_used' => 0.000001, // FAKE rate: pretending $1 = ₹1,000,000
    'converted_display_amount' => 0.01, // FAKE converted amount: pretending to pay 1 cent
    'item_id' => 'car-thar-01',
    'item_name' => 'Mahindra Thar 4x4',
    'type' => 'vehicle',
    'pickup_date' => date('Y-m-d', strtotime('+10 days')),
    'drop_date' => date('Y-m-d', strtotime('+12 days')),
    'pickup_loc' => 'Goa Airport',
    'total_amount' => 8000,
    'payment_method' => 'International Online Payment Gateway (Pending Integration)',
    'payment_reference' => 'RES-INTL-TAMPER-11'
];

$resTamper = BookingService::createBooking($pdo, $tamperedPayload);
$tBookingId = $resTamper['booking_id'];

$stmtT = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
$stmtT->execute([$tBookingId]);
$dbTamper = $stmtT->fetch(PDO::FETCH_ASSOC);

assertTest($dbTamper['customer_category'] === 'FOREIGN', "Tampered booking customer_category authoritatively resolved to FOREIGN");
assertTest(floatval($dbTamper['exchange_rate_used']) > 0.01, "Backend overrode manipulated exchange rate with authoritative rate");
assertTest(floatval($dbTamper['converted_display_amount']) > 10, "Backend overrode manipulated display amount with authoritative converted amount");

// --- TEST 8: Customer Profile Sync & Non-Destructive Update ---
echo "\n--- TEST 8: Customer Profile Sync ---\n";
$stmtUser = $pdo->prepare("SELECT * FROM users WHERE phone LIKE '%2025550199' LIMIT 1");
$stmtUser->execute();
$userRow = $stmtUser->fetch(PDO::FETCH_ASSOC);
assertTest(!empty($userRow), "Customer user record was created");
assertTest($userRow['customer_category'] === 'FOREIGN', "Customer profile category set to FOREIGN");
assertTest($userRow['country'] === 'United States', "Customer profile country set to United States");
assertTest($userRow['preferred_currency'] === 'USD', "Customer profile preferred currency set to USD");

echo "\n======================================================================\n";
echo "   TOTAL TESTS: $total | PASSED: $passed | FAILED: " . ($total - $passed) . "\n";
echo "======================================================================\n\n";

if ($passed === $total) {
    exit(0);
} else {
    exit(1);
}
