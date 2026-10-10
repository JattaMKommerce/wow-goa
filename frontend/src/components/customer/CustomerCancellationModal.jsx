import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, DollarSign, Clock, HelpCircle } from 'lucide-react';
import * as api from '../../services/api';

export default function CustomerCancellationModal({
  booking,
  onClose,
  onCancelled
}) {
  const [loading, setLoading] = useState(true);
  const [calculation, setCalculation] = useState(null);
  const [reason, setReason] = useState('Change of travel plans');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!booking?.id) return;
    setLoading(true);
    setError('');
    api.calculateCancellationRefund(booking.id)
      .then(res => {
        if (res && (res.status === 'success' || res.refund_percentage !== undefined || res.calculation)) {
          setCalculation(res.calculation || res);
        } else {
          setError(res?.message || 'Failed to calculate refund.');
        }
      })
      .catch(err => {
        setError(err.message || 'Error connecting to refund calculator.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [booking?.id]);

  const handleConfirmCancel = async () => {
    const finalReason = reason === 'Other' ? (customReason.trim() || 'Other reason') : reason;
    if (!finalReason) {
      alert('Please specify a cancellation reason.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.customerCancelBooking(booking.id, finalReason);
      if (res && (res.status === 'success' || res.success)) {
        setSuccess(true);
        setTimeout(() => {
          if (onCancelled) onCancelled(res);
          if (onClose) onClose();
        }, 1800);
      } else {
        setError(res?.message || 'Cancellation request was rejected.');
      }
    } catch (err) {
      setError(err.message || 'Failed to process cancellation.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(13, 27, 46, 0.75)', zIndex: 1060 }}
      onClick={() => !submitting && onClose && onClose()}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header py-3 px-4 text-white" style={{ background: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-1.5 rounded-3 bg-danger bg-opacity-20 text-danger">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0" style={{ fontSize: '14px' }}>
                  Cancel Booking #{booking.id || booking.booking_id}
                </h6>
                <div className="text-white-50" style={{ fontSize: '11px' }}>
                  {booking.item_name || booking.package_name || 'Goa Service'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => !submitting && onClose && onClose()}
              disabled={submitting}
            />
          </div>

          <div className="modal-body p-4 text-start">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                  <span className="visually-hidden">Calculating refund...</span>
                </div>
                <div className="text-muted small">Evaluating vendor cancellation policy...</div>
              </div>
            ) : success ? (
              <div className="text-center py-4">
                <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex mb-3">
                  <CheckCircle2 size={40} />
                </div>
                <h5 className="fw-bold text-dark mb-1">Booking Cancelled Successfully</h5>
                <p className="text-muted small mb-0">
                  Your refund of <strong className="text-success">₹{Number(calculation?.refund_amount || 0).toLocaleString('en-IN')}</strong> ({calculation?.refund_percentage}%) has been processed to your payment method.
                </p>
              </div>
            ) : (
              <div>
                {error && (
                  <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3">
                    {error}
                  </div>
                )}

                {/* Refund Breakdown Card */}
                {calculation && (
                  <div className="card shadow-none border rounded-3 mb-3" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                      <span className="fw-bold text-dark text-xs">Financial Refund Breakdown</span>
                      <span className="badge bg-light text-dark border text-xxs">
                        {calculation.rule_applied || 'Active Policy'}
                      </span>
                    </div>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between text-xs mb-1.5">
                        <span className="text-muted">Total Customer Payment:</span>
                        <strong className="text-dark">₹{Number(calculation.customer_payment || 0).toLocaleString('en-IN')}</strong>
                      </div>

                      <div className="d-flex justify-content-between text-xs mb-1.5 text-danger">
                        <span>WOW GOA Platform Fee (10% • Non-refundable):</span>
                        <strong>-₹{Number(calculation.wow_goa_platform_fee || 0).toLocaleString('en-IN')}</strong>
                      </div>

                      <div className="d-flex justify-content-between text-xs mb-2 pt-1 border-top">
                        <span className="text-muted">Vendor Service Amount (90%):</span>
                        <span className="fw-bold text-dark">₹{Number(calculation.vendor_service_amount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="p-2.5 rounded-3 mb-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold text-success text-xs">
                              Calculated Refund to Customer
                            </div>
                            <div className="text-muted text-xxs">
                              {calculation.refund_percentage}% of Vendor Service Amount
                            </div>
                          </div>
                          <span className="fw-black text-success font-heading" style={{ fontSize: '18px' }}>
                            ₹{Number(calculation.refund_amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="text-xxs text-muted text-center">
                        Hours before service: <strong>{calculation.hours_before_service != null ? `${calculation.hours_before_service} hrs` : 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Selection */}
                <div className="mb-3">
                  <label className="form-label text-xs fw-bold text-dark mb-1">
                    Reason for Cancellation <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm text-xs"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Change of travel plans">Change of travel plans</option>
                    <option value="Flight delay / rescheduling">Flight delay / rescheduling</option>
                    <option value="Medical or personal emergency">Medical or personal emergency</option>
                    <option value="Accidental booking">Accidental booking</option>
                    <option value="Weather / seasonal issues">Weather / seasonal issues</option>
                    <option value="Other">Other reason (please describe below)</option>
                  </select>

                  {reason === 'Other' && (
                    <textarea
                      className="form-control form-control-sm text-xs mt-2"
                      rows="2"
                      placeholder="Please enter your reason for cancellation..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="p-2.5 rounded-2 bg-light border text-muted text-xxs mb-3 d-flex align-items-start gap-1.5">
                  <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    Warning: Cancelling this booking is permanent and immediately frees the reserved slot with the vendor.
                  </span>
                </div>
              </div>
            )}
          </div>

          {!loading && !success && (
            <div className="modal-footer border-top py-2.5 px-4 bg-light d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3 text-xs fw-bold rounded-pill"
                onClick={() => !submitting && onClose && onClose()}
                disabled={submitting}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger px-4 text-xs fw-bold rounded-pill shadow-sm"
                onClick={handleConfirmCancel}
                disabled={submitting}
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
