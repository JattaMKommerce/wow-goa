import React, { useState } from 'react';
import BookingVoucher from '../common/BookingVoucher';
import CustomerCancellationModal from './CustomerCancellationModal';
import {
  Calendar, Car, Hotel, Compass, Plane, Package, Search,
  Filter, Download, Eye, CheckCircle2, Clock, XCircle,
  FileText, ArrowRight, ShieldCheck, MapPin, ChevronRight, X
} from 'lucide-react';
import { formatBookingDateTime, formatDateShort } from '../../utils/dateUtils';

export default function CustomerBookingsTab({
  currentUser,
  bookings = [],
  onOpenBookingDetails,
  initialCategory = 'all'
}) {
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
  const [sightseeingSubFilter, setSightseeingSubFilter] = useState('sightseeing'); // 'sightseeing' | 'activities'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const canCancel = (b) => {
    if (!b) return false;
    const st = (b.status || '').toLowerCase();
    return st !== 'cancelled' && st !== 'completed';
  };

  // Sync initialCategory prop if passed
  React.useEffect(() => {
    if (initialCategory && initialCategory !== categoryFilter) {
      if (initialCategory === 'sightseeing') {
        setCategoryFilter('sightseeing_activities');
        setSightseeingSubFilter('sightseeing');
      } else if (initialCategory === 'activities') {
        setCategoryFilter('sightseeing_activities');
        setSightseeingSubFilter('activities');
      } else {
        setCategoryFilter(initialCategory);
      }
    }
  }, [initialCategory]);

  // Defensively ensure child bookings (with parent_booking_id) are never displayed as separate standalone cards
  const myBookings = React.useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    const childBookings = list.filter(b => Boolean(b && b.parent_booking_id && String(b.parent_booking_id).trim() !== ''));
    if (childBookings.length === 0) return list;

    const childrenByParent = new Map();
    childBookings.forEach(c => {
      const pId = String(c.parent_booking_id).trim();
      if (!childrenByParent.has(pId)) childrenByParent.set(pId, []);
      childrenByParent.get(pId).push(c);
    });

    const masterBookings = list.filter(b => !b || !b.parent_booking_id || String(b.parent_booking_id).trim() === '');
    return masterBookings.map(master => {
      const mId = String(master.id || master.booking_id || '').trim();
      const children = childrenByParent.get(mId) || [];
      if (children.length === 0) return master;
      return {
        ...master,
        type: 'package',
        package_type: master.package_type || 'Trip Package',
        child_bookings: master.child_bookings || children,
        hotel_child: master.hotel_child || children.find(c => c.type === 'hotel' || String(c.id).startsWith('BK-H-')),
        vehicle_child: master.vehicle_child || children.find(c => c.type === 'car' || c.type === 'vehicle' || String(c.id).startsWith('BK-V-')),
        driver_child: master.driver_child || children.find(c => c.type === 'driver' || String(c.id).startsWith('BK-D-'))
      };
    });
  }, [bookings]);

  // ─── Unified Driver Service Helper ───
  const hasDriverService = (b) => {
    if (!b) return false;
    const rawType = String(b.package_type || b.type || '').toLowerCase();
    const rawItem = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const rawId = String(b.item_id || '').toLowerCase();
    
    // Strict isolation: Bikes never have driver service
    if (
      rawType === 'bike' || rawType.includes('bike') || rawType.includes('scooter') ||
      rawId.startsWith('bike') || rawId.startsWith('bk-') ||
      /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|access/i.test(rawItem)
    ) {
      return false;
    }

    // 1. Explicit driver service type
    const svcType = String(b.driver_service_type || '').toUpperCase().trim();
    if (['PICKUP', 'DROP', 'FULL'].includes(svcType)) return true;
    if (svcType === 'NONE') return false;

    // 2. Explicit driver_required flag
    if (b.driver_required === 1 || b.driver_required === '1' || b.driver_required === true || b.driver_required === 'yes') return true;
    if (b.driver_required === 0 || b.driver_required === '0' || b.driver_required === false || b.driver_required === 'no') return false;

    // 3. Assigned driver present
    if (b.assigned_driver_id && String(b.assigned_driver_id).trim() !== '' && String(b.assigned_driver_id).trim() !== '0') return true;

    // 4. Booking type or item name indicating driver vs self-drive
    const pkgType = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    if (pkgType.includes('with driver') || itemName.includes('with driver') || itemName.includes('with chauffeur') || pkgType === 'driver') return true;
    if (pkgType.includes('self drive') || pkgType === 'selfdrive' || itemName.includes('self drive') || itemName.includes('self-drive')) return false;

    return false;
  };

  // ─── Unified Category Helpers ───
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
    return (
      type === 'flight' ||
      type.includes('flight') ||
      itemName.includes('flight') ||
      itemId.startsWith('fl-') ||
      itemId.startsWith('fl_') ||
      itemId.includes('flight') ||
      Boolean(b.flight_number || b.airline)
    );
  };

  const isHotelBooking = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || b.hotel_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    if (
      type.includes('package') ||
      type.includes('self drive') ||
      type === 'selfdrive' ||
      itemId.startsWith('pkg-') ||
      itemId.startsWith('package-') ||
      itemId.startsWith('tp-') ||
      itemId.startsWith('car-') ||
      itemId.startsWith('bike-')
    ) {
      return false;
    }
    return (
      type === 'hotel' ||
      type.includes('hotel') ||
      Boolean(b.hotel_name && !b.vehicle_name && !b.car_included) ||
      itemId.startsWith('hotel-') ||
      itemId.startsWith('hotel_') ||
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

    // Trip packages are never standalone sightseeing
    if (type === 'package' || type === 'trip package' || b.package_type === 'Trip Package' || itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-')) {
      return false;
    }

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

    // Trip packages are never standalone activities
    if (type === 'package' || type === 'trip package' || b.package_type === 'Trip Package' || itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-')) {
      return false;
    }

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
      itemId.startsWith('bk-') ||
      itemName.includes('bike') ||
      itemName.includes('scooter') ||
      itemName.includes('activa') ||
      itemName.includes('himalayan') ||
      itemName.includes('bullet') ||
      itemName.includes('jupiter') ||
      itemName.includes('classic 350') ||
      itemName.includes('fz-s') ||
      itemName.includes('access 125') ||
      itemName.includes('faschino') ||
      itemName.includes('vespa') ||
      itemName.includes('royal enfield') ||
      itemName.includes('hunter 350') ||
      itemName.includes('tvs')
    );
  };

  const isTripPackageItem = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b) || isBikeItem(b)) return false;
    const itemId = String(b.item_id || '').toLowerCase();
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();

    if (itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-') || type === 'package' || type === 'trip package' || b.package_type === 'Trip Package') {
      return true;
    }

    if (itemId.startsWith('car-') || itemId.startsWith('car_') || itemId.startsWith('bike-') || itemId.startsWith('bk-')) return false;

    // If it explicitly indicates car rental or vehicle, it's not a trip package
    if (type === 'car' || type === 'cars' || type === 'vehicle' || type.includes('car rental') || type.includes('vehicle rental') || type === 'driver') {
      return false;
    }
    if (itemName.includes('self drive car') || itemName.includes('car rental') || itemName.includes('thar') || itemName.includes('swift') || itemName.includes('creta')) {
      return false;
    }

    if (type === 'tour' || type === 'trip' || (type.includes('package') && !type.includes('self drive') && !type.includes('car'))) {
      return true;
    }

    const packageKeywords = [
      'package', 'tour', 'getaway', 'explorer', 'escape', 'holiday package',
      'vacation', 'experience', 'bali', 'kerala', 'kashmir', 'dubai',
      'thailand', 'maldives', 'goa tour', 'heritage trail', 'coastal goa',
      'sunset escape', 'honeymoon'
    ];
    if (packageKeywords.some(kw => itemName.includes(kw)) && !itemName.includes('self drive') && !itemName.includes('car')) {
      return true;
    }

    if (Boolean(b.duration && (b.hotel_name || b.hotel_included) && !itemId.startsWith('car-') && !itemId.startsWith('bike-') && !b.vehicle_name)) {
      return true;
    }

    return false;
  };

  const isCarItem = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b) || isHotelBooking(b) || isSightseeingBooking(b) || isActivityBooking(b) || isBikeItem(b) || isTripPackageItem(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();

    if (itemId.startsWith('car-') || itemId.startsWith('car_') || itemId.startsWith('lux-')) return true;
    if (
      type === 'car' ||
      type === 'cars' ||
      type.includes('car rental') ||
      type.includes('vehicle rental') ||
      type === 'vehicle' ||
      type === 'driver' ||
      type === 'selfdrive' ||
      type.includes('self drive')
    ) return true;

    const carKeywords = [
      'car', 'thar', 'swift', 'creta', 'ertiga', 'fortuner', 'innova', 'cabriolet',
      'audi', 'bmw', 'baleno', 'i20', 'scorpio', 'kia', 'seltos', 'verna', 'wagonr',
      'celerio', 'dzire', 'altroz', 'nexon', 'xuv', 'harrier', 'tiago', 'venue',
      'compass', 'mercedes', 'sedan', 'suv', 'hatchback', 'maruti', 'hyundai',
      'mahindra', 'toyota', 'tata', 'mg hector', 'glanza'
    ];
    if (carKeywords.some(kw => itemName.includes(kw))) return true;

    if (b.vehicle_name && !isBikeItem(b)) return true;

    return false;
  };

  // ─── Classification Rules ───
  // CAR + SELF DRIVE (No driver required) -> Self Drive Holiday
  // CAR + DRIVER -> Cars
  // BIKE -> Bikes (Strictly bike bookings, NEVER Self Drive Holiday)
  // HOTEL -> Hotel
  // SIGHTSEEING / ACTIVITY -> Sightseeing & Activities
  // TRIP PACKAGE -> Trip Package
  // FLIGHT -> Flight
  // CRAFT MY TRIP -> Craft My Trip

  const isCraftCategory = (b) => isCraftBooking(b);
  const isFlightCategory = (b) => isFlightBooking(b);
  const isHotelCategory = (b) => isHotelBooking(b);
  const isSightseeingCategory = (b) => isSightseeingBooking(b);
  const isActivityCategory = (b) => isActivityBooking(b);
  const isTripPackageCategory = (b) => isTripPackageItem(b);
  const isBikesCategory = (b) => isBikeItem(b);
  const isCarsCategory = (b) => isCarItem(b) && hasDriverService(b);
  const isSelfDriveHolidayCategory = (b) => isCarItem(b) && !hasDriverService(b);

  // ─── Category counts ───
  const countByType = {
    all: myBookings.length,
    selfdrive: myBookings.filter(isSelfDriveHolidayCategory).length,
    cars: myBookings.filter(isCarsCategory).length,
    bikes: myBookings.filter(isBikesCategory).length,
    package: myBookings.filter(isTripPackageCategory).length,
    sightseeing: myBookings.filter(isSightseeingCategory).length,
    activities: myBookings.filter(isActivityCategory).length,
    hotel: myBookings.filter(isHotelCategory).length,
    flight: myBookings.filter(isFlightCategory).length,
    craftmytrip: myBookings.filter(isCraftCategory).length,
  };

  // Apply category and status filters
  const filteredBookings = myBookings.filter(b => {
    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'selfdrive' && !isSelfDriveHolidayCategory(b)) return false;
      if (categoryFilter === 'cars' && !isCarsCategory(b)) return false;
      if (categoryFilter === 'bikes' && !isBikesCategory(b)) return false;
      if (categoryFilter === 'package' && !isTripPackageCategory(b)) return false;
      if (categoryFilter === 'sightseeing_activities') {
        if (sightseeingSubFilter === 'sightseeing' && countByType?.sightseeing > 0) {
          if (!isSightseeingCategory(b)) return false;
        } else if (sightseeingSubFilter === 'activities' && countByType?.activities > 0) {
          if (!isActivityCategory(b)) return false;
        } else {
          if (!isSightseeingCategory(b) && !isActivityCategory(b)) return false;
        }
      }
      if (categoryFilter === 'hotel' && !isHotelCategory(b)) return false;
      if (categoryFilter === 'flight' && !isFlightCategory(b)) return false;
      if (categoryFilter === 'craftmytrip' && !isCraftCategory(b)) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if ((b.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Search query across ID, Destination, Hotel name, Vehicle, Package name, Flight number
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const id = String(b.id || b.booking_id || '').toLowerCase();
      const name = String(b.item_name || b.package_name || b.vehicle_name || b.hotel_name || '').toLowerCase();
      const loc = String(b.pickup_location || b.pickup_loc || b.pickup || b.hotel_location || '').toLowerCase();
      const cust = String(b.customer_name || b.name || '').toLowerCase();
      const phone = String(b.customer_phone || b.phone || '').toLowerCase();
      if (!id.includes(q) && !name.includes(q) && !loc.includes(q) && !cust.includes(q) && !phone.includes(q)) return false;
    }

    return true;
  });

  const getCategoryIcon = (b, optName = '') => {
    const item = (typeof b === 'object' && b !== null) ? b : { package_type: b, type: b, item_name: optName };
    if (isCraftCategory(item)) return <Compass size={15} className="text-warning" />;
    if (isFlightCategory(item)) return <Plane size={15} className="text-info" />;
    if (isHotelCategory(item)) return <Hotel size={15} className="text-success" />;
    if (isSightseeingCategory(item)) return <MapPin size={15} className="text-warning" />;
    if (isActivityCategory(item)) return <MapPin size={15} className="text-danger" />;
    if (isBikesCategory(item)) return <Car size={15} className="text-info" />;
    if (isTripPackageCategory(item)) return <Package size={15} className="text-primary" />;
    if (isCarsCategory(item)) return <Car size={15} className="text-primary" />;
    if (isSelfDriveHolidayCategory(item)) return <Compass size={15} className="text-warning" />;
    return <Package size={15} className="text-secondary" />;
  };

  const getCategoryTitle = (b) => {
    if (!b) return 'Booking';
    if (isCraftCategory(b)) return 'Craft My Trip';
    if (isFlightCategory(b)) return 'Flight';
    if (isHotelCategory(b)) return 'Hotel';
    if (isSightseeingCategory(b)) return 'Sightseeing';
    if (isActivityCategory(b)) return 'Activities';
    if (isBikesCategory(b)) return 'Bikes';
    if (isTripPackageCategory(b)) return 'Trip Package';
    if (isCarsCategory(b)) return 'Cars';
    if (isSelfDriveHolidayCategory(b)) return 'Self Drive Holiday';
    return b.package_type || b.type || 'Booking';
  };

  const getCategoryBadge = (b) => {
    if (!b) return 'Booking';
    if (isCraftCategory(b)) return '✨ Craft My Trip';
    if (isFlightCategory(b)) return '✈️ Flight';
    if (isHotelCategory(b)) return '🏨 Hotel';
    if (isSightseeingCategory(b)) return '🏛️ Sightseeing';
    if (isActivityCategory(b)) return '🎯 Activities';
    if (isBikesCategory(b)) return '🏍️ Bikes';
    if (isTripPackageCategory(b)) return '🌴 Trip Package';
    if (isCarsCategory(b)) return '🚗 Cars';
    if (isSelfDriveHolidayCategory(b)) return '⭐ Self Drive Holiday';
    return `📄 ${b.package_type || b.type || 'Booking'}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'completed') return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Completed</span>;
    if (s === 'confirmed') return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Confirmed</span>;
    if (s === 'upcoming') return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Upcoming</span>;
    if (s === 'ongoing') return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Ongoing</span>;
    if (s === 'cancelled') return <span className="badge bg-danger bg-danger-subtle text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Cancelled</span>;
    if (s === 'rejected') return <span className="badge bg-danger bg-danger-subtle text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Rejected</span>;
    if (s.includes('review')) return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Under Review</span>;
    return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Pending Confirmation</span>;
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header & Controls ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            My Booking History
          </h4>
          <p className="text-muted text-xs mb-0">
            View all confirmed, upcoming, and past trip reservations across WOW GOA.
          </p>
        </div>

        {/* Search Bar */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: '260px' }}>
            <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input 
              type="text" 
              className="form-control form-control-sm ps-5 rounded-pill border"
              placeholder="Search by ID, hotel, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Category Filter Pills — Exact 9 items in mandated order */}
          <div className="d-flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All Bookings (${countByType.all})` },
              { id: 'selfdrive', label: `⭐ Self Drive Holiday (${countByType.selfdrive})` },
              { id: 'cars', label: `🚗 Cars (${countByType.cars})` },
              { id: 'bikes', label: `🏍️ Bikes (${countByType.bikes})` },
              { id: 'package', label: `🌴 Trip Package (${countByType.package})` },
              { id: 'sightseeing_activities', label: `🎯 Sightseeing & Activities (${countByType.sightseeing + countByType.activities})` },
              { id: 'hotel', label: `🏨 Hotel (${countByType.hotel})` },
              { id: 'flight', label: `✈️ Flight (${countByType.flight})` },
              { id: 'craftmytrip', label: `✨ Craft My Trip (${countByType.craftmytrip})` },
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-xs transition-all text-nowrap flex-shrink-0 ${
                  categoryFilter === cat.id ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary border'
                }`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="d-flex align-items-center gap-2 text-xs">
            <span className="text-muted fw-bold">Status:</span>
            <select 
              className="form-select form-select-sm rounded-pill border text-xs" 
              style={{ width: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Sightseeing & Activities Sub-Options: Exactly 2 options */}
        {categoryFilter === 'sightseeing_activities' && (
          <div className="d-flex align-items-center gap-2 mt-3 pt-2.5 border-top animate-fade-in">
            <span className="text-muted text-xs fw-bold me-1">Category Options:</span>
            <button
              type="button"
              onClick={() => setSightseeingSubFilter('sightseeing')}
              className={`btn btn-sm px-3 py-1 rounded-pill fw-bold text-xs transition-all ${
                sightseeingSubFilter === 'sightseeing'
                  ? 'btn-warning text-dark shadow-xs'
                  : 'btn-light text-secondary border'
              }`}
            >
              🏛️ Sightseeing ({countByType.sightseeing})
            </button>
            <button
              type="button"
              onClick={() => setSightseeingSubFilter('activities')}
              className={`btn btn-sm px-3 py-1 rounded-pill fw-bold text-xs transition-all ${
                sightseeingSubFilter === 'activities'
                  ? 'btn-warning text-dark shadow-xs'
                  : 'btn-light text-secondary border'
              }`}
            >
              🎯 Activities ({countByType.activities})
            </button>
          </div>
        )}
      </div>

      {/* ─── Responsive Bookings Grid / Cards for Mobile & Desktop ─── */}
      <div className="row g-3 mb-4 d-md-none">
        {filteredBookings.map((b, idx) => {
          const totalAmt = parseFloat(b.total_amount || b.amount || 0);
          const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
          const pendingAmt = parseFloat(b.pending_amount || (totalAmt > paidAmt ? totalAmt - paidAmt : 0));
          const isPaid = paidAmt >= totalAmt && totalAmt > 0;

          return (
            <div key={b.id || idx} className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-dark border text-xxs px-2 py-1 rounded fw-bold text-uppercase">
                      {getCategoryTitle(b)}
                    </span>
                    <span className="fw-black text-dark text-xs font-heading">#{b.id || b.booking_id || `WG-${1000 + idx}`}</span>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <h6 className="fw-black text-dark mb-1 font-heading">
                  {b.package_name || b.item_name || b.hotel_name || b.vehicle_name || 'WOW GOA Booking'}
                </h6>

                <div className="text-muted text-xs mb-2">
                  📍 {b.pickup_location || b.pickup || b.hotel_location || 'Goa'} {b.pickup_time ? `• ${b.pickup_time}` : ''}
                </div>

                {isTripPackageItem(b) && (
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    <span className="badge bg-light text-dark border text-xxs">🏨 {b.hotel_name || 'Resort Stay Included'}</span>
                    <span className="badge bg-light text-dark border text-xxs">🚗 {b.vehicle_name || 'Vehicle'} • {b.driver_service_type || 'Chauffeur'}</span>
                    <span className="badge bg-light text-dark border text-xxs">🏛️ Sightseeing &amp; Activities</span>
                  </div>
                )}

                <div className="p-2.5 bg-light rounded-3 text-xs mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Travel Dates:</span>
                    <span className="fw-bold text-dark">{formatDateShort(b.pickup_date || b.travel_date)}{b.drop_date ? ` to ${formatDateShort(b.drop_date)}` : ''}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Total Fare:</span>
                    <span className="fw-black text-dark">₹{totalAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment Status:</span>
                    <span className={`fw-bold ${isPaid ? 'text-success' : 'text-warning'}`}>{isPaid ? 'Paid Full' : `Partially Paid (Pending: ₹${pendingAmt.toLocaleString('en-IN')})`}</span>
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => {
                      if (onOpenBookingDetails && typeof onOpenBookingDetails === 'function') {
                        onOpenBookingDetails(b);
                      } else {
                        setSelectedVoucherBooking(b);
                      }
                    }}
                    className="btn btn-sm btn-dark text-white fw-bold rounded-pill py-2 w-100 text-xs d-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                    title="View & Print Booking Voucher"
                  >
                    <Eye size={14} />
                    <span>View & Print Voucher</span>
                  </button>
                  {canCancel(b) && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="btn btn-sm btn-outline-danger fw-bold rounded-pill py-2 w-100 text-xs d-flex align-items-center justify-content-center gap-1.5 shadow-xs mt-1.5"
                      title="Cancel Booking"
                    >
                      <XCircle size={14} />
                      <span>Cancel Booking</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Desktop Bookings Table ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white d-none d-md-block" style={{ border: '1px solid #eef2f6' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Booking ID</th>
                <th>Service Details</th>
                <th>Type</th>
                <th>Travel Dates</th>
                <th>Total Fare</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, idx) => {
                const totalAmt = parseFloat(b.total_amount || b.amount || 0);
                const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
                const isPaid = paidAmt >= totalAmt && totalAmt > 0;

                return (
                  <tr key={b.id || idx}>
                    <td className="ps-4 fw-black text-dark font-heading">
                      #{b.id || b.booking_id || `WOW-${1000 + idx}`}
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded bg-light border flex-shrink-0">
                          {getCategoryIcon(b)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{b.package_name || b.item_name || b.hotel_name || b.vehicle_name || 'Goa Booking'}</div>
                          <div className="text-muted text-xxs">📍 {b.pickup_location || b.pickup || b.hotel_location || 'Goa'} {b.pickup_time ? `• ${b.pickup_time}` : ''}</div>
                          {isTripPackageItem(b) && (
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              <span className="badge bg-light text-dark border" style={{ fontSize: '9px' }}>🏨 {b.hotel_name || 'Resort Stay'}</span>
                              <span className="badge bg-light text-dark border" style={{ fontSize: '9px' }}>🚗 {b.vehicle_name || 'Swift'} • {b.driver_service_type || 'Chauffeur'}</span>
                              <span className="badge bg-light text-dark border" style={{ fontSize: '9px' }}>🏛️ Sightseeing &amp; Cruise</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1 rounded text-xxs fw-bold text-uppercase">
                        {getCategoryTitle(b)}
                      </span>
                    </td>

                    <td className="text-xs">
                      <div className="fw-bold text-dark">{formatDateShort(b.pickup_date || b.travel_date)}</div>
                      {b.drop_date && <div className="text-muted text-xxs">to {formatDateShort(b.drop_date)}</div>}
                    </td>

                    <td className="fw-black text-dark">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </td>

                    <td>
                      {isPaid ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded text-xxs fw-bold">
                          Paid Full
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-0.5 rounded text-xxs fw-bold">
                          Partially Paid
                        </span>
                      )}
                    </td>

                    <td>
                      {getStatusBadge(b.status)}
                    </td>

                    <td className="text-end pe-4">
                      <button 
                        onClick={() => {
                          if (onOpenBookingDetails && typeof onOpenBookingDetails === 'function') {
                            onOpenBookingDetails(b);
                          } else {
                            setSelectedVoucherBooking(b);
                          }
                        }}
                        className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-3 py-1 text-xs d-inline-flex align-items-center gap-1.5 shadow-xs"
                        title="View & Print Booking Voucher"
                      >
                        <Eye size={13} />
                        <span>View Voucher</span>
                      </button>
                      {canCancel(b) && (
                        <button
                          onClick={() => setCancellingBooking(b)}
                          className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-2.5 py-1 text-xs d-inline-flex align-items-center gap-1 shadow-xs ms-1.5"
                          title="Cancel Booking"
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    {categoryFilter === 'hotel' ? (
                      <>
                        <Hotel size={40} className="mb-2 text-success opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Hotel Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">You haven't reserved any hotel stays or resort accommodations yet.</p>
                        <a href="/#hotels" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Goa Hotels & Resorts →
                        </a>
                      </>
                    ) : categoryFilter === 'flight' ? (
                      <>
                        <Plane size={40} className="mb-2 text-info opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Flight Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">Search direct and connecting flights to and from Goa Airport.</p>
                        <a href="/#flights" className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Search Flights →
                        </a>
                      </>
                    ) : categoryFilter === 'cars' ? (
                      <>
                        <Car size={40} className="mb-2 text-primary opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Car Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">You haven't booked any car reservations with driver service yet.</p>
                        <a href="/#self-drive-categories" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Cars →
                        </a>
                      </>
                    ) : categoryFilter === 'bikes' ? (
                      <>
                        <Car size={40} className="mb-2 text-info opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Bike Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">You haven't booked any bike rentals yet.</p>
                        <a href="/#self-drive-categories" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Bikes →
                        </a>
                      </>
                    ) : categoryFilter === 'package' ? (
                      <>
                        <Package size={40} className="mb-2 text-primary opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Trip Package Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">Discover curated North & South Goa holiday packages with stays and excursions.</p>
                        <a href="/#packages" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Trip Packages →
                        </a>
                      </>
                    ) : categoryFilter === 'sightseeing_activities' ? (
                      <>
                        <MapPin size={40} className="mb-2 text-danger opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">
                          {sightseeingSubFilter === 'sightseeing' ? 'No Sightseeing Bookings Found' : 'No Activity Bookings Found'}
                        </h5>
                        <p className="text-muted text-xs mb-3">
                          {sightseeingSubFilter === 'sightseeing'
                            ? 'Explore curated North & South Goa heritage and beach sightseeing excursions.'
                            : 'Explore scuba diving, water sports, boat cruises, and thrilling activities in Goa.'}
                        </p>
                        <a href="/#activities" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore {sightseeingSubFilter === 'sightseeing' ? 'Sightseeing' : 'Activities'} →
                        </a>
                      </>
                    ) : categoryFilter === 'craftmytrip' ? (
                      <>
                        <Compass size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Custom Trips Found</h5>
                        <p className="text-muted text-xs mb-3">Craft your own Goa holiday package customized with your choice of vehicle, hotel, and flights.</p>
                        <a href="/#craft-my-trip" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Craft Your Own Trip →
                        </a>
                      </>
                    ) : categoryFilter === 'selfdrive' ? (
                      <>
                        <Compass size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Self Drive Holidays Found</h5>
                        <p className="text-muted text-xs mb-3">Book premium Self Drive vehicles and packages with unlimited KMs and resort stays.</p>
                        <a href="/#self-drive-categories" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Book a Self Drive Holiday →
                        </a>
                      </>
                    ) : (
                      <>
                        <Calendar size={40} className="mb-2 text-muted opacity-50" />
                        <h5 className="fw-bold text-dark mb-1">No Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">No reservations matched your current filter criteria.</p>
                        <button 
                          onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                          className="btn btn-sm btn-outline-dark rounded-pill px-4 py-1.5 fw-bold"
                        >
                          Reset All Filters
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Professional Corporate A4 Booking Voucher Modal ─── */}
      {selectedVoucherBooking && (
        <BookingVoucher
          booking={selectedVoucherBooking}
          customerUser={currentUser}
          currentUser={currentUser}
          onClose={() => setSelectedVoucherBooking(null)}
          isModal={true}
        />
      )}

      {/* ─── Customer Cancellation Modal ─── */}
      {cancellingBooking && (
        <CustomerCancellationModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onCancelled={() => {
            setCancellingBooking(null);
            if (typeof window !== 'undefined') window.location.reload();
          }}
        />
      )}

    </div>
  );
}
