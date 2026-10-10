/**
 * Date utility helpers for Hotel & Travel booking date validation
 * Standardized on Indian Standard Time (IST, Asia/Kolkata, UTC+05:30)
 * for all Goa travel services, preventing client-side timezone shifting bugs.
 */

/**
 * Returns today's date in YYYY-MM-DD format in Indian Standard Time (Asia/Kolkata)
 */
export function getTodayDateStr() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch (e) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns date + 1 day in YYYY-MM-DD format without timezone shift
 */
export function getNextDayDateStr(dateStr) {
  return addDays(dateStr, 1);
}

/**
 * Adds N days to a date string in YYYY-MM-DD format using pure calendar math (no DST/timezone shifts)
 */
export function addDays(dateStr, numDays = 1) {
  if (!dateStr) return getTodayDateStr();
  const m = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return getTodayDateStr();
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  // Anchor at UTC noon to avoid any midnight timezone rollover
  const date = new Date(Date.UTC(y, mo, d, 12, 0, 0));
  if (isNaN(date.getTime())) return getTodayDateStr();
  date.setUTCDate(date.getUTCDate() + numDays);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date string is in the past (before today in IST)
 */
export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const today = getTodayDateStr();
  return dateStr < today;
}

/**
 * Validates check-in and check-out date range
 * Returns { valid: boolean, error: string | null }
 */
export function validateBookingDates(checkIn, checkOut, options = { allowSameDay: false, minDays: 1 }) {
  const today = getTodayDateStr();

  if (!checkIn) {
    return { valid: false, error: 'Please select a check-in date.' };
  }

  if (checkIn < today) {
    return { valid: false, error: 'Check-in date cannot be in the past. Please select today or a future date.' };
  }

  if (!checkOut) {
    return { valid: false, error: 'Please select a check-out date.' };
  }

  if (!options.allowSameDay && checkOut <= checkIn) {
    return { valid: false, error: 'Check-out date must be at least 1 day after check-in date.' };
  }

  if (options.allowSameDay && checkOut < checkIn) {
    return { valid: false, error: 'Return/Check-out date cannot be before check-in date.' };
  }

  return { valid: true, error: null };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats YYYY-MM-DD for display (e.g. "Wed, 26 Aug 2026") strictly anchored in IST
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    // Anchor at UTC noon to avoid any timezone rollback
    const date = new Date(Date.UTC(y, mo, d, 12, 0, 0));
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  return str;
}

/**
 * Formats an instant UTC timestamp (created_at, updated_at, etc.) into Indian Standard Time (IST)
 */
export function formatUtcToIST(utcString, options = {}) {
  if (!utcString) return '';
  try {
    const str = String(utcString).trim();
    if (str === 'Recent' || str === 'Just now' || str === 'just now') return str;
    // Add explicit Z if plain SQL format without offset (e.g. "2026-10-08 14:30:00")
    const isoStr = (!str.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) ? str.replace(' ', 'T') + 'Z' : str;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options
    });
  } catch (e) {
    return String(utcString);
  }
}

/**
 * Consistently formats booking dates and times to "11 Sep 2026 • 10:00 AM" format in IST
 */
export function formatBookingDateTime(dateStr, timeStr = '') {
  if (!dateStr) return 'Scheduled';
  
  let datePart = String(dateStr).trim();
  let timePart = String(timeStr || '').trim();

  // If full ISO timestamp with Z or timezone, convert directly via formatUtcToIST
  if (datePart.includes('T') && (datePart.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(datePart))) {
    return formatUtcToIST(datePart);
  }

  if (datePart.includes(' at ')) {
    const parts = datePart.split(' at ');
    datePart = parts[0];
    if (!timePart && parts[1]) timePart = parts[1];
  } else if (datePart.includes('T')) {
    const parts = datePart.split('T');
    datePart = parts[0];
    if (!timePart && parts[1]) timePart = parts[1].slice(0, 5);
  }

  let formattedDate = datePart;
  const ymdMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      formattedDate = `${day} ${MONTH_NAMES[month]} ${year}`;
    }
  } else {
    try {
      const d = new Date(datePart);
      if (!isNaN(d.getTime())) {
        formattedDate = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {
      formattedDate = datePart;
    }
  }

  let formattedTime = '';
  if (timePart) {
    timePart = timePart.replace(/^(at|•|@)\s*/i, '').trim();
    const hmMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?/i);
    if (hmMatch) {
      let hours = parseInt(hmMatch[1], 10);
      const minutes = hmMatch[2];
      const ampm = hmMatch[3];
      if (ampm) {
        formattedTime = `${hours}:${minutes} ${ampm.toUpperCase()}`;
      } else {
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        formattedTime = `${hours}:${minutes} ${period}`;
      }
    } else {
      formattedTime = timePart;
    }
  }

  return formattedTime ? `${formattedDate} • ${formattedTime}` : formattedDate;
}

