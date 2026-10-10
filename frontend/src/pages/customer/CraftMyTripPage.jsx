import React, { useState, useEffect, useCallback } from 'react';
import {
  Car, Bike, Hotel, Plane, Users, CheckCircle, ArrowLeft, ArrowRight,
  Search, Star, MapPin, Zap, X, CreditCard, Shield, PlaneTakeoff, PlaneLanding, Calendar, User,
  Wand2, AlertCircle, BadgeCheck, Check, Loader2, Compass, Clock,
  ChevronLeft, ChevronRight, Wallet, Crown, Gift, Sparkles, Bot
} from 'lucide-react';
import * as api from '../../services/api';
import BookingConfirmationCard from '../../components/common/BookingConfirmationCard';
import HotelImageGallery from '../../components/HotelImageGallery';
import CraftServiceDetailsModal from '../../components/customer/CraftServiceDetailsModal';
import CarDetailsPage from './CarDetailsPage';
import BikeDetailsPage from './BikeDetailsPage';
import HotelDetailsPage from './HotelDetailsPage';
import ActivityDetailsPage from './ActivityDetailsPage';
import FlightDetailsPage from './FlightDetailsPage';
import { getTodayDateStr, getNextDayDateStr, addDays, validateVehicleBookingEligibility } from '../../utils/dateUtils';
import { isBikeVehicle } from '../../utils/vehicleHelper';
import DobPicker from '../../components/common/DobPicker';

