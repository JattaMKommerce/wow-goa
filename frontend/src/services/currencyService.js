// frontend/src/services/currencyService.js
import { API_BASE, apiFetch } from './api';
import { CURRENCY_METADATA, getCountryByCode } from '../utils/countryCurrencyData';

const CACHE_KEY = 'wow_exchange_rates_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory fallback baseline rates
const FALLBACK_RATES = {
  INR: 1.0,
  USD: 0.0118,
  EUR: 0.0108,
  GBP: 0.0091,
  AED: 0.0433,
  AUD: 0.0181,
  CAD: 0.0163,
  SGD: 0.0157,
  RUB: 1.15,
  SAR: 0.0442,
  QAR: 0.043,
  KWD: 0.0036,
  OMR: 0.00454,
  BHD: 0.00445,
  CHF: 0.0104,
  SEK: 0.124,
  NOK: 0.126,
  DKK: 0.081,
  NZD: 0.0198,
  ZAR: 0.211,
  MYR: 0.052,
  THB: 0.402,
  JPY: 1.78,
  KRW: 16.25,
  ILS: 0.044,
  TRY: 0.41,
  BRL: 0.065,
  MXN: 0.235,
  BDT: 1.41,
  LKR: 3.52,
  NPR: 1.6
};

let memoryRates = null;

/**
 * Fetch and cache exchange rates.
 */
export async function getExchangeRates(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && memoryRates) {
    return memoryRates;
  }

  // Check localStorage cache
  if (!forceRefresh) {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.timestamp && now - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
          memoryRates = parsed.rates;
          return memoryRates;
        }
      }
    } catch (e) {
      // Local storage read error
    }
  }

  // Fetch from backend
  try {
    const res = await apiFetch(`${API_BASE}?resource=exchange_rates`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === 'object') {
        memoryRates = { ...FALLBACK_RATES, ...data.rates };
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: now, rates: memoryRates })
          );
        } catch (e) {}
        return memoryRates;
      }
    }
  } catch (e) {
    console.warn('Could not fetch latest exchange rates, using baseline cache.', e);
  }

  // Fallback to baseline
  memoryRates = FALLBACK_RATES;
  return memoryRates;
}

/**
 * Synchronously get latest known rate for a currency (1 INR = X currency).
 */
export function getRateSync(targetCurrency = 'INR') {
  const code = (targetCurrency || 'INR').toUpperCase();
  if (code === 'INR') return 1.0;
  if (memoryRates && memoryRates[code]) return memoryRates[code];
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.rates?.[code]) return parsed.rates[code];
    }
  } catch (e) {}
  return FALLBACK_RATES[code] || 1.0;
}

/**
 * Convert Base INR amount into Target Currency with proper financial rounding.
 * Returns an object with:
 * {
 *   baseInr: 10000,
 *   targetCurrency: 'USD',
 *   rate: 0.0118,
 *   convertedAmount: 118.00,
 *   formattedConverted: '$118.00',
 *   symbol: '$',
 *   decimals: 2,
 *   isNonInr: true
 * }
 */
export function convertFromINR(baseInr, targetCurrency = 'INR') {
  const numInr = Math.max(0, Number(baseInr) || 0);
  const curCode = (targetCurrency || 'INR').toUpperCase();
  const meta = CURRENCY_METADATA[curCode] || { symbol: curCode, decimals: 2 };
  const rate = getRateSync(curCode);
  const decimals = meta.decimals ?? (curCode === 'INR' ? 0 : 2);

  // Financial rounding
  const factor = Math.pow(10, decimals);
  const rawConverted = numInr * rate;
  const roundedAmount = Math.round((rawConverted + Number.EPSILON) * factor) / factor;

  const formattedConverted = formatCurrency(roundedAmount, curCode);

  return {
    baseInr: numInr,
    targetCurrency: curCode,
    rate,
    convertedAmount: roundedAmount,
    formattedConverted,
    symbol: meta.symbol || curCode,
    decimals,
    isNonInr: curCode !== 'INR'
  };
}

/**
 * Format a number according to currency convention.
 */
export function formatCurrency(amount, currencyCode = 'INR') {
  const code = (currencyCode || 'INR').toUpperCase();
  const meta = CURRENCY_METADATA[code] || { symbol: code, decimals: 2 };
  const num = Number(amount) || 0;
  const decimals = meta.decimals ?? (code === 'INR' ? 0 : 2);

  if (code === 'INR') {
    return '₹' + num.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  }

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${meta.symbol}${formattedNum}`;
}

/**
 * Produces clean dual-currency display strings:
 * e.g. { primary: '$118.00', secondary: 'Approx. ₹10,000 INR', rateNote: '1 USD ≈ ₹84.75' }
 */
export function formatDualPrice(baseInr, targetCurrency = 'INR') {
  const conv = convertFromINR(baseInr, targetCurrency);
  const inrFormatted = '₹' + Math.round(conv.baseInr).toLocaleString('en-IN');

  if (!conv.isNonInr) {
    return {
      primary: inrFormatted,
      secondary: null,
      isNonInr: false,
      rateNote: null
    };
  }

  const inrPerUnit = conv.rate > 0 ? (1 / conv.rate).toFixed(2) : '—';

  return {
    primary: conv.formattedConverted,
    secondary: `Approx. ${inrFormatted} INR`,
    isNonInr: true,
    rateNote: `1 ${conv.targetCurrency} ≈ ₹${inrPerUnit} INR`,
    conv
  };
}
