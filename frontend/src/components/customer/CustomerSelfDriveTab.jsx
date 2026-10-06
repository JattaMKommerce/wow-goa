import React, { useState } from 'react';
import {
  Compass, Car, Calendar, MapPin, Hotel, Check, ShieldCheck,
  Download, Eye, Clock, Phone, AlertCircle, Sparkles, Fuel,
  Users, Key, FileText, ChevronRight, X, Layers
} from 'lucide-react';

import { formatBookingDateTime, formatDateShort } from '../../utils/dateUtils';

export default function CustomerSelfDriveTab({
  currentUser,
  bookings = [],
  packages = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = [],
  onOpenBookingDetails,
  onNavigateTab
}) {
  const [selectedItineraryPkg, setSelectedItineraryPkg] = useState(null);

  // ─── Unified Driver & Self Drive Helpers ───
  const hasDriverService = (b) => {
    if (!b) return false;
    const rawType = String(b.package_type || b.type || '').toLowerCase();
    const rawItem = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const rawId = String(b.item_id || '').toLowerCase();
    
    // Strict isolation: Bikes never have driver service
    if (
      rawType === 'bike' || rawType.includes('bike') || rawType.includes('scooter') ||
      rawId.startsWith('bike') || rawId.startsWith('bk-') ||
      /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|access/i.test(rawItem)
    ) {
      return false;
    }

    // 1. Explicit driver service type
    const svcType = String(b.driver_service_type || '').toUpperCase().trim();
    if (['PICKUP', 'DROP', 'FULL'].includes(svcType)) return true;
    if (svcType === 'NONE') return false;

    // 2. Explicit driver_required flag
    if (b.driver_required === 1 || b.driver_required === '1' || b.driver_required === true || b.driver_required === 'yes') return true;
    if (b.driver_required === 0 || b.driver_required === '0' || b.driver_required === false || b.driver_required === 'no') return false;

    // 3. Assigned driver present
    if (b.assigned_driver_id && String(b.assigned_driver_id).trim() !== '' && String(b.assigned_driver_id).trim() !== '0') return true;

    // 4. Booking type or item name indicating driver vs self-drive
    const pkgType = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    if (pkgType.includes('with driver') || itemName.includes('with driver') || itemName.includes('with chauffeur') || pkgType === 'driver') return true;
    if (pkgType.includes('self drive') || pkgType === 'selfdrive' || itemName.includes('self drive') || itemName.includes('self-drive')) return false;

    return false;
  };

  const isBikeItem = (b) => {
    if (!b) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    return (
      type === 'bike' ||
      type.includes('bike') ||
      type.includes('scooter') ||
      type.includes('two wheeler') ||
      type.includes('two-wheeler') ||
      itemId.startsWith('bike-') ||
      itemId.startsWith('bike_') ||
      itemId.startsWith('bk-') ||
      itemName.includes('bike') ||
      itemName.includes('scooter') ||
      itemName.includes('activa') ||
      itemName.includes('himalayan') ||
      itemName.includes('bullet') ||
      itemName.includes('jupiter') ||
      itemName.includes('classic 350') ||
      itemName.includes('fz-s') ||
      itemName.includes('access 125') ||
      itemName.includes('faschino') ||
      itemName.includes('vespa') ||
      itemName.includes('royal enfield') ||
      itemName.includes('hunter 350') ||
      itemName.includes('tvs')
    );
  };

  const isCarItem = (b) => {
    if (!b || isBikeItem(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();

    // Exclude other categories and child bookings
    if (b.parent_booking_id && String(b.parent_booking_id).trim() !== '') return false;
    if (type === 'package' || type === 'trip package' || b.package_type === 'Trip Package') return false;
    if (type.includes('craft') || itemName.includes('craft my trip') || itemId.includes('craft')) return false;
    if (type === 'flight' || type.includes('flight') || itemName.includes('flight') || itemId.startsWith('fl-')) return false;
    if (type === 'hotel' || type.includes('hotel') || Boolean(b.hotel_name && !b.vehicle_name && !b.car_included) || itemId.startsWith('hotel-')) return false;
    if (type === 'activity' || type === 'sightseeing' || itemId.startsWith('act') || itemId.startsWith('sight')) return false;
    if (itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-')) return false;

    if (itemId.startsWith('car-') || itemId.startsWith('car_') || itemId.startsWith('lux-')) return true;
    if (
      type === 'car' ||
      type === 'cars' ||
      type.includes('car rental') ||
      type.includes('vehicle rental') ||
      type === 'vehicle' ||
      type === 'driver' ||
      type === 'selfdrive' ||
      type.includes('self drive')
    ) return true;

    const carKeywords = [
      'car', 'thar', 'swift', 'creta', 'ertiga', 'fortuner', 'innova', 'cabriolet',
      'audi', 'bmw', 'baleno', 'i20', 'scorpio', 'kia', 'seltos', 'verna', 'wagonr',
      'celerio', 'dzire', 'altroz', 'nexon', 'xuv', 'harrier', 'tiago', 'venue',
      'compass', 'mercedes', 'sedan', 'suv', 'hatchback', 'maruti', 'hyundai',
      'mahindra', 'toyota', 'tata', 'mg hector', 'glanza'
    ];
    if (carKeywords.some(kw => itemName.includes(kw))) return true;

    if (b.vehicle_name && !isBikeItem(b)) return true;

    return false;
  };

  const isSelfDriveHoliday = (b) => {
    if (!b) return false;
    // Show ONLY CAR bookings where customer selected Self Drive / No driver required
    return isCarItem(b) && !hasDriverService(b);
  };

  // Filter Self Drive Holiday bookings for current user
  const selfDriveBookings = (bookings || []).filter(isSelfDriveHoliday);

  const getStatusStepIndex = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'confirmed') return 1;
    if (s === 'upcoming') return 2;
    if (s === 'ongoing') return 3;
    if (s === 'completed') return 4;
    return 1;
  };

  const STATUS_STEPS = [
    { label: 'Pending', desc: 'Awaiting verification' },
    { label: 'Confirmed', desc: 'Slot & vehicle reserved' },
    { label: 'Upcoming', desc: 'Ready for delivery' },
    { label: 'Ongoing', desc: 'Holiday in progress' },
    { label: 'Completed', desc: 'Returned successfully' },
  ];

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-warning bg-opacity-10 text-dark fw-bold text-xs mb-1">
            <Compass size={14} className="text-warning" />
            <span>PRIMARY BUSINESS FOCUS</span>
          </div>
          <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '22px' }}>
            My Self Drive Holidays
          </h4>
          <p className="text-muted text-xs mb-0">
            Track your reserved self drive vehicles, pickup points, resort stays, inclusions, and Goa itineraries.
          </p>
        </div>

        <div className="d-flex gap-2">
          <a 
            href="/#self-drive-categories" 
            className="btn btn-warning text-dark fw-bold rounded-pill px-3 py-2 text-xs d-flex align-items-center gap-1.5 shadow-sm"
          >
            <Car size={15} />
            <span>Book Another Self Drive</span>
          </a>
        </div>
      </div>

      {/* ─── Self Drive Holiday Cards List ─── */}
      <div className="d-flex flex-column gap-4">
        {selfDriveBookings.map((b, idx) => {
          const stepIdx = getStatusStepIndex(b.status);
          const totalAmt = parseFloat(b.total_amount || b.amount || 0);
          const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
          const pendingAmt = parseFloat(b.pending_amount || (totalAmt > paidAmt ? totalAmt - paidAmt : 0));

          return (
            <div key={b.id || idx} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #e2e8f0' }}>
              
              {/* ── 1. Top Section: Vehicle Name, Booking ID, Status, and Subtle Booked on ── */}
              <div className="card-header bg-white border-bottom py-3 px-3 px-md-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  {/* Left: Vehicle Title, Booking ID & Status */}
                  <div className="d-flex flex-column gap-1.5">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '18px', letterSpacing: '-0.01em' }}>
                        {b.vehicle_name || b.item_name || b.package_name || 'Premium Self Drive Vehicle'}
                      </h4>
                      <span className="badge bg-dark text-white text-xs px-2.5 py-1 rounded-pill fw-bold">
                        #{b.id || b.booking_id || `WOW-SD-${1000 + idx}`}
                      </span>
                      <span className={`badge px-2.5 py-1 rounded-pill text-uppercase fw-bold text-xs ${
                        (b.status || '').toLowerCase() === 'completed' ? 'bg-success text-white' : 
                        (b.status || '').toLowerCase() === 'confirmed' ? 'bg-primary text-white' : 
                        (b.status || '').toLowerCase() === 'cancelled' || (b.status || '').toLowerCase() === 'rejected' ? 'bg-danger text-white' : 'bg-warning text-dark'
                      }`}>
                        {b.status || 'Pending'}
                      </span>
                    </div>

                    {/* Secondary Details: Booked on (visually subtle) + Duration / Package */}
                    <div className="d-flex flex-wrap align-items-center gap-2 text-muted" style={{ fontSize: '11px' }}>
                      <span>
                        Booked on: <span className="text-secondary fw-medium">{formatDateShort(b.created_at)}</span>
                      </span>
                      {b.package_name && b.package_name !== b.vehicle_name && (
                        <>
                          <span className="text-muted">•</span>
                          <span>Package: <span className="text-secondary fw-medium">{b.package_name}</span></span>
                        </>
                      )}
                      {b.duration && (
                        <>
                          <span className="text-muted">•</span>
                          <span className="badge bg-warning bg-opacity-10 text-dark fw-bold px-2 py-0.5 rounded text-xxs">
                            ⏱️ {b.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Holiday Price Badge */}
                  <div className="text-start text-sm-end">
                    <div className="text-xxs text-muted text-uppercase fw-bold tracking-wider">Total Price</div>
                    <div className="fs-4 fw-black text-dark font-heading lh-1">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xxs mt-1 text-muted">
                      <span className="text-success fw-semibold">Paid: ₹{paidAmt.toLocaleString('en-IN')}</span>
                      {pendingAmt > 0 && (
                        <span className="text-danger fw-semibold ms-1.5">• Due: ₹{pendingAmt.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Main Information & Actions Section (No Image, Compact & Balanced) ── */}
              <div className="card-body p-3 p-md-4">
                <div className="row g-3 g-lg-4 align-items-start">
                  
                  {/* Left / Middle: Pickup & Return Schedule, Specs, Hotel, Feature Pills */}
                  <div className="col-lg-8 col-xl-9">
                    
                    {/* Pickup & Return Schedule Boxes (Compact side-by-side grid) */}
                    <div className="row g-2 mb-3">
                      {/* Pickup Box */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 h-100" style={{ background: '#f8fafc', border: '1px solid #edf2f7' }}>
                          <div className="d-flex align-items-center gap-1.5 text-xxs text-uppercase fw-bold text-muted mb-1">
                            <MapPin size={13} className="text-danger flex-shrink-0" />
                            <span>Pickup Location & Time</span>
                          </div>
                          <div className="fw-bold text-dark text-sm mb-1 text-truncate" title={b.pickup_location || b.pickup || 'Goa Airport (GOI)'}>
                            {b.pickup_location || b.pickup || 'Goa Airport (GOI)'}
                          </div>
                          <div className="text-secondary text-xs d-flex align-items-center gap-1.5">
                            <Calendar size={13} className="text-primary flex-shrink-0" />
                            <span className="fw-semibold">
                              {formatBookingDateTime(b.pickup_date || b.travel_date, b.pickup_time || '10:00 AM')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Return Drop Box */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 h-100" style={{ background: '#f8fafc', border: '1px solid #edf2f7' }}>
                          <div className="d-flex align-items-center gap-1.5 text-xxs text-uppercase fw-bold text-muted mb-1">
                            <MapPin size={13} className="text-success flex-shrink-0" />
                            <span>Return Location & Time</span>
                          </div>
                          <div className="fw-bold text-dark text-sm mb-1 text-truncate" title={b.drop_location || b.drop || 'North Goa / Airport'}>
                            {b.drop_location || b.drop || 'North Goa / Airport'}
                          </div>
                          <div className="text-secondary text-xs d-flex align-items-center gap-1.5">
                            <Calendar size={13} className="text-primary flex-shrink-0" />
                            <span className="fw-semibold">
                              {formatBookingDateTime(b.drop_date || b.pickup_date || b.travel_date, b.drop_time || '10:00 AM')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Details if bundled */}
                    {(b.hotel_name || b.hotel_details) && (
                      <div className="p-2.5 rounded-3 bg-light d-flex align-items-center gap-2.5 text-xs mb-3 border">
                        <Hotel size={16} className="text-primary flex-shrink-0" />
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-bold text-dark">{b.hotel_name || '4★ Beach Resort Stay Included'}</span>
                          <span className="text-muted text-xxs">• Deluxe Room • Daily Breakfast Included</span>
                        </div>
                      </div>
                    )}

                    {/* Vehicle Specs Grid: Compact Row */}
                    <div className="d-flex flex-wrap gap-2 mb-3 text-xxs text-secondary">
                      <div className="px-2.5 py-1.5 bg-light rounded-2 d-flex align-items-center gap-1.5 border">
                        <Fuel size={12} className="text-warning" />
                        <span>{b.fuel_type || 'Petrol / Diesel'}</span>
                      </div>
                      <div className="px-2.5 py-1.5 bg-light rounded-2 d-flex align-items-center gap-1.5 border">
                        <Users size={12} className="text-warning" />
                        <span>{b.seating || '5 Seater'}</span>
                      </div>
                      <div className="px-2.5 py-1.5 bg-light rounded-2 d-flex align-items-center gap-1.5 border">
                        <Key size={12} className="text-warning" />
                        <span>Self Drive (Doorstep Handover)</span>
                      </div>
                      <div className="px-2.5 py-1.5 bg-light rounded-2 d-flex align-items-center gap-1.5 border">
                        <ShieldCheck size={12} className="text-success" />
                        <span>Full Insurance Included</span>
                      </div>
                    </div>

                    {/* Feature Section: Feature Pills */}
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-semibold d-inline-flex align-items-center gap-1.5 shadow-2xs">
                        <Check size={12} className="text-success" strokeWidth={2.5} /> Zero Security Deposit
                      </span>
                      <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-semibold d-inline-flex align-items-center gap-1.5 shadow-2xs">
                        <Check size={12} className="text-success" strokeWidth={2.5} /> Unlimited Kilometers
                      </span>
                      <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-semibold d-inline-flex align-items-center gap-1.5 shadow-2xs">
                        <Check size={12} className="text-success" strokeWidth={2.5} /> Free Delivery & Pickup
                      </span>
                      <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-semibold d-inline-flex align-items-center gap-1.5 shadow-2xs">
                        <Check size={12} className="text-success" strokeWidth={2.5} /> Goa Toll & Taxes Paid
                      </span>
                    </div>

                  </div>

                  {/* Right Column: Compact & Aligned Action Buttons */}
                  <div className="col-lg-4 col-xl-3 border-start-lg ps-lg-4 pt-2 pt-lg-0">
                    <div className="d-flex flex-column gap-2">
                      <button 
                        onClick={() => onOpenBookingDetails(b)}
                        className="btn btn-warning text-dark fw-bold rounded-pill py-2 px-3 text-xs shadow-sm d-flex align-items-center justify-content-center gap-1.5 font-heading"
                      >
                        <Download size={14} />
                        <span>Print / View Voucher</span>
                      </button>

                      {/* Only display Day-by-Day Itinerary for bundled Holiday Packages / Tours, NOT standalone vehicle rentals */}
                      {Boolean(
                        (b.package_name && b.package_name !== b.vehicle_name && !b.package_name.toLowerCase().includes('rental')) ||
                        (b.package_type && ['package', 'trip package', 'holiday package', 'tour'].includes(String(b.package_type).toLowerCase())) ||
                        (b.type && ['package', 'holiday', 'tour'].includes(String(b.type).toLowerCase())) ||
                        (b.hotel_name || b.hotel_details)
                      ) && (
                        <button 
                          onClick={() => setSelectedItineraryPkg(b)}
                          className="btn btn-outline-dark btn-sm rounded-pill py-2 px-3 fw-bold text-xs d-flex align-items-center justify-content-center gap-1.5"
                        >
                          <FileText size={14} />
                          <span>Day-by-Day Itinerary</span>
                        </button>
                      )}

                      <a 
                        href="https://wa.me/919876543210?text=Hi%20WOW%20GOA%20Team%2C%20I%20have%20an%20inquiry%20about%20my%20Self%20Drive%20Booking"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-light btn-sm text-dark border rounded-pill py-2 px-3 fw-semibold text-xxs d-flex align-items-center justify-content-center gap-1.5 hover-bg-light"
                      >
                        <Phone size={12} className="text-success" />
                        <span>WhatsApp Concierge</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── 3. Professional Status Timeline ── */}
              <div className="card-footer bg-light bg-opacity-60 border-top py-3 px-3 px-md-4">
                <div className="d-flex align-items-center justify-content-between position-relative" style={{ minHeight: '44px' }}>
                  
                  {/* Background track line */}
                  <div 
                    className="position-absolute top-50 start-0 end-0 translate-middle-y" 
                    style={{ height: '3px', background: '#e2e8f0', zIndex: 1, left: '28px', right: '28px' }} 
                  />
                  
                  {/* Active progress track line */}
                  <div 
                    className="position-absolute top-50 start-0 translate-middle-y" 
                    style={{ 
                      height: '3px', 
                      width: `${(Math.min(stepIdx, STATUS_STEPS.length - 1) / (STATUS_STEPS.length - 1)) * 100}%`, 
                      background: '#10b981', 
                      zIndex: 2,
                      transition: 'width 0.4s ease',
                      left: '28px'
                    }} 
                  />

                  {STATUS_STEPS.map((st, sIdx) => {
                    const isPast = sIdx < stepIdx;
                    const isCurrent = sIdx === stepIdx;
                    const isFuture = sIdx > stepIdx;

                    return (
                      <div key={st.label} className="d-flex flex-column align-items-center position-relative text-center" style={{ zIndex: 3 }}>
                        {/* Indicator Node */}
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${
                            isCurrent 
                              ? 'bg-warning text-dark border border-2 border-dark shadow-sm' 
                              : isPast 
                                ? 'bg-success text-white border border-success' 
                                : 'bg-white text-muted border'
                          }`}
                          style={{ 
                            width: isCurrent ? '30px' : '26px', 
                            height: isCurrent ? '30px' : '26px', 
                            fontSize: '11px',
                            fontWeight: 700,
                            boxShadow: isCurrent ? '0 0 0 4px rgba(255, 193, 7, 0.35)' : 'none'
                          }}
                        >
                          {isPast ? (
                            <Check size={14} strokeWidth={3} />
                          ) : isCurrent ? (
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a' }}></span>
                          ) : (
                            <span className="text-secondary" style={{ fontSize: '10px' }}>{sIdx + 1}</span>
                          )}
                        </div>

                        {/* Label with status symbol */}
                        <div className="mt-1 d-flex align-items-center gap-1">
                          <span 
                            className={`text-nowrap ${
                              isCurrent 
                                ? 'fw-black text-dark' 
                                : isPast 
                                  ? 'fw-bold text-success' 
                                  : 'text-muted fw-medium'
                            }`}
                            style={{ fontSize: isCurrent ? '12px' : '11px' }}
                          >
                            {st.label} {isPast ? '✓' : isCurrent ? '●' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Chauffeur Add-on Strip if applicable */}
              {(b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) && (
                <div className="card-footer bg-warning bg-opacity-10 border-top border-warning border-opacity-25 px-4 py-3">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark text-white fw-bold">Chauffeur Service</span>
                      <span className="text-xs text-dark">
                        {b.assigned_driver_name ? (
                          <span className="text-success fw-bold">
                            ✓ Driver Assigned: <strong>{b.assigned_driver_name}</strong> ({b.assigned_driver_phone || 'Call Available'}) • {b.assigned_driver_vehicle || 'Assigned Cab'}
                          </span>
                        ) : (
                          <span>⏳ Awaiting Chauffeur Acceptance (Driver notification dispatched)</span>
                        )}
                      </span>
                    </div>
                    <button 
                      onClick={() => onNavigateTab('driver-trips')}
                      className="btn btn-xs btn-dark fw-bold rounded-pill px-3 py-1"
                    >
                      View Driver Status →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {selfDriveBookings.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <div className="rounded-circle p-4 bg-light d-inline-flex mx-auto mb-3 text-warning">
              <Compass size={48} />
            </div>
            <h4 className="fw-black text-dark mb-2 font-heading">No Self Drive Bookings Found</h4>
            <p className="text-muted text-sm mb-4" style={{ maxWidth: '450px', margin: '0 auto' }}>
              Experience Goa at your own pace with our curated Self Drive Holiday packages, including luxury cars, cruiser bikes, and verified beachfront stays.
            </p>
            <div>
              <a href="/#self-drive-categories" className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 shadow-sm">
                Explore Self Drive Holidays →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ─── Day-by-Day Itinerary Modal ─── */}
      {selectedItineraryPkg && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '92%', maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-warning text-dark fw-bold text-xxs mb-1">GOA ITINERARY</span>
                <h5 className="fw-black mb-0 text-white font-heading">{selectedItineraryPkg.package_name || selectedItineraryPkg.item_name || 'Self Drive Trip Itinerary'}</h5>
              </div>
              <button onClick={() => setSelectedItineraryPkg(null)} className="btn btn-sm text-white-50 hover-text-white border-0">
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <div className="d-flex flex-column gap-3">
                
                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 1</span>
                    <span>Arrival in Goa & Vehicle Handover</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Doorstep vehicle delivery at {selectedItineraryPkg.pickup_location || 'Goa Airport'}. Quick digital inspection, key handover, and scenic coastal drive to your resort.
                  </p>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 2</span>
                    <span>North Goa Coastal Drive & Sunset Cruise</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Self-drive to Vagator, Anjuna, and Chapora Fort. Enjoy watersports at Calangute and an evening beach sunset dinner.
                  </p>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 3</span>
                    <span>South Goa Heritage Tour & Departure Handover</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Explore Old Goa Portuguese Churches, Fontainhas Latin Quarter, and seamless airport return drop-off at {selectedItineraryPkg.drop_location || 'Airport'}.
                  </p>
                </div>

              </div>
            </div>

            <div className="card-footer bg-light p-3 text-end">
              <button onClick={() => setSelectedItineraryPkg(null)} className="btn btn-secondary btn-sm rounded-pill px-4 fw-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
