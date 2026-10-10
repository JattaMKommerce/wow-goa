// frontend/src/utils/countryCurrencyData.js
/**
 * Authoritative Centralized Country, Dial Code, and ISO 4217 Currency Registry.
 * Maps international countries to their dialing codes and default ISO 4217 display currencies.
 */

export const COUNTRIES = [
  // High-frequency inbound tourist countries for Goa & India
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', currency: 'INR', symbol: '₹', decimals: 0, placeholder: 'Enter 10-digit mobile number' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', currency: 'USD', symbol: '$', decimals: 2, placeholder: '(555) 000-0000' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', currency: 'GBP', symbol: '£', decimals: 2, placeholder: '7911 123456' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', currency: 'AED', symbol: 'AED', decimals: 2, placeholder: '50 123 4567' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', currency: 'RUB', symbol: '₽', decimals: 2, placeholder: '912 345-67-89' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '151 12345678' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '6 12 34 56 78' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', decimals: 2, placeholder: '412 345 678' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', decimals: 2, placeholder: '(555) 000-0000' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', decimals: 2, placeholder: '8123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', currency: 'SAR', symbol: 'SAR', decimals: 2, placeholder: '50 123 4567' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', currency: 'QAR', symbol: 'QAR', decimals: 2, placeholder: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', currency: 'KWD', symbol: 'KWD', decimals: 3, placeholder: '9123 4567' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', currency: 'OMR', symbol: 'OMR', decimals: 3, placeholder: '9123 4567' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', currency: 'BHD', symbol: 'BHD', decimals: 3, placeholder: '3600 1234' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '6 12345678' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', currency: 'CHF', symbol: 'CHF', decimals: 2, placeholder: '78 123 45 67' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '312 345 6789' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '612 34 56 78' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', currency: 'SEK', symbol: 'kr', decimals: 2, placeholder: '70 123 45 67' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', currency: 'NOK', symbol: 'kr', decimals: 2, placeholder: '412 34 567' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', currency: 'DKK', symbol: 'kr', decimals: 2, placeholder: '20 12 34 56' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', currency: 'EUR', symbol: '€', decimals: 2, placeholder: '83 123 4567' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', currency: 'NZD', symbol: 'NZ$', decimals: 2, placeholder: '21 123 4567' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', decimals: 2, placeholder: '71 123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', currency: 'MYR', symbol: 'RM', decimals: 2, placeholder: '12-345 6789' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', currency: 'THB', symbol: '฿', decimals: 2, placeholder: '81 234 5678' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', currency: 'JPY', symbol: '¥', decimals: 0, placeholder: '90 1234 5678' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', currency: 'KRW', symbol: '₩', decimals: 0, placeholder: '10 1234 5678' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', currency: 'ILS', symbol: '₪', decimals: 2, placeholder: '50 123 4567' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', currency: 'TRY', symbol: '₺', decimals: 2, placeholder: '532 123 45 67' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', decimals: 2, placeholder: '11 91234-5678' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', currency: 'MXN', symbol: 'Mex$', decimals: 2, placeholder: '55 1234 5678' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', currency: 'BDT', symbol: '৳', decimals: 2, placeholder: '1712-345678' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', currency: 'LKR', symbol: 'Rs', decimals: 2, placeholder: '71 234 5678' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', currency: 'NPR', symbol: 'Rs', decimals: 2, placeholder: '984-1234567' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India

/**
 * Currency metadata dictionary for fast lookup.
 */
export const CURRENCY_METADATA = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 0, flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, flag: '🇺🇸' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, flag: '🇬🇧' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, flag: '🇪🇺' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2, flag: '🇦🇪' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, flag: '🇨🇦' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, flag: '🇸🇬' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 2, flag: '🇷🇺' },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', decimals: 2, flag: '🇸🇦' },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', decimals: 2, flag: '🇶🇦' },
  KWD: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, flag: '🇰🇼' },
  OMR: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', decimals: 3, flag: '🇴🇲' },
  BHD: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', decimals: 3, flag: '🇧🇭' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, flag: '🇨🇭' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2, flag: '🇸🇪' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2, flag: '🇳🇴' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 2, flag: '🇩🇰' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, flag: '🇳🇿' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, flag: '🇿🇦' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, flag: '🇲🇾' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, flag: '🇹🇭' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, flag: '🇯🇵' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, flag: '🇰🇷' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimals: 2, flag: '🇮🇱' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 2, flag: '🇹🇷' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, flag: '🇧🇷' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', decimals: 2, flag: '🇲🇽' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 2, flag: '🇧🇩' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', decimals: 2, flag: '🇱🇰' },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', decimals: 2, flag: '🇳🇵' }
};

/**
 * Find country by ISO country code (e.g. 'US', 'IN', 'GB').
 */
export function getCountryByCode(code) {
  if (!code) return DEFAULT_COUNTRY;
  const upper = String(code).trim().toUpperCase();
  return COUNTRIES.find(c => c.code === upper) || DEFAULT_COUNTRY;
}

/**
 * Find country by dial code (e.g. '+91', '+44', '+1').
 * When dial codes are shared (e.g. +1 for US/CA), prefer US unless countryHint is provided.
 */
