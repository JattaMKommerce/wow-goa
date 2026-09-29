import React, { useState, useEffect } from 'react';
import {
  Compass, Calendar, Car, Wallet, Gift, Clock, CheckCircle2,
  AlertCircle, ArrowRight, ShieldCheck, MapPin, ChevronRight,
  TrendingUp, Star, Phone, Bell, Eye, Download, Info, Hotel,
  Plane, Fuel, Navigation, Check, X, Sparkles, Filter, Bike, Crown, Cake, ArrowUpRight,
  Wand2
} from 'lucide-react';
import SelfDriveCategoryShowcase from '../widgets/SelfDriveCategoryShowcase';
import CustomerLoyaltyCard from './CustomerLoyaltyCard';
import CraftMyTripPage from '../../pages/customer/CraftMyTripPage';
import { getBookingDisplayImage } from '../../utils/bookingImageHelper';
import { isBikeVehicle } from '../../utils/vehicleHelper';
import * as api from '../../services/api';

// ─── Unified Driver Service Helper ───
const hasDriverService = (b) => {
  if (!b) return false;
  const rawType = String(b.package_type || b.type || '').toLowerCase();
  const rawItem = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
  const rawId = String(b.item_id || '').toLowerCase();
  if (
    rawType === 'bike' || rawType.includes('bike') || rawType.includes('scooter') ||
    rawId.startsWith('bike') || rawId.startsWith('bk-') ||
    /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|access/i.test(rawItem)
  ) {
    return false;
  }
  const svcType = String(b.driver_service_type || '').toUpperCase().trim();
  if (['PICKUP', 'DROP', 'FULL'].includes(svcType)) return true;
  if (svcType === 'NONE') return false;
  if (b.driver_required === 1 || b.driver_required === '1' || b.driver_required === true || b.driver_required === 'yes') return true;
  if (b.assigned_driver_id && String(b.assigned_driver_id).trim() !== '') return true;
  const pkgType = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();
  if (pkgType.includes('with driver') || itemName.includes('with driver') || itemName.includes('with chauffeur')) return true;
  return false;
};

// ─── Unified Category Breakdown Helpers ───
const isCraftBooking = (b) => {
  if (!b) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();
  return type.includes('craft') || itemName.includes('craft my trip') || itemId.includes('craft');
};

const isFlightBooking = (b) => {
  if (!b || isCraftBooking(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();
  return type === 'flight' || type.includes('flight') || itemName.includes('flight') || itemId.includes('flight');
};

const isHotelBooking = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || b.hotel_name || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();
  if (type.includes('package') || type.includes('self drive') || type === 'selfdrive' || itemId.startsWith('pkg-') || itemId.startsWith('package-')) {
    return false;
  }
  return (
    type === 'hotel' ||
    type.includes('hotel') ||
    Boolean(b.hotel_name && !b.vehicle_name && !b.car_included) ||
    itemId.includes('hotel') ||
    itemName.includes('hotel') ||
    itemName.includes('resort') ||
    itemName.includes('villa') ||
    itemName.includes('palace') ||
    itemName.includes('beachfront') ||
    itemName.includes('suites') ||
    itemName.includes('stay')
  );
};

const isSightseeingBooking = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();

  if (type === 'sightseeing' || type.includes('sightseeing')) return true;
  if (itemId.startsWith('sight-') || itemId.startsWith('sight_')) return true;
  if (itemName.includes('sightseeing') || itemName.includes('heritage tour') || itemName.includes('monument')) return true;

  return false;
};

const isActivityBooking = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b)) return false;
  if (isSightseeingBooking(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();

  return (
    type === 'activity' ||
    type.includes('activity') ||
    itemId.startsWith('act-') ||
    itemId.startsWith('act_') ||
    itemId.startsWith('act') ||
    itemName.includes('scuba') ||
    itemName.includes('water sport') ||
    itemName.includes('watersport') ||
    itemName.includes('parasailing') ||
    itemName.includes('cruise') ||
    itemName.includes('adventure') ||
    itemName.includes('kayaking') ||
    itemName.includes('snorkeling')
  );
};

const isBikeItem = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b) || isSightseeingBooking(b) || isActivityBooking(b)) return false;
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
    itemName.includes('bike') ||
    itemName.includes('scooter') ||
    itemName.includes('activa') ||
    itemName.includes('himalayan') ||
    itemName.includes('bullet') ||
    itemName.includes('jupiter') ||
    itemName.includes('classic 350') ||
    itemName.includes('fz-s') ||
    itemName.includes('access 125') ||
    itemName.includes('faschino')
  );
};

const isCarItem = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b) || isSightseeingBooking(b) || isActivityBooking(b) || isBikeItem(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();

  if (itemId.startsWith('car-') || itemId.startsWith('car_')) return true;
  if (type === 'car' || type.includes('car rental') || type.includes('vehicle rental') || type === 'vehicle' || type === 'driver') return true;

  const carKeywords = ['car', 'thar', 'swift', 'creta', 'ertiga', 'fortuner', 'innova', 'cabriolet', 'audi', 'bmw', 'baleno', 'i20', 'scorpio', 'kia', 'seltos', 'verna', 'wagonr', 'celerio', 'dzire', 'altroz', 'nexon'];
  if (carKeywords.some(kw => itemName.includes(kw))) return true;

  return false;
};

const isTripPackageItem = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b) || isSightseeingBooking(b) || isActivityBooking(b) || isBikeItem(b)) return false;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();
  const itemId = String(b.item_id || '').toLowerCase();

  if (itemId.startsWith('car-') || itemId.startsWith('bike-')) return false;

  if (type === 'package' || type === 'trip_package' || type === 'tour' || type === 'trip' || type.includes('package') || type.includes('tour') || type.includes('holiday')) {
    return true;
  }
  if (itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-')) {
    return true;
  }

  const packageKeywords = [
    'package', 'tour', 'getaway', 'explorer', 'escape', 'holiday',
    'vacation', 'experience', 'bali', 'kerala', 'kashmir', 'dubai',
    'thailand', 'maldives', 'goa tour', 'heritage trail', 'coastal goa',
    'sunset escape', 'honeymoon'
  ];
  if (packageKeywords.some(kw => itemName.includes(kw))) {
    return true;
  }

  if (Boolean(b.duration && (b.hotel_name || b.hotel_included) && !itemId.startsWith('car-') && !itemId.startsWith('bike-'))) {
    return true;
  }

  return false;
};

// ─── Classification Rules ───
const isCarsCategory = (b) => isCarItem(b) && hasDriverService(b);
const isBikesCategory = (b) => isBikeItem(b) && hasDriverService(b);
const isTripPackageCategory = (b) => isTripPackageItem(b) && hasDriverService(b);
const isSelfDriveHolidayCategory = (b) => {
  if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b) || isSightseeingBooking(b) || isActivityBooking(b)) return false;
  if (isCarItem(b) && !hasDriverService(b)) return true;
  if (isBikeItem(b) && !hasDriverService(b)) return true;
  if (isTripPackageItem(b) && !hasDriverService(b)) return true;
  const type = String(b.package_type || b.type || '').toLowerCase();
  const itemName = String(b.item_name || b.package_name || '').toLowerCase();
  if ((type.includes('self drive') || type === 'selfdrive' || itemName.includes('self drive')) && !hasDriverService(b)) {
    return true;
  }
  return false;
};

