import React, { useState, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, XCircle, Clock, Search, Filter,
  ShieldCheck, AlertCircle, RefreshCw, ExternalLink, ArrowRight,
  DollarSign, Landmark, Check, Send, Eye, FileText
} from 'lucide-react';
import * as api from '../../services/api';

export default function AdminPaymentManager({
  liveBookings = [],
  currentUser,
  onRefreshBookings
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settle Payout Modal State
  const [settlingBooking, setSettlingBooking] = useState(null);
  const [payoutUtr, setPayoutUtr] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // View Snapshot / Details Modal State
  const [inspectBooking, setInspectBooking] = useState(null);

  // Compute Financial Totals
  const metrics = useMemo(() => {
    let totalCustomerPayments = 0;
    let totalPlatformFees = 0;
    let totalVendorAmounts = 0;
    let pendingVerificationCount = 0;
    let pendingPayoutAmount = 0;
    let pendingPayoutCount = 0;

    liveBookings.forEach(b => {
      const custPay = parseFloat(b.customer_payment || b.total_paid || b.amount_paid || b.total_amount || 0);
      const platFee = parseFloat(b.wow_goa_platform_fee || (custPay * 0.10));
      const vendAmt = parseFloat(b.vendor_service_amount || (custPay * 0.90));
      const pVerif = String(b.payment_verification_status || 'Pending Verification').trim();
      const pPayout = String(b.vendor_payout_status || 'Pending').trim();

      totalCustomerPayments += custPay;
      totalPlatformFees += platFee;
      totalVendorAmounts += vendAmt;

      if (pVerif === 'Pending Verification' && (b.status || '').toLowerCase() !== 'cancelled') {
        pendingVerificationCount++;
      }
      if (pVerif === 'Approved' && pPayout === 'Pending' && (b.status || '').toLowerCase() !== 'cancelled') {
        pendingPayoutAmount += vendAmt;
        pendingPayoutCount++;
      }
    });

    return {
      totalCustomerPayments: Math.round(totalCustomerPayments),
      totalPlatformFees: Math.round(totalPlatformFees),
      totalVendorAmounts: Math.round(totalVendorAmounts),
      pendingVerificationCount,
      pendingPayoutAmount: Math.round(pendingPayoutAmount),
      pendingPayoutCount
    };
  }, [liveBookings]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return liveBookings.filter(b => {
      const pVerif = String(b.payment_verification_status || 'Pending Verification');
      const pPayout = String(b.vendor_payout_status || 'Pending');
      const isCancelled = (b.status || '').toLowerCase() === 'cancelled';

      // Tab Filtering
      if (filterTab === 'pending_verification' && pVerif !== 'Pending Verification') return false;
      if (filterTab === 'approved' && pVerif !== 'Approved') return false;
      if (filterTab === 'payout_pending' && (pPayout !== 'Pending' || pVerif !== 'Approved' || isCancelled)) return false;
      if (filterTab === 'payout_settled' && pPayout !== 'Settled') return false;
      if (filterTab === 'cancelled' && !isCancelled) return false;

      // Search Filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = String(b.id || b.booking_id || '').toLowerCase().includes(q);
        const nameMatch = String(b.name || b.customer_name || '').toLowerCase().includes(q);
        const phoneMatch = String(b.phone || b.customer_phone || '').includes(q);
        const custUtrMatch = String(b.customer_payment_utr || b.payment_reference || b.transaction_id || '').toLowerCase().includes(q);
        const vendUtrMatch = String(b.vendor_payout_utr || b.vendor_payout_reference || '').toLowerCase().includes(q);
        const vendMatch = String(b.vendor_id || '').toLowerCase().includes(q);
        return idMatch || nameMatch || phoneMatch || custUtrMatch || vendUtrMatch || vendMatch;
      }

      return true;
    });
  }, [liveBookings, filterTab, searchQuery]);

  // Handle Approve / Reject Payment
  const handleVerifyPayment = async (bookingId, status) => {
    setActionLoading(`verify-${bookingId}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.adminVerifyPayment(bookingId, status, `Verified by admin ${currentUser?.username || 'admin'}`);
      if (res && (res.success || res.status === 'success')) {
        setSuccessMsg(`Payment for Booking #${bookingId} marked as ${status}. Booking is now Confirmed.`);
        if (onRefreshBookings) onRefreshBookings();
      } else {
        setErrorMsg(res?.error || res?.message || 'Failed to update payment status.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error executing payment verification.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Submit Payout Settlement
  const handleSettlePayout = async (e) => {
    e.preventDefault();
    const cleanPayoutUtr = payoutUtr.trim();
    if (!cleanPayoutUtr) {
      alert('Please enter the Vendor Payout UTR / Bank Reference Number.');
      return;
    }

    const custUtr = String(settlingBooking.customer_payment_utr || settlingBooking.payment_reference || '').trim();
    if (custUtr && cleanPayoutUtr.toLowerCase() === custUtr.toLowerCase()) {
      setErrorMsg(`Vendor payout failed: Vendor Payout UTR cannot be identical to Customer Payment UTR (${custUtr}). Please transfer the 90% payout to the vendor and enter the NEW transaction reference generated by your bank.`);
      return;
    }

    setPayoutSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const bookingId = settlingBooking.id || settlingBooking.booking_id;
      const amount = parseFloat(settlingBooking.vendor_service_amount || (settlingBooking.customer_payment * 0.90) || 0);
      const res = await api.adminSettleVendorPayout(bookingId, cleanPayoutUtr, payoutNotes.trim(), amount);
      if (res && (res.success || res.status === 'success')) {
        setSuccessMsg(res.message || `Vendor payout recorded successfully (Vendor Payout UTR: ${cleanPayoutUtr}).`);
        setSettlingBooking(null);
        setPayoutUtr('');
        setPayoutNotes('');
        if (onRefreshBookings) onRefreshBookings();
      } else {
        setErrorMsg(`Vendor payout failed: ${res?.error || res?.message || 'Failed to record vendor payout.'}`);
      }
    } catch (e) {
      const msg = e.message || 'Error recording payout settlement.';
      setErrorMsg(msg.startsWith('Vendor payout failed:') ? msg : `Vendor payout failed: ${msg}`);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  return (
    <div className="p-4 text-start">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Payment &amp; Vendor Settlement Console</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Verify customer static QR payments, confirm reservations, and settle 90% vendor payouts.
          </p>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5"
          onClick={() => onRefreshBookings && onRefreshBookings()}
        >
          <RefreshCw size={13} /> Refresh Data
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show py-2 px-3 text-xs mb-3 rounded-3 d-flex align-items-center justify-content-between" role="alert">
          <div>
            <strong>✓ Success:</strong> {successMsg}
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show py-2 px-3 text-xs mb-3 rounded-3 d-flex align-items-center justify-content-between" role="alert">
          <div>
            <strong>⚠ {errorMsg.startsWith('Vendor payout failed:') ? '' : 'Error: '}</strong>{errorMsg}
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '10.5px' }}>Total Customer Collections</span>
              <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="fs-4 fw-black text-dark font-heading">
              ₹{metrics.totalCustomerPayments.toLocaleString('en-IN')}
            </div>
            <span className="text-muted text-xxs mt-1 d-block">100% full payments via Static QR</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '10.5px' }}>WOW GOA Platform Fee (10%)</span>
              <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="fs-4 fw-black text-success font-heading">
              ₹{metrics.totalPlatformFees.toLocaleString('en-IN')}
            </div>
            <span className="text-success text-xxs mt-1 d-block fw-semibold">Strictly non-refundable revenue</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '10.5px' }}>Vendor Service Amount (90%)</span>
              <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                <Landmark size={18} />
              </div>
            </div>
            <div className="fs-4 fw-black text-info font-heading">
              ₹{metrics.totalVendorAmounts.toLocaleString('en-IN')}
            </div>
            <span className="text-muted text-xxs mt-1 d-block">Allocated to service providers</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '10.5px' }}>Pending Settlements</span>
              <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                <Clock size={18} />
              </div>
            </div>
            <div className="fs-4 fw-black text-warning font-heading">
              ₹{metrics.pendingPayoutAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-muted text-xxs mt-1 d-block">
              {metrics.pendingPayoutCount} vendor {metrics.pendingPayoutCount === 1 ? 'payout' : 'payouts'} awaiting UTR
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Filter Pills */}
          <div className="d-flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${liveBookings.length})` },
              { id: 'pending_verification', label: `Pending Verification (${metrics.pendingVerificationCount})` },
              { id: 'approved', label: 'Payment Approved' },
              { id: 'payout_pending', label: `Payout Pending (${metrics.pendingPayoutCount})` },
              { id: 'payout_settled', label: 'Vendor Settled' },
              { id: 'cancelled', label: 'Cancelled / Refunded' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition ${filterTab === tab.id ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="position-relative" style={{ minWidth: '240px' }}>
            <Search size={14} className="position-absolute text-muted" style={{ left: '12px', top: '10px' }} />
            <input
              type="text"
              className="form-control form-control-sm rounded-pill ps-4 text-xs"
              placeholder="Search ID, Customer, UTR, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted" style={{ fontSize: '10.5px' }}>Booking ID</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted" style={{ fontSize: '10.5px' }}>Customer</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted" style={{ fontSize: '10.5px' }}>Vendor &amp; Service</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted" style={{ fontSize: '10.5px' }}>Customer Payment</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted" style={{ fontSize: '10.5px' }}>Customer Payment UTR</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted text-center" style={{ fontSize: '10.5px' }}>Payment Status</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted text-end" style={{ fontSize: '10.5px' }}>WOW GOA (10%)</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted text-end" style={{ fontSize: '10.5px' }}>Vendor Amount (90%)</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted text-center" style={{ fontSize: '10.5px' }}>Vendor Settlement &amp; Payout UTR</th>
                <th className="py-3 px-3 fw-bold text-uppercase text-muted text-end pe-3" style={{ fontSize: '10.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, idx) => {
                const bId = b.id || b.booking_id;
                const custPayment = parseFloat(b.customer_payment || b.total_paid || b.amount_paid || b.total_amount || 0);
                const platformFee = parseFloat(b.wow_goa_platform_fee || (custPayment * 0.10));
                const vendorAmount = parseFloat(b.vendor_service_amount || (custPayment * 0.90));
                const verifStatus = b.payment_verification_status || 'Pending Verification';
                const payoutStatus = b.vendor_payout_status || 'Pending';
                const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
                const custUtr = b.customer_payment_utr || b.payment_reference;
                const vendUtr = b.vendor_payout_utr || b.vendor_payout_reference;

                return (
                  <tr key={bId || idx}>
                    {/* Booking ID */}
                    <td className="px-3 py-2.5">
                      <div className="fw-black text-dark font-heading">#{bId}</div>
                      <span className="text-muted text-xxs d-block">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2.5">
                      <div className="fw-bold text-dark">{b.name || b.customer_name || 'Customer'}</div>
                      <div className="text-muted text-xxs">{b.phone || b.customer_phone || '—'}</div>
                    </td>

                    {/* Vendor & Service */}
                    <td className="px-3 py-2.5">
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                        {b.item_name || b.package_name || b.hotel_name || 'Service'}
                      </div>
                      <span className="badge bg-light text-muted border text-xxs">
                        Vendor: {b.vendor_id || 'vendor-1'}
                      </span>
                    </td>

                    {/* Customer Payment */}
                    <td className="px-3 py-2.5">
                      <div className="fw-black text-dark font-heading">
                        ₹{Math.round(custPayment).toLocaleString('en-IN')}
                      </div>
                      <span className="text-muted text-xxs">{b.payment_method || 'Static QR'}</span>
                    </td>

                    {/* Customer Payment UTR */}
                    <td className="px-3 py-2.5">
                      <div className="text-muted text-xxs mb-0.5">Cust → WOW GOA</div>
                      {custUtr ? (
                        <div className="d-flex align-items-center gap-1 font-monospace fw-bold text-primary" style={{ fontSize: '11px' }}>
                          <span className="badge font-monospace text-primary bg-primary bg-opacity-10 border border-primary border-opacity-25 px-1.5 py-0.5">
                            {custUtr}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-xxs">No UTR submitted</span>
                      )}
                      {(b.payment_screenshot || b.payment_proof) && (
                        <a
                          href={b.payment_screenshot || b.payment_proof}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-link p-0 text-xxs d-block text-start text-decoration-none mt-0.5"
                        >
                          View Screenshot ↗
                        </a>
                      )}
                    </td>

                    {/* Payment Verification Status */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`badge rounded-pill px-2.5 py-1 fw-bold text-xxs ${
                        verifStatus === 'Approved'
                          ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                          : verifStatus === 'Rejected'
                            ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                            : 'bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30'
                      }`}>
                        {verifStatus}
                      </span>
                    </td>

                    {/* WOW GOA Platform Fee */}
                    <td className="px-3 py-2.5 text-end">
                      <div className="fw-bold text-success font-heading">
                        ₹{Math.round(platformFee).toLocaleString('en-IN')}
                      </div>
                      <span className="text-muted text-xxs">10% Retained</span>
                    </td>

                    {/* Vendor Service Amount */}
                    <td className="px-3 py-2.5 text-end">
                      <div className="fw-bold text-dark font-heading">
                        ₹{Math.round(vendorAmount).toLocaleString('en-IN')}
                      </div>
                      <span className="text-muted text-xxs">90% Vendor Amount</span>
                    </td>

                    {/* Vendor Payout Status & UTR */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="text-muted text-xxs mb-0.5">WOW GOA → Vendor</div>
                      <span className={`badge rounded-pill px-2.5 py-1 fw-bold text-xxs ${
                        payoutStatus === 'Settled'
                          ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                          : 'bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25'
                      }`}>
                        {payoutStatus}
                      </span>
                      {vendUtr ? (
                        <div className="mt-1 font-monospace" title="Vendor Payout UTR">
                          <span className="badge bg-secondary bg-opacity-10 text-dark border px-1.5 py-0.5" style={{ fontSize: '10.5px' }}>
                            Payout UTR: {vendUtr}
                          </span>
                        </div>
                      ) : (
                        <div className="text-muted text-xxs mt-0.5">Payout Pending</div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-3 py-2.5 text-end pe-3">
                      <div className="d-flex align-items-center justify-content-end gap-1.5 flex-wrap">
                        {/* If Pending Verification: Show Approve and Reject */}
                        {verifStatus === 'Pending Verification' && !isCancelled && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success text-white fw-bold rounded-pill px-2.5 py-1 text-xxs shadow-xs"
                              disabled={actionLoading === `verify-${bId}`}
                              onClick={() => handleVerifyPayment(bId, 'Approved')}
                              title="Approve payment & confirm booking"
                            >
                              <Check size={11} className="me-0.5" /> Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-2 py-1 text-xxs shadow-xs"
                              disabled={actionLoading === `verify-${bId}`}
                              onClick={() => handleVerifyPayment(bId, 'Rejected')}
                              title="Reject payment"
                            >
                              <XCircle size={11} className="me-0.5" /> Reject
                            </button>
                          </>
                        )}

                        {/* If Verified & Payout Pending: Show Settle Vendor Amount */}
                        {verifStatus === 'Approved' && payoutStatus === 'Pending' && !isCancelled && (
                          <button
                            type="button"
                            className="btn btn-sm text-white fw-bold rounded-pill px-2.5 py-1 text-xxs shadow-xs"
                            style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)' }}
                            onClick={() => {
                              setSettlingBooking(b);
                              setPayoutUtr('');
                              setPayoutNotes('');
                            }}
                            title="Settle 90% vendor payout"
                          >
                            <Landmark size={11} className="me-0.5" /> Settle Vendor
                          </button>
                        )}

                        {/* If Cancelled: Show cancellation summary badge */}
                        {isCancelled && (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-xxs">
                            Refund: ₹{b.cancellation_refund_amount || 0} ({b.cancellation_refund_percentage || 0}%)
                          </span>
                        )}

                        {/* Inspect Details / Policy Snapshot */}
                        <button
                          type="button"
                          className="btn btn-sm btn-light border rounded-pill p-1 text-muted"
                          onClick={() => setInspectBooking(b)}
                          title="View Policy Snapshot & Financial Audit"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <CreditCard size={36} className="mb-2 opacity-30" />
                    <div className="fw-bold">No transactions found</div>
                    <div className="text-xxs">No records match the selected filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: Settle Vendor Payout ─── */}
      {settlingBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(13, 27, 46, 0.75)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-start">
              <div className="modal-header py-3 px-4 text-white" style={{ background: '#0D1B2E' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1.5 rounded-3 bg-warning bg-opacity-20 text-warning">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0" style={{ fontSize: '14px' }}>
                      Settle Vendor Payout — Booking #{settlingBooking.id || settlingBooking.booking_id}
                    </h6>
                    <div className="text-white-50" style={{ fontSize: '11px' }}>
                      Vendor ID: <strong>{settlingBooking.vendor_id || 'vendor-1'}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => !payoutSubmitting && setSettlingBooking(null)}
                  disabled={payoutSubmitting}
                />
              </div>

              <form onSubmit={handleSettlePayout}>
                <div className="modal-body p-4">
                  {/* Financial Breakdown: Customer Payment vs Vendor Settlement */}
                  <div className="rounded-3 mb-3 p-3 border" style={{ background: '#f8fafc' }}>
                    {/* 1. Customer Payment Box */}
                    <div className="p-2.5 rounded-3 mb-2 border" style={{ background: '#ffffff' }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark text-xs">Customer Payment (Customer → WOW GOA)</span>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-xxs">
                          Status: {settlingBooking.payment_verification_status || 'Approved'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-xs">
                        <span className="text-muted">Amount:</span>
                        <strong className="text-dark">₹{Number(settlingBooking.customer_payment || settlingBooking.total_amount || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-xs mt-1">
                        <span className="text-muted">Customer UTR:</span>
                        <span className="badge font-monospace text-primary bg-primary bg-opacity-10 border border-primary border-opacity-25 px-2 py-0.5 text-xs">
                          {settlingBooking.customer_payment_utr || settlingBooking.payment_reference || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* WOW GOA Platform Fee */}
                    <div className="d-flex justify-content-between text-xs py-1 px-1 text-success mb-2">
                      <span>WOW GOA Platform Fee (10% Retained):</span>
                      <strong>₹{Number(settlingBooking.wow_goa_platform_fee || (settlingBooking.customer_payment * 0.10) || 0).toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 2. Vendor Settlement Box */}
                    <div className="p-2.5 rounded-3 border" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark text-xs">Vendor Settlement (WOW GOA → Vendor)</span>
                        <span className="badge bg-warning bg-opacity-20 text-warning-emphasis border border-warning text-xxs">
                          Status: {settlingBooking.vendor_payout_status || 'Pending'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-xs">
                        <span className="text-muted">Vendor Amount to Pay:</span>
                        <strong className="text-primary fs-6 font-heading">
                          ₹{Number(settlingBooking.vendor_service_amount || (settlingBooking.customer_payment * 0.90) || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-dark mb-1">
                      Vendor Payout UTR / Bank Reference Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace fw-bold"
                      placeholder="Enter NEW bank transfer UTR (e.g. UTR-9823419082)"
                      value={payoutUtr}
                      onChange={(e) => setPayoutUtr(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="alert alert-warning py-1.5 px-2 mt-1.5 mb-0 text-xxs rounded-2 border">
                      <strong>⚠️ Note:</strong> Enter the <strong>NEW UTR</strong> generated by your bank when transferring ₹{Number(settlingBooking.vendor_service_amount || (settlingBooking.customer_payment * 0.90) || 0).toLocaleString('en-IN')} from WOW GOA to the vendor. <strong>Never</strong> enter the Customer Payment UTR ({settlingBooking.customer_payment_utr || settlingBooking.payment_reference}).
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-dark mb-1">
                      Settlement Notes (Optional)
                    </label>
                    <textarea
                      className="form-control form-control-sm text-xs"
                      rows="2"
                      placeholder="e.g. Transferred via HDFC Current Account to Vendor HDFC Account"
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2.5 px-4 bg-light d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-xs fw-bold"
                    onClick={() => setSettlingBooking(null)}
                    disabled={payoutSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white rounded-pill px-4 text-xs fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)' }}
                    disabled={payoutSubmitting}
                  >
                    {payoutSubmitting ? 'Recording Payout...' : 'Confirm & Record Payout'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Inspect Booking Policy Snapshot & Audit ─── */}
      {inspectBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(13, 27, 46, 0.75)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-start">
              <div className="modal-header py-3 px-4 text-white" style={{ background: '#0D1B2E' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1.5 rounded-3 bg-primary bg-opacity-20 text-primary">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0" style={{ fontSize: '14px' }}>
                      Financial &amp; Cancellation Policy Snapshot — Booking #{inspectBooking.id || inspectBooking.booking_id}
                    </h6>
                    <div className="text-white-50" style={{ fontSize: '11px' }}>
                      Immutable snapshot recorded at the time of booking
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setInspectBooking(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Financial Summary: Customer Payment vs WOW GOA Fee vs Vendor Settlement */}
                <div className="row g-2 mb-3">
                  <div className="col-sm-4">
                    <div className="p-2.5 rounded bg-light border h-100">
                      <span className="text-muted d-block text-xxs text-uppercase fw-bold">Customer Payment</span>
                      <strong className="text-dark fs-6 font-heading d-block mb-1">
                        ₹{Number(inspectBooking.customer_payment || inspectBooking.total_amount || 0).toLocaleString('en-IN')}
                      </strong>
                      <div className="text-xxs text-muted">Customer UTR:</div>
                      <div className="font-monospace text-primary fw-bold text-xs mb-1">
                        {inspectBooking.customer_payment_utr || inspectBooking.payment_reference || 'N/A'}
                      </div>
                      <span className={`badge rounded-pill text-xxs ${inspectBooking.payment_verification_status === 'Approved' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                        {inspectBooking.payment_verification_status || 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="p-2.5 rounded bg-light border h-100">
                      <span className="text-success d-block text-xxs text-uppercase fw-bold">WOW GOA Platform Fee (10%)</span>
                      <strong className="text-success fs-6 font-heading d-block mb-1">
                        ₹{Number(inspectBooking.wow_goa_platform_fee || (Number(inspectBooking.customer_payment || inspectBooking.total_amount || 0) * 0.10)).toLocaleString('en-IN')}
                      </strong>
                      <div className="text-muted text-xxs">Retained by WOW GOA</div>
                      <div className="text-success text-xxs fw-semibold mt-1">Non-Refundable</div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="p-2.5 rounded border h-100" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                      <span className="text-dark d-block text-xxs text-uppercase fw-bold">Vendor Settlement (90%)</span>
                      <strong className="text-dark fs-6 font-heading d-block mb-1">
                        ₹{Number(inspectBooking.vendor_service_amount || (Number(inspectBooking.customer_payment || inspectBooking.total_amount || 0) * 0.90)).toLocaleString('en-IN')}
                      </strong>
                      <div className="text-xxs text-muted">Vendor Payout UTR:</div>
                      <div className="font-monospace text-dark fw-bold text-xs mb-1">
                        {inspectBooking.vendor_payout_utr || inspectBooking.vendor_payout_reference || 'Not Settled Yet'}
                      </div>
                      <span className={`badge rounded-pill text-xxs ${inspectBooking.vendor_payout_status === 'Settled' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                        Status: {inspectBooking.vendor_payout_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Policy Snapshot Details */}
                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '13px' }}>Saved Vendor Cancellation Policy Snapshot</h6>
                {inspectBooking.cancellation_policy_snapshot ? (
                  <div className="p-3 rounded-3 bg-light border font-monospace text-xs mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <pre className="mb-0" style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                      {typeof inspectBooking.cancellation_policy_snapshot === 'string'
                        ? JSON.stringify(JSON.parse(inspectBooking.cancellation_policy_snapshot), null, 2)
                        : JSON.stringify(inspectBooking.cancellation_policy_snapshot, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 bg-light border text-muted text-xs mb-3">
                    No snapshot JSON recorded on legacy booking. Default vendor cancellation terms apply.
                  </div>
                )}

                {/* Cancellation Audit (If Cancelled) */}
                {(inspectBooking.status || '').toLowerCase() === 'cancelled' && (
                  <div className="p-3 rounded-3 mb-2" style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                    <div className="fw-bold text-danger text-xs mb-1">Cancellation Audit Record</div>
                    <div className="row g-2 text-xxs text-dark">
                      <div className="col-6">
                        <strong>Requested At:</strong> {inspectBooking.cancellation_requested_at || '—'}
                      </div>
                      <div className="col-6">
                        <strong>Applied Rule:</strong> {inspectBooking.cancellation_rule_applied || '—'}
                      </div>
                      <div className="col-6">
                        <strong>Refund %:</strong> {inspectBooking.cancellation_refund_percentage}%
                      </div>
                      <div className="col-6">
                        <strong>Refund Amount:</strong> ₹{inspectBooking.cancellation_refund_amount}
                      </div>
                      <div className="col-6">
                        <strong>Retained Platform Fee:</strong> ₹{inspectBooking.cancellation_platform_fee}
                      </div>
                      <div className="col-12">
                        <strong>Reason:</strong> {inspectBooking.cancellation_reason || '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top py-2 px-4 bg-light text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary rounded-pill px-3 text-xs"
                  onClick={() => setInspectBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
