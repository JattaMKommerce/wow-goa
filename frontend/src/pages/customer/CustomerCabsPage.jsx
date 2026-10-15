import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Car, Calendar, Clock, MapPin, ArrowRight, X, Shield, 
  Sparkles, CheckCircle2, ChevronDown, LocateFixed, Phone, 
  Share2, Radio, Check, CreditCard, Navigation, ArrowUpDown,
  Tag, Info, User, AlertCircle, Search, Compass, ExternalLink,
  Plus, Minus, RefreshCw, ChevronLeft, ChevronRight,
  Users, Briefcase, ArrowLeft, Download, MessageSquare,
  Award, Fuel, CheckCircle, SlidersHorizontal, Plane
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
  // Airports & Major Railway Stations
  { name: 'Manohar Intl Airport, Mopa (GOX)', category: 'Airports & Transit', region: 'North Goa Hub', popular: true },
  { name: 'Dabolim International Airport (GOI)', category: 'Airports & Transit', region: 'Central/South Hub', popular: true },
  { name: 'Madgaon Railway Station (MAO)', category: 'Airports & Transit', region: 'South Goa Hub', popular: true },
  { name: 'Thivim Railway Station (THVM)', category: 'Airports & Transit', region: 'North Goa Hub', popular: true },
  { name: 'Karmali Railway Station (KRMI)', category: 'Airports & Transit', region: 'Central Goa Hub', popular: false },
  { name: 'Vasco da Gama Railway Station', category: 'Airports & Transit', region: 'Port City Hub', popular: false },

  // North Goa - Beaches & Tourist Hubs
  { name: 'Candolim Beach', category: 'North Goa Coast', region: 'Coastal Hub', popular: true },
  { name: 'Calangute Beach', category: 'North Goa Coast', region: 'Coastal Hub', popular: true },
  { name: 'Baga Beach & Tito’s Lane', category: 'North Goa Coast', region: 'Party & Dining Hub', popular: true },
  { name: 'Anjuna Beach & Flea Market', category: 'North Goa Coast', region: 'Bohemian Coast', popular: true },
  { name: 'Vagator Beach & Chapora Fort', category: 'North Goa Coast', region: 'Cliff & Sunset Hub', popular: true },
  { name: 'Morjim Beach (Turtle Beach)', category: 'North Goa Coast', region: 'Serene North Coast', popular: true },
  { name: 'Ashvem Beach', category: 'North Goa Coast', region: 'Boutique Resorts', popular: false },
  { name: 'Mandrem Beach', category: 'North Goa Coast', region: 'Peaceful Coastal', popular: false },
  { name: 'Arambol Beach & Sweet Lake', category: 'North Goa Coast', region: 'Far North Coast', popular: true },
  { name: 'Sinquerim Beach (Fort Aguada)', category: 'North Goa Coast', region: 'Heritage Coast', popular: false },
  { name: 'Siolim Waterfront', category: 'North Goa Coast', region: 'Chapora Riverfront', popular: false },
  { name: 'Querim (Keri) Beach', category: 'North Goa Coast', region: 'Northernmost Coast', popular: false },

  // North Goa - Cities & Heritage
  { name: 'Panaji (Capital / Fontainhas Latin Quarter)', category: 'North Goa Cities', region: 'Capital & Heritage', popular: true },
  { name: 'Porvorim', category: 'North Goa Cities', region: 'Commercial Center', popular: false },
  { name: 'Mapusa Market & Bus Stand', category: 'North Goa Cities', region: 'Market Hub', popular: true },
  { name: 'Old Goa (Basilica of Bom Jesus)', category: 'North Goa Cities', region: 'UNESCO Heritage Hub', popular: true },
  { name: 'Reis Magos Fort & Nerul', category: 'North Goa Cities', region: 'Riverfront Heritage', popular: false },
  { name: 'Aldona Village', category: 'North Goa Cities', region: 'Scenic Countryside', popular: false },
  { name: 'Bicholim & Mayem Lake', category: 'North Goa Cities', region: 'Inland Hub', popular: false },

  // South Goa - Beaches & Luxury Resorts
  { name: 'Colva Beach', category: 'South Goa Coast', region: 'Central South Coast', popular: true },
  { name: 'Benaulim Beach', category: 'South Goa Coast', region: 'Water Sports Hub', popular: true },
  { name: 'Varca Beach', category: 'South Goa Coast', region: 'Luxury Resort Belt', popular: false },
  { name: 'Cavelossim Beach', category: 'South Goa Coast', region: 'Luxury 5-Star Strip', popular: true },
  { name: 'Mobor Beach', category: 'South Goa Coast', region: 'Sal River Estuary', popular: false },
  { name: 'Majorda Beach', category: 'South Goa Coast', region: 'Resort Beach', popular: false },
  { name: 'Betalbatim Beach (Sunset Beach)', category: 'South Goa Coast', region: 'Tranquil Sands', popular: false },
  { name: 'Utorda & Arossim Beach', category: 'South Goa Coast', region: 'Resort Coast', popular: false },

  // Far South Goa - Scenic Coastline
  { name: 'Palolem Beach', category: 'Far South Coast', region: 'Crescent Bay Hub', popular: true },
  { name: 'Agonda Beach', category: 'Far South Coast', region: 'Quiet Turtle Bay', popular: true },
  { name: 'Patnem Beach', category: 'Far South Coast', region: 'Scenic Bay', popular: false },
  { name: 'Cola Beach & Blue Lagoon', category: 'Far South Coast', region: 'Hidden Lagoon', popular: false },
  { name: 'Butterfly Beach', category: 'Far South Coast', region: 'Secluded Bay', popular: false },
  { name: 'Cabo de Rama Fort & Cliff', category: 'Far South Coast', region: 'Historic Cliffside', popular: false },
  { name: 'Canacona Town', category: 'Far South Coast', region: 'Market & Transit', popular: false },

  // South & Central Inland
  { name: 'Margao City (Commercial Capital)', category: 'South Goa Inland', region: 'Commercial Hub', popular: true },
  { name: 'Ponda (Temples & Spice Plantations)', category: 'South Goa Inland', region: 'Cultural & Spice Hub', popular: true },
  { name: 'Vasco da Gama Port City', category: 'South Goa Inland', region: 'Port & Naval Hub', popular: false },
  { name: 'Quepem & Sanguem', category: 'South Goa Inland', region: 'Hinterland Nature', popular: false },
  { name: 'Dudhsagar Waterfalls Entry (Kulem)', category: 'South Goa Inland', region: 'Adventure Hub', popular: true }
];

// Complete Tourist Fleet Categories (Normal, Sedan, Executive SUV, Luxury VIP, Maxi Coach)
const TOURIST_VEHICLES = [
  {
    id: 'normal-hatchback',
    name: 'Normal Hatchback',
    classType: 'normal',
    seats: 4,
    bags: 2,
    model: 'Maruti WagonR / Swift / Tiago',
    baseFare: 280,
    perKm: 20,
    eta: 4,
    badge: 'Budget Choice',
    icon: '🚗',
    desc: 'Affordable, clean AC hatchback for solo tourists, couples, and swift beach hops.',
    features: ['Chilled AC', 'Fits 2 medium bags', 'Ideal for narrow Goa beach lanes']
  },
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
    badge: 'Most Popular',
    icon: '🚕',
    desc: 'Spacious AC sedan with dedicated luggage boot, ideal for tourist airport and hotel transfers.',
    features: ['Comfortable legroom', 'Spacious 350L luggage boot', 'Verified English & Hindi speaking driver']
  },
  {
    id: 'suv-executive',
    name: 'Executive SUV',
    classType: 'suv',
    seats: 6,
    bags: 4,
    model: 'Toyota Innova Crysta / Ertiga',
    baseFare: 550,
    perKm: 34,
    eta: 5,
    badge: 'Family Favorite',
    icon: '🚙',
    desc: 'Plush 6-seater SUV with captain recliner seats, generous luggage boot, and dual AC.',
    features: ['Plush captain recliner seats', 'Dual-zone climate control', 'Fits 4 large suitcases + hand bags']
  },
  {
    id: 'luxury-vip',
    name: 'VIP Luxury Chauffeur',
    classType: 'luxury',
    seats: 4,
    bags: 3,
    model: 'Mercedes-Benz E-Class / BMW 5 Series / Fortuner',
    baseFare: 1800,
    perKm: 85,
    eta: 8,
    badge: 'VIP Elite',
    icon: '👑',
    desc: 'Suited executive chauffeur, leather interior, chilled packaged water, and airport placard reception.',
    features: ['Suited executive chauffeur', 'Chilled packaged water & mints', 'Complimentary Wi-Fi & device chargers']
  },
  {
    id: 'maxi-coach',
    name: 'Tourist Maxi Coach',
    classType: 'coach',
    seats: 13,
    bags: 10,
    model: 'Force Urbania Executive / Tempo Traveller',
    baseFare: 2200,
    perKm: 65,
    eta: 12,
    badge: 'Tour Group',
    icon: '🚐',
    desc: 'High-roof tourist coach with pushback bucket seats, PA microphone, and huge rear luggage bay.',
    features: ['High-roof walk-through aisle', 'Individual AC vents & reading lamps', 'Huge rear luggage compartment']
  }
];