// Fallback seed vehicles if API is empty or connecting
const FALLBACK_CARS = [
  { id: 101, name: 'Mahindra Thar 4x4', seating: 4, fuel: 'Diesel', price: 3200, is_available: 1, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80', location: 'Goa (All Areas)' },
  { id: 102, name: 'Maruti Suzuki Swift', seating: 5, fuel: 'Petrol', price: 1400, is_available: 1, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80', location: 'North Goa / Airport' },
  { id: 103, name: 'Hyundai Creta SX', seating: 5, fuel: 'Diesel', price: 2600, is_available: 1, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80', location: 'Goa (Free Delivery)' },
  { id: 104, name: 'Maruti Suzuki Ertiga (7 Seater)', seating: 7, fuel: 'Petrol', price: 2800, is_available: 1, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80', location: 'Airport / Madgaon' }
];

const FALLBACK_BIKES = [
  { id: 201, name: 'Royal Enfield Classic 350', category: 'Cruiser', seating: 2, fuel: 'Petrol', price: 800, is_available: 1, image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80', location: 'Calangute / Baga' },
  { id: 202, name: 'Honda Activa 6G', category: 'Scooter', seating: 2, fuel: 'Petrol', price: 450, is_available: 1, image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80', location: 'All Goa' },
  { id: 203, name: 'Yamaha FZ-S V3', category: 'Sports Bike', seating: 2, fuel: 'Petrol', price: 700, is_available: 1, image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=400&q=80', location: 'Panaji / North Goa' }
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Choose Ride', icon: Car },
    { num: 2, label: 'Pick Hotel', icon: Hotel },
    { num: 3, label: 'Sightseeing & Activities', icon: Compass },
    { num: 4, label: 'Add Flight', icon: Plane },
    { num: 5, label: 'Review & Pay', icon: CreditCard },
  ];

  return (
    <div className="cmt-step-indicator">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isDone = currentStep > s.num;
        const isActive = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className={`cmt-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="cmt-step-circle">
                {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className="cmt-step-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`cmt-step-line ${isDone ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Choose Your Ride ────────────────────────────────────────────────
function Step1Vehicle({
  allCars = [],
  allBikes = [],
  bookings = [],
  pickupDate,
  dropDate,
  selectedVehicle,
  setSelectedVehicle,
  memberCount,
  setMemberCount,
  onNext,
  onBack,
  appliedFilters = {},
  searchQuery: initialSearchQuery = '',
  onViewVehicleDetails
}) {
  const [vehicleType, setVehicleType] = useState(selectedVehicle && isBikeVehicle(selectedVehicle) ? 'bike' : 'car');
  const [error, setError] = useState('');
  const [localCars, setLocalCars] = useState(allCars);
  const [localBikes, setLocalBikes] = useState(allBikes);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [filterSub, setFilterSub] = useState('All');
  const [searchVeh, setSearchVeh] = useState(initialSearchQuery || '');

  // Auto-fetch if parent props were empty on mount
  useEffect(() => {
    if ((!allCars || allCars.length === 0) && (!allBikes || allBikes.length === 0)) {
      setLoadingVehicles(true);
      Promise.all([api.fetchCars().catch(() => []), api.fetchBikes().catch(() => [])])
        .then(([c, b]) => {
          setLocalCars(c && c.length > 0 ? c : FALLBACK_CARS);
          setLocalBikes(b && b.length > 0 ? b : FALLBACK_BIKES);
        })
        .finally(() => setLoadingVehicles(false));
    } else {
      setLocalCars(allCars.length > 0 ? allCars : FALLBACK_CARS);
      setLocalBikes(allBikes.length > 0 ? allBikes : FALLBACK_BIKES);
    }
  }, [allCars, allBikes]);

  const isDateOverlap = (s1, e1, s2, e2) => {
    if (!s1 || !e1 || !s2 || !e2) return false;
    return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1);
  };

  const bookedIds = (bookings || [])
    .filter(b => isDateOverlap(b.pickup_date, b.drop_date, pickupDate, dropDate))
    .map(b => b.item_id)
    .filter(Boolean);

  const isItemAvailable = (item, prefix) => {
    if (item.is_available === 0 || item.is_available === '0' || item.is_available === false) return false;
    const isBooked = bookedIds.some(bid => String(bid) === String(item.id) || String(bid) === `${prefix}-${item.id}`);
    return !isBooked;
  };

  const availableCars = (localCars.length > 0 ? localCars : FALLBACK_CARS).filter(c => isItemAvailable(c, 'car'));
  const availableBikes = (localBikes.length > 0 ? localBikes : FALLBACK_BIKES).filter(b => isItemAvailable(b, 'bike'));

  const vehicles = vehicleType === 'car' ? availableCars : availableBikes;

  const filteredVehicles = vehicles.filter(v => {
    const name = (v.name || '').toLowerCase();
    const cat = (v.category || '').toLowerCase();
    const fuel = (v.fuel || '').toLowerCase();
    const trans = (v.transmission || '').toLowerCase();
    const seating = parseInt(v.seating || (vehicleType === 'bike' ? 2 : 4), 10);

    // 1. Quick pill filter
    if (filterSub && filterSub !== 'All') {
      const f = filterSub.toLowerCase();
      if (f === 'suv' && !cat.includes('suv') && !name.includes('creta') && !name.includes('brezza') && !name.includes('seltos')) return false;
      if (f === 'sedan' && !cat.includes('sedan') && !name.includes('dzire') && !name.includes('city') && !name.includes('verna')) return false;
      if (f === 'hatchback' && !cat.includes('hatchback') && !name.includes('swift') && !name.includes('i10') && !name.includes('i20')) return false;
      if (f.includes('7-seater') && seating < 7 && !cat.includes('7') && !name.includes('ertiga') && !name.includes('innova')) return false;
      if (f.includes('thar') && !name.includes('thar') && !cat.includes('thar') && !cat.includes('4x4') && !cat.includes('open')) return false;
      if (f === 'automatic' && !trans.includes('auto') && !trans.includes('amt') && !trans.includes('at') && !trans.includes('cvt')) return false;
      if (f === 'manual' && !trans.includes('manual')) return false;
      if (f.includes('scooter') && !cat.includes('scooter') && !name.includes('activa') && !name.includes('jupiter') && !name.includes('moped')) return false;
      if (f.includes('cruiser') && !cat.includes('cruiser') && !name.includes('bullet') && !name.includes('classic') && !name.includes('enfield')) return false;
      if (f.includes('sports') && !cat.includes('sport') && !name.includes('ninja') && !name.includes('r15') && !name.includes('duke') && !name.includes('ktm') && !name.includes('fz')) return false;
    }

    // 2. Search box
    if (searchVeh.trim()) {
      const q = searchVeh.trim().toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !(v.location || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    // 3. craftVehicleTypes from appliedFilters
    const craftTypes = appliedFilters?.craftVehicleTypes || [];
    if (craftTypes.length > 0) {
      const matchCraft = craftTypes.some(ct => {
        const ctl = ct.toLowerCase();
        if (ctl.includes('hatchback')) return cat.includes('hatchback') || name.includes('swift') || name.includes('i10');
        if (ctl.includes('sedan')) return cat.includes('sedan') || name.includes('dzire') || name.includes('city');
        if (ctl.includes('suv')) return cat.includes('suv') || name.includes('creta') || name.includes('brezza');
        if (ctl.includes('7-seater')) return seating >= 7 || cat.includes('7') || name.includes('ertiga');
        if (ctl.includes('thar') || ctl.includes('open')) return name.includes('thar') || cat.includes('open');
        if (ctl.includes('scooter')) return cat.includes('scooter') || name.includes('activa') || name.includes('jupiter');
        if (ctl.includes('cruiser') || ctl.includes('bullet')) return name.includes('bullet') || name.includes('classic') || cat.includes('cruiser');
        return true;
      });
      if (!matchCraft) return false;
    }

    return true;
  });

  const maxMembers = selectedVehicle
    ? (isBikeVehicle(selectedVehicle) ? 2 : (parseInt(selectedVehicle.seating) || 4))
    : (vehicleType === 'bike' ? 2 : 6);

  const handleSelectVehicle = (v) => {
    const max = isBikeVehicle(v) ? 2 : (parseInt(v.seating) || 4);
    if (memberCount > max) {
      setError(`This vehicle accommodates up to ${max} passengers. Please choose another vehicle or reduce the number of members.`);
      return;
    }
    setSelectedVehicle(v);
    setError('');
  };

  const handleVehicleTypeChange = (type) => {
    setVehicleType(type);
    setSelectedVehicle(null);
    setFilterSub('All');
    setError('');
  };

  const handleNext = () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle to continue, or click "Skip Ride".');
      return;
    }
    const max = isBikeVehicle(selectedVehicle) ? 2 : (parseInt(selectedVehicle.seating) || 4);
    if (memberCount > max) {
      setError(`This vehicle accommodates up to ${max} passengers. Please choose another vehicle or reduce the number of members.`);
      return;
    }
    setError('');
    onNext();
  };

  const handleSkip = () => {
    setSelectedVehicle(null);
    setError('');
    onNext();
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#0052ff,#00c6ff)' }}>
          <Car size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Choose Your Ride</h2>
          <p className="cmt-step-sub">Pick a self-drive vehicle or skip if you already have local transport</p>
        </div>
      </div>

      {/* Vehicle Type Toggle */}
      <div className="cmt-toggle-row">
        <button
          type="button"
          className={`cmt-toggle-btn ${vehicleType === 'car' ? 'active' : ''}`}
          onClick={() => handleVehicleTypeChange('car')}
        >
          <Car size={20} /> Cars <span className="cmt-badge">{availableCars.length}</span>
        </button>
        <button
          type="button"
          className={`cmt-toggle-btn ${vehicleType === 'bike' ? 'active' : ''}`}
          onClick={() => handleVehicleTypeChange('bike')}
        >
          <Bike size={20} /> Bikes <span className="cmt-badge">{availableBikes.length}</span>
        </button>
      </div>

      {/* Quick Filters and Search Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 mt-3">
        <div className="d-flex flex-wrap gap-1.5">
          {(vehicleType === 'car' 
            ? ['All', 'SUV', 'Sedan', 'Hatchback', '7-Seater', 'Thar / 4x4', 'Automatic', 'Manual']
            : ['All', 'Scooter', 'Cruiser / Royal Enfield', 'Sports Bike']
          ).map(f => (
            <button
              key={f}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${
                filterSub === f ? 'btn-dark text-white' : 'btn-light text-secondary border'
              }`}
              onClick={() => setFilterSub(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
          <span className="input-group-text bg-white border-end-0 text-muted"><Search size={14} /></span>
          <input
            type="text"
            className="form-control border-start-0 text-xs"
            placeholder={`Search ${vehicleType === 'car' ? 'cars' : 'bikes'}...`}
            value={searchVeh}
            onChange={e => setSearchVeh(e.target.value)}
          />
          {searchVeh && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary border-start-0 bg-white"
              onClick={() => setSearchVeh('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {vehicleType === 'bike' && (
        <div className="cmt-info-banner">
          <AlertCircle size={16} />
          <span>Bikes support a maximum of <strong>2 members</strong> (rider + 1 pillion)</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loadingVehicles && (
        <div className="text-center py-5">
          <Loader2 size={32} className="animate-spin text-primary mb-2" />
          <p className="text-muted fw-semibold">Loading available vehicles for your dates...</p>
        </div>
      )}

      {/* Vehicle Grid */}
      {!loadingVehicles && (
        <div className="cmt-vehicle-grid">
          {filteredVehicles.length === 0 && (
            <div className="cmt-empty text-center py-5 w-100">
              <Car size={40} opacity={0.3} className="mx-auto mb-2" />
              <p className="fw-bold mb-1">No {vehicleType}s match your selected filters.</p>
              <p className="text-muted small mb-3">Try adjusting your filters, searching another model, or skip ride.</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-dark rounded-pill px-3"
                  onClick={() => { setFilterSub('All'); setSearchVeh(''); }}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  onClick={handleSkip}
                >
                  Skip Ride
                </button>
              </div>
            </div>
          )}
          {filteredVehicles.map(v => {
            const isSelected = selectedVehicle?.id === v.id;
            const seats = vehicleType === 'bike' ? 2 : (parseInt(v.seating) || 4);
            return (
              <div
                key={v.id}
                className={`cmt-vehicle-card ${isSelected ? 'selected' : ''}`}
                onClick={() => (onViewVehicleDetails ? onViewVehicleDetails(v) : handleSelectVehicle(v))}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && <div className="cmt-selected-badge"><CheckCircle size={16} /> Selected</div>}
                <div className="cmt-vehicle-img-wrap">
                  <img
                    src={v.image || `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=400&q=80`}
                    alt={v.name}
                    className="cmt-vehicle-img"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <div className="cmt-vehicle-type-tag">{vehicleType === 'bike' ? '🏍️ Bike' : '🚗 Car'}</div>
                </div>
                <div className="cmt-vehicle-info">
                  <h4 className="cmt-vehicle-name">{v.name}</h4>
                  {v.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0052ff', fontWeight: 600, marginBottom: '6px' }}>
                      <MapPin size={11} /> {v.location}
                    </div>
                  )}
                  <div className="cmt-vehicle-specs">
                    <span><Users size={13} /> {seats} seats</span>
                    {v.fuel && <span>⛽ {v.fuel}</span>}
                    {v.category && <span>🏷️ {v.category}</span>}
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
                    <div className="cmt-vehicle-price">
                      <span className="cmt-price-label">per day</span>
                      <span className="cmt-price-val">₹{Number(v.price).toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs d-flex align-items-center gap-1 ${
                        isSelected ? 'btn-success text-white' : 'btn-outline-primary'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewVehicleDetails) {
                          onViewVehicleDetails(v);
                        } else {
                          handleSelectVehicle(v);
                        }
                      }}
                    >
                      {isSelected ? '✓ Selected • View Details' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Count */}
      {selectedVehicle && (
        <div className="cmt-member-section">
          <h5 className="cmt-section-label"><Users size={16} /> Number of Members</h5>
          <div className="cmt-member-slots">
            {Array.from({ length: maxMembers }).map((_, i) => (
              <div
                key={i}
                className={`cmt-member-slot ${i < memberCount ? 'active' : ''}`}
                onClick={() => setMemberCount(i + 1)}
              >
                <User size={20} />
                <span>{i === 0 ? 'You' : `+${i}`}</span>
              </div>
            ))}
          </div>
          <p className="cmt-member-hint">
            {memberCount} member{memberCount > 1 ? 's' : ''} selected
            {vehicleType === 'bike' && ' • Max 2 for bikes'}
          </p>
        </div>
      )}

      {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

      <div className="cmt-nav-row">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="cmt-btn-secondary" onClick={handleSkip}>Skip Ride</button>
          <button type="button" className="cmt-btn-primary" onClick={handleNext}>
            Next: Pick Hotel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Pick Hotel ──────────────────────────────────────────────────────
const GOA_HOTEL_AREAS = [
  'North Goa', 'South Goa', 'Panaji', 'Calangute', 'Baga', 'Anjuna',
  'Vagator', 'Candolim', 'Sinquerim', 'Morjim', 'Arambol', 'Mapusa',
  'Margao', 'Vasco da Gama', 'Colva', 'Benaulim', 'Palolem', 'Ponda'
];

function Step2Hotel({ allHotels = [], pickupDate, dropDate, selectedHotel, setSelectedHotel, memberCount, onNext, onBack, appliedFilters = {}, searchQuery: initialSearchQuery = '', onViewHotelDetails }) {
  const [searchLoc, setSearchLoc] = useState('Goa');
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [galleryHotel, setGalleryHotel] = useState(null);
  const [starFilter, setStarFilter] = useState('All');
  const [searchHotelName, setSearchHotelName] = useState(initialSearchQuery || '');
  const [detailsHotel, setDetailsHotel] = useState(null);

  const validPickup = pickupDate || getTodayDateStr();
  const validDrop = dropDate || getNextDayDateStr(validPickup);
  const nights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

  const handleSearchLive = useCallback(async (overrideLoc) => {
    const locationToSearch = typeof overrideLoc === 'string' ? overrideLoc : searchLoc;
    setLoadingLive(true);
    setError('');
    
    try {
      let pool = allHotels;
      if (!pool || pool.length === 0) {
        pool = await api.fetchHotels().catch(() => []);
      }
      
      const locClean = (locationToSearch || 'Goa').toLowerCase();
      const results = pool.filter(h => {
        const hName = (h.name || '').toLowerCase();
        const hArea = (h.area || '').toLowerCase();
        const hLoc = (h.location || '').toLowerCase();
        return locClean === 'goa' || locClean === 'all goa' || hArea.includes(locClean) || hName.includes(locClean) || hLoc.includes(locClean);
      });

      setLiveHotels(results.length > 0 ? results : pool);
      setHasSearched(true);
    } catch (e) {
      setError(`Could not fetch hotels for "${locationToSearch}".`);
      setLiveHotels(allHotels || []);
      setHasSearched(true);
    } finally {
      setLoadingLive(false);
    }
  }, [searchLoc, allHotels]);

  useEffect(() => {
    handleSearchLive('Goa');
  }, []);

  const handleAreaClick = (area) => {
    const newLoc = area + ', Goa';
    setSearchLoc(newLoc);
    handleSearchLive(newLoc);
  };

  const filteredHotels = liveHotels.filter(h => {
    const stars = String(h.stars || h.star_rating || h.rating || '3');
    const name = (h.name || '').toLowerCase();
    const area = (h.area || '').toLowerCase();
    const type = (h.property_type || h.type || '').toLowerCase();

    // 1. Star filter
    if (starFilter && starFilter !== 'All') {
      if (starFilter === 'boutique') {
        if (!type.includes('boutique') && !type.includes('heritage') && !name.includes('heritage')) return false;
      } else if (!stars.includes(starFilter)) {
        return false;
      }
    }

    // 2. Search hotel name
    if (searchHotelName.trim()) {
      const q = searchHotelName.trim().toLowerCase();
      if (!name.includes(q) && !area.includes(q) && !type.includes(q)) return false;
    }

    // 3. craftHotelTypes from appliedFilters
    const craftHotels = appliedFilters?.craftHotelTypes || [];
    if (craftHotels.length > 0) {
      const match = craftHotels.some(ch => {
        const chl = ch.toLowerCase();
        if (chl.includes('5 star')) return stars.includes('5');
        if (chl.includes('4 star')) return stars.includes('4');
        if (chl.includes('3 star')) return stars.includes('3');
        if (chl.includes('beachfront')) return area.includes('baga') || area.includes('calangute') || area.includes('colva') || name.includes('beach') || name.includes('resort');
        if (chl.includes('heritage') || chl.includes('boutique')) return type.includes('boutique') || type.includes('heritage') || name.includes('heritage');
        return true;
      });
      if (!match) return false;
    }

    return true;
  });

  const handleNext = () => {
    if (!selectedHotel) {
      setError('Please select a hotel to continue, or click "Skip Hotel".');
      return;
    }
    setError('');
    onNext();
  };

  const handleSkip = () => {
    setSelectedHotel(null);
    setError('');
    onNext();
  };

  const getHotelNightPrice = (hotel) => {
    const p = parseFloat(hotel.price_per_night || hotel.price || hotel.rate || 0);
    return isNaN(p) || p === 0 ? 2500 : p;
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c59f)' }}>
          <Hotel size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Pick Your Hotel</h2>
          <p className="cmt-step-sub">Select a stay or skip if you have your own accommodation · {nights} night{nights > 1 ? 's' : ''} · {memberCount} guest{memberCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="cmt-search-bar" style={{ marginBottom: '15px' }}>
        <div className="cmt-search-input-wrap">
          <MapPin size={16} className="cmt-search-icon" />
          <input
            type="text"
            className="cmt-search-input"
            placeholder="Search location e.g. Goa, North Goa, Calangute..."
            value={searchLoc}
            onChange={e => setSearchLoc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchLive()}
          />
        </div>
        <button type="button" className="cmt-btn-search" onClick={handleSearchLive} disabled={loadingLive}>
          {loadingLive ? <span className="cmt-spinner" /> : <Search size={16} />}
          {loadingLive ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Quick Goa Area Selector */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {GOA_HOTEL_AREAS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => handleAreaClick(area)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                background: searchLoc === (area + ', Goa') ? '#eff6ff' : '#fff',
                color: searchLoc === (area + ', Goa') ? '#0052ff' : '#6b7280',
                fontWeight: searchLoc === (area + ', Goa') ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Star Ratings & Hotel Search Filter Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex flex-wrap gap-1.5">
          {[
            { id: 'All', label: 'All Stays' },
            { id: '5', label: '⭐ 5★ Luxury' },
            { id: '4', label: '⭐ 4★ Premium' },
            { id: '3', label: '⭐ 3★ Standard' },
            { id: 'boutique', label: '🏛️ Boutique / Heritage' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${
                starFilter === f.id ? 'btn-dark text-white' : 'btn-light text-secondary border'
              }`}
              onClick={() => setStarFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
          <span className="input-group-text bg-white border-end-0 text-muted"><Search size={14} /></span>
          <input
            type="text"
            className="form-control border-start-0 text-xs"
            placeholder="Filter hotel name..."
            value={searchHotelName}
            onChange={e => setSearchHotelName(e.target.value)}
          />
          {searchHotelName && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary border-start-0 bg-white"
              onClick={() => setSearchHotelName('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

      {/* Hotel List */}
      <div className="mmt-hotel-list">
        {loadingLive && (
          <div className="text-center py-5">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <p className="text-muted fw-semibold">Finding premium hotels in Goa...</p>
          </div>
        )}
        {!loadingLive && hasSearched && filteredHotels.length === 0 && (
          <div className="cmt-empty text-center py-5 bg-white rounded-4 border p-4">
            <Hotel size={40} opacity={0.3} className="mx-auto mb-2" />
            <h5 className="fw-bold text-dark mb-1">No hotels found matching your filters in {searchLoc}.</h5>
            <p className="text-muted small mb-3">Try clearing your filters, searching another area, or skip hotel.</p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-dark rounded-pill px-3"
                onClick={() => { setStarFilter('All'); setSearchHotelName(''); setSearchLoc('Goa'); handleSearchLive('Goa'); }}
              >
                Clear Hotel Filters
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={handleSkip}
              >
                Skip Hotel
              </button>
            </div>
          </div>
        )}
        {!loadingLive && filteredHotels.map((h, idx) => {
          const isSelected = selectedHotel?.id === h.id || (selectedHotel?.name === h.name);
          const nightPrice = getHotelNightPrice(h);
          const totalHotelPrice = nightPrice * nights;
          const stars = parseInt(h.stars || h.star_rating || h.rating || 3);
          
          return (
            <div 
              key={h.id || idx} 
              className={`mmt-hotel-card ${isSelected ? 'border-primary' : ''}`}
              style={{ 
                cursor: 'pointer', 
                borderWidth: isSelected ? '2px' : '1px', 
                boxShadow: isSelected ? '0 8px 24px rgba(0,82,255,0.15)' : '',
                position: 'relative'
              }}
              onClick={() => {
                if (onViewHotelDetails) {
                  onViewHotelDetails(h);
                } else {
                  setDetailsHotel(h);
                }
              }}
            >
              {isSelected && (
                <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                  <CheckCircle size={28} color="#0052ff" fill="#fff" />
                </div>
              )}
              <div className="mmt-hotel-img-wrapper" onClick={(e) => { e.stopPropagation(); if (onViewHotelDetails) onViewHotelDetails(h); else setDetailsHotel(h); }} style={{ cursor: 'pointer', position: 'relative' }}>
                <img 
                  src={h.image || h.photo || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80`} 
                  alt={h.name} 
                  className="mmt-hotel-img" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'; }}
                />
                <span className="position-absolute top-0 start-0 m-3 badge bg-dark text-white rounded-pill shadow-sm">
                  {h.badge || 'Verified Stay'}
                </span>
                <div className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white rounded shadow-sm">
                  View Details
                </div>
              </div>
              
              <div className="mmt-hotel-info">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="d-flex text-warning">
                        {[...Array(Math.min(stars, 5))].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <h3 className="mmt-hotel-title">{h.name}</h3>
                    <div className="mmt-hotel-location">
                      <MapPin size={14} />
                      {h.area || h.location || searchLoc}
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column align-items-end">
                    <div className="d-flex align-items-center bg-success text-white px-2 py-1 rounded mb-1">
                      <span className="fw-bold fs-6">{h.rating || 4.5}</span>
                      <span className="ms-1 small">/ 5</span>
                    </div>
                    <span className="small text-muted fw-semibold">Excellent</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-success small fw-bold d-flex align-items-center mb-1">
                    <Check size={14} className="me-1" /> Free Cancellation till 24 hrs before check-in
                  </span>
                  <div className="text-muted small">
                    {h.amenities ? (Array.isArray(h.amenities) ? h.amenities.slice(0, 4).join(' • ') : h.amenities) : 'Free WiFi • Pool • Breakfast'}
                  </div>
                </div>

                <div className="mmt-hotel-price-row">
                  <div>
                    <span className="mmt-hotel-price">₹{nightPrice.toLocaleString('en-IN')}</span>
                    <span className="mmt-hotel-per-night"> / night</span>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      ₹{totalHotelPrice.toLocaleString('en-IN')} for {nights} night{nights > 1 ? 's' : ''} (excl. taxes)
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${isSelected ? 'btn-success text-white' : 'btn-outline-primary'} px-3 fw-bold rounded-pill d-flex align-items-center gap-1`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewHotelDetails) {
                        onViewHotelDetails(h);
                      } else {
                        setDetailsHotel(h);
                      }
                    }}
                  >
                    {isSelected ? '✓ Selected • View Details' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cmt-nav-row">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="cmt-btn-secondary" onClick={handleSkip}>Skip Hotel</button>
          <button type="button" className="cmt-btn-primary" onClick={handleNext}>
            Next: Sightseeing & Activities <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {detailsHotel && (
        <CraftServiceDetailsModal
          isOpen={Boolean(detailsHotel)}
          serviceType="hotel"
          item={detailsHotel}
          pickupDate={pickupDate}
          dropDate={dropDate}
          bookingDays={nights}
          memberCount={memberCount}
          isSelected={selectedHotel?.id === detailsHotel?.id || selectedHotel?.name === detailsHotel?.name}
          onClose={() => setDetailsHotel(null)}
          onSelect={(h) => {
            const nightPrice = getHotelNightPrice(h);
            const totalHotelPrice = nightPrice * nights;
            setSelectedHotel({ ...h, _nightPrice: nightPrice, _totalPrice: totalHotelPrice, _nights: nights });
            setDetailsHotel(null);
          }}
          onDeselect={() => {
            setSelectedHotel(null);
            setDetailsHotel(null);
          }}
          onContinue={(h) => {
            const nightPrice = getHotelNightPrice(h);
            const totalHotelPrice = nightPrice * nights;
            setSelectedHotel({ ...h, _nightPrice: nightPrice, _totalPrice: totalHotelPrice, _nights: nights });
            setDetailsHotel(null);
            onNext();
          }}
        />
      )}
      
      {galleryHotel && (
        <HotelImageGallery 
          hotel={galleryHotel} 
          nights={nights}
          onSelect={() => {
            const nightPrice = getHotelNightPrice(galleryHotel);
            const totalHotelPrice = nightPrice * nights;
            setSelectedHotel({ ...galleryHotel, _nightPrice: nightPrice, _totalPrice: totalHotelPrice, _nights: nights });
            setGalleryHotel(null);
          }}
          onClose={() => setGalleryHotel(null)} 
        />
      )}
    </div>
  );
}

// ─── Step 3: Sightseeing & Activities ──────────────────────────────────────
function Step3Activities({
  allActivities = [],
  selectedActivities = [],
  setSelectedActivities,
  memberCount,
  onNext,
  onBack,
  appliedFilters = {},
  searchQuery: initialSearchQuery = '',
  onViewActivityDetails
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'sightseeing', 'activity'
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [liveActivities, setLiveActivities] = useState(allActivities || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (allActivities && allActivities.length > 0) {
      setLiveActivities(allActivities);
    } else {
      setLoading(true);
      api.getActivities()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setLiveActivities(data);
          }
        })
        .catch(err => console.error('Failed to load activities:', err))
        .finally(() => setLoading(false));
    }
  }, [allActivities]);

  const toggleActivity = (act) => {
    const isSelected = selectedActivities.some(a => String(a.id) === String(act.id));
    if (isSelected) {
      setSelectedActivities(selectedActivities.filter(a => String(a.id) !== String(act.id)));
    } else {
      setSelectedActivities([...selectedActivities, act]);
    }
  };

  const filtered = liveActivities.filter(act => {
    const type = String(act.type || act.item_type || '').toLowerCase();
    const cat = String(act.category || '').toLowerCase();
    const name = String(act.title || act.name || '').toLowerCase();
    const loc = String(act.location || '').toLowerCase();
    const isSight = type === 'sightseeing' || cat.includes('sight') || cat.includes('tour') || cat.includes('heritage');
    const isAct = type === 'activity' || cat.includes('water') || cat.includes('adventure') || cat.includes('sport') || cat.includes('cruise') || !isSight;

    // 1. Type filter pills
    if (filterType === 'sightseeing' && !isSight) return false;
    if (filterType === 'activity' && !isAct) return false;

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!name.includes(q) && !loc.includes(q) && !cat.includes(q)) return false;
    }

    // 3. craftExperienceTypes / activityTypes from appliedFilters
    const expFilters = appliedFilters?.craftExperienceTypes || appliedFilters?.activityTypes || [];
    if (expFilters.length > 0) {
      const match = expFilters.some(exp => {
        const expl = exp.toLowerCase();
        if (expl.includes('water') || expl.includes('scuba')) return cat.includes('water') || cat.includes('scuba') || name.includes('scuba') || name.includes('water');
        if (expl.includes('cruise') || expl.includes('island')) return cat.includes('cruise') || cat.includes('island') || name.includes('cruise') || name.includes('island');
        if (expl.includes('heritage') || expl.includes('church')) return cat.includes('heritage') || cat.includes('church') || cat.includes('sight') || name.includes('heritage') || name.includes('church') || isSight;
        if (expl.includes('nightlife') || expl.includes('pub')) return cat.includes('night') || cat.includes('pub') || cat.includes('club') || name.includes('night') || name.includes('pub');
        if (expl.includes('adventure') || expl.includes('trek')) return cat.includes('adventure') || cat.includes('trek') || name.includes('trek') || name.includes('adventure');
        if (expl.includes('romantic') || expl.includes('sunset')) return cat.includes('sunset') || cat.includes('romantic') || name.includes('sunset');
        return true;
      });
      if (!match) return false;
    }

    // 4. Price range filter from appliedFilters
    const priceRanges = appliedFilters?.activityPriceRanges || [];
    if (priceRanges.length > 0) {
      const price = parseFloat(act.price) || 0;
      const matchPrice = priceRanges.some(pr => {
        if (pr === 'under_500') return price < 500;
        if (pr === '500_1500') return price >= 500 && price <= 1500;
        if (pr === '1500_3000') return price >= 1500 && price <= 3000;
        if (pr === 'above_3000') return price > 3000;
        return true;
      });
      if (!matchPrice) return false;
    }

    return true;
  });

  const totalActivitiesCost = selectedActivities.reduce((sum, a) => sum + (parseFloat(a.price) || 0) * memberCount, 0);

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <Compass size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Sightseeing & Activities</h2>
          <p className="cmt-step-sub">
            Add iconic Goan heritage tours and thrilling adventure activities · Select multiple or skip to next step
          </p>
        </div>
      </div>

      {/* Selected Items Banner */}
      {selectedActivities.length > 0 && (
        <div className="alert alert-success d-flex align-items-center justify-content-between p-3 rounded-4 border-0 mb-4 shadow-sm" style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
          <div className="d-flex align-items-center gap-2">
            <CheckCircle size={20} className="text-success flex-shrink-0" />
            <div>
              <strong className="text-dark">{selectedActivities.length} Experience{selectedActivities.length > 1 ? 's' : ''} Selected</strong>
              <div className="text-muted small">
                {selectedActivities.map(a => a.title || a.name).join(' · ')}
              </div>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-success text-white px-3 py-1.5 rounded-pill fs-6 fw-bold">
              +₹{totalActivitiesCost.toLocaleString('en-IN')}
            </span>
            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>for {memberCount} guest{memberCount > 1 ? 's' : ''}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${filterType === 'all' ? 'btn-dark text-white' : 'btn-light text-secondary border'}`}
            onClick={() => setFilterType('all')}
          >
            All Experiences ({liveActivities.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${filterType === 'sightseeing' ? 'btn-dark text-white' : 'btn-light text-secondary border'}`}
            onClick={() => setFilterType('sightseeing')}
          >
            🏛️ Sightseeing Packages
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${filterType === 'activity' ? 'btn-dark text-white' : 'btn-light text-secondary border'}`}
            onClick={() => setFilterType('activity')}
          >
            🪂 Activities & Adventures
          </button>
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
          <span className="input-group-text bg-white border-end-0 text-muted"><Search size={14} /></span>
          <input
            type="text"
            className="form-control border-start-0 text-xs"
            placeholder="Search activities & tours..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary border-start-0 bg-white"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="spinner-border text-primary mb-2" />
          <p className="text-muted small">Loading available sightseeing & activities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border p-4">
          <Compass size={40} className="text-muted opacity-50 mb-2 mx-auto" />
          <h6 className="fw-bold text-dark mb-1">No Experiences Found</h6>
          <p className="text-muted small mb-3">Try clearing your filters or search keywords.</p>
          <div className="d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-dark rounded-pill px-3"
              onClick={() => { setFilterType('all'); setSearchQuery(''); }}
            >
              Reset Filters
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={onNext}
            >
              Skip to Next Step
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(act => {
            const isSelected = selectedActivities.some(a => String(a.id) === String(act.id));
            const isSight = String(act.type || act.item_type || '').toLowerCase() === 'sightseeing' ||
                            String(act.category || '').toLowerCase().includes('sight') ||
                            String(act.category || '').toLowerCase().includes('heritage');
            const unitPrice = parseFloat(act.price) || 0;
            const itemTotal = unitPrice * memberCount;

            return (
              <div key={act.id} className="col-12 col-md-6">
                <div
                  onClick={() => onViewActivityDetails && onViewActivityDetails(act)}
                  className={`card h-100 border rounded-4 overflow-hidden shadow-xs cursor-pointer transition-all ${
                    isSelected ? 'border-success border-2 shadow-sm' : 'border-light-subtle hover-shadow-md'
                  }`}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    transform: isSelected ? 'scale(1.01)' : 'none'
                  }}
                >
                  <div className="row g-0 h-100">
                    <div className="col-4 position-relative">
                      <img
                        src={act.image_url || act.image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=60'}
                        alt={act.title || act.name}
                        className="w-100 h-100 object-fit-cover"
                        style={{ minHeight: '140px' }}
                      />
                      <span
                        className="badge position-absolute top-2 start-2 text-xxs fw-bold px-2 py-1 rounded-pill"
                        style={{
                          background: isSight ? '#0f172a' : '#0284c7',
                          color: '#fff'
                        }}
                      >
                        {isSight ? '🏛️ Sightseeing' : '🎯 Activity'}
                      </span>
                    </div>
                    <div className="col-8 p-3 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="badge bg-light text-muted border text-3xs px-2 py-0.5 rounded-pill">
                            {act.category || (isSight ? 'Sightseeing' : 'Activity')}
                          </span>
                          {isSelected ? (
                            <span className="badge bg-success text-white d-flex align-items-center gap-1 text-3xs px-2 py-0.5 rounded-pill">
                              <Check size={11} /> Added
                            </span>
                          ) : (
                            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Click to view</span>
                          )}
                        </div>
                        <h6 className="fw-bold text-dark mb-1 font-heading" style={{ fontSize: '0.92rem' }}>
                          {act.title || act.name}
                        </h6>
                        <p className="text-muted text-xxs mb-2 line-clamp-2 leading-relaxed" style={{ fontSize: '0.74rem' }}>
                          {act.description}
                        </p>
                      </div>

                      <div>
                        <div className="d-flex align-items-center gap-3 text-muted text-xxs mb-2">
                          <span className="d-flex align-items-center gap-1">
                            <MapPin size={12} className="text-danger flex-shrink-0" />
                            <span className="text-truncate" style={{ maxWidth: '120px' }}>{act.location || 'Goa'}</span>
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={12} className="text-primary flex-shrink-0" />
                            <span>{act.duration || 'Flexible'}</span>
                          </span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between pt-1 border-top">
                          <div>
                            <span className="fw-extrabold text-success" style={{ fontSize: '0.95rem' }}>
                              ₹{unitPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.68rem' }}> / person</span>
                            {memberCount > 1 && (
                              <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                                (₹{itemTotal.toLocaleString('en-IN')} for {memberCount})
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1 ${
                              isSelected ? 'btn-success text-white' : 'btn-outline-primary'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewActivityDetails) {
                                onViewActivityDetails(act);
                              }
                            }}
                          >
                            {isSelected ? '✓ Added • View Details' : 'View Details & Add'}
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
      )}

      {/* Navigation Buttons */}
      <div className="cmt-nav-row mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Hotel
        </button>
        <div className="d-flex gap-2">
          {selectedActivities.length === 0 ? (
            <button type="button" className="btn btn-outline-secondary rounded-pill px-3 py-2 text-xs fw-semibold" onClick={onNext}>
              Skip Experiences
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-danger rounded-pill px-3 py-2 text-xs"
              onClick={() => setSelectedActivities([])}
            >
              Clear Selected
            </button>
          )}
          <button type="button" className="cmt-btn-primary" onClick={onNext}>
            {selectedActivities.length > 0 ? `Continue with ${selectedActivities.length} Experience${selectedActivities.length > 1 ? 's' : ''}` : 'Continue to Flight'} <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Step 4: Add Flight (Optional) ──────────────────────────────────────────
function Step4Flight({ selectedFlight, setSelectedFlight, withFlight, setWithFlight, pickupDate, memberCount, onNext, onBack, onViewFlightDetails }) {
  const [fromAirport, setFromAirport] = useState('DEL');
  const [toAirport, setToAirport] = useState('GOI');
  const [flightDate, setFlightDate] = useState(pickupDate || getTodayDateStr());
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (pickupDate) {
      setFlightDate(pickupDate);
    }
  }, [pickupDate]);

  const handleSearch = async () => {
    if (!fromAirport || !toAirport || !flightDate) {
      setError('Please fill From, To, and Date fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const results = await api.searchFlights(fromAirport, toAirport, flightDate, memberCount, 0, 0, 'economy');
      setFlights(results || []);
      setSearched(true);
    } catch (e) {
      setError('Could not fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (withFlight && !selectedFlight) {
      setError('Please select a flight, or choose "Without Flight".');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
          <Plane size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Add a Flight?</h2>
          <p className="cmt-step-sub">Flights are <strong>optional</strong> — skip if you're already in Goa!</p>
        </div>
      </div>

      {/* With / Without Toggle */}
      <div className="cmt-flight-toggle-row">
        <button
          type="button"
          className={`cmt-flight-toggle ${withFlight ? 'active' : ''}`}
          onClick={() => { setWithFlight(true); setSelectedFlight(null); }}
        >
          <PlaneTakeoff size={18} /> With Flight
        </button>
        <button
          type="button"
          className={`cmt-flight-toggle ${!withFlight ? 'active-no' : ''}`}
          onClick={() => { setWithFlight(false); setSelectedFlight(null); setFlights([]); setSearched(false); }}
        >
          <X size={18} /> Without Flight
        </button>
      </div>

      {!withFlight && (
        <div className="cmt-no-flight-card">
          <BadgeCheck size={40} color="#10b981" />
          <h4>No Flight Selected</h4>
          <p>You'll arrange your own travel to Goa. We'll focus on your stay and vehicle! 🏖️</p>
        </div>
      )}

      {withFlight && (
        <>
          {/* Search Form */}
          <div className="cmt-flight-search-form">
            <div className="cmt-flight-field">
              <label><PlaneTakeoff size={14} /> From (IATA Code)</label>
              <input
                className="cmt-input"
                placeholder="e.g. DEL, BOM, BLR"
                value={fromAirport}
                onChange={e => setFromAirport(e.target.value.toUpperCase())}
              />
            </div>
            <div className="cmt-flight-field">
              <label><PlaneLanding size={14} /> To (IATA Code)</label>
              <input
                className="cmt-input"
                placeholder="e.g. GOI"
                value={toAirport}
                onChange={e => setToAirport(e.target.value.toUpperCase())}
              />
            </div>
            <div className="cmt-flight-field">
              <label><Calendar size={14} /> Travel Date</label>
              <input
                type="date"
                className="cmt-input"
                min={getTodayDateStr()}
                value={flightDate}
                onChange={e => setFlightDate(e.target.value)}
                required
              />
            </div>
            <div className="cmt-flight-field">
              <label><Users size={14} /> Passengers</label>
              <div className="cmt-input cmt-input-static">{memberCount} Adult{memberCount > 1 ? 's' : ''}</div>
            </div>
            <button type="button" className="cmt-btn-search cmt-flight-search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="cmt-spinner" /> : <Search size={16} />}
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>

          {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

          {/* Flight Results */}
          {searched && (
            <div className="mmt-flight-list mt-4">
              {flights.length === 0 && (
                <div className="text-center py-5 bg-white rounded border">
                  <Plane size={40} opacity={0.3} className="mb-3" />
                  <h4 className="text-muted">No direct flights found. Showing standard Goa flight options.</h4>
                </div>
              )}
              {flights.map((f, i) => {
                const isSelected = selectedFlight?.id === f.id;
                const airlineName = f.airline?.name || f.airline || 'IndiGo';
                const depTime = f.departure_time || '08:00';
                const arrTime = f.arrival_time || '10:30';
                const price = parseFloat(f.price || 4500);
                const totalFlightPrice = (price * memberCount).toLocaleString('en-IN');

                return (
                  <div 
                    key={f.id || i} 
                    className="card border-0 shadow-sm rounded mb-3" 
                    style={{ borderWidth: isSelected ? '2px' : '1px', borderStyle: 'solid', borderColor: isSelected ? '#0d6efd' : '#e5e7eb', cursor: 'pointer' }}
                    onClick={() => onViewFlightDetails ? onViewFlightDetails(f) : setSelectedFlight(f)}
                  >
                    <div className="card-body p-3 d-flex flex-column flex-md-row align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="fw-bold text-dark">{airlineName} ({f.flight_number || '6E-204'})</div>
                      </div>
                      
                      <div className="d-flex align-items-center gap-4 my-2 my-md-0">
                        <div className="text-center">
                          <div className="fw-bold text-dark">{depTime}</div>
                          <span className="text-muted small">{f.from_loc || fromAirport}</span>
                        </div>
                        <span className="small text-muted">✈️ 2h 30m</span>
                        <div className="text-center">
                          <div className="fw-bold text-dark">{arrTime}</div>
                          <span className="text-muted small">{f.to_loc || toAirport}</span>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-dark fs-5">₹{price.toLocaleString('en-IN')}</div>
                        <div className="small text-muted mb-2">Total: ₹{totalFlightPrice}</div>
                        <button 
                          type="button" 
                          className={`btn btn-sm ${isSelected ? 'btn-success text-white' : 'btn-outline-primary'} rounded-pill px-3 fw-bold`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewFlightDetails) {
                              onViewFlightDetails(f);
                            } else {
                              setSelectedFlight(f);
                            }
                          }}
                        >
                          {isSelected ? '✓ Selected • View Details' : 'View Details & Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Navigation Footer */}
      <div className="cmt-nav-row d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Activities
        </button>
        <button
          type="button"
          className="cmt-btn-primary"
          onClick={() => {
            if (withFlight && !selectedFlight) {
              setError('Please choose a flight or toggle flight off.');
              return;
            }
            onNext();
          }}
        >
          Review Trip <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Step5ReviewPay({ selectedVehicle, selectedHotel, selectedActivities = [], selectedFlight, withFlight, memberCount, pickupDate, dropDate, onBack, onConfirm, currentUser }) {
  const [name, setName] = useState(currentUser?.name || currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [license, setLicense] = useState(currentUser?.license || '');
  const [dob, setDob] = useState(currentUser?.date_of_birth || '');
  const [paymentMode, setPaymentMode] = useState('full');
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);
  const [confirmedCashbackPreview, setConfirmedCashbackPreview] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name || currentUser.username) setName(prev => prev || currentUser.name || currentUser.username || '');
      if (currentUser.phone) setPhone(prev => prev || currentUser.phone || '');
      if (currentUser.email) setEmail(prev => prev || currentUser.email || '');
      if (currentUser.license) setLicense(prev => prev || currentUser.license || '');
      if (currentUser.date_of_birth) setDob(prev => prev || currentUser.date_of_birth || '');
    }
  }, [currentUser]);

  // Auto-fetch DOB & Wallet & Loyalty for repeat customer by phone
  useEffect(() => {
    const clean = String(phone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      api.checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setDob(prev => prev || res.date_of_birth);
          setName(prev => prev || res.name || '');
        }
      }).catch(() => {});

      api.fetchCustomerWallet(clean).then(w => {
        if (w && w.available_balance > 0) {
          setWalletBalance(w.available_balance);
        } else {
          setWalletBalance(0);
          setUseWalletCashback(false);
        }
        if (w && w.loyalty) {
          setLoyaltyInfo(w.loyalty);
        } else {
          setLoyaltyInfo(null);
        }
      }).catch(() => {
        setWalletBalance(0);
        setLoyaltyInfo(null);
      });
    } else {
      setWalletBalance(0);
      setUseWalletCashback(false);
      setLoyaltyInfo(null);
    }
  }, [phone]);

  const validPickup = pickupDate || getTodayDateStr();
  const validDrop = dropDate || getNextDayDateStr(validPickup);
  const nights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

  const vehiclePrice = selectedVehicle ? (parseFloat(selectedVehicle.price) || 0) * nights : 0;
  const hotelPrice = selectedHotel ? (selectedHotel._totalPrice || (parseFloat(selectedHotel.price_per_night || selectedHotel.price || 2500) * nights)) : 0;
  const flightPrice = withFlight && selectedFlight ? (parseFloat(selectedFlight.price) || 4500) * memberCount : 0;
  const activitiesPrice = (selectedActivities || []).reduce((sum, act) => sum + (parseFloat(act.price) || 0) * memberCount, 0);

  const subtotal = vehiclePrice + hotelPrice + flightPrice + activitiesPrice;
  const gst = Math.round(subtotal * 0.18);
  const serviceFee = subtotal > 0 ? 250 : 0;
  const rawGrandTotal = subtotal + gst + serviceFee;

  // Authoritative Loyalty Tier & Tier Discount Enforcement
  const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
  const isGold = customerTier === 'Gold';
  const isPlatinum = customerTier === 'Platinum';

  const isGoldEligible = isGold && rawGrandTotal > 5000;
  const isPlatinumEligible = isPlatinum && rawGrandTotal > 10000;

  let tierDiscount = 0;
  if (isGoldEligible) {
    tierDiscount = 500;
  } else if (isPlatinumEligible) {
    tierDiscount = 1000;
  }

  const grandTotal = Math.max(0, rawGrandTotal - tierDiscount);
  const maxWalletBenefit = Math.round(grandTotal * 0.10);
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
  const finalPayableTotal = Math.max(0, grandTotal - appliedWalletAmount);

  const advanceAmount = Math.round(grandTotal * 0.3);
  const amountDue = paymentMode === 'full' 
    ? finalPayableTotal 
    : Math.max(0, advanceAmount - appliedWalletAmount);

  const projectedCashback = Math.round(finalPayableTotal * 0.10);

  const handleConfirm = async () => {
    if (!selectedVehicle && !selectedHotel && (!withFlight || !selectedFlight) && (!selectedActivities || selectedActivities.length === 0)) {
      setError('Please select at least one item (Vehicle, Hotel, Sightseeing/Activity, or Flight) to book.');
      return;
    }
    if (!name || !phone) {
      setError('Please fill in your name and phone number.');
      return;
    }

    if (selectedVehicle) {
      const elig = validateVehicleBookingEligibility(dob, validPickup, true, license);
      if (!elig.valid) {
        setError(elig.error);
        return;
      }
    }

    setError('');
    setBooking(true);

    const actSummary = (selectedActivities || []).map(a => a.title || a.name);
    const itemName = [
      selectedVehicle ? selectedVehicle.name : null,
      selectedHotel ? selectedHotel.name : null,
      actSummary.length > 0 ? (actSummary.length === 1 ? actSummary[0] : `${actSummary.length} Experiences`) : null,
      withFlight && selectedFlight ? (selectedFlight.airline?.name || selectedFlight.airline || 'Flight') : null
    ].filter(Boolean).join(' + ') || 'Custom Goa Holiday';

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const determinedPackageType = selectedVehicle
      ? 'Self Drive Package'
      : (selectedHotel && !withFlight && (!selectedActivities || selectedActivities.length === 0)
        ? 'Hotel Stay'
        : 'Trip Package');
    const determinedType = 'selfdrive';

    const cmtPayload = {
      name,
      customer_name: name,
      phone,
      customer_phone: phone,
      customer_id: currentUser?.id || `c_${cleanPhone || Date.now()}`,
      license: selectedVehicle ? license : '',
      date_of_birth: dob || '',
      pickup_loc: selectedVehicle?.location || 'Goa',
      pickup_location: selectedVehicle?.location || 'Goa',
      drop_loc: selectedVehicle?.location || 'Goa',
      drop_location: selectedVehicle?.location || 'Goa',
      pickup_date: validPickup,
      drop_date: validDrop,
      item_id: `craft-${Date.now()}`,
      item_name: `Craft My Trip: ${itemName}`,
      package_name: `Craft My Trip: ${itemName}`,
      package_type: determinedPackageType,
      type: determinedType,
      vehicle_name: selectedVehicle?.name || (selectedHotel?.name ? '' : (selectedActivities[0]?.title || 'Custom Tour')),
      vehicle_image: selectedVehicle?.image || '',
      image: selectedVehicle?.image || selectedHotel?.image || selectedActivities[0]?.image_url || selectedActivities[0]?.image || '',
      hotel_name: selectedHotel?.name || '',
      booking_days: nights,
      duration: `${nights} Nights / ${nights + 1} Days`,
      total_amount: rawGrandTotal,
      tier_discount_applied: tierDiscount,
      customer_tier_at_booking: customerTier,
      wallet_amount_used: appliedWalletAmount,
      amount_paid: amountDue,
      total_paid: paymentMode === 'full' ? grandTotal : (advanceAmount + appliedWalletAmount),
      paid_amount: amountDue,
      remaining_amount: Math.max(0, grandTotal - (amountDue + appliedWalletAmount)),
      pending_amount: Math.max(0, grandTotal - (amountDue + appliedWalletAmount)),
      status: 'Confirmed',
      payment_status: paymentMode === 'full' ? 'Full' : 'Partial',
      customizations: JSON.stringify({
        vehicle: selectedVehicle ? {
          id: selectedVehicle.id,
          name: selectedVehicle.name,
          vehicle_type: isBikeVehicle(selectedVehicle) ? 'bike' : 'car',
          price: vehiclePrice
        } : null,
        hotel: selectedHotel ? {
          id: selectedHotel.id,
          name: selectedHotel.name,
          price: hotelPrice,
          ...(selectedHotel.preselected_room?.name ? { room_type_name: selectedHotel.preselected_room.name } : {}),
          ...(selectedHotel.preselected_rate_plan?.meal_plan_label || selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan ? {
            meal_plan: selectedHotel.preselected_rate_plan?.meal_plan_label || selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan
          } : {}),
          ...(selectedHotel.preselected_rate_plan?.id ? { rate_plan_id: selectedHotel.preselected_rate_plan.id } : {})
        } : null,
        activities: (selectedActivities || []).map(a => ({ id: a.id, title: a.title || a.name, type: a.type, price: a.price, location: a.location, duration: a.duration })),
        flight: withFlight && selectedFlight ? {
          id: selectedFlight.id,
          airline: selectedFlight.airline?.name || selectedFlight.airline,
          ...(selectedFlight.flight_number ? { flight_number: selectedFlight.flight_number } : {}),
          ...(selectedFlight.from_loc || selectedFlight.from ? { from: selectedFlight.from_loc || selectedFlight.from } : {}),
          ...(selectedFlight.to_loc || selectedFlight.to ? { to: selectedFlight.to_loc || selectedFlight.to } : {}),
          price: flightPrice
        } : null,
        members: memberCount,
        payment_mode: paymentMode
      })
    };

    try {
      const res = await api.createBooking(cmtPayload);
      const bookingId = res?.booking_id || res?.id || `CMT-${Date.now()}`;
      const cashbackPreview = res?.cashback_preview || null;
      const fullRecord = { ...cmtPayload, id: bookingId, cashback_preview: cashbackPreview };
      try {
        sessionStorage.setItem('customer_login_phone', cleanPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(fullRecord));
        localStorage.setItem('customer_login_phone', cleanPhone);
        localStorage.setItem('last_created_booking', JSON.stringify(fullRecord));
        const existing = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        localStorage.setItem('local_bookings', JSON.stringify([fullRecord, ...existing.filter(b => String(b.id) !== String(bookingId))]));
      } catch (e) {}
      setConfirmedBookingId(bookingId);
      setConfirmedCashbackPreview(cashbackPreview);
      setShowSuccess(true);
      if (onConfirm) onConfirm(fullRecord);
    } catch (e) {
      setError('Booking failed: ' + e.message);
    } finally {
      setBooking(false);
    }
  };

  if (showSuccess) {
    const confirmationDetails = [
      selectedVehicle ? { label: 'Vehicle Ride', value: selectedVehicle.name, icon: <Car size={13} /> } : null,
      selectedHotel ? { 
        label: 'Hotel Stay', 
        value: `${selectedHotel.name}${selectedHotel.preselected_room?.name ? ` (${selectedHotel.preselected_room.name})` : ''}`, 
        icon: <Hotel size={13} /> 
      } : null,
      (selectedActivities && selectedActivities.length > 0) ? { 
        label: 'Sightseeing & Activities', 
        value: selectedActivities.map(a => a.title || a.name).join(', '), 
        icon: <Compass size={13} /> 
      } : null,
      (withFlight && selectedFlight) ? { 
        label: 'Flight Included', 
        value: `${selectedFlight.airline?.name || selectedFlight.airline}${selectedFlight.flight_number ? ` (${selectedFlight.flight_number})` : ''}`, 
        icon: <Plane size={13} /> 
      } : null,
      {
        label: 'Trip Duration',
        value: `${validPickup} to ${validDrop} (${nights} Nights / ${nights + 1} Days)`,
        icon: <Calendar size={13} />
      },
      memberCount ? {
        label: 'Travelers',
        value: `${memberCount} Guest${memberCount > 1 ? 's' : ''}`,
        icon: <Users size={13} />
      } : null
    ].filter(Boolean);

    return (
      <div className="cmt-success-screen animate-fade-in-up" style={{ maxWidth: '580px', margin: '0 auto', padding: '1rem' }}>
        <BookingConfirmationCard 
          bookingId={confirmedBookingId || 'TG-CMT'}
          customerName={name || 'Valued Guest'}
          customerPhone={phone}
          serviceTitle="Custom Crafted Goa Trip"
          serviceSubtitle={`${nights} Nights / ${nights + 1} Days Custom Itinerary`}
          cashbackPreview={confirmedCashbackPreview}
          details={confirmationDetails}
          amountPaid={amountDue}
          totalAmount={grandTotal}
          remainingBalance={paymentMode === 'full' ? 0 : Math.max(0, grandTotal - amountDue)}
          paymentStatus={paymentMode === 'full' ? 'Fully Paid' : '30% Advance Paid'}
          paymentMode={paymentMode === 'full' ? 'Full Payment' : '30% Advance Payment'}
          isModalView={true}
          actions={
            <button 
              type="button" 
              className="btn btn-outline-secondary rounded-pill px-4 py-2 text-xs fw-bold"
              onClick={() => {
                if (onConfirm) onConfirm();
                window.location.href = '/';
              }}
            >
              Return to Home
            </button>
          }
        />
      </div>
    );
  }

  const isBike = selectedVehicle ? isBikeVehicle(selectedVehicle) : false;

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <CreditCard size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Review & Pay</h2>
          <p className="cmt-step-sub">Review your customized package breakdown before confirming</p>
        </div>
      </div>

      <div className="cmt-review-grid">
        {/* Itemized Summary */}
        <div className="cmt-summary-card">
          <h5 className="cmt-summary-title">Trip Summary ({nights} Days · {memberCount} Member{memberCount > 1 ? 's' : ''})</h5>
          
          <div className="cmt-summary-items">
            {selectedVehicle ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  {isBike ? (
                    <Bike size={18} className="text-primary" />
                  ) : (
                    <Car size={18} className="text-primary" />
                  )}
                  <div>
                    <div className="fw-bold">{selectedVehicle.name}</div>
                    <div className="text-muted small">₹{Number(selectedVehicle.price).toLocaleString('en-IN')} × {nights} days</div>
                  </div>
                </div>
                <span className="fw-bold">₹{vehiclePrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Car size={18} opacity={0.4} />
                  <span>No vehicle selected (Skipped)</span>
                </div>
                <span>₹0</span>
              </div>
            )}

            {selectedHotel ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  <Hotel size={18} className="text-warning" />
                  <div>
                    <div className="fw-bold">{selectedHotel.name}</div>
                    {(selectedHotel.preselected_room?.name || selectedHotel.preselected_rate_plan?.meal_plan_label || selectedHotel.preselected_rate_plan?.name) && (
                      <div className="text-dark small fw-semibold" style={{ fontSize: '12px' }}>
                        {[
                          selectedHotel.preselected_room?.name,
                          selectedHotel.preselected_rate_plan?.meal_plan_label || selectedHotel.preselected_rate_plan?.name || selectedHotel.preselected_rate_plan?.meal_plan
                        ].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="text-muted small">
                      ₹{Math.round(selectedHotel._nightPrice || (hotelPrice / nights)).toLocaleString('en-IN')} × {nights} night{nights > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <span className="fw-bold">₹{hotelPrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Hotel size={18} opacity={0.4} />
                  <span>No hotel selected (Skipped)</span>
                </div>
                <span>₹0</span>
              </div>
            )}

            {/* Sightseeing & Activities Itemized */}
            {selectedActivities && selectedActivities.length > 0 ? (
              selectedActivities.map(act => (
                <div key={act.id} className="cmt-summary-item">
                  <div className="d-flex align-items-center gap-2">
                    <Compass size={18} className="text-success" />
                    <div>
                      <div className="fw-bold">{act.title || act.name}</div>
                      <div className="text-muted small">
                        ₹{Number(act.price).toLocaleString('en-IN')} × {memberCount} guest{memberCount > 1 ? 's' : ''} · {act.location || 'Goa'}
                      </div>
                    </div>
                  </div>
                  <span className="fw-bold">₹{(Number(act.price) * memberCount).toLocaleString('en-IN')}</span>
                </div>
              ))
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Compass size={18} opacity={0.4} />
                  <span>No sightseeing & activities selected (Skipped)</span>
                </div>
                <span>₹0</span>
              </div>
            )}

            {withFlight && selectedFlight ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  <Plane size={18} className="text-info" />
                  <div>
                    <div className="fw-bold">
                      {selectedFlight.airline?.name || selectedFlight.airline || 'Flight'}
                      {selectedFlight.flight_number ? ` (${selectedFlight.flight_number})` : ''}
                    </div>
                    {((selectedFlight.from_loc || selectedFlight.from) && (selectedFlight.to_loc || selectedFlight.to)) && (
                      <div className="text-dark small fw-semibold" style={{ fontSize: '12px' }}>
                        {selectedFlight.from_loc || selectedFlight.from} → {selectedFlight.to_loc || selectedFlight.to}
                        {selectedFlight.departure_time && selectedFlight.arrival_time ? ` · ${selectedFlight.departure_time} - ${selectedFlight.arrival_time}` : ''}
                      </div>
                    )}
                    <div className="text-muted small">
                      ₹{Number(selectedFlight.price || 4500).toLocaleString('en-IN')} × {memberCount} passenger{memberCount > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <span className="fw-bold">₹{flightPrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Plane size={18} opacity={0.4} />
                  <span>No flight selected</span>
                </div>
                <span>₹0</span>
              </div>
            )}
          </div>

          <div className="cmt-price-breakdown">
            <div className="cmt-price-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="cmt-price-row">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="cmt-price-row">
              <span>Convenience / Service Fee</span>
              <span>₹{serviceFee}</span>
            </div>

            {/* Loyalty Tier Recognition & Perks */}
            {loyaltyInfo && customerTier !== 'New Member' && (
              <div className="p-2 rounded-3 my-2 d-flex align-items-center justify-content-between" style={{
                background: customerTier === 'Platinum' ? 'linear-gradient(135deg, #1e1b4b, #312e81)' :
                            customerTier === 'Gold' ? 'linear-gradient(135deg, #78350f, #b45309)' :
                            customerTier === 'Silver' ? 'linear-gradient(135deg, #334155, #475569)' :
                            'linear-gradient(135deg, #7c2d12, #9a3412)',
                color: '#fff',
                fontSize: '12px'
              }}>
                <div className="d-flex align-items-center gap-1.5">
                  <Crown size={14} className="text-warning" />
                  <span className="fw-bold">{customerTier} Member</span>
                </div>
                {customerTier === 'Gold' && !isGoldEligible && (
                  <span className="badge bg-warning text-dark text-xxs">₹500 off on &gt;₹5k</span>
                )}
                {customerTier === 'Platinum' && !isPlatinumEligible && (
                  <span className="badge bg-light text-dark text-xxs">₹1,000 off on &gt;₹10k</span>
                )}
              </div>
            )}

            {isGoldEligible && (
              <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
                🥇 <strong>Gold Privilege:</strong> -₹500 instant discount applied!
              </div>
            )}
            {isPlatinumEligible && (
              <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#f5f3ff', border: '1px solid #a855f7', color: '#581c87' }}>
                💎 <strong>Platinum Privilege:</strong> -₹1,000 instant discount applied!
              </div>
            )}

            {tierDiscount > 0 && (
              <div className="cmt-price-row text-warning fw-bold">
                <span>Tier Privilege Discount</span>
                <span>-₹{tierDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {walletBalance > 0 && (
              <div className="p-2.5 rounded-3 my-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-1.5">
                    <Wallet size={14} className="text-success" />
                    <div>
                      <div className="fw-bold text-dark text-xs">WOW GOA Wallet</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="useCmtWallet"
                      checked={useWalletCashback}
                      onChange={(e) => setUseWalletCashback(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-xs fw-bold text-success" htmlFor="useCmtWallet">
                      Use ₹{Math.min(walletBalance, maxWalletBenefit).toLocaleString('en-IN')}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {appliedWalletAmount > 0 && (
              <div className="cmt-price-row text-success fw-bold">
                <span>Wallet Cashback Applied</span>
                <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="cmt-grand-total">
              <span>Total Payable</span>
              <span className="cmt-grand-total-val">₹{finalPayableTotal.toLocaleString('en-IN')}</span>
            </div>

            {/* 10% Cashback Earning Preview */}
            <div className="mt-2 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
              <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                <Gift size={13} className="text-warning" />
                <span>10% Cashback You Will Earn: <strong className="text-success">₹{projectedCashback.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="cmt-payment-toggle">
            <button
              type="button"
              className={`cmt-pay-btn ${paymentMode === 'full' ? 'active' : ''}`}
              onClick={() => setPaymentMode('full')}
            >
              <Shield size={15} /> Pay Full
              <span>₹{finalPayableTotal.toLocaleString('en-IN')}</span>
            </button>
            <button
              type="button"
              className={`cmt-pay-btn ${paymentMode === 'advance' ? 'active' : ''}`}
              onClick={() => setPaymentMode('advance')}
            >
              <Zap size={15} /> Pay 30% Advance
              <span>₹{Math.max(0, advanceAmount - appliedWalletAmount).toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>

        {/* Traveller Details */}
        <div className="cmt-traveller-card">
          <h5 className="cmt-summary-title">👤 Contact Details</h5>
          <div className="cmt-form-group">
            <label><User size={14} /> Full Name *</label>
            <input className="cmt-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="cmt-form-group">
            <label>📞 Phone *</label>
            <input className="cmt-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="cmt-form-group">
            <label>✉️ Email</label>
            <input className="cmt-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {selectedVehicle && (
            <>
              <div className="cmt-form-group">
                <label>🎂 Date of Birth *</label>
                <DobPicker
                  value={dob}
                  onChange={(val) => setDob(val)}
                  referenceDate={validPickup}
                  required={true}
                  id="cmt-vehicle-dob"
                />
              </div>
              <div className="cmt-form-group">
                <label>🪪 Driving License No. *</label>
                <input className="cmt-input" placeholder="Required for vehicle pickup" value={license} onChange={e => setLicense(e.target.value)} required />
              </div>
            </>
          )}

          <div className="cmt-you-pay-box">
            <div className="cmt-you-pay-label">You Pay {paymentMode === 'advance' ? '(30% Advance)' : '(Full Amount)'}</div>
            <div className="cmt-you-pay-amount">₹{amountDue.toLocaleString('en-IN')}</div>
            {paymentMode === 'advance' && (
              <div className="cmt-you-pay-note">Remaining ₹{(grandTotal - amountDue).toLocaleString('en-IN')} due at check-in</div>
            )}
          </div>

          {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

          <button
            type="button"
            className="cmt-btn-confirm"
            onClick={handleConfirm}
            disabled={booking || subtotal === 0}
          >
            {booking ? <span className="cmt-spinner" /> : <CheckCircle size={18} />}
            {booking ? 'Confirming...' : `Confirm Booking · ₹${amountDue.toLocaleString('en-IN')}`}
          </button>

          <div className="cmt-secure-note">
            <Shield size={13} /> Secure booking · Instant confirmation
          </div>
        </div>
      </div>

      <div className="cmt-nav-row d-flex justify-content-between align-items-center" style={{ marginTop: '24px' }}>
        <button type="button" className="cmt-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          className="cmt-btn-confirm"
          style={{ width: 'auto', minWidth: '240px', margin: 0 }}
          onClick={handleConfirm}
          disabled={booking || subtotal === 0}
        >
          {booking ? <span className="cmt-spinner" /> : <CheckCircle size={18} />}
          {booking ? 'Confirming...' : `Confirm Booking · ₹${amountDue.toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main CraftMyTripPage ────────────────────────────────────────────────────
export default function CraftMyTripPage({
  allCars = [],
  allBikes = [],
  allHotels = [],
  allActivities = [],
  pickupDate,
  dropDate,
  bookings = [],
  onBack,
  appliedFilters = {},
  setAppliedFilters,
  searchQuery = '',
  setSearchQuery,
  currentUser = null,
  isPortal = false,
  onConfirm = null,
  setPickupDate,
  setDropDate
}) {
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [memberCount, setMemberCount] = useState(1);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [withFlight, setWithFlight] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [viewingVehicleDetails, setViewingVehicleDetails] = useState(null);
  const [viewingHotelDetails, setViewingHotelDetails] = useState(null);
  const [viewingActivityDetails, setViewingActivityDetails] = useState(null);
  const [viewingFlightDetails, setViewingFlightDetails] = useState(null);
  const [showOverwriteConfirmModal, setShowOverwriteConfirmModal] = useState(false);

  // 0. Internal Date State with automatic draft restoration and parent sync
  const [internalPickupDate, setInternalPickupDate] = useState(() => {
    try {
      const savedDraft = sessionStorage.getItem('tg_craft_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.pickupDate) return draft.pickupDate;
      }
    } catch (e) {}
    return pickupDate || getTodayDateStr();
  });

  const [internalDropDate, setInternalDropDate] = useState(() => {
    try {
      const savedDraft = sessionStorage.getItem('tg_craft_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.dropDate) return draft.dropDate;
      }
    } catch (e) {}
    if (dropDate) return dropDate;
    const start = pickupDate || getTodayDateStr();
    return addDays(start, 3);
  });

  // Keep internal dates in sync if parent props change from outside
  useEffect(() => {
    if (pickupDate && pickupDate !== internalPickupDate) {
      setInternalPickupDate(pickupDate);
    }
  }, [pickupDate]);

  useEffect(() => {
    if (dropDate && dropDate !== internalDropDate) {
      setInternalDropDate(dropDate);
    }
  }, [dropDate]);

  // Trip duration calculations
  const tripNights = Math.max(1, Math.ceil((new Date(internalDropDate) - new Date(internalPickupDate)) / (1000 * 60 * 60 * 24)));
  const tripDays = tripNights + 1;

  const handlePickupDateChange = (newPickup) => {
    if (!newPickup) return;
    setInternalPickupDate(newPickup);
    setPickupDate?.(newPickup);

    let nextDrop = internalDropDate;
    if (!nextDrop || new Date(newPickup) >= new Date(nextDrop)) {
      nextDrop = addDays(newPickup, 3);
      setInternalDropDate(nextDrop);
      setDropDate?.(nextDrop);
    }

    const nights = Math.max(1, Math.ceil((new Date(nextDrop) - new Date(newPickup)) / (1000 * 60 * 60 * 24)));
    if (selectedHotel) {
      const nightPrice = selectedHotel._nightPrice || (selectedHotel.preselected_rate_plan?.base_price ? parseFloat(selectedHotel.preselected_rate_plan.base_price) : (parseFloat(selectedHotel.price_per_night || selectedHotel.price || selectedHotel.rate || 0) || 2500));
      setSelectedHotel(prev => ({
        ...prev,
        _nights: nights,
        _nightPrice: nightPrice,
        _totalPrice: nightPrice * nights
      }));
    }
  };

  const handleDropDateChange = (newDrop) => {
    if (!newDrop || new Date(newDrop) <= new Date(internalPickupDate)) return;
    setInternalDropDate(newDrop);
    setDropDate?.(newDrop);

    const nights = Math.max(1, Math.ceil((new Date(newDrop) - new Date(internalPickupDate)) / (1000 * 60 * 60 * 24)));
    if (selectedHotel) {
      const nightPrice = selectedHotel._nightPrice || (selectedHotel.preselected_rate_plan?.base_price ? parseFloat(selectedHotel.preselected_rate_plan.base_price) : (parseFloat(selectedHotel.price_per_night || selectedHotel.price || selectedHotel.rate || 0) || 2500));
      setSelectedHotel(prev => ({
        ...prev,
        _nights: nights,
        _nightPrice: nightPrice,
        _totalPrice: nightPrice * nights
      }));
    }
  };

  // 1. Restore draft state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem('tg_craft_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.step) setStep(draft.step);
        if (draft.selectedVehicle) setSelectedVehicle(draft.selectedVehicle);
        if (draft.memberCount) setMemberCount(draft.memberCount);
        if (draft.selectedHotel) setSelectedHotel(draft.selectedHotel);
        if (draft.selectedActivities) setSelectedActivities(draft.selectedActivities);
        if (draft.withFlight !== undefined) setWithFlight(draft.withFlight);
        if (draft.selectedFlight) setSelectedFlight(draft.selectedFlight);
        if (draft.pickupDate) {
          setInternalPickupDate(draft.pickupDate);
          setPickupDate?.(draft.pickupDate);
        }
        if (draft.dropDate) {
          setInternalDropDate(draft.dropDate);
          setDropDate?.(draft.dropDate);
        }
      }
    } catch (e) {}
  }, []);

  // 1b. Real-time hydration listener when Sophia hands off an AI proposal
  useEffect(() => {
    const handleDraftUpdated = () => {
      try {
        const savedDraft = sessionStorage.getItem('tg_craft_draft');
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.step) setStep(draft.step);
          if (draft.selectedVehicle !== undefined) setSelectedVehicle(draft.selectedVehicle);
          if (draft.memberCount !== undefined) setMemberCount(draft.memberCount);
          if (draft.selectedHotel !== undefined) setSelectedHotel(draft.selectedHotel);
          if (draft.selectedActivities !== undefined) setSelectedActivities(draft.selectedActivities || []);
          if (draft.withFlight !== undefined) setWithFlight(draft.withFlight);
          if (draft.selectedFlight !== undefined) setSelectedFlight(draft.selectedFlight);
          if (draft.pickupDate) {
            setInternalPickupDate(draft.pickupDate);
            setPickupDate?.(draft.pickupDate);
          }
          if (draft.dropDate) {
            setInternalDropDate(draft.dropDate);
            setDropDate?.(draft.dropDate);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {}
    };

    window.addEventListener('craft_draft_updated', handleDraftUpdated);
    return () => window.removeEventListener('craft_draft_updated', handleDraftUpdated);
  }, []);

  const handleOpenSophiaForCraft = () => {
    // Manual Draft Protection: Check if user already has an in-progress manual trip
    try {
      const savedDraft = sessionStorage.getItem('tg_craft_draft');
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        const hasExistingPlan = Boolean(d.selectedVehicle || d.selectedHotel || (d.selectedActivities && d.selectedActivities.length > 0) || d.selectedFlight);
        if (hasExistingPlan) {
          setShowOverwriteConfirmModal(true);
          return;
        }
      }
    } catch (e) {}

    // Dispatch custom event to open Sophia in Craft My Trip mode
    window.dispatchEvent(new CustomEvent('open_ai_chat', { detail: { mode: 'craft_my_trip' } }));
  };

  const handleConfirmReplaceWithAI = () => {
    setShowOverwriteConfirmModal(false);
    try {
      sessionStorage.removeItem('tg_craft_draft');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('open_ai_chat', { detail: { mode: 'craft_my_trip' } }));
  };

  // 2. Persist draft state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const draft = {
        step,
        selectedVehicle,
        memberCount,
        selectedHotel,
        selectedActivities,
        withFlight,
        selectedFlight,
        pickupDate: internalPickupDate,
        dropDate: internalDropDate
      };
      sessionStorage.setItem('tg_craft_draft', JSON.stringify(draft));
    } catch (e) {}
  }, [step, selectedVehicle, memberCount, selectedHotel, selectedActivities, withFlight, selectedFlight, internalPickupDate, internalDropDate]);

  // 3. Hydrate viewingVehicleDetails or viewingHotelDetails on mount or URL change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('car');
    const bikeId = urlParams.get('bike');
    const hotelId = urlParams.get('hotel');

    if (carId) {
      let found = null;
      try {
        const saved = sessionStorage.getItem('tg_craft_viewing_vehicle');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(carId)) found = parsed;
        }
      } catch (e) {}
      if (!found && allCars && allCars.length > 0) {
        found = allCars.find(c => String(c.id) === String(carId));
      }
      if (!found) {
        found = FALLBACK_CARS.find(c => String(c.id) === String(carId));
      }
      if (found) {
        setViewingVehicleDetails(found);
      } else {
        api.fetchCars().then(carsList => {
          const c = (carsList || []).find(item => String(item.id) === String(carId));
          if (c) setViewingVehicleDetails(c);
        }).catch(() => {});
      }
    } else if (bikeId) {
      let found = null;
      try {
        const saved = sessionStorage.getItem('tg_craft_viewing_vehicle');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(bikeId)) found = parsed;
        }
      } catch (e) {}
      if (!found && allBikes && allBikes.length > 0) {
        found = allBikes.find(b => String(b.id) === String(bikeId));
      }
      if (!found) {
        found = FALLBACK_BIKES.find(b => String(b.id) === String(bikeId));
      }
      if (found) {
        setViewingVehicleDetails(found);
      } else {
        api.fetchBikes().then(bikesList => {
          const b = (bikesList || []).find(item => String(item.id) === String(bikeId));
          if (b) setViewingVehicleDetails(b);
        }).catch(() => {});
      }
    } else {
      setViewingVehicleDetails(null);
    }

    if (hotelId) {
      let found = null;
      try {
        const saved = sessionStorage.getItem('tg_craft_viewing_hotel');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(hotelId)) found = parsed;
        }
      } catch (e) {}
      if (!found && allHotels && allHotels.length > 0) {
        found = allHotels.find(h => String(h.id) === String(hotelId));
      }
      if (found) {
        setViewingHotelDetails(found);
      } else {
        api.fetchHotels().then(hotelsList => {
          const h = (hotelsList || []).find(item => String(item.id) === String(hotelId));
          if (h) setViewingHotelDetails(h);
        }).catch(() => {});
      }
    } else {
      setViewingHotelDetails(null);
    }

    const activityId = urlParams.get('activity') || urlParams.get('sightseeing');
    if (activityId) {
      let found = null;
      try {
        const saved = sessionStorage.getItem('tg_craft_viewing_activity');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(activityId)) found = parsed;
        }
      } catch {}
      if (!found && allActivities && allActivities.length > 0) {
        found = allActivities.find(a => String(a.id) === String(activityId));
      }
      if (found) {
        setViewingActivityDetails(found);
      } else {
        api.getActivities().then(activitiesList => {
          const act = (activitiesList || []).find(item => String(item.id) === String(activityId));
          if (act) setViewingActivityDetails(act);
        }).catch(() => {});
      }
    } else {
      setViewingActivityDetails(null);
    }

    const flightId = urlParams.get('flight');
    if (flightId) {
      let found = null;
      try {
        const saved = sessionStorage.getItem('tg_craft_viewing_flight');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(flightId)) found = parsed;
        }
      } catch {}
      if (found) {
        setViewingFlightDetails(found);
      } else {
        api.fetchFlights().then(flightsList => {
          const f = (flightsList || []).find(item => String(item.id) === String(flightId));
          if (f) setViewingFlightDetails(f);
        }).catch(() => {});
      }
    } else {
      setViewingFlightDetails(null);
    }
  }, [allCars, allBikes, allHotels, allActivities]);

  // 4. Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const carId = urlParams.get('car');
      const bikeId = urlParams.get('bike');
      const hotelId = urlParams.get('hotel');

      if (!carId && !bikeId) {
        setViewingVehicleDetails(null);
        try {
          sessionStorage.removeItem('tg_craft_viewing_vehicle');
        } catch (e) {}
      } else {
        let found = null;
        try {
          const saved = sessionStorage.getItem('tg_craft_viewing_vehicle');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (String(parsed.id) === String(carId || bikeId)) found = parsed;
          }
        } catch (e) {}
        if (!found) {
          found = (allCars || []).find(c => String(c.id) === String(carId)) ||
                  (allBikes || []).find(b => String(b.id) === String(bikeId)) ||
                  FALLBACK_CARS.find(c => String(c.id) === String(carId)) ||
                  FALLBACK_BIKES.find(b => String(b.id) === String(bikeId));
        }
        if (found) {
          setViewingVehicleDetails(found);
        } else if (bikeId) {
          api.fetchBikes().then(bikesList => {
            const b = (bikesList || []).find(item => String(item.id) === String(bikeId));
            if (b) setViewingVehicleDetails(b);
          }).catch(() => {});
        } else if (carId) {
          api.fetchCars().then(carsList => {
            const c = (carsList || []).find(item => String(item.id) === String(carId));
            if (c) setViewingVehicleDetails(c);
          }).catch(() => {});
        }
      }

      if (!hotelId) {
        setViewingHotelDetails(null);
        try {
          sessionStorage.removeItem('tg_craft_viewing_hotel');
        } catch (e) {}
      } else {
        let found = (allHotels || []).find(h => String(h.id) === String(hotelId));
        if (!found) {
          try {
            const saved = sessionStorage.getItem('tg_craft_viewing_hotel');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (String(parsed.id) === String(hotelId)) found = parsed;
            }
          } catch (e) {}
        }
        if (found) setViewingHotelDetails(found);
      }

      const activityId = urlParams.get('activity') || urlParams.get('sightseeing');
      if (!activityId) {
        setViewingActivityDetails(null);
        try {
          sessionStorage.removeItem('tg_craft_viewing_activity');
        } catch {}
      } else {
        let found = (allActivities || []).find(a => String(a.id) === String(activityId));
        if (!found) {
          try {
            const saved = sessionStorage.getItem('tg_craft_viewing_activity');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (String(parsed.id) === String(activityId)) found = parsed;
            }
          } catch {}
        }
        if (found) {
          setViewingActivityDetails(found);
        } else {
          api.getActivities().then(activitiesList => {
            const act = (activitiesList || []).find(item => String(item.id) === String(activityId));
            if (act) setViewingActivityDetails(act);
          }).catch(() => {});
        }
      }

      const flightId = urlParams.get('flight');
      if (!flightId) {
        setViewingFlightDetails(null);
        try {
          sessionStorage.removeItem('tg_craft_viewing_flight');
        } catch {}
      } else {
        let found = null;
        try {
          const saved = sessionStorage.getItem('tg_craft_viewing_flight');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (String(parsed.id) === String(flightId)) found = parsed;
          }
        } catch {}
        if (found) {
          setViewingFlightDetails(found);
        } else {
          api.fetchFlights().then(flightsList => {
            const f = (flightsList || []).find(item => String(item.id) === String(flightId));
            if (f) setViewingFlightDetails(f);
          }).catch(() => {});
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allCars, allBikes, allHotels, allActivities]);

  const scrollToCraftView = () => {
    if (isPortal) {
      const el = document.getElementById('explore-more-section') || document.querySelector('.cmt-portal-embedded-section') || document.querySelector('.cmt-portal-embedded');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVehicleDetails = (vehicle) => {
    if (!vehicle) return;
    const isBike = isBikeVehicle(vehicle);
    if (!isPortal) {
      const targetUrl = isBike ? `/craft?bike=${encodeURIComponent(vehicle.id)}` : `/craft?car=${encodeURIComponent(vehicle.id)}`;
      window.history.pushState({ craftStep: 1, vehicleId: vehicle.id, isBike }, '', targetUrl);
    }
    try {
      sessionStorage.setItem('tg_craft_viewing_vehicle', JSON.stringify(vehicle));
    } catch (e) {}
    setViewingVehicleDetails(vehicle);
    scrollToCraftView();
  };

  const handleBackFromVehicleDetails = () => {
    setViewingVehicleDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_vehicle');
    } catch (e) {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 1 }, '', '/craft');
    }
    scrollToCraftView();
  };

  const handleSelectAndContinueVehicle = (vehicleItem) => {
    const item = vehicleItem || viewingVehicleDetails;
    if (!item) return;
    const isBike = isBikeVehicle(item);
    const maxCapacity = isBike ? 2 : (parseInt(item.seating) || 4);

    // Validation: DO NOT proceed or silently change memberCount
    if (memberCount > maxCapacity) {
      return;
    }

    setSelectedVehicle(item);
    setViewingVehicleDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_vehicle');
    } catch (e) {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 2 }, '', '/craft');
    }
    setStep(2);
    scrollToCraftView();
  };

  const handleOpenHotelDetails = (hotel) => {
    if (!hotel) return;
    if (!isPortal) {
      const targetUrl = `/craft?hotel=${encodeURIComponent(hotel.id)}`;
      window.history.pushState({ craftStep: 2, hotelId: hotel.id }, '', targetUrl);
    }
    try {
      sessionStorage.setItem('tg_craft_viewing_hotel', JSON.stringify(hotel));
    } catch (e) {}
    setViewingHotelDetails(hotel);
    scrollToCraftView();
  };

  const handleBackFromHotelDetails = () => {
    setViewingHotelDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_hotel');
    } catch (e) {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 2 }, '', '/craft');
    }
    scrollToCraftView();
  };

  const handleSelectAndContinueHotel = (hotelItem, room = null, plan = null) => {
    const item = hotelItem || viewingHotelDetails;
    if (!item) return;

    const validPickup = internalPickupDate || pickupDate || getTodayDateStr();
    const validDrop = internalDropDate || dropDate || getNextDayDateStr(validPickup);
    const nights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

    const nightPrice = plan?.base_price 
      ? parseFloat(plan.base_price) 
      : (parseFloat(item.price_per_night || item.price || item.rate || 0) || 2500);
    const totalHotelPrice = nightPrice * nights;

    const selectedPayload = {
      ...item,
      preselected_room: room || null,
      preselected_rate_plan: plan || null,
      has_selected_room: Boolean(room && plan),
      _nightPrice: nightPrice,
      _totalPrice: totalHotelPrice,
      _nights: nights
    };

    setSelectedHotel(selectedPayload);
    setViewingHotelDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_hotel');
    } catch (e) {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 3 }, '', '/craft');
    }
    setStep(3);
    scrollToCraftView();
  };

  const handleOpenActivityDetails = (activity) => {
    if (!activity) return;
    if (!isPortal) {
      const targetUrl = `/craft?activity=${encodeURIComponent(activity.id)}`;
      window.history.pushState({ craftStep: 3, activityId: activity.id }, '', targetUrl);
    }
    try {
      sessionStorage.setItem('tg_craft_viewing_activity', JSON.stringify(activity));
    } catch {}
    setViewingActivityDetails(activity);
    scrollToCraftView();
  };

  const handleBackFromActivityDetails = () => {
    setViewingActivityDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_activity');
    } catch {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 3 }, '', '/craft');
    }
    scrollToCraftView();
  };

  const handleSelectAndContinueActivity = (activityItem) => {
    const item = activityItem || viewingActivityDetails;
    if (!item) return;

    setSelectedActivities(prev => {
      const exists = (prev || []).some(a => String(a.id) === String(item.id));
      if (exists) return prev;
      return [...(prev || []), item];
    });

    setViewingActivityDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_activity');
    } catch {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 4 }, '', '/craft');
    }
    setStep(4);
    scrollToCraftView();
  };

  const handleOpenFlightDetails = (flight) => {
    if (!flight) return;
    if (!isPortal) {
      const targetUrl = `/craft?flight=${encodeURIComponent(flight.id)}`;
      window.history.pushState({ craftStep: 4, flightId: flight.id }, '', targetUrl);
    }
    try {
      sessionStorage.setItem('tg_craft_viewing_flight', JSON.stringify(flight));
    } catch {}
    setViewingFlightDetails(flight);
    scrollToCraftView();
  };

  const handleBackFromFlightDetails = () => {
    setViewingFlightDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_flight');
    } catch {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 4 }, '', '/craft');
    }
    scrollToCraftView();
  };

  const handleSelectAndContinueFlight = (flightItem) => {
    const item = flightItem || viewingFlightDetails;
    if (!item) return;

    setSelectedFlight(item);
    setWithFlight(true);
    setViewingFlightDetails(null);
    try {
      sessionStorage.removeItem('tg_craft_viewing_flight');
    } catch {}
    if (!isPortal) {
      window.history.pushState({ craftStep: 5 }, '', '/craft');
    }
    setStep(5);
    scrollToCraftView();
  };

  const goNext = () => {
    setStep(s => Math.min(s + 1, 5));
    scrollToCraftView();
  };
  const goBack = () => {
    if (step === 1) { onBack(); return; }
    setStep(s => s - 1);
    scrollToCraftView();
  };

  // ─── FULL-PAGE VEHICLE DETAILS VIEW ──────────────────────────────────────
  if (viewingVehicleDetails) {
    const isBike = isBikeVehicle(viewingVehicleDetails);
    const bookingDays = (internalPickupDate && internalDropDate)
      ? Math.max(1, Math.round((new Date(internalDropDate) - new Date(internalPickupDate)) / (1000 * 60 * 60 * 24)))
      : 2;

    if (isBike) {
      return (
        <BikeDetailsPage
          bike={viewingVehicleDetails}
          pickupDate={internalPickupDate}
          dropDate={internalDropDate}
          bookingDays={bookingDays}
          isCraftMyTrip={true}
          backLabel="← Back to Craft My Trip"
          actionLabel="Select & Continue"
          breadcrumbPrefix="Craft My Trip"
          memberCount={memberCount}
          onMemberCountChange={setMemberCount}
          onBack={handleBackFromVehicleDetails}
          onBook={handleSelectAndContinueVehicle}
        />
      );
    }

    return (
      <CarDetailsPage
        car={viewingVehicleDetails}
        pickupDate={internalPickupDate}
        dropDate={internalDropDate}
        bookingDays={bookingDays}
        isCraftMyTrip={true}
        backLabel="← Back to Craft My Trip"
        actionLabel="Select & Continue"
        breadcrumbPrefix="Craft My Trip"
        memberCount={memberCount}
        onMemberCountChange={setMemberCount}
        onBack={handleBackFromVehicleDetails}
        onBook={handleSelectAndContinueVehicle}
      />
    );
  }

  // ─── FULL-PAGE HOTEL DETAILS VIEW ────────────────────────────────────────
  if (viewingHotelDetails) {
    const validPickup = internalPickupDate || getTodayDateStr();
    const validDrop = internalDropDate || getNextDayDateStr(validPickup);
    const calculatedNights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

    return (
      <HotelDetailsPage
        hotel={viewingHotelDetails}
        pickupDate={internalPickupDate}
        dropDate={internalDropDate}
        nights={calculatedNights}
        isCraftMyTrip={true}
        backLabel="← Back to Craft My Trip"
        actionLabel="Select & Continue"
        breadcrumbPrefix="Craft My Trip"
        onBack={handleBackFromHotelDetails}
        onBook={handleSelectAndContinueHotel}
        onSelectHotel={(h) => setViewingHotelDetails(h)}
      />
    );
  }

  // ─── FULL-PAGE ACTIVITY DETAILS VIEW ────────────────────────────────────
  if (viewingActivityDetails) {
    const isAlreadySelected = (selectedActivities || []).some(a => String(a.id) === String(viewingActivityDetails.id));
    return (
      <ActivityDetailsPage
        activity={viewingActivityDetails}
        pickupDate={internalPickupDate}
        adultsCount={memberCount}
        memberCount={memberCount}
        isCraftMyTrip={true}
        isSelected={isAlreadySelected}
        backLabel="← Back to Craft My Trip"
        actionLabel={isAlreadySelected ? "Continue to Flight" : "Select & Continue"}
        breadcrumbPrefix="Craft My Trip"
        onBack={handleBackFromActivityDetails}
        onBook={handleSelectAndContinueActivity}
      />
    );
  }

  // ─── FULL-PAGE FLIGHT DETAILS VIEW ──────────────────────────────────────
  if (viewingFlightDetails) {
    const isAlreadySelected = selectedFlight?.id === viewingFlightDetails.id;
    return (
      <FlightDetailsPage
        flight={viewingFlightDetails}
        flightAdults={memberCount}
        memberCount={memberCount}
        pickupDate={internalPickupDate}
        isCraftMyTrip={true}
        isSelected={isAlreadySelected}
        backLabel="← Back to Craft My Trip"
        actionLabel={isAlreadySelected ? "Continue to Review" : "Select & Continue"}
        breadcrumbPrefix="Craft My Trip"
        onBack={handleBackFromFlightDetails}
        onBook={handleSelectAndContinueFlight}
      />
    );
  }

  return (
    <div className={`cmt-page ${isPortal ? 'cmt-portal-embedded' : ''}`}>
      {/* Page Header */}
      {isPortal ? (
        <div className="cmt-portal-header mb-4 p-3 p-md-4 rounded-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', color: '#fff' }}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-warning text-xs fw-bold mb-2">
                <Sparkles size={14} className="text-warning" />
                <span>⭐ CUSTOMER PORTAL · TAILOR-MADE ITINERARY</span>
              </div>
              <h3 className="fw-black mb-1 font-heading text-white" style={{ fontSize: '22px' }}>
                Craft Your Custom Goa Trip 🌴
              </h3>
              <p className="text-white-50 mb-0 text-xs" style={{ maxWidth: '680px' }}>
                Build your bespoke holiday — select a self-drive ride, resort stay, curated sightseeing, and optional flight. Direct booking with instant confirmation and 10% wallet cashback.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill text-xs shadow-sm">
                💰 10% Wallet Cashback
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="cmt-page-hero">
          <div className="cmt-hero-content">
            <div className="cmt-hero-badge"><Wand2 size={16} /> Build From Scratch</div>
            <h1 className="cmt-hero-title">Craft My Trip</h1>
            <p className="cmt-hero-sub">Design your perfect Goa getaway — choose your ride, stay, activities, and fly your way</p>
            <div className="cmt-hero-chips">
              <span>🚗 Self Drive Vehicle</span>
              <span>+</span>
              <span>🏨 Hotel Stay</span>
              <span>+</span>
              <span>🎯 Sightseeing & Activities</span>
              <span>+</span>
              <span>✈️ Optional Flight</span>
            </div>
          </div>
        </div>
      )}

      <div className="cmt-content">
        <StepIndicator currentStep={step} />

        {/* ─── TRIP DATES & TRAVEL SCHEDULE BAR ─── */}
        <div className="cmt-schedule-bar mb-4 p-3 p-md-3.5 bg-white rounded-4 shadow-sm border animate-fade-in">
          {/* Header Row: Title & Computed Duration */}
          <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0052ff, #3b82f6)', width: '32px', height: '32px' }}
              >
                <Calendar size={16} />
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>Trip Schedule & Dates</span>
                <span className="badge rounded-pill fw-bold text-xxs px-2.5 py-1" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  {tripNights} Night{tripNights > 1 ? 's' : ''} • {tripDays} Days
                </span>
              </div>
            </div>
            <div className="text-muted text-3xs">
              {internalPickupDate ? new Date(internalPickupDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} — {internalDropDate ? new Date(internalDropDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </div>
          </div>

          {/* Controls Row: Compact Dates & Travelers */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
            {/* Start / Pickup & Return / Drop */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Start / Pickup Date Field */}
              <div className="cmt-date-field d-flex align-items-center px-2.5 py-1">
                <div className="d-flex flex-column">
                  <span className="text-muted text-3xs fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.4px', lineHeight: '1.2' }}>Start / Pickup</span>
                  <input
                    type="date"
                    id="cmt-pickup-date-input"
                    className="border-0 bg-transparent fw-bold text-dark p-0 m-0"
                    style={{ outline: 'none', cursor: 'pointer', fontSize: '12px', width: '118px' }}
                    value={internalPickupDate}
                    min={getTodayDateStr()}
                    onChange={e => handlePickupDateChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-muted fw-bold text-xs d-none d-sm-block px-0.5">→</div>
              <div className="text-muted fw-bold text-xs d-block d-sm-none w-100 text-center py-0.5">↓</div>

              {/* Return / Drop Date Field */}
              <div className="cmt-date-field d-flex align-items-center px-2.5 py-1">
                <div className="d-flex flex-column">
                  <span className="text-muted text-3xs fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.4px', lineHeight: '1.2' }}>Return / Drop</span>
                  <input
                    type="date"
                    id="cmt-drop-date-input"
                    className="border-0 bg-transparent fw-bold text-dark p-0 m-0"
                    style={{ outline: 'none', cursor: 'pointer', fontSize: '12px', width: '118px' }}
                    value={internalDropDate}
                    min={getNextDayDateStr(internalPickupDate)}
                    onChange={e => handleDropDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Travelers Guest Counter */}
            <div className="cmt-date-field cmt-travelers-field d-flex align-items-center gap-2 px-2.5 py-1">
              <Users size={15} className="text-primary flex-shrink-0" />
              <div className="d-flex flex-column">
                <span className="text-muted text-3xs fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.4px', lineHeight: '1.2' }}>Travelers</span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center"
                    style={{ width: '20px', height: '20px', fontSize: '12px', lineHeight: 1 }}
                    disabled={memberCount <= 1}
                    onClick={() => setMemberCount(prev => Math.max(1, prev - 1))}
                    title="Decrease guests"
                  >
                    -
                  </button>
                  <span className="fw-bold text-xs text-dark" style={{ minWidth: '16px', textAlign: 'center', fontSize: '12px' }}>
                    {memberCount}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center"
                    style={{ width: '20px', height: '20px', fontSize: '12px', lineHeight: 1 }}
                    disabled={memberCount >= 20}
                    onClick={() => setMemberCount(prev => Math.min(20, prev + 1))}
                    title="Increase guests"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Selection Summary Pills */}
          {(selectedVehicle || selectedHotel || (selectedActivities && selectedActivities.length > 0) || (withFlight && selectedFlight)) && (
            <div className="d-flex align-items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-top text-xxs">
              <span className="text-muted fw-semibold">Crafted Itinerary:</span>
              {selectedVehicle && (
                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-medium d-flex align-items-center gap-1">
                  🚗 {selectedVehicle.name} ({tripDays} Days)
                </span>
              )}
              {selectedHotel && (
                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-medium d-flex align-items-center gap-1">
                  🏨 {selectedHotel.name} ({tripNights} Nights)
                </span>
              )}
              {selectedActivities && selectedActivities.length > 0 && (
                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-medium d-flex align-items-center gap-1">
                  🎯 {selectedActivities.length} Experience{selectedActivities.length > 1 ? 's' : ''}
                </span>
              )}
              {withFlight && selectedFlight && (
                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-medium d-flex align-items-center gap-1">
                  ✈️ {selectedFlight.airline || selectedFlight.name || 'Flight'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── DUAL CHOICE HERO BANNER (STEP 1) ─── */}
        {step === 1 && (
          <div className="cmt-trip-mode-choice mb-4 p-3 p-md-4 rounded-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #eff6ff 100%)', border: '1.5px solid #bbf7d0' }}>
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge px-2.5 py-1 rounded-pill fw-bold text-xxs" style={{ background: '#059669', color: '#fff' }}>✨ Trip Creation Options</span>
                  <span className="badge bg-light text-dark border text-xxs">Craft My Trip</span>
                </div>
                <h4 className="fw-extrabold text-dark mb-1" style={{ fontSize: '1.25rem' }}>How would you like to build your trip?</h4>
                <p className="text-muted small mb-0">Choose your vehicle, hotel, activities and flight yourself, or let Sophia AI prepare your dream trip in seconds.</p>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  id="btn-build-trip-manual"
                  className="btn btn-outline-dark rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={() => {
                    const el = document.querySelector('.cmt-step-body');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>🛠️ Build My Trip Manually</span>
                </button>
                <button
                  type="button"
                  id="btn-create-trip-ai"
                  className="btn text-white rounded-pill px-4 py-2 text-xs fw-bold d-flex align-items-center gap-2 shadow-sm hover-scale"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', border: 'none' }}
                  onClick={handleOpenSophiaForCraft}
                >
                  <Sparkles size={15} />
                  <span>Create My Trip with AI 🤖</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MANUAL DRAFT PROTECTION MODAL ─── */}
        {showOverwriteConfirmModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
              <div className="modal-content border-0 rounded-4 shadow-xl overflow-hidden p-4">
                <div className="d-flex align-items-center gap-2 mb-2 text-warning">
                  <AlertCircle size={22} />
                  <h5 className="modal-title fw-bold text-dark mb-0">Trip Already in Progress</h5>
                </div>
                <p className="text-secondary small mb-4">
                  You already have a trip in progress in your Craft My Trip builder. Do you want to replace it with Sophia's new plan, or keep your current selections?
                </p>
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 text-xs fw-bold"
                    onClick={() => setShowOverwriteConfirmModal(false)}
                  >
                    Keep My Current Trip
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm text-white rounded-pill px-3 py-2 text-xs fw-bold"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', border: 'none' }}
                    onClick={handleConfirmReplaceWithAI}
                  >
                    Replace With Sophia's Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <Step1Vehicle
            allCars={allCars}
            allBikes={allBikes}
            bookings={bookings}
            pickupDate={internalPickupDate}
            dropDate={internalDropDate}
            selectedVehicle={selectedVehicle}
            setSelectedVehicle={setSelectedVehicle}
            memberCount={memberCount}
            setMemberCount={setMemberCount}
            onNext={goNext}
            onBack={goBack}
            appliedFilters={appliedFilters}
            searchQuery={searchQuery}
            onViewVehicleDetails={handleOpenVehicleDetails}
          />
        )}
        {step === 2 && (
          <Step2Hotel
            allHotels={allHotels}
            pickupDate={internalPickupDate}
            dropDate={internalDropDate}
            selectedHotel={selectedHotel}
            setSelectedHotel={setSelectedHotel}
            memberCount={memberCount}
            onNext={goNext}
            onBack={goBack}
            appliedFilters={appliedFilters}
            searchQuery={searchQuery}
            onViewHotelDetails={handleOpenHotelDetails}
          />
        )}
        {step === 3 && (
          <Step3Activities
            allActivities={allActivities}
            selectedActivities={selectedActivities}
            setSelectedActivities={setSelectedActivities}
            memberCount={memberCount}
            onNext={goNext}
            onBack={goBack}
            appliedFilters={appliedFilters}
            searchQuery={searchQuery}
            onViewActivityDetails={handleOpenActivityDetails}
          />
        )}
        {step === 4 && (
          <Step4Flight
            selectedFlight={selectedFlight}
            setSelectedFlight={setSelectedFlight}
            withFlight={withFlight}
            setWithFlight={setWithFlight}
            pickupDate={internalPickupDate}
            memberCount={memberCount}
            onNext={goNext}
            onBack={goBack}
            onViewFlightDetails={handleOpenFlightDetails}
          />
        )}
        {step === 5 && (
          <Step5ReviewPay
            selectedVehicle={selectedVehicle}
            selectedHotel={selectedHotel}
            selectedActivities={selectedActivities}
            selectedFlight={selectedFlight}
            withFlight={withFlight}
            memberCount={memberCount}
            pickupDate={internalPickupDate}
            dropDate={internalDropDate}
            onBack={goBack}
            onConfirm={onConfirm}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}

