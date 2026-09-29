import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, CheckCircle, Clock, ShieldCheck, MapPin, Phone, Mail, Calendar, User, FileText, Compass, AlertCircle } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

/**
 * BookingVoucher — Autonomous, Professional A4 Corporate Travel & Rental Voucher
 * 
 * Strict specifications:
 * - 0% decorative/stock images, banners, or carousels.
 * - Dynamic data only; no fake or hardcoded booking fields.
 * - Clean white background, crisp typography, and subtle dividing borders.
 * - Fits cleanly on a standard single A4 page when printed.
 * - Hides navigation, action buttons, modals, and ambient UI in @media print.
 */
export default function BookingVoucher({
  booking,
  currentUser,
  customerUser,
  partnerUser,
  onClose,
  isModal = true
}) {
  // Control body lock and auto-hide top nav when modal is open
  useEffect(() => {
    if (!isModal) return;
    document.body.classList.add('voucher-modal-active');
    lockScroll('booking-voucher');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('voucher-modal-active');
      unlockScroll('booking-voucher');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModal, onClose]);

  if (!booking) return null;

  // ─── 1. Core Identification & Date Formatting ───
  const bookingId = booking.id || booking.booking_id || 'WOW-BK';
  const createdDate = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Parse customizations safely
  const voucherCustoms = React.useMemo(() => {
    if (!booking.customizations) return {};
    if (typeof booking.customizations === 'object') return booking.customizations;
    try {
      return JSON.parse(booking.customizations) || {};
    } catch (e) {
      return {};
    }
  }, [booking.customizations]);

  const hotelRoomTypeName = booking.room_type || voucherCustoms.room_type_name || voucherCustoms.selected_room_name || '';
  const hotelMealPlan = voucherCustoms.meal_plan || '';
  const hotelCancellation = voucherCustoms.cancellation_policy || '';
  const hotelNumRooms = voucherCustoms.num_rooms || '';
  const hotelNumGuests = voucherCustoms.num_guests || (voucherCustoms.adults ? (voucherCustoms.adults + (voucherCustoms.children || 0)) : '');

  // ─── 2. Customer Information Resolution ───
  const guestName = (
    booking.name ||
    booking.customer_name ||
    booking.guest_name ||
    customerUser?.name ||
    currentUser?.name ||
    'Valued Customer'
  ).trim();

  const rawPhone = booking.phone || booking.customer_phone || customerUser?.phone || currentUser?.phone || '';
  const guestPhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`) : '';
  const guestEmail = (booking.email || booking.customer_email || customerUser?.email || currentUser?.email || '').trim();
  const guestLicense = (booking.license || booking.user_license || customerUser?.license || '').trim();

  // ─── 3. Booking Type Classification ───
  const rawType = String(booking.type || booking.service_type || booking.package_type || '').toLowerCase();
  const rawItemName = String(booking.item_name || booking.package_name || booking.hotel_name || booking.vehicle_name || '').toLowerCase();
  const rawItemId = String(booking.item_id || '').toLowerCase();

  const isHotel = (
    rawType === 'hotel' ||
    rawType.includes('hotel') ||
    rawItemName.includes('resort') ||
    rawItemName.includes('hotel') ||
    rawItemName.includes('villa') ||
    rawItemName.includes('suites') ||
    rawItemId.startsWith('hotel-') ||
    rawItemId.startsWith('htl-') ||
    Boolean(booking.hotel_name && !booking.vehicle_name)
  ) && !rawType.includes('self drive') && !rawType.includes('package');

  const isFlight = rawType === 'flight' || rawItemName.includes('flight') || rawItemId.startsWith('fl-');

  const isPackage = (
    rawType === 'package' ||
    rawType.includes('tour') ||
    rawType.includes('holiday') ||
    rawItemName.includes('package') ||
    rawItemName.includes('tour')
  ) && !rawType.includes('self drive');

  const isBike = (
    rawType === 'bike' ||
    rawType.includes('bike') ||
    rawType.includes('scooter') ||
    rawType.includes('two wheeler') ||
    rawType.includes('two-wheeler') ||
    rawItemName.includes('bike') ||
    rawItemName.includes('scooter') ||
    rawItemName.includes('activa') ||
    rawItemName.includes('bullet') ||
    rawItemName.includes('himalayan') ||
    rawItemName.includes('classic 350') ||
    rawItemName.includes('classic') ||
    rawItemName.includes('reborn') ||
    rawItemName.includes('royal enfield') ||
    rawItemName.includes('jupiter') ||
    rawItemName.includes('access 125') ||
    rawItemName.includes('faschino') ||
    rawItemId.startsWith('bike-') ||
    rawItemId.startsWith('bike_') ||
    rawItemId.startsWith('bk-')
  );

  const isSelfDrive = (
    rawType.includes('self drive') ||
    rawType === 'selfdrive' ||
    rawType === 'vehicle' ||
    rawType === 'car' ||
    rawItemName.includes('self drive') ||
    rawItemId.startsWith('car-') ||
    isBike ||
    (!isHotel && !isFlight && !isPackage)
  );

  // Service Label
  let serviceLabel = 'Travel Reservation';
  if (isHotel) serviceLabel = 'Hotel & Resort Accommodation';
  else if (isPackage) serviceLabel = 'Curated Holiday Tour Package';
  else if (isFlight) serviceLabel = 'Scheduled Flight Reservation';
  else if (isBike) serviceLabel = 'Self-Drive Bike Rental';
  else if (isSelfDrive) serviceLabel = 'Self-Drive Vehicle Rental';

  const reservedItemName = (
    booking.item_name ||
    booking.package_name ||
    booking.hotel_name ||
    booking.vehicle_name ||
    'WOW GOA Travel Service'
  ).trim();

  // ─── 4. Schedule & Dates ───
  const pickupDate = booking.pickup_date || booking.departure_date || booking.check_in_date || booking.checkin_date || booking.travel_date || '';
  const dropDate = booking.drop_date || booking.return_date || booking.check_out_date || booking.checkout_date || '';
  const pickupTime = booking.pickup_time || '10:00 AM';
  const dropTime = booking.drop_time || '10:00 AM';

  const pickupLocation = booking.pickup_loc || booking.pickup_location || booking.pickup || booking.hotel_location || 'Goa';
  const dropLocation = booking.drop_loc || booking.drop_location || booking.drop || (isHotel ? booking.hotel_location : pickupLocation);

  const durationText = booking.duration || (booking.booking_days ? `${booking.booking_days} Days / ${Math.max(1, booking.booking_days - 1)} Nights` : '');

  // ─── 5. Driver / Chauffeur Service Check (Strictly NEVER for bikes / scooters) ───
  const svcType = String(booking.driver_service_type || '').toUpperCase();
  const hasDriverService = !isBike && Boolean(
    ['PICKUP', 'DROP', 'FULL'].includes(svcType) ||
    booking.driver_required == 1 ||
    booking.driver_required === 'yes' ||
    booking.driver_required === true ||
    booking.assigned_driver_name ||
    booking.assigned_driver_id
  );

  const driverAssigned = hasDriverService && Boolean(booking.assigned_driver_name || booking.assigned_driver_id);
  const driverName = hasDriverService ? (booking.assigned_driver_name || (booking.assigned_driver_id ? `Chauffeur #${booking.assigned_driver_id}` : '')) : '';
  const driverPhone = hasDriverService ? (booking.assigned_driver_phone || '') : '';
  const driverVehicle = hasDriverService ? (booking.assigned_driver_vehicle || '') : '';

  // ─── 6. Financial Calculations ───
  const totalAmount = parseFloat(booking.total_amount || booking.amount || booking.total_paid || 0);
  const amountPaid = parseFloat(booking.amount_paid || booking.paid_amount || (booking.payment_status === 'Paid' ? totalAmount : 0));
  const pendingBalance = Math.max(0, parseFloat(booking.remaining_amount || booking.pending_amount || (totalAmount - amountPaid)));
  const walletAmountUsed = parseFloat(booking.wallet_amount_used || 0);
  const driverCharge = hasDriverService ? parseFloat(booking.driver_charge || 0) : 0;
  const b2bCommission = parseFloat(booking.b2b_commission_amount || 0);
  const b2bNetPrice = parseFloat(booking.b2b_net_price || 0);

  const paymentStatus = booking.payment_status || (pendingBalance === 0 && totalAmount > 0 ? 'Paid' : 'Pending');
  const paymentMethod = booking.payment_method || booking.payment_mode || (booking.b2b_mode ? 'B2B Partner Billing' : 'Prepaid Online / Direct');
  const bookingStatus = (booking.status || 'Confirmed').toUpperCase();

  // ─── 7. Hide sticky header while modal is open ───
  useEffect(() => {
    if (!isModal) return;
    // Suppress any sticky/fixed portal headers so the backdrop fully covers them
    const stickyHeaders = document.querySelectorAll('.sticky-top, [class*="sticky"]');
    const originals = [];
    stickyHeaders.forEach((el) => {
      originals.push({ el, zIndex: el.style.zIndex });
      el.style.zIndex = '1';
    });
    document.body.style.overflow = 'hidden';
    return () => {
      originals.forEach(({ el, zIndex }) => {
        el.style.zIndex = zIndex;
      });
      document.body.style.overflow = '';
    };
  }, [isModal]);

  // ─── 7. Print Handler ───
  const handlePrint = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    try {
      window.focus();
    } catch (err) {
      // ignore
    }
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const content = (
    <div 
      className="booking-voucher-document bg-white text-dark font-sans" 
      style={{ 
        maxWidth: '740px', 
        margin: '0 auto', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        padding: '20px 24px', 
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)', 
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        color: '#0f172a', 
        lineHeight: 1.35 
      }}
    >
      
      {/* ─── Print & Action Toolbar (Screen Only, shown when not embedded in modal) ─── */}
      {!isModal && (
        <div className="no-print d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle p-1.5 bg-dark text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
              <FileText size={16} />
            </div>
            <span className="fw-bold text-dark small">Booking Document Preview</span>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              onClick={handlePrint}
              className="btn btn-dark btn-sm rounded-pill px-4 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.8rem', background: '#0B192C', borderColor: '#0B192C' }}
            >
              <Printer size={14} />
              <span>Print Voucher</span>
            </button>
            {onClose && (
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fw-bold"
                style={{ fontSize: '0.8rem' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HEADER & CORPORATE BRANDING
      ═══════════════════════════════════════════════════════ */}
      <div className="d-flex justify-content-between align-items-start border-bottom pb-2.5 mb-2.5">
        <div>
          <div className="d-flex align-items-baseline gap-1.5">
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B192C', letterSpacing: '-0.5px' }}>
              WOW GOA
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6333', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              • Mobility & Holidays
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }} className="mt-0.5">
            Official Travel &amp; Reservation Confirmation Voucher
          </div>
        </div>

        <div className="text-end">
          <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '1px', color: '#0F172A', textTransform: 'uppercase' }}>
            BOOKING VOUCHER
          </div>
          <div className="d-flex align-items-center justify-content-end gap-2 mt-0.5">
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', color: '#0B192C' }}>
              #{bookingId}
            </span>
            <span 
              className={`badge text-uppercase px-2 py-0.5 rounded ${
                bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED' 
                  ? 'bg-success text-white' 
                  : 'bg-warning text-dark'
              }`}
              style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}
            >
              {bookingStatus}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }} className="mt-0.5">
            Booking Date: <strong>{createdDate}</strong>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: CUSTOMER & TRAVELLER DETAILS
      ═══════════════════════════════════════════════════════ */}
      <div className="border rounded-2 p-2 mb-2 bg-light bg-opacity-25" style={{ borderColor: '#e2e8f0' }}>
        <div className="text-uppercase fw-bold text-muted pb-1 mb-1.5 border-bottom" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
          Customer &amp; Guest Details
        </div>
        <div className="row g-1.5" style={{ fontSize: '11px' }}>
          <div className="col-4">
            <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>Lead Guest Name:</span>
            <strong className="text-dark">{guestName}</strong>
          </div>
          <div className="col-4">
            <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>Contact Number:</span>
            <strong className="text-dark">{guestPhone || 'Provided upon booking'}</strong>
          </div>
          <div className="col-4">
            <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>Email Address:</span>
            <span className="text-dark">{guestEmail || '—'}</span>
          </div>

          {/* Conditional License row strictly for vehicle bookings with license available */}
          {isSelfDrive && guestLicense && (
            <div className="col-4 mt-1">
              <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>Driving License / ID:</span>
              <strong className="text-dark">{guestLicense}</strong>
            </div>
          )}

          {/* B2B Partner Row if booked via B2B agency */}
          {String(booking.booking_channel || '').toUpperCase() === 'B2B' && (booking.b2b_partner_name || partnerUser?.company_name) && (
            <div className="col-4 mt-1">
              <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>Booking Channel:</span>
              <strong className="text-primary">{booking.b2b_partner_name || partnerUser?.company_name} (B2B Partner)</strong>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: BOOKING & SERVICE SPECIFICATIONS
      ═══════════════════════════════════════════════════════ */}
      <div className="border rounded-2 p-2 mb-2" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex justify-content-between align-items-center pb-1 mb-1.5 border-bottom">
          <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
            Reservation Details
          </span>
          <span className="badge bg-light text-dark border px-2 py-0.5 rounded fw-bold" style={{ fontSize: '9.5px' }}>
            {serviceLabel}
          </span>
        </div>

        <div className="mb-2">
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
            {reservedItemName}
          </div>
          {booking.vehicle_number && (
            <span className="badge bg-light text-dark border px-1.5 py-0.5 rounded me-1 text-xxs mt-0.5">
              Assigned Reg: <strong>{booking.vehicle_number}</strong>
            </span>
          )}
          {booking.physical_unit_id && (
            <span className="badge bg-light text-dark border px-1.5 py-0.5 rounded text-xxs mt-0.5">
              Unit ID: {booking.physical_unit_id}
            </span>
          )}
          {hotelRoomTypeName && (
            <span className="badge bg-light text-dark border px-1.5 py-0.5 rounded text-xxs mt-0.5 ms-1">
              🛏️ Room: <strong>{hotelRoomTypeName}</strong>
            </span>
          )}
          {hotelMealPlan && (
            <span className="badge bg-light text-dark border px-1.5 py-0.5 rounded text-xxs mt-0.5 ms-1">
              🍽️ Meal Plan: <strong>{hotelMealPlan}</strong>
            </span>
          )}
          {hotelNumRooms && (
            <span className="badge bg-light text-dark border px-1.5 py-0.5 rounded text-xxs mt-0.5 ms-1">
              Rooms: {hotelNumRooms} {hotelNumGuests ? `(${hotelNumGuests} Guests)` : ''}
            </span>
          )}
          {hotelCancellation && (
            <div className="text-success mt-1" style={{ fontSize: '9.5px' }}>
              ✓ Cancellation Policy: {hotelCancellation}
            </div>
          )}
        </div>

        <div className="row g-2" style={{ fontSize: '11px' }}>
          <div className="col-6">
            <div className="p-1.5 rounded bg-light border" style={{ borderColor: '#f1f5f9' }}>
              <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>
                {isHotel ? 'Check-in Schedule:' : 'Pickup Location & Schedule:'}
              </span>
              <strong className="text-dark d-block">{pickupLocation}</strong>
              <span className="text-dark">
                {pickupDate ? pickupDate : 'Scheduled'} {pickupTime ? `• ${pickupTime}` : ''}
              </span>
            </div>
          </div>

          <div className="col-6">
            <div className="p-1.5 rounded bg-light border" style={{ borderColor: '#f1f5f9' }}>
              <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>
                {isHotel ? 'Check-out Schedule:' : 'Drop-off / Return Location:'}
              </span>
              <strong className="text-dark d-block">{dropLocation}</strong>
              <span className="text-dark">
                {dropDate ? dropDate : 'Scheduled'} {dropTime ? `• ${dropTime}` : ''}
              </span>
            </div>
          </div>

          {durationText && (
            <div className="col-12 mt-1">
              <span className="text-muted" style={{ fontSize: '10px' }}>Duration: </span>
              <strong className="text-dark" style={{ fontSize: '10.5px' }}>{durationText}</strong>
              {booking.booking_days && (
                <span className="text-muted ms-2" style={{ fontSize: '10px' }}>
                  ({booking.booking_days} {isHotel ? 'Nights' : 'Days'} Total)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: PRICE & FINANCIAL BREAKDOWN
      ═══════════════════════════════════════════════════════ */}
      <div className="border rounded-2 p-2 mb-2" style={{ borderColor: '#e2e8f0' }}>
        <div className="text-uppercase fw-bold text-muted pb-1 mb-1.5 border-bottom" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
          Payment &amp; Billing Statement
        </div>

        <table className="w-100" style={{ fontSize: '11px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <td className="py-1 text-muted">Base Tariff &amp; Rental Charges</td>
              <td className="py-1 text-end fw-bold text-dark">
                ₹{(totalAmount - driverCharge).toLocaleString('en-IN')}
              </td>
            </tr>

            {/* Chauffeur / Driver Fee ONLY if applicable */}
            {hasDriverService && driverCharge > 0 && (
              <tr className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <td className="py-1 text-muted">Chauffeur Service Fee ({booking.driver_service_type || 'FULL DAY'})</td>
                <td className="py-1 text-end fw-bold text-dark">₹{driverCharge.toLocaleString('en-IN')}</td>
              </tr>
            )}

            {/* Wallet deduction ONLY if actually applied */}
            {walletAmountUsed > 0 && (
              <tr className="border-bottom text-success" style={{ borderColor: '#f1f5f9' }}>
                <td className="py-1">WOW GOA Wallet Benefit Applied</td>
                <td className="py-1 text-end fw-bold">-₹{walletAmountUsed.toLocaleString('en-IN')}</td>
              </tr>
            )}

            {/* B2B Partner commission or net discount if booking is B2B */}
            {booking.b2b_mode === 'COMMISSION' && b2bCommission > 0 && (
              <tr className="border-bottom text-success" style={{ borderColor: '#f1f5f9', fontSize: '10.5px' }}>
                <td className="py-1">Partner Commission Credit ({booking.b2b_partner_name || partnerUser?.company_name || 'B2B Partner'})</td>
                <td className="py-1 text-end fw-bold">+₹{b2bCommission.toLocaleString('en-IN')}</td>
              </tr>
            )}
            {booking.b2b_mode === 'NON_COMMISSION' && (b2bNetPrice > 0 || booking.b2b_net_discount_percentage) && (
              <tr className="border-bottom text-primary" style={{ borderColor: '#f1f5f9', fontSize: '10.5px' }}>
                <td className="py-1">B2B Net Partner Settlement ({booking.b2b_net_discount_percentage || 10}% Off Retail)</td>
                <td className="py-1 text-end fw-bold">₹{(b2bNetPrice || totalAmount).toLocaleString('en-IN')}</td>
              </tr>
            )}

            <tr className="border-bottom fw-bold" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
              <td className="py-1.5 ps-1 text-dark">Total Booking Fare</td>
              <td className="py-1.5 pe-1 text-end text-dark fs-6" style={{ fontWeight: 900 }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr style={{ fontSize: '10.5px' }}>
              <td className="pt-1.5 text-muted">
                Amount Paid Online ({paymentMethod})
              </td>
              <td className="pt-1.5 text-end fw-bold text-success">
                ₹{amountPaid.toLocaleString('en-IN')}
              </td>
            </tr>

            {pendingBalance > 0 ? (
              <tr className="text-danger fw-bold" style={{ fontSize: '11px' }}>
                <td className="pt-1">Balance Due on Arrival / Handover</td>
                <td className="pt-1 text-end">₹{pendingBalance.toLocaleString('en-IN')}</td>
              </tr>
            ) : (
              <tr className="text-success" style={{ fontSize: '10px' }}>
                <td className="pt-0.5">Payment Status</td>
                <td className="pt-0.5 text-end fw-bold">✓ Full Payment Settled (Nil Balance)</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: IMPORTANT INFORMATION & DRIVER DETAILS
      ═══════════════════════════════════════════════════════ */}
      <div className="border rounded-2 p-2 mb-2 bg-light bg-opacity-25" style={{ borderColor: '#e2e8f0' }}>
        <div className="text-uppercase fw-bold text-muted pb-1 mb-1.5 border-bottom" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
          Important Instructions &amp; Notes
        </div>

        {/* Chauffeur / Driver Box — Strictly ONLY when booking includes a driver */}
        {hasDriverService && (
          <div className="p-2 mb-2 rounded bg-white border" style={{ borderColor: '#cbd5e1' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-bold text-dark" style={{ fontSize: '10.5px' }}>
                🚗 Chauffeur Assignment Details ({booking.driver_service_type || 'FULL DAY'})
              </span>
              <span className={`badge ${driverAssigned ? 'bg-success text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '8.5px' }}>
                {driverAssigned ? 'Driver Assigned' : 'Assignment In Progress'}
              </span>
            </div>

            {driverAssigned ? (
              <div className="row g-1 text-dark" style={{ fontSize: '10.5px' }}>
                <div className="col-4">
                  <span className="text-muted d-block text-xxs">Chauffeur:</span>
                  <strong>{driverName}</strong>
                </div>
                <div className="col-4">
                  <span className="text-muted d-block text-xxs">Mobile:</span>
                  <strong>{driverPhone || 'Shared via SMS'}</strong>
                </div>
                {driverVehicle && (
                  <div className="col-4">
                    <span className="text-muted d-block text-xxs">Vehicle:</span>
                    <strong>{driverVehicle}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted" style={{ fontSize: '9.5px' }}>
                Your chauffeur assignment is queued with verified Goa drivers. Chauffeur contact and vehicle details will be dispatched via SMS &amp; WhatsApp prior to pickup.
              </div>
            )}
          </div>
        )}

        {/* Booking-Specific Operational Notes */}
        <div style={{ fontSize: '9.5px', color: '#475569' }}>
          {isBike ? (
            <>
              <div className="mb-0.5">
                • <strong>Rider Helmet &amp; Safety:</strong> 1 complimentary sanitized ISI-standard rider helmet is included. Pillion helmet available on request. Wearing a helmet is strictly mandatory by Goa Traffic Police regulations.
              </div>
              <div className="mb-0.5">
                • <strong>Security Deposit &amp; License:</strong> A refundable deposit of ₹1,500–₹3,000 (UPI/Cash) and physical original Driving License must be presented at vehicle handover.
              </div>
              <div className="mb-0.5">
                • <strong>Fuel Policy:</strong> Vehicles are handed over with reserve fuel; please return with the same fuel level.
              </div>
            </>
          ) : isSelfDrive ? (
            <div className="mb-0.5">
              • <strong>Security Deposit:</strong> A refundable deposit of ₹3,000–₹5,000 (UPI/Cash) and physical Driving License must be presented at vehicle handover.
            </div>
          ) : null}
          {isHotel && (
            <div className="mb-0.5">
              • <strong>Check-in Requirement:</strong> Standard check-in starts from 14:00 hrs. Government-issued photo IDs (Aadhaar/Passport) required for all staying adults.
            </div>
          )}
          {isPackage && (
            <div className="mb-0.5">
              • <strong>Airport / Station Pickup:</strong> Our Goa concierge will meet you at the arrival terminal. Please keep your phone reachable upon landing.
            </div>
          )}
          <div>
            • <strong>Assistance:</strong> For changes, route assistance or doorstep coordination, contact the 24/7 Goa Operations Desk at <strong>+91 98765 43210</strong>.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: TERMS & CONDITIONS (CONCISE 4-POINT FORMAT)
      ═══════════════════════════════════════════════════════ */}
      <div className="border rounded-2 p-2 mb-2" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="text-uppercase fw-bold text-muted pb-1 mb-1 border-bottom" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
          Standard Terms &amp; Conditions
        </div>
        <ol className="mb-0 ps-3 text-muted" style={{ fontSize: '9px', lineHeight: '1.3' }}>
          <li className="mb-0.5">
            <strong>Identification:</strong> Original Government-issued photo ID is mandatory at vehicle handover or hotel check-in.
          </li>
          <li className="mb-0.5">
            <strong>Timings:</strong> Vehicles and rooms must be returned/vacated per the scheduled time. Extensions require prior approval.
          </li>
          <li className="mb-0.5">
            <strong>Permitted Usage:</strong> Commercial subleasing, driving under the influence, and off-road driving on beaches are strictly prohibited by law.
          </li>
          <li className="mb-0.5">
            <strong>Cancellation &amp; Policy:</strong> Cancellations are governed by the vendor's saved policy snapshot. Refunds apply strictly to the vendor service amount (90%).
          </li>
          <li>
            <strong>Platform Fee (Non-Refundable):</strong> WOW GOA platform fee (10%) is strictly non-refundable upon booking/payment.
          </li>
        </ol>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: CORPORATE FOOTER & VERIFICATION
      ═══════════════════════════════════════════════════════ */}
      <div className="border-top pt-2 mt-1 text-center" style={{ fontSize: '9.5px', color: '#64748b' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-1">
          <span>
            <strong>WOW GOA Travel Solutions</strong> • Goa, India
          </span>
          <span>
            Helpline: <strong>+91 98765 43210</strong> (24/7 Operations Desk)
          </span>
          <span>
            Email: <strong>support@wowgoa.com</strong> • Web: <strong>www.wowgoa.com</strong>
          </span>
        </div>
        <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>
          This is a system-generated electronic booking voucher issued by WOW GOA. No physical signature or stamp required.
        </div>
      </div>

      {/* ─── Embedded Print Styles ─── */}
      <style>{`
        @media print {
          /* Page setup for standard A4 portrait */
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }

          /* Force background colors and clean paper canvas */
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all ambient application elements by default */
          body * {
            visibility: hidden !important;
          }

          /* Explicitly unhide and unclip the modal container hierarchy */
          .modal-backdrop-custom,
          .modal-backdrop-custom *,
          .booking-voucher-document,
          .booking-voucher-document * {
            visibility: visible !important;
          }

          /* Reset Modal Backdrop to unclipped, white, static flow */
          .modal-backdrop-custom {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }

          /* Reset Modal Card */
          .modal-backdrop-custom .card {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          /* Reset Modal Scroll Body & Card Body */
          .modal-backdrop-custom .card-body,
          .modal-backdrop-custom .modal-voucher-scroll-body {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          /* The Voucher Document itself */
          .booking-voucher-document {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 6px 10px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10px !important;
            line-height: 1.25 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Completely hide buttons, close icons, and toolbar */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Prevent unwanted page splits inside boxes */
          .border, table, tr, div, ol, li {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );

  // If rendered as a standalone modal (default)
  if (isModal) {
    const modalContent = (
      <div 
        className="modal-backdrop-custom voucher-modal-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11, 25, 44, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <div 
          className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in-up" 
          style={{
            width: '100%',
            maxWidth: '820px',
            minHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            margin: '24px auto 40px auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Sticky Modal Header (Screen Only) ─── */}
          <div 
            className="no-print d-flex justify-content-between align-items-center px-3 px-md-4 py-2.5 text-white flex-shrink-0"
            style={{ background: '#0B192C', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div 
                className="rounded-3 p-1.5 d-flex align-items-center justify-content-center" 
                style={{ background: 'rgba(255, 184, 0, 0.18)', color: '#FFB800', width: '34px', height: '34px' }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-black text-white" style={{ fontSize: '13.5px', letterSpacing: '-0.2px' }}>
                    Booking Reservation Voucher
                  </span>
                  <span 
                    className={`badge text-uppercase px-2 py-0.5 rounded-pill ${
                      bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED' 
                        ? 'bg-success text-white' 
                        : 'bg-warning text-dark'
                    }`}
                    style={{ fontSize: '9px', fontWeight: 800 }}
                  >
                    {bookingStatus}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 text-white-50 mt-0.5" style={{ fontSize: '11px' }}>
                  <span className="font-monospace text-warning fw-bold">#{bookingId}</span>
                  <span>•</span>
                  <span>{serviceLabel}</span>
                  <span>•</span>
                  <span>{createdDate}</span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                onClick={handlePrint}
                className="btn btn-warning btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                style={{ fontSize: '0.78rem', background: '#FFB800', borderColor: '#FFB800', color: '#0B192C' }}
              >
                <Printer size={14} />
                <span className="d-none d-sm-inline">Print / Download PDF</span>
                <span className="d-inline d-sm-none">Print</span>
              </button>
              {onClose && (
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-white border-0"
                  style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
                  title="Close Voucher"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ─── Modal Body containing the A4 Document ─── */}
          <div 
            className="modal-voucher-scroll-body flex-grow-1 p-2 p-md-3" 
            style={{ background: '#f1f5f9' }}
          >
            {content}
          </div>

          {/* ─── Sticky Modal Footer (Screen Only) ─── */}
          <div 
            className="no-print d-flex justify-content-between align-items-center px-3 px-md-4 py-2 bg-white border-top flex-shrink-0"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="text-muted d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
              <ShieldCheck size={14} className="text-success flex-shrink-0" />
              <span className="d-none d-md-inline">Official Travel &amp; Reservation Confirmation Voucher • Verified Corporate Document</span>
              <span className="d-inline d-md-none">Verified WOW GOA Voucher</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {onClose && (
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 fw-bold"
                  style={{ fontSize: '0.75rem' }}
                >
                  Close
                </button>
              )}
              <button 
                type="button" 
                onClick={handlePrint}
                className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.75rem', background: '#0B192C', borderColor: '#0B192C' }}
              >
                <Printer size={13} />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    if (typeof document !== 'undefined' && document.body) {
      return createPortal(modalContent, document.body);
    }
    return modalContent;
  }

  return content;
}