/**
 * Formats a timestamp or date string to "11 Sep 2026"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return 'Recent';
  return formatBookingDateTime(dateStr, '');
}

/**
 * Safely parses human, formatted or ISO travel date strings into a valid Date object
 * Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, and English month strings (e.g. "15 Sep 2026", "Wed, 26 Aug 2026")
 */
export function parseTravelDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Check YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Standard parse (e.g. "Wed, 26 Aug 2026", "15 Sep 2026")
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Calculates accurate age from a DOB string evaluated against a reference date (defaults to today).
 * Reference date for vehicle rentals is the vehicle pickup date.
 * Accurately handles birthdays (accounts for whether birthday has occurred in reference year)
 * and leap years (e.g. 2008-02-29).
 * Returns number (>= 0) or null if invalid/missing/future DOB.
 */
export function calculateAge(dobString, referenceDateString = null) {
  if (!dobString) return null;
  const dob = parseTravelDate(dobString);
  if (!dob || isNaN(dob.getTime())) return null;

  let ref = referenceDateString ? parseTravelDate(referenceDateString) : new Date();
  if (!ref || isNaN(ref.getTime())) ref = new Date();

  // If reference/pickup date is before birth date, impossible future DOB
  if (ref < dob) return null;

  let age = ref.getFullYear() - dob.getFullYear();
  const mDiff = ref.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Centralized business rule validator for vehicle booking eligibility.
 * - Self Drive (isSelfDrive = true):
 *     DOB is mandatory
 *     Age must be >= 18 on vehicle pickup date
 *     Driving License is mandatory
 * - Vehicle + Driver (isSelfDrive = false):
 *     DOB is mandatory
 *     No 18+ age restriction
 *     Driving License is optional
 *
 * @returns {{ valid: boolean, age: number|null, error: string|null }}
 */
export function isValidDrivingLicense(license) {
  if (!license || typeof license !== 'string') return false;
  const clean = license.trim().toUpperCase().replace(/[\s\-_/]/g, '');
  // Application-level validation: minimum 8 to 20 alphanumeric characters
  if (clean.length < 8 || clean.length > 20) return false;
  // Disallow repetitive single-character strings (e.g. "AAAAAAAA", "11111111")
  if (/^(\w)\1+$/.test(clean)) return false;
  // Must contain alphanumeric characters with at least 4 digits
  return /^[A-Z0-9]{8,20}$/.test(clean) && /\d{4,}/.test(clean);
}

export function validateVehicleBookingEligibility(
  dob,
  pickupDate,
  isSelfDrive = true,
  license = ''
) {
  if (!dob || !String(dob).trim()) {
    return {
      valid: false,
      age: null,
      error: 'Date of birth is required for vehicle bookings.'
    };
  }

  const age = calculateAge(dob, pickupDate);
  if (age === null) {
    return {
      valid: false,
      age: null,
      error: 'Please enter a valid Date of Birth.'
    };
  }

  if (isSelfDrive) {
    if (age < 18) {
      return {
        valid: false,
        age,
        error: 'Primary driver must be 18 years or older on pickup date for Self Drive rentals.'
      };
    }
    if (!license || !isValidDrivingLicense(license)) {
      return {
        valid: false,
        age,
        error: 'Please enter a valid Driving License number (minimum 8 alphanumeric characters, e.g. DL-1420110012345).'
      };
    }
  }

  return {
    valid: true,
    age,
    error: null
  };
}

