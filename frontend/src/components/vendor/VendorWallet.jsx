import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw,
  Clock, CheckCircle, XCircle, Upload, X, ChevronRight, TrendingDown,
  Landmark, Smartphone, CreditCard
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';
import ReactivationRequestModal from './ReactivationRequestModal';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E', success: '#16a34a', danger: '#dc2626', warn: '#ca8a04' };

function StatusBadge({ status }) {
  const map = {
    'Pending Verification': { bg: '#fef9c3', color: '#ca8a04' },
    'Completed': { bg: '#dcfce7', color: '#16a34a' },
    'Rejected': { bg: '#fee2e2', color: '#dc2626' },
    'pending': { bg: '#fef9c3', color: '#ca8a04' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: s.bg, color: s.color, fontSize: '0.65rem' }}>{status}</span>;
}

export default function VendorWallet({ currentUser }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [minRecharge, setMinRecharge] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [activeRechargeMethod, setActiveRechargeMethod] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [utrRef, setUtrRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const vendorId = currentUser?.id;

  const load = async () => {
    setLoading(true);
    try {
      const [wRes, tRes, gwRes] = await Promise.all([
        apiFetch(`${API_BASE}?resource=vendor_wallet_info&vendor_id=${vendorId}`),
        apiFetch(`${API_BASE}?resource=wallet_transactions&vendor_id=${vendorId}`),
        apiFetch(`${API_BASE}?resource=payment_gateways`),
      ]);
      const wData = await wRes.json();
      const tData = await tRes.json();
      const gwData = await gwRes.json();
      setWallet(wData);
      setMinRecharge(wData.config_min_recharge || 5000);
      setTransactions(Array.isArray(tData) ? tData : []);
      setGateways(Array.isArray(gwData) ? gwData.filter(g => g.is_active) : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    if (vendorId) load(); 

    const handleSync = () => {
      if (vendorId) load();
    };

    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('vendor-wallet-updated', handleSync);
    const handleStorage = (e) => {
      if (e.key === 'tg_wallet_updated') handleSync();
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => {
      if (vendorId) load();
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('vendor-wallet-updated', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [vendorId]);

  const balance = Number(wallet?.balance || 0);
  const maxNegBookings = Number(wallet?.max_negative_bookings || 2);
  const negBookingCount = Number(wallet?.negative_booking_count || 0);
  const isBlocked = Boolean(wallet?.is_blocked) || (balance < 0 && negBookingCount >= maxNegBookings);
  const isNegative = balance < 0;
  const isSuspended = Number(wallet?.services_suspended) === 1;
  const isRestricted = isNegative || isBlocked || isSuspended;
  const LOW_BALANCE_THRESHOLD = minRecharge;
  const isLow = !isNegative && balance < LOW_BALANCE_THRESHOLD;

  const totalCredits = transactions.filter(t => t.type === 'credit' && t.status === 'Completed').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
  const pendingCredits = transactions.filter(t => t.type === 'credit' && t.status !== 'Completed').reduce((s, t) => s + Number(t.amount), 0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRechargeSubmit = async () => {
    const amt = Number(rechargeAmount);
    if (!amt || amt <= 0) return alert(`Please enter a valid recharge amount.`);
    if (amt < minRecharge) return alert(`Minimum recharge amount is ₹${minRecharge.toLocaleString()}`);
    if (!activeRechargeMethod) return alert('Select a payment method');
    if (!utrRef.trim()) return alert('Please enter the UTR / Transaction Reference Number');
    if (!proofFile) return alert('Please upload the payment screenshot proof');

    setSubmitting(true);
    try {
      let proofUrl = '';
      if (proofFile) {
        const fd = new FormData();
        fd.append('action', 'upload_image');
        fd.append('image', proofFile);
        const upRes = await apiFetch(`${API_BASE}?action=upload_image`, { method: 'POST', body: fd });
        const upData = await upRes.json();
        proofUrl = upData.url || '';
      }

      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recharge_wallet',
          vendor_id: vendorId,
          amount: amt,
          payment_method: activeRechargeMethod.name,
          payment_proof: proofUrl,
          reference_id: utrRef.trim(),
          payment_date: paymentDate,
          notes,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setShowRecharge(false);
        // Reset
        setRechargeAmount(''); setProofFile(null); setProofPreview(null); setUtrRef(''); setPaymentDate(''); setNotes('');
        await load();
      } else {
        alert(data.error || 'Submission failed');
      }
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const getMethodIcon = (type) => {
    if (type === 'bank_transfer') return <Landmark size={14} />;
    if (type === 'upi') return <Smartphone size={14} />;
    return <CreditCard size={14} />;
  };

  if (loading) return <div className="p-4 text-center"><div className="spinner-border" style={{ color: COLORS.primary }} /></div>;

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>My Wallet</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Platform fee wallet — recharge to maintain booking confirmation limits</p>
        </div>
        <button className="btn btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Services Suspended Notice */}
      {Number(wallet?.services_suspended) === 1 && (
        <div className="rounded-3 p-3 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style={{ background: '#fef2f2', border: '1.5px solid #dc2626' }}>
          <div className="d-flex align-items-center gap-3">
            <XCircle size={28} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <div className="fw-bold" style={{ color: '#dc2626' }}>SERVICES CURRENTLY HIDDEN — Admin Reactivation Required</div>
              <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                Reason: {wallet?.suspension_reason || 'Negative wallet balance confirmation limit reached'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '3px' }}>
                Recharging your wallet clears your negative balance, but services remain hidden until Admin / Super Admin explicitly reviews and approves reactivation.
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center flex-shrink-0">
            <button className="btn btn-sm btn-outline-danger fw-bold px-3 py-1.5 rounded-pill" onClick={() => setShowRecharge(true)}>
              Recharge
            </button>
            <button className="btn btn-sm fw-bold text-white px-3 py-1.5 rounded-pill shadow-sm" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', border: 'none' }} onClick={() => setShowReactivationModal(true)}>
              {wallet?.reactivation_status === 'PENDING_REACTIVATION' ? 'View Reactivation Status' : 'Request Reactivation'}
            </button>
          </div>
        </div>
      )}

      {/* Official Administration Reminder Notice */}
      {isRestricted && (wallet?.latest_manual_reminder || (wallet?.active_portal_alert && wallet?.active_portal_alert?.active)) && (
        <div className="rounded-3 p-3 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style={{ background: '#fffbeb', border: '1.5px solid #f59e0b' }}>
          <div className="d-flex align-items-start gap-3">
            <AlertTriangle size={26} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="fw-bold d-flex align-items-center gap-2" style={{ color: '#92400e' }}>
                <span>Official Notice from Administration: Wallet Recharge Required</span>
                <span className="badge bg-warning text-dark" style={{ fontSize: '0.62rem' }}>MANUAL REMINDER</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#78350f', marginTop: '3px' }}>
                {wallet?.latest_manual_reminder?.message || wallet?.active_portal_alert?.message || `Your WOW GOA vendor wallet requires recharge. Please recharge your wallet to continue your services.`}
              </div>
              <div className="d-flex align-items-center gap-2 mt-1 text-muted" style={{ fontSize: '0.7rem' }}>
                <Clock size={11} /> Sent: {new Date(wallet?.latest_manual_reminder?.created_at || wallet?.active_portal_alert?.created_at || Date.now()).toLocaleString()}
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-warning text-dark fw-bold px-3 py-1.5 rounded-pill shadow-sm flex-shrink-0" onClick={() => setShowRecharge(true)}>
            Recharge Now
          </button>
        </div>
      )}

      {/* Blocked Balance Warning */}
      {isBlocked && (
        <div className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3" style={{ background: '#fee2e2', border: '1.5px solid #dc2626' }}>
          <XCircle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <div className="fw-bold" style={{ color: '#dc2626' }}>WALLET RECHARGE REQUIRED — Bookings Suspended</div>
            <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
              Your wallet balance is insufficient (-₹{Math.abs(balance).toLocaleString()}) and you have reached the maximum number of bookings allowed with a negative wallet balance ({negBookingCount}/{maxNegBookings}). Recharge now to resume accepting bookings.
            </div>
          </div>
          <button className="btn ms-auto fw-bold text-white px-3 py-1.5 rounded-pill shadow-sm" style={{ background: '#dc2626', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => setShowRecharge(true)}>
            Recharge Now
          </button>
        </div>
      )}

      {/* Negative but Not Blocked Notice */}
      {isNegative && !isBlocked && (
        <div className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3" style={{ background: '#fffbeb', border: '1.5px solid #f59e0b' }}>
          <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <div className="fw-bold" style={{ color: '#92400e' }}>Negative Wallet Balance (-₹{Math.abs(balance).toLocaleString()})</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
              You have used {negBookingCount} of {maxNegBookings} allowed bookings while your wallet is negative. Recharge soon to avoid automatic booking suspension.
            </div>
          </div>
          <button className="btn ms-auto fw-bold px-3 py-1.5 rounded-pill shadow-sm" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => setShowRecharge(true)}>
            Recharge Wallet
          </button>
        </div>
      )}

      {/* Low Balance Warning */}
      {isLow && (
        <div className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3" style={{ background: '#fef9c3', border: '1.5px solid #ca8a04' }}>
          <AlertTriangle size={20} style={{ color: '#ca8a04', flexShrink: 0 }} />
          <div>
            <div className="fw-bold" style={{ color: '#92400e' }}>Low Wallet Balance</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Balance is below ₹{LOW_BALANCE_THRESHOLD.toLocaleString()}. Recharge to maintain sufficient funds for platform fees.</div>
          </div>
          <button className="btn ms-auto fw-bold px-3 py-1" style={{ background: '#fef9c3', color: '#92400e', border: '1px solid #ca8a04', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => setShowRecharge(true)}>Recharge</button>
        </div>
      )}

      {submitted && (
        <div className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3" style={{ background: '#dcfce7', border: '1.5px solid #16a34a' }}>
          <CheckCircle size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: '#166534' }}>Recharge request submitted! Your balance will be updated after admin approval.</div>
          <button className="btn btn-sm ms-auto" style={{ color: '#166534' }} onClick={() => setSubmitted(false)}><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="rounded-3 p-4 text-center h-100" style={{ background: isNegative ? 'linear-gradient(135deg, #1f1215, #381219)' : `linear-gradient(135deg,${COLORS.dark},#1e3a5f)`, border: isNegative ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            <Wallet size={28} style={{ color: isNegative ? '#ef4444' : COLORS.primary }} className="mb-2" />
            <div className="fw-bold" style={{ fontSize: '2rem', color: isNegative ? '#ef4444' : '#fff' }}>
              {balance < 0 ? `-₹${Math.abs(balance).toLocaleString()}` : `₹${balance.toLocaleString()}`}
            </div>
            <div style={{ color: isNegative ? '#fca5a5' : 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
              {isNegative ? `Negative Balance (${negBookingCount}/${maxNegBookings} used)` : 'Available Balance'}
            </div>
            {pendingCredits > 0 && <div style={{ color: '#FFC107', fontSize: '0.72rem', marginTop: '4px' }}>+₹{pendingCredits.toLocaleString()} pending approval</div>}
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-3 p-4 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <ArrowUpRight size={18} style={{ color: COLORS.success }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Recharged</span>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', color: COLORS.success }}>₹{totalCredits.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>All approved recharges</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-3 p-4 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <TrendingDown size={18} style={{ color: COLORS.danger }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Deducted</span>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', color: COLORS.danger }}>₹{totalDebits.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Booking platform fees</div>
          </div>
        </div>
      </div>

      {/* Recharge Button */}
      {!showRecharge && (
        <button className="btn px-5 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => setShowRecharge(true)}>
          <ArrowUpRight size={16} /> Recharge Wallet
        </button>
      )}

      {/* Recharge Form */}
      {showRecharge && (
        <div className="rounded-3 p-4 mb-4" style={{ background: '#fff', border: `1.5px solid ${COLORS.primary}33`, boxShadow: '0 4px 16px rgba(255,99,51,0.08)' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: COLORS.dark }}>Recharge Wallet</h6>
            <button className="btn btn-sm p-1 border-0" onClick={() => setShowRecharge(false)}><X size={16} /></button>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Amount (₹) — Minimum ₹{minRecharge.toLocaleString()}</label>
            <input type="number" className="form-control" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} min={minRecharge} placeholder={`Min ₹${minRecharge.toLocaleString()}`} style={{ fontSize: '1.1rem', fontWeight: 700 }} />
            {/* Quick amounts */}
            <div className="d-flex gap-2 mt-2">
              {[2000, 5000, 10000, 25000].map(a => (
                <button key={a} type="button" className="btn btn-sm px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem', background: rechargeAmount == a ? COLORS.primary : '#f1f5f9', color: rechargeAmount == a ? '#fff' : '#475569' }} onClick={() => setRechargeAmount(String(a))}>₹{a.toLocaleString()}</button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Method</label>
            <div className="d-flex flex-wrap gap-2">
              {gateways.map(gw => (
                <button key={gw.id} type="button"
                  className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold"
                  style={{ fontSize: '0.8rem', background: activeRechargeMethod?.id === gw.id ? COLORS.primary : '#f8fafc', color: activeRechargeMethod?.id === gw.id ? '#fff' : '#475569', border: `1.5px solid ${activeRechargeMethod?.id === gw.id ? COLORS.primary : '#e2e8f0'}` }}
                  onClick={() => setActiveRechargeMethod(gw)}>
                  {getMethodIcon(gw.type)} {gw.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gateway details and Super Admin QR Display */}
          {activeRechargeMethod && (
            <div className="rounded-2 p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {(() => {
                const cfg = typeof activeRechargeMethod.config_json === 'string' ? JSON.parse(activeRechargeMethod.config_json || '{}') : (activeRechargeMethod.config_json || {});
                const qrUrl = cfg.qr_url || cfg.qr_image || cfg.qrCode || null;
                return (
                  <>
                    {qrUrl && (
                      <div className="text-center my-2 p-3 bg-white rounded-3 border">
                        <div className="fw-bold mb-2 text-dark small">Super Admin Payment QR</div>
                        <img 
                          src={qrUrl} 
                          alt="Super Admin Recharge QR" 
                          style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'contain' }} 
                          className="rounded-2 shadow-sm border p-1 bg-white" 
                        />
                        <div className="text-muted mt-1 small" style={{ fontSize: '0.72rem' }}>
                          Scan using PhonePe, Google Pay, Paytm, or any UPI App to recharge
                        </div>
                      </div>
                    )}
                    {Object.entries(cfg).filter(([k]) => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('password') && !k.toLowerCase().includes('qr')).map(([k, v]) => v && (
                      <div key={k} style={{ fontSize: '0.78rem', color: '#374151' }}>
                        <span className="fw-bold" style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>{k.replace(/_/g, ' ')}: </span>
                        <span className="fw-bold">{v}</span>
                      </div>
                    ))}
                    {activeRechargeMethod.instructions && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>{activeRechargeMethod.instructions}</div>}
                  </>
                );
              })()}
            </div>
          )}

          {/* Proof Upload for manual methods */}
          {activeRechargeMethod && ['bank_transfer', 'upi', 'manual'].includes(activeRechargeMethod.type) && (
            <div className="row g-2 mb-3">
              <div className="col-12">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Payment Screenshot Proof <span className="text-danger">*</span>
                </label>
                <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleFileChange} required />
                {proofPreview && <img src={proofPreview} alt="proof" className="mt-2 rounded-2 border" style={{ maxHeight: '120px', objectFit: 'cover' }} />}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  UTR / Reference Number <span className="text-danger">*</span>
                </label>
                <input className="form-control form-control-sm" value={utrRef} onChange={e => setUtrRef(e.target.value)} placeholder="Transaction / UTR ID..." required />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Date</label>
                <input type="date" className="form-control form-control-sm" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>Notes (Optional)</label>
                <textarea className="form-control form-control-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add transaction remarks or account reference..." />
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-light fw-bold px-4" onClick={() => setShowRecharge(false)}>Cancel</button>
            <button className="btn fw-bold px-4 px-sm-5 text-white rounded-3 shadow-sm" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={handleRechargeSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Recharge Request'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fdfdfd' }}>
          <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '13px' }}>Transaction History</div>
        </div>
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem', minWidth: '580px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Txn ID', 'Description', 'Amount', 'Type', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.72rem' }}>#{t.id}</td>
                  <td className="px-3 py-2" style={{ maxWidth: '240px' }}>
                    <div className="text-truncate">{t.description}</div>
                    {t.reference_id && <div className="text-muted" style={{ fontSize: '0.68rem' }}>Ref / UTR: <span className="fw-bold">{t.reference_id}</span></div>}
                    {t.status === 'Rejected' && t.rejection_reason && (
                      <div className="text-danger fw-bold" style={{ fontSize: '0.68rem' }}>Reason: {t.rejection_reason}</div>
                    )}
                    {t.balance_before !== null && t.balance_after !== null && (
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>Balance: ₹{Number(t.balance_before).toLocaleString()} → ₹{Number(t.balance_after).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 fw-bold" style={{ color: t.type === 'credit' ? COLORS.success : COLORS.danger }}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: t.type === 'credit' ? '#dcfce7' : '#fee2e2', color: t.type === 'credit' ? '#16a34a' : '#dc2626', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {t.type === 'credit' ? <ArrowUpRight size={9} className="me-1" /> : <ArrowDownRight size={9} className="me-1" />}{t.type}
                    </span>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={t.status || 'Completed'} /></td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '0.72rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No transactions yet. Recharge your wallet to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReactivationRequestModal
        isOpen={showReactivationModal}
        onClose={() => setShowReactivationModal(false)}
        wallet={wallet}
        vendorId={vendorId}
        onSuccess={load}
      />
    </div>
  );
}
