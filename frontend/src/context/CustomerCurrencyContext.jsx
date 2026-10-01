// frontend/src/context/CustomerCurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  getCountryByDialCode,
  getCustomerCategory
} from '../utils/countryCurrencyData';
import {
  getExchangeRates,
  convertFromINR,
  formatDualPrice
} from '../services/currencyService';

const CustomerCurrencyContext = createContext(null);

const STORAGE_COUNTRY_KEY = 'wow_customer_country_code';
const STORAGE_CURRENCY_KEY = 'wow_customer_currency_code';

export function CustomerCurrencyProvider({ children, currentUser = null }) {
  // Initialize country from:
  // 1. currentUser country or country_code
  // 2. localStorage saved preference
  // 3. Default India (+91 / INR)
  const [selectedCountry, setSelectedCountryState] = useState(() => {
    if (currentUser?.country_code || currentUser?.country) {
      const byCode = getCountryByCode(currentUser.country_code || currentUser.country);
      if (byCode) return byCode;
      const byDial = getCountryByDialCode(currentUser.country_code);
      if (byDial) return byDial;
    }

    try {
      const savedCode = localStorage.getItem(STORAGE_COUNTRY_KEY);
      if (savedCode) {
        return getCountryByCode(savedCode);
      }
    } catch (e) {}

    return DEFAULT_COUNTRY;
  });

  const [ratesLoaded, setRatesLoaded] = useState(false);

  // Sync when currentUser changes
  useEffect(() => {
    if (currentUser?.country_code || currentUser?.country) {
      const c = getCountryByCode(currentUser.country_code || currentUser.country);
      if (c && c.code !== selectedCountry.code) {
        setSelectedCountryState(c);
      }
    }
  }, [currentUser]);

  // Load exchange rates on mount
  useEffect(() => {
    getExchangeRates().then(() => {
      setRatesLoaded(true);
    });
  }, []);

  // Update country selection and immediately propagate currency change
  const setCountry = useCallback((countryOrCode, persist = true) => {
    let countryObj = null;
    if (typeof countryOrCode === 'string') {
      countryObj = countryOrCode.startsWith('+')
        ? getCountryByDialCode(countryOrCode)
        : getCountryByCode(countryOrCode);
    } else if (countryOrCode && typeof countryOrCode === 'object') {
      countryObj = countryOrCode;
    }

    if (!countryObj) countryObj = DEFAULT_COUNTRY;

    setSelectedCountryState(countryObj);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_COUNTRY_KEY, countryObj.code);
        localStorage.setItem(STORAGE_CURRENCY_KEY, countryObj.currency);
      } catch (e) {}
    }
  }, []);

  // Authoritatively reset country and currency back to default India (or profile country)
  const resetCountry = useCallback(() => {
    let target = DEFAULT_COUNTRY;
    if (currentUser?.country_code || currentUser?.country) {
      const byCode = getCountryByCode(currentUser.country_code || currentUser.country);
      if (byCode) target = byCode;
      else {
        const byDial = getCountryByDialCode(currentUser.country_code);
        if (byDial) target = byDial;
      }
    }
    setSelectedCountryState(target);
    try {
      localStorage.removeItem(STORAGE_COUNTRY_KEY);
      localStorage.removeItem(STORAGE_CURRENCY_KEY);
    } catch (e) {}
  }, [currentUser]);

  const currency = selectedCountry.currency || 'INR';
  const isNonInr = currency !== 'INR';
  const category = getCustomerCategory(selectedCountry?.code || selectedCountry);
  const isIndian = category === 'INDIAN';
  const isForeign = category === 'FOREIGN';

  const convert = useCallback((amountInr) => {
    return convertFromINR(amountInr, currency);
  }, [currency, ratesLoaded]);

  const formatDual = useCallback((amountInr) => {
    return formatDualPrice(amountInr, currency);
  }, [currency, ratesLoaded]);

  const value = useMemo(() => ({
    selectedCountry,
    country: selectedCountry,
    currency,
    category,
    isIndian,
    isForeign,
    isNonInr,
    setCountry,
    resetCountry,
    convert,
    formatDual,
    ratesLoaded
  }), [selectedCountry, currency, category, isIndian, isForeign, isNonInr, setCountry, resetCountry, convert, formatDual, ratesLoaded]);

  return (
    <CustomerCurrencyContext.Provider value={value}>
      {children}
    </CustomerCurrencyContext.Provider>
  );
}

export function useCustomerCurrency() {
  const ctx = useContext(CustomerCurrencyContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside the provider
    return {
      selectedCountry: DEFAULT_COUNTRY,
      country: DEFAULT_COUNTRY,
      currency: 'INR',
      category: 'INDIAN',
      isIndian: true,
      isForeign: false,
      isNonInr: false,
      setCountry: () => {},
      resetCountry: () => {},
      convert: (amt) => convertFromINR(amt, 'INR'),
      formatDual: (amt) => formatDualPrice(amt, 'INR'),
      ratesLoaded: true
    };
  }
  return ctx;
}
