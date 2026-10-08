import React, { useState, useEffect } from 'react';
import { Search, Users, Phone, Mail, Calendar, Cake, ShieldCheck, DollarSign } from 'lucide-react';
import * as api from '../../services/api';

export default function B2BCustomersTab({ partnerUser }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    if (!partnerUser) return;
    setLoading(true);
    try {
      const data = await api.fetchB2BCustomers(partnerUser.id, searchQuery);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load B2B customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [partnerUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  return (
    <div className="animate-fade-in">
      {/* Search Header */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white">
        <form onSubmit={handleSearch}>
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0 bg-light"
              placeholder="Search customers by name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-warning text-dark fw-bold px-4 text-xs font-heading">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="p-3.5 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 className="fw-bold text-dark mb-0 font-heading">Partner Guest Directory</h6>
            <span className="text-muted text-xs">All travelers and guests who booked tours with your agency</span>
          </div>
          <span className="badge bg-light text-dark text-xs fw-bold px-2.5 py-1 rounded-pill">
            {customers.length} Unique Guests
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
            <p className="text-muted text-xs mt-2">Loading partner guests...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="mb-0">No guests found in your partner history.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
              <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="ps-3 py-3">Guest Customer</th>
                  <th className="py-3">Contact Phone</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Date of Birth</th>
                  <th className="py-3 text-center">Bookings Count</th>
                  <th className="py-3">Total Volume</th>
                  <th className="pe-3 py-3 text-end">Last Booking Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={idx}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-warning bg-opacity-20 text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {(c.customer_name || 'G')[0]?.toUpperCase()}
                        </div>
                        <span className="fw-bold text-dark">{c.customer_name || 'Guest Traveler'}</span>
                      </div>
                    </td>
                    <td className="font-monospace text-muted">{c.customer_phone}</td>
                    <td className="text-muted">{c.customer_email || '—'}</td>
                    <td>
                      {c.date_of_birth ? (
                        <span className="badge bg-light text-dark text-xxs d-inline-flex align-items-center gap-1">
                          <Cake size={11} className="text-warning" />
                          <span>{c.date_of_birth}</span>
                        </span>
                      ) : (
                        <span className="text-muted text-xxs">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary bg-opacity-10 text-primary text-xs fw-bold px-2.5 py-1 rounded-pill">
                        {c.total_bookings} Trips
                      </span>
                    </td>
                    <td className="fw-bold text-dark">
                      ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="pe-3 text-end text-muted text-xxs">
                      {c.last_booking_date ? new Date(c.last_booking_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
