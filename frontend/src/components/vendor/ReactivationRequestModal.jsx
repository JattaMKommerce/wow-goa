import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

export default function ReactivationRequestModal({ isOpen, onClose, wallet, vendorId, onSuccess }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const balance = Number(wallet?.balance || 0);
  const isPending = wallet?.reactivation_status === 'PENDING_REACTIVATION';
  const isRejected = wallet?.reactivation_status === 'REJECTED';
  const suspensionReason = wallet?.suspension_reason || 'Negative wallet balance confirmation limit reached';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim()) {
      alert('Please provide a message or reason for your reactivation request.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_service_reactivation',
          vendor_id: vendorId,
          message: message.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Reactivation request submitted successfully. Admin / Super Admin will review your account.' });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setFeedback(null);
          setMessage('');
        }, 2200);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to submit reactivation request.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'An error occurred while submitting your request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
      <div className="bg-white rounded-4 shadow-2xl p-4" style={{ maxWidth: '520px', width: '92%', border: '1px solid rgba(0,0,0,0.1)' }}>
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3" style={{ background: '#fef3c7', color: '#d97706' }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>Request Service Reactivation</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Submit a request to restore your customer service listings</p>
            </div>
          </div>
          <button className="btn btn-sm btn-light rounded-circle p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {feedback && (
          <div className={`p-3 rounded-3 mb-3 d-flex align-items-center gap-2 ${feedback.type === 'success' ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}`} style={{ fontSize: '0.82rem' }}>
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Status Highlights */}
        <div className="rounded-3 p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
            <span className="text-muted">Current Wallet Balance:</span>
            <span className={`fw-bold font-monospace ${balance < 0 ? 'text-danger' : 'text-success'}`}>
              {balance < 0 ? `-₹${Math.abs(balance).toLocaleString()}` : `₹${balance.toLocaleString()}`}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
            <span className="text-muted">Suspension Reason:</span>
            <span className="fw-semibold text-dark text-end" style={{ maxWidth: '240px' }}>{suspensionReason}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Reactivation Status:</span>
            <span>
              {isPending ? (
                <span className="badge bg-warning text-dark px-2 py-1"><Clock size={12} className="me-1 inline" /> Pending Admin Review</span>
              ) : isRejected ? (
                <span className="badge bg-danger px-2 py-1"><XCircle size={12} className="me-1 inline" /> Previously Rejected</span>
              ) : (
                <span className="badge bg-secondary px-2 py-1">Eligible to Submit</span>
              )}
            </span>
          </div>
        </div>

        {isRejected && wallet?.reactivation_rejection_reason && (
          <div className="rounded-3 p-3 mb-3 bg-danger-subtle border border-danger text-danger" style={{ fontSize: '0.78rem' }}>
            <div className="fw-bold mb-1 d-flex align-items-center gap-1">
              <AlertTriangle size={14} /> Previous Request Rejection Reason:
            </div>
            <div>"{wallet.reactivation_rejection_reason}"</div>
            <div className="mt-1 text-muted small">Please address this concern (e.g. recharge wallet or clear dues) before resubmitting.</div>
          </div>
        )}

        {isPending ? (
          <div className="rounded-3 p-3 mb-3 bg-info-subtle border border-info text-dark" style={{ fontSize: '0.8rem' }}>
            <div className="fw-bold mb-1">Your request is already pending review!</div>
            <div>Requested on: {wallet.reactivation_requested_at ? new Date(wallet.reactivation_requested_at).toLocaleString() : 'Recently'}</div>
            {wallet.reactivation_message && <div className="mt-1 text-muted italic">" {wallet.reactivation_message} "</div>}
            <div className="mt-2 text-secondary small">You may update your request message below if needed.</div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold text-dark small">
              Request Notes / Message for Admin:
            </label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="e.g. Wallet recharged via UTR 123456789. Balance is healthy and dues are cleared. Kindly approve reactivation so my services become visible."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ fontSize: '0.82rem', resize: 'vertical' }}
              disabled={submitting}
              required
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose} disabled={submitting}>
              Close
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white px-4 fw-bold d-flex align-items-center gap-1.5"
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : (
                <>
                  <Send size={14} /> {isPending ? 'Update Request' : 'Submit Reactivation Request'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
