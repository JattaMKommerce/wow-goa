import React, { useState, useEffect } from 'react';
import { Star, RefreshCw, Search, ShieldCheck, MessageSquare, AlertCircle, Calendar, Hash, User, ArrowRight } from 'lucide-react';
import * as api from '../../services/api';

export default function AdminReviewsManagement({ portalTitle = 'Admin Portal', onSelectTab }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 5.0,
    star_5: 0,
    star_4: 0,
    star_3: 0,
    star_2: 0,
    star_1: 0
  });
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.fetchAdminReviewStats();
      if (data && data.stats) {
        setStats(data.stats);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch review data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTargetBookingTab = (review) => {
    const isSuperAdmin = typeof window !== 'undefined' && (window.location.pathname.startsWith('/superadmin') || window.location.pathname.startsWith('/super-admin'));
    if (!isSuperAdmin) return 'bookings';
    const type = String(review?.service_type || '').toLowerCase();
    const name = String(review?.service_name || '').toLowerCase();
    if (type.includes('flight') || name.includes('flight')) return 'flight_bookings';
    if (type.includes('hotel') || name.includes('hotel')) return 'hotel_bookings';
    if (type.includes('activity') || name.includes('activity') || name.includes('sightseeing')) return 'activity_bookings';
    if (type.includes('trip') || type.includes('package') || name.includes('package') || name.includes('craft')) return 'trip_bookings';
    return 'vehicle_bookings';
  };

  const filteredReviews = reviews.filter(r => {
    if (starFilter !== null && Number(r.rating) !== starFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const cName = String(r.customer_name || '').toLowerCase();
    const bId = String(r.booking_id || '').toLowerCase();
    const sName = String(r.service_name || '').toLowerCase();
    const cPhone = String(r.customer_phone || '').toLowerCase();
    return cName.includes(term) || bId.includes(term) || sName.includes(term) || cPhone.includes(term);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Page Title & Refresh */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-black text-dark mb-0 font-heading">
              Customer Reviews &amp; Ratings Management
            </h4>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-semibold text-xs">
              Live Database
            </span>
          </div>
          <p className="text-muted small mb-0">
            Real-time authentic feedback submitted by verified customers upon booking completion.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm align-self-start align-self-sm-auto"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 rounded-3 mb-4 d-flex align-items-center gap-2 text-xs">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── DYNAMIC STATISTICS CARDS ─── */}
      <div className="row g-3 mb-4">
        {/* Total Reviews */}
        <div className="col-6 col-md-3 col-lg-2">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #0D1B2E',
              cursor: 'pointer',
              outline: starFilter === null ? '2px solid #0D1B2E' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(null)}
            title="Click to view all reviews"
          >
            <span className="text-muted text-xs text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
              Total Reviews
            </span>
            <h3 className="fw-black text-dark mt-2 mb-0" style={{ fontSize: '1.75rem' }}>
              {Number(stats.total_reviews || 0).toLocaleString('en-IN')}
            </h3>
            <span className="text-muted mt-1 text-xxs">{starFilter === null ? 'All verified bookings' : 'Click to reset filter'}</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="col-6 col-md-3 col-lg-2">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white" style={{ borderLeft: '4px solid #FFB800' }}>
            <span className="text-muted text-xs text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>
              Average Rating
            </span>
            <div className="d-flex align-items-baseline gap-1.5 mt-2">
              <h3 className="fw-black text-dark mb-0" style={{ fontSize: '1.75rem' }}>
                {Number(stats.average_rating || 5.0).toFixed(1)}
              </h3>
              <Star size={18} fill="#FFB800" stroke="#FFB800" />
            </div>
            <span className="text-muted mt-1 text-xxs">Out of 5.0 stars</span>
          </div>
        </div>

        {/* 5-Star Reviews */}
        <div className="col-6 col-sm-4 col-md-2 col-lg">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #16A34A',
              cursor: 'pointer',
              outline: starFilter === 5 ? '2px solid #16A34A' : 'none',
              background: starFilter === 5 ? '#F0FDF4' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(prev => prev === 5 ? null : 5)}
            title="Filter by 5-star reviews"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-success text-xs fw-bold">5 Star</span>
              <Star size={13} fill="#16A34A" stroke="#16A34A" />
            </div>
            <h4 className="fw-bold text-dark mt-1 mb-0">
              {Number(stats.star_5 || 0).toLocaleString('en-IN')}
            </h4>
            <span className="text-muted text-xxs mt-1">{starFilter === 5 ? 'Active filter (tap to clear)' : 'Excellent'}</span>
          </div>
        </div>

        {/* 4-Star Reviews */}
        <div className="col-6 col-sm-4 col-md-2 col-lg">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #3B82F6',
              cursor: 'pointer',
              outline: starFilter === 4 ? '2px solid #3B82F6' : 'none',
              background: starFilter === 4 ? '#EFF6FF' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(prev => prev === 4 ? null : 4)}
            title="Filter by 4-star reviews"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-primary text-xs fw-bold">4 Star</span>
              <Star size={13} fill="#3B82F6" stroke="#3B82F6" />
            </div>
            <h4 className="fw-bold text-dark mt-1 mb-0">
              {Number(stats.star_4 || 0).toLocaleString('en-IN')}
            </h4>
            <span className="text-muted text-xxs mt-1">{starFilter === 4 ? 'Active filter (tap to clear)' : 'Very Good'}</span>
          </div>
        </div>

        {/* 3-Star Reviews */}
        <div className="col-6 col-sm-4 col-md-2 col-lg">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #F59E0B',
              cursor: 'pointer',
              outline: starFilter === 3 ? '2px solid #F59E0B' : 'none',
              background: starFilter === 3 ? '#FFFBEB' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(prev => prev === 3 ? null : 3)}
            title="Filter by 3-star reviews"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-warning text-xs fw-bold">3 Star</span>
              <Star size={13} fill="#F59E0B" stroke="#F59E0B" />
            </div>
            <h4 className="fw-bold text-dark mt-1 mb-0">
              {Number(stats.star_3 || 0).toLocaleString('en-IN')}
            </h4>
            <span className="text-muted text-xxs mt-1">{starFilter === 3 ? 'Active filter (tap to clear)' : 'Good'}</span>
          </div>
        </div>

        {/* 2-Star Reviews */}
        <div className="col-6 col-sm-4 col-md-2 col-lg">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #EA580C',
              cursor: 'pointer',
              outline: starFilter === 2 ? '2px solid #EA580C' : 'none',
              background: starFilter === 2 ? '#FFF7ED' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(prev => prev === 2 ? null : 2)}
            title="Filter by 2-star reviews"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-orange text-xs fw-bold" style={{ color: '#EA580C' }}>2 Star</span>
              <Star size={13} fill="#EA580C" stroke="#EA580C" />
            </div>
            <h4 className="fw-bold text-dark mt-1 mb-0">
              {Number(stats.star_2 || 0).toLocaleString('en-IN')}
            </h4>
            <span className="text-muted text-xxs mt-1">{starFilter === 2 ? 'Active filter (tap to clear)' : 'Fair'}</span>
          </div>
        </div>

        {/* 1-Star Reviews */}
        <div className="col-6 col-sm-4 col-md-2 col-lg">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white"
            style={{
              borderLeft: '4px solid #DC2626',
              cursor: 'pointer',
              outline: starFilter === 1 ? '2px solid #DC2626' : 'none',
              background: starFilter === 1 ? '#FEF2F2' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setStarFilter(prev => prev === 1 ? null : 1)}
            title="Filter by 1-star reviews"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-danger text-xs fw-bold">1 Star</span>
              <Star size={13} fill="#DC2626" stroke="#DC2626" />
            </div>
            <h4 className="fw-bold text-dark mt-1 mb-0">
              {Number(stats.star_1 || 0).toLocaleString('en-IN')}
            </h4>
            <span className="text-muted text-xxs mt-1">{starFilter === 1 ? 'Active filter (tap to clear)' : 'Poor'}</span>
          </div>
        </div>
      </div>

      {/* ─── REVIEWS TABLE ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        {/* Table Search & Count Toolbar */}
        <div className="p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 bg-light bg-opacity-50">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-dark text-sm">
              All Submitted Reviews
            </span>
            <span className="badge bg-secondary rounded-pill px-2 py-0.5 text-xxs">
              {filteredReviews.length} Records
            </span>
          </div>

          <div className="position-relative" style={{ maxWidth: '320px', width: '100%' }}>
            <Search size={15} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control form-control-sm rounded-pill ps-5 pe-3"
              placeholder="Search booking, customer, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Table Content (Strictly Read-Only - No Edit Buttons) */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.4px' }}>
              <tr>
                <th className="ps-4 py-3">Customer</th>
                <th className="py-3">Booking ID</th>
                <th className="py-3">Service / Vehicle</th>
                <th className="py-3">Rating</th>
                <th className="py-3" style={{ minWidth: '260px' }}>Review Text</th>
                <th className="py-3 pe-4 text-end">Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    <span className="text-muted small">Loading reviews from database...</span>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <MessageSquare size={36} className="text-muted mb-2 opacity-50" />
                    <div className="fw-bold text-dark">No Customer Reviews Found</div>
                    <div className="text-muted small">
                      {searchTerm ? 'No reviews match your search query.' : 'Reviews submitted by customers for completed bookings will appear here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map(r => (
                  <tr key={r.id || r.booking_id}>
                    {/* Customer */}
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: '#0D1B2E',
                            fontSize: '12px'
                          }}
                        >
                          {(r.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                            {r.customer_name || 'Guest'}
                          </div>
                          {r.customer_phone && (
                            <div className="text-muted text-xxs font-monospace">
                              {r.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Booking ID */}
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => {
                          const destTab = getTargetBookingTab(r);
                          const isSuperAdmin = typeof window !== 'undefined' && (window.location.pathname.startsWith('/superadmin') || window.location.pathname.startsWith('/super-admin'));
                          const target = isSuperAdmin
                            ? `/superadmin?tab=${destTab}&search=${encodeURIComponent(r.booking_id)}`
                            : `/admin?tab=bookings&search=${encodeURIComponent(r.booking_id)}`;
                          try {
                            sessionStorage.setItem('tg_booking_search', r.booking_id);
                          } catch (_) {}
                          if (onSelectTab) {
                            onSelectTab(destTab);
                          } else {
                            window.location.href = target;
                          }
                        }}
                        className="btn btn-sm btn-light border font-monospace px-2.5 py-1 text-xs fw-bold text-dark d-inline-flex align-items-center gap-1.5"
                        title={`View Booking #${r.booking_id} in Bookings Manager`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >
                        <span>#{r.booking_id}</span>
                        <ArrowRight size={12} className="text-primary" />
                      </button>
                    </td>

                    {/* Service */}
                    <td className="py-3">
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }} title={r.service_name}>
                        {r.service_name || 'WOW GOA Service'}
                      </div>
                      <span className="text-muted text-xxs">
                        {r.service_type || 'Vehicle'}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= r.rating ? '#FFB800' : 'none'}
                            stroke={s <= r.rating ? '#FFB800' : '#CBD5E1'}
                          />
                        ))}
                        <span className="ms-1 fw-bold text-dark text-xs">
                          {r.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Review Text */}
                    <td className="py-3">
                      {r.review_text ? (
                        <div className="text-dark small" style={{ lineHeight: '1.45', wordBreak: 'break-word' }}>
                          "{r.review_text}"
                        </div>
                      ) : (
                        <span className="text-muted fst-italic text-xs">
                          (No written comment provided)
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 pe-4 text-end text-muted font-monospace text-xs">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
