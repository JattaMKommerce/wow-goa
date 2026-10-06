import React from 'react';
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, Download,
  Receipt, ArrowUpRight, ShieldCheck, FileText, ArrowRight
} from 'lucide-react';

export default function CustomerPaymentsTab({
  currentUser,
  bookings = [],
  onOpenBookingDetails
}) {
  // Bookings passed from CustomerPortalPage are already strictly isolated for the customer
  const myBookings = React.useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter(b => !b.parent_booking_id || String(b.parent_booking_id).trim() === '');
  }, [bookings]);

  const totalSpend = myBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || b.amount || 0), 0);
  const totalPaid = myBookings.reduce((sum, b) => sum + parseFloat(b.paid_amount || b.total_paid || 0), 0);
  const totalPending = myBookings.reduce((sum, b) => {
    const total = parseFloat(b.total_amount || b.amount || 0);
    const paid = parseFloat(b.paid_amount || b.total_paid || 0);
    const pending = parseFloat(b.pending_amount || (total > paid ? total - paid : 0));
    return sum + (b.status?.toLowerCase() !== 'cancelled' ? pending : 0);
  }, 0);

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            Payments & Invoices
          </h4>
          <p className="text-muted text-xs mb-0">
            Track paid receipts, pending pickup balances, security deposit records, and tax invoices.
          </p>
        </div>
      </div>

      {/* ─── Payment Summary Stat Cards ─── */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">Total Trip Spends</span>
              <div className="rounded-circle p-2 bg-primary bg-opacity-10 text-primary">
                <Receipt size={18} />
              </div>
            </div>
            <div className="fs-2 fw-black text-dark font-heading">
              ₹{totalSpend.toLocaleString('en-IN')}
            </div>
            <div className="text-xxs text-muted mt-1">Across all confirmed bookings</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-success text-uppercase tracking-wider">Total Paid Online</span>
              <div className="rounded-circle p-2 bg-success bg-opacity-10 text-success">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="fs-2 fw-black text-success font-heading">
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
            <div className="text-xxs text-success mt-1 fw-bold">✓ Settled & verified</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-danger text-uppercase tracking-wider">Balance Due on Pickup</span>
              <div className="rounded-circle p-2 bg-danger bg-opacity-10 text-danger">
                <Clock size={18} />
              </div>
            </div>
            <div className="fs-2 fw-black text-danger font-heading">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <div className="text-xxs text-danger mt-1 fw-bold">Payable at vehicle handover</div>
          </div>
        </div>
      </div>

      {/* ─── Payment Transactions Table ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <h6 className="fw-bold text-dark mb-0 font-heading">Payment History & Tax Invoices</h6>
          <span className="text-muted text-xxs">{myBookings.length} booking receipt(s)</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Invoice / Booking</th>
                <th>Service Name</th>
                <th>Payment Mode</th>
                <th>Total Fare</th>
                <th>Paid Amount</th>
                <th>Pending Balance</th>
                <th>Payment Status</th>
                <th className="text-end pe-4">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.map((b, idx) => {
                const totalAmt = parseFloat(b.total_amount || b.amount || 0);
                const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
                const pendingAmt = parseFloat(b.pending_amount || (totalAmt > paidAmt ? totalAmt - paidAmt : 0));
                const isFullPaid = paidAmt >= totalAmt && totalAmt > 0;

                return (
                  <tr key={b.id || idx}>
                    <td className="ps-4 fw-black text-dark font-heading">
                      #{b.id || b.booking_id || `INV-${1000 + idx}`}
                    </td>

                    <td>
                      <div className="fw-bold text-dark">{b.item_name || b.package_name || 'Self Drive Rental'}</div>
                      <div className="text-muted text-xxs">Date: {b.pickup_date || b.travel_date || 'Scheduled'}</div>
                    </td>

                    <td>
                      <span className="badge bg-light text-dark border text-xxs fw-bold">
                        {b.payment_mode || b.payment_method || 'Online Razorpay / UPI'}
                      </span>
                    </td>

                    <td className="fw-bold text-dark">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </td>

                    <td className="fw-black text-success">
                      ₹{paidAmt.toLocaleString('en-IN')}
                    </td>

                    <td className="fw-bold text-danger">
                      ₹{pendingAmt.toLocaleString('en-IN')}
                    </td>

                    <td>
                      {isFullPaid ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill text-xxs fw-bold">
                          Paid Full
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill text-xxs fw-bold">
                          Balance Pending
                        </span>
                      )}
                    </td>

                    <td className="text-end pe-4">
                      <button 
                        onClick={() => onOpenBookingDetails(b)}
                        className="btn btn-sm btn-light border text-dark fw-bold rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1 ms-auto"
                      >
                        <Download size={12} />
                        <span>Invoice</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {myBookings.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <CreditCard size={36} className="mb-2 text-muted opacity-50" />
                    <div>No payment records found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
