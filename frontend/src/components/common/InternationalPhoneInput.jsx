// frontend/src/components/common/InternationalPhoneInput.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  parsePhoneNumber,
  formatE164,
  formatNationalNumber,
  extractPhoneString
} from '../../utils/countryCurrencyData';
import { useCustomerCurrency } from '../../context/CustomerCurrencyContext';

export function CountryFlag({ country, size = 15, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const code = String(country?.code || country || 'IN').toLowerCase();

  if (!hasError && code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={Math.round(size * 1.35)}
        height={size}
        alt={country?.name || code.toUpperCase()}
        onError={() => setHasError(true)}
        className={`flex-shrink-0 ${className}`}
        style={{
          objectFit: 'cover',
          border: '1px solid rgba(0,0,0,0.15)',
          display: 'inline-block',
          verticalAlign: 'middle',
          borderRadius: '2px'
        }}
      />
    );
  }

  return (
    <span 
      className="badge bg-light text-dark border font-monospace px-1 py-0 flex-shrink-0"
      style={{ fontSize: '10px', lineHeight: '14px', borderRadius: '3px' }}
    >
      {String(country?.code || country || 'IN').toUpperCase()}
    </span>
  );
}

export default function InternationalPhoneInput({
  value = '',
  onChange,
  onCountryChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  id,
  name = 'phone',
  autoFocus = false,
  showCurrencyBadge = true,
  defaultCountryCode = 'IN'
}) {
  const { selectedCountry: globalCountry, setCountry: setGlobalCountry } = useCustomerCurrency();

  // Internal state for selected country — defaults to globalCountry or defaultCountryCode
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const rawStr = extractPhoneString(value);
    if (rawStr) {
      const parsed = parsePhoneNumber(rawStr, defaultCountryCode);
      return parsed.country || getCountryByCode(defaultCountryCode);
    }
    return globalCountry || getCountryByCode(defaultCountryCode);
  });

  // Internal state for clean unformatted national digits
  const [nationalDigits, setNationalDigits] = useState(() => {
    const rawStr = extractPhoneString(value);
    if (rawStr) {
      const parsed = parsePhoneNumber(rawStr, defaultCountryCode);
      return parsed.nationalNumber || '';
    }
    return '';
  });

  // Formatted display value shown inside the text input
  const [displayValue, setDisplayValue] = useState(() => {
    const rawStr = extractPhoneString(value);
    if (rawStr) {
      const parsed = parsePhoneNumber(rawStr, defaultCountryCode);
      return formatNationalNumber(parsed.nationalNumber, parsed.country?.code || defaultCountryCode);
    }
    return '';
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const inputRef = useRef(null);

  // Sync global country immediately on mount if phone is empty and default is India
  useEffect(() => {
    const rawStr = extractPhoneString(value);
    if (!rawStr) {
      const defC = getCountryByCode(defaultCountryCode);
      if (selectedCountry.code !== defC.code) {
        setSelectedCountry(defC);
      }
      if (setGlobalCountry && globalCountry?.code !== defC.code) {
        setGlobalCountry(defC);
      }
    }
  }, []);

  // Sync if globalCountry changes externally (e.g. from resetCountry or Navbar)
  useEffect(() => {
    if (globalCountry && globalCountry.code && globalCountry.code !== selectedCountry.code) {
      if (!nationalDigits) {
        setSelectedCountry(globalCountry);
        const formatted = formatNationalNumber('', globalCountry.code);
        setDisplayValue(formatted);
      }
    }
  }, [globalCountry]);

  // Tracks the last normalized E.164 string emitted so we never enter an echo feedback loop
  const lastSentE164Ref = useRef(() => {
    const rawStr = extractPhoneString(value);
    if (rawStr) {
      const parsed = parsePhoneNumber(rawStr, defaultCountryCode);
      return parsed.e164;
    }
    return '';
  });

  // Helper to emit normalized E.164 string & metadata to consumer
  const notifyChange = (cleanDigits, country) => {
    const fullE164 = cleanDigits ? formatE164(country.dialCode, cleanDigits) : '';
    lastSentE164Ref.current = fullE164;

    if (onCountryChange) {
      onCountryChange(country);
    }

    if (onChange) {
      const hybridVal = new String(fullE164);
      hybridVal.target = {
        name,
        value: fullE164,
        rawNumber: cleanDigits,
        dialCode: country.dialCode,
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency
      };
      hybridVal.country = country;
      hybridVal.countryCode = country.code;
      hybridVal.dialCode = country.dialCode;
      hybridVal.phoneNumber = cleanDigits;
      hybridVal.fullPhoneNumber = fullE164;
      hybridVal.currency = country.currency;

      onChange(hybridVal, country, cleanDigits);
    }
  };

  // Sync if external value changes (e.g. form reset, repeat customer profile load)
  useEffect(() => {
    const strVal = extractPhoneString(value);

    // If external value is identical to our own last broadcast, ignore the echo
    if (strVal === lastSentE164Ref.current) {
      return;
    }

    // External reset to empty -> cleanly reset to default country
    if (!strVal) {
      if (nationalDigits || displayValue) {
        setNationalDigits('');
        setDisplayValue('');
        lastSentE164Ref.current = '';
      }
      const defaultC = getCountryByCode(defaultCountryCode);
      setSelectedCountry(defaultC);
      if (setGlobalCountry) setGlobalCountry(defaultC);
      return;
    }

    // External prefill / new value
    const parsed = parsePhoneNumber(strVal, selectedCountry.code);
    const formatted = formatNationalNumber(parsed.nationalNumber, parsed.country?.code || selectedCountry.code);

    setNationalDigits(parsed.nationalNumber);
    setDisplayValue(formatted);
    lastSentE164Ref.current = parsed.e164;

    if (parsed.country && parsed.country.code !== selectedCountry.code) {
      setSelectedCountry(parsed.country);
      if (setGlobalCountry) setGlobalCountry(parsed.country);
    }
  }, [value]);

  // Click outside listener for country dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Filter countries for dropdown search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Switching country via selector
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearchQuery('');

    // Immediately update global customer currency
    setGlobalCountry(country);

    // Re-format existing national digits for the new country
    const formatted = formatNationalNumber(nationalDigits, country.code);
    setDisplayValue(formatted);

    // Emit updated E.164 with the new dial code
    notifyChange(nationalDigits, country);

    // Focus phone input for seamless typing experience
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Normal user typing, deleting, pasting
  const handleNumberChange = (e) => {
    const rawInput = e.target.value;

    // 1. Detect if the user pasted an international phone number with a leading '+'
    if (rawInput.startsWith('+')) {
      const parsed = parsePhoneNumber(rawInput, selectedCountry.code);
      if (parsed.country && parsed.country.code !== selectedCountry.code) {
        setSelectedCountry(parsed.country);
        setGlobalCountry(parsed.country);
      }
      const digits = parsed.nationalNumber.slice(0, 14);
      const formatted = formatNationalNumber(digits, parsed.country?.code || selectedCountry.code);
      setNationalDigits(digits);
      setDisplayValue(formatted);
      notifyChange(digits, parsed.country || selectedCountry);
      return;
    }

    // 2. Extract numeric digits
    let digits = rawInput.replace(/\D/g, '');

    // 3. Handle backspace on formatting punctuation (e.g. user deletes ')' or '-' or space)
    if (rawInput.length < displayValue.length && digits.length === nationalDigits.length && digits.length > 0) {
      digits = digits.slice(0, -1);
    }

    // 4. Limit to standard maximum national digits (12)
    digits = digits.slice(0, 12);

    // 5. Format display according to country conventions
    const formatted = formatNationalNumber(digits, selectedCountry.code);
    setNationalDigits(digits);
    setDisplayValue(formatted);
    // 6. Update parent state & ensure global context is in sync
    if (setGlobalCountry) setGlobalCountry(selectedCountry);
    notifyChange(digits, selectedCountry);
  };

  return (
    <div className="position-relative w-100" ref={dropdownRef}>
      <div 
        className={`d-flex align-items-center w-100 bg-white border ${className}`}
        style={{ 
          borderRadius: '8px',
          borderColor: isFocused ? '#2563eb' : '#cbd5e1',
          boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          background: disabled ? '#f8fafc' : '#ffffff'
        }}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          className="btn btn-light border-0 d-flex align-items-center flex-shrink-0 px-2.5 py-2 text-start"
          style={{
            background: '#f8fafc',
            fontSize: '0.875rem',
            color: '#1e293b',
            gap: '6px',
            borderTopLeftRadius: '7px',
            borderBottomLeftRadius: '7px',
            borderTopRightRadius: '0px',
            borderBottomRightRadius: '0px',
            zIndex: 2
          }}
          onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
          disabled={disabled}
          title={`Selected country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <CountryFlag country={selectedCountry} size={15} />
          <span className="fw-bold font-monospace text-xs" style={{ color: '#0f172a' }}>
            {selectedCountry.dialCode}
          </span>
          <ChevronDown size={13} className="text-muted ms-0.5 opacity-75" />
        </button>

        {/* Subtle Vertical Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        {/* National Mobile Number Input */}
        <input
          ref={inputRef}
          type="tel"
          id={id}
          name={name}
          className="form-control border-0 shadow-none text-sm py-2 px-3 fw-medium flex-grow-1"
          style={{
            fontSize: '0.9rem',
            color: '#0f172a',
            background: 'transparent'
          }}
          placeholder={placeholder || (selectedCountry.code === 'IN' ? 'Enter 10-digit mobile number' : selectedCountry.placeholder || 'Mobile number')}
          value={displayValue}
          onChange={handleNumberChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="tel-national"
          inputMode="tel"
        />
      </div>

      {/* Floating Searchable Country Dropdown */}
      {dropdownOpen && (
        <div
          className="position-absolute shadow-lg border rounded-3 bg-white animate-fade-in"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            width: '320px',
            maxWidth: '92vw',
            maxHeight: '340px',
            zIndex: 1050,
            borderColor: '#e2e8f0',
            overflow: 'hidden'
          }}
        >
          {/* Search Bar */}
          <div className="p-2 border-bottom bg-light">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control border-start-0 text-xs"
                placeholder="Search country or code (e.g. India, +91, US)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Countries List */}
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {filteredCountries.map((c) => {
              const isSelected = c.code === selectedCountry.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  className={`w-100 btn text-start d-flex align-items-center justify-content-between px-3 py-2 border-0 rounded-0 ${
                    isSelected ? 'bg-primary bg-opacity-10 fw-bold' : ''
                  }`}
                  style={{
                    fontSize: '0.82rem',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  onClick={() => handleSelectCountry(c)}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <CountryFlag country={c} size={15} />
                    <span className="text-dark text-truncate">{c.name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                    <span className="badge bg-light text-muted border font-monospace text-xxs px-1.5 py-0.5">
                      {c.currency}
                    </span>
                    <span className="font-monospace fw-bold text-xs" style={{ color: '#2563eb' }}>
                      {c.dialCode}
                    </span>
                    {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
            {filteredCountries.length === 0 && (
              <div className="p-3 text-center text-muted small">
                No matching countries found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-detected Currency Notification Badge */}
      {showCurrencyBadge && selectedCountry && (
        <div className="d-flex align-items-center flex-wrap gap-2 mt-1.5 px-0.5" style={{ fontSize: '11.5px' }}>
          <span className="d-inline-flex align-items-center gap-1 text-muted">
            <Globe size={12} className="text-primary opacity-80" />
            <span style={{ color: '#475569' }}>Country:</span>
            <strong className="text-dark fw-semibold">{selectedCountry.name}</strong>
          </span>
          <span className="text-muted opacity-40">•</span>
          <span className="d-inline-flex align-items-center gap-1 text-muted">
            <span style={{ color: '#475569' }}>Currency:</span>
            <span 
              className="badge rounded-pill fw-semibold font-monospace"
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '10.5px',
                padding: '2px 8px'
              }}
            >
              {selectedCountry.currency} ({selectedCountry.symbol})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
