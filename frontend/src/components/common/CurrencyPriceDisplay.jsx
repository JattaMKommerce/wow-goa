// frontend/src/components/common/CurrencyPriceDisplay.jsx
import React from 'react';
import { useCustomerCurrency } from '../../context/CustomerCurrencyContext';
import { convertFromINR } from '../../services/currencyService';

/**
 * Reusable Customer-Facing Currency Price Display component.
 * - For Indian customers (INR): Displays strictly in INR (e.g. ₹1,700).
 * - For Foreign customers: Displays strictly in their selected foreign currency (e.g. $20.48 USD, £15.80 GBP, AED 75.20).
 * - Foreign customers do NOT see the internal INR base amount on customer-facing screens.
 */
export default function CurrencyPriceDisplay({
  amountInr = 0,
  targetCurrency = null,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '',
  showDual = false, // Foreign customers see only their currency by default
  inline = false,
  highlight = false,
  color = null,
  appendCode = false
}) {
  const { currency: contextCurrency } = useCustomerCurrency();
  const effectiveCurrency = targetCurrency || contextCurrency || 'INR';

  const conv = convertFromINR(amountInr, effectiveCurrency);
  const inrFormatted = '₹' + Math.round(conv.baseInr).toLocaleString('en-IN');

  const sizeStyles = {
    sm: { primary: '0.85rem', secondary: '0.68rem' },
    md: { primary: '1.05rem', secondary: '0.72rem' },
    lg: { primary: '1.35rem', secondary: '0.75rem' },
    xl: { primary: '1.75rem', secondary: '0.8rem' }
  };

  const selectedSize = sizeStyles[size] || sizeStyles.md;
  const primaryColor = color || (highlight ? '#FF6333' : '#0D1B2E');

  const foreignDisplay = appendCode 
    ? `${conv.formattedConverted} ${conv.currency}` 
    : conv.formattedConverted;

  const displayString = conv.isNonInr ? foreignDisplay : inrFormatted;

  // Single-currency customer-facing display (default)
  if (!conv.isNonInr || !showDual) {
    return (
      <span className={`fw-bold ${className}`} style={{ fontSize: selectedSize.primary, color: primaryColor }}>
        {displayString}
      </span>
    );
  }

  // Dual display used only when showDual is explicitly enabled (e.g. internal auditing)
  if (inline) {
    return (
      <span className={`d-inline-flex align-items-baseline gap-1.5 flex-wrap ${className}`}>
        <span className="fw-bold" style={{ fontSize: selectedSize.primary, color: primaryColor }}>
          {foreignDisplay}
        </span>
        <span className="text-muted fw-normal" style={{ fontSize: selectedSize.secondary }}>
          ({inrFormatted})
        </span>
      </span>
    );
  }

  return (
    <div className={`d-flex flex-column ${className}`}>
      <span className="fw-bold" style={{ fontSize: selectedSize.primary, color: primaryColor, lineHeight: 1.2 }}>
        {foreignDisplay}
      </span>
      <span className="text-muted fw-normal mt-0.5" style={{ fontSize: selectedSize.secondary }}>
        Internal: {inrFormatted}
      </span>
    </div>
  );
}
