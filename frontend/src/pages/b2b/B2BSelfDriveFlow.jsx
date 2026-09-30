import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Calendar, Clock, MapPin, Fuel, Gauge, Users, Shield, 
  CheckCircle2, AlertCircle, ArrowRight, ChevronRight, User, Phone, 
  Mail, FileText, Check, DollarSign, Percent, Sparkles, Navigation, X, Wallet, UserCheck,
  Eye, Camera
} from 'lucide-react';
import * as api from '../../services/api';
import ImageCarousel from '../../components/common/ImageCarousel';
import { resolveItemImages } from '../../utils/bookingImageHelper';
import { validateVehicleBookingEligibility } from '../../utils/dateUtils';
import DobPicker from '../../components/common/DobPicker';
import CarDetailsPage from '../customer/CarDetailsPage';
import BikeDetailsPage from '../customer/BikeDetailsPage';
import { isBikeVehicle } from '../../utils/vehicleHelper';
import B2BModalPortal from '../../components/b2b/B2BModalPortal';

const GOA_LOCATIONS = [
  { id: 'mopa', name: 'Manohar International Airport (Mopa - GOX)', type: 'Airport' },
  { id: 'dabolim', name: 'Dabolim Airport (GOI - South Goa)', type: 'Airport' },
  { id: 'madgaon', name: 'Madgaon Railway Station (MAO)', type: 'Station' },
  { id: 'thivim', name: 'Thivim Railway Station', type: 'Station' },
  { id: 'panjim', name: 'Panjim Central Bus Stand / City Center', type: 'Hub' },
  { id: 'calangute', name: 'Calangute / Baga / Candolim Beach Hub', type: 'North Goa' },
  { id: 'anjuna', name: 'Anjuna / Vagator / Siolim', type: 'North Goa' },
  { id: 'colva', name: 'Colva / Benaulim / Varca', type: 'South Goa' },
  { id: 'doorstep', name: 'Hotel / Resort Doorstep Delivery (Anywhere in Goa)', type: 'Custom' }
];

