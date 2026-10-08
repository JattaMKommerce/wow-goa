import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Search, Car, Bike, Building, Phone, Key, Shield, MapPin, 
  CheckCircle2, Clock, AlertTriangle, Wifi, Navigation, Calendar, 
  HelpCircle, ExternalLink, Loader2, Copy, Check, RefreshCw, RotateCcw,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { trackVendorBooking } from '../../services/api';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function VendorBookingTrackerModal({
  isOpen,
  onClose,
  initialBookingId = '',
  initialPhone = '',
  vendorSlug = '',
  vendorSite = null
}) {
  const [bookingId, setBookingId] = useState(() => initialBookingId || '');
  const [phone, setPhone] = useState(() => initialPhone || '');

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [bookingList, setBookingList] = useState(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Core Search / Auto-Poll Fetcher
  const executeSearch = useCallback(async (isSilent = false, explicitId = null) => {
    const rawId = (explicitId !== null ? explicitId : (bookingId || '')).trim();
    const rawPhone = (phone || '').trim();

    if (!rawId && !rawPhone) {
      if (!isSilent) setError('Please enter your Booking ID or registered Mobile Number.');
      return;
    }

    // Normalize: strip leading # if user typed #TG-927965
    const cleanId = rawId.replace(/^#+/, '').trim();

    if (!isSilent) {
      setLoading(true);
      setError('');
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await trackVendorBooking(cleanId || rawId, rawPhone, vendorSlug);
      if (res && res.success) {
        if (res.multiple && Array.isArray(res.bookings) && res.bookings.length > 1 && !cleanId) {
          // Multiple bookings found for this phone number! Present selection list
          setBookingList(res.bookings);
          setTrackingData(null);
          setError('');
        } else if (res.booking) {
          setBookingList(null);
          setTrackingData(res);
          setError('');
          setLastUpdatedTime(new Date().toLocaleTimeString());

          // Persist tracked booking
          try {
            sessionStorage.setItem('tg_tracked_booking_id', res.booking.id || cleanId || rawId);
            sessionStorage.setItem('tg_tracked_phone', res.booking.phone || rawPhone);
          } catch (e) {}
        }
      } else {
        if (!isSilent) {
          setError(res?.error || 'No booking found matching your details. Please check ID or mobile number.');
        }
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Error communicating with tracking server.');
      }
    } finally {
      if (!isSilent) setLoading(false);
      setIsRefreshing(false);
    }
  }, [bookingId, phone, vendorSlug]);

  // Trigger search on explicit user form submit
  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    executeSearch(false);
  };

  // Select a specific booking when multiple exist for this phone number
  const handleSelectBooking = (selected) => {
    setBookingId(selected.id);
    setBookingList(null);
    setTrackingData({
      success: true,
      booking: selected,
      website: trackingData?.website || vendorSite
    });
    setLastUpdatedTime(new Date().toLocaleTimeString());
    try {
      sessionStorage.setItem('tg_tracked_booking_id', selected.id);
      sessionStorage.setItem('tg_tracked_phone', selected.phone || phone);
    } catch (e) {}
  };

  // Explicit Track Another action: cleanly resets tracked result, form inputs, and storage
  const handleTrackAnother = () => {
    setTrackingData(null);
    setBookingList(null);
    setBookingId('');
    setPhone('');
    setError('');
    try {
      sessionStorage.removeItem('tg_tracked_booking_id');
      sessionStorage.removeItem('tg_tracked_phone');
      localStorage.removeItem('tg_tracked_booking_id');
      localStorage.removeItem('tg_tracked_phone');
    } catch (e) {}
  };

  // Sync initial props if changed
  useEffect(() => {
    if (initialBookingId) setBookingId(initialBookingId);
    if (initialPhone) setPhone(initialPhone);
  }, [initialBookingId, initialPhone]);

  // Auto-search once on modal open if bookingId and/or phone are explicitly provided
  useEffect(() => {
    if (isOpen && (initialBookingId || (initialPhone && bookingId)) && !trackingData) {
      executeSearch(true);
    }
  }, [isOpen, initialBookingId, initialPhone, bookingId, trackingData, executeSearch]);

  // Real-time background auto-update polling (runs every 3.5 seconds without page reload)
  useEffect(() => {
    if (!isOpen || !trackingData) return;

    const interval = setInterval(() => {
      executeSearch(true, trackingData?.booking?.id);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, trackingData, executeSearch]);

  // Event listener for cross-tab or in-app live booking sync
  useEffect(() => {
    if (!isOpen) return;

    const handleSyncEvent = (e) => {
      const evtId = e?.detail?.bookingId || e?.detail?.id;
      const currentCleanId = (bookingId || '').trim().replace(/^#+/, '').trim();
      if (!evtId || String(evtId).replace(/^#+/, '').trim() === currentCleanId) {
        executeSearch(true);
      }
    };

    window.addEventListener('tripgalileo-booking-sync', handleSyncEvent);
    window.addEventListener('booking-status-updated', handleSyncEvent);
    window.addEventListener('new-booking-created', handleSyncEvent);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'BOOKING_UPDATED') {
            executeSearch(true);
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('tripgalileo-booking-sync', handleSyncEvent);
      window.removeEventListener('booking-status-updated', handleSyncEvent);
      window.removeEventListener('new-booking-created', handleSyncEvent);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [isOpen, bookingId, executeSearch]);

  if (!isOpen) return null;

  const booking = trackingData?.booking;
  const site = trackingData?.website || vendorSite;
  const isHotel = booking && (booking.package_type?.toLowerCase().includes('hotel') || booking.assigned_room_no || booking.checkin_status !== 'Confirmed');

  // Stepper calculations - accurately reflect Completed & Handed Over states
  const isTripCompleted = booking?.status === 'Completed' || booking?.handover_status === 'Returned' || booking?.handover_status === 'Completed';
  const isTripHandedOver = booking?.status === 'Pickup' || booking?.handover_status === 'Handed Over' || booking?.handover_status === 'Active Trip';
  
  let resolvedVehicleStatus = 'Confirmed';
  if (isTripCompleted) {
    resolvedVehicleStatus = 'Returned';
  } else if (isTripHandedOver) {
    resolvedVehicleStatus = booking?.handover_status === 'Active Trip' ? 'Active Trip' : 'Handed Over';
  } else if (booking?.handover_status === 'Dispatched') {
    resolvedVehicleStatus = 'Dispatched';
  } else if (booking?.handover_status) {
    resolvedVehicleStatus = booking.handover_status;
  }

  const vehicleSteps = ['Confirmed', 'Dispatched', 'Handed Over', 'Active Trip', 'Returned'];
  const currentVehicleStepIdx = isTripCompleted ? 4 : (vehicleSteps.indexOf(resolvedVehicleStatus) !== -1 ? vehicleSteps.indexOf(resolvedVehicleStatus) : 0);

  const hotelStatus = booking?.checkin_status || 'Confirmed';
  const hotelSteps = ['Confirmed', 'Checked In', 'In House', 'Checked Out'];
  const currentHotelStepIdx = hotelSteps.indexOf(hotelStatus) !== -1 ? hotelSteps.indexOf(hotelStatus) : 0;

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(13,27,46,0.85)', backdropFilter: 'blur(6px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="modal-header border-0 px-4 py-3" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1A365D 100%)', color: '#ffffff' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle p-2 bg-warning text-dark d-flex align-items-center justify-content-center shadow-xs">
                <Search size={18} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold mb-0" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    Live Trip &amp; Handover Tracker
                  </h5>
                  {booking && (
                    <span className="badge rounded-pill bg-success bg-opacity-75 text-white text-xs d-flex align-items-center gap-1 px-2.5 py-1">
                      <span className="spinner-grow spinner-grow-sm text-light" style={{ width: '6px', height: '6px' }} role="status" />
                      Live Auto-Sync
                    </span>
                  )}
                </div>
                <p className="small mb-0" style={{ color: '#E2E8F0', opacity: 0.95 }}>
                  Real-time vehicle handover, fuel &amp; return schedule (auto-updates live)
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {booking && (
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm rounded-pill px-2.5 py-1 text-xs d-flex align-items-center gap-1"
                  onClick={() => executeSearch(false)}
                  title="Refresh status now"
                >
                  <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                </button>
              )}
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
            </div>
          </div>

          <div className="modal-body p-4 p-md-5" style={{ background: '#F8FAFC' }}>
            {/* Search Input Form */}
            {!trackingData && !bookingList && (
              <form onSubmit={handleSearch} className="mb-3">
                <div className="p-4 bg-white rounded-4 border shadow-xs mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold text-dark mb-0">Enter Booking Details to Track</h6>
                    <span className="badge bg-light text-secondary border text-xs">Real-time status</span>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Booking ID (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control rounded-3 py-2 px-3 fw-bold" 
                        placeholder="e.g. #TG-854020 or TG-854020"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        autoFocus
                      />
                      <span className="text-secondary" style={{ fontSize: '0.72rem' }}>Leave blank to see all bookings for your mobile</span>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Customer Mobile Number</label>
                      <input 
                        type="text" 
                        className="form-control rounded-3 py-2 px-3 fw-bold" 
                        placeholder="e.g. 915555555555 or 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <span className="text-secondary" style={{ fontSize: '0.72rem' }}>10 digits or with country code</span>
                    </div>
                  </div>
                  {error && (
                    <div className="alert alert-danger py-2 px-3 mt-3 mb-0 rounded-3 text-xs d-flex align-items-center gap-2">
                      <AlertTriangle size={15} />
                      <span>{error}</span>
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn w-100 text-white rounded-3 py-2.5 mt-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-xs"
                    style={{ background: '#FF6333' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    <span>{loading ? 'Locating Record...' : 'Track My Booking Details'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Multiple Bookings Selection View */}
            {!trackingData && bookingList && bookingList.length > 0 && (
              <div className="mb-3">
                <div className="p-4 bg-white rounded-4 border shadow-xs mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Select Booking to Track</h6>
                      <p className="text-muted text-xs mb-0">
                        Found {bookingList.length} bookings registered under mobile <strong className="text-dark">{phone}</strong>
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1"
                      onClick={() => { setBookingList(null); setError(''); }}
                    >
                      <ArrowLeft size={13} />
                      <span>Back to Search</span>
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-2.5">
                    {bookingList.map((b) => {
                      const isComplete = b.status === 'Completed' || b.handover_status === 'Returned';
                      return (
                        <div 
                          key={b.id}
                          onClick={() => handleSelectBooking(b)}
                          className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 transition-all"
                          style={{ cursor: 'pointer', borderColor: '#E2E8F0' }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle p-2 bg-white border d-flex align-items-center justify-content-center text-primary shadow-xs">
                              {b.type === 'hotel' ? <Building size={20} /> : (b.package_type?.toLowerCase().includes('bike') ? <Bike size={20} /> : <Car size={20} />)}
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="badge bg-dark rounded-pill px-2.5 py-0.5 text-xs font-monospace">#{b.id}</span>
                                <span className="fw-bold text-dark fs-6">{b.item_name || b.name || 'Booking'}</span>
                                <span className={`badge rounded-pill px-2 py-0.5 text-xs ${isComplete ? 'bg-success text-white' : 'bg-primary text-white'}`}>
                                  {isComplete ? '✓ Completed' : (b.handover_status || b.status || 'Active')}
                                </span>
                              </div>
                              <div className="text-muted text-xs mt-1">
                                <span>Guest: <strong className="text-dark">{b.name}</strong></span>
                                <span className="mx-2">•</span>
                                <span>Travel: <strong className="text-dark">{formatDisplayDate(b.pickup_date)}</strong> to <strong className="text-dark">{formatDisplayDate(b.drop_date)}</strong></span>
                              </div>
                            </div>
                          </div>

                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 text-xs fw-bold d-flex align-items-center gap-1 shadow-xs text-white flex-shrink-0"
                          >
                            <span>Track Live</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Result View */}
            {booking && (
              <div>
                {/* Customer & Booking Banner */}
                <div className="p-3 bg-white rounded-4 border shadow-xs mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark rounded-pill px-3 py-1.5 text-xs font-monospace">
                        Booking #{booking.id}
                      </span>
                      <span className={`badge rounded-pill px-2.5 py-1 text-xs fw-bold ${isTripCompleted ? 'bg-success text-white' : 'bg-primary text-white'}`}>
                        {isTripCompleted ? '✓ TRIP COMPLETED' : (booking.handover_status || booking.status || 'CONFIRMED')}
                      </span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-0.5 text-xs fw-bold">
                        ● Live Updated: {lastUpdatedTime || 'Just now'}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs d-flex align-items-center gap-1.5 shadow-sm"
                      style={{ 
                        background: '#0D1B2E', 
                        color: '#ffffff',
                        border: '1px solid #1E3A5F',
                        cursor: 'pointer'
                      }}
                      onClick={handleTrackAnother}
                      title="Clear current record and track another booking ID"
                    >
                      <RotateCcw size={12} />
                      <span>Track Another</span>
                    </button>
                  </div>

                  {/* Customer vs Vehicle Identification */}
                  <div className="row g-3 pt-2 text-xs">
                    <div className="col-md-6">
                      <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                        👤 Customer Details
                      </div>
                      <div className="fw-black text-dark fs-6">{booking.name || booking.customer_name || 'Guest Customer'}</div>
                      <div className="text-secondary fw-bold mt-0.5">
                        📱 Mobile: <span className="text-dark font-monospace">{booking.phone}</span>
                        {booking.email && !booking.email.includes('@guest.wowgoa.com') && (
                          <span className="text-muted fw-normal ms-2">• {booking.email}</span>
                        )}
                      </div>
                      {booking.license && (
                        <div className="text-muted mt-0.5">
                          Driving License: <span className="font-monospace text-dark">{booking.license}</span>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 border-start-md">
                      <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                        🚗 Vehicle Details
                      </div>
                      <div className="fw-black text-dark fs-6">{booking.item_name || booking.name || 'Vehicle'}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="text-muted">Plate:</span>
                        <span className="badge bg-warning text-dark border border-dark px-2.5 py-0.5 fw-black font-monospace">
                          {booking.assigned_vehicle_plate || 'Assigned on Handover'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ VEHICLE HANDOVER TRACKING PROGRESS ═══ */}
                {!isHotel ? (
                  <div>
                    {/* Stepper */}
                    <div className="p-3 bg-white rounded-4 border shadow-xs mb-3">
                      <div className="d-flex align-items-center justify-content-between position-relative px-2">
                        {vehicleSteps.map((s, idx) => {
                          const isDone = idx <= currentVehicleStepIdx;
                          const isCurrent = idx === currentVehicleStepIdx;
                          return (
                            <div key={s} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-xs shadow-xs transition-all"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  background: isCurrent ? (isTripCompleted ? '#10B981' : '#FF6333') : (isDone ? '#10B981' : '#E2E8F0'),
                                  color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                                  border: isCurrent ? '3px solid #FFEDD5' : 'none'
                                }}
                              >
                                {isDone && !isCurrent ? <Check size={16} strokeWidth={3} /> : (isTripCompleted && idx === 4 ? <Check size={16} strokeWidth={3} /> : idx + 1)}
                              </div>
                              <span 
                                className="text-center mt-1 text-xs fw-bold"
                                style={{
                                  color: isCurrent ? (isTripCompleted ? '#10B981' : '#FF6333') : (isDone ? '#0F172A' : '#64748B'),
                                  fontSize: '0.7rem',
                                  lineHeight: 1.2
                                }}
                              >
                                {s}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exact Handover Time & Return Deadline Card */}
                    <div className="p-3 bg-white rounded-4 border shadow-xs mb-3">
                      <div className="row g-3 text-xs">
                        {/* Handover Given Timestamp */}
                        <div className="col-md-6 border-end-md">
                          <div className="d-flex align-items-center gap-1.5 text-success fw-bold mb-1">
                            <Key size={15} />
                            <span>VEHICLE GIVEN TO CUSTOMER</span>
                          </div>
                          <div className="p-2.5 rounded-3 border" style={{ background: '#F8FAFC' }}>
                            <div className="text-secondary fw-semibold">Handover Date &amp; Exact Time:</div>
                            <div className="fw-black text-dark fs-6 mt-0.5">
                              {booking.handed_over_at ? (
                                `✓ ${booking.handed_over_at}`
                              ) : (
                                `📍 ${booking.pickup_date} at ${booking.pickup_time || '10:00 AM'}`
                              )}
                            </div>
                            <div className="text-secondary mt-1">Pickup Location: <strong className="text-dark">{booking.pickup_loc || 'Goa Delivery Hub'}</strong></div>
                          </div>
                        </div>

                        {/* Scheduled Return Deadline */}
                        <div className="col-md-6">
                          <div className="d-flex align-items-center gap-1.5 text-primary fw-bold mb-1">
                            <Clock size={15} />
                            <span>SCHEDULED RETURN TIME</span>
                          </div>
                          <div className="p-2.5 rounded-3 border" style={{ background: '#F8FAFC' }}>
                            <div className="text-secondary fw-semibold">Customer Return Due:</div>
                            <div className="fw-black text-primary fs-6 mt-0.5">
                              ⏰ {booking.drop_date} by {booking.drop_time || '10:00 AM'}
                            </div>
                            <div className="text-secondary mt-1">Drop Location: <strong className="text-dark">{booking.drop_loc || booking.pickup_loc || 'Goa Hub'}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Actual Return Recorded (if Completed) */}
                      {isTripCompleted && (
                        <div className="mt-2.5 pt-2.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 text-xs">
                          <div className="text-success fw-bold d-flex align-items-center gap-1.5">
                            <CheckCircle2 size={16} />
                            <span>Trip Completed & Vehicle Returned: {booking.returned_at || booking.drop_date}</span>
                          </div>
                          {booking.return_odometer && booking.handover_odometer && (
                            <span className="badge bg-light text-dark border">
                              Total Distance Driven: {Number(booking.return_odometer) - Number(booking.handover_odometer)} KM
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Handover Details Cards */}
                    <div className="row g-3 mb-3">
                      {/* Delivery Agent / Driver */}
                      <div className="col-md-6">
                        <div className="p-3 bg-white rounded-4 border h-100">
                          <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2">
                            <Car size={16} className="text-primary" />
                            <span>
                              {booking.driver_required == 1 ? 'ASSIGNED CHAUFFEUR' : 'DELIVERY & HANDOVER SPECIALIST'}
                            </span>
                          </div>
                          {booking.delivery_agent_name ? (
                            <div>
                              <div className="fw-black text-dark fs-6">{booking.delivery_agent_name}</div>
                              <div className="text-muted text-xs mt-0.5">
                                {booking.driver_required == 1 ? 'Trip Chauffeur' : 'Key Handover Specialist'}
                              </div>
                              {booking.delivery_agent_phone && (
                                <div className="mt-2">
                                  <a href={`tel:${booking.delivery_agent_phone}`} className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1">
                                    📞 Call: {booking.delivery_agent_phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted text-xs">
                              {booking.driver_required == 1 
                                ? 'Chauffeur details will be assigned before trip pickup.' 
                                : 'Handover specialist will meet you with the vehicle keys.'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Odometer, Fuel & Deposit */}
                      <div className="col-md-6">
                        <div className="p-3 bg-white rounded-4 border h-100">
                          <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2">
                            <Shield size={16} className="text-success" />
                            <span>HANDOVER INSPECTION</span>
                          </div>
                          <div className="d-flex justify-content-between small mb-1 pb-1 border-bottom">
                            <span className="text-muted">Start Odometer:</span>
                            <span className="fw-bold text-dark font-monospace">
                              {booking.handover_odometer ? `${booking.handover_odometer} KM` : 'Recorded on Handover'}
                            </span>
                          </div>
                          {booking.return_odometer && (
                            <div className="d-flex justify-content-between small mb-1 pb-1 border-bottom">
                              <span className="text-muted">Return Odometer:</span>
                              <span className="fw-bold text-dark font-monospace">{booking.return_odometer} KM</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between small mb-1 pb-1 border-bottom">
                            <span className="text-muted">Handover Fuel:</span>
                            <span className="fw-bold text-dark">
                              {booking.handover_fuel || 'To be recorded'}
                            </span>
                          </div>
                          {booking.return_fuel && (
                            <div className="d-flex justify-content-between small mb-1 pb-1 border-bottom">
                              <span className="text-muted">Return Fuel:</span>
                              <span className="fw-bold text-dark">{booking.return_fuel}</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between small">
                            <span className="text-muted">Security Deposit:</span>
                            <span className="fw-bold text-success">
                              ₹{booking.deposit_amount || 0} ({booking.deposit_status || 'Unpaid'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Support Buttons */}
                    <div className="d-flex gap-2">
                      <a 
                        href={`https://wa.me/${site?.whatsapp_number || site?.phone || '919822100000'}?text=${encodeURIComponent(`Hi, I am tracking booking #${booking.id} (${booking.item_name}). Need assistance.`)}`}
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-success flex-grow-1 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1 shadow-xs"
                      >
                        💬 Chat with Host ({site?.site_title || 'Vendor'})
                      </a>
                      <a 
                        href={`tel:${site?.phone || '9822100000'}`} 
                        className="btn btn-dark flex-grow-1 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1"
                      >
                        📞 24/7 Roadside Help ({site?.phone || 'Support'})
                      </a>
                    </div>
                  </div>
                ) : (
                  /* ═══ HOTEL GUEST STAY TRACKING ═══ */
                  <div>
                    {/* Stepper */}
                    <div className="p-3 bg-white rounded-4 border shadow-xs mb-3">
                      <div className="d-flex align-items-center justify-content-between position-relative px-3">
                        {hotelSteps.map((s, idx) => {
                          const isDone = idx <= currentHotelStepIdx;
                          const isCurrent = idx === currentHotelStepIdx;
                          return (
                            <div key={s} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-xs shadow-xs"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  background: isCurrent ? '#008080' : (isDone ? '#10B981' : '#E2E8F0'),
                                  color: isDone || isCurrent ? '#FFFFFF' : '#64748B'
                                }}
                              >
                                {isDone && !isCurrent ? <Check size={16} strokeWidth={3} /> : idx + 1}
                              </div>
                              <span 
                                className="text-center mt-1 text-xs fw-semibold"
                                style={{ color: isCurrent ? '#008080' : (isDone ? '#0F172A' : '#94A3B8'), fontSize: '0.68rem' }}
                              >
                                {s}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Room & Digital Concierge Card */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="p-3 bg-white rounded-4 border h-100">
                          <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2">
                            <Key size={16} className="text-teal" style={{ color: '#008080' }} />
                            <span>ROOM ASSIGNMENT</span>
                          </div>
                          <div className="mb-2">
                            <div className="text-xs text-muted">Assigned Room / Suite:</div>
                            <div className="fs-5 fw-bold text-dark">
                              {booking.assigned_room_no || 'Assigned at Check-in'}
                            </div>
                          </div>
                          <div className="text-xs text-muted pt-2 border-top">
                            Check-in: {site?.hotel_checkin_time || '01:00 PM'} • Check-out: {site?.hotel_checkout_time || '11:00 AM'}
                          </div>
                        </div>
                      </div>

                      {/* Digital WiFi & Concierge */}
                      <div className="col-md-6">
                        <div className="p-3 bg-white rounded-4 border h-100">
                          <div className="d-flex align-items-center gap-2 text-muted small fw-bold mb-2">
                            <Wifi size={16} className="text-primary" />
                            <span>GUEST HIGH-SPEED WI-FI</span>
                          </div>
                          <div className="small">
                            <span className="text-muted d-block text-xs">Network SSID:</span>
                            <span className="fw-bold font-monospace text-dark">{site?.hotel_wifi_network || 'Paradise_Guest_WiFi'}</span>
                          </div>
                          <div className="small mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-muted d-block text-xs">Password:</span>
                              <span className="fw-bold font-monospace text-dark">{site?.hotel_wifi_password || 'WelcomeToGoa'}</span>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-dark rounded-pill py-0 px-2 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(site?.hotel_wifi_password || 'WelcomeToGoa');
                                setCopiedWifi(true);
                                setTimeout(() => setCopiedWifi(false), 2000);
                              }}
                            >
                              {copiedWifi ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation and Call */}
                    <div className="d-flex gap-2">
                      {site?.google_maps_url ? (
                        <a 
                          href={site.google_maps_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn btn-outline-dark flex-grow-1 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1"
                        >
                          📍 Navigate to Hotel
                        </a>
                      ) : null}
                      <a 
                        href={`tel:${site?.phone || '9822100000'}`} 
                        className="btn btn-dark flex-grow-1 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1"
                      >
                        📞 Call Front Desk
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
