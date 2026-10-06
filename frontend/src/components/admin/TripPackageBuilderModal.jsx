import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Compass, MapPin, Calendar, Clock, Hotel, Car, Plane,
  Users, Check, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon,
  DollarSign, Shield, Sparkles, Upload, Eye, FileText, CheckCircle2,
  Info, AlertCircle, HelpCircle, ChevronRight, Utensils
} from 'lucide-react';
import * as api from '../../services/api';

export default function TripPackageBuilderModal({
  isOpen,
  onClose,
  onSave,
  editingPackage = null,
  hotels = [],
  cars = [],
  bikes = [],
  flights = []
}) {
  if (!isOpen) return null;

  // Active builder navigation tab
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'itinerary', 'hotel', 'vehicle', 'driver', 'sightseeing', 'activity', 'flight', 'addons', 'pricing', 'media'

  // Dynamic inventories loaded if not provided
  const [liveAddOns, setLiveAddOns] = useState([]);
  const [liveFlights, setLiveFlights] = useState(flights || []);

  useEffect(() => {
    let isMounted = true;
    api.getAddOns().then(data => {
      if (isMounted && Array.isArray(data)) setLiveAddOns(data);
    }).catch(() => {});

    if (!flights || flights.length === 0) {
      api.fetchFlights().then(data => {
        if (isMounted && Array.isArray(data)) setLiveFlights(data);
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [flights]);

  // Filter sightseeing and activities from add_ons table
  const inventorySightseeing = useMemo(() => {
    return liveAddOns.filter(a => (a.type || '').toLowerCase() === 'sightseeing');
  }, [liveAddOns]);

  const inventoryActivities = useMemo(() => {
    return liveAddOns.filter(a => (a.type || '').toLowerCase() === 'activity');
  }, [liveAddOns]);

  // ─── 1. BASIC INFORMATION ──────────────────────────────────
  const [pkgName, setPkgName] = useState('');
  const [pkgTag, setPkgTag] = useState('Holiday Package');
  const [pkgType, setPkgType] = useState('Trip Package');
  const [pkgDestination, setPkgDestination] = useState('Goa, India');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgCurrency, setPkgCurrency] = useState('INR');
  const [pkgCostingType, setPkgCostingType] = useState('One Time Package Cost');
  const [pkgPaxAdult, setPkgPaxAdult] = useState(2);
  const [pkgPaxChild, setPkgPaxChild] = useState(0);
  const [pkgPaxInfant, setPkgPaxInfant] = useState(0);
  const [pkgStatus, setPkgStatus] = useState('published');
  const [destSuggestions, setDestSuggestions] = useState([]);

  // ─── 2. DAY-WISE ITINERARY ─────────────────────────────────
  const [dayWiseItinerary, setDayWiseItinerary] = useState([
    {
      day: 1,
      title: 'Arrival in Goa & Beach Leisure',
      description: 'Check in to the resort, relax by the pool, and enjoy the sunset along the coast.',
      morning: 'Airport / Station pickup and resort check-in',
      afternoon: 'Leisure and beachside relaxation',
      evening: 'Sunset walk and beach shacks exploration',
      night: 'Welcome dinner and relaxation',
      stay: 'Beachfront Resort',
      sightseeing: 'Calangute Beach, Baga Beach',
      activities: 'Beach walk & waterside relaxation',
      meals: ['Dinner'],
      image: ''
    },
    {
      day: 2,
      title: 'North Goa Heritage & Coastal Highlights',
      description: 'Explore scenic forts, historical Portuguese architecture, and coastal viewpoints.',
      morning: 'Buffet breakfast at resort',
      afternoon: 'Fort Aguada and Sinquerim coastline tour',
      evening: 'Anjuna & Vagator sunset cliffs',
      night: 'Dinner at beachfront restaurant',
      stay: 'Beachfront Resort',
      sightseeing: 'Fort Aguada, Anjuna Beach, Chapora Fort',
      activities: 'Fort photography & coastal exploration',
      meals: ['Breakfast'],
      image: ''
    },
    {
      day: 3,
      title: 'South Goa Culture & Mandovi Sunset Cruise',
      description: 'Visit iconic Old Goa churches, Mangueshi temple, and enjoy a vibrant Mandovi river cruise.',
      morning: 'Breakfast and drive towards Old Goa',
      afternoon: 'Basilica of Bom Jesus and Se Cathedral tour',
      evening: '1-Hour Mandovi River Sunset Yacht / Cruise',
      night: 'Leisure evening and dinner in Panaji',
      stay: 'Beachfront Resort',
      sightseeing: 'Basilica of Bom Jesus, Se Cathedral, Miramar Beach',
      activities: 'Mandovi Sunset River Cruise',
      meals: ['Breakfast'],
      image: ''
    },
    {
      day: 4,
      title: 'Departure with Sweet Goan Memories',
      description: 'Breakfast, souvenir shopping at local market, and transfer to airport/station.',
      morning: 'Breakfast and leisure check-out',
      afternoon: 'Transfer to Airport / Railway Station',
      evening: 'Departure',
      night: '',
      stay: 'Check-out',
      sightseeing: 'Local Panaji Souvenir Market',
      activities: 'Souvenir shopping',
      meals: ['Breakfast'],
      image: ''
    }
  ]);

  // Duration auto-calculation
  const calculatedDuration = useMemo(() => {
    const days = Math.max(1, dayWiseItinerary.length);
    const nights = Math.max(1, days - 1);
    return `${nights} Nights / ${days} Days`;
  }, [dayWiseItinerary.length]);

  // ─── 3. HOTEL CONFIGURATION ────────────────────────────────
  const [hotelIncluded, setHotelIncluded] = useState(true);
  const [hotelSource, setHotelSource] = useState('existing'); // 'existing' | 'custom'
  const [hotelSelectionType, setHotelSelectionType] = useState('specific'); // 'specific' | 'category'
  const [hotelInventoryId, setHotelInventoryId] = useState('');
  const [hotelCategory, setHotelCategory] = useState('4 Star');
  const [hotelRoomType, setHotelRoomType] = useState('Deluxe AC Room');
  const [hotelCustom, setHotelCustom] = useState({
    name: 'W Goa Beach Resort & Spa',
    category: '5 Star',
    room_type: 'Ocean View Suite',
    location: 'Vagator Beach, North Goa',
    description: 'Ultra-luxury 5-star beachfront resort featuring private ocean-facing balconies and infinity pool.',
    meal_plan: 'Breakfast Included (CP)',
    amenities: 'Free WiFi, Swimming Pool, Daily Breakfast, AC, Spa',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
  });

  // ─── 4. VEHICLE CONFIGURATION ──────────────────────────────
  const [vehicleIncluded, setVehicleIncluded] = useState(true);
  const [vehicleSource, setVehicleSource] = useState('existing'); // 'existing' | 'custom'
  const [vehicleType, setVehicleType] = useState('car'); // 'car' | 'bike'
  const [vehicleInventoryId, setVehicleInventoryId] = useState('');
  const [vehicleCustom, setVehicleCustom] = useState({
    type: 'Car',
    name: 'Toyota Innova Crysta',
    brand: 'Toyota',
    model: 'Innova Crysta',
    category: 'SUV / MUV',
    transmission: 'Automatic',
    fuel: 'Diesel',
    seats: '7 Seater',
    description: 'Premium comfortable 7-seater AC SUV with spacious luggage compartment and verified driver/self-drive.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80'
  });

  // ─── 5. DRIVER SERVICE (Safeguards #3 & #4) ─────────────────
  const [driverIncluded, setDriverIncluded] = useState(1); // 1 = Yes, 0 = No
  const [driverType, setDriverType] = useState('full_day'); // 'pickup_drop' | 'full_day' | 'customer_choice'
  const [driverPricingType, setDriverPricingType] = useState('included'); // 'included' | 'additional_fee'
  const [driverAmount, setDriverAmount] = useState(1500); // driver payable amount

  // ─── 6. SIGHTSEEING CONFIGURATION ──────────────────────────
  const [sightseeingSource, setSightseeingSource] = useState('custom'); // 'existing' | 'custom'
  const [selectedInventorySightseeingId, setSelectedInventorySightseeingId] = useState('');
  const [sightseeingPlaces, setSightseeingPlaces] = useState([
    'Fort Aguada', 'Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Mandovi River Cruise'
  ]);
  const [customSightseeingForm, setCustomSightseeingForm] = useState({
    name: '',
    location: '',
    description: '',
    image: ''
  });

  // ─── 7. ACTIVITY CONFIGURATION ─────────────────────────────
  const [activityIncluded, setActivityIncluded] = useState(true);
  const [activitySource, setActivitySource] = useState('existing'); // 'existing' | 'custom'
  const [selectedInventoryActivityId, setSelectedInventoryActivityId] = useState('');
  const [packageActivitiesList, setPackageActivitiesList] = useState([
    { name: 'Mandovi Sunset River Cruise', duration: '1 Hour', price: 600, location: 'Panaji', description: 'Scenic Mandovi river cruise with live DJ and Goan folk performance.' }
  ]);
  const [customActivityForm, setCustomActivityForm] = useState({
    name: '',
    description: '',
    location: 'Goa',
    duration: '2 Hours',
    price: 1200,
    image: ''
  });

  // ─── 8. FLIGHT CONFIGURATION ───────────────────────────────
  const [withFlight, setWithFlight] = useState(false);
  const [flightSource, setFlightSource] = useState('existing'); // 'existing' | 'custom'
  const [flightInventoryId, setFlightInventoryId] = useState('');
  const [isFlightCustomizable, setIsFlightCustomizable] = useState(true);
  const [baseFlightPrice, setBaseFlightPrice] = useState(5000);
  const [pkgPriceWithFlight, setPkgPriceWithFlight] = useState(19999);
  const [flightCustom, setFlightCustom] = useState({
    airline: 'IndiGo / Air India Express',
    flight_number: '6E-204 / AI-840',
    departure_city: 'Mumbai / Delhi',
    arrival_city: 'Goa (GOI / GOX)',
    departure_time: '08:30 AM',
    arrival_time: '10:45 AM'
  });

  // ─── 9. LEGACY PACKAGE ADD-ONS (Requirement 9) ─────────────
  const [pkgAddOns, setPkgAddOns] = useState([]);
  const [newAddOn, setNewAddOn] = useState({
    title: '',
    type: 'Activity',
    location: '',
    price: '',
    duration: '',
    description: '',
    image_url: ''
  });

  // ─── 10. PRICING & POLICIES ────────────────────────────────
  const [pkgPrice, setPkgPrice] = useState(14999);
  const [pkgAdvancePercentage, setPkgAdvancePercentage] = useState(25);
  const [foodIncluded, setFoodIncluded] = useState('Daily Buffet Breakfast Included');
  const [pickupDropIncluded, setPickupDropIncluded] = useState('Airport Pickup & Drop Included');
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Free cancellation up to 7 days before trip start date. 50% refund between 7-3 days. Non-refundable within 72 hours of departure.'
  );
  const [inclusions, setInclusions] = useState([
    'Accommodation in sanitized selected hotel / resort',
    'Dedicated vehicle with fuel & parking permits',
    'Daily buffet breakfast at hotel',
    'Airport / Railway station pickup and drop transfers',
    'Guided sightseeing tours as per itinerary',
    '24/7 on-trip concierge and emergency driver support',
    'All applicable state taxes and tolls'
  ]);
  const [newInclusionInput, setNewInclusionInput] = useState('');

  const [exclusions, setExclusions] = useState([
    'Airfare / Train tickets unless explicitly selected',
    'Personal expenses, laundry, tips and monument entry tickets',
    'Watersports and adventure activities not mentioned in itinerary',
    'Meals other than breakfast',
    'Early check-in and late check-out charges'
  ]);
  const [newExclusionInput, setNewExclusionInput] = useState('');

  // ─── 11. MEDIA & IMAGES ────────────────────────────────────
  const [primaryImage, setPrimaryImage] = useState(
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80'
  );
  const [galleryImages, setGalleryImages] = useState([
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or populate from editingPackage
  useEffect(() => {
    if (!editingPackage) {
      if (hotels.length > 0) setHotelInventoryId(hotels[0].id);
      if (cars.length > 0) setVehicleInventoryId(cars[0].id);
      if (liveFlights.length > 0) setFlightInventoryId(liveFlights[0].id);
      return;
    }

    const p = editingPackage;
    setPkgName(p.name || p.package_name || '');
    setPkgTag(p.tag || 'Holiday Package');
    setPkgType(p.package_type || 'Trip Package');
    setPkgDestination(p.destination || 'Goa, India');
    setPkgDescription(p.description || '');
    setPkgCurrency(p.currency || 'INR');
    setPkgCostingType(p.costing_type || 'One Time Package Cost');
    setPkgStatus(p.status === 'draft' ? 'draft' : 'published');

    // Parse pax
    if (p.pax) {
      const a = p.pax.match(/(\d+)\s*A/i);
      const c = p.pax.match(/(\d+)\s*C/i);
      const inf = p.pax.match(/(\d+)\s*I/i);
      if (a) setPkgPaxAdult(parseInt(a[1], 10));
      if (c) setPkgPaxChild(parseInt(c[1], 10));
      if (inf) setPkgPaxInfant(parseInt(inf[1], 10));
    }

    // Itinerary
    if (p.day_wise_itinerary) {
      try {
        const parsed = typeof p.day_wise_itinerary === 'string' ? JSON.parse(p.day_wise_itinerary) : p.day_wise_itinerary;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDayWiseItinerary(parsed);
        }
      } catch (e) {}
    }

    // Hotel
    setHotelIncluded(p.hotel_included !== 'No Hotel Included');
    setHotelSource(p.hotel_source || 'existing');
    setHotelSelectionType(p.hotel_selection_type || 'specific');
    setHotelInventoryId(p.hotel_inventory_id || (hotels[0]?.id || ''));
    setHotelCategory(p.hotel_category || '4 Star');
    setHotelRoomType(p.hotel_room_type || 'Deluxe AC Room');
    if (p.hotel_custom_json) {
      try {
        const c = typeof p.hotel_custom_json === 'string' ? JSON.parse(p.hotel_custom_json) : p.hotel_custom_json;
        if (c && typeof c === 'object') setHotelCustom(prev => ({ ...prev, ...c }));
      } catch (e) {}
    }

    // Vehicle
    setVehicleIncluded(!!p.car_included || p.vehicle_source === 'custom');
    setVehicleSource(p.vehicle_source || 'existing');
    setVehicleType(p.vehicle_type || 'car');
    setVehicleInventoryId(p.vehicle_inventory_id || (cars[0]?.id || bikes[0]?.id || ''));
    if (p.vehicle_custom_json) {
      try {
        const vc = typeof p.vehicle_custom_json === 'string' ? JSON.parse(p.vehicle_custom_json) : p.vehicle_custom_json;
        if (vc && typeof vc === 'object') setVehicleCustom(prev => ({ ...prev, ...vc }));
      } catch (e) {}
    }

    // Driver
    setDriverIncluded(p.driver_included !== undefined ? (p.driver_included ? 1 : 0) : 1);
    setDriverType(p.driver_type || 'full_day');
    setDriverPricingType(p.driver_pricing_type || 'included');
    setDriverAmount(p.driver_amount !== undefined ? Number(p.driver_amount) : 1500);

    // Sightseeing
    setSightseeingSource(p.sightseeing_source || 'custom');
    setSelectedInventorySightseeingId(p.sightseeing_inventory_id || '');
    if (p.sightseeing_custom_json) {
      try {
        const sc = typeof p.sightseeing_custom_json === 'string' ? JSON.parse(p.sightseeing_custom_json) : p.sightseeing_custom_json;
        if (Array.isArray(sc)) setSightseeingPlaces(sc);
      } catch (e) {}
    } else if (p.places_included) {
      setSightseeingPlaces(p.places_included.split('|').map(s => s.trim()).filter(Boolean));
    }

    // Activities
    setActivitySource(p.activity_source || 'existing');
    setSelectedInventoryActivityId(p.activity_inventory_id || '');
    if (p.activity_custom_json) {
      try {
        const ac = typeof p.activity_custom_json === 'string' ? JSON.parse(p.activity_custom_json) : p.activity_custom_json;
        if (Array.isArray(ac)) setPackageActivitiesList(ac);
        else if (ac && typeof ac === 'object') setPackageActivitiesList([ac]);
      } catch (e) {}
    }

    // Legacy add-ons
    if (p.package_addons_json) {
      try {
        const addOnsParsed = typeof p.package_addons_json === 'string' ? JSON.parse(p.package_addons_json) : p.package_addons_json;
        if (Array.isArray(addOnsParsed)) setPkgAddOns(addOnsParsed);
      } catch (e) {}
    }

    // Flight
    setWithFlight(!!p.price_with_flight || !!p.flights_included);
    setFlightSource(p.flight_source || 'existing');
    setFlightInventoryId(p.flight_inventory_id || (liveFlights[0]?.id || ''));
    setIsFlightCustomizable(Number(p.is_flight_customizable) === 1);
    setBaseFlightPrice(p.base_flight_price ? Number(p.base_flight_price) : 5000);
    setPkgPriceWithFlight(p.price_with_flight || 19999);
    if (p.flight_custom_json) {
      try {
        const fc = typeof p.flight_custom_json === 'string' ? JSON.parse(p.flight_custom_json) : p.flight_custom_json;
        if (fc && typeof fc === 'object') setFlightCustom(prev => ({ ...prev, ...fc }));
      } catch (e) {}
    }

    // Prices & Policies
    setPkgPrice(p.price || 14999);
    setPkgAdvancePercentage(p.advance_percentage || 25);
    setFoodIncluded(p.food_included || 'Daily Buffet Breakfast Included');
    setPickupDropIncluded(p.pickup_drop_included || 'Airport Pickup & Drop Included');
    setCancellationPolicy(p.cancellation_policy || cancellationPolicy);

    // Inclusions & Exclusions
    if (p.inclusions_exclusions_json) {
      try {
        const ie = typeof p.inclusions_exclusions_json === 'string' ? JSON.parse(p.inclusions_exclusions_json) : p.inclusions_exclusions_json;
        if (Array.isArray(ie?.inclusions)) setInclusions(ie.inclusions);
        if (Array.isArray(ie?.exclusions)) setExclusions(ie.exclusions);
      } catch (e) {}
    }

    // Images
    const pImg = p.imageUrl || p.image || p.image_url || '';
    if (pImg) setPrimaryImage(pImg);

    let gallery = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      gallery = p.images;
    } else if (p.images_json) {
      try {
        const parsed = typeof p.images_json === 'string' ? JSON.parse(p.images_json) : p.images_json;
        if (Array.isArray(parsed)) gallery = parsed;
      } catch (e) {}
    } else if (pImg) {
      gallery = [pImg];
    }
    if (gallery.length > 0) setGalleryImages(gallery);
  }, [editingPackage, hotels, cars, bikes, liveFlights]);

  // Destination search via OpenStreetMap Nominatim
  const handleDestinationSearch = (query) => {
    setPkgDestination(query);
    if (!query || query.length < 3) {
      setDestSuggestions([]);
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDestSuggestions(data.slice(0, 5));
        }
      })
      .catch(() => {});
  };

  // Day Itinerary Operations (Move Up, Move Down, Resequence)
  const handleAddDay = () => {
    const nextDayNum = dayWiseItinerary.length + 1;
    setDayWiseItinerary([
      ...dayWiseItinerary,
      {
        day: nextDayNum,
        title: `Day ${nextDayNum} Exploration`,
        description: 'Enjoy leisurely exploration and curated sightseeing in Goa.',
        morning: 'Buffet breakfast at resort',
        afternoon: 'Sightseeing tour',
        evening: 'Sunset relaxation',
        night: 'Dinner & stay',
        stay: 'Hotel / Resort Stay',
        sightseeing: '',
        activities: '',
        meals: ['Breakfast'],
        image: ''
      }
    ]);
  };

  const handleRemoveDay = (index) => {
    if (dayWiseItinerary.length <= 1) {
      alert('Package must contain at least 1 day.');
      return;
    }
    const updated = dayWiseItinerary.filter((_, i) => i !== index).map((d, idx) => ({ ...d, day: idx + 1 }));
    setDayWiseItinerary(updated);
  };

  const handleMoveDayUp = (index) => {
    if (index === 0) return;
    const items = [...dayWiseItinerary];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    setDayWiseItinerary(items.map((d, idx) => ({ ...d, day: idx + 1 })));
  };

  const handleMoveDayDown = (index) => {
    if (index === dayWiseItinerary.length - 1) return;
    const items = [...dayWiseItinerary];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    setDayWiseItinerary(items.map((d, idx) => ({ ...d, day: idx + 1 })));
  };

  const handleDayFieldChange = (index, field, value) => {
    const updated = [...dayWiseItinerary];
    updated[index] = { ...updated[index], [field]: value };
    setDayWiseItinerary(updated);
  };

  // Image Upload handler
  const handleImageFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) callback(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Sightseeing Actions
  const handleAddInventorySightseeing = (item) => {
    if (!item) return;
    const placeName = item.name || item.title;
    if (placeName && !sightseeingPlaces.includes(placeName)) {
      setSightseeingPlaces([...sightseeingPlaces, placeName]);
    }
  };

  const handleAddCustomSightseeing = () => {
    if (!customSightseeingForm.name.trim()) return;
    const name = customSightseeingForm.name.trim();
    if (!sightseeingPlaces.includes(name)) {
      setSightseeingPlaces([...sightseeingPlaces, name]);
    }
    setCustomSightseeingForm({ name: '', location: '', description: '', image: '' });
  };

  // Activity Actions
  const handleAddInventoryActivity = (item) => {
    if (!item) return;
    const act = {
      name: item.name || item.title,
      description: item.description || '',
      location: item.location || 'Goa',
      duration: item.duration || '2 Hours',
      price: item.price || 0,
      image: item.image || item.image_url || ''
    };
    setPackageActivitiesList([...packageActivitiesList, act]);
  };

  const handleAddCustomActivity = () => {
    if (!customActivityForm.name.trim()) return;
    setPackageActivitiesList([...packageActivitiesList, { ...customActivityForm }]);
    setCustomActivityForm({ name: '', description: '', location: 'Goa', duration: '2 Hours', price: 1200, image: '' });
  };

  // Legacy Add-ons actions (Requirement 9)
  const handleAddLegacyAddOn = () => {
    if (!newAddOn.title.trim()) return;
    setPkgAddOns([...pkgAddOns, { ...newAddOn, id: 'addon-' + Date.now() }]);
    setNewAddOn({ title: '', type: 'Activity', location: '', price: '', duration: '', description: '', image_url: '' });
  };

  // Live Inventory Selection Helpers (Auto-sync with package gallery images)
  const handleSelectInventoryHotel = (hotelId) => {
    setHotelInventoryId(hotelId);
    const h = hotels.find(item => String(item.id) === String(hotelId));
    if (h) {
      if (h.stars) {
        setHotelCategory(`${h.stars} Star`);
      }
      const hImg = h.image || h.image_url || h.imageUrl;
      if (hImg) {
        setGalleryImages(prev => {
          const updated = [...prev];
          if (updated.length >= 2) {
            updated[1] = hImg;
          } else {
            updated.push(hImg);
          }
          return updated;
        });
      }
    }
  };

  const handleSelectInventoryVehicle = (vehId, overrideType) => {
    setVehicleInventoryId(vehId);
    const currentType = overrideType || vehicleType;
    const pool = currentType === 'bike' ? bikes : cars;
    const v = pool.find(item => String(item.id) === String(vehId));
    const vImg = v?.image || v?.image_url || v?.imageUrl;
    if (vImg) {
      setGalleryImages(prev => {
        const updated = [...prev];
        const tharIdx = updated.findIndex(img => typeof img === 'string' && (img.includes('1533473359331') || img.includes('1533473359')));
        if (tharIdx !== -1) {
          updated[tharIdx] = vImg;
        } else if (updated.length >= 3) {
          updated[2] = vImg;
        } else {
          updated.push(vImg);
        }
        return updated;
      });
    }
  };

  const handleVehicleTypeChange = (newType) => {
    setVehicleType(newType);
    const pool = newType === 'bike' ? bikes : cars;
    if (pool.length > 0) {
      handleSelectInventoryVehicle(pool[0].id, newType);
    }
  };

  // Form Submission
  const handleSubmit = async (targetStatus) => {
    if (!pkgName.trim()) {
      alert('Please enter a package name.');
      setActiveTab('basic');
      return;
    }
    if (!pkgPrice || Number(pkgPrice) <= 0) {
      alert('Please enter a valid package price.');
      setActiveTab('pricing');
      return;
    }

    // Determine legacy hotel string for 100% backward compatibility
    let legacyHotelIncluded = 'No Hotel Included';
    if (hotelIncluded) {
      if (hotelSource === 'existing') {
        if (hotelSelectionType === 'specific') {
          const matchedHotel = hotels.find(h => String(h.id) === String(hotelInventoryId));
          legacyHotelIncluded = matchedHotel ? `${matchedHotel.name} (${hotelRoomType})` : `${hotelCategory} (${hotelRoomType})`;
        } else {
          legacyHotelIncluded = `${hotelCategory} (${hotelRoomType})`;
        }
      } else {
        legacyHotelIncluded = `${hotelCustom.name} (${hotelCustom.room_type || hotelCustom.category})`;
      }
    }

    // Determine legacy car string for 100% backward compatibility (No hardcoded Mahindra Thar!)
    let legacyCarIncluded = null;
    if (vehicleIncluded) {
      if (vehicleSource === 'existing') {
        const pool = vehicleType === 'bike' ? bikes : cars;
        const matchedVeh = pool.find(v => String(v.id) === String(vehicleInventoryId));
        legacyCarIncluded = matchedVeh ? matchedVeh.name : (vehicleType === 'bike' ? 'Standard 2-Wheeler' : 'Self-Drive Sedan / SUV');
      } else {
        legacyCarIncluded = vehicleCustom.name ? `${vehicleCustom.name} (${vehicleCustom.category})` : 'Private Custom Vehicle';
      }
    }

    // Determine flight string
    let legacyFlightsIncluded = null;
    if (withFlight) {
      if (flightSource === 'existing') {
        const matchedFlight = liveFlights.find(f => String(f.id) === String(flightInventoryId));
        legacyFlightsIncluded = matchedFlight
          ? `${matchedFlight.airline} (${matchedFlight.flight_number}) ${matchedFlight.from_loc} → ${matchedFlight.to_loc}`
          : 'Domestic Return Flight';
      } else {
        legacyFlightsIncluded = `${flightCustom.airline} (${flightCustom.departure_city} → ${flightCustom.arrival_city})`;
      }
    }

    // Ensure finalGallery contains the actual selected vehicle image and hotel image
    let finalGallery = [...galleryImages];
    if (vehicleIncluded) {
      let targetVehImg = null;
      if (vehicleSource === 'existing') {
        const pool = vehicleType === 'bike' ? bikes : cars;
        const matchedVeh = pool.find(v => String(v.id) === String(vehicleInventoryId));
        targetVehImg = matchedVeh?.image || matchedVeh?.image_url || matchedVeh?.imageUrl;
      } else {
        targetVehImg = vehicleCustom.image;
      }
      if (targetVehImg) {
        const tharIdx = finalGallery.findIndex(img => typeof img === 'string' && (img.includes('1533473359331') || img.includes('1533473359')));
        if (tharIdx !== -1) {
          finalGallery[tharIdx] = targetVehImg;
        } else if (!finalGallery.includes(targetVehImg)) {
          if (finalGallery.length >= 3) finalGallery[2] = targetVehImg;
          else finalGallery.push(targetVehImg);
        }
      }
    }
    if (hotelIncluded) {
      let targetHotelImg = null;
      if (hotelSource === 'existing') {
        const matchedHotel = hotels.find(h => String(h.id) === String(hotelInventoryId));
        targetHotelImg = matchedHotel?.image || matchedHotel?.image_url || matchedHotel?.imageUrl;
      } else {
        targetHotelImg = hotelCustom.image;
      }
      if (targetHotelImg && !finalGallery.includes(targetHotelImg)) {
        if (finalGallery.length >= 2) finalGallery[1] = targetHotelImg;
        else finalGallery.push(targetHotelImg);
      }
    }

    const payload = {
      id: editingPackage?.id || ('pkg-' + Date.now()),
      name: pkgName.trim(),
      tag: pkgTag,
      package_type: pkgType,
      currency: pkgCurrency,
      costing_type: pkgCostingType,
      duration: calculatedDuration,
      pax: `${pkgPaxAdult}A ${pkgPaxChild}C ${pkgPaxInfant}I`,
      destination: pkgDestination,
      description: pkgDescription,
      status: targetStatus || pkgStatus,

      // Pricing & Policies
      price: parseInt(pkgPrice, 10),
      price_with_flight: withFlight && pkgPriceWithFlight ? parseInt(pkgPriceWithFlight, 10) : null,
      advance_percentage: parseInt(pkgAdvancePercentage, 10) || 25,

      // Legacy fallback strings for existing views
      hotel_included: legacyHotelIncluded,
      car_included: legacyCarIncluded,
      flights_included: legacyFlightsIncluded,
      food_included: foodIncluded,
      pickup_drop_included: pickupDropIncluded,
      places_included: sightseeingPlaces.join(' | '),

      // Structured Hotel Configuration
      hotel_source: hotelIncluded ? hotelSource : 'none',
      hotel_inventory_id: (hotelIncluded && hotelSource === 'existing' && hotelSelectionType === 'specific') ? hotelInventoryId : null,
      hotel_selection_type: hotelSelectionType,
      hotel_category: hotelCategory,
      hotel_room_type: hotelRoomType,
      hotel_custom_json: (hotelIncluded && hotelSource === 'custom') ? JSON.stringify(hotelCustom) : null,

      // Structured Vehicle Configuration
      vehicle_source: vehicleIncluded ? vehicleSource : 'none',
      vehicle_inventory_id: (vehicleIncluded && vehicleSource === 'existing') ? vehicleInventoryId : null,
      vehicle_type: vehicleType,
      vehicle_custom_json: (vehicleIncluded && vehicleSource === 'custom') ? JSON.stringify(vehicleCustom) : null,

      // Driver Service Configuration (Safeguards #3 & #4)
      driver_included: driverIncluded ? 1 : 0,
      driver_type: driverType,
      driver_pricing_type: driverPricingType,
      driver_amount: driverIncluded ? parseInt(driverAmount, 10) : 0,

      // Structured Sightseeing & Activities
      sightseeing_custom_json: JSON.stringify(sightseeingPlaces),
      activity_source: activitySource,
      activity_inventory_id: activitySource === 'existing' ? selectedInventoryActivityId : null,
      activity_custom_json: JSON.stringify(packageActivitiesList),

      // Structured Flight Configuration
      flight_source: withFlight ? flightSource : 'none',
      flight_inventory_id: (withFlight && flightSource === 'existing') ? flightInventoryId : null,
      flight_custom_json: (withFlight && flightSource === 'custom') ? JSON.stringify(flightCustom) : null,
      is_flight_customizable: isFlightCustomizable ? 1 : 0,
      base_flight_price: baseFlightPrice ? parseInt(baseFlightPrice, 10) : 0,

      // Legacy Add-ons JSON (Requirement 9)
      package_addons_json: JSON.stringify(pkgAddOns),

      // Day-Wise Itinerary & Policies
      day_wise_itinerary: JSON.stringify(dayWiseItinerary),
      cancellation_policy: cancellationPolicy,
      inclusions_exclusions_json: JSON.stringify({ inclusions, exclusions }),

      // Media & Images
      image: primaryImage || finalGallery[0] || '',
      imageUrl: primaryImage || finalGallery[0] || '',
      image_url: primaryImage || finalGallery[0] || '',
      images_json: JSON.stringify(finalGallery),
      images: finalGallery
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      alert('Error saving trip package: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(13, 27, 46, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 1060,
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl"
        style={{ maxWidth: '1240px', width: '96%', margin: '20px auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden bg-white">
          
          {/* ─── MODAL HEADER (Requirement 10) ─── */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3 text-white"
            style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #172F4F 100%)', borderBottom: '2px solid rgba(255,99,51,0.25)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)' }}
              >
                <Compass size={24} className="text-white" />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="modal-title fw-bold mb-0 text-white font-heading" style={{ fontSize: '1.25rem' }}>
                    {editingPackage ? 'Edit Trip Package' : 'Trip Package Master Builder'}
                  </h5>
                  <span
                    className="badge rounded-pill px-2.5 py-1 fw-bold text-uppercase"
                    style={{
                      fontSize: '0.68rem',
                      background: pkgStatus === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
                      color: pkgStatus === 'published' ? '#4ade80' : '#facc15',
                      border: `1px solid ${pkgStatus === 'published' ? 'rgba(34,197,94,0.4)' : 'rgba(234,179,8,0.4)'}`
                    }}
                  >
                    ● {pkgStatus.toUpperCase()}
                  </span>
                </div>
                {/* Updated Subtitle as requested in Requirement 10 */}
                <span className="text-white-50 small d-block mt-0.5" style={{ fontSize: '0.80rem' }}>
                  Configure a complete travel package with hotel, vehicle, driver, sightseeing, activities, flights, and custom options.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-circle p-1.5 opacity-75 hover-opacity-100 border-0"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* ─── NAVIGATION TABS ─── */}
          <div className="d-flex border-bottom bg-light px-4 py-1.5 gap-1 overflow-x-auto custom-scrollbar" style={{ fontSize: '0.82rem' }}>
            {[
              { id: 'basic', label: '1. Basic Info', icon: <Compass size={14} /> },
              { id: 'itinerary', label: '2. Day-Wise Itinerary', icon: <Calendar size={14} /> },
              { id: 'hotel', label: '3. Hotel Source', icon: <Hotel size={14} /> },
              { id: 'vehicle', label: '4. Vehicle Source', icon: <Car size={14} /> },
              { id: 'driver', label: '5. Driver Service', icon: <Users size={14} /> },
              { id: 'sightseeing', label: '6. Sightseeing', icon: <MapPin size={14} /> },
              { id: 'activity', label: '7. Activities', icon: <Sparkles size={14} /> },
              { id: 'flight', label: '8. Flights', icon: <Plane size={14} /> },
              { id: 'addons', label: '9. Add-ons', icon: <FileText size={14} /> },
              { id: 'pricing', label: '10. Pricing & Policies', icon: <DollarSign size={14} /> },
              { id: 'media', label: '11. Photos & Gallery', icon: <ImageIcon size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 border-0 rounded-3 transition-all ${
                  activeTab === tab.id ? 'text-white shadow-sm' : 'text-muted hover-bg-light'
                }`}
                style={{
                  background: activeTab === tab.id ? '#0D1B2E' : 'transparent',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ─── MODAL BODY CONTENT ─── */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            
            {/* ─── TAB 1: BASIC INFORMATION ─── */}
            {activeTab === 'basic' && (
              <div className="animate-fade-in row g-3">
                <div className="col-md-8">
                  <label className="form-label small fw-bold text-secondary">
                    Package Name / Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control fw-semibold"
                    placeholder="e.g. Goa Luxury Beach, Heritage & Sunset Explorer"
                    value={pkgName}
                    onChange={e => setPkgName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Badge / Tag</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Top Rated, Best Seller, Holiday Special"
                    value={pkgTag}
                    onChange={e => setPkgTag(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Package Category</label>
                  <select className="form-select fw-medium" value={pkgType} onChange={e => setPkgType(e.target.value)}>
                    <option>Trip Package</option>
                    <option>Self Drive Package</option>
                    <option>Honeymoon Special</option>
                    <option>Adventure & Watersports</option>
                    <option>Family Tour</option>
                    <option>Luxury Villa & Cruise</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Currency</label>
                  <select className="form-select fw-medium" value={pkgCurrency} onChange={e => setPkgCurrency(e.target.value)}>
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold text-secondary">Costing Type</label>
                  <select className="form-select fw-medium" value={pkgCostingType} onChange={e => setPkgCostingType(e.target.value)}>
                    <option>One Time Package Cost</option>
                    <option>Service Wise Cost</option>
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="form-label small fw-bold text-secondary">
                    Destination (Live Location Search)
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search exact location... (e.g. North Goa, Candolim, South Goa, Panaji)"
                      value={pkgDestination}
                      onChange={e => handleDestinationSearch(e.target.value)}
                    />
                    {destSuggestions.length > 0 && (
                      <div className="position-absolute bg-white shadow-lg border rounded-3 w-100 mt-1 py-1 z-3">
                        {destSuggestions.map((s, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 small hover-bg-light cursor-pointer text-dark"
                            onClick={() => {
                              setPkgDestination(s.display_name);
                              setDestSuggestions([]);
                            }}
                          >
                            📍 {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label small fw-bold text-secondary">Pax Capacity</label>
                  <div className="row g-2">
                    <div className="col-4">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold">Adults</span>
                        <input
                          type="number"
                          min="1"
                          className="form-control fw-bold"
                          value={pkgPaxAdult}
                          onChange={e => setPkgPaxAdult(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold">Children</span>
                        <input
                          type="number"
                          min="0"
                          className="form-control fw-bold"
                          value={pkgPaxChild}
                          onChange={e => setPkgPaxChild(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold">Infants</span>
                        <input
                          type="number"
                          min="0"
                          className="form-control fw-bold"
                          value={pkgPaxInfant}
                          onChange={e => setPkgPaxInfant(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label small fw-bold text-secondary">Marketing Description / Summary</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe the experience, highlights, and unique perks of this Goa package..."
                    value={pkgDescription}
                    onChange={e => setPkgDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 2: DAY-WISE ITINERARY (Requirement 8) ─── */}
            {activeTab === 'itinerary' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">DAY-WISE ITINERARY</h6>
                    <span className="text-muted small">
                      Duration: <strong>{calculatedDuration}</strong>. Use Move Up (↑) and Move Down (↓) to resequence days automatically.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 rounded-pill px-3 fw-bold"
                    style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', border: 'none' }}
                    onClick={handleAddDay}
                  >
                    <Plus size={15} /> + Add Another Day
                  </button>
                </div>

                <div className="d-flex flex-column gap-3">
                  {dayWiseItinerary.map((item, index) => (
                    <div key={index} className="p-3 border rounded-3 bg-light bg-opacity-60 shadow-xs">
                      <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge px-3 py-1 rounded-pill fw-bold text-white shadow-xs" style={{ background: '#0D1B2E', fontSize: '0.78rem' }}>
                            Day {item.day}
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-bold border bg-white text-dark"
                            style={{ fontSize: '0.92rem', minWidth: '320px' }}
                            placeholder={`Day ${item.day} Title...`}
                            value={item.title}
                            onChange={e => handleDayFieldChange(index, 'title', e.target.value)}
                          />
                        </div>

                        {/* Resequencing Controls (Move Up, Move Down, Delete) */}
                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                            title="Move Day Up"
                            disabled={index === 0}
                            onClick={() => handleMoveDayUp(index)}
                          >
                            <ArrowUp size={14} /> Move Up
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                            title="Move Day Down"
                            disabled={index === dayWiseItinerary.length - 1}
                            onClick={() => handleMoveDayDown(index)}
                          >
                            <ArrowDown size={14} /> Move Down
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1.5 rounded-2 ms-1"
                            title="Delete Day"
                            onClick={() => handleRemoveDay(index)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="row g-2 mt-1">
                        <div className="col-12">
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Day Summary / Description..."
                            value={item.description || ''}
                            onChange={e => handleDayFieldChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">MORNING</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Morning schedule..."
                            value={item.morning || ''}
                            onChange={e => handleDayFieldChange(index, 'morning', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">AFTERNOON</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Afternoon schedule..."
                            value={item.afternoon || ''}
                            onChange={e => handleDayFieldChange(index, 'afternoon', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">EVENING</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Evening schedule..."
                            value={item.evening || ''}
                            onChange={e => handleDayFieldChange(index, 'evening', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">NIGHT</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Night schedule..."
                            value={item.night || ''}
                            onChange={e => handleDayFieldChange(index, 'night', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">HOTEL STAY</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="e.g. Resort / Villa Stay"
                            value={item.stay || ''}
                            onChange={e => handleDayFieldChange(index, 'stay', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">DAY SIGHTSEEING</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Places for this day..."
                            value={item.sightseeing || ''}
                            onChange={e => handleDayFieldChange(index, 'sightseeing', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">DAY ACTIVITIES</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="Activities for this day..."
                            value={item.activities || ''}
                            onChange={e => handleDayFieldChange(index, 'activities', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="text-xxs text-muted fw-bold">DAY PHOTO URL</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            placeholder="https://..."
                            value={item.image || ''}
                            onChange={e => handleDayFieldChange(index, 'image', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 3: HOTEL SOURCE UI (Requirement 2) ─── */}
            {activeTab === 'hotel' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">HOTEL SOURCE CONFIGURATION</h6>
                    <span className="text-muted small">Choose verified vendor inventory or configure a custom/external hotel</span>
                  </div>
                  <div className="form-check form-switch d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={hotelIncluded}
                      onChange={e => setHotelIncluded(e.target.checked)}
                      id="hotelSwitch"
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label fw-bold text-secondary small" htmlFor="hotelSwitch">
                      Stay Included (Hotel)
                    </label>
                  </div>
                </div>

                {hotelIncluded && (
                  <div className="row g-3">
                    {/* Hotel Source Toggle */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">HOTEL SOURCE</label>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border d-flex align-items-center justify-content-center gap-2 ${
                            hotelSource === 'existing'
                              ? 'btn-dark text-white border-dark shadow-sm'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setHotelSource('existing')}
                        >
                          <Hotel size={16} />
                          <span>[ Existing Hotel Inventory ({hotels.length} Available) ]</span>
                        </button>
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border d-flex align-items-center justify-content-center gap-2 ${
                            hotelSource === 'custom'
                              ? 'btn-dark text-white border-dark shadow-sm'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setHotelSource('custom')}
                        >
                          <Sparkles size={16} />
                          <span>[ Custom / External Hotel ]</span>
                        </button>
                      </div>
                    </div>

                    {hotelSource === 'existing' ? (
                      <>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">Hotel Selection Type</label>
                          <select
                            className="form-select fw-semibold"
                            value={hotelSelectionType}
                            onChange={e => setHotelSelectionType(e.target.value)}
                          >
                            <option value="specific">Specific Hotel</option>
                            <option value="category">Hotel Category / Hotel Pool</option>
                          </select>
                        </div>

                        {hotelSelectionType === 'specific' ? (
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Select Hotel from Inventory</label>
                            <select
                              className="form-select fw-semibold"
                              value={hotelInventoryId}
                              onChange={e => handleSelectInventoryHotel(e.target.value)}
                            >
                              {hotels.map(h => (
                                <option key={h.id} value={h.id}>
                                  {h.name} — {h.star_rating || 4}★ ({h.city || 'Goa'})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Hotel Category</label>
                            <select
                              className="form-select fw-semibold"
                              value={hotelCategory}
                              onChange={e => setHotelCategory(e.target.value)}
                            >
                              <option>3 Star</option>
                              <option>4 Star</option>
                              <option>5 Star</option>
                              <option>Luxury</option>
                              <option>Premium</option>
                              <option>Boutique</option>
                              <option>Other</option>
                            </select>
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">Room Type</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Deluxe Room / Sea View Villa"
                            value={hotelRoomType}
                            onChange={e => setHotelRoomType(e.target.value)}
                          />
                        </div>

                        {/* Live Inventory Hotel Preview with Automatic Image */}
                        {hotelSelectionType === 'specific' && (() => {
                          const selectedHotel = hotels.find(h => String(h.id) === String(hotelInventoryId)) || hotels[0];
                          if (!selectedHotel) return null;
                          const htlImg = selectedHotel.image || selectedHotel.image_url || selectedHotel.imageUrl;
                          return (
                            <div className="col-12 mt-2">
                              <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3 shadow-xs">
                                {htlImg ? (
                                  <img
                                    src={htlImg}
                                    alt={selectedHotel.name}
                                    style={{ width: '88px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '88px', height: '64px' }}>
                                    <Hotel size={24} className="text-muted" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="fw-bold text-dark text-truncate">{selectedHotel.name}</div>
                                  <div className="small text-muted">
                                    {selectedHotel.star_rating || 4} Star • {selectedHotel.city || 'Goa'} • {selectedHotel.address || 'Beachside Location'}
                                  </div>
                                  <span className="badge bg-success bg-opacity-10 text-success fw-semibold mt-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                    <Check size={12} /> Image automatically linked from inventory
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      /* CUSTOM / EXTERNAL HOTEL FIELDS (Requirement 2) */
                      <div className="col-12 p-3 bg-light rounded-4 border">
                        <h6 className="fw-bold text-dark mb-3">Custom / External Hotel Details</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">
                              Hotel Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Heritage Portuguese Villa Anjuna"
                              value={hotelCustom.name}
                              onChange={e => setHotelCustom({ ...hotelCustom, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">
                              Hotel Category <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={hotelCustom.category}
                              onChange={e => setHotelCustom({ ...hotelCustom, category: e.target.value })}
                            >
                              <option>3 Star</option>
                              <option>4 Star</option>
                              <option>5 Star</option>
                              <option>Luxury</option>
                              <option>Premium</option>
                              <option>Boutique</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Room Type</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Ocean View Suite"
                              value={hotelCustom.room_type}
                              onChange={e => setHotelCustom({ ...hotelCustom, room_type: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Location</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Vagator Beach Road, North Goa"
                              value={hotelCustom.location}
                              onChange={e => setHotelCustom({ ...hotelCustom, location: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Meal Plan</label>
                            <select
                              className="form-select"
                              value={hotelCustom.meal_plan}
                              onChange={e => setHotelCustom({ ...hotelCustom, meal_plan: e.target.value })}
                            >
                              <option>Room Only (EP)</option>
                              <option>Breakfast Included (CP)</option>
                              <option>Breakfast & Dinner (MAP)</option>
                              <option>All Meals Included (AP)</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Image / Image URL</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="https://..."
                              value={hotelCustom.image}
                              onChange={e => setHotelCustom({ ...hotelCustom, image: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Description</label>
                            <textarea
                              rows="2"
                              className="form-control"
                              placeholder="Description of the custom hotel and key amenities..."
                              value={hotelCustom.description}
                              onChange={e => setHotelCustom({ ...hotelCustom, description: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 4: VEHICLE SOURCE UI (Requirement 3) ─── */}
            {activeTab === 'vehicle' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">VEHICLE SOURCE CONFIGURATION</h6>
                    <span className="text-muted small">Choose between existing verified vehicle inventory or custom/external vehicle</span>
                  </div>
                  <div className="form-check form-switch d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={vehicleIncluded}
                      onChange={e => setVehicleIncluded(e.target.checked)}
                      id="vehicleSwitch"
                    />
                    <label className="form-check-label fw-bold text-secondary small" htmlFor="vehicleSwitch">
                      Vehicle Included in Package
                    </label>
                  </div>
                </div>

                {vehicleIncluded && (
                  <div className="row g-3">
                    {/* Vehicle Source Toggle */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">VEHICLE SOURCE</label>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border d-flex align-items-center justify-content-center gap-2 ${
                            vehicleSource === 'existing'
                              ? 'btn-dark text-white border-dark shadow-sm'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setVehicleSource('existing')}
                        >
                          <Car size={16} />
                          <span>[ Existing Vehicle Inventory ({cars.length + bikes.length} Vehicles) ]</span>
                        </button>
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border d-flex align-items-center justify-content-center gap-2 ${
                            vehicleSource === 'custom'
                              ? 'btn-dark text-white border-dark shadow-sm'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setVehicleSource('custom')}
                        >
                          <Sparkles size={16} />
                          <span>[ Custom / External Vehicle ]</span>
                        </button>
                      </div>
                    </div>

                    {vehicleSource === 'existing' ? (
                      <>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold text-secondary">Vehicle Type</label>
                          <select className="form-select fw-semibold" value={vehicleType} onChange={e => handleVehicleTypeChange(e.target.value)}>
                            <option value="car">Car (Self-Drive / Chauffeured)</option>
                            <option value="bike">Bike / Scooter</option>
                          </select>
                        </div>

                        <div className="col-md-8">
                          <label className="form-label small fw-bold text-secondary">
                            Select Vehicle from Real Inventory ({vehicleType === 'bike' ? bikes.length : cars.length} available)
                          </label>
                          <select
                            className="form-select fw-semibold"
                            value={vehicleInventoryId}
                            onChange={e => handleSelectInventoryVehicle(e.target.value)}
                          >
                            {(vehicleType === 'bike' ? bikes : cars).map(v => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.type || v.category || 'Standard'}) — ₹{v.price_per_day || v.price}/day
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Live Inventory Vehicle Preview with Automatic Image */}
                        {(() => {
                          const list = vehicleType === 'bike' ? bikes : cars;
                          const selectedVeh = list.find(v => String(v.id) === String(vehicleInventoryId)) || list[0];
                          if (!selectedVeh) return null;
                          const vehImg = selectedVeh.image || selectedVeh.image_url || selectedVeh.imageUrl;
                          return (
                            <div className="col-12 mt-2">
                              <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3 shadow-xs">
                                {vehImg ? (
                                  <img
                                    src={vehImg}
                                    alt={selectedVeh.name}
                                    style={{ width: '88px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '88px', height: '64px' }}>
                                    <Car size={24} className="text-muted" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="fw-bold text-dark text-truncate">{selectedVeh.name}</div>
                                  <div className="small text-muted">
                                    {selectedVeh.category || selectedVeh.type || 'Standard'} • {selectedVeh.fuel || 'Petrol'} • {selectedVeh.transmission || 'Manual'} • ₹{selectedVeh.price_per_day || selectedVeh.price}/day
                                  </div>
                                  <span className="badge bg-success bg-opacity-10 text-success fw-semibold mt-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                    <Check size={12} /> Image automatically linked from inventory
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      /* CUSTOM / EXTERNAL VEHICLE (Requirement 3) */
                      <div className="col-12 p-3 bg-light rounded-4 border">
                        <h6 className="fw-bold text-dark mb-3">Custom / External Vehicle Details</h6>
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Vehicle Type</label>
                            <select
                              className="form-select"
                              value={vehicleCustom.type}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, type: e.target.value })}
                            >
                              <option>Car</option>
                              <option>Bike</option>
                              <option>SUV</option>
                              <option>Convertible</option>
                              <option>Tempo Traveller</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="col-md-5">
                            <label className="form-label small fw-bold text-secondary">
                              Vehicle Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Toyota Innova Crysta"
                              value={vehicleCustom.name}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small fw-bold text-secondary">Brand</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Toyota / Mahindra"
                              value={vehicleCustom.brand}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, brand: e.target.value })}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small fw-bold text-secondary">Model</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Crysta / Thar"
                              value={vehicleCustom.model}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, model: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Category</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. SUV, Sedan, Cruiser"
                              value={vehicleCustom.category}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, category: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Transmission</label>
                            <select
                              className="form-select"
                              value={vehicleCustom.transmission}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, transmission: e.target.value })}
                            >
                              <option>Manual</option>
                              <option>Automatic</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Fuel</label>
                            <select
                              className="form-select"
                              value={vehicleCustom.fuel}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, fuel: e.target.value })}
                            >
                              <option>Diesel</option>
                              <option>Petrol</option>
                              <option>Electric</option>
                              <option>Hybrid</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small fw-bold text-secondary">Seats</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 7 Seater"
                              value={vehicleCustom.seats}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, seats: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Vehicle highlights and condition..."
                              value={vehicleCustom.description}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, description: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Image / Image URL</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="https://..."
                              value={vehicleCustom.image}
                              onChange={e => setVehicleCustom({ ...vehicleCustom, image: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 5: DRIVER SERVICE UI (Requirement 4) ─── */}
            {activeTab === 'driver' && (
              <div className="animate-fade-in">
                <div className="p-3 mb-3 rounded-3 border-start border-4 border-warning bg-warning bg-opacity-10">
                  <div className="d-flex align-items-center gap-2">
                    <Shield size={18} className="text-warning" />
                    <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                      Driver Architecture Configuration
                    </span>
                  </div>
                  <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.78rem' }}>
                    Configures driver inclusion for booking-time allocation. Uses existing driver assignment and dispatch without duplicating fees.
                  </p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">DRIVER SERVICE</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                          driverIncluded === 1 ? 'btn-success text-white' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setDriverIncluded(1)}
                      >
                        ✓ Driver Included: Yes
                      </button>
                      <button
                        type="button"
                        className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                          driverIncluded === 0 ? 'btn-secondary text-white' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setDriverIncluded(0)}
                      >
                        ✕ Driver Included: No
                      </button>
                    </div>
                  </div>

                  {driverIncluded === 1 && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Driver Type</label>
                        <select className="form-select fw-semibold" value={driverType} onChange={e => setDriverType(e.target.value)}>
                          <option value="pickup_drop">Pickup & Drop</option>
                          <option value="full_day">Full Day</option>
                          <option value="customer_choice">Customer Choice</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">Driver Pricing</label>
                        <select
                          className="form-select fw-semibold"
                          value={driverPricingType}
                          onChange={e => setDriverPricingType(e.target.value)}
                        >
                          <option value="included">Included</option>
                          <option value="additional_fee">Additional Driver Fee</option>
                        </select>
                      </div>

                      {driverPricingType === 'additional_fee' && (
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">
                            Driver Amount (₹)
                          </label>
                          <div className="input-group">
                            <span className="input-group-text fw-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              className="form-control fw-bold text-success fs-6"
                              value={driverAmount}
                              onChange={e => setDriverAmount(e.target.value)}
                              placeholder="e.g. 1500"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 6: SIGHTSEEING UI (Requirement 5) ─── */}
            {activeTab === 'sightseeing' && (
              <div className="animate-fade-in row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">SIGHTSEEING SOURCE</label>
                  <div className="d-flex gap-3 mb-2">
                    <button
                      type="button"
                      className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                        sightseeingSource === 'existing'
                          ? 'btn-dark text-white border-dark'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSightseeingSource('existing')}
                    >
                      [ Existing Sightseeing Inventory ({inventorySightseeing.length}) ]
                    </button>
                    <button
                      type="button"
                      className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                        sightseeingSource === 'custom'
                          ? 'btn-dark text-white border-dark'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSightseeingSource('custom')}
                    >
                      [ Custom Sightseeing ]
                    </button>
                  </div>
                </div>

                {sightseeingSource === 'existing' ? (
                  <div className="col-12 p-3 bg-light rounded-3 border">
                    <label className="form-label small fw-bold text-secondary">Select from Existing Sightseeing Records</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        value={selectedInventorySightseeingId}
                        onChange={e => setSelectedInventorySightseeingId(e.target.value)}
                      >
                        <option value="">-- Choose from Sightseeing Inventory --</option>
                        {inventorySightseeing.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name || item.title} ({item.location || 'Goa'}) — ₹{item.price || 0}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary fw-bold text-white px-3 flex-shrink-0"
                        onClick={() => {
                          const item = inventorySightseeing.find(s => s.id === selectedInventorySightseeingId);
                          handleAddInventorySightseeing(item);
                        }}
                      >
                        + Add to Package
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Custom Sightseeing Form (Requirement 5) */
                  <div className="col-12 p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-dark mb-2">Custom Sightseeing Details</h6>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="text-xxs text-muted fw-bold">PLACE NAME *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Fort Aguada & Lighthouse"
                          value={customSightseeingForm.name}
                          onChange={e => setCustomSightseeingForm({ ...customSightseeingForm, name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-xxs text-muted fw-bold">LOCATION (NOMINATIM HELPER)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Candolim, North Goa"
                          value={customSightseeingForm.location}
                          onChange={e => setCustomSightseeingForm({ ...customSightseeingForm, location: e.target.value })}
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="text-xxs text-muted fw-bold">DESCRIPTION</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Brief description of attraction..."
                          value={customSightseeingForm.description}
                          onChange={e => setCustomSightseeingForm({ ...customSightseeingForm, description: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="text-xxs text-muted fw-bold">IMAGE URL</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="https://..."
                          value={customSightseeingForm.image}
                          onChange={e => setCustomSightseeingForm({ ...customSightseeingForm, image: e.target.value })}
                        />
                      </div>
                      <div className="col-12 text-end mt-2">
                        <button type="button" className="btn btn-sm btn-dark px-3 fw-bold" onClick={handleAddCustomSightseeing}>
                          + Add Sightseeing Place
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Sightseeing Places */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Included Sightseeing Spots ({sightseeingPlaces.length})</label>
                  <div className="d-flex flex-wrap gap-1.5 p-3 bg-white rounded-3 border" style={{ minHeight: '80px' }}>
                    {sightseeingPlaces.length === 0 ? (
                      <span className="text-muted small">No sightseeing places added yet.</span>
                    ) : (
                      sightseeingPlaces.map((p, idx) => (
                        <span key={idx} className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1.5 shadow-xs">
                          📍 {p}
                          <X
                            size={13}
                            className="text-danger cursor-pointer ms-1"
                            onClick={() => setSightseeingPlaces(sightseeingPlaces.filter((_, i) => i !== idx))}
                          />
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 7: ACTIVITY UI (Requirement 6) ─── */}
            {activeTab === 'activity' && (
              <div className="animate-fade-in row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">ACTIVITY SOURCE</label>
                  <div className="d-flex gap-3 mb-2">
                    <button
                      type="button"
                      className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                        activitySource === 'existing'
                          ? 'btn-dark text-white border-dark'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setActivitySource('existing')}
                    >
                      [ Existing Activity Inventory ({inventoryActivities.length}) ]
                    </button>
                    <button
                      type="button"
                      className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                        activitySource === 'custom'
                          ? 'btn-dark text-white border-dark'
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setActivitySource('custom')}
                    >
                      [ Custom Activity ]
                    </button>
                  </div>
                </div>

                {activitySource === 'existing' ? (
                  <div className="col-12 p-3 bg-light rounded-3 border">
                    <label className="form-label small fw-bold text-secondary">Select from Existing Activity Records</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        value={selectedInventoryActivityId}
                        onChange={e => setSelectedInventoryActivityId(e.target.value)}
                      >
                        <option value="">-- Choose from Activity Inventory --</option>
                        {inventoryActivities.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name || item.title} ({item.duration || '2-3 Hours'}) — ₹{item.price || 0}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary fw-bold text-white px-3 flex-shrink-0"
                        onClick={() => {
                          const item = inventoryActivities.find(a => a.id === selectedInventoryActivityId);
                          handleAddInventoryActivity(item);
                        }}
                      >
                        + Add to Package
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Custom Activity Form (Requirement 6) */
                  <div className="col-12 p-3 bg-light rounded-3 border">
                    <h6 className="fw-bold text-dark mb-2">Custom Activity Details</h6>
                    <div className="row g-2">
                      <div className="col-md-5">
                        <label className="text-xxs text-muted fw-bold">ACTIVITY NAME *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Mandovi River Sunset Yacht & Watersports"
                          value={customActivityForm.name}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="text-xxs text-muted fw-bold">DURATION</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 2 Hours"
                          value={customActivityForm.duration}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, duration: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="text-xxs text-muted fw-bold">PRICE (₹)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="e.g. 1499"
                          value={customActivityForm.price}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, price: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-xxs text-muted fw-bold">LOCATION</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Calangute / Panaji"
                          value={customActivityForm.location}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, location: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-xxs text-muted fw-bold">IMAGE URL</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="https://..."
                          value={customActivityForm.image}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, image: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="text-xxs text-muted fw-bold">DESCRIPTION</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Activity highlights and what is included..."
                          value={customActivityForm.description}
                          onChange={e => setCustomActivityForm({ ...customActivityForm, description: e.target.value })}
                        />
                      </div>
                      <div className="col-12 text-end mt-2">
                        <button type="button" className="btn btn-sm btn-dark px-3 fw-bold" onClick={handleAddCustomActivity}>
                          + Add Activity
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Included Activities List */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Included Activities ({packageActivitiesList.length})</label>
                  <div className="d-flex flex-column gap-2">
                    {packageActivitiesList.map((act, idx) => (
                      <div key={idx} className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between">
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{act.name}</div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {act.duration} • {act.location} • ₹{act.price}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => setPackageActivitiesList(packageActivitiesList.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 8: FLIGHT UI (Requirement 7) ─── */}
            {activeTab === 'flight' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">FLIGHT INTEGRATION</h6>
                    <span className="text-muted small">Choose between real flight inventory records or configure a custom flight route</span>
                  </div>
                  <div className="form-check form-switch d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={withFlight}
                      onChange={e => setWithFlight(e.target.checked)}
                      id="flightSwitch"
                    />
                    <label className="form-check-label fw-bold text-secondary small" htmlFor="flightSwitch">
                      With Flight: {withFlight ? 'YES' : 'NO'}
                    </label>
                  </div>
                </div>

                {withFlight && (
                  <div className="row g-3">
                    {/* Flight Source Toggle */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary">FLIGHT SOURCE</label>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                            flightSource === 'existing'
                              ? 'btn-dark text-white border-dark'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setFlightSource('existing')}
                        >
                          ✈️ [ Existing Flight Inventory ({liveFlights.length} Flights) ]
                        </button>
                        <button
                          type="button"
                          className={`btn px-4 py-2.5 rounded-3 fw-bold flex-fill border ${
                            flightSource === 'custom'
                              ? 'btn-dark text-white border-dark'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => setFlightSource('custom')}
                        >
                          ✨ [ Custom / External Flight ]
                        </button>
                      </div>
                    </div>

                    {flightSource === 'existing' ? (
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary">
                          Select from Real Flight Inventory
                        </label>
                        <select
                          className="form-select fw-semibold"
                          value={flightInventoryId}
                          onChange={e => setFlightInventoryId(e.target.value)}
                        >
                          {liveFlights.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.airline} ({f.flight_number}) — {f.from_loc} → {f.to_loc} ({f.departure_time} - {f.arrival_time}) — ₹{f.price}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Custom Flight Fields (Requirement 7) */
                      <div className="col-12 p-3 bg-light rounded-4 border">
                        <h6 className="fw-bold text-dark mb-2">Custom Flight Details</h6>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Airline Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. IndiGo / Air India Express"
                              value={flightCustom.airline}
                              onChange={e => setFlightCustom({ ...flightCustom, airline: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Flight Number</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 6E-204"
                              value={flightCustom.flight_number}
                              onChange={e => setFlightCustom({ ...flightCustom, flight_number: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Departure City</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Mumbai / Delhi"
                              value={flightCustom.departure_city}
                              onChange={e => setFlightCustom({ ...flightCustom, departure_city: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Arrival City</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Goa (GOI / GOX)"
                              value={flightCustom.arrival_city}
                              onChange={e => setFlightCustom({ ...flightCustom, arrival_city: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">
                        Price (With Flight) ₹ <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control fw-bold text-primary"
                        placeholder="e.g. 19999"
                        value={pkgPriceWithFlight}
                        onChange={e => setPkgPriceWithFlight(e.target.value)}
                        required={withFlight}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Base Flight Allowance / Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 5000"
                        value={baseFlightPrice}
                        onChange={e => setBaseFlightPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 9: LEGACY ADD-ONS (Requirement 9) ─── */}
            {activeTab === 'addons' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">MANAGE ADD-ONS (PACKAGE ADDONS)</h6>
                    <span className="text-muted small">Configure custom package add-ons (Activities, Transfers, Meals) preserved for backward compatibility.</span>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-4 border mb-3">
                  <h6 className="fw-bold text-secondary small mb-2 text-uppercase">Add New Package Add-on</h6>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <label className="text-xxs text-muted fw-bold">TITLE *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Sunset Boat Cruise"
                        value={newAddOn.title}
                        onChange={e => setNewAddOn({ ...newAddOn, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="text-xxs text-muted fw-bold">TYPE</label>
                      <select
                        className="form-select form-select-sm"
                        value={newAddOn.type}
                        onChange={e => setNewAddOn({ ...newAddOn, type: e.target.value })}
                      >
                        <option>Activity</option>
                        <option>Transfer</option>
                        <option>Meal</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="text-xxs text-muted fw-bold">PRICE (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g. 500"
                        value={newAddOn.price}
                        onChange={e => setNewAddOn({ ...newAddOn, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="text-xxs text-muted fw-bold">DURATION</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 1 Hour"
                        value={newAddOn.duration}
                        onChange={e => setNewAddOn({ ...newAddOn, duration: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="text-xxs text-muted fw-bold">LOCATION</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Panaji"
                        value={newAddOn.location}
                        onChange={e => setNewAddOn({ ...newAddOn, location: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="text-xxs text-muted fw-bold">DESCRIPTION</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Short summary of this add-on..."
                        value={newAddOn.description}
                        onChange={e => setNewAddOn({ ...newAddOn, description: e.target.value })}
                      />
                    </div>
                    <div className="col-12 text-end mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-dark px-3 fw-bold"
                        onClick={handleAddLegacyAddOn}
                      >
                        + Add Add-on
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Current Add-ons */}
                <div className="d-flex flex-column gap-2">
                  {pkgAddOns.length === 0 ? (
                    <div className="p-3 text-center text-muted small bg-white rounded-3 border">
                      No package add-ons added yet.
                    </div>
                  ) : (
                    pkgAddOns.map((addon, idx) => (
                      <div key={idx} className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between">
                        <div>
                          <div className="fw-bold text-dark small">{addon.title} ({addon.type})</div>
                          <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            {addon.location || 'Goa'} • ₹{addon.price} • {addon.duration || 'Standard'}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => setPkgAddOns(pkgAddOns.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 10: PRICING & POLICIES ─── */}
            {activeTab === 'pricing' && (
              <div className="animate-fade-in row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">
                    Package Base Price (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text fw-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      className="form-control fw-bold text-primary fs-5"
                      placeholder="e.g. 14999"
                      value={pkgPrice}
                      onChange={e => setPkgPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Advance Payment Percentage (%)</label>
                  <select
                    className="form-select fw-semibold"
                    value={pkgAdvancePercentage}
                    onChange={e => setPkgAdvancePercentage(e.target.value)}
                  >
                    <option value={20}>20% Advance Payment</option>
                    <option value={25}>25% Advance Payment (Standard)</option>
                    <option value={30}>30% Advance Payment</option>
                    <option value={50}>50% Advance Payment</option>
                    <option value={100}>100% Full Payment Only</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Meals Summary</label>
                  <input
                    type="text"
                    className="form-control"
                    value={foodIncluded}
                    onChange={e => setFoodIncluded(e.target.value)}
                    placeholder="e.g. Daily Buffet Breakfast Included"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Pickup & Drop Transfers</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pickupDropIncluded}
                    onChange={e => setPickupDropIncluded(e.target.value)}
                    placeholder="e.g. Airport Pickup & Drop Included"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Package Inclusions (Perks)</label>
                  <div className="input-group input-group-sm mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add inclusion..."
                      value={newInclusionInput}
                      onChange={e => setNewInclusionInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newInclusionInput.trim()) {
                            setInclusions([...inclusions, newInclusionInput.trim()]);
                            setNewInclusionInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => {
                        if (newInclusionInput.trim()) {
                          setInclusions([...inclusions, newInclusionInput.trim()]);
                          setNewInclusionInput('');
                        }
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="p-2 border rounded-3 bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {inclusions.map((inc, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between py-1 border-bottom text-muted small">
                        <span>✓ {inc}</span>
                        <X
                          size={12}
                          className="text-danger cursor-pointer"
                          onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Package Exclusions</label>
                  <div className="input-group input-group-sm mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add exclusion..."
                      value={newExclusionInput}
                      onChange={e => setNewExclusionInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newExclusionInput.trim()) {
                            setExclusions([...exclusions, newExclusionInput.trim()]);
                            setNewExclusionInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => {
                        if (newExclusionInput.trim()) {
                          setExclusions([...exclusions, newExclusionInput.trim()]);
                          setNewExclusionInput('');
                        }
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="p-2 border rounded-3 bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {exclusions.map((exc, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between py-1 border-bottom text-muted small">
                        <span>✕ {exc}</span>
                        <X
                          size={12}
                          className="text-danger cursor-pointer"
                          onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary">Cancellation & Refund Policy</label>
                  <textarea
                    rows="2"
                    className="form-control small"
                    value={cancellationPolicy}
                    onChange={e => setCancellationPolicy(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 11: PHOTOS & GALLERY ─── */}
            {activeTab === 'media' && (
              <div className="animate-fade-in row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Primary Cover Image URL</label>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="https://..."
                    value={primaryImage}
                    onChange={e => setPrimaryImage(e.target.value)}
                  />
                  {primaryImage && (
                    <div className="rounded-3 overflow-hidden border shadow-sm" style={{ height: '220px' }}>
                      <img
                        src={primaryImage}
                        alt="Cover preview"
                        className="w-100 h-100 object-fit-cover"
                        onError={e => {
                          e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary">Add to Gallery (Upload or URL)</label>
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Paste image URL..."
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newImageUrl.trim() && !galleryImages.includes(newImageUrl.trim())) {
                            setGalleryImages([...galleryImages, newImageUrl.trim()]);
                            setNewImageUrl('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-dark flex-shrink-0"
                      onClick={() => {
                        if (newImageUrl.trim() && !galleryImages.includes(newImageUrl.trim())) {
                          setGalleryImages([...galleryImages, newImageUrl.trim()]);
                          setNewImageUrl('');
                        }
                      }}
                    >
                      Add URL
                    </button>
                    <label className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mb-0 cursor-pointer flex-shrink-0">
                      <Upload size={14} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={e => handleImageFileUpload(e, url => setGalleryImages(prev => [url, ...prev]))}
                      />
                    </label>
                  </div>

                  <div className="row g-2 p-2 border rounded-3 bg-light" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {galleryImages.map((img, i) => (
                      <div key={i} className="col-4 position-relative">
                        <div className="rounded-2 overflow-hidden border position-relative" style={{ height: '70px' }}>
                          <img src={img} alt="" className="w-100 h-100 object-fit-cover" />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center m-1 shadow-sm"
                            style={{ width: '18px', height: '18px' }}
                            onClick={() => setGalleryImages(galleryImages.filter(x => x !== img))}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── MODAL FOOTER ─── */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3 bg-light border-top flex-wrap gap-2"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Status when saved:</span>
              <span className={`badge rounded-pill fw-bold ${pkgStatus === 'published' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                {pkgStatus.toUpperCase()}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3 py-2 rounded-pill fw-semibold"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-outline-warning text-dark px-3 py-2 rounded-pill fw-bold"
                style={{ background: 'rgba(255,193,7,0.15)', borderColor: 'rgba(255,193,7,0.5)' }}
                disabled={isSubmitting}
                onClick={() => handleSubmit('draft')}
              >
                Save as Draft
              </button>

              <button
                type="button"
                className="btn btn-primary px-4 py-2 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
                disabled={isSubmitting}
                onClick={() => handleSubmit('published')}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{editingPackage ? 'Update & Publish' : 'Publish Package'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