export function getCountryByDialCode(dialCode, countryHint = null) {
  if (!dialCode) return DEFAULT_COUNTRY;
  const cleanDial = String(dialCode).trim().startsWith('+') ? String(dialCode).trim() : `+${String(dialCode).trim()}`;
  
  if (countryHint) {
    const hintMatch = COUNTRIES.find(c => c.code === countryHint.toUpperCase() && c.dialCode === cleanDial);
    if (hintMatch) return hintMatch;
  }
  
  const matches = COUNTRIES.filter(c => c.dialCode === cleanDial);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // Shared dial code: default +1 to US, +7 to RU
    if (cleanDial === '+1') return COUNTRIES.find(c => c.code === 'US') || matches[0];
    if (cleanDial === '+7') return COUNTRIES.find(c => c.code === 'RU') || matches[0];
    return matches[0];
  }
  return DEFAULT_COUNTRY;
}

/**
 * Authoritative Customer Classification:
 * - INDIAN: If selected country is India ('IN', '+91', 'India')
 * - FOREIGN: All other international countries/territories
 */
export function getCustomerCategory(countryOrCode) {
  if (!countryOrCode) return 'INDIAN';
  if (typeof countryOrCode === 'object') {
    const code = String(countryOrCode.code || '').trim().toUpperCase();
    const name = String(countryOrCode.name || '').trim().toLowerCase();
    const dial = String(countryOrCode.dialCode || countryOrCode.dial_code || '').trim();
    if (code === 'IN' || name === 'india' || dial === '+91') return 'INDIAN';
    return 'FOREIGN';
  }
  const clean = String(countryOrCode).trim().toUpperCase();
  if (clean === 'IN' || clean === '+91' || clean === 'INDIA') {
    return 'INDIAN';
  }
  return 'FOREIGN';
}

/**
 * Safely extracts a string representation of a phone number from primitives or objects.
 */
export function extractPhoneString(raw) {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.value === 'string') return raw.value;
    if (raw.target && typeof raw.target.value === 'string') return raw.target.value;
    if (typeof raw.fullPhoneNumber === 'string') return raw.fullPhoneNumber;
    if (typeof raw.phoneNumber === 'string') return raw.phoneNumber;
    if (typeof raw.rawNumber === 'string') return raw.rawNumber;
    if (typeof raw.toString === 'function') {
      const s = raw.toString();
      if (s && s !== '[object Object]') return s;
    }
    return '';
  }
  return String(raw || '');
}

/**
 * Parses any incoming phone number (e.g. "+1 (202) 555-0123" or "+919876543210" or "9876543210")
 * into normalized components: { country, dialCode, nationalNumber, e164 }
 */
export function parsePhoneNumber(rawPhone, preferredCountryCode = 'IN') {
  const str = extractPhoneString(rawPhone).trim();
  const prefCountry = getCountryByCode(preferredCountryCode);

  if (!str) {
    return {
      country: prefCountry,
      dialCode: prefCountry.dialCode,
      nationalNumber: '',
      e164: ''
    };
  }

  // If starts with +
  if (str.startsWith('+')) {
    // Sort dial codes by length descending (e.g. +971 before +9)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    let matchedDialCode = null;
    for (const c of sorted) {
      if (str.startsWith(c.dialCode)) {
        matchedDialCode = c.dialCode;
        break;
      }
    }

    if (matchedDialCode) {
      // Find all countries sharing this dial code (e.g. US and CA both use +1)
      const candidates = COUNTRIES.filter(c => c.dialCode === matchedDialCode);
      const chosenCountry = candidates.find(c => c.code === String(preferredCountryCode).toUpperCase()) || candidates[0];
      const national = str.slice(matchedDialCode.length).replace(/\D/g, '');
      return {
        country: chosenCountry,
        dialCode: chosenCountry.dialCode,
        nationalNumber: national,
        e164: national ? `${chosenCountry.dialCode}${national}` : ''
      };
    }
  }

  // Fallback: digits without a leading +
  const cleanDigits = str.replace(/\D/g, '');
  return {
    country: prefCountry,
    dialCode: prefCountry.dialCode,
    nationalNumber: cleanDigits,
    e164: cleanDigits ? `${prefCountry.dialCode}${cleanDigits}` : ''
  };
}

/**
 * Formats E.164 string from dial code and national digits.
 */
export function formatE164(dialCode, nationalNumber) {
  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const cleanNum = String(nationalNumber || '').replace(/\D/g, '');
  if (!cleanNum) return '';
  return `${cleanDial}${cleanNum}`;
}

/**
 * Formats national phone digits for clean, standard in-input display:
 * - US & CA: (XXX) XXX-XXXX
 * - India: XXXXX XXXXX
 * - UK: XXXX XXXXXX
 * - UAE: XX XXX XXXX
 */
export function formatNationalNumber(digits, countryCode = 'IN') {
  const d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';

  const cCode = countryCode ? String(countryCode).toUpperCase() : 'IN';

  // US & Canada (NANP 10 digits)
  if (cCode === 'US' || cCode === 'CA') {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  // India (standard 10 continuous digits)
  if (cCode === 'IN') {
    return d.slice(0, 10);
  }

  // United Kingdom (10-11 digits)
  if (cCode === 'GB') {
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 11)}`;
  }

  // UAE (9 digits: e.g. 50 123 4567)
  if (cCode === 'AE') {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`;
  }

  // Generic grouping for other international countries
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 12)}`;
}

