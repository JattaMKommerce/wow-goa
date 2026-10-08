import React, { useState } from 'react';
import { LogIn, LogOut, ConciergeBell, CheckCircle, Clock, Phone, Calendar, BedDouble, User, AlertTriangle, Building } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSFrontDesk({ mode = 'arrivals', currentUser, vendorHotels, vendorBookings }) {
  const today = new Date().toISOString().split('T')[0];
  const [search, setSearch] = useState('');
  const [checkinModal, setCheckinModal] = useState({
    show: false,
    booking: null,
    assignedRoom: '',
    checkinStatus: 'Checked In',
    mealPlan: 'Continental Breakfast Included'
  });

  const getBookings = () => {
    if (mode === 'arrivals') return vendorBookings.filter(b => b.pickup_date === today && b.status !== 'Cancelled');
    if (mode === 'departures') return vendorBookings.filter(b => b.drop_date === today && b.status !== 'Cancelled');
    // In-house: check-in date <= today and checkout date >= today
    return vendorBookings.filter(b => b.pickup_date <= today && b.drop_date >= today && b.status !== 'Cancelled');
  };

  const bookings = getBookings().filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.phone?.includes(search) || b.id?.includes(search)
  );

  const modeConfig = {
    arrivals: { title: "Today's Arrivals", subtitle: 'Guests checking in today', icon: <LogIn size={20} />, color: '#6c5ce7', emptyMsg: 'No arrivals scheduled for today' },
    departures: { title: "Today's Departures", subtitle: 'Guests checking out today', icon: <LogOut size={20} />, color: '#fd79a8', emptyMsg: 'No departures scheduled for today' },
    inhouse: { title: 'In-house Guests', subtitle: 'Currently staying guests', icon: <ConciergeBell size={20} />, color: '#0984e3', emptyMsg: 'No guests currently in-house' }
  };

  const cfg = modeConfig[mode];

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-4 p-2 d-flex align-items-center justify-content-center" style={{ background: `${cfg.color}20`, width: '48px', height: '48px' }}>
            <span style={{ color: cfg.color }}>{cfg.icon}</span>
          </div>
          <div>
            <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>{cfg.title}</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{bookings.length} {cfg.subtitle} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="position-relative">
          <input className="form-control form-control-sm rounded-pill ps-4" style={{ width: '240px' }} placeholder="Search by name, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <div className="mb-3 opacity-25">{cfg.icon}</div>
          <h5 className="text-muted">{cfg.emptyMsg}</h5>
        </div>
      ) : (
        <div className="row g-3">
          {bookings.map((b, i) => {
            const nights = b.pickup_date && b.drop_date ? Math.max(1, (new Date(b.drop_date) - new Date(b.pickup_date)) / 86400000) : b.booking_days;
            const paid = parseInt(b.amount_paid || 0);
            const total = parseInt(b.total_amount || b.total_paid || 0);
            const balance = total - paid;
            const customizations = (() => { try { return JSON.parse(b.traveller_details_json || '{}'); } catch { return {}; } })();

            return (
              <div key={b.id || i} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm h-100 p-4" style={{ background: '#fff' }}>
                  {/* Guest Header */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '46px', height: '46px', background: cfg.color, fontSize: '18px', flexShrink: 0 }}>
                      {(b.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>{b.name}</h6>
                      <div className="text-muted" style={{ fontSize: '0.73rem' }}><Phone size={10} className="me-1" />{b.phone}</div>
                    </div>
                    <span className="badge rounded-pill" style={{ background: balance > 0 ? '#fff0f0' : '#edf7f0', color: balance > 0 ? '#d63031' : '#00b894', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {balance > 0 ? `₹${balance.toLocaleString('en-IN')} due` : 'Fully Paid'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                      <Building size={13} className="text-muted" />
                      <span style={{ fontSize: '0.8rem' }}>{b.item_name || 'Hotel'}</span>
                      {customizations.room_type && <span className="text-muted" style={{ fontSize: '0.72rem' }}>• {customizations.room_type}</span>}
                    </div>
                    <div className="d-flex gap-2">
                      <div className="flex-grow-1 p-2 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>CHECK-IN</div>
                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{b.pickup_date}</div>
                      </div>
                      <div className="flex-grow-1 p-2 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>CHECK-OUT</div>
                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{b.drop_date}</div>
                      </div>
                      <div className="flex-grow-1 p-2 rounded-3 text-center" style={{ background: '#f8f9fa' }}>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>NIGHTS</div>
                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{nights}</div>
                      </div>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="d-flex align-items-center gap-2 mb-3 text-muted" style={{ fontSize: '0.78rem' }}>
                    <User size={13} />
                    {customizations.adults || 2} Adults
                    {customizations.children > 0 && `, ${customizations.children} Children`}
                  </div>

                  {/* Payment */}
                  <div className="p-2 rounded-3 mb-3" style={{ background: balance > 0 ? '#fff3f0' : '#edf7f0' }}>
                    <div className="d-flex justify-content-between">
                      <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Total: ₹{total.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Paid: ₹{paid.toLocaleString('en-IN')}</span>
                    </div>
                    {balance > 0 && <div className="text-danger fw-bold" style={{ fontSize: '0.78rem', marginTop: '2px' }}>Balance: ₹{balance.toLocaleString('en-IN')}</div>}
                  </div>

                  {/* Special Request */}
                  {customizations.special_request && (
                    <div className="alert py-2 px-3 mb-3 d-flex align-items-start gap-2" style={{ background: '#fff9e6', border: 'none', borderRadius: '8px', fontSize: '0.75rem' }}>
                      <AlertTriangle size={12} className="text-warning mt-0 flex-shrink-0" />
                      {customizations.special_request}
                    </div>
                  )}

                  {/* Room assignment badge if set */}
                  {b.assigned_room_no && (
                    <div className="d-flex align-items-center justify-content-between px-2 py-1 mb-2 rounded-2" style={{ background: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                      <span className="text-success fw-bold" style={{ fontSize: '0.74rem' }}>🚪 Room: {b.assigned_room_no}</span>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>{b.meal_plan || 'EP'}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                    {mode === 'arrivals' && (
                      <button 
                        onClick={() => {
                          setCheckinModal({
                            show: true,
                            booking: b,
                            assignedRoom: b.assigned_room_no || '',
                            checkinStatus: 'Checked In',
                            mealPlan: b.meal_plan || 'Continental Breakfast Included'
                          });
                        }}
                        className="btn btn-sm flex-grow-1 rounded-pill fw-bold" 
                        style={{ background: '#6c5ce7', color: '#fff', fontSize: '0.78rem' }}
                      >
                        <LogIn size={12} className="me-1" /> Assign Room & Check In
                      </button>
                    )}
                    {mode === 'departures' && (
                      <button 
                        onClick={async () => {
                          try {
                            await api.updateBookingStatus(b.id, 'Checked Out');
                            b.status = 'Checked Out';
                            window.dispatchEvent(new CustomEvent('new-booking-created'));
                            alert(`Guest ${b.name} checked out successfully!`);
                          } catch (err) {
                            alert('Check-out failed: ' + err.message);
                          }
                        }}
                        className="btn btn-sm flex-grow-1 rounded-pill fw-bold" 
                        style={{ background: '#fd79a8', color: '#fff', fontSize: '0.78rem' }}
                      >
                        <LogOut size={12} className="me-1" /> Check Out
                      </button>
                    )}
                    {mode === 'inhouse' && (
                      <>
                        <button 
                          onClick={() => {
                            setCheckinModal({
                              show: true,
                              booking: b,
                              assignedRoom: b.assigned_room_no || '',
                              checkinStatus: b.checkin_status || 'Checked In',
                              mealPlan: b.meal_plan || 'Continental Breakfast Included'
                            });
                          }}
                          className="btn btn-sm rounded-pill fw-bold" 
                          style={{ background: '#eef2ff', color: '#4f46e5', fontSize: '0.75rem' }}
                        >
                          Room #{b.assigned_room_no || 'Assign'}
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await api.updateBookingStatus(b.id, 'Completed');
                              b.status = 'Completed';
                              window.dispatchEvent(new CustomEvent('new-booking-created'));
                              alert(`Stay completed for ${b.name}!`);
                            } catch (err) {
                              alert('Action failed: ' + err.message);
                            }
                          }}
                          className="btn btn-sm flex-grow-1 rounded-pill fw-bold" 
                          style={{ background: '#0984e3', color: '#fff', fontSize: '0.78rem' }}
                        >
                          <ConciergeBell size={12} className="me-1" /> Complete Stay
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        alert(`Reservation Details:\nID: ${b.id}\nGuest: ${b.name}\nPhone: ${b.phone}\nRoom: ${b.assigned_room_no || 'Not Assigned'}\nCheck-in: ${b.pickup_date}\nCheck-out: ${b.drop_date}\nTotal: ₹${total.toLocaleString('en-IN')}\nStatus: ${b.status}`);
                      }}
                      className="btn btn-sm rounded-pill" 
                      style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.78rem' }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check-In / Room Assignment Modal */}
      {checkinModal.show && checkinModal.booking && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="card border-0 rounded-4 shadow-lg p-4" style={{ maxWidth: '440px', width: '92%', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}>🏨 Guest Check-In & Room</h5>
                <small className="text-muted">Booking #{checkinModal.booking.id} • {checkinModal.booking.name}</small>
              </div>
              <button onClick={() => setCheckinModal({ show: false, booking: null, assignedRoom: '', checkinStatus: 'Checked In', mealPlan: '' })} className="btn-close" />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Assigned Room Number / Suite</label>
              <input 
                type="text" 
                className="form-control rounded-3" 
                placeholder="e.g. Room 204 or Ocean Villa 3" 
                value={checkinModal.assignedRoom} 
                onChange={e => setCheckinModal(prev => ({ ...prev, assignedRoom: e.target.value }))}
                autoFocus
              />
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>This room number will immediately appear in the customer's live stay tracker.</small>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Check-In Status</label>
              <select 
                className="form-select rounded-3" 
                value={checkinModal.checkinStatus} 
                onChange={e => setCheckinModal(prev => ({ ...prev, checkinStatus: e.target.value }))}
              >
                <option value="Checked In">Checked In (Guest arrived & keys handed)</option>
                <option value="Room Ready">Room Ready (Awaiting Guest)</option>
                <option value="Checked Out">Checked Out</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">Meal Plan / Package</label>
              <input 
                type="text" 
                className="form-control rounded-3" 
                placeholder="e.g. Continental Breakfast Included" 
                value={checkinModal.mealPlan} 
                onChange={e => setCheckinModal(prev => ({ ...prev, mealPlan: e.target.value }))}
              />
            </div>

            <div className="d-flex gap-2">
              <button 
                type="button" 
                onClick={() => setCheckinModal({ show: false, booking: null, assignedRoom: '', checkinStatus: 'Checked In', mealPlan: '' })} 
                className="btn btn-light rounded-pill flex-grow-1"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await api.updateBookingCheckin({
                      booking_id: checkinModal.booking.id,
                      assigned_room_no: checkinModal.assignedRoom,
                      checkin_status: checkinModal.checkinStatus,
                      meal_plan: checkinModal.mealPlan
                    });
                    if (checkinModal.checkinStatus === 'Checked In') {
                      await api.updateBookingStatus(checkinModal.booking.id, 'Checked In');
                      checkinModal.booking.status = 'Checked In';
                    }
                    checkinModal.booking.assigned_room_no = checkinModal.assignedRoom;
                    checkinModal.booking.checkin_status = checkinModal.checkinStatus;
                    checkinModal.booking.meal_plan = checkinModal.mealPlan;
                    window.dispatchEvent(new CustomEvent('new-booking-created'));
                    setCheckinModal({ show: false, booking: null, assignedRoom: '', checkinStatus: 'Checked In', mealPlan: '' });
                    alert(`Check-in and room details updated successfully!`);
                  } catch (err) {
                    alert('Update failed: ' + err.message);
                  }
                }} 
                className="btn text-white rounded-pill flex-grow-1 fw-bold" 
                style={{ background: '#6c5ce7' }}
              >
                Save & Check In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
