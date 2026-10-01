// test_state_reset.mjs
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  getCountryByDialCode,
  getCustomerCategory,
  parsePhoneNumber,
  formatE164,
  extractPhoneString
} from './src/utils/countryCurrencyData.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(` [PASS] ${message}`);
    passed++;
  } else {
    console.error(` [FAIL] ${message}`);
    failed++;
  }
}

console.log('======================================================================');
console.log('   WOW GOA CUSTOMER COUNTRY / CATEGORY / CURRENCY STATE RESET TESTS');
console.log('======================================================================\n');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Simulation of CustomerCurrencyContext state & actions
class SimulatedCustomerCurrencyContext {
  constructor(currentUser = null) {
    this.currentUser = currentUser;
    this.selectedCountry = this.initCountry();
  }

  initCountry() {
    if (this.currentUser?.country_code || this.currentUser?.country) {
      const byCode = getCountryByCode(this.currentUser.country_code || this.currentUser.country);
      if (byCode) return byCode;
    }
    const savedCode = localStorageMock.getItem('wow_customer_country_code');
    if (savedCode) {
      const byCode = getCountryByCode(savedCode);
      if (byCode) return byCode;
    }
    return DEFAULT_COUNTRY;
  }

  get country() { return this.selectedCountry; }
  get currency() { return this.selectedCountry?.currency || 'INR'; }
  get category() { return getCustomerCategory(this.selectedCountry?.code); }
  get isIndian() { return this.category === 'INDIAN'; }
  get isForeign() { return this.category === 'FOREIGN'; }

  setCountry(countryOrCode, persist = true) {
    let countryObj = null;
    if (typeof countryOrCode === 'string') {
      countryObj = countryOrCode.startsWith('+')
        ? getCountryByDialCode(countryOrCode)
        : getCountryByCode(countryOrCode);
    } else if (countryOrCode && typeof countryOrCode === 'object') {
      countryObj = countryOrCode;
    }
    if (!countryObj) countryObj = DEFAULT_COUNTRY;
    this.selectedCountry = countryObj;

    if (persist) {
      localStorageMock.setItem('wow_customer_country_code', countryObj.code);
      localStorageMock.setItem('wow_customer_currency_code', countryObj.currency);
    }
  }

  resetCountry() {
    let target = DEFAULT_COUNTRY;
    if (this.currentUser?.country_code || this.currentUser?.country) {
      const byCode = getCountryByCode(this.currentUser.country_code || this.currentUser.country);
      if (byCode) target = byCode;
    }
    this.selectedCountry = target;
    localStorageMock.removeItem('wow_customer_country_code');
    localStorageMock.removeItem('wow_customer_currency_code');
  }
}

// Simulated Booking Modal & Teardown Flow
class SimulatedBookingModal {
  constructor(context, initialPhone = '') {
    this.context = context;
    this.phone = initialPhone;

    // Component mount behavior:
    const rawP = extractPhoneString(this.phone);
    if (!rawP) {
      this.context.resetCountry();
      this.selectedCountry = DEFAULT_COUNTRY;
    } else {
      const parsed = parsePhoneNumber(rawP, 'IN');
      if (parsed.country) {
        this.selectedCountry = parsed.country;
        this.context.setCountry(parsed.country);
      } else {
        this.selectedCountry = DEFAULT_COUNTRY;
      }
    }
  }

  // Country selector change
  selectCountry(countryCode) {
    const c = getCountryByCode(countryCode);
    this.selectedCountry = c;
    this.context.setCountry(c);
  }

  // Input phone change
  changePhone(digits) {
    const fullE164 = digits ? formatE164(this.selectedCountry.dialCode, digits) : '';
    this.phone = fullE164;
    return fullE164;
  }

  // Close modal / teardown
  close() {
    this.context.resetCountry();
    this.phone = '';
  }
}

// ----------------------------------------------------------------------
console.log('--- TEST 1: Complete FOREIGN/USD booking -> New Booking Reset ---');
const ctx = new SimulatedCustomerCurrencyContext();
// Simulate previous booking as FOREIGN / USD
ctx.setCountry('US');
assert(ctx.country.code === 'US', 'Previous booking selected country is US');
assert(ctx.category === 'FOREIGN', 'Previous booking category is FOREIGN');
assert(ctx.currency === 'USD', 'Previous booking currency is USD');

