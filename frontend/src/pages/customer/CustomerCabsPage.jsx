import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Car, Calendar, Clock, MapPin, ArrowRight, X, Shield, 
  Sparkles, CheckCircle2, ChevronDown, LocateFixed, Phone, 
  Share2, Radio, Check, CreditCard, Navigation, ArrowUpDown,
  Tag, Info, User, AlertCircle, Search, Compass, ExternalLink,
  Plus, Minus, RefreshCw, ChevronLeft, ChevronRight,
  Users, Briefcase, ArrowLeft, Download, MessageSquare,
  Award, Fuel, CheckCircle, SlidersHorizontal, Plane, Menu,
  HelpCircle, ShieldAlert, Zap
} from 'lucide-react';
import LiveCabMap from '../../components/customer/LiveCabMap';
import CabLocationAutocomplete from '../../components/customer/CabLocationAutocomplete';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';
import AddStopModal from '../../components/customer/AddStopModal';
import { playNotificationChime } from '../../utils/audioChime';
import CustomerTripsModal from '../../components/customer/CustomerTripsModal';
import { createCabBooking, fetchRideLiveTrack, cancelCabRide } from '../../services/api';

// Comprehensive Goa Cities, Towns, Beaches, Airports & Railway Stations
const GOA_LOCATIONS = [
  { name: 'Manohar Intl Airport, Mopa (GOX)', category: 'Airports & Transit', region: 'North Goa Hub', popular: true, emoji: '✈️' },
  { name: 'Dabolim International Airport (GOI)', category: 'Airports & Transit', region: 'Central/South Hub', popular: true, emoji: '✈️' },
  { name: 'Candolim Beach', category: 'North Goa Coast', region: 'Coastal Hub', popular: true, emoji: '🏖️' },
  { name: 'Baga Beach & Tito’s Lane', category: 'North Goa Coast', region: 'Party Hub', popular: true, emoji: '🏖️' },
  { name: 'Calangute Beach', category: 'North Goa Coast', region: 'Coastal Hub', popular: true, emoji: '🏖️' },
  { name: 'Panaji (Capital / Fontainhas)', category: 'North Goa Cities', region: 'Capital & Heritage', popular: true, emoji: '🏛️' },
  { name: 'Anjuna Beach & Flea Market', category: 'North Goa Coast', region: 'Bohemian Coast', popular: true, emoji: '🏖️' },
  { name: 'Madgaon Railway Station (MAO)', category: 'Airports & Transit', region: 'South Goa Hub', popular: true, emoji: '🚉' },
  { name: 'Vagator Beach & Chapora Fort', category: 'North Goa Coast', region: 'Cliff & Sunset', popular: true, emoji: '🏖️' },
  { name: 'Morjim Beach (Turtle Beach)', category: 'North Goa Coast', region: 'Serene North', popular: true, emoji: '🏖️' },
  { name: 'Thivim Railway Station (THVM)', category: 'Airports & Transit', region: 'North Goa Hub', popular: true, emoji: '🚉' },
  { name: 'Colva Beach', category: 'South Goa Coast', region: 'South Hub', popular: true, emoji: '🏖️' },
  { name: 'Benaulim Beach', category: 'South Goa Coast', region: 'Peaceful South', popular: true, emoji: '🏖️' },
  { name: 'Palolem Beach', category: 'Far South Coast', region: 'Scenic South', popular: true, emoji: '🏖️' }
];

// Complete Tourist Fleet Categories (Normal, Sedan, Executive SUV, EV Green, Luxury VIP, Maxi Coach)
const TOURIST_VEHICLES = [
  {
    id: 'sedan-prime',
    name: 'Prime Sedan',
    classType: 'sedan',
    seats: 4,
    bags: 3,
    model: 'Maruti Suzuki Dzire / Toyota Etios',
    baseFare: 350,
    perKm: 24,
    eta: 3,
    badge: '★ Top Choice',
    icon: '🚕',
    desc: 'Spacious AC sedan with dedicated luggage boot, ideal for tourist airport and hotel transfers.',
    features: ['Chilled AC', '350L luggage boot', 'Tourism-Certified Chauffeur']
  },
  {
    id: 'suv-executive',
    name: 'Goa SUV Comfort',
    classType: 'suv',
    seats: 6,
    bags: 4,
    model: 'Maruti Ertiga / Kia Carens',
    baseFare: 550,
    perKm: 34,
    eta: 5,
    badge: 'Family Favorite',
    icon: '🚙',
    desc: 'Plush 6-seater SUV with captain recliner seats, generous luggage boot, and dual AC.',
    features: ['Captain recliner seats', 'Dual-zone AC', 'Fits 4 large bags']
  },
  {
    id: 'ev-green',
    name: 'Goa EV Green',
    classType: 'ev',
    seats: 4,
    bags: 3,
    model: 'Tata Nexon EV / Tigor EV',
    baseFare: 320,
    perKm: 22,
    eta: 4,
    badge: '⚡ 100% Electric',
    icon: '⚡',
    desc: 'Whisper-quiet eco-friendly electric ride with zero tailpipe emissions across Goa.',
    features: ['100% Zero Emission', 'Whisper-Quiet Cabin', 'Eco-friendly Green Ride']
  },
  {
    id: 'luxury-vip',
    name: 'Innova Crysta VIP',
    classType: 'luxury',
    seats: 7,
    bags: 5,
    model: 'Toyota Innova Crysta Luxury',
    baseFare: 750,
    perKm: 42,
    eta: 4,
    badge: 'VIP Elite',
    icon: '👑',
    desc: 'VIP luxury ride with plush leather recliners, complimentary bottled water, and executive chauffeur.',
    features: ['VIP Executive Chauffeur', 'Leather Recliners', 'Complimentary Water & Chargers']
  },
  {
    id: 'normal-hatchback',
    name: 'Goa Mini',
    classType: 'normal',
    seats: 4,
    bags: 2,
    model: 'Maruti WagonR / Swift',
    baseFare: 280,
    perKm: 20,
    eta: 4,
    badge: 'Budget Friendly',
    icon: '🚗',
    desc: 'Affordable, clean AC hatchback for swift point-to-point hops and narrow beach lanes.',
    features: ['Chilled AC', 'Fits 2 medium bags', 'Budget Friendly']
  },
  {
    id: 'maxi-coach',
    name: 'Tourist Maxi Coach',
    classType: 'coach',
    seats: 13,
    bags: 10,
    model: 'Force Urbania / Tempo Traveller',
    baseFare: 2200,
    perKm: 65,
    eta: 10,
    badge: 'Large Group',
    icon: '🚐',
    desc: 'High-roof tourist coach with pushback bucket seats, PA microphone, and huge rear luggage bay.',
    features: ['High-roof walk-through aisle', 'Individual AC vents', 'Huge rear luggage compartment']
  }
];

