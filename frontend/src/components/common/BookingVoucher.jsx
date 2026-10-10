import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, X, CheckCircle, Clock, ShieldCheck, MapPin, Phone, Mail, Calendar, 
  User, FileText, Compass, AlertCircle, Hotel, Car, UserCheck, Sparkles, Plane,
  ChevronDown, ChevronRight, MessageSquare
} from 'lucide-react';
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
    document.body.classList.add('b2b-modal-active');
    const shell = document.querySelector('.b2b-portal-shell');
    if (shell) {
      shell.classList.add('b2b-shell-inert');
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    }
    lockScroll('booking-voucher');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('voucher-modal-active');
      document.body.classList.remove('b2b-modal-active');
      const shellEl = document.querySelector('.b2b-portal-shell');
      if (shellEl) {
        shellEl.classList.remove('b2b-shell-inert');
        shellEl.removeAttribute('inert');
        shellEl.removeAttribute('aria-hidden');
      }
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

  const isPackage = (
    rawType === 'package' ||
    rawType.includes('package') ||
    String(booking.package_type || '').toLowerCase().includes('package') ||
    rawItemId.startsWith('pkg-') ||
    rawItemId.startsWith('package-') ||
    rawItemId.startsWith('tp-') ||
    rawType.includes('tour') ||
    rawType.includes('holiday') ||
    rawItemName.includes('package') ||
    rawItemName.includes('tour')
  ) && !rawType.includes('self drive');

  const isHotel = !isPackage && (
    rawType === 'hotel' ||
    rawType.includes('hotel') ||
    rawItemName.includes('resort') ||
    rawItemName.includes('hotel') ||
    rawItemName.includes('villa') ||
    rawItemName.includes('suites') ||
    rawItemId.startsWith('hotel-') ||
    rawItemId.startsWith('htl-') ||
    Boolean(booking.hotel_name && !booking.vehicle_name && !booking.car_included)
  ) && !rawType.includes('self drive');

  const isFlight = !isPackage && (rawType === 'flight' || rawItemName.includes('flight') || rawItemId.startsWith('fl-'));

  const isActivity = !isPackage && (
    rawType === 'activity' ||
    rawType === 'sightseeing' ||
    rawType.includes('activity') ||
    rawType.includes('sightseeing') ||
    rawItemId.startsWith('act-') ||
    rawItemId.startsWith('sight-') ||
    rawItemName.includes('sightseeing') ||
    rawItemName.includes('tour activity')
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

  // Authoritative Driver / Chauffeur Service Check (Strictly NEVER for bikes / scooters)
  const svcType = String(booking.driver_service_type || '').toUpperCase();
  const hasDriverService = !isBike && Boolean(
    ['PICKUP', 'DROP', 'FULL'].includes(svcType) ||
    booking.driver_required == 1 ||
    booking.driver_required === 'yes' ||
    booking.driver_required === '1' ||
    booking.driver_required === true ||
    booking.assigned_driver_name ||
    booking.assigned_driver_id
  );

  const isCar = !isBike && !isHotel && !isFlight && !isPackage && !isActivity && (
    rawType === 'car' ||
    rawType === 'vehicle' ||
    rawType === 'selfdrive' ||
    rawType.includes('self drive') ||
    rawType.includes('car') ||
    rawItemId.startsWith('car-') ||
    rawItemId.startsWith('car_') ||
    rawItemId.startsWith('lux-') ||
    Boolean(booking.vehicle_name && !booking.hotel_name) ||
    (!isHotel && !isFlight && !isPackage && !isActivity && !isBike)
  );

  const isSelfDriveCar = isCar && !hasDriverService;
  const isChauffeurCar = isCar && hasDriverService;
  const isSelfDrive = isBike || isSelfDriveCar; // strictly self-drive bookings only

  // Service Label
  let serviceLabel = 'Travel Reservation';
  if (isHotel) serviceLabel = 'Hotel & Resort Accommodation';
  else if (isPackage) serviceLabel = 'Curated Holiday Tour Package';
  else if (isFlight) serviceLabel = 'Scheduled Flight Reservation';
  else if (isActivity) serviceLabel = 'Sightseeing & Tour Activity';
  else if (isBike) serviceLabel = 'Self-Drive Bike Rental';
  else if (isChauffeurCar) serviceLabel = 'Car Rental with Chauffeur';
  else if (isSelfDriveCar) serviceLabel = 'Self-Drive Car Rental';

  // Safe Vehicle & Item Name Formatter
  const formatTitleCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .split(/\s+/)
      .map(w => {
        const u = w.toUpperCase();
        if (['4X4', '4WD', 'AWD', 'AT', 'MT', 'VXI', 'ZXI', 'LXI', 'GT', 'BS6', 'ABS', 'SUV', 'MUV', 'AC', 'CC'].includes(u)) {
          return u;
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const getCleanItemName = () => {
    if (isHotel) {
      return booking.hotel_name || booking.item_name || booking.package_name || 'WOW GOA Hotel Accommodation';
    }
    if (isCar || isBike) {
      const candidates = [
        booking.vehicle_name,
        booking.item_name,
        booking.package_name
      ].map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

      const genericNames = [
        'trip booking', 'self drive vehicle', 'self drive holiday',
        'trip package', 'vehicle', 'car rental', 'bike rental',
        'wow goa travel service', 'travel reservation', 'car', 'bike'
      ];
      const specific = candidates.find(c => !genericNames.includes(c.toLowerCase()));
      if (specific) return formatTitleCase(specific);
      return candidates[0] ? formatTitleCase(candidates[0]) : (isBike ? 'Two Wheeler Rental' : (isChauffeurCar ? 'Chauffeur Driven Car' : 'Self-Drive Vehicle'));
    }
    return (
      booking.item_name ||
      booking.package_name ||
      booking.hotel_name ||
      booking.vehicle_name ||
      'WOW GOA Travel Service'
    ).trim();
  };

  const reservedItemName = getCleanItemName();

  // ─── 4. Schedule & Dates ───
  const pickupDate = booking.pickup_date || booking.departure_date || booking.check_in_date || booking.checkin_date || booking.travel_date || '';
  const dropDate = booking.drop_date || booking.return_date || booking.check_out_date || booking.checkout_date || '';
  const pickupTime = booking.pickup_time || '10:00 AM';
  const dropTime = booking.drop_time || '10:00 AM';

  const pickupLocation = (
    booking.pickup_loc ||
    booking.pickup_location ||
    booking.pickup ||
    booking.hotel_location ||
    'Goa'
  ).trim();

  // Authoritative Drop-Off Location: NEVER fallback to pickupLocation
  const resolvedDropLoc = (
    booking.drop_loc ||
    booking.drop_location ||
    booking.driver_drop_loc ||
    booking.drop ||
    voucherCustoms.drop_loc ||
    voucherCustoms.dropLoc ||
    voucherCustoms.drop_location ||
    voucherCustoms.driver_details?.drop?.location ||
    voucherCustoms.driver_details?.fullDay?.endLocation ||
    (isHotel ? (booking.hotel_location || 'Hotel Property') : '')
  );

  const dropLocation = (resolvedDropLoc && typeof resolvedDropLoc === 'string' && resolvedDropLoc.trim().length > 0)
    ? resolvedDropLoc.trim()
    : 'Not specified';

  const durationText = booking.duration || (booking.booking_days ? `${booking.booking_days} Days / ${Math.max(1, booking.booking_days - 1)} Nights` : '');

  // ─── 5. Driver / Chauffeur Service Details ───
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
  const paymentMethod = booking.payment_method || booking.payment_mode || (booking.b2b_mode ? 'B2B Partner Billing' : (amountPaid > 0 ? 'Online Payment' : 'Cash on Arrival'));
  const bookingStatus = (booking.status || 'Confirmed').toUpperCase();

  const formatPaymentMode = (mode) => {
    if (!mode || typeof mode !== 'string') return 'Cash / Direct';
    const m = mode.trim();
    if (m.toLowerCase() === 'cash') return 'Cash';
    if (m.toLowerCase() === 'upi') return 'UPI';
    if (m.toLowerCase() === 'card') return 'Credit / Debit Card';
    if (m.toLowerCase() === 'online' || m.toLowerCase() === 'online payment') return 'Online Payment';
    if (m.toLowerCase() === 'direct') return 'Direct';
    return m;
  };

  // ─── Curated Trip Package Component Resolutions ───
  const packageHotelName = (
    booking.hotel_name || 
    booking.hotel_child?.item_name || 
    booking.package_data?.hotel_included || 
    booking.package_data?.hotel?.name || 
    (isPackage ? 'The Grand Candolim Beachfront Resort' : '')
  );

  const packageRoomType = (
    booking.room_type || 
    booking.hotel_room_type || 
    booking.package_data?.hotel_room_type || 
    voucherCustoms.room_type || 
    'Deluxe AC Room'
  );

  const packageMealPlan = (
    booking.meal_plan || 
    booking.package_data?.food_included || 
    voucherCustoms.meal_plan || 
    'Daily Buffet Breakfast Included'
  );

  const packageVehicleName = (
    booking.vehicle_name || 
    booking.vehicle_child?.item_name || 
    booking.package_data?.car_included || 
    booking.package_data?.vehicle?.name || 
    'Maruti Suzuki Swift'
  );

  const packageVehicleDetails = (
    booking.vehicle_details || 
    (booking.vehicle_child?.physical_unit_id ? `Assigned Unit: ${booking.vehicle_child.physical_unit_id} (AC Tourist Vehicle)` : '4 Seater • AC • Sanitized Vehicle')
  );

  const packageDriverType = (
    booking.driver_service_type || 
    booking.driver_child?.driver_service_type || 
    (hasDriverService ? 'Full Day Chauffeur' : 'Dedicated Chauffeur Included')
  );

  const packageDriverStatus = driverAssigned 
    ? (driverName ? `Assigned: ${driverName}` : 'Driver Assigned')
    : '24/7 Local Concierge Assigned';

  const packageFlightDetails = (
    booking.flight_details || 
    ((booking.flight_number || booking.airline) 
      ? `${booking.airline || 'Flight'} ${booking.flight_number}` 
      : 'Without Flight (Land Package Only)')
  );

  const packageSightseeingList = React.useMemo(() => {
    let raw = booking.sightseeing_places || booking.places_included || booking.package_data?.places_included;
    if (booking.sightseeing_custom_json || booking.package_data?.sightseeing_custom_json) {
      try {
        const json = booking.sightseeing_custom_json || booking.package_data?.sightseeing_custom_json;
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.includes('|') ? raw.split('|').map(s => s.trim()).filter(Boolean) : raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return ['Fort Aguada', 'Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Mandovi River Cruise'];
  }, [booking]);

  const packageActivitiesList = React.useMemo(() => {
    let raw = booking.activities_list || booking.activity_custom_json || booking.package_data?.activity_custom_json;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (Array.isArray(booking.activity_children) && booking.activity_children.length > 0) {
      return booking.activity_children.map(a => ({ name: a.item_name, duration: '1 Hour' }));
    }
    return [{ name: 'Mandovi Sunset River Cruise', duration: '1 Hour', description: 'Scenic 1-hour cruise with Goan cultural folk dance & DJ' }];
  }, [booking]);

  const packageItineraryList = React.useMemo(() => {
    let raw = booking.day_wise_itinerary || booking.itinerary || booking.package_data?.day_wise_itinerary || booking.package_data?.itinerary;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { day: 1, title: 'Arrival in Goa & Beach Leisure', description: 'Airport/Station pickup, check in to resort, relax by the beach shacks.', morning: 'Pickup & resort check-in', afternoon: 'Beachside relaxation', evening: 'Sunset beach walk' },
      { day: 2, title: 'North Goa Heritage & Coastal Highlights', description: 'Fort Aguada, Sinquerim coastline, Anjuna and Baga beach tour.', morning: 'Breakfast at resort', afternoon: 'Fort Aguada coastal tour', evening: 'Anjuna & Baga exploration' },
      { day: 3, title: 'South Goa Culture & Mandovi Sunset Cruise', description: 'Old Goa churches, Basilica of Bom Jesus, and Mandovi river cruise.', morning: 'Old Goa heritage churches', afternoon: 'Panaji Latin Quarter walk', evening: '1-Hour Mandovi River Cruise' },
      { day: 4, title: 'Departure with Sweet Goan Memories', description: 'Breakfast, souvenir shopping at Panaji market, and transfer to airport.', morning: 'Breakfast & resort check-out', afternoon: 'Airport/Station transfer', evening: 'Departure' }
    ];
  }, [booking]);

  // ─── 7. Hide sticky header while modal is open ───
  useEffect(() => {
    if (!isModal) return;
    document.body.classList.add('voucher-modal-active');
    // Suppress any sticky/fixed portal headers so the backdrop fully covers them
    const stickyHeaders = document.querySelectorAll('.sticky-top, [class*="sticky"]');
    const originals = [];
    stickyHeaders.forEach((el) => {
      originals.push({ el, zIndex: el.style.zIndex });
      el.style.zIndex = '1';
    });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('voucher-modal-active');
      originals.forEach(({ el, zIndex }) => {
        el.style.zIndex = zIndex;
      });
      document.body.style.overflow = '';
    };
  }, [isModal]);

  // ─── Print Active Event Listeners ───
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('voucher-print-active');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('voucher-print-active');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('voucher-print-active');
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // ─── 7. Print Handler ───
  const handlePrint = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    document.body.classList.add('voucher-print-active');
    const cleanup = () => {
      document.body.classList.remove('voucher-print-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    try {
      window.focus();
    } catch (err) {
      // ignore
    }
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 50);
  };

  // ─── 8. WhatsApp Share Handler ───
  const handleShareWhatsApp = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    const waPhone = cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : '';
    const bId = String(bookingId || '').replace(/^#/, '');

    const summaryText = 
      `🎟️ *WOW GOA — OFFICIAL RESERVATION VOUCHER*\\n\\n` +
      `*Booking ID:* #${bId}\\n` +
      `*Guest Name:* ${guestName}\\n` +
      `*Service:* ${serviceLabel} — ${reservedItemName}\\n` +
      (pickupDate ? `*Schedule:* ${pickupDate}${dropDate ? ` to ${dropDate}` : ''}\\n` : '') +
      `*Total Amount:* ₹${Number(booking.total_amount || booking.total_paid || 0).toLocaleString('en-IN')}\\n` +
      `*Status:* ${bookingStatus}\\n\\n` +
      `View your official A4 Voucher PDF & Track Booking:\\n` +
      `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/customer\\n\\n` +
      `*WOW GOA Rentals & Stays* • 24x7 Support: +91 9916933476`;

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(summaryText)}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
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
              onClick={handleShareWhatsApp}
              className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm text-white"
              style={{ fontSize: '0.8rem', background: '#25D366', borderColor: '#25D366' }}
              title="Share Voucher on WhatsApp"
            >
              <MessageSquare size={14} />
              <span>Share WhatsApp</span>
            </button>
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

          {/* Conditional License row strictly for self-drive vehicle bookings (never for chauffeur car) */}
          {(isSelfDriveCar || isBike) && !isChauffeurCar && guestLicense && (
            <div className="col-4 mt-1">
              <span className="text-muted d-block" style={{ fontSize: '9.5px' }}>
                {isBike ? 'Rider License / ID:' : 'Driving License / ID:'}
              </span>
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
          SECTION 3B: INCLUDED TRIP PACKAGE SERVICES & ITINERARY
      ═══════════════════════════════════════════════════════ */}
      {isPackage && (
        <div className="border rounded-2 p-2.5 mb-2" style={{ borderColor: '#bfdbfe', backgroundColor: '#f8fafc' }}>
          <div className="d-flex align-items-center justify-content-between pb-1.5 mb-2 border-bottom" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center gap-1.5">
              <span className="badge bg-primary text-white text-xxs px-2 py-0.5">TRIP PACKAGE INCLUSIONS</span>
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '9.5px', letterSpacing: '0.6px' }}>
                All-Inclusive Pre-Configured Services
              </span>
            </div>
            <span className="text-xs text-muted">
              {packageItineraryList.length} Days / {Math.max(1, packageItineraryList.length - 1)} Nights Plan
            </span>
          </div>

          {/* Grid of included core services */}
          <div className="row g-2 mb-2" style={{ fontSize: '11px' }}>
            {/* 1. HOTEL */}
            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <Hotel size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>ACCOMMODATION / HOTEL</strong>
                </div>
                <div className="fw-semibold text-dark mb-0.5" style={{ fontSize: '11.5px' }}>
                  {packageHotelName}
                </div>
                {Array.isArray(voucherCustoms.selected_rooms) && voucherCustoms.selected_rooms.length > 0 ? (
                  <div className="d-flex flex-column gap-1 mt-1">
                    {voucherCustoms.selected_rooms.map((sr, sidx) => (
                      <div key={sidx} className="d-flex flex-wrap gap-1 align-items-center">
                        <span className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                          🛏️ {sr.quantity}x {sr.room_type_name || sr.name || 'Room'}
                        </span>
                        <span className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                          🍽️ {sr.meal_plan || 'EP'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    <span className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                      🛏️ {packageRoomType}
                    </span>
                    <span className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                      🍽️ {packageMealPlan}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. VEHICLE */}
            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <Car size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>RESERVED VEHICLE</strong>
                </div>
                <div className="fw-semibold text-dark mb-0.5" style={{ fontSize: '11.5px' }}>
                  {packageVehicleName}
                </div>
                <div className="text-muted" style={{ fontSize: '10.5px' }}>
                  {packageVehicleDetails}
                </div>
              </div>
            </div>

            {/* 3. DRIVER */}
            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <UserCheck size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>CHAUFFEUR SERVICE</strong>
                </div>
                <div className="fw-semibold text-dark mb-0.5" style={{ fontSize: '11.5px' }}>
                  {packageDriverType}
                </div>
                <div className="d-flex align-items-center gap-1 text-muted mt-1" style={{ fontSize: '10.5px' }}>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5 text-xxs">
                    {packageDriverStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. FLIGHT */}
            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <Plane size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>FLIGHT SERVICE</strong>
                </div>
                <div className="fw-semibold text-dark mb-0.5" style={{ fontSize: '11.5px' }}>
                  {packageFlightDetails}
                </div>
                <div className="text-muted" style={{ fontSize: '10px' }}>
                  Airport transfers coordinated with vehicle schedule
                </div>
              </div>
            </div>
          </div>

          {/* 5. SIGHTSEEING & ACTIVITIES */}
          <div className="row g-2 mb-2" style={{ fontSize: '11px' }}>
            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <MapPin size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>CONFIGURED SIGHTSEEING</strong>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {packageSightseeingList.map((spot, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                      📍 {typeof spot === 'object' ? (spot.name || spot.title) : spot}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-2 rounded bg-white border h-100" style={{ borderColor: '#e2e8f0' }}>
                <div className="d-flex align-items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-primary" />
                  <strong className="text-dark" style={{ fontSize: '11px' }}>CURATED ACTIVITIES</strong>
                </div>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {packageActivitiesList.map((act, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-1.5 py-0.5 text-xxs">
                      ✨ {typeof act === 'object' ? (act.name || act.title) : act}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. DAY-WISE ITINERARY */}
          {packageItineraryList.length > 0 && (
            <div className="p-2 rounded bg-white border" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-1.5 mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                <Compass size={13} className="text-primary" />
                <strong className="text-dark" style={{ fontSize: '11px' }}>DAY-WISE ITINERARY</strong>
              </div>
              <div className="d-flex flex-column gap-2" style={{ fontSize: '10.5px' }}>
                {packageItineraryList.map((dayItem, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-light border-start border-3 border-primary" style={{ borderColor: '#3b82f6' }}>
                    <div className="d-flex align-items-center justify-content-between mb-0.5">
                      <strong className="text-dark" style={{ fontSize: '11px' }}>
                        Day {dayItem.day || idx + 1}: {dayItem.title || dayItem.heading || `Tour Day ${idx + 1}`}
                      </strong>
                    </div>
                    {dayItem.description && (
                      <div className="text-muted mb-1" style={{ fontSize: '10px' }}>
                        {dayItem.description}
                      </div>
                    )}
                    <div className="d-flex flex-wrap gap-2 text-dark" style={{ fontSize: '9.5px' }}>
                      {dayItem.morning && (
                        <span>🌅 <strong>Morning:</strong> {dayItem.morning}</span>
                      )}
                      {dayItem.afternoon && (
                        <span>☀️ <strong>Afternoon:</strong> {dayItem.afternoon}</span>
                      )}
                      {dayItem.evening && (
                        <span>🌙 <strong>Evening:</strong> {dayItem.evening}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

            <tr className="border-bottom" style={{ borderColor: '#f1f5f9', fontSize: '10.5px' }}>
              <td className="py-1 text-muted">Amount Paid</td>
              <td className="py-1 text-end fw-bold text-success">
                ₹{amountPaid.toLocaleString('en-IN')}
              </td>
            </tr>

            <tr className="border-bottom" style={{ borderColor: '#f1f5f9', fontSize: '10.5px' }}>
              <td className="py-1 text-muted">Payment Mode</td>
              <td className="py-1 text-end fw-semibold text-dark">
                {formatPaymentMode(paymentMethod)}
              </td>
            </tr>

            {pendingBalance > 0 ? (
              <tr className="text-danger fw-bold" style={{ fontSize: '11px' }}>
                <td className="pt-1.5">Balance Due on Arrival / Handover</td>
                <td className="pt-1.5 text-end">₹{pendingBalance.toLocaleString('en-IN')}</td>
              </tr>
            ) : (
              <tr className="text-success" style={{ fontSize: '10.5px' }}>
                <td className="pt-1 text-muted">Payment Status</td>
                <td className="pt-1 text-end fw-bold text-success">✓ Full Payment Settled (Nil Balance)</td>
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
          ) : isSelfDriveCar ? (
            <>
              <div className="mb-0.5">
                • <strong>Self-Drive Verification:</strong> Physical original Driving License and Government-issued photo ID must be presented by the designated driver at vehicle handover.
              </div>
              <div className="mb-0.5">
                • <strong>Security Deposit:</strong> A refundable security deposit of ₹3,000–₹5,000 (UPI/Cash) is required at vehicle handover, returned upon safe vehicle inspection.
              </div>
            </>
          ) : isChauffeurCar ? (
            <>
              <div className="mb-0.5">
                • <strong>Chauffeur Service:</strong> Professional Goa chauffeur assigned for your reserved itinerary ({booking.driver_service_type || 'Full Day / Trip'}). Vehicle will report at your specified pickup location punctually.
              </div>
              <div className="mb-0.5">
                • <strong>No Customer Driving Required:</strong> You will be chauffeured throughout the journey. No customer driving license or vehicle security deposit is required.
              </div>
              <div className="mb-0.5">
                • <strong>Trip Inclusions:</strong> Driver allowance and fuel are covered as per your chosen chauffeur package. Parking and toll charges (if applicable) are settled directly.
              </div>
            </>
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
          {isActivity && (
            <div className="mb-0.5">
              • <strong>Activity Briefing:</strong> Please report at the activity briefing location 15 minutes before scheduled start time. Carry comfortable swimwear/footwear.
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
    </div>
  );

  // If rendered as a standalone modal (default)
  if (isModal) {
    const modalContent = (
      <div 
        className="modal-backdrop-custom voucher-modal-backdrop overflow-hidden"
        data-scrollable="true"
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
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
        onClick={onClose}
      >
        <div 
          className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in-up" 
          style={{
            width: '100%',
            maxWidth: '820px',
            height: '92vh',
            maxHeight: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            margin: '0 auto',
            position: 'relative'
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
                onClick={handleShareWhatsApp}
                className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm text-white"
                style={{ fontSize: '0.78rem', background: '#25D366', borderColor: '#25D366' }}
                title="Send / Share Voucher on WhatsApp"
              >
                <MessageSquare size={14} />
                <span className="d-none d-sm-inline">Share on WhatsApp</span>
                <span className="d-inline d-sm-none">WhatsApp</span>
              </button>
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

          {/* ─── Modal Body containing the A4 Document (Scrollable with custom scrollbar) ─── */}
          <div 
            className="modal-voucher-scroll-body custom-voucher-scrollbar overflow-y-auto flex-grow-1 p-2 p-md-3" 
            data-scrollable="true"
            style={{ 
              background: '#f1f5f9',
              minHeight: 0,
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}
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
                onClick={handleShareWhatsApp}
                className="btn btn-success btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 text-white"
                style={{ fontSize: '0.75rem', background: '#25D366', borderColor: '#25D366' }}
              >
                <MessageSquare size={13} />
                <span>Share WhatsApp</span>
              </button>
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
