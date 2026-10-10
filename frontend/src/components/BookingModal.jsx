import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, ShieldCheck, Compass, Calendar, Clock, MapPin, Cake, Award, Sparkles, Gift, Wallet, Users, Crown, Car, Bike, Camera, AlertCircle, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { getTodayDateStr, addDays, validateVehicleBookingEligibility } from '../utils/dateUtils';
import * as api from '../services/api';
import { checkCustomerDob } from '../services/api';
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

// Helper to normalize time strings (e.g. '10:00' -> '10:00 AM') so dropdown options match cleanly
function normalizeTimeStr(t) {
  if (!t || typeof t !== 'string') return '10:00 AM';
  const trimmed = t.trim();
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    let [hh, mm] = parts[0].split(':');
    hh = hh.padStart(2, '0');
    return `${hh}:${mm} ${parts[1].toUpperCase()}`;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return trimmed;
}

export default function BookingModal({
  selectedBookingItem,
  setSelectedBookingItem,
  onCloseModal,
  showSuccess,
  setShowSuccess,
  userName,
  setUserName,
  userPhone,
  setUserPhone,
  userEmail,
  setUserEmail,
  userLicense,
  setUserLicense,
  pickupLoc,
  dropLoc,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  bookingDays,
  handleConfirmBooking,
  lastConfirmedBooking,
  setLastConfirmedBooking,
  allPackages = [],
  allCars = [],
  allBikes = []
}) {
  if (!selectedBookingItem) return null;
  const { country, currency, category, isIndian, isForeign, setCountry, resetCountry } = useCustomerCurrency();
  const [bookingStep, setBookingStep] = useState('DETAILS'); // 'DETAILS' | 'PAYMENT'
  const [internalEmail, setInternalEmail] = useState('');
  const emailVal = userEmail !== undefined ? userEmail : internalEmail;
  const setEmailVal = setUserEmail || setInternalEmail;

  const [modalPickupDate, setModalPickupDate] = useState(pickupDate || getTodayDateStr());
  const [modalDropDate, setModalDropDate] = useState(dropDate || addDays(pickupDate || getTodayDateStr(), bookingDays || 2));
  const [modalPickupTime, setModalPickupTime] = useState(normalizeTimeStr(pickupTime || '10:00 AM'));
  const [modalDropTime, setModalDropTime] = useState(normalizeTimeStr(dropTime || '10:00 AM'));
  const [modalPickupLoc, setModalPickupLoc] = useState(pickupLoc || 'Goa Airport (Dabolim - GOI)');
  const [modalDropLoc, setModalDropLoc] = useState(dropLoc || pickupLoc || 'Goa Airport (Dabolim - GOI)');
  const [userDob, setUserDob] = useState('');
  const [isDobSaved, setIsDobSaved] = useState(false);
  const [dobChecking, setDobChecking] = useState(false);

  // Customer Wallet Cashback & Loyalty State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [platinumPerkChoice, setPlatinumPerkChoice] = useState('discount');

  // Vendor Cancellation Policy & Static QR Payment State
  const [vendorCancellationPolicy, setVendorCancellationPolicy] = useState(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [staticQrReference, setStaticQrReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => 'idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));

  const modalBodyRef = useRef(null);

  // Authoritative Modal Teardown & Reset: clears confirmation state and restores default country/currency
  const handleModalClose = () => {
    setBookingStep('DETAILS');
    setPolicyAgreed(false);
    setStaticQrReference('');
    setIsSubmitting(false);
    setIdempotencyKey('idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));
    if (resetCountry) resetCountry();
    if (onCloseModal && typeof onCloseModal === 'function') {
      onCloseModal();
    } else {
      if (setShowSuccess) setShowSuccess(false);
      if (setLastConfirmedBooking) setLastConfirmedBooking(null);
      if (setSelectedBookingItem) setSelectedBookingItem(null);
    }
  };

  // Synchronize country on modal start: clean India for new booking, or parsed country if phone already exists
  useEffect(() => {
    const rawP = extractPhoneString(userPhone);
    if (!rawP) {
      if (resetCountry) resetCountry();
    } else {
      const parsed = parsePhoneNumber(rawP, 'IN');
      if (parsed.country && setCountry) {
        setCountry(parsed.country);
      }
    }
  }, [selectedBookingItem]);

  // Authoritative Customer Portal Tracker: tracks the CURRENT booking
  const handleTrackInPortal = () => {
    const curBooking = lastConfirmedBooking;
    if (curBooking) {
      try {
        sessionStorage.setItem('last_created_booking', JSON.stringify(curBooking));
        localStorage.setItem('last_created_booking', JSON.stringify(curBooking));
        const ph = curBooking.customer_phone || curBooking.phone || userPhone;
        if (ph) {
          const clean = String(ph).replace(/\D/g, '');
          sessionStorage.setItem('customer_login_phone', clean);
          localStorage.setItem('customer_login_phone', clean);
        }
      } catch (e) {}
    }
    handleModalClose();
    window.location.href = '/customer';
  };

  // Global background scroll lock with exact scroll position preservation
  useEffect(() => {
    lockScroll('booking-modal');
    return () => {
      unlockScroll('booking-modal');
    };
  }, []);


  useEffect(() => {
    if (pickupDate) setModalPickupDate(pickupDate);
    if (dropDate) setModalDropDate(dropDate);
    if (pickupTime) setModalPickupTime(normalizeTimeStr(pickupTime));
    if (dropTime) setModalDropTime(normalizeTimeStr(dropTime));
    if (pickupLoc) setModalPickupLoc(pickupLoc);
    if (dropLoc) setModalDropLoc(dropLoc);
  }, [pickupDate, dropDate, pickupTime, dropTime, pickupLoc, dropLoc]);

  // Repeat customer lookup for Date of Birth & Wallet Balance & Loyalty Tier
  useEffect(() => {
    const clean = String(userPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      setDobChecking(true);
      checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setUserDob(res.date_of_birth);
          setIsDobSaved(true);
          if (!userName && res.name && setUserName) {
            setUserName(res.name);
          }
        } else {
          setIsDobSaved(false);
        }
      }).catch(() => {
        setIsDobSaved(false);
      }).finally(() => {
        setDobChecking(false);
      });

      // Fetch customer wallet & loyalty tier
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
  }, [userPhone]);

  const allItemImages = useMemo(() => {
    if (!selectedBookingItem) return [];
    let list = [];
    if (selectedBookingItem.images_json) {
      try {
        const parsed = typeof selectedBookingItem.images_json === 'string' ? JSON.parse(selectedBookingItem.images_json) : selectedBookingItem.images_json;
        if (Array.isArray(parsed)) list.push(...parsed);
      } catch (e) {}
    }
    if (selectedBookingItem.mediaList && Array.isArray(selectedBookingItem.mediaList)) {
      const urls = selectedBookingItem.mediaList.map(m => m?.url || m).filter(Boolean);
      list.push(...urls);
    }
    if (selectedBookingItem.media_list && Array.isArray(selectedBookingItem.media_list)) {
      const urls = selectedBookingItem.media_list.map(m => m?.url || m).filter(Boolean);
      list.push(...urls);
    }
    if (selectedBookingItem.additional_images && Array.isArray(selectedBookingItem.additional_images)) {
      list.push(...selectedBookingItem.additional_images);
    }
    if (selectedBookingItem.images && Array.isArray(selectedBookingItem.images)) {
      list.push(...selectedBookingItem.images);
    }
    if (selectedBookingItem.image) {
      list.push(selectedBookingItem.image);
    }
    if (selectedBookingItem.image_url) {
      list.push(selectedBookingItem.image_url);
    }
    const unique = Array.from(new Set(list.filter(u => typeof u === 'string' && u.trim().length > 0)));
    return unique;
  }, [selectedBookingItem]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setActiveImageIdx(0);
    if (selectedBookingItem?.totalMembers || selectedBookingItem?.guests) {
      setTotalMembers(parseInt(selectedBookingItem.totalMembers || selectedBookingItem.guests, 10) || 1);
    }
  }, [selectedBookingItem]);

  const [addonPackageId, setAddonPackageId] = useState('');
  const [addonVehicleId, setAddonVehicleId] = useState('');
  const [includeFlight, setIncludeFlight] = useState(false);
  const [hotelCategory, setHotelCategory] = useState('3');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [totalMembers, setTotalMembers] = useState(1);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('any');

  // Driver / Chauffeur Service States
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverServiceType, setDriverServiceType] = useState('PICKUP'); // Strictly 'PICKUP', 'DROP', or 'FULL'
  const driverPickupEnabled = driverRequired && driverServiceType === 'PICKUP';
  const driverDropEnabled = driverRequired && driverServiceType === 'DROP';
  const driverFullDayEnabled = driverRequired && driverServiceType === 'FULL';
  const [driverPickupDate, setDriverPickupDate] = useState(pickupDate || '');
  const [driverPickupTime, setDriverPickupTime] = useState(modalPickupTime || '10:00 AM');
  const [isDriverPickupTimeManual, setIsDriverPickupTimeManual] = useState(false);
  const [driverPickupLoc, setDriverPickupLoc] = useState('Goa Airport (Dabolim)');
  const [driverPickupCustomLoc, setDriverPickupCustomLoc] = useState('');

  const [driverDropDate, setDriverDropDate] = useState(dropDate || '');
  const [driverDropTime, setDriverDropTime] = useState(modalDropTime || '10:00 AM');
  const [isDriverDropTimeManual, setIsDriverDropTimeManual] = useState(false);
  const [driverDropLoc, setDriverDropLoc] = useState('Goa Airport (Dabolim)');
  const [driverDropCustomLoc, setDriverDropCustomLoc] = useState('');

  const [driverFullDayStart, setDriverFullDayStart] = useState(pickupDate || '');
  const [driverFullDayEnd, setDriverFullDayEnd] = useState(dropDate || '');
  const [driverFullDayStartLoc, setDriverFullDayStartLoc] = useState('Hotel');
  const [driverFullDayCustomStartLoc, setDriverFullDayCustomStartLoc] = useState('');
  const [driverFullDayEndLoc, setDriverFullDayEndLoc] = useState('Hotel');
  const [driverFullDayCustomEndLoc, setDriverFullDayCustomEndLoc] = useState('');

  // Synchronize and safely clamp driver service dates within authoritative vehicle boundaries [modalPickupDate, modalDropDate]
  useEffect(() => {
    if (!modalPickupDate) return;

    // Driver Pickup Date
    setDriverPickupDate(prev => {
      if (!prev || !driverRequired) return modalPickupDate;
      if (prev < modalPickupDate) return modalPickupDate;
      if (modalDropDate && prev > modalDropDate) return modalDropDate;
      return prev;
    });

    // Driver Drop Date
    setDriverDropDate(prev => {
      const fallbackDrop = modalDropDate || modalPickupDate;
      if (!prev || !driverRequired) return fallbackDrop;
      if (prev < modalPickupDate) return modalPickupDate;
      if (modalDropDate && prev > modalDropDate) return modalDropDate;
      return prev;
    });

    // Driver Full Day Start
    setDriverFullDayStart(prev => {
      if (!prev || !driverRequired) return modalPickupDate;
      if (prev < modalPickupDate) return modalPickupDate;
      if (modalDropDate && prev > modalDropDate) return modalDropDate;
      return prev;
    });

    // Driver Full Day End
    setDriverFullDayEnd(prev => {
      const fallbackDrop = modalDropDate || modalPickupDate;
      if (!prev || !driverRequired) return fallbackDrop;
      if (modalDropDate && prev > modalDropDate) return modalDropDate;
      if (prev < modalPickupDate) return modalPickupDate;
      return prev;
    });
  }, [modalPickupDate, modalDropDate, driverRequired]);

  // Ensure Driver Full-Day End date is never before Start date
  useEffect(() => {
    if (driverFullDayStart && driverFullDayEnd && driverFullDayEnd < driverFullDayStart) {
      setDriverFullDayEnd(driverFullDayStart);
    }
  }, [driverFullDayStart, driverFullDayEnd]);

  // Synchronize driver pickup time with vehicle pickup time unless customer manually customized driver pickup time
  useEffect(() => {
    if (!isDriverPickupTimeManual && modalPickupTime) {
      setDriverPickupTime(modalPickupTime);
    }
  }, [modalPickupTime, isDriverPickupTimeManual]);

  // Synchronize driver drop time with vehicle drop time unless customer manually customized driver drop time
  useEffect(() => {
    if (!isDriverDropTimeManual && modalDropTime) {
      setDriverDropTime(modalDropTime);
    }
  }, [modalDropTime, isDriverDropTimeManual]);

  const hotelUpgradeCost = {
    '3': 0,
    '4': 2500, // per person/package
    '5': 6000
  };

  useEffect(() => {
    import('../services/api').then(api => {
      const rawVendorId = selectedBookingItem?.vendor_id || selectedBookingItem?.vendorId;
      const isCarOrBikeItem = selectedBookingItem && (
        String(selectedBookingItem?.id).startsWith('car-') ||
        String(selectedBookingItem?.id).startsWith('bike-') ||
        selectedBookingItem.type === 'car' ||
        selectedBookingItem.type === 'bike' ||
        selectedBookingItem.category === 'bike' ||
        /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|faschino|access\s*125|thar|swift|creta|ertiga|fortuner/i.test(
          selectedBookingItem?.name || selectedBookingItem?.vehicle_name || selectedBookingItem?.title || ''
        )
      );
      const effectiveVendorId = (rawVendorId && rawVendorId !== 'admin')
        ? rawVendorId
        : (isCarOrBikeItem ? 'u-4' : null);

      if (effectiveVendorId) {
        api.getVendorPaymentMethods(effectiveVendorId).then(methods => {
          const activeMethods = (methods || []).filter(m => m.status === 'Active');
          setPaymentSettings(activeMethods);
          if (activeMethods.length > 0) {
            setSelectedPaymentMethod(activeMethods[0].id ? activeMethods[0].id.toString() : 'default');
          }
        }).catch(err => {
          console.error('Error fetching vendor payment methods:', err);
          setPaymentSettings([]);
        });
      } else {
        // Customer booking MUST NOT fall back to admin payment methods
        setPaymentSettings([]);
      }

      // Fetch room types if hotel
      const isHotelItem = selectedBookingItem && (selectedBookingItem.id.toString().startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars);
      if (isHotelItem && effectiveVendorId) {
         api.pmsListRoomTypes(effectiveVendorId).then(res => {
           const hotelRooms = (res.room_types || []).filter(rt => rt.hotel_id == selectedBookingItem.id && rt.status === 'Active');
           setRoomTypes(hotelRooms);
         }).catch(console.error);
      }

      // Fetch Vendor Cancellation Policy
      const sType = isHotelItem ? 'hotel' : 'vehicle';
      api.fetchVendorCancellationPolicy(effectiveVendorId || 'u-4', sType).then(res => {
        if (res && res.policy) {
          setVendorCancellationPolicy(res.policy);
        }
      }).catch(console.error);
    });
  }, [selectedBookingItem]);

  const isHotel = String(selectedBookingItem?.id).startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars;
  const isTaxi = selectedBookingItem?.type === 'taxi' || selectedBookingItem?.package_type === 'Taxi Transfer' || String(selectedBookingItem?.id || '').startsWith('tx-');
  const isCar = String(selectedBookingItem?.id).startsWith('car-') || selectedBookingItem.type === 'car';
  const isBike = String(selectedBookingItem?.id).startsWith('bike-') || 
    selectedBookingItem.type === 'bike' || 
    selectedBookingItem.item_type === 'bike' || 
    selectedBookingItem.category === 'bike' ||
    /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|faschino|access\s*125/i.test(
      selectedBookingItem?.name || selectedBookingItem?.vehicle_name || selectedBookingItem?.title || ''
    );
  const isFlight = String(selectedBookingItem?.id).startsWith('FL-') || String(selectedBookingItem?.id).startsWith('fl-') || String(selectedBookingItem?.id).startsWith('flt-') || selectedBookingItem.type === 'flight' || Boolean(selectedBookingItem.airline) || Boolean(selectedBookingItem.flight_number);
  const isActivity = String(selectedBookingItem?.id).startsWith('act-') || String(selectedBookingItem?.id).startsWith('sight-') || selectedBookingItem.type === 'activity' || selectedBookingItem.type === 'sightseeing' || selectedBookingItem.item_type === 'activity' || selectedBookingItem.item_type === 'sightseeing';
  const isPackage = !isCar && !isBike && !isFlight && !isHotel && !isActivity;
  
  const calculatedDays = useMemo(() => {
    if (!modalPickupDate || !modalDropDate) return bookingDays || 1;
    const start = new Date(modalPickupDate);
    const end = new Date(modalDropDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [modalPickupDate, modalDropDate, bookingDays]);

  const addonPackage = allPackages.find(p => p.id === addonPackageId);
  const addonVehicle = [...allCars, ...allBikes].find(v => v.id === addonVehicleId);

  const baseRate = (isPackage && includeFlight && selectedBookingItem.price_with_flight) 
    ? selectedBookingItem.price_with_flight 
    : selectedBookingItem.price;

  let itemCost = baseRate * calculatedDays;
  if (isPackage) {
    itemCost = baseRate; // packages are flat price
  }

  if (isFlight || isActivity) {
    // If flight or activity multiply base rate by members / guests
    itemCost = baseRate * (totalMembers || 1);
  }

  // Calculate Full-Day Driver Days automatically
  const driverFullDayDaysCount = useMemo(() => {
    if (!driverFullDayEnabled || !driverFullDayStart || !driverFullDayEnd) return 0;
    const start = new Date(driverFullDayStart);
    const end = new Date(driverFullDayEnd);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // inclusive count
    return diff > 0 ? diff : 1;
  }, [driverFullDayEnabled, driverFullDayStart, driverFullDayEnd]);

  // Exact driver costs based ONLY on selected authoritative service type
  const driverPickupCost = (driverRequired && driverServiceType === 'PICKUP') ? 400 : 0;
  const driverDropCost = (driverRequired && driverServiceType === 'DROP') ? 400 : 0;
  const driverFullDayCost = (driverRequired && driverServiceType === 'FULL') ? (800 * driverFullDayDaysCount) : 0;
  const driverTotalCharge = driverRequired ? (driverPickupCost + driverDropCost + driverFullDayCost) : 0;
  const totalDriverServiceDays = driverRequired 
    ? (driverServiceType === 'FULL' ? driverFullDayDaysCount : 1) 
    : 0;

  let subtotal = itemCost;
  if (isPackage) {
    subtotal += hotelUpgradeCost[hotelCategory] || 0;
  }
  if (addonPackage) {
    subtotal += addonPackage.price;
  }
  if (addonVehicle) {
    subtotal += (addonVehicle.price * calculatedDays);
  }

    const tax = Math.round(subtotal * 0.18);
  const fee = 250;
  const baseTotal = subtotal + tax + fee;
  const total = baseTotal + driverTotalCharge;

  // Authoritative Loyalty Tier & Tier Discount Enforcement
  const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
  const isGold = customerTier === 'Gold';
  const isPlatinum = customerTier === 'Platinum';

  const isGoldEligible = isGold && total > 5000;
  const isPlatinumEligible = isPlatinum && total > 10000;

  let tierDiscount = 0;
  if (isGoldEligible) {
    tierDiscount = 500;
  } else if (isPlatinumEligible) {
    tierDiscount = platinumPerkChoice === 'discount' ? 1000 : 0;
  }

  const postTierTotal = Math.max(0, total - tierDiscount);

  // Wallet Deduction (Strictly 10% Discount/Benefit on post-tier net) & 10% Cashback Calculations
  const maxWalletBenefit = Math.round(postTierTotal * 0.10);
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
  const finalPayable = Math.max(0, postTierTotal - appliedWalletAmount);
  const projectedCashback = Math.round(finalPayable * 0.10);

  const validateDetailsStep = () => {
    if (!userName || !userName.trim()) {
      alert("Please enter your Full Name.");
      return false;
    }
    const cleanPhone = String(userPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 6) {
      alert("Please enter a valid phone number with your country code.");
      return false;
    }
    const cleanEmail = String(emailVal || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      alert("Please enter a valid Gmail / Email address (e.g. name@gmail.com). Your booking confirmation and official trip voucher will be emailed here.");
      return false;
    }

    const isVehicleItem = isCar || isBike || Boolean(addonVehicle);
    if (isVehicleItem) {
      const isSelfDriveRental = (!isTaxi && (!driverRequired || isBike));
      const eligibility = validateVehicleBookingEligibility(
        userDob,
        modalPickupDate,
        isSelfDriveRental,
        userLicense
      );
      if (!eligibility.valid) {
        alert(eligibility.error);
        return false;
      }
    } else {
      if (!userDob && !isDobSaved) {
        alert("Please select your Date of Birth (Day, Month, and Year). Date of Birth is required for birthday privileges and special offers from WOW GOA.");
        return false;
      }
    }

    // Validation for driver services when enabled
    if (driverRequired) {
      if (!driverServiceType) {
        alert("Please select a Driver Service option: Pickup (₹400), Drop (₹400), or Full-Day Driver (₹800/day).");
        return false;
      }

      if (driverServiceType === 'PICKUP') {
        const effectivePickup = driverPickupDate || modalPickupDate;
        if (!effectivePickup) {
          alert("Please select a valid Pickup Date for the Driver Pickup service.");
          return false;
        }
        if (modalPickupDate && effectivePickup < modalPickupDate) {
          alert(`Driver pickup date cannot be before vehicle pickup date (${modalPickupDate}).`);
          return false;
        }
        if (modalDropDate && effectivePickup > modalDropDate) {
          alert(`Driver pickup date cannot be after vehicle drop date (${modalDropDate}).`);
          return false;
        }
        if (driverPickupLoc === 'Custom Address' && !driverPickupCustomLoc.trim()) {
          alert("Please enter the Custom Address for the Driver Pickup service.");
          return false;
        }
      }

      if (driverServiceType === 'DROP') {
        const effectiveDrop = driverDropDate || modalDropDate;
        if (!effectiveDrop) {
          alert("Please select a valid Drop Date for the Driver Drop service.");
          return false;
        }
        if (modalPickupDate && effectiveDrop < modalPickupDate) {
          alert(`Driver drop date cannot be before vehicle pickup date (${modalPickupDate}).`);
          return false;
        }
        if (modalDropDate && effectiveDrop > modalDropDate) {
          alert(`Driver drop date cannot be after vehicle drop date (${modalDropDate}).`);
          return false;
        }
        if (driverDropLoc === 'Custom Address' && !driverDropCustomLoc.trim()) {
          alert("Please enter the Custom Address for the Driver Drop service.");
          return false;
        }
      }

      if (driverServiceType === 'FULL') {
        const effectiveStart = driverFullDayStart || modalPickupDate;
        const effectiveEnd = driverFullDayEnd || modalDropDate;
        if (!effectiveStart || !effectiveEnd) {
          alert("Please select valid Start and End dates for the Full-Day Driver service.");
          return false;
        }
        if (modalPickupDate && effectiveStart < modalPickupDate) {
          alert(`Driver start date cannot be before vehicle pickup date (${modalPickupDate}).`);
          return false;
        }
        if (modalDropDate && effectiveEnd > modalDropDate) {
          alert(`Driver end date cannot be after vehicle drop date (${modalDropDate}).`);
          return false;
        }
        if (effectiveEnd < effectiveStart) {
          alert("Driver end date cannot be before driver start date.");
          return false;
        }
        if (driverFullDayStartLoc === 'Custom Address' && !driverFullDayCustomStartLoc.trim()) {
          alert("Please enter the Custom Start Address for the Full-Day Driver service.");
          return false;
        }
        if (driverFullDayEndLoc === 'Custom Address' && !driverFullDayCustomEndLoc.trim()) {
          alert("Please enter the Custom End Address for the Full-Day Driver service.");
          return false;
        }
      }
    }

    return true;
  };

  const handleProceedToPayment = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateDetailsStep()) return;
    setBookingStep('PAYMENT');
    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBookingSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (!policyAgreed) {
      alert("Please review and acknowledge the vendor cancellation policy checkbox before confirming your booking.");
      return;
    }

    if (isIndian) {
      if (!staticQrReference || staticQrReference.trim().length < 6) {
        alert("Please enter the 12-digit UPI UTR / Transaction Reference ID after completing payment via the vendor Static QR.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const finalPickupLocResolved = driverPickupLoc === 'Custom Address' ? driverPickupCustomLoc : driverPickupLoc;
      const finalDropLocResolved = driverDropLoc === 'Custom Address' ? driverDropCustomLoc : driverDropLoc;
      const finalFullDayStartLocResolved = driverFullDayStartLoc === 'Custom Address' ? driverFullDayCustomStartLoc : driverFullDayStartLoc;
      const finalFullDayEndLocResolved = driverFullDayEndLoc === 'Custom Address' ? driverFullDayCustomEndLoc : driverFullDayEndLoc;

      const resolvedDriverPickupDate = driverPickupDate || modalPickupDate;
      const resolvedDriverDropDate = driverDropDate || modalDropDate;
      const resolvedDriverFullDayStart = driverFullDayStart || modalPickupDate;
      const resolvedDriverFullDayEnd = driverFullDayEnd || modalDropDate;

      const resolvedDriverPickupTime = driverPickupTime || modalPickupTime || '10:00 AM';
      const resolvedDriverDropTime = driverDropTime || modalDropTime || '10:00 AM';

      const driverDetailsPayload = {
        enabled: Boolean(driverRequired && (driverPickupEnabled || driverDropEnabled || driverFullDayEnabled)),
        pickup: {
          enabled: driverPickupEnabled,
          date: resolvedDriverPickupDate,
          time: resolvedDriverPickupTime,
          location: finalPickupLocResolved
        },
        drop: {
          enabled: driverDropEnabled,
          date: resolvedDriverDropDate,
          time: resolvedDriverDropTime,
          location: finalDropLocResolved
        },
        fullDay: {
          enabled: driverFullDayEnabled,
          startDate: resolvedDriverFullDayStart,
          endDate: resolvedDriverFullDayEnd,
          daysCount: driverFullDayDaysCount,
          startLocation: finalFullDayStartLocResolved,
          endLocation: finalFullDayEndLocResolved
        },
        dutyStartTime: "09:00",
        dutyEndTime: "19:00",
        dutyDescription: "8–10 Hours Local Daily Duty",
        totalCharge: driverTotalCharge
      };

      const paymentMethodToUse = isIndian 
        ? 'Static QR (UPI)' 
        : 'International Online Payment Gateway (Pending Integration)';
      const paymentRefToUse = isIndian 
        ? staticQrReference 
        : 'INTL_PENDING';

      await handleConfirmBooking(e, paymentMethodToUse, {
        idempotency_key: idempotencyKey,
        email: emailVal,
        customer_email: emailVal,
        pickupDate: modalPickupDate,
        dropDate: modalDropDate,
        pickupTime: modalPickupTime,
        dropTime: modalDropTime,
        pickupLoc: modalPickupLoc,
        dropLoc: modalDropLoc,
        pickup_loc: modalPickupLoc,
        pickup_location: modalPickupLoc,
        drop_loc: modalDropLoc,
        drop_location: modalDropLoc,
        bookingDays: calculatedDays,
        total_members: totalMembers,
        guests: totalMembers,
        totalMembers: totalMembers,
        driver_required: (!isBike && driverRequired) ? 1 : 0,
        driver_service_type: (!isBike && driverRequired) ? driverServiceType : null,
        driver_charge: (!isBike && driverRequired) ? driverTotalCharge : 0,
        driver_days: (!isBike && driverRequired) ? totalDriverServiceDays : 0,
        driver_earning: (!isBike && driverRequired) ? driverTotalCharge : 0,
        driver_payment_status: 'Pending',
        driver_pickup_enabled: driverPickupEnabled ? 1 : 0,
        driver_pickup_date: resolvedDriverPickupDate,
        driver_pickup_time: resolvedDriverPickupTime,
        driver_pickup_loc: finalPickupLocResolved,
        driver_drop_enabled: driverDropEnabled ? 1 : 0,
        driver_drop_date: resolvedDriverDropDate,
        driver_drop_time: resolvedDriverDropTime,
        driver_drop_loc: finalDropLocResolved,
        driver_fullday_enabled: driverFullDayEnabled ? 1 : 0,
        driver_fullday_start: resolvedDriverFullDayStart,
        driver_fullday_end: resolvedDriverFullDayEnd,
        driver_fullday_days: driverFullDayDaysCount,
        driver_details: driverDetailsPayload,
        date_of_birth: userDob,
        wallet_amount_used: appliedWalletAmount,
        tier_discount_applied: tierDiscount,
        customer_tier_at_booking: customerTier,
        customizations: {
          ...(typeof selectedBookingItem.customizations === 'object' ? selectedBookingItem.customizations : {}),
          platinum_upgrade_requested: isPlatinumEligible && platinumPerkChoice === 'upgrade',
          platinum_perk_choice: isPlatinumEligible ? platinumPerkChoice : null
        },
        subtotal,
        tax,
        fee,
        total,
        amount_paid: finalPayable,
        total_amount: total,
        customer_payment: finalPayable,
        payment_method: paymentMethodToUse,
        payment_reference: paymentRefToUse,
        payment_verification_status: 'Pending Verification',
        status: 'Pending',
        vendor_payout_status: 'Pending',
        cancellation_acknowledged: 1,
        vendor_id: selectedBookingItem.vendor_id || selectedBookingItem.vendorId || null,
        customer_country: country?.name || 'India',
        customer_country_code: country?.code || 'IN',
        customer_currency: currency || 'INR',
        customer_category: category || (isIndian ? 'INDIAN' : 'FOREIGN')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConfirmed = Boolean(showSuccess && lastConfirmedBooking);

  return createPortal(
    <div 
      className="checkout-modal-backdrop" 
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }} 
      onClick={handleModalClose}
    >
      <div className="checkout-modal-content animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <div className="d-flex align-items-center gap-2">
            {bookingStep === 'PAYMENT' && !isConfirmed && (
              <button 
                type="button" 
                className="btn btn-sm btn-link text-white p-0 me-1" 
                onClick={() => setBookingStep('DETAILS')}
                title="Back to Booking Details"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h4 className="m-0 font-heading text-white">
              {isConfirmed ? '✓ Booking Confirmation' : (bookingStep === 'PAYMENT' ? 'Confirm & Reserve (Review & Payment)' : 'Confirm Booking Details')}
            </h4>
          </div>
          <button 
            type="button" 
            className="btn btn-link text-white p-0 border-0"
            onClick={handleModalClose}
          >
            <X size={24} />
          </button>
        </div>
        
        <div ref={modalBodyRef} className="checkout-body text-start" data-scrollable="true">
          {isConfirmed ? (
            <div className="py-2 animate-fade-in">
              <BookingConfirmationCard
                key={lastConfirmedBooking?.id || lastConfirmedBooking?.booking_id || 'confirmed-card'}
                bookingId={lastConfirmedBooking?.id || lastConfirmedBooking?.booking_id}
                customerName={lastConfirmedBooking?.customer_name || lastConfirmedBooking?.name || userName || 'Valued Guest'}
                customerPhone={lastConfirmedBooking?.customer_phone || lastConfirmedBooking?.phone || userPhone || ''}
                serviceTitle={lastConfirmedBooking?.item_name || lastConfirmedBooking?.vehicle_name || selectedBookingItem.name}
                serviceSubtitle={addonPackage ? `✓ Bundled Tour: ${addonPackage.name}` : ''}
                cashbackPreview={lastConfirmedBooking?.cashback_preview}
                details={[
                  { 
                    label: isBike ? 'Two Wheeler' : 'Vehicle Model', 
                    value: lastConfirmedBooking?.vehicle_name || lastConfirmedBooking?.item_name || selectedBookingItem.name, 
                    icon: isBike ? <Bike size={14} /> : <Car size={14} /> 
                  },
                  { 
                    label: 'Rental Schedule', 
                    value: `${lastConfirmedBooking?.pickup_date || modalPickupDate} (${lastConfirmedBooking?.pickup_time || modalPickupTime}) → ${lastConfirmedBooking?.drop_date || modalDropDate} (${lastConfirmedBooking?.drop_time || modalDropTime})`, 
                    icon: <Calendar size={14} /> 
                  },
                  { 
                    label: 'Pickup Location', 
                    value: lastConfirmedBooking?.pickup_loc || lastConfirmedBooking?.pickup_location || modalPickupLoc, 
                    icon: <MapPin size={14} /> 
                  },
                  { 
                    label: 'Drop Location', 
                    value: lastConfirmedBooking?.drop_loc || lastConfirmedBooking?.drop_location || modalDropLoc, 
                    icon: <MapPin size={14} /> 
                  },
                  { 
                    label: 'Rental Duration', 
                    value: lastConfirmedBooking?.duration || (lastConfirmedBooking?.booking_days ? `${lastConfirmedBooking.booking_days} ${Number(lastConfirmedBooking.booking_days) === 1 ? 'Day' : 'Days'}` : `${calculatedDays} ${calculatedDays === 1 ? 'Day' : 'Days'}`), 
                    icon: <Clock size={14} /> 
                  },
                  ...(addonPackage ? [{ label: 'Bundled Package', value: addonPackage.name, isSuccess: true }] : []),
                  ...(addonVehicle ? [{ label: 'Bundled Vehicle', value: addonVehicle.name, isSuccess: true }] : []),
                  ...(driverRequired ? [{
                    label: 'Chauffeur Service',
                    value: driverServiceType === 'FULL' ? 'Full-Day Driver (₹800/day)' : (driverServiceType === 'DROP' ? 'Driver Drop Service (₹400)' : 'Driver Pickup Service (₹400)'),
                    isHighlight: true
                  }] : [])
                ]}
                totalAmount={(lastConfirmedBooking?.total_amount !== undefined && lastConfirmedBooking?.total_amount !== null) ? Number(lastConfirmedBooking.total_amount) : total}
                amountPaid={(lastConfirmedBooking?.amount_paid !== undefined && lastConfirmedBooking?.amount_paid !== null) ? Number(lastConfirmedBooking.amount_paid) : ((lastConfirmedBooking?.customer_payment !== undefined && lastConfirmedBooking?.customer_payment !== null) ? Number(lastConfirmedBooking.customer_payment) : finalPayable)}
                paymentMode={lastConfirmedBooking?.payment_method || (selectedPaymentMethod === 'cash' ? 'Cash on Delivery' : 'Online / UPI')}
                paymentStatus="Confirmed"
                onClose={handleModalClose}
                onTrackPortal={handleTrackInPortal}
              />
            </div>
          ) : (
            <div className="row g-4">
              {/* Left Column: Two-Step Booking Flow */}
              <div className="col-lg-7 text-start">
                
                {/* Step Navigation Pill Indicator */}
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${bookingStep === 'DETAILS' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                      onClick={() => bookingStep === 'PAYMENT' && setBookingStep('DETAILS')}
                    >
                      1. Details
                    </button>
                    <span className="text-muted small">→</span>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${bookingStep === 'PAYMENT' ? 'btn-primary text-white' : 'btn-light border text-muted'}`}
                      disabled={bookingStep === 'DETAILS'}
                    >
                      2. Payment &amp; Review
                    </button>
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

                {bookingStep === 'DETAILS' ? (
                  <>
                    <h5 className="fw-bold mb-3">Customer &amp; Trip Details</h5>
                    
                    <form onSubmit={handleProceedToPayment} id="booking-details-form">
                  {(!isPackage || !selectedBookingItem.traveller_details) && (
                    <>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Rohan Sharma"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required 
                        />
                      </div>
                      
                      <div className="mb-3">
                        <InternationalPhoneInput 
                          value={userPhone} 
                          onChange={(e164Val, countryObj) => {
                            setUserPhone(e164Val ? String(e164Val) : '');
                            if (countryObj && setCountry) setCountry(countryObj);
                          }}
                          onCountryChange={(c) => {
                            if (c && setCountry) setCountry(c);
                          }}
                          label="Mobile Phone Number"
                          required 
                        />
                        <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                          Use this mobile number to log in to the Customer Portal & track your booking.
                        </small>
                      </div>

                      <div className="mb-3 animate-fade-in">
                        <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                          <span>
                            Email Address (Gmail) <span className="text-danger">*</span>
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                            Instant Voucher Emailed
                          </span>
                        </label>
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="e.g. yourname@gmail.com"
                          value={emailVal}
                          onChange={(e) => setEmailVal(e.target.value)}
                          required 
                        />
                        <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                          Official WOW GOA reservation voucher with pickup and vehicle details will be emailed here instantly.
                        </small>
                      </div>

                      {/* Date of Birth Mandatory Field with Auto-Retrieval for Repeat Bookings */}
                      {isDobSaved ? (
                        <div className="mb-3 p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between animate-fade-in">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                              <Cake size={14} />
                            </div>
                            <div>
                              <div className="text-xs fw-bold text-success d-flex align-items-center gap-1">
                                <ShieldCheck size={13} /> Verified DOB on WOW GOA Account
                              </div>
                              <div className="text-xs text-dark mt-0.5">
                                🎂 Date of Birth: <strong>{userDob}</strong> <span className="text-muted">(Saved for birthday benefits)</span>
                              </div>
                            </div>
                          </div>
                          <span className="badge bg-success text-white text-xs px-2 py-1 rounded-pill">Saved</span>
                        </div>
                      ) : (
                        <div className="mb-3 animate-fade-in">
                          <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                            <span className="d-flex align-items-center gap-1">
                              <Cake size={14} className="text-warning" /> Date of Birth <span className="text-danger">*</span>
                            </span>
                            <span className="text-muted" style={{ fontSize: '11px' }}>[ Day / Month / Year ]</span>
                          </label>
                          <DobPicker 
                            value={userDob}
                            onChange={(val) => setUserDob(val)}
                            required={true}
                            referenceDate={modalPickupDate}
                          />
                          <small className="text-muted d-block mt-1" style={{ fontSize: '11px', color: '#64748b' }}>
                            Date of Birth is required to provide birthday benefits and special offers from WOW GOA.
                          </small>
                        </div>
                      )}
                    </>
                  )}

                  {(isPackage && selectedBookingItem.traveller_details) && (
                    <div className="bg-light p-3 rounded border mb-4">
                       <h6 className="fw-bold text-primary mb-2">Lead Traveller Verified</h6>
                       <div className="d-flex align-items-center gap-2 mb-1">
                           <span className="text-muted small">Name:</span>
                           <span className="fw-bold">{userName}</span>
                       </div>
                       <div className="d-flex align-items-center gap-2">
                           <span className="text-muted small">Contact:</span>
                           <span className="fw-bold">{String(userPhone || '')}</span>
                       </div>
                       {userDob && (
                         <div className="d-flex align-items-center gap-2 mt-1 pt-1 border-top">
                           <span className="text-muted small">🎂 Birthday:</span>
                           <span className="fw-bold text-success">{userDob}</span>
                         </div>
                       )}
                    </div>
                  )}

                  {(isCar || isBike || addonVehicle) && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">
                        Driving License Number {!(!isBike && driverRequired) && <span className="text-danger">*</span>}
                        {(!isBike && driverRequired) && <span className="text-muted fw-normal" style={{ fontSize: '11px' }}> (Optional for Chauffeur/Driver)</span>}
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. DL-1420180098765"
                        value={userLicense}
                        onChange={(e) => setUserLicense(e.target.value)}
                        required={!(!isBike && driverRequired)}
                      />
                    </div>
                  )}

                  {/* Customization options removed as requested */}

                  {isActivity && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <label className="form-label small fw-bold d-flex align-items-center justify-content-between mb-2">
                        <span className="d-flex align-items-center gap-1.5">
                          <Users size={15} className="text-warning" /> Number of Guests / Travellers
                        </span>
                        <span className="badge bg-dark text-white rounded-pill px-2.5 py-0.5" style={{ fontSize: '11px' }}>
                          ₹{baseRate} / person
                        </span>
                      </label>
                      <div className="d-flex align-items-center gap-3">
                        <div className="btn-group" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm px-3 fw-bold"
                            onClick={() => setTotalMembers(prev => Math.max(1, prev - 1))}
                            disabled={totalMembers <= 1}
                          >
                            -
                          </button>
                          <span className="btn btn-light btn-sm px-4 fw-bold text-dark border-top border-bottom border-secondary border-opacity-25" style={{ minWidth: '48px', cursor: 'default' }}>
                            {totalMembers}
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm px-3 fw-bold"
                            onClick={() => setTotalMembers(prev => Math.min(20, prev + 1))}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-muted text-xs">
                          {totalMembers === 1 ? '1 Guest' : `${totalMembers} Guests`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Interactive Date, Time & Pickup Location Picker */}
                  <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                      <span className="fw-bold text-dark small d-flex align-items-center gap-1">
                        <Calendar size={15} className="text-warning" /> Trip Dates & Location
                      </span>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.72rem' }}>
                        {isActivity ? (selectedBookingItem.duration || 'Full Day') : `${calculatedDays} ${calculatedDays === 1 ? (isHotel ? 'Night' : 'Day') : (isHotel ? 'Nights' : 'Days')} Duration`}
                      </span>
                    </div>

                    <div className="row g-2">
                      {/* Pickup Date & Drop Date */}
                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-secondary mb-1">
                          {isFlight ? 'Departure Date' : isHotel ? 'Check-in Date' : isActivity ? 'Tour Date' : 'Pickup Date'}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm fw-semibold"
                          min={getTodayDateStr()}
                          value={modalPickupDate}
                          onChange={(e) => {
                            const newPickup = e.target.value;
                            setModalPickupDate(newPickup);
                            if (modalDropDate <= newPickup) {
                              setModalDropDate(addDays(newPickup, 1));
                            }
                          }}
                          required
                        />
                      </div>

                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-secondary mb-1">
                          {isFlight ? 'Return Date' : isHotel ? 'Check-out Date' : isActivity ? 'Tour Date / Drop' : 'Drop / Return Date'}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm fw-semibold"
                          min={modalPickupDate ? addDays(modalPickupDate, 1) : getTodayDateStr()}
                          value={modalDropDate}
                          onChange={(e) => setModalDropDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Pickup & Drop Times */}
                      {!isFlight && !isHotel && (
                        <>
                          <div className="col-6">
                            <label className="form-label small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Pickup Time</label>
                            <select
                              className="form-select form-select-sm"
                              value={modalPickupTime}
                              onChange={(e) => setModalPickupTime(e.target.value)}
                            >
                              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Drop Time</label>
                            <select
                              className="form-select form-select-sm"
                              value={modalDropTime}
                              onChange={(e) => setModalDropTime(e.target.value)}
                            >
                              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Pickup & Drop Locations */}
                      {isFlight ? (
                        <div className="col-12 mt-1">
                          <label className="form-label small fw-bold text-secondary mb-1">Route / Sector</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            readOnly
                            value={`${selectedBookingItem.from || 'Origin'} to ${selectedBookingItem.to || 'Destination'}`}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="col-sm-6 mt-1">
                            <label className="form-label small fw-bold text-secondary mb-1">
                              Pickup Location
                            </label>
                            <select
                              className="form-select form-select-sm fw-semibold"
                              value={modalPickupLoc}
                              onChange={(e) => setModalPickupLoc(e.target.value)}
                            >
                              <option value="Goa Airport (Dabolim - GOI)">✈️ Goa Airport (Dabolim - GOI)</option>
                              <option value="Manohar Intl Airport (Mopa - GOX)">✈️ Manohar Intl Airport (Mopa - GOX)</option>
                              <option value="Madgaon Railway Station (MAO)">🚆 Madgaon Railway Station (MAO)</option>
                              <option value="Thivim Railway Station (THVM)">🚆 Thivim Railway Station (THVM)</option>
                              <option value="Karmali Railway Station (KRMI)">🚆 Karmali Railway Station (KRMI)</option>
                              <option value="Calangute">🏖️ Calangute Beach / Circle</option>
                              <option value="Baga Beach">🏖️ Baga Beach & Tito's Lane</option>
                              <option value="Candolim">🏖️ Candolim Beach Road</option>
                              <option value="Anjuna / Vagator">🏖️ Anjuna / Vagator Coast</option>
                              <option value="Morjim / Arambol">🏖️ Morjim / Arambol Coast</option>
                              <option value="Panaji City">🏙️ Panaji (City Center), Goa</option>
                              <option value="Vasco da Gama">⚓ Vasco da Gama</option>
                              <option value="Colva / Benaulim">🌴 Colva / Benaulim / Varca</option>
                              <option value="Palolem / Agonda">🌴 Palolem / Agonda Bay</option>
                              <option value="Hotel / Resort Delivery">📍 All Goa Hotel / Resort Delivery</option>
                            </select>
                          </div>

                          <div className="col-sm-6 mt-1">
                            <label className="form-label small fw-bold text-secondary mb-1">
                              Drop / Return Location
                            </label>
                            <select
                              className="form-select form-select-sm fw-semibold"
                              value={modalDropLoc}
                              onChange={(e) => setModalDropLoc(e.target.value)}
                            >
                              <option value={modalPickupLoc}>🔄 Same as Pickup Spot ({modalPickupLoc})</option>
                              <option value="Goa Airport (Dabolim - GOI)">✈️ Goa Airport (Dabolim - GOI)</option>
                              <option value="Manohar Intl Airport (Mopa - GOX)">✈️ Manohar Intl Airport (Mopa - GOX)</option>
                              <option value="Madgaon Railway Station (MAO)">🚆 Madgaon Railway Station (MAO)</option>
                              <option value="Thivim Railway Station (THVM)">🚆 Thivim Railway Station (THVM)</option>
                              <option value="Karmali Railway Station (KRMI)">🚆 Karmali Railway Station (KRMI)</option>
                              <option value="Calangute">🏖️ Calangute Beach / Circle</option>
                              <option value="Baga Beach">🏖️ Baga Beach & Tito's Lane</option>
                              <option value="Candolim">🏖️ Candolim Beach Road</option>
                              <option value="Anjuna / Vagator">🏖️ Anjuna / Vagator Coast</option>
                              <option value="Morjim / Arambol">🏖️ Morjim / Arambol Coast</option>
                              <option value="Panaji City">🏙️ Panaji (City Center), Goa</option>
                              <option value="Vasco da Gama">⚓ Vasco da Gama</option>
                              <option value="Colva / Benaulim">🌴 Colva / Benaulim / Varca</option>
                              <option value="Palolem / Agonda">🌴 Palolem / Agonda Bay</option>
                              <option value="Hotel / Resort Delivery">📍 All Goa Hotel / Resort Delivery</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Optional Private Driver Service Section */}
                  {!isFlight && !isBike && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div className="form-check d-flex align-items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          id="modal_driver_req"
                          checked={driverRequired}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDriverRequired(checked);
                            if (checked) {
                              if (!driverServiceType) {
                                setDriverServiceType('PICKUP');
                              }
                              // Initially default driver dates to current vehicle pickup and drop
                              setDriverPickupDate(modalPickupDate);
                              setDriverDropDate(modalDropDate || modalPickupDate);
                              setDriverFullDayStart(modalPickupDate);
                              setDriverFullDayEnd(modalDropDate || modalPickupDate);
                              // Ensure driver times default to current vehicle times unless manually customized
                              if (!isDriverPickupTimeManual) {
                                setDriverPickupTime(modalPickupTime || '10:00 AM');
                              }
                              if (!isDriverDropTimeManual) {
                                setDriverDropTime(modalDropTime || '10:00 AM');
                              }
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label className="form-check-label fw-black text-dark mb-0 small d-flex align-items-center gap-1.5 flex-wrap font-heading" htmlFor="modal_driver_req" style={{ cursor: 'pointer' }}>
                          <span>Need a Verified Private Driver in Goa?</span>
                        </label>
                      </div>
                      
                      <div className="text-muted small ps-4 mb-2" style={{ fontSize: '0.74rem' }}>
                        Customized driver service in Goa. You are charged ONLY for the selected services & dates (not whole stay).
                      </div>

                      {driverRequired && (
                        <div className="mt-3 pt-3 border-top border-warning border-opacity-40 d-flex flex-column gap-2.5 ps-1 pe-1 animate-fade-in">
                          
                          {/* ─── Choice 1: 🚗 Pickup Service — ₹400 ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'PICKUP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="driver_service_pickup"
                                  checked={driverServiceType === 'PICKUP'}
                                  onChange={() => {
                                    setDriverServiceType('PICKUP');
                                    if (!isDriverPickupTimeManual) {
                                      setDriverPickupTime(modalPickupTime || '10:00 AM');
                                    }
                                  }}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_pickup" style={{ cursor: 'pointer' }}>
                                  🚗 Pickup Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverPickupEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={modalPickupDate || getTodayDateStr()}
                                    max={modalDropDate || undefined}
                                    value={driverPickupDate || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      if (val) {
                                        if (modalPickupDate && val < modalPickupDate) val = modalPickupDate;
                                        if (modalDropDate && val > modalDropDate) val = modalDropDate;
                                      }
                                      setDriverPickupDate(val);
                                    }}
                                    required={driverPickupEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupTime}
                                    onChange={(e) => {
                                      setDriverPickupTime(e.target.value);
                                      setIsDriverPickupTimeManual(true);
                                    }}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupLoc}
                                    onChange={(e) => setDriverPickupLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverPickupLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full pickup address or landmark..."
                                      value={driverPickupCustomLoc}
                                      onChange={(e) => setDriverPickupCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 2: 🏁 Drop Service — ₹400 ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'DROP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="driver_service_drop"
                                  checked={driverServiceType === 'DROP'}
                                  onChange={() => {
                                    setDriverServiceType('DROP');
                                    if (!isDriverDropTimeManual) {
                                      setDriverDropTime(modalDropTime || '10:00 AM');
                                    }
                                  }}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_drop" style={{ cursor: 'pointer' }}>
                                  🏁 Drop Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverDropEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={modalPickupDate || getTodayDateStr()}
                                    max={modalDropDate || undefined}
                                    value={driverDropDate || modalDropDate || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      let val = e.target.value;
                                      if (val) {
                                        if (modalPickupDate && val < modalPickupDate) val = modalPickupDate;
                                        if (modalDropDate && val > modalDropDate) val = modalDropDate;
                                      }
                                      setDriverDropDate(val);
                                    }}
                                    required={driverDropEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropTime}
                                    onChange={(e) => {
                                      setDriverDropTime(e.target.value);
                                      setIsDriverDropTimeManual(true);
                                    }}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropLoc}
                                    onChange={(e) => setDriverDropLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="North Goa">🏖️ North Goa</option>
                                    <option value="South Goa">🏖️ South Goa</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverDropLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full drop-off address or landmark..."
                                      value={driverDropCustomLoc}
                                      onChange={(e) => setDriverDropCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 3: 👨‍✈️ Full-Day Driver — ₹800/day ─── */}
                          <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'FULL' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="radio"
                                  name="driver_service_type_selection"
                                  className="form-check-input mt-0"
                                  id="driver_service_fullday"
                                  checked={driverServiceType === 'FULL'}
                                  onChange={() => setDriverServiceType('FULL')}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_fullday" style={{ cursor: 'pointer' }}>
                                  👨‍✈️ Full-Day Driver
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹800 / day
                              </span>
                            </div>

                            <div className="text-muted text-xxs mt-1 ps-4" style={{ fontSize: '0.7rem' }}>
                              ⏰ 09:00 AM – 07:00 PM (8–10 Hours Local Daily Duty)
                            </div>

                            {driverFullDayEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver Start Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={modalPickupDate || getTodayDateStr()}
                                    max={modalDropDate || undefined}
                                    value={driverFullDayStart || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      let newStart = e.target.value;
                                      if (newStart) {
                                        if (modalPickupDate && newStart < modalPickupDate) newStart = modalPickupDate;
                                        if (modalDropDate && newStart > modalDropDate) newStart = modalDropDate;
                                      }
                                      setDriverFullDayStart(newStart);
                                      if (driverFullDayEnd && newStart && driverFullDayEnd < newStart) {
                                        setDriverFullDayEnd(newStart);
                                      }
                                    }}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver End Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={driverFullDayStart || modalPickupDate || getTodayDateStr()}
                                    max={modalDropDate || undefined}
                                    value={driverFullDayEnd || modalDropDate || driverFullDayStart || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      let newEnd = e.target.value;
                                      const effectiveMin = driverFullDayStart || modalPickupDate;
                                      if (newEnd) {
                                        if (effectiveMin && newEnd < effectiveMin) newEnd = effectiveMin;
                                        if (modalDropDate && newEnd > modalDropDate) newEnd = modalDropDate;
                                      }
                                      setDriverFullDayEnd(newEnd);
                                    }}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup / Start Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayStartLoc}
                                    onChange={(e) => setDriverFullDayStartLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayStartLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter start location..."
                                      value={driverFullDayCustomStartLoc}
                                      onChange={(e) => setDriverFullDayCustomStartLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop / End Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayEndLoc}
                                    onChange={(e) => setDriverFullDayEndLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayEndLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter end location..."
                                      value={driverFullDayCustomEndLoc}
                                      onChange={(e) => setDriverFullDayCustomEndLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>

                                <div className="col-12">
                                  <div className="p-2 rounded bg-light border text-xxs text-dark d-flex align-items-center justify-content-between">
                                    <span>Total Driver Days: <strong>{driverFullDayDaysCount} {driverFullDayDaysCount === 1 ? 'day' : 'days'}</strong></span>
                                    <span className="fw-black text-warning">₹{(800 * driverFullDayDaysCount).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ─── Bottom Driver Total Display ─── */}
                          <div className="d-flex align-items-center justify-content-between pt-2 border-top border-warning border-opacity-40">
                            <span className="text-dark fw-bold text-xs">Driver Service Total:</span>
                            <span className="fs-6 fw-black text-dark font-heading">₹{driverTotalCharge.toLocaleString()}</span>
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                    <div className="mt-4">
                      <button 
                        type="submit"
                        className="btn w-100 py-2.5 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2" 
                        style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '0.95rem' }}
                      >
                        <span>Continue to Payment &amp; Review</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="payment-review-step animate-fade-in">
                  {/* Customer Country, Category & Currency Badge Card */}
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
                      <span className="text-xs text-muted fw-semibold">Customer-Facing Payable:</span>
                      <CurrencyPriceDisplay amountInr={finalPayable} size="lg" highlight />
                    </div>
                  </div>

                  {/* If Indian: Direct to Vendor Static UPI QR */}
                  {isIndian ? (
                    <>
                      {(() => {
                        const activeVendorPayment = paymentSettings && paymentSettings.length > 0 ? (
                          paymentSettings.find(m => (m.method_type === 'UPI' || m.qr_image_url || m.upi_id) && (m.upi_id || m.qr_image_url)) || paymentSettings[0]
                        ) : null;
                        const isVendorPaymentConfigured = Boolean(
                          activeVendorPayment && (activeVendorPayment.qr_image_url || activeVendorPayment.upi_id)
                        );

                        return isVendorPaymentConfigured ? (
                          <StaticQRPaymentCard
                            amount={finalPayable}
                            upiId={activeVendorPayment.upi_id || ''}
                            accountName={activeVendorPayment.account_name || activeVendorPayment.display_name || selectedBookingItem.name}
                            qrImageUrl={activeVendorPayment.qr_image_url || ''}
                            vendorName={activeVendorPayment.display_name || selectedBookingItem.vendor_name || 'Vendor'}
                            paymentReference={staticQrReference}
                            onReferenceChange={setStaticQrReference}
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

                      {/* Vendor Cancellation Policy Card with Mandatory Agreement */}
                      <VendorCancellationPolicyCard
                        policy={vendorCancellationPolicy}
                        agreed={policyAgreed}
                        onAgreementChange={setPolicyAgreed}
                        customerPayment={finalPayable}
                      />

                      {(() => {
                        const activeVendorPayment = paymentSettings && paymentSettings.length > 0 ? (
                          paymentSettings.find(m => (m.method_type === 'UPI' || m.qr_image_url || m.upi_id) && (m.upi_id || m.qr_image_url)) || paymentSettings[0]
                        ) : null;
                        const isVendorPaymentConfigured = Boolean(
                          activeVendorPayment && (activeVendorPayment.qr_image_url || activeVendorPayment.upi_id)
                        );
                        const isSubmitDisabled = isSubmitting || !policyAgreed || !staticQrReference || !isVendorPaymentConfigured;

                        return (
                          <button 
                            type="button" 
                            onClick={handleConfirmBookingSubmit}
                            className="btn w-100 py-2.5 fw-bold text-white shadow-sm mt-3 d-flex align-items-center justify-content-center" 
                            style={{ background: '#FFC107', opacity: isSubmitDisabled ? 0.65 : 1 }}
                            disabled={isSubmitDisabled}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                Confirming Booking...
                              </>
                            ) : (
                              `Confirm & Reserve Booking (₹${finalPayable.toLocaleString('en-IN')})`
                            )}
                          </button>
                        );
                      })()}
                    </>
                  ) : (
                    /* If Foreign: Foreign Customer Review & Reservation (NO fake UPI QR, NO INR shown) */
                    <>
                      <div className="card shadow-sm border border-primary border-opacity-25 rounded-4 overflow-hidden mb-3" style={{ background: '#f8fafc' }}>
                        <div className="card-body p-4 text-center">
                          <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-2">
                            <ShieldCheck size={28} />
                          </div>
                          <h6 className="fw-bold text-dark mb-1">Foreign Customer Reservation Review</h6>
                          <div className="text-muted small mb-3">
                            Payable in your local currency: <strong className="text-primary font-heading"><CurrencyPriceDisplay amountInr={finalPayable} size="md" highlight /></strong>
                          </div>
                          <div className="alert alert-info border border-info border-opacity-25 text-start py-2.5 px-3 mb-0" style={{ fontSize: '0.82rem' }}>
                            <strong>Notice:</strong> International Online Card Payment Gateway is currently being integrated for seamless checkout. Your booking will be provisionally reserved directly with the vendor upon confirmation, and our operations team / vendor will reach out to provide you with secure international payment settlement instructions.
                          </div>
                        </div>
                      </div>

                      {/* Vendor Cancellation Policy Card with Mandatory Agreement */}
                      <VendorCancellationPolicyCard
                        policy={vendorCancellationPolicy}
                        agreed={policyAgreed}
                        onAgreementChange={setPolicyAgreed}
                        customerPayment={finalPayable}
                      />

                      <button 
                        type="button" 
                        onClick={handleConfirmBookingSubmit}
                        className="btn w-100 py-2.5 fw-bold text-white shadow-sm mt-3 d-flex align-items-center justify-content-center" 
                        style={{ background: '#FF6333', opacity: (!policyAgreed || isSubmitting) ? 0.65 : 1 }}
                        disabled={!policyAgreed || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            Confirming Booking...
                          </>
                        ) : (
                          <>Confirm &amp; Reserve Booking (<CurrencyPriceDisplay amountInr={finalPayable} size="sm" color="#ffffff" />)</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

              {/* Right Column: Billing Breakdowns */}
              <div className="col-lg-5 text-start">
                <h5 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h5>
                
                <div className="card shadow-sm border mb-3 overflow-hidden">
                  <div className="p-2 bg-light border-bottom">
                    {allItemImages && allItemImages.length > 0 ? (
                      <UnifiedGalleryViewer
                        images={allItemImages}
                        variant="compact"
                        compactHeight="160px"
                        alt={selectedBookingItem.name}
                      />
                    ) : (
                      <div 
                        className="d-flex flex-column align-items-center justify-content-center text-muted p-3" 
                        style={{ height: '160px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                      >
                        <Camera size={26} className="text-secondary opacity-50 mb-1" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>No Photo Uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-1" style={{ fontSize: '14px' }}>{selectedBookingItem.name}</h6>
                    <span className="badge bg-secondary mb-2" style={{ fontSize: '10px' }}>
                      {isHotel ? 'Hotel Booking' :
                       isCar ? 'Car Rental' : 
                       isBike ? 'Bike Rental' : 
                       isFlight ? 'Flight Booking' : 'Holiday Package'}
                    </span>
                    
                    {selectedBookingItem.isCustomized && (
                      <div className="mb-2 p-2 bg-light rounded text-dark small border">
                        <span className="fw-bold d-block text-primary" style={{fontSize: '11px'}}>Customizations Included:</span>
                        <div style={{fontSize: '10px'}}>
                          {JSON.parse(selectedBookingItem.customizations).includeFlights && <div>✈️ Flights Added</div>}
                          {JSON.parse(selectedBookingItem.customizations).cabType === 'self-drive' && <div>🚗 Self-Drive Selected</div>}
                          {JSON.parse(selectedBookingItem.customizations).airportTransit && <div>🚕 Airport Transit Added</div>}
                        </div>
                      </div>
                    )}
                    
                    <div className="billing-summary-card mt-2 small">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Base Price{isPackage && includeFlight ? ' (With Flight)' : ''}:</span>
                        <span><CurrencyPriceDisplay amountInr={baseRate} /> {isPackage ? '' : (isFlight || isActivity) ? `× ${totalMembers} pax` : '/ day'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>{isFlight ? 'Flight Info:' : isActivity ? 'Tour Duration:' : 'Duration:'}</span>
                        <span className="fw-semibold">{isFlight ? `${selectedBookingItem.stops || 'Direct'} (${selectedBookingItem.duration || '2h'})` : isActivity ? (selectedBookingItem.duration || 'Flexible') : `${calculatedDays} ${isHotel ? (calculatedDays === 1 ? 'Night' : 'Nights') : (calculatedDays === 1 ? 'Day' : 'Days')}${isHotel ? ` (${calculatedDays}N)` : ''}`}</span>
                      </div>

                      {addonPackage && (
                        <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                          <span>Addon Plan ({addonPackage.name}):</span>
                          <CurrencyPriceDisplay amountInr={addonPackage.price} />
                        </div>
                      )}

                      {addonVehicle && (
                        <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                          <span>Addon Drive ({addonVehicle.name}):</span>
                          <CurrencyPriceDisplay amountInr={addonVehicle.price * calculatedDays} />
                        </div>
                      )}

                      {driverRequired && driverTotalCharge > 0 && (
                        <div className="p-2 rounded mb-2" style={{ background: '#fffbeb', border: '1px solid #fef3c7', fontSize: '11px' }}>
                          <div className="fw-bold text-dark mb-1 d-flex justify-content-between">
                            <span>Private Driver Services:</span>
                            <CurrencyPriceDisplay amountInr={driverTotalCharge} highlight />
                          </div>
                          {driverPickupEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Driver Pickup ({driverPickupDate || modalPickupDate} • {driverPickupTime || modalPickupTime}):</span>
                              <CurrencyPriceDisplay amountInr={400} />
                            </div>
                          )}
                          {driverFullDayEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Full-Day Driver ({driverFullDayDaysCount} {driverFullDayDaysCount === 1 ? 'day' : 'days'}):</span>
                              <CurrencyPriceDisplay amountInr={driverFullDayCost} />
                            </div>
                          )}
                          {driverDropEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Driver Drop ({driverDropDate || modalDropDate} • {driverDropTime || modalDropTime}):</span>
                              <CurrencyPriceDisplay amountInr={400} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-semibold">
                        <span>Subtotal:</span>
                        <CurrencyPriceDisplay amountInr={subtotal} />
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>GST (18%):</span>
                        <CurrencyPriceDisplay amountInr={tax} />
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>Admin/Delivery Fee:</span>
                        <CurrencyPriceDisplay amountInr={fee} />
                      </div>

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

                      {/* Gold Member Discount Alert */}
                      {isGoldEligible && (
                        <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
                          🥇 <strong>Gold Member Privilege:</strong> Instant privilege discount applied!
                        </div>
                      )}

                      {/* Platinum Member Mutual Exclusivity Selector */}
                      {isPlatinumEligible && (
                        <div className="p-2.5 rounded-3 my-2" style={{ background: '#f5f3ff', border: '1px solid #c4b5fd' }}>
                          <div className="d-flex align-items-center gap-1.5 mb-1.5">
                            <Crown size={14} className="text-primary" />
                            <span className="fw-bold text-xs text-dark">💎 Platinum Privilege (Select One)</span>
                          </div>
                          <div className="form-check mb-1">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="platinumPerkVehicle" 
                              id="platDiscountVehicle" 
                              checked={platinumPerkChoice === 'discount'}
                              onChange={() => setPlatinumPerkChoice('discount')}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label text-xs fw-semibold text-dark" htmlFor="platDiscountVehicle" style={{ cursor: 'pointer' }}>
                              Instant Tier Privilege Discount
                            </label>
                          </div>
                          <div className="form-check mb-0">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="platinumPerkVehicle" 
                              id="platUpgradeVehicle" 
                              checked={platinumPerkChoice === 'upgrade'}
                              onChange={() => setPlatinumPerkChoice('upgrade')}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label text-xs fw-semibold text-dark" htmlFor="platUpgradeVehicle" style={{ cursor: 'pointer' }}>
                              Request Free Vehicle Class Upgrade <span className="text-muted fw-normal" style={{ fontSize: '10px' }}>(subject to vendor inventory at pickup)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {tierDiscount > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-warning fw-bold">
                          <span>Tier Privilege Discount:</span>
                          <span>-<CurrencyPriceDisplay amountInr={tierDiscount} /></span>
                        </div>
                      )}

                      {isPlatinumEligible && platinumPerkChoice === 'upgrade' && (
                        <div className="d-flex justify-content-between mb-2 text-primary fw-semibold text-xs">
                          <span>Platinum Upgrade:</span>
                          <span>Requested at Pickup</span>
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
                                id="useWalletCashback"
                                checked={useWalletCashback}
                                onChange={(e) => setUseWalletCashback(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                              />
                              <label className="form-check-label text-xs fw-bold text-success" htmlFor="useWalletCashback">
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
                        <span style={{ fontSize: '15px' }}>Final Amount Payable:</span>
                        <CurrencyPriceDisplay amountInr={finalPayable} size="lg" highlight />
                      </div>

                      {/* 10% Cashback Earning Preview */}
                      <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                        <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                          <Gift size={13} className="text-warning" />
                          <span>10% Cashback You Will Earn: <strong className="text-success font-heading"><CurrencyPriceDisplay amountInr={projectedCashback} /></strong></span>
                        </div>
                        <div className="text-muted text-xxs mt-0.5">
                          Credited to your wallet on booking completion • Valid 30 days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {(isCar || isBike) && selectedBookingItem.documents_json && JSON.parse(selectedBookingItem.documents_json).length > 0 && (
                  <div className="card shadow-sm border mb-3">
                    <div className="card-body p-3">
                      <h6 className="fw-bold mb-2" style={{ fontSize: '13px' }}>Vehicle Documents</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {JSON.parse(selectedBookingItem.documents_json).map((doc, i) => (
                          <a key={i} href={doc} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <Compass size={12} /> View Document {i + 1}
                          </a>
                        ))}
                      </div>
                      <p className="text-muted mt-2 mb-0" style={{ fontSize: '10px' }}>You can download the verified vehicle documents for your records before booking.</p>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-light rounded text-muted" style={{ fontSize: '11px' }}>
                  <div className="d-flex align-items-start gap-2">
                    <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                    <span><strong>Security Guarantee:</strong> Safe payments simulation. Original ID is required at delivery. No security deposit for premium cars.</span>
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
