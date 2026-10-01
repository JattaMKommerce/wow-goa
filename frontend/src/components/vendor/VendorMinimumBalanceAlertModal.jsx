import React from 'react';
import { AlertCircle, ArrowUpRight, X, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../../services/api';

/**
 * WOW GOA - Vendor Minimum Wallet Balance Alert Modal
 * 
 * Informational popup shown when vendor's authoritative wallet balance is at or below ₹1,000.
 * Does NOT block bookings (existing negative wallet rules continue).
 * Provides one-click access to the authoritative recharge flow.
 */
export default function VendorMinimumBalanceAlertModal({
  isOpen,
  show,
  onClose,
  balance = 0,
  threshold = 1000,
  alertId = null,
  vendorId = null,
  onRecharge
}) {
  const isVisible = Boolean(isOpen ?? show);
  if (!isVisible) return null;

  const formattedBal = Number(balance || 0);
  const minThreshold = Number(threshold || 1000);

  const displayBalance = formattedBal < 0
    ? `-₹${Math.abs(formattedBal).toLocaleString('en-IN')}`
    : `₹${formattedBal.toLocaleString('en-IN')}`;

  const displayThreshold = `₹${minThreshold.toLocaleString('en-IN')}`;

  // Handle Dismiss action & notify backend
  const handleDismiss = () => {
    if (vendorId && alertId) {
      fetch(`${API_BASE}?action=dismiss_wallet_alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId, alert_id: alertId })
      }).catch(() => {});
    }
    if (onClose) onClose();
  };

  // Handle Recharge Wallet action
  const handleRechargeClick = () => {
    handleDismiss();
    if (onRecharge) {
      try { onRecharge(); } catch (e) {}
    }
    try {
      window.dispatchEvent(new CustomEvent('navigate-vendor-tab', { detail: 'wallet' }));
      window.dispatchEvent(new CustomEvent('tripgalileo-navigate', { detail: { tab: 'wallet' } }));
      if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('vendor')) {
        window.location.hash = '#/wallet';
      }
    } catch (e) {}
  };

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99998,
        padding: '16px'
      }}
      onClick={handleDismiss}
    >
      <div
        className="rounded-4 overflow-hidden shadow-2xl bg-white animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '470px',
          border: '1.5px solid #fed7aa',
          boxShadow: '0 20px 45px -10px rgba(234, 88, 12, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-4 text-center position-relative"
          style={{
            background: 'linear-gradient(180deg, #fffaf5 0%, #ffffff 100%)',
            borderBottom: '1px solid #ffedd5'
          }}
        >
          <button
            type="button"
            className="btn btn-sm btn-light position-absolute top-0 end-0 m-3 rounded-circle border-0 text-muted"
            onClick={handleDismiss}
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Dismiss Alert"
          >
            <X size={16} />
          </button>

          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
            style={{ width: '56px', height: '56px', background: '#ffedd5', color: '#ea580c' }}
          >
            <ShieldAlert size={28} />
          </div>

          <h5 className="fw-black mb-1 font-heading" style={{ color: '#c2410c', letterSpacing: '0.3px', fontSize: '1.15rem' }}>
            ⚠ MINIMUM WALLET BALANCE ALERT
          </h5>
          <p className="text-secondary small mb-0 px-2" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            WOW GOA Vendor Account Advisory
          </p>
        </div>

        {/* Dynamic Balance Card */}
        <div className="p-4">
          <div
            className="p-3.5 rounded-3 mb-3"
            style={{ background: '#fff7ed', border: '1.5px dashed #fdba74' }}
          >
            <div className="d-flex justify-content-between align-items-center py-1.5 border-bottom border-warning-subtle">
              <span className="text-muted small fw-semibold" style={{ fontSize: '0.85rem' }}>
                Current Wallet Balance:
              </span>
              <span className={`fw-black font-monospace ${formattedBal < 0 ? 'text-danger' : 'text-dark'}`} style={{ fontSize: '1.1rem' }}>
                {displayBalance}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1.5 mt-1">
              <span className="text-muted small fw-semibold" style={{ fontSize: '0.85rem' }}>
                Required Minimum Balance:
              </span>
              <span className="badge rounded-pill bg-warning text-dark fw-bold px-2.5 py-1" style={{ fontSize: '0.82rem' }}>
                {displayThreshold}
              </span>
            </div>
          </div>

          <p className="text-dark small mb-0 text-center px-1" style={{ lineHeight: '1.5', fontSize: '0.88rem' }}>
            {formattedBal <= 0 ? (
              <>
                Your vendor wallet balance is <strong>{displayBalance}</strong>. Please recharge your vendor wallet to restore the required minimum balance of <strong>{displayThreshold}</strong> to avoid booking restrictions.
              </>
            ) : (
              <>
                Your vendor wallet balance is <strong>{displayBalance}</strong>. Please maintain the required minimum wallet balance of <strong>{displayThreshold}</strong> to avoid booking restrictions.
              </>
            )}
          </p>
          <small className="text-muted d-block text-center mt-2" style={{ fontSize: '0.74rem' }}>
            * This alert is informational. Your existing booking confirmation rules remain active.
          </small>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary flex-grow-1 py-2.5 fw-bold rounded-3"
            style={{ fontSize: '0.88rem' }}
            onClick={handleDismiss}
          >
            CLOSE
          </button>
          <button
            type="button"
            className="btn flex-grow-1 py-2.5 fw-black text-white rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1.5"
            style={{
              background: 'linear-gradient(90deg, #FF6333 0%, #FF8A00 100%)',
              fontSize: '0.88rem'
            }}
            onClick={handleRechargeClick}
          >
            <ArrowUpRight size={16} /> RECHARGE WALLET
          </button>
        </div>
      </div>
    </div>
  );
}