export default function CustomerOverviewTab({
  currentUser,
  bookings = [],
  packages = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = [],
  activities = [],
  markups = [],
  exploreFocus = '',
  onViewDetails,
  onNavigateTab,
  onSelectBooking,
  onDirectBook,
  walletBalance = 0,
  cashbackBalance = 0
}) {
  const [walletData, setWalletData] = useState({ available_balance: 0, nearest_expiring: null });
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    const ph = currentUser?.phone || currentUser?.username || '';
    const cid = currentUser?.id || '';
    if (ph || cid) {
      setLoadingWallet(true);
      api.fetchCustomerWallet(ph, cid).then(res => {
        if (res) setWalletData(res);
      }).catch(() => {}).finally(() => setLoadingWallet(false));
    }
  }, [currentUser]);
  // Category state for Explore More WOW GOA
  const [exploreCategory, setExploreCategory] = useState('selfdrive'); // 'selfdrive' | 'packages' | 'craftmytrip' | 'hotels' | 'flights' | 'activities'
  const [selfDriveSubcategory, setSelfDriveSubcategory] = useState('all');

  useEffect(() => {
    if (exploreFocus === 'explore' || exploreFocus === 'fleets' || exploreFocus === 'book' || exploreFocus === 'selfdrive') {
      setExploreCategory('selfdrive');
    } else if (exploreFocus === 'craft' || exploreFocus === 'craftmytrip') {
      setExploreCategory('craftmytrip');
    }
  }, [exploreFocus]);

  // Bookings passed from CustomerPortalPage are already strictly isolated for the customer
  const myBookings = Array.isArray(bookings) ? bookings : [];

  // Self Drive Holiday bookings
  const selfDriveBookings = myBookings.filter(b => isSelfDriveHolidayCategory(b));

  // Active / Upcoming bookings
  const activeBookings = myBookings.filter(b => 
    b.status?.toLowerCase() === 'confirmed' || 
    b.status?.toLowerCase() === 'upcoming' ||
    b.status?.toLowerCase() === 'ongoing'
  );

  // Next upcoming self drive holiday
  const nextHoliday = selfDriveBookings.find(b => 
    b.status?.toLowerCase() === 'confirmed' || 
    b.status?.toLowerCase() === 'upcoming' ||
    b.status?.toLowerCase() === 'pending'
  ) || selfDriveBookings[0] || myBookings[0];

  // Calculate pending payment
  const pendingPaymentTotal = myBookings.reduce((sum, b) => {
    const total = parseFloat(b.total_amount || b.amount || 0);
    const paid = parseFloat(b.paid_amount || b.total_paid || 0);
    const pending = parseFloat(b.pending_amount || (total > paid ? total - paid : 0));
    return sum + (b.status?.toLowerCase() !== 'cancelled' ? pending : 0);
  }, 0);

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'completed') return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Completed</span>;
    if (s === 'confirmed') return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Confirmed</span>;
    if (s === 'upcoming') return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Upcoming</span>;
    if (s === 'ongoing') return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Ongoing</span>;
    if (s === 'cancelled') return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Cancelled</span>;
    if (s === 'rejected') return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Rejected</span>;
    if (s === 'pending') return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Pending Confirmation</span>;
    return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold text-capitalize">{status || 'Pending'}</span>;
  };

  // Use exact live packages, hotels, cars, and flights available on the main website
  const packagesList = (Array.isArray(packages) && packages.length > 0) ? packages : [];
  const selfDriveList = packagesList;
  const tourPackagesList = packagesList;
  const hotelsList = (Array.isArray(hotels) && hotels.length > 0) ? hotels : [];
  const carsList = (Array.isArray(cars) && cars.length > 0) ? cars : [];
  const flightsList = (Array.isArray(flights) && flights.length > 0) ? flights : [];
  const activitiesList = (Array.isArray(activities) && activities.length > 0)
    ? activities.filter(item => item && item.is_active !== 0 && item.is_active !== '0' && item.is_active !== false)
    : [];

  // Handle direct details navigation
  const handleTriggerDetails = (item, type = null) => {
    if (!item) return;
    if (onViewDetails) {
      let resolvedType = type;
      if (!resolvedType) {
        if (item.property_type || item.stars || String(item.id).startsWith('hotel-')) resolvedType = 'hotel';
        else if (item.flight_number || item.airline || String(item.id).startsWith('FL-')) resolvedType = 'flight';
        else if (item.category === 'Water Sports' || item.category === 'Sightseeing & Tours' || String(item.id).startsWith('act-') || String(item.id).startsWith('sight-') || item.type === 'activity' || item.type === 'sightseeing') resolvedType = 'activity';
        else if (item.places_included || item.package_type || item.day_wise_itinerary) resolvedType = 'package';
        else resolvedType = isBikeVehicle(item) ? 'bike' : 'car';
      }
      onViewDetails(item, resolvedType);
    } else if (onDirectBook) {
      onDirectBook(item);
    } else {
      window.location.href = `/#book-${item.id || 'item'}`;
    }
  };

  // Category breakdown counts
  const selfDriveCount = myBookings.filter(isSelfDriveHolidayCategory).length;
  const carCount = myBookings.filter(isCarsCategory).length;
  const bikeCount = myBookings.filter(isBikesCategory).length;
  const packageCount = myBookings.filter(isTripPackageCategory).length;
  const sightseeingCount = myBookings.filter(isSightseeingBooking).length;
  const activityCount = myBookings.filter(isActivityBooking).length;
  const sightseeingActivitiesCount = sightseeingCount + activityCount;
  const hotelCount = myBookings.filter(isHotelBooking).length;
  const flightCount = myBookings.filter(isFlightBooking).length;
  const craftCount = myBookings.filter(isCraftBooking).length;
  const completedBookings = myBookings.filter(b => (b.status || '').toLowerCase() === 'completed');

  // Sorted upcoming bookings (nearest upcoming date first)
  const sortedUpcomingBookings = [...myBookings]
    .filter(b => {
      const s = (b.status || 'pending').toLowerCase();
      return s !== 'completed' && s !== 'cancelled' && s !== 'rejected';
    })
    .sort((a, b) => {
      const dateA = new Date(a.pickup_date || a.travel_date || a.departure_date || a.created_at || Date.now()).getTime();
      const dateB = new Date(b.pickup_date || b.travel_date || b.departure_date || b.created_at || Date.now()).getTime();
      return dateA - dateB;
    });

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── 1. Welcome Greeting Header Banner ─── */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
        <div className="card-body p-4 text-white position-relative">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-10 text-warning text-xs fw-bold mb-2">
                <Compass size={14} className="animate-spin-slow" />
                <span>WOW GOA CUSTOMER TRAVEL DESK</span>
              </div>
              <h2 className="fw-black mb-1 font-heading text-white">
                Welcome back, {currentUser?.name || currentUser?.username || 'Goa Explorer'}! 👋
              </h2>
              <p className="text-white-50 mb-3 small">
                Manage your Self Drive Holidays, live driver assignments, vouchers, wallet balance, and Goa itineraries in one place.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button 
                  onClick={() => onNavigateTab('selfdrive')}
                  className="btn btn-sm btn-warning text-dark fw-bold px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
                >
                  <Car size={15} />
                  <span>My Self Drive Holidays</span>
                  <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => onNavigateTab('bookings')}
                  className="btn btn-sm btn-outline-light text-white fw-bold px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5"
                >
                  <Calendar size={14} />
                  <span>View All Bookings ({myBookings.length})</span>
                </button>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end d-none d-lg-block">
              <div className="p-3 bg-white bg-opacity-10 rounded-3 border border-white border-opacity-10 d-inline-block text-start" style={{ minWidth: '220px' }}>
                <div className="text-xxs text-warning text-uppercase fw-bold mb-1 tracking-wider">Quick Helpline</div>
                <div className="fw-bold text-white small d-flex align-items-center gap-2">
                  <Phone size={14} className="text-warning" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="text-white-50 text-xxs mt-1">24/7 On-Road Assistance in Goa</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Dedicated Loyalty Tier & Membership Card ─── */}
      <CustomerLoyaltyCard bookings={myBookings} currentUser={currentUser} onNavigateTab={onNavigateTab} />

      {/* ─── 2B. Dedicated Cashback Wallet Summary Card ─── */}
      <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef2f6' }}>
        <div className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 p-2.5 text-warning d-flex align-items-center justify-content-center shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}>
              <Wallet size={24} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-black text-white mb-0 font-heading" style={{ fontSize: '18px' }}>
                  WOW GOA Cashback Wallet
                </h5>
                <span className="badge bg-warning text-dark text-xs fw-bold px-2.5 py-0.5 rounded-pill">
                  10% Cashback on Paid Amount
                </span>
              </div>
              <p className="text-white-50 text-xs mb-0 mt-0.5">
                Usable on future bookings across Self Drive Cars, Hotels, and Tours upon trip completion.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end text-white">
              <div className="text-white-50 text-xxs text-uppercase fw-bold">Available Balance</div>
              <div className="fs-4 fw-black text-warning font-heading">
                ₹{parseFloat(walletData.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <button 
              onClick={() => onNavigateTab && onNavigateTab('wallet')}
              className="btn btn-warning btn-sm rounded-pill fw-bold text-dark px-3 py-2 text-xs d-flex align-items-center gap-1 shadow-sm"
            >
              <span>View My Wallet</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {walletData.nearest_expiring && walletData.available_balance > 0 && (
          <div className="px-4 py-2.5 bg-warning bg-opacity-10 border-top d-flex align-items-center justify-content-between text-xs">
            <span className="text-dark d-flex align-items-center gap-1.5 fw-semibold">
              <Clock size={14} className="text-warning" />
              <span>₹{walletData.nearest_expiring.amount} cashback expires on <strong>{walletData.nearest_expiring.formatted_expires_at}</strong> (30-day validity policy)</span>
            </span>
            <button 
              onClick={() => onNavigateTab && onNavigateTab('wallet')}
              className="btn btn-link p-0 text-dark text-xs fw-bold text-decoration-none"
            >
              Track Countdown →
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. Top Metric Statistics Cards ─── */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-secondary text-uppercase tracking-wider">Total Bookings</span>
              <div className="rounded-circle p-2 bg-info bg-opacity-10 text-info">
                <Calendar size={16} />
              </div>
            </div>
            <div className="fs-3 fw-black text-dark">{myBookings.length}</div>
            <div className="text-xxs text-muted mt-1">All-time reservations</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-secondary text-uppercase tracking-wider">Active Bookings</span>
              <div className="rounded-circle p-2 bg-primary bg-opacity-10 text-primary">
                <Car size={16} />
              </div>
            </div>
            <div className="fs-3 fw-black text-primary">{activeBookings.length}</div>
            <div className="text-xxs text-primary mt-1 fw-bold">Live & confirmed</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-secondary text-uppercase tracking-wider">Upcoming Trips</span>
              <div className="rounded-circle p-2 bg-warning bg-opacity-10 text-warning">
                <Compass size={16} />
              </div>
            </div>
            <div className="fs-3 fw-black text-warning">{sortedUpcomingBookings.length}</div>
            <div className="text-xxs text-muted mt-1">Scheduled to travel</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-secondary text-uppercase tracking-wider">Completed Trips</span>
              <div className="rounded-circle p-2 bg-success bg-opacity-10 text-success">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="fs-3 fw-black text-success">{completedBookings.length}</div>
            <div className="text-xxs text-muted mt-1">Completed stays & trips</div>
          </div>
        </div>
      </div>

      {/* ─── 2B. Booking Categories Quick Badges ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-xs fw-bold text-dark text-uppercase tracking-wider font-heading">
            Your Bookings by Category:
          </span>
          <div className="d-flex flex-wrap gap-2">
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'selfdrive')}>
              ⭐ Self Drive Holiday: <strong className="text-warning">{selfDriveCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'cars')}>
              🚗 Cars: <strong className="text-primary">{carCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'bikes')}>
              🏍️ Bikes: <strong className="text-info">{bikeCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'package')}>
              🌴 Trip Package: <strong className="text-primary">{packageCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'sightseeing_activities')}>
              🎯 Sightseeing & Activities: <strong className="text-danger">{sightseeingActivitiesCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'hotel')}>
              🏨 Hotel: <strong className="text-success">{hotelCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'flight')}>
              ✈️ Flight: <strong className="text-info">{flightCount}</strong>
            </span>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold cursor-pointer" onClick={() => onNavigateTab('bookings', 'craftmytrip')}>
              ✨ Craft My Trip: <strong className="text-purple">{craftCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2C. Upcoming Bookings Timeline Schedule ─── */}
      {sortedUpcomingBookings.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '16px' }}>
                📅 Upcoming Travel Schedule
              </h6>
              <span className="text-muted text-xxs">Chronologically sorted by nearest start / travel date</span>
            </div>
            <button onClick={() => onNavigateTab('bookings')} className="btn btn-sm btn-link text-warning text-decoration-none fw-bold p-0 text-xs">
              View All →
            </button>
          </div>

          <div className="row g-2">
            {sortedUpcomingBookings.slice(0, 4).map((ub, uIdx) => (
              <div key={ub.id || uIdx} className="col-12 col-md-6 col-lg-3">
                <div 
                  className="p-3 rounded-3 bg-light border cursor-pointer h-100 hover-shadow transition"
                  onClick={() => onSelectBooking(ub)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-warning bg-opacity-10 text-dark border border-warning text-xxs px-2 py-0.5 rounded font-heading">
                      {ub.pickup_date || ub.travel_date || 'Upcoming'}
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success text-xxs px-2 py-0.5 rounded">
                      {ub.status || 'Confirmed'}
                    </span>
                  </div>
                  <div className="fw-bold text-dark text-xs text-truncate mb-1">
                    {ub.package_name || ub.item_name || ub.hotel_name || ub.vehicle_name || 'Trip Booking'}
                  </div>
                  <div className="text-muted text-xxs d-flex justify-content-between">
                    <span>#{ub.id || ub.booking_id}</span>
                    <span className="fw-bold text-dark">₹{Number(ub.total_amount || ub.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. Main Spotlight: Your Current Booking ─── */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle p-1.5 bg-warning text-dark">
              <Compass size={18} />
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '18px' }}>
                🎫 Your Current Booking
              </h5>
              <div className="text-muted text-xxs">Active reservation & confirmed trip details</div>
            </div>
          </div>
          <button 
            onClick={() => onNavigateTab('selfdrive')}
            className="btn btn-sm btn-link text-warning text-decoration-none fw-bold p-0 d-flex align-items-center gap-1"
          >
            <span>View All Holidays</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {nextHoliday ? (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }}>
            <div className="card-header bg-light border-0 py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-dark text-white text-xs px-3 py-1.5 rounded-pill fw-bold">
                  Booking #{nextHoliday.id || nextHoliday.booking_id || 'WOW-SD-101'}
                </span>
                <span className="text-muted text-xs">Booked on {nextHoliday.created_at ? new Date(nextHoliday.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
              </div>
              <div>
                {getStatusBadge(nextHoliday.status)}
              </div>
            </div>

            <div className="card-body p-4">
              {(() => {
                const type = (nextHoliday.package_type || nextHoliday.type || '').toLowerCase();
                const itemName = (nextHoliday.item_name || nextHoliday.package_name || nextHoliday.vehicle_name || '').toLowerCase();
                const itemId = String(nextHoliday.item_id || '').toLowerCase();
                const isActivity = type === 'activity' || type === 'sightseeing' || itemId.startsWith('act') || itemId.startsWith('sight');
                const isHotel = type === 'hotel' || type.includes('hotel') || itemName.includes('resort') || itemName.includes('hotel') || Boolean(nextHoliday.hotel_name);
                const isBike = type === 'bike' || type.includes('bike rental') || itemName.includes('bike') || itemName.includes('scooter') || itemName.includes('activa') || itemName.includes('himalayan') || itemName.includes('bullet') || itemName.includes('gt');
                const isSelfDrivePkg = type.includes('self drive') || type === 'selfdrive' || itemName.includes('self drive') || itemName.includes('craft my trip');
                const isFlight = type === 'flight' || itemName.includes('flight');
                const isTourPkg = (type.includes('package') || type.includes('tour')) && !isSelfDrivePkg && !isActivity;

                const categoryBadge = isActivity
                  ? '🎯 Sightseeing & Activity'
                  : isSelfDrivePkg 
                    ? '⭐ Self Drive Holiday' 
                    : isHotel 
                      ? '🏨 Hotel & Resort Stay' 
                      : isBike 
                        ? '🏍️ Bike Rental' 
                        : isTourPkg 
                          ? '🌴 Tour Package' 
                          : isFlight 
                            ? '✈️ Flight Booking' 
                            : '🚗 Self Drive Car';

                const subtitleText = isActivity
                  ? 'Curated Sightseeing & Adventure Experience in Goa'
                  : isHotel
                    ? 'Luxury Resort Stay • Breakfast & Pool Access Included'
                    : isBike
                      ? 'Unlimited KMs • Clean Helmets • Goa Tourist Permit'
                      : isSelfDrivePkg
                        ? 'Self Drive Vehicle + Hotel Stay + Unlimited KMs'
                        : isTourPkg
                          ? 'Guided Tour Itinerary • Transfers Included'
                          : 'Unlimited KMs • Comprehensive Insurance • Goa Permit';

                return (
                  <div className="row g-4 align-items-center">
                    {/* Item Image & Info */}
                    <div className="col-lg-4 text-center cursor-pointer" onClick={() => onSelectBooking(nextHoliday)}>
                      <div className="position-relative rounded-3 overflow-hidden p-2" style={{ background: '#f8fafc', height: '170px' }}>
                        <img 
                          src={getBookingDisplayImage(nextHoliday, cars, bikes, packages, hotels, flights)} 
                          alt={nextHoliday.item_name || 'Booking Image'} 
                          className="w-100 h-100 object-fit-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = isBike 
                              ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
                              : isHotel 
                                ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
                                : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <span className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                          ⭐ 4.9 Rated
                        </span>
                      </div>
                      <div className="fw-bold text-dark mt-2" style={{ fontSize: '15px' }}>
                        {nextHoliday.vehicle_name || nextHoliday.hotel_name || nextHoliday.item_name || 'WOW GOA Booking'}
                      </div>
                      <div className="text-muted text-xxs">{subtitleText}</div>
                    </div>

                    {/* Trip Itinerary & Schedule Details */}
                    <div className="col-lg-5">
                      <h4 className="fw-black text-dark mb-1 font-heading cursor-pointer" onClick={() => onSelectBooking(nextHoliday)} style={{ fontSize: '20px' }}>
                        {nextHoliday.package_name || nextHoliday.item_name || nextHoliday.hotel_name || nextHoliday.vehicle_name || 'Goa Booking'}
                      </h4>
                      <div className="d-flex align-items-center gap-2 text-muted text-xs mb-3">
                        <span className="badge bg-warning bg-opacity-10 text-dark fw-bold px-2 py-1 rounded">
                          ⏱️ {nextHoliday.duration || 'Scheduled Duration'}
                        </span>
                        <span>•</span>
                        <span className="fw-semibold text-dark">{categoryBadge}</span>
                      </div>

                      <div className="d-flex flex-column gap-2.5 p-3 rounded-3 cursor-pointer" onClick={() => onSelectBooking(nextHoliday)} style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div className="d-flex align-items-center justify-content-between text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <MapPin size={14} className="text-danger" /> {isHotel ? 'Check-in Location:' : 'Pickup Location:'}
                          </span>
                          <span className="fw-bold text-dark">{nextHoliday.pickup_location || nextHoliday.pickup || nextHoliday.hotel_location || 'Goa'} {nextHoliday.pickup_time ? `(${nextHoliday.pickup_time})` : ''}</span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <MapPin size={14} className="text-success" /> {isHotel ? 'Check-out Return:' : 'Return Location:'}
                          </span>
                          <span className="fw-bold text-dark">{nextHoliday.drop_location || nextHoliday.drop || nextHoliday.pickup_location || 'Goa'} {nextHoliday.drop_time ? `(${nextHoliday.drop_time})` : ''}</span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Calendar size={14} className="text-primary" /> Dates:
                          </span>
                          <span className="fw-bold text-dark">
                            {nextHoliday.pickup_date || nextHoliday.travel_date || 'Upcoming'} 
                            {nextHoliday.drop_date ? ` to ${nextHoliday.drop_date}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="col-lg-3 text-lg-end border-start-lg ps-lg-4">
                      <div className="text-xs text-muted mb-1">Total Booking Fare</div>
                      <div className="fs-3 fw-black text-dark font-heading mb-2">
                        ₹{Number(nextHoliday.total_amount || nextHoliday.amount || 0).toLocaleString('en-IN')}
                      </div>

                      <div className="d-flex justify-content-between justify-content-lg-end gap-3 text-xs mb-3">
                        <div>
                          <div className="text-muted text-xxs">Paid Online</div>
                          <div className="fw-bold text-success">₹{Number(nextHoliday.paid_amount || nextHoliday.total_paid || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div className="text-muted text-xxs">Pending Due</div>
                          <div className="fw-bold text-danger">₹{Number(nextHoliday.pending_amount || (Number(nextHoliday.total_amount || 0) > Number(nextHoliday.paid_amount || nextHoliday.total_paid || 0) ? Number(nextHoliday.total_amount || 0) - Number(nextHoliday.paid_amount || nextHoliday.total_paid || 0) : 0)).toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <button 
                          onClick={() => onSelectBooking(nextHoliday)}
                          className="btn btn-warning text-dark fw-bold rounded-pill py-2.5 shadow-sm d-flex align-items-center justify-content-center gap-2 font-heading"
                        >
                          <Eye size={16} />
                          <span>View Full Details →</span>
                        </button>
                        <button 
                          onClick={() => onNavigateTab('support')}
                          className="btn btn-outline-secondary btn-sm rounded-pill fw-bold"
                        >
                          Need Help with Booking?
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Chauffeur Service Addon Status if requested */}
            {(nextHoliday.driver_required == 1 || nextHoliday.driver_required === 'yes' || nextHoliday.driver_required === true) && (
              <div className="card-footer bg-warning bg-opacity-10 border-top border-warning border-opacity-25 px-4 py-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning text-dark fw-bold">Chauffeur Service Attached</span>
                    <span className="text-xs text-dark fw-semibold">
                      {nextHoliday.assigned_driver_name ? (
                        <span className="text-success fw-bold">✓ Assigned Driver: {nextHoliday.assigned_driver_name} ({nextHoliday.assigned_driver_phone || 'Contact Available'})</span>
                      ) : (
                        <span className="text-dark">⏳ Waiting for Chauffeur Assignment (Assistance on Standby)</span>
                      )}
                    </span>
                  </div>
                  <button 
                    onClick={() => onSelectBooking(nextHoliday)}
                    className="btn btn-xs btn-dark fw-bold rounded-pill px-3 py-1"
                  >
                    View Booking Details →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <div className="rounded-circle p-3 bg-light d-inline-flex mx-auto mb-3 text-warning">
              <Compass size={36} />
            </div>
            <h5 className="fw-bold text-dark mb-1">No Active Bookings Yet</h5>
            <p className="text-muted text-xs mb-3">Explore curated Self Drive holiday itineraries, luxury hotels, cars, and bikes in Goa.</p>
            <div>
              <a href="/#self-drive-categories" className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                Explore WOW GOA Bookings →
              </a>
            </div>
          </div>
        )}

        {/* ─── Other Active & Upcoming Bookings (when customer has multiple reservations) ─── */}
        {nextHoliday && myBookings.filter(b => (b.id || b.booking_id) !== (nextHoliday.id || nextHoliday.booking_id)).length > 0 && (
          <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-xs fw-bold text-muted text-uppercase">Other Active & Upcoming Reservations ({myBookings.filter(b => (b.id || b.booking_id) !== (nextHoliday.id || nextHoliday.booking_id)).length})</span>
              <button onClick={() => onNavigateTab('bookings')} className="btn btn-link text-warning p-0 text-xxs fw-bold text-decoration-none">View All My Bookings →</button>
            </div>
            <div className="row g-2">
              {myBookings.filter(b => (b.id || b.booking_id) !== (nextHoliday.id || nextHoliday.booking_id)).slice(0, 12).map((otherB, oIdx) => (
                <div key={otherB.id || oIdx} className="col-md-4">
                  <div 
                    onClick={() => onSelectBooking(otherB)}
                    className="card border-0 shadow-sm rounded-3 p-2.5 bg-white hover-shadow transition-all cursor-pointer d-flex flex-row align-items-center gap-2.5 h-100"
                    style={{ border: '1px solid #e2e8f0' }}
                  >
                    <div className="rounded-2 p-1 bg-light flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <img 
                        src={getBookingDisplayImage(otherB, cars, bikes, packages, hotels, flights)} 
                        alt="Thumbnail" 
                        className="w-100 h-100 object-fit-contain" 
                      />
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center gap-1.5 mb-0.5">
                        <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.2">{otherB.package_type || otherB.type || 'Booking'}</span>
                        {getStatusBadge(otherB.status)}
                      </div>
                      <div className="fw-bold text-dark text-xs text-truncate">{otherB.package_name || otherB.item_name || otherB.hotel_name || 'Reservation'}</div>
                      <div className="text-muted text-xxs">📅 {otherB.pickup_date || otherB.travel_date || 'Scheduled'} • ₹{Number(otherB.total_amount || otherB.amount || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Recent Bookings Table Preview ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <div>
            <h6 className="fw-bold text-dark mb-0 font-heading">Recent Trip Bookings</h6>
            <span className="text-muted text-xxs">Latest customer reservations across self drive, hotels, and vehicles</span>
          </div>
          <button 
            onClick={() => onNavigateTab('bookings')}
            className="btn btn-sm btn-outline-dark rounded-pill fw-bold text-xs"
          >
            View All ({myBookings.length})
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Booking ID</th>
                <th>Item / Package</th>
                <th>Category</th>
                <th>Travel Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.slice(0, 12).map((b, idx) => (
                <tr key={b.id || idx}>
                  <td className="ps-4 fw-bold text-dark">
                    #{b.id || b.booking_id || `WOW-${1000 + idx}`}
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{b.package_name || b.item_name || b.vehicle_name || 'Goa Booking'}</div>
                    <div className="text-muted text-xxs">📍 {b.pickup_location || b.pickup || 'Goa'}</div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1 rounded text-xxs fw-bold text-uppercase">
                      {b.package_type || b.type || 'Holiday'}
                    </span>
                  </td>
                  <td className="text-xs">
                    {b.pickup_date || b.travel_date || 'Scheduled'}
                  </td>
                  <td className="fw-bold text-dark">
                    ₹{Number(b.total_amount || b.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    {getStatusBadge(b.status)}
                  </td>
                  <td className="text-end pe-4">
                    <button 
                      onClick={() => onSelectBooking(b)}
                      className="btn btn-sm btn-light border text-dark fw-bold rounded-pill px-3 py-1 text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}

              {myBookings.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Calendar size={32} className="mb-2 text-muted opacity-50" />
                    <div>No booking history found for this account.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. Explore More WOW GOA (Complete Categories & Direct Booking) ─── */}
      <div 
        id="explore-more-section"
        className="card border-0 rounded-4 overflow-hidden mb-4 bg-white p-3 p-md-4 position-relative" 
        style={{ 
          scrollMarginTop: '80px',
          border: '2px solid #FFC107', 
          boxShadow: '0 12px 36px rgba(255, 193, 7, 0.15)',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)'
        }}
      >
        {/* Top Highlight Badge Ribbon */}
        <div className="position-absolute top-0 end-0 m-3 d-none d-md-block">
          <span className="badge bg-warning text-dark fw-black px-3 py-1.5 rounded-pill shadow-xs d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
            <Sparkles size={13} className="text-dark" />
            <span>INSTANT DIRECT BOOKING</span>
          </span>
        </div>

        {/* Section Header */}
        <div className="mb-3">
          <div className="d-inline-flex align-items-center gap-1.5 badge bg-dark text-warning fw-bold text-xxs px-3 py-1 rounded-pill mb-2 shadow-xs">
            <Sparkles size={13} className="text-warning" />
            <span>⭐ OFFICIAL WOW GOA CATALOG & RESERVATIONS</span>
          </div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            🌴 Explore More WOW GOA & Book Holidays
          </h4>
          <p className="text-muted text-xs mb-2" style={{ maxWidth: '780px' }}>
            Choose from real Self Drive vehicles, curated holiday packages, luxury beachfront resorts, and airport transfers — direct booking with instant confirmation.
          </p>

          {/* Quick Value Props Highlights Bar */}
          <div className="d-flex flex-wrap gap-2 pt-1 pb-2">
            <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs fw-semibold">
              ⚡ Instant Booking & Confirmation
            </span>
            <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs fw-semibold">
              🚗 Unlimited KMs & Goa Tourist Permit
            </span>
            <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs fw-semibold">
              🛡️ Zero Deposit & Full Insurance
            </span>
            <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs fw-semibold">
              📍 Free Airport & Hotel Delivery
            </span>
          </div>
        </div>

        {/* Category Navigation Pills with Vibrant Highlights */}
        <div className="d-flex flex-wrap gap-2 mb-4 pb-3 border-bottom">
          <button
            type="button"
            onClick={() => setExploreCategory('selfdrive')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'selfdrive'
                ? 'btn-warning text-dark shadow-sm border-0'
                : 'btn-light text-dark border hover-bg-warning hover-text-dark'
            }`}
            style={{
              background: exploreCategory === 'selfdrive' ? 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)' : '#f8fafc',
              fontWeight: 700
            }}
          >
            <Compass size={16} />
            <span>⭐ Self Drive Holidays & Fleets ({selfDriveList.length})</span>
            <span className="badge bg-dark text-warning text-xxs px-1.5 py-0.5 rounded-pill fw-black ms-1">
              HOT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setExploreCategory('packages')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'packages'
                ? 'btn-dark text-white shadow-sm border-0'
                : 'btn-light text-dark border hover-bg-dark hover-text-white'
            }`}
            style={{ fontWeight: 700 }}
          >
            <Calendar size={16} />
            <span>🌴 Tour Packages ({tourPackagesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setExploreCategory('craftmytrip')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'craftmytrip'
                ? 'btn-warning text-dark shadow-sm border-0'
                : 'btn-light text-dark border hover-bg-warning hover-text-dark'
            }`}
            style={{
              background: exploreCategory === 'craftmytrip' ? 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)' : '#f8fafc',
              fontWeight: 700
            }}
          >
            <Wand2 size={16} />
            <span>✨ Craft My Trip (Tailor-Made)</span>
            <span className="badge bg-dark text-warning text-xxs px-1.5 py-0.5 rounded-pill fw-black ms-1">
              HOT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setExploreCategory('hotels')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'hotels'
                ? 'btn-primary text-white shadow-sm border-0'
                : 'btn-light text-dark border hover-bg-primary hover-text-white'
            }`}
            style={{ fontWeight: 700 }}
          >
            <Hotel size={16} />
            <span>🏨 Hotels & Resorts ({hotelsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setExploreCategory('flights')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'flights'
                ? 'btn-info text-white shadow-sm border-0'
                : 'btn-light text-dark border hover-bg-info hover-text-white'
            }`}
            style={{ fontWeight: 700 }}
          >
            <Plane size={16} />
            <span>✈️ Flights & Transfers</span>
          </button>

          <button
            type="button"
            onClick={() => setExploreCategory('activities')}
            className={`btn btn-sm rounded-pill px-3.5 py-2 text-xs fw-bold d-flex align-items-center gap-2 transition-all ${
              exploreCategory === 'activities'
                ? 'text-white shadow-sm border-0'
                : 'btn-light text-dark border'
            }`}
            style={{
              fontWeight: 700,
              background: exploreCategory === 'activities' ? 'linear-gradient(135deg, #0D1B2E 0%, #1E3E62 100%)' : undefined
            }}
          >
            <MapPin size={16} />
            <span>🎯 Sightseeing & Activities ({activitiesList.length})</span>
          </button>
        </div>

        {/* ─── 1. Self Drive Multi-Tier Horizontal Sliding Showcase (Two Wheelers, Four Wheelers, Luxury Cars) ─── */}
        {exploreCategory === 'selfdrive' && (
          <div className="mb-4">
            <div 
              className="p-2 p-md-3 rounded-4 overflow-hidden" 
              style={{ 
                background: '#ebf1f6', 
                border: '1px solid rgba(203, 213, 225, 0.8)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 px-2 pt-2">
                <div>
                  <h5 className="fw-black text-dark mb-0.5 font-heading" style={{ fontSize: '18px' }}>
                    🚗 Goa Self Drive Fleets & Vehicles
                  </h5>
                  <p className="text-muted text-xs mb-0">
                    Interactive multi-tier categories • Two Wheelers, Four Wheelers, and Luxury Convertibles
                  </p>
                </div>
                <div className="badge bg-white text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold shadow-xs">
                  ✨ Instant Confirmation • Zero Deposit
                </div>
              </div>

              <SelfDriveCategoryShowcase
                cars={cars}
                bikes={bikes}
                markups={markups}
                onBookVehicle={(v) => handleTriggerDetails(v, isBikeVehicle(v) ? 'bike' : 'car')}
                onViewVehicle={(v) => handleTriggerDetails(v, isBikeVehicle(v) ? 'bike' : 'car')}
                setActiveTab={onNavigateTab}
              />
            </div>
          </div>
        )}

        {/* ─── Self Drive Curated Holiday Packages (when Self Drive category is selected) ─── */}
        {exploreCategory === 'selfdrive' && (
          <div className="mt-2 mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h5 className="fw-black text-dark mb-0.5 font-heading" style={{ fontSize: '17px' }}>
                  ⭐ Curated Self Drive Holiday Packages
                </h5>
                <p className="text-muted text-xxs mb-0">
                  Complete vacation itineraries with vehicle + resort stay + unlimited KMs
                </p>
              </div>

              {/* Subcategory Filter Pills */}
              <div className="d-flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Holidays' },
                  { id: '4x4', label: '🚙 4x4 Off-Road' },
                  { id: 'romantic', label: '💑 Romantic Couples' },
                  { id: 'family', label: '👨‍👩‍👧‍👦 Family Roadtrips' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelfDriveSubcategory(sub.id)}
                    className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-bold transition-all ${
                      selfDriveSubcategory === sub.id
                        ? 'btn-dark text-warning shadow-xs'
                        : 'btn-outline-secondary'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="row g-3">
              {selfDriveList
                .filter(item => selfDriveSubcategory === 'all' || item.category === selfDriveSubcategory || item.name?.toLowerCase().includes(selfDriveSubcategory))
                .map((item, idx) => {
                  const pkgImg = item.image || item.image_url || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
                  return (
                    <div key={item.id || idx} className="col-md-6 col-xl-4">
                      <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-shadow transition-all d-flex flex-column" style={{ border: '1px solid #eef2f6' }}>
                        <div className="position-relative cursor-pointer" style={{ height: '170px', cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'package')}>
                          <img 
                            src={pkgImg} 
                            alt={item.name} 
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
                            }} 
                          />
                          <span className="position-absolute top-0 start-0 m-2.5 badge bg-warning text-dark text-xxs px-2.5 py-1 rounded-pill fw-black shadow-sm">
                            ⭐ Holiday Package
                          </span>
                          <span className="position-absolute bottom-0 end-0 m-2.5 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                            ⏱️ {item.duration || '3 Nights / 4 Days'}
                          </span>
                        </div>

                        <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                          <div>
                            <h6 className="fw-black text-dark mb-1 font-heading text-truncate cursor-pointer" title={item.name} style={{ cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'package')}>
                              {item.name}
                            </h6>
                            <div className="d-flex align-items-center gap-1 text-warning text-xxs mb-1.5">
                              <span>★★★★★</span>
                              <span className="text-muted fw-bold">(4.9 • Verified Package)</span>
                            </div>
                            <p className="text-muted text-xxs mb-2 line-clamp-2" style={{ minHeight: '32px' }}>
                              {item.description || item.places_included || 'Includes curated Goa travel itinerary, resort accommodation, and transfers.'}
                            </p>
                            
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              {item.car_included && <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">🚗 {item.car_included}</span>}
                              {item.hotel_included && <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">🏨 {item.hotel_included}</span>}
                              <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">✓ Unlimited KMs</span>
                              <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">✓ Zero Deposit</span>
                            </div>
                          </div>

                          <div className="pt-2 border-top">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div>
                                <span className="text-xxs text-muted">Starting package from</span>
                                <div className="fs-5 fw-black text-dark font-heading">
                                  ₹{Number(item.price || 14999).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            <div className="row g-1.5">
                              <div className="col-6">
                                <button 
                                  type="button"
                                  onClick={() => handleTriggerDetails(item, 'package')}
                                  className="btn btn-sm btn-outline-dark rounded-pill w-100 py-1.5 text-xs fw-bold d-flex align-items-center justify-content-center gap-1"
                                >
                                  <Eye size={13} />
                                  <span>View Details</span>
                                </button>
                              </div>
                              <div className="col-6">
                                <button 
                                  type="button"
                                  onClick={() => handleTriggerDetails(item, 'package')}
                                  className="btn btn-sm btn-warning text-dark rounded-pill w-100 py-1.5 text-xs fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1"
                                >
                                  <span>Book Now →</span>
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
          </div>
        )}

        {/* ─── Craft My Trip Embedded Portal Builder ─── */}
        {exploreCategory === 'craftmytrip' && (
          <div className="cmt-portal-embedded-section mb-4">
            <CraftMyTripPage
              isPortal={true}
              currentUser={currentUser}
              allCars={cars}
              allBikes={bikes}
              allHotels={hotels}
              allActivities={activities}
              allFlights={flights}
              bookings={bookings}
              onConfirm={(rec) => {
                if (typeof onSelectBooking === 'function' && rec) {
                  onSelectBooking(rec);
                }
              }}
            />
          </div>
        )}

        {/* ─── Cards Grid for Other Categories (Tour Packages, Hotels, Flights) ─── */}
        <div className="row g-3">
          
          {/* 2. Tour Packages Cards */}
          {exploreCategory === 'packages' && tourPackagesList.map((item, idx) => {
            const pkgImg = item.image || item.image_url || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
            return (
              <div key={item.id || idx} className="col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-shadow transition-all d-flex flex-column" style={{ border: '1px solid #eef2f6' }}>
                  <div className="position-relative cursor-pointer" style={{ height: '170px', cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'package')}>
                    <img 
                      src={pkgImg} 
                      alt={item.name} 
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
                      }} 
                    />
                    <span className="position-absolute top-0 start-0 m-2.5 badge bg-dark text-white text-xxs px-2.5 py-1 rounded-pill fw-black shadow-sm">
                      🌴 Goa Tour Package
                    </span>
                    <span className="position-absolute bottom-0 end-0 m-2.5 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                      ⏱️ {item.duration || '3 Nights / 4 Days'}
                    </span>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      <h6 className="fw-black text-dark mb-1 font-heading text-truncate cursor-pointer" title={item.name} style={{ cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'package')}>
                        {item.name}
                      </h6>
                      <div className="d-flex align-items-center gap-1 text-warning text-xxs mb-1.5">
                        <span>★★★★★</span>
                        <span className="text-muted fw-bold">(4.9 • Verified Itinerary)</span>
                      </div>
                      <p className="text-muted text-xxs mb-2 line-clamp-2" style={{ minHeight: '32px' }}>
                        {item.description || item.places_included || 'Includes curated Goa travel itinerary, luxury resort stay, and seamless transfers.'}
                      </p>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {item.car_included && <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">🚗 {item.car_included}</span>}
                        {item.hotel_included && <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">🏨 {item.hotel_included}</span>}
                        <span className="badge bg-light text-dark border text-xxs px-1.5 py-0.5">✓ Guided Tour</span>
                      </div>
                    </div>
                    <div className="pt-2 border-top">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div>
                          <span className="text-xxs text-muted">Starting package from</span>
                          <div className="fs-5 fw-black text-dark font-heading">
                            ₹{Number(item.price || 14999).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <div className="row g-1.5">
                        <div className="col-6">
                          <button 
                            type="button"
                            onClick={() => handleTriggerDetails(item, 'package')}
                            className="btn btn-sm btn-outline-dark rounded-pill w-100 py-1.5 text-xs fw-bold d-flex align-items-center justify-content-center gap-1"
                          >
                            <Eye size={13} />
                            <span>View Details</span>
                          </button>
                        </div>
                        <div className="col-6">
                          <button 
                            type="button"
                            onClick={() => handleTriggerDetails(item, 'package')}
                            className="btn btn-sm btn-warning text-dark rounded-pill w-100 py-1.5 text-xs fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1"
                          >
                            <span>Book Now →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 3. Hotels Cards */}
          {exploreCategory === 'hotels' && hotelsList.map((item, idx) => (
            <div key={item.id || idx} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-shadow transition-all d-flex flex-column" style={{ border: '1px solid #eef2f6' }}>
                <div className="position-relative cursor-pointer" style={{ height: '170px', cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'hotel')}>
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} 
                    alt={item.name} 
                    className="w-100 h-100 object-fit-cover" 
                  />
                  <span className="position-absolute top-0 start-0 m-2.5 badge bg-primary text-white text-xxs px-2.5 py-1 rounded-pill fw-black shadow-sm">
                    🏨 Luxury Stay
                  </span>
                  <span className="position-absolute bottom-0 end-0 m-2.5 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                    {item.rating || '5.0 ★'}
                  </span>
                </div>
                <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <h6 className="fw-black text-dark mb-0.5 font-heading text-truncate cursor-pointer" title={item.name} style={{ cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'hotel')}>
                      {item.name}
                    </h6>
                    <div className="text-muted text-xxs mb-1.5">📍 {item.location || 'North Goa'}</div>
                    <p className="text-muted text-xxs mb-2 line-clamp-2" style={{ minHeight: '32px' }}>
                      {item.description || 'Beachside resort with multi-cuisine dining, swimming pool, luxury suites, and free breakfast.'}
                    </p>
                  </div>
                  <div className="pt-2 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <span className="text-xxs text-muted">Per Night From</span>
                        <div className="fs-5 fw-black text-primary font-heading">
                          ₹{Number(item.price || 4999).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="row g-1.5">
                      <div className="col-6">
                        <button 
                          type="button"
                          onClick={() => handleTriggerDetails(item, 'hotel')}
                          className="btn btn-sm btn-outline-dark rounded-pill w-100 py-1.5 text-xs fw-bold d-flex align-items-center justify-content-center gap-1"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                      </div>
                      <div className="col-6">
                        <button 
                          type="button"
                          onClick={() => handleTriggerDetails(item, 'hotel')}
                          className="btn btn-sm btn-warning text-dark rounded-pill w-100 py-1.5 text-xs fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1"
                        >
                          <span>Book Now →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 5. Flights & Transfers Cards */}
          {exploreCategory === 'flights' && flightsList.map((item, idx) => (
            <div key={item.id || idx} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-shadow transition-all d-flex flex-column" style={{ border: '1px solid #eef2f6' }}>
                <div className="position-relative cursor-pointer" style={{ height: '170px', cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'flight')}>
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80'} 
                    alt={item.name} 
                    className="w-100 h-100 object-fit-cover" 
                  />
                  <span className="position-absolute top-0 start-0 m-2.5 badge bg-info text-white text-xxs px-2.5 py-1 rounded-pill fw-black shadow-sm">
                    ✈️ Flights & Airport Transfer
                  </span>
                  <span className="position-absolute bottom-0 end-0 m-2.5 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                    {item.duration || 'Direct'}
                  </span>
                </div>
                <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <h6 className="fw-black text-dark mb-0.5 font-heading text-truncate cursor-pointer" title={item.name} style={{ cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'flight')}>
                      {item.name}
                    </h6>
                    <div className="text-muted text-xxs mb-1.5">{item.airline || 'Direct Daily Flights'}</div>
                    <p className="text-muted text-xxs mb-2 line-clamp-2" style={{ minHeight: '32px' }}>
                      {item.description || 'Seamless flight bookings with 15kg baggage included and airport cab pickup assistance.'}
                    </p>
                  </div>
                  <div className="pt-2 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <span className="text-xxs text-muted">Starting Airfare</span>
                        <div className="fs-5 fw-black text-dark font-heading">
                          ₹{Number(item.price || 3499).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div className="row g-1.5">
                      <div className="col-6">
                        <button 
                          type="button"
                          onClick={() => handleTriggerDetails(item, 'flight')}
                          className="btn btn-sm btn-outline-dark rounded-pill w-100 py-1.5 text-xs fw-bold d-flex align-items-center justify-content-center gap-1"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                      </div>
                      <div className="col-6">
                        <button 
                          type="button"
                          onClick={() => handleTriggerDetails(item, 'flight')}
                          className="btn btn-sm btn-warning text-dark rounded-pill w-100 py-1.5 text-xs fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1"
                        >
                          <span>Book Now →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 6. Sightseeing & Activities Cards */}
          {exploreCategory === 'activities' && (
            activitiesList.length === 0 ? (
              <div className="col-12 text-center py-5">
                <div className="rounded-circle p-3 bg-light d-inline-flex mx-auto mb-3 text-warning">
                  <MapPin size={32} />
                </div>
                <h6 className="fw-bold text-dark mb-1">No Activities Yet</h6>
                <p className="text-muted text-xs mb-3">Sightseeing spots and adventure activities will appear here.</p>
              </div>
            ) : (
              activitiesList.map((item, idx) => {
                const imgSrc = item.image_url || item.image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
                const isSightseeing = (item.type || '').toLowerCase() === 'sightseeing';
                return (
                  <div key={item.id || idx} className="col-md-6 col-xl-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-shadow transition-all d-flex flex-column" style={{ border: '1px solid #eef2f6' }}>
                      <div className="position-relative cursor-pointer" style={{ height: '170px', cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'activity')}>
                        <img
                          src={imgSrc}
                          alt={item.title || item.name}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'; }}
                        />
                        <span className={`position-absolute top-0 start-0 m-2 badge text-white text-xxs px-2.5 py-1 rounded-pill fw-black shadow-sm ${isSightseeing ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {isSightseeing ? '🏛️ Sightseeing' : '🎯 Activity'}
                        </span>
                        {item.duration && (
                          <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white text-xxs px-2 py-1 rounded-pill">
                            ⏱️ {item.duration}
                          </span>
                        )}
                      </div>
                      <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                        <div>
                          <h6 className="fw-black text-dark mb-0.5 font-heading text-truncate cursor-pointer" title={item.title || item.name} style={{ cursor: 'pointer' }} onClick={() => handleTriggerDetails(item, 'activity')}>
                            {item.title || item.name}
                          </h6>
                          {item.location && (
                            <div className="text-muted text-xxs mb-1.5">📍 {item.location}</div>
                          )}
                          {item.category && (
                            <span className="badge bg-light text-dark border text-xxs px-2 py-0.5 mb-1.5 d-inline-block">{item.category}</span>
                          )}
                          <p className="text-muted text-xxs mb-2 line-clamp-2" style={{ minHeight: '32px' }}>
                            {item.description || 'An unforgettable Goa experience.'}
                          </p>
                        </div>
                        <div className="pt-2 border-top">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div>
                              <span className="text-xxs text-muted">Per Person From</span>
                              <div className="fs-5 fw-black text-dark font-heading">
                                ₹{Number(item.price || 999).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                          <div className="row g-1.5">
                            <div className="col-6">
                              <button 
                                type="button"
                                onClick={() => handleTriggerDetails(item, 'activity')}
                                className="btn btn-sm btn-outline-dark rounded-pill w-100 py-1.5 text-xs fw-bold d-flex align-items-center justify-content-center gap-1"
                              >
                                <Eye size={13} />
                                <span>View Details</span>
                              </button>
                            </div>
                            <div className="col-6">
                              <button
                                type="button"
                                onClick={() => handleTriggerDetails(item, 'activity')}
                                className="btn btn-sm btn-warning text-dark rounded-pill w-100 py-1.5 text-xs fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1"
                              >
                                <span>Book Now →</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

        </div>
      </div>

    </div>
  );
}
