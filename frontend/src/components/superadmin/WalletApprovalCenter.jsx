import React, { useState, useEffect } from 'react';
import {
  Wallet, CheckCircle, XCircle, Clock, AlertTriangle, Eye, X,
  RefreshCw, Users, ArrowUpRight, ArrowDownRight, Filter, Download, DollarSign, TrendingUp, ShieldAlert
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E', success: '#16a34a', danger: '#dc2626', warn: '#ca8a04' };

function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'pending' || norm === 'pending verification' || norm === 'pending_verification') {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#fef9c3', color: '#ca8a04', fontSize: '0.65rem', textTransform: 'uppercase' }}>Pending Verification</span>;
  }
  if (norm === 'completed' || norm === 'approved') {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', textTransform: 'uppercase' }}>Approved</span>;
  }
  if (norm === 'rejected') {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.65rem', textTransform: 'uppercase' }}>Rejected</span>;
  }
  if (norm === 'active') {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', textTransform: 'uppercase' }}>Active</span>;
  }
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase' }}>{status}</span>;
}

function ProofModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 2000 }} onClick={onClose}>
      <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-dark position-absolute" style={{ top: -40, right: 0 }} onClick={onClose}><X size={18} /></button>
        <img src={url} alt="Payment Proof" style={{ maxWidth: '80vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

function WalletRechargeTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [proofUrl, setProofUrl] = useState(null);
  const [remarks, setRemarks] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=wallet_transactions&status_filter=${filter}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data.filter(t => t.type === 'credit') : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const isMatch = (status, filterTab) => {
    const s = (status || '').toLowerCase().trim();
    const f = (filterTab || '').toLowerCase().trim();
    if (f === 'all') return true;
    if (f === 'pending') return s === 'pending' || s === 'pending verification';
    if (f === 'completed' || f === 'approved') return s === 'completed' || s === 'approved';
    if (f === 'rejected') return s === 'rejected';
    return s === f;
  };

  const handleAction = async (id, status) => {
    let rejectionReason = '';
    if (status === 'Rejected') {
      rejectionReason = window.prompt('Please enter the reason for rejecting this recharge request:') || '';
      if (!rejectionReason.trim()) {
        alert('Rejection reason is required to reject a recharge.');
        return;
      }
    }
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve_recharge', 
          id, 
          status, 
          remarks: remarks[id] || rejectionReason,
          rejection_reason: rejectionReason 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Recharge ${status === 'Completed' ? 'approved' : 'rejected'} successfully.`);
        // Immediately update local state so UI updates instantaneously without requiring manual page refresh
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status, rejection_reason: rejectionReason } : r));
        load();
      } else {
        alert(data.error || 'Failed');
      }
    } catch (e) { alert(e.message); }
  };

  const filtered = requests.filter(r => isMatch(r.status, filter));

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {['pending', 'Completed', 'Rejected', 'all'].map(f => (
          <button key={f} className="btn btn-sm px-3 fw-bold rounded-pill" style={{ fontSize: '0.78rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }} onClick={() => setFilter(f)}>
            {f === 'pending' ? 'Pending' : f === 'Completed' ? 'Approved' : f === 'Rejected' ? 'Rejected' : 'All'}
          </button>
        ))}
        <button className="btn btn-sm ms-auto" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div className="d-flex gap-3">
                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px', background: '#dbeafe' }}>
                    <ArrowUpRight size={18} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>₹{Number(r.amount).toLocaleString()} Recharge</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Vendor: <span className="fw-bold text-dark">{r.vendor_name ? `${r.vendor_name} (${r.vendor_id})` : r.vendor_id}</span>
                      {r.vendor_type && <span className="badge ms-1.5 px-2 py-0.5 rounded-pill" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>{r.vendor_type}</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.description} · {new Date(r.created_at).toLocaleString()}</div>
                    {r.reference_id && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>UTR/Ref: <span className="fw-bold font-monospace text-dark">{r.reference_id}</span></div>}
                    {r.balance_before !== null && r.balance_after !== null && (
                      <div className="mt-1.5 p-1.5 rounded-2 bg-light border small" style={{ fontSize: '0.72rem' }}>
                        <span className="text-muted">Old Balance: </span>
                        <strong className={Number(r.balance_before) < 0 ? 'text-danger' : 'text-dark'}>
                          {Number(r.balance_before) < 0 ? `-₹${Math.abs(Number(r.balance_before)).toLocaleString()}` : `₹${Number(r.balance_before).toLocaleString()}`}
                        </strong>
                        <span className="text-muted mx-1">→</span>
                        <span className="text-success fw-bold">Recharge: +₹{Number(r.amount).toLocaleString()}</span>
                        <span className="text-muted mx-1">→</span>
                        <span className="text-muted">New Balance: </span>
                        <strong className={Number(r.balance_after) < 0 ? 'text-danger' : 'text-success'}>
                          {Number(r.balance_after) < 0 ? `-₹${Math.abs(Number(r.balance_after)).toLocaleString()}` : `₹${Number(r.balance_after).toLocaleString()}`}
                        </strong>
                      </div>
                    )}
                    {r.rejection_reason && (
                      <div className="mt-1 text-danger small" style={{ fontSize: '0.72rem' }}>
                        <strong>Rejection Reason:</strong> {r.rejection_reason}
                      </div>
                    )}
                    <div className="mt-1.5"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  {r.payment_proof && (
                    <button className="btn btn-sm px-3 d-flex align-items-center gap-1 fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem' }} onClick={() => setProofUrl(r.payment_proof)}>
                      <Eye size={12} /> View Proof
                    </button>
                  )}
                  {(r.status === 'Pending Verification' || r.status?.toLowerCase() === 'pending') && (
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem' }} onClick={() => handleAction(r.id, 'Completed')}>
                        <CheckCircle size={12} className="me-1" /> Approve
                      </button>
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }} onClick={() => handleAction(r.id, 'Rejected')}>
                        <XCircle size={12} className="me-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-5 text-muted">
              <Wallet size={32} className="mb-2 opacity-50" />
              <p className="mb-0">No {filter === 'all' ? '' : filter} recharge requests found</p>
            </div>
          )}
        </div>
      )}
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
    </div>
  );
}

function SubscriptionApprovalsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_verification');
  const [proofUrl, setProofUrl] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=admin_subscriptions`);
      setSubs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_subscription', id, status })
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error);
    } catch (e) { alert(e.message); }
  };

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {['pending_verification', 'active', 'rejected', 'all'].map(f => (
          <button key={f} className="btn btn-sm px-3 fw-bold rounded-pill" style={{ fontSize: '0.78rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }} onClick={() => setFilter(f)}>
            {f === 'pending_verification' ? 'Pending' : f === 'active' ? 'Active' : f === 'rejected' ? 'Rejected' : 'All'}
          </button>
        ))}
        <button className="btn btn-sm ms-auto" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(s => (
            <div key={s.id} className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>{s.admin_id}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Plan: <span className="fw-bold">{s.plan_name || `Plan #${s.plan_id}`}</span></div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Method: {s.payment_method} · {new Date(s.created_at).toLocaleString()}</div>
                  {s.payment_reference && <div style={{ fontSize: '0.72rem' }}>Ref: <span className="fw-bold">{s.payment_reference}</span></div>}
                  <div className="mt-1"><StatusBadge status={s.status} /></div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  {s.payment_proof && (
                    <button className="btn btn-sm px-3 fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem' }} onClick={() => setProofUrl(s.payment_proof)}>
                      <Eye size={12} className="me-1" /> View Proof
                    </button>
                  )}
                  {s.status === 'pending_verification' && (
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem' }} onClick={() => handleAction(s.id, 'active')}>
                        <CheckCircle size={12} className="me-1" /> Approve
                      </button>
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }} onClick={() => handleAction(s.id, 'rejected')}>
                        <XCircle size={12} className="me-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-5 text-muted">
              <CheckCircle size={32} className="mb-2 opacity-50" />
              <p className="mb-0">No {filter === 'all' ? '' : filter} subscription requests</p>
            </div>
          )}
        </div>
      )}
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
    </div>
  );
}