export default function CustomerCabsPage({ 
  onBookCab,
  initialPickup,
  initialDrop,
  initialDate,
  initialTime,
  initialServiceType,
  isNativeApp = false,
  onNavigateWebsite = null,
  onShowApkModal = null,
  cabUser = null,
  onOpenAuth = null,
  onLogout = null,
  onCheckForUpdates = null,
  currentAppVersion = '2.5.0'
}) {
  // Navigation & Location States
  const [pickupLocation, setPickupLocation] = useState(initialPickup || 'Manohar Intl Airport, Mopa (GOX)');
  const [dropoffLocation, setDropoffLocation] = useState(initialDrop || 'Candolim Beach');
  const [pickupNow, setPickupNow] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(initialTime || '14:30');
  const [serviceType, setServiceType] = useState(initialServiceType || 'Airport Transfer');

  // Sheet Steps: 'vehicles' (Default: ready to select car) | 'search' (Where to input) | 'passenger' (Confirm rider details)
  const [sheetStep, setSheetStep] = useState('vehicles');
  const [selectedVehicleId, setSelectedVehicleId] = useState('sedan-prime');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [extraLuggage, setExtraLuggage] = useState(false);
  const [childSeat, setChildSeat] = useState(false);

  // Rider Information (Pre-filled from authenticated cabUser)
  const [touristName, setTouristName] = useState(() => {
    if (cabUser?.name) return cabUser.name;
    try {
      return localStorage.getItem('wowgoa_rider_name') || '';
    } catch (e) { return ''; }
  });
  const [touristPhone, setTouristPhone] = useState(() => {
    if (cabUser?.phone) return cabUser.phone;
    try {
      return localStorage.getItem('wowgoa_rider_phone') || '';
    } catch (e) { return ''; }
  });
  const [touristFlight, setTouristFlight] = useState('');

  // Sync rider info if cabUser updates
  useEffect(() => {
    if (cabUser?.name) setTouristName(cabUser.name);
    if (cabUser?.phone) setTouristPhone(cabUser.phone);
  }, [cabUser]);

  // Modals & Drawers
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showTripsHistoryModal, setShowTripsHistoryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState('ride'); // 'ride' | 'trips' | 'safety' | 'support'
  const [customerToast, setCustomerToast] = useState(null);

  // Active Confirmed Trip State (Persisted across refreshes & vendor sync)
  const [isBooking, setIsBooking] = useState(false);
  const [activeConfirmedRide, setActiveConfirmedRide] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_active_ride');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.refId && parsed.status !== 'Completed' && parsed.status !== 'Cancelled') {
          return parsed;
        }
      }
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      if (dispatches.length > 0) {
        const d = dispatches[0];
        if (['Requested', 'Confirmed', 'Dispatched', 'Driver Arrived', 'In Progress'].includes(d.status)) {
          return {
            refId: d.id,
            otp: d.otp || '4821',
            status: d.status === 'Dispatched' ? 'Confirmed' : d.status,
            pickup: d.service ? d.service.split('➔')[0].trim() : 'Manohar Intl Airport, Mopa (GOX)',
            dropoff: d.service ? (d.service.split('➔')[1] || '').trim() : 'Candolim Beach',
            fare: d.amount || 1250,
            passengerName: d.customer || 'Valued Guest',
            passengerPhone: d.phone || '+91 98221 44510',
            chauffeur: {
              name: d.chauffeur || 'Rajesh Naik',
              vehiclePlate: d.vehiclePlate || 'GA-03-Z-8899',
              phone: '+91 98221 44510',
              rating: 4.93,
              trips: 1480,
              carName: d.car || 'Maruti Suzuki Dzire'
            }
          };
        }
      }
    } catch (e) {}
    return null;
  });

  // Current Overall View: 'booking' (Ola/Uber Interactive Map & Sheet) | 'confirmed' (Live Ride Screen)
  const currentView = activeConfirmedRide ? 'confirmed' : 'booking';

  const prevStatusRef = useRef(activeConfirmedRide?.status);

  // Sync props if provided
  useEffect(() => {
    if (initialPickup) setPickupLocation(initialPickup);
  }, [initialPickup]);

  useEffect(() => {
    if (initialDrop) setDropoffLocation(initialDrop);
  }, [initialDrop]);

  // Dynamic Distance Calculation (in km)
  const distanceKm = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return 25;
    if (pickupLocation === dropoffLocation) return 6;
    const p = pickupLocation.toLowerCase();
    const d = dropoffLocation.toLowerCase();
    if (p.includes('mopa') && (d.includes('colva') || d.includes('benaulim') || d.includes('palolem') || d.includes('madgaon'))) return 72;
    if (p.includes('mopa') && (d.includes('candolim') || d.includes('calangute') || d.includes('baga') || d.includes('anjuna'))) return 40;
    if (p.includes('mopa') && d.includes('panaji')) return 34;
    if (p.includes('mopa')) return 38;
    if (p.includes('dabolim') && (d.includes('candolim') || d.includes('calangute') || d.includes('baga'))) return 38;
    if (p.includes('dabolim') && d.includes('panaji')) return 28;
    if (p.includes('dabolim')) return 26;
    return 20;
  }, [pickupLocation, dropoffLocation]);

  const durationMins = Math.round(distanceKm * 1.25);

  // Dynamic Fare Calculator
  const calculateFare = (vehicle) => {
    const base = vehicle.baseFare + (distanceKm * vehicle.perKm);
    const extra = (extraLuggage ? 150 : 0) + (childSeat ? 200 : 0);
    return Math.round(base + extra);
  };

  const selectedVehicle = TOURIST_VEHICLES.find(v => v.id === selectedVehicleId) || TOURIST_VEHICLES[0];

  // Location Swap Handler
  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  // Quick 1-Tap Destination Selector
  const handleQuickDestinationSelect = (destName) => {
    setDropoffLocation(destName);
    setSheetStep('vehicles');
  };

  // Synchronize Live Ride with Backend Telematics & SQLite DB
  useEffect(() => {
    if (!activeConfirmedRide?.refId) return;

    const intervalId = setInterval(async () => {
      try {
        const liveRes = await fetchRideLiveTrack(activeConfirmedRide.refId);
        if (liveRes?.success && liveRes?.dispatch) {
          const d = liveRes.dispatch;
          let mappedStatus = 'Requested';
          if (d.status === 'ALLOCATED' || d.status === 'PENDING_ALLOCATION') mappedStatus = 'Requested';
          else if (d.status === 'DISPATCHED') mappedStatus = 'Confirmed';
          else if (d.status === 'ARRIVED') mappedStatus = 'Driver Arrived';
          else if (d.status === 'ON_TRIP') mappedStatus = 'In Progress';
          else if (d.status === 'COMPLETED') mappedStatus = 'Completed';
          else if (d.status === 'CANCELLED') mappedStatus = 'Declined';

          if (mappedStatus !== prevStatusRef.current) {
            if (mappedStatus === 'In Progress') {
              playNotificationChime('trip_start');
              setCustomerToast({
                title: '🎉 Ride Started!',
                message: `Your chauffeur is driving you safely to ${activeConfirmedRide.dropoff}.`,
                type: 'trip_start'
              });
            } else if (mappedStatus === 'Completed') {
              playNotificationChime('trip_completed');
              setCustomerToast({
                title: '🏁 Destination Reached!',
                message: `You have arrived safely at ${activeConfirmedRide.dropoff}.`,
                type: 'trip_completed'
              });
            }
            prevStatusRef.current = mappedStatus;
          }

          setActiveConfirmedRide(prev => ({
            ...prev,
            status: mappedStatus,
            otp: d.otp || prev?.otp,
            chauffeur: {
              ...prev?.chauffeur,
              name: d.assigned_driver_name || prev?.chauffeur?.name || 'Rajesh Naik',
              phone: d.assigned_driver_phone || prev?.chauffeur?.phone || '+91 98221 44510',
              vehiclePlate: d.assigned_vehicle_plate || prev?.chauffeur?.vehiclePlate || 'GA-03-Z-8899',
              carName: d.assigned_vehicle_model || prev?.chauffeur?.carName || 'Maruti Suzuki Dzire'
            }
          }));
        }
      } catch (err) {
        // Fallback to local dispatches
        try {
          const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
          const match = dispatches.find(d => d.id === activeConfirmedRide.refId);
          if (match && match.status !== activeConfirmedRide.status) {
            setActiveConfirmedRide(prev => ({ ...prev, status: match.status === 'Dispatched' ? 'Confirmed' : match.status }));
          }
        } catch (e) {}
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [activeConfirmedRide?.refId]);

  // Persist Active Ride into localStorage
  useEffect(() => {
    try {
      if (activeConfirmedRide) {
        localStorage.setItem('wowgoa_active_ride', JSON.stringify(activeConfirmedRide));
      } else {
        localStorage.removeItem('wowgoa_active_ride');
      }
    } catch (e) {}
  }, [activeConfirmedRide]);

  // Handler: Confirm & Dispatch Cab (Ola / Uber Style)
  const handleConfirmRide = async (e) => {
    e?.preventDefault();
    if (!touristPhone.trim()) {
      alert('Please enter your Mobile / WhatsApp number for driver dispatch.');
      return;
    }

    setIsBooking(true);
    try {
      localStorage.setItem('wowgoa_rider_name', touristName);
      localStorage.setItem('wowgoa_rider_phone', touristPhone);
    } catch (e) {}

    const calculatedFare = calculateFare(selectedVehicle);
    const pName = touristName || 'Valued Goa Guest';
    const pPhone = touristPhone;
    const pTime = pickupNow ? 'Immediate (3m ETA)' : `${selectedDate} ${selectedTime}`;

    let generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    let generatedRef = 'WG-TX-' + Math.floor(100000 + Math.random() * 900000);

    try {
      const backendRes = await createCabBooking({
        customer_name: pName,
        customer_phone: pPhone,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_time: pTime,
        vehicle_tier: selectedVehicle.name,
        fare_amount: calculatedFare,
        service_type: serviceType,
        payment_method: paymentMethod,
        vendor_id: 'taxi_vendor_goa'
      });
      if (backendRes?.success) {
        if (backendRes.dispatch_id) generatedRef = backendRes.dispatch_id;
        if (backendRes.otp) generatedOtp = String(backendRes.otp);
      }
    } catch (err) {
      console.warn('Backend booking sync error:', err);
    }

    setIsBooking(false);

    const newRideData = {
      refId: generatedRef,
      otp: generatedOtp,
      vehicle: selectedVehicle,
      fare: calculatedFare,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      date: pickupNow ? 'Today' : selectedDate,
      time: pTime,
      passengerName: pName,
      passengerPhone: pPhone,
      flight: touristFlight,
      status: 'Confirmed',
      paymentMethod,
      chauffeur: {
        name: 'Rajesh Naik',
        rating: 4.93,
        trips: 1480,
        vehiclePlate: 'GA-03-Z-8899',
        carName: selectedVehicle.model.split('/')[0].trim(),
        phone: '+91 98221 44510'
      }
    };

    setActiveConfirmedRide(newRideData);

    // Save into customer past trips history
    try {
      const pastTrips = JSON.parse(localStorage.getItem('wowgoa_customer_trips') || '[]');
      localStorage.setItem('wowgoa_customer_trips', JSON.stringify([newRideData, ...pastTrips.filter(t => t.refId !== generatedRef)]));

      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const newDispatch = {
        id: generatedRef,
        customer: pName,
        phone: pPhone,
        service: `${pickupLocation} ➔ ${dropoffLocation}`,
        car: selectedVehicle.model,
        chauffeur: 'Rajesh Naik',
        vehiclePlate: 'GA-03-Z-8899',
        pickupTime: pTime,
        status: 'Confirmed',
        amount: calculatedFare,
        otp: generatedOtp,
        source: 'Mobile App'
      };
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify([newDispatch, ...dispatches.filter(d => d.id !== generatedRef)]));
      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { detail: { id: generatedRef, status: 'Confirmed' } }));
    } catch (err) {}

    playNotificationChime('trip_start');
  };

  // Handler: Cancel Active Ride
  const handleCancelActiveRide = async () => {
    if (!activeConfirmedRide?.refId) return;
    try {
      await cancelCabRide(activeConfirmedRide.refId);
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => d.id === activeConfirmedRide.refId ? { ...d, status: 'Cancelled' } : d);
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { detail: { id: activeConfirmedRide.refId, status: 'Cancelled' } }));
    } catch (e) {}

    setActiveConfirmedRide(null);
    setShowCancelModal(false);
    setSheetStep('vehicles');
  };

  return (
    <div className="ola-cab-app-viewport" style={{
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* ══════════════════════════════════════════════════════════════════════
          1. FULL-VIEWPORT INTERACTIVE MAP (THE CANVAS)
         ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100%',
        height: '100%'
      }}>
        <LiveCabMap
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          mode={currentView === 'confirmed' ? 'confirmed' : 'booking'}
          activeConfirmedRide={activeConfirmedRide}
          driverStatus={activeConfirmedRide?.status || 'DISPATCHED'}
          vehiclePlate={activeConfirmedRide?.chauffeur?.vehiclePlate || 'GA-03-Z-8899'}
          driverName={activeConfirmedRide?.chauffeur?.name || 'Rajesh Naik'}
          height="100%"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FLOATING TOP APP BAR (NATIVE OLA/UBER STYLE)
         ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '14px',
        right: '14px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* Left: Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setShowSideDrawer(true)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0f172a',
            flexShrink: 0
          }}
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        {/* Center: Brand Badge with Live Driver Pulse */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '30px',
          padding: '6px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: '#0B192C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>WOW GOA</span>
              <span style={{ background: '#ff9f1c', color: '#000', fontSize: '8.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>CABS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700 }}>140+ Cabs Live</span>
            </div>
          </div>
        </div>

        {/* Right: Quick 24/7 Helpline & SOS Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#dc2626',
              flexShrink: 0
            }}
            title="Safety Toolkit & SOS"
          >
            <ShieldAlert size={20} />
          </button>
          <a
            href="tel:+919822144510"
            style={{
              height: '44px',
              borderRadius: '24px',
              background: '#0B192C',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0
            }}
            title="24/7 Cab Helpline"
          >
            <Phone size={14} color="#10b981" />
            <span className="d-none d-sm-inline">Call Dispatch</span>
            <span className="d-sm-none">Call</span>
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. OLA / UBER SLIDING BOTTOM SHEET
         ══════════════════════════════════════════════════════════════════════ */}
      <div 
        className="ola-bottom-sheet"
        style={{
          position: 'absolute',
          bottom: '60px', /* Above bottom navigation bar */
          left: 0,
          right: 0,
          zIndex: 950,
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.16)',
          maxHeight: '74vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Drag Indicator Bar */}
        <div style={{
          width: '38px',
          height: '4px',
          background: '#cbd5e1',
          borderRadius: '2px',
          margin: '8px auto 4px',
          flexShrink: 0
        }} />

        {/* ─── CASE A: RIDE IN PROGRESS / CONFIRMED DRIVER SCREEN ─────────────── */}
        {currentView === 'confirmed' && activeConfirmedRide && (
          <div style={{ padding: '8px 16px 14px', overflowY: 'auto' }}>
            
            {/* Status Header Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <span style={{
                  background: activeConfirmedRide.status === 'In Progress' ? '#ecfdf5' : '#fef3c7',
                  color: activeConfirmedRide.status === 'In Progress' ? '#047857' : '#b45309',
                  border: `1px solid ${activeConfirmedRide.status === 'In Progress' ? '#a7f3d0' : '#fde68a'}`,
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeConfirmedRide.status === 'In Progress' ? '#10b981' : '#f59e0b' }}></span>
                  {activeConfirmedRide.status === 'In Progress' ? '🟢 Trip In Progress' : '⏳ Driver Arriving (3 mins)'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Ref: <strong style={{ color: '#0f172a' }}>{activeConfirmedRide.refId}</strong>
              </span>
            </div>

            {/* BIG PROMINENT 4-DIGIT RIDE START OTP */}
            <div style={{
              background: '#0B192C',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '12px 14px',
              textAlign: 'center',
              marginBottom: '12px',
              boxShadow: '0 4px 16px rgba(11, 25, 44, 0.25)'
            }}>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff9f1c', fontWeight: 800 }}>
                Ride Start OTP
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '6px 0 4px'
              }}>
                {String(activeConfirmedRide.otp || '4821').split('').map((d, i) => (
                  <div key={i} style={{
                    width: '38px',
                    height: '42px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255, 159, 28, 0.6)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#ffffff',
                    fontFamily: 'monospace'
                  }}>
                    {d}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Share with chauffeur only after sitting inside the cab
              </span>
            </div>

            {/* Assigned Driver & Car Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px 14px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#0B192C',
                    color: '#ff9f1c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    👨🏽‍✈️
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                        {activeConfirmedRide.chauffeur?.name || 'Rajesh Naik'}
                      </span>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                        ★ 4.9
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginTop: '1px' }}>
                      {activeConfirmedRide.chauffeur?.carName || 'White Swift Dzire'}
                    </span>
                  </div>
                </div>

                {/* Number Plate Badge */}
                <div style={{
                  background: '#fef08a',
                  border: '1.5px solid #000000',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}>
                  <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#000', display: 'block', lineHeight: 1 }}>IND</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#000', letterSpacing: '0.04em' }}>
                    {activeConfirmedRide.chauffeur?.vehiclePlate || 'GA-03-Z-8899'}
                  </span>
                </div>
              </div>

              {/* Quick 1-Tap Communication Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <a
                  href={`tel:${activeConfirmedRide.chauffeur?.phone || '+919822144510'}`}
                  style={{
                    flex: 1,
                    background: '#0B192C',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  <Phone size={14} color="#10b981" />
                  <span>Call Driver</span>
                </a>
                <a
                  href={`https://wa.me/919822144510?text=${encodeURIComponent(`Hello, I am tracking ride ${activeConfirmedRide.refId} from ${activeConfirmedRide.pickup} to ${activeConfirmedRide.dropoff}. OTP: ${activeConfirmedRide.otp}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: '#25D366',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Trip Details Pill */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Route & Fare</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {activeConfirmedRide.pickup.split(',')[0]} ➔ {activeConfirmedRide.dropoff.split(',')[0]}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total (Zero Surge)</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#059669' }}>
                  ₹{activeConfirmedRide.fare}
                </span>
              </div>
            </div>

            {/* Cancel Trip Option */}
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                padding: '8px',
                color: '#dc2626',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel Ride
            </button>

          </div>
        )}

        {/* ─── CASE B: VEHICLE SELECTION STAGE (SIGNATURE OLA/UBER VIEW) ──────── */}
        {currentView === 'booking' && sheetStep === 'vehicles' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* Top Compact Route Pill (1-Tap to edit) */}
            <div 
              onClick={() => setSheetStep('search')}
              style={{
                padding: '8px 16px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Navigation size={14} color="#0B192C" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pickupLocation.split(',')[0]} ➔ {dropoffLocation.split(',')[0]}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {distanceKm} km · ~{durationMins} mins · Direct Route
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Change
              </button>
            </div>

            {/* Scrollable Vehicle Tier Cards */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 14px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {TOURIST_VEHICLES.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                const fare = calculateFare(v);
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0B192C' : '1px solid #e2e8f0',
                      background: isSelected ? '#f8fafc' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Vehicle Icon */}
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: isSelected ? '#0B192C' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      <span>{v.icon}</span>
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{v.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '11px' }}>
                          <Users size={11} />
                          <span>{v.seats}</span>
                        </div>
                        {v.badge && (
                          <span style={{
                            background: v.badge.includes('Top') ? '#0B192C' : (v.badge.includes('Electric') ? '#dcfce7' : '#f1f5f9'),
                            color: v.badge.includes('Top') ? '#ff9f1c' : (v.badge.includes('Electric') ? '#15803d' : '#0f172a'),
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {v.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.eta} min away · {v.features[0]}
                      </div>
                    </div>

                    {/* Fare */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>
                        ₹{fare}
                      </div>
                      <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700, display: 'block' }}>
                        Zero Surge
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Row & Sticky Full-Width "Book [Vehicle]" Action Button */}
            <div style={{
              padding: '8px 14px 10px',
              borderTop: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0
            }}>
              {/* Payment selector pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#f8fafc',
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="cash">💵 Cash on Drop</option>
                    <option value="upi">⚡ UPI (GPay / PhonePe)</option>
                    <option value="card">💳 Card / Netbanking</option>
                  </select>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                  🛡️ Fixed Goa Fare Guaranteed
                </span>
              </div>

              {/* Signature Big Black Book CTA Button */}
              <button
                type="button"
                onClick={() => setSheetStep('passenger')}
                style={{
                  width: '100%',
                  background: '#0B192C',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px 18px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(11, 25, 44, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <span>Book {selectedVehicle.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>₹{calculateFare(selectedVehicle)}</span>
                  <ArrowRight size={17} />
                </div>
              </button>
            </div>

          </div>
        )}

        {/* ─── CASE C: SEARCH & "WHERE TO?" INPUT STAGE ───────────────────────── */}
        {currentView === 'booking' && sheetStep === 'search' && (
          <div style={{ padding: '10px 16px 14px', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Where are you heading?</span>
              <button
                type="button"
                onClick={() => setSheetStep('vehicles')}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Dual Location Autocomplete Input */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative',
              marginBottom: '10px'
            }}>
              {/* Pickup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></span>
                <div style={{ flex: 1 }}>
                  <CabLocationAutocomplete
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    placeholder="Pickup location in Goa..."
                    type="pickup"
                    inputStyle={{ background: '#ffffff', borderRadius: '10px', fontSize: '13px', padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* Swap Button on side */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '1px', background: '#e2e8f0', margin: '2px 0', position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                  }}
                  title="Swap Locations"
                >
                  <ArrowUpDown size={12} color="#475569" />
                </button>
              </div>

              {/* Dropoff */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#0f172a', flexShrink: 0 }}></span>
                <div style={{ flex: 1 }}>
                  <CabLocationAutocomplete
                    value={dropoffLocation}
                    onChange={setDropoffLocation}
                    placeholder="Where to? (e.g. Candolim, Baga)..."
                    type="dropoff"
                    inputStyle={{ background: '#ffffff', borderRadius: '10px', fontSize: '13px', padding: '8px 12px' }}
                  />
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Popular Goa Destinations (Horizontal Scroll Chips) */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                Popular Goa Destinations
              </span>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {GOA_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleQuickDestinationSelect(loc.name)}
                    style={{
                      background: dropoffLocation === loc.name ? '#0B192C' : '#ffffff',
                      color: dropoffLocation === loc.name ? '#ffffff' : '#0f172a',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <span>{loc.emoji}</span>
                    <span>{loc.name.split(',')[0].replace('& Tito’s Lane', '').trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setPickupNow(true)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: pickupNow ? '2px solid #0B192C' : '1px solid #e2e8f0',
                  background: pickupNow ? '#f8fafc' : '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={14} color={pickupNow ? '#0B192C' : '#64748b'} />
                <span>Pickup Now</span>
              </button>
              <button
                type="button"
                onClick={() => setPickupNow(false)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: !pickupNow ? '2px solid #0B192C' : '1px solid #e2e8f0',
                  background: !pickupNow ? '#f8fafc' : '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Calendar size={14} color={!pickupNow ? '#0B192C' : '#64748b'} />
                <span>Schedule Later</span>
              </button>
            </div>

            {/* View Cabs Button */}
            <button
              type="button"
              onClick={() => setSheetStep('vehicles')}
              style={{
                width: '100%',
                background: '#0B192C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Confirm Route & View Cabs ➔
            </button>

          </div>
        )}

        {/* ─── CASE D: PASSENGER CONFIRMATION & DISPATCH STAGE ────────────────── */}
        {currentView === 'booking' && sheetStep === 'passenger' && (
          <div style={{ padding: '10px 16px 14px', overflowY: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSheetStep('vehicles')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <ArrowLeft size={18} color="#0f172a" />
                </button>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Confirm Rider Details
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>
                ₹{calculateFare(selectedVehicle)}
              </span>
            </div>

            {/* Vehicle Preview Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedVehicle.icon}</span>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                    {selectedVehicle.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {pickupLocation.split(',')[0]} ➔ {dropoffLocation.split(',')[0]}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                3 min ETA
              </span>
            </div>

            {/* Passenger Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Rider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={touristName}
                  onChange={(e) => setTouristName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Mobile / WhatsApp Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98221 44510"
                  value={touristPhone}
                  onChange={(e) => setTouristPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff'
                  }}
                />
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Driver will call & WhatsApp ride coordinates to this number.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                  Flight / Room No / Pickup Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IndiGo 6E-241 / Near Arrival Gate 2"
                  value={touristFlight}
                  onChange={(e) => setTouristFlight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff'
                  }}
                />
              </div>

              {/* Add-ons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={extraLuggage} onChange={(e) => setExtraLuggage(e.target.checked)} />
                  <span>Roof Luggage Carrier (+₹150)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} />
                  <span>Child Seat (+₹200)</span>
                </label>
              </div>
            </div>

            {/* Confirm & Dispatch Button */}
            <button
              type="button"
              onClick={handleConfirmRide}
              disabled={isBooking}
              style={{
                width: '100%',
                background: '#0B192C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isBooking ? 'wait' : 'pointer',
                opacity: isBooking ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(11, 25, 44, 0.3)'
              }}
            >
              {isBooking ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  <span>Connecting to Nearby Drivers...</span>
                </>
              ) : (
                <span>Confirm & Dispatch Cab · ₹{calculateFare(selectedVehicle)}</span>
              )}
            </button>

          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. FIXED BOTTOM APP NAVIGATION BAR (NATIVE APP STANDARD)
         ══════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px calc(env(safe-area-inset-bottom, 0px) + 2px)'
      }}>
        {/* 1. Ride (Home Map) */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomNav('ride');
            if (activeConfirmedRide) {
              // Stay in confirmed view
            } else {
              setSheetStep('vehicles');
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeBottomNav === 'ride' ? '#0B192C' : '#94a3b8',
            fontWeight: activeBottomNav === 'ride' ? 800 : 500,
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <Car size={20} color={activeBottomNav === 'ride' ? '#0B192C' : '#94a3b8'} />
          <span>Ride</span>
        </button>

        {/* 2. Activity / Trips */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomNav('trips');
            setShowTripsHistoryModal(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeBottomNav === 'trips' ? '#0B192C' : '#94a3b8',
            fontWeight: activeBottomNav === 'trips' ? 800 : 500,
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <Clock size={20} color={activeBottomNav === 'trips' ? '#0B192C' : '#94a3b8'} />
          <span>Trips</span>
        </button>

        {/* 3. Safety SOS */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomNav('safety');
            setShowSafetyModal(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: activeBottomNav === 'safety' ? '#dc2626' : '#94a3b8',
            fontWeight: activeBottomNav === 'safety' ? 800 : 500,
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <ShieldAlert size={20} color={activeBottomNav === 'safety' ? '#dc2626' : '#94a3b8'} />
          <span>Safety</span>
        </button>

        {/* 4. Support / WhatsApp */}
        <a
          href="https://wa.me/919822144510?text=Hello%20WOW%20GOA%20Cabs,%20I%20need%20assistance%20with%20cab%20booking"
          target="_blank"
          rel="noreferrer"
          style={{
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <MessageSquare size={20} color="#25D366" />
          <span>Support</span>
        </a>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          5. SIDE NAVIGATION DRAWER (HAMBURGER MENU)
         ══════════════════════════════════════════════════════════════════════ */}
      {showSideDrawer && (
        <>
          <div
            onClick={() => setShowSideDrawer(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              backdropFilter: 'blur(3px)'
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '280px',
            maxWidth: '85vw',
            background: '#ffffff',
            zIndex: 2010,
            boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{
              background: '#0B192C',
              color: '#ffffff',
              padding: '24px 20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>WOW GOA</span>
                    <span style={{ background: '#ff9f1c', color: '#000', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px', marginLeft: '5px' }}>CABS</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSideDrawer(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Rider Profile Card in Drawer */}
              {cabUser ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: '#ff9f1c',
                      color: '#0B192C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '15px'
                    }}>
                      {cabUser.name ? cabUser.name[0].toUpperCase() : 'R'}
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                        {cabUser.name || 'Valued Rider'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {cabUser.phone || cabUser.email || 'Verified Account'}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                    Verified
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowSideDrawer(false); onOpenAuth?.(); }}
                  style={{
                    background: 'rgba(255, 159, 28, 0.15)',
                    border: '1px solid rgba(255, 159, 28, 0.4)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    marginTop: '10px',
                    color: '#ff9f1c',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <span>Sign In / Register</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Drawer Menu Items */}
            <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <button
                type="button"
                onClick={() => { setShowSideDrawer(false); setSheetStep('vehicles'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <Car size={18} color="#0B192C" />
                <span>Book a Cab</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowSideDrawer(false); setShowTripsHistoryModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <Clock size={18} color="#0B192C" />
                <span>My Trips & Receipts</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowSideDrawer(false); setShowRateCardModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <Tag size={18} color="#0B192C" />
                <span>Goa Airport Rate Card</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowSideDrawer(false); setShowSafetyModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                <ShieldAlert size={18} color="#dc2626" />
                <span>Safety Toolkit & SOS</span>
              </button>

              <a
                href="tel:+919822144510"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <Phone size={18} color="#10b981" />
                <span>24/7 Helpline: +91 98221 44510</span>
              </a>

              {/* Check for Updates */}
              {onCheckForUpdates && (
                <button
                  type="button"
                  onClick={async () => {
                    const hasUpdate = await onCheckForUpdates(true);
                    if (!hasUpdate) {
                      alert("You're using the latest version of WOW GOA CABS (v" + (currentAppVersion || '2.5.0') + ")! ✅");
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  <RefreshCw size={16} color="#0B192C" />
                  <span>Check for Updates (v{currentAppVersion || '2.5.0'})</span>
                </button>
              )}

              {/* Log Out / Switch Account */}
              {cabUser && onLogout && (
                <button
                  type="button"
                  onClick={() => { setShowSideDrawer(false); onLogout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#dc2626',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  <Lock size={16} color="#dc2626" />
                  <span>Switch Account / Sign Out</span>
                </button>
              )}

              {/* If web browser, link back to website */}
              {!isNativeApp && onNavigateWebsite && (
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => { setShowSideDrawer(false); onNavigateWebsite(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      width: '100%',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Visit WOW GOA Holiday Website</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '11px', color: '#94a3b8' }}>
              <span>WOW GOA Cabs v2.4 · Goa Tourism Registered</span>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          6. RATE CARD MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showRateCardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '440px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} color="#0B192C" />
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Goa Fixed Rate Card</span>
              </div>
              <button type="button" onClick={() => setShowRateCardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Official transparent fixed rates. Zero surge pricing guaranteed 24/7.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { from: 'Mopa Airport (GOX)', to: 'Candolim / Calangute / Baga', fare: '₹1,250', time: '40 mins' },
                { from: 'Mopa Airport (GOX)', to: 'Panaji Capital', fare: '₹1,150', time: '35 mins' },
                { from: 'Mopa Airport (GOX)', to: 'Anjuna / Vagator', fare: '₹1,350', time: '45 mins' },
                { from: 'Mopa Airport (GOX)', to: 'South Goa (Colva / Benaulim)', fare: '₹2,200', time: '75 mins' },
                { from: 'Dabolim Airport (GOI)', to: 'Candolim / Calangute', fare: '₹1,450', time: '45 mins' },
                { from: 'Dabolim Airport (GOI)', to: 'Colva / Benaulim Beach', fare: '₹850', time: '30 mins' },
                { from: 'Madgaon Station (MAO)', to: 'Benaulim / Colva Beach', fare: '₹450', time: '18 mins' }
              ].map((rate, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                      {rate.from} ➔ {rate.to}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>~{rate.time}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>
                    {rate.fare}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowRateCardModal(false)}
              style={{ width: '100%', marginTop: '16px', background: '#0B192C', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. SAFETY SOS TOOLKIT MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showSafetyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '420px', width: '100%', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={22} color="#dc2626" />
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Safety Toolkit & SOS</span>
              </div>
              <button type="button" onClick={() => setShowSafetyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Your safety is our top priority. Instant one-tap access to emergency services across Goa.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="tel:112"
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#b91c1c'
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, display: 'block' }}>Goa Police Emergency</span>
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>24/7 Police, Ambulance, Fire</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>Dial 112</span>
              </a>

              <a
                href="tel:1091"
                style={{
                  background: '#fdf4ff',
                  border: '1.5px solid #f5d0fe',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#a21caf'
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, display: 'block' }}>Goa Women Helpline</span>
                  <span style={{ fontSize: '11px', color: '#c026d3' }}>Dedicated 24/7 Safety Support</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 900 }}>Dial 1091</span>
              </a>

              <a
                href="tel:+919822144510"
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#15803d'
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 800, display: 'block' }}>WOW GOA Dispatch Desk</span>
                  <span style={{ fontSize: '11px', color: '#16a34a' }}>24/7 Cab Control Room</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>+91 98221 44510</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSafetyModal(false)}
              style={{ width: '100%', marginTop: '16px', background: '#0B192C', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          8. CANCEL RIDE CONFIRMATION MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '380px', width: '100%', padding: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>⚠️</span>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'block' }}>Cancel this Ride?</span>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '8px 0 16px' }}>
              Your chauffeur Rajesh Naik is already dispatched. Are you sure you want to cancel? Zero cancellation fee applies.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Keep Ride
              </button>
              <button
                type="button"
                onClick={handleCancelActiveRide}
                style={{ flex: 1, background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          9. CUSTOMER TRIPS & ACTIVITY MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      <CustomerTripsModal
        isOpen={showTripsHistoryModal}
        onClose={() => setShowTripsHistoryModal(false)}
        onSelectTrip={(t) => {
          setActiveConfirmedRide(t);
          setShowTripsHistoryModal(false);
        }}
        onRebookTrip={(t) => {
          if (t.pickup) setPickupLocation(t.pickup);
          if (t.dropoff) setDropoffLocation(t.dropoff);
          setShowTripsHistoryModal(false);
          setSheetStep('vehicles');
        }}
        activeRefId={activeConfirmedRide?.refId}
      />

    </div>
  );
}
