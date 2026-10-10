import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import './App.css';
import { useSiteConfig } from './context/SiteConfigContext';
import { useCustomerCurrency } from './context/CustomerCurrencyContext';
import { unlockAudio } from './utils/notificationSound';

// Import Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchWidget from './components/SearchWidget';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import BookingModal from './components/BookingModal';
import HotelBookingModal from './components/HotelBookingModal';
import PackageDetailsModal from './components/PackageDetailsModal';
import AIChatbot from './components/AIChatbot';
import WhatsAppWidget from './components/WhatsAppWidget';
import PopupRenderer from './components/website/PopupRenderer';

import DynamicFeaturedHotels from './components/widgets/DynamicFeaturedHotels';
import DynamicFeaturedVehicles from './components/widgets/DynamicFeaturedVehicles';
import DynamicPopularPackages from './components/widgets/DynamicPopularPackages';
import FeaturesGrid from './components/widgets/FeaturesGrid';
import SelfDriveCategoryShowcase from './components/widgets/SelfDriveCategoryShowcase';

// Import Pages
import {
  ActivityDetailsPage,
  FlightBookingFlow,
  FlightDetailsPage,
  AdminPortalPage,
  VendorPortalPage,
  FlightVendorPortalPage,
  HotelVendorPortalPage,
  SuperAdminPortalPage,
  HotelsPage,
  CarsPage,
  CarDetailsPage,
  BikeDetailsPage,
  BikesPage,
  FlightsPage,
  HotelDetailsPage,
  VehicleDetailsPage,
  PackageDetailsPage,
  ExplorePage,
  SelfDrivePage,
  PackageCustomizationPage,
  CraftMyTripPage,
  AIPlannerPage,
  CustomerDashboard,
  SubAdminPortalPage,
  DriverPortalPage,
  DriverLoginPage,
  CustomerPortalPage
} from './pages';
import CustomTripEnquiryPage from './pages/customer/CustomTripEnquiryPage';
import B2BPortalPage from './pages/b2b/B2BPortalPage';
import CustomerActivitiesTab from './components/customer/CustomerActivitiesTab';
import VendorLoginPage from './pages/vendor/VendorLoginPage';
import RoleAccessDeniedModal from './components/vendor/RoleAccessDeniedModal';
import PublicVendorStorefrontPage from './pages/vendor/PublicVendorStorefrontPage';

// Import Mock Data & API Service
import { 
  locationsList, 
  hotelsData as defaultHotels, 
  packagesData as defaultPackages, 
  carsData as defaultCars, 
  bikesData as defaultBikes, 
  exploreDestinations as defaultDestinations,
  usersData as defaultUsers,
  bookingsData as defaultBookings,
  vendorsData as defaultVendors,
  vehicleUnitsData as defaultVehicleUnits
} from './data/mockData';
import * as api from './services/api';
import { getTodayDateStr, addDays, validateBookingDates } from './utils/dateUtils';
import { normalizeVehicleType } from './utils/vehicleHelper';