function VendorWalletsTab() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxLimit, setMaxLimit] = useState(2);
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitNotice, setLimitNotice] = useState('');

  const loadWallets = async () => {
    setLoading(true);
    try {
      const [resW, resS] = await Promise.all([
        apiFetch(`${API_BASE}?resource=wallets`),
        apiFetch(`${API_BASE}?resource=global_settings`)
      ]);
      const dataW = await resW.json();
      const dataS = await resS.json();
      setWallets(Array.isArray(dataW) ? dataW : []);
      if (dataS && dataS.max_negative_bookings !== undefined) {
        setMaxLimit(Number(dataS.max_negative_bookings));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleSaveLimit = async () => {
    setSavingLimit(true);
    setLimitNotice('');
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_wallet_settings', max_negative_bookings: maxLimit })
      });
      const data = await res.json();
      if (data.success) {
        setLimitNotice('Policy saved: Maximum negative bookings limit set to ' + maxLimit);
        setTimeout(() => setLimitNotice(''), 4000);
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div>
      <div className="card p-3 mb-3 border-0 shadow-sm" style={{ background: '#f8fafc', borderLeft: '4px solid #FF6333' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '0.85rem' }}>Negative Wallet Policy Settings</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Vendors whose wallets enter negative balance can confirm bookings up to this maximum limit. Once reached, their booking confirmations are blocked with WALLET_BLOCKED until they recharge and bring balance ≥ 0.
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Max Negative Bookings:</span>
            <input 
              type="number" 
              min="1" 
              max="10" 
              className="form-control form-control-sm text-center fw-bold" 
              style={{ width: '65px', borderRadius: '6px' }} 
              value={maxLimit} 
              onChange={e => setMaxLimit(Math.max(1, parseInt(e.target.value) || 1))} 
            />
            <button className="btn btn-sm btn-primary px-3 fw-bold" disabled={savingLimit} onClick={handleSaveLimit} style={{ fontSize: '0.75rem', borderRadius: '6px', background: COLORS.primary, border: 'none' }}>
              {savingLimit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        {limitNotice && <div className="mt-2 text-success fw-bold small">{limitNotice}</div>}
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Vendor Name', 'Vendor Type', 'Current Balance', 'Negative Bookings', 'Limit', 'Wallet Status', 'Vendor ID', 'Last Updated'].map(h => (
                    <th key={h} className="px-3 py-3 fw-bold text-nowrap" style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map(w => {
                  const bal = Number(w.balance);
                  const isNeg = bal < 0;
                  const limit = Number(w.max_negative_booking_limit || maxLimit);
                  const negCount = Number(w.negative_booking_count || 0);
                  const isBlocked = isNeg && negCount >= limit;
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className="px-3 py-3 fw-bold" style={{ color: COLORS.dark }}>
                        {w.vendor_name || w.vendor_id}
                      </td>
                      <td className="px-3 py-3">
                        <span className="badge px-2 py-1 rounded-pill fw-semibold" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                          {w.vendor_type || 'Vehicle Vendor'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="fw-bold font-monospace" style={{ color: isNeg ? COLORS.danger : (bal < 1000 ? COLORS.warn : COLORS.success), fontSize: '0.95rem' }}>
                          {isNeg ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`}
                        </span>
                        {isNeg && <span className="ms-2 px-1.5 py-0.5 rounded" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.62rem', fontWeight: 700 }}>NEGATIVE</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="fw-bold" style={{ color: negCount > 0 ? '#dc2626' : '#64748b' }}>
                          {negCount} / {limit}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {limit}
                      </td>
                      <td className="px-3 py-3">
                        {isBlocked ? (
                          <span className="badge px-2.5 py-1.5 rounded-pill fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem' }}>
                            <ShieldAlert size={12} className="me-1 inline" /> WALLET RECHARGE REQUIRED
                          </span>
                        ) : isNeg ? (
                          <span className="badge px-2 py-1 rounded-pill fw-bold" style={{ background: '#fef9c3', color: '#ca8a04', fontSize: '0.7rem' }}>
                            NEGATIVE (GRACE)
                          </span>
                        ) : (
                          <span className="badge px-2.5 py-1.5 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.7rem' }}>
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-monospace text-muted small" style={{ fontSize: '0.75rem' }}>
                        {w.vendor_id}
                      </td>
                      <td className="px-3 py-3 text-muted" style={{ fontSize: '0.75rem' }}>
                        {w.updated_at ? new Date(w.updated_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
                {wallets.length === 0 && <tr><td colSpan={8} className="text-center py-5 text-muted">No vendor wallets found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionHistoryTab() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}?resource=wallet_transactions`)
      .then(r => r.json()).then(d => setTxns(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Txn ID', 'Vendor', 'Type', 'Amount', 'Description', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.slice(0, 100).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.72rem' }}>#{t.id}</td>
                  <td className="px-3 py-2 fw-bold">{t.vendor_id}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: t.type === 'credit' ? '#dcfce7' : '#fee2e2', color: t.type === 'credit' ? '#16a34a' : '#dc2626', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {t.type === 'credit' ? <ArrowUpRight size={10} className="me-1" /> : <ArrowDownRight size={10} className="me-1" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 fw-bold" style={{ color: t.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td className="px-3 py-2"><StatusBadge status={t.status || 'Completed'} /></td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '0.72rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={7} className="text-center py-5 text-muted">No transactions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlatformRevenueLedgerTab() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=platform_revenue`);
      const data = await res.json();
      setLedger(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalFeeRevenue = ledger.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div>
      <div className="p-3 mb-4 rounded-3 border" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#bbf7d0' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <TrendingUp size={20} className="text-success" />
              <h6 className="fw-bold mb-0 text-success">Authoritative Platform Revenue Ledger</h6>
            </div>
            <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
              Strict separation: This ledger records genuine platform fee revenue deducted upon vendor booking confirmation. Vendor wallet recharges are settlements and are NOT included in WOW GOA revenue.
            </p>
          </div>
          <div className="text-md-end bg-white px-3 py-2 rounded-2 border shadow-sm flex-shrink-0">
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Platform Revenue</div>
            <div className="fw-bold fs-4 text-success">₹{totalFeeRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ledger.length} Fee Transaction{ledger.length === 1 ? '' : 's'}</div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Platform Fee Deductions</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={load}>
          <RefreshCw size={13} className="me-1 inline" /> Refresh Ledger
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border text-success" style={{ width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Txn ID', 'Booking Ref', 'Vendor', 'Platform Fee', 'Description', 'Status', 'Date & Time'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.72rem' }}>#{item.id}</td>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#0f172a' }}>{item.booking_id || item.reference_id || 'N/A'}</td>
                  <td className="px-3 py-2 fw-bold text-secondary">{item.vendor_id}</td>
                  <td className="px-3 py-2 fw-bold text-success" style={{ fontSize: '0.9rem' }}>
                    +₹{Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-muted" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description || 'WOW GOA Platform Fee'}
                  </td>
                  <td className="px-3 py-2">
                    <span className="badge px-2 py-1 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.68rem' }}>
                      {item.status || 'Completed'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '0.72rem' }}>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No platform fee revenue recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'recharge', label: 'Wallet Recharge Approvals', icon: <Wallet size={14} /> },
  { id: 'revenue', label: 'Platform Revenue Ledger', icon: <DollarSign size={14} /> },
  { id: 'subscriptions', label: 'Subscription Approvals', icon: <CheckCircle size={14} /> },
  { id: 'wallets', label: 'All Vendor Wallets', icon: <Users size={14} /> },
  { id: 'history', label: 'Transaction History', icon: <Clock size={14} /> },
];

export default function WalletApprovalCenter({ defaultTab = 'recharge' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>Wallet & Approval Center</h5>
        <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Review and approve vendor wallet recharges, admin subscription payments, and monitor all wallet activity</p>
      </div>

      {/* Tab Bar */}
      <div className="d-flex gap-1 mb-4 p-1 rounded-3" style={{ background: '#f1f5f9', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-bold flex-shrink-0" style={{ fontSize: '0.8rem', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? COLORS.dark : '#64748b', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'recharge' && <WalletRechargeTab />}
      {activeTab === 'revenue' && <PlatformRevenueLedgerTab />}
      {activeTab === 'subscriptions' && <SubscriptionApprovalsTab />}
      {activeTab === 'wallets' && <VendorWalletsTab />}
      {activeTab === 'history' && <TransactionHistoryTab />}
    </div>
  );
}
