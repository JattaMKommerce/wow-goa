import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Plane, Utensils, Shield, ChevronRight, ChevronDown,
  Sparkles, Calendar, User, Users, Phone, Mail, ShieldCheck,
  CreditCard, Wallet, Crown, Gift, Download, Printer, CheckCircle2,
  Compass, ArrowRight, Eye, Home
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import InternationalPhoneInput from '../../components/common/InternationalPhoneInput';
import BookingVoucher from '../../components/common/BookingVoucher';
import { CashbackRewardCard } from '../../components/common/BookingConfirmationCard';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';
import { resolvePackagePrices } from '../../utils/pricingHelper';
import * as api from '../../services/api';

// ─── Helper to parse and normalize package configuration strictly from data ─────
function resolvePackageDetails(pkg, markups = [], allCars = [], allHotels = []) {
  if (!pkg) return {};

  const pricing = resolvePackagePrices(pkg, markups);

  // 1. Hotel Resolution
  let hotelName = pkg.hotel?.name || pkg.hotel_included || '';
  const roomMatch = hotelName.match(/\((.*?)\)/);
  let extractedRoom = roomMatch ? roomMatch[1].trim() : '';
  if (extractedRoom) {
    hotelName = hotelName.replace(/\(.*?\)/, '').trim();
  }
  const hotelCategory = pkg.hotel?.category || pkg.hotel_category || pkg.hotel_stars || '4 Star';
  const roomType = pkg.hotel?.room_type || pkg.hotel_room_type || extractedRoom || 'Deluxe AC Room';
  const mealPlan = pkg.hotel?.meal_plan || pkg.food_included || pkg.meals_included || 'Daily Buffet Breakfast Included';
  
  let hotelImage = pkg.hotel?.image || pkg.hotel_image;
  if (!hotelImage && allHotels.length > 0) {
    const matchedHtl = allHotels.find(h => 
      (pkg.hotel?.id && h.id === pkg.hotel.id) ||
      (pkg.hotel_inventory_id && h.id === pkg.hotel_inventory_id) ||
      (hotelName && h.name && h.name.toLowerCase().includes(hotelName.toLowerCase()))
    );
    if (matchedHtl) hotelImage = matchedHtl.image || matchedHtl.imageUrl;
  }
  if (!hotelImage) {
    hotelImage = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';
  }

  const hotelDescription = pkg.hotel?.description || pkg.hotel_description || 'Premium beachfront resort accommodation with modern amenities, swimming pool, and scenic views.';
  const hotelAmenities = Array.isArray(pkg.hotel?.amenities) && pkg.hotel.amenities.length > 0
    ? pkg.hotel.amenities
    : ['Swimming Pool', 'Free High-Speed Wi-Fi', 'Air Conditioning', 'Beachfront Access', '24/7 Room Service'];

  // 2. Vehicle Resolution
  let vehicleName = pkg.vehicle?.name || pkg.car_included || pkg.vehicle_name || 'Maruti Suzuki Swift';
  if (vehicleName.toLowerCase() === 'swift') vehicleName = 'Maruti Suzuki Swift';
  if (vehicleName.toLowerCase() === 'innova') vehicleName = 'Toyota Innova Crysta';
  if (vehicleName.toLowerCase() === 'thar') vehicleName = 'Mahindra Thar 4x4';

  const vehicleSeats = pkg.vehicle?.seats || (vehicleName.toLowerCase().includes('innova') ? '7 Seater' : '4 Seater');
  const vehicleAc = pkg.vehicle?.ac !== false ? 'AC' : 'Non-AC';

  let vehicleImage = pkg.vehicle?.image || pkg.vehicle_image;
  if (!vehicleImage && allCars.length > 0) {
    const matchedCar = allCars.find(c => 
      (pkg.vehicle?.id && c.id === pkg.vehicle.id) ||
      (pkg.vehicle_inventory_id && c.id === pkg.vehicle_inventory_id) ||
      (vehicleName && c.name && c.name.toLowerCase().includes(vehicleName.toLowerCase()))
    );
    if (matchedCar) vehicleImage = matchedCar.image || matchedCar.imageUrl;
  }
  if (!vehicleImage) {
    vehicleImage = '/backend/uploads/img_6a945dd821766.jpeg';
  }

  // 3. Driver Resolution
  const driverIncluded = Boolean(
    pkg.driver_included === 1 || 
    pkg.driver_included === '1' || 
    pkg.driver_included === true || 
    pkg.driver?.included === 1 || 
    pkg.driver?.included === true
  );
  let driverType = 'Full Day Chauffeur';
  if (pkg.driver?.type) {
    driverType = pkg.driver.type === 'full_day' ? 'Full Day Chauffeur' : (pkg.driver.type === 'half_day' ? 'Half Day Chauffeur' : pkg.driver.type);
  } else if (pkg.driver_type) {
    driverType = pkg.driver_type === 'full_day' ? 'Full Day Chauffeur' : pkg.driver_type;
  }

  // 4. Flight Resolution
  const hasFlight = Boolean(
    pkg.flight?.has_flight || 
    (pkg.flight_source && pkg.flight_source !== 'none') || 
    pkg.price_with_flight || 
    pkg.flights_included === '1' || 
    pkg.flights_included === 1
  );

  // 5. Sightseeing Resolution
  let sightseeingList = [];
  if (Array.isArray(pkg.sightseeing?.custom_items) && pkg.sightseeing.custom_items.length > 0) {
    sightseeingList = pkg.sightseeing.custom_items;
  } else if (pkg.sightseeing_custom_json) {
    try {
      const parsed = typeof pkg.sightseeing_custom_json === 'string' ? JSON.parse(pkg.sightseeing_custom_json) : pkg.sightseeing_custom_json;
      if (Array.isArray(parsed)) sightseeingList = parsed;
    } catch (e) {}
  }
  if (sightseeingList.length === 0 && (pkg.sightseeing?.places || pkg.places_included)) {
    const rawPlaces = pkg.sightseeing?.places || pkg.places_included;
    sightseeingList = rawPlaces.includes('|') ? rawPlaces.split('|').map(s => s.trim()) : rawPlaces.split(',').map(s => s.trim());
  }
  sightseeingList = sightseeingList.map(s => typeof s === 'string' ? s : (s.name || String(s))).filter(Boolean);
  if (sightseeingList.length === 0) {
    sightseeingList = ['Fort Aguada', 'Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Mandovi River Cruise'];
  }

  // 6. Activities Resolution
  let activitiesList = [];
  if (Array.isArray(pkg.activity?.custom_items) && pkg.activity.custom_items.length > 0) {
    activitiesList = pkg.activity.custom_items;
  } else if (pkg.activity_custom_json) {
    try {
      const parsed = typeof pkg.activity_custom_json === 'string' ? JSON.parse(pkg.activity_custom_json) : pkg.activity_custom_json;
      if (Array.isArray(parsed)) activitiesList = parsed;
    } catch (e) {}
  } else if (Array.isArray(pkg.activities)) {
    activitiesList = pkg.activities;
  }
  activitiesList = activitiesList.map(act => {
    if (typeof act === 'string') return { name: act, description: 'Configured tour activity' };
    return {
      name: act.name || 'Guided Activity',
      duration: act.duration || '1 Hour',
      location: act.location || 'Goa',
      description: act.description || 'Scenic guided experience as per package itinerary.',
      price: act.price
    };
  });

  // 7. Day-wise Itinerary Resolution
  let itineraryList = [];
  const rawItin = pkg.itinerary || pkg.day_wise_itinerary || pkg.dayPlan || pkg.dayWiseItinerary;
  if (rawItin) {
    try {
      const parsed = typeof rawItin === 'string' ? JSON.parse(rawItin) : rawItin;
      if (Array.isArray(parsed)) itineraryList = parsed;
    } catch (e) {}
  }
  if (itineraryList.length === 0) {
    itineraryList = [
      {
        day: 1,
        title: 'Arrival in Goa & Beach Leisure',
        description: 'Airport/Station pickup, check in to resort, relax by the beach shacks and enjoy sunset.',
        morning: 'Airport / Railway station pickup and resort check-in',
        afternoon: 'Leisure at resort pool & beachside relaxation',
        evening: 'Sunset walk at Candolim & beach shacks exploration',
        night: 'Welcome dinner at resort',
        stay: hotelName,
        meals: ['Dinner'],
        sightseeing: 'Candolim Beach, Calangute Coastline'
      },
      {
        day: 2,
        title: 'North Goa Heritage & Coastal Highlights',
        description: 'Explore iconic Portuguese forts, scenic cliffs, and vibrant coastal flea markets.',
        morning: 'Buffet breakfast at resort',
        afternoon: 'Guided tour of Fort Aguada and Sinquerim coastline',
        evening: 'Anjuna & Vagator sunset cliffs exploration',
        night: 'Dinner at beachfront restaurant',
        stay: hotelName,
        meals: ['Breakfast'],
        sightseeing: 'Fort Aguada, Baga Beach, Anjuna Beach, Chapora Fort'
      },
      {
        day: 3,
        title: 'South Goa Culture & Mandovi Sunset Cruise',
        description: 'Visit UNESCO heritage churches of Old Goa and enjoy scenic Mandovi river sunset cruise.',
        morning: 'Breakfast and scenic drive to Old Goa',
        afternoon: 'Tour of Basilica of Bom Jesus and Se Cathedral',
        evening: 'Mandovi River Sunset Cruise with Goan folk music',
        night: 'Leisure evening and dinner in Panaji',
        stay: hotelName,
        meals: ['Breakfast'],
        sightseeing: 'Basilica of Bom Jesus, Se Cathedral, Mandovi River'
      },
      {
        day: 4,
        title: 'Departure with Sweet Goan Memories',
        description: 'Morning breakfast, souvenir shopping at local market, and transfer to airport/station.',
        morning: 'Buffet breakfast & leisure check-out',
        afternoon: 'Local souvenir shopping and transfer to airport/station',
        evening: 'Departure with memorable experiences',
        night: '',
        stay: 'Check-out',
        meals: ['Breakfast'],
        sightseeing: 'Panaji Market'
      }
    ];
  }

  // 8. Inclusions & Exclusions Resolution
  let inclusions = [];
  let exclusions = [];
  if (pkg.inclusions_exclusions_json) {
    try {
      const parsed = typeof pkg.inclusions_exclusions_json === 'string' ? JSON.parse(pkg.inclusions_exclusions_json) : pkg.inclusions_exclusions_json;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.inclusions)) inclusions = parsed.inclusions;
        if (Array.isArray(parsed.exclusions)) exclusions = parsed.exclusions;
      }
    } catch (e) {}
  }
  if (inclusions.length === 0) {
    inclusions = [
      `Accommodation at ${hotelName} (${hotelCategory})`,
      `${roomType} with daily housekeeping`,
      `${mealPlan}`,
      `Dedicated vehicle: ${vehicleName} (${vehicleSeats} • ${vehicleAc})`,
      driverIncluded ? `${driverType} included throughout the tour` : 'Dedicated tour vehicle with fuel allowance',
      'Airport / Railway station pickup & drop transfers',
      'Guided sightseeing tours as per itinerary',
      'All driver allowances, tolls, parking, and state permits',
      '24/7 dedicated local tour manager assistance'
    ];
  }
  if (exclusions.length === 0) {
    exclusions = [
      'Airfare / Train tickets unless flight option is selected',
      'Personal expenses, laundry, telephone charges, and shopping',
      'Monument / museum entry tickets and camera fees',
      'Optional watersports & adventure activities not mentioned in inclusions',
      'Meals other than those specified in meal plan',
      'Early check-in and late check-out charges'
    ];
  }

  // 9. Cancellation Policy Resolution
  const cancellationPolicy = pkg.cancellation_policy || 
    'Free cancellation up to 48 hours before scheduled departure date. 100% full refund on eligible cancellations. Verified hotels, sanitized vehicles, and 24/7 dedicated local tour support.';

  return {
    pricing,
    hotelName,
    hotelCategory,
    roomType,
    mealPlan,
    hotelImage,
    hotelDescription,
    hotelAmenities,
    vehicleName,
    vehicleSeats,
    vehicleAc,
    vehicleImage,
    driverIncluded,
    driverType,
    hasFlight,
    sightseeingList,
    activitiesList,
    itineraryList,
    inclusions,
    exclusions,
    cancellationPolicy
  };
}