export default function App() {
  const { liveConfig } = useSiteConfig();
  
  // Navigation & Tabs state — restored from sessionStorage on refresh so portals survive reload
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const p = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
      // Derive tab directly from URL path — most reliable on refresh
      if (p.startsWith('/v/')) return 'vendor-storefront';
      if ((p === '/vehicle' || p === '/vehicles' || p.startsWith('/vehicle/') || p.startsWith('/vehicles/')) && p !== '/vehicle/login') return 'selfdrive';
      if (p.startsWith('/admin') || p === '/portal' || p.startsWith('/sub-admin') || p.startsWith('/subadmin') || p.startsWith('/superadmin') || p.startsWith('/super-admin') || p === '/vendor' || p === '/hotel-vendor' || p === '/flight-vendor' || p === '/vehicle/login' || p === '/hotel/login' || p === '/flight/login') return 'portal';
      if (p.startsWith('/b2b') || p === '/register' || p.startsWith('/vendor/register')) return 'b2b';
      if (p.startsWith('/driver')) return 'driver';
      if (p.startsWith('/customer')) return 'customer';
      if (p.startsWith('/dashboard')) return 'dashboard';
      if (p.startsWith('/activities') || p.startsWith('/sightseeing-activities') || p.startsWith('/sightseeing')) {
        const urlParams = new URLSearchParams(window.location.search);
        const activityId = urlParams.get('activity') || urlParams.get('id');
        if (activityId) {
          return 'activity-details';
        }
        return 'activities';
      }
      if (p.startsWith('/craft')) return 'craftmytrip';
      if (p.startsWith('/hotels')) {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'hotel-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          return 'hotel-details';
        }
        return 'hotels';
      }
      if (p.startsWith('/cars')) {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'car-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          return 'car-details';
        }
        return 'cars';
      }
      if (p.startsWith('/bikes')) {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'bike-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          return 'bike-details';
        }
        return 'bikes';
      }
      if (p.startsWith('/flights')) {
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flight') || urlParams.get('id');
        if (flightId) {
          return 'flight-details';
        }
        return 'flights';
      }
      if (p.startsWith('/packages')) {
        const urlParams = new URLSearchParams(window.location.search);
        const packageId = urlParams.get('package') || urlParams.get('id');
        const step = urlParams.get('step');
        if (step === 'customize') {
          return 'customize';
        }
        if (packageId) {
          return 'package-details';
        }
        return 'packages';
      }
      if (p.startsWith('/self-drive') || p.startsWith('/selfdrive')) {
        const urlParams = new URLSearchParams(window.location.search);
        const packageId = urlParams.get('package') || urlParams.get('id');
        const step = urlParams.get('step');
        if (step === 'customize') {
          return 'customize';
        }
        if (packageId) {
          return 'package-details';
        }
        return 'selfdrive';
      }
      // Fall back to sessionStorage if path is just '/'
      const saved = sessionStorage.getItem('tg_activeTab');
      if (saved) return saved;
    } catch (e) {}
    return 'selfdrive';
  });
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/'));
  const path = currentPath;
  const customerCurrency = useCustomerCurrency();
  const resetCountry = customerCurrency?.resetCountry;

  // Search Widget form fields
  const [pickupLoc, setPickupLoc] = useState('');
  const [dropLoc, setDropLoc] = useState('');
  const [pickupDate, setPickupDate] = useState(() => getTodayDateStr());
  const [dropDate, setDropDate] = useState(() => addDays(getTodayDateStr(), 2));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropTime, setDropTime] = useState('10:00');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedFlightOffer, setSelectedFlightOffer] = useState(null);
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [hotelPriceRange, setHotelPriceRange] = useState('All');
  
  // Flight Specific State
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightInfants, setFlightInfants] = useState(0);
  const [flightClass, setFlightClass] = useState('economy');

  // Filters state
  const [appliedFilters, setAppliedFilters] = useState({});
  const [hotelFilterStars, setHotelFilterStars] = useState('All');
  const [packageFilterDuration, setPackageFilterDuration] = useState('All');
  const [carFilterFuel, setCarFilterFuel] = useState('All');
  const [carFilterTrans, setCarFilterTrans] = useState('All');
  const [bikeFilterType, setBikeFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout Modal state — booking modal overlays must always initialize closed (null) on page reload/refresh
  // It should only be restored if the user is explicitly on the full-page package customization view (?step=customize)
  const [selectedBookingItem, setSelectedBookingItem] = useState(() => {
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (urlParams && urlParams.get('step') === 'customize') {
        const saved = sessionStorage.getItem('tg_selectedBookingItem') || sessionStorage.getItem('tg_selectedDetailItem');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  });
  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tg_selectedDetailItem');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [detailOriginTab, setDetailOriginTab] = useState(() => {
    try {
      return sessionStorage.getItem('tg_detailOriginTab') || 'cars';
    } catch (e) {
      return 'cars';
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingDays, setBookingDays] = useState(2);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userLicense, setUserLicense] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [enquiryPrefillPackage, setEnquiryPrefillPackage] = useState(null);
  const [pendingActivityBooking, setPendingActivityBooking] = useState(null);

  // Users & Role-Based Auth States
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthHydrating, setIsAuthHydrating] = useState(true);

  // Restore authenticated session state synchronously on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.username || parsed.role)) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.warn('[Auth] Hydration error:', e);
    } finally {
      setIsAuthHydrating(false);
    }
  }, []);


  const [usersList, setUsersList] = useState(defaultUsers);

  // Database-driven data states
  const [vendors, setVendors] = useState(defaultVendors);
  const [hotels, setHotels] = useState(defaultHotels);
  const [destinations, setDestinations] = useState(defaultDestinations);
  const [packages, setPackages] = useState(defaultPackages);
  const [cars, setCars] = useState(defaultCars);
  const [bikes, setBikes] = useState(defaultBikes);
  const [bookings, setBookingsList] = useState(defaultBookings);
  const [vehicleUnits, setVehicleUnits] = useState(defaultVehicleUnits);
  const [flights, setFlights] = useState([]);
  const [markups, setMarkups] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load backend data on mount
  useEffect(() => {
    let safetyTimer = setTimeout(() => {
      setDataLoaded(true);
    }, 1500);

    async function loadAllData() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTenant = urlParams.get('tenant');
      if (urlTenant) {
        localStorage.setItem('tenant_id', urlTenant);
      }

      try {
        const results = await Promise.allSettled([
          api.fetchHotels(),
          api.fetchDestinations(),
          api.fetchPackages(),
          api.fetchVendors(),
          api.fetchUsers(),
          api.fetchCars(),
          api.fetchBikes(),
          api.fetchBookings(),
          api.fetchFlights(),
          api.fetchMarkups(),
          api.fetchActivities(),
          api.fetchVehicleUnits()
        ]);
        
        const [hRes, dRes, pRes, vRes, uRes, cRes, bRes, bkRes, fRes, mRes, actRes, vuRes] = results;
        if (hRes.status === 'fulfilled' && Array.isArray(hRes.value) && hRes.value.length > 0) setHotels(hRes.value);
        if (dRes.status === 'fulfilled' && Array.isArray(dRes.value) && dRes.value.length > 0) setDestinations(dRes.value);
        if (pRes.status === 'fulfilled' && Array.isArray(pRes.value) && pRes.value.length > 0) setPackages(pRes.value);
        if (vRes.status === 'fulfilled' && Array.isArray(vRes.value) && vRes.value.length > 0) setVendors(vRes.value);
        if (uRes.status === 'fulfilled' && Array.isArray(uRes.value) && uRes.value.length > 0) setUsersList(uRes.value);
        if (cRes.status === 'fulfilled' && Array.isArray(cRes.value) && cRes.value.length > 0) setCars(cRes.value);
        if (bRes.status === 'fulfilled' && Array.isArray(bRes.value) && bRes.value.length > 0) setBikes(bRes.value);
        if (bkRes.status === 'fulfilled' && Array.isArray(bkRes.value) && bkRes.value.length > 0) setBookingsList(bkRes.value);
        if (fRes.status === 'fulfilled' && fRes.value) setFlights(fRes.value);
        if (mRes.status === 'fulfilled' && mRes.value) setMarkups(mRes.value);
        if (actRes.status === 'fulfilled' && Array.isArray(actRes.value)) setActivities(actRes.value);
        if (vuRes.status === 'fulfilled' && Array.isArray(vuRes.value) && vuRes.value.length > 0) setVehicleUnits(vuRes.value);
      } catch (err) {
        console.warn("Using fallback inventory data:", err);
      } finally {
        clearTimeout(safetyTimer);
        setDataLoaded(true);
      }
    }
    loadAllData();

    const handleNewBooking = (e) => {
      if (e.detail) {
        setBookingsList(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
      }
      refreshBookingsFast();
    };

    const handleBookingStatusUpdated = (e) => {
      if (e?.detail?.id && e?.detail?.status) {
        setBookingsList(prev => prev.map(b => String(b.id) === String(e.detail.id) ? { 
          ...b, 
          status: e.detail.status, 
          ...(e.detail.paymentStatus ? { payment_status: e.detail.paymentStatus } : {}) 
        } : b));
      }
      refreshBookingsFast();
    };

    const handlePackagesSync = () => {
      api.fetchPackages().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) setPackages(fresh);
      }).catch(console.error);
    };

    const handleHotelsSync = () => {
      api.fetchHotels().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) setHotels(fresh);
      }).catch(console.error);
    };

    const handleActivitiesSync = () => {
      api.fetchActivities().then(fresh => {
        if (Array.isArray(fresh)) setActivities(fresh);
      }).catch(console.error);
    };

    const refreshBookingsFast = () => {
      api.fetchBookings().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setBookingsList(prev => {
            if (
              prev.length === fresh.length &&
              prev.every((b, idx) => b.id === fresh[idx].id && b.status === fresh[idx].status && b.payment_status === fresh[idx].payment_status && b.updated_at === fresh[idx].updated_at)
            ) {
              return prev;
            }
            return fresh;
          });
        }
      }).catch(() => {});
    };

    // 6-second real-time periodic background polling for authoritative bookings
    const bookingsInterval = setInterval(refreshBookingsFast, 6000);

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('booking-status-updated', handleBookingStatusUpdated);
    window.addEventListener('booking-updated', refreshBookingsFast);
    window.addEventListener('booking-deleted', refreshBookingsFast);
    window.addEventListener('tripgalileo-booking-sync', refreshBookingsFast);
    window.addEventListener('tripPackagesUpdated', handlePackagesSync);
    window.addEventListener('hotelsUpdated', handleHotelsSync);
    window.addEventListener('activitiesUpdated', handleActivitiesSync);
    window.addEventListener('tripgalileo-activities-sync', handleActivitiesSync);

    let bc;
    let bcHotels;
    let bcBookings;
    let bcNotifs;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_packages_sync');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'PACKAGES_CHANGED') {
            api.fetchPackages().then(fresh => {
              if (Array.isArray(fresh) && fresh.length > 0) setPackages(fresh);
            }).catch(console.error);
          }
        };

        bcHotels = new BroadcastChannel('tripgalileo_hotels_sync');
        bcHotels.onmessage = (event) => {
          if (event.data && event.data.type === 'HOTELS_CHANGED') {
            api.fetchHotels().then(fresh => {
              if (Array.isArray(fresh) && fresh.length > 0) setHotels(fresh);
            }).catch(console.error);
          }
        };

        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = (event) => {
          refreshBookingsFast();
        };

        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = (event) => {
          window.dispatchEvent(new CustomEvent('authoritative-notification-received', { detail: event.data }));
        };
      }
    } catch (e) {}

    return () => {
      clearInterval(bookingsInterval);
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('booking-status-updated', handleBookingStatusUpdated);
      window.removeEventListener('booking-updated', refreshBookingsFast);
      window.removeEventListener('booking-deleted', refreshBookingsFast);
      window.removeEventListener('tripgalileo-booking-sync', refreshBookingsFast);
      window.removeEventListener('tripPackagesUpdated', handlePackagesSync);
      window.removeEventListener('hotelsUpdated', handleHotelsSync);
      if (bc) bc.close();
      if (bcHotels) bcHotels.close();
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, []);

  // Auto-hydrate car details if direct URL or query parameter has ?car=id or ?id=id
  useEffect(() => {
    if (cars && cars.length > 0 && typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const carId = urlParams.get('car') || urlParams.get('id');
      if (carId && p.startsWith('/cars')) {
        const matchedCar = cars.find(c => String(c.id) === String(carId));
        if (matchedCar && (!selectedDetailItem || String(selectedDetailItem.id) !== String(carId))) {
          setSelectedDetailItem(matchedCar);
          setActiveTab('car-details');
          try {
            sessionStorage.setItem('tg_activeTab', 'car-details');
            sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedCar));
          } catch (e) {}
        }
      }
    }
  }, [cars]);

  // Auto-hydrate bike details if direct URL or query parameter has ?bike=id or ?id=id
  useEffect(() => {
    if (bikes && bikes.length > 0 && typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const bikeId = urlParams.get('bike') || urlParams.get('id');
      if (bikeId && p.startsWith('/bikes')) {
        const matchedBike = bikes.find(b => String(b.id) === String(bikeId));
        if (matchedBike && (!selectedDetailItem || String(selectedDetailItem.id) !== String(bikeId))) {
          setSelectedDetailItem(matchedBike);
          setActiveTab('bike-details');
          try {
            sessionStorage.setItem('tg_activeTab', 'bike-details');
            sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedBike));
          } catch (e) {}
        }
      }
    }
  }, [bikes]);

  // Auto-hydrate package details or customization if direct URL or query parameter has ?package=id or ?id=id
  useEffect(() => {
    if (packages && packages.length > 0 && typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const packageId = urlParams.get('package') || urlParams.get('id');
      const step = urlParams.get('step');
      if (packageId && (p.startsWith('/packages') || p.startsWith('/self-drive') || p.startsWith('/selfdrive'))) {
        const matchedPkg = packages.find(pkg => String(pkg.id) === String(packageId));
        if (step === 'customize') {
          if (matchedPkg && (!selectedBookingItem || String(selectedBookingItem.id) !== String(packageId))) {
            setSelectedBookingItem(matchedPkg);
            setActiveTab('customize');
            try {
              sessionStorage.setItem('tg_activeTab', 'customize');
              sessionStorage.setItem('tg_selectedBookingItem', JSON.stringify(matchedPkg));
              sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedPkg));
            } catch (e) {}
          }
        } else {
          if (matchedPkg && (!selectedDetailItem || String(selectedDetailItem.id) !== String(packageId))) {
            setSelectedDetailItem(matchedPkg);
            setActiveTab('package-details');
            try {
              sessionStorage.setItem('tg_activeTab', 'package-details');
              sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedPkg));
            } catch (e) {}
          }
        }
      }
    }
  }, [packages]);

  // Auto-hydrate hotel details if direct URL or query parameter has ?hotel=id or ?id=id
  useEffect(() => {
    if (hotels && hotels.length > 0 && typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const hotelId = urlParams.get('hotel') || urlParams.get('id');
      if (hotelId && p.startsWith('/hotels')) {
        const matchedHotel = hotels.find(h => String(h.id) === String(hotelId));
        if (matchedHotel && (!selectedDetailItem || String(selectedDetailItem.id) !== String(hotelId))) {
          setSelectedDetailItem(matchedHotel);
          setActiveTab('hotel-details');
          try {
            sessionStorage.setItem('tg_activeTab', 'hotel-details');
            sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedHotel));
          } catch (e) {}
        }
      }
    }
  }, [hotels]);

  // Auto-hydrate flight details if direct URL or query parameter has ?flight=id or ?id=id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const flightId = urlParams.get('flight') || urlParams.get('id');
      if (flightId && p.startsWith('/flights')) {
        // First check if selectedDetailItem already matches
        if (selectedDetailItem && (String(selectedDetailItem.id) === String(flightId) || String(selectedDetailItem.flight_number) === String(flightId))) {
          if (activeTab !== 'flight-details') setActiveTab('flight-details');
          return;
        }
        // Check session storage
        try {
          const raw = sessionStorage.getItem('tg_selectedDetailItem');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (String(parsed.id) === String(flightId) || String(parsed.flight_number) === String(flightId) || parsed.type === 'flight')) {
              setSelectedDetailItem(parsed);
              setActiveTab('flight-details');
              return;
            }
          }
        } catch (e) {}

        // Check loaded flights inventory
        if (flights && flights.length > 0) {
          const matchedFlight = flights.find(f => String(f.id) === String(flightId) || String(f.flight_number) === String(flightId) || `FL-${f.id}` === String(flightId));
          if (matchedFlight) {
            setSelectedDetailItem(matchedFlight);
            setActiveTab('flight-details');
            try {
              sessionStorage.setItem('tg_activeTab', 'flight-details');
              sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedFlight));
            } catch (e) {}
          }
        }
      }
    }
  }, [flights]);

  // Auto-hydrate activity details if direct URL or query parameter has ?activity=id or ?id=id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const activityId = urlParams.get('activity') || urlParams.get('id');
      if (activityId && (p.startsWith('/activities') || p.startsWith('/sightseeing-activities') || p.startsWith('/sightseeing'))) {
        if (selectedDetailItem && String(selectedDetailItem.id) === String(activityId)) {
          if (activeTab !== 'activity-details') setActiveTab('activity-details');
          return;
        }
        try {
          const raw = sessionStorage.getItem('tg_selectedDetailItem');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && String(parsed.id) === String(activityId)) {
              setSelectedDetailItem(parsed);
              setActiveTab('activity-details');
              return;
            }
          }
        } catch (e) {}

        if (activities && activities.length > 0) {
          const matchedActivity = activities.find(a => String(a.id) === String(activityId));
          if (matchedActivity) {
            setSelectedDetailItem(matchedActivity);
            setActiveTab('activity-details');
            try {
              sessionStorage.setItem('tg_activeTab', 'activity-details');
              sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(matchedActivity));
            } catch (e) {}
          }
        }
      }
    }
  }, [activities]);

  // Sync tab with browser URL and history navigation
  useEffect(() => {
    const syncTabFromUrl = () => {
      const p = window.location.pathname.toLowerCase();
      setCurrentPath(p);
      if (p.startsWith('/v/')) {
        setActiveTab('vendor-storefront');
        return;
      }
      const cleanPath = p.replace(/^\//, '').split('/')[0];
      let newTab = null;
      if (cleanPath === 'packages') {
        const urlParams = new URLSearchParams(window.location.search);
        const packageId = urlParams.get('package') || urlParams.get('id');
        const step = urlParams.get('step');
        if (step === 'customize') {
          newTab = 'customize';
          try {
            const raw = sessionStorage.getItem('tg_selectedBookingItem') || sessionStorage.getItem('tg_selectedDetailItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedBookingItem(parsed);
            }
          } catch (e) {}
        } else if (packageId) {
          newTab = 'package-details';
          try {
            const raw = sessionStorage.getItem('tg_selectedDetailItem') || sessionStorage.getItem('tg_selectedBookingItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedDetailItem(parsed);
            }
          } catch (e) {}
        } else {
          newTab = 'packages';
        }
      }
      else if (cleanPath === 'self-drive' || cleanPath === 'selfdrive' || cleanPath === 'vehicle' || cleanPath === 'vehicles' || cleanPath === '') {
        const urlParams = new URLSearchParams(window.location.search);
        const packageId = urlParams.get('package') || urlParams.get('id');
        const step = urlParams.get('step');
        if (step === 'customize') {
          newTab = 'customize';
          try {
            const raw = sessionStorage.getItem('tg_selectedBookingItem') || sessionStorage.getItem('tg_selectedDetailItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedBookingItem(parsed);
            }
          } catch (e) {}
        } else if (packageId) {
          newTab = 'package-details';
          try {
            const raw = sessionStorage.getItem('tg_selectedDetailItem') || sessionStorage.getItem('tg_selectedBookingItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedDetailItem(parsed);
            }
          } catch (e) {}
        } else {
          newTab = 'selfdrive';
          if (cleanPath === 'vehicle' || cleanPath === 'vehicles') {
            setTimeout(() => {
              document.getElementById('self-drive-categories')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }
      else if (cleanPath === 'hotels') {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'hotel-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          newTab = 'hotel-details';
        } else {
          newTab = 'hotels';
        }
      }
      else if (cleanPath === 'cars') {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'car-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          newTab = 'car-details';
        } else {
          newTab = 'cars';
        }
      }
      else if (cleanPath === 'bikes') {
        const savedTab = sessionStorage.getItem('tg_activeTab');
        if (savedTab === 'bike-details' && sessionStorage.getItem('tg_selectedDetailItem')) {
          newTab = 'bike-details';
        } else {
          newTab = 'bikes';
        }
      }
      else if (cleanPath === 'flights') {
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flight') || urlParams.get('id');
        if (flightId) {
          newTab = 'flight-details';
          try {
            const raw = sessionStorage.getItem('tg_selectedDetailItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedDetailItem(parsed);
            }
          } catch (e) {}
        } else {
          newTab = 'flights';
        }
      }
      else if (cleanPath === 'activities' || cleanPath === 'sightseeing-activities' || cleanPath === 'sightseeing') {
        const urlParams = new URLSearchParams(window.location.search);
        const activityId = urlParams.get('activity') || urlParams.get('id');
        if (activityId) {
          newTab = 'activity-details';
          try {
            const raw = sessionStorage.getItem('tg_selectedDetailItem');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed) setSelectedDetailItem(parsed);
            }
          } catch (e) {}
        } else {
          newTab = 'activities';
        }
      }
      else if (cleanPath === 'craft' || cleanPath === 'craftmytrip') newTab = 'craftmytrip';
      else if (cleanPath === 'custom-trip') newTab = 'custom-trip';
      else if (cleanPath === 'customer' || cleanPath.startsWith('customer') || cleanPath === 'my-bookings') newTab = 'customer';
      else if (cleanPath === 'admin' || cleanPath === 'portal' || cleanPath === 'superadmin' || cleanPath === 'vendor' || cleanPath === 'hotel-vendor' || cleanPath === 'hotel-pms' || cleanPath === 'flight-vendor' || cleanPath === 'sub-admin' || cleanPath === 'subadmin' || p === '/vehicle/login' || p === '/hotel/login' || p === '/flight/login') newTab = 'portal';
      else if (cleanPath === 'dashboard') newTab = 'dashboard';
      else if (cleanPath === 'b2b' || cleanPath.startsWith('b2b') || p === '/register' || p.startsWith('/vendor/register')) newTab = 'b2b';
      else if (cleanPath === 'driver') newTab = 'driver';
      if (newTab) {
        setActiveTab(newTab);
        try { sessionStorage.setItem('tg_activeTab', newTab); } catch (e) {}
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const handleTabChange = (newTab) => {
    let normalizedTab = newTab;
    if (normalizedTab === 'self drive' || normalizedTab === 'self-drive' || normalizedTab === 'vehicle' || normalizedTab === 'vehicles') normalizedTab = 'selfdrive';
    if (normalizedTab === 'trip packages') normalizedTab = 'packages';
    if (normalizedTab === 'craft' || normalizedTab === 'craft-my-trip') normalizedTab = 'craftmytrip';
    if (normalizedTab === 'my-trips' || normalizedTab === 'track-booking' || normalizedTab === 'my-bookings') normalizedTab = 'customer';
    if (normalizedTab === 'sightseeing' || normalizedTab === 'sightseeing-activities') normalizedTab = 'activities';

    if (activeTab === 'customize' && normalizedTab !== 'customize') {
      setSelectedBookingItem(null);
      try {
        sessionStorage.removeItem('tg_customization_step');
        sessionStorage.removeItem('tg_selectedBookingItem');
      } catch (e) {}
    }
    if (normalizedTab !== 'hotel-details' && normalizedTab !== 'car-details' && normalizedTab !== 'bike-details' && normalizedTab !== 'package-details' && normalizedTab !== 'flight-details') {
      try { sessionStorage.removeItem('tg_selectedDetailItem'); } catch (e) {}
    }
    setActiveTab(normalizedTab);
    // Persist active tab to sessionStorage so browser refresh restores the correct portal
    try { sessionStorage.setItem('tg_activeTab', normalizedTab); } catch (e) {}

    const pathMap = {
      'packages': '/packages',
      'selfdrive': '/self-drive',
      'hotels': '/hotels',
      'cars': '/cars',
      'bikes': '/bikes',
      'flights': '/flights',
      'activities': '/activities',
      'craftmytrip': '/craft',
      'custom-trip': '/custom-trip',
      'customer': '/customer',
      'b2b': '/b2b',
      'portal': currentUser?.role === 'hotel_vendor' ? '/hotel-vendor' : (currentUser?.role === 'flight_vendor' ? '/flight-vendor' : (currentUser?.role === 'vendor' ? '/vendor' : (currentUser?.role === 'superadmin' ? '/superadmin' : '/admin'))),
      'dashboard': '/dashboard'
    };
    const targetPath = pathMap[normalizedTab] || `/${normalizedTab}`;
    window.history.pushState({}, '', targetPath);
    setCurrentPath(targetPath.toLowerCase());

    if (['hotels', 'flights', 'craftmytrip', 'activities'].includes(normalizedTab)) {
      setSearchTriggered(true);
    } else if (['selfdrive', 'packages', 'cars', 'home'].includes(normalizedTab)) {
      setSearchTriggered(false);
    }
  };

  const handleOpenBooking = (item, isCustomization = false) => {
    // Reset previous booking confirmation state completely
    setShowSuccess(false);
    setLastConfirmedBooking(null);
    try {
      const savedPhone = localStorage.getItem('userPhone') || '';
      const savedName = localStorage.getItem('userName') || '';
      setUserPhone(savedPhone);
      if (savedName && (!userName || userName === 'Guest')) {
        setUserName(savedName);
      }
    } catch (_) {
      setUserPhone('');
    }
    if (resetCountry) resetCountry();

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    const sec = document.getElementById('results-section');
    if (sec && sec.offsetHeight > 0) {
      sec.style.minHeight = `${sec.offsetHeight}px`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sec) sec.style.minHeight = '';
        });
      });
    }

    if (item.pickupDate) setPickupDate(item.pickupDate);
    if (item.dropDate) setDropDate(item.dropDate);
    if (item.departureDate) setPickupDate(item.departureDate);
    if (item.returnDate) setDropDate(item.returnDate);

    const effPickup = item.pickupDate || item.departureDate || pickupDate;
    const effDrop = item.dropDate || item.returnDate || dropDate;
    let days = 2;
    if (effPickup && effDrop) {
      const diff = Math.round((new Date(effDrop) - new Date(effPickup)) / (1000 * 60 * 60 * 24));
      if (diff > 0) days = diff;
    }

    const isFlightItem = item.type === 'flight' || !!item.airline || !!item.flight_number || (!!item.from && !!item.to);
    const isActivityItem = String(item?.id || '').startsWith('act-') || String(item?.id || '').startsWith('sight-') || item.type === 'activity' || item.type === 'sightseeing' || item.item_type === 'activity' || item.item_type === 'sightseeing';
    const isPackageItem = !isFlightItem && !isActivityItem && (
      isCustomization ||
      item.type === 'package' ||
      !!item.package_type ||
      (item.duration && (typeof item.duration === 'string') && (item.duration.toLowerCase().includes('day') || item.duration.toLowerCase().includes('night')))
    );

    if (isPackageItem) {
      if (isCustomization) {
        setSelectedBookingItem(item);
        setActiveTab('customize');
        try {
          sessionStorage.setItem('tg_activeTab', 'customize');
          sessionStorage.setItem('tg_selectedBookingItem', JSON.stringify(item));
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const isSelfDrivePkg = item.package_type === 'Self Drive Package' || (item.name && item.name.toLowerCase().includes('self drive'));
        const basePath = isSelfDrivePkg ? '/self-drive' : '/packages';
        const targetUrl = item?.id ? `${basePath}?package=${encodeURIComponent(item.id)}&step=customize` : `${basePath}?step=customize`;
        window.history.pushState({}, '', targetUrl);
        setCurrentPath(targetUrl);
      } else {
        // Authoritative Fixed Package Booking Flow: Opens Package Details & Booking
        setSelectedDetailItem(item);
        setActiveTab('package-details');
        try {
          sessionStorage.setItem('tg_activeTab', 'package-details');
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const isSelfDrivePkg = item.package_type === 'Self Drive Package' || (item.name && item.name.toLowerCase().includes('self drive'));
        const basePath = isSelfDrivePkg ? '/self-drive' : '/packages';
        const targetUrl = item?.id ? `${basePath}?package=${encodeURIComponent(item.id)}` : basePath;
        window.history.pushState({}, '', targetUrl);
        setCurrentPath(targetUrl);
      }
    } else {
      setSelectedBookingItem(item);
      setBookingDays(days);
    }
  };

  const handleOpenHotelBooking = (hotel, selectedRoom = null, selectedRatePlan = null) => {
    // Reset previous booking confirmation state completely
    setShowSuccess(false);
    setLastConfirmedBooking(null);
    setUserPhone('');
    if (resetCountry) resetCountry();

    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const sec = document.getElementById('results-section');
    if (sec && sec.offsetHeight > 0) {
      sec.style.minHeight = `${sec.offsetHeight}px`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sec) sec.style.minHeight = '';
        });
      });
    }
    const bookingItem = {
      ...hotel,
      preselected_room: selectedRoom || hotel?.preselected_room || null,
      preselected_rate_plan: selectedRatePlan || hotel?.preselected_rate_plan || null
    };
    setSelectedBookingItem(bookingItem);
    let days = hotel?.booking_days || 2;
    if (!hotel?.booking_days && pickupDate && dropDate) {
      const diff = Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
      if (diff > 0) days = diff;
    }
    setBookingDays(days);
  };

  const handleOpenDetails = (item, type = 'hotel', originTab = null) => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const sec = document.getElementById('results-section');
    if (sec && sec.offsetHeight > 0) {
      sec.style.minHeight = `${sec.offsetHeight}px`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sec) sec.style.minHeight = '';
        });
      });
    }

    const resolvedOrigin = originTab || (activeTab === 'selfdrive' ? 'selfdrive' : (type === 'bike' ? 'bikes' : (type === 'car' ? 'cars' : (type === 'package' ? (activeTab === 'selfdrive' ? 'selfdrive' : 'packages') : activeTab))));
    setDetailOriginTab(resolvedOrigin);
    try {
      sessionStorage.setItem('tg_detailOriginTab', resolvedOrigin);
    } catch (e) {}

    setSelectedDetailItem(item);
    setSearchTriggered(true);

    if (type === 'package') {
      setActiveTab('package-details');
      try {
        sessionStorage.setItem('tg_activeTab', 'package-details');
        sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
      } catch (e) {}
      const targetUrl = item?.id ? `/packages?package=${encodeURIComponent(item.id)}` : '/packages';
      window.history.pushState({}, '', targetUrl);
      setCurrentPath('/packages');
    } else {
      let resolvedType = type;
      if (type === 'vehicle' || type === 'car' || type === 'bike') {
        resolvedType = normalizeVehicleType(item);
      }

      if (resolvedType === 'hotel') {
        setActiveTab('hotel-details');
        try {
          sessionStorage.setItem('tg_activeTab', 'hotel-details');
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const targetUrl = item?.id ? `/hotels?hotel=${encodeURIComponent(item.id)}` : '/hotels';
        window.history.pushState({}, '', targetUrl);
        setCurrentPath('/hotels');
      } else if (resolvedType === 'car') {
        setActiveTab('car-details');
        try {
          sessionStorage.setItem('tg_activeTab', 'car-details');
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const targetUrl = item?.id ? `/cars?car=${encodeURIComponent(item.id)}` : '/cars';
        window.history.pushState({}, '', targetUrl);
        setCurrentPath('/cars');
      } else if (resolvedType === 'bike') {
        setActiveTab('bike-details');
        try {
          sessionStorage.setItem('tg_activeTab', 'bike-details');
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const targetUrl = item?.id ? `/bikes?bike=${encodeURIComponent(item.id)}` : '/bikes';
        window.history.pushState({}, '', targetUrl);
        setCurrentPath('/bikes');
      } else if (resolvedType === 'flight' || type === 'flight') {
        setActiveTab('flight-details');
        try {
          sessionStorage.setItem('tg_activeTab', 'flight-details');
          sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
        } catch (e) {}
        const targetUrl = item?.id ? `/flights?flight=${encodeURIComponent(item.id)}` : '/flights';
        window.history.pushState({}, '', targetUrl);
        setCurrentPath('/flights');
      } else {
        const rawType = String(type || item?.type || item?.item_type || '').trim().toLowerCase();
        const isActivityOrSightseeing = rawType === 'activity' || rawType === 'sightseeing' || rawType === 'addon' ||
          String(item?.id || '').startsWith('act-') || String(item?.id || '').startsWith('sight-');

        if (isActivityOrSightseeing) {
          setActiveTab('activity-details');
          try {
            sessionStorage.setItem('tg_activeTab', 'activity-details');
            sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(item));
          } catch (e) {}
          const targetUrl = item?.id ? `/activities?activity=${encodeURIComponent(item.id)}` : '/activities';
          window.history.pushState({}, '', targetUrl);
          setCurrentPath('/activities');
        }
      }
    }
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Listen to sophia_switch_tab event — fired by AIChatbot when customer clicks a booking link (e.g. /bikes, /cars)
  useEffect(() => {
    const handleSophiaSwitchTab = (e) => {
      const tab = e?.detail?.tab;
      const itemId = e?.detail?.itemId;
      const itemType = e?.detail?.itemType;
      const itemName = e?.detail?.itemName;
      const explicitUrl = e?.detail?.targetUrl;
      if (!tab && !explicitUrl) return;

      // Map short names to actual activeTab keys used in App.jsx
      const tabMap = {
        bikes: 'bikes',
        cars: 'cars',
        hotels: 'hotels',
        activities: 'activities',
        packages: 'packages',
        flights: 'flights',
        selfdrive: 'selfdrive',
        'self-drive': 'selfdrive',
        craft: 'craftmytrip',
        craftmytrip: 'craftmytrip',
        'custom-trip': 'custom-trip'
      };
      const resolved = tabMap[tab] || tab || 'cars';
      const targetPath = '/' + (resolved === 'craftmytrip' ? 'craft' : (resolved === 'self-drive' ? 'selfdrive' : resolved));
      const finalUrl = explicitUrl || (targetPath + (itemId ? `?id=${encodeURIComponent(itemId)}` : ''));

      // If user is currently on an admin or portal page (like /superadmin, /admin, /vendor, /customer, /b2b), redirect immediately
      const curPath = window.location.pathname.toLowerCase();
      if (curPath.startsWith('/superadmin') || curPath.startsWith('/super-admin') ||
          curPath.startsWith('/admin') || curPath.startsWith('/vendor') ||
          curPath.startsWith('/hotel-vendor') || curPath.startsWith('/flight-vendor') ||
          curPath.startsWith('/subadmin') || curPath.startsWith('/sub-admin') ||
          curPath.startsWith('/customer') || curPath.startsWith('/b2b') ||
          curPath.startsWith('/driver') || curPath.startsWith('/portal')) {
        window.location.href = finalUrl;
        return;
      }

      // Update currentPath & history URL so the address bar reflects the destination
      setCurrentPath(targetPath);
      try {
        window.history.pushState({}, '', finalUrl);
      } catch (_) {}

      // 1. Try to find the exact item customer requested
      let matchedItem = null;
      if (resolved === 'bikes' && Array.isArray(bikes) && bikes.length > 0) {
        matchedItem = bikes.find(b => 
          (itemId && String(b.id) === String(itemId)) ||
          (itemName && b.name && (
            b.name.toLowerCase() === itemName.toLowerCase() ||
            b.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(b.name.toLowerCase())
          ))
        );
      } else if (resolved === 'cars' && Array.isArray(cars) && cars.length > 0) {
        matchedItem = cars.find(c => 
          (itemId && String(c.id) === String(itemId)) ||
          (itemName && c.name && (
            c.name.toLowerCase() === itemName.toLowerCase() ||
            c.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(c.name.toLowerCase())
          ))
        );
      } else if (resolved === 'hotels' && Array.isArray(hotels) && hotels.length > 0) {
        matchedItem = hotels.find(h => 
          (itemId && String(h.id) === String(itemId)) ||
          (itemName && h.name && (
            h.name.toLowerCase() === itemName.toLowerCase() ||
            h.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(h.name.toLowerCase())
          ))
        );
      } else if (resolved === 'activities' && Array.isArray(activities) && activities.length > 0) {
        matchedItem = activities.find(a => 
          (itemId && String(a.id) === String(itemId)) ||
          (itemName && (a.title || a.name) && (
            (a.title || a.name).toLowerCase() === itemName.toLowerCase() ||
            (a.title || a.name).toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes((a.title || a.name).toLowerCase())
          ))
        );
      }

      if (matchedItem) {
        // Customer asked to book this specific item -> go directly to its details page so customer can see images and book!
        setSelectedBookingItem(null);
        if (resolved === 'bikes') {
          handleOpenDetails(matchedItem, 'bike');
        } else if (resolved === 'cars') {
          handleOpenDetails(matchedItem, 'car');
        } else if (resolved === 'hotels') {
          handleOpenDetails(matchedItem, 'hotel');
        } else if (resolved === 'activities') {
          handleOpenDetails(matchedItem, 'activity');
        }
      } else {
        // Fallback: switch to category tab and filter by itemName if available
        setActiveTab(resolved);
        if (itemName) {
          setSearchQuery(itemName);
        }
        try { sessionStorage.setItem('tg_activeTab', resolved); } catch (_) {}
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('sophia_switch_tab', handleSophiaSwitchTab);
    return () => window.removeEventListener('sophia_switch_tab', handleSophiaSwitchTab);
  }, [bikes, cars, hotels, activities]);

  const resolveTargetRoute = (user) => {
    let targetPath = '/admin';
    let targetTab = 'portal';

    if (user.role === 'driver') {
      targetTab = 'driver';
      targetPath = '/driver';
    } else if (user.role === 'b2b' || user.role === 'agent') {
      try {
        localStorage.setItem('b2b_partner_user', JSON.stringify(user));
        localStorage.setItem('b2b_partner_token', user.id || 'b2b_partner_a');
      } catch (e) {}
      targetTab = 'b2b';
      targetPath = '/b2b';
    } else if (user.role === 'customer' || user.role === 'user') {
      targetTab = 'dashboard';
      targetPath = '/dashboard';
    } else if (user.role === 'subadmin' || user.role === 'sub_admin') {
      targetTab = 'portal';
      targetPath = '/sub-admin';
    } else if (user.role === 'superadmin') {
      targetTab = 'portal';
      targetPath = '/superadmin';
    } else if (user.role === 'hotel_vendor') {
      targetTab = 'portal';
      targetPath = '/hotel-vendor';
    } else if (user.role === 'flight_vendor') {
      targetTab = 'portal';
      targetPath = '/flight-vendor';
    } else if (user.role === 'vendor') {
      targetTab = 'portal';
      targetPath = '/vendor';
    } else {
      targetTab = 'portal';
      targetPath = '/admin';
    }
    return { targetTab, targetPath };
  };

  const handleLogin = async (usernameOrUser, password) => {
    // If called with a user object directly
    if (typeof usernameOrUser === 'object' && usernameOrUser !== null) {
      const user = usernameOrUser;
      setCurrentUser(user);
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {}
      setShowLoginModal(false);

      const { targetTab, targetPath } = resolveTargetRoute(user);
      setActiveTab(targetTab);
      window.history.pushState(null, '', targetPath);
      setCurrentPath(targetPath.toLowerCase());
      try { sessionStorage.setItem('tg_activeTab', targetTab); } catch (e) {}
      return true;
    }

    // If called with (username, password)
    try {
      let user = null;
      // Check if it's a B2B partner credential
      try {
        const b2bRes = await api.b2bLogin(usernameOrUser, password);
        if (b2bRes && b2bRes.success && b2bRes.user) {
          user = b2bRes.user;
          try {
            localStorage.setItem('b2b_partner_user', JSON.stringify(user));
            localStorage.setItem('b2b_partner_token', b2bRes.token || user.id);
          } catch (e) {}
        }
      } catch (b2bErr) {
        // Fall back to standard login
      }

      if (!user) {
        const res = await api.loginUser(usernameOrUser, password);
        user = (res && res.user) ? res.user : res;
      }

      if (user && (user.id || user.username || user.role)) {
        setCurrentUser(user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {}
        setShowLoginModal(false);

        const { targetTab, targetPath } = resolveTargetRoute(user);
        setActiveTab(targetTab);
        window.history.pushState(null, '', targetPath);
        setCurrentPath(targetPath.toLowerCase());
        try { sessionStorage.setItem('tg_activeTab', targetTab); } catch (e) {}

        try {
          const [userBookings, userCars, userBikes, userUnits] = await Promise.all([
            api.fetchBookings().catch(() => []),
            api.fetchCars().catch(() => []),
            api.fetchBikes().catch(() => []),
            api.fetchVehicleUnits().catch(() => [])
          ]);
          if (Array.isArray(userBookings)) setBookingsList(userBookings);
          if (Array.isArray(userCars) && userCars.length > 0) setCars(userCars);
          if (Array.isArray(userBikes) && userBikes.length > 0) setBikes(userBikes);
          if (Array.isArray(userUnits) && userUnits.length > 0) setVehicleUnits(userUnits);
        } catch (be) {}
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleVendorLoginSuccess = async (user, destination) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user?.token) localStorage.setItem('auth_token', user.token);
    } catch (e) {}
    setActiveTab('portal');
    window.history.pushState(null, '', destination);
    setCurrentPath(destination.toLowerCase());
    try { sessionStorage.setItem('tg_activeTab', 'portal'); } catch (e) {}

    try {
      const [freshCars, freshBikes, freshUnits] = await Promise.all([
        api.fetchCars().catch(() => []),
        api.fetchBikes().catch(() => []),
        api.fetchVehicleUnits().catch(() => [])
      ]);
      if (Array.isArray(freshCars) && freshCars.length > 0) setCars(freshCars);
      if (Array.isArray(freshBikes) && freshBikes.length > 0) setBikes(freshBikes);
      if (Array.isArray(freshUnits) && freshUnits.length > 0) setVehicleUnits(freshUnits);
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBookingsList([]);
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('b2b_partner_token');
      localStorage.removeItem('b2b_partner_user');
      localStorage.removeItem('driverUser');
      sessionStorage.removeItem('tg_activeTab');
    } catch (e) {}
    setActiveTab('packages');
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
  };

  // Inventory CRUD handlers
  const handleAddPackage = async (newPkg) => {
    const res = await api.addPackage(newPkg);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
    return res;
  };

  const handleUpdatePackage = async (pkg) => {
    const res = await api.updatePackage(pkg);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
    return res;
  };

  const handleDeletePackage = async (pkgId) => {
    await api.deletePackage(pkgId);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
  };

  const handleAddHotel = async (hotelData) => {
    await api.addMasterHotel(hotelData);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const handleUpdateHotel = async (hotelData, extraData) => {
    const payload = (extraData && typeof extraData === 'object') ? { ...extraData, id: hotelData } : hotelData;
    await api.updateHotel(payload);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const handleDeleteHotel = async (hotelId) => {
    await api.deleteHotel(hotelId);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const refreshVehicleInventory = useCallback(async () => {
    try {
      const [freshCars, freshBikes, freshUnits] = await Promise.all([
        api.fetchCars().catch(() => []),
        api.fetchBikes().catch(() => []),
        api.fetchVehicleUnits().catch(() => [])
      ]);
      if (Array.isArray(freshCars)) setCars(freshCars);
      if (Array.isArray(freshBikes)) setBikes(freshBikes);
      if (Array.isArray(freshUnits)) setVehicleUnits(freshUnits);
    } catch (e) {
      console.warn('[Sync] Vehicle refresh failed:', e);
    }
  }, []);

  const handleAddCar = async (carData) => {
    const res = await api.addCar(carData);
    await refreshVehicleInventory();
    return res;
  };

  const handleUpdateCar = async (carData) => {
    await api.updateCar(carData);
    await refreshVehicleInventory();
  };

  const handleDeleteCar = async (carId) => {
    await api.deleteCar(carId);
    await refreshVehicleInventory();
  };

  const handleAddBike = async (bikeData) => {
    const res = await api.addBike(bikeData);
    await refreshVehicleInventory();
    return res;
  };

  const handleUpdateBike = async (bikeData) => {
    await api.updateBike(bikeData);
    await refreshVehicleInventory();
  };

  const handleDeleteBike = async (bikeId) => {
    await api.deleteBike(bikeId);
    await refreshVehicleInventory();
  };

  const handleAddVendor = async (v) => {
    await api.addVendor(v);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleUpdateVendor = async (v) => {
    await api.updateVendor(v);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleDeleteVendor = async (vId) => {
    await api.deleteVendor(vId);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleSetVendorPassword = async (vId, pwd) => {
    await api.setVendorPassword(vId, pwd);
  };

  const handleAddFlight = async (f) => {
    await api.addFlight(f);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleUpdateFlight = async (flightData, extraData) => {
    const payload = (extraData && typeof extraData === 'object') ? { ...extraData, id: flightData } : flightData;
    await api.updateFlight(payload);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleDeleteFlight = async (fId) => {
    await api.deleteFlight(fId);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleSaveMarkup = async (m) => {
    await api.saveMarkup(m);
    const fresh = await api.fetchMarkups();
    setMarkups(fresh);
  };

  const handleAddUser = async (u) => {
    try {
      const created = await api.superadminCreateUser(u);
      const userObj = created?.user || (created && created.username ? created : u);
      setUsersList(prev => [userObj, ...prev.filter(x => (x.username || '').toLowerCase() !== (u.username || '').toLowerCase() && (x.email || '').toLowerCase() !== (u.email || '').toLowerCase())]);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(x => 
          (x.username && x.username.toLowerCase() === userObj.username?.toLowerCase()) || 
          (x.email && x.email.toLowerCase() === userObj.email?.toLowerCase()) || 
          String(x.id) === String(userObj.id)
        );
        setUsersList(hasUser ? fresh : [userObj, ...fresh]);
      }
      return userObj;
    } catch (e) {
      console.warn('handleAddUser error:', e);
      const fallbackUser = { id: `u-${Date.now()}`, ...u, role: (u.role || 'admin').toLowerCase().trim(), status: u.status || 'active' };
      setUsersList(prev => [fallbackUser, ...prev.filter(x => (x.username || '').toLowerCase() !== (u.username || '').toLowerCase() && (x.email || '').toLowerCase() !== (u.email || '').toLowerCase())]);
      return fallbackUser;
    }
  };

  const handleUpdateUser = async (idOrUser, u) => {
    try {
      const payload = typeof idOrUser === 'object' ? idOrUser : { ...u, id: idOrUser };
      setUsersList(prev => prev.map(item => (String(item.id) === String(payload.id) || item.username === payload.username) ? { ...item, ...payload } : item));
      await api.superadminUpdateUser(payload);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setUsersList(fresh);
    } catch (e) {
      console.warn('handleUpdateUser error:', e);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setUsersList(prev => prev.filter(x => String(x.id) !== String(id)));
      await api.superadminDeleteUser(id);
      const fresh = await api.fetchUsers();
      if (fresh) setUsersList(fresh);
    } catch (e) {
      console.warn('handleDeleteUser error:', e);
    }
  };

  const handleSearchSubmit = (tab) => {
    setSearchTriggered(true);
    const targetTab = (typeof tab === 'string' && tab) ? tab : (typeof activeTab === 'string' ? activeTab : 'packages');
    handleTabChange(targetTab);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleConfirmBooking = async (e, paymentMethodId, extraDetails = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isBookingSubmitting) return;

    setShowSuccess(false);
    setLastConfirmedBooking(null);
    const cleanPhone = String(userPhone || '').replace(/\D/g, '');
    const cleanEmail = String(extraDetails.email || extraDetails.customer_email || userEmail || currentUser?.email || '').trim();
    if (!userName || cleanPhone.length < 10) {
      alert("Please enter your name and a valid 10-digit mobile phone number for booking confirmation & tracking.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      alert("Please enter a valid Gmail / Email address (e.g. name@gmail.com). Your booking confirmation and official trip voucher will be sent here.");
      return;
    }
    const pDate = extraDetails.pickupDate || pickupDate;
    const dDate = extraDetails.dropDate || dropDate;
    const val = validateBookingDates(pDate, dDate);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    setIsBookingSubmitting(true);
    try {
      const days = extraDetails.bookingDays || bookingDays || val.days || 1;
      const totalCost = extraDetails.total || ((selectedBookingItem.price || 0) * days);
      
      const isActivity = String(selectedBookingItem.id || '').startsWith('act-') || String(selectedBookingItem.id || '').startsWith('sight-') || selectedBookingItem.type === 'activity' || selectedBookingItem.type === 'sightseeing' || selectedBookingItem.item_type === 'activity' || selectedBookingItem.item_type === 'sightseeing';
      const isSelfDrivePkg = !isActivity && (selectedBookingItem.package_type === 'Self Drive Package' || selectedBookingItem.type === 'selfdrive' || (selectedBookingItem.name && selectedBookingItem.name.toLowerCase().includes('self drive')));
      const isTripPkg = !isActivity && !isSelfDrivePkg && (selectedBookingItem.package_type === 'Trip Package' || selectedBookingItem.type === 'package' || String(selectedBookingItem.id || '').startsWith('pkg-') || String(selectedBookingItem.id || '').startsWith('package-') || Boolean(selectedBookingItem.duration && !selectedBookingItem.seating && !selectedBookingItem.engine));
      const isHotel = !isActivity && (selectedBookingItem.type === 'hotel' || Boolean(selectedBookingItem.stars || selectedBookingItem.hotel_name));
      const isFlight = !isActivity && (selectedBookingItem.type === 'flight' || Boolean(selectedBookingItem.airline));
      const vType = normalizeVehicleType(selectedBookingItem);
      const isCar = !isActivity && !isTripPkg && !isSelfDrivePkg && (vType === 'car');
      const isBike = !isActivity && !isTripPkg && !isSelfDrivePkg && (vType === 'bike');

      let detectedType = 'selfdrive';
      let detectedPkgType = 'Self Drive Package';

      if (isActivity) {
        detectedType = (selectedBookingItem.type || selectedBookingItem.item_type || 'activity').toLowerCase();
        detectedPkgType = detectedType === 'sightseeing' ? 'Sightseeing' : 'Activity';
      } else if (isTripPkg) {
        detectedType = 'package';
        detectedPkgType = selectedBookingItem.package_type || 'Trip Package';
      } else if (isSelfDrivePkg) {
        detectedType = 'selfdrive';
        detectedPkgType = 'Self Drive Package';
      } else if (isHotel) {
        detectedType = 'hotel';
        detectedPkgType = 'Hotel Stay';
      } else if (isFlight) {
        detectedType = 'flight';
        detectedPkgType = 'Flight Booking';
      } else if (isCar) {
        detectedType = 'car';
        detectedPkgType = 'Car Rental';
      } else if (isBike) {
        detectedType = 'bike';
        detectedPkgType = 'Bike Rental';
      }
      
      const customerId = currentUser?.id || `c_${cleanPhone || Date.now()}`;
      const customerEmail = cleanEmail;

      const payload = {
        idempotency_key: extraDetails.idempotency_key || ('idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)),
        name: userName,
        customer_name: userName,
        phone: cleanPhone,
        customer_phone: cleanPhone,
        email: customerEmail,
        customer_email: customerEmail,
        customer_id: customerId,
        license: userLicense,
        pickup_loc: extraDetails.pickupLoc || pickupLoc || 'Goa Airport',
        pickup_location: extraDetails.pickupLoc || pickupLoc || 'Goa Airport',
        pickup_date: pDate,
        pickup_time: extraDetails.pickupTime || pickupTime || '10:00 AM',
        drop_date: dDate,
        drop_loc: extraDetails.drop_loc || extraDetails.dropLoc || dropLoc || null,
        drop_location: extraDetails.drop_location || extraDetails.dropLoc || dropLoc || null,
        drop_time: extraDetails.dropTime || dropTime || '10:00 AM',
        item_id: selectedBookingItem.id || 'custom',
        item_name: selectedBookingItem.name || selectedBookingItem.title || (isTripPkg ? 'Trip Package' : isActivity ? 'Goa Experience' : 'Trip Booking'),
        package_name: selectedBookingItem.name || selectedBookingItem.title || (isTripPkg ? 'Trip Package' : isActivity ? 'Goa Experience' : 'Self Drive Holiday'),
        package_type: detectedPkgType,
        type: detectedType,
        vehicle_name: isActivity ? '' : (selectedBookingItem.car_included || selectedBookingItem.name || (isTripPkg ? '' : 'Self Drive Vehicle')),
        vehicle_image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        booking_days: days,
        duration: isActivity ? (selectedBookingItem.duration || 'Flexible') : ((isTripPkg || isSelfDrivePkg) ? (selectedBookingItem.duration || `${days} Days / ${Math.max(1, days - 1)} Nights`) : `${days} Days`),
        total_members: extraDetails.total_members || extraDetails.guests || selectedBookingItem.guests || selectedBookingItem.totalMembers || 1,
        total_amount: totalCost,
        subtotal: typeof extraDetails.subtotal === 'number' ? extraDetails.subtotal : ((selectedBookingItem.price || 0) * days),
        tax: typeof extraDetails.tax === 'number' ? extraDetails.tax : 0,
        fee: typeof extraDetails.fee === 'number' ? extraDetails.fee : 0,
        amount_paid: typeof extraDetails.amount_paid === 'number' ? extraDetails.amount_paid : totalCost,
        total_paid: totalCost,
        date_of_birth: extraDetails.date_of_birth || '',
        wallet_amount_used: extraDetails.wallet_amount_used || 0,
        tier_discount_applied: extraDetails.tier_discount_applied || 0,
        customer_tier_at_booking: extraDetails.customer_tier_at_booking || 'New Member',
        customizations: extraDetails.customizations ? (typeof extraDetails.customizations === 'string' ? extraDetails.customizations : JSON.stringify(extraDetails.customizations)) : '',
        payment_method: paymentMethodId || 'Cash / Online',
        driver_required: extraDetails.driver_required ? 1 : 0,
        driver_service_type: extraDetails.driver_service_type || null,
        driver_charge: typeof extraDetails.driver_charge === 'number' ? extraDetails.driver_charge : 0,
        driver_days: typeof extraDetails.driver_days === 'number' ? extraDetails.driver_days : 0,
        driver_earning: typeof extraDetails.driver_earning === 'number' ? extraDetails.driver_earning : (extraDetails.driver_charge || 0),
        driver_pickup_enabled: extraDetails.driver_pickup_enabled ? 1 : 0,
        driver_pickup_date: extraDetails.driver_pickup_date || '',
        driver_pickup_time: extraDetails.driver_pickup_time || '',
        driver_pickup_loc: extraDetails.driver_pickup_loc || '',
        driver_drop_enabled: extraDetails.driver_drop_enabled ? 1 : 0,
        driver_drop_date: extraDetails.driver_drop_date || '',
        driver_drop_time: extraDetails.driver_drop_time || '',
        driver_drop_loc: extraDetails.driver_drop_loc || '',
        driver_fullday_enabled: extraDetails.driver_fullday_enabled ? 1 : 0,
        driver_fullday_start: extraDetails.driver_fullday_start || '',
        driver_fullday_end: extraDetails.driver_fullday_end || '',
        driver_fullday_days: extraDetails.driver_fullday_days || 0,
        driver_details: extraDetails.driver_details ? JSON.stringify(extraDetails.driver_details) : '',
        customer_payment: typeof extraDetails.customer_payment === 'number' ? extraDetails.customer_payment : totalCost,
        wow_goa_platform_fee: typeof extraDetails.wow_goa_platform_fee === 'number' ? extraDetails.wow_goa_platform_fee : Math.round(totalCost * 0.10),
        vendor_service_amount: typeof extraDetails.vendor_service_amount === 'number' ? extraDetails.vendor_service_amount : Math.round(totalCost * 0.90),
        payment_reference: extraDetails.payment_reference || '',
        payment_verification_status: extraDetails.payment_verification_status || (extraDetails.payment_reference ? 'Pending Verification' : 'Pending Verification'),
        vendor_payout_status: extraDetails.vendor_payout_status || 'Pending',
        cancellation_acknowledged: extraDetails.cancellation_acknowledged ? 1 : 0,
        vendor_id: extraDetails.vendor_id || selectedBookingItem.vendor_id || selectedBookingItem.vendorId || selectedBookingItem.admin_id || null,
        status: extraDetails.status || 'Pending'
      };

      const res = await api.createBooking(payload);
      const confirmedBooking = {
        ...payload,
        ...(res?.booking || {}),
        id: res?.booking_id || res?.id || res?.booking?.id || `WG${Math.floor(1000 + Math.random() * 9000)}`,
        booking_id: res?.booking_id || res?.id || res?.booking?.id,
        cashback_preview: res?.cashback_preview || res?.booking?.cashback_preview || null
      };
      
      setLastConfirmedBooking(confirmedBooking);

      // Set customer phone and local bookings for instant Customer Portal access
      try {
        sessionStorage.setItem('customer_login_phone', cleanPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
        localStorage.setItem('customer_login_phone', cleanPhone);
        localStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
        const existingLocal = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updatedLocal = [confirmedBooking, ...existingLocal.filter(b => String(b.id) !== String(confirmedBooking.id))];
        localStorage.setItem('local_bookings', JSON.stringify(updatedLocal));
      } catch (e) {}

      setShowSuccess(true);
      const freshBookings = await api.fetchBookings();
      setBookingsList(freshBookings);
    } catch (e) {
      alert(e.message || "Failed to submit booking. Please try again.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Authoritative Close Window & Teardown handler: clears selected item and confirmation state completely
  const handleCloseBookingModal = () => {
    setIsBookingSubmitting(false);
    setSelectedBookingItem(null);
    setShowSuccess(false);
    setLastConfirmedBooking(null);
    setUserPhone('');
    if (resetCountry) resetCountry();
  };

  if (isAuthHydrating) {
    return (
      <div className="d-flex w-100 vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-2" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
            <span className="visually-hidden">Loading session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="d-flex w-100 vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-dark font-heading tracking-wider">Starting WOW GOA Platform...</h4>
          <p className="text-muted small">Loading packages and verified inventory</p>
        </div>
      </div>
    );
  }

  // ─── DYNAMIC VENDOR STOREFRONT & TRACKER ROUTING (/v/:slug or /storefront/:slug) ────────────────
  if (path.startsWith('/v/') || path.startsWith('/storefront/')) {
    const cleanPath = path.startsWith('/v/') ? path.substring(3) : path.substring(12);
    const segments = cleanPath.split('/').filter(Boolean);
    const slug = segments[0] ? segments[0].split('?')[0] : '';
    const isTrack = segments[1] === 'track';
    return (
      <>
        <PublicVendorStorefrontPage
          slug={slug}
          initialShowTracker={isTrack}
          onBook={(item) => handleOpenBooking(item)}
          onNavigateHome={() => {
            window.history.pushState(null, '', '/');
            setCurrentPath('/');
            handleTabChange('selfdrive');
          }}
        />

        {/* Dynamic Storefront Checkout Modals */}
        {selectedBookingItem && (
          (String(selectedBookingItem?.id).startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars || selectedBookingItem.type === 'hotel') ? (
            <HotelBookingModal
              selectedBookingItem={selectedBookingItem}
              setSelectedBookingItem={setSelectedBookingItem}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookingDays={bookingDays}
            />
          ) : (
            <BookingModal
              key={selectedBookingItem ? `${selectedBookingItem.id || selectedBookingItem.name}_${lastConfirmedBooking?.id || 'new'}` : 'closed'}
              selectedBookingItem={selectedBookingItem}
              setSelectedBookingItem={setSelectedBookingItem}
              onCloseModal={handleCloseBookingModal}
              showSuccess={Boolean(showSuccess && lastConfirmedBooking)}
              setShowSuccess={setShowSuccess}
              userName={userName}
              setUserName={setUserName}
              userPhone={userPhone}
              setUserPhone={setUserPhone}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              userLicense={userLicense}
              setUserLicense={setUserLicense}
              pickupLoc={pickupLoc}
              dropLoc={dropLoc}
              setDropLoc={setDropLoc}
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              dropDate={dropDate}
              dropTime={dropTime}
              bookingDays={bookingDays}
              handleConfirmBooking={handleConfirmBooking}
              lastConfirmedBooking={lastConfirmedBooking}
              setLastConfirmedBooking={setLastConfirmedBooking}
              allPackages={packages}
              allCars={cars}
              allBikes={bikes}
            />
          )
        )}
      </>
    );
  }

  // ─── B2B TRAVEL AGENT / PARTNER PORTAL ROUTING ────────────────────────────
  if (path.startsWith('/b2b') || path === '/register' || path.startsWith('/vendor/register') || activeTab === 'b2b') {
    return (
      <B2BPortalPage
        activities={activities}
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
      />
    );
  }

  // ─── DRIVER PORTAL ROUTING ────────────────────────────────────────────────
  if (path.startsWith('/driver') || currentUser?.role === 'driver' || activeTab === 'driver') {
    if (!currentUser || currentUser.role !== 'driver') {
      return (
        <DriverLoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
            setActiveTab('driver');
            window.history.pushState(null, '', '/driver');
          }}
          onNavigateHome={() => {
            handleTabChange('selfdrive');
          }}
        />
      );
    }
    return (
      <DriverPortalPage
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
      />
    );
  }

  // ─── CUSTOMER PORTAL & DASHBOARD ─────────────────────────────────────────
  if (path.startsWith('/customer') || activeTab === 'customer') {
    return (
      <CustomerPortalPage
        currentUser={currentUser}
        onLogout={handleLogout}
        bookings={bookings}
        packages={packages}
        cars={cars}
        bikes={bikes}
        hotels={hotels}
        flights={flights}
        activities={activities}
        markups={markups}
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
        onViewDetails={(item) => handleOpenDetails(item, item?.type || 'activity', 'customer')}
      />
    );
  }

  // ─── ADMIN / SUPERADMIN / VENDOR / SUBADMIN PORTALS ───────────────────────
  if (activeTab === 'portal' || path.startsWith('/admin') || path === '/portal' || path.startsWith('/sub-admin') || path.startsWith('/subadmin') || path.startsWith('/superadmin') || path.startsWith('/super-admin') || path === '/vendor' || path === '/hotel-vendor' || path === '/flight-vendor' || path === '/vehicle/login' || path === '/hotel/login' || path === '/flight/login' || ((currentUser?.role === 'subadmin' || currentUser?.role === 'sub_admin') && (path === '/portal' || activeTab === 'portal'))) {
    // ── Dedicated Vendor Login Routes ─────────────────────────────────────────
    if (path === '/vehicle/login') {
      if (currentUser && (currentUser.role === 'vendor' || currentUser.role === 'vehicle_vendor')) {
        window.history.replaceState(null, '', '/vendor');
        setCurrentPath('/vendor');
      } else {
        return (
          <VendorLoginPage
            vendorType="vehicle"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
    }

    if (path === '/hotel/login') {
      if (currentUser && currentUser.role === 'hotel_vendor') {
        window.history.replaceState(null, '', '/hotel-vendor');
        setCurrentPath('/hotel-vendor');
      } else {
        return (
          <VendorLoginPage
            vendorType="hotel"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/hotel-vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=hotel_vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
    }

    if (path === '/flight/login') {
      if (currentUser && currentUser.role === 'flight_vendor') {
        window.history.replaceState(null, '', '/flight-vendor');
        setCurrentPath('/flight-vendor');
      } else {
        return (
          <VendorLoginPage
            vendorType="flight"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/flight-vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=flight_vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
    }

    // Superadmin route guard
    if (path.startsWith('/superadmin') || path.startsWith('/super-admin') || (currentUser?.role === 'superadmin' && (path === '/portal' || activeTab === 'portal'))) {
      if (!currentUser || currentUser.role !== 'superadmin') {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <SuperAdminPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            usersList={usersList}
            vendors={vendors}
            cars={cars}
            bikes={bikes}
            hotels={hotels}
            bookings={bookings}
            vehicleUnits={vehicleUnits}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
            allPackages={packages}
            onAddPackage={handleAddPackage}
            onUpdatePackage={handleUpdatePackage}
            onDeletePackage={handleDeletePackage}
            flights={flights}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // SubAdmin route guard
    if (path.startsWith('/sub-admin') || path.startsWith('/subadmin') || ((currentUser?.role === 'subadmin' || currentUser?.role === 'sub_admin') && (path === '/portal' || activeTab === 'portal'))) {
      return (
        <>
          <SubAdminPortalPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              try { localStorage.setItem('currentUser', JSON.stringify(u)); } catch (e) {}
            }}
            usersList={usersList}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Hotel Vendor route guard
    if (path === '/hotel-vendor' || (currentUser?.role === 'hotel_vendor' && (path === '/portal' || path === '/hotel-vendor'))) {
      if (!currentUser) {
        return (
          <VendorLoginPage
            vendorType="hotel"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/hotel-vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=hotel_vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
      if (currentUser.role !== 'hotel_vendor' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        return (
          <RoleAccessDeniedModal
            currentUser={currentUser}
            expectedRole="Hotel Vendor"
            onLogout={handleLogout}
            onNavigateHome={() => handleTabChange('selfdrive')}
          />
        );
      }
      return (
        <>
          <HotelVendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            hotels={hotels}
            onAddHotel={handleAddHotel}
            onUpdateHotel={handleUpdateHotel}
            onDeleteHotel={handleDeleteHotel}
            onLogout={handleLogout}
            bookings={bookings}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Flight Vendor route guard
    if (path === '/flight-vendor' || (currentUser?.role === 'flight_vendor' && (path === '/portal' || path === '/flight-vendor'))) {
      if (!currentUser) {
        return (
          <VendorLoginPage
            vendorType="flight"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/flight-vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=flight_vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
      if (currentUser.role !== 'flight_vendor' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        return (
          <RoleAccessDeniedModal
            currentUser={currentUser}
            expectedRole="Flight Vendor"
            onLogout={handleLogout}
            onNavigateHome={() => handleTabChange('selfdrive')}
          />
        );
      }
      return (
        <>
          <FlightVendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            flights={flights}
            onAddFlight={handleAddFlight}
            onUpdateFlight={handleUpdateFlight}
            onDeleteFlight={handleDeleteFlight}
            onLogout={handleLogout}
            bookings={bookings}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Vehicle Vendor route guard
    if (path === '/vendor' || ((currentUser?.role === 'vendor' || currentUser?.role === 'vehicle_vendor') && (path === '/portal' || path === '/vendor'))) {
      if (!currentUser) {
        return (
          <VendorLoginPage
            vendorType="vehicle"
            onLoginSuccess={(u) => handleVendorLoginSuccess(u, '/vendor')}
            onNavigateHome={() => handleTabChange('selfdrive')}
            onNavigateRegister={() => {
              handleTabChange('b2b');
              window.history.pushState(null, '', '/b2b/register?vendor=vendor');
              setCurrentPath('/b2b/register');
            }}
          />
        );
      }
      if (currentUser.role !== 'vendor' && currentUser.role !== 'vehicle_vendor' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        return (
          <RoleAccessDeniedModal
            currentUser={currentUser}
            expectedRole="Vehicle Vendor"
            onLogout={handleLogout}
            onNavigateHome={() => handleTabChange('selfdrive')}
          />
        );
      }
      return (
        <>
          <VendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            vendors={vendors}
            cars={cars}
            bikes={bikes}
            onAddCar={handleAddCar}
            onAddBike={handleAddBike}
            onUpdateCar={handleUpdateCar}
            onUpdateBike={handleUpdateBike}
            onDeleteCar={handleDeleteCar}
            onDeleteBike={handleDeleteBike}
            onLogout={handleLogout}
            bookings={bookings}
            vehicleUnits={vehicleUnits}
            setBookingsList={setBookingsList}
            onRefreshVehicles={refreshVehicleInventory}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }

    // Admin Portal — authentication & role guards
    if (!currentUser) {
      return (
        <div className="d-flex flex-column min-vh-100 bg-dark align-items-center justify-content-center p-4">
          <LoginModal
            isOpen={true}
            onClose={() => {
              handleTabChange('selfdrive');
            }}
            onLogin={handleLogin}
          />
        </div>
      );
    }

    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      if (currentUser.role === 'customer' || currentUser.role === 'user') {
        handleTabChange('dashboard');
      } else if (currentUser.role === 'vendor' || currentUser.role === 'hotel_vendor' || currentUser.role === 'flight_vendor') {
        handleTabChange('portal');
      } else if (currentUser.role === 'driver') {
        handleTabChange('driver');
      } else if (currentUser.role === 'b2b' || currentUser.role === 'agent') {
        handleTabChange('b2b');
      } else {
        handleTabChange('selfdrive');
      }
      return null;
    }

    // Default to Admin Portal (for admin role or login prompt)
    return (
      <>
        <AdminPortalPage
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          vendors={vendors}
          allPackages={packages}
          cars={cars}
          bikes={bikes}
          onAddVendor={handleAddVendor}
          onUpdateVendor={handleUpdateVendor}
          onDeleteVendor={handleDeleteVendor}
          onSetVendorPassword={handleSetVendorPassword}
          onAddPackage={handleAddPackage}
          onUpdatePackage={handleUpdatePackage}
          onDeletePackage={handleDeletePackage}
          onAddCar={handleAddCar}
          onUpdateCar={handleUpdateCar}
          onDeleteCar={handleDeleteCar}
          onAddBike={handleAddBike}
          onUpdateBike={handleUpdateBike}
          onDeleteBike={handleDeleteBike}
          onLogout={handleLogout}
          flights={flights}
          onAddFlight={handleAddFlight}
          onUpdateFlight={handleUpdateFlight}
          onDeleteFlight={handleDeleteFlight}
          hotels={hotels}
          onAddHotel={handleAddHotel}
          onUpdateHotel={handleUpdateHotel}
          onDeleteHotel={handleDeleteHotel}
          markups={markups}
          onSaveMarkup={handleSaveMarkup}
          bookings={bookings}
          usersList={usersList}
          vehicleUnits={vehicleUnits}
        />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      </>
    );
  }

  // ─── CUSTOMER DASHBOARD ──────────────────────────────────────────────────
  if (activeTab === 'dashboard' || path.startsWith('/dashboard')) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <CustomerDashboard
          currentUser={currentUser}
          bookings={bookings}
          onOpenLogin={() => setShowLoginModal(true)}
        />
        <Footer setActiveTab={handleTabChange} />
      </div>
    );
  }

  // ─── CRAFT MY TRIP STANDALONE VIEW ───────────────────────────────────────
  if (path.startsWith('/craft') || activeTab === 'craftmytrip') {
    return (
      <div className="d-flex flex-column min-vh-100 bg-white">
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <CraftMyTripPage
          allCars={cars}
          allBikes={bikes}
          allHotels={hotels}
          allActivities={activities}
          pickupDate={pickupDate}
          dropDate={dropDate}
          setPickupDate={setPickupDate}
          setDropDate={setDropDate}
          bookings={bookings}
          onBack={() => handleTabChange('selfdrive')}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Footer setActiveTab={handleTabChange} />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        {/* Floating Sophia AI Assistant available on Craft My Trip */}
        <AIChatbot />
      </div>
    );
  }

  // ─── MAIN PUBLIC STOREFRONT VIEW ──────────────────────────────────────────
  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      {/* Public Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        triggerOpenLogin={() => setShowLoginModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Hero and Search Widget Container */}
      <Hero />
      <SearchWidget
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pickupLoc={pickupLoc} 
        setPickupLoc={setPickupLoc} 
        dropLoc={dropLoc} 
        setDropLoc={setDropLoc} 
        pickupDate={pickupDate} 
        setPickupDate={setPickupDate} 
        dropDate={dropDate}
        setDropDate={setDropDate}
        pickupTime={pickupTime} 
        setPickupTime={setPickupTime} 
        dropTime={dropTime} 
        setDropTime={setDropTime} 
        handleSearchSubmit={handleSearchSubmit} 
        setSearchTriggered={setSearchTriggered}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hotelRooms={hotelRooms}
        setHotelRooms={setHotelRooms}
        hotelAdults={hotelAdults}
        setHotelAdults={setHotelAdults}
        hotelChildren={hotelChildren}
        setHotelChildren={setHotelChildren}
        hotelPriceRange={hotelPriceRange}
        setHotelPriceRange={setHotelPriceRange}
        flightAdults={flightAdults}
        setFlightAdults={setFlightAdults}
        flightChildren={flightChildren}
        setFlightChildren={setFlightChildren}
        flightInfants={flightInfants}
        setFlightInfants={setFlightInfants}
        flightClass={flightClass}
        setFlightClass={setFlightClass}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
      />

      {/* Dynamic Results & Content Section */}
      <main className="py-5" id="results-section" style={{ scrollMarginTop: '80px', minHeight: '80vh' }}>
        <div className="container">
          <div className="tab-slide-enter">
          
          {activeTab === 'packages' && (
            <>
              <SelfDrivePage
                packageFilterDuration={packageFilterDuration}
                setPackageFilterDuration={setPackageFilterDuration}
                handleOpenBooking={handleOpenBooking}
                onViewDetails={(item) => handleOpenDetails(item, 'package', 'packages')}
                packages={packages.filter(p => p.package_type !== 'Self Drive Package').length > 0
                  ? packages.filter(p => p.package_type !== 'Self Drive Package')
                  : packages}
                searchQuery={dropLoc || searchQuery}
                onClearSearch={() => { setDropLoc(''); setSearchQuery(''); }}
                markups={markups}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
              />
              <DynamicFeaturedHotels
                hotels={hotels}
                onBookHotel={handleOpenHotelBooking}
                onViewHotel={(hotel) => handleOpenDetails(hotel, 'hotel')}
                onBook={handleOpenHotelBooking}
                onViewDetails={(hotel) => handleOpenDetails(hotel, 'hotel')}
              />
              <DynamicFeaturedVehicles
                cars={cars}
                bikes={bikes}
                markups={markups}
                onBookVehicle={handleOpenBooking}
                onViewVehicle={(veh) => handleOpenDetails(veh, normalizeVehicleType(veh))}
                onBook={handleOpenBooking}
                onViewDetails={(veh) => handleOpenDetails(veh, normalizeVehicleType(veh))}
              />
              <FeaturesGrid />
            </>
          )}

          {activeTab === 'selfdrive' && (
            <>
              {/* Primary Showcase: 3-Category Self Drive Layout (Two Wheelers, Four Wheelers, Luxury Cars) */}
              <SelfDriveCategoryShowcase
                cars={cars}
                bikes={bikes}
                markups={markups}
                onBookVehicle={handleOpenBooking}
                onViewVehicle={(veh) => {
                  const vType = normalizeVehicleType(veh);
                  handleOpenDetails(veh, vType, 'selfdrive');
                }}
                setActiveTab={handleTabChange}
                searchQuery={dropLoc || searchQuery}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
              />

              {/* Self Drive Tour Itineraries & Bundles */}
              <SelfDrivePage
                packageFilterDuration={packageFilterDuration}
                setPackageFilterDuration={setPackageFilterDuration}
                handleOpenBooking={handleOpenBooking}
                onViewDetails={(item) => handleOpenDetails(item, 'package', 'selfdrive')}
                packages={packages.filter(p => p.package_type === 'Self Drive Package').length > 0
                  ? packages.filter(p => p.package_type === 'Self Drive Package')
                  : packages}
                searchQuery={dropLoc || searchQuery}
                onClearSearch={() => { setDropLoc(''); setSearchQuery(''); }}
                markups={markups}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
              />
              <FeaturesGrid />
            </>
          )}

          {activeTab === 'cars' && (
            <CarsPage
              carFilterFuel={carFilterFuel}
              setCarFilterFuel={setCarFilterFuel}
              carFilterTrans={carFilterTrans}
              setCarFilterTrans={setCarFilterTrans}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'car', 'cars')}
              cars={cars}
              pickupDate={pickupDate}
              dropDate={dropDate}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'bikes' && (
            <BikesPage
              bikeFilterType={bikeFilterType}
              setBikeFilterType={setBikeFilterType}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'bike', 'bikes')}
              bikes={bikes}
              pickupDate={pickupDate}
              dropDate={dropDate}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'custom-trip' && (
            <CustomTripEnquiryPage 
              setActiveTab={setActiveTab} 
              currentUser={currentUser} 
              prefilledPackage={enquiryPrefillPackage}
              onClearPrefilledPackage={() => setEnquiryPrefillPackage(null)}
            />
          )}

          {activeTab === 'customize' && (
            <PackageCustomizationPage 
              pkg={selectedBookingItem}
              allCars={cars}
              allBikes={bikes}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookings={bookings}
              markups={markups}
              onBack={() => {
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                  document.activeElement.blur();
                }
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                try {
                  sessionStorage.removeItem('tg_customization_step');
                } catch (e) {}

                // Return to the SAME Package Details page!
                if (selectedBookingItem) {
                  setSelectedDetailItem(selectedBookingItem);
                  setActiveTab('package-details');
                  try {
                    sessionStorage.setItem('tg_activeTab', 'package-details');
                    sessionStorage.setItem('tg_selectedDetailItem', JSON.stringify(selectedBookingItem));
                  } catch (e) {}
                  const isSelfDrivePkg = selectedBookingItem.package_type === 'Self Drive Package' || (selectedBookingItem.name && selectedBookingItem.name.toLowerCase().includes('self drive'));
                  const basePath = isSelfDrivePkg ? '/self-drive' : '/packages';
                  const targetUrl = selectedBookingItem.id ? `${basePath}?package=${encodeURIComponent(selectedBookingItem.id)}` : basePath;
                  window.history.pushState({}, '', targetUrl);
                  setCurrentPath(targetUrl);
                } else {
                  const origin = sessionStorage.getItem('tg_detailOriginTab') || 'packages';
                  setActiveTab(origin);
                }
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onConfirmBooking={(createdRecord) => {
                try {
                  sessionStorage.removeItem('tg_customization_step');
                  sessionStorage.removeItem('tg_customization_draft');
                } catch (e) {}
                api.fetchBookings().then(fresh => {
                  if (Array.isArray(fresh) && fresh.length > 0) setBookingsList(fresh);
                }).catch(console.error);
              }}
            />
          )}

          {activeTab === 'hotels' && (
            <HotelsPage
              hotelFilterStars={hotelFilterStars}
              setHotelFilterStars={setHotelFilterStars}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'hotel')}
              hotels={hotels}
              searchQuery={searchQuery}
              searchTriggered={searchTriggered}
              setSearchTriggered={setSearchTriggered}
              pickupLoc={pickupLoc || dropLoc || 'Goa'}
              pickupDate={pickupDate}
              dropDate={dropDate}
              hotelAdults={hotelAdults}
              hotelPriceRange={hotelPriceRange}
              setHotelPriceRange={setHotelPriceRange}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'hotel-details' && selectedDetailItem && (
            <HotelDetailsPage
              hotel={selectedDetailItem}
              pickupDate={pickupDate}
              dropDate={dropDate}
              nights={
                (pickupDate && dropDate)
                  ? Math.max(1, Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)))
                  : (bookingDays || 1)
              }
              onBack={() => {
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                  document.activeElement.blur();
                }
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                setSelectedDetailItem(null);
                setActiveTab('hotels');
                try {
                  sessionStorage.removeItem('tg_selectedDetailItem');
                  sessionStorage.setItem('tg_activeTab', 'hotels');
                } catch (e) {}
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onBook={handleOpenHotelBooking}
            />
          )}

          {activeTab === 'car-details' && selectedDetailItem && (
            <CarDetailsPage
              car={selectedDetailItem}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookingDays={
                (pickupDate && dropDate)
                  ? Math.max(1, Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)))
                  : (bookingDays || 2)
              }
              onBack={() => {
                if (document.activeElement?.blur) document.activeElement.blur();
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                const origin = sessionStorage.getItem('tg_detailOriginTab') || detailOriginTab || 'cars';
                const returnTab = origin === 'selfdrive' ? 'selfdrive' : 'cars';
                setSelectedDetailItem(null);
                setActiveTab(returnTab);
                try {
                  sessionStorage.removeItem('tg_selectedDetailItem');
                  sessionStorage.setItem('tg_activeTab', returnTab);
                } catch (e) {}
                const targetPath = returnTab === 'selfdrive' ? '/selfdrive' : '/cars';
                window.history.pushState({}, '', targetPath);
                setCurrentPath(targetPath);
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onBook={(carItem) => {
                handleOpenBooking(carItem || selectedDetailItem);
              }}
            />
          )}

          {activeTab === 'bike-details' && selectedDetailItem && (
            <BikeDetailsPage
              bike={selectedDetailItem}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookingDays={
                (pickupDate && dropDate)
                  ? Math.max(1, Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)))
                  : (bookingDays || 2)
              }
              onBack={() => {
                if (document.activeElement?.blur) document.activeElement.blur();
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                const origin = sessionStorage.getItem('tg_detailOriginTab') || detailOriginTab || 'bikes';
                const returnTab = origin === 'selfdrive' ? 'selfdrive' : 'bikes';
                setSelectedDetailItem(null);
                setActiveTab(returnTab);
                try {
                  sessionStorage.removeItem('tg_selectedDetailItem');
                  sessionStorage.setItem('tg_activeTab', returnTab);
                } catch (e) {}
                const targetPath = returnTab === 'selfdrive' ? '/selfdrive' : '/bikes';
                window.history.pushState({}, '', targetPath);
                setCurrentPath(targetPath);
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onBook={(bikeItem) => {
                handleOpenBooking(bikeItem || selectedDetailItem);
              }}
            />
          )}

          {activeTab === 'vehicle-details' && selectedDetailItem && (
            <VehicleDetailsPage
              vehicle={selectedDetailItem}
              type={selectedDetailItem.seating ? 'car' : 'bike'}
              onBack={() => {
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                  document.activeElement.blur();
                }
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                const returnTab = selectedDetailItem.seating ? 'cars' : 'bikes';
                setSelectedDetailItem(null);
                setActiveTab(returnTab);
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onBook={handleOpenBooking}
            />
          )}

          {activeTab === 'package-details' && selectedDetailItem && (
            <PackageDetailsPage
              pkg={selectedDetailItem}
              markups={markups}
              onBack={() => {
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                  document.activeElement.blur();
                }
                const sec = document.getElementById('results-section');
                if (sec && sec.offsetHeight > 0) {
                  sec.style.minHeight = `${sec.offsetHeight}px`;
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (sec) sec.style.minHeight = '';
                    });
                  });
                }
                const origin = sessionStorage.getItem('tg_detailOriginTab') || detailOriginTab || (selectedDetailItem.package_type === 'Self Drive Package' ? 'selfdrive' : 'packages');
                const returnTab = origin === 'selfdrive' ? 'selfdrive' : 'packages';
                setSelectedDetailItem(null);
                setActiveTab(returnTab);
                try {
                  sessionStorage.removeItem('tg_selectedDetailItem');
                  sessionStorage.setItem('tg_activeTab', returnTab);
                } catch (e) {}
                const targetPath = returnTab === 'selfdrive' ? '/self-drive' : '/packages';
                window.history.pushState({}, '', targetPath);
                setCurrentPath(targetPath);
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              onBook={handleOpenBooking}
              allCars={cars}
              allHotels={hotels}
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              onConfirmBooking={(createdRecord) => {
                api.fetchBookings().then(fresh => {
                  if (Array.isArray(fresh) && fresh.length > 0) setBookingsList(fresh);
                }).catch(console.error);
              }}
              onEnquire={(pkgItem, dates) => {
                const prefilled = {
                  ...pkgItem,
                  ...(dates?.departureDate ? { departureDate: dates.departureDate, pickupDate: dates.departureDate } : {}),
                  ...(dates?.returnDate ? { returnDate: dates.returnDate, dropDate: dates.returnDate } : {})
                };
                setEnquiryPrefillPackage(prefilled);
                setActiveTab('custom-trip');
                try { sessionStorage.setItem('tg_activeTab', 'custom-trip'); } catch (e) {}
                window.history.pushState({}, '', '/custom-trip');
                setCurrentPath('/custom-trip');
                setTimeout(() => {
                  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
            />
          )}

          {activeTab === 'flights' && (
            <FlightsPage
              searchQuery={searchQuery}
              searchTriggered={searchTriggered}
              setSearchTriggered={setSearchTriggered}
              pickupLoc={pickupLoc}
              dropLoc={dropLoc}
              pickupDate={pickupDate}
              flightAdults={flightAdults}
              flightChildren={flightChildren}
              flightInfants={flightInfants}
              flightClass={flightClass}
              onViewDetails={(flight) => handleOpenDetails(flight, 'flight')}
              onSelectFlight={(flight) => handleOpenDetails(flight, 'flight')}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'flight-details' && (
            selectedDetailItem ? (
              <FlightDetailsPage
                flight={selectedDetailItem}
                flightAdults={flightAdults}
                flightChildren={flightChildren}
                flightInfants={flightInfants}
                flightClass={flightClass}
                pickupDate={pickupDate}
                onBack={() => {
                  if (document.activeElement?.blur) document.activeElement.blur();
                  const sec = document.getElementById('results-section');
                  if (sec && sec.offsetHeight > 0) {
                    sec.style.minHeight = `${sec.offsetHeight}px`;
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        if (sec) sec.style.minHeight = '';
                      });
                    });
                  }
                  setSelectedDetailItem(null);
                  setActiveTab('flights');
                  try {
                    sessionStorage.removeItem('tg_selectedDetailItem');
                    sessionStorage.setItem('tg_activeTab', 'flights');
                  } catch (e) {}
                  window.history.pushState({}, '', '/flights');
                  setCurrentPath('/flights');
                  setTimeout(() => {
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                onBook={(flightItem) => {
                  handleOpenBooking(flightItem || selectedDetailItem);
                }}
              />
            ) : (
              <div className="container py-5 text-center bg-white rounded shadow-sm my-4">
                <div className="spinner-border text-primary mb-3" role="status" />
                <h5 className="fw-bold">Loading flight details...</h5>
                <p className="text-muted small">Please wait while we retrieve the latest flight details.</p>
                <button 
                  className="btn btn-outline-primary btn-sm rounded-pill mt-2"
                  onClick={() => {
                    setActiveTab('flights');
                    window.history.pushState({}, '', '/flights');
                    setCurrentPath('/flights');
                  }}
                >
                  Return to Flights
                </button>
              </div>
            )
          )}

          {activeTab === 'flight-booking' && selectedFlightOffer && (
            <FlightBookingFlow 
              offer={selectedFlightOffer} 
              onBack={() => {
                setSelectedFlightOffer(null);
                setActiveTab('flights');
              }}
              onComplete={() => {}}
            />
          )}

          {activeTab === 'explore' && (
            <ExplorePage 
              destinations={destinations} 
              onSelectDestination={(dest) => { 
                setDropLoc(dest.name); 
                setActiveTab('packages'); 
              }} 
            />
          )}

          {activeTab === 'ai-planner' && (
            <AIPlannerPage onNavigate={(t) => setActiveTab(t)} />
          )}

          {activeTab === 'activities' && (
            <div>
              {/* ── Sightseeing & Activities Public Storefront ── */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="rounded-3 p-2 text-white d-flex align-items-center justify-content-center fs-4" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1E3E62 100%)', width: 44, height: 44 }}>
                  🎯
                </div>
                <div>
                  <h2 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '26px' }}>Sightseeing & Activities</h2>
                  <p className="text-muted text-xs mb-0">Curated experiences — heritage trails, water sports &amp; adventure in Goa</p>
                </div>
              </div>
              <CustomerActivitiesTab
                activities={activities}
                bookings={bookings}
                currentUser={currentUser}
                onOpenBookingDetails={() => {}}
                onNavigateTab={handleTabChange}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onViewDetails={(item) => handleOpenDetails(item, item.type || 'activity', 'activities')}
                initialBookingItem={pendingActivityBooking}
                onClearInitialBooking={() => setPendingActivityBooking(null)}
              />
            </div>
          )}

          {activeTab === 'activity-details' && (
            selectedDetailItem ? (
              <ActivityDetailsPage
                activity={selectedDetailItem}
                onBack={() => {
                  if (document.activeElement?.blur) document.activeElement.blur();
                  const sec = document.getElementById('results-section');
                  if (sec && sec.offsetHeight > 0) {
                    sec.style.minHeight = `${sec.offsetHeight}px`;
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        if (sec) sec.style.minHeight = '';
                      });
                    });
                  }
                  const origin = sessionStorage.getItem('tg_detailOriginTab') || detailOriginTab || 'activities';
                  const returnTab = origin === 'customer' ? 'customer' : 'activities';
                  setSelectedDetailItem(null);
                  setActiveTab(returnTab);
                  try {
                    sessionStorage.removeItem('tg_selectedDetailItem');
                    sessionStorage.setItem('tg_activeTab', returnTab);
                  } catch (e) {}
                  const targetPath = returnTab === 'customer' ? '/customer' : '/activities';
                  window.history.pushState({}, '', targetPath);
                  setCurrentPath(targetPath);
                  setTimeout(() => {
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                onBook={(itemToBook) => {
                  setPendingActivityBooking(itemToBook || selectedDetailItem);
                  setActiveTab('activities');
                  window.history.pushState({}, '', '/activities');
                  setCurrentPath('/activities');
                  setTimeout(() => {
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              />
            ) : (
              <div className="container py-5 text-center bg-white rounded shadow-sm my-4">
                <div className="spinner-border text-warning mb-3" role="status" />
                <h5 className="fw-bold">Loading experience details...</h5>
                <p className="text-muted small">Please wait while we retrieve the latest experience details.</p>
                <button 
                  className="btn btn-outline-dark btn-sm rounded-pill mt-2"
                  onClick={() => {
                    setActiveTab('activities');
                    window.history.pushState({}, '', '/activities');
                    setCurrentPath('/activities');
                  }}
                >
                  Return to Sightseeing & Activities
                </button>
              </div>
            )
          )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleTabChange} />

      {/* Booking Checkout Modal */}
      {activeTab !== 'customize' && selectedBookingItem && (
        (String(selectedBookingItem?.id).startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars || selectedBookingItem.type === 'hotel' || activeTab === 'hotels' || activeTab === 'hotel-details') ? (
          <HotelBookingModal
            selectedBookingItem={selectedBookingItem}
            setSelectedBookingItem={setSelectedBookingItem}
            pickupDate={pickupDate}
            dropDate={dropDate}
            bookingDays={bookingDays}
          />
        ) : (
          <BookingModal
            key={selectedBookingItem ? `${selectedBookingItem.id || selectedBookingItem.name}_${lastConfirmedBooking?.id || 'new'}` : 'closed'}
            selectedBookingItem={selectedBookingItem}
            setSelectedBookingItem={setSelectedBookingItem}
            onCloseModal={handleCloseBookingModal}
            showSuccess={Boolean(showSuccess && lastConfirmedBooking)}
            setShowSuccess={setShowSuccess}
            userName={userName}
            setUserName={setUserName}
            userPhone={userPhone}
            setUserPhone={setUserPhone}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            userLicense={userLicense}
            setUserLicense={setUserLicense}
            pickupLoc={pickupLoc}
            dropLoc={dropLoc}
            setDropLoc={setDropLoc}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            dropDate={dropDate}
            dropTime={dropTime}
            bookingDays={bookingDays}
            handleConfirmBooking={handleConfirmBooking}
            lastConfirmedBooking={lastConfirmedBooking}
            setLastConfirmedBooking={setLastConfirmedBooking}
            allPackages={packages}
            allCars={cars}
            allBikes={bikes}
          />
        )
      )}

      {/* Package Details Interactive Modal */}
      <PackageDetailsModal
        pkg={selectedPackageModal}
        isOpen={Boolean(selectedPackageModal)}
        onClose={() => setSelectedPackageModal(null)}
        onBook={(pkg) => {
          setSelectedPackageModal(null);
          handleOpenBooking(pkg, false);
        }}
      />

      {/* Role-Based Authentication Sign-In Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* Floating AI Chatbot & Widgets */}
      {activeTab !== 'portal' && <WhatsAppWidget />}
      <AIChatbot />
      <PopupRenderer popups={liveConfig?.popups || []} onAction={() => {}} />
    </div>
  );
}
