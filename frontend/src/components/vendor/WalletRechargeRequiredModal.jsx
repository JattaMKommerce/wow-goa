import React from 'react';
import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';

export default function WalletRechargeRequiredModal({
  isOpen,
  show,
  onClose,
  balance = 0,
  negativeBookingCount = 0,
  maxNegativeBookings = 2,
  onAddMoney
}) {
  const isVisible = Boolean(isOpen ?? show);
  if (!isVisible) return null;

  const formattedBalance = Number(balance || 0);
  const displayBalance = formattedBalance < 0 
    ? `-₹${Math.abs(formattedBalance).toLocaleString('en-IN')}` 
    : `₹${formattedBalance.toLocaleString('en-IN')}`;

  const negCount = Number(negativeBookingCount ?? 0);
  const maxNeg = Number(maxNegativeBookings ?? 2);

  const handleAddMoneyClick = () => {
    if (onAddMoney) {
      try { onAddMoney(); } catch (e) {}
    }
    try {
      window.dispatchEvent(new CustomEvent('navigate-vendor-tab', { detail: 'wallet' }));
      window.dispatchEvent(new CustomEvent('tripgalileo-navigate', { detail: { tab: 'wallet' } }));
      if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('vendor')) {
        window.location.hash = '#/wallet';
      }
    } catch (e) {}
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(13, 27, 46, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="rounded-4 overflow-hidden shadow-2xl bg-white animate__animated animate__zoomIn"
        style={{
          width: '100%',
          maxWidth: '460px',
          border: '1.5px solid #fee2e2',
          boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.28)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 text-center position-relative"
          style={{ background: 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)', borderBottom: '1px solid #fee2e2' }}
        >
          <button 
            type="button" 
            className="btn btn-sm btn-light position-absolute top-0 end-0 m-3 rounded-circle border-0 text-muted"
            onClick={onClose}
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
          
          <div 
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
            style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#dc2626' }}
          >
            <AlertTriangle size={30} />
          </div>

          <h5 className="fw-black text-danger mb-1 font-heading" style={{ letterSpacing: '0.3px', fontSize: '1.15rem' }}>
            ⚠ WALLET RECHARGE REQUIRED
          </h5>
          <p className="text-secondary small mb-0 px-2" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
            Your vendor wallet has reached the maximum allowed negative booking limit.
          </p>
        </div>

        {/* Body */}
        <div className="p-4">
          <div 
            className="p-3.5 rounded-3 mb-3"
            style={{ background: '#fef2f2', border: '1.5px dashed #fca5a5' }}
          >
            <div className="d-flex justify-content-between align-items-center py-1.5 border-bottom border-danger-subtle">
              <span className="text-muted small fw-semibold" style={{ fontSize: '0.85rem' }}>
                Current Wallet Balance:
              </span>
              <span className="fw-black text-danger font-monospace" style={{ fontSize: '1.05rem' }}>
                {displayBalance}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1.5 mt-1">
              <span className="text-muted small fw-semibold" style={{ fontSize: '0.85rem' }}>
                Negative Bookings:
              </span>
              <span className="badge rounded-pill bg-danger text-white fw-bold px-2.5 py-1" style={{ fontSize: '0.8rem' }}>
                {negCount} / {maxNeg}
              </span>
            </div>
          </div>

          <p className="text-center text-dark fw-medium small mb-0 px-2" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
            Please recharge your wallet before confirming this booking.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary flex-grow-1 py-2.5 fw-bold rounded-3"
            style={{ fontSize: '0.88rem' }}
            onClick={onClose}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="btn flex-grow-1 py-2.5 fw-black text-white rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1.5"
            style={{
              background: 'linear-gradient(90deg, #FF6333 0%, #FF8A00 100%)',
              fontSize: '0.88rem'
            }}
            onClick={handleAddMoneyClick}
          >
            <ArrowUpRight size={16} /> ADD MONEY
          </button>
        </div>
      </div>
    </div>
  );
}