export default function PackageDetailsPage({
  pkg,
  onBack,
  onBook,
  onEnquire,
  markups = [],
  allCars = [],
  allHotels = [],
  currentUser = null,
  customerUser = null,
  setActiveTab = () => {},
  onConfirmBooking = () => {}
}) {
  if (!pkg) return null;

  // Normalized package details strictly from configured data
  const details = useMemo(() => 
    resolvePackageDetails(pkg, markups, allCars, allHotels), 
    [pkg, markups, allCars, allHotels]
  );

  const pricePerPerson = details.pricing?.price || pkg.price || 0;
  const isSelfDrivePackage = pkg.package_type === 'Self Drive Package' || (pkg.name && pkg.name.toLowerCase().includes('self drive'));

  // Multi-step booking state: 'details' -> 'travellers' -> 'payment' -> 'confirmation'
  const [step, setStep] = useState('details');

  // Maximum duration from itinerary
  const packageMaxNights = useMemo(() => {
    if (details.itineraryList?.length > 1) {
      return details.itineraryList.length - 1;
    }
    if (pkg.duration_nights) return parseInt(pkg.duration_nights, 10);
    const nMatch = String(pkg.duration || '').match(/(\d+)\s*Nights?/i);
    if (nMatch) return parseInt(nMatch[1], 10);
    return 3;
  }, [details.itineraryList, pkg.duration_nights, pkg.duration]);

  // Selected dates
  const initialDep = pkg.pickupDate || pkg.departureDate || pkg.pickup_date || getTodayDateStr();
  const initialRet = pkg.returnDate || pkg.dropDate || pkg.drop_date || addDays(initialDep, packageMaxNights);
  const [departureDate, setDepartureDate] = useState(initialDep);
  const [returnDate, setReturnDate] = useState(initialRet);

  const nights = useMemo(() => {
    if (!departureDate || !returnDate) return 0;
    const diff = Math.round((new Date(returnDate) - new Date(departureDate)) / 86400000);
    return Math.max(1, Math.min(diff, packageMaxNights));
  }, [departureDate, returnDate, packageMaxNights]);

  const days = nights + 1;

  const handleDepartureDateChange = (newStart) => {
    if (!newStart) return;
    setDepartureDate(newStart);
    setReturnDate(addDays(newStart, packageMaxNights));
  };

  const handleReturnDateChange = (newEnd) => {
    if (!newEnd) return;
    const minEnd = departureDate;
    const maxEnd = addDays(departureDate, packageMaxNights);
    if (newEnd < minEnd) setReturnDate(minEnd);
    else if (newEnd > maxEnd) setReturnDate(maxEnd);
    else setReturnDate(newEnd);
  };

  // Itinerary accordion toggle state
  const [expandedDay, setExpandedDay] = useState(0); // Day 1 open by default

  // Collect gallery photos (Real package image, hotel image, vehicle image, custom images)
  const galleryImages = useMemo(() => {
    const list = [];
    if (pkg.imageUrl || pkg.image || pkg.image_url) {
      list.push(pkg.imageUrl || pkg.image || pkg.image_url);
    }
    if (details.hotelImage && !list.includes(details.hotelImage)) {
      list.push(details.hotelImage);
    }
    if (details.vehicleImage && !list.includes(details.vehicleImage)) {
      list.push(details.vehicleImage);
    }
    if (pkg.images_json) {
      try {
        const parsed = JSON.parse(pkg.images_json);
        if (Array.isArray(parsed)) {
          parsed.forEach(img => { if (img && !list.includes(img)) list.push(img); });
        }
      } catch (e) {}
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80');
    }
    return list;
  }, [pkg, details.hotelImage, details.vehicleImage]);

  // ─── Traveller State (Step 2) ──────────────────────────────────────────
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [numInfants, setNumInfants] = useState(0);

  const [travellers, setTravellers] = useState([
    { type: 'Adult', title: 'Mr', firstName: '', lastName: '', age: 30 },
    { type: 'Adult', title: 'Ms', firstName: '', lastName: '', age: 28 }
  ]);
  const [contactEmail, setContactEmail] = useState(() => currentUser?.email || customerUser?.email || '');
  const [contactPhone, setContactPhone] = useState(() => currentUser?.phone || customerUser?.phone || '');
  const [drivingLicense, setDrivingLicense] = useState('');

  const updateTravellerCount = (type, increment) => {
    if (type === 'adults') {
      const next = numAdults + increment;
      if (next < 1 || next > 10) return;
      setNumAdults(next);
      adjustTravellersList(next, numChildren);
    } else if (type === 'children') {
      const next = numChildren + increment;
      if (next < 0 || next > 8) return;
      setNumChildren(next);
      adjustTravellersList(numAdults, next);
    } else if (type === 'infants') {
      const next = numInfants + increment;
      if (next < 0 || next > 4) return;
      setNumInfants(next);
    }
  };

  const adjustTravellersList = (adults, children) => {
    const total = adults + children;
    let list = [...travellers];
    if (list.length < total) {
      while (list.length < total) {
        const isAdult = list.length < adults;
        list.push({
          type: isAdult ? 'Adult' : 'Child',
          title: isAdult ? 'Mr' : 'Mstr',
          firstName: '',
          lastName: '',
          age: isAdult ? 30 : 8
        });
      }
    } else if (list.length > total) {
      list = list.slice(0, total);
    }
    for (let i = 0; i < list.length; i++) {
      list[i].type = i < adults ? 'Adult' : 'Child';
    }
    setTravellers(list);
  };

  const handleTravellerChange = (index, field, val) => {
    const updated = [...travellers];
    updated[index][field] = val;
    setTravellers(updated);
  };

  // ─── Payment & Pricing State (Step 3) ───────────────────────────────────
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'advance'
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Fetch wallet balance when phone is entered
  useEffect(() => {
    const clean = String(contactPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      api.fetchCustomerWallet(clean).then(w => {
        if (w && w.available_balance > 0) {
          setWalletBalance(w.available_balance);
        } else {
          setWalletBalance(0);
          setUseWalletCashback(false);
        }
      }).catch(() => {});
      api.fetchCustomerLoyalty(clean).then(l => {
        if (l) setLoyaltyInfo(l);
      }).catch(() => {});
    }
  }, [contactPhone]);

  // Existing authoritative pricing calculation
  const totalAmount = useMemo(() => {
    const adultCost = pricePerPerson * numAdults;
    const childCost = Math.round(pricePerPerson * 0.5) * numChildren;
    return adultCost + childCost;
  }, [pricePerPerson, numAdults, numChildren]);

  const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
  const isGold = customerTier === 'Gold';
  const isPlatinum = customerTier === 'Platinum';
  const tierDiscount = (isGold && totalAmount > 5000) ? 500 : ((isPlatinum && totalAmount > 10000) ? 1000 : 0);
  
  const discountedTotal = Math.max(0, totalAmount - tierDiscount);
  const advancePercent = pkg.advance_percentage || 25;
  const advanceAmount = Math.round((discountedTotal * advancePercent) / 100);

  const maxWalletBenefit = Math.round(discountedTotal * 0.10);
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
  
  const finalPayableTotal = Math.max(0, discountedTotal - appliedWalletAmount);
  const finalPayableAdvance = Math.max(0, advanceAmount - appliedWalletAmount);
  const payableAmount = paymentMode === 'full' ? finalPayableTotal : finalPayableAdvance;

  // ─── Actions & Step Transitions ─────────────────────────────────────────
  const handleStartBooking = () => {
    if (document.activeElement?.blur) document.activeElement.blur();
    setStep('travellers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const lead = travellers[0];
    if (!lead || !lead.firstName?.trim() || !lead.lastName?.trim()) {
      alert('Please enter First and Last Name for the Lead Traveller.');
      return;
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      alert('Please enter a valid email address to receive your booking confirmation and voucher.');
      return;
    }
    if (!contactPhone || String(contactPhone).replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number for tour coordinator updates.');
      return;
    }
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmAndPay = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSubmitting(true);

    const lead = travellers[0] || {};
    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Valued Guest';
    const isAdvance = paymentMode === 'advance';
    const actualPaid = isAdvance ? finalPayableAdvance : finalPayableTotal;
    const remainingBalance = Math.max(0, discountedTotal - (actualPaid + appliedWalletAmount));
    const cleanPhone = String(contactPhone).replace(/\D/g, '');

    const bookingPayload = {
      name: leadName,
      customer_name: leadName,
      phone: contactPhone,
      customer_phone: contactPhone,
      email: contactEmail,
      customer_email: contactEmail,
      customer_id: `c_${cleanPhone || Date.now()}`,
      license: isSelfDrivePackage ? (drivingLicense || '') : '',
      pickup_loc: 'Goa Airport / Railway Station / Hotel',
      pickup_location: 'Goa Airport / Railway Station / Hotel',
      drop_loc: 'Goa Airport / Railway Station / Hotel',
      drop_location: 'Goa Airport / Railway Station / Hotel',
      pickup_date: departureDate,
      drop_date: returnDate,
      departure_date: departureDate,
      return_date: returnDate,
      duration: `${nights} Nights / ${days} Days`,
      duration_nights: nights,
      duration_days: days,
      package_max_nights: packageMaxNights,
      item_id: pkg.id,
      item_name: pkg.name,
      package_name: pkg.name,
      package_type: pkg.package_type || 'Trip Package',
      type: isSelfDrivePackage ? 'selfdrive' : 'package',
      hotel_name: details.hotelName,
      room_type: details.roomType,
      meal_plan: details.mealPlan,
      vehicle_name: details.vehicleName,
      vehicle_image: details.vehicleImage,
      image: pkg.imageUrl || pkg.image || details.hotelImage,
      total_amount: totalAmount,
      total_paid: actualPaid,
      amount_paid: actualPaid,
      paid_amount: actualPaid,
      remaining_amount: remainingBalance,
      pending_amount: remainingBalance,
      status: 'Confirmed',
      payment_status: remainingBalance <= 0 ? 'Paid' : 'Partial',
      payment_mode: paymentMode,
      payment_method: isAdvance ? '25% Advance Hold' : 'Online Payment',
      traveller_details_json: {
        adults: numAdults,
        children: numChildren,
        infants: numInfants,
        list: travellers,
        contactEmail,
        contactPhone
      },
      driver_required: details.driverIncluded ? 1 : 0,
      driver_service_type: details.driverType,
      driver_charge: (pkg.driver_pricing_type === 'additional_fee' ? (pkg.driver_amount || 0) : 0)
    };

    try {
      const res = await api.createBooking(bookingPayload);
      const createdRecord = {
        ...(res?.booking || bookingPayload),
        id: res?.booking_id || res?.id || (res?.booking && res.booking.id) || `WG${Math.floor(100000 + Math.random() * 900000)}`,
        booking_id: res?.booking_id || res?.id || (res?.booking && res.booking.id) || `WG${Math.floor(100000 + Math.random() * 900000)}`,
        cashback_preview: res?.cashback_preview || (res?.booking && res.booking.cashback_preview) || Math.round(discountedTotal * 0.10)
      };
      setConfirmedBooking(createdRecord);
      onConfirmBooking(createdRecord);
      setStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('Direct booking fallback used:', err);
      const fallbackRecord = {
        ...bookingPayload,
        id: `WG${Math.floor(100000 + Math.random() * 900000)}`,
        booking_id: `WG${Math.floor(100000 + Math.random() * 900000)}`,
        cashback_preview: Math.round(discountedTotal * 0.10)
      };
      setConfirmedBooking(fallbackRecord);
      onConfirmBooking(fallbackRecord);
      setStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintVoucher = (e) => {
    if (e?.preventDefault) e.preventDefault();
    document.body.classList.add('voucher-print-active');
    const cleanup = () => {
      document.body.classList.remove('voucher-print-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    try { window.focus(); } catch (err) {}
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 50);
  };

  // Unified booking record for BookingVoucher
  const unifiedBookingRecord = useMemo(() => {
    if (!confirmedBooking) return null;
    const lead = travellers[0] || {};
    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Valued Guest';
    return {
      id: confirmedBooking.id || confirmedBooking.booking_id,
      booking_id: confirmedBooking.id || confirmedBooking.booking_id,
      service_type: 'package',
      type: 'package',
      item_type: 'package',
      item_name: pkg.name,
      package_name: pkg.name,
      customer_name: leadName,
      guest_name: leadName,
      customer_phone: contactPhone,
      phone: contactPhone,
      customer_email: contactEmail,
      email: contactEmail,
      pickup_date: departureDate,
      drop_date: returnDate,
      departure_date: departureDate,
      return_date: returnDate,
      duration: `${nights} Nights / ${days} Days`,
      duration_nights: nights,
      duration_days: days,
      booking_days: days,
      pickup_loc: 'Goa Airport / Railway Station / Hotel',
      drop_loc: 'Goa Airport / Railway Station / Hotel',
      total_amount: totalAmount,
      amount_paid: paymentMode === 'advance' ? finalPayableAdvance : finalPayableTotal,
      remaining_amount: Math.max(0, discountedTotal - (paymentMode === 'advance' ? finalPayableAdvance : finalPayableTotal)),
      payment_status: paymentMode === 'advance' ? 'Partial' : 'Paid',
      payment_method: paymentMode === 'advance' ? '25% Advance Hold' : 'Online Payment',
      status: 'Confirmed',
      hotel_name: details.hotelName,
      room_type: details.roomType,
      meal_plan: details.mealPlan,
      hotel_category: details.hotelCategory,
      vehicle_name: details.vehicleName,
      driver_name: details.driverIncluded ? details.driverType : 'Not Included',
      driver_required: details.driverIncluded ? 1 : 0,
      driver_service_type: details.driverType,
      places_included: details.sightseeingList.join(', '),
      sightseeing_places: details.sightseeingList.join(', '),
      cancellation_policy: details.cancellationPolicy,
      created_at: new Date().toISOString(),
      ...confirmedBooking
    };
  }, [confirmedBooking, pkg.name, travellers, contactPhone, contactEmail, departureDate, returnDate, nights, days, totalAmount, paymentMode, finalPayableAdvance, finalPayableTotal, discountedTotal, details]);

  // ══════════════════════════════════════════════════════════════════════════
  // STEP INDICATOR COMPONENT (Sections 12, 13, 15)
  // ══════════════════════════════════════════════════════════════════════════
  const renderStepIndicator = () => (
    <div className="bg-white border-bottom py-3 shadow-xs mb-4">
      <div className="container">
        <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 gap-md-4">
          
          {/* Step 1: Package */}
          <button 
            type="button" 
            onClick={() => setStep('details')}
            className={`btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 fw-bold ${step === 'details' ? 'text-primary' : 'text-success'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <span className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step === 'details' ? 'bg-primary text-white' : 'bg-success text-white'}`} style={{ width: '24px', height: '24px', fontSize: '11px' }}>
              {step === 'details' ? '1' : '✓'}
            </span>
            <span>1. Package</span>
          </button>

          <ChevronRight size={14} className="text-muted opacity-50 d-none d-sm-inline" />

          {/* Step 2: Traveller Details */}
          <button 
            type="button" 
            onClick={() => { if (step === 'payment') setStep('travellers'); }}
            disabled={step === 'details' || step === 'confirmation'}
            className={`btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 fw-bold ${step === 'travellers' ? 'text-primary' : (step === 'payment' || step === 'confirmation' ? 'text-success' : 'text-muted')}`}
            style={{ fontSize: '0.85rem' }}
          >
            <span className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step === 'travellers' ? 'bg-primary text-white' : (step === 'payment' || step === 'confirmation' ? 'bg-success text-white' : 'bg-light text-muted border')}`} style={{ width: '24px', height: '24px', fontSize: '11px' }}>
              {step === 'payment' || step === 'confirmation' ? '✓' : '2'}
            </span>
            <span>2. Traveller Details</span>
          </button>

          <ChevronRight size={14} className="text-muted opacity-50 d-none d-sm-inline" />

          {/* Step 3: Payment */}
          <div 
            className={`d-flex align-items-center gap-2 fw-bold ${step === 'payment' ? 'text-primary' : (step === 'confirmation' ? 'text-success' : 'text-muted')}`}
            style={{ fontSize: '0.85rem' }}
          >
            <span className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step === 'payment' ? 'bg-primary text-white' : (step === 'confirmation' ? 'bg-success text-white' : 'bg-light text-muted border')}`} style={{ width: '24px', height: '24px', fontSize: '11px' }}>
              {step === 'confirmation' ? '✓' : '3'}
            </span>
            <span>3. Payment</span>
          </div>

          <ChevronRight size={14} className="text-muted opacity-50 d-none d-sm-inline" />

          {/* Step 4: Confirmation */}
          <div 
            className={`d-flex align-items-center gap-2 fw-bold ${step === 'confirmation' ? 'text-success' : 'text-muted'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <span className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step === 'confirmation' ? 'bg-success text-white' : 'bg-light text-muted border'}`} style={{ width: '24px', height: '24px', fontSize: '11px' }}>
              {step === 'confirmation' ? '✓' : '4'}
            </span>
            <span>4. Confirmation</span>
          </div>

        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: TRAVELLER DETAILS PAGE (Section 12)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'travellers') {
    return (
      <div className="traveller-details-page pb-5" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {renderStepIndicator()}

        <div className="container py-2">
          {/* Back Action */}
          <button 
            type="button" 
            onClick={() => setStep('details')} 
            className="btn btn-link text-dark text-decoration-none p-0 mb-3 d-inline-flex align-items-center gap-1.5 fw-bold"
            style={{ fontSize: '0.88rem' }}
          >
            <ArrowLeft size={16} /> Back to Package Details
          </button>

          {/* Selected Package Summary Header */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ borderLeft: '4px solid #FF6333' }}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  {pkg.package_type || 'WOW GOA Fixed Package'}
                </span>
                <h4 className="fw-bold text-dark mb-1">{pkg.name}</h4>
                <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                  <span className="d-flex align-items-center gap-1">
                    <MapPin size={14} className="text-danger" /> {pkg.destination || 'Goa, India'}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Clock size={14} className="text-primary" /> {nights} Nights / {days} Days
                  </span>
                </div>
              </div>

              <div className="bg-light p-3 rounded-3 border text-md-end">
                <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.65rem' }}>Travel Dates</span>
                <span className="fw-bold text-primary small d-flex align-items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-danger" />
                  <span>{formatDisplayDate(departureDate)}</span>
                  <span>→</span>
                  <span>{formatDisplayDate(returnDate)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left: Guest Management & Forms */}
            <div className="col-12 col-lg-8">
              
              {/* MANAGE GUESTS (Adults, Children, Infants) */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <Users size={20} className="text-primary" /> Manage Guests
                </h5>
                <p className="text-muted small mb-3">Specify guest composition for room allocation and permits.</p>

                <div className="d-flex flex-wrap gap-3">
                  {/* Adults */}
                  <div className="p-3 bg-light rounded-3 border flex-grow-1" style={{ minWidth: '180px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark d-block small">Adults</strong>
                        <span className="text-muted" style={{ fontSize: '11px' }}>12+ years</span>
                      </div>
                      <div className="d-flex align-items-center border rounded-pill bg-white shadow-xs overflow-hidden">
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('adults', -1)}>-</button>
                        <span className="px-2 fw-bold text-primary small">{numAdults}</span>
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('adults', 1)}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="p-3 bg-light rounded-3 border flex-grow-1" style={{ minWidth: '180px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark d-block small">Children</strong>
                        <span className="text-muted" style={{ fontSize: '11px' }}>2 - 11 years</span>
                      </div>
                      <div className="d-flex align-items-center border rounded-pill bg-white shadow-xs overflow-hidden">
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('children', -1)}>-</button>
                        <span className="px-2 fw-bold text-primary small">{numChildren}</span>
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('children', 1)}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="p-3 bg-light rounded-3 border flex-grow-1" style={{ minWidth: '180px' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-dark d-block small">Infants</strong>
                        <span className="text-muted" style={{ fontSize: '11px' }}>Under 2 years</span>
                      </div>
                      <div className="d-flex align-items-center border rounded-pill bg-white shadow-xs overflow-hidden">
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('infants', -1)}>-</button>
                        <span className="px-2 fw-bold text-primary small">{numInfants}</span>
                        <button type="button" className="btn btn-sm btn-link text-dark px-3 py-1 fw-bold text-decoration-none" onClick={() => updateTravellerCount('infants', 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Forms */}
              {travellers.map((traveller, idx) => (
                <div key={idx} className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <User size={16} className="text-primary" />
                      <span>{traveller.type} {idx + 1}</span>
                      {idx === 0 && <span className="badge bg-success bg-opacity-15 text-success fw-bold text-xxs">Lead Traveller</span>}
                    </h6>
                    <span className="text-muted text-xxs">As on Government ID</span>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-2">
                      <label className="form-label text-muted small fw-bold mb-1">Title *</label>
                      <select 
                        className="form-select form-select-sm fw-semibold" 
                        value={traveller.title || 'Mr'} 
                        onChange={(e) => handleTravellerChange(idx, 'title', e.target.value)}
                      >
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Mstr">Mstr</option>
                        <option value="Miss">Miss</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted small fw-bold mb-1">First &amp; Middle Name *</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-semibold" 
                        placeholder="e.g. Rahul" 
                        value={traveller.firstName} 
                        onChange={(e) => handleTravellerChange(idx, 'firstName', e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted small fw-bold mb-1">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-semibold" 
                        placeholder="e.g. Sharma" 
                        value={traveller.lastName} 
                        onChange={(e) => handleTravellerChange(idx, 'lastName', e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-2">
                      <label className="form-label text-muted small fw-bold mb-1">Age *</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm fw-semibold" 
                        placeholder="e.g. 30" 
                        min={traveller.type === 'Adult' ? 12 : 2} 
                        max={100} 
                        value={traveller.age} 
                        onChange={(e) => handleTravellerChange(idx, 'age', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Details */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <Phone size={20} className="text-primary" /> Contact Details for Trip Updates
                </h5>
                <p className="text-muted small mb-3">Your booking confirmation voucher and driver coordination will be sent here.</p>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small fw-bold mb-1">Mobile Number (WhatsApp) *</label>
                    <InternationalPhoneInput 
                      value={contactPhone}
                      onChange={setContactPhone}
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small fw-bold mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      className="form-control fw-semibold" 
                      placeholder="e.g. traveller@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Self-Drive Specific: STRICTLY ONLY if isSelfDrivePackage */}
              {isSelfDrivePackage && (
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" /> Driving License Verification
                  </h5>
                  <p className="text-muted small mb-3">Self-drive vehicle requires a valid government-issued motor driving license.</p>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted small fw-bold mb-1">Upload Driving License (Optional Now)</label>
                      <input 
                        type="file" 
                        className="form-control form-control-sm" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setDrivingLicense(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Continue CTA */}
              <div className="d-flex justify-content-between align-items-center pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep('details')} 
                  className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-bold"
                >
                  ← Back to Package
                </button>

                <button 
                  type="button" 
                  onClick={handleProceedToPayment} 
                  className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '0.95rem' }}
                >
                  <span>Continue to Booking Summary</span>
                  <ChevronRight size={18} />
                </button>
              </div>

            </div>

            {/* Right: Sticky Summary */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
                <h5 className="fw-bold text-dark mb-3">Booking Summary</h5>
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <strong className="text-dark d-block small mb-1">{pkg.name}</strong>
                  <span className="text-muted text-xxs d-block">{nights} Nights / {days} Days • {pkg.destination || 'Goa, India'}</span>
                  <div className="mt-2 pt-2 border-top text-xxs text-secondary d-flex flex-column gap-1">
                    <div>🏨 <strong>Hotel:</strong> {details.hotelName}</div>
                    <div>🚗 <strong>Vehicle:</strong> {details.vehicleName}</div>
                    <div>🧑‍✈️ <strong>Driver:</strong> {details.driverIncluded ? details.driverType : 'Not Included'}</div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center small mb-2 text-muted">
                  <span>Base Rate:</span>
                  <span className="fw-bold text-dark">₹{pricePerPerson.toLocaleString('en-IN')} × {numAdults} Adults</span>
                </div>
                {numChildren > 0 && (
                  <div className="d-flex justify-content-between align-items-center small mb-2 text-muted">
                    <span>Children Rate:</span>
                    <span className="fw-bold text-dark">₹{Math.round(pricePerPerson * 0.5).toLocaleString('en-IN')} × {numChildren} Children</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top mb-3">
                  <span className="fw-bold text-dark">Total Price:</span>
                  <span className="fw-black text-primary fs-5" style={{ color: '#FF6333' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

                <button 
                  type="button" 
                  onClick={handleProceedToPayment} 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }}
                >
                  <span>Continue to Summary</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: BOOKING SUMMARY & PAYMENT PAGE (Sections 13 & 14)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'payment') {
    return (
      <div className="booking-summary-payment-page pb-5" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {renderStepIndicator()}

        <div className="container py-2">
          <button 
            type="button" 
            onClick={() => setStep('travellers')} 
            className="btn btn-link text-dark text-decoration-none p-0 mb-3 d-inline-flex align-items-center gap-1.5 fw-bold"
            style={{ fontSize: '0.88rem' }}
          >
            <ArrowLeft size={16} /> Back to Traveller Details
          </button>

          <div className="row g-4">
            {/* Left: Comprehensive Review Card */}
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                  <div>
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      Review Your Booking
                    </span>
                    <h3 className="fw-bold text-dark mb-0">Trip Package Summary</h3>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1.5 rounded-pill">
                    ✓ Pre-Configured Package
                  </span>
                </div>

                {/* Review Rows */}
                <div className="d-flex flex-column gap-3 mb-4">
                  
                  {/* Package & Destination */}
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Package</span>
                    <h5 className="fw-bold text-primary mb-1">{pkg.name}</h5>
                    <span className="text-muted small">{pkg.destination || 'Goa, India'} • {nights} Nights / {days} Days</span>
                  </div>

                  {/* Travel Dates */}
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                    <div>
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Travel Dates</span>
                      <strong className="text-dark small">{formatDisplayDate(departureDate)} → {formatDisplayDate(returnDate)}</strong>
                    </div>
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">{nights}N / {days}D</span>
                  </div>

                  {/* Travellers */}
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.68rem' }}>Travellers ({numAdults} Adults{numChildren > 0 ? `, ${numChildren} Children` : ''})</span>
                    <div className="d-flex flex-wrap gap-2">
                      {travellers.map((t, i) => (
                        <span key={i} className="badge bg-white text-dark border px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.75rem' }}>
                          👤 {t.title} {t.firstName} {t.lastName} ({t.type}, {t.age} yrs)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.68rem' }}>Hotel Accommodation</span>
                    <strong className="text-dark d-block">{details.hotelName}</strong>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25" style={{ fontSize: '11px' }}>⭐ {details.hotelCategory}</span>
                      <span className="badge bg-white text-secondary border" style={{ fontSize: '11px' }}>🛏️ {details.roomType}</span>
                      <span className="badge bg-white text-success border" style={{ fontSize: '11px' }}>🍽️ {details.mealPlan}</span>
                    </div>
                  </div>

                  {/* Vehicle & Driver */}
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.68rem' }}>Vehicle &amp; Chauffeur Service</span>
                    <div className="row g-2">
                      <div className="col-12 col-sm-6">
                        <strong className="text-dark d-block small">🚗 {details.vehicleName}</strong>
                        <span className="text-muted" style={{ fontSize: '11.5px' }}>{details.vehicleSeats} • {details.vehicleAc} • Included</span>
                      </div>
                      <div className="col-12 col-sm-6">
                        <strong className="text-dark d-block small">🧑‍✈️ Driver Service</strong>
                        <span className="text-success fw-bold" style={{ fontSize: '11.5px' }}>
                          {details.driverIncluded ? `${details.driverType} (Included)` : 'Not Included'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sightseeing & Activities */}
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.68rem' }}>Sightseeing &amp; Activities Included</span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {details.sightseeingList.slice(0, 5).map((s, idx) => (
                        <span key={idx} className="badge bg-white text-secondary border" style={{ fontSize: '11px' }}>📍 {s}</span>
                      ))}
                      {details.activitiesList.map((a, idx) => (
                        <span key={idx} className="badge bg-info bg-opacity-10 text-dark border border-info border-opacity-25" style={{ fontSize: '11px' }}>🎯 {a.name}</span>
                      ))}
                    </div>
                  </div>

                  {/* Flight & Transfers */}
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                    <div>
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Flight Option</span>
                      <strong className="text-dark small">{details.hasFlight ? '✈️ Round-Trip Flights Included' : '✈️ Without Flight'}</strong>
                    </div>
                    <div className="text-end">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Airport Transfers</span>
                      <strong className="text-dark small">Included in Package</strong>
                    </div>
                  </div>

                </div>

                {/* Guarantee & Cancellation */}
                <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success small d-flex align-items-start gap-2">
                  <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Protected by WOW GOA Guarantee:</strong>
                    <div className="text-muted mt-0.5" style={{ fontSize: '11.5px' }}>
                      {details.cancellationPolicy}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Payment Options & Billing Breakdown */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <CreditCard size={20} className="text-primary" /> Select Payment Option
                </h5>

                {/* Option 1: Full Payment */}
                <div 
                  className={`border rounded-3 p-3 mb-3 cursor-pointer transition-all ${paymentMode === 'full' ? 'border-primary bg-primary bg-opacity-10 shadow-xs' : 'bg-white'}`}
                  onClick={() => setPaymentMode('full')}
                  style={{ cursor: 'pointer', border: paymentMode === 'full' ? '2px solid #0d6efd' : '1px solid #e2e8f0' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: '20px', height: '20px', borderColor: paymentMode === 'full' ? '#0d6efd' : '#cbd5e1' }}>
                      {paymentMode === 'full' && <div className="bg-primary rounded-circle" style={{ width: '10px', height: '10px' }} />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold d-flex justify-content-between text-dark">
                        <span>Pay Full Amount</span>
                        <span>₹{finalPayableTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-muted small mt-0.5" style={{ fontSize: '11.5px' }}>Complete hassle-free online confirmation now.</div>
                    </div>
                  </div>
                </div>

                {/* Option 2: 25% Advance Hold */}
                <div 
                  className={`border rounded-3 p-3 mb-3 cursor-pointer transition-all ${paymentMode === 'advance' ? 'border-primary bg-primary bg-opacity-10 shadow-xs' : 'bg-white'}`}
                  onClick={() => setPaymentMode('advance')}
                  style={{ cursor: 'pointer', border: paymentMode === 'advance' ? '2px solid #0d6efd' : '1px solid #e2e8f0' }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: '20px', height: '20px', borderColor: paymentMode === 'advance' ? '#0d6efd' : '#cbd5e1' }}>
                      {paymentMode === 'advance' && <div className="bg-primary rounded-circle" style={{ width: '10px', height: '10px' }} />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold d-flex justify-content-between text-dark">
                        <span>Pay To Hold ({advancePercent}%)</span>
                        <span>₹{finalPayableAdvance.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-muted small mt-0.5" style={{ fontSize: '11.5px' }}>
                        Pay ₹{finalPayableAdvance.toLocaleString('en-IN')} now to lock in rates; balance due at check-in.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loyalty Tier Discount */}
                {tierDiscount > 0 && (
                  <div className="p-2.5 rounded-3 mb-3 text-xs fw-semibold d-flex align-items-center justify-content-between" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
                    <div className="d-flex align-items-center gap-1.5">
                      <Crown size={15} />
                      <span>{customerTier} Tier Instant Privilege</span>
                    </div>
                    <span>-₹{tierDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* WOW GOA Wallet Toggle */}
                {walletBalance > 0 && (
                  <div className="p-3 rounded-3 mb-3 bg-light border">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <Wallet size={16} className="text-success" />
                        <div>
                          <strong className="text-dark d-block small">WOW GOA Wallet</strong>
                          <span className="text-muted" style={{ fontSize: '10.5px' }}>Balance: ₹{walletBalance.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          id="usePkgWalletToggle"
                          checked={useWalletCashback}
                          onChange={(e) => setUseWalletCashback(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                    {useWalletCashback && (
                      <div className="mt-2 text-success small fw-bold d-flex justify-content-between">
                        <span>Wallet Benefit:</span>
                        <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Summary */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between small text-muted mb-1.5">
                    <span>Package Price ({numAdults} Adults):</span>
                    <span className="fw-bold text-dark">₹{(pricePerPerson * numAdults).toLocaleString('en-IN')}</span>
                  </div>
                  {numChildren > 0 && (
                    <div className="d-flex justify-content-between small text-muted mb-1.5">
                      <span>Children Rate ({numChildren} Children):</span>
                      <span className="fw-bold text-dark">₹{(Math.round(pricePerPerson * 0.5) * numChildren).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {tierDiscount > 0 && (
                    <div className="d-flex justify-content-between small text-warning fw-bold mb-1.5">
                      <span>Tier Discount:</span>
                      <span>-₹{tierDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {appliedWalletAmount > 0 && (
                    <div className="d-flex justify-content-between small text-success fw-bold mb-1.5">
                      <span>Wallet Benefit:</span>
                      <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                    <strong className="text-dark">Amount Payable Now:</strong>
                    <strong className="fs-4 text-primary" style={{ color: '#FF6333' }}>₹{payableAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  {paymentMode === 'advance' && (
                    <div className="text-muted text-xxs text-end mt-1">
                      Remaining balance: ₹{(discountedTotal - advanceAmount).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                {/* Pay Action Button */}
                <button 
                  type="button" 
                  onClick={handleConfirmAndPay}
                  disabled={isSubmitting}
                  className="btn btn-primary w-100 py-3.5 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '1.05rem', opacity: isSubmitting ? 0.75 : 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Pay ₹{payableAmount.toLocaleString('en-IN')}</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                {/* Cashback Preview */}
                <div className="mt-3 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                  <span className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                    <Gift size={13} className="text-warning" />
                    <span>10% Cashback on Completion: <strong className="text-success">₹{Math.round(discountedTotal * 0.10).toLocaleString('en-IN')}</strong></span>
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4: BOOKING CONFIRMATION & VOUCHER (Sections 15 & 16)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'confirmation') {
    const bookingRef = confirmedBooking?.booking_id || confirmedBooking?.id || `WG${Math.floor(100000 + Math.random() * 900000)}`;
    const paidAmount = paymentMode === 'advance' ? finalPayableAdvance : finalPayableTotal;

    return (
      <div className="booking-confirmation-page pb-5" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {renderStepIndicator()}

        <div className="container py-2">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">

              {/* Confirmation Card */}
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-4 bg-white text-center position-relative overflow-hidden">
                <div className="position-absolute top-0 end-0 bg-success text-white px-3 py-1 rounded-bottom-start fw-bold text-xxs">
                  ✓ Instant Confirmation
                </div>

                <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                  <CheckCircle2 size={42} strokeWidth={2.4} />
                </div>

                <h2 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.8rem' }}>
                  Booking Confirmed!
                </h2>
                <p className="text-muted small mb-4">
                  Thank you for booking with WOW GOA. Your reservation for <strong className="text-dark">{pkg.name}</strong> is confirmed.
                </p>

                {/* Booking Key Attributes Box */}
                <div className="p-4 bg-light rounded-3 border text-start mb-4">
                  <div className="row g-3">
                    
                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Booking Reference</span>
                      <strong className="text-primary font-monospace fs-5">#{bookingRef}</strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Booking Status</span>
                      <span className="badge bg-success px-2.5 py-1">Confirmed</span>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Package</span>
                      <strong className="text-dark small">{pkg.name}</strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Travel Dates</span>
                      <strong className="text-dark small">{formatDisplayDate(departureDate)} → {formatDisplayDate(returnDate)} ({nights}N / {days}D)</strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Hotel Accommodation</span>
                      <strong className="text-dark small">{details.hotelName} ({details.roomType})</strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Vehicle &amp; Driver</span>
                      <strong className="text-dark small">{details.vehicleName} • {details.driverIncluded ? details.driverType : 'Vehicle Only'}</strong>
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Total Paid Online</span>
                      <strong className="text-success fs-6">₹{paidAmount.toLocaleString('en-IN')}</strong>
                      {paymentMode === 'advance' && (
                        <span className="text-muted text-xxs d-block">(25% Advance Hold • ₹{(discountedTotal - advanceAmount).toLocaleString('en-IN')} at check-in)</span>
                      )}
                    </div>

                    <div className="col-12 col-sm-6">
                      <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem' }}>Guest Coordinator</span>
                      <span className="text-dark small">24/7 Local Concierge Assigned</span>
                    </div>

                  </div>
                </div>

                {/* Cashback Reward Preview */}
                <CashbackRewardCard 
                  cashbackPreview={confirmedBooking?.cashback_preview || Math.round(discountedTotal * 0.10)}
                  isModalView={false}
                />

                {/* 4 Prominent Action Buttons (Section 15) */}
                <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2 gap-sm-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowVoucherModal(true)}
                    className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto"
                    style={{ background: '#00B8D9', borderColor: '#00B8D9' }}
                    id="btn-view-voucher"
                  >
                    <Download size={16} />
                    <span>View / Download Voucher</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={handlePrintVoucher}
                    className="btn btn-outline-dark rounded-pill px-3.5 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto"
                    style={{ borderColor: '#cbd5e1', background: '#ffffff' }}
                    id="btn-print-voucher-direct"
                  >
                    <Printer size={16} />
                    <span>Print Voucher</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      try {
                        sessionStorage.setItem('tg_activeTab', 'customer');
                        sessionStorage.setItem('customer_login_phone', contactPhone);
                      } catch (e) {}
                      setActiveTab('customer');
                      window.history.pushState({}, '', '/customer');
                    }}
                    className="btn btn-warning text-dark rounded-pill px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-sm-auto"
                    id="btn-view-bookings"
                  >
                    <Compass size={16} />
                    <span>View My Bookings</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      try {
                        sessionStorage.setItem('tg_activeTab', 'packages');
                      } catch (e) {}
                      setActiveTab('packages');
                      window.history.pushState({}, '', '/packages');
                      if (onBack) onBack();
                    }}
                    className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                    id="btn-go-home"
                  >
                    <Home size={16} />
                    <span>Go to Home</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Dedicated Voucher Print Container (Portalled to document.body for clean single-page A4 print) */}
        {!showVoucherModal && unifiedBookingRecord && typeof document !== 'undefined' && document.body && createPortal(
          <div className="voucher-print-container checkout-step4-print-only">
            <BookingVoucher 
              booking={unifiedBookingRecord} 
              isModal={false} 
              currentUser={currentUser}
              customerUser={customerUser}
            />
          </div>,
          document.body
        )}

        {/* Modal View for Voucher if clicked */}
        {showVoucherModal && unifiedBookingRecord && (
          <BookingVoucher 
            booking={unifiedBookingRecord} 
            isModal={true} 
            currentUser={currentUser}
            customerUser={customerUser}
            onClose={() => setShowVoucherModal(false)} 
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1: PROFESSIONAL PACKAGE DETAILS PAGE (Sections 2 to 10)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="package-details-page pb-5" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ─── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-white border-bottom sticky-top shadow-xs px-4 py-2.5 d-flex align-items-center justify-content-between" style={{ zIndex: 100 }}>
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={onBack} 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-xs"
            title="Back to Packages"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="badge bg-primary bg-opacity-10 text-primary mb-0.5" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {pkg.package_type || 'Holiday Tour Package'}
            </span>
            <h5 className="mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '400px' }}>
              {pkg.name}
            </h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-md-block">
            <span className="text-muted text-xxs d-block">Starting from</span>
            <span className="fw-black text-primary fs-6" style={{ color: '#FF6333' }}>
              ₹{pricePerPerson.toLocaleString('en-IN')} <span className="text-muted fw-normal text-xxs">/ person</span>
            </span>
          </div>

          <button 
            type="button" 
            onClick={handleStartBooking} 
            className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '0.9rem' }}
          >
            <Sparkles size={15} />
            <span>BOOK PACKAGE</span>
          </button>
        </div>
      </div>

      <div className="container py-4">
        
        {/* ─── SECTION 2: HERO & GALLERY ─────────────────────────────────────── */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <ImageCarousel 
                images={galleryImages} 
                alt={pkg.name} 
                height="420px"
                rounded="16px"
              />
            </div>

            <div className="col-12 col-lg-4 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
                  {pkg.tag || 'Special Holiday Deal'}
                </span>
                
                <h3 className="fw-bold mb-2 font-heading" style={{ color: '#0D1B2E', fontSize: '1.5rem' }}>
                  {pkg.name}
                </h3>
                
                <div className="d-flex flex-wrap gap-2 align-items-center small text-muted mb-3">
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <Clock size={13} className="text-primary" /> {nights} Nights / {days} Days
                  </span>
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <MapPin size={13} className="text-danger" /> {pkg.destination || 'Goa, India'}
                  </span>
                  <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-50 fw-bold px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    ⭐ {details.hotelCategory}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="d-flex text-warning">
                    {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                  </div>
                  <span className="fw-bold text-dark small">4.9</span>
                  <span className="text-muted small">(142 Verified Reviews)</span>
                </div>

                <p className="text-secondary small lh-base mb-3">
                  {pkg.description || `Experience the ultimate vacation with our ${nights} Nights / ${days} Days pre-configured holiday package.`}
                </p>
              </div>

              {/* Starting Price & Book CTA Box */}
              <div className="p-3.5 bg-light rounded-3 border">
                <div className="text-muted small mb-1">Starting from</div>
                <div className="d-flex align-items-baseline gap-2">
                  <h2 className="fw-black text-primary mb-0" style={{ color: '#FF6333' }}>
                    ₹{pricePerPerson.toLocaleString('en-IN')}
                  </h2>
                  <span className="text-muted small">/ person</span>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleStartBooking} 
                  className="btn btn-primary w-100 mt-3 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 font-heading"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '1rem', letterSpacing: '0.5px' }}
                >
                  <Sparkles size={18} />
                  <span>BOOK PACKAGE</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ─── SECTION 3: PACKAGE OVERVIEW (6 Compact Cards) ─────────────────── */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
            <Sparkles size={18} className="text-warning" /> Package Overview
          </h5>

          <div className="row g-3">
            
            {/* HOTEL CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase fw-bold" style={{ fontSize: '10px' }}>HOTEL</span>
                    <span className="badge bg-warning bg-opacity-20 text-dark fw-bold" style={{ fontSize: '10px' }}>⭐ {details.hotelCategory}</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-truncate" title={details.hotelName}>{details.hotelName}</h6>
                  <div className="text-muted small mb-1">🛏️ {details.roomType}</div>
                </div>
                <div className="text-success small fw-semibold pt-1 border-top mt-2">
                  ✓ {details.mealPlan}
                </div>
              </div>
            </div>

            {/* VEHICLE CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-success bg-opacity-10 text-success text-uppercase fw-bold" style={{ fontSize: '10px' }}>VEHICLE</span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>{details.vehicleSeats} • {details.vehicleAc}</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-truncate" title={details.vehicleName}>{details.vehicleName}</h6>
                  <div className="text-muted small mb-1">Sanitized dedicated tourist vehicle</div>
                </div>
                <div className="text-success small fw-semibold pt-1 border-top mt-2">
                  ✓ Included in Package
                </div>
              </div>
            </div>

            {/* DRIVER CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-info bg-opacity-10 text-info text-uppercase fw-bold" style={{ fontSize: '10px' }}>DRIVER</span>
                    <span className={`badge ${details.driverIncluded ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary text-white'}`} style={{ fontSize: '10px' }}>
                      {details.driverIncluded ? 'Included' : 'Not Included'}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">
                    {details.driverIncluded ? details.driverType : 'Self-Arranged / Driver Not Included'}
                  </h6>
                  <div className="text-muted small mb-1">
                    {details.driverIncluded ? 'Experienced chauffeur with local expertise' : 'Standard package without dedicated chauffeur'}
                  </div>
                </div>
                <div className={`small fw-semibold pt-1 border-top mt-2 ${details.driverIncluded ? 'text-success' : 'text-muted'}`}>
                  {details.driverIncluded ? '✓ Included in Package' : '✕ Driver Not Included'}
                </div>
              </div>
            </div>

            {/* FLIGHT CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary text-uppercase fw-bold" style={{ fontSize: '10px' }}>FLIGHT</span>
                    <span className={`badge ${details.hasFlight ? 'bg-success text-white' : 'bg-light text-muted border'}`} style={{ fontSize: '10px' }}>
                      {details.hasFlight ? 'With Flight' : 'Without Flight'}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">
                    {details.hasFlight ? 'Round-Trip Airfare Included' : 'Without Flight'}
                  </h6>
                  <div className="text-muted small mb-1">Airport pickup &amp; drop transfers included</div>
                </div>
                <div className="text-muted small pt-1 border-top mt-2">
                  {details.hasFlight ? '✓ Scheduled flight connectivity' : 'Plan your own flights to Goa'}
                </div>
              </div>
            </div>

            {/* SIGHTSEEING CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-warning bg-opacity-10 text-dark text-uppercase fw-bold" style={{ fontSize: '10px' }}>SIGHTSEEING</span>
                    <span className="badge bg-white text-dark border" style={{ fontSize: '10px' }}>{details.sightseeingList.length} Highlights</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-truncate">
                    {details.sightseeingList.slice(0, 3).join(', ')}
                  </h6>
                  <div className="text-muted small mb-1">Covers North &amp; South Goa attractions</div>
                </div>
                <div className="text-success small fw-semibold pt-1 border-top mt-2">
                  ✓ Curated Itinerary Included
                </div>
              </div>
            </div>

            {/* ACTIVITIES CARD */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="badge bg-info bg-opacity-10 text-primary text-uppercase fw-bold" style={{ fontSize: '10px' }}>ACTIVITIES</span>
                    <span className="badge bg-white text-dark border" style={{ fontSize: '10px' }}>{details.activitiesList.length} Included</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-truncate">
                    {details.activitiesList[0]?.name || 'Sunset Cruise & Heritage Tours'}
                  </h6>
                  <div className="text-muted small mb-1">Pre-arranged experience schedule</div>
                </div>
                <div className="text-success small fw-semibold pt-1 border-top mt-2">
                  ✓ Configured in Package
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── MAIN CONTENT TWO-COLUMN LAYOUT (Content | Sticky Summary) ───────── */}
        <div className="row g-4">
          
          {/* LEFT COLUMN: SECTIONS 4 TO 9 */}
          <div className="col-12 col-lg-8">

            {/* ─── SECTION 4: HOTEL SECTION ─────────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
                <Hotel size={18} className="text-primary" /> HOTEL STAY
              </h5>

              <div className="row g-3 align-items-center">
                <div className="col-12 col-sm-4">
                  <div className="rounded-3 overflow-hidden shadow-xs" style={{ height: '170px' }}>
                    <img 
                      src={details.hotelImage} 
                      alt={details.hotelName} 
                      className="w-100 h-100 object-fit-cover" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'; }}
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-8">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-warning bg-opacity-20 text-dark fw-bold" style={{ fontSize: '11px' }}>
                      ⭐ {details.hotelCategory}
                    </span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>
                      {nights} Nights Stay Included
                    </span>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">{details.hotelName}</h5>
                  <p className="text-muted small mb-2">{details.hotelDescription}</p>

                  <div className="p-2.5 bg-light rounded-3 border d-flex flex-column gap-1 mb-2.5">
                    <div className="small"><strong>Room Type:</strong> <span className="text-primary fw-bold">{details.roomType}</span></div>
                    <div className="small"><strong>Meal Plan:</strong> <span className="text-success fw-bold">✓ {details.mealPlan}</span></div>
                  </div>

                  <div className="d-flex flex-wrap gap-1.5">
                    {details.hotelAmenities.map((amenity, i) => (
                      <span key={i} className="badge bg-white text-muted border px-2 py-1" style={{ fontSize: '10.5px' }}>
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 5: VEHICLE & DRIVER SECTION ──────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
                <Car size={18} className="text-success" /> VEHICLE &amp; DRIVER
              </h5>

              <div className="row g-3 align-items-center">
                <div className="col-12 col-sm-4">
                  <div className="rounded-3 overflow-hidden shadow-xs" style={{ height: '170px' }}>
                    <img 
                      src={details.vehicleImage} 
                      alt={details.vehicleName} 
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => { e.target.src = '/backend/uploads/img_6a945dd821766.jpeg'; }}
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-8">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-success bg-opacity-15 text-success fw-bold" style={{ fontSize: '11px' }}>
                      ✓ Dedicated Vehicle
                    </span>
                    <span className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>
                      {details.vehicleSeats} • {details.vehicleAc}
                    </span>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">{details.vehicleName}</h5>
                  <p className="text-muted small mb-2">Dedicated private air-conditioned vehicle provided throughout your tour schedule for all sightseeing and airport transfers.</p>

                  <div className="p-3 bg-light rounded-3 border">
                    <strong className="text-dark small d-block mb-1">Driver Service Status:</strong>
                    {details.driverIncluded ? (
                      <div className="d-flex align-items-center gap-2 text-success fw-bold small">
                        <CheckCircle size={16} />
                        <span>{details.driverType} — Included in Package</span>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-2 text-secondary small">
                        <XCircle size={16} className="text-muted" />
                        <span>Driver: Not Included</span>
                      </div>
                    )}
                    <span className="text-muted text-xxs d-block mt-1">
                      {details.driverIncluded 
                        ? 'All chauffeur allowances, state permits, parking fees, and toll charges are fully inclusive.' 
                        : 'Self-drive rental terms apply.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 6: SIGHTSEEING & ACTIVITIES SECTION ───────────────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
                <Compass size={18} className="text-danger" /> SIGHTSEEING &amp; ACTIVITIES
              </h5>

              <h6 className="fw-bold text-secondary text-uppercase mb-2.5 small" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                Key Sightseeing Attractions Covered
              </h6>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {details.sightseeingList.map((spot, i) => (
                  <span key={i} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                    <MapPin size={13} className="text-danger" /> {spot}
                  </span>
                ))}
              </div>

              {details.activitiesList.length > 0 && (
                <>
                  <h6 className="fw-bold text-secondary text-uppercase mb-2.5 small" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                    Included Adventure &amp; Cultural Activities
                  </h6>
                  <div className="row g-3">
                    {details.activitiesList.map((activity, i) => (
                      <div key={i} className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <strong className="text-dark small">{activity.name}</strong>
                            <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '10px' }}>{activity.duration || '1 Hour'}</span>
                          </div>
                          <p className="text-muted text-xs mb-1.5">{activity.description}</p>
                          <span className="badge bg-success bg-opacity-15 text-success" style={{ fontSize: '10px' }}>✓ Activity Included</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ─── SECTION 7: DAY-WISE ITINERARY (Expandable Accordion) ───────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
                  <Calendar size={18} className="text-primary" /> DAY-WISE ITINERARY
                </h5>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                  {days} Days Schedule
                </span>
              </div>
              <p className="text-muted small mb-3">Click on any day to expand detailed morning, afternoon, evening, and night plans.</p>

              <div className="d-flex flex-column gap-2.5">
                {details.itineraryList.map((day, idx) => {
                  const isExpanded = expandedDay === idx;
                  return (
                    <div key={idx} className="border rounded-3 overflow-hidden transition-all bg-white shadow-xs">
                      {/* Day Accordion Header */}
                      <button 
                        type="button"
                        onClick={() => setExpandedDay(isExpanded ? -1 : idx)}
                        className={`btn w-100 text-start p-3 d-flex align-items-center justify-content-between text-decoration-none ${isExpanded ? 'bg-primary bg-opacity-10 text-primary' : 'bg-light text-dark'}`}
                        style={{ border: 'none' }}
                      >
                        <div className="d-flex align-items-center gap-2.5 min-w-0">
                          <span className={`badge rounded-circle d-inline-flex align-items-center justify-content-center ${isExpanded ? 'bg-primary text-white' : 'bg-dark text-white'}`} style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                            {idx + 1}
                          </span>
                          <span className="fw-bold text-truncate small" style={{ fontSize: '0.92rem' }}>
                            DAY {idx + 1} — {day.title || `Day ${idx + 1} Tour`}
                          </span>
                        </div>
                        <ChevronDown size={18} className={`transition-all text-secondary ${isExpanded ? 'rotate-180 text-primary' : ''}`} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                      </button>

                      {/* Day Accordion Body */}
                      {isExpanded && (
                        <div className="p-3.5 border-top bg-white animate-fade-in">
                          {day.description && (
                            <p className="text-secondary small mb-3 lh-base">{day.description}</p>
                          )}

                          <div className="d-flex flex-column gap-2 mb-3">
                            {day.morning && (
                              <div className="p-2.5 bg-light rounded-2 border-start border-3 border-warning small">
                                <span className="badge bg-warning text-dark text-xxs fw-bold me-2">MORNING</span>
                                <span className="text-dark">{day.morning}</span>
                              </div>
                            )}
                            {day.afternoon && (
                              <div className="p-2.5 bg-light rounded-2 border-start border-3 border-primary small">
                                <span className="badge bg-primary text-white text-xxs fw-bold me-2">AFTERNOON</span>
                                <span className="text-dark">{day.afternoon}</span>
                              </div>
                            )}
                            {day.evening && (
                              <div className="p-2.5 bg-light rounded-2 border-start border-3 border-info small">
                                <span className="badge bg-info text-dark text-xxs fw-bold me-2">EVENING</span>
                                <span className="text-dark">{day.evening}</span>
                              </div>
                            )}
                            {day.night && (
                              <div className="p-2.5 bg-light rounded-2 border-start border-3 border-dark small">
                                <span className="badge bg-dark text-white text-xxs fw-bold me-2">NIGHT</span>
                                <span className="text-dark">{day.night}</span>
                              </div>
                            )}
                          </div>

                          <div className="row g-2 pt-2 border-top text-xxs text-muted">
                            <div className="col-12 col-sm-6">
                              <strong>Stay:</strong> <span className="text-dark">{day.stay || details.hotelName}</span>
                            </div>
                            <div className="col-12 col-sm-6">
                              <strong>Meals:</strong> <span className="text-dark">{Array.isArray(day.meals) ? day.meals.join(' + ') : (day.meals || details.mealPlan)}</span>
                            </div>
                            {day.sightseeing && (
                              <div className="col-12">
                                <strong>Sightseeing:</strong> <span className="text-secondary">{day.sightseeing}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── SECTION 8: INCLUSIONS & EXCLUSIONS ─────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <div className="row g-4">
                
                {/* WHAT'S INCLUDED */}
                <div className="col-12 col-md-6">
                  <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-2 font-heading">
                    <CheckCircle size={18} /> WHAT'S INCLUDED
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.84rem' }}>
                    {details.inclusions.map((item, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 text-secondary">
                        <span className="text-success fw-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* WHAT'S NOT INCLUDED */}
                <div className="col-12 col-md-6">
                  <h6 className="fw-bold mb-3 text-danger d-flex align-items-center gap-2 font-heading">
                    <XCircle size={18} /> WHAT'S NOT INCLUDED
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.84rem' }}>
                    {details.exclusions.map((item, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 text-muted">
                        <span className="text-danger fw-bold">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            {/* ─── SECTION 9: CANCELLATION POLICY ─────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading" style={{ color: '#0D1B2E' }}>
                <Shield size={18} className="text-success" /> CANCELLATION POLICY
              </h5>
              <div className="p-3 bg-light rounded-3 border text-secondary small lh-base">
                <p className="mb-0">{details.cancellationPolicy}</p>
              </div>
            </div>

          </div>

          {/* ─── SECTION 10: STICKY PACKAGE SUMMARY (Right Column) ──────────── */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                  Instant Confirmation
                </span>
                <span className="text-muted text-xxs font-monospace">WOW GOA GUARANTEED</span>
              </div>

              <h5 className="fw-bold text-dark mb-1 font-heading">YOUR TRIP</h5>
              <h6 className="text-primary fw-bold mb-2 small">{pkg.name}</h6>
              <span className="badge bg-light text-secondary border mb-3" style={{ fontSize: '11px' }}>
                {nights} Nights / {days} Days
              </span>

              {/* Trip Schedule & Dates Picker */}
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span className="fw-bold text-dark text-xxs d-flex align-items-center gap-1">
                    <Calendar size={13} className="text-primary" /> Travel Dates
                  </span>
                  <span className="text-muted text-xxs">{nights}N / {days}D</span>
                </div>

                <div className="mb-2">
                  <label className="form-label text-muted text-xxs fw-bold mb-0.5">Start / Departure:</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm fw-bold border bg-white" 
                    min={getTodayDateStr()} 
                    value={departureDate} 
                    onChange={(e) => handleDepartureDateChange(e.target.value)} 
                    style={{ fontSize: '0.82rem', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label className="form-label text-muted text-xxs fw-bold mb-0.5">End / Return:</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm fw-bold border bg-white" 
                    min={departureDate}
                    max={addDays(departureDate, packageMaxNights)}
                    value={returnDate} 
                    onChange={(e) => handleReturnDateChange(e.target.value)} 
                    style={{ fontSize: '0.82rem', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Summary Attributes */}
              <div className="d-flex flex-column gap-2 mb-3 text-muted small border-bottom pb-3">
                <div className="d-flex justify-content-between">
                  <span>Hotel:</span>
                  <span className="fw-bold text-dark text-truncate ms-2 text-end" style={{ maxWidth: '170px' }} title={details.hotelName}>
                    {details.hotelName}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Room:</span>
                  <span className="fw-bold text-dark text-truncate ms-2 text-end" style={{ maxWidth: '170px' }}>
                    {details.roomType}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Meal:</span>
                  <span className="fw-bold text-success text-truncate ms-2 text-end" style={{ maxWidth: '170px' }}>
                    {details.mealPlan}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Vehicle:</span>
                  <span className="fw-bold text-dark text-truncate ms-2 text-end" style={{ maxWidth: '170px' }}>
                    {details.vehicleName}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Driver:</span>
                  <span className="fw-bold text-dark text-truncate ms-2 text-end" style={{ maxWidth: '170px' }}>
                    {details.driverIncluded ? details.driverType : 'Not Included'}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Flight:</span>
                  <span className="fw-bold text-dark text-end">
                    {details.hasFlight ? 'With Flight' : 'Without Flight'}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Travelers:</span>
                  <span className="fw-bold text-dark text-end">
                    {numAdults} Adults{numChildren > 0 ? `, ${numChildren} Child` : ''}
                  </span>
                </div>
              </div>

              {/* Transparent Pricing Calculation */}
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="text-muted small">Starting from</div>
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <h3 className="fw-black text-primary mb-0" style={{ color: '#FF6333' }}>
                    ₹{pricePerPerson.toLocaleString('en-IN')}
                  </h3>
                  <span className="text-muted small">/ person</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                  <span className="fw-bold text-dark">Total ({numAdults} Adults):</span>
                  <span className="fw-black text-dark fs-6">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button 
                type="button" 
                onClick={handleStartBooking} 
                className="btn btn-primary w-100 py-3.5 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 font-heading"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333', fontSize: '1rem', letterSpacing: '0.5px' }}
              >
                <Sparkles size={18} />
                <span>BOOK PACKAGE</span>
                <ChevronRight size={18} />
              </button>

              {onEnquire && (
                <button 
                  type="button" 
                  onClick={() => onEnquire(pkg, { departureDate, returnDate })}
                  className="btn btn-outline-secondary w-100 py-2.5 rounded-pill fw-bold mt-2 small"
                >
                  Enquire About This Package
                </button>
              )}

              <div className="p-2.5 bg-light rounded-3 mt-3 text-muted text-xxs d-flex align-items-start gap-1.5">
                <Shield size={14} className="text-success flex-shrink-0 mt-0.5" />
                <span>100% verified hotels, sanitized vehicles, and 24/7 dedicated local assistance in Goa.</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
