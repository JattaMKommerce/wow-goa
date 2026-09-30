import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Hotel, Plane, Wand2, Check, CheckCircle2, Star, Users, Calendar, 
  MapPin, Fuel, Gauge, ArrowRight, ArrowLeft, X, Wallet, ShieldCheck, Clock, 
  Sparkles, Tag, Gift, ChevronRight, AlertCircle, Phone, Mail, User, CheckCircle,
  Eye, BedDouble, Utensils, Search
} from 'lucide-react';
import * as api from '../../services/api';
import ImageCarousel from '../../components/common/ImageCarousel';
import CarDetailsPage from '../customer/CarDetailsPage';
import BikeDetailsPage from '../customer/BikeDetailsPage';
import HotelDetailsPage from '../customer/HotelDetailsPage';
import ActivityDetailsPage from '../customer/ActivityDetailsPage';
import { isBikeVehicle } from '../../utils/vehicleHelper';
import B2BModalPortal from '../../components/b2b/B2BModalPortal';

const GOA_LOCATIONS = [
  'Manohar International Airport (Mopa - GOX)',
  'Dabolim Airport (GOI - South Goa)',
  'Calangute / Baga Beach Hub',
  'Candolim / Sinquerim',
  'Anjuna / Vagator',
  'Panaji City Center',
  'Madgaon Railway Station (MAO)',
  'Hotel / Resort Doorstep Delivery'
];

const FLIGHT_ORIGINS = [
  'Mumbai (BOM)', 'New Delhi (DEL)', 'Bengaluru (BLR)', 
  'Hyderabad (HYD)', 'Chennai (MAA)', 'Pune (PNQ)', 
  'Ahmedabad (AMD)', 'Kolkata (CCU)'
];