export default function CustomerCabsPage({ onBookCab }) {
  // Page View Modes: 'landing' (Uber storefront) | 'booking' (Dedicated Tourist Booking Page) | 'confirmed'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_active_ride');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status && parsed.status !== 'Completed') return 'confirmed';
      }
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      if (dispatches.length > 0) {
        const d = dispatches[0];
        if (['Requested', 'Confirmed', 'Dispatched', 'Driver Arrived', 'In Progress', 'Declined'].includes(d.status)) {
          return 'confirmed';
        }
      }
    } catch (e) {}
    return 'landing';
  });
  const [showAppBookingModal, setShowAppBookingModal] = useState(false);

  // Navigation & Location States
  const [currentCity, setCurrentCity] = useState('Goa, IN');
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityModalTarget, setCityModalTarget] = useState('city'); // 'city' | 'pickup' | 'dropoff'
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  
  // Trip Configuration State
  const [serviceType, setServiceType] = useState('Point-to-Point'); // 'Point-to-Point', 'Airport Transfer', 'Sightseeing Tour', 'Intercity'
  const [pickupNow, setPickupNow] = useState(true);
  const [pickupLocation, setPickupLocation] = useState('Manohar Intl Airport, Mopa (GOX)');
  const [dropoffLocation, setDropoffLocation] = useState('Candolim Beach');
  
  // Date & Time Scheduling States
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filters on Dedicated Booking Page: Seats & Vehicle Class
  const [seatFilter, setSeatFilter] = useState('all'); // 'all', '4', '6', '13'
  const [classFilter, setClassFilter] = useState('all'); // 'all', 'normal', 'sedan', 'suv', 'luxury', 'coach'
  const [selectedVehicleId, setSelectedVehicleId] = useState('sedan-prime');

  // Tourist Passenger Details
  const [touristName, setTouristName] = useState('');
  const [touristPhone, setTouristPhone] = useState('');
  const [touristFlight, setTouristFlight] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'upi', 'card'
  const [extraLuggage, setExtraLuggage] = useState(false);
  const [childSeat, setChildSeat] = useState(false);

  // Calendar Navigation State
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());

  // Active Confirmed Trip State (Persisted across tab switches and refreshes)
  const [isBooking, setIsBooking] = useState(false);
  const [activeConfirmedRide, setActiveConfirmedRide] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_active_ride');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.refId) return parsed;
      }
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      if (dispatches.length > 0) {
        const d = dispatches[0];
        if (['Requested', 'Confirmed', 'Dispatched', 'Driver Arrived', 'In Progress', 'Declined'].includes(d.status)) {
          return {
            refId: d.id,
            otp: d.otp || '4821',
            status: d.status === 'Dispatched' ? 'Confirmed' : d.status,
            pickup: d.service ? d.service.split('➔')[0].trim() : 'Benaulim Beach',
            dropoff: d.service ? (d.service.split('➔')[1] || '').trim() : 'Ponda',
            fare: d.amount || 790,
            passengerName: d.customer || 'Valued Guest',
            passengerPhone: d.phone || '+91 98221 44510',
            chauffeur: {
              name: d.chauffeur || 'Suresh Naik',
              vehiclePlate: d.vehiclePlate || 'GA-03-Z-8899',
              phone: '+91 98221 44510',
              rating: 4.93,
              trips: 1840
            }
          };
        }
      }
    } catch (e) {}
    return null;
  });

  const requestRideRef = useRef(null);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showTripsHistoryModal, setShowTripsHistoryModal] = useState(false);
  const [customerToast, setCustomerToast] = useState(null);
  const prevStatusRef = useRef(activeConfirmedRide?.status);

  // Helper to persist trip into customer history storage
  const recordCustomerTripHistory = (tripObj) => {
    if (!tripObj?.refId) return;
    try {
      const history = JSON.parse(localStorage.getItem('wowgoa_customer_trips') || '[]');
      const idx = history.findIndex(t => t.refId === tripObj.refId);
      if (idx >= 0) {
        history[idx] = { ...history[idx], ...tripObj };
      } else {
        history.unshift(tripObj);
      }
      localStorage.setItem('wowgoa_customer_trips', JSON.stringify(history));
    } catch (e) {}
  };

  // Handle Customer Ride Cancellation
  const handleCustomerCancelRide = async (reason = 'Cancelled by passenger') => {
    if (!activeConfirmedRide) return;
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    const cancelledRide = {
      ...activeConfirmedRide,
      status: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason
    };

    setActiveConfirmedRide(cancelledRide);
    recordCustomerTripHistory(cancelledRide);

    try {
      localStorage.setItem('wowgoa_active_ride', JSON.stringify(cancelledRide));
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updatedDisp = dispatches.map(d => (d.id === activeConfirmedRide.refId ? { ...d, status: 'Cancelled' } : d));
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updatedDisp));
      
      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: activeConfirmedRide.refId, status: 'CANCELLED' }
      }));
    } catch (e) {}

    try {
      await cancelCabRide(activeConfirmedRide.refId, reason);
    } catch (e) {}

    playNotificationChime('route_updated');
    setCustomerToast({
      title: '❌ Ride Cancelled',
      message: 'Your ride has been cancelled. You can review it anytime in your Trips Activity.',
      type: 'cancelled'
    });
  };

  // Auto-dismiss customerToast after 6 seconds
  useEffect(() => {
    if (customerToast) {
      const timer = setTimeout(() => setCustomerToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [customerToast]);

  // Keep wowgoa_active_ride in localStorage up-to-date
  useEffect(() => {
    if (activeConfirmedRide) {
      try {
        localStorage.setItem('wowgoa_active_ride', JSON.stringify(activeConfirmedRide));
        recordCustomerTripHistory(activeConfirmedRide);
      } catch (e) {}
    }
  }, [activeConfirmedRide]);

  // Customer handler for Adding Stop along route (Ola/Uber style)
  const handleCustomerAddStop = (newStopName, newFare, surcharge) => {
    const currentStops = activeConfirmedRide?.stops || [];
    const updatedStops = [...currentStops, { name: newStopName, extraFare: surcharge }];
    const updatedRide = {
      ...activeConfirmedRide,
      stops: updatedStops,
      fare: newFare,
      routeUpdatedAt: Date.now()
    };
    setActiveConfirmedRide(updatedRide);
    try {
      localStorage.setItem('wowgoa_active_ride', JSON.stringify(updatedRide));
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updatedDisp = dispatches.map(d => {
        if (d.id === activeConfirmedRide?.refId) {
          return {
            ...d,
            stops: updatedStops,
            amount: newFare,
            service: `${activeConfirmedRide.pickup} ➔ ${newStopName} ➔ ${activeConfirmedRide.dropoff}`
          };
        }
        return d;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updatedDisp));
      window.dispatchEvent(new CustomEvent('wowgoa_route_updated', {
        detail: { refId: activeConfirmedRide?.refId, stop: newStopName, newFare, updatedBy: 'customer' }
      }));
      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: activeConfirmedRide?.refId, status: activeConfirmedRide?.status }
      }));
    } catch (e) {}

    setShowAddStopModal(false);
    playNotificationChime('route_updated');
    setCustomerToast({
      title: '✅ Route Updated!',
      message: `Via stop "${newStopName}" added. New total fare is ₹${newFare}.`,
      type: 'success'
    });
  };

  // Synchronize active confirmed ride in real-time with Chauffeur Portal & Backend updates
  useEffect(() => {
    if (!activeConfirmedRide?.refId) return;

    const syncStatus = async () => {
      try {
        // 1. Query real backend telematics & ride status
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

          // Trigger Ride Started & Destination Reached notifications
          if (mappedStatus !== prevStatusRef.current) {
            if (mappedStatus === 'In Progress') {
              playNotificationChime('trip_start');
              setCustomerToast({
                title: '🎉 Ride Started!',
                message: `Your chauffeur is driving you safely to ${activeConfirmedRide.dropoff}. Sit back and enjoy your journey!`,
                type: 'trip_start'
              });
            } else if (mappedStatus === 'Completed') {
              playNotificationChime('trip_completed');
              setCustomerToast({
                title: '🏁 Destination Reached!',
                message: `You have arrived safely at ${activeConfirmedRide.dropoff}. Trip completed successfully!`,
                type: 'trip_completed'
              });
            }
            prevStatusRef.current = mappedStatus;
          }

          setActiveConfirmedRide(prev => {
            if (!prev) return prev;
            if (prev.status === mappedStatus && 
                prev.otp === (d.otp || prev.otp) && 
                prev.chauffeur?.vehiclePlate === (d.assigned_vehicle_plate || prev.chauffeur?.vehiclePlate)) {
              return prev;
            }
            return {
              ...prev,
              status: mappedStatus,
              otp: d.otp || prev?.otp,
              telematics: liveRes.telematics || prev?.telematics,
              chauffeur: {
                ...prev?.chauffeur,
                name: d.assigned_driver_name || prev?.chauffeur?.name || 'Suresh Naik',
                phone: d.assigned_driver_phone || prev?.chauffeur?.phone || '+91 98221 44510',
                vehiclePlate: d.assigned_vehicle_plate || prev?.chauffeur?.vehiclePlate || 'GA-03-Z-8899',
                carName: d.assigned_vehicle_model || prev?.chauffeur?.carName || 'Toyota Innova Crysta'
              }
            };
          });
          return;
        }

        // 2. Fallback to localStorage sync
        const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
        const updated = dispatches.find(d => d.id === activeConfirmedRide.refId);
        if (updated) {
          let lsStatus = updated.status;
          if (lsStatus === 'Dispatched') lsStatus = 'Confirmed';
          if (lsStatus === 'CANCELLED' || lsStatus === 'Cancelled') lsStatus = 'Declined';

          // Trigger Ride Started & Destination Reached notifications on local sync
          if (lsStatus !== prevStatusRef.current) {
            if (lsStatus === 'In Progress') {
              playNotificationChime('trip_start');
              setCustomerToast({
                title: '🎉 Ride Started!',
                message: `Your chauffeur has started your ride to ${activeConfirmedRide.dropoff}. Safe travels!`,
                type: 'trip_start'
              });
            } else if (lsStatus === 'Completed') {
              playNotificationChime('trip_completed');
              setCustomerToast({
                title: '🏁 Destination Reached!',
                message: `You have arrived safely at ${activeConfirmedRide.dropoff}. Trip completed!`,
                type: 'trip_completed'
              });
            }
            prevStatusRef.current = lsStatus;
          }

          if (lsStatus !== activeConfirmedRide.status || (updated.stops && updated.stops.length !== (activeConfirmedRide.stops || []).length) || (updated.amount && updated.amount !== activeConfirmedRide.fare)) {
            setActiveConfirmedRide(prev => ({
              ...prev,
              status: lsStatus,
              stops: updated.stops || prev?.stops || [],
              fare: updated.amount || prev?.fare,
              chauffeur: {
                ...prev?.chauffeur,
                name: updated.chauffeur || prev?.chauffeur?.name,
                vehiclePlate: updated.vehiclePlate || prev?.chauffeur?.vehiclePlate
              }
            }));
          }
        }
      } catch (e) {}
    };

    const handleStorageChange = (e) => {
      if (e.key === 'wowgoa_active_ride' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.status) {
            if (parsed.status !== prevStatusRef.current) {
              if (parsed.status === 'In Progress') {
                playNotificationChime('trip_start');
                setCustomerToast({
                  title: '🎉 Ride Started!',
                  message: `Your chauffeur has started your ride to ${parsed.dropoff || activeConfirmedRide.dropoff}. Safe travels!`,
                  type: 'trip_start'
                });
              } else if (parsed.status === 'Completed') {
                playNotificationChime('trip_completed');
                setCustomerToast({
                  title: '🏁 Destination Reached!',
                  message: `You have arrived safely at ${parsed.dropoff || activeConfirmedRide.dropoff}. Trip completed!`,
                  type: 'trip_completed'
                });
              }
              prevStatusRef.current = parsed.status;
            }
            setActiveConfirmedRide(prev => ({ ...prev, ...parsed }));
          }
        } catch (err) {}
      }
      syncStatus();
    };

    const handleRouteUpdated = (e) => {
      if (e.detail) {
        const { stop, newFare, updatedBy } = e.detail;
        if (updatedBy !== 'customer') {
          playNotificationChime('route_updated');
          setCustomerToast({
            title: '🔔 Route Updated by Chauffeur',
            message: `Chauffeur added stop at "${stop}". Updated fare: ₹${newFare}.`,
            type: 'info'
          });
        }
      }
      syncStatus();
    };

    const interval = setInterval(syncStatus, 1000); // 1-second live polling
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wowgoa_dispatch_updated', syncStatus);
    window.addEventListener('wowgoa_route_updated', handleRouteUpdated);
    window.addEventListener('focus', syncStatus);
    const handleVis = () => { if (!document.hidden) syncStatus(); };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wowgoa_dispatch_updated', syncStatus);
      window.removeEventListener('wowgoa_route_updated', handleRouteUpdated);
      window.removeEventListener('focus', syncStatus);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [activeConfirmedRide?.refId, activeConfirmedRide?.dropoff]);

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    const handlePrefill = (e) => {
      if (e.detail?.location) setPickupLocation(e.detail.location);
    };
    const handleGPS = (e) => {
      if (e.detail?.label) setPickupLocation(e.detail.label);
    };
    window.addEventListener('prefill-cab-pickup', handlePrefill);
    window.addEventListener('gps-location-detected', handleGPS);
    return () => {
      window.removeEventListener('prefill-cab-pickup', handlePrefill);
      window.removeEventListener('gps-location-detected', handleGPS);
    };
  }, []);

  // Generate 15-minute time intervals for 24 hours
  const TIME_SLOTS_15MIN = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const displayMin = min === 0 ? '00' : min.toString().padStart(2, '0');
        const label = `${displayHour}:${displayMin} ${period}`;
        const value = `${hour.toString().padStart(2, '0')}:${displayMin}`;
        slots.push({ label, value });
      }
    }
    return slots;
  }, []);

  // Formatted labels for Date and Time display
  const formattedDateDisplay = useMemo(() => {
    if (!selectedDate) return 'Select date';
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();

    if (selectedDate === todayStr) return `Today, ${dayNum} ${monthName}`;
    if (selectedDate === tomorrowStr) return `Tomorrow, ${dayNum} ${monthName}`;
    return `${dayName}, ${dayNum} ${monthName}`;
  }, [selectedDate]);

  const formattedTimeDisplay = useMemo(() => {
    if (!selectedTime) return '12:00 PM';
    const match = TIME_SLOTS_15MIN.find(s => s.value === selectedTime);
    if (match) return match.label;
    const [h, m] = selectedTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const displayMin = m ? m.toString().padStart(2, '0') : '00';
    return `${displayHour}:${displayMin} ${period}`;
  }, [selectedTime, TIME_SLOTS_15MIN]);

  // Calendar Calculation
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNum: null, dateStr: '', isPast: true });
    }
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = (calendarMonth + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const fullDateStr = `${calendarYear}-${monthStr}-${dayStr}`;
      const isPast = fullDateStr < todayStr;
      const isSelected = fullDateStr === selectedDate;
      const isToday = fullDateStr === todayStr;
      days.push({ dayNum: d, dateStr: fullDateStr, isPast, isSelected, isToday });
    }
    return days;
  }, [calendarYear, calendarMonth, selectedDate]);

  // Filtered Goa Cities for Search Modal
  const categoriesList = ['All', 'Airports & Transit', 'North Goa Coast', 'North Goa Cities', 'South Goa Coast', 'Far South Coast', 'South Goa Inland'];

  const filteredGoaLocations = useMemo(() => {
    let result = GOA_LOCATIONS;
    if (activeCategoryTab !== 'All') {
      result = result.filter(loc => loc.category === activeCategoryTab);
    }
    if (citySearchQuery.trim()) {
      const q = citySearchQuery.toLowerCase();
      result = result.filter(loc => 
        loc.name.toLowerCase().includes(q) || 
        loc.region.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [citySearchQuery, activeCategoryTab]);

  // Dynamic distance calculation
  const distanceKm = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return 24;
    if (pickupLocation === dropoffLocation) return 5;
    if (pickupLocation.includes('Mopa') && (dropoffLocation.includes('Colva') || dropoffLocation.includes('Benaulim') || dropoffLocation.includes('Palolem'))) return 72;
    if (pickupLocation.includes('Mopa')) return 38;
    if (pickupLocation.includes('Dabolim')) return 26;
    return 18;
  }, [pickupLocation, dropoffLocation]);

  const durationMins = Math.round(distanceKm * 1.35);

  // Dynamic fare calculation
  const calculateFare = (vehicle) => {
    const base = vehicle.baseFare + (distanceKm * vehicle.perKm);
    const extra = (extraLuggage ? 150 : 0) + (childSeat ? 200 : 0);
    return Math.round(base + extra);
  };

  // Filtered Vehicles by Seats & Class
  const filteredVehicles = useMemo(() => {
    return TOURIST_VEHICLES.filter(v => {
      // Seat filter
      if (seatFilter === '4' && v.seats !== 4) return false;
      if (seatFilter === '6' && v.seats < 6) return false;
      if (seatFilter === '13' && v.seats < 12) return false;

      // Class filter
      if (classFilter !== 'all' && v.classType !== classFilter) return false;

      return true;
    });
  }, [seatFilter, classFilter]);

  const selectedVehicle = TOURIST_VEHICLES.find(v => v.id === selectedVehicleId) || TOURIST_VEHICLES[1];

  // Handler: Swap Pickup & Dropoff
  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  // Handler: Navigate to Dedicated Booking Page
  const handleOpenBookingPage = (serviceTitle = 'Point-to-Point') => {
    setServiceType(serviceTitle);
    setShowAppBookingModal(true);
  };

  const proceedToDedicatedBooking = () => {
    setShowAppBookingModal(false);
    setCurrentView('booking');
  };

  // Handler: Confirm Booking on Dedicated Page (Connects to backend SQLite & Vendor Dispatch Desk)
  const handleConfirmRide = async (e) => {
    e?.preventDefault();
    setIsBooking(true);

    const calculatedFare = calculateFare(selectedVehicle);
    const pName = touristName || 'Valued Goa Guest';
    const pPhone = touristPhone || '+91 98765 43210';
    const pTime = pickupNow ? 'Immediate (3m ETA)' : `${formattedDateDisplay} ${formattedTimeDisplay}`;

    let generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    let generatedRef = 'WG-TX-' + Math.floor(100000 + Math.random() * 900000);

    // Call real SQLite backend to create booking & dispatch with notification to vendor
    try {
      const backendRes = await createCabBooking({
        customer_name: pName,
        customer_phone: pPhone,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_time: pTime,
        vehicle_tier: selectedVehicle.name || selectedVehicle.model,
        fare_amount: calculatedFare,
        service_type: serviceType || 'Airport Transfer',
        vendor_id: 'taxi_vendor_goa'
      });
      if (backendRes?.success) {
        if (backendRes.dispatch_id) generatedRef = backendRes.dispatch_id;
        if (backendRes.otp) generatedOtp = String(backendRes.otp);
      }
    } catch (err) {
      console.warn('Backend booking sync error, continuing with fallback:', err);
    }

    setIsBooking(false);

    setActiveConfirmedRide({
      refId: generatedRef,
      otp: generatedOtp,
      vehicle: selectedVehicle,
      fare: calculatedFare,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      date: pickupNow ? 'Today' : formattedDateDisplay,
      time: pTime,
      passengerName: pName,
      passengerPhone: pPhone,
      flight: touristFlight,
      status: 'Requested',
      chauffeur: {
        name: 'Suresh Naik',
        rating: 4.93,
        trips: 1840,
        vehiclePlate: 'GA-03-Z-8899',
        carName: selectedVehicle.model.split('/')[0],
        phone: '+91 98221 44510'
      }
    });

    // Automatically sync into Taxi Vendor Portal's live dispatches & local storage!
    try {
      const existingDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const newDispatch = {
        id: generatedRef,
        customer: pName,
        phone: pPhone,
        service: `${pickupLocation} ➔ ${dropoffLocation}`,
        car: selectedVehicle.model || 'Sedan Prime',
        chauffeur: 'Suresh Naik',
        vehiclePlate: 'GA-03-Z-8899',
        pickupTime: pTime,
        status: 'Requested',
        amount: calculatedFare,
        otp: generatedOtp,
        source: 'Storefront Booking'
      };
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify([newDispatch, ...existingDispatches.filter(d => d.id !== generatedRef)]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { detail: { id: generatedRef, status: 'ALLOCATED' } }));
      }
    } catch (err) {}

    setCurrentView('confirmed');
  };

  const handleReDispatch = async () => {
    if (!activeConfirmedRide) return;
    setIsBooking(true);
    try {
      const backendRes = await createCabBooking({
        customer_name: activeConfirmedRide.passengerName || touristName || 'Valued Goa Guest',
        customer_phone: activeConfirmedRide.passengerPhone || touristPhone || '+91 98765 43210',
        pickup_location: activeConfirmedRide.pickup || pickupLocation,
        dropoff_location: activeConfirmedRide.dropoff || dropoffLocation,
        pickup_time: activeConfirmedRide.time || 'Immediate (3m ETA)',
        vehicle_tier: activeConfirmedRide.vehicle?.name || 'Sedan Prime',
        fare_amount: activeConfirmedRide.fare || 790,
        service_type: serviceType || 'Point-to-Point',
        vendor_id: 'taxi_vendor_goa'
      });
      if (backendRes?.success) {
        const newRef = backendRes.dispatch_id || activeConfirmedRide.refId;
        const newOtp = String(backendRes.otp || activeConfirmedRide.otp || '4821');
        const reissued = {
          ...activeConfirmedRide,
          refId: newRef,
          otp: newOtp,
          status: 'Requested',
          driverStatus: 'Pending'
        };
        setActiveConfirmedRide(reissued);
        localStorage.setItem('wowgoa_active_ride', JSON.stringify(reissued));
      } else {
        setActiveConfirmedRide(prev => ({ ...prev, status: 'Requested' }));
      }
    } catch (e) {
      setActiveConfirmedRide(prev => ({ ...prev, status: 'Requested' }));
    } finally {
      setIsBooking(false);
    }
  };



  // ============================================================================
  // VIEW 1: UBER-STYLE "CHOOSE A RIDE" — Matches screenshot 1
  // Left panel: pickup/drop/schedule. Center: vehicle list. Right: map.
  // ============================================================================
  if (currentView === 'booking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'auto', background: '#fff', fontFamily: '"Uber Move Text", system-ui, -apple-system, sans-serif' }}>

        {/* Top Nav Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: '52px', minHeight: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" onClick={() => setCurrentView('landing')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#111' }}>
              <ArrowLeft size={18} /> Back
            </button>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111' }}>🚕 Goa Cabs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setShowTripsHistoryModal(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={13} />
              <span>Activity / Trips</span>
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>📞 +91 98221 44510</span>
            <span style={{ background: '#000', color: '#fff', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: 600 }}>Zero Surge</span>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="cabs-3col-layout" style={{ display: 'flex', width: '100%', minHeight: 'auto', alignItems: 'stretch' }}>

          {/* ── LEFT PANEL: Get a ride ── */}
          <div className="cabs-left-panel" style={{ width: '310px', minWidth: '290px', background: '#fff', borderRight: '1px solid #e5e7eb', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>

            <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#111', margin: 0 }}>Get a ride</h2>

            {/* Locations with Live Recommendations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#000', zIndex: 2, pointerEvents: 'none' }}></div>
                <CabLocationAutocomplete
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  placeholder="Pickup location"
                  type="pickup"
                  inputStyle={{ paddingLeft: '38px', background: '#f7f7f7', borderRadius: '10px' }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '2px', background: '#000', zIndex: 2, pointerEvents: 'none' }}></div>
                <CabLocationAutocomplete
                  value={dropoffLocation}
                  onChange={setDropoffLocation}
                  placeholder="Where to? (Dropoff)"
                  type="dropoff"
                  inputStyle={{ paddingLeft: '38px', background: '#f7f7f7', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Pickup Time Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', background: '#fff' }}
              onClick={() => setPickupNow(!pickupNow)}>
              <Clock size={16} color="#555" />
              <span style={{ fontSize: '14px', color: '#111', fontWeight: 500, flex: 1 }}>
                {pickupNow ? 'Pickup now' : `${formattedDateDisplay}, ${formattedTimeDisplay}`}
              </span>
              <ChevronDown size={15} color="#555" />
            </div>

            {/* Schedule panel */}
            {!pickupNow && (
              <div style={{ background: '#f7f7f7', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Date */}
                <div style={{ position: 'relative' }}>
                  <div onClick={() => { setShowDatePicker(!showDatePicker); setShowTimeDropdown(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                    <Calendar size={15} color="#555" />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{formattedDateDisplay}</span>
                  </div>
                  {showDatePicker && (
                    <>
                      <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 90 }} onClick={() => setShowDatePicker(false)} />
                      <div className="position-absolute start-0 top-100 mt-1 bg-white rounded-4 shadow p-3 border animate-fade-in-up" style={{ zIndex: 1050, width: '290px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-dark small">{monthNames[calendarMonth]} {calendarYear}</span>
                          <div className="d-flex gap-1">
                            <button type="button" className="btn btn-sm btn-light p-1 rounded-circle"
                              onClick={() => calendarMonth === 0 ? (setCalendarMonth(11), setCalendarYear(calendarYear - 1)) : setCalendarMonth(calendarMonth - 1)}>
                              <ChevronLeft size={14} />
                            </button>
                            <button type="button" className="btn btn-sm btn-light p-1 rounded-circle"
                              onClick={() => calendarMonth === 11 ? (setCalendarMonth(0), setCalendarYear(calendarYear + 1)) : setCalendarMonth(calendarMonth + 1)}>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="d-grid mb-1 text-center text-muted fw-semibold" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '11px' }}>
                          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                        </div>
                        <div className="d-grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                          {calendarDays.map((d, idx) => d.dayNum ? (
                            <button key={d.dateStr} type="button" disabled={d.isPast}
                              className={`btn btn-sm p-0 rounded-circle ${d.isSelected ? 'bg-dark text-white fw-bold' : d.isToday ? 'border border-dark text-dark fw-bold' : d.isPast ? 'text-muted opacity-40' : 'btn-light border-0 text-dark'}`}
                              style={{ height: '28px', width: '28px', fontSize: '11.5px', margin: 'auto' }}
                              onClick={() => { setSelectedDate(d.dateStr); setShowDatePicker(false); }}>
                              {d.dayNum}
                            </button>
                          ) : <div key={`empty-${idx}`} style={{ height: '28px' }} />)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Time */}
                <div style={{ position: 'relative' }}>
                  <div onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowDatePicker(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} color="#555" />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{formattedTimeDisplay}</span>
                    </div>
                    <ChevronDown size={14} color="#555" />
                  </div>
                  {showTimeDropdown && (
                    <>
                      <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 90 }} onClick={() => setShowTimeDropdown(false)} />
                      <div className="position-absolute start-0 top-100 mt-1 bg-white rounded-3 shadow border overflow-auto py-1 animate-fade-in-up" style={{ zIndex: 1050, maxHeight: '200px', minWidth: '180px' }}>
                        {TIME_SLOTS_15MIN.map(slot => (
                          <button key={slot.value} type="button"
                            className={`btn btn-link text-decoration-none w-100 text-start py-1 px-3 border-0 ${slot.value === selectedTime ? 'bg-light text-dark fw-bold' : 'text-dark'}`}
                            style={{ fontSize: '13px' }}
                            onClick={() => { setSelectedTime(slot.value); setShowTimeDropdown(false); }}>
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Passengers */}
            <div style={{ position: 'relative' }}>
              <Users size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
              <select
                style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: '#fff', cursor: 'pointer', color: '#111', appearance: 'auto' }}
                value={seatFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSeatFilter(val);
                  if (val === '4') setSelectedVehicleId('sedan-prime');
                  else if (val === '6') setSelectedVehicleId('suv-executive');
                  else if (val === '13') setSelectedVehicleId('maxi-coach');
                  else setSelectedVehicleId('sedan-prime');
                }}>
                <option value="all">For me (any seats)</option>
                <option value="4">1–4 Passengers</option>
                <option value="6">5–6 Passengers (SUV)</option>
                <option value="13">7–13 Passengers (Coach)</option>
              </select>
            </div>

            {/* Contact (compact) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Your name"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: '#fff', color: '#111' }}
                value={touristName} onChange={(e) => setTouristName(e.target.value)} />
              <input type="tel" placeholder="Mobile / WhatsApp"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: '#fff', color: '#111' }}
                value={touristPhone} onChange={(e) => setTouristPhone(e.target.value)} />
            </div>

            {/* Add-ons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: '#f7f7f7', borderRadius: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extraLuggage} onChange={(e) => setExtraLuggage(e.target.checked)} />
                <span>Extra Luggage Carrier (+₹150)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} />
                <span>Child Safety Seat (+₹200)</span>
              </label>
            </div>

          </div>

          {/* ── CENTER PANEL: Choose a ride ── */}
          <div className="cabs-center-panel" style={{ width: '450px', minWidth: '390px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

            {/* Header */}
            <div style={{ padding: '14px 18px 6px', flexShrink: 0 }}>
              <h2 style={{ fontWeight: 700, fontSize: '19px', color: '#111', margin: '0 0 2px' }}>Choose a ride</h2>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                Rides we think you'll like · {distanceKm} km · ~{durationMins} mins
              </p>
            </div>

            {/* Vehicle List */}
            <div style={{ padding: '2px 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {filteredVehicles.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  <p style={{ marginBottom: '10px', fontSize: '13px' }}>No vehicle matches your passenger count.</p>
                  <button type="button" onClick={() => setSeatFilter('all')}
                    style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 18px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>
                    Show All
                  </button>
                </div>
              ) : filteredVehicles.map((v, idx) => {
                const isSelected = v.id === selectedVehicleId;
                const fare = calculateFare(v);
                return (
                  <div key={v.id} onClick={() => setSelectedVehicleId(v.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #111' : '1px solid #f0f0f0',
                      background: isSelected ? '#f7f7f7' : '#fff',
                      transition: 'all 0.15s ease'
                    }}>
                    {/* Vehicle icon */}
                    <div style={{ width: '52px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '30px', lineHeight: 1 }}>{v.icon}</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '1px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{v.name}</span>
                        <Users size={12} color="#555" />
                        <span style={{ fontSize: '12px', color: '#555' }}>{v.seats}</span>
                        {idx === 0 && <span style={{ background: '#1a1a1a', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: 600 }}>★ Top Pick</span>}
                        {v.badge === 'Most Popular' && <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: 600 }}>Popular</span>}
                        {v.badge === 'Family Favorite' && <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: 600 }}>Good deal</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {v.eta} min · {v.features[0]}
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ fontWeight: 700, fontSize: '15.5px', color: '#111', flexShrink: 0, textAlign: 'right' }}>
                      ₹{fare}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment + Request Button — Kept UP directly below ride selection */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginTop: '4px' }}>
              <div style={{ flex: 1 }}>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ padding: '9px 10px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: '#fff', color: '#111', width: '100%', cursor: 'pointer' }}>
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / GPay</option>
                  <option value="card">💳 Card</option>
                </select>
              </div>
              <button type="button"
                onClick={handleConfirmRide}
                disabled={isBooking}
                style={{
                  flex: 2, background: '#000', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '11px 16px', fontSize: '14px', fontWeight: 700, cursor: isBooking ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: isBooking ? 0.7 : 1
                }}>
                {isBooking ? (
                  <><div className="spinner-border spinner-border-sm" role="status" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div><span>Requesting...</span></>
                ) : (
                  <span>Request {selectedVehicle.name} · ₹{calculateFare(selectedVehicle)}</span>
                )}
              </button>
            </div>

          </div>

          {/* ── RIGHT PANEL: Clean Framed Live Map ── */}
          <div className="cabs-right-map-panel" style={{ flex: 1, background: '#f8fafc', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              width: '100%',
              height: '350px',
              minHeight: '320px',
              maxHeight: '370px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              background: '#ffffff'
            }}>
              <LiveCabMap
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                mode="booking"
                height="100%"
              />
            </div>

            {/* Route Guarantee & Transparent Pricing Banner below map */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🛡️</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111' }}>Fixed Transparent Pricing</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>No hidden charges · Tolls & taxes included in quote</div>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                Guaranteed
              </span>
            </div>
          </div>

        </div>

        {/* Location Search Modal */}
        {showCityModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h6 style={{ fontWeight: 700, margin: 0 }}>Select Location in Goa</h6>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Airport · Beach · Hotel · Station</span>
                </div>
                <button type="button" onClick={() => setShowCityModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} color="#555" />
                </button>
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input type="text" autoFocus
                    style={{ width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '24px', fontSize: '14px', background: '#f7f7f7', boxSizing: 'border-box' }}
                    placeholder="Search beach, airport, hotel..."
                    value={citySearchQuery} onChange={(e) => setCitySearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {categoriesList.map(cat => (
                    <button key={cat} type="button" onClick={() => setActiveCategoryTab(cat)}
                      style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: activeCategoryTab === cat ? '#111' : '#fff', color: activeCategoryTab === cat ? '#fff' : '#555' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredGoaLocations.map(loc => (
                  <button key={loc.name} type="button"
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    onClick={() => {
                      if (cityModalTarget === 'pickup') setPickupLocation(loc.name);
                      else if (cityModalTarget === 'dropoff') setDropoffLocation(loc.name);
                      else { setCurrentCity(loc.name); setPickupLocation(loc.name); }
                      setShowCityModal(false);
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={15} color="#6b7280" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{loc.name}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{loc.region} · {loc.category}</div>
                      </div>
                    </div>
                    {loc.popular && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>Popular</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Uber-style Past Trips Activity Modal */}
        <CustomerTripsModal
          isOpen={showTripsHistoryModal}
          onClose={() => setShowTripsHistoryModal(false)}
          onSelectTrip={(trip) => {
            setActiveConfirmedRide(trip);
            setCurrentView('confirmed');
            setShowTripsHistoryModal(false);
          }}
          onRebookTrip={(trip) => {
            setPickupLocation(trip.pickup || '');
            setDropoffLocation(trip.dropoff || '');
            setCurrentView('booking');
            setShowTripsHistoryModal(false);
          }}
          activeRefId={activeConfirmedRide?.refId}
        />

      </div>
    );
  }

  // ============================================================================
  // VIEW 2: SPACIOUS, PREMIUM TRIP CONFIRMATION & DRIVER TRACKING
  // ============================================================================
  if (currentView === 'confirmed' && activeConfirmedRide) {
    const otpDigits = String(activeConfirmedRide.otp || '7457').split('');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'auto', background: '#fff', fontFamily: '"Uber Move Text", system-ui, -apple-system, sans-serif' }}>

        {/* Top Navigation Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: '52px', minHeight: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => { setActiveConfirmedRide(null); setCurrentView('landing'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#111' }}
            >
              <ArrowLeft size={18} /> Home
            </button>
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111' }}>🚕 Goa Cabs</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setShowTripsHistoryModal(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={13} />
              <span>Activity / Trips</span>
            </button>
            <span style={{ 
              background: activeConfirmedRide.status === 'Requested' ? '#fef3c7' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#fee2e2' : (activeConfirmedRide.status === 'Driver Arrived' ? '#ede9fe' : (activeConfirmedRide.status === 'In Progress' ? '#ecfdf5' : (activeConfirmedRide.status === 'Completed' ? '#f1f5f9' : '#ecfdf5')))), 
              color: activeConfirmedRide.status === 'Requested' ? '#b45309' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#b91c1c' : (activeConfirmedRide.status === 'Driver Arrived' ? '#6d28d9' : (activeConfirmedRide.status === 'In Progress' ? '#047857' : (activeConfirmedRide.status === 'Completed' ? '#334155' : '#065f46')))), 
              border: `1px solid ${activeConfirmedRide.status === 'Requested' ? '#fde68a' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#fca5a5' : (activeConfirmedRide.status === 'Driver Arrived' ? '#c4b5fd' : '#a7f3d0'))}`, 
              borderRadius: '20px', 
              padding: '4px 12px', 
              fontSize: '12px', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: activeConfirmedRide.status === 'Requested' ? '#f59e0b' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#ef4444' : (activeConfirmedRide.status === 'Driver Arrived' ? '#7c3aed' : '#10b981')) 
              }}></span>
              {activeConfirmedRide.status === 'Requested' && '⏳ Waiting for Driver to Accept...'}
              {activeConfirmedRide.status === 'Declined' && '🔴 Chauffeur Declined Duty'}
              {activeConfirmedRide.status === 'Cancelled' && '❌ Ride Cancelled'}
              {activeConfirmedRide.status === 'Driver Arrived' && '📍 Chauffeur Arrived!'}
              {activeConfirmedRide.status === 'In Progress' && '🟢 Trip In Progress'}
              {activeConfirmedRide.status === 'Completed' && '✅ Trip Completed'}
              {(activeConfirmedRide.status === 'Confirmed' || activeConfirmedRide.status === 'Dispatched') && '🟢 Driver Accepted & Dispatched'}
            </span>
            <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
              Ref: <strong style={{ color: '#111' }}>{activeConfirmedRide.refId}</strong>
            </span>
          </div>
        </div>

        {/* Main: Spacious 2-Column Split (Confirmed Card + Full Map) */}
        <div style={{ display: 'flex', width: '100%', minHeight: 'auto', alignItems: 'stretch' }}>

          {/* ── LEFT: Spacious Confirmed Trip Details Card (420px) ── */}
          <div style={{ width: '420px', minWidth: '380px', background: '#ffffff', borderRight: '1px solid #e5e7eb', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>

            {/* 1. Header & Arrival Time */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: activeConfirmedRide.status === 'Requested' ? '#f59e0b' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#ef4444' : (activeConfirmedRide.status === 'Driver Arrived' ? '#7c3aed' : '#22c55e')), 
                  display: 'inline-block' 
                }}></span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: activeConfirmedRide.status === 'Requested' ? '#d97706' : (activeConfirmedRide.status === 'Declined' || activeConfirmedRide.status === 'Cancelled' ? '#dc2626' : (activeConfirmedRide.status === 'Driver Arrived' ? '#7c3aed' : '#16a34a')), 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.04em' 
                }}>
                  {activeConfirmedRide.status === 'Requested' ? 'Connecting to Nearest Chauffeur' : (activeConfirmedRide.status === 'Declined' ? 'Duty Declined by Driver' : (activeConfirmedRide.status === 'Cancelled' ? 'Trip Cancelled' : (activeConfirmedRide.status === 'Driver Arrived' ? 'Chauffeur At Pickup Location' : (activeConfirmedRide.status === 'In Progress' ? 'Ride In Progress' : (activeConfirmedRide.status === 'Completed' ? 'Ride Completed' : 'Booking Confirmed')))))}
                </span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                {activeConfirmedRide.status === 'Requested' ? 'Waiting for Driver to Accept...' : (activeConfirmedRide.status === 'Declined' ? '🔴 Chauffeur Declined Duty' : (activeConfirmedRide.status === 'Cancelled' ? '❌ Booking Cancelled' : (activeConfirmedRide.status === 'Driver Arrived' ? '📍 Chauffeur Has Arrived!' : (activeConfirmedRide.status === 'In Progress' ? 'Heading to Destination ➔' : (activeConfirmedRide.status === 'Completed' ? 'Trip Concluded' : '🎉 Ride Accepted! Driver Arriving in ~2 mins')))))}
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                {activeConfirmedRide.status === 'Requested' ? 'Trip request sent to chauffeur Suresh Naik. Ringing companion app...' : (activeConfirmedRide.status === 'Declined' ? 'The chauffeur was unable to accept this booking offer. Tap Find Another Chauffeur below.' : (activeConfirmedRide.status === 'Cancelled' ? 'This ride was cancelled. View past rides or book a new cab anytime.' : (activeConfirmedRide.status === 'Driver Arrived' ? 'Please meet your chauffeur outside and share the 4-digit Ride OTP below.' : `${activeConfirmedRide.vehicle?.name || 'Prime Sedan'} · ${activeConfirmedRide.vehicle?.model || 'Maruti Suzuki Dzire'}`)))}
              </p>
            </div>

            {/* Radar Banner for Awaiting Driver Acceptance */}
            {activeConfirmedRide.status === 'Requested' && (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid #fde68a',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  📡
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#92400e' }}>
                    Chauffeur Alert Sent
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#78350f', marginTop: '1px', lineHeight: 1.35 }}>
                    Suresh Naik has received your booking offer. Screen updates automatically once accepted!
                  </div>
                </div>
              </div>
            )}

            {/* Declined Banner with Re-dispatch */}
            {activeConfirmedRide.status === 'Declined' && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1.5px solid #fca5a5',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    ⚠️
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b' }}>
                      Duty Declined by Driver
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7f1d1d', marginTop: '1px' }}>
                      Chauffeur Suresh Naik was unavailable for this duty.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleReDispatch}
                    disabled={isBooking}
                    style={{
                      flex: 1,
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: isBooking ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isBooking ? 'Re-dispatching...' : '🔄 Find Another Chauffeur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCustomerCancelRide('Chauffeur declined and passenger dismissed')}
                    style={{
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            )}

            {/* Cancelled Ride Notification Banner */}
            {activeConfirmedRide.status === 'Cancelled' && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1.5px solid #fca5a5',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    ❌
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b' }}>
                      Booking Cancelled
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7f1d1d', marginTop: '1px' }}>
                      {activeConfirmedRide.cancelReason || 'Cancelled by passenger'}. Saved to your trip history.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setActiveConfirmedRide(null); setCurrentView('booking'); }}
                    style={{
                      flex: 1,
                      background: '#111827',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🚗 Book New Ride
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTripsHistoryModal(true)}
                    style={{
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View All Trips
                  </button>
                </div>
              </div>
            )}

            {/* 2. Trip State Indicator: OTP Box (when waiting/arrived) OR Ride In Progress (when started) OR Destination Reached (when completed) */}
            {activeConfirmedRide.status !== 'In Progress' && activeConfirmedRide.status !== 'Completed' && activeConfirmedRide.status !== 'Cancelled' && activeConfirmedRide.status !== 'Declined' && (
              <div style={{ 
                background: activeConfirmedRide.status === 'Driver Arrived' ? '#faf5ff' : '#f8fafc', 
                border: activeConfirmedRide.status === 'Driver Arrived' ? '2px solid #7c3aed' : '1px solid #e2e8f0', 
                borderRadius: '14px', 
                padding: '16px 18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                boxShadow: activeConfirmedRide.status === 'Driver Arrived' ? '0 4px 16px rgba(124, 58, 237, 0.15)' : 'none'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                    Start Trip OTP
                  </span>
                  <span style={{ fontSize: '12px', color: '#475569' }}>Share with driver to start ride</span>
                </div>

                {/* 4 Clean Separated Digit Pills */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {otpDigits.map((digit, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '38px',
                        height: '44px',
                        background: '#0f172a',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '22px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When Trip is In Progress (OTP disappears & replaced by Live Active Trip Card) */}
            {activeConfirmedRide.status === 'In Progress' && (
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderRadius: '14px',
                padding: '16px 18px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.25)',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    🚗
                  </div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Ride In Progress
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.92, marginTop: '2px' }}>
                      OTP Verified · Heading to destination safely
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.25)', padding: '5px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.03em' }}>
                  ON TRIP
                </div>
              </div>
            )}

            {/* When Trip is Completed (Reached Destination Card) */}
            {activeConfirmedRide.status === 'Completed' && (
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '14px',
                padding: '18px 20px',
                color: '#ffffff',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    🏁
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                      Reached Location!
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                      You have arrived safely at {activeConfirmedRide.dropoff}
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Final Fare</div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Paid via Cash / UPI</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>
                    ₹{activeConfirmedRide.fare}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Assigned Driver & Vehicle Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    👨‍✈️
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15.5px', color: '#111827' }}>
                      {activeConfirmedRide.chauffeur?.name || 'Suresh Naik'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      ★ {activeConfirmedRide.chauffeur?.rating || '4.93'} · {activeConfirmedRide.chauffeur?.trips || '1,840'} trips · {activeConfirmedRide.status === 'Requested' ? '⏳ Acceptance Pending' : '🟢 Accepted'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px', padding: '5px 10px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em' }}>
                    {activeConfirmedRide.chauffeur?.vehiclePlate || 'GA-03-Z-8899'}
                  </div>
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 800, 
                    color: activeConfirmedRide.status === 'Requested' ? '#b45309' : (activeConfirmedRide.status === 'Completed' ? '#0f172a' : '#16a34a'),
                    background: activeConfirmedRide.status === 'Requested' ? '#fef3c7' : (activeConfirmedRide.status === 'Completed' ? '#e2e8f0' : '#ecfdf5'),
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {activeConfirmedRide.status === 'Requested' ? 'Awaiting Accept' : (activeConfirmedRide.status === 'Completed' ? 'Trip Ended' : (activeConfirmedRide.status === 'In Progress' ? 'Driving' : 'En Route'))}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Call & WhatsApp */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`tel:${activeConfirmedRide.chauffeur?.phone || '+919822144510'}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#000000',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13.5px'
                  }}
                >
                  <Phone size={15} /> Call Driver
                </a>
                <a
                  href={`https://wa.me/919822144510?text=Hi%20driver,%20my%20Goa%20cab%20booking%20is%20${activeConfirmedRide.refId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#25D366',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13.5px'
                  }}
                >
                  <MessageSquare size={15} /> WhatsApp
                </a>
              </div>
            </div>

            {/* 4. Trip Route & Fare Summary (With Ola/Uber Style Add Stop) */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Pickup */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginTop: '6px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pickup Point</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeConfirmedRide.pickup}
                  </div>
                </div>
              </div>

              {/* Intermediate Via Stops (Ola / Uber style) */}
              {activeConfirmedRide.stops && activeConfirmedRide.stops.map((stop, sIdx) => (
                <div key={sIdx}>
                  <div style={{ borderLeft: '2px dashed #f59e0b', marginLeft: '3px', height: '12px' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', marginTop: '4px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10.5px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                        🛑 Via Stop {sIdx + 1}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#78350f' }}>
                        {stop.name || stop}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                      +₹{stop.extraFare || 220}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ borderLeft: '2px dashed #cbd5e1', marginLeft: '3px', height: '14px' }} />

              {/* Destination */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', marginTop: '6px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Final Destination</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeConfirmedRide.dropoff}
                  </div>
                </div>
              </div>

              {/* Ola/Uber Style "+ Add Stop" button */}
              {activeConfirmedRide.status !== 'Completed' && activeConfirmedRide.status !== 'Declined' && (
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1.5px dashed #2563eb',
                    borderRadius: '8px',
                    color: '#2563eb',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '2px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <Plus size={14} /> + Add Stop along route (Ola / Uber style)
                </button>
              )}

              {/* Fare Summary */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>
                    {activeConfirmedRide.stops?.length ? `Total Trip Fare (${activeConfirmedRide.stops.length} via stop added)` : 'Estimated Fare (Cash / UPI on arrival)'}
                  </span>
                  {activeConfirmedRide.stops?.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Includes intermediate stops</span>
                  )}
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>₹{activeConfirmedRide.fare}</span>
              </div>
            </div>

            {/* 5. Clean Action Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setActiveConfirmedRide(null); setCurrentView('booking'); }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer'
                  }}
                >
                  + Book Another Ride
                </button>
                <button
                  type="button"
                  onClick={() => setShowTripsHistoryModal(true)}
                  style={{
                    padding: '11px 14px',
                    background: '#0f172a',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Clock size={14} /> Trips Activity
                </button>
              </div>

              {activeConfirmedRide.status !== 'Completed' && activeConfirmedRide.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => handleCustomerCancelRide('Cancelled by passenger')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ef4444',
                    cursor: 'pointer'
                  }}
                >
                  Cancel this ride
                </button>
              )}
            </div>

          </div>

          {/* ── RIGHT: Clean Framed Live Map (Compact & Aligned, NOT big from down) ── */}
          <div style={{ flex: 1, background: '#f8fafc', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Map Card: Clean bounded height with rounded corners */}
            <div style={{
              width: '100%',
              height: '350px',
              minHeight: '320px',
              maxHeight: '370px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              background: '#ffffff'
            }}>
              <LiveCabMap
                pickupLocation={activeConfirmedRide?.pickup || pickupLocation}
                dropoffLocation={activeConfirmedRide?.dropoff || dropoffLocation}
                stops={activeConfirmedRide?.stops || []}
                mode="confirmed"
                activeConfirmedRide={activeConfirmedRide}
                height="100%"
              />
            </div>

            {/* Live Trip Safety & Service Badges for clean bottom balance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111' }}>Live GPS Tracked</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Real-time location monitored</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111' }}>NH 66 Expressway</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Fastest toll route taken</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💳</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111' }}>Cash or UPI on Drop</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>No advance prepayment needed</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Add Stop Modal (Ola / Uber Style) */}
        <AddStopModal
          isOpen={showAddStopModal}
          onClose={() => setShowAddStopModal(false)}
          pickup={activeConfirmedRide?.pickup}
          dropoff={activeConfirmedRide?.dropoff}
          currentFare={activeConfirmedRide?.fare}
          existingStops={activeConfirmedRide?.stops || []}
          onConfirmStop={handleCustomerAddStop}
          isDriver={false}
        />

        {/* Floating Real-Time Toast Notification */}
        {customerToast && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: customerToast.type === 'trip_start' 
              ? '#059669' 
              : customerToast.type === 'trip_completed' 
                ? '#0f172a' 
                : '#2563eb',
            color: '#ffffff',
            padding: '16px 20px',
            borderRadius: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '420px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ fontSize: '24px' }}>
              {customerToast.type === 'trip_start' ? '🚗' : customerToast.type === 'trip_completed' ? '🏁' : '🔔'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '2px' }}>{customerToast.title}</div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, lineHeight: 1.4 }}>{customerToast.message}</div>
            </div>
            <button
              type="button"
              onClick={() => setCustomerToast(null)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', padding: '0 4px', opacity: 0.7 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Uber-style Past Trips Activity Modal */}
        <CustomerTripsModal
          isOpen={showTripsHistoryModal}
          onClose={() => setShowTripsHistoryModal(false)}
          onSelectTrip={(trip) => {
            setActiveConfirmedRide(trip);
            setCurrentView('confirmed');
            setShowTripsHistoryModal(false);
          }}
          onRebookTrip={(trip) => {
            setPickupLocation(trip.pickup || '');
            setDropoffLocation(trip.dropoff || '');
            setCurrentView('booking');
            setShowTripsHistoryModal(false);
          }}
          activeRefId={activeConfirmedRide?.refId}
        />

      </div>
    );
  }

  // ============================================================================
  // VIEW 3: UBER-STYLE STOREFRONT LANDING PAGE
  // ============================================================================
  return (
    <div className="uber-customer-page bg-white min-vh-100 text-dark" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── Sub Navigation Header: Clean, Simple, Light, NO Chunky Boxes ── */}
      <div className="border-bottom bg-white sticky-top" style={{ zIndex: 100, borderColor: '#f1f5f9' }}>
        <div className="container d-flex flex-wrap align-items-center justify-content-between py-2 px-3 px-md-4" style={{ maxWidth: '1240px' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold fs-5 text-dark" style={{ letterSpacing: '-0.02em' }}>Ride</span>
          </div>

          <div className="d-flex align-items-center gap-4 small overflow-auto py-1">
            <button 
              type="button" 
              className="btn btn-outline-dark rounded-pill py-1 px-3 d-inline-flex align-items-center gap-1 small fw-semibold"
              onClick={() => setShowTripsHistoryModal(true)}
              style={{ fontSize: '12px' }}
            >
              <Clock size={13} />
              <span>Activity / Trips</span>
            </button>
            <button 
              type="button" 
              className="btn btn-link text-decoration-none p-0 text-dark fw-medium small"
              onClick={() => requestRideRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Request a ride
            </button>
            <button 
              type="button" 
              className="btn btn-link text-decoration-none p-0 text-secondary small hover-dark"
              onClick={() => document.getElementById('plan-for-later-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Reserve a ride
            </button>
            <button 
              type="button" 
              className="btn btn-link text-decoration-none p-0 text-secondary small hover-dark"
              onClick={() => handleOpenBookingPage('Point-to-Point')}
            >
              Book a ride
            </button>
            <button 
              type="button" 
              className="btn btn-link text-decoration-none p-0 text-secondary small hover-dark"
              onClick={() => document.getElementById('explore-uber-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore ride options
            </button>
            <button 
              type="button" 
              className="btn btn-link text-decoration-none p-0 text-secondary small hover-dark"
              onClick={() => {
                setPickupLocation('Manohar Intl Airport, Mopa (GOX)');
                setDropoffLocation('Candolim Beach');
                handleOpenBookingPage('Airport Transfer');
              }}
            >
              Airport rides
            </button>
          </div>
        </div>
      </div>

      <div className="container py-4 py-md-5 px-3 px-md-4" style={{ maxWidth: '1240px' }}>
        
        {/* ══════════════════════════════════════════════════════════════════════
            1. HERO SECTION: "Request a ride" + Sleek Normal Map & Moving Pin Car
           ══════════════════════════════════════════════════════════════════════ */}
        <div ref={requestRideRef} className="row g-4 align-items-center mb-5 pb-2">
          
          {/* Left Column: Uber Request a Ride Input Console */}
          <div className="col-12 col-lg-5 col-xl-5">
            {/* Location selector with Change City Search trigger */}
            <div className="d-flex align-items-center gap-1.5 text-secondary small mb-2">
              <MapPin size={14} className="text-dark" />
              <span className="fw-medium text-dark">{currentCity}</span>
              <span className="text-muted">•</span>
              <button 
                type="button" 
                className="btn btn-link text-decoration-underline p-0 small text-primary fw-medium"
                onClick={() => {
                  setCityModalTarget('city');
                  setShowCityModal(true);
                }}
              >
                Change city
              </button>
            </div>

            <h1 className="fw-bold text-dark mb-3" style={{ fontSize: '36px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Request a ride
            </h1>

            {/* Pickup time dropdown pill */}
            <div className="dropdown mb-3">
              <button 
                type="button" 
                className="btn btn-light rounded-pill border px-3 py-1.5 small fw-medium d-flex align-items-center gap-2 bg-light text-dark"
                onClick={() => setPickupNow(!pickupNow)}
                style={{ fontSize: '13px' }}
              >
                <Clock size={14} className="text-secondary" />
                <span>{pickupNow ? 'Pickup now' : 'Scheduled ride'}</span>
                <ChevronDown size={13} className="text-muted" />
              </button>
            </div>

            {/* Inputs Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleOpenBookingPage('Point-to-Point'); }}>
              <div className="position-relative mb-3">
                {/* Vertical Connector Line */}
                <div className="position-absolute start-0 top-0 bottom-0 d-flex flex-column align-items-center justify-content-center" style={{ width: '38px', zIndex: 2 }}>
                  <div className="rounded-circle bg-dark" style={{ width: '7px', height: '7px' }}></div>
                  <div className="border-start border-2 border-secondary border-opacity-25 my-1" style={{ height: '36px' }}></div>
                  <div className="bg-dark rounded-sm" style={{ width: '7px', height: '7px' }}></div>
                </div>

                {/* Pickup input box with live recommendations */}
                <div className="position-relative mb-2">
                  <CabLocationAutocomplete
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    placeholder="Pickup location in Goa"
                    type="pickup"
                    rightElement={
                      <button 
                        type="button" 
                        className="btn btn-link text-secondary hover-dark p-0 border-0"
                        title="Choose from all Goa locations"
                        onClick={() => {
                          setCityModalTarget('pickup');
                          setShowCityModal(true);
                        }}
                      >
                        <Navigation size={15} />
                      </button>
                    }
                  />
                </div>

                {/* Dropoff input box with live recommendations */}
                <div className="position-relative">
                  <CabLocationAutocomplete
                    value={dropoffLocation}
                    onChange={setDropoffLocation}
                    placeholder="Dropoff destination in Goa"
                    type="dropoff"
                  />
                </div>
              </div>

              {/* Schedule pickers if not pickup now */}
              {!pickupNow && (
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-light w-100 rounded-3 border bg-light py-2 text-start d-flex align-items-center gap-2"
                      onClick={() => setShowDatePicker(true)}
                    >
                      <Calendar size={14} className="text-secondary" />
                      <span className="small text-dark fw-semibold">{formattedDateDisplay}</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-light w-100 rounded-3 border bg-light py-2 text-start d-flex align-items-center gap-2"
                      onClick={() => setShowTimeDropdown(true)}
                    >
                      <Clock size={14} className="text-secondary" />
                      <span className="small text-dark fw-semibold">{formattedTimeDisplay}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Clean "Book a ride" button */}
              <button 
                type="submit" 
                className="btn btn-dark rounded-3 px-4 py-2.5 fw-semibold text-white shadow-xs mt-1"
                style={{ minWidth: '135px', fontSize: '14.5px' }}
              >
                Book a ride
              </button>
            </form>
          </div>

          {/* Right Column: Real Live Interactive Map with Real Tiles & Route */}
          <div className="col-12 col-lg-7 col-xl-7">
            <div className="rounded-4 overflow-hidden border shadow-sm position-relative" style={{ height: '360px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <LiveCabMap
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                mode="booking"
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. "Explore what you can do with Uber" (ROW-WISE, SPACIOUS, 165PX HEIGHT)
           ══════════════════════════════════════════════════════════════════════ */}
        <div id="explore-uber-section" className="mb-5 pb-3">
          <h2 className="fw-bold text-dark mb-3" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>
            Explore what you can do with Uber
          </h2>

          <div className="row g-3">
            {/* Box 1: Ride */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div 
                className="p-4 rounded-3 border-0 h-100 d-flex flex-column justify-content-between shadow-2xs transition-all hover-shadow-sm"
                style={{ background: '#f6f6f6', minHeight: '165px' }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '17px' }}>Ride</h5>
                    <span style={{ fontSize: '26px' }}>🚗</span>
                  </div>
                  <p className="text-secondary mb-3" style={{ fontSize: '12.5px', lineHeight: 1.45, minHeight: '36px' }}>
                    Go anywhere in Goa. Request a ride, hop in, and go.
                  </p>
                </div>
                <div className="mt-2">
                  <button 
                    type="button" 
                    className="btn btn-light bg-white rounded-pill px-3.5 py-1.5 small fw-semibold text-dark shadow-xs border hover-bg-light"
                    style={{ fontSize: '12px' }}
                    onClick={() => handleOpenBookingPage('Point-to-Point')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Reserve */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div 
                className="p-4 rounded-3 border-0 h-100 d-flex flex-column justify-content-between shadow-2xs transition-all hover-shadow-sm"
                style={{ background: '#f6f6f6', minHeight: '165px' }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '17px' }}>Reserve</h5>
                    <span style={{ fontSize: '26px' }}>🗓️</span>
                  </div>
                  <p className="text-secondary mb-3" style={{ fontSize: '12.5px', lineHeight: 1.45, minHeight: '36px' }}>
                    Reserve your ride in advance so you can relax on trip day.
                  </p>
                </div>
                <div className="mt-2">
                  <button 
                    type="button" 
                    className="btn btn-light bg-white rounded-pill px-3.5 py-1.5 small fw-semibold text-dark shadow-xs border hover-bg-light"
                    style={{ fontSize: '12px' }}
                    onClick={() => handleOpenBookingPage('Reserve Scheduled Trip')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Box 3: Intercity */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div 
                className="p-4 rounded-3 border-0 h-100 d-flex flex-column justify-content-between shadow-2xs transition-all hover-shadow-sm"
                style={{ background: '#f6f6f6', minHeight: '165px' }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '17px' }}>Intercity</h5>
                    <span style={{ fontSize: '26px' }}>🧳</span>
                  </div>
                  <p className="text-secondary mb-3" style={{ fontSize: '12.5px', lineHeight: 1.45, minHeight: '36px' }}>
                    Outstation cabs for Dudhsagar, Gokarna, Belagavi & beyond.
                  </p>
                </div>
                <div className="mt-2">
                  <button 
                    type="button" 
                    className="btn btn-light bg-white rounded-pill px-3.5 py-1.5 small fw-semibold text-dark shadow-xs border hover-bg-light"
                    style={{ fontSize: '12px' }}
                    onClick={() => handleOpenBookingPage('Intercity')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Box 4: Rentals */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div 
                className="p-4 rounded-3 border-0 h-100 d-flex flex-column justify-content-between shadow-2xs transition-all hover-shadow-sm"
                style={{ background: '#f6f6f6', minHeight: '165px' }}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '17px' }}>Rentals</h5>
                    <span style={{ fontSize: '26px' }}>⏱️</span>
                  </div>
                  <p className="text-secondary mb-3" style={{ fontSize: '12.5px', lineHeight: 1.45, minHeight: '36px' }}>
                    Book for 4 Hr / 8 Hr / 12 Hr blocks with unlimited stops.
                  </p>
                </div>
                <div className="mt-2">
                  <button 
                    type="button" 
                    className="btn btn-light bg-white rounded-pill px-3.5 py-1.5 small fw-semibold text-dark shadow-xs border hover-bg-light"
                    style={{ fontSize: '12px' }}
                    onClick={() => handleOpenBookingPage('Sightseeing Tour')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            3. "Plan for later" SECTION (EXACT UBER DATE & 15-MIN TIME DROPDOWN)
           ══════════════════════════════════════════════════════════════════════ */}
        <div id="plan-for-later-section" className="mb-5 pb-5">
          <h2 className="fw-bold text-dark mb-3" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>
            Plan for later
          </h2>

          <div className="row g-4 align-items-stretch">
            
            {/* Left Card: Soft Cyan/Teal Reserve Card */}
            <div className="col-12 col-lg-7">
              <div 
                className="p-4 p-md-5 rounded-4 h-100 d-flex flex-column justify-content-between position-relative shadow-xs"
                style={{ background: '#98c4c7', minHeight: '380px' }}
              >
                <div style={{ maxWidth: '440px', zIndex: 2 }}>
                  <h2 className="fw-bold text-dark mb-4" style={{ lineHeight: 1.2, fontSize: '30px', letterSpacing: '-0.02em' }}>
                    Get your ride right with Uber Reserve
                  </h2>

                  <p className="text-dark small fw-semibold mb-2">
                    Choose date and time
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); handleOpenBookingPage('Reserve Scheduled Trip'); }}>
                    <div className="row g-2 mb-4 position-relative">
                      
                      {/* DATE PICKER BOX */}
                      <div className="col-6 position-relative">
                        <span className="text-secondary text-xxs d-block mb-1 fw-semibold">Date</span>
                        <div 
                          className="bg-white rounded-3 px-3 py-2.5 border-0 shadow-xs d-flex align-items-center gap-2 cursor-pointer"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShowDatePicker(!showDatePicker);
                            setShowTimeDropdown(false);
                          }}
                        >
                          <Calendar size={16} className="text-secondary flex-shrink-0" />
                          <span className="text-dark fw-semibold small text-truncate">
                            {formattedDateDisplay}
                          </span>
                        </div>

                        {showDatePicker && (
                          <>
                            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 90 }} onClick={() => setShowDatePicker(false)} />
                            <div className="position-absolute start-0 top-100 mt-1 bg-white rounded-4 shadow-2xl border p-3 animate-fade-in-up" style={{ zIndex: 1050, width: '300px', boxShadow: '0 16px 40px rgba(0,0,0,0.22)' }}>
                              <div className="d-flex justify-content-between align-items-center mb-2.5">
                                <span className="fw-bold text-dark small">{monthNames[calendarMonth]} {calendarYear}</span>
                                <div className="d-flex gap-1">
                                  <button type="button" className="btn btn-sm btn-light p-1 rounded-circle" onClick={() => calendarMonth === 0 ? (setCalendarMonth(11), setCalendarYear(calendarYear - 1)) : setCalendarMonth(calendarMonth - 1)}>
                                    <ChevronLeft size={14} />
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light p-1 rounded-circle" onClick={() => calendarMonth === 11 ? (setCalendarMonth(0), setCalendarYear(calendarYear + 1)) : setCalendarMonth(calendarMonth + 1)}>
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="d-grid mb-1.5 text-center text-muted fw-semibold" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '11px' }}>
                                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                              </div>
                              <div className="d-grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {calendarDays.map((d, idx) => d.dayNum ? (
                                  <button
                                    key={d.dateStr}
                                    type="button"
                                    disabled={d.isPast}
                                    className={`btn btn-sm p-0 rounded-circle ${d.isSelected ? 'bg-dark text-white fw-bold' : d.isToday ? 'border border-dark text-dark fw-bold' : d.isPast ? 'text-muted opacity-40' : 'btn-light border-0 text-dark'}`}
                                    style={{ height: '30px', width: '30px', fontSize: '12px', margin: 'auto' }}
                                    onClick={() => { setSelectedDate(d.dateStr); setShowDatePicker(false); }}
                                  >
                                    {d.dayNum}
                                  </button>
                                ) : <div key={`empty-${idx}`} style={{ height: '30px' }} />)}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* TIME PICKER BOX */}
                      <div className="col-6 position-relative">
                        <span className="text-secondary text-xxs d-block mb-1 fw-semibold">Time</span>
                        <div 
                          className="bg-white rounded-3 px-3 py-2.5 border-0 shadow-xs d-flex align-items-center justify-content-between cursor-pointer"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShowTimeDropdown(!showTimeDropdown);
                            setShowDatePicker(false);
                          }}
                        >
                          <div className="d-flex align-items-center gap-2 overflow-hidden">
                            <Clock size={16} className="text-secondary flex-shrink-0" />
                            <span className="text-dark fw-semibold small text-truncate">
                              {formattedTimeDisplay}
                            </span>
                          </div>
                          <ChevronDown size={14} className="text-secondary flex-shrink-0" />
                        </div>

                        {showTimeDropdown && (
                          <>
                            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 90 }} onClick={() => setShowTimeDropdown(false)} />
                            <div className="position-absolute start-0 top-100 mt-1 w-100 bg-white rounded-3 shadow-2xl border overflow-auto py-1 animate-fade-in-up" style={{ zIndex: 1050, maxHeight: '220px', boxShadow: '0 16px 40px rgba(0,0,0,0.22)' }}>
                              {TIME_SLOTS_15MIN.map(slot => (
                                <button
                                  key={slot.value}
                                  type="button"
                                  className={`btn btn-link text-decoration-none w-100 text-start py-2 px-3 small border-0 d-flex justify-content-between align-items-center ${slot.value === selectedTime ? 'bg-light text-dark fw-bold' : 'text-dark hover-bg-light'}`}
                                  style={{ fontSize: '13px' }}
                                  onClick={() => { setSelectedTime(slot.value); setShowTimeDropdown(false); }}
                                >
                                  <span>{slot.label}</span>
                                  {slot.value === selectedTime && <Check size={14} className="text-dark" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-dark rounded-3 px-4 py-2.5 fw-bold text-white shadow-sm"
                      style={{ minWidth: '120px', fontSize: '14px' }}
                    >
                      Next
                    </button>
                  </form>
                </div>

                {/* SVG Watch and Calendar Planner Illustration */}
                <div className="position-absolute top-0 start-0 w-100 h-100 rounded-4 overflow-hidden pointer-events-none" style={{ pointerEvents: 'none', zIndex: 1 }}>
                  <div className="d-none d-md-block position-absolute bottom-0 end-0" style={{ width: '230px', height: '230px', opacity: 0.95 }}>
                    <svg viewBox="0 0 240 240" className="w-100 h-100">
                      <defs>
                        <filter id="plannerShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.2" />
                        </filter>
                      </defs>

                      <g transform="rotate(-18 120 120)" filter="url(#plannerShadow)">
                        <rect x="50" y="30" width="140" height="170" rx="12" fill="#ffffff" />
                        <line x1="65" y1="65" x2="175" y2="65" stroke="#e2e8f0" strokeWidth="1.5" />
                        <line x1="65" y1="100" x2="175" y2="100" stroke="#e2e8f0" strokeWidth="1.5" />
                        <line x1="65" y1="135" x2="175" y2="135" stroke="#e2e8f0" strokeWidth="1.5" />
                        <text x="80" y="55" fontSize="11" fill="#f97316" fontWeight="bold">01</text>
                        <text x="120" y="55" fontSize="11" fill="#64748b" fontWeight="600">02</text>
                        <text x="155" y="55" fontSize="11" fill="#64748b" fontWeight="600">03</text>
                      </g>

                      <g transform="rotate(24 140 140)" filter="url(#plannerShadow)">
                        <rect x="125" y="10" width="30" height="220" rx="4" fill="#854d0e" />
                        <circle cx="140" cy="120" r="32" fill="#0f172a" stroke="#ffffff" strokeWidth="3" />
                        <circle cx="140" cy="120" r="28" fill="#1e293b" />
                        <line x1="140" y1="120" x2="140" y2="102" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="140" y1="120" x2="156" y2="128" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="140" cy="120" r="3" fill="#f97316" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Benefits Card (Clean, NO See terms as requested) */}
            <div className="col-12 col-lg-5">
              <div className="p-4 p-md-5 rounded-4 bg-white border h-100 d-flex flex-column justify-content-between shadow-2xs" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <h5 className="fw-bold text-dark mb-4" style={{ fontSize: '20px' }}>Benefits</h5>

                  <div className="d-grid gap-4 mb-4">
                    <div className="d-flex align-items-start gap-3">
                      <div className="text-dark mt-0.5"><Calendar size={18} /></div>
                      <div className="small text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.45 }}>
                        Choose your exact pickup time up to 90 days in advance.
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div className="text-dark mt-0.5"><Clock size={18} /></div>
                      <div className="small text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.45 }}>
                        Extra wait time included to meet your ride.
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div className="text-dark mt-0.5"><CreditCard size={18} /></div>
                      <div className="small text-secondary" style={{ fontSize: '13.5px', lineHeight: 1.45 }}>
                        Cancel at no charge up to 60 minutes in advance.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Change City / Area Modal */}
      {showCityModal && (
        <div className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(15,23,42,0.65)', zIndex: 99999, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-4 shadow-xl overflow-hidden w-100 animate-fade-in-up" style={{ maxWidth: '620px', maxHeight: '88vh' }}>
            <div className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom bg-light">
              <div>
                <h6 className="fw-bold text-dark mb-0">Select Area or City in Goa</h6>
                <span className="text-muted text-xxs">Over 35+ verified hubs, beaches, airports & railway stations</span>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle p-1" onClick={() => setShowCityModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="p-3 border-bottom bg-white">
              <div className="position-relative mb-2">
                <Search size={16} className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" />
                <input 
                  type="text" 
                  className="form-control rounded-pill ps-5 bg-light border" 
                  placeholder="Search city, beach, airport or railway station in Goa..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="d-flex gap-1.5 overflow-auto pb-1" style={{ whiteSpace: 'nowrap' }}>
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-xs rounded-pill px-2.5 py-1 small ${activeCategoryTab === cat ? 'btn-dark text-white fw-bold' : 'btn-light border text-secondary'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => setActiveCategoryTab(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 overflow-auto" style={{ maxHeight: '52vh' }}>
              <div className="d-grid gap-1.5">
                {filteredGoaLocations.map(loc => (
                  <button
                    key={loc.name}
                    type="button"
                    className="btn btn-light text-start d-flex justify-content-between align-items-center py-2 px-3 rounded-3 border-0 hover-bg-light"
                    onClick={() => {
                      if (cityModalTarget === 'pickup') {
                        setPickupLocation(loc.name);
                      } else if (cityModalTarget === 'dropoff') {
                        setDropoffLocation(loc.name);
                      } else {
                        setCurrentCity(loc.name);
                        setPickupLocation(loc.name);
                      }
                      setShowCityModal(false);
                    }}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <MapPin size={15} className="text-secondary" />
                      <div>
                        <div className="fw-semibold small text-dark">{loc.name}</div>
                        <span className="text-muted text-xxs" style={{ fontSize: '11px' }}>{loc.region} • {loc.category}</span>
                      </div>
                    </div>
                    {loc.popular && (
                      <span className="badge bg-warning bg-opacity-15 text-dark fw-semibold" style={{ fontSize: '10px' }}>
                        Popular
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Download & Mobile QR Scanner Modal on "Book a ride" */}
      <AppDownloadModal 
        isOpen={showAppBookingModal} 
        onClose={() => setShowAppBookingModal(false)} 
        isBookingPrompt={true} 
        onContinueWebBooking={proceedToDedicatedBooking} 
      />

      {/* Floating Real-Time Toast Notification */}
      {customerToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: customerToast.type === 'trip_start' 
            ? '#059669' 
            : customerToast.type === 'trip_completed' 
              ? '#0f172a' 
              : '#2563eb',
          color: '#ffffff',
          padding: '16px 20px',
          borderRadius: '14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          maxWidth: '420px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ fontSize: '24px' }}>
            {customerToast.type === 'trip_start' ? '🚗' : customerToast.type === 'trip_completed' ? '🏁' : '🔔'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '2px' }}>{customerToast.title}</div>
            <div style={{ fontSize: '12.5px', opacity: 0.95, lineHeight: 1.4 }}>{customerToast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setCustomerToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', padding: '0 4px', opacity: 0.7 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Uber-style Past Trips Activity Modal */}
      <CustomerTripsModal
        isOpen={showTripsHistoryModal}
        onClose={() => setShowTripsHistoryModal(false)}
        onSelectTrip={(trip) => {
          setActiveConfirmedRide(trip);
          setCurrentView('confirmed');
          setShowTripsHistoryModal(false);
        }}
        onRebookTrip={(trip) => {
          setPickupLocation(trip.pickup || '');
          setDropoffLocation(trip.dropoff || '');
          setCurrentView('booking');
          setShowTripsHistoryModal(false);
        }}
        activeRefId={activeConfirmedRide?.refId}
      />

    </div>
  );
}
