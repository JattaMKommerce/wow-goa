import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  CarTaxiFront,
  Hotel, 
  MapPin, 
  Compass, 
  ChevronDown, 
  Wand2, 
  Calendar as CalendarIcon, 
  Users, 
  SlidersHorizontal, 
  X, 
  Check, 
  Navigation, 
  Loader2, 
  Search as SearchIcon, 
  ChevronLeft,
  ChevronRight,
  Plane,
  AlertCircle,
  Binoculars
} from 'lucide-react';
import { getTodayDateStr, getNextDayDateStr, validateBookingDates } from '../utils/dateUtils';
import UnifiedFilterPopover, { countActiveTabFilters } from './common/UnifiedFilterPopover';

// ─── STATIC DATASETS ──────────────────────────────────────────────────────────

const POPULAR_FROM_CITIES = [
  { city: 'Hubli', state: 'Karnataka', country: 'India', code: 'HBX' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', code: 'BLR' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', code: 'BOM' },
  { city: 'Delhi', state: 'Delhi NCR', country: 'India', code: 'DEL' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', code: 'HYD' },
  { city: 'Pune', state: 'Maharashtra', country: 'India', code: 'PNQ' },
  { city: 'Goa', state: 'Goa', country: 'India', code: 'GOI' },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', code: 'MAA' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', code: 'CCU' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', code: 'AMD' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', code: 'JAI' },
  { city: 'Kochi', state: 'Kerala', country: 'India', code: 'COK' }
];

const POPULAR_DESTINATIONS = [
  { name: 'Goa', country: 'India', tag: 'Sun, Sand & Beach', category: 'Beach', icon: '🏖️' },
  { name: 'Dubai', country: 'UAE', tag: 'Luxury & Skyline', category: 'International', icon: '🏙️' },
  { name: 'Bali', country: 'Indonesia', tag: 'Tropical & Culture', category: 'International', icon: '🌴' },
  { name: 'Maldives', country: 'Maldives', tag: 'Water Villas & Romance', category: 'Honeymoon', icon: '🌊' },
  { name: 'Paris', country: 'France', tag: 'Romance & Heritage', category: 'International', icon: '🗼' },
  { name: 'Thailand', country: 'Thailand', tag: 'Islands & Nightlife', category: 'International', icon: '🏝️' },
  { name: 'Manali', country: 'Himachal Pradesh, India', tag: 'Snow & Mountains', category: 'Hill Station', icon: '🏔️' },
  { name: 'Kerala', country: 'India', tag: 'Backwaters & Nature', category: 'Nature', icon: '🛶' },
  { name: 'Kashmir', country: 'India', tag: 'Valleys & Lakes', category: 'Honeymoon', icon: '⛷️' },
  { name: 'Rajasthan', country: 'India', tag: 'Palaces & Royalty', category: 'Heritage', icon: '🏰' },
  { name: 'Ladakh', country: 'India', tag: 'High Passes & Adventure', category: 'Adventure', icon: '🏍️' }
];