export default function B2BSelfDriveFlow({ partner, activeMode, onBookingSuccess }) {
  // Mode: strictly governed by activeMode prop ('COMMISSION' or 'NON_COMMISSION')
  const mode = activeMode || (partner?.allow_commission ? 'COMMISSION' : 'NON_COMMISSION');

  // Search parameters
  const [pickupLoc, setPickupLoc] = useState('Manohar International Airport (Mopa - GOX)');
  const [dropLoc, setDropLoc] = useState('Manohar International Airport (Mopa - GOX)');
  const [sameDrop, setSameDrop] = useState(true);

  // Driver / Chauffeur Service States (matching main website BookingModal)
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverServiceType, setDriverServiceType] = useState('PICKUP'); // Strictly 'PICKUP', 'DROP', or 'FULL'
  const driverPickupEnabled = driverRequired && driverServiceType === 'PICKUP';
  const driverDropEnabled = driverRequired && driverServiceType === 'DROP';
  const driverFullDayEnabled = driverRequired && driverServiceType === 'FULL';
  const [driverPickupDate, setDriverPickupDate] = useState('');
  const [driverPickupTime, setDriverPickupTime] = useState('10:00 AM');
  const [driverPickupLoc, setDriverPickupLoc] = useState('Goa Airport (Dabolim)');
  const [driverPickupCustomLoc, setDriverPickupCustomLoc] = useState('');

  const [driverDropDate, setDriverDropDate] = useState('');
  const [driverDropTime, setDriverDropTime] = useState('10:00 AM');
  const [driverDropLoc, setDriverDropLoc] = useState('Goa Airport (Dabolim)');
  const [driverDropCustomLoc, setDriverDropCustomLoc] = useState('');

  const [driverFullDayStart, setDriverFullDayStart] = useState('');
  const [driverFullDayEnd, setDriverFullDayEnd] = useState('');
  const [driverFullDayStartLoc, setDriverFullDayStartLoc] = useState('Hotel');
  const [driverFullDayCustomStartLoc, setDriverFullDayCustomStartLoc] = useState('');
  const [driverFullDayEndLoc, setDriverFullDayEndLoc] = useState('Hotel');
  const [driverFullDayCustomEndLoc, setDriverFullDayCustomEndLoc] = useState('');

  const getTodayDateStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  // Default dates: tomorrow to 4 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialPickup = tomorrow.toISOString().split('T')[0];

  const defaultDrop = new Date();
  defaultDrop.setDate(defaultDrop.getDate() + 4);
  const initialDrop = defaultDrop.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(initialPickup);
  const [dropDate, setDropDate] = useState(initialDrop);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropTime, setDropTime] = useState('10:00');

  // Sync driver default dates with rental pickup/drop dates
  useEffect(() => {
    if (pickupDate) {
      if (!driverPickupDate) setDriverPickupDate(pickupDate);
      if (!driverFullDayStart) setDriverFullDayStart(pickupDate);
    }
    if (dropDate) {
      if (!driverDropDate) setDriverDropDate(dropDate);
      if (!driverFullDayEnd) setDriverFullDayEnd(dropDate);
    }
  }, [pickupDate, dropDate]);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  // Booking modal & form
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    license: '',
    id_type: 'Aadhaar / Driving License',
    id_number: '',
    flight_number: '',
    special_requests: '',
    payment_method: 'B2B Account / Cash'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Phase 5: Authoritative backend pricing state
  const [backendPricing, setBackendPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState('');

  // Calculate rental duration in days
  const daysCount = useMemo(() => {
    if (!pickupDate || !dropDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [pickupDate, dropDate]);

  // Calculate Full-Day Driver Days automatically
  const driverFullDayDaysCount = useMemo(() => {
    if (!driverFullDayEnabled || !driverFullDayStart || !driverFullDayEnd) return 0;
    const start = new Date(driverFullDayStart);
    const end = new Date(driverFullDayEnd);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [driverFullDayEnabled, driverFullDayStart, driverFullDayEnd]);

  // Exact driver costs matching main website: ₹400 for Pickup, ₹400 for Drop, ₹800/day for Full-Day
  const driverPickupCost = (driverRequired && driverServiceType === 'PICKUP') ? 400 : 0;
  const driverDropCost = (driverRequired && driverServiceType === 'DROP') ? 400 : 0;
  const driverFullDayCost = (driverRequired && driverServiceType === 'FULL') ? (800 * driverFullDayDaysCount) : 0;
  const driverTotalCharge = driverRequired ? (driverPickupCost + driverDropCost + driverFullDayCost) : 0;
  const totalDriverServiceDays = driverRequired 
    ? (driverServiceType === 'FULL' ? driverFullDayDaysCount : 1) 
    : 0;

  const withDriver = Boolean(driverRequired);

  // Load vehicles and bikes from backend
  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const [carsRes, bikesRes] = await Promise.all([
          api.apiFetch(`${api.API_BASE}?resource=cars`),
          api.apiFetch(`${api.API_BASE}?resource=bikes`)
        ]);
        const cars = carsRes.ok ? await carsRes.json() : [];
        const bikes = bikesRes.ok ? await bikesRes.json() : [];

        const taggedCars = (Array.isArray(cars) ? cars : []).map(c => ({
          ...c,
          fleet_type: (c.category?.toLowerCase().includes('luxury') || parseFloat(c.price_per_day || c.price || 0) >= 4000) ? 'luxury' : 'car'
        }));
        const taggedBikes = (Array.isArray(bikes) ? bikes : []).map(b => ({
          ...b,
          fleet_type: 'bike'
        }));

        setVehicles([...taggedCars, ...taggedBikes]);
      } catch (err) {
        console.warn('Failed to load fleet from backend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  // Phase 5: Local estimate (used for list display and real-time modal updates)
  const calculateVehiclePricingEstimate = (veh, driverCharge = driverTotalCharge, days = daysCount) => {
    if (!veh) {
      return {
        sellingPrice: 0,
        commissionPercent: 10,
        commissionAmount: 0,
        netPayable: 0,
        netDiscountPercent: 10,
        discountAmount: 0,
        netPrice: 0,
        finalPrice: 0,
        driverCharge: 0,
        withDriver: false,
        mode
      };
    }
    const ratePerDay = parseFloat(veh.price_per_day || veh.price || 1500);
    const vehSubtotal = ratePerDay * days;
    const taxAmount = Math.round(vehSubtotal * 0.18);
    const originalSellingPrice = vehSubtotal + taxAmount + driverCharge;
    const commPercent = parseFloat(partner?.default_commission_rate || 10.00);
    const netDiscountPercent = parseFloat(partner?.default_net_discount_rate || 10.00);
    if (mode === 'COMMISSION') {
      const commAmount = Math.round(originalSellingPrice * (commPercent / 100));
      const netPayable = Math.max(0, originalSellingPrice - commAmount);
      return {
        sellingPrice: originalSellingPrice,
        original_reference_price: originalSellingPrice,
        base_vehicle_cost: vehSubtotal + taxAmount,
        commissionPercent: commPercent,
        commission_percent: commPercent,
        commissionAmount: commAmount,
        commission_amount: commAmount,
        netPayable: netPayable,
        net_price: netPayable,
        finalPrice: originalSellingPrice,
        driverCharge: driverCharge,
        withDriver: driverRequired && driverTotalCharge > 0,
        mode: 'COMMISSION'
      };
    } else {
      const discountAmount = Math.round(originalSellingPrice * (netDiscountPercent / 100));
      const netPrice = Math.max(0, originalSellingPrice - discountAmount);
      return {
        sellingPrice: originalSellingPrice,
        original_reference_price: originalSellingPrice,
        base_vehicle_cost: vehSubtotal + taxAmount,
        netDiscountPercent: netDiscountPercent,
        net_discount_percent: netDiscountPercent,
        discountAmount: discountAmount,
        discount_amount: discountAmount,
        netPrice: netPrice,
        net_price: netPrice,
        netPayable: netPrice,
        finalPrice: netPrice,
        driverCharge: driverCharge,
        withDriver: driverRequired && driverTotalCharge > 0,
        mode: 'NON_COMMISSION'
      };
    }
  };

  // Phase 5: Calculate pricing immediately when vehicle is selected
  const handleSelectToBook = async (veh) => {
    setSelectedVehicle(veh);
    setIsBookingModalOpen(true);
    setBookingError('');
    setPricingError('');
    // Calculate live pricing with selected driver options
    const initialPricing = calculateVehiclePricingEstimate(veh, driverTotalCharge, daysCount);
    setBackendPricing(initialPricing);
    setPricingLoading(false);
  };

  // Keep modal pricing live whenever driver services, duration, or vehicle changes
  useEffect(() => {
    if (isBookingModalOpen && selectedVehicle) {
      setBackendPricing(calculateVehiclePricingEstimate(selectedVehicle, driverTotalCharge, daysCount));
    }
  }, [driverTotalCharge, driverRequired, driverPickupEnabled, driverDropEnabled, driverFullDayEnabled, driverFullDayDaysCount, daysCount, isBookingModalOpen]);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!guestDetails.name.trim() || !guestDetails.phone.trim()) {
      setBookingError('Primary guest name and phone number are required.');
      return;
    }

    const hasDriverEarly = Boolean(driverRequired && driverTotalCharge > 0);
    const eligibility = validateVehicleBookingEligibility(
      guestDetails.dob,
      pickupDate,
      !hasDriverEarly,
      guestDetails.license
    );
    if (!eligibility.valid) {
      setBookingError(eligibility.error);
      return;
    }

    // Validate driver service inputs matching main website logic
    if (driverRequired) {
      if (!driverServiceType) {
        setBookingError('Please select a Driver Service option: Pickup (₹400), Drop (₹400), or Full-Day Driver (₹800/day).');
        return;
      }

      if (driverServiceType === 'PICKUP') {
        if (!driverPickupDate) {
          setBookingError('Please select a valid Pickup Date for the Driver Pickup service.');
          return;
        }
        if (driverPickupLoc === 'Custom Address' && !driverPickupCustomLoc.trim()) {
          setBookingError('Please enter the Custom Address for the Driver Pickup service.');
          return;
        }
      }

      if (driverServiceType === 'DROP') {
        if (!driverDropDate) {
          setBookingError('Please select a valid Drop Date for the Driver Drop service.');
          return;
        }
        if (driverDropLoc === 'Custom Address' && !driverDropCustomLoc.trim()) {
          setBookingError('Please enter the Custom Address for the Driver Drop service.');
          return;
        }
      }

      if (driverServiceType === 'FULL') {
        if (!driverFullDayStart || !driverFullDayEnd) {
          setBookingError('Please select both Start and End Dates for the Full-Day Driver service.');
          return;
        }
        if (driverFullDayStart > driverFullDayEnd) {
          setBookingError('Driver Start Date cannot be after End Date.');
          return;
        }
        if (driverFullDayStartLoc === 'Custom Address' && !driverFullDayCustomStartLoc.trim()) {
          setBookingError('Please enter the Custom Start Location for the Driver service.');
          return;
        }
        if (driverFullDayEndLoc === 'Custom Address' && !driverFullDayCustomEndLoc.trim()) {
          setBookingError('Please enter the Custom End Location for the Driver service.');
          return;
        }
      }
    }

    setBookingLoading(true);
    setBookingError('');

    const finalPickupLocResolved = driverPickupLoc === 'Custom Address' ? driverPickupCustomLoc : driverPickupLoc;
    const finalDropLocResolved = driverDropLoc === 'Custom Address' ? driverDropCustomLoc : driverDropLoc;
    const finalFullDayStartLocResolved = driverFullDayStartLoc === 'Custom Address' ? driverFullDayCustomStartLoc : driverFullDayStartLoc;
    const finalFullDayEndLocResolved = driverFullDayEndLoc === 'Custom Address' ? driverFullDayCustomEndLoc : driverFullDayEndLoc;

    const driverDetailsPayload = {
      enabled: Boolean(driverRequired && (driverPickupEnabled || driverDropEnabled || driverFullDayEnabled)),
      pickup: {
        enabled: driverPickupEnabled,
        date: driverPickupDate || pickupDate,
        time: driverPickupTime || pickupTime,
        location: finalPickupLocResolved
      },
      drop: {
        enabled: driverDropEnabled,
        date: driverDropDate || dropDate,
        time: driverDropTime || dropTime,
        location: finalDropLocResolved
      },
      fullDay: {
        enabled: driverFullDayEnabled,
        startDate: driverFullDayStart || pickupDate,
        endDate: driverFullDayEnd || dropDate,
        daysCount: driverFullDayDaysCount,
        startLocation: finalFullDayStartLocResolved,
        endLocation: finalFullDayEndLocResolved
      },
      dutyStartTime: "09:00",
      dutyEndTime: "19:00",
      dutyDescription: "8–10 Hours Local Daily Duty",
      totalCharge: driverTotalCharge
    };

    const hasDriver = Boolean(driverRequired && driverTotalCharge > 0);
    const bookingPayload = {
      b2b_partner_id: partner?.id || partner?.username || '',
      b2b_mode: mode,
      service_type: selectedVehicle.fleet_type === 'bike' ? 'bike' : 'car',
      item_id: selectedVehicle.id,
      item_name: `${selectedVehicle.name} (${hasDriver ? 'With Verified Driver' : 'Self Drive'})`,
      days: daysCount,
      qty: 1,
      pickup_date: `${pickupDate} ${pickupTime}`,
      drop_date: `${dropDate} ${dropTime}`,
      pickup_location: pickupLoc,
      drop_location: sameDrop ? pickupLoc : dropLoc,
      guest_name: guestDetails.name,
      guest_phone: guestDetails.phone,
      guest_email: guestDetails.email,
      date_of_birth: guestDetails.dob,
      license: guestDetails.license,
      payment_method: guestDetails.payment_method,
      driver_required: hasDriver ? 1 : 0,
      driver_service_type: hasDriver ? driverServiceType : null,
      with_driver: hasDriver,
      driver_charge: driverTotalCharge,
      driver_days: totalDriverServiceDays,
      driver_earning: driverTotalCharge,
      driver_payment_status: 'Pending',
      driver_pickup_enabled: driverPickupEnabled ? 1 : 0,
      driver_drop_enabled: driverDropEnabled ? 1 : 0,
      driver_fullday_enabled: driverFullDayEnabled ? 1 : 0,
      driver_pickup_date: driverPickupDate || pickupDate,
      driver_pickup_time: driverPickupTime,
      driver_pickup_loc: finalPickupLocResolved,
      driver_drop_date: driverDropDate || dropDate,
      driver_drop_time: driverDropTime,
      driver_drop_loc: finalDropLocResolved,
      driver_fullday_start: driverFullDayStart || pickupDate,
      driver_fullday_end: driverFullDayEnd || dropDate,
      driver_fullday_start_loc: finalFullDayStartLocResolved,
      driver_fullday_end_loc: finalFullDayEndLocResolved,
      driver_details: driverDetailsPayload,
      pricing_snapshot: backendPricing || undefined,
      extra_details: {
        with_driver: hasDriver,
        driver_required: hasDriver ? 1 : 0,
        driver_service_type: hasDriver ? driverServiceType : null,
        driver_charge: driverTotalCharge,
        driver_days: totalDriverServiceDays,
        driver_details: driverDetailsPayload,
        id_type: guestDetails.id_type,
        id_number: guestDetails.license || guestDetails.id_number,
        date_of_birth: guestDetails.dob,
        license: guestDetails.license,
        flight_number: guestDetails.flight_number,
        special_requests: guestDetails.special_requests
      }
    };

    try {
      const res = await api.b2bBook(bookingPayload);
      if (res && res.success) {
        setBookingSuccessData(res);
        if (onBookingSuccess) onBookingSuccess(res);
      } else {
        setBookingError(res.error || 'Failed to confirm booking.');
      }
    } catch (err) {
      setBookingError(err.message || 'An error occurred during booking creation.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    if (filterCategory === 'All') return vehicles;
    if (filterCategory === 'Bikes') return vehicles.filter(v => v.fleet_type === 'bike');
    if (filterCategory === 'Cars') return vehicles.filter(v => v.fleet_type === 'car');
    if (filterCategory === 'Luxury') return vehicles.filter(v => v.fleet_type === 'luxury');
    return vehicles.filter(v => 
      (v.category && v.category.toLowerCase().includes(filterCategory.toLowerCase())) ||
      (v.transmission && v.transmission.toLowerCase().includes(filterCategory.toLowerCase())) ||
      (v.fuel_type && v.fuel_type.toLowerCase().includes(filterCategory.toLowerCase()))
    );
  }, [vehicles, filterCategory]);

  return (
    <div className="animate-fade-in pb-5">
      {/* Header Banner */}
      <div className="p-4 rounded-4 mb-4 text-white position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #162E4C 100%)' }}>
        <div className="position-relative z-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">
                  B2B VEHICLE RESERVATIONS
                </span>
                <span className={`badge ${mode === 'COMMISSION' ? 'bg-warning text-dark' : 'bg-primary text-white'} text-xxs fw-bold px-2.5 py-0.5 rounded-pill`}>
                  {mode === 'COMMISSION' ? 'Commission Mode (Standard)' : 'Non-Commission Mode (Net Wholesale)'}
                </span>
              </div>
              <h4 className="fw-bold mb-1 font-heading">Goa Self Drive Holiday & Rental Portal</h4>
              <p className="text-white-50 text-xs mb-0">
                Book premium hatchback, sedan, SUV & luxury vehicles across Goa airports and hotspots with live B2B rates.
              </p>
            </div>
            <div className="text-end d-none d-md-block">
              <span className="text-white-50 text-xxs d-block">Authorized Agency</span>
              <span className="fw-bold text-warning text-sm">{partner?.company_name || 'B2B Partner Agency'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="p-4 border-bottom bg-light">
          <h6 className="fw-bold mb-3 text-dark text-xs text-uppercase tracking-wider font-heading d-flex align-items-center gap-2">
            <Navigation size={16} className="text-warning" /> Step 1: Trip Itinerary & Schedule
          </h6>

          <div className="row g-3">
            {/* Pickup Location */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Pickup Location</label>
              <select
                className="form-select form-select-sm"
                value={pickupLoc}
                onChange={(e) => {
                  setPickupLoc(e.target.value);
                  if (sameDrop) setDropLoc(e.target.value);
                }}
              >
                {GOA_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.name}>[{loc.type}] {loc.name}</option>
                ))}
              </select>
            </div>

            {/* Drop Location */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-0">Drop Location</label>
                <div className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="sameDropSwitch"
                    checked={sameDrop}
                    onChange={(e) => {
                      setSameDrop(e.target.checked);
                      if (e.target.checked) setDropLoc(pickupLoc);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label text-xxs text-muted" htmlFor="sameDropSwitch" style={{ cursor: 'pointer' }}>
                    Same
                  </label>
                </div>
              </div>
              <select
                className="form-select form-select-sm"
                value={sameDrop ? pickupLoc : dropLoc}
                onChange={(e) => setDropLoc(e.target.value)}
                disabled={sameDrop}
              >
                {GOA_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.name}>[{loc.type}] {loc.name}</option>
                ))}
              </select>
            </div>

            {/* Pickup Date & Time */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Pickup Date & Time</label>
              <div className="input-group input-group-sm">
                <input
                  type="date"
                  className="form-control"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
                <input
                  type="time"
                  className="form-control"
                  style={{ maxWidth: '90px' }}
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>

            {/* Drop Date & Time */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Drop Date & Time</label>
              <div className="input-group input-group-sm">
                <input
                  type="date"
                  className="form-control"
                  value={dropDate}
                  min={pickupDate}
                  onChange={(e) => setDropDate(e.target.value)}
                />
                <input
                  type="time"
                  className="form-control"
                  style={{ maxWidth: '90px' }}
                  value={dropTime}
                  onChange={(e) => setDropTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3 pt-3 border-top">
            <div className="d-flex align-items-center gap-3">
              <span className="text-xs fw-bold text-dark">Driving Preference:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setDriverRequired(false)}
                  className={`btn ${!driverRequired ? 'btn-dark' : 'btn-outline-secondary'} text-xs`}
                >
                  Pure Self Drive (No Driver)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDriverRequired(true);
                    if (!driverServiceType) setDriverServiceType('PICKUP');
                  }}
                  className={`btn ${driverRequired ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'} text-xs`}
                >
                  Need Verified Driver in Goa
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark text-white px-3 py-1.5 rounded-pill text-xs">
                Total Duration: <strong>{daysCount} Day{daysCount > 1 ? 's' : ''}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filter Categories */}
        <div className="p-3 bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <span className="text-xxs fw-bold text-muted text-uppercase me-1">Category:</span>
            {['All', 'Bikes', 'Cars', 'Luxury', 'Hatchback', 'SUV', 'Automatic'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`btn btn-xs py-1 px-2.5 rounded-pill border text-xxs fw-semibold ${
                  filterCategory === cat 
                    ? 'btn-dark' 
                    : 'btn-light text-muted border-light-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xxs text-muted">
            Showing <strong>{filteredVehicles.length}</strong> available vehicles in Goa fleet
          </span>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading fleet...</span>
          </div>
          <p className="text-muted text-xs mt-2">Loading authorized WOW GOA vehicle fleet...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <Car size={36} className="mx-auto text-muted opacity-50 mb-2" />
          <h6 className="fw-bold text-dark">No vehicles matched the selected filter</h6>
          <p className="text-xs mb-3">Try clearing category filters to view all available vehicles.</p>
          <button className="btn btn-sm btn-outline-dark rounded-pill mx-auto px-3" onClick={() => setFilterCategory('All')}>
            View All Vehicles
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filteredVehicles.map(veh => {
            const pricing = calculateVehiclePricingEstimate(veh);
            const isBike = veh.fleet_type === 'bike';
            const isLuxury = veh.fleet_type === 'luxury';
            return (
              <div key={veh.id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column transition-all hover-shadow-lg" style={{ background: '#ffffff' }}>
                  {/* Vehicle Image */}
                  <div className="position-relative" style={{ height: '190px', background: '#F8F9FA', cursor: 'pointer' }} onClick={() => setDetailVehicle(veh)}>
                    {veh.image ? (
                      <img 
                        src={veh.image} 
                        alt={veh.name}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallbackEl = e.target.parentElement.querySelector('.b2b-no-photo-wrap');
                          if (fallbackEl) fallbackEl.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="b2b-no-photo-wrap flex-column align-items-center justify-content-center w-100 h-100 text-muted p-2" 
                      style={{ display: veh.image ? 'none' : 'flex', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    >
                      <Camera size={24} className="text-secondary opacity-50 mb-1" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>No photo uploaded</span>
                    </div>
                    <div className="position-absolute top-0 start-0 m-2.5 d-flex gap-1.5 flex-wrap">
                      <span className={`badge ${isBike ? 'bg-primary' : isLuxury ? 'bg-warning text-dark' : 'bg-dark bg-opacity-75'} backdrop-blur text-white text-xxs px-2 py-1 rounded-pill`}>
                        {isBike ? 'Two Wheeler / Bike' : isLuxury ? 'Luxury Fleet' : (veh.category || 'Standard')}
                      </span>
                      {veh.transmission && !isBike && (
                        <span className="badge bg-dark bg-opacity-75 backdrop-blur text-white text-xxs px-2 py-1 rounded-pill">
                          {veh.transmission}
                        </span>
                      )}
                    </div>
                    <div className="position-absolute bottom-0 end-0 m-2.5">
                      <span className="badge bg-warning text-dark fw-bold text-xxs px-2 py-1 rounded-pill shadow">
                        Goa Authorized
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Card Body */}
                  <div className="p-3.5 flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-start justify-content-between mb-1">
                        <h6 className="fw-bold text-dark font-heading mb-0 text-sm" style={{ cursor: 'pointer' }} onClick={() => setDetailVehicle(veh)}>{veh.name}</h6>
                        <span className="text-xxs text-muted">{veh.fuel_type || (isBike ? 'Petrol' : 'Petrol')}</span>
                      </div>

                      {/* Specs Badges */}
                      <div className="d-flex align-items-center gap-2 text-xxs text-muted my-2 pb-2 border-bottom flex-wrap">
                        {isBike ? (
                          <>
                            <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-1.5 py-0.5 rounded">
                              {veh.category || 'Scooter / Bike'}
                            </span>
                            <span>•</span>
                            <span>2 Helmets Included</span>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <Gauge size={12} /> Unlimited KMs
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="d-flex align-items-center gap-1">
                              <Users size={12} /> {veh.seating_capacity || 5} Seats
                            </span>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <Fuel size={12} /> {veh.fuel_type || 'Petrol'}
                            </span>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <Gauge size={12} /> Unlimited KMs
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-muted text-xxs line-clamp-2 mb-2">
                        {veh.description || 'Full comprehensive insurance included. Clean & sanitized delivery.'}
                      </p>
                    </div>

                    {/* Mode Specific Pricing Box */}
                    <div className="mt-2 pt-2 border-top">
                      {mode === 'COMMISSION' ? (
                        <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 mb-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-xxs text-muted">Customer Selling Price:</span>
                            <span className="text-xs fw-bold text-dark">₹{(pricing.sellingPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-1 text-success">
                            <span className="text-xxs fw-semibold">Agent Commission ({pricing.commissionPercent || 0}%):</span>
                            <span className="text-xs fw-bold">+₹{(pricing.commissionAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-warning border-opacity-25">
                            <span className="text-xxs fw-bold text-dark">Net Payout to WOW Goa:</span>
                            <span className="text-sm fw-black text-dark">₹{(pricing.netPayable || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 mb-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-xxs text-muted">Retail D2C Price:</span>
                            <span className="text-xs text-muted text-decoration-line-through">₹{(pricing.sellingPrice || 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-1 text-primary">
                            <span className="text-xxs fw-semibold">B2B Net Discount ({pricing.netDiscountPercent || 0}%):</span>
                            <span className="text-xs fw-bold">-₹{(pricing.discountAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-primary border-opacity-25">
                            <span className="text-xxs fw-bold text-dark">B2B Net Rate Payable:</span>
                            <span className="text-sm fw-black text-primary">₹{(pricing.netPrice || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailVehicle(veh)}
                          className="btn btn-outline-secondary btn-sm rounded-pill text-xxs px-3 py-2 d-flex align-items-center justify-content-center gap-1"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailVehicle(veh)}
                          className={`btn flex-grow-1 btn-sm rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-1.5 ${
                            mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                          }`}
                        >
                          <span>Book for Guest</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Form Modal */}
      <B2BModalPortal
        isOpen={isBookingModalOpen && Boolean(selectedVehicle)}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingSuccessData(null);
        }}
        ariaLabel="B2B Vehicle Booking Confirmation Modal"
      >
        {isBookingModalOpen && selectedVehicle && (
          <div 
            className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in"
            style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 text-white d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E' }}>
              <div>
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill mb-1">
                  B2B VEHICLE BOOKING CONFIRMATION
                </span>
                <h5 className="fw-bold mb-0 text-white font-heading">{selectedVehicle.name}</h5>
              </div>
              <button 
                className="btn btn-link text-white-50 p-0 border-0" 
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setBookingSuccessData(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-grow-1" style={{ background: '#F8F9FA' }}>
              {bookingSuccessData ? (
                <div className="text-center py-4">
                  <div className="rounded-circle p-3 bg-success bg-opacity-20 text-success d-inline-flex mb-3">
                    <CheckCircle2 size={42} />
                  </div>
                  <h4 className="fw-bold text-dark font-heading mb-1">
                    {(bookingSuccessData.status || 'Confirmed').toLowerCase() === 'pending'
                      ? 'Booking Received (Pending Confirmation)'
                      : `Booking ${bookingSuccessData.status || 'Confirmed'} Successfully!`}
                  </h4>
                  <p className="text-muted text-xs mb-3">
                    B2B Booking ID: <strong>#{bookingSuccessData.booking_id}</strong>
                  </p>

                  <div className="p-3 bg-white rounded-3 border text-start mb-3">
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Vehicle:</span>
                      <span className="fw-bold text-dark">{selectedVehicle.name}</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Rental Schedule:</span>
                      <span className="fw-bold text-dark">{pickupDate} to {dropDate} ({daysCount} Days)</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="fw-bold text-dark">{pickupLoc}</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Fulfillment Status:</span>
                      <span className={`badge ${(bookingSuccessData.status || 'Confirmed').toLowerCase() === 'pending' ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                        {bookingSuccessData.status || 'Confirmed'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1">
                      <span className="text-muted">Guest:</span>
                      <span className="fw-bold text-dark">{guestDetails.name} ({guestDetails.phone})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-dark btn-sm rounded-pill px-4"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingSuccessData(null);
                    }}
                  >
                    Done & Return
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking}>
                  {/* Multi-Image Preview Carousel in Booking Modal */}
                  <div className="mb-3">
                    <ImageCarousel
                      images={resolveItemImages(selectedVehicle, 'selfdrive')}
                      alt={selectedVehicle.name}
                      height="200px"
                      rounded="12px"
                    />
                  </div>

                  {/* Interactive Calendar & Schedule Selector */}
                  <div className="p-3 bg-white rounded-3 border mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2.5">
                      <div className="d-flex align-items-center gap-1.5">
                        <Calendar size={15} className="text-warning" />
                        <span className="text-xxs fw-bold text-uppercase text-dark">
                          Select Rental Dates ({daysCount} {daysCount === 1 ? 'Day' : 'Days'})
                        </span>
                      </div>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-3xs rounded-pill">
                        Live Pricing & Inventory Synced
                      </span>
                    </div>

                    {/* Date and Time Inputs */}
                    <div className="row g-2">
                      <div className="col-12 col-sm-6">
                        <label className="form-label text-xxs fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                          <Clock size={11} className="text-primary" /> Pickup Date & Time *
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={pickupDate}
                            onChange={(e) => {
                              const newPickup = e.target.value;
                              setPickupDate(newPickup);
                              if (new Date(newPickup) >= new Date(dropDate)) {
                                const nextDay = new Date(newPickup);
                                nextDay.setDate(nextDay.getDate() + 3);
                                setDropDate(nextDay.toISOString().split('T')[0]);
                              }
                            }}
                            className="form-control form-control-sm text-xs fw-bold"
                            required
                          />
                          <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="form-control form-control-sm text-xs px-1"
                            style={{ maxWidth: '80px' }}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="form-label text-xxs fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                          <Clock size={11} className="text-danger" /> Drop-off Date & Time *
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type="date"
                            min={pickupDate || new Date().toISOString().split('T')[0]}
                            value={dropDate}
                            onChange={(e) => setDropDate(e.target.value)}
                            className="form-control form-control-sm text-xs fw-bold"
                            required
                          />
                          <input
                            type="time"
                            value={dropTime}
                            onChange={(e) => setDropTime(e.target.value)}
                            className="form-control form-control-sm text-xs px-1"
                            style={{ maxWidth: '80px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pickup Location Hub */}
                    <div className="mt-2.5 pt-2 border-top">
                      <label className="form-label text-xxs fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                        <MapPin size={11} className="text-warning" /> Pickup Location Hub *
                      </label>
                      <select
                        value={pickupLoc}
                        onChange={(e) => setPickupLoc(e.target.value)}
                        className="form-select form-select-sm text-xs"
                      >
                        {GOA_LOCATIONS.map(loc => (
                          <option key={loc.id} value={loc.name}>{loc.name} ({loc.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Private Driver Service Section (Exact main website structure) */}
                  {selectedVehicle?.fleet_type !== 'bike' && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div className="form-check d-flex align-items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          id="b2b_driver_req"
                          checked={driverRequired}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDriverRequired(checked);
                            if (checked && !driverServiceType) {
                              setDriverServiceType('PICKUP');
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label className="form-check-label fw-bold text-dark mb-0 small d-flex align-items-center gap-1.5 flex-wrap font-heading" htmlFor="b2b_driver_req" style={{ cursor: 'pointer' }}>
                          <span>Need a Verified Private Driver in Goa?</span>
                        </label>
                      </div>
                      
                      <div className="text-muted small ps-4 mb-2" style={{ fontSize: '0.74rem' }}>
                        Customized driver service in Goa. You are charged ONLY for the selected services & dates (not whole stay).
                      </div>

                      {driverRequired && (
                        <div className="mt-3 pt-3 border-top border-warning border-opacity-40 d-flex flex-column gap-2.5 ps-1 pe-1 animate-fade-in">
                          
                          {/* ─── Choice 1: 🚗 Pickup Service — ₹400 ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'PICKUP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="d-flex align-items-center justify-content-between mb-0">
                              <div className="form-check d-flex align-items-center gap-2 mb-0">
                                <input
                                  type="radio"
                                  name="b2b_driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="b2b_driver_pickup"
                                  checked={driverServiceType === 'PICKUP'}
                                  onChange={() => setDriverServiceType('PICKUP')}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="b2b_driver_pickup" style={{ cursor: 'pointer' }}>
                                  🚗 Pickup Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverPickupEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverPickupDate || pickupDate || getTodayDateStr()}
                                    onChange={(e) => setDriverPickupDate(e.target.value)}
                                    required={driverPickupEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupTime}
                                    onChange={(e) => setDriverPickupTime(e.target.value)}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupLoc}
                                    onChange={(e) => setDriverPickupLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverPickupLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full pickup address or landmark..."
                                      value={driverPickupCustomLoc}
                                      onChange={(e) => setDriverPickupCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 2: 🏁 Drop Service — ₹400 ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'DROP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="d-flex align-items-center justify-content-between mb-0">
                              <div className="form-check d-flex align-items-center gap-2 mb-0">
                                <input
                                  type="radio"
                                  name="b2b_driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="b2b_driver_drop"
                                  checked={driverServiceType === 'DROP'}
                                  onChange={() => setDriverServiceType('DROP')}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="b2b_driver_drop" style={{ cursor: 'pointer' }}>
                                  🏁 Drop Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverDropEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverDropDate || dropDate || getTodayDateStr()}
                                    onChange={(e) => setDriverDropDate(e.target.value)}
                                    required={driverDropEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropTime}
                                    onChange={(e) => setDriverDropTime(e.target.value)}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropLoc}
                                    onChange={(e) => setDriverDropLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="North Goa">🏖️ North Goa</option>
                                    <option value="South Goa">🏖️ South Goa</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverDropLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full drop-off address or landmark..."
                                      value={driverDropCustomLoc}
                                      onChange={(e) => setDriverDropCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 3: 👨‍✈️ Full-Day Driver — ₹800/day ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'FULL' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="d-flex align-items-center justify-content-between mb-0">
                              <div className="form-check d-flex align-items-center gap-2 mb-0">
                                <input
                                  type="radio"
                                  name="b2b_driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="b2b_driver_fullday"
                                  checked={driverServiceType === 'FULL'}
                                  onChange={() => setDriverServiceType('FULL')}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="b2b_driver_fullday" style={{ cursor: 'pointer' }}>
                                  👨‍✈️ Full-Day Driver
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹800 / day
                              </span>
                            </div>

                            <div className="text-muted text-xxs mt-1 ps-4" style={{ fontSize: '0.7rem' }}>
                              ⏰ 09:00 AM – 07:00 PM (8–10 Hours Local Daily Duty)
                            </div>

                            {driverFullDayEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver Start Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverFullDayStart || pickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      const newStart = e.target.value;
                                      setDriverFullDayStart(newStart);
                                      if (driverFullDayEnd && driverFullDayEnd < newStart) {
                                        setDriverFullDayEnd(newStart);
                                      }
                                    }}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver End Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={driverFullDayStart || getTodayDateStr()}
                                    value={driverFullDayEnd || dropDate || getTodayDateStr()}
                                    onChange={(e) => setDriverFullDayEnd(e.target.value)}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup / Start Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayStartLoc}
                                    onChange={(e) => setDriverFullDayStartLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayStartLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter start location..."
                                      value={driverFullDayCustomStartLoc}
                                      onChange={(e) => setDriverFullDayCustomStartLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop / End Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayEndLoc}
                                    onChange={(e) => setDriverFullDayEndLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayEndLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter end location..."
                                      value={driverFullDayCustomEndLoc}
                                      onChange={(e) => setDriverFullDayCustomEndLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                  {bookingError && (
                    <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Guest details fields */}
                  <h6 className="fw-bold text-dark text-xs text-uppercase mb-2.5 font-heading">
                    Guest Travel Details
                  </h6>
                  <div className="row g-2.5 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Primary Guest Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Amit Verma"
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Guest Mobile Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="10-digit phone"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Guest Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="guest@gmail.com"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">
                        Guest Date of Birth <span className="text-danger">*</span>
                      </label>
                      <DobPicker
                        value={guestDetails.dob}
                        onChange={(val) => setGuestDetails(prev => ({ ...prev, dob: val }))}
                        referenceDate={pickupDate}
                        required={true}
                        id="b2b-guest-dob"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">
                        Driving License Number {!(driverRequired && driverTotalCharge > 0) ? <span className="text-danger">*</span> : <span className="text-muted fw-normal"> (Optional with Driver)</span>}
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. DL-1420180098765"
                        value={guestDetails.license}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, license: e.target.value }))}
                        required={!(driverRequired && driverTotalCharge > 0)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Flight / Train Arrival No.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 6E 543"
                        value={guestDetails.flight_number}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, flight_number: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Special Delivery Requests</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Child seat, infant carrier, late night arrival"
                        value={guestDetails.special_requests}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, special_requests: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="p-3 rounded-3 bg-white border mb-3">
                    <h6 className="fw-bold text-dark text-xxs text-uppercase mb-2 font-heading">
                      Financial Snapshot ({mode})
                    </h6>
                    {pricingLoading ? (
                      <div className="text-center text-muted text-xs py-2">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Fetching live pricing from server...
                      </div>
                    ) : pricingError ? (
                      <div className="alert alert-warning text-xxs p-2 mb-0">{pricingError}</div>
                    ) : (() => {
                      // Phase 5: Display backend-authoritative pricing (falls back to estimate if unavailable)
                      const pr = backendPricing || calculateVehiclePricingEstimate(selectedVehicle, driverTotalCharge, daysCount);
                      const isAuth = !!backendPricing;
                      const baseVehRate = pr.base_vehicle_cost || (pr.sellingPrice - (pr.driverCharge || 0));
                      return mode === 'COMMISSION' ? (
                        <div className="text-xs">
                          {isAuth && <div className="badge bg-success text-white text-xxs mb-1">✓ Live Calculation Synced</div>}
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>Base Rate ({daysCount} Days + Tax):</span>
                            <span>₹{baseVehRate.toLocaleString()}</span>
                          </div>
                          {driverRequired && driverPickupEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Driver Pickup Service:
                              </span>
                              <span>+₹400</span>
                            </div>
                          )}
                          {driverRequired && driverDropEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Driver Drop Service:
                              </span>
                              <span>+₹400</span>
                            </div>
                          )}
                          {driverRequired && driverFullDayEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Full-Day Driver ({driverFullDayDaysCount} Days × ₹800):
                              </span>
                              <span>+₹{(800 * driverFullDayDaysCount).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between py-1 text-success fw-semibold">
                            <span>Your Commission ({pr.commission_percent ?? pr.commissionPercent ?? 0}%):</span>
                            <span>+₹{(pr.commission_amount ?? pr.commissionAmount ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-dark fs-6 mt-1">
                            <span>Payable to WOW Goa:</span>
                            <span>₹{(pr.net_price ?? pr.netPayable ?? pr.final_payable_amount ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs">
                          {isAuth && <div className="badge bg-success text-white text-xxs mb-1">✓ Live Calculation Synced</div>}
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>D2C Retail Price:</span>
                            <span className="text-decoration-line-through">₹{(pr.original_reference_price || pr.sellingPrice || 0).toLocaleString()}</span>
                          </div>
                          {driverRequired && driverPickupEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Driver Pickup Service:
                              </span>
                              <span>+₹400</span>
                            </div>
                          )}
                          {driverRequired && driverDropEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Driver Drop Service:
                              </span>
                              <span>+₹400</span>
                            </div>
                          )}
                          {driverRequired && driverFullDayEnabled && (
                            <div className="d-flex justify-content-between py-1 text-dark fw-semibold">
                              <span className="d-flex align-items-center gap-1">
                                <UserCheck size={12} className="text-warning" /> Full-Day Driver ({driverFullDayDaysCount} Days × ₹800):
                              </span>
                              <span>+₹{(800 * driverFullDayDaysCount).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between py-1 text-primary fw-semibold">
                            <span>B2B Net Discount ({pr.net_discount_percent ?? pr.netDiscountPercent ?? 0}%):</span>
                            <span>-₹{(pr.discount_amount ?? pr.discountAmount ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-primary fs-6 mt-1">
                            <span>Total Wholesale Net Price:</span>
                            <span>₹{(pr.net_price ?? pr.netPrice ?? pr.final_payable_amount ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Settlement / Payment Method */}
                  <div className="mb-3">
                    <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">
                      Settlement Method *
                    </label>
                    <div className="p-2.5 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="p-1.5 rounded-circle bg-warning text-dark">
                          <Wallet size={14} />
                        </span>
                        <div>
                          <strong className="text-dark d-block text-xs">Prepaid Agent Wallet</strong>
                          <span className="text-muted text-xxs">
                            Available: ₹{parseFloat(partner?.wallet_balance || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-3xs rounded-pill">
                        Instant Booking Debit
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className={`btn w-100 py-2.5 rounded-pill fw-bold text-sm font-heading ${
                      mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                    }`}
                  >
                    {bookingLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : (
                      <Check size={16} className="me-1" />
                    )}
                    Confirm B2B Booking Now
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </B2BModalPortal>
      {/* ── AUTHORITATIVE D2C VEHICLE DETAILS PAGE (CARS & BIKES SEPARATED) ── */}
      <B2BModalPortal
        isOpen={Boolean(detailVehicle)}
        onClose={() => setDetailVehicle(null)}
        isFullScreen={true}
        ariaLabel="B2B Vehicle Details"
      >
        {detailVehicle && (
          <div className="w-100 min-vh-100 bg-white" style={{ overflowY: 'auto' }}>
            {isBikeVehicle(detailVehicle) ? (
              <BikeDetailsPage
                bike={detailVehicle}
                pickupDate={pickupDate}
                dropDate={dropDate}
                bookingDays={daysCount}
                actionLabel="Book for Guest"
                backLabel="Back to B2B Fleet"
                breadcrumbPrefix="B2B Portal / Self Drive Bikes"
                onBack={() => setDetailVehicle(null)}
                onBook={(veh) => {
                  const targetVeh = veh || detailVehicle;
                  setDetailVehicle(null);
                  handleSelectToBook(targetVeh);
                }}
              />
            ) : (
              <CarDetailsPage
                car={detailVehicle}
                pickupDate={pickupDate}
                dropDate={dropDate}
                bookingDays={daysCount}
                actionLabel="Book for Guest"
                backLabel="Back to B2B Fleet"
                breadcrumbPrefix="B2B Portal / Self Drive Cars"
                onBack={() => setDetailVehicle(null)}
                onBook={(veh) => {
                  const targetVeh = veh || detailVehicle;
                  setDetailVehicle(null);
                  handleSelectToBook(targetVeh);
                }}
              />
            )}
          </div>
        )}
      </B2BModalPortal>
    </div>
  );
}