export default function B2BCraftMyTripFlow({ partner, activeMode, onBookingSuccess, onNavigateToBookings }) {
  const mode = activeMode || (partner?.allow_commission ? 'COMMISSION' : 'NON_COMMISSION');
  const commRate = parseFloat(partner?.default_commission_rate || 10.00);
  const netDiscountRate = parseFloat(partner?.default_net_discount_rate || 10.00);

  // Wizard Step
  const [step, setStep] = useState(1);

  // Default Dates: Tomorrow to 4 days later
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const defaultDropStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, []);

  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [dropDate, setDropDate] = useState(defaultDropStr);
  const [location, setLocation] = useState(GOA_LOCATIONS[0]);
  const [memberCount, setMemberCount] = useState(2);

  // Duration in nights and days
  const nights = useMemo(() => {
    if (!pickupDate || !dropDate) return 3;
    const s = new Date(pickupDate);
    const e = new Date(dropDate);
    const diff = Math.round((e - s) / (1000 * 3600 * 24));
    return Math.max(1, diff);
  }, [pickupDate, dropDate]);

  const days = nights + 1;

  // Inventory Data
  const [cars, setCars] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1: Vehicle Selection
  const [vehicleTab, setVehicleTab] = useState('cars'); // 'cars', 'bikes', 'skip'
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Step 2: Hotel Selection
  const [skipHotel, setSkipHotel] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelFilterStars, setHotelFilterStars] = useState('All');
  const [hotelAreaFilter, setHotelAreaFilter] = useState('All');
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');

  // Authoritative Full-Page Details Modal Views (matching main website CraftMyTripPage)
  const [viewingVehicleDetails, setViewingVehicleDetails] = useState(null);
  const [viewingHotelDetails, setViewingHotelDetails] = useState(null);
  const [viewingActivityDetails, setViewingActivityDetails] = useState(null);

  // Step 3: Activities Selection
  const [activities, setActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');

  // Step 4: Flight Selection
  const [includeFlight, setIncludeFlight] = useState(false);
  const [flightOrigin, setFlightOrigin] = useState(FLIGHT_ORIGINS[0]);
  const [flightAirline, setFlightAirline] = useState('IndiGo Premium');
  const [flightClass, setFlightClass] = useState('Economy');
  const [flightPricePerPerson, setFlightPricePerPerson] = useState(4800);

  // Step 5: Guest Details & Booking State
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    phone: '',
    email: '',
    special_requests: '',
    payment_method: 'Prepaid Agent Wallet'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Load live cars, bikes, hotels, activities
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingData(true);
      try {
        const [cList, bList, hList, aList] = await Promise.all([
          api.fetchCars().catch(() => []),
          api.fetchBikes().catch(() => []),
          api.fetchHotels().catch(() => []),
          api.fetchActivities().catch(() => [])
        ]);
        if (isMounted) {
          setCars(Array.isArray(cList) ? cList : []);
          setBikes(Array.isArray(bList) ? bList : []);
          setHotels(Array.isArray(hList) ? hList : []);
          setActivities(Array.isArray(aList) ? aList : []);
        }
      } catch (err) {
        console.warn('Error loading craft inventory:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Pricing Calculation
  const vehicleCost = useMemo(() => {
    if (vehicleTab === 'skip' || !selectedVehicle) return 0;
    const pricePerDay = parseFloat(selectedVehicle.price || 0);
    return Math.round(pricePerDay * nights);
  }, [vehicleTab, selectedVehicle, nights]);

  const hotelCost = useMemo(() => {
    if (skipHotel || !selectedHotel) return 0;
    const pricePerNight = parseFloat(selectedHotel.price || selectedHotel.price_per_night || 3000);
    return Math.round(pricePerNight * nights * hotelRooms);
  }, [skipHotel, selectedHotel, nights, hotelRooms]);

  const flightCost = useMemo(() => {
    if (!includeFlight) return 0;
    return Math.round(flightPricePerPerson * memberCount);
  }, [includeFlight, flightPricePerPerson, memberCount]);

  const activitiesCost = useMemo(() => {
    return (selectedActivities || []).reduce((sum, act) => sum + (parseFloat(act.price) || 0) * memberCount, 0);
  }, [selectedActivities, memberCount]);

  const retailSellingPrice = vehicleCost + hotelCost + flightCost + activitiesCost;

  const financialSnapshot = useMemo(() => {
    if (mode === 'COMMISSION') {
      const commAmount = Math.round(retailSellingPrice * (commRate / 100));
      const netPayable = retailSellingPrice - commAmount;
      return {
        retailPrice: retailSellingPrice,
        commPercent: commRate,
        commAmount,
        netPayable,
        walletBalance: parseFloat(partner?.wallet_balance || 0),
        mode: 'COMMISSION'
      };
    } else {
      const discountAmount = Math.round(retailSellingPrice * (netDiscountRate / 100));
      const netPrice = retailSellingPrice - discountAmount;
      return {
        retailPrice: retailSellingPrice,
        netDiscountPercent: netDiscountRate,
        discountAmount,
        netPrice,
        netPayable: netPrice,
        walletBalance: parseFloat(partner?.wallet_balance || 0),
        mode: 'NON_COMMISSION'
      };
    }
  }, [retailSellingPrice, mode, commRate, netDiscountRate, partner?.wallet_balance]);

  // Submit Booking
  const handleConfirmB2BBooking = async (e) => {
    e.preventDefault();
    if (!guestDetails.name.trim() || !guestDetails.phone.trim()) {
      setBookingError('Primary guest name and contact phone are required.');
      return;
    }
    if (retailSellingPrice <= 0) {
      setBookingError('Please select at least one service (Vehicle, Hotel, Sightseeing/Activity, or Flight) to craft your trip.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    const actSummary = (selectedActivities || []).map(a => a.title || a.name);
    const tripTitle = [
      selectedVehicle ? selectedVehicle.name : null,
      selectedHotel ? selectedHotel.name : null,
      actSummary.length > 0 ? `${actSummary.length} Experiences (${actSummary.slice(0, 2).join(', ')})` : null,
      includeFlight ? `${flightAirline} (${flightOrigin} → GOA)` : null
    ].filter(Boolean).join(' + ') || 'Bespoke Goa Holiday Package';

    const payload = {
      b2b_partner_id: partner?.id,
      b2b_mode: mode,
      service_type: 'craft',
      item_id: `craft-${Date.now()}`,
      item_name: `Craft My Trip: ${tripTitle}`,
      days: nights,
      qty: memberCount,
      pickup_date: pickupDate,
      drop_date: dropDate,
      guest_name: guestDetails.name.trim(),
      guest_phone: guestDetails.phone.trim(),
      guest_email: guestDetails.email.trim(),
      payment_method: 'Prepaid Agent Wallet',
      extra_details: {
        total_amount: retailSellingPrice,
        final_payable_amount: financialSnapshot.netPayable,
        special_requests: guestDetails.special_requests,
        vehicle: selectedVehicle ? { 
          id: selectedVehicle.id, 
          name: selectedVehicle.name, 
          image: selectedVehicle.image,
          category: selectedVehicle.category,
          fuel: selectedVehicle.fuel,
          transmission: selectedVehicle.transmission,
          seating: selectedVehicle.seating,
          price_per_day: selectedVehicle.price,
          cost: vehicleCost,
          type: isBikeVehicle(selectedVehicle) ? 'bike' : 'car'
        } : null,
        hotel: selectedHotel ? { 
          id: selectedHotel.id, 
          name: selectedHotel.name, 
          image: selectedHotel.image || selectedHotel.photo,
          stars: selectedHotel.stars || selectedHotel.rating,
          location: selectedHotel.location || selectedHotel.area,
          room_type: selectedHotel.preselected_room?.name || selectedHotel.room_type || null,
          rate_plan: selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan_label || selectedHotel.rate_plan || null,
          night_price: selectedHotel.price || selectedHotel.price_per_night,
          cost: hotelCost, 
          rooms: hotelRooms,
          nights: nights
        } : null,
        activities: (selectedActivities || []).map(a => ({ id: a.id, name: a.title || a.name, type: a.type, price: a.price })),
        flight: includeFlight ? { airline: flightAirline, origin: flightOrigin, cost: flightCost, pax: memberCount } : null,
        pax: memberCount,
        duration: `${nights}N / ${days}D`
      }
    };

    try {
      const res = await api.b2bBook(payload);
      if (res && res.success) {
        setBookingSuccess(res);
        if (onBookingSuccess) onBookingSuccess(res);
      } else {
        setBookingError(res.error || 'Failed to submit custom B2B trip.');
      }
    } catch (err) {
      setBookingError(err.message || 'Error processing reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      // 1. Star Rating
      if (hotelFilterStars !== 'All') {
        const s = String(h.stars || h.star_rating || h.rating || '3');
        if (hotelFilterStars === 'boutique') {
          const type = (h.property_type || h.type || '').toLowerCase();
          const name = (h.name || '').toLowerCase();
          if (!type.includes('boutique') && !type.includes('heritage') && !name.includes('heritage')) return false;
        } else if (!s.includes(hotelFilterStars)) {
          return false;
        }
      }
      // 2. Area Filter
      if (hotelAreaFilter !== 'All') {
        const areaClean = hotelAreaFilter.toLowerCase();
        const hArea = (h.area || '').toLowerCase();
        const hLoc = (h.location || '').toLowerCase();
        const hName = (h.name || '').toLowerCase();
        if (!hArea.includes(areaClean) && !hLoc.includes(areaClean) && !hName.includes(areaClean)) return false;
      }
      // 3. Search Query
      if (hotelSearchQuery.trim()) {
        const q = hotelSearchQuery.trim().toLowerCase();
        const hName = (h.name || '').toLowerCase();
        const hArea = (h.area || '').toLowerCase();
        const hLoc = (h.location || '').toLowerCase();
        if (!hName.includes(q) && !hArea.includes(q) && !hLoc.includes(q)) return false;
      }
      return true;
    });
  }, [hotels, hotelFilterStars, hotelAreaFilter, hotelSearchQuery]);

  // If booking succeeded, show confirmation voucher
  if (bookingSuccess) {
    const bookingId = bookingSuccess.booking_id || bookingSuccess.id || `CMT-${Date.now().toString().slice(-6)}`;
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white text-center animate-fade-in my-3">
        <div 
          className="rounded-circle bg-success bg-opacity-10 text-success mx-auto mb-3 d-flex align-items-center justify-content-center shadow-xs"
          style={{ width: '72px', height: '72px', minWidth: '72px', minHeight: '72px', flexShrink: 0 }}
        >
          <CheckCircle2 size={40} />
        </div>
        <h3 className="fw-bold text-dark font-heading mb-1">Bespoke Trip Confirmed!</h3>
        <p className="text-muted small mb-4">
          The custom holiday package for <strong>{guestDetails.name}</strong> has been confirmed and registered in your B2B ledger.
        </p>

        <div className="bg-light p-4 rounded-4 border text-start mx-auto mb-4" style={{ maxWidth: '560px' }}>
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <span className="text-muted text-xs">Reference ID:</span>
            <span className="fw-bold font-monospace text-dark text-xs">{bookingId}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted text-xs">Guest Name:</span>
            <span className="fw-semibold text-dark text-xs">{guestDetails.name} ({guestDetails.phone})</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted text-xs">Travel Dates:</span>
            <span className="fw-semibold text-dark text-xs">{pickupDate} to {dropDate} ({nights}N / {days}D)</span>
          </div>
          {selectedVehicle && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted text-xs">🚗 Vehicle:</span>
              <span className="fw-semibold text-dark text-xs">
                {selectedVehicle.name} ({selectedVehicle.seating ? `${selectedVehicle.seating} Seats` : 'Standard'} • {selectedVehicle.fuel || 'Petrol'})
              </span>
            </div>
          )}
          {selectedHotel && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted text-xs">🏨 Resort:</span>
              <span className="fw-semibold text-dark text-xs">
                {selectedHotel.name} ({hotelRooms} Room{hotelRooms > 1 ? 's' : ''})
                {selectedHotel.preselected_room?.name && ` • ${selectedHotel.preselected_room.name}`}
                {(selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan_label) && ` (${selectedHotel.preselected_rate_plan.name || selectedHotel.preselected_rate_plan.meal_plan_label})`}
              </span>
            </div>
          )}
          {selectedActivities.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted text-xs">🎯 Experiences:</span>
              <span className="fw-semibold text-dark text-xs">{selectedActivities.map(a => a.title || a.name).join(', ')}</span>
            </div>
          )}
          {includeFlight && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted text-xs">✈️ Flight:</span>
              <span className="fw-semibold text-dark text-xs">{flightAirline} ({flightOrigin} → GOA)</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between align-items-center text-sm fw-bold">
            <span className="text-dark">Amount Debited from Wallet:</span>
            <span className="text-primary font-monospace">₹{financialSnapshot.netPayable.toLocaleString()}</span>
          </div>
          {mode === 'COMMISSION' && (
            <div className="d-flex justify-content-between align-items-center text-xs text-success mt-1">
              <span>Agent Commission Kept:</span>
              <span>+₹{financialSnapshot.commAmount.toLocaleString()} ({financialSnapshot.commPercent}%)</span>
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {onNavigateToBookings && (
            <button 
              type="button" 
              className="btn btn-dark rounded-pill px-4 py-2 text-xs fw-bold text-white shadow-xs"
              onClick={onNavigateToBookings}
            >
              View in {mode === 'COMMISSION' ? 'Commission' : 'Net'} Bookings
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-outline-secondary rounded-pill px-4 py-2 text-xs fw-semibold"
            onClick={() => window.print()}
          >
            Print B2B Voucher
          </button>
          <button 
            type="button" 
            className="btn btn-warning rounded-pill px-4 py-2 text-xs fw-bold text-dark shadow-xs"
            onClick={() => {
              setBookingSuccess(null);
              setStep(1);
              setSelectedVehicle(null);
              setSelectedHotel(null);
              setSelectedActivities([]);
              setIncludeFlight(false);
              setGuestDetails({ name: '', phone: '', email: '', special_requests: '', payment_method: 'Prepaid Agent Wallet' });
            }}
          >
            Craft Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="b2b-craft-flow animate-fade-in">
      {/* ─── Hero Header & Information ────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-warning text-dark text-xxs fw-bold px-2.5 py-1 rounded-pill d-flex align-items-center gap-1">
                <Wand2 size={12} /> TAILOR-MADE BESPOKE ITINERARY
              </span>
              <span className="badge bg-light text-muted border text-xxs px-2 py-1 rounded-pill">
                Multi-Service B2B Builder
              </span>
            </div>
            <h4 className="fw-black text-dark font-heading mb-1">Craft My Trip (Custom Itinerary Builder)</h4>
            <p className="text-muted text-xs mb-0">
              Build custom packages for your agency guests by combining verified vehicles, resort stays, sightseeing & activities, and flights into one single B2B booking.
            </p>
          </div>

          {/* Quick Dates & Guests Bar */}
          <div className="d-flex align-items-center gap-2 flex-wrap bg-light p-2 rounded-3 border">
            <div className="d-flex align-items-center gap-1 text-xs">
              <Calendar size={14} className="text-primary" />
              <input 
                type="date" 
                className="form-control form-control-sm py-1 px-2 border-0 bg-transparent fw-bold text-xs" 
                value={pickupDate}
                min={tomorrowStr}
                onChange={e => setPickupDate(e.target.value)}
              />
              <span className="text-muted text-xxs">to</span>
              <input 
                type="date" 
                className="form-control form-control-sm py-1 px-2 border-0 bg-transparent fw-bold text-xs" 
                value={dropDate}
                min={pickupDate}
                onChange={e => setDropDate(e.target.value)}
              />
            </div>
            <span className="badge bg-white text-dark border text-xxs fw-bold px-2 py-1 rounded-pill">
              {nights}N / {days}D
            </span>
          </div>
        </div>

        {/* ─── 5-Step Progress Navigation ────────────────────────────────────── */}
        <div className="d-flex align-items-center justify-content-between pt-3 flex-wrap gap-2">
          {[
            { num: 1, label: '1. Choose Ride', icon: Car, active: step === 1, done: step > 1, summary: selectedVehicle ? selectedVehicle.name : (vehicleTab === 'skip' ? 'No Ride' : 'Pending') },
            { num: 2, label: '2. Pick Resort', icon: Hotel, active: step === 2, done: step > 2, summary: selectedHotel ? selectedHotel.name : (skipHotel ? 'No Stay' : 'Pending') },
            { num: 3, label: '3. Experiences', icon: Sparkles, active: step === 3, done: step > 3, summary: selectedActivities.length > 0 ? `${selectedActivities.length} Added` : 'None' },
            { num: 4, label: '4. Add Flight', icon: Plane, active: step === 4, done: step > 4, summary: includeFlight ? `${flightAirline}` : 'No Flight' },
            { num: 5, label: '5. Guest & Confirm', icon: ShieldCheck, active: step === 5, done: false, summary: `₹${financialSnapshot.netPayable.toLocaleString()} Net` }
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div 
                key={s.num} 
                onClick={() => setStep(s.num)}
                className={`d-flex align-items-center gap-2.5 p-2 rounded-3 cursor-pointer transition-all flex-grow-1 ${
                  s.active ? 'bg-warning bg-opacity-10 border border-warning' : s.done ? 'bg-light border' : 'bg-transparent text-muted'
                }`}
                style={{ cursor: 'pointer', minWidth: '130px' }}
              >
                <div className={`rounded-circle p-1.5 d-flex align-items-center justify-content-center ${
                  s.active ? 'bg-warning text-dark' : s.done ? 'bg-success text-white' : 'bg-secondary text-white opacity-50'
                }`} style={{ width: '28px', height: '28px' }}>
                  {s.done ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <div>
                  <div className={`text-xs fw-bold ${s.active ? 'text-dark' : 'text-muted'}`}>{s.label}</div>
                  <div className="text-3xs text-truncate text-muted" style={{ maxWidth: '120px' }}>{s.summary}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: CHOOSE RIDE ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark font-heading d-flex align-items-center gap-2">
                <Car size={18} className="text-primary" /> Step 1: Select Self-Drive Ride (Car or Bike)
              </h5>
              <p className="text-muted text-xs mb-0">Select sanitized verified vehicle for the duration of the trip ({nights} Days).</p>
            </div>

            <div className="d-flex gap-1.5 bg-light p-1 rounded-pill border">
              <button 
                type="button" 
                onClick={() => setVehicleTab('cars')} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${vehicleTab === 'cars' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                🚗 Rental Cars ({cars.length})
              </button>
              <button 
                type="button" 
                onClick={() => setVehicleTab('bikes')} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${vehicleTab === 'bikes' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                🏍️ Bikes / Scooters ({bikes.length})
              </button>
              <button 
                type="button" 
                onClick={() => { setVehicleTab('skip'); setSelectedVehicle(null); }} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${vehicleTab === 'skip' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                ⏭️ Skip Vehicle
              </button>
            </div>
          </div>

          {vehicleTab === 'skip' ? (
            <div className="p-4 rounded-4 bg-light text-center my-3 border">
              <Car size={32} className="text-muted mb-2 mx-auto" />
              <h6 className="fw-bold text-dark">No Vehicle Selected</h6>
              <p className="text-muted text-xs mb-3">This custom package will not include a self-drive rental.</p>
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold"
                onClick={() => setStep(2)}
              >
                Continue to Pick Resort →
              </button>
            </div>
          ) : (
            <>
              {/* Selected Vehicle Rich Preview Banner */}
              {selectedVehicle && (
                <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-50 mb-3.5 d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-xs">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={selectedVehicle.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'}
                      alt={selectedVehicle.name}
                      className="rounded-3 object-fit-cover shadow-xs"
                      style={{ width: '85px', height: '60px' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'; }}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-0.5">
                        <span className="badge bg-warning text-dark text-3xs fw-bold px-2 py-0.5 rounded-pill">
                          CURRENTLY SELECTED RIDE
                        </span>
                        <span className="text-3xs text-muted">
                          {isBikeVehicle(selectedVehicle) ? '🏍️ Two-Wheeler' : '🚗 Self Drive Car'}
                        </span>
                      </div>
                      <h6 className="fw-bold text-dark mb-0 text-sm font-heading">{selectedVehicle.name}</h6>
                      <div className="d-flex align-items-center gap-2 text-3xs text-muted mt-1">
                        {selectedVehicle.seating && <span>👥 {selectedVehicle.seating} Seats</span>}
                        {selectedVehicle.fuel && <span>⛽ {selectedVehicle.fuel}</span>}
                        {selectedVehicle.transmission && <span>⚙️ {selectedVehicle.transmission}</span>}
                        <span>•</span>
                        <span>₹{parseFloat(selectedVehicle.price || 0).toLocaleString()} / day</span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="text-end me-2">
                      <div className="text-3xs text-muted">Total Ride Cost ({nights} Days):</div>
                      <div className="text-sm fw-black text-dark font-monospace">₹{vehicleCost.toLocaleString()}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-dark rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1"
                      onClick={() => setViewingVehicleDetails(selectedVehicle)}
                    >
                      <Eye size={12} /> View Full Specs
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1.5 fw-bold"
                      onClick={() => setSelectedVehicle(null)}
                      title="Remove selected vehicle"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Vehicle Location Selector */}
              <div className="row g-2 mb-3 align-items-center">
                <div className="col-12 col-md-6">
                  <label className="form-label text-xxs fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                    <MapPin size={12} className="text-warning" /> Handover Location
                  </label>
                  <select 
                    className="form-select form-select-sm text-xs" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                  >
                    {GOA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-xxs fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                    <Users size={12} className="text-info" /> Total Traveling Guests
                  </label>
                  <select 
                    className="form-select form-select-sm text-xs" 
                    value={memberCount} 
                    onChange={e => setMemberCount(parseInt(e.target.value) || 2)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Guests</option>)}
                  </select>
                </div>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="row g-3">
                {(vehicleTab === 'cars' ? cars : bikes).map((v) => {
                  const isSelected = selectedVehicle?.id === v.id;
                  const pricePerDay = parseFloat(v.price || 0);
                  const totalVehCost = Math.round(pricePerDay * nights);

                  return (
                    <div key={v.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                      <div 
                        onClick={() => setSelectedVehicle(v)}
                        className={`card h-100 rounded-4 overflow-hidden cursor-pointer transition-all border ${
                          isSelected ? 'border-2 border-warning shadow-md' : 'border-light-subtle hover-shadow-sm'
                        }`}
                        style={{ cursor: 'pointer', background: isSelected ? '#fffdf7' : '#ffffff' }}
                      >
                        <div 
                          className="position-relative" 
                          style={{ height: '140px', background: '#f1f5f9' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingVehicleDetails(v);
                          }}
                          title="Click to view full specifications and photos"
                        >
                          <img 
                            src={v.image || (v.images_json ? JSON.parse(v.images_json)[0] : '') || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'} 
                            alt={v.name}
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'; }}
                          />
                          {isSelected && (
                            <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2 text-xxs fw-bold px-2 py-1 rounded-pill shadow-sm d-flex align-items-center gap-1">
                              <Check size={12} /> Selected
                            </span>
                          )}
                          <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 start-0 m-2 text-3xs px-2 py-0.5 rounded-pill">
                            {v.category || (vehicleTab === 'cars' ? 'Car' : 'Bike')}
                          </span>
                          <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-2 text-3xs px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
                            <Eye size={10} /> View Info
                          </span>
                        </div>

                        <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                          <div>
                            <h6 className="fw-bold text-dark text-xs mb-1 text-truncate">{v.name}</h6>
                            <div className="d-flex align-items-center gap-2 text-3xs text-muted mb-2">
                              {v.seating && <span>👥 {v.seating} Seats</span>}
                              {v.fuel && <span>⛽ {v.fuel}</span>}
                              {v.transmission && <span>⚙️ {v.transmission}</span>}
                            </div>
                          </div>

                          <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                            <div>
                              <div className="text-3xs text-muted">₹{pricePerDay.toLocaleString()} / day</div>
                              <div className="text-xs fw-black text-dark font-monospace">₹{totalVehCost.toLocaleString()} total</div>
                            </div>
                            <div className="d-flex gap-1">
                              <button 
                                type="button" 
                                className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1 fw-bold text-3xs d-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingVehicleDetails(v);
                                }}
                              >
                                <Eye size={11} /> Details
                              </button>
                              <button 
                                type="button" 
                                className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold text-3xs ${
                                  isSelected ? 'btn-warning text-dark' : 'btn-outline-primary'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVehicle(v);
                                }}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <div className="text-xs text-muted">
                  {selectedVehicle ? (
                    <span>Selected: <strong className="text-dark">{selectedVehicle.name}</strong> (₹{vehicleCost.toLocaleString()} for {nights} days)</span>
                  ) : (
                    <span>No vehicle selected yet</span>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold d-flex align-items-center gap-1"
                  onClick={() => setStep(2)}
                >
                  <span>Continue to Pick Resort</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── STEP 2: PICK RESORT ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark font-heading d-flex align-items-center gap-2">
                <Hotel size={18} className="text-primary" /> Step 2: Select Hotel / Resort Stay
              </h5>
              <p className="text-muted text-xs mb-0">Handpicked beachfront resorts and boutique stays in prime Goa areas ({nights} Nights).</p>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <button 
                type="button" 
                onClick={() => { setSkipHotel(!skipHotel); if (!skipHotel) setSelectedHotel(null); }} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${skipHotel ? 'btn-dark text-white shadow-xs' : 'btn-outline-secondary'}`}
              >
                {skipHotel ? '✓ Resort Skipped' : '⏭️ Skip Resort'}
              </button>
            </div>
          </div>

          {skipHotel ? (
            <div className="p-4 rounded-4 bg-light text-center my-3 border">
              <Hotel size={32} className="text-muted mb-2 mx-auto" />
              <h6 className="fw-bold text-dark">No Resort Selected</h6>
              <p className="text-muted text-xs mb-3">This custom package will not include hotel accommodations.</p>
              <div className="d-flex gap-2 justify-content-center">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setStep(1)}>
                  ← Back to Ride
                </button>
                <button type="button" className="btn btn-primary rounded-pill px-4 py-1.5 text-xs fw-bold" onClick={() => setStep(3)}>
                  Continue to Experiences →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Hotel Rich Preview Banner */}
              {selectedHotel && (
                <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-50 mb-3.5 d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-xs">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={selectedHotel.image || (selectedHotel.images_json ? JSON.parse(selectedHotel.images_json)[0] : '') || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={selectedHotel.name}
                      className="rounded-3 object-fit-cover shadow-xs"
                      style={{ width: '85px', height: '60px' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-0.5">
                        <span className="badge bg-warning text-dark text-3xs fw-bold px-2 py-0.5 rounded-pill">
                          CURRENTLY SELECTED RESORT
                        </span>
                        <span className="text-3xs text-warning fw-bold d-flex align-items-center gap-1">
                          <Star size={10} fill="#FFC107" /> {selectedHotel.stars || selectedHotel.rating || 4}★
                        </span>
                      </div>
                      <h6 className="fw-bold text-dark mb-0 text-sm font-heading">{selectedHotel.name}</h6>
                      <div className="text-3xs text-muted mt-0.5">
                        <span>📍 {selectedHotel.location || selectedHotel.area || 'Goa'}</span>
                        {selectedHotel.preselected_room?.name && (
                          <span className="ms-2 badge bg-light text-dark border">
                            🛏️ {selectedHotel.preselected_room.name}
                          </span>
                        )}
                        {(selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan_label) && (
                          <span className="ms-1 badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                            🍴 {selectedHotel.preselected_rate_plan.name || selectedHotel.preselected_rate_plan.meal_plan_label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="text-end me-2">
                      <div className="text-3xs text-muted">Stay Total ({hotelRooms}R × {nights}N):</div>
                      <div className="text-sm fw-black text-dark font-monospace">₹{hotelCost.toLocaleString()}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-dark rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1"
                      onClick={() => setViewingHotelDetails(selectedHotel)}
                    >
                      <Eye size={12} /> View Info & Rooms
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1.5 fw-bold"
                      onClick={() => setSelectedHotel(null)}
                      title="Remove selected stay"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Hotel Controls: Star filter, Area Pills, Search & Rooms count */}
              <div className="p-3 bg-light rounded-4 border mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                  <div className="d-flex gap-1 bg-white p-1 rounded-pill border">
                    {[
                      { id: 'All', label: 'All Stays' },
                      { id: '5', label: '⭐ 5★' },
                      { id: '4', label: '⭐ 4★' },
                      { id: '3', label: '⭐ 3★' },
                      { id: 'boutique', label: '🏛️ Boutique' }
                    ].map(star => (
                      <button 
                        key={star.id}
                        type="button" 
                        onClick={() => setHotelFilterStars(star.id)} 
                        className={`btn btn-xs rounded-pill px-2.5 py-0.5 text-3xs fw-bold ${hotelFilterStars === star.id ? 'btn-dark text-white' : 'btn-light text-muted'}`}
                      >
                        {star.label}
                      </button>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="text-xxs text-muted fw-bold">Rooms Required:</span>
                    <div className="input-group input-group-sm" style={{ width: '100px' }}>
                      <button type="button" className="btn btn-outline-secondary btn-xs" onClick={() => setHotelRooms(Math.max(1, hotelRooms - 1))}>−</button>
                      <span className="form-control form-control-sm text-center fw-bold py-0 text-xs">{hotelRooms}</span>
                      <button type="button" className="btn btn-outline-secondary btn-xs" onClick={() => setHotelRooms(hotelRooms + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Quick Area Filters and Search Box */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top">
                  <div className="d-flex flex-wrap gap-1">
                    {['All', 'Calangute', 'Baga', 'Candolim', 'Panaji', 'Anjuna', 'Colva', 'North Goa', 'South Goa'].map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setHotelAreaFilter(area)}
                        className={`btn btn-xs rounded-pill px-2.5 py-0.5 text-3xs fw-semibold ${
                          hotelAreaFilter === area ? 'btn-primary text-white' : 'btn-white bg-white text-secondary border'
                        }`}
                      >
                        {area === 'All' ? 'All Areas' : area}
                      </button>
                    ))}
                  </div>

                  <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                    <span className="input-group-text bg-white border-end-0 text-muted"><Search size={13} /></span>
                    <input
                      type="text"
                      className="form-control border-start-0 text-xs"
                      placeholder="Search hotel name..."
                      value={hotelSearchQuery}
                      onChange={e => setHotelSearchQuery(e.target.value)}
                    />
                    {hotelSearchQuery && (
                      <button className="btn btn-outline-secondary btn-xs bg-white" type="button" onClick={() => setHotelSearchQuery('')}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hotels Grid */}
              <div className="row g-3">
                {filteredHotels.length === 0 ? (
                  <div className="col-12 py-4 text-center text-muted">
                    <Hotel size={36} className="mx-auto text-muted opacity-50 mb-2" />
                    <h6 className="fw-bold text-dark mb-1">No hotels found matching filters</h6>
                    <p className="text-3xs mb-2">Try clearing your area or rating filters to see more results.</p>
                    <button 
                      type="button" 
                      className="btn btn-xs btn-outline-dark rounded-pill px-3 py-1"
                      onClick={() => { setHotelFilterStars('All'); setHotelAreaFilter('All'); setHotelSearchQuery(''); }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredHotels.map((h) => {
                    const isSelected = selectedHotel?.id === h.id;
                    const pricePerNight = parseFloat(h.price || h.price_per_night || 3000);
                    const totalHotelCost = Math.round(pricePerNight * nights * hotelRooms);

                    return (
                      <div key={h.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                        <div 
                          onClick={() => setSelectedHotel(h)}
                          className={`card h-100 rounded-4 overflow-hidden cursor-pointer transition-all border ${
                            isSelected ? 'border-2 border-warning shadow-md' : 'border-light-subtle hover-shadow-sm'
                          }`}
                          style={{ cursor: 'pointer', background: isSelected ? '#fffdf7' : '#ffffff' }}
                        >
                          <div 
                            className="position-relative" 
                            style={{ height: '140px', background: '#f1f5f9' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingHotelDetails(h);
                            }}
                            title="Click to view hotel rooms, photos, amenities and meal plans"
                          >
                            <img 
                              src={h.image || (h.images_json ? JSON.parse(h.images_json)[0] : '') || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                              alt={h.name}
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
                            />
                            {isSelected && (
                              <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2 text-xxs fw-bold px-2 py-1 rounded-pill shadow-sm d-flex align-items-center gap-1">
                                <Check size={12} /> Selected
                              </span>
                            )}
                            <span className="badge bg-dark bg-opacity-75 text-warning position-absolute bottom-0 start-0 m-2 text-3xs px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
                              <Star size={10} fill="#FFC107" /> {h.stars || h.rating || 4}★
                            </span>
                            <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-2 text-3xs px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
                              <Eye size={10} /> View Details
                            </span>
                          </div>

                          <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                            <div>
                              <h6 className="fw-bold text-dark text-xs mb-1 text-truncate">{h.name}</h6>
                              <div className="d-flex align-items-center gap-1 text-3xs text-muted mb-2 text-truncate">
                                <MapPin size={10} className="text-warning flex-shrink-0" />
                                <span>{h.location || h.area || 'Goa Beachfront'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                              <div>
                                <div className="text-3xs text-muted">₹{pricePerNight.toLocaleString()} / night</div>
                                <div className="text-xs fw-black text-dark font-monospace">₹{totalHotelCost.toLocaleString()} ({hotelRooms}R × {nights}N)</div>
                              </div>
                              <div className="d-flex gap-1">
                                <button 
                                  type="button" 
                                  className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1 fw-bold text-3xs d-flex align-items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingHotelDetails(h);
                                  }}
                                >
                                  <Eye size={11} /> Details
                                </button>
                                <button 
                                  type="button" 
                                  className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold text-3xs ${
                                    isSelected ? 'btn-warning text-dark' : 'btn-outline-primary'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHotel(h);
                                  }}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setStep(1)}>
                  ← Back to Ride
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold d-flex align-items-center gap-1"
                  onClick={() => setStep(3)}
                >
                  <span>Continue to Experiences</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── STEP 3: SIGHTSEEING & ACTIVITIES ───────────────────────────────── */}
      {step === 3 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark font-heading d-flex align-items-center gap-2">
                <Sparkles size={18} className="text-warning" /> Step 3: Sightseeing & Activities
              </h5>
              <p className="text-muted text-xs mb-0">Select optional guided tours, beach excursions, or water sports adventures for {memberCount} guest{memberCount > 1 ? 's' : ''}.</p>
            </div>

            <div className="d-flex gap-1.5 bg-light p-1 rounded-pill border">
              <button 
                type="button" 
                onClick={() => setActivityFilter('all')} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${activityFilter === 'all' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                ✨ All ({activities.length})
              </button>
              <button 
                type="button" 
                onClick={() => setActivityFilter('sightseeing')} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${activityFilter === 'sightseeing' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                🏛️ Sightseeing ({activities.filter(a => (a.type || '').toLowerCase() === 'sightseeing').length})
              </button>
              <button 
                type="button" 
                onClick={() => setActivityFilter('activity')} 
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold text-xs ${activityFilter === 'activity' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'}`}
              >
                ⚡ Activities ({activities.filter(a => (a.type || '').toLowerCase() === 'activity').length})
              </button>
            </div>
          </div>

          {/* Activities Grid */}
          <div className="row g-3">
            {activities
              .filter(a => activityFilter === 'all' || (a.type || '').toLowerCase() === activityFilter)
              .map((act) => {
                const isSelected = selectedActivities.some(a => a.id === act.id);
                const price = parseFloat(act.price || 0);
                const totalPrice = price * memberCount;
                const isSightseeing = (act.type || '').toLowerCase() === 'sightseeing';

                const toggleActivity = () => {
                  setSelectedActivities(prev => 
                    isSelected ? prev.filter(a => a.id !== act.id) : [...prev, act]
                  );
                };

                return (
                  <div key={act.id} className="col-12 col-sm-6 col-lg-6">
                    <div 
                      onClick={toggleActivity}
                      className={`card h-100 rounded-4 overflow-hidden cursor-pointer transition-all border ${
                        isSelected ? 'border-2 border-warning shadow-md' : 'border-light-subtle hover-shadow-sm'
                      }`}
                      style={{ cursor: 'pointer', background: isSelected ? '#fffdf7' : '#ffffff' }}
                    >
                      <div className="row g-0 h-100">
                        <div 
                          className="col-4 position-relative" 
                          style={{ minHeight: '130px', background: '#f1f5f9', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingActivityDetails(act);
                          }}
                          title="Click to view activity details and schedule"
                        >
                          <img 
                            src={act.image_url || (isSightseeing ? 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400' : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400')} 
                            alt={act.title || act.name}
                            className="w-100 h-100 object-fit-cover"
                          />
                          <span className={`badge position-absolute top-0 start-0 m-1.5 text-3xs fw-bold px-1.5 py-0.5 rounded-pill ${
                            isSightseeing ? 'bg-primary text-white' : 'bg-success text-white'
                          }`}>
                            {isSightseeing ? 'Sightseeing' : 'Activity'}
                          </span>
                          <span className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-1.5 text-3xs px-1.5 py-0.5 rounded-pill d-flex align-items-center gap-1">
                            <Eye size={10} /> Details
                          </span>
                        </div>
                        <div className="col-8 p-3 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="fw-bold text-dark text-xs mb-1 text-truncate">{act.title || act.name}</h6>
                              {isSelected && (
                                <span className="badge bg-warning text-dark text-3xs px-1.5 py-0.5 rounded-pill fw-bold flex-shrink-0">
                                  ✓ Added
                                </span>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-2 text-3xs text-muted mb-1">
                              <span>📍 {act.location || 'Goa'}</span>
                              <span>⏱️ {act.duration || 'Flexible'}</span>
                            </div>
                            <p className="text-muted text-3xs mb-2 line-clamp-2">
                              {act.description || 'Verified Goa local experience with expert guides.'}
                            </p>
                          </div>

                          <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                            <div>
                              <div className="text-3xs text-muted">₹{price.toLocaleString()} / person</div>
                              <div className="text-xs fw-black text-dark font-monospace">₹{totalPrice.toLocaleString()} ({memberCount} Pax)</div>
                            </div>
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1 fw-bold text-3xs d-flex align-items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingActivityDetails(act);
                                }}
                              >
                                <Eye size={11} /> Details
                              </button>
                              <button
                                type="button"
                                className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold text-3xs ${
                                  isSelected ? 'btn-warning text-dark' : 'btn-outline-primary'
                                }`}
                                onClick={(e) => { e.stopPropagation(); toggleActivity(); }}
                              >
                                {isSelected ? '✓ Added' : '+ Add'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Actions */}
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setStep(2)}>
              ← Back to Resort
            </button>
            <div className="d-flex gap-2">
              {selectedActivities.length === 0 ? (
                <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setStep(4)}>
                  Skip Experiences
                </button>
              ) : (
                <button type="button" className="btn btn-outline-danger rounded-pill px-3 py-1.5 text-xs" onClick={() => setSelectedActivities([])}>
                  Clear Selected
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold d-flex align-items-center gap-1"
                onClick={() => setStep(4)}
              >
                <span>Continue to Flights ({selectedActivities.length} Selected)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: OPTIONAL FLIGHT ─────────────────────────────────────────── */}
      {step === 4 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark font-heading d-flex align-items-center gap-2">
                <Plane size={18} className="text-primary" /> Step 4: Optional Flights Addition
              </h5>
              <p className="text-muted text-xs mb-0">Add domestic / international flights for your guest or skip if self-arranged.</p>
            </div>

            <div className="form-check form-switch cursor-pointer">
              <input 
                className="form-check-input cursor-pointer" 
                type="checkbox" 
                role="switch" 
                id="flightSwitch"
                checked={includeFlight}
                onChange={e => setIncludeFlight(e.target.checked)}
              />
              <label className="form-check-label text-xs fw-bold text-dark cursor-pointer ms-1" htmlFor="flightSwitch">
                {includeFlight ? '✈️ Flights Included' : 'Flights Optional'}
              </label>
            </div>
          </div>

          {!includeFlight ? (
            <div className="p-4 rounded-4 bg-light text-center my-3 border">
              <Plane size={32} className="text-muted mb-2 mx-auto" />
              <h6 className="fw-bold text-dark">No Flights Added</h6>
              <p className="text-muted text-xs mb-3">Guest will arrange their own flights to Goa. Only ground services will be booked.</p>
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold"
                onClick={() => setStep(5)}
              >
                Continue to Final Confirmation →
              </button>
            </div>
          ) : (
            <div className="p-3 bg-light rounded-4 border mb-3">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label text-xxs fw-bold text-muted mb-1">Departure City</label>
                  <select 
                    className="form-select form-select-sm text-xs"
                    value={flightOrigin}
                    onChange={e => setFlightOrigin(e.target.value)}
                  >
                    {FLIGHT_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-xxs fw-bold text-muted mb-1">Preferred Airline</label>
                  <select 
                    className="form-select form-select-sm text-xs"
                    value={flightAirline}
                    onChange={e => setFlightAirline(e.target.value)}
                  >
                    <option value="IndiGo Premium">IndiGo Premium</option>
                    <option value="Air India">Air India</option>
                    <option value="Vistara">Vistara</option>
                    <option value="Akasa Air">Akasa Air</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-xxs fw-bold text-muted mb-1">Cabin Class</label>
                  <select 
                    className="form-select form-select-sm text-xs"
                    value={flightClass}
                    onChange={e => setFlightClass(e.target.value)}
                  >
                    <option value="Economy">Economy Class</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business Class</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span className="badge bg-primary bg-opacity-10 text-primary text-3xs fw-bold px-2 py-0.5 rounded-pill mb-1">
                    RETURN AIRFARE INCLUDED
                  </span>
                  <div className="fw-bold text-dark text-xs">{flightAirline} • {flightOrigin} ⇄ GOA</div>
                  <div className="text-3xs text-muted">{memberCount} Passenger(s) • Standard Luggage Included</div>
                </div>
                <div className="text-end">
                  <div className="text-xs text-muted">₹{flightPricePerPerson.toLocaleString()} / person</div>
                  <div className="text-sm fw-black text-dark font-monospace">₹{flightCost.toLocaleString()} Total</div>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-1.5 text-xs" onClick={() => setStep(3)}>
              ← Back to Experiences
            </button>
            <button 
              type="button" 
              className="btn btn-primary rounded-pill px-4 py-2 text-xs fw-bold d-flex align-items-center gap-1"
              onClick={() => setStep(5)}
            >
              <span>Review & Confirm B2B Reservation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 5: GUEST DETAILS & CONFIRMATION ────────────────────────────── */}
      {step === 5 && (
        <form onSubmit={handleConfirmB2BBooking} className="animate-fade-in">
          <div className="row g-4 mb-4">
            {/* Left: Guest Details Form */}
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark font-heading mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
                  <User size={18} className="text-primary" /> Primary Guest Information
                </h5>

                {bookingError && (
                  <div className="alert alert-danger p-2.5 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-xxs fw-bold text-muted mb-1">
                      Lead Guest Full Name <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm text-xs"
                      placeholder="e.g. Ramesh Kulkarni"
                      value={guestDetails.name}
                      onChange={e => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-xxs fw-bold text-muted mb-1">
                      Contact Mobile Number <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text text-xs bg-light">+91</span>
                      <input 
                        type="tel" 
                        className="form-control text-xs"
                        placeholder="10-digit phone number"
                        value={guestDetails.phone}
                        onChange={e => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-xxs fw-bold text-muted mb-1">Email ID (For Voucher Dispatch)</label>
                    <input 
                      type="email" 
                      className="form-control form-control-sm text-xs"
                      placeholder="guest@example.com"
                      value={guestDetails.email}
                      onChange={e => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-xxs fw-bold text-muted mb-1">Travel Handover Point</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm text-xs bg-light"
                      value={location}
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-xxs fw-bold text-muted mb-1">Special Guest Instructions / Preferences</label>
                  <textarea 
                    className="form-control form-control-sm text-xs"
                    rows="3"
                    placeholder="Enter special requests, child seats, late check-in, dietary preferences, or flight timings..."
                    value={guestDetails.special_requests}
                    onChange={e => setGuestDetails(prev => ({ ...prev, special_requests: e.target.value }))}
                  />
                </div>

                {/* Wallet Balance Info */}
                <div className="p-3 rounded-3 bg-light border mt-auto">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle bg-warning text-dark">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark text-xs">Payment via Prepaid Agent Wallet</div>
                        <div className="text-muted text-3xs">Available Balance: ₹{financialSnapshot.walletBalance.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-3xs px-2.5 py-1 rounded-pill">
                      Instant Wallet Debit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Package Summary & Financial Snapshot */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="fw-bold text-dark font-heading mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                    <span>Bespoke Package Summary</span>
                    <span className="badge bg-dark text-white text-3xs px-2 py-0.5 rounded-pill">
                      {nights}N / {days}D
                    </span>
                  </h5>

                  {/* Components List */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    {/* Vehicle Summary Item */}
                    <div className="p-2.5 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2.5">
                        {selectedVehicle ? (
                          <img
                            src={selectedVehicle.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'}
                            alt={selectedVehicle.name}
                            className="rounded-2 object-fit-cover flex-shrink-0"
                            style={{ width: '48px', height: '36px' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'; }}
                          />
                        ) : (
                          <div className="rounded-2 bg-secondary bg-opacity-10 p-2 text-muted">
                            <Car size={18} />
                          </div>
                        )}
                        <div>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold text-dark text-xs">{selectedVehicle ? selectedVehicle.name : 'No Vehicle Included'}</span>
                            {selectedVehicle && (
                              <button
                                type="button"
                                className="btn btn-link text-primary p-0 text-3xs text-decoration-none fw-bold"
                                onClick={() => setViewingVehicleDetails(selectedVehicle)}
                              >
                                [Specs]
                              </button>
                            )}
                          </div>
                          <div className="text-3xs text-muted">
                            {selectedVehicle ? (
                              <span>
                                {selectedVehicle.seating ? `${selectedVehicle.seating} Seats` : 'Standard'} • {selectedVehicle.fuel || 'Petrol'} • {nights} Days @ ₹{parseFloat(selectedVehicle.price || 0).toLocaleString()}/d
                              </span>
                            ) : 'Skipped'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs fw-bold text-dark">₹{vehicleCost.toLocaleString()}</span>
                    </div>

                    {/* Hotel Summary Item */}
                    <div className="p-2.5 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2.5">
                        {selectedHotel ? (
                          <img
                            src={selectedHotel.image || (selectedHotel.images_json ? JSON.parse(selectedHotel.images_json)[0] : '') || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                            alt={selectedHotel.name}
                            className="rounded-2 object-fit-cover flex-shrink-0"
                            style={{ width: '48px', height: '36px' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
                          />
                        ) : (
                          <div className="rounded-2 bg-secondary bg-opacity-10 p-2 text-muted">
                            <Hotel size={18} />
                          </div>
                        )}
                        <div>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold text-dark text-xs">{selectedHotel ? selectedHotel.name : 'No Hotel Included'}</span>
                            {selectedHotel && (
                              <button
                                type="button"
                                className="btn btn-link text-primary p-0 text-3xs text-decoration-none fw-bold"
                                onClick={() => setViewingHotelDetails(selectedHotel)}
                              >
                                [Rooms & Info]
                              </button>
                            )}
                          </div>
                          <div className="text-3xs text-muted">
                            {selectedHotel ? (
                              <span>
                                {selectedHotel.preselected_room?.name ? `${selectedHotel.preselected_room.name}` : `${hotelRooms} Room(s)`}
                                {(selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan_label) && ` • ${selectedHotel.preselected_rate_plan.name || selectedHotel.preselected_rate_plan.meal_plan_label}`}
                                {` • ${nights}N @ ₹${parseFloat(selectedHotel.price || selectedHotel.price_per_night || 3000).toLocaleString()}/n`}
                              </span>
                            ) : 'Skipped'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs fw-bold text-dark">₹{hotelCost.toLocaleString()}</span>
                    </div>

                    {/* Experiences */}
                    <div className="p-2.5 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <Sparkles size={16} className="text-warning flex-shrink-0" />
                        <div>
                          <div className="fw-bold text-dark text-xs">{selectedActivities.length > 0 ? `${selectedActivities.length} Experiences Included` : 'No Experiences Added'}</div>
                          <div className="text-3xs text-muted">{selectedActivities.length > 0 ? selectedActivities.map(a => a.title || a.name).join(', ') : 'Skipped'}</div>
                        </div>
                      </div>
                      <span className="text-xs fw-bold text-dark">₹{activitiesCost.toLocaleString()}</span>
                    </div>

                    {/* Flight */}
                    <div className="p-2.5 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <Plane size={16} className="text-primary flex-shrink-0" />
                        <div>
                          <div className="fw-bold text-dark text-xs">{includeFlight ? `${flightAirline} Flight` : 'No Flight Included'}</div>
                          <div className="text-3xs text-muted">{includeFlight ? `${flightOrigin} ⇄ GOA • ${memberCount} pax` : 'Skipped'}</div>
                        </div>
                      </div>
                      <span className="text-xs fw-bold text-dark">₹{flightCost.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown Box */}
                  <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 mb-3">
                    <div className="d-flex justify-content-between text-xs text-muted mb-1.5">
                      <span>Customer Retail Selling Price:</span>
                      <span className="fw-bold text-dark">₹{retailSellingPrice.toLocaleString()}</span>
                    </div>

                    {mode === 'COMMISSION' ? (
                      <>
                        <div className="d-flex justify-content-between text-xs text-success fw-semibold mb-2 pb-2 border-bottom border-warning border-opacity-25">
                          <span>Agent Commission ({financialSnapshot.commPercent}%):</span>
                          <span className="fw-bold">+₹{financialSnapshot.commAmount.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center text-sm fw-black text-dark">
                          <span>Net Payout to WOW Goa:</span>
                          <span className="fs-6 font-monospace">₹{financialSnapshot.netPayable.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between text-xs text-primary fw-semibold mb-2 pb-2 border-bottom border-warning border-opacity-25">
                          <span>B2B Net Wholesale Discount ({financialSnapshot.netDiscountPercent}%):</span>
                          <span className="fw-bold">-₹{financialSnapshot.discountAmount.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center text-sm fw-black text-primary">
                          <span>B2B Net Rate Payable:</span>
                          <span className="fs-6 font-monospace">₹{financialSnapshot.netPrice.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <button 
                    type="submit" 
                    disabled={bookingLoading || retailSellingPrice <= 0}
                    className="btn btn-warning w-100 py-2.5 rounded-pill fw-black text-dark text-sm font-heading shadow-sm"
                  >
                    {bookingLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : (
                      <CheckCircle size={16} className="me-1.5" />
                    )}
                    Confirm B2B Bespoke Booking Now
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-link text-muted text-xxs w-100 text-decoration-none mt-2"
                    onClick={() => setStep(4)}
                  >
                    ← Back to Modify Flight / Dates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── AUTHORITATIVE D2C VEHICLE DETAILS MODAL (CARS & BIKES SEPARATED) ── */}
      <B2BModalPortal
        isOpen={Boolean(viewingVehicleDetails)}
        onClose={() => setViewingVehicleDetails(null)}
        isFullScreen={true}
        ariaLabel="B2B Craft My Trip Vehicle Details"
      >
        {viewingVehicleDetails && (
          <div className="w-100 min-vh-100 bg-white" style={{ overflowY: 'auto' }}>
            {isBikeVehicle(viewingVehicleDetails) ? (
              <BikeDetailsPage
                bike={viewingVehicleDetails}
                pickupDate={pickupDate}
                dropDate={dropDate}
                bookingDays={nights}
                isCraftMyTrip={true}
                backLabel="← Back to Craft My Trip"
                actionLabel="Select & Continue"
                breadcrumbPrefix="B2B Portal / Craft My Trip"
                memberCount={memberCount}
                onMemberCountChange={setMemberCount}
                onBack={() => setViewingVehicleDetails(null)}
                onBook={(veh) => {
                  const target = veh || viewingVehicleDetails;
                  setSelectedVehicle(target);
                  setViewingVehicleDetails(null);
                  setStep(2);
                }}
              />
            ) : (
              <CarDetailsPage
                car={viewingVehicleDetails}
                pickupDate={pickupDate}
                dropDate={dropDate}
                bookingDays={nights}
                isCraftMyTrip={true}
                backLabel="← Back to Craft My Trip"
                actionLabel="Select & Continue"
                breadcrumbPrefix="B2B Portal / Craft My Trip"
                memberCount={memberCount}
                onMemberCountChange={setMemberCount}
                onBack={() => setViewingVehicleDetails(null)}
                onBook={(veh) => {
                  const target = veh || viewingVehicleDetails;
                  setSelectedVehicle(target);
                  setViewingVehicleDetails(null);
                  setStep(2);
                }}
              />
            )}
          </div>
        )}
      </B2BModalPortal>

      {/* ── AUTHORITATIVE D2C HOTEL DETAILS MODAL (ROOMS & MEAL PLANS SELECTABLE) ── */}
      <B2BModalPortal
        isOpen={Boolean(viewingHotelDetails)}
        onClose={() => setViewingHotelDetails(null)}
        isFullScreen={true}
        ariaLabel="B2B Craft My Trip Hotel Details"
      >
        {viewingHotelDetails && (
          <div className="w-100 min-vh-100 bg-white" style={{ overflowY: 'auto' }}>
            <HotelDetailsPage
              hotel={viewingHotelDetails}
              pickupDate={pickupDate}
              dropDate={dropDate}
              nights={nights}
              isCraftMyTrip={true}
              backLabel="← Back to Craft My Trip"
              actionLabel="Select & Continue"
              breadcrumbPrefix="B2B Portal / Craft My Trip"
              onBack={() => setViewingHotelDetails(null)}
              onBook={(hotelItem, room, plan) => {
                const item = hotelItem || viewingHotelDetails;
                const nightPrice = plan?.base_price 
                  ? parseFloat(plan.base_price) 
                  : (parseFloat(item.price_per_night || item.price || item.rate || 0) || 3000);
                const enrichedHotel = {
                  ...item,
                  preselected_room: room || null,
                  preselected_rate_plan: plan || null,
                  has_selected_room: Boolean(room && plan),
                  price: nightPrice,
                  price_per_night: nightPrice
                };
                setSelectedHotel(enrichedHotel);
                setViewingHotelDetails(null);
                setStep(3);
              }}
            />
          </div>
        )}
      </B2BModalPortal>

      {/* ── AUTHORITATIVE D2C ACTIVITY DETAILS MODAL ── */}
      <B2BModalPortal
        isOpen={Boolean(viewingActivityDetails)}
        onClose={() => setViewingActivityDetails(null)}
        isFullScreen={true}
        ariaLabel="B2B Craft My Trip Activity Details"
      >
        {viewingActivityDetails && (
          <div className="w-100 min-vh-100 bg-white" style={{ overflowY: 'auto' }}>
            <ActivityDetailsPage
              activity={viewingActivityDetails}
              pickupDate={pickupDate}
              adultsCount={memberCount}
              memberCount={memberCount}
              isCraftMyTrip={true}
              isSelected={selectedActivities.some(a => a.id === viewingActivityDetails.id)}
              backLabel="← Back to Craft My Trip"
              actionLabel={selectedActivities.some(a => a.id === viewingActivityDetails.id) ? "Continue to Flights" : "Add & Continue"}
              breadcrumbPrefix="B2B Portal / Craft My Trip"
              onBack={() => setViewingActivityDetails(null)}
              onBook={(actData) => {
                const act = actData || viewingActivityDetails;
                if (!selectedActivities.some(a => a.id === act.id)) {
                  setSelectedActivities(prev => [...prev, act]);
                }
                setViewingActivityDetails(null);
                setStep(4);
              }}
            />
          </div>
        )}
      </B2BModalPortal>
    </div>
  );
}
