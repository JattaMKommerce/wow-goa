import React, { useState } from 'react';
import { Sparkles, AlertCircle, Building, MapPin, Calendar, Upload, X } from 'lucide-react';
import { uploadImage, updateHotelAvailability, updateBookingStatus } from '../../services/api';
import WalletRechargeRequiredModal from '../../components/vendor/WalletRechargeRequiredModal';

export default function HotelVendorDashboard({
  activeTab,
  hotels,
  onAddHotel,
  onUpdateHotel,
  onDeleteHotel,
  bookings,
  currentUser,
  onEditRequest
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [amenities, setAmenities] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [stars, setStars] = useState('3');
  const [rating, setRating] = useState('4.0');
  const [badge, setBadge] = useState('Standard');
  const [description, setDescription] = useState('');
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [blockedModal, setBlockedModal] = useState({ show: false, balance: 0 });
  
  const handleEditHotelClick = (h) => {
    setEditingHotelId(h.id);
    setName(h.name);
    setLocation(h.location);
    setPrice(h.price);
    setAmenities(Array.isArray(h.amenities) ? h.amenities.join(', ') : h.amenities);
    setStars(h.stars);
    setRating(h.rating);
    setBadge(h.badge);
    setDescription(h.description);
    setImageUrls(h.image || h.image_url || '');
    if (onEditRequest) onEditRequest(h);
  };

  const [showBillingModal, setShowBillingModal] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState(null); // stores the hotel object
  const [blockedDatesInput, setBlockedDatesInput] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);

  const vendorHotels = hotels || [];

  const isMyHotelBooking = (b) => {
    if (vendorHotels.some(h => h.id === b.item_id)) return true;
    if (b.item_id && b.item_id.startsWith('craft-')) {
      try {
        const cust = JSON.parse(b.customizations || '{}');
        if (cust.hotel && vendorHotels.some(h => h.id === cust.hotel.id)) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  };

  const handleToggle = (id) => {
    // Add logic here if needed
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openAvailabilityModal = (hotel) => {
    setAvailabilityModal(hotel);
    
    // Parse existing blocked dates to show in textarea
    let existing = [];
    if (hotel.blocked_dates) {
      try {
        existing = typeof hotel.blocked_dates === 'string' ? JSON.parse(hotel.blocked_dates) : hotel.blocked_dates;
      } catch(e) {}
    }
    setBlockedDatesInput(Array.isArray(existing) ? existing.join('\n') : '');
  };

  const handleSaveAvailability = async () => {
    if (!availabilityModal) return;
    setSavingAvailability(true);
    try {
      // Parse textarea lines into array of dates
      const datesArray = blockedDatesInput.split('\n').map(d => d.trim()).filter(Boolean);
      await updateHotelAvailability(availabilityModal.id, datesArray);
      alert('Availability updated successfully!');
      setAvailabilityModal(null);
      window.location.reload(); // Refresh to get latest data
    } catch (err) {
      alert('Error updating availability: ' + err.message);
    } finally {
      setSavingAvailability(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setPrice('');
    setAmenities('');
    setImageUrls('');
    setImageFiles([]);
    setStars('3');
    setRating('4.0');
    setBadge('Standard');
    setDescription('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !location || !price) {
      setError('Please fill in required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      let finalImages = [];
      
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
           const uploadedUrl = await uploadImage(imageFiles[i]);
           if (uploadedUrl) finalImages.push(uploadedUrl);
        }
      }
      
      if (imageUrls) {
          const urls = imageUrls.split(',').map(u => u.trim()).filter(u => u);
          finalImages.push(...urls);
      }

      const payload = {
        name,
        location,
        price,
        amenities,
        images_json: finalImages,
        stars,
        rating,
        badge,
        description,
        vendor_id: currentUser?.id || 'admin'
      };

      if (editingHotelId) {
        await onUpdateHotel({ id: editingHotelId, ...payload });
        alert('Hotel updated successfully!');
      } else {
        await onAddHotel(payload);
        alert('Hotel listed successfully!');
      }

      resetForm();
      setEditingHotelId(null);
    } catch (err) {
      setError(err.message || 'Failed to save hotel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row g-4 animate-fade-in-up w-100 m-0">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          ADD HOTEL TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'add_hotel' && (
        <div className="col-12 col-lg-8 mx-auto">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
            <div className="d-flex align-items-center gap-3 position-relative z-1">
              <div className="bg-white p-2 rounded-circle shadow-sm" style={{ color: '#4CAF50' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="fw-extrabold mb-1 text-dark font-heading">Add New Hotel</h4>
                <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>Fill in details to list a new hotel property.</p>
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
                <div className="col-12 mb-2">
                  <label className="form-label small fw-bold text-secondary">Hotel Name *</label>
                  <input type="text" className="form-control premium-input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Taj Exotica Resort & Spa" required />
                </div>
                
                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Location *</label>
                  <select className="form-select premium-input-field" value={location} onChange={e => setLocation(e.target.value)} required>
                    <option value="" disabled>Select Location</option>
                    {[
                      'North Goa', 'South Goa', 'Panaji', 'Calangute', 'Baga', 'Anjuna',
                      'Vagator', 'Candolim', 'Sinquerim', 'Morjim', 'Arambol', 'Mapusa',
                      'Margao', 'Vasco da Gama', 'Colva', 'Benaulim', 'Palolem', 'Ponda',
                      'Agonda', 'Cavelossim'
                    ].sort().map(area => (
                      <option key={area} value={area}>{area}, Goa</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 mb-2">
                  <label className="form-label small fw-bold text-secondary">Price per Night (₹) *</label>
                  <input type="number" className="form-control premium-input-field" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 8500" required />
                </div>

                <div className="col-12 mb-2">
                  <label className="form-label small fw-bold text-secondary">Amenities (Comma separated)</label>
                  <input type="text" className="form-control premium-input-field" value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="e.g. Pool, Free WiFi, Breakfast Included" />
                </div>
                
                <div className="col-12 col-md-4 mb-2">
                  <label className="form-label small fw-bold text-secondary">Stars</label>
                  <select className="form-select premium-input-field" value={stars} onChange={e => setStars(e.target.value)}>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                
                <div className="col-12 col-md-4 mb-2">
                  <label className="form-label small fw-bold text-secondary">Rating</label>
                  <input type="number" step="0.1" max="5.0" min="1.0" className="form-control premium-input-field" value={rating} onChange={e => setRating(e.target.value)} placeholder="e.g. 4.5" />
                </div>
                
                <div className="col-12 col-md-4 mb-2">
                  <label className="form-label small fw-bold text-secondary">Badge</label>
                  <input type="text" className="form-control premium-input-field" value={badge} onChange={e => setBadge(e.target.value)} placeholder="e.g. Premium" />
                </div>

                <div className="col-12 mb-2">
                  <label className="form-label small fw-bold text-secondary">Description</label>
                  <textarea className="form-control premium-input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the hotel briefly" rows="2"></textarea>
                </div>

                <div className="col-12 mb-2">
                  <label className="form-label small fw-bold text-secondary">Hotel Images (Select multiple files)</label>
                  <div className="d-flex flex-column flex-md-row gap-2">
                    <input type="file" multiple accept="image/*" className="form-control premium-input-field" onChange={e => setImageFiles(Array.from(e.target.files))} />
                    <span className="d-flex align-items-center px-2 text-muted small">OR</span>
                    <input type="text" className="form-control premium-input-field" value={imageUrls} onChange={e => setImageUrls(e.target.value)} placeholder="Comma-separated Image URLs" />
                  </div>
                  {imageFiles.length > 0 && (
                    <div className="mt-2 small text-success">{imageFiles.length} file(s) selected</div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm mt-4" style={{ background: 'linear-gradient(90deg, #4CAF50, #2E7D32)' }}>
                {submitting ? 'Saving...' : editingHotelId ? 'Save Changes' : 'Submit Hotel Listing'}
              </button>
              {editingHotelId && (
                <button type="button" className="btn btn-outline-secondary w-100 mt-2 py-2 rounded-pill" onClick={() => { resetForm(); setEditingHotelId(null); }}>
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ACTIVE HOTELS TAB
      ────────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'hotels' && (
        <div className="col-12">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid rgba(76, 175, 80, 0.1)' }}>
            <h4 className="fw-extrabold mb-2 text-dark font-heading">Active Hotel Listings</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Manage your active hotel properties and pricing.
            </p>
          </div>

          <div className="card luxury-card p-4 h-100">
            {(!hotels || hotels.length === 0) ? (
              <p className="text-muted text-center py-5">No hotels submitted yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle table-hover small">
                  <thead className="table-light">
                    <tr>
                      <th>Hotel</th>
                      <th>Location</th>
                      <th>Base Price</th>
                      <th>Amenities</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.map(hotel => (
                      <tr key={hotel.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {(hotel.image || hotel.image_url) && <img src={hotel.image || hotel.image_url} alt={hotel.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />}
                            <span className="fw-bold text-success">{hotel.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="d-flex align-items-center gap-1 text-xs text-muted">
                            <MapPin size={12} /> {hotel.location}
                          </span>
                        </td>
                        <td className="fw-bold">₹{hotel.price}/night</td>
                        <td>
                          <span className="text-xs text-muted">{(Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : String(hotel.amenities || '')).substring(0, 40)}...</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button className="btn btn-sm btn-outline-primary py-1 px-2" onClick={() => handleEditHotelClick(hotel)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-outline-secondary py-1 px-2" onClick={() => openAvailabilityModal(hotel)}>
                              Manage Availability
                            </button>
                            <button className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => { if(window.confirm('Delete this hotel?')) onDeleteHotel(hotel.id); }}>
                              Delete
                            </button>
                          </div>
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
            <h4 className="fw-extrabold mb-1 font-heading text-dark">Hotel Bookings</h4>
            <p className="mb-0 text-secondary" style={{ fontSize: '0.9rem' }}>Recent reservations for your hotels.</p>
          </div>
          <div className="card luxury-card p-4">
              <div className="table-responsive">
                <table className="table align-middle table-hover small">
                  <thead className="table-light">
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Hotel Item</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(isMyHotelBooking).length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No bookings found for your listings.</td></tr>
                    ) : (
                      bookings.filter(isMyHotelBooking).map((b, i) => {
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
                            alert(`Booking #${b.id} updated to ${newSt}`);
                          } catch (err) {
                            if (err.code === 'WALLET_BLOCKED' || (err.message && err.message.includes('WALLET_BLOCKED'))) {
                              setBlockedModal({ show: true, balance: err.balance !== undefined ? err.balance : -800 });
                            } else {
                              alert('Failed to update: ' + err.message);
                            }
                          }
                        };

                        return (
                          <tr key={i}>
                            <td className="fw-bold">{b.id}</td>
                            <td>{b.name}</td>
                            <td>{b.phone}</td>
                            <td className="fw-bold text-success">{b.item_name}</td>
                            <td className="fw-bold text-primary">₹{b.total_paid}</td>
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
      {activeTab === 'billing' && (
        <div className="col-12 mt-2 text-start">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
            <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
              <div>
                <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Hotel Vendor Billing</h4>
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
                  This amount is billed monthly for your hotel vendor access. For any upgrades or changes, please contact the Superadmin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Availability Modal */}
      {availabilityModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Availability - {availabilityModal.name}</h5>
                <button type="button" className="btn-close" onClick={() => setAvailabilityModal(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Enter the dates when this hotel is <strong>fully booked or unavailable</strong>. 
                  Customers will not be able to select this hotel if their trip overlaps with these dates.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Blocked Dates (YYYY-MM-DD)</label>
                  <textarea 
                    className="form-control" 
                    rows="5" 
                    placeholder="2026-08-01&#10;2026-08-02&#10;2026-08-03"
                    value={blockedDatesInput}
                    onChange={(e) => setBlockedDatesInput(e.target.value)}
                  ></textarea>
                  <small className="text-muted mt-1 d-block">Enter one date per line.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAvailabilityModal(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveAvailability} disabled={savingAvailability}>
                  {savingAvailability ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
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
