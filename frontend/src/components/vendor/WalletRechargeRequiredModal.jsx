import React from 'react';
import { AlertOctagon, ArrowUpRight, X } from 'lucide-react';

export default function WalletRechargeRequiredModal({ isOpen, onClose, balance, onAddMoney }) {
  if (!isOpen) return null;

  const formattedBalance = Number(balance || 0);
  const displayBalance = formattedBalance < 0 
    ? `-₹${Math.abs(formattedBalance).toLocaleString('en-IN')}` 
    : `₹${formattedBalance.toLocaleString('en-IN')}`;

  const handleAddMoneyClick = () => {
    if (onAddMoney) {
      onAddMoney();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(13, 27, 46, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="rounded-4 overflow-hidden shadow-2xl bg-white animate__animated animate__zoomIn"
        style={{
          width: '100%',
          maxWidth: '480px',
          border: '1.5px solid #fee2e2',
          boxShadow: '0 20px 40px -15px rgba(220, 38, 38, 0.25)'
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
            style={{ width: '64px', height: '64px', background: '#fee2e2', color: '#dc2626' }}
          >
            <AlertOctagon size={32} />
          </div>

          <h5 className="fw-black text-danger mb-1" style={{ letterSpacing: '0.5px' }}>
            WALLET RECHARGE REQUIRED
          </h5>
          <span className="badge rounded-pill bg-danger-subtle text-danger px-3 py-1 fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>
            Negative Booking Limit Reached
          </span>
        </div>

        {/* Body */}
        <div className="p-4 text-center">
          <p className="text-secondary mb-3" style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
            Your wallet balance is insufficient and you have reached the maximum number of bookings allowed with a negative wallet balance.
          </p>

          <div 
            className="p-3 rounded-3 mb-3 d-flex flex-column align-items-center justify-content-center"
            style={{ background: '#fef2f2', border: '1px dashed #fca5a5' }}
          >
            <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              Current Wallet Balance
            </div>
            <div className="fw-black text-danger my-1" style={{ fontSize: '1.85rem' }}>
              {displayBalance}
            </div>
            <div className="text-danger small" style={{ fontSize: '0.78rem' }}>
              Recharge is required before you can confirm new bookings.
            </div>
          </div>

          <p className="small text-muted mb-0">
            Please recharge your wallet to continue accepting bookings.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 d-flex flex-column gap-2">
          <button
            type="button"
            className="btn py-2.5 fw-black text-white rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'linear-gradient(90deg, #FF6333 0%, #FF8A00 100%)',
              fontSize: '0.95rem'
            }}
            onClick={handleAddMoneyClick}
          >
            <ArrowUpRight size={18} /> ADD MONEY
          </button>
          <button
            type="button"
            className="btn btn-link text-muted fw-bold text-decoration-none small py-1"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
