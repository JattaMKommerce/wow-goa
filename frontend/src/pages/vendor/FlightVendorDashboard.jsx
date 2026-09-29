import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import VendorPaymentSettings from './VendorPaymentSettings';
import { updateBookingStatus } from '../../services/api';
import { calculateFlightDuration } from '../../utils/flightHelper';

export default function FlightVendorDashboard({
  activeTab,
  flights,
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  bookings,
  currentUser
}) {
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [price, setPrice] = useState('');
  const [fromLoc, setFromLoc] = useState('DEL');
  const [toLoc, setToLoc] = useState('BOM');
  const [duration, setDuration] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const vendorFlights = flights || [];

  const handleDepartureChange = (val) => {
    setDepartureTime(val);
    if (val && arrivalTime) {
      const autoDur = calculateFlightDuration(val, arrivalTime);
      if (autoDur) setDuration(autoDur);
    }
  };

  const handleArrivalChange = (val) => {
    setArrivalTime(val);
    if (departureTime && val) {
      const autoDur = calculateFlightDuration(departureTime, val);
      if (autoDur) setDuration(autoDur);
    }
  };

  const handleEditClick = (f) => {
    setEditingFlightId(f.id);
    setAirline(f.airline);
    setFlightNumber(f.flight_number);
    setDepartureTime(f.departure_time);
    setArrivalTime(f.arrival_time);
    setPrice(f.price);
    setFromLoc(f.from_loc);
    setToLoc(f.to_loc);
    setDuration(f.duration);
  };

  const isMyFlightBooking = (b) => {
    if (!b) return false;
    if (vendorFlights.some(f => String(f.id) === String(b.item_id) || (f.flight_number && (f.flight_number === b.flight_number || f.flight_number === b.item_id)))) return true;
    if (b.vendor_id && (String(b.vendor_id) === String(currentUser?.id) || b.vendor_id === currentUser?.username || b.vendor_id === 'vendor-4')) return true;
    if (b.item_id && typeof b.item_id === 'string' && b.item_id.startsWith('craft-')) {
      try {
        const cust = typeof b.customizations === 'string' ? JSON.parse(b.customizations || '{}') : (b.customizations || {});
        if (cust.flight && vendorFlights.some(f => String(f.id) === String(cust.flight.id) || f.flight_number === cust.flight.flight_number)) {
          return true;
        }
      } catch {}
    }
    if ((currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (b.type === 'flight' || (b.package_type && String(b.package_type).toLowerCase().includes('flight')) || Boolean(b.flight_number))) {
      return true;
    }
    return false;
  };

  const [error, setError] = useState('');

  const resetForm = () => {
    setAirline('');
    setFlightNumber('');
    setDepartureTime('');
    setArrivalTime('');
    setPrice('');
    setFromLoc('DEL');
    setToLoc('BOM');
    setDuration('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!airline || !flightNumber || !price) {
      setError('Please fill in required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        airline,
        flight_number: flightNumber,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        price,
        from_loc: fromLoc,
        to_loc: toLoc,
        duration,
        vendor_id: currentUser?.id || 'admin'
      };
      
      if (editingFlightId) {
        await onUpdateFlight(editingFlightId, payload);
        alert('Flight updated successfully!');
      } else {
        await onAddFlight(payload);
        alert('Flight listed successfully!');
      }
      resetForm();
      setEditingFlightId(null);
    } catch (err) {
      setError(err.message || 'Failed to save flight');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row g-4 animate-fade-in-up w-100 m-0">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          ADD FLIGHT TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'add_flight' && (
        <div className="col-12 col-lg-8 mx-auto">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)', border: '1px solid rgba(0, 184, 217, 0.2)' }}>
            <div className="d-flex align-items-center gap-3 position-relative z-1">
              <div className="bg-white p-2 rounded-circle shadow-sm" style={{ color: '#00B8D9' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="fw-extrabold mb-1 text-dark font-heading">Add New Flight</h4>
                <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>Fill in details to list a new flight route.</p>
              </div>
            </div>
          </div>

          <div className="card luxury-card p-4 p-md-5">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Airline Name *</label>
                  <input type="text" className="form-control premium-input-field" value={airline} onChange={e => setAirline(e.target.value)} placeholder="e.g. IndiGo" required />
                </div>
                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Flight Number *</label>
                  <input type="text" className="form-control premium-input-field" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="e.g. 6E-204" required />
                </div>
                
                <div className="col-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">From Location (Code)</label>
                  <input type="text" className="form-control premium-input-field" value={fromLoc} onChange={e => setFromLoc(e.target.value)} placeholder="e.g. DEL" required />
                </div>
                <div className="col-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">To Location (Code)</label>
                  <input type="text" className="form-control premium-input-field" value={toLoc} onChange={e => setToLoc(e.target.value)} placeholder="e.g. GOI" required />
                </div>

                <div className="col-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Departure Time</label>
                  <input type="time" className="form-control premium-input-field" value={departureTime} onChange={e => handleDepartureChange(e.target.value)} required />
                </div>
                <div className="col-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Arrival Time</label>
                  <input type="time" className="form-control premium-input-field" value={arrivalTime} onChange={e => handleArrivalChange(e.target.value)} required />
                </div>

                <div className="col-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Price (₹) *</label>
                  <input type="number" className="form-control premium-input-field" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 4500" required />
                </div>
                <div className="col-6 mb-2">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label small fw-bold text-secondary mb-0">Duration</label>
                    {duration && departureTime && arrivalTime && (
                      <span className="badge bg-light text-primary border" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        Auto
                      </span>
                    )}
                  </div>
                  <input type="text" className="form-control premium-input-field" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 2h 15m" required />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm mt-4" style={{ background: 'linear-gradient(90deg, #4CAF50, #2E7D32)' }}>
                {submitting ? 'Saving...' : editingFlightId ? 'Save Changes' : 'Submit Flight Listing'}
              </button>
              {editingFlightId && (
                <button type="button" className="btn btn-outline-secondary w-100 mt-2 py-2 rounded-pill" onClick={() => { resetForm(); setEditingFlightId(null); }}>
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ACTIVE FLIGHTS TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'flights' && (
        <div className="col-12">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid rgba(0, 82, 255, 0.1)' }}>
            <h4 className="fw-extrabold mb-2 text-dark font-heading">Active Flight Listings</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Manage your active flight routes and pricing.
            </p>
          </div>

          <div className="card luxury-card p-4 h-100">
            {(!flights || flights.length === 0) ? (
              <p className="text-muted text-center py-5">No flights submitted yet.</p>
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table align-middle table-hover small mb-0" style={{ minWidth: '620px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Airline</th>
                      <th>Flight No.</th>
                      <th>Route</th>
                      <th>Timings</th>
                      <th>Base Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map(flight => (
                      <tr key={flight.id}>
                        <td className="fw-bold text-primary">{flight.airline}</td>
                        <td><span className="badge bg-light text-dark border">{flight.flight_number}</span></td>
                        <td>
                          <span style={{ color: '#0052ff', fontWeight: 600 }}>{flight.from_loc}</span>
                          <span className="mx-2 text-muted">→</span>
                          <span style={{ color: '#0052ff', fontWeight: 600 }}>{flight.to_loc}</span>
                        </td>
                        <td>
                          <div className="text-xs text-muted">Dep: {flight.departure_time}</div>
                          <div className="text-xs text-muted">Arr: {flight.arrival_time}</div>
                          <div className="text-xs text-muted">Dur: {flight.duration}</div>
                        </td>
                        <td className="fw-bold">₹{flight.price}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary py-1 px-2 me-2" onClick={() => handleEditClick(flight)}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => { if(window.confirm('Delete this flight?')) onDeleteFlight(flight.id); }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          BOOKINGS TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="col-12">
          <div className="p-4 rounded-4 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <h4 className="fw-extrabold mb-1 font-heading text-dark">Flight Bookings</h4>
            <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>Recent reservations for your flights.</p>
          </div>
          <div className="card luxury-card p-4">
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table align-middle table-hover small mb-0" style={{ minWidth: '650px' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Flight Item</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(isMyFlightBooking).length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No bookings found for your listings.</td></tr>
                    ) : (
                      bookings.filter(isMyFlightBooking).map((b, i) => {
                        const s = (b.status || 'Pending').toLowerCase();
                        let badgeClass = 'bg-warning text-dark';
                        if (s === 'completed') badgeClass = 'bg-success text-white';
                        else if (s === 'confirmed') badgeClass = 'bg-primary text-white';
                        else if (s === 'cancelled' || s === 'rejected') badgeClass = 'bg-danger text-white';

                        const handleStatus = async (newSt) => {
                          try {
                            await updateBookingStatus(b.id, newSt);
                            b.status = newSt;
                            window.dispatchEvent(new CustomEvent('new-booking-created'));
                            window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId: b.id, status: newSt } }));
                            window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId: b.id, status: newSt } }));
                            alert(`Flight Booking #${b.id} updated to ${newSt}`);
                          } catch (err) {
                            alert('Failed to update: ' + err.message);
                          }
                        };

                        return (
                          <tr key={i}>
                            <td className="fw-bold">{b.id}</td>
                            <td>{b.name}</td>
                            <td>{b.phone}</td>
                            <td className="fw-bold text-primary">{b.item_name}</td>
                            <td className="fw-bold text-success">₹{b.total_paid}</td>
                            <td>
                              <span className={`badge ${badgeClass} text-capitalize px-2.5 py-1 rounded-pill fw-bold`}>
                                {b.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                {s !== 'completed' && s !== 'cancelled' && (
                                  <>
                                    {s !== 'confirmed' && (
                                      <button onClick={() => handleStatus('Confirmed')} className="btn btn-xs btn-outline-success py-0.5 px-2 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                                        Confirm
                                      </button>
                                    )}
                                    <button onClick={() => handleStatus('Completed')} className="btn btn-xs btn-success py-0.5 px-2 rounded-pill fw-bold text-white" style={{ fontSize: '0.72rem' }}>
                                      Complete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          BILLING TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'payment_settings' && (
        <VendorPaymentSettings currentUser={currentUser} />
      )}

      {activeTab === 'billing' && (
        <div className="col-12 mt-2 text-start">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
            <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
              <div>
                <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Flight Vendor Billing</h4>
                <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                  Your current subscription and billing information.
                </p>
              </div>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card luxury-card p-4">
                <h5 className="fw-bold mb-3">Subscription Overview</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Monthly Plan Price</span>
                  <span className="fw-bold fs-5 text-success">₹{currentUser?.billing_price || 0}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Status</span>
                  <span className="badge bg-success">Active</span>
                </div>
                <hr />
                <p className="text-muted small">
                  This amount is billed monthly for your flight vendor access. For any upgrades or changes, please contact the Superadmin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
