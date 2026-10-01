import React, { useState, useEffect } from 'react';
import {
  Wallet, CheckCircle, XCircle, Clock, AlertTriangle, Eye, X,
  RefreshCw, Users, ArrowUpRight, ArrowDownRight, Filter, Download, DollarSign, TrendingUp, ShieldAlert,
  Phone, Mail, MessageSquare, Send, Bell, Check, AlertOctagon, HelpCircle, FileText, Search
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E', success: '#16a34a', danger: '#dc2626', warn: '#ca8a04' };

function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'pending' || norm === 'pending verification' || norm === 'pending_verification' || norm === 'pending_reactivation') {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#fef9c3', color: '#ca8a04', fontSize: '0.65rem', textTransform: 'uppercase' }}>{status}</span>;
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

// ─── MODAL: HIDE SERVICES (MANUAL ACTION) ────────────────────────────────────
function HideServicesModal({ vendor, onClose, onSuccess }) {
  const [reason, setReason] = useState('Negative wallet balance confirmation limit reached');
  const [submitting, setSubmitting] = useState(false);

  if (!vendor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please specify a suspension reason');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend_vendor_services',
          vendor_id: vendor.vendor_id || vendor.id,
          suspension_reason: reason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Vendor ${vendor.vendor_name || vendor.vendor_id} services have been manually hidden from customer listings.`);
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to suspend services');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
      <div className="bg-white rounded-4 shadow-2xl p-4" style={{ maxWidth: '480px', width: '92%' }}>
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-2 text-danger">
            <ShieldAlert size={22} />
            <h6 className="fw-bold mb-0">Manually Hide Vendor Services</h6>
          </div>
          <button className="btn btn-sm btn-light rounded-circle" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="p-3 mb-3 rounded-3 bg-danger-subtle border border-danger-subtle" style={{ fontSize: '0.8rem', color: '#991b1b' }}>
          <strong>Operational Action:</strong> This will hide all public service listings (cars, bikes, hotels, flights) for <strong>{vendor.vendor_name || vendor.vendor_id}</strong> on the customer website. The vendor user account remains active, and the vendor can still log in and recharge their wallet.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">Suspension Reason:</label>
            <textarea
              className="form-control"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-danger fw-bold px-4 d-flex align-items-center gap-1.5" disabled={submitting}>
              {submitting ? 'Hiding Services...' : 'Confirm [HIDE SERVICES]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── HELPER: VENDOR REMINDER DEFAULT MESSAGE SELECTOR ───────────────────────
export function getVendorReminderDefaultMessage(vendor, maxLimit = 2) {
  if (!vendor) return '';
  const vendorName = vendor.vendor_name || vendor.name || vendor.vendor_id || 'Vendor';
  let bal = Number(vendor.balance !== undefined ? vendor.balance : (vendor.wallet_balance || 0));
  if (Object.is(bal, -0) || Math.abs(bal) < 0.001) bal = 0;
  const isSuspended = Number(vendor.services_suspended) === 1;
  const limit = Number(vendor.max_negative_booking_limit || maxLimit || 2);
  const negCount = Number(vendor.negative_booking_count || 0);
  const isBlocked = (bal < 0 && negCount >= limit) || Boolean(vendor.is_blocked);

  let template = '';
  if (isSuspended) {
    template = `WOW GOA – Service Visibility Notice\n\nDear {Vendor Name}, your services are currently not visible to customers on the main WOW GOA website due to your wallet status.\n\nPlease recharge your vendor wallet and submit a Service Reactivation Request through your vendor portal.\n\nYour services will be restored after Admin/Super Admin approval.\n\n– WOW GOA`;
  } else if (isBlocked) {
    template = `WOW GOA – Urgent Wallet Recharge Reminder\n\nDear {Vendor Name}, your WOW GOA vendor wallet balance is ₹{Balance}.\nYour booking confirmation is currently restricted because your wallet has reached the allowed negative booking limit.\n\nPlease recharge your wallet through the vendor portal.\n\nIf the wallet issue is not resolved, the Admin may manually hide your services from the main WOW GOA website.\n\n– WOW GOA`;
  } else {
    template = `WOW GOA – Wallet Recharge Reminder\n\nDear {Vendor Name}, your WOW GOA vendor wallet balance is ₹{Balance}.\nPlease recharge your wallet to continue your services.\n\nIf the wallet issue is not resolved, your services may be hidden from the main WOW GOA website by the Admin.\n\n– WOW GOA`;
  }

  // Replace {Vendor Name}
  let msg = template.replace(/\{Vendor Name\}/g, vendorName).replace(/\{vendor_name\}/g, vendorName);

  // Replace ₹{Balance} / {Balance}
  const formattedBalancePart = bal < 0 ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`;
  if (msg.includes('₹{Balance}')) {
    msg = msg.replace(/₹\{Balance\}/g, formattedBalancePart);
  }
  msg = msg.replace(/\{Balance\}/g, bal < 0 ? `-${Math.abs(bal).toLocaleString()}` : `${bal.toLocaleString()}`);

  return msg;
}

// ─── MODAL: MANUAL REMINDER ──────────────────────────────────────────────────
function ManualReminderModal({ vendor, onClose, onSuccess }) {
  const [channels, setChannels] = useState(['SMS', 'WhatsApp', 'Email', 'Portal']);
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchResults, setDispatchResults] = useState(null);
  const [errorNotice, setErrorNotice] = useState('');

  if (!vendor) return null;

  let bal = Number(vendor.balance !== undefined ? vendor.balance : (vendor.wallet_balance || 0));
  if (Object.is(bal, -0) || Math.abs(bal) < 0.001) bal = 0;
  const isNeg = bal < 0;
  const formattedBal = isNeg ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`;

  useEffect(() => {
    setCustomMessage(getVendorReminderDefaultMessage(vendor, vendor.max_negative_booking_limit || 2));
    setDispatchResults(null);
    setErrorNotice('');
  }, [vendor]);

  const toggleChannel = (ch) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorNotice('');
    if (channels.length === 0) {
      setErrorNotice('Please select at least one dispatch channel (SMS, WhatsApp, Email, or Portal).');
      return;
    }
    if ((channels.includes('SMS') || channels.includes('WhatsApp')) && !vendor.phone) {
      setErrorNotice('Vendor does not have a phone number on record for SMS/WhatsApp. Please uncheck SMS/WhatsApp or update vendor phone.');
      return;
    }
    if (channels.includes('Email') && !vendor.email) {
      setErrorNotice('Vendor does not have an email address on record for Email. Please uncheck Email or update vendor email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_manual_vendor_reminder',
          vendor_id: vendor.vendor_id || vendor.id,
          channels: channels.join(','),
          message: customMessage.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResults(data.channel_results || {});
        if (onSuccess) onSuccess();
      } else {
        setErrorNotice(data.error || 'Failed to send manual reminder');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSuspended = Number(vendor.services_suspended) === 1;

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
      <div className="bg-white rounded-4 shadow-2xl p-4" style={{ maxWidth: '620px', width: '94%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-2 text-primary">
            <Send size={20} />
            <h6 className="fw-bold mb-0 text-dark">Send Manual Vendor Recharge Reminder</h6>
          </div>
          <button className="btn btn-sm btn-light rounded-circle" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Operational Profile Card */}
        <div className="mb-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="row g-2" style={{ fontSize: '0.78rem' }}>
            <div className="col-sm-6">
              <span className="text-muted">Vendor:</span> <strong className="text-dark">{vendor.vendor_name || vendor.vendor_id}</strong>
              <div className="text-muted small font-monospace">ID: {vendor.vendor_id || vendor.id}</div>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Type:</span> <span className="badge bg-light text-dark border ms-1">{vendor.vendor_type || 'Vehicle Vendor'}</span>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Phone:</span> <strong>{vendor.phone || <span className="text-danger small">No phone on record</span>}</strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Email:</span> <strong>{vendor.email || <span className="text-danger small">No email on record</span>}</strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Wallet Balance:</span>{' '}
              <strong className="font-monospace" style={{ color: isNeg ? COLORS.danger : COLORS.success }}>
                {formattedBal}
              </strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Negative Bookings:</span>{' '}
              <strong>{vendor.negative_booking_count || 0} / {vendor.max_negative_booking_limit || 2}</strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Reminders Sent:</span>{' '}
              <strong>
                {vendor.initial_reminders_sent || 0} / {vendor.max_initial_reminders || 2} (Auto)
                {Number(vendor.manual_reminders_sent || 0) > 0 ? ` · ${vendor.manual_reminders_sent} (Manual)` : ''}
              </strong>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Escalation Status:</span>{' '}
              <span className="badge bg-warning-subtle text-dark border ms-1" style={{ fontSize: '0.68rem' }}>
                {vendor.escalation_status || (vendor.is_blocked ? 'WALLET BLOCKED' : 'ACTIVE')}
              </span>
            </div>
            <div className="col-sm-6">
              <span className="text-muted">Service Visibility:</span>{' '}
              <span className={`badge ${isSuspended ? 'bg-danger' : 'bg-success'} ms-1`} style={{ fontSize: '0.68rem' }}>
                {isSuspended ? 'SERVICES HIDDEN' : 'SERVICES VISIBLE'}
              </span>
            </div>
            <div className="col-12 mt-1 pt-1 border-top">
              <span className="text-muted">Recharge Status:</span>{' '}
              <span className="text-secondary fw-semibold">{vendor.recharge_status || 'No recent recharge'}</span>
            </div>
          </div>
        </div>

        {dispatchResults ? (
          <div className="p-3 mb-3 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div className="d-flex align-items-center gap-2 text-success fw-bold mb-2">
              <CheckCircle size={18} />
              <span>Reminder Dispatched to {vendor.vendor_name || vendor.vendor_id}</span>
            </div>
            <div className="d-flex flex-column gap-1.5" style={{ fontSize: '0.78rem' }}>
              {Object.entries(dispatchResults).map(([ch, info]) => {
                const isSent = info.status === 'SENT' || info.status === 'DELIVERED';
                return (
                  <div key={ch} className="d-flex align-items-center justify-content-between p-2 rounded bg-white border">
                    <span className="fw-bold">{ch} ({info.recipient || 'N/A'})</span>
                    <span className={`badge ${isSent ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                      {info.status} {info.error ? `(${info.error})` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-end">
              <button className="btn btn-sm btn-outline-dark fw-bold px-4" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            {errorNotice && (
              <div className="alert alert-danger py-2 px-3 small mb-3">
                {errorNotice}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-bold small text-dark d-block mb-1">
                Select Dispatch Channels:
              </label>
              <div className="d-flex flex-wrap gap-3 p-2 rounded-2 bg-light border">
                {['SMS', 'WhatsApp', 'Email', 'Portal'].map(ch => (
                  <label key={ch} className="d-flex align-items-center gap-1.5 small" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={channels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                    />
                    <span className="fw-semibold">{ch}</span>
                    {ch === 'SMS' && !vendor.phone && <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.6rem' }}>No Phone</span>}
                    {ch === 'Email' && !vendor.email && <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.6rem' }}>No Email</span>}
                  </label>
                ))}
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                Note: SMS is supported via provider gateway. If gateway credentials are not yet set, it logs as PENDING_GATEWAY_CONFIG.
              </small>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fw-bold small text-dark mb-0">Message Preview:</label>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => setCustomMessage(getVendorReminderDefaultMessage(vendor, vendor.max_negative_booking_limit || 2))}
                >
                  Reset Default
                </button>
              </div>
              <textarea
                className="form-control"
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                required
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm text-white fw-bold px-4 d-flex align-items-center gap-1.5 shadow-sm"
                disabled={submitting}
                style={{ background: COLORS.primary, border: 'none' }}
              >
                <Send size={13} /> {submitting ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── MODAL: REJECT REACTIVATION REQUEST ──────────────────────────────────────
function RejectReactivationModal({ request, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Rejection reason is MANDATORY to reject a reactivation request.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_service_reactivation',
          vendor_id: request.vendor_id,
          rejection_reason: reason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Reactivation request rejected. Services remain hidden.');
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to reject reactivation');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
      <div className="bg-white rounded-4 shadow-2xl p-4" style={{ maxWidth: '460px', width: '92%' }}>
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom text-danger">
          <div className="d-flex align-items-center gap-2">
            <XCircle size={22} />
            <h6 className="fw-bold mb-0">Reject Reactivation Request</h6>
          </div>
          <button className="btn btn-sm btn-light rounded-circle" onClick={onClose}><X size={16} /></button>
        </div>

        <p className="text-muted small mb-2">
          Rejecting reactivation for <strong>{request.vendor_name || request.vendor_id}</strong>. Vendor services will remain hidden.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold small text-dark">
              Rejection Reason <span className="text-danger">*</span>:
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Explain why reactivation was rejected (e.g. Wallet still negative, payment proof invalid, pending dispute)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-danger fw-bold px-4" disabled={submitting}>
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TAB 1: WALLET RECHARGE TAB ──────────────────────────────────────────────
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
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status, rejection_reason: rejectionReason } : r));
        load();
      } else {
        alert(data.error || 'Failed');
      }
    } catch (e) { alert(e.message); }
  };

  const filtered = requests.filter(r => {
    const s = (r.status || '').toLowerCase().trim();
    const f = (filter || '').toLowerCase().trim();
    if (f === 'all') return true;
    if (f === 'pending') return s === 'pending' || s === 'pending verification';
    if (f === 'completed' || f === 'approved') return s === 'completed' || s === 'approved';
    if (f === 'rejected') return s === 'rejected';
    return s === f;
  });

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {['pending', 'completed', 'rejected', 'all'].map(f => (
          <button key={f} className="btn btn-sm px-3 fw-bold rounded-pill" style={{ fontSize: '0.78rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }} onClick={() => setFilter(f)}>
            {f === 'pending' ? 'Pending' : f === 'completed' ? 'Approved' : f === 'rejected' ? 'Rejected' : 'All'}
          </button>
        ))}
        <button className="btn btn-sm ms-auto" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>
                    {r.vendor_name || r.vendor_id}
                  </div>
                  <div className="fw-bold fs-5 my-1" style={{ color: COLORS.success }}>
                    +₹{Number(r.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Method: {r.payment_method} · {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.reference_id && (
                    <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                      UTR / Ref: <span className="fw-bold">{r.reference_id}</span>
                    </div>
                  )}
                  {r.rejection_reason && (
                    <div className="mt-1 p-2 rounded bg-danger-subtle text-danger" style={{ fontSize: '0.72rem' }}>
                      <strong>Rejection Reason:</strong> {r.rejection_reason}
                    </div>
                  )}
                  <div className="mt-1.5"><StatusBadge status={r.status} /></div>
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

// ─── TAB 2: BLOCKED BOOKING ALERTS TAB ───────────────────────────────────────
function BlockedBookingAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=blocked_booking_alerts`);
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 className="fw-bold mb-0 text-dark">Blocked Booking Operational Alerts</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
            Authoritative alerts generated whenever a booking confirmation hits WALLET_BLOCKED. Admin and Super Admin can review both parties and take immediate operational action.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={loadAlerts}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" style={{ width: '1.5rem', height: '1.5rem' }} /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-3 border">
          <ShieldAlert size={36} className="text-success mb-2 opacity-75" />
          <div className="fw-bold">No Blocked Booking Alerts Active</div>
          <div className="small">All bookings are operating within normal wallet limits.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {alerts.map(item => {
            const meta = item.metadata || item || {};
            const cust = meta.customer || item.customer || {};
            const vend = meta.vendor || item.vendor || {};
            const b = meta.booking || item.booking || {};
            const bookingId = b.id || item.booking_id || item.related_booking_id || 'N/A';
            const bookingType = b.type || item.booking_type || 'Vehicle';

            const vendBal = vend.balance !== undefined ? vend.balance : (vend.wallet_balance !== undefined ? vend.wallet_balance : item.wallet?.balance);
            const isVendNeg = Number(vendBal || 0) < 0;

            const formatCurrency = (val) => {
              let n = Number(val || 0);
              if (Object.is(n, -0) || Math.abs(n) < 0.001) return '₹0';
              if (n < 0) return `-₹${Math.abs(n).toLocaleString()}`;
              return `₹${n.toLocaleString()}`;
            };

            const vendBalFormatted = formatCurrency(vendBal);

            const custPhone = cust.phone || cust.contact;
            const custEmail = cust.email;
            const vendPhone = vend.phone || vend.contact;
            const vendEmail = vend.email;

            return (
              <div key={item.id} className="rounded-3 border shadow-sm p-3 bg-white" style={{ borderLeft: '4px solid #dc2626' }}>
                <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger text-uppercase px-2.5 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                      <AlertOctagon size={12} className="me-1 inline" /> WALLET_BLOCKED
                    </span>
                    <span className="fw-bold font-monospace text-dark" style={{ fontSize: '0.85rem' }}>
                      Booking #{bookingId}
                    </span>
                    <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.68rem' }}>
                      {bookingType}
                    </span>
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                    Blocked At: {item.created_at || item.blocked_at ? new Date(item.created_at || item.blocked_at).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="row g-3">
                  {/* Customer Information (Admin View) */}
                  <div className="col-md-6 border-end">
                    <div className="fw-bold text-uppercase text-secondary mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      Customer Information
                    </div>
                    <div className="d-flex flex-column gap-1" style={{ fontSize: '0.8rem' }}>
                      <div><span className="text-muted">Name:</span> <strong className="text-dark">{cust.name || 'Valued Customer'}</strong></div>
                      <div>
                        <span className="text-muted">Phone:</span>{' '}
                        {custPhone ? (
                          <a href={`tel:${custPhone}`} className="text-decoration-none fw-semibold text-primary">
                            {custPhone}
                          </a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted">Email:</span>{' '}
                        {custEmail ? (
                          <a href={`mailto:${custEmail}`} className="text-decoration-none text-secondary">
                            {custEmail}
                          </a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </div>
                      <div><span className="text-muted">Booking Dates:</span> <span>{b.dates || cust.booking_dates || 'Scheduled Dates'}</span></div>
                      <div>
                        <span className="text-muted">Public Customer Status:</span>{' '}
                        <span className="badge bg-light text-dark border">
                          {b.neutral_status || 'Pending Confirmation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Information (Authoritative Operational Data) */}
                  <div className="col-md-6">
                    <div className="fw-bold text-uppercase text-danger mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      Vendor Information (Authoritative)
                    </div>
                    <div className="d-flex flex-column gap-1" style={{ fontSize: '0.8rem' }}>
                      <div>
                        <span className="text-muted">Vendor:</span>{' '}
                        <strong className="text-dark">{vend.name || vend.vendor_id || item.vendor_id || 'Vendor'}</strong>
                        {(vend.vendor_id || vend.id) && (
                          <span className="text-muted small ms-1 font-monospace">({vend.vendor_id || vend.id})</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted">Phone:</span>{' '}
                        {vendPhone ? (
                          <a href={`tel:${vendPhone}`} className="text-decoration-none fw-semibold text-primary">
                            {vendPhone}
                          </a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted">Wallet Balance:</span>{' '}
                        <span className={`fw-bold font-monospace ${isVendNeg ? 'text-danger' : 'text-success'}`}>
                          {vendBalFormatted}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Negative Bookings:</span>{' '}
                        <span className="fw-bold text-danger">
                          {vend.negative_booking_count || 0} / {vend.max_negative_bookings || 2} (Limit Reached)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Block Reason:</span>{' '}
                        <span className="text-danger-emphasis fw-semibold">
                          {vend.block_reason || item.block_reason || 'Max negative booking threshold reached'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Recharge Status:</span>{' '}
                        <span className="badge bg-warning text-dark">
                          {vend.recharge_status || item.recharge_status || 'Pending Recharge'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    {vendPhone ? (
                      <a href={`tel:${vendPhone}`} className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                        <Phone size={12} /> [CONTACT VENDOR]
                      </a>
                    ) : vendEmail ? (
                      <a href={`mailto:${vendEmail}`} className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                        <Mail size={12} /> [CONTACT VENDOR]
                      </a>
                    ) : null}
                    {custPhone ? (
                      <a href={`tel:${custPhone}`} className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                        <Phone size={12} /> [CONTACT CUSTOMER]
                      </a>
                    ) : custEmail ? (
                      <a href={`mailto:${custEmail}`} className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                        <Mail size={12} /> [CONTACT CUSTOMER]
                      </a>
                    ) : null}
                  </div>
                  <div>
                    <button
                      className="btn btn-sm btn-light border fw-bold d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setSelectedBooking({ alert: item, meta, bookingId, cust, vend, b, vendBalFormatted })}
                    >
                      <Eye size={13} /> [VIEW BOOKING]
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
          <div className="bg-white rounded-4 shadow-2xl p-4" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger text-uppercase px-2 py-1 fw-bold" style={{ fontSize: '0.68rem' }}>
                    WALLET_BLOCKED
                  </span>
                  <h6 className="fw-bold mb-0 text-dark">
                    Booking Details #{selectedBooking.bookingId}
                  </h6>
                </div>
                <div className="text-muted small mt-0.5">
                  Authoritative Operational Snapshot & Booking Verification
                </div>
              </div>
              <button className="btn btn-sm btn-light rounded-circle" onClick={() => setSelectedBooking(null)}><X size={16} /></button>
            </div>

            <div className="row g-3 mb-3" style={{ fontSize: '0.8rem' }}>
              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-uppercase text-secondary mb-2" style={{ fontSize: '0.7rem' }}>Customer Profile</div>
                  <div><span className="text-muted">Name:</span> <strong className="text-dark">{selectedBooking.cust?.name || 'Valued Customer'}</strong></div>
                  <div><span className="text-muted">Phone:</span> <strong>{selectedBooking.cust?.phone || selectedBooking.cust?.contact || 'N/A'}</strong></div>
                  <div><span className="text-muted">Email:</span> <strong>{selectedBooking.cust?.email || 'N/A'}</strong></div>
                  <div className="mt-1"><span className="text-muted">Public Status:</span> <span className="badge bg-white border text-dark ms-1">{selectedBooking.b?.neutral_status || 'Pending Confirmation'}</span></div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-uppercase text-danger mb-2" style={{ fontSize: '0.7rem' }}>Vendor & Wallet Status</div>
                  <div><span className="text-muted">Vendor:</span> <strong className="text-dark">{selectedBooking.vend?.name || selectedBooking.vend?.vendor_id || 'Vendor'}</strong></div>
                  <div><span className="text-muted">Phone:</span> <strong>{selectedBooking.vend?.phone || selectedBooking.vend?.contact || 'N/A'}</strong></div>
                  <div><span className="text-muted">Wallet Balance:</span> <strong className="font-monospace text-danger ms-1">{selectedBooking.vendBalFormatted}</strong></div>
                  <div><span className="text-muted">Negative Limit:</span> <strong className="text-danger ms-1">{selectedBooking.vend?.negative_booking_count || 0} / {selectedBooking.vend?.max_negative_bookings || 2}</strong></div>
                  <div className="mt-1"><span className="text-muted">Recharge:</span> <span className="badge bg-warning text-dark ms-1">{selectedBooking.vend?.recharge_status || 'Pending'}</span></div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded-3 bg-light border">
                  <div className="fw-bold text-uppercase text-secondary mb-2" style={{ fontSize: '0.7rem' }}>Service & Booking Record</div>
                  <div className="row g-2">
                    <div className="col-sm-6"><span className="text-muted">Service Name:</span> <strong>{selectedBooking.b?.service_name || selectedBooking.cust?.service_name || 'Service'}</strong></div>
                    <div className="col-sm-6"><span className="text-muted">Booking Type:</span> <span className="badge bg-secondary-subtle text-secondary ms-1">{selectedBooking.b?.type || selectedBooking.alert?.booking_type || 'Vehicle'}</span></div>
                    <div className="col-12"><span className="text-muted">Dates:</span> <strong>{selectedBooking.b?.dates || selectedBooking.cust?.booking_dates || 'Scheduled Dates'}</strong></div>
                    <div className="col-12"><span className="text-muted">Block Reason:</span> <span className="text-danger fw-semibold ms-1">{selectedBooking.vend?.block_reason || selectedBooking.alert?.block_reason}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-3 border-top flex-wrap gap-2">
              <div className="d-flex gap-2">
                {selectedBooking.vend?.phone && (
                  <a href={`tel:${selectedBooking.vend.phone}`} className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                    <Phone size={12} /> Contact Vendor ({selectedBooking.vend.phone})
                  </a>
                )}
                {selectedBooking.cust?.phone && (
                  <a href={`tel:${selectedBooking.cust.phone}`} className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                    <Phone size={12} /> Contact Customer ({selectedBooking.cust.phone})
                  </a>
                )}
              </div>
              <button className="btn btn-sm btn-secondary fw-semibold px-3" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: REACTIVATION REQUESTS TAB ────────────────────────────────────────
function ReactivationRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectingRequest, setRejectingRequest] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=vendor_reactivations`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (vendorId, vendorName) => {
    if (!window.confirm(`Approve service reactivation for ${vendorName || vendorId}? This will set services_suspended = 0 and make vendor services visible to customers again.`)) {
      return;
    }
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_service_reactivation',
          vendor_id: vendorId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Services successfully restored for ${vendorName || vendorId}.`);
        loadRequests();
      } else {
        alert(data.error || 'Failed to approve reactivation');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = requests.filter(r => {
    const s = (r.reactivation_status || '').toLowerCase().trim();
    if (filter === 'all') return true;
    if (filter === 'pending') return s === 'pending_reactivation' || s === 'pending';
    if (filter === 'approved') return s === 'approved';
    if (filter === 'rejected') return s === 'rejected';
    return true;
  });

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h6 className="fw-bold mb-0 text-dark">Vendor Service Reactivation Requests</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
            Vendors whose services were suspended submit reactivation requests here. Recharging alone does not restore services; Admin or Super Admin explicit decision is required.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              className="btn btn-sm px-3 fw-bold rounded-pill"
              style={{ fontSize: '0.75rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }}
              onClick={() => setFilter(f)}
            >
              {f === 'pending' ? 'Pending Approval' : f === 'approved' ? 'Approved' : f === 'rejected' ? 'Rejected' : 'All'}
            </button>
          ))}
          <button className="btn btn-sm btn-outline-secondary" onClick={loadRequests}><RefreshCw size={13} /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" style={{ width: '1.5rem', height: '1.5rem' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-3 border">
          <CheckCircle size={32} className="text-success mb-2 opacity-50" />
          <div className="fw-bold">No {filter === 'all' ? '' : filter} reactivation requests found</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(req => {
            const isPending = req.reactivation_status === 'PENDING_REACTIVATION' || req.reactivation_status === 'pending';
            const bal = Number(req.balance || 0);

            return (
              <div key={req.id} className="rounded-3 border shadow-sm p-3 bg-white">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark fs-6">{req.vendor_name || req.vendor_id}</span>
                      <span className="badge bg-secondary-subtle text-secondary small font-monospace">{req.vendor_id}</span>
                      <StatusBadge status={req.reactivation_status} />
                    </div>
                    <div className="text-muted small mt-0.5">
                      Requested: {req.reactivation_requested_at ? new Date(req.reactivation_requested_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="text-end">
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Current Wallet Balance:</div>
                    <div className={`fw-bold font-monospace fs-5 ${bal < 0 ? 'text-danger' : 'text-success'}`}>
                      {bal < 0 ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                <div className="row g-2 mb-3" style={{ fontSize: '0.8rem' }}>
                  <div className="col-md-6">
                    <span className="text-muted">Suspension Reason: </span>
                    <span className="fw-semibold text-danger">{req.suspension_reason || 'Negative wallet balance confirmation limit reached'}</span>
                    {req.suspended_at && (
                      <div className="text-muted small">Suspended On: {new Date(req.suspended_at).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted">Vendor Contact: </span>
                    <span>{req.vendor_phone || req.vendor_email || 'Available in profile'}</span>
                  </div>
                </div>

                {req.reactivation_message && (
                  <div className="p-2.5 rounded-3 bg-light border mb-3" style={{ fontSize: '0.8rem' }}>
                    <div className="text-muted small fw-bold mb-1">Vendor's Request Note:</div>
                    <div className="fst-italic text-dark">"{req.reactivation_message}"</div>
                  </div>
                )}

                {req.reactivation_rejection_reason && (
                  <div className="p-2.5 rounded-3 bg-danger-subtle border border-danger text-danger mb-3" style={{ fontSize: '0.8rem' }}>
                    <strong>Rejection Reason Recorded:</strong> "{req.reactivation_rejection_reason}"
                  </div>
                )}

                {isPending && (
                  <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
                    <button
                      className="btn btn-sm btn-outline-danger fw-bold px-3 d-flex align-items-center gap-1"
                      onClick={() => setRejectingRequest(req)}
                    >
                      <XCircle size={14} /> [REJECT]
                    </button>
                    <button
                      className="btn btn-sm btn-success fw-bold px-4 d-flex align-items-center gap-1.5"
                      onClick={() => handleApprove(req.vendor_id, req.vendor_name)}
                    >
                      <CheckCircle size={14} /> [APPROVE & RESTORE SERVICES]
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectingRequest && (
        <RejectReactivationModal
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onSuccess={loadRequests}
        />
      )}
    </div>
  );
}

// ─── COMPONENT: MANUAL VENDOR REMINDER SECTION ─────────────────────────────
function ManualVendorReminderCard({ wallets, selectedVendorId, onSelectVendor, onSuccess, maxLimit }) {
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState(['SMS']);
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchResults, setDispatchResults] = useState(null);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const selectedVendor = wallets.find(w => (w.vendor_id || w.id) === selectedVendorId) || null;

  const filteredVendors = wallets.filter(w => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (w.vendor_name && w.vendor_name.toLowerCase().includes(q)) ||
      (w.vendor_id && w.vendor_id.toLowerCase().includes(q)) ||
      (w.phone && w.phone.toLowerCase().includes(q)) ||
      (w.email && w.email.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (selectedVendor) {
      setCustomMessage(getVendorReminderDefaultMessage(selectedVendor, maxLimit));
      setDispatchResults(null);
      setErrorNotice('');
      setSuccessNotice('');
    } else {
      setCustomMessage('');
      setDispatchResults(null);
    }
  }, [selectedVendorId]);

  const toggleChannel = (ch) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');
    setDispatchResults(null);

    if (!selectedVendor) {
      setErrorNotice('Please select a vendor first.');
      return;
    }
    if (channels.length === 0) {
      setErrorNotice('Please select at least one dispatch channel (SMS, WhatsApp, Email, or Portal).');
      return;
    }
    if ((channels.includes('SMS') || channels.includes('WhatsApp')) && !selectedVendor.phone) {
      setErrorNotice(`Vendor '${selectedVendor.vendor_name || selectedVendor.vendor_id}' has no phone number on record for SMS/WhatsApp.`);
      return;
    }
    if (channels.includes('Email') && !selectedVendor.email) {
      setErrorNotice(`Vendor '${selectedVendor.vendor_name || selectedVendor.vendor_id}' has no email address on record for Email.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_manual_vendor_reminder',
          vendor_id: selectedVendor.vendor_id || selectedVendor.id,
          channels: channels.join(','),
          message: customMessage.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResults(data.channel_results || {});
        setSuccessNotice(`Manual recharge reminder sent to ${selectedVendor.vendor_name || selectedVendor.vendor_id}.`);
        if (onSuccess) onSuccess();
      } else {
        setErrorNotice(data.error || 'Failed to dispatch manual reminder.');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onSelectVendor('');
    setSearch('');
    setDispatchResults(null);
    setErrorNotice('');
    setSuccessNotice('');
  };

  const bal = selectedVendor ? Number(selectedVendor.balance || 0) : 0;
  const isNeg = bal < 0;
  const formattedBal = isNeg ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`;
  const isSuspended = selectedVendor ? Number(selectedVendor.services_suspended) === 1 : false;

  return (
    <div
      id="manual-vendor-reminder-section"
      className="card p-3 mb-4 border-0 shadow-sm rounded-3"
      style={{ background: '#fff', borderLeft: '4px solid #2563eb' }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <Send size={18} className="text-primary" />
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
              MANUAL VENDOR REMINDER
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Select a particular vendor to manually send a wallet recharge reminder across SMS, WhatsApp, Email, or Portal.
            </div>
          </div>
        </div>
        {selectedVendor && (
          <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.75rem' }} onClick={handleCancel}>
            Clear Selection
          </button>
        )}
      </div>

      {/* Vendor Selection Section */}
      <div className="row g-3 mb-3">
        <div className="col-md-5">
          <label className="form-label text-muted small mb-1 fw-semibold">
            Search Vendor:
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-end-0">
              <Search size={14} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by name, ID, phone, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            />
          </div>
        </div>

        <div className="col-md-7">
          <label className="form-label text-muted small mb-1 fw-semibold">
            Select Vendor:
          </label>
          <select
            className="form-select form-select-sm fw-semibold"
            value={selectedVendorId}
            onChange={e => onSelectVendor(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option value="">-- Choose a vendor to remind ({filteredVendors.length} available) --</option>
            {filteredVendors.map(w => {
              const wBal = Number(w.balance || 0);
              const bStr = wBal < 0 ? `-₹${Math.abs(wBal).toLocaleString()}` : `₹${wBal.toLocaleString()}`;
              return (
                <option key={w.vendor_id || w.id} value={w.vendor_id || w.id}>
                  {w.vendor_name || w.vendor_id} ({w.vendor_id}) · Bal: {bStr} · {w.services_suspended ? '[HIDDEN]' : '[VISIBLE]'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selected Vendor Operational Profile */}
      {selectedVendor ? (
        <div className="p-3 mb-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="row g-2 align-items-center" style={{ fontSize: '0.78rem' }}>
            <div className="col-sm-6 col-md-3">
              <div className="text-muted small">Vendor Name:</div>
              <div className="fw-bold text-dark">{selectedVendor.vendor_name || selectedVendor.vendor_id}</div>
              <div className="text-muted small font-monospace">ID: {selectedVendor.vendor_id}</div>
            </div>

            <div className="col-sm-6 col-md-3">
              <div className="text-muted small">Vendor Type:</div>
              <span className="badge px-2 py-1 rounded-pill fw-semibold" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                {selectedVendor.vendor_type || 'Vehicle Vendor'}
              </span>
              <div className="mt-1">
                <span className="text-muted small">Visibility: </span>
                <span className={`badge ${isSuspended ? 'bg-danger' : 'bg-success'} ms-1`} style={{ fontSize: '0.65rem' }}>
                  {isSuspended ? 'HIDDEN' : 'VISIBLE'}
                </span>
              </div>
            </div>

            <div className="col-sm-6 col-md-3">
              <div className="text-muted small">Contact Info:</div>
              <div><Phone size={11} className="me-1 inline" /><strong>{selectedVendor.phone || <span className="text-danger small">No phone</span>}</strong></div>
              <div><Mail size={11} className="me-1 inline" /><strong>{selectedVendor.email || <span className="text-danger small">No email</span>}</strong></div>
            </div>

            <div className="col-sm-6 col-md-3">
              <div className="text-muted small">Current Wallet Balance:</div>
              <div className="fw-bold font-monospace" style={{ fontSize: '1rem', color: isNeg ? COLORS.danger : COLORS.success }}>
                {formattedBal}
              </div>
              <div className="text-muted small">
                Neg Bookings: <strong>{selectedVendor.negative_booking_count || 0} / {selectedVendor.max_negative_booking_limit || maxLimit || 2}</strong>
              </div>
              <div className="text-muted small mt-0.5">
                Reminders: <strong>{selectedVendor.initial_reminders_sent || 0} / {selectedVendor.max_initial_reminders || maxLimit || 2} (Auto)</strong>
                {Number(selectedVendor.manual_reminders_sent || 0) > 0 && (
                  <span className="ms-1 text-primary">· {selectedVendor.manual_reminders_sent} (Manual)</span>
                )}
              </div>
            </div>

            <div className="col-12 mt-2 pt-2 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <span className="text-muted small me-1">Escalation Status:</span>
                <span className="badge bg-warning-subtle text-dark border fw-bold" style={{ fontSize: '0.68rem' }}>
                  {selectedVendor.escalation_status || (selectedVendor.is_blocked ? 'WALLET BLOCKED' : 'ACTIVE')}
                </span>
              </div>
              <div>
                <span className="text-muted small me-1">Latest Recharge:</span>
                <span className="fw-semibold text-secondary" style={{ fontSize: '0.75rem' }}>
                  {selectedVendor.recharge_status || 'No recent recharge'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 mb-2 rounded-3 text-center text-muted border border-dashed" style={{ fontSize: '0.8rem', background: '#fafafa' }}>
          Please select a vendor above or click <strong>[SEND REMINDER]</strong> next to any vendor in the table below to load their wallet & escalation profile.
        </div>
      )}

      {/* Channels, Message Preview & Action Form */}
      {selectedVendor && (
        <form onSubmit={handleSend}>
          {errorNotice && (
            <div className="alert alert-danger py-2 px-3 small mb-3">
              {errorNotice}
            </div>
          )}

          {successNotice && (
            <div className="alert alert-success py-2 px-3 small mb-3 d-flex align-items-center gap-1.5">
              <CheckCircle size={14} /> {successNotice}
            </div>
          )}

          {dispatchResults && (
            <div className="p-2.5 mb-3 rounded-2 bg-light border" style={{ fontSize: '0.75rem' }}>
              <div className="fw-bold text-dark mb-1.5">Dispatch Results:</div>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(dispatchResults).map(([ch, info]) => {
                  const isSent = info.status === 'SENT' || info.status === 'DELIVERED';
                  return (
                    <span key={ch} className={`badge ${isSent ? 'bg-success' : 'bg-warning text-dark'} p-1.5`}>
                      {ch}: {info.status} {info.error ? `(${info.error})` : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label text-muted small mb-1 fw-bold">
                Channels:
              </label>
              <div className="d-flex flex-column gap-2 p-2.5 rounded-2 bg-light border">
                {['SMS', 'WhatsApp', 'Email', 'Portal'].map(ch => (
                  <label key={ch} className="d-flex align-items-center justify-content-between small cursor-pointer" style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        checked={channels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                      />
                      <span className="fw-semibold">{ch}</span>
                    </div>
                    {ch === 'SMS' && !selectedVendor.phone && <span className="text-danger small" style={{ fontSize: '0.65rem' }}>No Phone</span>}
                    {ch === 'WhatsApp' && !selectedVendor.phone && <span className="text-danger small" style={{ fontSize: '0.65rem' }}>No Phone</span>}
                    {ch === 'Email' && !selectedVendor.email && <span className="text-danger small" style={{ fontSize: '0.65rem' }}>No Email</span>}
                  </label>
                ))}
              </div>
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                SMS provider abstraction: returns PENDING_GATEWAY_CONFIG if SMS credentials are not configured.
              </small>
            </div>

            <div className="col-md-7">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-muted small mb-0 fw-bold">
                  Message Preview:
                </label>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => {
                    if (selectedVendor) {
                      setCustomMessage(getVendorReminderDefaultMessage(selectedVendor, maxLimit));
                    }
                  }}
                >
                  Reset Default
                </button>
              </div>
              <textarea
                className="form-control"
                rows={4}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                required
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={handleCancel} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm text-white fw-bold px-4 d-flex align-items-center gap-1.5 shadow-sm"
                disabled={submitting}
                style={{ background: COLORS.primary, border: 'none' }}
              >
                <Send size={13} /> {submitting ? 'Sending...' : 'SEND REMINDER'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── TAB 4: ALL VENDOR WALLETS & ESCALATION TAB ──────────────────────────────
function VendorWalletsTab() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxLimit, setMaxLimit] = useState(2);
  const [reminderFreq, setReminderFreq] = useState(2);
  const [maxReminders, setMaxReminders] = useState(2);
  const [alertChannels, setAlertChannels] = useState(['SMS', 'Email', 'WhatsApp', 'Portal']);
  const [savingSettings, setSavingSettings] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Modals
  const [suspendingVendor, setSuspendingVendor] = useState(null);
  const [remindingVendor, setRemindingVendor] = useState(null);

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
      if (dataS) {
        if (dataS.max_negative_bookings !== undefined) setMaxLimit(Number(dataS.max_negative_bookings));
        if (dataS.wallet_reminder_frequency_hours !== undefined) {
          let freq = parseFloat(dataS.wallet_reminder_frequency_hours);
          if (freq > 0 && freq <= 0.02) freq = 0.0167;
          setReminderFreq(freq);
        }
        if (dataS.max_initial_reminders !== undefined) setMaxReminders(Number(dataS.max_initial_reminders));
        if (dataS.wallet_alert_channels) {
          const chArr = typeof dataS.wallet_alert_channels === 'string' ? dataS.wallet_alert_channels.split(',').map(s => s.trim()) : dataS.wallet_alert_channels;
          if (Array.isArray(chArr) && chArr.length > 0) setAlertChannels(chArr);
        }
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

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setNotice('');
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_wallet_settings',
          max_negative_bookings: maxLimit,
          wallet_reminder_frequency_hours: reminderFreq,
          max_initial_reminders: maxReminders,
          wallet_alert_channels: alertChannels.join(',')
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotice('Global escalation settings updated successfully for all Admin & Super Admin views.');
        setTimeout(() => setNotice(''), 4500);
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_vendor_escalation_cron' })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Escalation cron completed.\nVendors processed: ${data.processed_count}\nReminders sent: ${data.reminders_sent}\nDecisions pending: ${data.suspension_decisions_notified}`);
        loadWallets();
      } else {
        alert(data.error || 'Failed to run escalation worker');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setRunningCron(false);
    }
  };

  const toggleChannel = (ch) => {
    setAlertChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  return (
    <div>
      {/* Global Wallet Escalation Policy Settings */}
      <div className="card p-3 mb-4 border-0 shadow-sm rounded-3" style={{ background: '#f8fafc', borderLeft: '4px solid #FF6333' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
              Authoritative Wallet Escalation & Reminder Configuration
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Single source of truth shared identically across Admin and Super Admin. Automatic reminders stop after maximum initial reminders; service suspension is STRICTLY MANUAL.
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-dark fw-bold d-flex align-items-center gap-1.5"
            onClick={handleRunCron}
            disabled={runningCron}
            style={{ fontSize: '0.75rem' }}
          >
            <RefreshCw size={12} className={runningCron ? 'spinner-border spinner-border-sm' : ''} />
            {runningCron ? 'Checking...' : 'Run Escalation Worker Now'}
          </button>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-md-3">
            <label className="form-label text-muted small mb-1">Max Negative Bookings:</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-control form-control-sm fw-bold text-center"
              value={maxLimit}
              onChange={e => setMaxLimit(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="col-sm-6 col-md-3">
            <label className="form-label text-muted small mb-1">Reminder Frequency:</label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={reminderFreq}
              onChange={e => setReminderFreq(parseFloat(e.target.value))}
            >
              <option value="0.0167">1 minute (Testing)</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours (Default)</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>

          <div className="col-sm-6 col-md-3">
            <label className="form-label text-muted small mb-1">Max Automatic Reminders:</label>
            <input
              type="number"
              min="1"
              max="5"
              className="form-control form-control-sm fw-bold text-center"
              value={maxReminders}
              onChange={e => setMaxReminders(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="col-sm-6 col-md-3">
            <button
              className="btn btn-sm w-100 fw-bold text-white shadow-sm"
              disabled={savingSettings}
              onClick={handleSaveSettings}
              style={{ background: COLORS.primary, border: 'none', height: '31px' }}
            >
              {savingSettings ? 'Saving...' : 'Save Escalation Settings'}
            </button>
          </div>

          <div className="col-12 mt-2 pt-2 border-top">
            <label className="form-label text-muted small me-3 mb-0">Active Escalation Channels:</label>
            {['SMS', 'Email', 'WhatsApp', 'Portal'].map(ch => (
              <label key={ch} className="me-3 small cursor-pointer" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="me-1"
                  checked={alertChannels.includes(ch)}
                  onChange={() => toggleChannel(ch)}
                />
                <span>{ch}</span>
              </label>
            ))}
          </div>
        </div>

        {notice && <div className="mt-2 text-success fw-bold small">{notice}</div>}
      </div>

      {/* Manual Vendor Reminder Section */}
      <ManualVendorReminderCard
        wallets={wallets}
        selectedVendorId={selectedVendorId}
        onSelectVendor={setSelectedVendorId}
        onSuccess={loadWallets}
        maxLimit={maxLimit}
      />

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Vendor Name', 'Type', 'Balance', 'Negative Bookings', 'Wallet Status', 'Service Visibility', 'Manual Actions'].map(h => (
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
                  const isSuspended = Number(w.services_suspended) === 1;

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className="px-3 py-3 fw-bold" style={{ color: COLORS.dark }}>
                        <div>{w.vendor_name || w.vendor_id}</div>
                        <div className="text-muted small font-monospace" style={{ fontSize: '0.68rem' }}>{w.vendor_id}</div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="badge px-2 py-1 rounded-pill fw-semibold" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem' }}>
                          {w.vendor_type || 'Vehicle Vendor'}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="fw-bold font-monospace" style={{ color: isNeg ? COLORS.danger : (bal < 1000 ? COLORS.warn : COLORS.success), fontSize: '0.9rem' }}>
                          {isNeg ? `-₹${Math.abs(bal).toLocaleString()}` : `₹${bal.toLocaleString()}`}
                        </span>
                        {isNeg && <span className="ms-1.5 px-1.5 py-0.5 rounded" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.6rem', fontWeight: 700 }}>NEG</span>}
                      </td>

                      <td className="px-3 py-3">
                        <span className="fw-bold" style={{ color: negCount >= limit ? '#dc2626' : '#64748b' }}>
                          {negCount} / {limit}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        {isBlocked ? (
                          <span className="badge px-2.5 py-1.5 rounded-pill fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.68rem' }}>
                            <ShieldAlert size={11} className="me-1 inline" /> WALLET BLOCKED
                          </span>
                        ) : isNeg ? (
                          <span className="badge px-2 py-1 rounded-pill fw-bold" style={{ background: '#fef9c3', color: '#ca8a04', fontSize: '0.68rem' }}>
                            NEGATIVE (GRACE)
                          </span>
                        ) : (
                          <span className="badge px-2.5 py-1.5 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.68rem' }}>
                            ACTIVE
                          </span>
                        )}
                        <div className="mt-1 d-flex flex-wrap gap-1 align-items-center">
                          <span className="badge bg-light text-secondary border fw-semibold" style={{ fontSize: '0.63rem' }}>
                            Reminders: {w.initial_reminders_sent || 0} / {w.max_initial_reminders || maxReminders || 2}
                          </span>
                          {Number(w.manual_reminders_sent || 0) > 0 && (
                            <span className="badge bg-primary-subtle text-primary border fw-semibold" style={{ fontSize: '0.63rem' }}>
                              Manual: {w.manual_reminders_sent}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service Visibility Column */}
                      <td className="px-3 py-3">
                        {isSuspended ? (
                          <div>
                            <span className="badge bg-danger text-uppercase px-2.5 py-1 fw-bold" style={{ fontSize: '0.68rem' }}>
                              SERVICES HIDDEN
                            </span>
                            <div className="text-muted small mt-0.5" style={{ fontSize: '0.68rem', maxWidth: '160px' }}>
                              {w.suspension_reason || 'Manual suspension'}
                            </div>
                            {w.reactivation_status === 'PENDING_REACTIVATION' && (
                              <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.62rem' }}>
                                Reactivation Requested
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-success-subtle text-success px-2.5 py-1 fw-bold" style={{ fontSize: '0.68rem' }}>
                            SERVICES VISIBLE
                          </span>
                        )}
                      </td>

                      {/* Manual Actions Column */}
                      <td className="px-3 py-3">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-primary fw-bold px-2 py-1 d-flex align-items-center gap-1"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedVendorId(w.vendor_id || w.id);
                              setRemindingVendor(w);
                            }}
                            title="Send manual wallet recharge reminder to this vendor"
                          >
                            <Send size={11} /> [SEND REMINDER]
                          </button>
                          {!isSuspended && (
                            <button
                              className="btn btn-sm btn-outline-danger fw-bold px-2 py-1"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setSuspendingVendor(w)}
                              title="Manually hide vendor services from public customer website"
                            >
                              [HIDE SERVICES]
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {wallets.length === 0 && <tr><td colSpan={7} className="text-center py-5 text-muted">No vendor wallets found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {suspendingVendor && (
        <HideServicesModal
          vendor={suspendingVendor}
          onClose={() => setSuspendingVendor(null)}
          onSuccess={loadWallets}
        />
      )}

      {remindingVendor && (
        <ManualReminderModal
          vendor={remindingVendor}
          onClose={() => setRemindingVendor(null)}
          onSuccess={loadWallets}
        />
      )}
    </div>
  );
}

// ─── TAB 5: TRANSACTION HISTORY TAB ──────────────────────────────────────────
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
        <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
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

// ─── TAB 6: PLATFORM REVENUE LEDGER TAB ───────────────────────────────────────
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
        <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
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

// ─── TAB 7: SUBSCRIPTION APPROVALS TAB ───────────────────────────────────────
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
            <div key={s.id} className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
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

// ─── TABS CONFIGURATION ──────────────────────────────────────────────────────
const TABS = [
  { id: 'recharge', label: 'Wallet Recharge Approvals', icon: <Wallet size={14} /> },
  { id: 'blocked_alerts', label: 'Blocked Booking Alerts', icon: <ShieldAlert size={14} /> },
  { id: 'reactivations', label: 'Reactivation Requests', icon: <RefreshCw size={14} /> },
  { id: 'wallets', label: 'All Vendor Wallets & Escalation', icon: <Users size={14} /> },
  { id: 'revenue', label: 'Platform Revenue Ledger', icon: <DollarSign size={14} /> },
  { id: 'subscriptions', label: 'Subscription Approvals', icon: <CheckCircle size={14} /> },
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
        <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>
          Vendor Wallet, Escalation & Approval Operations Center
        </h5>
        <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Authoritative control hub for wallet recharge approvals, blocked booking alerts, manual service suspension, and vendor reactivation requests.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="d-flex gap-1 mb-4 p-1 rounded-3" style={{ background: '#f1f5f9', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-bold flex-shrink-0"
            style={{
              fontSize: '0.8rem',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? COLORS.dark : '#64748b',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
            }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'recharge' && <WalletRechargeTab />}
      {activeTab === 'blocked_alerts' && <BlockedBookingAlertsTab />}
      {activeTab === 'reactivations' && <ReactivationRequestsTab />}
      {activeTab === 'wallets' && <VendorWalletsTab />}
      {activeTab === 'revenue' && <PlatformRevenueLedgerTab />}
      {activeTab === 'subscriptions' && <SubscriptionApprovalsTab />}
      {activeTab === 'history' && <TransactionHistoryTab />}
    </div>
  );
}
