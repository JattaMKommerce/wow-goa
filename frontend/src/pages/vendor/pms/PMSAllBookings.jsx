import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Calendar, Phone, CreditCard, RefreshCw, ChevronDown, FileText } from 'lucide-react';
import { updateBookingStatus } from '../../../services/api';
import WalletRechargeRequiredModal from '../../../components/vendor/WalletRechargeRequiredModal';

const BOOKING_STATUSES = ['All', 'Confirmed', 'Pending', 'Checked In', 'Checked Out', 'Completed', 'Cancelled', 'No Show', 'Draft'];
const PAYMENT_STATUSES = ['All', 'Paid', 'Partially Paid', 'Unpaid', 'Refund Pending', 'Refunded'];
const SOURCES = ['All', 'Website', 'Manual', 'Walk-in', 'Phone'];

const STATUS_COLORS = {
  'Confirmed': ['#edf7f0', '#00b894'],
  'Checked In': ['#e3f2fd', '#0984e3'],
  'Checked Out': ['#f3f0ff', '#6c5ce7'],
  'Cancelled': ['#fff0f0', '#d63031'],
  'No Show': ['#fff3f0', '#e17055'],
  'Pending': ['#fff9e6', '#fdcb6e'],
  'Draft': ['#f8f9fa', '#6c757d'],
  'Completed': ['#edf7f0', '#00b894']
};

const PAYMENT_COLORS = {
  'Paid': ['#edf7f0', '#00b894'],
  'Partially Paid': ['#fff9e6', '#fdcb6e'],
  'Unpaid': ['#fff0f0', '#d63031'],
  'Refund Pending': ['#fff3f0', '#e17055'],
  'Refunded': ['#f3f0ff', '#6c5ce7']
};

