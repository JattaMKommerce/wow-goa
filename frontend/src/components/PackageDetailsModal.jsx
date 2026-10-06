import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Compass, Info, Plane, Utensils, Shield, 
  Sparkles, Calendar, ChevronRight, Image as ImageIcon,
  Check, FileText, PhoneCall, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Users
} from 'lucide-react';
import ImageCarousel from './common/ImageCarousel';
import { getTodayDateStr, addDays, formatDisplayDate } from '../utils/dateUtils';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

export default function PackageDetailsModal({ pkg, isOpen, onClose, onBook }) {
  if (!isOpen || !pkg) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'itinerary', 'hotel_vehicle', 'inclusions', 'policies'
  const [expandedDay, setExpandedDay] = useState(0); // for accordion

  const price = parseFloat(pkg.price) || 0;
  const coverImg = pkg.imageUrl || pkg.image || pkg.image_url || pkg.cover_image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80';

  // Strictly relevant contextual fallbacks based on package theme
  const getThemeFallbacks = () => {
    const pkgName = (pkg.name || pkg.package_name || '').toLowerCase();
    const pkgDesc = (pkg.description || '').toLowerCase();
    const pkgTag = (pkg.tag || '').toLowerCase();

    // 1. Romantic Sunset / Honeymoon Escapes
    if (pkgName.includes('romantic') || pkgName.includes('honeymoon') || pkgTag.includes('honeymoon') || pkgDesc.includes('candlelight')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', // Candlelight Beachside Dinner
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80', // Luxury Honeymoon Ocean Suite
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80', // Convertible Car Drive
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'  // Sunset Mandovi Cruise
      ];
    }

    // 2. Bike & Backpack / Adventure Trail
    if (pkgName.includes('bike') || pkgName.includes('backpack') || pkgName.includes('adventure') || pkgTag.includes('adventure')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80', // Royal Enfield Classic 350
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80', // Fontainhas Latin Quarter
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80', // Cidade de Goa Stay
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'  // Fort Aguada Coastal View
      ];
    }

    // 3. Self Drive & Coastal Explorer Packages
    if (pkgName.includes('explorer') || pkgName.includes('self drive') || pkgName.includes('hopper') || (pkg.package_type || '').includes('Self Drive')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', // Mahindra Thar 4x4
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80', // Candolim Beach Resort
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80', // Coastal Palms & Shacks
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'  // Watersports & Mandovi View
      ];
    }

    // 4. Ultimate Goa Luxury & Complete Experience
    return [
      coverImg,
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80', // 5-Star JW Marriott Resort & Pool
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', // Mahindra Thar 4x4
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80', // Mandovi Sunset Yacht Cruise
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'  // Goa Beach Sun-kissed Coast
    ];
  };

  // Dynamic gallery image mapping from package object
  let rawGallery = [];
  if (Array.isArray(pkg.images) && pkg.images.length > 0) {
    rawGallery = pkg.images;
  } else if (Array.isArray(pkg.gallery) && pkg.gallery.length > 0) {
    rawGallery = pkg.gallery;
  } else if (pkg.images_json) {
    try {
      const parsed = typeof pkg.images_json === 'string' ? JSON.parse(pkg.images_json) : pkg.images_json;
      if (Array.isArray(parsed) && parsed.length > 0) rawGallery = parsed;
    } catch (e) {}
  }

  if (rawGallery.length === 0) {
    rawGallery = getThemeFallbacks();
  }

  // Ensure coverImg is first and deduplicate
  const galleryImages = [
    coverImg,
    ...rawGallery.filter(img => img && img !== coverImg)
  ].slice(0, 5);

  const [selectedPhoto, setSelectedPhoto] = useState(coverImg);

  // Sync selected photo and active tab on package change
  useEffect(() => {
    setSelectedPhoto(coverImg);
    setActiveTab('overview');
  }, [pkg?.id, coverImg]);

  // Maximum duration allowed from master package definition
  const getPackageMaxNights = () => {
    let maxN = 0;
    const rawItinerary = pkg.day_wise_itinerary || pkg.itinerary || pkg.day_plan || pkg.dayPlan || pkg.dayWiseItinerary;
    if (rawItinerary) {
      try {
        const parsed = typeof rawItinerary === 'string' ? JSON.parse(rawItinerary) : rawItinerary;
        if (Array.isArray(parsed) && parsed.length > 0) {
          maxN = Math.max(1, parsed.length - 1);
        }
      } catch (e) {}
    }
    if (maxN === 0 && pkg.duration_nights) {
      maxN = parseInt(pkg.duration_nights, 10);
    }
    if (maxN === 0 && pkg.duration) {
       const nMatch = String(pkg.duration).match(/(\d+)\s*Nights?/i);
       if (nMatch) maxN = parseInt(nMatch[1]);
       else {
           const dMatch = String(pkg.duration).match(/(\d+)\s*Days?/i);
           if (dMatch) maxN = Math.max(1, parseInt(dMatch[1]) - 1);
           else {
             const shortMatch = String(pkg.duration).match(/(\d+)\s*N/i);
             if (shortMatch) maxN = parseInt(shortMatch[1]);
           }
       }
    }
    return maxN || 3;
  };

  const packageMaxNights = getPackageMaxNights();

  // Authoritative Customer Selected Dates
  const initialDep = pkg.pickupDate || pkg.departureDate || pkg.pickup_date || getTodayDateStr();
  const initialRet = pkg.returnDate || pkg.dropDate || pkg.drop_date || addDays(initialDep, packageMaxNights);
  const [departureDate, setDepartureDate] = useState(initialDep);
  const [returnDate, setReturnDate] = useState(initialRet);

  // Sync departure and return dates if pkg changes
  useEffect(() => {
    if (pkg?.pickupDate || pkg?.departureDate) {
      const newDep = pkg.pickupDate || pkg.departureDate;
      setDepartureDate(newDep);
      const newRet = pkg.returnDate || pkg.dropDate || addDays(newDep, packageMaxNights);
      setReturnDate(newRet);
    }
  }, [pkg?.id, pkg?.pickupDate, pkg?.departureDate, pkg?.returnDate, pkg?.dropDate, packageMaxNights]);

  // Authoritative nights & days derived strictly from customer-selected dates
  const nights = useMemo(() => {
    if (!departureDate || !returnDate) return 0;
    const diff = Math.round((new Date(returnDate) - new Date(departureDate)) / 86400000);
    const calculated = Math.max(0, diff);
    return Math.min(calculated, packageMaxNights);
  }, [departureDate, returnDate, packageMaxNights]);

  const days = nights + 1;

  // Preserve duration when start date changes, safely clamping within max allowed
  const handleDepartureDateChange = (newStart) => {
    if (!newStart) return;
    const currentSelectedNights = nights;
    setDepartureDate(newStart);
    const maxEnd = addDays(newStart, packageMaxNights);
    let targetEnd = addDays(newStart, currentSelectedNights);
    if (targetEnd > maxEnd) targetEnd = maxEnd;
    if (targetEnd < newStart) targetEnd = newStart;
    setReturnDate(targetEnd);
  };

  const handleReturnDateChange = (newEnd) => {
    if (!newEnd) return;
    const minEnd = departureDate;
    const maxEnd = addDays(departureDate, packageMaxNights);
    if (newEnd < minEnd) setReturnDate(minEnd);
    else if (newEnd > maxEnd) setReturnDate(maxEnd);
    else setReturnDate(newEnd);
  };

  // Itinerary parsing with full fallbacks
  let itinerary = [];
  const rawItinerary = pkg.day_wise_itinerary || pkg.itinerary || pkg.day_plan || pkg.dayPlan || pkg.dayWiseItinerary;
  if (rawItinerary) {
    try {
      itinerary = typeof rawItinerary === 'string' 
        ? JSON.parse(rawItinerary) 
        : rawItinerary;
    } catch (e) {
      itinerary = [];
    }
  }

  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    const destName = pkg.destination || 'Goa';
    const hotelName = pkg.hotel_included || 'Luxury Beach Resort';
    const carName = pkg.car_included || 'Dedicated Vehicle / Self-Drive';
    const places = (pkg.places_included || 'Calangute, Baga, Fort Aguada, Panaji Latin Quarter, Vagator, Miramar').split(',').map(s => s.trim()).filter(Boolean);

    itinerary = [
      {
        day: 1,
        title: `Day 1: Arrival in ${destName}, Private Airport Transfer & Hotel Check-in`,
        description: `Warm greeting by your private chauffeur at ${destName} Airport / Railway Station. Enjoy a scenic drive to ${hotelName}, welcome drinks on arrival, and evening beach relaxation.`,
        inclusions: ['Airport Pickup', 'Welcome Drink', 'Resort Check-in', 'Buffet Dinner']
      },
      {
        day: 2,
        title: `Day 2: North ${destName} Coastal Explorer & Thrilling Water Sports`,
        description: `Head out in your dedicated vehicle to ${places[0] || 'Calangute'} and ${places[1] || 'Baga'} beaches. Explore historic Fort Aguada lighthouse with sweeping sea views and partake in exciting water sports.`,
        inclusions: ['Breakfast', carName, 'Fort Aguada Pass', 'Water Sports']
      },
      {
        day: 3,
        title: `Day 3: South ${destName} Heritage Trail, Latin Quarter & Sunset River Cruise`,
        description: `Discover the colorful Portuguese villas of Fontainhas in Panaji, visit ancient Basilica of Bom Jesus, and embark on a mesmerizing 1-hour Mandovi River sunset cruise with Goan cultural dance.`,
        inclusions: ['Breakfast', 'Heritage Guide', 'Sunset Cruise Ticket', 'Buffet Dinner']
      },
      {
        day: days,
        title: `Day ${days}: Leisure Morning & Departure Transfer`,
        description: `Savor a leisurely breakfast by the pool. Enjoy last-minute shopping at local flea markets before your private drop-off at ${destName} Airport or Railway Station with unforgettable memories.`,
        inclusions: ['Breakfast', 'Airport Drop Transfer']
      }
    ];
  }

  // Inclusions parsing
  let inclusions = [];
  try {
    inclusions = typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : (pkg.inclusions || []);
    if (!Array.isArray(inclusions)) inclusions = [];
  } catch (e) { inclusions = []; }
  
  if (inclusions.length === 0) {
    inclusions = [
      `Stay for ${nights} Nights / ${days} Days in ${pkg.hotel_included || '5-Star Beach Resort'}`,
      `Dedicated Vehicle: ${pkg.car_included || 'Mahindra Thar 4x4 / Self-Drive Cab'}`,
      pkg.food_included || 'Daily Buffet Breakfast & Gourmet Dinners',
      pkg.pickup_drop_included || 'Airport / Railway Station Pickup & Drop Included',
      'All Sightseeing Tours as per detailed Itinerary',
      'Mandovi River Sunset Cruise Tickets Included',
      'All Tolls, Parking Charges, and Fuel Included',
      '24x7 Dedicated Local Tour Assistant'
    ];
  }

  const exclusions = [
    'Airfare / Train tickets (unless Flight Option is selected)',
    'Personal expenses like laundry, room service, telephone calls',
    'Entry tickets to nightclubs and special watersport adventures',
    'Early check-in and late check-out subject to availability'
  ];

  // Places parsing
  const placesList = pkg.places_included 
    ? pkg.places_included.split(',').map(p => p.trim())
    : ['Calangute Beach', 'Baga Beach', 'Fort Aguada', 'Panaji Latin Quarter', 'Vagator Beach', 'Miramar'];

  // Specific Hotel & Vehicle Image resolution
  const getHotelPhoto = () => {
    // Hotel Image Priority:
    // 1. pkg.hotel?.image
    // 2. pkg.hotel?.custom_data?.image
    // 3. existing valid package-specific image if actually stored
    // 4. safe existing no-image placeholder
    return pkg.hotel?.image ||
           pkg.hotel?.custom_data?.image ||
           pkg.imageUrl ||
           pkg.image ||
           pkg.image_url ||
           'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  };

  const getVehiclePhoto = () => {
    // Vehicle Image Priority:
    // 1. pkg.vehicle?.image
    // 2. pkg.vehicle?.custom_data?.image
    // 3. existing valid package-specific image if actually stored
    // 4. safe existing no-image placeholder
    return pkg.vehicle?.image ||
           pkg.vehicle?.custom_data?.image ||
           pkg.imageUrl ||
           pkg.image ||
           pkg.image_url ||
           'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
  };

  // Background scroll lock lifecycle
  useEffect(() => {
    if (isOpen) {
      lockScroll('package-details-modal');
      return () => {
        unlockScroll('package-details-modal');
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBookClick = () => {
    onClose();
    onBook({
      ...pkg,
      departureDate,
      returnDate,
      pickupDate: departureDate,
      dropDate: returnDate,
      pickup_date: departureDate,
      drop_date: returnDate,
      duration: `${nights} Nights / ${days} Days`,
      duration_nights: nights,
      duration_days: days,
      package_max_nights: packageMaxNights
    });
  };

  return createPortal(
    <div 
      className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        padding: '20px',
        overscrollBehavior: 'contain',
        touchAction: 'none'
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content-custom bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light">
          <div className="d-flex align-items-center gap-2">
            <span className="p-1.5 bg-primary bg-opacity-10 text-primary rounded-2">
              <Compass size={18} />
            </span>
            <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{pkg.name || pkg.package_name}</h5>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-muted"
            style={{ width: '36px', height: '36px', transition: 'all 0.2s' }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto" data-scrollable="true" style={{ flexGrow: 1, overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
          
          {/* ─── IMAGE CAROUSEL & TOP INFO ────────────────────────────────────────── */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-7">
              <ImageCarousel 
                images={galleryImages} 
                alt={pkg.name || pkg.package_name} 
                height="340px" 
                rounded="14px"
              />
            </div>
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill mb-2" style={{ fontSize: '0.72rem' }}>
                  {pkg.tag || 'Special Holiday Deal'}
                </span>
                <h4 className="fw-bold mb-2 text-dark" style={{ fontSize: '1.25rem' }}>{pkg.name || pkg.package_name}</h4>
                <div className="d-flex flex-wrap gap-2 align-items-center small text-muted mb-2">
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <Clock size={13} className="text-primary" /> {nights} Nights / {days} Days
                  </span>
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <MapPin size={13} className="text-danger" /> {pkg.destinations || pkg.location || 'Goa, India'}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="d-flex text-warning">
                    {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                  </div>
                  <span className="fw-bold text-dark small">4.9</span>
                  <span className="text-muted small">(142 Reviews)</span>
                </div>
                <p className="text-secondary small lh-base mb-3" style={{ fontSize: '0.85rem' }}>
                  {pkg.description || `Experience the ultimate Goan vacation with our ${nights} Nights / ${days} Days curated package.`}
                </p>
              </div>

              {/* ─── DATE SELECTION & DURATION ─────────── */}
              <div className="p-3 bg-light rounded-3 border mb-2" style={{ backgroundColor: '#f8fafc' }}>
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-primary" /> Trip Dates &amp; Duration
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                    {nights}N / {days}D (Max: {packageMaxNights}N)
                  </span>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold mb-1" style={{ fontSize: '0.72rem' }}>
                      Start / Departure Date:
                    </label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm fw-bold border bg-white" 
                      min={getTodayDateStr()} 
                      value={departureDate} 
                      onChange={(e) => handleDepartureDateChange(e.target.value)} 
                      style={{ fontSize: '0.82rem', borderRadius: '8px' }}
                    />
                    <span className="text-muted text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                      {formatDisplayDate(departureDate)}
                    </span>
                  </div>

                  <div className="col-6">
                    <label className="form-label text-muted small fw-bold mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '0.72rem' }}>
                      <span>End / Check-Out:</span>
                      <span className="badge bg-info bg-opacity-10 text-info p-0" style={{ fontSize: '9px' }}>Customizable</span>
                    </label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm fw-bold border bg-white" 
                      min={departureDate}
                      max={addDays(departureDate, packageMaxNights)}
                      value={returnDate} 
                      onChange={(e) => handleReturnDateChange(e.target.value)} 
                      style={{ fontSize: '0.82rem', borderRadius: '8px' }}
                    />
                    <span className="text-success fw-semibold text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                      {formatDisplayDate(returnDate)} ({nights}N / {days}D)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-3 border">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Package Price / person</div>
                    <div className="fw-black text-primary fs-4" style={{ color: '#FF6333' }}>₹{price.toLocaleString('en-IN')}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleBookClick} 
                    className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '0.85rem' }}
                  >
                    <span>Proceed to Book</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── NAVIGATION TABS ─────────────────────────────────────────────── */}
          <div className="d-flex border-bottom mb-4 gap-2 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview & Highlights', icon: <Sparkles size={14} /> },
              { id: 'itinerary', label: 'Day-Wise Itinerary', icon: <Calendar size={14} /> },
              { id: 'hotel_vehicle', label: 'Hotel & Vehicle', icon: <Hotel size={14} /> },
              { id: 'inclusions', label: 'Inclusions & Exclusions', icon: <CheckCircle size={14} /> },
              { id: 'policies', label: 'Policies & Support', icon: <Shield size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill fw-bold"
                style={{
                  fontSize: '0.8rem',
                  background: activeTab === tab.id ? '#0D1B2E' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#64748b',
                  border: activeTab === tab.id ? '1px solid #0D1B2E' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ─── TAB CONTENTS ─────────────────────────────────────────────────── */}
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">Package Description</h6>
                <p className="text-secondary lh-lg mb-3" style={{ fontSize: '0.88rem' }}>
                  {pkg.description || `Experience the ultimate Goan vacation with our ${nights} Nights / ${days} Days package. Relax in premier beachside resorts, explore scenic North and South Goa attractions in a dedicated vehicle, and indulge in gourmet Goan cuisine with daily breakfast and dinner.`}
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Clock size={20} className="text-primary mb-1" />
                    <div className="text-muted small">Duration</div>
                    <div className="fw-bold text-dark">{nights}N / {days}D</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Hotel size={20} className="text-primary mb-1" />
                    <div className="text-muted small">Hotel Stay</div>
                    <div className="fw-bold text-dark">{pkg.hotel_included || '5-Star Resort'}</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Car size={20} className="text-success mb-1" />
                    <div className="text-muted small">Vehicle Included</div>
                    <div className="fw-bold text-dark">{pkg.car_included || 'Thar 4x4 / Cab'}</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Utensils size={20} className="text-warning mb-1" />
                    <div className="text-muted small">Meal Plan</div>
                    <div className="fw-bold text-dark">{pkg.hotel?.meal_plan || pkg.food_included || 'Breakfast Included'}</div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold text-dark mb-2.5">Key Attractions & Places Visited</h6>
                <div className="d-flex flex-wrap gap-2">
                  {placesList.map((place, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.76rem' }}>
                      📍 {place}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITINERARY */}
          {activeTab === 'itinerary' && (
            <div className="animate-fade-in d-flex flex-column gap-3">
              {activeItinerary.map((day, idx) => {
                const isExp = expandedDay === idx;
                return (
                  <div key={idx} className="border rounded-3 overflow-hidden bg-white shadow-sm">
                    <div 
                      className="p-3 d-flex align-items-center justify-content-between cursor-pointer"
                      style={{ background: isExp ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}
                      onClick={() => setExpandedDay(isExp ? -1 : idx)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', background: isExp ? '#FF6333' : '#0D1B2E', color: '#fff', fontSize: '0.75rem' }}>
                          {idx + 1}
                        </span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{day.title || `Day ${idx + 1}`}</span>
                      </div>
                      {isExp ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>

                    {isExp && (
                      <div className="p-3 border-top bg-light" style={{ fontSize: '0.84rem' }}>
                        {/* Day Image */}
                        {day.image && (
                          <div className="mb-2.5 rounded-3 overflow-hidden shadow-xs" style={{ maxHeight: '180px' }}>
                            <img 
                              src={day.image} 
                              alt={day.title || `Day ${idx + 1}`} 
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        {day.description && <p className="text-muted lh-base mb-2.5">{day.description}</p>}

                        {/* Stay & Meals Info */}
                        {(day.stay || day.meals) && (
                          <div className="d-flex flex-wrap align-items-center gap-3 my-2 p-2 bg-white rounded border">
                            {day.stay && (
                              <div className="d-flex align-items-center gap-1.5 text-dark small">
                                <Hotel size={14} className="text-primary flex-shrink-0" />
                                <span><strong>Stay:</strong> {day.stay}</span>
                              </div>
                            )}
                            {day.meals && (
                              <div className="d-flex align-items-center gap-1.5 text-dark small">
                                <Utensils size={14} className="text-warning flex-shrink-0" />
                                <span><strong>Meals:</strong> {Array.isArray(day.meals) ? day.meals.join(', ') : day.meals}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Structured Day Timeslots & Activities */}
                        {(day.morning || day.afternoon || day.evening || day.night || day.activities) && (
                          <div className="d-flex flex-column gap-2 my-2.5">
                            {day.morning && (
                              <div className="p-2 bg-white rounded border-start border-3 border-warning shadow-xs">
                                <span className="badge bg-warning text-dark fw-bold me-1.5" style={{ fontSize: '9px' }}>MORNING</span>
                                <span className="text-dark small">{day.morning}</span>
                              </div>
                            )}
                            {day.afternoon && (
                              <div className="p-2 bg-white rounded border-start border-3 border-primary shadow-xs">
                                <span className="badge bg-primary text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>AFTERNOON</span>
                                <span className="text-dark small">{day.afternoon}</span>
                              </div>
                            )}
                            {day.evening && (
                              <div className="p-2 bg-white rounded border-start border-3 border-info shadow-xs">
                                <span className="badge bg-info text-dark fw-bold me-1.5" style={{ fontSize: '9px' }}>EVENING</span>
                                <span className="text-dark small">{day.evening}</span>
                              </div>
                            )}
                            {day.night && (
                              <div className="p-2 bg-white rounded border-start border-3 border-dark shadow-xs">
                                <span className="badge bg-dark text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>NIGHT</span>
                                <span className="text-dark small">{day.night}</span>
                              </div>
                            )}
                            {day.activities && (
                              <div className="p-2 bg-white rounded border-start border-3 border-success shadow-xs">
                                <span className="badge bg-success text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>ACTIVITIES</span>
                                <span className="text-dark small">{day.activities}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sightseeing Locations (supporting both string and array) */}
                        {(() => {
                          let places = [];
                          if (Array.isArray(day.sightseeing_locations) && day.sightseeing_locations.length > 0) {
                            places = day.sightseeing_locations.map(loc => (typeof loc === 'string' ? loc : loc.name || ''));
                          } else if (Array.isArray(day.sightseeing) && day.sightseeing.length > 0) {
                            places = day.sightseeing.map(loc => (typeof loc === 'string' ? loc : loc.name || ''));
                          } else if (typeof day.sightseeing === 'string' && day.sightseeing.trim()) {
                            places = day.sightseeing.split(/[,|]/).map(s => s.trim()).filter(Boolean);
                          }
                          if (places.length === 0) return null;
                          return (
                            <div className="d-flex flex-wrap gap-1.5 my-2">
                              {places.map((loc, i) => (
                                <span key={i} className="badge bg-white text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                  📍 {loc}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        {day.inclusions && day.inclusions.length > 0 && (
                          <div className="d-flex flex-wrap gap-1.5 mt-2">
                            {day.inclusions.map((inc, i) => (
                              <span key={i} className="badge bg-white text-secondary border px-2 py-1" style={{ fontSize: '0.68rem' }}>
                                ✓ {inc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: HOTEL, VEHICLE & DRIVER */}
          {activeTab === 'hotel_vehicle' && (
            <div className="animate-fade-in row g-3">
              {/* Hotel Card */}
              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="p-2 rounded-3 text-primary bg-primary bg-opacity-10"><Hotel size={20} /></div>
                    <div>
                      <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Accommodation</span>
                      <h6 className="fw-bold mb-0 text-dark">
                        {pkg.hotel?.category || pkg.hotel?.name || pkg.hotel_included || 'Included Resort Stay'}
                      </h6>
                      {pkg.hotel?.room_type && (
                        <span className="badge bg-light text-secondary border px-2 py-0.5 mt-0.5" style={{ fontSize: '0.68rem' }}>
                          Room: {pkg.hotel.room_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <img src={getHotelPhoto()} alt="Resort" className="w-100 rounded-3 mb-3 object-fit-cover" style={{ height: '140px' }} />
                  <ul className="list-unstyled small text-muted d-flex flex-column gap-1.5 mb-0" style={{ fontSize: '0.78rem' }}>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Sanitized, verified accommodation</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Daily buffet breakfast included</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Swimming pool, air conditioning & WiFi</li>
                  </ul>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="p-2 rounded-3 text-success bg-success bg-opacity-10"><Car size={20} /></div>
                    <div>
                      <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Transportation</span>
                      <h6 className="fw-bold mb-0 text-dark">
                        {pkg.vehicle?.name || pkg.car_included || 'Dedicated Tour Vehicle'}
                      </h6>
                      <span className="badge bg-light text-secondary border px-2 py-0.5 mt-0.5" style={{ fontSize: '0.68rem' }}>
                        {pkg.vehicle?.type === 'bike' ? 'Two Wheeler' : (pkg.driver_included ? 'Chauffeured Vehicle' : 'Self-Drive Vehicle')}
                      </span>
                    </div>
                  </div>
                  <img src={getVehiclePhoto()} alt="Vehicle" className="w-100 rounded-3 mb-3 object-fit-cover" style={{ height: '140px' }} />
                  <ul className="list-unstyled small text-muted d-flex flex-column gap-1.5 mb-0" style={{ fontSize: '0.78rem' }}>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Airport / Railway station transfer delivery</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Sanitized, verified and fully serviced</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Dedicated coverage for all itinerary sightseeing</li>
                  </ul>
                </div>
              </div>

              {/* Driver Service Card (When driver is configured) */}
              {pkg.driver_included ? (
                <div className="col-12">
                  <div className="p-3 rounded-4 border bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 rounded-3 text-warning bg-warning bg-opacity-10"><Users size={20} /></div>
                      <div>
                        <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Chauffeur Service</span>
                        <h6 className="fw-bold mb-0 text-dark">
                          Professional Dedicated Driver Included ({pkg.driver_type === 'pickup_drop' ? 'Airport / Station Transfers' : 'Full Day Sightseeing Chauffeur'})
                        </h6>
                      </div>
                    </div>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.80rem' }}>
                      Experienced, verified local driver assigned to your trip. Includes assistance with luggage, sightseeing route guidance, and prompt customer support.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Flight Card (When flight is included) */}
              {pkg.flights_included && (
                <div className="col-12">
                  <div className="p-3 rounded-4 border bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 rounded-3 text-info bg-info bg-opacity-10"><Plane size={20} /></div>
                      <div>
                        <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Air Travel</span>
                        <h6 className="fw-bold mb-0 text-dark">
                          Flight Included — {pkg.flights_included}
                        </h6>
                      </div>
                    </div>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.80rem' }}>
                      Domestic round-trip economy flights with baggage allowance. Customizable timing available during booking checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INCLUSIONS & EXCLUSIONS */}
          {activeTab === 'inclusions' && (
            <div className="animate-fade-in row g-4">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-1.5">
                  <CheckCircle size={16} /> What's Included
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.82rem' }}>
                  {inclusions.map((inc, i) => (
                    <li key={i} className="d-flex align-items-start gap-2 text-secondary">
                      <span className="text-success fw-bold">✓</span> {inc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-danger d-flex align-items-center gap-1.5">
                  <XCircle size={16} /> What's Not Included
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.82rem' }}>
                  {exclusions.map((exc, i) => (
                    <li key={i} className="d-flex align-items-start gap-2 text-muted">
                      <span className="text-danger fw-bold">✕</span> {exc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: POLICIES & CANCELLATION */}
          {activeTab === 'policies' && (
            <div className="animate-fade-in d-flex flex-column gap-3">
              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <RefreshCw size={15} className="text-primary" /> Flexible Cancellation Policy
                </h6>
                <p className="text-muted small mb-0">Cancel up to 48 hours prior to your scheduled trip date for a 100% full refund. No cancellation fees for weather or emergency flight schedule adjustments.</p>
              </div>

              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <Shield size={15} className="text-success" /> 100% Verified Experience Guarantee
                </h6>
                <p className="text-muted small mb-0">All accommodations are 100% verified 4-star and 5-star properties. All vehicles are sanitized, insured, and GPS-equipped with 24x7 roadside assistance.</p>
              </div>

              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <PhoneCall size={15} className="text-info" /> 24/7 Dedicated Concierge Support
                </h6>
                <p className="text-muted small mb-0">Our local Goa travel manager will be assigned to you via WhatsApp upon booking to coordinate seamless airport pickups, dinner reservations, and special requests.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer CTA */}
        <div className="px-4 py-3 bg-white border-top d-flex align-items-center justify-content-between sticky-bottom" style={{ zIndex: 10 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Total Package Rate</span>
              <span className="badge bg-light text-dark border d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                <Calendar size={12} className="text-primary" /> {formatDisplayDate(departureDate)} → {formatDisplayDate(returnDate)} ({nights}N/{days}D)
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-1.5">
              <h3 className="fw-bold text-dark mb-0" style={{ color: '#FF6333' }}>
                ₹{price.toLocaleString('en-IN')}
              </h3>
              <span className="text-muted small">/ per person</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-bold"
              style={{ fontSize: '0.85rem' }}
            >
              Close
            </button>
            <button 
              type="button" 
              onClick={handleBookClick} 
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', borderColor: '#FF6333', fontSize: '0.92rem' }}
            >
              <span>Book This Package</span>
              <span className="badge bg-white text-dark rounded-pill py-1 px-2 fw-bold" style={{ fontSize: '0.75rem' }}>{nights}N / {days}D</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
