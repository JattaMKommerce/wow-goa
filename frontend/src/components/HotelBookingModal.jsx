import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, ShieldCheck, User, Users, BedDouble, Calendar, ArrowRight, ArrowLeft, Download, MessageCircle, Info, Compass, Cake, Gift, Wallet, Clock, Crown, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import { validateBookingDates, getTodayDateStr, addDays, formatDisplayDate } from '../utils/dateUtils';
import ImageCarousel from './common/ImageCarousel';
import UnifiedGalleryViewer from './UnifiedGalleryViewer';
import DobPicker from './common/DobPicker';
import BookingConfirmationCard from './common/BookingConfirmationCard';
import StaticQRPaymentCard from './common/StaticQRPaymentCard';
import VendorCancellationPolicyCard from './common/VendorCancellationPolicyCard';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import InternationalPhoneInput, { CountryFlag } from './common/InternationalPhoneInput';
import CurrencyPriceDisplay from './common/CurrencyPriceDisplay';
import { useCustomerCurrency } from '../context/CustomerCurrencyContext';
import { parsePhoneNumber, extractPhoneString } from '../utils/countryCurrencyData';

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
];

export default function HotelBookingModal({
  selectedBookingItem,
  setSelectedBookingItem,
  pickupDate,
  dropDate,
  bookingDays,
  isCustomerPortal = false
}) {
  const { country, currency, category, isIndian, isForeign, setCountry, resetCountry } = useCustomerCurrency();
  // Track if booking was opened with a preselected room from HotelDetailsPage
  const [step, setStep] = useState(() => (selectedBookingItem?.preselected_room ? 2 : 1));
  const openedWithPreselectedRef = React.useRef(Boolean(selectedBookingItem?.preselected_room));
  const prevBookingItemIdRef = React.useRef(selectedBookingItem?.id);
  const prevRoomIdRef = React.useRef(selectedBookingItem?.preselected_room?.id);

  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Stay Dates & Times State (Synchronized with selectedBookingItem from HotelDetailsPage or defaults)
  const initialCheckIn = selectedBookingItem?.check_in_date || pickupDate || getTodayDateStr();
  const initialCheckOut = selectedBookingItem?.check_out_date || dropDate || addDays(initialCheckIn, selectedBookingItem?.booking_days || bookingDays || 2);
  const initialNumRooms = selectedBookingItem?.num_rooms ? parseInt(selectedBookingItem.num_rooms, 10) : 1;
  const initialAdults = selectedBookingItem?.adults ? parseInt(selectedBookingItem.adults, 10) : 2;
  const initialChildren = (selectedBookingItem?.children !== undefined && selectedBookingItem?.children !== null)
    ? parseInt(selectedBookingItem.children, 10)
    : 0;

  const [modalCheckInDate, setModalCheckInDate] = useState(initialCheckIn);
  const [modalCheckOutDate, setModalCheckOutDate] = useState(initialCheckOut);
  const [checkInTime, setCheckInTime] = useState('02:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [idempotencyKey, setIdempotencyKey] = useState(() => 'idem_htl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));

  const modalBodyRef = useRef(null);

  // Authoritative Modal Teardown & Reset: clears country/currency state and closes modal
  const handleHotelModalClose = () => {
    setIdempotencyKey('idem_htl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));
    if (resetCountry) resetCountry();
    setSelectedBookingItem(null);
  };

  // Synchronize country on modal start: clean India for new booking, or parsed country if phone already exists
  useEffect(() => {
    const rawP = extractPhoneString(guestPhone);
    if (!rawP) {
      if (resetCountry) resetCountry();
    } else {
      const parsed = parsePhoneNumber(rawP, 'IN');
      if (parsed.country && setCountry) {
        setCountry(parsed.country);
      }
    }
  }, [selectedBookingItem]);

  // Global background scroll lock with exact scroll position preservation
  useEffect(() => {
    lockScroll('hotel-booking-modal');
    return () => {
      unlockScroll('hotel-booking-modal');
    };
  }, []);


  // Synchronize step and preselected room if selectedBookingItem changes while mounted
  useEffect(() => {
    const currentItemId = selectedBookingItem?.id;
    const currentRoomId = selectedBookingItem?.preselected_room?.id;
    if (currentItemId !== prevBookingItemIdRef.current || currentRoomId !== prevRoomIdRef.current) {
      prevBookingItemIdRef.current = currentItemId;
      prevRoomIdRef.current = currentRoomId;
      const hasPre = Boolean(selectedBookingItem?.preselected_room);
      openedWithPreselectedRef.current = hasPre;
      if (hasPre) {
        setStep(2);
        if (selectedBookingItem.preselected_room) {
          setSelectedRoom(selectedBookingItem.preselected_room);
        }
        if (selectedBookingItem.preselected_rate_plan) {
          setSelectedRatePlan(selectedBookingItem.preselected_rate_plan);
        }
      } else {
        setStep(1);
      }
    }
  }, [selectedBookingItem?.id, selectedBookingItem?.preselected_room?.id]);

  useEffect(() => {
    if (selectedBookingItem?.check_in_date) {
      setModalCheckInDate(selectedBookingItem.check_in_date);
    } else if (pickupDate) {
      setModalCheckInDate(pickupDate);
    }
    if (selectedBookingItem?.check_out_date) {
      setModalCheckOutDate(selectedBookingItem.check_out_date);
    } else if (dropDate) {
      setModalCheckOutDate(dropDate);
    } else if (pickupDate && (selectedBookingItem?.booking_days || bookingDays)) {
      setModalCheckOutDate(addDays(pickupDate, selectedBookingItem?.booking_days || bookingDays));
    }
  }, [selectedBookingItem?.check_in_date, selectedBookingItem?.check_out_date, selectedBookingItem?.booking_days, pickupDate, dropDate, bookingDays]);

  const nights = useMemo(() => {
    if (!modalCheckInDate || !modalCheckOutDate) return Math.max(1, parseInt(selectedBookingItem?.booking_days || bookingDays) || 1);
    const d1 = new Date(modalCheckInDate);
    const d2 = new Date(modalCheckOutDate);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 1 ? 1 : diff;
  }, [modalCheckInDate, modalCheckOutDate, selectedBookingItem?.booking_days, bookingDays]);

  const handleCheckInChange = (newIn) => {
    setModalCheckInDate(newIn);
    if (!modalCheckOutDate || modalCheckOutDate <= newIn) {
      setModalCheckOutDate(addDays(newIn, 1));
    }
  };

  const handleCheckOutChange = (newOut) => {
    if (newOut <= modalCheckInDate) {
      setModalCheckOutDate(addDays(modalCheckInDate, 1));
    } else {
      setModalCheckOutDate(newOut);
    }
  };
  
  // Selection State (Preserve selected room and rate plan from HotelDetailsPage)
  const [selectedRoom, setSelectedRoom] = useState(selectedBookingItem.preselected_room || null);
  const [selectedRatePlan, setSelectedRatePlan] = useState(selectedBookingItem.preselected_rate_plan || null);
  const [numRooms, setNumRooms] = useState(initialNumRooms);
  
  // Guest Details State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDob, setGuestDob] = useState('');
  const [isDobSaved, setIsDobSaved] = useState(false);
  const [dobChecking, setDobChecking] = useState(false);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [arrivalTime, setArrivalTime] = useState('14:00');
  const [specialRequests, setSpecialRequests] = useState('');

  // Guest & Room Counts for Summary Cards
  const totalGuestsCount = (parseInt(adults, 10) || 0) + (parseInt(children, 10) || 0);
  const roomsCount = parseInt(numRooms, 10) || 1;

  // Keep guest configuration & room/plan synced with selectedBookingItem if it changes
  useEffect(() => {
    if (selectedBookingItem) {
      if (selectedBookingItem.num_rooms) setNumRooms(parseInt(selectedBookingItem.num_rooms, 10));
      if (selectedBookingItem.adults) setAdults(parseInt(selectedBookingItem.adults, 10));
      if (selectedBookingItem.children !== undefined && selectedBookingItem.children !== null) {
        setChildren(parseInt(selectedBookingItem.children, 10));
      }
      if (selectedBookingItem.preselected_room) {
        setSelectedRoom(selectedBookingItem.preselected_room);
      }
      if (selectedBookingItem.preselected_rate_plan) {
        setSelectedRatePlan(selectedBookingItem.preselected_rate_plan);
      }
    }
  }, [
    selectedBookingItem?.num_rooms,
    selectedBookingItem?.adults,
    selectedBookingItem?.children,
    selectedBookingItem?.preselected_room,
    selectedBookingItem?.preselected_rate_plan
  ]);

  // Customer Wallet Cashback & Loyalty State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [confirmedCashbackPreview, setConfirmedCashbackPreview] = useState(null);

  // Inventory-aware maximum selectable rooms: min(5, available_rooms) with a minimum of 1
  const availableInventory = selectedRoom?.available_rooms != null 
    ? selectedRoom.available_rooms 
    : (roomTypes.length > 0 
        ? Math.max(...roomTypes.map(r => r.available_rooms != null ? r.available_rooms : 5))
        : 5);
  const maxRoomsSelectable = Math.max(1, Math.min(5, availableInventory));

  useEffect(() => {
    if (numRooms > maxRoomsSelectable) {
      setNumRooms(maxRoomsSelectable);
    }
  }, [maxRoomsSelectable, numRooms]);

  // Repeat customer lookup for Date of Birth & Wallet Balance & Loyalty Tier
  useEffect(() => {
    const clean = String(guestPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      setDobChecking(true);
      api.checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setGuestDob(res.date_of_birth);
          setIsDobSaved(true);
          if (!guestName && res.name) {
            setGuestName(res.name);
          }
          if (!guestEmail && res.email) {
            setGuestEmail(res.email);
          }
        } else {
          setIsDobSaved(false);
        }
      }).catch(() => {
        setIsDobSaved(false);
      }).finally(() => {
        setDobChecking(false);
      });

      // Fetch customer wallet balance & loyalty tier
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
      setIsDobSaved(false);
      setWalletBalance(0);
      setUseWalletCashback(false);
      setLoyaltyInfo(null);
    }
  }, [guestPhone]);

  // Driver / Chauffeur Service States
  const [driverOptionEnabled, setDriverOptionEnabled] = useState(true);
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverServiceType, setDriverServiceType] = useState('airport_transfer');
  const [driverPickupLoc, setDriverPickupLoc] = useState('Goa Airport (Dabolim / Mopa)');
  const [driverPickupTime, setDriverPickupTime] = useState('14:00');

  // Load Driver Option Enable / Disable setting from backend
  useEffect(() => {
    if (isCustomerPortal) {
      setDriverOptionEnabled(true);
      return;
    }

    let isMounted = true;
    api.fetchHotelBookingSettings()
      .then(res => {
        if (isMounted && res && typeof res.hotel_booking_driver_enabled !== 'undefined') {
          const isEnabled = Boolean(res.hotel_booking_driver_enabled);
          setDriverOptionEnabled(isEnabled);
          if (!isEnabled) {
            setDriverRequired(false);
          }
        }
      })
      .catch(err => {
        console.warn('[HotelBookingModal] Could not fetch driver setting:', err);
      });

    const handleSettingsSync = (e) => {
      if (e.detail && typeof e.detail.hotel_booking_driver_enabled !== 'undefined') {
        const isEnabled = Boolean(e.detail.hotel_booking_driver_enabled);
        setDriverOptionEnabled(isEnabled);
        if (!isEnabled) {
          setDriverRequired(false);
        }
      }
    };
    window.addEventListener('hotel-booking-settings-updated', handleSettingsSync);
    window.addEventListener('tripgalileo-setting-sync', handleSettingsSync);

    let bc;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo-hotel-settings');
        bc.onmessage = (msg) => {
          if (msg.data && typeof msg.data.hotel_booking_driver_enabled !== 'undefined') {
            const isEnabled = Boolean(msg.data.hotel_booking_driver_enabled);
            setDriverOptionEnabled(isEnabled);
            if (!isEnabled) {
              setDriverRequired(false);
            }
          }
        };
      }
    } catch (e) {}

    return () => {
      isMounted = false;
      window.removeEventListener('hotel-booking-settings-updated', handleSettingsSync);
      window.removeEventListener('tripgalileo-setting-sync', handleSettingsSync);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [isCustomerPortal]);
  
  // Payment State
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [paymentOption, setPaymentOption] = useState('static_qr');
  const [transactionId, setTransactionId] = useState('');

  // Vendor Cancellation Policy State
  const [vendorCancellationPolicy, setVendorCancellationPolicy] = useState(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  
  // Confirmation State
  const [bookingId, setBookingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hotelAllImages = useMemo(() => {
    if (!selectedBookingItem) return [];
    const list = [];
    if (selectedBookingItem.images_json) {
      try {
        const p = typeof selectedBookingItem.images_json === 'string' ? JSON.parse(selectedBookingItem.images_json) : selectedBookingItem.images_json;
        if (Array.isArray(p)) list.push(...p);
      } catch(e) {}
    }
    if (Array.isArray(selectedBookingItem.images)) list.push(...selectedBookingItem.images);
    if (Array.isArray(selectedBookingItem.additional_images)) list.push(...selectedBookingItem.additional_images);
    if (selectedBookingItem.image) list.push(selectedBookingItem.image);
    if (selectedBookingItem.image_url) list.push(selectedBookingItem.image_url);
    const unique = Array.from(new Set(list.filter(u => typeof u === 'string' && u.trim().length > 0)));
    return unique.length > 0 ? unique : [selectedBookingItem.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'];
  }, [selectedBookingItem]);

  useEffect(() => {
    if (!selectedBookingItem?.id) return;
    // Fetch Payment Settings for the specific Hotel Vendor
    const rawTargetVendorId = selectedBookingItem.vendor_id || selectedBookingItem.admin_id;
    const targetVendorId = (rawTargetVendorId && rawTargetVendorId !== 'admin') ? rawTargetVendorId : 'u-5';
    if (targetVendorId) {
      api.getVendorPaymentMethods(targetVendorId).then(res => {
        const activeMethods = (res || []).filter(m => m.status === 'Active');
        setPaymentSettings(activeMethods);
      }).catch(err => {
        console.error('Error fetching vendor payment methods:', err);
        setPaymentSettings([]);
      });
    } else {
      // NEVER silently fall back to Admin/WOW GOA payment methods for customer booking
      setPaymentSettings([]);
    }

    // Fetch Vendor Cancellation Policy for Hotel
    const hotelVendorId = selectedBookingItem?.vendor_id || selectedBookingItem?.admin_id || 'u-5';
    api.fetchVendorCancellationPolicy(hotelVendorId, 'hotel').then(res => {
      if (res && res.policy) {
        setVendorCancellationPolicy(res.policy);
      }
    }).catch(console.error);

    // Connect customer storefront to real room inventory (Phase 1, Item 2)
    setLoadingRooms(true);
    api.fetchHotelRoomsPublic(selectedBookingItem.id, {
      checkIn: modalCheckInDate,
      checkOut: modalCheckOutDate,
      rooms: numRooms
    }).then(res => {
      if (res && res.success && Array.isArray(res.room_types) && res.room_types.length > 0) {
        setRoomTypes(res.room_types);
        
        // Find matching pre-selected room, preserve preselected_room, or default to first
        let targetRoom = null;
        if (selectedBookingItem.preselected_room) {
          targetRoom = res.room_types.find(r => 
            r.id === selectedBookingItem.preselected_room.id || 
            String(r.id) === String(selectedBookingItem.preselected_room.id) ||
            r.name === selectedBookingItem.preselected_room.name
          ) || selectedBookingItem.preselected_room;
        } else {
          targetRoom = res.room_types[0];
        }
        setSelectedRoom(targetRoom);

        // Find matching pre-selected rate plan, preserve preselected_rate_plan, or default to EP / first plan
        let targetPlan = null;
        if (selectedBookingItem.preselected_rate_plan && targetRoom?.rate_plans) {
          targetPlan = targetRoom.rate_plans.find(p => 
            p.id === selectedBookingItem.preselected_rate_plan.id || 
            String(p.id) === String(selectedBookingItem.preselected_rate_plan.id) ||
            p.meal_plan === selectedBookingItem.preselected_rate_plan.meal_plan
          ) || selectedBookingItem.preselected_rate_plan;
        } else if (selectedBookingItem.preselected_rate_plan) {
          targetPlan = selectedBookingItem.preselected_rate_plan;
        } else if (targetRoom?.rate_plans && targetRoom.rate_plans.length > 0) {
          targetPlan = targetRoom.rate_plans.find(p => p.meal_plan === 'EP') || targetRoom.rate_plans[0];
        }
        setSelectedRatePlan(targetPlan);
      } else {
        // No fake room fallback! Only clear room selection if there was no preselected room
        setRoomTypes([]);
        if (!selectedBookingItem.preselected_room) {
          setSelectedRoom(null);
          setSelectedRatePlan(null);
        }
      }
    }).catch(err => {
      console.error('[HotelBookingModal] Error loading room types:', err);
      setRoomTypes([]);
      if (!selectedBookingItem.preselected_room) {
        setSelectedRoom(null);
        setSelectedRatePlan(null);
      }
    }).finally(() => {
      setLoadingRooms(false);
    });
  }, [selectedBookingItem?.id, modalCheckInDate, modalCheckOutDate, numRooms]);

  // Pricing Logic (dynamic nights, meal plan & extra guests)
  const nightlyRoomRate = selectedRatePlan?.calculated_price || selectedRatePlan?.base_price || (selectedRoom ? parseFloat(selectedRoom.selling_price || 0) : parseFloat(selectedBookingItem.price || 0));
  const baseRoomTotal = nightlyRoomRate * nights * numRooms;

  // Extra Guest Calculations
  const baseOcc = (parseInt(selectedRoom?.base_occupancy || 2, 10)) * numRooms;
  const extraAdultsCount = Math.max(0, (parseInt(adults, 10) || 2) - baseOcc);
  const extraAdultRate = parseFloat(selectedRatePlan?.extra_adult_rate || selectedRoom?.extra_adult_charge || 0);
  const extraAdultTotal = extraAdultsCount * extraAdultRate * nights;

  const extraChildRate = parseFloat(selectedRatePlan?.extra_child_rate || selectedRoom?.extra_child_charge || 0);
  const extraChildTotal = (parseInt(children, 10) || 0) * extraChildRate * nights;

  const roomTotal = baseRoomTotal + extraAdultTotal + extraChildTotal;
  const gst = Math.round(roomTotal * 0.18);
  const platformFee = 250;

  // Driver Pricing Logic
  let driverCharge = 0;
  if (driverOptionEnabled && driverRequired) {
    if (driverServiceType === 'airport_transfer') driverCharge = 800;
    else if (driverServiceType === 'full_day') driverCharge = 1800;
    else if (driverServiceType === 'entire_stay') driverCharge = 1500 * nights;
  }

  const rawTotalAmount = roomTotal + gst + platformFee + driverCharge;

  // Authoritative Loyalty Tier & Tier Discount Enforcement
  const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
  const isGold = customerTier === 'Gold';
  const isPlatinum = customerTier === 'Platinum';

  const isGoldEligible = isGold && rawTotalAmount > 5000;
  const isPlatinumEligible = isPlatinum && rawTotalAmount > 10000;

  let tierDiscount = 0;
  if (isGoldEligible) {
    tierDiscount = 500;
  } else if (isPlatinumEligible) {
    tierDiscount = 1000;
  }

  const totalAmount = Math.max(0, rawTotalAmount - tierDiscount);
  const advanceAmount = Math.round(totalAmount * 0.20); // 20% advance

  // Wallet Deduction (Strictly 10% Discount/Benefit Only on net) & 10% Cashback Calculations
  const maxWalletBenefit = Math.round(totalAmount * 0.10);
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
  const finalTotalPayable = Math.max(0, totalAmount - appliedWalletAmount);

  const isPayAtHotel = paymentOption === 'pay_at_hotel' || paymentOption === 'hotel';
  let payableNow = 0;
  if (!isPayAtHotel) {
    if (paymentOption === 'partial') payableNow = Math.max(0, advanceAmount - appliedWalletAmount);
    else payableNow = finalTotalPayable;
  }

  const projectedCashback = Math.round(finalTotalPayable * 0.10);

  const handleConfirmBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isProcessing) return;
    if (!selectedRoom) return alert("Please select a room first.");
    
    const cleanGuestPhone = String(guestPhone || '').replace(/\D/g, '');
    if (!guestName || cleanGuestPhone.length < 10) {
      return alert("Please enter your full name and a valid 10-digit mobile number for trip confirmation & tracking.");
    }

    if (!isDobSaved && !guestDob) {
      return alert("Please enter your Date of Birth. Date of Birth is required for birthday privileges and special offers from WOW GOA.");
    }
    
    const dateVal = validateBookingDates(modalCheckInDate, modalCheckOutDate, { allowSameDay: false });
    if (!dateVal.valid) {
      return alert(dateVal.error);
    }

    if (!policyAgreed) {
      return alert("Please review and agree to the vendor cancellation policy to continue.");
    }

    if (paymentOption === 'static_qr' && (!transactionId || transactionId.trim().length < 6)) {
      return alert("Please enter the 12-digit UPI Transaction Reference ID (UTR) after completing your payment via Static QR.");
    }
    
    setIsProcessing(true);
    
    try {
      const numGuests = (parseInt(adults) || 2) + (parseInt(children) || 0);
      const isDriverActive = Boolean(driverOptionEnabled && driverRequired);

      const travellerDetails = {
          name: guestName,
          phone: cleanGuestPhone,
          email: guestEmail,
          date_of_birth: guestDob,
          adults: adults,
          children: children,
          arrival_time: arrivalTime,
          special_requests: specialRequests,
          num_rooms: numRooms,
          driver_required: isDriverActive,
          driver_service_type: isDriverActive ? driverServiceType : null
      };
      
      const priceBreakdown = {
          base_room_rate: nightlyRoomRate,
          meal_plan: selectedRatePlan?.meal_plan || 'EP',
          rate_plan_id: selectedRatePlan?.id,
          nights: nights,
          num_rooms: numRooms,
          base_room_total: baseRoomTotal,
          extra_adult_total: extraAdultTotal,
          extra_child_total: extraChildTotal,
          room_total: roomTotal,
          driver_charge: isDriverActive ? driverCharge : 0,
          gst: gst,
          platform_fee: platformFee,
          raw_total_price: rawTotalAmount,
          tier_discount_applied: tierDiscount,
          customer_tier_at_booking: customerTier,
          total_price: totalAmount,
          wallet_amount_used: appliedWalletAmount,
          final_payable: finalTotalPayable,
          advance_amount: advanceAmount
      };

      const selectedCustom = paymentSettings.find(m => m.id?.toString() === paymentOption?.toString());
      const paymentMethodName = isForeign
        ? 'International Online Payment Gateway (Pending Integration)'
        : (isPayAtHotel ? 'Pay at Hotel' : (paymentOption === 'upi_direct' ? 'UPI' : (selectedCustom?.method_name || 'Static QR (UPI)')));
      const paymentRefToUse = isForeign
        ? 'INTL_PENDING'
        : (isPayAtHotel ? 'PAY-AT-HOTEL' : (transactionId || `TXN-${Date.now()}`));
      const customerId = `c_${cleanGuestPhone || Date.now()}`;
      const customerEmail = guestEmail || `${cleanGuestPhone || 'guest'}@hotel.wowgoa.com`;

      const bookingPayload = {
        idempotency_key: idempotencyKey,
        name: guestName,
        customer_name: guestName,
        phone: cleanGuestPhone,
        customer_phone: cleanGuestPhone,
        email: customerEmail,
        customer_email: customerEmail,
        customer_id: customerId,
        date_of_birth: guestDob,
        dob: guestDob,
        pickup_loc: isDriverActive ? driverPickupLoc : (selectedBookingItem.area || selectedBookingItem.location || 'Goa'),
        pickup_location: isDriverActive ? driverPickupLoc : (selectedBookingItem.area || selectedBookingItem.location || 'Goa'),
        pickup_date: modalCheckInDate,
        pickup_time: isDriverActive ? driverPickupTime : checkInTime,
        drop_date: modalCheckOutDate,
        drop_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa',
        drop_time: checkOutTime,
        check_in_date: modalCheckInDate,
        check_out_date: modalCheckOutDate,
        checkin_time: checkInTime,
        checkout_time: checkOutTime,
        item_id: selectedBookingItem.id,
        item_name: selectedBookingItem.name,
        hotel_name: selectedBookingItem.name,
        hotel_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa',
        room_type_id: selectedRoom?.id,
        room_type: selectedRoom?.name || 'Deluxe Room',
        rate_plan_id: selectedRatePlan?.id,
        meal_plan: selectedRatePlan?.meal_plan || 'EP',
        cancellation_policy: selectedRatePlan?.cancellation_policy || '',
        num_rooms: numRooms,
        adults: adults,
        children: children,
        package_type: isDriverActive ? 'Hotel Booking (with Chauffeur)' : 'Hotel Booking',
        type: 'hotel',
        image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        vehicle_image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        booking_days: nights,
        duration: `${nights} Nights / ${nights + 1} Days`,
        total_amount: rawTotalAmount,
        tier_discount_applied: tierDiscount,
        customer_tier_at_booking: customerTier,
        wallet_amount_used: appliedWalletAmount,
        amount_paid: payableNow,
        total_paid: totalAmount,
        paid_amount: payableNow,
        remaining_amount: isPayAtHotel ? finalTotalPayable : Math.max(0, finalTotalPayable - payableNow),
        pending_amount: isPayAtHotel ? finalTotalPayable : Math.max(0, finalTotalPayable - payableNow),
        driver_required: isDriverActive ? 1 : 0,
        driver_charge: isDriverActive ? driverCharge : 0,
        driver_service_type: isDriverActive ? driverServiceType : '',
        status: isPayAtHotel ? 'Confirmed' : 'Pending',
        payment_status: isPayAtHotel ? 'Pay at Hotel (Pending)' : (payableNow > 0 ? 'Submitted' : 'Pending'),
        payment_verification_status: isPayAtHotel ? 'Not Required' : 'Pending Verification',
        payment_method: paymentMethodName,
        payment_reference: paymentRefToUse,
        transaction_id: paymentRefToUse,
        customer_payment: payableNow,
        wow_goa_platform_fee: Math.round(payableNow * 0.10),
        vendor_service_amount: Math.round(payableNow * 0.90),
        vendor_payout_status: 'Pending',
        cancellation_acknowledged: 1,
        vendor_id: selectedBookingItem.vendor_id || selectedBookingItem.admin_id || 'u-5',
        customer_country: country?.name || 'India',
        customer_country_code: country?.code || 'IN',
        customer_currency: currency || 'INR',
        customer_category: category || (isIndian ? 'INDIAN' : 'FOREIGN'),
        traveller_details_json: JSON.stringify(travellerDetails),
        price_breakdown_json: JSON.stringify(priceBreakdown),
        customizations: JSON.stringify({
            selected_room_type: selectedRoom?.id,
            room_type_id: selectedRoom?.id,
            selected_room_name: selectedRoom?.name,
            room_type_name: selectedRoom?.name,
            rate_plan_id: selectedRatePlan?.id,
            meal_plan: selectedRatePlan?.meal_plan || 'EP',
            cancellation_policy: selectedRatePlan?.cancellation_policy || '',
            num_guests: numGuests,
            num_rooms: numRooms,
            adults: adults,
            children: children,
            check_in_date: modalCheckInDate,
            check_out_date: modalCheckOutDate,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            nights: nights,
            driver_required: isDriverActive,
            driver_service: isDriverActive ? driverServiceType : null,
            driver_charge: isDriverActive ? driverCharge : 0,
            hotel_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa'
        })
      };

      let assignedId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        const res = await api.createBooking(bookingPayload);
        if (res?.booking_id || res?.id) assignedId = res.booking_id || res.id;
        if (res?.cashback_preview) setConfirmedCashbackPreview(res.cashback_preview);
      } catch (err) {
        console.warn("Backend booking submission note:", err);
      }

      const fullBookingRecord = { ...bookingPayload, id: assignedId, booking_id: assignedId };
      setBookingId(assignedId);

      // Save customer phone and booking to both localStorage and sessionStorage for instant Customer Portal access
      try {
        sessionStorage.setItem('customer_login_phone', cleanGuestPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(fullBookingRecord));
        localStorage.setItem('customer_login_phone', cleanGuestPhone);
        localStorage.setItem('last_created_booking', JSON.stringify(fullBookingRecord));

        const existingLocal = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updatedLocal = [fullBookingRecord, ...existingLocal.filter(b => String(b.id) !== String(assignedId))];
        localStorage.setItem('local_bookings', JSON.stringify(updatedLocal));
      } catch (e) {}

      setStep(4);
    } catch (err) {
      console.warn("Booking fallback transition:", err);
      const fallbackId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingId(fallbackId);
      try {
        sessionStorage.setItem('customer_login_phone', String(guestPhone).replace(/\D/g, ''));
      } catch (e) {}
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <h5 className="fw-bold mb-0">Step 1: Select Room Type</h5>
        <span className="badge bg-primary px-3 py-1.5 rounded-pill text-white fw-bold" style={{ fontSize: '11px' }}>
          {nights} Night{nights > 1 ? 's' : ''} Stay
        </span>
      </div>

      {/* ─── Stay Dates & Timings Calendar Card ─── */}
      <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
              <Calendar size={15} />
            </div>
            <div>
              <span className="fw-bold text-dark small">Choose Dates, Timings &amp; Rooms</span>
              <small className="text-muted d-block" style={{ fontSize: '11px' }}>Adjust check-in/out and rooms to recalculate nights and rates in real time</small>
            </div>
          </div>
          <span className="badge bg-light text-dark border px-2.5 py-1 text-xs">
            📅 {formatDisplayDate(modalCheckInDate) || modalCheckInDate} ➔ {formatDisplayDate(modalCheckOutDate) || modalCheckOutDate} ({nights}N • {numRooms} Room{numRooms > 1 ? 's' : ''})
          </span>
        </div>
        <div className="card-body p-3">
          <div className="row g-2.5">
            {/* Check-in Date */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                <Calendar size={12} className="text-primary" /> Check-in Date
              </label>
              <input
                type="date"
                className="form-control form-control-sm fw-bold border-primary-subtle"
                min={getTodayDateStr()}
                value={modalCheckInDate}
                onChange={(e) => handleCheckInChange(e.target.value)}
                required
              />
            </div>

            {/* Check-in Time */}
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                <Clock size={12} className="text-primary" /> Check-in Time
              </label>
              <select
                className="form-select form-select-sm fw-semibold"
                value={checkInTime}
                onChange={(e) => {
                  setCheckInTime(e.target.value);
                  setArrivalTime(e.target.value);
                }}
              >
                {TIME_SLOTS.map(t => (
                  <option key={`in-${t}`} value={t}>{t} {t === '02:00 PM' ? '(Standard)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Check-out Date */}
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                <Calendar size={12} className="text-danger" /> Check-out Date
              </label>
              <input
                type="date"
                className="form-control form-control-sm fw-bold border-danger-subtle"
                min={addDays(modalCheckInDate, 1)}
                value={modalCheckOutDate}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                required
              />
            </div>

            {/* Check-out Time */}
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                <Clock size={12} className="text-danger" /> Check-out Time
              </label>
              <select
                className="form-select form-select-sm fw-semibold"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              >
                {TIME_SLOTS.map(t => (
                  <option key={`out-${t}`} value={t}>{t} {t === '11:00 AM' ? '(Standard)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Number of Rooms */}
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                <BedDouble size={12} className="text-primary" /> Rooms
              </label>
              <select
                className="form-select form-select-sm fw-bold"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value, 10) || 1)}
              >
                {Array.from({ length: maxRoomsSelectable }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {loadingRooms ? (
          <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2"></div> Loading available rooms...
          </div>
      ) : roomTypes.length === 0 ? (
          <div className="alert alert-warning text-center">
              No rooms currently available for this property online.
          </div>
      ) : (
          <div className="row g-3">
              {roomTypes.map(rt => {
                  let amenities = Array.isArray(rt.amenities) ? rt.amenities : [];
                  if (amenities.length === 0 && rt.amenities_json) {
                    try { amenities = JSON.parse(rt.amenities_json || '[]'); } catch(e){}
                  }
                  const isSelected = selectedRoom?.id === rt.id;
                  const roomImg = (rt.images && rt.images[0]) || hotelAllImages[0];
                  const plans = rt.rate_plans || [];
                  const activePlanForRoom = (isSelected && selectedRatePlan) 
                    ? selectedRatePlan 
                    : (plans.find(p => p.meal_plan === 'EP') || plans[0]);

                  return (
                      <div key={rt.id} className="col-12">
                          <div 
                            className={`card shadow-sm border ${isSelected ? 'border-primary border-2 shadow' : ''} h-100 overflow-hidden cursor-pointer`} 
                            onClick={() => {
                              setSelectedRoom(rt);
                              if (plans.length > 0 && (!selectedRatePlan || selectedRoom?.id !== rt.id)) {
                                setSelectedRatePlan(plans.find(p => p.meal_plan === 'EP') || plans[0]);
                              }
                            }}
                          >
                              <div className="d-flex flex-column flex-md-row">
                                  <div style={{ width: '100%', maxWidth: '190px', background: '#f8f9fa', minHeight: '140px' }} className="d-none d-md-block position-relative overflow-hidden">
                                      <img 
                                        src={roomImg} 
                                        alt={rt.name} 
                                        className="w-100 h-100 object-fit-cover"
                                        style={{ minHeight: '150px' }}
                                      />
                                      {rt.is_available === false && (
                                        <span className="position-absolute top-0 start-0 m-1.5 badge bg-danger text-white text-xxs">
                                          Sold Out
                                        </span>
                                      )}
                                  </div>
                                  <div className="card-body p-3 flex-grow-1">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                          <div>
                                              <h6 className="fw-bold mb-1 text-dark fs-6">{rt.name}</h6>
                                              <div className="text-muted text-xs">
                                                  <Users size={12} className="me-1 inline"/> Up to {rt.max_occupancy} Guests • {rt.bed_type} Bed {rt.room_size ? `• ${rt.room_size} sq.ft` : ''}
                                              </div>
                                          </div>
                                          <div className="text-end">
                                              <h5 className="fw-bold text-primary mb-0">
                                                ₹{parseInt(activePlanForRoom?.calculated_price || activePlanForRoom?.base_price || rt.selling_price || 0).toLocaleString('en-IN')}
                                              </h5>
                                              <small className="text-muted text-xxs">/ night ({activePlanForRoom?.meal_plan || 'EP'})</small>
                                          </div>
                                      </div>
                                      
                                      <div className="mb-2 d-flex flex-wrap gap-1">
                                          {amenities.slice(0, 4).map((am, i) => (
                                              <span key={i} className="badge bg-light text-dark border fw-normal text-xxs">{am}</span>
                                          ))}
                                      </div>

                                      {/* Rate Plans / Meal Plan selection pills */}
                                      {plans.length > 0 && (
                                        <div className="mt-2 pt-2 border-top">
                                          <span className="text-muted text-xxs fw-bold text-uppercase d-block mb-1">Select Meal Plan:</span>
                                          <div className="d-flex flex-wrap gap-1.5">
                                            {plans.map(p => {
                                              const isPlanActive = isSelected && selectedRatePlan?.id === p.id;
                                              return (
                                                <button
                                                  key={p.id}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRoom(rt);
                                                    setSelectedRatePlan(p);
                                                  }}
                                                  className={`btn btn-sm text-xxs rounded-pill px-2.5 py-0.5 fw-bold ${isPlanActive ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                >
                                                  {p.meal_plan}: ₹{(p.calculated_price || p.base_price).toLocaleString('en-IN')}/N
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="d-flex justify-content-between align-items-center mt-2 pt-1">
                                          <div className="text-success text-xxs fw-semibold">
                                            ✓ {activePlanForRoom?.cancellation_policy || 'Free Cancellation up to 48 hrs before check-in'}
                                          </div>
                                          <button 
                                            type="button"
                                            className={`btn btn-sm px-3 py-1 fw-bold text-xs ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                                          >
                                              {isSelected ? '✓ Selected' : 'Select Room'}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
      
      <div className="mt-4 text-end">
          <button 
              className="btn btn-primary px-5 fw-bold" 
              disabled={!selectedRoom} 
              onClick={() => setStep(2)}
          >
              Continue to Guest Details <ArrowRight size={16} className="ms-1"/>
          </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div className="d-flex align-items-center">
              <button 
                type="button"
                className="btn btn-sm btn-link text-muted p-0 me-2" 
                onClick={() => {
                  if (openedWithPreselectedRef.current) {
                    // Return to HotelDetailsPage so the customer can change room / rates
                    handleHotelModalClose();
                  } else {
                    setStep(1);
                  }
                }}
                title={openedWithPreselectedRef.current ? "Back to Hotel Details" : "Back to Room Selection"}
              >
                <ArrowLeft size={20}/>
              </button>
              <h5 className="fw-bold mb-0">Step 2: Guest Details</h5>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${isIndian ? 'bg-success text-white' : 'bg-primary text-white'}`} style={{ fontSize: '0.72rem' }}>
                {category || (isIndian ? 'INDIAN' : 'FOREIGN')}
              </span>
              <span className="badge rounded-pill bg-dark text-white px-2.5 py-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                {currency || 'INR'}
              </span>
            </div>
        </div>

        {/* Selected Room & Rate Plan Confirmation Card */}
        {selectedRoom && (
          <div className="p-3 mb-3 rounded-3 border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white text-xxs px-2 py-0.5 rounded">Selected Room</span>
                <strong className="text-dark fs-6 font-heading">{selectedRoom.name}</strong>
              </div>
              <div className="text-muted text-xs mt-1 d-flex flex-wrap gap-2 align-items-center">
                <span>Plan: <strong className="text-dark">{selectedRatePlan?.name || selectedRatePlan?.meal_plan_label || selectedRatePlan?.meal_plan || 'EP Room Only'}</strong></span>
                <span>•</span>
                <span>{nights} {nights === 1 ? 'Night' : 'Nights'} ({formatDisplayDate ? formatDisplayDate(modalCheckInDate) : modalCheckInDate} – {formatDisplayDate ? formatDisplayDate(modalCheckOutDate) : modalCheckOutDate})</span>
                <span>•</span>
                <span>{numRooms} {numRooms === 1 ? 'Room' : 'Rooms'}</span>
              </div>
            </div>
            <div className="text-sm-end">
              <span className="text-muted text-xxs text-uppercase d-block">Room Rate</span>
              <span className="fw-bold text-dark fs-6 font-heading">₹{nightlyRoomRate.toLocaleString('en-IN')}<small className="text-muted fw-normal text-xxs"> / night</small></span>
            </div>
          </div>
        )}
        
        <div className="row g-3 mb-4">
            <div className="col-md-12">
                <label className="form-label small fw-bold">Lead Guest Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Full Name as per ID" value={guestName} onChange={e => setGuestName(e.target.value)} required />
            </div>
            <div className="col-md-6">
                <InternationalPhoneInput 
                  value={guestPhone} 
                  onChange={(val, countryObj) => {
                    setGuestPhone(val ? String(val) : '');
                    if (countryObj && setCountry) setCountry(countryObj);
                  }} 
                  onCountryChange={(c) => {
                    if (c && setCountry) setCountry(c);
                  }}
                  label="Mobile Number"
                  required 
                />
                <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Your Customer Portal login & trip updates will be linked to this number.
                </small>
            </div>
            <div className="col-md-6">
                <label className="form-label small fw-bold">Email Address</label>
                <input type="email" className="form-control" placeholder="Email for booking confirmation" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
            </div>

            {/* Date of Birth Mandatory Field with Auto-Retrieval for Repeat Guests */}
            <div className="col-md-12">
              {isDobSaved ? (
                <div className="p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between animate-fade-in">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                      <Cake size={14} />
                    </div>
                    <div>
                      <div className="text-xs fw-bold text-success d-flex align-items-center gap-1">
                        <ShieldCheck size={13} /> Verified DOB on WOW GOA Account
                      </div>
                      <div className="text-xs text-dark mt-0.5">
                        🎂 Date of Birth: <strong>{guestDob}</strong> <span className="text-muted">(Saved for birthday benefits & member rewards)</span>
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-success text-white text-xs px-2 py-1 rounded-pill">Saved</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-1">
                      <Cake size={14} className="text-warning" /> Date of Birth <span className="text-danger">*</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>[ Day / Month / Year ]</span>
                  </label>
                  <DobPicker 
                    value={guestDob}
                    onChange={val => setGuestDob(val)}
                    required={true}
                  />
                  <small className="text-muted d-block mt-1" style={{ fontSize: '11px', color: '#64748b' }}>
                    Date of Birth is required to provide birthday benefits and special offers from WOW GOA.
                  </small>
                </div>
              )}
            </div>
        </div>
        
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <label className="form-label small fw-bold">Number of Rooms</label>
                <select className="form-select" value={numRooms} onChange={e => setNumRooms(parseInt(e.target.value, 10) || 1)}>
                    {Array.from({ length: maxRoomsSelectable }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                    ))}
                </select>
                {selectedRoom?.available_rooms != null && selectedRoom.available_rooms <= 5 && (
                  <small className="text-muted" style={{ fontSize: '11px' }}>
                    {selectedRoom.available_rooms} room{selectedRoom.available_rooms !== 1 ? 's' : ''} available in inventory
                  </small>
                )}
            </div>
            <div className="col-md-4">
                <label className="form-label small fw-bold">Adults</label>
                <select className="form-select" value={adults} onChange={e => setAdults(parseInt(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Adult{n>1?'s':''}</option>)}
                </select>
            </div>
            <div className="col-md-4">
                <label className="form-label small fw-bold">Children</label>
                <select className="form-select" value={children} onChange={e => setChildren(parseInt(e.target.value))}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Child{n!=1?'ren':''}</option>)}
                </select>
            </div>
        </div>

        {/* ─── Dedicated Goa Chauffeur & Driver Service Option ─── */}
        {driverOptionEnabled && (
          <div className="p-3 rounded-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div className="form-check d-flex align-items-center gap-2 mb-2">
              <input
                type="checkbox"
                className="form-check-input mt-0"
                id="hotel_driver_req"
                checked={driverRequired}
                onChange={(e) => setDriverRequired(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label className="form-check-label fw-bold text-dark mb-0 font-heading" htmlFor="hotel_driver_req" style={{ cursor: 'pointer' }}>
                🚗 Need a Dedicated Goa Chauffeur / Private Cab Service?
              </label>
            </div>
            <p className="text-muted text-xs ps-4 mb-2">
              Add a verified local chauffeur for airport transfers, beach sightseeing, and effortless travel during your stay at {selectedBookingItem.name}.
            </p>

            {driverRequired && (
              <div className="mt-3 pt-3 border-top border-warning border-opacity-40 ps-4 animate-fade-in">
                <div className="row g-2 mb-3">
                  {[
                    { id: 'airport_transfer', label: '✈️ Airport / Railway Station Pickup & Drop', price: 800, desc: 'Dedicated AC cab for airport / train station transfer to hotel' },
                    { id: 'full_day', label: '🌴 1-Day Goa Sightseeing Chauffeur', price: 1800, desc: '8 Hours / 80 KM sightseeing across North or South Goa' },
                    { id: 'entire_stay', label: `⭐ Dedicated Chauffeur for Entire Stay (${nights} Nights)`, price: 1500 * nights, desc: `Exclusive AC chauffeur on standby for all ${nights} nights` }
                  ].map(opt => (
                    <div key={opt.id} className="col-12">
                      <div 
                        className={`p-2.5 rounded-3 border cursor-pointer transition ${driverServiceType === opt.id ? 'bg-warning bg-opacity-20 border-warning fw-bold' : 'bg-white border-light-subtle'}`}
                        onClick={() => setDriverServiceType(opt.id)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-xs text-dark">{opt.label}</span>
                            <small className="text-muted d-block text-xxs">{opt.desc}</small>
                          </div>
                          <span className="badge bg-dark text-warning fw-bold px-2 py-1 text-xs">
                            +₹{opt.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="row g-2">
                  <div className="col-sm-7">
                    <label className="form-label text-xxs text-muted fw-bold mb-1">Driver Pickup Point</label>
                    <select 
                      className="form-select form-select-sm text-xs"
                      value={driverPickupLoc}
                      onChange={e => setDriverPickupLoc(e.target.value)}
                    >
                      <option value="Goa Airport (Dabolim / Mopa)">✈️ Goa Airport (Dabolim / Mopa)</option>
                      <option value="Dabolim Airport (GOI)">✈️ Dabolim Airport (GOI)</option>
                      <option value="Mopa Airport (GOX)">✈️ Manohar International Airport (Mopa / GOX)</option>
                      <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                      <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                      <option value="Hotel Direct Pickup">🏨 Hotel Direct Pickup</option>
                    </select>
                  </div>
                  <div className="col-sm-5">
                    <label className="form-label text-xxs text-muted fw-bold mb-1">Pickup Time</label>
                    <input 
                      type="time" 
                      className="form-control form-control-sm text-xs" 
                      value={driverPickupTime} 
                      onChange={e => setDriverPickupTime(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="row g-3 mb-4">
            <div className="col-md-6">
                <label className="form-label small fw-bold">Expected Hotel Check-in / Arrival Time</label>
                <input type="time" className="form-control" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
            </div>
            <div className="col-md-12">
                <label className="form-label small fw-bold">Special Requests (Optional)</label>
                <textarea className="form-control" rows="2" placeholder="e.g. early check-in, sea view room, airport coordination" value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}></textarea>
            </div>
        </div>

        {/* Live Total preview */}
        <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-4 border">
          <div>
            <span className="text-muted text-xs d-block">Total Stay &amp; Services ({nights} Night{nights>1?'s':''})</span>
            <strong className="text-dark fs-5 font-heading">₹{totalAmount.toLocaleString('en-IN')}</strong>
            {driverOptionEnabled && driverRequired && <span className="badge bg-warning text-dark text-xxs ms-2">✓ Chauffeur Included (+₹{driverCharge.toLocaleString('en-IN')})</span>}
          </div>
          <button 
              className="btn btn-primary px-4 py-2 fw-bold" 
              disabled={!guestName.trim() || String(guestPhone).replace(/\D/g, '').length < 10} 
              onClick={() => {
                if (String(guestPhone).replace(/\D/g, '').length < 10) {
                  alert("Please enter a valid 10-digit mobile number for booking confirmation.");
                  return;
                }
                setStep(3);
              }}
          >
              Proceed to Payment <ArrowRight size={16} className="ms-1"/>
          </button>
        </div>
    </div>
  );

  const renderStep3 = () => {
    const isUpi = paymentOption === 'upi_direct';
    const selectedMethod = paymentSettings.find(m => m.id?.toString() === paymentOption?.toString());

    return (
      <div className="animate-fade-in">
        <div className="d-flex align-items-center mb-3 border-bottom pb-2">
          <button className="btn btn-sm btn-link text-muted p-0 me-2" onClick={() => setStep(2)}>
            <ArrowLeft size={20}/>
          </button>
          <h5 className="fw-bold mb-0">Step 3: Review &amp; Payment</h5>
        </div>

        {/* Customer Category & Currency Banner */}
        <div className="p-3 mb-3 rounded-3 border" style={{ background: isIndian ? '#f0fdf4' : '#eff6ff', borderColor: isIndian ? '#bbf7d0' : '#bfdbfe' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <CountryFlag country={country || { code: isIndian ? 'IN' : 'IN' }} size={22} />
              <div>
                <div className="fw-bold text-dark text-sm">{country?.name || 'Customer Country'}</div>
                <div className="text-muted text-xxs">Identified from phone dial code ({country?.dial_code || '+91'})</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${isIndian ? 'bg-success text-white' : 'bg-primary text-white'}`} style={{ fontSize: '0.72rem' }}>
                {category || (isIndian ? 'INDIAN' : 'FOREIGN')} CUSTOMER
              </span>
              <span className="badge rounded-pill bg-dark text-white px-2.5 py-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                {currency || 'INR'}
              </span>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-baseline pt-2 border-top border-light-subtle">
            <span className="text-xs text-muted fw-semibold">Customer-Facing Total:</span>
            <CurrencyPriceDisplay amountInr={totalAmount} size="lg" highlight />
          </div>
        </div>

        {isIndian ? (
          <>
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Select Payment Option</h6>

              {/* Static QR Payment Option */}
              <div
                className={`card mb-2 cursor-pointer shadow-sm ${paymentOption === 'static_qr' ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
                style={{ borderRadius: '10px', transition: 'all 0.2s' }}
                onClick={() => setPaymentOption('static_qr')}
              >
                <div className="card-body p-3 d-flex align-items-start gap-3">
                  <input type="radio" className="form-check-input mt-1" checked={paymentOption === 'static_qr'} readOnly />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark fs-6">📱 WOW GOA Static QR Payment (UPI)</span>
                      <span className="badge bg-primary text-white">Recommended</span>
                    </div>
                    <div className="text-muted small">
                      Scan the vendor static QR with Google Pay, PhonePe, Paytm or BHIM to pay <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Pay at Hotel Option */}
              <div
                className={`card mb-2 cursor-pointer shadow-sm ${isPayAtHotel ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
                style={{ borderRadius: '10px', transition: 'all 0.2s' }}
                onClick={() => setPaymentOption('pay_at_hotel')}
              >
                <div className="card-body p-3 d-flex align-items-start gap-3">
                  <input type="radio" className="form-check-input mt-1" checked={isPayAtHotel} readOnly />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark fs-6">🏨 Pay at Hotel Front Desk</span>
                      <span className="badge bg-light text-dark border">Check-in Pay</span>
                    </div>
                    <div className="text-muted small">
                      Pay <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> directly at the hotel reception during check-in.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Static QR Details Card - Direct to Vendor */}
            {paymentOption === 'static_qr' && (() => {
              const activeVendorPayment = paymentSettings && paymentSettings.length > 0 ? (
                paymentSettings.find(m => (m.method_type === 'UPI' || m.qr_image_url || m.upi_id) && (m.upi_id || m.qr_image_url)) || paymentSettings[0]
              ) : null;
              const isVendorPaymentConfigured = Boolean(
                activeVendorPayment && (activeVendorPayment.qr_image_url || activeVendorPayment.upi_id)
              );

              return isVendorPaymentConfigured ? (
                <StaticQRPaymentCard
                  amount={totalAmount}
                  upiId={activeVendorPayment.upi_id || ''}
                  accountName={activeVendorPayment.account_name || activeVendorPayment.display_name || selectedBookingItem.name}
                  qrImageUrl={activeVendorPayment.qr_image_url || ''}
                  vendorName={activeVendorPayment.display_name || selectedBookingItem.vendor_name || 'Hotel Vendor'}
                  paymentReference={transactionId}
                  onReferenceChange={setTransactionId}
                  serviceTitle={selectedBookingItem.name}
                  instructions={activeVendorPayment.instructions || ''}
                />
              ) : (
                <div className="card shadow-sm border border-warning rounded-4 overflow-hidden mb-3" style={{ background: '#fffbeb' }}>
                  <div className="card-body p-4 text-center">
                    <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-25 text-warning mb-2">
                      <AlertCircle size={28} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Vendor Payment Notice</h6>
                    <div className="alert alert-warning border border-warning d-inline-block text-start mb-0 py-2 px-3" style={{ fontSize: '0.88rem' }}>
                      <strong>Vendor payment QR is not configured. Please contact support.</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vendor Cancellation Policy Card */}
            <VendorCancellationPolicyCard
              policy={vendorCancellationPolicy}
              agreed={policyAgreed}
              onAgreementChange={setPolicyAgreed}
              customerPayment={totalAmount}
            />

            {(() => {
              const activeVendorPayment = paymentSettings && paymentSettings.length > 0 ? (
                paymentSettings.find(m => (m.method_type === 'UPI' || m.qr_image_url || m.upi_id) && (m.upi_id || m.qr_image_url)) || paymentSettings[0]
              ) : null;
              const isVendorPaymentConfigured = Boolean(
                activeVendorPayment && (activeVendorPayment.qr_image_url || activeVendorPayment.upi_id)
              );
              const isSubmitDisabled = isProcessing || !policyAgreed || (paymentOption === 'static_qr' && (!isVendorPaymentConfigured || !transactionId));

              return (
                <div className="mt-4 text-end">
                  <button 
                    className="btn btn-warning px-5 py-2.5 fw-bold w-100 shadow-sm rounded-3" 
                    onClick={handleConfirmBooking}
                    disabled={isSubmitDisabled}
                    style={{ fontSize: '0.95rem', opacity: isSubmitDisabled ? 0.65 : 1 }}
                  >
                    {isProcessing ? 'Confirming Booking...' : (isPayAtHotel ? `Confirm Booking (Pay ₹${totalAmount.toLocaleString('en-IN')} at Hotel)` : `Submit Payment of ₹${totalAmount.toLocaleString('en-IN')}`)}
                  </button>
                </div>
              );
            })()}
          </>
        ) : (
          /* Foreign Customer Flow: Review & Reserve (NO fake UPI QR, NO INR shown) */
          <>
            <div className="card shadow-sm border border-primary border-opacity-25 rounded-4 overflow-hidden mb-3" style={{ background: '#f8fafc' }}>
              <div className="card-body p-4 text-center">
                <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-2">
                  <ShieldCheck size={28} />
                </div>
                <h6 className="fw-bold text-dark mb-1">Foreign Customer Stay Reservation</h6>
                <div className="text-muted small mb-3">
                  Payable in your local currency: <strong className="text-primary font-heading"><CurrencyPriceDisplay amountInr={totalAmount} size="md" highlight /></strong>
                </div>
                <div className="alert alert-info border border-info border-opacity-25 text-start py-2.5 px-3 mb-0" style={{ fontSize: '0.82rem' }}>
                  <strong>Notice:</strong> International Online Card Payment Gateway is currently being integrated for seamless checkout. Your room will be provisionally reserved directly with {selectedBookingItem.name} upon confirmation, and our operations team / hotel will reach out to provide you with secure international payment settlement instructions.
                </div>
              </div>
            </div>

            {/* Vendor Cancellation Policy Card */}
            <VendorCancellationPolicyCard
              policy={vendorCancellationPolicy}
              agreed={policyAgreed}
              onAgreementChange={setPolicyAgreed}
              customerPayment={totalAmount}
            />

            <div className="mt-4 text-end">
              <button 
                className="btn btn-primary px-5 py-2.5 fw-bold w-100 shadow-sm rounded-3" 
                onClick={handleConfirmBooking}
                disabled={isProcessing || !policyAgreed}
                style={{ fontSize: '0.95rem', opacity: (!policyAgreed || isProcessing) ? 0.65 : 1, background: '#FF6333', borderColor: '#FF6333' }}
              >
                {isProcessing ? 'Confirming Reservation...' : <>Confirm &amp; Reserve Stay (<CurrencyPriceDisplay amountInr={totalAmount} size="sm" color="#ffffff" />)</>}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    const selectedCustom = paymentSettings.find(m => m.id?.toString() === paymentOption?.toString());
    const effectiveAmountPaid = isPayAtHotel ? 0 : (paymentOption === 'partial' ? advanceAmount : finalTotalPayable);
    const effectiveRemaining = isPayAtHotel ? finalTotalPayable : (paymentOption === 'partial' ? Math.max(0, finalTotalPayable - advanceAmount) : 0);

    return (
      <div className="py-2 animate-fade-in" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <BookingConfirmationCard
          bookingId={bookingId}
          customerName={guestName || 'Valued Guest'}
          customerPhone={guestPhone}
          serviceTitle={selectedBookingItem.name}
          serviceSubtitle={`🏨 ${nights} ${nights === 1 ? 'Night' : 'Nights'} Resort Stay`}
          cashbackPreview={confirmedCashbackPreview}
          serviceType="hotel"
          details={[
            { label: 'Hotel Property', value: selectedBookingItem.name, icon: <BedDouble size={14} /> },
            { label: 'Stay Schedule', value: `${modalCheckInDate} (${checkInTime}) → ${modalCheckOutDate} (${checkOutTime})`, icon: <Calendar size={14} /> },
            { label: 'Room Category', value: selectedRoom?.name || 'Standard Resort Room', icon: <BedDouble size={14} /> },
            { label: 'Guests & Rooms', value: `${totalGuestsCount} Guests (${roomsCount} Room${roomsCount > 1 ? 's' : ''})`, icon: <Users size={14} /> },
            ...(appliedWalletAmount > 0 ? [{ label: 'Wallet Cashback Used', value: `-₹${appliedWalletAmount.toLocaleString('en-IN')}`, isSuccess: true }] : []),
            ...(driverOptionEnabled && driverRequired ? [{
              label: 'Chauffeur Service',
              value: driverServiceType === 'full_day' ? 'Full-Day Sightseeing Chauffeur' : (driverServiceType === 'entire_stay' ? `Dedicated Chauffeur (${nights} Nights)` : 'Airport / Railway Transfer'),
              isHighlight: true
            }] : [])
          ]}
          totalAmount={totalAmount}
          amountPaid={effectiveAmountPaid}
          remainingBalance={effectiveRemaining}
          paymentMode={isPayAtHotel ? 'Pay at Hotel Front Desk' : (selectedCustom?.method_name || (paymentOption === 'upi_direct' ? 'Online / UPI' : 'Prepaid'))}
          paymentStatus={isPayAtHotel ? 'Confirmed (Pay at Hotel)' : 'Confirmed & Paid'}
          onClose={handleHotelModalClose}
        />
      </div>
    );
  };

  if (!selectedBookingItem) return null;

  return createPortal(
    <div 
      className="checkout-modal-backdrop" 
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }} 
      onClick={handleHotelModalClose}
    >
      <div className="checkout-modal-content animate-fade-in-up" style={{ maxWidth: step === 4 ? '600px' : '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header bg-dark text-white">
          <h4 className="m-0 fw-bold">
            {step === 4 ? 'Booking Confirmation' : 'Complete Your Booking'}
          </h4>
          <button type="button" className="btn btn-link text-white p-0 border-0" onClick={handleHotelModalClose}>
            <X size={24} />
          </button>
        </div>
        
        <div 
          className="checkout-body p-0 hotel-modal-body" 
          data-scrollable="true"
          style={{ 
            overflowY: step === 4 ? 'auto' : 'hidden', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
            {step === 4 ? (
                <div className="p-4" data-scrollable="true" style={{ overflowY: 'auto' }}>
                    {renderStep4()}
                </div>
            ) : (
                <div className="row g-0 flex-grow-1" style={{ minHeight: 0, height: '100%' }}>
                    <div 
                      className="col-lg-7 p-4 border-end overflow-auto custom-scrollbar" 
                      data-scrollable="true"
                      style={{ 
                        maxHeight: 'calc(90vh - 75px)', 
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y'
                      }}
                    >
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                    <div 
                      className="col-lg-5 p-4 bg-light overflow-auto custom-scrollbar" 
                      data-scrollable="true"
                      style={{ 
                        maxHeight: 'calc(90vh - 75px)', 
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y'
                      }}
                    >
                        <h5 className="fw-bold mb-3 border-bottom pb-2">Booking Summary</h5>
                        
                        <div className="card shadow-sm border mb-4 overflow-hidden">
                            <div className="p-2 bg-light border-bottom">
                              <ImageCarousel
                                images={hotelAllImages}
                                height="175px"
                                rounded="10px"
                                alt={selectedBookingItem.name}
                              />
                            </div>
                            <div className="card-body p-3">
                                <h6 className="fw-bold mb-1">{selectedBookingItem.name}</h6>
                                <span className="badge bg-secondary mb-3">Hotel Stay</span>
                                
                                <div className="bg-light p-2.5 rounded-3 mb-3 small border">
                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom">
                                        <span className="text-dark fw-bold d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                                            <Calendar size={13} className="text-primary" /> Stay Schedule
                                        </span>
                                        <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>
                                            {nights} Night{nights > 1 ? 's' : ''} Stay
                                        </span>
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="text-muted text-truncate d-block mb-1" style={{ fontSize: '10px', fontWeight: 700 }}>CHECK-IN</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm fw-bold px-1 text-center"
                                                style={{ fontSize: '11px', background: '#ffffff' }}
                                                min={getTodayDateStr()}
                                                value={modalCheckInDate}
                                                onChange={(e) => handleCheckInChange(e.target.value)}
                                            />
                                            <select
                                                className="form-select form-select-sm mt-1 px-1 text-center text-muted fw-semibold"
                                                style={{ fontSize: '10px', background: '#ffffff' }}
                                                value={checkInTime}
                                                onChange={(e) => {
                                                  setCheckInTime(e.target.value);
                                                  setArrivalTime(e.target.value);
                                                }}
                                            >
                                                {TIME_SLOTS.map(t => <option key={`sum-in-${t}`} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-muted text-truncate d-block mb-1" style={{ fontSize: '10px', fontWeight: 700 }}>CHECK-OUT</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm fw-bold px-1 text-center"
                                                style={{ fontSize: '11px', background: '#ffffff' }}
                                                min={addDays(modalCheckInDate, 1)}
                                                value={modalCheckOutDate}
                                                onChange={(e) => handleCheckOutChange(e.target.value)}
                                            />
                                            <select
                                                className="form-select form-select-sm mt-1 px-1 text-center text-muted fw-semibold"
                                                style={{ fontSize: '10px', background: '#ffffff' }}
                                                value={checkOutTime}
                                                onChange={(e) => setCheckOutTime(e.target.value)}
                                            >
                                                {TIME_SLOTS.map(t => <option key={`sum-out-${t}`} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {selectedRoom && (
                                    <div className="mb-3 p-2 bg-white border rounded small">
                                        <div className="fw-bold text-primary mb-1">{selectedRoom.name}</div>
                                        <div className="d-flex justify-content-between text-muted" style={{fontSize: '11px'}}>
                                            <span>Rooms: {numRooms}</span>
                                            <span>Guests: {adults} Adults {children > 0 ? `, ${children} Children` : ''}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="billing-summary-card small">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h6>
                            <div className="d-flex justify-content-between mb-1.5">
                                <span>Room ({selectedRoom?.name || 'Selected Room'}):</span>
                                <span className="fw-bold"><CurrencyPriceDisplay amountInr={nightlyRoomRate} /> / N</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                                <span>Meal Plan:</span>
                                <span className="badge bg-dark text-white text-xxs">{selectedRatePlan?.meal_plan || 'EP'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-muted">
                                <span>Stay Duration:</span>
                                <span>{nights} {nights === 1 ? 'Night' : 'Nights'} ({numRooms} {numRooms === 1 ? 'Room' : 'Rooms'})</span>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2 mb-1.5">
                                <span>Base Room Total:</span>
                                <span><CurrencyPriceDisplay amountInr={baseRoomTotal} /></span>
                            </div>
                            {extraAdultTotal > 0 && (
                              <div className="d-flex justify-content-between mb-1.5 text-muted">
                                  <span>Extra Adults ({extraAdultsCount}):</span>
                                  <span><CurrencyPriceDisplay amountInr={extraAdultTotal} /></span>
                              </div>
                            )}
                            {extraChildTotal > 0 && (
                              <div className="d-flex justify-content-between mb-1.5 text-muted">
                                  <span>Extra Children:</span>
                                  <span><CurrencyPriceDisplay amountInr={extraChildTotal} /></span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                                <span>GST (18%):</span>
                                <span><CurrencyPriceDisplay amountInr={gst} /></span>
                            </div>
                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                                <span>Platform Fee:</span>
                                <span><CurrencyPriceDisplay amountInr={platformFee} /></span>
                            </div>
                            {driverOptionEnabled && driverRequired && driverCharge > 0 && (
                              <div className="d-flex justify-content-between mb-1.5 text-muted">
                                  <span>Chauffeur Service ({driverServiceType}):</span>
                                  <span><CurrencyPriceDisplay amountInr={driverCharge} /></span>
                              </div>
                            )}

                            {/* Loyalty Tier Recognition & Perks */}
                            {loyaltyInfo && customerTier !== 'New Member' && (
                              <div className="p-2 rounded-3 my-2 d-flex align-items-center justify-content-between" style={{
                                background: customerTier === 'Platinum' ? 'linear-gradient(135deg, #1e1b4b, #312e81)' :
                                            customerTier === 'Gold' ? 'linear-gradient(135deg, #78350f, #b45309)' :
                                            customerTier === 'Silver' ? 'linear-gradient(135deg, #334155, #475569)' :
                                            'linear-gradient(135deg, #7c2d12, #9a3412)',
                                color: '#fff'
                              }}>
                                <div className="d-flex align-items-center gap-1.5">
                                  <Crown size={14} className="text-warning" />
                                  <div>
                                    <span className="fw-bold text-xs">{customerTier} Member</span>
                                    <span className="text-white-50 ms-1" style={{ fontSize: '10px' }}>({loyaltyInfo.qualifying_trips_count || 0} qualifying trips)</span>
                                  </div>
                                </div>
                                {customerTier === 'Gold' && !isGoldEligible && (
                                  <span className="badge bg-warning text-dark text-xxs">Special member discounts on &gt;₹5k</span>
                                )}
                                {customerTier === 'Platinum' && !isPlatinumEligible && (
                                  <span className="badge bg-light text-dark text-xxs">Special member discounts on &gt;₹10k</span>
                                )}
                              </div>
                            )}

                            {/* Gold/Platinum Discount Alerts */}
                            {isGoldEligible && (
                              <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
                                🥇 <strong>Gold Member Privilege:</strong> Instant privilege discount applied!
                              </div>
                            )}
                            {isPlatinumEligible && (
                              <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#f5f3ff', border: '1px solid #a855f7', color: '#581c87' }}>
                                💎 <strong>Platinum VIP Privilege:</strong> Instant VIP discount applied!
                              </div>
                            )}

                            {tierDiscount > 0 && (
                              <div className="d-flex justify-content-between mb-2 text-warning fw-bold">
                                <span>Tier Privilege Discount:</span>
                                <span>-<CurrencyPriceDisplay amountInr={tierDiscount} /></span>
                              </div>
                            )}

                            {walletBalance > 0 && (
                                <div className="p-2.5 rounded-3 my-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-1.5">
                                            <Wallet size={15} className="text-success" />
                                            <div>
                                                <div className="fw-bold text-dark text-xs">WOW GOA Wallet</div>
                                                <div className="text-muted" style={{ fontSize: '10px' }}>Available: <CurrencyPriceDisplay amountInr={walletBalance} size="sm" /></div>
                                            </div>
                                        </div>
                                        <div className="form-check form-switch mb-0">
                                            <input 
                                                type="checkbox" 
                                                className="form-check-input" 
                                                id="useHotelWalletCashback"
                                                checked={useWalletCashback}
                                                onChange={(e) => setUseWalletCashback(e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label text-xs fw-bold text-success" htmlFor="useHotelWalletCashback">
                                                Use 10% Benefit
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {appliedWalletAmount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                                    <span>Wallet Cashback Applied:</span>
                                    <span>-<CurrencyPriceDisplay amountInr={appliedWalletAmount} /></span>
                                </div>
                            )}

                            <div className="d-flex justify-content-between align-items-baseline border-top border-dark pt-2 fw-bold text-primary">
                                <span style={{ fontSize: '15px' }}>Total Payable:</span>
                                <CurrencyPriceDisplay amountInr={finalTotalPayable} size="lg" highlight />
                            </div>

                            {/* 10% Cashback Earning Preview */}
                            <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                                <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                                    <Gift size={13} className="text-warning" />
                                    <span>10% Cashback You Will Earn: <strong className="text-success font-heading"><CurrencyPriceDisplay amountInr={projectedCashback} /></strong></span>
                                </div>
                                <div className="text-muted text-xxs mt-0.5">
                                    Credited to your wallet on trip completion • Valid 30 days
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-white border rounded text-muted mt-4" style={{ fontSize: '11px' }}>
                            <div className="d-flex align-items-start gap-2">
                                <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                                <span><strong>Secure Booking:</strong> Your information is protected by 256-bit encryption.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
}
