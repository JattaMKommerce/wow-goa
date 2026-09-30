import React, { useState, useEffect } from 'react';
import { Building, Compass, Sparkles, Shield, Plus, Calendar, Settings, Plane, Hotel, Map as MapIcon, MapPin, X, MessageSquare, CreditCard, Box, MessageCircle, Search, Clock, Edit3, Trash2, Star, Eye, CheckCircle2 } from 'lucide-react';
import * as api from '../../services/api';
import AdminWalletSettlements from '../../components/admin/AdminWalletSettlements';
import AdminActivitiesManagement from './AdminActivitiesManagement';
import { getTodayDateStr, getNextDayDateStr, validateBookingDates } from '../../utils/dateUtils';
import AIChatbotToggle from '../../components/common/AIChatbotToggle';

const LocationSuggestions = ({ index, dayWiseItinerary, setDayWiseItinerary }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const handleEvent = (e) => {
      if (e.detail.index === index) {
        setSuggestions(e.detail.data);
      }
    };
    window.addEventListener('updateLocationSuggestions', handleEvent);
    return () => window.removeEventListener('updateLocationSuggestions', handleEvent);
  }, [index]);

  if (suggestions.length === 0) return null;

  return (
    <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {suggestions.map((s, i) => (
        <div 
          key={i} 
          className="p-2 border-bottom hover-bg-light cursor-pointer small text-dark"
          onClick={() => {
            const newItinerary = [...dayWiseItinerary];
            const currentLocs = newItinerary[index].sightseeing_locations || (newItinerary[index].location ? [{name: newItinerary[index].location, tips: newItinerary[index].tips}] : []);
            newItinerary[index].sightseeing_locations = [...currentLocs, { name: s.display_name.split(',')[0], map_query: s.display_name, tips: 'Coordinates: ' + s.lat + ',' + s.lon }];
            // clear legacy
            newItinerary[index].location = '';
            newItinerary[index].tips = '';
            setDayWiseItinerary(newItinerary);
            setSuggestions([]);
            document.getElementById(`search-loc-${index}`).value = '';
          }}
        >
          {s.display_name}
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard({
  vendors,
  allPackages,
  onAddVendor,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onUpdateVendor,
  onDeleteVendor,
  onSetVendorPassword,
  activeTab,
  currentUser,
  cars = [],
  bikes = [],
  hotels = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  
  // Register Vendor Fields
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorCity, setVendorCity] = useState('');
  const [vendorRole, setVendorRole] = useState('vendor');
  const [vendorMonthlyPlanPrice, setVendorMonthlyPlanPrice] = useState(0);
  const [vendorPassword, setVendorPassword] = useState('');
  const [vendorPasswordModal, setVendorPasswordModal] = useState({ isOpen: false, vendorId: null, password: '' });

  // Create Package Fields
  const [pkgName, setPkgName] = useState('');
  const [pkgType, setPkgType] = useState('Trip Package');
  const [pkgCurrency, setPkgCurrency] = useState('INR');
  const [pkgCostingType, setPkgCostingType] = useState('Service Wise Cost');
  const [pkgNights, setPkgNights] = useState(4);
  const [pkgPaxAdult, setPkgPaxAdult] = useState(2);
  const [pkgPaxChild, setPkgPaxChild] = useState(0);
  const [pkgPaxInfant, setPkgPaxInfant] = useState(0);
  const [pkgDestination, setPkgDestination] = useState('');
  
  const [pkgPrice, setPkgPrice] = useState('');
  const [withFlight, setWithFlight] = useState(false);
  const [pkgPriceWithFlight, setPkgPriceWithFlight] = useState('');
  const [pkgFlights, setPkgFlights] = useState('');
  const [pkgFood, setPkgFood] = useState('Breakfast & Dinner Included');
  const [pkgPickupDrop, setPkgPickupDrop] = useState('');
  const [pkgPlaces, setPkgPlaces] = useState([]);
  const [pkgPlacesSearch, setPkgPlacesSearch] = useState('');
  const [pkgCarIncluded, setPkgCarIncluded] = useState('');
  const [pkgHotelIncluded, setPkgHotelIncluded] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgImage, setPkgImage] = useState('');
  const [pkgImages, setPkgImages] = useState([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // New Premium Fields
  const [pkgCancellationPolicy, setPkgCancellationPolicy] = useState('');
  const [pkgHighlights, setPkgHighlights] = useState('');
  const [pkgInclusionsExclusions, setPkgInclusionsExclusions] = useState('');
  const [pkgAdvancePercentage, setPkgAdvancePercentage] = useState(25);
  const [dayWiseItinerary, setDayWiseItinerary] = useState([{ day: 1, title: '', activities: '', meals: '', hotel: '', images: [], location: '', tips: '' }]);
  const [pkgAddOns, setPkgAddOns] = useState([]);
  
  // Customizations
  const [isFlightCustomizable, setIsFlightCustomizable] = useState(false);
  const [baseFlightPrice, setBaseFlightPrice] = useState('');
  const [isCabCustomizable, setIsCabCustomizable] = useState(false);
  const [companyCabPrice, setCompanyCabPrice] = useState('');
  const [pickupDropPrice, setPickupDropPrice] = useState('');
  const [pickupDropImage, setPickupDropImage] = useState('');

  // Bookings list and Dropdown Data
  const [bookings, setBookings] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);
  const [aiLeads, setAiLeads] = useState([]);
  const [selectedAiLeadChat, setSelectedAiLeadChat] = useState(null);
  const [masterFlights, setMasterFlights] = useState([]);
  const [masterHotels, setMasterHotels] = useState([]);
  const [destinationsList, setDestinationsList] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [placesSuggestions, setPlacesSuggestions] = useState([]);
  
  // Lifted state for Coupons and AddOns to fix Rule of Hooks
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_value: '' });
  const [addOns, setAddOns] = useState([]);
  const [newAddOn, setNewAddOn] = useState({ title: '', type: 'Activity', location: '', price: '', duration: '', description: '', image_url: '' });

  // Fetch Coupons and AddOns when their respective tabs are activated
  useEffect(() => {
    if (activeTab === 'coupons') {
      api.getCoupons().then(res => setCoupons(Array.isArray(res) ? res : []));
    }
    if (activeTab === 'addons' && addOns.length === 0) {
      api.getAddOns().then(res => setAddOns(Array.isArray(res) ? res : []));
    }
  }, [activeTab]);
  
  // Flight Search State
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('GOI');
  const [flightDate, setFlightDate] = useState('');
  const [isSearchingFlights, setIsSearchingFlights] = useState(false);
  const [liveFlights, setLiveFlights] = useState(null);
  
  // Hotel Search State
  const [hotelLocation, setHotelLocation] = useState('Goa');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelAdults, setHotelAdults] = useState(2);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [liveHotels, setLiveHotels] = useState(null);
  
  // Payment Management State
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  
  const mockSightseeing = ['Top Goa Attractions', 'Dudhsagar Waterfalls & Spice Plantation', 'North Goa Beaches', 'South Goa Heritage'];
  const mockFlights = ['IndiGo Round Trip', 'Air India Premium', 'Vistara Business Class', 'SpiceJet Economy'];

  useEffect(() => {
    async function loadData() {
      try {
        const bkgs = await api.fetchBookings();
        setBookings(bkgs);
      } catch (err) {
        console.warn("Could not load bookings list.", err);
      }
      try {
        const leads = await api.fetchAiLeads();
        setAiLeads(Array.isArray(leads) ? leads : []);
      } catch (err) {
        console.warn("Could not load AI leads.", err);
      }
      try {
        const htls = await api.fetchHotels();
        setHotelsList(Array.isArray(htls) ? htls : []);
        setMasterHotels(Array.isArray(htls) ? htls : []);
        if (Array.isArray(htls) && htls.length > 0) setPkgHotelIncluded(htls[0].name);
      } catch(err) {
        console.warn("Could not load hotels list.", err);
      }
      try {
        const fl = await api.fetchFlights();
        setMasterFlights(Array.isArray(fl) ? fl : []);
      } catch(err) {
        console.warn("Could not load flights list.", err);
      }
      try {
        const ps = await api.fetchPaymentSettings();
        setRazorpayEnabled(ps.razorpay_enabled == 1);
        setUpiEnabled(ps.upi_enabled == 1);
        setRazorpayKey(ps.razorpay_key || '');
        setRazorpaySecret(ps.razorpay_secret || '');
        setUpiId(ps.upi_id || '');
        setUpiQrUrl(ps.upi_qr_url || '');
      } catch (err) {
        console.warn("Could not load payment settings.", err);
      }
      try {
        const dests = await api.fetchDestinations();
        setDestinationsList(Array.isArray(dests) ? dests : []);
      } catch (err) {
        console.warn("Could not load destinations.", err);
      }
    }
    loadData();
    setPkgFlights(mockFlights[0]);
    setPkgPlaces([mockSightseeing[0]]);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (pkgDestination.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${pkgDestination}`)
          .then(res => res.json())
          .then(data => setDestSuggestions(data.slice(0, 5)))
          .catch(console.error);
      } else {
        setDestSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [pkgDestination]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (pkgPlacesSearch.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${pkgPlacesSearch}`)
          .then(res => res.json())
          .then(data => setPlacesSuggestions(data.slice(0, 5)))
          .catch(console.error);
      } else {
        setPlacesSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [pkgPlacesSearch]);

  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail || !vendorPhone) {
      alert("Please fill out all vendor details.");
      return;
    }
    const payload = {
      id: editingVendorId || ('vendor-' + Date.now()),
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
      city: vendorCity,
      role: vendorRole,
      monthly_plan_price: vendorMonthlyPlanPrice,
      created_at: new Date().toISOString().slice(0, 10)
    };

    try {
      if (editingVendorId) {
        await onUpdateVendor(payload);
        if (vendorPassword) {
          await onSetVendorPassword(payload.id, vendorPassword);
        }
        alert(`Vendor "${vendorName}" updated successfully!`);
      } else {
        await onAddVendor(payload);
        if (vendorPassword) {
          await onSetVendorPassword(payload.id, vendorPassword);
        }
        alert(`Vendor "${vendorName}" registered successfully!`);
      }
    } catch (err) {
      alert("An error occurred: " + err.message);
    }

    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
    setVendorCity('');
    setVendorRole('vendor');
    setVendorMonthlyPlanPrice(0);
    setVendorPassword('');
    setEditingVendorId(null);
  };

  const resetPackageForm = () => {
    setEditingPackageId(null);
    setPkgName('');
    setPkgType('Trip Package');
    setPkgCurrency('INR');
    setPkgCostingType('Service Wise Cost');
    setPkgNights(4);
    setPkgPaxAdult(2);
    setPkgPaxChild(0);
    setPkgPaxInfant(0);
    setPkgDestination('');
    setPkgPrice('');
    setWithFlight(false);
    setPkgPriceWithFlight('');
    setPkgFlights('');
    setPkgFood('Breakfast & Dinner Included');
    setPkgPickupDrop('');
    setPkgPlaces([]);
    setPkgPlacesSearch('');
    setPkgCarIncluded('');
    setPkgHotelIncluded('');
    setPkgDescription('');
    setPkgImage('');
    setPkgImages([]);
    setCustomImageUrl('');
    setPkgCancellationPolicy('');
    setPkgHighlights('');
    setPkgInclusionsExclusions('');
    setPkgAdvancePercentage(25);
    setDayWiseItinerary([{ day: 1, title: '', activities: '', morning: '', afternoon: '', evening: '', night: '', meals: '', hotel: '', images: [], location: '', tips: '' }]);
    setPkgAddOns([]);
    setIsFlightCustomizable(false);
    setBaseFlightPrice('');
    setIsCabCustomizable(false);
    setCompanyCabPrice('');
    setPickupDropPrice('');
    setPickupDropImage('');
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!pkgName.trim() || !pkgPrice) {
      alert("Please fill out all required fields marked with * (Package Name, Destination, Price).");
      return;
    }
    if (!pkgDestination.trim()) {
      alert("Please specify the Package Destination.");
      return;
    }

    const allImagesList = pkgImages.length > 0 
      ? pkgImages 
      : (pkgImage ? [pkgImage] : ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80']);

    const primaryImage = allImagesList[0] || pkgImage || '';

    const payload = {
      id: editingPackageId || ('pkg-' + Date.now()),
      name: pkgName,
      package_type: pkgType,
      currency: pkgCurrency,
      costing_type: pkgCostingType,
      duration: `${Math.max(1, dayWiseItinerary.length - 1)} Nights / ${dayWiseItinerary.length} Days`,
      pax: `${pkgPaxAdult}A ${pkgPaxChild}C ${pkgPaxInfant}I`,
      destination: pkgDestination,
      price: parseInt(pkgPrice, 10),
      price_with_flight: withFlight && pkgPriceWithFlight ? parseInt(pkgPriceWithFlight, 10) : null,
      flights_included: withFlight ? (pkgFlights || null) : null,
      food_included: pkgFood || null,
      pickup_drop_included: pkgPickupDrop || 'Airport Transfers Included',
      places_included: Array.isArray(pkgPlaces) ? pkgPlaces.join(' | ') : 'Top Goa Attractions',
      car_included: pkgType.includes('Self-Drive') ? (pkgCarIncluded || 'Mahindra Thar') : null,
      hotel_included: pkgHotelIncluded || 'W Goa Resort',
      description: pkgDescription || 'Explore Goa on your own terms with this premium package deal.',
      image: primaryImage,
      imageUrl: primaryImage,
      image_url: primaryImage,
      images_json: JSON.stringify(allImagesList),
      images: allImagesList,
      tag: 'New Package',
      is_flight_customizable: isFlightCustomizable ? 1 : 0,
      base_flight_price: baseFlightPrice ? parseInt(baseFlightPrice, 10) : 0,
      is_cab_customizable: isCabCustomizable ? 1 : 0,
      company_cab_price: companyCabPrice,
      pickup_drop_price: pickupDropPrice,
      pickup_drop_image: pickupDropImage,
      day_wise_itinerary: JSON.stringify(dayWiseItinerary),
      cancellation_policy: pkgCancellationPolicy,
      highlights_json: pkgHighlights,
      inclusions_exclusions_json: pkgInclusionsExclusions,
      advance_percentage: pkgAdvancePercentage,
      package_addons_json: JSON.stringify(pkgAddOns)
    };

    try {
      if (editingPackageId) {
        await onUpdatePackage(payload);
        alert(`Package "${pkgName}" updated successfully!`);
      } else {
        await onAddPackage(payload);
        alert(`Goa Tour Package "${pkgName}" created successfully!`);
      }
      resetPackageForm();
      setShowPackageForm(false);
    } catch (err) {
      alert("Error saving package: " + err.message);
    }
  };

  const handleEditPackageClick = (pkg) => {
    setEditingPackageId(pkg.id);
    setPkgName(pkg.name || '');
    setPkgType(pkg.package_type || 'Trip Package');
    // Simple night extraction
    const match = (pkg.duration || '').match(/(\d+)\s*Nights/i);
    setPkgNights(match ? parseInt(match[1]) : 4);
    setPkgPrice(pkg.price || '');
    setPkgPriceWithFlight(pkg.price_with_flight || '');
    setWithFlight(!!pkg.price_with_flight);
    setPkgDestination(pkg.destination || '');
    setPkgDescription(pkg.description || '');
    const pkgImg = pkg.imageUrl || pkg.image || pkg.image_url || '';
    setPkgImage(pkgImg);

    // Parse existing multiple images
    let existingImages = [];
    if (pkg.images && Array.isArray(pkg.images)) {
      existingImages = pkg.images;
    } else if (pkg.images_json) {
      try {
        const raw = pkg.images_json;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) existingImages = parsed;
      } catch (e) {}
    } else if (pkgImg && pkgImg.includes(',')) {
      existingImages = pkgImg.split(',').map(s => s.trim()).filter(Boolean);
    } else if (pkgImg) {
      existingImages = [pkgImg];
    }
    setPkgImages(existingImages);

    setPkgCancellationPolicy(pkg.cancellation_policy || '');
    setPkgHighlights(pkg.highlights_json || '');
    setPkgInclusionsExclusions(pkg.inclusions_exclusions_json || '');
    setPkgAdvancePercentage(pkg.advance_percentage || 25);
    setIsFlightCustomizable(Number(pkg.is_flight_customizable) === 1);
    setBaseFlightPrice(pkg.base_flight_price || '');
    setIsCabCustomizable(Number(pkg.is_cab_customizable) === 1);
    setCompanyCabPrice(pkg.company_cab_price || '');
    setPickupDropPrice(pkg.pickup_drop_price || '');
    setPickupDropImage(pkg.pickup_drop_image || '');
    setPkgPlaces(pkg.places_included ? pkg.places_included.split(' | ') : []);
    setPkgPlacesSearch('');
    
    let parsed = [];
    try {
      if (pkg.day_wise_itinerary) {
        parsed = typeof pkg.day_wise_itinerary === 'string' ? JSON.parse(pkg.day_wise_itinerary) : pkg.day_wise_itinerary;
      }
    } catch (e) {}
    if (parsed && parsed.length > 0) {
      setDayWiseItinerary(parsed);
    } else {
      setDayWiseItinerary([{ day: 1, title: '', activities: '', morning: '', afternoon: '', evening: '', night: '', meals: '', hotel: '', images: [], location: '', tips: '' }]);
    }
    setShowPackageForm(true);
  };

  const handleDeletePackageClick = async (pkgId) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        await onDeletePackage(pkgId);
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const filteredVendors = (vendors || []).filter(v => {
    let matchType = true;
    const r = (v.role || '').toLowerCase();
    if (vendorTypeFilter === 'hotel') matchType = (r === 'hotel_vendor');
    else if (vendorTypeFilter === 'flight') matchType = (r === 'flight_vendor');
    else if (vendorTypeFilter === 'bike') matchType = (r === 'bike_vendor' || r === 'bike');
    else if (vendorTypeFilter === 'vehicle') matchType = (r === 'vendor' || r === 'vehicle_vendor' || (!r && !r.includes('hotel') && !r.includes('flight')));

    const q = (searchTerm || '').toLowerCase();
    const matchSearch =
      (v.name || v.username || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.city || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q);

    return matchType && matchSearch;
  });

  const getVendorRoleMeta = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'hotel_vendor') return { label: 'HOTEL VENDOR', bg: '#e0e7ff', color: '#4338ca' };
    if (r === 'flight_vendor') return { label: 'FLIGHT VENDOR', bg: '#e0f2fe', color: '#0369a1' };
    if (r === 'bike_vendor' || r === 'bike') return { label: 'BIKE VENDOR', bg: '#fef3c7', color: '#b45309' };
    return { label: 'VEHICLE VENDOR', bg: '#ffedd5', color: '#c2410c' };
  };

  const getVendorInventoryCount = (vId) => {
    const vCars = (cars || []).filter(c => String(c.vendor_id) === String(vId) || String(c.vendorId) === String(vId)).length;
    const vBikes = (bikes || []).filter(b => String(b.vendor_id) === String(vId) || String(b.vendorId) === String(vId)).length;
    const vHotels = (hotels || []).filter(h => String(h.vendor_id) === String(vId) || String(h.vendorId) === String(vId)).length;
    return { cars: vCars, bikes: vBikes, hotels: vHotels, total: vCars + vBikes + vHotels };
  };

  const handleCreateAddOn = (e) => {
    e.preventDefault();
    const addOnId = 'addon-' + Date.now();
    setPkgAddOns([...pkgAddOns, { ...newAddOn, id: addOnId }]);
    setNewAddOn({ title: '', type: 'Activity', location: '', price: '', duration: '', description: '', image_url: '' });
  };

  const handleDeleteAddOn = (id) => {
    setPkgAddOns(pkgAddOns.filter(a => a.id !== id));
  };

  const renderPackagesTab = () => {
    if (showPackageForm) {
      return (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <Compass className="text-warning me-3" size={28} />
              <div>
                <h4 className="fw-bold mb-0 text-dark font-heading">{editingPackageId ? 'Edit Package' : 'Package Builder'}</h4>
                <span className="text-muted small">{editingPackageId ? 'Update your travel package settings.' : 'Configure a new travel package with flights, self-drive, and inclusions.'}</span>
              </div>
            </div>
            <button 
              type="button"
              className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-bold"
              onClick={() => { resetPackageForm(); setShowPackageForm(false); }}
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={(e) => { handleCreatePackage(e); }}>
          <div className="row g-4">
            <div className="col-md-12 mb-2">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider" style={{ fontSize: '0.85rem' }}>1. Basic Details</h6>
            </div>
            
            <div className="col-md-6">
              <label className="form-label small fw-bold text-secondary">
                Package Name <span className="text-danger">*</span>
              </label>
              <input type="text" className="form-control premium-input-field" placeholder="e.g. Goa Luxury Beach & Sunset Explorer" value={pkgName} onChange={(e) => setPkgName(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-secondary">
                Package Type <span className="text-danger">*</span>
              </label>
              <select className="form-select premium-input-field fw-medium text-dark" value={pkgType} onChange={(e) => setPkgType(e.target.value)}>
                <option>Trip Package</option>
                <option>Self Drive Package</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">Currency</label>
              <select className="form-select premium-input-field fw-medium text-dark" value={pkgCurrency} onChange={(e) => setPkgCurrency(e.target.value)}>
                <option>INR</option>
                <option>All</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">Costing Type</label>
              <select className="form-select premium-input-field fw-medium text-dark" value={pkgCostingType} onChange={(e) => setPkgCostingType(e.target.value)}>
                <option>Service Wise Cost</option>
                <option>One Time Package Cost</option>
              </select>
            </div>

            <div className="col-md-12">
              <label className="form-label small fw-bold text-secondary">
                Destination (Live Location Fetch) <span className="text-danger">*</span>
              </label>
              <input type="text" list="destinationsDataList" className="form-control premium-input-field" placeholder="Search exact location... (e.g. North Goa, South Goa, Calangute)" value={pkgDestination} onChange={(e) => setPkgDestination(e.target.value)} required />
              <datalist id="destinationsDataList">
                {destSuggestions.map(dest => (
                  <option key={dest.place_id} value={dest.display_name} />
                ))}
              </datalist>
            </div>
            
            <div className="col-md-12">
              <label className="form-label small fw-bold text-secondary mb-2">Pax Information</label>
              <div className="d-flex gap-3">
                <div className="flex-fill">
                  <label className="form-label text-xxs text-muted mb-1">Adult</label>
                  <input type="number" min="1" className="form-control premium-input-field" value={pkgPaxAdult} onChange={(e) => setPkgPaxAdult(e.target.value)} />
                </div>
                <div className="flex-fill">
                  <label className="form-label text-xxs text-muted mb-1">Child</label>
                  <input type="number" min="0" className="form-control premium-input-field" value={pkgPaxChild} onChange={(e) => setPkgPaxChild(e.target.value)} />
                </div>
                <div className="flex-fill">
                  <label className="form-label text-xxs text-muted mb-1">Infant</label>
                  <input type="number" min="0" className="form-control premium-input-field" value={pkgPaxInfant} onChange={(e) => setPkgPaxInfant(e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="col-md-12 mt-4">
              <div className="form-check form-switch d-flex align-items-center gap-2 mb-3">
                <input className="form-check-input" type="checkbox" role="switch" checked={withFlight} onChange={(e) => setWithFlight(e.target.checked)} id="withFlightSwitch" style={{ transform: 'scale(1.2)' }} />
                <label className="form-check-label fw-bold text-secondary" htmlFor="withFlightSwitch">With Flight Option</label>
              </div>
            </div>
            
            <div className="col-md-6">
              <label className="form-label small fw-bold text-secondary">
                Price (Without Flight) ₹ <span className="text-danger">*</span>
              </label>
              <input type="number" className="form-control premium-input-field fw-bold text-primary" placeholder="e.g. 14999" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} required />
            </div>
            
            {withFlight && (
              <div className="col-md-6">
                <label className="form-label small fw-bold text-secondary">
                  Price (With Flight) ₹ <span className="text-danger">*</span>
                </label>
                <input type="number" className="form-control premium-input-field fw-bold text-primary" placeholder="e.g. 19999" value={pkgPriceWithFlight} onChange={(e) => setPkgPriceWithFlight(e.target.value)} required />
              </div>
            )}
            
            {/* ─── MULTIPLE IMAGE GALLERY UPLOAD & URL MANAGER ─── */}
            <div className="col-md-12">
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-secondary mb-0">
                    Package Photo Gallery & Images (Multiple Supported) <span className="text-danger">*</span>
                  </label>
                  <span className="badge bg-primary rounded-pill small">
                    {pkgImages.length} Photos Selected
                  </span>
                </div>
                
                {/* Multi-file Upload and URL Paste Input */}
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted text-xxs mb-1 fw-bold">Upload Image Files (Select Multiple)</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="form-control" 
                      disabled={isUploadingImages}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setIsUploadingImages(true);
                          try {
                            const newUploadedUrls = [];
                            for (let i = 0; i < e.target.files.length; i++) {
                              const url = await api.uploadImage(e.target.files[i]);
                              if (url) newUploadedUrls.push(url);
                            }
                            const updated = [...pkgImages, ...newUploadedUrls];
                            setPkgImages(updated);
                            if (!pkgImage && updated.length > 0) {
                              setPkgImage(updated[0]);
                            }
                          } catch (err) {
                            alert("Failed to upload images: " + err.message);
                          } finally {
                            setIsUploadingImages(false);
                          }
                        }
                      }} 
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-muted text-xxs mb-1 fw-bold">Or Add Photo by URL</label>
                    <div className="d-flex gap-2">
                      <input 
                        type="url" 
                        className="form-control" 
                        placeholder="https://images.unsplash.com/..." 
                        value={customImageUrl} 
                        onChange={(e) => setCustomImageUrl(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm px-3 fw-bold text-nowrap"
                        onClick={() => {
                          if (customImageUrl.trim()) {
                            const updated = [...pkgImages, customImageUrl.trim()];
                            setPkgImages(updated);
                            if (!pkgImage) setPkgImage(customImageUrl.trim());
                            setCustomImageUrl('');
                          }
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {isUploadingImages && (
                  <div className="text-primary small mb-2 d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Uploading images to server...
                  </div>
                )}

                {/* Thumbnail Previews with Cover badge and remove button */}
                {pkgImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                    {pkgImages.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className="position-relative rounded-2 overflow-hidden border shadow-sm"
                        style={{ width: '80px', height: '60px', backgroundColor: '#000' }}
                      >
                        <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-100 h-100 object-fit-cover" />
                        {idx === 0 ? (
                          <span 
                            className="position-absolute top-0 start-0 badge bg-primary text-white"
                            style={{ fontSize: '9px', padding: '2px 4px', borderRadius: '0 0 4px 0' }}
                          >
                            Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            title="Make Cover"
                            onClick={() => {
                              const reordered = [imgUrl, ...pkgImages.filter((_, i) => i !== idx)];
                              setPkgImages(reordered);
                              setPkgImage(imgUrl);
                            }}
                            className="position-absolute top-0 start-0 badge bg-dark bg-opacity-75 text-white border-0 cursor-pointer"
                            style={{ fontSize: '9px', padding: '2px 4px' }}
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          title="Remove Photo"
                          onClick={() => {
                            const filtered = pkgImages.filter((_, i) => i !== idx);
                            setPkgImages(filtered);
                            if (pkgImage === imgUrl) {
                              setPkgImage(filtered[0] || '');
                            }
                          }}
                          className="position-absolute top-0 end-0 btn btn-sm btn-danger p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '18px', height: '18px', borderRadius: '50%', transform: 'translate(2px, -2px)' }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-12 mb-2 mt-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider border-top pt-4" style={{ fontSize: '0.85rem' }}>2. Inclusions & Logistics</h6>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-secondary">
                Stay Included (Hotel) <span className="text-danger">*</span>
              </label>
              <select className="form-select premium-input-field" value={pkgHotelIncluded} onChange={(e) => setPkgHotelIncluded(e.target.value)}>
                {hotelsList.length > 0 ? hotelsList.map(h => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                )) : <option>Loading hotels...</option>}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-secondary">Places to Visit (Live Fetch)</label>
              <div className="d-flex gap-2">
                <input type="text" list="placesDataList" className="form-control premium-input-field" placeholder="Search places..." value={pkgPlacesSearch} onChange={(e) => setPkgPlacesSearch(e.target.value)} />
                <button type="button" className="btn btn-primary btn-sm px-3 fw-bold rounded" onClick={() => {
                  if (pkgPlacesSearch.trim()) {
                    setPkgPlaces([...pkgPlaces, pkgPlacesSearch.trim()]);
                    setPkgPlacesSearch('');
                  }
                }}>Add</button>
              </div>
              <datalist id="placesDataList">
                {placesSuggestions.map(p => (
                  <option key={p.place_id} value={p.display_name} />
                ))}
              </datalist>
              {pkgPlaces.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2 p-2 bg-light rounded border">
                  {pkgPlaces.map((place, idx) => (
                    <span key={idx} className="badge bg-white border text-dark d-flex align-items-center gap-1 p-2">
                       {place.length > 40 ? place.substring(0, 40) + '...' : place}
                       <X size={14} className="cursor-pointer text-danger ms-1" onClick={() => setPkgPlaces(pkgPlaces.filter((_, i) => i !== idx))} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">Meals</label>
              <input type="text" className="form-control premium-input-field" placeholder="e.g. Breakfast & Dinner" value={pkgFood} onChange={(e) => setPkgFood(e.target.value)} />
            </div>

            {withFlight && (
              <div className="col-md-4">
                <label className="form-label small fw-bold text-secondary">Flight Details</label>
                <select className="form-select premium-input-field border-info" value={pkgFlights} onChange={(e) => setPkgFlights(e.target.value)}>
                  {mockFlights.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}

            <div className="col-md-8">
              <label className="form-label small fw-bold text-secondary">Pickup & Drop Location</label>
              <input type="text" className="form-control premium-input-field border-success" placeholder="e.g. Dabolim Airport Pickup, Mopa Drop" value={pkgPickupDrop} onChange={(e) => setPkgPickupDrop(e.target.value)} />
            </div>

            <div className="col-md-12">
              <label className="form-label small fw-bold text-secondary">Marketing Description</label>
              <textarea className="form-control premium-input-field" rows="2" placeholder="Persuasive highlights of this package..." value={pkgDescription} onChange={(e) => setPkgDescription(e.target.value)} />
            </div>

            <div className="col-md-12 mb-2 mt-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider border-top pt-4" style={{ fontSize: '0.85rem' }}>3. Advanced Customizations</h6>
            </div>



            <div className="col-md-12 d-flex flex-column gap-3">
              {pkgType === 'Self Drive Package' && (
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" checked={isCabCustomizable} onChange={(e) => setIsCabCustomizable(e.target.checked)} />
                  <label className="form-check-label small fw-bold text-secondary">Allow Company Cab Option (Toggle in frontend)?</label>
                </div>
              )}
              
              {(pkgType === 'Trip Package' || isCabCustomizable) && (
                <div className="col-md-6 p-3 border rounded bg-light">
                  <label className="form-label small fw-bold text-secondary">Company Cab Base Price (₹)</label>
                  <p className="text-muted text-xxs mb-2">Used to deduct cost when cab is removed (Trip Package) or add cost when opted (Self Drive).</p>
                  <input type="number" className="form-control premium-input-field border-warning" placeholder="e.g. 2000" value={companyCabPrice} onChange={(e) => setCompanyCabPrice(e.target.value)} />
                </div>
              )}
            </div>
            
            <div className="col-md-4">
              <label className="form-label small fw-bold text-secondary">Pickup & Drop Options</label>
              <div className="p-2 border rounded bg-light">
                 <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Pickup/Drop Price (₹)</label>
                    <input type="number" className="form-control premium-input-field" placeholder="e.g. 1500" value={pickupDropPrice} onChange={(e) => setPickupDropPrice(e.target.value)} />
                 </div>
                 <div>
                    <label className="form-label small fw-bold text-secondary mb-1">Vehicle Image (File or URL)</label>
                    <div className="d-flex gap-2">
                       <input type="file" accept="image/*" className="form-control" style={{fontSize: '11px'}} onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            try {
                              const url = await api.uploadImage(e.target.files[0]);
                              setPickupDropImage(url);
                            } catch(err) { alert("Upload failed"); }
                          }
                       }} />
                       {pickupDropImage && <img src={pickupDropImage} style={{width: '30px', height: '30px', objectFit:'cover', borderRadius:'4px'}} alt="preview"/>}
                    </div>
                 </div>
              </div>
            </div>

            <div className="col-md-12 mb-2 mt-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider border-top pt-4" style={{ fontSize: '0.85rem' }}>3.b Premium Package Details</h6>
            </div>
            
            <div className="col-md-12">
              <label className="form-label small fw-bold text-secondary">Package Highlights (Bullet points)</label>
              <textarea className="form-control premium-input-field" rows="3" placeholder="e.g. Stay at a 5-star beachfront resort..." value={pkgHighlights} onChange={(e) => setPkgHighlights(e.target.value)} />
            </div>

            <div className="col-md-12 mt-2">
              <label className="form-label small fw-bold text-secondary">Inclusions & Exclusions</label>
              <textarea className="form-control premium-input-field" rows="3" placeholder="e.g. Included: Breakfast, Airport Transfer. Excluded: Flights, Visa..." value={pkgInclusionsExclusions} onChange={(e) => setPkgInclusionsExclusions(e.target.value)} />
            </div>

            <div className="col-md-8 mt-2">
              <label className="form-label small fw-bold text-secondary">Cancellation Policy</label>
              <textarea className="form-control premium-input-field" rows="2" placeholder="e.g. Free cancellation before 48 hours..." value={pkgCancellationPolicy} onChange={(e) => setPkgCancellationPolicy(e.target.value)} />
            </div>

            <div className="col-md-4 mt-2">
              <label className="form-label small fw-bold text-secondary">Advance Payment (%)</label>
              <div className="input-group">
                <input type="number" className="form-control premium-input-field" value={pkgAdvancePercentage} onChange={(e) => setPkgAdvancePercentage(e.target.value)} min="0" max="100" />
                <span className="input-group-text">%</span>
              </div>
            </div>

            <div className="col-md-12 mb-2 mt-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider border-top pt-4" style={{ fontSize: '0.85rem' }}>4. Day-Wise Itinerary (MakeMyTrip Style)</h6>
            </div>
            
            <div className="col-md-12">
              {dayWiseItinerary.map((dayPlan, index) => (
                <div key={index} className="p-3 mb-3 border rounded bg-light position-relative">
                  <div className="d-flex justify-content-between mb-2">
                    <h6 className="fw-bold text-primary mb-0">Day {dayPlan.day}</h6>
                    {dayWiseItinerary.length > 1 && (
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => {
                        const newItinerary = dayWiseItinerary.filter((_, i) => i !== index);
                        // re-sequence days
                        const sequenced = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                        setDayWiseItinerary(sequenced);
                      }}>Remove Day</button>
                    )}
                  </div>
                  <div className="row g-2">
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-secondary">Title / Heading</label>
                      <input type="text" className="form-control premium-input-field" placeholder="e.g. Arrival & Welcome to Goa" value={dayPlan.title} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].title = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Morning Schedule</label>
                      <textarea className="form-control premium-input-field" rows="2" placeholder="e.g. Arrive at Dabolim Airport..." value={dayPlan.morning || dayPlan.activities || ''} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].morning = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Afternoon Schedule</label>
                      <textarea className="form-control premium-input-field" rows="2" placeholder="e.g. Check-in and lunch..." value={dayPlan.afternoon || ''} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].afternoon = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Evening Schedule</label>
                      <textarea className="form-control premium-input-field" rows="2" placeholder="e.g. Sunset beach walk..." value={dayPlan.evening || ''} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].evening = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Night Schedule</label>
                      <textarea className="form-control premium-input-field" rows="2" placeholder="e.g. Dinner and leisure..." value={dayPlan.night || ''} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].night = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Meals Included</label>
                      <input type="text" className="form-control premium-input-field" placeholder="e.g. Dinner included" value={dayPlan.meals} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].meals = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Hotel Stay</label>
                      <input type="text" className="form-control premium-input-field" placeholder="e.g. Premium Resort" value={dayPlan.hotel || ''} onChange={(e) => {
                        const newItinerary = [...dayWiseItinerary];
                        newItinerary[index].hotel = e.target.value;
                        setDayWiseItinerary(newItinerary);
                      }} />
                    </div>
                    <div className="col-md-12 mt-3">
                      <label className="form-label small fw-bold text-secondary border-bottom pb-1 mb-2 d-block">Sightseeing Locations (Search & Add)</label>
                      
                      {/* Search Bar for Locations */}
                      <div className="mb-3 position-relative">
                        <input 
                          type="text" 
                          className="form-control premium-input-field" 
                          placeholder="Search for a place (e.g., Dudhsagar Waterfalls)..." 
                          id={`search-loc-${index}`}
                          onChange={async (e) => {
                            const query = e.target.value;
                            if (query.length > 2) {
                               // Use Nominatim API for open source location search
                               try {
                                 const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                 const data = await res.json();
                                 // Render a temporary dropdown (handled via state in a real component, but since we are inside a map, we'll use a local trick or we can just attach it to the window or use a dedicated state for suggestions)
                                 // Actually, let's use a state for suggestions at the component level
                                 window.dispatchEvent(new CustomEvent('updateLocationSuggestions', { detail: { index, data }}));
                               } catch (err) {}
                            }
                          }} 
                        />
                        <LocationSuggestions index={index} dayWiseItinerary={dayWiseItinerary} setDayWiseItinerary={setDayWiseItinerary} />
                      </div>

                      {/* Selected Locations as Badges */}
                      <div className="d-flex flex-wrap gap-2">
                        {(dayPlan.sightseeing_locations || (dayPlan.location ? [{name: dayPlan.location, tips: dayPlan.tips}] : [])).map((loc, locIndex, locArray) => (
                          <div key={locIndex} className="bg-white border rounded px-3 py-2 d-flex align-items-center gap-2 shadow-sm">
                            <MapPin size={14} className="text-primary" />
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '12px' }}>{loc.name}</div>
                            </div>
                            <button type="button" className="btn btn-sm text-danger p-0 ms-2" onClick={() => {
                                const newItinerary = [...dayWiseItinerary];
                                newItinerary[index].sightseeing_locations = locArray.filter((_, i) => i !== locIndex);
                                setDayWiseItinerary(newItinerary);
                            }}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-12 mt-3">
                      <label className="form-label small fw-bold text-secondary">Day Images (Upload from device)</label>
                      <div className="mb-2">
                        <input type="file" multiple accept="image/*" className="form-control premium-input-field" onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            try {
                              const filesArray = Array.from(e.target.files);
                              const uploadedUrls = await Promise.all(filesArray.map(file => api.uploadImage(file)));
                              
                              const newItinerary = [...dayWiseItinerary];
                              if (!newItinerary[index].images) newItinerary[index].images = [];
                              newItinerary[index].images = [...newItinerary[index].images, ...uploadedUrls];
                              setDayWiseItinerary(newItinerary);
                            } catch (err) {
                              alert("Failed to upload some images. " + err.message);
                            }
                            e.target.value = '';
                          }
                        }} />
                      </div>

                      {(dayPlan.images || []).length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {dayPlan.images.map((imgUrl, imgIndex) => (
                            <div key={imgIndex} className="position-relative" style={{ width: '80px', height: '80px' }}>
                              <img src={imgUrl} alt="Day" className="img-thumbnail w-100 h-100 object-fit-cover" />
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle" 
                                style={{ transform: 'translate(30%, -30%)', padding: '0.1rem 0.35rem', fontSize: '0.7rem' }}
                                onClick={() => {
                                  const newItinerary = [...dayWiseItinerary];
                                  newItinerary[index].images.splice(imgIndex, 1);
                                  setDayWiseItinerary(newItinerary);
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary fw-bold" onClick={() => {
                setDayWiseItinerary([...dayWiseItinerary, { day: dayWiseItinerary.length + 1, title: '', activities: '', meals: '', hotel: '', images: [], location: '', tips: '' }]);
              }}>
                + Add Another Day
              </button>
            </div>
            
            <div className="col-12 text-end mt-4">
              <button type="submit" className="btn btn-amber-gradient px-5 py-2.5 rounded-pill fw-bold text-white shadow-sm">
                {editingPackageId ? 'Update Package' : 'Publish Package'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 border-top pt-4">
          <h5 className="fw-bold mb-3 text-primary font-heading d-flex align-items-center gap-2">
            <Box size={22} className="text-warning" />
            Manage Add-ons
          </h5>
          <form onSubmit={handleCreateAddOn} className="bg-white p-4 rounded shadow-sm border mb-4">
            <h6 className="fw-bold mb-3">Add New Activity / Transfer / Meal</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <select className="form-select" value={newAddOn.type} onChange={e => setNewAddOn({...newAddOn, type: e.target.value})}>
                  <option>Activity</option>
                  <option>Transfer</option>
                  <option>Meal</option>
                </select>
              </div>
              <div className="col-md-6">
                <input type="text" className="form-control" placeholder="Title (e.g. Scuba Diving)" value={newAddOn.title} onChange={e => setNewAddOn({...newAddOn, title: e.target.value})} required />
              </div>
              <div className="col-md-3">
                <input type="number" className="form-control" placeholder="Price (₹)" value={newAddOn.price} onChange={e => setNewAddOn({...newAddOn, price: e.target.value})} required />
              </div>
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Location (e.g. Goa)" value={newAddOn.location} onChange={e => setNewAddOn({...newAddOn, location: e.target.value})} required />
              </div>
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Duration (e.g. 2 Hours)" value={newAddOn.duration} onChange={e => setNewAddOn({...newAddOn, duration: e.target.value})} />
              </div>
              <div className="col-md-4">
                <input type="text" className="form-control" placeholder="Image URL" value={newAddOn.image_url} onChange={e => setNewAddOn({...newAddOn, image_url: e.target.value})} />
              </div>
              <div className="col-md-12">
                <textarea className="form-control" placeholder="Description" rows="2" value={newAddOn.description} onChange={e => setNewAddOn({...newAddOn, description: e.target.value})}></textarea>
              </div>
              <div className="col-md-12 text-end">
                <button type="submit" className="btn btn-primary">Save Add-on</button>
              </div>
            </div>
          </form>

          <div className="table-responsive">
            <table className="table align-middle table-hover small">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pkgAddOns.map(a => (
                  <tr key={a.id}>
                    <td><span className={`badge ${a.type==='Activity'?'bg-info':a.type==='Transfer'?'bg-warning':'bg-success'}`}>{a.type}</span></td>
                    <td className="fw-bold">{a.title}</td>
                    <td>{a.location}</td>
                    <td className="text-success fw-bold">₹{a.price}</td>
                    <td>
                      <button type="button" className="btn btn-sm text-danger" onClick={() => handleDeleteAddOn(a.id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      );
    }

    return (
      <div className="mt-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
        
        {/* Top Header Card */}
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Goa Trip Plans Catalog</h4>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Manage self-drive holiday packages, hotel stays, cars, bikes and curated Goa experiences.
              </p>
            </div>
            <button 
              type="button"
              className="btn px-4 py-2.5 rounded-pill fw-bold text-white shadow hover-scale d-flex align-items-center gap-2"
              onClick={() => { resetPackageForm(); setShowPackageForm(true); }}
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add New Package
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-3 rounded-pill shadow-sm bg-white mb-4 d-flex flex-wrap flex-md-nowrap align-items-center gap-3" style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex-grow-1 border-end pe-3 ps-2">
            <div className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Search Package</div>
            <input type="text" className="form-control border-0 p-0 shadow-none fw-bold text-dark" placeholder="e.g. Coastal Goa Explorer" style={{ fontSize: '0.95rem', background: 'transparent' }} value={packageSearchTerm} onChange={(e) => setPackageSearchTerm(e.target.value)} />
          </div>
          <div className="flex-grow-1 border-end pe-3">
            <div className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Category</div>
            <select className="form-select border-0 p-0 shadow-none fw-bold text-dark" style={{ fontSize: '0.95rem', background: 'transparent' }}>
              <option>All Packages</option>
              <option>Self-Drive Packages</option>
              <option>Complete Packages</option>
            </select>
          </div>
          <div className="flex-grow-1 border-end pe-3">
            <div className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Price Range</div>
            <select className="form-select border-0 p-0 shadow-none fw-bold text-dark" style={{ fontSize: '0.95rem', background: 'transparent' }}>
              <option>Any Price</option>
              <option>Under ₹10,000</option>
              <option>₹10,000 - ₹20,000</option>
              <option>Above ₹20,000</option>
            </select>
          </div>
          <div className="flex-grow-1 pe-3">
            <div className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Status</div>
            <select className="form-select border-0 p-0 shadow-none fw-bold text-dark" style={{ fontSize: '0.95rem', background: 'transparent' }}>
              <option>Active</option>
              <option>Draft</option>
            </select>
          </div>
          <div>
            <button className="btn rounded-circle d-flex align-items-center justify-content-center hover-scale shadow" style={{ width: '54px', height: '54px', background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}>
              <Search size={22} className="text-white" />
            </button>
          </div>
        </div>

        <div className="d-flex flex-column gap-4 pb-4">
          {allPackages && allPackages.filter(pkg => pkg.name.toLowerCase().includes(packageSearchTerm.toLowerCase())).map(pkg => (
            <div 
              key={pkg.id} 
              className="p-3 d-flex flex-column flex-md-row gap-4 border rounded-4 transition-all hover-scale"
              style={{ 
                background: 'rgba(255, 255, 255, 0.7)', 
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(13, 27, 46, 0.08)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF6333';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 99, 51, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(13, 27, 46, 0.08)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Package Image */}
              <div className="position-relative overflow-hidden rounded-3 shadow-sm flex-shrink-0" style={{ width: '220px', height: '160px' }}>
                <img 
                  src={pkg.imageUrl || pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'} 
                  alt={pkg.name} 
                  className="w-100 h-100 object-fit-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'; }}
                />
                <div className="position-absolute top-0 start-0 m-2">
                  <span className="badge shadow-sm" style={{ background: '#0D1B2E', color: '#00B8D9', fontSize: '0.7rem', padding: '6px 10px', borderRadius: '8px' }}>
                    {pkg.tag || 'Holiday Package'}
                  </span>
                </div>
              </div>

              {/* Package Details */}
              <div className="d-flex flex-column flex-grow-1 justify-content-between py-1">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold mb-0 text-dark" style={{ color: '#0D1B2E', fontSize: '1.25rem' }}>{pkg.name}</h5>
                    <div className="text-end">
                      <span className="text-muted small d-block">Starting from</span>
                      <span className="fw-extrabold" style={{ color: '#FF6333', fontSize: '1.4rem' }}>₹{pkg.price}</span>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3 mb-3 text-muted fw-medium small">
                    <span className="d-flex align-items-center gap-1"><Clock size={16} color="#FFC107" /> {pkg.duration}</span>
                    <span className="d-flex align-items-center gap-1"><MapIcon size={16} color="#00B8D9" /> Multiple Locations</span>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1.5 rounded-pill" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10243A' }}>
                      <Hotel size={14} color="#10243A" /> Stay: {pkg.hotel_included || 'Included'}
                    </span>
                    <span className="badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1.5 rounded-pill" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10243A' }}>
                      <Compass size={14} color="#10243A" /> Drive: {pkg.car_included || 'Included'}
                    </span>
                    {pkg.flights_included && (
                      <span className="badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1.5 rounded-pill" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10243A' }}>
                        <Plane size={14} color="#10243A" /> Flight: {pkg.flights_included}
                      </span>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <button 
                    className="btn btn-sm btn-light fw-bold text-secondary d-flex align-items-center gap-1 px-3 rounded-pill border hover-bg-navy-light transition-all"
                    onClick={() => alert(`Viewing Details for: ${pkg.name}\n\nPrice: ₹${pkg.price}\nDuration: ${pkg.duration}\n\nTo see full details, visit the Customization Page from the main app.`)}
                  >
                    View
                  </button>
                  <button 
                    className="btn btn-sm fw-bold text-white d-flex align-items-center gap-1 px-3 rounded-pill shadow-sm hover-scale" 
                    style={{ background: '#10243A' }}
                    onClick={() => handleEditPackageClick(pkg)}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1 px-3 rounded-pill hover-scale"
                    onClick={() => handleDeletePackageClick(pkg.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVendorsTab = () => {
    if (showVendorForm) {
      return (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <Building className="text-warning me-3" size={28} />
              <div>
                <h4 className="fw-bold mb-0 text-dark font-heading">Register New Vendor</h4>
                <span className="text-muted small">Add a new rental operator to the platform.</span>
              </div>
            </div>
            <button 
              type="button"
              className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-bold"
              onClick={() => setShowVendorForm(false)}
            >
              Cancel
            </button>
          </div>
          
          <div className="row">
            <div className="col-lg-6">
              <form onSubmit={(e) => { handleRegisterVendor(e); setShowVendorForm(false); }}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Vendor Name</label>
                  <input type="text" className="form-control premium-input-field" placeholder="e.g. Panjim Car Rentals" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Email Address</label>
                  <input type="email" className="form-control premium-input-field" placeholder="e.g. panjim@rentals.com" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Phone Number</label>
                  <input type="tel" className="form-control premium-input-field" placeholder="e.g. +91 9999977777" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Location Area</label>
                  <input type="text" className="form-control premium-input-field" value={vendorCity} onChange={(e) => setVendorCity(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Vendor Role</label>
                  <select className="form-select premium-input-field" value={vendorRole} onChange={(e) => setVendorRole(e.target.value)} required>
                    <option value="vendor">Vehicle Vendor (Cars & Fleet)</option>
                    <option value="bike_vendor">Bike Vendor (Bikes & Scooters)</option>
                    <option value="hotel_vendor">Hotel Vendor (Rooms & Stays)</option>
                    <option value="flight_vendor">Flight Vendor (Airline / Charters)</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Monthly Plan Price (₹)</label>
                  <input type="number" className="form-control premium-input-field" placeholder="e.g. 5000" value={vendorMonthlyPlanPrice} onChange={(e) => setVendorMonthlyPlanPrice(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Password {editingVendorId && '(Leave empty to keep current)'}</label>
                  <input type="password" className="form-control premium-input-field" placeholder="Enter password for this vendor" value={vendorPassword} onChange={(e) => setVendorPassword(e.target.value)} required={!editingVendorId} />
                </div>
                <button type="submit" className="btn btn-amber-gradient w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm">
                  {editingVendorId ? 'Update Operator' : 'Register Operator'}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Top Header Card */}
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Registered Operators ({vendors.length})</h4>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Manage verified vehicle, bike, hotel, and flight vendor operators across WOW GOA.
              </p>
            </div>
            <button 
              type="button"
              className="btn px-4 py-2.5 rounded-pill fw-bold text-white shadow hover-scale d-flex align-items-center gap-2"
              onClick={() => {
                setEditingVendorId(null);
                setVendorName('');
                setVendorEmail('');
                setVendorPhone('');
                setVendorCity('');
                setVendorRole('vendor');
                setVendorMonthlyPlanPrice(0);
                setVendorPassword('');
                setShowVendorForm(true);
              }}
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add New Vendor
            </button>
          </div>
        </div>

        {/* Filter / Search Bar & Category Pills */}
        <div className="p-3 rounded-4 shadow-sm bg-white mb-4 d-flex flex-column gap-3" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="flex-grow-1 px-2">
              <div className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Search Operator</div>
              <input type="text" className="form-control border-0 p-0 shadow-none fw-bold text-dark" placeholder="Search by name, email, phone, or location..." style={{ fontSize: '0.95rem', background: 'transparent' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="btn btn-sm btn-link text-muted p-1">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap pt-2 border-top">
            <span className="small text-muted fw-semibold me-1" style={{ fontSize: '0.75rem' }}>Category:</span>
            {[
              { id: 'all', label: `All Vendors (${vendors.length})` },
              { id: 'vehicle', label: '🚗 Vehicle Vendors' },
              { id: 'bike', label: '🛵 Bike Vendors' },
              { id: 'hotel', label: '🏨 Hotel Vendors' },
              { id: 'flight', label: '✈️ Flight Vendors' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setVendorTypeFilter(cat.id)}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${vendorTypeFilter === cat.id ? 'btn-dark text-white' : 'btn-light text-secondary border'}`}
                style={{ fontSize: '0.75rem' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

          <div className="d-flex flex-column gap-3 pb-4">
            {filteredVendors.length === 0 ? (
              <p className="text-muted text-center py-5">No matching operators found.</p>
            ) : (
              filteredVendors.map(v => {
                const meta = getVendorRoleMeta(v.role);
                const invCount = getVendorInventoryCount(v.id);
                const isInactive = v.status === 'inactive' || v.status === 'suspended';
                const isPending = v.status === 'pending';

                return (
                  <div key={v.id} className="operator-row-card p-3 d-flex justify-content-between align-items-center flex-wrap gap-3 border rounded-3 bg-white shadow-xs">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', background: `${meta.color}15` }}>
                        <Building style={{ color: meta.color }} size={22} />
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h6 className="mb-0 fw-bold text-dark">{v.name || v.username}</h6>
                          <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: meta.bg, color: meta.color, fontSize: '0.65rem' }}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-muted small d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                          {v.email || 'No email'} • {v.phone || 'No phone'} • Plan: ₹{v.monthly_plan_price || 0}/mo
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill" style={{ fontSize: '0.72rem' }}>
                        📍 {v.city || 'Goa'}
                      </span>
                      <span className={`badge rounded-pill px-2.5 py-1.5 fw-bold ${isInactive ? 'bg-danger text-white' : isPending ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '0.72rem' }}>
                        {v.status ? v.status.toUpperCase() : 'ACTIVE'}
                      </span>
                      <div className="d-flex gap-2 ms-2">
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 fw-semibold"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setSelectedVendorDetails(v)}
                          title="View Vendor Details"
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setEditingVendorId(v.id);
                            setVendorName(v.name);
                            setVendorEmail(v.email);
                            setVendorPhone(v.phone);
                            setVendorCity(v.city || '');
                            setVendorRole(v.role || 'vendor');
                            setVendorMonthlyPlanPrice(v.monthly_plan_price || 0);
                            setVendorPassword('');
                            setShowVendorForm(true);
                          }}
                          title="Edit Vendor"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${v.name}?`)) {
                              await onDeleteVendor(v.id);
                            }
                          }}
                          title="Delete Vendor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        {/* Vendor Details Modal */}
        {selectedVendorDetails && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                <div className="modal-header text-white px-4 py-3" style={{ background: '#0D1B2E' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Building size={18} className="text-warning" />
                    <h5 className="modal-title fw-bold mb-0 text-white" style={{ fontSize: '15px' }}>
                      Vendor Details — {selectedVendorDetails.name || selectedVendorDetails.username}
                    </h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedVendorDetails(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <h6 className="fw-bold mb-0 text-dark">{selectedVendorDetails.name || selectedVendorDetails.username}</h6>
                      <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${
                        selectedVendorDetails.status === 'inactive' || selectedVendorDetails.status === 'suspended' ? 'bg-danger text-white' :
                        selectedVendorDetails.status === 'pending' ? 'bg-warning text-dark' : 'bg-success text-white'
                      }`} style={{ fontSize: '0.72rem' }}>
                        {selectedVendorDetails.status ? selectedVendorDetails.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>
                    <div className="row g-2" style={{ fontSize: '0.82rem' }}>
                      <div className="col-6"><span className="text-muted">Vendor ID:</span> <strong className="font-monospace">{selectedVendorDetails.id}</strong></div>
                      <div className="col-6"><span className="text-muted">Category:</span> <strong>{getVendorRoleMeta(selectedVendorDetails.role).label}</strong></div>
                      <div className="col-6"><span className="text-muted">Email:</span> <strong>{selectedVendorDetails.email || '—'}</strong></div>
                      <div className="col-6"><span className="text-muted">Phone:</span> <strong>{selectedVendorDetails.phone || '—'}</strong></div>
                      <div className="col-6"><span className="text-muted">Location:</span> <strong>{selectedVendorDetails.city || 'Goa'}</strong></div>
                      <div className="col-6"><span className="text-muted">Monthly Plan:</span> <strong>₹{selectedVendorDetails.monthly_plan_price || 0}/mo</strong></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h6 className="fw-bold mb-2 text-dark small">Inventory & Fleet Association</h6>
                    {(() => {
                      const count = getVendorInventoryCount(selectedVendorDetails.id);
                      return (
                        <div className="row g-2 text-center" style={{ fontSize: '0.82rem' }}>
                          <div className="col-4 p-2 bg-white rounded border">
                            <div className="text-muted small">Cars Listed</div>
                            <div className="fs-5 fw-bold text-primary">{count.cars}</div>
                          </div>
                          <div className="col-4 p-2 bg-white rounded border">
                            <div className="text-muted small">Bikes Listed</div>
                            <div className="fs-5 fw-bold text-warning">{count.bikes}</div>
                          </div>
                          <div className="col-4 p-2 bg-white rounded border">
                            <div className="text-muted small">Hotels Listed</div>
                            <div className="fs-5 fw-bold text-success">{count.hotels}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="modal-footer px-4 py-2 bg-light">
                  <button type="button" className="btn btn-sm btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setSelectedVendorDetails(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {vendorPasswordModal.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Set Vendor Password</h5>
                  <button type="button" className="btn-close" onClick={() => setVendorPasswordModal({ isOpen: false, vendorId: null, password: '' })}></button>
                </div>
                <div className="modal-body">
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter new password" 
                    value={vendorPasswordModal.password}
                    onChange={e => setVendorPasswordModal({ ...vendorPasswordModal, password: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setVendorPasswordModal({ isOpen: false, vendorId: null, password: '' })}>Cancel</button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      if (vendorPasswordModal.password) {
                        onSetVendorPassword(vendorPasswordModal.vendorId, vendorPasswordModal.password)
                          .then(() => {
                            alert("Password set successfully!");
                            setVendorPasswordModal({ isOpen: false, vendorId: null, password: '' });
                          });
                      }
                    }}
                  >
                    Save Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderBookingsTab = () => (
    <div className="text-start mt-2">
      {/* Top Header Card */}
      <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
        <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
          <div>
            <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Live Reservations Log</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              View and manage all customer bookings, payment statuses, and reservation details.
            </p>
          </div>
        </div>
      </div>

      <div className="table-responsive bg-white p-3 rounded-4 shadow-sm">
        <table className="table align-middle table-hover small border">
          <thead className="table-light">
            <tr>
              <th>Ref ID</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Plan / Vehicle booked</th>
              <th>Details</th>
              <th>Payment Info</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No reservations recorded yet.</td>
              </tr>
            ) : (
              bookings.map(b => {
                let travellers = null;
                try {
                   if (b.traveller_details_json) travellers = JSON.parse(b.traveller_details_json);
                } catch(e) {}
                
                return (
                  <tr key={b.id}>
                    <td className="fw-bold text-secondary text-xxs">#{b.id}</td>
                    <td className="fw-bold text-primary">{b.name}</td>
                    <td>{b.phone}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{b.item_name}</span>
                      {travellers && <div className="text-xxs mt-1 text-muted">{travellers.adults} Adults, {travellers.children} Children</div>}
                    </td>
                    <td>
                      <div className="text-xxs">
                        {b.pickup_loc ? (
                           <><strong>Loc:</strong> {b.pickup_loc}<br /><strong>Date:</strong> {b.pickup_date}</>
                        ) : (
                           <span>Package Booking</span>
                        )}
                        <br /><strong>{b.booking_days} Day(s)</strong>
                      </div>
                    </td>
                    <td>
                      <div className="text-xxs">
                         <strong>Total:</strong> ₹{b.total_amount || b.total_paid}<br/>
                         <strong className="text-success">Paid:</strong> ₹{b.amount_paid || b.total_paid}<br/>
                         {Number(b.remaining_amount) > 0 && <strong className="text-danger">Due: ₹{b.remaining_amount}</strong>}
                      </div>
                    </td>
                    <td>
                       <span className={`badge ${b.payment_status === 'Partial' ? 'bg-warning text-dark' : 'bg-success'}`}>{b.payment_status || 'Full'}</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Stub = ({ title, icon, desc }) => (
    <div className="p-5 text-center h-100 d-flex align-items-center justify-content-center">
      <div>
        {icon}
        <h4 className="fw-bold text-dark mt-3">{title}</h4>
        <p className="text-muted">{desc}</p>
        <span className="badge bg-light text-secondary border px-3 py-2">Coming Soon</span>
      </div>
    </div>
  );

  const handleSearchFlights = async (e) => {
    e.preventDefault();
    if (!flightFrom || !flightTo) return alert("Please enter From and To destinations.");
    
    setIsSearchingFlights(true);
    setLiveFlights(null);
    try {
      const flights = await api.searchFlights(flightFrom, flightTo, flightDate);
      setLiveFlights(flights);
    } catch (err) {
      alert("Error fetching live flights.");
    } finally {
      setIsSearchingFlights(false);
    }
  };

  const handleAddMasterHotel = async (hotel) => {
    try {
      await api.addMasterHotel(hotel);
      alert("Hotel added to Master Table successfully!");
    } catch (err) {
      alert("Error adding hotel: " + err.message);
    }
  };

  const handleAddMasterFlight = async (flight) => {
    try {
      await api.addMasterFlight(flight);
      alert("Flight added to Master Table successfully!");
    } catch (err) {
      alert("Error adding flight: " + err.message);
    }
  };

  const renderFlightTab = () => (
    <div className="mt-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Top Header Card */}
      <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
        <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
          <div>
            <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Live Flight Inventory</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Search real-time commercial flights connected via global API.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSearchFlights} className="bg-white p-3 rounded-pill shadow-sm d-flex flex-wrap flex-md-nowrap gap-3 align-items-center border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div className="flex-grow-1">
              <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>From</label>
              <input type="text" className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" placeholder="e.g. DEL" value={flightFrom} onChange={(e) => setFlightFrom(e.target.value)} required />
            </div>
            <div className="flex-grow-1">
              <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>To</label>
              <input type="text" className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" placeholder="e.g. GOI" value={flightTo} onChange={(e) => setFlightTo(e.target.value)} required />
            </div>
            <div className="flex-grow-1">
              <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Date</label>
              <input type="date" className="form-control border-0 bg-light p-2 shadow-none text-dark" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} />
            </div>
            <div>
              <button type="submit" disabled={isSearchingFlights} className="btn text-white px-4 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center" style={{ background: '#FF6333', height: '42px', minWidth: '120px' }}>
                {isSearchingFlights ? <span className="spinner-border spinner-border-sm"></span> : 'Search API'}
              </button>
            </div>
          </form>

      {isSearchingFlights && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="fw-bold text-muted">Connecting to Global Flight API...</h5>
          <p className="text-muted small">Fetching real-time schedules and prices.</p>
        </div>
      )}

      {liveFlights && liveFlights.length === 0 && !isSearchingFlights && (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
          <Plane size={48} className="text-muted mb-3 opacity-50" />
          <h5 className="fw-bold text-dark">No flights found</h5>
          <p className="text-muted">Try adjusting your search route.</p>
        </div>
      )}

      {liveFlights && liveFlights.length > 0 && !isSearchingFlights && (
        <div className="d-flex flex-column gap-3 pb-4">
          <div className="d-flex justify-content-between align-items-center px-2">
            <h5 className="fw-bold text-dark mb-0">{liveFlights.length} Flights Found</h5>
            <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">● LIVE DATA</span>
          </div>
          {liveFlights.map(flight => (
            <div key={flight.id} className="bg-white p-4 rounded-4 shadow-sm border d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 transition-all hover-scale">
              <div className="d-flex align-items-center gap-4 min-w-200">
                <img 
                  src={flight.logo || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=120&q=80'} 
                  alt={flight.airline} 
                  className="rounded-circle border" 
                  style={{ width: '56px', height: '56px', objectFit: 'cover' }} 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=120&q=80'; }}
                />
                <div>
                  <h5 className="fw-bold text-dark mb-0">{flight.airline}</h5>
                  <span className="text-muted small">{flight.id.toUpperCase()}</span>
                </div>
              </div>
              
              <div className="d-flex flex-grow-1 justify-content-center align-items-center gap-4 text-center">
                <div>
                  <h4 className="fw-bold text-dark mb-0">{flight.departure}</h4>
                  <span className="text-muted fw-bold">{flight.from}</span>
                </div>
                <div className="d-flex flex-column align-items-center px-4 w-100 position-relative" style={{ maxWidth: '200px' }}>
                  <span className="text-muted small mb-1">{flight.duration}</span>
                  <div className="w-100 border-top border-2 border-primary position-relative">
                    <Plane size={14} className="text-primary position-absolute top-50 start-50 translate-middle bg-white px-1" />
                  </div>
                  <span className="text-muted small mt-1">{flight.stops}</span>
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-0">{flight.arrival}</h4>
                  <span className="text-muted fw-bold">{flight.to}</span>
                </div>
              </div>
              
              <div className="d-flex flex-column align-items-end text-end min-w-150 border-start ps-4">
                <h3 className="fw-bold mb-1" style={{ color: '#FF6333' }}>₹{flight.price.toLocaleString()}</h3>
                <button className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold mt-2">Select</button>
                <button className="btn btn-sm btn-success rounded-pill px-4 fw-bold mt-2" onClick={() => handleAddMasterFlight(flight)}>Save to Master</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAiChatbotTab = () => (
    <div className="mt-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <div className="p-4 rounded-4 mb-4 shadow-sm border bg-white position-relative overflow-hidden">
        <div className="position-absolute top-0 end-0 p-4 opacity-10">
          <MessageSquare size={120} />
        </div>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 position-relative z-index-1">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>AI Chatbot Leads</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Users who interacted with the Goa Trip Guide AI.</p>
          </div>
          <div style={{ minWidth: '320px', maxWidth: '420px', width: '100%' }}>
            <AIChatbotToggle />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="text-uppercase text-secondary fw-bold text-xxs py-3 ps-4">Lead ID</th>
              <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Customer Name</th>
              <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Phone Number</th>
              <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Captured At</th>
              <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {aiLeads.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">No AI leads captured yet.</td>
              </tr>
            ) : (
              aiLeads.map(lead => (
                <tr key={lead.id}>
                  <td className="fw-bold text-secondary text-xxs ps-4">#{lead.id}</td>
                  <td className="fw-bold text-dark">{lead.name}</td>
                  <td className="fw-medium text-primary">{lead.phone}</td>
                  <td className="text-muted text-sm">{lead.created_at}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary fw-bold"
                      onClick={() => setSelectedAiLeadChat(lead)}
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedAiLeadChat && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-bottom border-light">
                <h5 className="modal-title fw-bold">Chat History: {selectedAiLeadChat.name} ({selectedAiLeadChat.phone})</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedAiLeadChat(null)}></button>
              </div>
              <div className="modal-body bg-light" style={{ maxHeight: '60vh' }}>
                {!selectedAiLeadChat.chat_history ? (
                  <div className="text-center text-muted py-4">No chat history available.</div>
                ) : (
                  (() => {
                    try {
                      const history = JSON.parse(selectedAiLeadChat.chat_history);
                      return (
                        <div className="d-flex flex-column gap-3">
                          {history.map((msg, i) => (
                            <div key={i} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                              <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '80%' }}>
                                <div className="fw-bold small mb-1 opacity-75">{msg.role === 'user' ? 'User' : 'AI Assistant'}</div>
                                <div>{msg.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch(e) {
                      return <div className="text-danger">Failed to parse chat history.</div>;
                    }
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handlePaymentToggle = async (method) => {
    let newRazorpay = razorpayEnabled;
    let newUpi = upiEnabled;
    if (method === 'razorpay') {
      newRazorpay = !razorpayEnabled;
      if (newRazorpay) newUpi = false;
    } else {
      newUpi = !upiEnabled;
      if (newUpi) newRazorpay = false;
    }
    setRazorpayEnabled(newRazorpay);
    setUpiEnabled(newUpi);
    try {
      await api.updatePaymentSettings(newRazorpay, newUpi, razorpayKey, razorpaySecret, upiId, upiQrUrl);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    }
  };

  const handleSavePaymentDetails = async () => {
    try {
      await api.updatePaymentSettings(razorpayEnabled, upiEnabled, razorpayKey, razorpaySecret, upiId, upiQrUrl);
      alert("Payment details saved successfully.");
    } catch (err) {
      alert("Failed to save details: " + err.message);
    }
  };

  const handleUploadPaymentProof = async (bookingId, file) => {
    if (!file) return;
    try {
      const url = await api.uploadImage(file);
      await api.updateBookingPayment(bookingId, null, url);
      // Refresh bookings
      const bkgs = await api.fetchBookings();
      setBookings(bkgs);
      alert("Payment proof uploaded successfully.");
    } catch (err) {
      alert("Failed to upload proof: " + err.message);
    }
  };

  const renderPaymentManagementTab = () => (
    <div className="mt-2 text-start" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Top Header Card */}
      <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
        <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
          <div>
            <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Payment Management</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Configure payment gateways and track customer transactions.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
            <h5 className="fw-bold text-dark mb-3">Active Gateway</h5>
            <div className="d-flex flex-wrap gap-4 mb-3">
              <div className="form-check form-switch d-flex align-items-center gap-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  style={{ width: '40px', height: '20px' }}
                  checked={razorpayEnabled} 
                  onChange={() => handlePaymentToggle('razorpay')} 
                />
                <label className="form-check-label fw-bold" style={{ color: razorpayEnabled ? '#10243A' : '#6c757d' }}>Razorpay</label>
              </div>
              <div className="form-check form-switch d-flex align-items-center gap-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  style={{ width: '40px', height: '20px' }}
                  checked={upiEnabled} 
                  onChange={() => handlePaymentToggle('upi')} 
                />
                <label className="form-check-label fw-bold" style={{ color: upiEnabled ? '#10243A' : '#6c757d' }}>UPI</label>
              </div>
            </div>
            <p className="small text-muted mt-2 mb-3 border-bottom pb-3">Enabling one will automatically disable the other to avoid checkout conflicts.</p>
            
            {razorpayEnabled && (
              <div className="mt-3 animate-fade-in">
                <h6 className="fw-bold text-primary mb-3">Razorpay Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Key ID</label>
                    <input type="text" className="form-control" value={razorpayKey} onChange={e => setRazorpayKey(e.target.value)} placeholder="rzp_test_..." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Key Secret</label>
                    <input type="password" className="form-control" value={razorpaySecret} onChange={e => setRazorpaySecret(e.target.value)} placeholder="Secret Key" />
                  </div>
                </div>
                <button className="btn btn-sm btn-primary mt-3 px-4 rounded-pill" onClick={handleSavePaymentDetails}>Save Razorpay Details</button>
              </div>
            )}

            {upiEnabled && (
              <div className="mt-3 animate-fade-in">
                <h6 className="fw-bold text-primary mb-3">UPI Details</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">UPI ID (VPA)</label>
                    <input type="text" className="form-control" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="merchant@upi" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">UPI QR Code URL (Upload or Paste)</label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" value={upiQrUrl} onChange={e => setUpiQrUrl(e.target.value)} placeholder="https://..." />
                      <input type="file" accept="image/*" className="form-control w-50" onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const url = await api.uploadImage(e.target.files[0]);
                            setUpiQrUrl(url);
                          } catch (err) {
                            alert("Upload failed: " + err.message);
                          }
                        }
                      }} />
                    </div>
                  </div>
                </div>
                {upiQrUrl && <img src={upiQrUrl} alt="UPI QR" className="mt-3 border rounded shadow-sm" style={{height: '120px'}} />}
                <div className="mt-3">
                  <button className="btn btn-sm btn-primary px-4 rounded-pill" onClick={handleSavePaymentDetails}>Save UPI Details</button>
                </div>
              </div>
            )}
          </div>


      <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
        <div className="p-3 border-bottom bg-light">
          <h5 className="fw-bold mb-0 text-dark">Customer Payments Log</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="text-uppercase text-secondary fw-bold text-xxs py-3 ps-4">Ref ID</th>
                <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Customer</th>
                <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Amount Paid</th>
                <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Method</th>
                <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Payment Proof</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">No reservations recorded yet.</td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id}>
                    <td className="fw-bold text-secondary text-xxs ps-4">#{b.id}</td>
                    <td className="fw-bold text-dark">{b.name}</td>
                    <td className="fw-bold text-success">₹{b.total_paid}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{b.payment_method || 'N/A'}</span>
                    </td>
                    <td>
                      {b.payment_proof || b.payment_screenshot ? (
                        <a href={b.payment_proof || b.payment_screenshot} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill px-3 py-1">View Image</a>
                      ) : (
                        <span className="text-muted text-xs">No Proof</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAiLeadsTab = () => (
    <div className="mt-2 text-start">
      {/* Top Header Card */}
      <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
        <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 position-relative z-1">
          <div>
            <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>AI Chatbot Leads</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Review customer contact information captured by the AI assistant.
            </p>
          </div>
          <div style={{ minWidth: '320px', maxWidth: '420px', width: '100%' }}>
            <AIChatbotToggle />
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table align-middle table-hover small">
          <thead className="table-light">
            <tr>
              <th>Lead ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {aiLeads.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">No AI leads captured yet.</td>
              </tr>
            ) : (
              aiLeads.map(lead => (
                <tr key={lead.id}>
                  <td className="fw-bold text-secondary text-xxs">#{lead.id}</td>
                  <td className="fw-bold text-dark">{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.created_at}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary fw-bold"
                      onClick={() => setSelectedAiLeadChat(lead)}
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {selectedAiLeadChat && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-bottom border-light">
                <h5 className="modal-title fw-bold">Chat History: {selectedAiLeadChat.name} ({selectedAiLeadChat.phone})</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedAiLeadChat(null)}></button>
              </div>
              <div className="modal-body bg-light" style={{ maxHeight: '60vh' }}>
                {!selectedAiLeadChat.chat_history ? (
                  <div className="text-center text-muted py-4">No chat history available.</div>
                ) : (
                  (() => {
                    try {
                      const history = JSON.parse(selectedAiLeadChat.chat_history);
                      return (
                        <div className="d-flex flex-column gap-3">
                          {history.map((msg, i) => (
                            <div key={i} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                              <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '80%' }}>
                                <div className="fw-bold small mb-1 opacity-75">{msg.role === 'user' ? 'User' : 'AI Assistant'}</div>
                                <div>{msg.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch(e) {
                      return <div className="text-danger">Failed to parse chat history.</div>;
                    }
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  );

  const handleSearchLiveHotels = async () => {
    if (!hotelLocation) return alert("Please enter a location");
    if (hotelCheckIn && hotelCheckOut) {
      const val = validateBookingDates(hotelCheckIn, hotelCheckOut, { allowSameDay: false });
      if (!val.valid) return alert(val.error);
    }
    setIsSearchingHotels(true);
    try {
      const results = hotels.filter(h => 
        hotelLocation.toLowerCase() === 'goa' || 
        hotelLocation.toLowerCase() === 'all goa' || 
        h.area.toLowerCase().includes(hotelLocation.toLowerCase()) || 
        h.name.toLowerCase().includes(hotelLocation.toLowerCase())
      );
      setLiveHotels(results || []);
    } catch (err) {
      alert("Failed to fetch hotels: " + err.message);
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const renderHotelTab = () => (
    <div className="mt-2 text-start">
      {/* Top Header Card */}
      <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
        <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
          <div>
            <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Hotel Search Management</h4>
            <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
              Search for live hotel prices and availability using SerpApi.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-3 rounded-pill shadow-sm d-flex flex-wrap flex-md-nowrap gap-3 align-items-center border mb-4" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="col-md-3">
          <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Location</label>
          <input type="text" className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" placeholder="e.g., Goa, Mumbai" value={hotelLocation} onChange={e => setHotelLocation(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Check-in</label>
          <input 
            type="date" 
            className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" 
            min={getTodayDateStr()}
            value={hotelCheckIn} 
            onChange={e => {
              setHotelCheckIn(e.target.value);
              if (!hotelCheckOut || hotelCheckOut <= e.target.value) {
                setHotelCheckOut(getNextDayDateStr(e.target.value));
              }
            }} 
          />
        </div>
        <div className="col-md-3">
          <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Check-out</label>
          <input 
            type="date" 
            className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" 
            min={getNextDayDateStr(hotelCheckIn || getTodayDateStr())}
            value={hotelCheckOut} 
            onChange={e => {
              if (e.target.value <= hotelCheckIn) {
                alert("Check-out date must be after check-in date.");
                setHotelCheckOut(getNextDayDateStr(hotelCheckIn));
                return;
              }
              setHotelCheckOut(e.target.value);
            }} 
          />
        </div>
        <div className="col-md-1">
          <label className="form-label text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Adults</label>
          <input type="number" min="1" className="form-control border-0 bg-light p-2 shadow-none fw-bold text-dark" value={hotelAdults} onChange={e => setHotelAdults(e.target.value)} />
        </div>
        <div className="col-md-2 ms-auto">
          <button 
            className="btn text-white px-4 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center w-100"
            onClick={handleSearchLiveHotels}
            disabled={isSearchingHotels}
            style={{ background: '#FF6333', height: '42px' }}
          >
            {isSearchingHotels ? <span className="spinner-border spinner-border-sm"></span> : 'Search'}
          </button>
        </div>
      </div>
      
      {liveHotels && (
        <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
          <div className="p-3 border-bottom bg-light">
            <h5 className="fw-bold mb-0 text-dark">Live Search Results ({liveHotels.length})</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-uppercase text-secondary fw-bold text-xxs py-3 ps-4">Hotel</th>
                  <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Rating / Class</th>
                  <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Amenities</th>
                  <th className="text-uppercase text-secondary fw-bold text-xxs py-3">Price (Per Night)</th>
                </tr>
              </thead>
              <tbody>
                {liveHotels.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">No hotels found for this criteria.</td>
                  </tr>
                ) : (
                  liveHotels.map((h, i) => (
                    <tr key={i}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <img src={h.image} alt={h.name} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          <div>
                            <div className="fw-bold text-dark">{h.name}</div>
                            <div className="text-muted text-xxs">{h.area}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-warning fw-bold small mb-1">
                          <Star size={14} fill="currentColor" /> {h.rating}
                        </div>
                        <div className="text-muted text-xxs">{h.stars} Star Property</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-wrap" style={{maxWidth: '200px'}}>{h.amenities}</span>
                      </td>
                      <td className="fw-bold text-success fs-6">
                        ₹{h.price}
                        <div className="mt-2">
                           <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => handleAddMasterHotel(h)}>Save to Master</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );


  const renderFlightMasterTab = () => {
    const handleDeleteFlight = async (id) => {
      if (!window.confirm("Are you sure you want to delete this flight from the master table?")) return;
      try {
        await api.deleteMasterFlight(id);
        const fl = await api.fetchFlights();
        setMasterFlights(fl);
      } catch (e) {
        alert(e.message);
      }
    };

    return (
      <div className="mt-2">
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Flight Master Table</h4>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Manage flights available for packages.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Airline</th>
                  <th>Flight No</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Departs</th>
                  <th>Arrives</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {masterFlights.map((f, i) => (
                  <tr key={i}>
                    <td className="fw-bold">{f.airline}</td>
                    <td>{f.flight_number || '-'}</td>
                    <td>{f.from_loc}</td>
                    <td>{f.to_loc}</td>
                    <td>{f.departure_time}</td>
                    <td>{f.arrival_time}</td>
                    <td className="text-success fw-bold">₹{f.price}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFlight(f.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {masterFlights.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No flights in master table. Search live and add some.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderHotelMasterTab = () => {
    const handleDeleteHotel = async (id) => {
      if (!window.confirm("Are you sure you want to delete this hotel from the master table?")) return;
      try {
        await api.deleteMasterHotel(id);
        const ht = await api.fetchHotels();
        setMasterHotels(ht);
      } catch (e) {
        alert(e.message);
      }
    };

    return (
      <div className="mt-2">
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Hotel Master Table</h4>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Manage hotels available for packages.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-4 shadow-sm border overflow-hidden p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Hotel Name</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {masterHotels.map((h, i) => (
                  <tr key={i}>
                    <td className="fw-bold">{h.name}</td>
                    <td>{h.location}</td>
                    <td>{h.rating} Star</td>
                    <td className="text-success fw-bold">₹{h.price}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteHotel(h.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {masterHotels.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No hotels in master table. Search live and add some.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCouponsTab = () => {

    const handleCreateCoupon = async (e) => {
      e.preventDefault();
      const code = (newCoupon.code || '').trim().toUpperCase();
      const val = parseInt(newCoupon.discount_value, 10);
      if (!code || isNaN(val) || val <= 0) {
        alert("Please provide a valid coupon code and discount amount greater than 0.");
        return;
      }
      try {
        await api.createCoupon({ code, discount_value: val });
        const res = await api.getCoupons();
        setCoupons(Array.isArray(res) ? res : []);
        setNewCoupon({ code: '', discount_value: '' });
      } catch (err) {
        alert("Failed to create coupon: " + (err.message || 'Server error'));
      }
    };

    const handleDeleteCoupon = async (id, code) => {
      if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
        try {
          await api.deleteCoupon(id);
          const res = await api.getCoupons();
          setCoupons(Array.isArray(res) ? res : []);
        } catch (err) {
          alert("Failed to delete coupon: " + (err.message || 'Server error'));
        }
      }
    };

    return (
      <div className="mt-2 text-start">
        {/* Top Header Card */}
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-extrabold mb-0 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Manage Coupons</h4>
                <span className="badge bg-primary rounded-pill">{coupons.length} Active</span>
              </div>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Create and manage promotional discount coupons for customer bookings.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateCoupon} className="bg-white p-4 rounded-3 shadow-sm border mb-4">
          <h6 className="fw-bold mb-3">Add New Discount Coupon</h6>
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-muted mb-1">Coupon Code</label>
              <input 
                type="text" 
                className="form-control text-uppercase fw-bold" 
                placeholder="e.g. SUMMER500" 
                value={newCoupon.code} 
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
                required 
              />
            </div>
            <div className="col-md-5">
              <label className="form-label small fw-bold text-muted mb-1">Discount Amount (₹)</label>
              <input 
                type="number" 
                className="form-control fw-semibold" 
                placeholder="e.g. 500" 
                value={newCoupon.discount_value} 
                onChange={e => setNewCoupon({...newCoupon, discount_value: e.target.value})} 
                min="1"
                required 
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm">
                + Create
              </button>
            </div>
          </div>
        </form>

        <div className="card shadow-sm border rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3 fw-bold small text-uppercase text-secondary">Coupon Code</th>
                  <th className="py-3 px-3 fw-bold small text-uppercase text-secondary">Discount Value</th>
                  <th className="py-3 px-3 fw-bold small text-uppercase text-secondary">Status</th>
                  <th className="py-3 px-3 fw-bold small text-uppercase text-secondary text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td className="px-3 py-3">
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-bold font-monospace" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                        🏷️ {c.code}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-success fw-bold fs-6">
                      ₹{parseInt(c.discount_value || 0).toLocaleString('en-IN')} OFF
                    </td>
                    <td className="px-3 py-3">
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 fw-bold small">
                        Active
                      </span>
                    </td>
                    <td className="px-3 py-3 text-end">
                      <button 
                        className="btn btn-sm btn-outline-danger px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        title="Delete Coupon"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      <p className="mb-0">No active coupons found. Create your first discount coupon above!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };



  const renderBillingTab = () => {
    return (
      <div className="mt-2 text-start">
        {/* Top Header Card */}
        <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
          <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
            <div>
              <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Admin Billing Details</h4>
              <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                Your current subscription and billing information.
              </p>
            </div>
          </div>
        </div>
        
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card luxury-card p-4">
              <h5 className="fw-bold mb-3">Subscription Overview</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Monthly Plan Price</span>
                <span className="fw-bold fs-5 text-success">₹{currentUser?.billing_price || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary">Status</span>
                <span className="badge bg-success">Active</span>
              </div>
              <hr />
              <p className="text-muted small">
                This amount is billed monthly for your admin access. For any upgrades or changes, please contact the Superadmin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'packages': return renderPackagesTab();
      case 'vendors': return renderVendorsTab();
      case 'bookings': return renderBookingsTab();
      case 'ai-leads': return renderAiLeadsTab();
      case 'sightseeing':
      case 'admin_activities':
        return <AdminActivitiesManagement currentUser={currentUser} />;
      case 'payment': return renderPaymentManagementTab();
      case 'flight': return renderFlightTab();
      case 'flight-master': return renderFlightMasterTab();
      case 'hotel': return renderHotelTab();
      case 'hotel-master': return renderHotelMasterTab();
      case 'coupons': return renderCouponsTab();
      case 'wallets': return <AdminWalletSettlements currentUser={currentUser} />;
      case 'dashboard':
      case 'overview':
      default:
        return renderPackagesTab();
    }
  };

  return (
    <div className={`container-fluid ${activeTab === 'whatsapp' ? 'p-0' : 'py-2 px-0'}`}>
      <div className="text-start w-100 h-100">
        {renderContent()}
      </div>
    </div>
  );
}
