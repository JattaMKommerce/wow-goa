import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Search, AlertCircle, Eye } from 'lucide-react';
import * as api from '../../../services/api';
import WalletRechargeRequiredModal from '../../../components/vendor/WalletRechargeRequiredModal';

export default function PMSPaymentVerification({ currentUser, vendorHotels, onNavigate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationType, setVerificationType] = useState(null);
  const [blockedModal, setBlockedModal] = useState({ open: false, balance: 0 });
  
  // Wallet info for displaying commission before confirmation
  const [wallet, setWallet] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await api.makeApiCall('/api.php?resource=bookings');
      // Filter bookings that belong to this vendor and need payment verification
      const pendingBookings = bRes.filter(b => 
        (b.vendor_id === currentUser.id || vendorHotels.some(h => h.id === b.item_id)) &&
        b.payment_verification_status === 'Pending' && 
        b.status === 'Payment Verification Pending'
      );
      setBookings(pendingBookings);
      
      const wRes = await api.makeApiCall(`/api.php?resource=vendor_wallet_info&vendor_id=${currentUser.id}`);
      setWallet(wRes || { balance: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id, vendorHotels]);

  const handleVerifyAction = async () => {
    if (!selectedBooking || !verificationType) return;
    
    try {
      const action = verificationType === 'approve' ? 'verify_booking_payment' : 'reject_booking_payment';
      const res = await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({
          action: action,
          booking_id: selectedBooking.id,
          vendor_id: currentUser.id
        })
      });
      if (res && res.success === false) {
        if (res.code === 'WALLET_BLOCKED') {
          setShowModal(false);
          setBlockedModal({ open: true, balance: res.balance ?? wallet?.balance ?? 0 });
          return;
        }
        alert('Error: ' + (res.error || 'Failed to process payment'));
        return;
      }
      alert(`Payment ${verificationType === 'approve' ? 'Verified' : 'Rejected'} successfully.`);
      setShowModal(false);
      setSelectedBooking(null);
      fetchData();
    } catch (e) {
      if (e.code === 'WALLET_BLOCKED' || e.data?.code === 'WALLET_BLOCKED') {
        setShowModal(false);
        setBlockedModal({ open: true, balance: e.balance ?? e.data?.balance ?? wallet?.balance ?? 0 });
        return;
      }
      alert('Error: ' + e.message);
    }
  };

  const calculateCommission = (amount) => {
    // Basic 10% commission rule for demo
    return Math.round((parseInt(amount) || 0) * 0.10);
  };

  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Payment Verification</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Verify customer payments before confirming bookings</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <CreditCard size={48} className="mb-3 opacity-50" />
              <h5>No pending payments to verify</h5>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th className="px-4 py-3">Booking ID</th>
                    <th>Customer</th>
                    <th>Hotel</th>
                    <th>Amount Claimed</th>
                    <th>Method</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 fw-bold">{b.id}</td>
                      <td>
                        <div className="fw-bold">{b.name}</div>
                        <div className="text-muted small">{b.phone}</div>
                      </td>
                      <td>{b.item_name}</td>
                      <td className="fw-bold text-success">₹{b.amount_paid?.toLocaleString() || b.total_amount?.toLocaleString()}</td>
                      <td>
                        <span className="badge bg-info-subtle text-info rounded-pill">{b.payment_method || 'Unknown'}</span>
                      </td>
                      <td className="text-end px-4">
                        <button 
                          onClick={() => { setSelectedBooking(b); setVerificationType('approve'); setShowModal(true); }}
                          className="btn btn-sm btn-success rounded-pill fw-bold px-3 me-2"
                        >
                          Verify
                        </button>
                        <button 
                          onClick={() => { setSelectedBooking(b); setVerificationType('reject'); setShowModal(true); }}
                          className="btn btn-sm btn-outline-danger rounded-pill fw-bold px-3"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedBooking && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {verificationType === 'approve' ? 'Confirm Payment Received' : 'Reject Payment'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                {verificationType === 'approve' ? (
                  <div>
                    <div className="alert border-0 rounded-3 d-flex align-items-center gap-3" style={{ background: 'rgba(0,184,217,0.1)' }}>
                      <AlertCircle size={24} className="text-info flex-shrink-0" />
                      <div className="small text-info-emphasis">
                        By confirming, you acknowledge that <strong>₹{selectedBooking.total_amount?.toLocaleString()}</strong> has been successfully credited to your {selectedBooking.payment_method} account.
                      </div>
                    </div>
                    
                    <div className="card bg-light border-0 rounded-3 mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2 small">
                          <span className="text-muted">Booking Amount</span>
                          <span className="fw-bold">₹{selectedBooking.total_amount?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 small">
                          <span className="text-muted">Platform Commission (10%)</span>
                          <span className="fw-bold text-danger">- ₹{calculateCommission(selectedBooking.total_amount).toLocaleString()}</span>
                        </div>
                        <hr className="my-2 border-secondary border-opacity-25" />
                        <div className="d-flex justify-content-between mb-1 small">
                          <span className="text-muted">Your Current Wallet Balance</span>
                          <span className={`fw-bold ${Number(wallet?.balance || 0) < 0 ? 'text-danger' : ''}`}>
                            {Number(wallet?.balance || 0) < 0 ? `-₹${Math.abs(Number(wallet?.balance)).toLocaleString()}` : `₹${Number(wallet?.balance || 0).toLocaleString()}`}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-0 small">
                          <span className="text-muted">Estimated Balance After Platform Fee</span>
                          <span className="fw-bold">
                            {(() => {
                              const after = Number(wallet?.balance || 0) - calculateCommission(selectedBooking.total_amount);
                              return after < 0 ? `-₹${Math.abs(after).toLocaleString()}` : `₹${after.toLocaleString()}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-check mt-3">
                      <input className="form-check-input" type="checkbox" id="confirmCheck" required />
                      <label className="form-check-label small fw-bold" htmlFor="confirmCheck">
                        I have checked the payment account and the amount is correct.
                      </label>
                    </div>

                    {wallet?.is_blocked && (
                      <div className="alert alert-danger mt-3 mb-0 small py-2 fw-bold text-center">
                        <AlertCircle size={16} className="me-1 mb-1"/> 
                        Wallet recharge required. You have reached the negative booking limit.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted small mb-3">
                      If you have not received the payment, or the details are incorrect, you can reject this payment verification request. The room hold will be released.
                    </p>
                    <textarea className="form-control" placeholder="Reason for rejection (e.g., Payment not received)" rows="3"></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light rounded-pill fw-bold px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className={`btn rounded-pill fw-bold px-4 text-white btn-${verificationType === 'approve' ? 'success' : 'danger'}`}
                  onClick={handleVerifyAction}
                  disabled={verificationType === 'approve' && wallet?.is_blocked}
                >
                  {verificationType === 'approve' ? 'Verify & Confirm Booking' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Recharge Required Modal when negative booking limit is reached */}
      <WalletRechargeRequiredModal
        isOpen={blockedModal.open}
        onClose={() => setBlockedModal({ open: false, balance: 0 })}
        balance={blockedModal.balance}
        onAddMoney={() => {
          if (onNavigate) {
            onNavigate('wallet');
          } else {
            window.location.hash = '#/wallet';
          }
        }}
      />
    </div>
  );
}
