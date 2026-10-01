<?php
// backend/country_currency.php
/**
 * Authoritative Backend Country, Dial Code & ISO 4217 Currency Registry.
 */

class CountryCurrencyRegistry {
    private static array $countries = [
        'IN' => ['name' => 'India', 'dial_code' => '+91', 'currency' => 'INR', 'symbol' => '₹', 'decimals' => 0],
        'US' => ['name' => 'United States', 'dial_code' => '+1', 'currency' => 'USD', 'symbol' => '$', 'decimals' => 2],
        'GB' => ['name' => 'United Kingdom', 'dial_code' => '+44', 'currency' => 'GBP', 'symbol' => '£', 'decimals' => 2],
        'AE' => ['name' => 'United Arab Emirates', 'dial_code' => '+971', 'currency' => 'AED', 'symbol' => 'AED', 'decimals' => 2],
        'RU' => ['name' => 'Russia', 'dial_code' => '+7', 'currency' => 'RUB', 'symbol' => '₽', 'decimals' => 2],
        'DE' => ['name' => 'Germany', 'dial_code' => '+49', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'FR' => ['name' => 'France', 'dial_code' => '+33', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'AU' => ['name' => 'Australia', 'dial_code' => '+61', 'currency' => 'AUD', 'symbol' => 'A$', 'decimals' => 2],
        'CA' => ['name' => 'Canada', 'dial_code' => '+1', 'currency' => 'CAD', 'symbol' => 'C$', 'decimals' => 2],
        'SG' => ['name' => 'Singapore', 'dial_code' => '+65', 'currency' => 'SGD', 'symbol' => 'S$', 'decimals' => 2],
        'SA' => ['name' => 'Saudi Arabia', 'dial_code' => '+966', 'currency' => 'SAR', 'symbol' => 'SAR', 'decimals' => 2],
        'QA' => ['name' => 'Qatar', 'dial_code' => '+974', 'currency' => 'QAR', 'symbol' => 'QAR', 'decimals' => 2],
        'KW' => ['name' => 'Kuwait', 'dial_code' => '+965', 'currency' => 'KWD', 'symbol' => 'KWD', 'decimals' => 3],
        'OM' => ['name' => 'Oman', 'dial_code' => '+968', 'currency' => 'OMR', 'symbol' => 'OMR', 'decimals' => 3],
        'BH' => ['name' => 'Bahrain', 'dial_code' => '+973', 'currency' => 'BHD', 'symbol' => 'BHD', 'decimals' => 3],
        'NL' => ['name' => 'Netherlands', 'dial_code' => '+31', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'CH' => ['name' => 'Switzerland', 'dial_code' => '+41', 'currency' => 'CHF', 'symbol' => 'CHF', 'decimals' => 2],
        'IT' => ['name' => 'Italy', 'dial_code' => '+39', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'ES' => ['name' => 'Spain', 'dial_code' => '+34', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'SE' => ['name' => 'Sweden', 'dial_code' => '+46', 'currency' => 'SEK', 'symbol' => 'kr', 'decimals' => 2],
        'NO' => ['name' => 'Norway', 'dial_code' => '+47', 'currency' => 'NOK', 'symbol' => 'kr', 'decimals' => 2],
        'DK' => ['name' => 'Denmark', 'dial_code' => '+45', 'currency' => 'DKK', 'symbol' => 'kr', 'decimals' => 2],
        'IE' => ['name' => 'Ireland', 'dial_code' => '+353', 'currency' => 'EUR', 'symbol' => '€', 'decimals' => 2],
        'NZ' => ['name' => 'New Zealand', 'dial_code' => '+64', 'currency' => 'NZD', 'symbol' => 'NZ$', 'decimals' => 2],
        'ZA' => ['name' => 'South Africa', 'dial_code' => '+27', 'currency' => 'ZAR', 'symbol' => 'R', 'decimals' => 2],
        'MY' => ['name' => 'Malaysia', 'dial_code' => '+60', 'currency' => 'MYR', 'symbol' => 'RM', 'decimals' => 2],
        'TH' => ['name' => 'Thailand', 'dial_code' => '+66', 'currency' => 'THB', 'symbol' => '฿', 'decimals' => 2],
        'JP' => ['name' => 'Japan', 'dial_code' => '+81', 'currency' => 'JPY', 'symbol' => '¥', 'decimals' => 0],
        'KR' => ['name' => 'South Korea', 'dial_code' => '+82', 'currency' => 'KRW', 'symbol' => '₩', 'decimals' => 0],
        'IL' => ['name' => 'Israel', 'dial_code' => '+972', 'currency' => 'ILS', 'symbol' => '₪', 'decimals' => 2],
        'TR' => ['name' => 'Turkey', 'dial_code' => '+90', 'currency' => 'TRY', 'symbol' => '₺', 'decimals' => 2],
        'BR' => ['name' => 'Brazil', 'dial_code' => '+55', 'currency' => 'BRL', 'symbol' => 'R$', 'decimals' => 2],
        'MX' => ['name' => 'Mexico', 'dial_code' => '+52', 'currency' => 'MXN', 'symbol' => 'Mex$', 'decimals' => 2],
        'BD' => ['name' => 'Bangladesh', 'dial_code' => '+880', 'currency' => 'BDT', 'symbol' => '৳', 'decimals' => 2],
        'LK' => ['name' => 'Sri Lanka', 'dial_code' => '+94', 'currency' => 'LKR', 'symbol' => 'Rs', 'decimals' => 2],
        'NP' => ['name' => 'Nepal', 'dial_code' => '+977', 'currency' => 'NPR', 'symbol' => 'Rs', 'decimals' => 2]
    ];

    public static function getAll(): array {
        return self::$countries;
    }

    public static function getByCode(?string $code): array {
        $code = strtoupper(trim((string)$code));
        $res = self::$countries[$code] ?? self::$countries['IN'];
        $res['code'] = isset(self::$countries[$code]) ? $code : 'IN';
        return $res;
    }

    public static function getByDialCode(?string $dialCode, ?string $countryHint = null): array {
        $dialCode = trim((string)$dialCode);
        if (!str_starts_with($dialCode, '+')) {
            $dialCode = '+' . $dialCode;
        }

        if ($countryHint) {
            $hint = strtoupper(trim($countryHint));
            if (isset(self::$countries[$hint]) && self::$countries[$hint]['dial_code'] === $dialCode) {
                $res = self::$countries[$hint];
                $res['code'] = $hint;
                return $res;
            }
        }

        // Shared codes:
        if ($dialCode === '+1') {
            $res = self::$countries['US'];
            $res['code'] = 'US';
            return $res;
        }
        if ($dialCode === '+7') {
            $res = self::$countries['RU'];
            $res['code'] = 'RU';
            return $res;
        }

        foreach (self::$countries as $code => $info) {
            if ($info['dial_code'] === $dialCode) {
                $info['code'] = $code;
                return $info;
            }
        }

        $res = self::$countries['IN'];
        $res['code'] = 'IN';
        return $res;
    }

    public static function detectFromPhone(?string $phone): ?array {
        if (!$phone) return null;
        $clean = trim($phone);
        if (str_starts_with($clean, '+')) {
            $dialCodes = [];
            foreach (self::$countries as $iso => $data) {
                $data['code'] = $iso;
                $dialCodes[$data['dial_code']] = $data;
            }
            uksort($dialCodes, function($a, $b) {
                return strlen($b) <=> strlen($a);
            });
            foreach ($dialCodes as $dial => $data) {
                if (str_starts_with($clean, $dial)) {
                    return $data;
                }
            }
        }
        return null;
    }

    public static function getCurrencyForCountry(?string $countryCode): string {
        $info = self::getByCode($countryCode);
        return $info['currency'] ?? 'INR';
    }

    public static function getDecimalsForCurrency(string $currency): int {
        $currency = strtoupper(trim($currency));
        if (in_array($currency, ['INR', 'JPY', 'KRW'])) return 0;
        if (in_array($currency, ['KWD', 'OMR', 'BHD'])) return 3;
        return 2;
    }
}
