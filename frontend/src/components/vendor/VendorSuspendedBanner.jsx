import React, { useState, useEffect } from 'react';
import { AlertOctagon, Wallet, RefreshCw, AlertTriangle, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';
import ReactivationRequestModal from './ReactivationRequestModal';

export default function VendorSuspendedBanner({ 
  wallet: initialWallet, 
  vendorId, 
  onRechargeClick,
  onRefresh
}) {
  const [wallet, setWallet] = useState(initialWallet || null);
  const [showModal, setShowModal] = useState(false);

  // Sync with prop if provided
  useEffect(() => {
    if (initialWallet) {
      setWallet(initialWallet);
    }
  }, [initialWallet]);

  // If no wallet prop or when refresh is triggered, fetch vendor wallet info
  const loadWallet = async () => {
    if (!vendorId) return;
    try {
      const res = await apiFetch(`${API_BASE}?resource=vendor_wallet_info&vendor_id=${vendorId}`);
      const data = await res.json();
      if (data && !data.error) {
        setWallet(data);
      }
    } catch (e) {
      console.error('Error fetching wallet in VendorSuspendedBanner:', e);
    }
  };

  useEffect(() => {
    if (!wallet && vendorId) {
      loadWallet();
    }
  }, [vendorId]);

  if (!wallet || Number(wallet.services_suspended) !== 1) {
    return null;
  }

  const balance = Number(wallet.balance || 0);
  const isPending = wallet.reactivation_status === 'PENDING_REACTIVATION';
  const isRejected = wallet.reactivation_status === 'REJECTED';
  const suspensionReason = wallet.suspension_reason || 'Negative wallet balance confirmation limit reached';

  const handleModalSuccess = () => {
    loadWallet();
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div 
        className="w-100 p-3 shadow-md"
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
          color: '#ffffff',
          borderBottom: '3px solid #f87171'
        }}
      >
        <div className="container-fluid px-3 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div className="d-flex align-items-start gap-3">
            <div className="p-2.5 rounded-3 bg-white bg-opacity-20 text-white flex-shrink-0 mt-1">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-black text-uppercase tracking-wider" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>
                  YOUR SERVICES ARE CURRENTLY HIDDEN
                </span>
                <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 text-uppercase" style={{ fontSize: '0.68rem' }}>
                  HIDDEN — ADMIN REACTIVATION REQUIRED
                </span>
              </div>
              <div className="mt-1 d-flex flex-wrap align-items-center gap-x-4 gap-y-1 opacity-90" style={{ fontSize: '0.8rem' }}>
                <div>
                  <span className="text-light opacity-75">Reason: </span>
                  <span className="fw-semibold text-white">{suspensionReason}</span>
                </div>
                <div>
                  <span className="text-light opacity-75">Wallet Balance: </span>
                  <span className="fw-bold font-monospace text-warning">
                    {balance < 0 ? `-₹${Math.abs(balance).toLocaleString()}` : `₹${balance.toLocaleString()}`}
                  </span>
                </div>
                {wallet.suspended_at && (
                  <div>
                    <span className="text-light opacity-75">Suspended On: </span>
                    <span>{new Date(wallet.suspended_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {isPending && (
                <div className="mt-2 d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-warning text-dark fw-bold" style={{ fontSize: '0.72rem' }}>
                  <Clock size={12} />
                  Reactivation Request Pending Admin Review ({wallet.reactivation_requested_at ? new Date(wallet.reactivation_requested_at).toLocaleDateString() : 'Under Review'})
                </div>
              )}
              {isRejected && (
                <div className="mt-2 d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-danger-subtle text-danger fw-bold border border-danger" style={{ fontSize: '0.72rem' }}>
                  <XCircle size={12} />
                  Reactivation Rejected: {wallet.reactivation_rejection_reason || 'Please contact Admin'}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-warning text-dark fw-bold px-3 py-2 d-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.82rem', borderRadius: '8px' }}
              onClick={onRechargeClick}
            >
              <Wallet size={15} />
              Recharge Wallet
            </button>
            <button
              type="button"
              className="btn btn-outline-light fw-bold px-3 py-2 d-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.82rem', borderRadius: '8px', background: 'rgba(255,255,255,0.12)' }}
              onClick={() => setShowModal(true)}
            >
              <RefreshCw size={15} />
              {isPending ? 'View Reactivation Status' : 'Request Service Reactivation'}
            </button>
          </div>
        </div>
      </div>

      <ReactivationRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        wallet={wallet}
        vendorId={vendorId}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