// Simulate booking modal teardown & close
ctx.resetCountry();
assert(localStorageMock.getItem('wow_customer_country_code') === null, 'localStorage country key removed upon modal teardown');
assert(localStorageMock.getItem('wow_customer_currency_code') === null, 'localStorage currency key removed upon modal teardown');

// Start a NEW booking modal
const newBooking1 = new SimulatedBookingModal(ctx, '');
assert(newBooking1.selectedCountry.code === 'IN', 'New booking modal starts with India (+91)');
assert(ctx.country.code === 'IN', 'Context country is reset to IN');
assert(ctx.category === 'INDIAN', 'Context category is INDIAN (NOT FOREIGN)');
assert(ctx.currency === 'INR', 'Context currency is INR (NOT USD)');

// ----------------------------------------------------------------------
console.log('\n--- TEST 2: Start New Booking -> Select US +1 ---');
const newBooking2 = new SimulatedBookingModal(ctx, '');
newBooking2.selectCountry('US');
assert(newBooking2.selectedCountry.code === 'US', 'Selected country updated to US');
assert(ctx.category === 'FOREIGN', 'Category immediately updated to FOREIGN');
assert(ctx.currency === 'USD', 'Currency immediately updated to USD');

// ----------------------------------------------------------------------
console.log('\n--- TEST 3: Switch US +1 -> India +91 ---');
newBooking2.selectCountry('IN');
assert(newBooking2.selectedCountry.code === 'IN', 'Selected country switched to IN');
assert(ctx.category === 'INDIAN', 'Category immediately switched back to INDIAN');
assert(ctx.currency === 'INR', 'Currency immediately switched back to INR');
assert(ctx.currency !== 'USD', 'No USD remains');

// ----------------------------------------------------------------------
console.log('\n--- TEST 4: Switch India +91 -> UK +44 ---');
newBooking2.selectCountry('GB');
assert(newBooking2.selectedCountry.code === 'GB', 'Selected country switched to GB');
assert(ctx.category === 'FOREIGN', 'Category is FOREIGN');
assert(ctx.currency === 'GBP', 'Currency is GBP');

// ----------------------------------------------------------------------
console.log('\n--- TEST 5: Switch UK +44 -> UAE +971 ---');
newBooking2.selectCountry('AE');
assert(newBooking2.selectedCountry.code === 'AE', 'Selected country switched to AE');
assert(ctx.category === 'FOREIGN', 'Category is FOREIGN');
assert(ctx.currency === 'AED', 'Currency is AED');

// ----------------------------------------------------------------------
console.log('\n--- TEST 6: Complete FOREIGN booking -> Start another -> Select India +91 ---');
// Complete UAE booking
newBooking2.close();
assert(ctx.category === 'INDIAN', 'Teardown resets category to INDIAN');
assert(ctx.currency === 'INR', 'Teardown resets currency to INR');

const newBooking3 = new SimulatedBookingModal(ctx, '');
assert(newBooking3.selectedCountry.dialCode === '+91', 'Dial code is +91');
assert(ctx.country.code === 'IN', 'Country is IN');
assert(ctx.category === 'INDIAN', 'Category is INDIAN');
assert(ctx.currency === 'INR', 'Currency is INR');
assert(ctx.category !== 'FOREIGN', 'No stale FOREIGN badge');
assert(ctx.currency !== 'USD' && ctx.currency !== 'AED', 'No stale USD or AED badge');

// ----------------------------------------------------------------------
console.log('\n--- TEST 7: Complete INDIAN booking -> Start another -> Select US +1 ---');
newBooking3.close();
const newBooking4 = new SimulatedBookingModal(ctx, '');
newBooking4.selectCountry('US');
assert(newBooking4.selectedCountry.code === 'US', 'Country is US');
assert(ctx.category === 'FOREIGN', 'Category is FOREIGN');
assert(ctx.currency === 'USD', 'Currency is USD');
assert(ctx.category !== 'INDIAN', 'No stale INDIAN category state');

console.log('\n======================================================================');
console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('======================================================================');

if (failed > 0) process.exit(1);