const AIRPORTS_DATA = [
  { code: 'GOI', name: 'Dabolim Airport', city: 'Goa', country: 'India' },
  { code: 'GOX', name: 'Manohar Intl Airport (Mopa)', city: 'Goa', country: 'India' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'India' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose', city: 'Kolkata', country: 'India' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'India' },
  { code: 'COK', name: 'Cochin Intl', city: 'Kochi', country: 'India' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE' },
  { code: 'DPS', name: 'Ngurah Rai Intl', city: 'Bali', country: 'Indonesia' },
  { code: 'MLE', name: 'Velana Intl', city: 'Maldives', country: 'Maldives' }
];

const TRAVEL_CATEGORIES = [
  { id: 'beach', label: 'Beach & Islands', icon: '🏖️' },
  { id: 'hills', label: 'Hill Stations', icon: '🏔️' },
  { id: 'honeymoon', label: 'Honeymoon & Romance', icon: '💍' },
  { id: 'adventure', label: 'Adventure & Wildlife', icon: '🧗' },
  { id: 'heritage', label: 'Heritage & Culture', icon: '🏰' },
  { id: 'luxury', label: 'Luxury Escapes', icon: '✨' }
];

const SELF_DRIVE_LOCATIONS = [
  { id: 'goa-airport-dabolim', name: 'Goa Airport (Dabolim - GOI)', category: 'Airports', desc: 'Dabolim Airport - Free Terminal Handover', note: 'Free airport handover', icon: '✈️' },
  { id: 'goa-airport-mopa', name: 'Manohar Intl Airport (Mopa - GOX)', category: 'Airports', desc: 'North Goa Mopa Airport Terminal delivery', note: 'Free delivery', icon: '✈️' },
  { id: 'madgaon-station', name: 'Madgaon Railway Station (MAO)', category: 'Stations', desc: 'South Goa Main Railway Junction', note: 'Free delivery', icon: '🚆' },
  { id: 'thivim-station', name: 'Thivim Railway Station (THVM)', category: 'Stations', desc: 'North Goa Railway Station', note: 'Free delivery', icon: '🚆' },
  { id: 'karmali-station', name: 'Karmali Railway Station (KRMI)', category: 'Stations', desc: 'Old Goa / Panaji Rail Station', note: 'Free delivery', icon: '🚆' },
  { id: 'calangute', name: 'Calangute', category: 'North Goa', desc: 'Calangute Beach / Circle', note: 'Free delivery', icon: '🏖️' },
  { id: 'baga', name: 'Baga Beach', category: 'North Goa', desc: 'Baga Beach & Tito\'s Lane', note: 'Free delivery', icon: '🏖️' },
  { id: 'candolim', name: 'Candolim', category: 'North Goa', desc: 'Candolim Beach Road & Fort Aguada', note: 'Free delivery', icon: '🏖️' },
  { id: 'anjuna-vagator', name: 'Anjuna / Vagator', category: 'North Goa', desc: 'Anjuna Flea Market & Vagator Cliffs', note: 'Free delivery', icon: '🏖️' },
  { id: 'morjim-arambol', name: 'Morjim / Arambol', category: 'North Goa', desc: 'Morjim Turtle Beach & Arambol', note: 'Free delivery', icon: '🏖️' },
  { id: 'panaji', name: 'Panaji City', category: 'Central Goa', desc: 'Panaji Bus Stand & Fontainhas Latin Quarter', note: 'Central Goa hub', icon: '🏙️' },
  { id: 'vasco', name: 'Vasco da Gama', category: 'Central Goa', desc: 'Vasco City Center & Harbour Area', note: 'Free delivery', icon: '⚓' },
  { id: 'colva-benaulim', name: 'Colva / Benaulim', category: 'South Goa', desc: 'Colva, Benaulim & Varca Beach Resort Hub', note: 'Free delivery', icon: '🌴' },
  { id: 'palolem-agonda', name: 'Palolem / Agonda', category: 'South Goa', desc: 'South Goa Scenic Coast & Resorts', note: 'Free delivery', icon: '🌴' },
  { id: 'doorstep', name: 'Hotel / Resort Delivery', category: 'Doorstep', desc: 'Doorstep Delivery at Any Hotel / Villa in Goa', note: 'Anywhere in Goa', icon: '🏨' },
];

// ─── MAIN SEARCH WIDGET COMPONENT ─────────────────────────────────────────────

export default function SearchWidget({
  activeTab,
  setActiveTab,
  pickupLoc,
  setPickupLoc,
  dropLoc,
  setDropLoc,
  pickupDate,
  setPickupDate,
  dropDate,
  setDropDate,
  pickupTime,
  setPickupTime,
  dropTime,
  setDropTime,
  handleSearchSubmit,
  setSearchTriggered,
  searchQuery,
  setSearchQuery,
  hotelRooms = 1,
  setHotelRooms,
  hotelAdults = 2,
  setHotelAdults,
  hotelChildren = 0,
  setHotelChildren,
  hotelPriceRange,
  setHotelPriceRange,
  flightAdults = 1,
  setFlightAdults,
  flightChildren = 0,
  setFlightChildren,
  flightInfants = 0,
  setFlightInfants,
  flightClass = 'economy',
  setFlightClass,
  appliedFilters = {},
  setAppliedFilters
}) {
  // Popover state: 'from' | 'to' | 'date-pickup' | 'date-drop' | 'guests' | 'filters' | 'flight-from' | 'flight-to' | 'passengers' | null
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Geolocation & Status
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Child ages state
  const [childAges, setChildAges] = useState([]);

  // Search input strings within popovers
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [flightFromSearch, setFlightFromSearch] = useState('');
  const [flightToSearch, setFlightToSearch] = useState('');

  // Self Drive Location Popover States
  const [sdPickupSearch, setSdPickupSearch] = useState('');
  const [sdDropSearch, setSdDropSearch] = useState('');
  const [sdPickupCategory, setSdPickupCategory] = useState('All');
  const [sdDropCategory, setSdDropCategory] = useState('All');

  const filteredPickupLocations = SELF_DRIVE_LOCATIONS.filter(loc => {
    const matchesCat = sdPickupCategory === 'All' || loc.category === sdPickupCategory;
    const q = sdPickupSearch.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery = loc.name.toLowerCase().includes(q) || 
      loc.desc.toLowerCase().includes(q) || 
      loc.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const filteredDropLocations = SELF_DRIVE_LOCATIONS.filter(loc => {
    const matchesCat = sdDropCategory === 'All' || loc.category === sdDropCategory;
    const q = sdDropSearch.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery = loc.name.toLowerCase().includes(q) || 
      loc.desc.toLowerCase().includes(q) || 
      loc.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Local filter states for all 4 search tabs
  const [localFilters, setLocalFilters] = useState({
    // Self Drive
    vehicleTypes: appliedFilters?.vehicleTypes || [],
    carSubFilters: appliedFilters?.carSubFilters || [],
    bikeSubFilters: appliedFilters?.bikeSubFilters || [],
    vehicleTransmission: appliedFilters?.vehicleTransmission || [],
    vehicleFuel: appliedFilters?.vehicleFuel || [],
    vehicleSeating: appliedFilters?.vehicleSeating || [],
    vehicleBudget: appliedFilters?.vehicleBudget || [],
    vehicleFeatures: appliedFilters?.vehicleFeatures || [],

    // Hotels
    hotelStars: appliedFilters?.hotelStars || [],
    hotelPropertyType: appliedFilters?.hotelPropertyType || [],
    hotelPriceRanges: appliedFilters?.hotelPriceRanges || [],
    hotelAreas: appliedFilters?.hotelAreas || [],
    hotelAmenities: appliedFilters?.hotelAmenities || [],

    // Flights
    flightStops: appliedFilters?.flightStops || [],
    flightDepTimes: appliedFilters?.flightDepTimes || [],
    flightArrTimes: appliedFilters?.flightArrTimes || [],
    flightAirlines: appliedFilters?.flightAirlines || [],
    flightClassFilter: appliedFilters?.flightClassFilter || [],
    flightPriceRanges: appliedFilters?.flightPriceRanges || [],
    flightBaggage: appliedFilters?.flightBaggage || [],

    // Trip Packages
    tripTypes: appliedFilters?.tripTypes || [],
    packageActivities: appliedFilters?.packageActivities || [],
    priceRanges: appliedFilters?.priceRanges || [],
    packageBudgetBasis: appliedFilters?.packageBudgetBasis || [],
    packageMeals: appliedFilters?.packageMeals || [],
    durations: appliedFilters?.durations || [],
    inclusions: appliedFilters?.inclusions || [],

    // Sightseeing & Activities
    activityTypes: appliedFilters?.activityTypes || [],
    activityPriceRanges: appliedFilters?.activityPriceRanges || [],
    activityDurations: appliedFilters?.activityDurations || [],

    // Craft My Trip
    craftVehicleTypes: appliedFilters?.craftVehicleTypes || [],
    craftHotelTypes: appliedFilters?.craftHotelTypes || [],
    craftExperienceTypes: appliedFilters?.craftExperienceTypes || [],
    craftBudgetRanges: appliedFilters?.craftBudgetRanges || []
  });

  const widgetRef = useRef(null);
  const todayStr = getTodayDateStr();
  const minCheckOutDate = getNextDayDateStr(pickupDate || todayStr);

  // Auto-init dates on mount if missing
  useEffect(() => {
    if (!pickupDate) {
      setPickupDate(todayStr);
    }
    if (!dropDate) {
      setDropDate(getNextDayDateStr(pickupDate || todayStr));
    }
  }, []);

  // Sync appliedFilters
  useEffect(() => {
    if (appliedFilters) {
      setLocalFilters(prev => ({
        ...prev,
        ...appliedFilters
      }));
    }
  }, [appliedFilters]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ─── GEOLOCATION DETECTION ──────────────────────────────────────────────────
  const handleUseCurrentLocation = (targetField = 'pickup') => {
    if (!navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        msg: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const detectedCity = address.city || address.town || address.village || address.state_district || address.county || 'Goa';
            
            if (targetField === 'pickup') {
              setPickupLoc(detectedCity);
            } else {
              setDropLoc(detectedCity);
            }

            setLocationStatus({
              type: 'success',
              msg: `Detected: ${detectedCity}`
            });
            setTimeout(() => {
              setActiveDropdown(null);
              setLocationStatus(null);
            }, 1000);
          } else {
            throw new Error('Reverse geocoding failed');
          }
        } catch {
          const fallbackCity = 'Goa';
          if (targetField === 'pickup') setPickupLoc(fallbackCity);
          else setDropLoc(fallbackCity);
          
          setLocationStatus({
            type: 'success',
            msg: 'Location set to Goa, India'
          });
          setTimeout(() => {
            setActiveDropdown(null);
            setLocationStatus(null);
          }, 1000);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationStatus({
            type: 'denied',
            msg: 'Location access was denied. Please choose manually.'
          });
        } else {
          setLocationStatus({
            type: 'error',
            msg: 'Could not detect location. Please choose manually.'
          });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // ─── CHILDREN AGE HANDLER ───────────────────────────────────────────────────
  const handleChildrenCountChange = (newCount) => {
    const validCount = Math.max(0, newCount);
    if (setHotelChildren) setHotelChildren(validCount);
    const updatedAges = Array.from({ length: validCount }, (_, i) => childAges[i] !== undefined ? childAges[i] : 5);
    setChildAges(updatedAges);
  };

  const handleChildAgeChange = (index, ageVal) => {
    const updated = [...childAges];
    updated[index] = parseInt(ageVal, 10);
    setChildAges(updated);
  };

  // ─── FORM SUBMIT & VALIDATION ───────────────────────────────────────────────
  const onWidgetFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setValidationError('');

    if (activeTab === 'hotels' || activeTab === 'packages' || activeTab === 'craftmytrip') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: false });
      if (!val.valid) {
        setValidationError(val.error);
        return;
      }
    } else if (activeTab === 'selfdrive' || activeTab === 'taxi') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: true });
      if (!val.valid) {
        setValidationError(val.error);
        return;
      }
    } else if (activeTab === 'flights') {
      if (!pickupDate || pickupDate < todayStr) {
        setValidationError('Flight departure date cannot be in the past.');
        return;
      }
    }

    if (setAppliedFilters) {
      setAppliedFilters(localFilters);
    }

    if (setSearchTriggered) {
      setSearchTriggered(true);
    }

    if (handleSearchSubmit) {
      handleSearchSubmit(activeTab);
    }

    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Date displays
  const parsedPickup = pickupDate ? new Date(pickupDate) : new Date();
  const validPickupObj = isNaN(parsedPickup.getTime()) ? new Date() : parsedPickup;
  const displayPickupDay = validPickupObj.getDate();
  const displayPickupMonthYear = validPickupObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const displayPickupWeekday = validPickupObj.toLocaleString('en-US', { weekday: 'long' });

  const parsedDrop = dropDate ? new Date(dropDate) : new Date();
  const validDropObj = isNaN(parsedDrop.getTime()) ? new Date() : parsedDrop;
  const displayDropDay = validDropObj.getDate();
  const displayDropMonthYear = validDropObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const displayDropWeekday = validDropObj.toLocaleString('en-US', { weekday: 'long' });

  const activeTabFiltersCount = countActiveTabFilters(activeTab, localFilters);

  const handleClearAllForTab = () => {
    setLocalFilters(prev => {
      let cleared = { ...prev };
      if (activeTab === 'selfdrive') {
        cleared = {
          ...cleared,
          vehicleTypes: [],
          carSubFilters: [],
          bikeSubFilters: [],
          vehicleTransmission: [],
          vehicleFuel: [],
          vehicleSeating: [],
          vehicleBudget: [],
          vehicleFeatures: []
        };
      } else if (activeTab === 'hotels') {
        cleared = {
          ...cleared,
          hotelStars: [],
          hotelPropertyType: [],
          hotelPriceRanges: [],
          hotelAreas: [],
          hotelAmenities: []
        };
      } else if (activeTab === 'flights') {
        cleared = {
          ...cleared,
          flightStops: [],
          flightDepTimes: [],
          flightArrTimes: [],
          flightAirlines: [],
          flightClassFilter: [],
          flightPriceRanges: [],
          flightBaggage: []
        };
      } else if (activeTab === 'packages') {
        cleared = {
          ...cleared,
          tripTypes: [],
          packageActivities: [],
          priceRanges: [],
          packageBudgetBasis: [],
          hotelStars: [],
          packageMeals: [],
          durations: [],
          inclusions: []
        };
      } else if (activeTab === 'activities') {
        cleared = {
          ...cleared,
          activityTypes: [],
          activityPriceRanges: [],
          activityDurations: []
        };
      } else if (activeTab === 'craftmytrip') {
        cleared = {
          ...cleared,
          craftVehicleTypes: [],
          craftHotelTypes: [],
          craftExperienceTypes: [],
          craftBudgetRanges: []
        };
      }
      if (setAppliedFilters) setAppliedFilters(cleared);
      return cleared;
    });
  };

  const handleApplyFilters = () => {
    if (setAppliedFilters) setAppliedFilters(localFilters);
    if (setSearchTriggered) setSearchTriggered(true);
    setActiveDropdown(null);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const totalPassengers = (flightAdults || 1) + (flightChildren || 0) + (flightInfants || 0);

  return (
    <div className="container booking-widget-wrapper" id="search" ref={widgetRef} style={{ scrollMarginTop: '80px' }}>
      <div className="booking-widget-card">
        
        {/* ─── BOOKING TYPE TABS ────────────────────────────────────────────── */}
        <div className="widget-tabs" role="tablist">
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'selfdrive'}
            className={`widget-tab-btn ${activeTab === 'selfdrive' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('selfdrive'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Car />
            <span>Self Drive Holidays</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'taxi'}
            className={`widget-tab-btn ${activeTab === 'taxi' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('taxi'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <CarTaxiFront />
            <span>Taxi Services</span>
          </button>

          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'packages'}
            className={`widget-tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('packages'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Compass />
            <span>Trip Packages</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'hotels'}
            className={`widget-tab-btn ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('hotels'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Hotel />
            <span>Hotels</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'flights'}
            className={`widget-tab-btn ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('flights'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Plane />
            <span>Flights</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'activities'}
            className={`widget-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('activities'); 
              setActiveDropdown(null); 
              setValidationError(''); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <MapPin />
            <span>Sightseeing & Activities</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'craftmytrip'}
            className={`widget-tab-btn craft-tab ${activeTab === 'craftmytrip' ? 'active' : ''}`}
            onClick={() => { 
              setActiveTab('craftmytrip'); 
              setSearchTriggered(true); 
              setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Wand2 />
            <span>Craft My Trip ✨</span>
          </button>
        </div>

        {/* ─── INLINE VALIDATION TOAST ──────────────────────────────────────── */}
        {validationError && (
          <div className="tg-validation-toast d-flex align-items-center justify-content-between p-3" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} className="text-danger flex-shrink-0" />
              <span className="text-danger fw-semibold small">{validationError}</span>
            </div>
            <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setValidationError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── TAB-SPECIFIC SEARCH FORMS ────────────────────────────────────── */}
        <form onSubmit={onWidgetFormSubmit} className="p-3 position-relative">
          
          {/* ──────────────────────────────────────────────────────────────────
              TAB: HOTELS
          ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'hotels' ? (
            <div className="booking-inputs-grid">
              
              {/* Hotel Field 1: Destination / Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-loc' ? null : 'hotel-loc')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>City or Hotel Name</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{dropLoc || pickupLoc || 'Goa'}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'hotel-loc' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Destination / Area</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search Goa, Calangute, Baga..." 
                        value={dropLoc || ''} 
                        onChange={e => { setPickupLoc(e.target.value); setDropLoc(e.target.value); }} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location'}</span>
                    </button>

                    {locationStatus && (
                      <div className={`p-2 rounded small mb-2 ${locationStatus.type === 'error' || locationStatus.type === 'denied' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                        {locationStatus.msg}
                      </div>
                    )}

                    <div className="text-muted small fw-bold mb-1">Popular Goa Areas</div>
                    <div className="d-flex flex-wrap gap-1">
                      {['All Goa', 'Calangute', 'Baga', 'Candolim', 'Panaji', 'Anjuna', 'Vagator', 'South Goa'].map(area => (
                        <button
                          key={area}
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2"
                          style={{ fontSize: '12px' }}
                          onClick={() => { setPickupLoc(area); setDropLoc(area); setActiveDropdown(null); }}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel Field 2: Check-in Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-checkin' ? null : 'hotel-checkin')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Check-in Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'hotel-checkin' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Check-in Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate <= d) {
                          setDropDate(getNextDayDateStr(d));
                        }
                        setActiveDropdown('hotel-checkout');
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hotel Field 3: Check-out Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-checkout' ? null : 'hotel-checkout')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Check-out Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayDropDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayDropMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayDropWeekday}</span>

                {activeDropdown === 'hotel-checkout' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Check-out Date"
                      selectedDate={dropDate}
                      minDate={minCheckOutDate}
                      onSelect={(d) => {
                        setDropDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hotel Field 4: Rooms & Guests */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-guests' ? null : 'hotel-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Rooms & Guests</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">{hotelRooms || 1} Room{(hotelRooms || 1) > 1 ? 's' : ''}</span>

                {activeDropdown === 'hotel-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hotel Field 5: Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
          ) : activeTab === 'flights' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: FLIGHTS
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid">
              
              {/* Flight Field 1: FROM Airport */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-from' ? null : 'flight-from')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>FROM (Airport)</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{pickupLoc || 'DEL'}</div>
                <span className="input-block-sub">
                  {AIRPORTS_DATA.find(a => a.code === pickupLoc)?.city || 'New Delhi'}
                </span>

                {activeDropdown === 'flight-from' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Departure Airport</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search city or IATA code e.g. DEL, BOM..." 
                        value={flightFromSearch} 
                        onChange={e => setFlightFromSearch(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Nearest Airport (GPS)'}</span>
                    </button>

                    <div className="tg-scroll-area">
                      {AIRPORTS_DATA.filter(a => 
                        a.code.toLowerCase().includes(flightFromSearch.toLowerCase()) || 
                        a.city.toLowerCase().includes(flightFromSearch.toLowerCase()) ||
                        a.name.toLowerCase().includes(flightFromSearch.toLowerCase())
                      ).map(a => (
                        <button
                          key={a.code}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setPickupLoc(a.code); setActiveDropdown('flight-to'); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{a.city} ({a.code})</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{a.name}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{a.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Field 2: TO Airport */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-to' ? null : 'flight-to')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>TO (Airport)</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{dropLoc || 'GOI'}</div>
                <span className="input-block-sub">
                  {AIRPORTS_DATA.find(a => a.code === dropLoc)?.city || 'Goa, India'}
                </span>

                {activeDropdown === 'flight-to' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Destination Airport</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search destination airport e.g. GOI, GOX..." 
                        value={flightToSearch} 
                        onChange={e => setFlightToSearch(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <div className="tg-scroll-area">
                      {AIRPORTS_DATA.filter(a => 
                        a.code.toLowerCase().includes(flightToSearch.toLowerCase()) || 
                        a.city.toLowerCase().includes(flightToSearch.toLowerCase()) ||
                        a.name.toLowerCase().includes(flightToSearch.toLowerCase())
                      ).map(a => (
                        <button
                          key={a.code}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setDropLoc(a.code); setActiveDropdown(null); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{a.city} ({a.code})</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{a.name}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{a.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Field 3: Departure Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-date' ? null : 'flight-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Travel Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'flight-date' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Flight Travel Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Flight Field 4: Passengers & Class */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'passengers' ? null : 'passengers')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Passengers & Class</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{totalPassengers}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Passenger{totalPassengers > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="input-block-sub text-capitalize">{flightClass || 'Economy'}</span>

                {activeDropdown === 'passengers' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <FlightPassengersPopoverContent
                      adults={flightAdults}
                      setAdults={setFlightAdults}
                      childrenCount={flightChildren}
                      setChildren={setFlightChildren}
                      infants={flightInfants}
                      setInfants={setFlightInfants}
                      flightClass={flightClass}
                      setFlightClass={setFlightClass}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Flight Field 5: Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
          ) : activeTab === 'selfdrive' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: SELF DRIVE HOLIDAYS (Reference Image Style)
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid">
              
              {/* Self-Drive Field 1: Pickup Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'sd-pickup' ? null : 'sd-pickup')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><MapPin size={13} className="text-warning" /> Pickup Location</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title={pickupLoc || 'Goa Airport'}>
                  {pickupLoc || 'Goa Airport'}
                </div>
                <span className="input-block-sub">Goa, India · Free Handover</span>

                {activeDropdown === 'sd-pickup' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Choose Pickup Location</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4 pe-4" 
                        placeholder="Search Airport, Baga, Candolim, Hotel..." 
                        value={sdPickupSearch} 
                        onChange={e => setSdPickupSearch(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' && sdPickupSearch.trim()) {
                            setPickupLoc(sdPickupSearch.trim());
                            setActiveDropdown(null);
                          }
                        }}
                        autoFocus 
                      />
                      {sdPickupSearch && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-link position-absolute p-0 text-muted"
                          style={{ top: '6px', right: '10px' }}
                          onClick={() => setSdPickupSearch('')}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location (GPS)'}</span>
                    </button>

                    {sdPickupSearch.trim() && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 text-start mb-2 py-1 px-2 fw-semibold d-flex align-items-center justify-content-between"
                        style={{ fontSize: '12px' }}
                        onClick={() => {
                          setPickupLoc(sdPickupSearch.trim());
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="text-truncate">📍 Use &ldquo;{sdPickupSearch.trim()}&rdquo; as Pickup</span>
                        <span className="badge bg-primary text-white">Select</span>
                      </button>
                    )}

                    {/* Category Filter Pills */}
                    <div className="d-flex align-items-center gap-1 mb-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {['All', 'Airports', 'Stations', 'North Goa', 'South Goa'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          className={`btn btn-xs rounded-pill px-2 py-0 fw-semibold ${sdPickupCategory === cat ? 'btn-dark text-white' : 'btn-light border'}`}
                          style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                          onClick={() => setSdPickupCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="text-muted small fw-bold mb-1">Available Pickup Locations</div>
                    <div className="tg-scroll-area" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {filteredPickupLocations.length > 0 ? (
                        filteredPickupLocations.map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            className={`btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0 ${pickupLoc === loc.name ? 'border border-primary bg-primary bg-opacity-10' : ''}`}
                            onClick={() => {
                              setPickupLoc(loc.name);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '16px' }}>{loc.icon}</span>
                              <div>
                                <div className="fw-bold text-dark small">{loc.name}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{loc.desc}</div>
                              </div>
                            </div>
                            <span className="badge bg-success bg-opacity-10 text-success small">Free Handover</span>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-3 bg-light rounded-2">
                          <p className="text-muted small mb-2">No predefined locations match &ldquo;{sdPickupSearch}&rdquo;</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '12px' }}
                            onClick={() => {
                              setPickupLoc(sdPickupSearch.trim());
                              setActiveDropdown(null);
                            }}
                          >
                            📍 Set &ldquo;{sdPickupSearch.trim()}&rdquo; as Pickup Location
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Self-Drive Field 2: Drop Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'sd-drop' ? null : 'sd-drop')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><Navigation size={13} className="text-info" /> Drop Location</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title={dropLoc || (pickupLoc ? `${pickupLoc} (Same)` : 'North Goa')}>
                  {dropLoc || (pickupLoc ? `${pickupLoc} (Same)` : 'North Goa')}
                </div>
                <span className="input-block-sub text-success fw-bold">Free delivery &amp; return</span>

                {activeDropdown === 'sd-drop' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Navigation size={14} className="text-primary me-1" /> Choose Return / Drop Location</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4 pe-4" 
                        placeholder="Search Return Point, Airport, Hotel..." 
                        value={sdDropSearch} 
                        onChange={e => setSdDropSearch(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' && sdDropSearch.trim()) {
                            setDropLoc(sdDropSearch.trim());
                            setActiveDropdown(null);
                          }
                        }}
                        autoFocus 
                      />
                      {sdDropSearch && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-link position-absolute p-0 text-muted"
                          style={{ top: '6px', right: '10px' }}
                          onClick={() => setSdDropSearch('')}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Option: Return at Same as Pickup Spot */}
                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center justify-content-between p-2 rounded-2 mb-2 border"
                      style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
                      onClick={() => {
                        setDropLoc(pickupLoc || 'Goa Airport');
                        setActiveDropdown(null);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>🔄</span>
                        <div>
                          <div className="fw-bold small text-success">Same as Pickup Location</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{pickupLoc || 'Goa Airport'}</div>
                        </div>
                      </div>
                      <span className="badge bg-success text-white small">Most Convenient</span>
                    </button>

                    {sdDropSearch.trim() && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 text-start mb-2 py-1 px-2 fw-semibold d-flex align-items-center justify-content-between"
                        style={{ fontSize: '12px' }}
                        onClick={() => {
                          setDropLoc(sdDropSearch.trim());
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="text-truncate">📍 Use &ldquo;{sdDropSearch.trim()}&rdquo; as Drop Point</span>
                        <span className="badge bg-primary text-white">Select</span>
                      </button>
                    )}

                    {/* Category Filter Pills */}
                    <div className="d-flex align-items-center gap-1 mb-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {['All', 'Airports', 'Stations', 'North Goa', 'South Goa'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          className={`btn btn-xs rounded-pill px-2 py-0 fw-semibold ${sdDropCategory === cat ? 'btn-dark text-white' : 'btn-light border'}`}
                          style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                          onClick={() => setSdDropCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="text-muted small fw-bold mb-1">Return / Drop Locations</div>
                    <div className="tg-scroll-area" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {filteredDropLocations.length > 0 ? (
                        filteredDropLocations.map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            className={`btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0 ${dropLoc === loc.name ? 'border border-primary bg-primary bg-opacity-10' : ''}`}
                            onClick={() => {
                              setDropLoc(loc.name);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '16px' }}>{loc.icon}</span>
                              <div>
                                <div className="fw-bold text-dark small">{loc.name}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{loc.desc}</div>
                              </div>
                            </div>
                            <span className="badge bg-success bg-opacity-10 text-success small">Free Handover</span>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-3 bg-light rounded-2">
                          <p className="text-muted small mb-2">No predefined locations match &ldquo;{sdDropSearch}&rdquo;</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '12px' }}
                            onClick={() => {
                              setDropLoc(sdDropSearch.trim());
                              setActiveDropdown(null);
                            }}
                          >
                            📍 Set &ldquo;{sdDropSearch.trim()}&rdquo; as Drop Location
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Self-Drive Field 3: Pickup Date & Time */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'sd-pickup-date' ? null : 'sd-pickup-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><CalendarIcon size={13} className="text-primary" /> Pickup Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday} · <span className="fw-semibold text-primary">{pickupTime || '10:00 AM'}</span></span>

                {activeDropdown === 'sd-pickup-date' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Pickup Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate < d) {
                          setDropDate(d);
                        }
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                    <div className="mt-3 pt-2 border-top">
                      <div className="text-muted small fw-bold mb-2">Pickup Time</div>
                      <div className="d-flex flex-wrap gap-1">
                        {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(t => (
                          <button
                            key={t}
                            type="button"
                            className={`btn btn-sm ${pickupTime === t ? 'btn-primary text-white' : 'btn-light'} py-1 px-2`}
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              if (setPickupTime) setPickupTime(t);
                              setActiveDropdown('sd-return-date');
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Self-Drive Field 4: Return Date & Time */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'sd-return-date' ? null : 'sd-return-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><CalendarIcon size={13} className="text-primary" /> Return Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayDropDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayDropMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayDropWeekday} · <span className="fw-semibold text-primary">{dropTime || '10:00 AM'}</span></span>

                {activeDropdown === 'sd-return-date' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Return Date"
                      selectedDate={dropDate}
                      minDate={pickupDate || todayStr}
                      onSelect={(d) => {
                        setDropDate(d);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                    <div className="mt-3 pt-2 border-top">
                      <div className="text-muted small fw-bold mb-2">Return Time</div>
                      <div className="d-flex flex-wrap gap-1">
                        {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(t => (
                          <button
                            key={t}
                            type="button"
                            className={`btn btn-sm ${dropTime === t ? 'btn-primary text-white' : 'btn-light'} py-1 px-2`}
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              if (setDropTime) setDropTime(t);
                              setActiveDropdown(null);
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Self-Drive Field 5: Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
                    ) : activeTab === 'taxi' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: TAXI & CHAUFFEUR SERVICES (Beside Self Drive Holidays)
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid">
              
              {/* Taxi Field 1: Pickup Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'tx-pickup' ? null : 'tx-pickup')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><MapPin size={13} className="text-warning" /> Pickup Location</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title={pickupLoc || 'Goa Airport (Dabolim / Mopa)'}>
                  {pickupLoc || 'Goa Airport'}
                </div>
                <span className="input-block-sub">Airport, Railway or Hotel Handover</span>

                {activeDropdown === 'tx-pickup' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Choose Taxi Pickup Point</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4 pe-4" 
                        placeholder="Search Mopa, Dabolim, Madgaon, Hotel..." 
                        value={sdPickupSearch} 
                        onChange={e => setSdPickupSearch(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' && sdPickupSearch.trim()) {
                            setPickupLoc(sdPickupSearch.trim());
                            setActiveDropdown(null);
                          }
                        }}
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location (GPS)'}</span>
                    </button>

                    {sdPickupSearch.trim() && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 text-start mb-2 py-1 px-2 fw-semibold d-flex align-items-center justify-content-between"
                        style={{ fontSize: '12px' }}
                        onClick={() => {
                          setPickupLoc(sdPickupSearch.trim());
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="text-truncate">📍 Use &ldquo;{sdPickupSearch.trim()}&rdquo; as Pickup</span>
                        <span className="badge bg-primary text-white">Select</span>
                      </button>
                    )}

                    <div className="text-muted small fw-bold mb-1">Recommended Airport & Station Hubs</div>
                    <div className="tg-scroll-area" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {SELF_DRIVE_LOCATIONS.slice(0, 8).map(loc => (
                        <div
                          key={loc.id}
                          className="p-2 rounded-2 d-flex align-items-center justify-content-between cursor-pointer tg-location-row"
                          style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                          onClick={() => {
                            setPickupLoc(loc.name);
                            setActiveDropdown(null);
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-6">{loc.icon}</span>
                            <div>
                              <div className="fw-semibold text-dark small">{loc.name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{loc.desc}</div>
                            </div>
                          </div>
                          {pickupLoc === loc.name && <Check size={14} className="text-primary flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Taxi Field 2: Drop Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'tx-drop' ? null : 'tx-drop')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><Navigation size={13} className="text-primary" /> Drop Destination</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title={dropLoc || 'North / South Goa'}>
                  {dropLoc || 'North Goa'}
                </div>
                <span className="input-block-sub">Calangute, Candolim, Panaji or Resort</span>

                {activeDropdown === 'tx-drop' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Navigation size={14} className="text-primary me-1" /> Choose Drop Location</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4 pe-4" 
                        placeholder="Search Hotel, Beach, City or Station..." 
                        value={sdDropSearch} 
                        onChange={e => setSdDropSearch(e.target.value)} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' && sdDropSearch.trim()) {
                            setDropLoc(sdDropSearch.trim());
                            setActiveDropdown(null);
                          }
                        }}
                        autoFocus 
                      />
                    </div>

                    {sdDropSearch.trim() && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 text-start mb-2 py-1 px-2 fw-semibold d-flex align-items-center justify-content-between"
                        style={{ fontSize: '12px' }}
                        onClick={() => {
                          setDropLoc(sdDropSearch.trim());
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="text-truncate">📍 Set &ldquo;{sdDropSearch.trim()}&rdquo; as Dropoff</span>
                        <span className="badge bg-primary text-white">Select</span>
                      </button>
                    )}

                    <div className="text-muted small fw-bold mb-1">Popular Goa Destinations</div>
                    <div className="tg-scroll-area" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {SELF_DRIVE_LOCATIONS.map(loc => (
                        <div
                          key={loc.id}
                          className="p-2 rounded-2 d-flex align-items-center justify-content-between cursor-pointer tg-location-row"
                          style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                          onClick={() => {
                            setDropLoc(loc.name);
                            setActiveDropdown(null);
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-6">{loc.icon}</span>
                            <div>
                              <div className="fw-semibold text-dark small">{loc.name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{loc.desc}</div>
                            </div>
                          </div>
                          {dropLoc === loc.name && <Check size={14} className="text-primary flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Taxi Field 3: Pickup Date & Time */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'tx-pickup-date' ? null : 'tx-pickup-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><CalendarIcon size={13} className="text-primary" /> Pickup Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday} · <span className="fw-semibold text-primary">{pickupTime || '10:00 AM'}</span></span>

                {activeDropdown === 'tx-pickup-date' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Taxi Pickup Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate < d) {
                          setDropDate(d);
                        }
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />

                    {/* Time Picker */}
                    <div className="border-top pt-2 mt-2">
                      <div className="text-muted small fw-bold mb-1">Pickup Time</div>
                      <select 
                        className="form-select form-select-sm"
                        value={pickupTime || '10:00'}
                        onChange={(e) => setPickupTime && setPickupTime(e.target.value)}
                      >
                        {Array.from({ length: 48 }).map((_, i) => {
                          const h = Math.floor(i / 2);
                          const m = i % 2 === 0 ? '00' : '30';
                          const timeStr = `${String(h).padStart(2, '0')}:${m}`;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const displayH = h % 12 === 0 ? 12 : h % 12;
                          return (
                            <option key={timeStr} value={timeStr}>
                              {displayH}:{m} {ampm}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Taxi Field 4: Trip Type & Flight Delay Tracking */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'tx-trip-type' ? null : 'tx-trip-type')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><Plane size={13} className="text-warning" /> Service Type</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title="Airport Transfer">
                  Airport Transfer
                </div>
                <span className="input-block-sub text-success fw-semibold">✓ 60m Free Waiting Included</span>

                {activeDropdown === 'tx-trip-type' && (
                  <div className="tg-popover-card shadow-xl p-3" style={{ width: '280px' }} onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small">Select Transfer Service</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      <div className="p-2 rounded border bg-light cursor-pointer" onClick={() => setActiveDropdown(null)}>
                        <div className="fw-bold small text-dark">✈️ Airport Pickup / Drop</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>Dabolim (GOI) or Mopa (GOX) with Name Placard</div>
                      </div>
                      <div className="p-2 rounded border cursor-pointer" onClick={() => setActiveDropdown(null)}>
                        <div className="fw-bold small text-dark">📍 Point-to-Point Intercity</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>One-way direct transfer between any two points</div>
                      </div>
                      <div className="p-2 rounded border cursor-pointer" onClick={() => setActiveDropdown(null)}>
                        <div className="fw-bold small text-dark">⏰ Full Day Chauffeur Rental</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>8 Hours / 80 Km Sightseeing & Beach Tour</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Taxi Field 5: Cab Categories */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'tx-class' ? null : 'tx-class')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span className="d-flex align-items-center gap-1"><SlidersHorizontal size={13} className="text-secondary" /> Cab Class</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" title="All Categories Available">
                  All Cabs
                </div>
                <span className="input-block-sub">Dzire, Ertiga & Innova Crysta</span>

                {activeDropdown === 'tx-class' && (
                  <div className="tg-popover-card shadow-xl p-3" style={{ width: '280px' }} onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small">Available Cab Classes</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="d-flex flex-column gap-2 small">
                      <div className="p-2 rounded border bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">Sedan (4 Seater)</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>Swift Dzire, Etios</div>
                        </div>
                        <span className="badge bg-dark">From ₹1,600</span>
                      </div>
                      <div className="p-2 rounded border d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">MUV (6 Seater)</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>Maruti Ertiga</div>
                        </div>
                        <span className="badge bg-dark">From ₹2,100</span>
                      </div>
                      <div className="p-2 rounded border d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">Executive SUV</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>Innova Crysta (Captain Seats)</div>
                        </div>
                        <span className="badge bg-warning text-dark fw-bold">From ₹2,900</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          ) : activeTab === 'activities' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: SIGHTSEEING & ACTIVITIES
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              
              {/* Field 1: Experience / Tour or Area */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'act-search' ? null : 'act-search')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Experience or Area</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val text-truncate" style={{ maxWidth: '180px' }}>
                  {searchQuery || dropLoc || 'All Goa Experiences'}
                </div>
                <span className="input-block-sub">Sightseeing, Water Sports & Tours</span>

                {activeDropdown === 'act-search' && (
                  <div className="tg-popover-card shadow-xl p-3" style={{ width: '360px' }} onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Compass size={14} className="text-primary me-1" /> Search Tours & Activities</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search Scuba, Heritage, Cruise, Calangute..." 
                        value={searchQuery || ''} 
                        onChange={e => {
                          if (setSearchQuery) setSearchQuery(e.target.value);
                        }} 
                        autoFocus 
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link position-absolute p-0 text-muted"
                          style={{ top: '6px', right: '10px' }}
                          onClick={() => { if (setSearchQuery) setSearchQuery(''); }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="text-muted small fw-bold mb-1">Top Curated Experiences</div>
                      <div className="d-flex flex-column gap-1">
                        {[
                          { name: 'Goa Heritage & Culture Tour', type: 'Sightseeing', icon: '🏛️' },
                          { name: 'North Goa Beach Sightseeing', type: 'Sightseeing', icon: '🏖️' },
                          { name: 'Scuba Diving Experience', type: 'Activity', icon: '🤿' },
                          { name: 'Parasailing Adventure', type: 'Activity', icon: '🪂' }
                        ].map(exp => (
                          <button
                            key={exp.name}
                            type="button"
                            className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                            onClick={() => {
                              if (setSearchQuery) setSearchQuery(exp.name);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span>{exp.icon}</span>
                              <span className="fw-bold text-dark small">{exp.name}</span>
                            </div>
                            <span className="badge bg-light text-muted small">{exp.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted small fw-bold mb-1">Popular Goa Areas</div>
                      <div className="d-flex flex-wrap gap-1">
                        {['All Goa', 'Calangute', 'Panaji', 'Old Goa', 'Grand Island', 'Baga', 'South Goa'].map(area => (
                          <button
                            key={area}
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2 bg-white"
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              if (setSearchQuery) setSearchQuery(area === 'All Goa' ? '' : area);
                              setDropLoc(area);
                              setActiveDropdown(null);
                            }}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Tour Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'act-date' ? null : 'act-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Tour Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'act-date' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Tour Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 3: Travellers / Guests */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'act-guests' ? null : 'act-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Travellers</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">{(hotelAdults || 2) + (hotelChildren || 0)} Guests</span>

                {activeDropdown === 'act-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 4: Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
          ) : activeTab === 'craftmytrip' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: CRAFT MY TRIP
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              
              {/* Field 1: Trip Base / Destination */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'craft-dest' ? null : 'craft-dest')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Trip Destination</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">Goa</div>
                <span className="input-block-sub">North &amp; South Goa</span>

                {activeDropdown === 'craft-dest' && (
                  <div className="tg-popover-card shadow-xl p-3" style={{ width: '320px' }} onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Wand2 size={14} className="text-warning me-1" /> Custom Goa Getaway</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>
                    <p className="text-muted small mb-2">Craft My Trip customizes your complete itinerary covering rental rides, boutique hotels, scenic sightseeing, and flights.</p>
                    <div className="d-flex flex-column gap-1">
                      <div className="p-2 rounded bg-light small fw-bold text-dark d-flex align-items-center gap-2">
                        <span>🏖️</span> North Goa: Calangute, Baga, Anjuna
                      </div>
                      <div className="p-2 rounded bg-light small fw-bold text-dark d-flex align-items-center gap-2">
                        <span>🌴</span> South Goa: Colva, Palolem, Luxury Resorts
                      </div>
                      <div className="p-2 rounded bg-light small fw-bold text-dark d-flex align-items-center gap-2">
                        <span>🏛️</span> Central Goa: Panaji, Fontainhas, Old Goa
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Trip Start Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'craft-pickup' ? null : 'craft-pickup')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Trip Start Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'craft-pickup' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Trip Start Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate <= d) {
                          setDropDate(getNextDayDateStr(d));
                        }
                        setActiveDropdown('craft-drop');
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 3: Trip End Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'craft-drop' ? null : 'craft-drop')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Trip End Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayDropDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayDropMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayDropWeekday}</span>

                {activeDropdown === 'craft-drop' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Trip End Date"
                      selectedDate={dropDate}
                      minDate={minCheckOutDate}
                      onSelect={(d) => {
                        setDropDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 4: Travellers */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'craft-guests' ? null : 'craft-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Travellers</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">Ride &amp; Hotel Capacity</span>

                {activeDropdown === 'craft-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 5: Trip Preferences */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Preferences</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Trip Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
          ) : (
            /* ──────────────────────────────────────────────────────────────────
                TAB: TRIP PACKAGES
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid booking-inputs-grid-6">
              
              {/* Field 1: From City */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'from' ? null : 'from')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>From City</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{pickupLoc || 'Select Departure City'}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'from' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Departure City</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search departure city e.g. Bengaluru, Hubli..." 
                        value={fromSearchQuery} 
                        onChange={e => setFromSearchQuery(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location (GPS)'}</span>
                    </button>

                    {locationStatus && (
                      <div className={`p-2 rounded small mb-2 ${locationStatus.type === 'error' || locationStatus.type === 'denied' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                        {locationStatus.msg}
                      </div>
                    )}

                    {fromSearchQuery.trim() && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 text-start mb-2 py-1 px-2 fw-semibold d-flex align-items-center justify-content-between"
                        style={{ fontSize: '12px' }}
                        onClick={() => {
                          setPickupLoc(fromSearchQuery.trim());
                          setActiveDropdown('to');
                        }}
                      >
                        <span className="text-truncate">📍 Use &ldquo;{fromSearchQuery.trim()}&rdquo; as Departure City</span>
                        <span className="badge bg-primary text-white">Select</span>
                      </button>
                    )}

                    <div className="text-muted small fw-bold mb-1">Popular Departure Cities</div>
                    <div className="tg-scroll-area">
                      {POPULAR_FROM_CITIES.filter(c => 
                        c.city.toLowerCase().includes(fromSearchQuery.toLowerCase()) || 
                        c.state.toLowerCase().includes(fromSearchQuery.toLowerCase())
                      ).map(c => (
                        <button
                          key={c.city}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setPickupLoc(c.city); setActiveDropdown('to'); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{c.city}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{c.state}, {c.country}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: To Destination */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'to' ? null : 'to')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>To Destination</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{dropLoc || 'Goa'}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'to' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Compass size={14} className="text-warning me-1" /> Destination / Theme</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search Goa, Dubai, Manali, Beach..." 
                        value={toSearchQuery} 
                        onChange={e => setToSearchQuery(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    {!toSearchQuery && (
                      <div className="mb-2">
                        <div className="text-muted small fw-bold mb-1">Travel Themes</div>
                        <div className="d-flex flex-wrap gap-1">
                          {TRAVEL_CATEGORIES.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2 bg-white"
                              style={{ fontSize: '11px' }}
                              onClick={() => { setDropLoc(cat.label.split('&')[0].trim()); setActiveDropdown(null); }}
                            >
                              <span>{cat.icon}</span> {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-muted small fw-bold mb-1">Top Destinations</div>
                    <div className="tg-scroll-area">
                      {POPULAR_DESTINATIONS.filter(d => 
                        d.name.toLowerCase().includes(toSearchQuery.toLowerCase()) || 
                        d.country.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
                        d.category.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
                        d.tag.toLowerCase().includes(toSearchQuery.toLowerCase())
                      ).map(d => (
                        <button
                          key={d.name}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setDropLoc(d.name); setActiveDropdown(null); }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '18px' }}>{d.icon}</span>
                            <div>
                              <div className="fw-bold text-dark">{d.name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{d.country} · {d.tag}</div>
                            </div>
                          </div>
                          <span className="badge bg-light text-muted small">{d.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Arrival Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'pkg-arrival' ? null : 'pkg-arrival')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Arrival Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'pkg-arrival' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Arrival Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate <= d) {
                          setDropDate(getNextDayDateStr(d));
                        }
                        setActiveDropdown('pkg-departure');
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 4: Departure Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'pkg-departure' ? null : 'pkg-departure')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Departure Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayDropDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayDropMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayDropWeekday}</span>

                {activeDropdown === 'pkg-departure' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Departure Date"
                      selectedDate={dropDate}
                      minDate={getNextDayDateStr(pickupDate || todayStr)}
                      onSelect={(d) => {
                        setDropDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 5: Rooms & Guests */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'pkg-guests' ? null : 'pkg-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Rooms & Guests</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">{hotelRooms || 1} Room{(hotelRooms || 1) > 1 ? 's' : ''}</span>

                {activeDropdown === 'pkg-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 5: Multi-Category Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {activeTabFiltersCount > 0 ? (
                      <span className="text-warning fw-black">{activeTabFiltersCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {activeTabFiltersCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <UnifiedFilterPopover
                    activeTab={activeTab}
                    localFilters={localFilters}
                    setLocalFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onClearAll={handleClearAllForTab}
                    onClose={() => setActiveDropdown(null)}
                  />
                )}
              </div>

            </div>
          )}

          {/* ─── FLOATING ORANGE SEARCH BUTTON ─────────────────────────────── */}
          <div className="search-btn-container">
            <button type="submit" className="btn-widget-search">
              {activeTab === 'selfdrive' ? 'SEARCH VEHICLES' :
               activeTab === 'taxi' ? 'SEARCH CABS & TARIFFS' :
               activeTab === 'hotels' ? 'SEARCH HOTELS' :
               activeTab === 'flights' ? 'SEARCH FLIGHTS' :
               activeTab === 'activities' ? 'SEARCH ACTIVITIES' :
               activeTab === 'craftmytrip' ? 'START CRAFTING TRIP ✨' : 'SEARCH PACKAGES'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ─── EMBEDDED CALENDAR POPUP VIEW ─────────────────────────────────────────────

function getInitialYearMonth(selectedDate, minDate) {
  if (selectedDate) {
    const [sY, sM] = selectedDate.split('-').map(Number);
    if (sY && sM) return { year: sY, month: sM - 1 };
  }
  if (minDate) {
    const [mY, mM] = minDate.split('-').map(Number);
    if (mY && mM) return { year: mY, month: mM - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function CalendarPickerView({ title, selectedDate, minDate, onSelect, onClose }) {
  const initial = getInitialYearMonth(selectedDate, minDate);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  // Synchronize when selectedDate or minDate updates externally
  useEffect(() => {
    const updated = getInitialYearMonth(selectedDate, minDate);
    setViewYear(updated.year);
    setViewMonth(updated.month);
  }, [selectedDate, minDate]);

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Dynamic future years list (minimum year to minimum year + 5)
  const currentSystemYear = new Date().getFullYear();
  const minYear = minDate ? parseInt(minDate.split('-')[0], 10) : currentSystemYear;
  const minMonthIndex = (minDate && parseInt(minDate.split('-')[0], 10) === viewYear) 
    ? parseInt(minDate.split('-')[1], 10) - 1 
    : 0;

  const availableYears = [];
  for (let y = minYear; y <= minYear + 5; y++) {
    availableYears.push(y);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const isCurrentMonthOrPast = () => {
    if (!minDate) return false;
    const [minY, minM] = minDate.split('-').map(Number);
    return viewYear < minY || (viewYear === minY && viewMonth <= minM - 1);
  };

  const handlePrev = () => {
    if (isCurrentMonthOrPast()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleYearChange = (newYear) => {
    const y = parseInt(newYear, 10);
    setViewYear(y);
    if (minDate) {
      const [minY, minM] = minDate.split('-').map(Number);
      if (y === minY && viewMonth < minM - 1) {
        setViewMonth(minM - 1);
      }
    }
  };

  const handleMonthChange = (newMonth) => {
    setViewMonth(parseInt(newMonth, 10));
  };

  return (
    <div className="p-3" style={{ minWidth: '320px', maxWidth: '360px' }}>
      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
        <span className="fw-bold text-dark small d-flex align-items-center gap-1">
          <CalendarIcon size={14} className="text-warning" />
          {title || "Select Date"}
        </span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Year & Month Selection Controls */}
      <div className="d-flex align-items-center justify-content-between gap-1 mb-2">
        <button 
          type="button" 
          className="btn btn-sm btn-light border rounded-circle p-1 d-flex align-items-center justify-content-center"
          style={{ width: '28px', height: '28px' }}
          onClick={handlePrev}
          disabled={isCurrentMonthOrPast()}
          title="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="d-flex align-items-center gap-1 flex-grow-1 justify-content-center">
          {/* Month Selector */}
          <select
            className="form-select form-select-sm fw-bold border-0 bg-light py-1 ps-2 pe-3"
            style={{ fontSize: '13px', cursor: 'pointer', maxWidth: '130px' }}
            value={viewMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            {monthNames.map((mName, idx) => {
              const isDisabled = viewYear === minYear && idx < minMonthIndex;
              return (
                <option key={mName} value={idx} disabled={isDisabled}>
                  {mName}
                </option>
              );
            })}
          </select>

          {/* Year Selector */}
          <select
            className="form-select form-select-sm fw-bold border-0 bg-light py-1 ps-2 pe-3"
            style={{ fontSize: '13px', cursor: 'pointer', maxWidth: '95px' }}
            value={viewYear}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="button" 
          className="btn btn-sm btn-light border rounded-circle p-1 d-flex align-items-center justify-content-center"
          style={{ width: '28px', height: '28px' }}
          onClick={handleNext}
          title="Next Month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick Year Jump Chips */}
      <div className="d-flex align-items-center gap-1 mb-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <span className="text-muted fw-bold" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year:</span>
        {availableYears.slice(0, 4).map(yr => (
          <button
            key={yr}
            type="button"
            className={`btn btn-xs rounded-pill px-2 py-0 fw-bold ${viewYear === yr ? 'btn-primary text-white' : 'btn-light border'}`}
            style={{ fontSize: '11px', lineHeight: '1.6' }}
            onClick={() => handleYearChange(yr)}
          >
            {yr}
          </button>
        ))}
      </div>

      <div className="mb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
        {weekdays.map(wd => <span key={wd}>{wd}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
        {Array.from({ length: firstDay }).map((_, i) => <span key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const mm = String(viewMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mm}-${dd}`;
          const isSelected = dateStr === selectedDate;
          const isPast = minDate && dateStr < minDate;

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              className={`tg-calendar-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOMS & GUESTS POPOVER CONTENT ───────────────────────────────────────────

function RoomsGuestsPopoverContent({ rooms, setRooms, adults, setAdults, childrenCount, onChildrenChange, childAges, onChildAgeChange, onDone }) {
  return (
    <div style={{ minWidth: '280px' }}>
      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
        <span className="fw-bold text-dark small"><Users size={14} className="text-primary me-1" /> Rooms & Guests</span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onDone}><X size={16} /></button>
      </div>

      {/* Rooms */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Rooms</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Minimum 1 room</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={rooms <= 1} onClick={() => setRooms(Math.max(1, (rooms || 1) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{rooms || 1}</span>
          <button type="button" className="tg-counter-btn" disabled={rooms >= 10} onClick={() => setRooms((rooms || 1) + 1)}>+</button>
        </div>
      </div>

      {/* Adults */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Adults</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Age 12+ years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={adults <= 1} onClick={() => setAdults(Math.max(1, (adults || 2) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{adults || 2}</span>
          <button type="button" className="tg-counter-btn" disabled={adults >= 30} onClick={() => setAdults((adults || 2) + 1)}>+</button>
        </div>
      </div>

      {/* Children */}
      <div className="d-flex align-items-center justify-content-between py-2">
        <div>
          <div className="fw-bold text-dark small">Children</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Age 0 - 11 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={childrenCount <= 0} onClick={() => onChildrenChange((childrenCount || 0) - 1)}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{childrenCount || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={childrenCount >= 10} onClick={() => onChildrenChange((childrenCount || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Child age selectors */}
      {childrenCount > 0 && (
        <div className="mt-2 pt-2 border-top">
          <div className="fw-bold text-dark small mb-1" style={{ fontSize: '11px' }}>Child Ages:</div>
          <div className="d-flex flex-wrap gap-1">
            {Array.from({ length: childrenCount }).map((_, idx) => (
              <div key={idx} className="d-flex align-items-center gap-1 bg-light p-1 rounded border">
                <span className="text-muted small" style={{ fontSize: '11px' }}>Child {idx + 1}:</span>
                <select
                  className="form-select form-select-sm border-0 bg-white py-0 px-1"
                  style={{ width: '65px', fontSize: '11px' }}
                  value={childAges[idx] !== undefined ? childAges[idx] : 5}
                  onChange={(e) => onChildAgeChange(idx, e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, a) => (
                    <option key={a} value={a}>{a} yrs</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-sm w-100 py-2 mt-3 fw-bold"
        style={{ background: '#FF6333', borderColor: '#FF6333', borderRadius: '8px' }}
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}

// ─── FLIGHT PASSENGERS POPOVER CONTENT ────────────────────────────────────────

function FlightPassengersPopoverContent({ adults, setAdults, childrenCount, setChildren, infants, setInfants, flightClass, setFlightClass, onDone }) {
  return (
    <div style={{ minWidth: '280px' }}>
      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
        <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Passengers & Class</span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onDone}><X size={16} /></button>
      </div>

      {/* Adults */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Adults</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>12+ years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={adults <= 1} onClick={() => setAdults(Math.max(1, (adults || 1) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{adults || 1}</span>
          <button type="button" className="tg-counter-btn" disabled={adults >= 9} onClick={() => setAdults((adults || 1) + 1)}>+</button>
        </div>
      </div>

      {/* Children */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Children</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>2 - 11 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={childrenCount <= 0} onClick={() => setChildren(Math.max(0, (childrenCount || 0) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{childrenCount || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={childrenCount >= 9} onClick={() => setChildren((childrenCount || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Infants */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Infants</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Under 2 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={infants <= 0} onClick={() => setInfants(Math.max(0, (infants || 0) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{infants || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={infants >= 9} onClick={() => setInfants((infants || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Cabin Class */}
      <div className="py-2">
        <div className="fw-bold text-dark small mb-1">Cabin Class</div>
        <select 
          className="form-select form-select-sm"
          value={flightClass || 'economy'}
          onChange={e => setFlightClass(e.target.value)}
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-sm w-100 py-2 mt-2 fw-bold"
        style={{ background: '#FF6333', borderColor: '#FF6333', borderRadius: '8px' }}
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}