export default function PMSAllBookings({ currentUser, vendorHotels, vendorBookings }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [blockedModal, setBlockedModal] = useState({ show: false, balance: 0 });
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = vendorBookings.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.phone?.includes(search) || b.id?.includes(search) || b.item_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchPayment = paymentFilter === 'All' || b.payment_status === paymentFilter;
    const matchFrom = !dateFrom || b.pickup_date >= dateFrom;
    const matchTo = !dateTo || b.pickup_date <= dateTo;
    return matchSearch && matchStatus && matchPayment && matchFrom && matchTo;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const totalRevenue = filtered.reduce((s, b) => s + parseInt(b.total_amount || b.total_paid || 0), 0);
  const totalReceived = filtered.reduce((s, b) => s + parseInt(b.amount_paid || 0), 0);

  const exportCSV = () => {
    const rows = [['Booking ID', 'Guest Name', 'Phone', 'Hotel', 'Check-in', 'Check-out', 'Nights', 'Total', 'Paid', 'Status', 'Payment']];
    filtered.forEach(b => {
      const nights = b.pickup_date && b.drop_date ? Math.max(1, (new Date(b.drop_date) - new Date(b.pickup_date)) / 86400000) : b.booking_days;
      rows.push([b.id, b.name, b.phone, b.item_name, b.pickup_date, b.drop_date, nights, b.total_amount || b.total_paid, b.amount_paid || 0, b.status, b.payment_status]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click();
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
      const target = vendorBookings.find(b => b.id === bookingId);
      if (target) target.status = newStatus;
      window.dispatchEvent(new CustomEvent('new-booking-created'));
      window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId, status: newStatus } }));
      window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId, status: newStatus } }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.postMessage({ type: 'BOOKING_UPDATED', bookingId, status: newStatus, timestamp: Date.now() });
        bc.close();
      }
      alert(`Booking #${bookingId} status updated to ${newStatus}`);
    } catch (err) {
      if (err.code === 'WALLET_BLOCKED' || (err.message && err.message.includes('WALLET_BLOCKED'))) {
        setBlockedModal({ show: true, balance: err.balance !== undefined ? err.balance : -800 });
      } else {
        alert('Failed to update status: ' + err.message);
      }
    }
  };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>All Bookings</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{filtered.length} bookings • ₹{totalRevenue.toLocaleString('en-IN')} total</p>
        </div>
        <button onClick={exportCSV} className="btn rounded-pill px-4 d-flex align-items-center gap-2" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.85rem' }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          ['Total Bookings', filtered.length, '#6c5ce7'],
          ['Confirmed', filtered.filter(b => ['Confirmed', 'Checked In'].includes(b.status)).length, '#00b894'],
          ['Cancelled', filtered.filter(b => b.status === 'Cancelled').length, '#d63031'],
          ['Total Value', `₹${totalRevenue.toLocaleString('en-IN')}`, '#0984e3'],
          ['Received', `₹${totalReceived.toLocaleString('en-IN')}`, '#00b894'],
          ['Pending', `₹${(totalRevenue - totalReceived).toLocaleString('en-IN')}`, '#e17055']
        ].map(([l, v, c]) => (
          <div key={l} className="col-6 col-md-2">
            <div className="card border-0 rounded-4 p-3 shadow-sm text-center" style={{ background: '#fff' }}>
              <div className="fw-bold" style={{ fontSize: '1.1rem', color: c }}>{v}</div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <div className="position-relative">
              <Search size={14} className="position-absolute" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input className="form-control form-control-sm rounded-pill ps-4" placeholder="Search guest, phone, booking ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="col-12 col-md-2">
            <select className="form-select form-select-sm rounded-pill" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              {BOOKING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <select className="form-select form-select-sm rounded-pill" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
              {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <input type="date" className="form-control form-control-sm rounded-pill" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From date" />
          </div>
          <div className="col-12 col-md-2">
            <input type="date" className="form-control form-control-sm rounded-pill" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To date" />
          </div>
          <div className="col-12 col-md-1">
            <button onClick={() => { setSearch(''); setStatusFilter('All'); setPaymentFilter('All'); setDateFrom(''); setDateTo(''); setPage(1); }} className="btn btn-sm w-100 rounded-pill" style={{ background: '#f0f2f5', color: '#495057' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Booking ID', 'Guest', 'Hotel / Room', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Paid', 'Status', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.4px', border: 'none', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-5 text-muted">No bookings found matching your filters</td></tr>
              ) : paginated.map(b => {
                const nights = b.pickup_date && b.drop_date ? Math.max(1, (new Date(b.drop_date) - new Date(b.pickup_date)) / 86400000) : (b.booking_days || 1);
                const [sBg, sCl] = STATUS_COLORS[b.status] || ['#f8f9fa', '#6c757d'];
                const [pBg, pCl] = PAYMENT_COLORS[b.payment_status] || ['#f8f9fa', '#6c757d'];
                return (
                  <tr key={b.id} style={{ fontSize: '0.82rem' }}>
                    <td className="py-3 px-4 fw-bold" style={{ color: '#0D1B2E' }}>#{(b.id || '').slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <div className="fw-bold">{b.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}><Phone size={10} className="me-1" />{b.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{b.item_name}</div>
                      {(() => {
                        try { const c = JSON.parse(b.traveller_details_json || '{}'); return c.room_type ? <div className="text-muted" style={{ fontSize: '0.72rem' }}>{c.room_type}</div> : null; } catch { return null; }
                      })()}
                    </td>
                    <td className="py-3 px-4">{b.pickup_date}</td>
                    <td className="py-3 px-4">{b.drop_date}</td>
                    <td className="py-3 px-4 text-center">{nights}</td>
                    <td className="py-3 px-4 fw-bold">₹{parseInt(b.total_amount || b.total_paid || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">₹{parseInt(b.amount_paid || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: sBg, color: sCl, fontSize: '0.7rem' }}>{b.status}</span></td>
                    <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: pBg, color: pCl, fontSize: '0.7rem' }}>{b.payment_status}</span></td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelectedBooking(b)} className="btn btn-sm rounded-pill px-2 py-0" style={{ background: '#f0f2f5', fontSize: '0.75rem' }}>
                        <Eye size={12} className="me-1" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="d-flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)} className="btn btn-sm rounded-circle" style={{ width: '32px', height: '32px', padding: 0, background: page === i + 1 ? '#0D1B2E' : '#f0f2f5', color: page === i + 1 ? '#fff' : '#495057', border: 'none', fontSize: '0.8rem' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '640px', maxWidth: '95vw', maxHeight: '90vh' }}>
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0">Booking Details — #{(selectedBooking.id || '').slice(-8).toUpperCase()}</h5>
              <button onClick={() => setSelectedBooking(null)} className="btn btn-sm btn-link text-muted p-0"><XCircle size={20} /></button>
            </div>
            <div className="p-4">
              {[
                ['Guest Name', selectedBooking.name], ['Phone', selectedBooking.phone], ['Hotel', selectedBooking.item_name],
                ['Check-in', selectedBooking.pickup_date], ['Check-out', selectedBooking.drop_date],
                ['Total Amount', `₹${parseInt(selectedBooking.total_amount || selectedBooking.total_paid || 0).toLocaleString('en-IN')}`],
                ['Amount Paid', `₹${parseInt(selectedBooking.amount_paid || 0).toLocaleString('en-IN')}`],
                ['Remaining', `₹${parseInt(selectedBooking.remaining_amount || 0).toLocaleString('en-IN')}`],
                ['Booking Status', selectedBooking.status || 'Draft'],
                ['Payment Status', selectedBooking.payment_status || 'Unpaid'],
                ['Payment Method', selectedBooking.payment_method || '—']
              ].map(([l, v]) => (
                <div key={l} className="d-flex py-2 border-bottom" style={{ borderColor: '#f0f2f5 !important', fontSize: '0.85rem' }}>
                  <div className="text-muted fw-semibold" style={{ width: '160px', flexShrink: 0 }}>{l}</div>
                  <div className="fw-bold">{v}</div>
                </div>
              ))}
              {(() => {
                try {
                  const d = JSON.parse(selectedBooking.traveller_details_json || '{}');
                  return d.special_request ? (
                    <div className="mt-3 p-3 rounded-3" style={{ background: '#fff9e6', fontSize: '0.82rem' }}>
                      <strong>Special Request:</strong> {d.special_request}
                    </div>
                  ) : null;
                } catch { return null; }
              })()}
            </div>
            <div className="p-4 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                {selectedBooking.status !== 'Completed' && selectedBooking.status !== 'Cancelled' && (
                  <>
                    {selectedBooking.status !== 'Confirmed' && (
                      <button 
                        onClick={() => handleStatusUpdate(selectedBooking.id, 'Confirmed')} 
                        className="btn btn-sm rounded-pill px-3 fw-bold text-white" 
                        style={{ background: '#00b894' }}
                      >
                        ✓ Confirm Booking
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'Completed')} 
                      className="btn btn-sm rounded-pill px-3 fw-bold text-white" 
                      style={{ background: '#0984e3' }}
                    >
                      ✓ Mark as Completed
                    </button>
                    <button 
                      onClick={() => { if (window.confirm('Cancel this booking?')) handleStatusUpdate(selectedBooking.id, 'Cancelled'); }} 
                      className="btn btn-sm rounded-pill px-3 fw-bold text-danger border border-danger-subtle bg-danger-subtle"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedBooking(null)} className="btn rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      <WalletRechargeRequiredModal
        show={blockedModal.show}
        balance={blockedModal.balance}
        onClose={() => setBlockedModal({ show: false, balance: 0 })}
      />
    </div>
  );
}
