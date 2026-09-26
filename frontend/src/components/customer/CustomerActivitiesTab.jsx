import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass, MapPin, Clock, Users, Calendar, CheckCircle2,
  Search, Sparkles, Filter, ChevronRight, AlertCircle, Eye,
  ArrowRight, ShieldCheck, Tag, X, Check, User, Mail, Phone, Cake,
  Wallet, Crown, Gift, Car
} from 'lucide-react';
import * as api from '../../services/api';
import { getTodayDateStr, getNextDayDateStr } from '../../utils/dateUtils';
import DobPicker from '../common/DobPicker';
import TourDatePicker from '../common/TourDatePicker';
import BookingVoucher from '../common/BookingVoucher';
import BookingConfirmationCard from '../common/BookingConfirmationCard';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

const filterActiveActivities = (items) => (Array.isArray(items) ? items : [])
  .filter(item => item.is_active !== 0 && item.is_active !== '0' && item.is_active !== false);

export default function CustomerActivitiesTab({
  currentUser,
  activities = [],
  bookings = [],
  onOpenBookingDetails,
  onNavigateTab,
  appliedFilters = {},
  setAppliedFilters,
  searchQuery: parentSearchQuery = '',
  setSearchQuery: setParentSearchQuery,
  onViewDetails,
  onBook,
  initialBookingItem = null,
  onClearInitialBooking
}) {
  const [items, setItems] = useState(filterActiveActivities(activities));
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sightseeing' | 'activity'
  const [searchQuery, setSearchQuery] = useState(parentSearchQuery || '');
  const [bookingModalItem, setBookingModalItem] = useState(null);


  // Sync parent search query when changed
  useEffect(() => {
    if (parentSearchQuery !== undefined && parentSearchQuery !== searchQuery) {
      setSearchQuery(parentSearchQuery);
    }
  }, [parentSearchQuery]);

  // Handle external or pre-selected booking requests (e.g. from ActivityDetailsPage)
  useEffect(() => {
    if (initialBookingItem) {
      handleOpenBooking(initialBookingItem);
      if (typeof onClearInitialBooking === 'function') {
        onClearInitialBooking();
      }
    }
  }, [initialBookingItem]);
  
  // Booking Form State
  const [travelDate, setTravelDate] = useState(getTodayDateStr());
  const [guests, setGuests] = useState(2);
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactDob, setContactDob] = useState(currentUser?.date_of_birth || '');
  const [isDobSaved, setIsDobSaved] = useState(Boolean(currentUser?.date_of_birth));
  const [dobChecking, setDobChecking] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);

  // Optional Private Driver States
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverServiceType, setDriverServiceType] = useState('PICKUP'); // 'PICKUP' | 'DROP' | 'FULL'
  const [driverPickupTime, setDriverPickupTime] = useState('08:00 AM');
  const [driverPickupLoc, setDriverPickupLoc] = useState('Hotel');
  const [driverPickupCustomLoc, setDriverPickupCustomLoc] = useState('');
  const [driverDropTime, setDriverDropTime] = useState('05:00 PM');
  const [driverDropLoc, setDriverDropLoc] = useState('Hotel');
  const [driverDropCustomLoc, setDriverDropCustomLoc] = useState('');
  const [driverFullDayStartLoc, setDriverFullDayStartLoc] = useState('Hotel');
  const [driverFullDayCustomStartLoc, setDriverFullDayCustomStartLoc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [formError, setFormError] = useState('');
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState(null);
  const [localCreatedBookings, setLocalCreatedBookings] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      return Array.isArray(local) ? local : [];
    } catch (e) {
      return [];
    }
  });

  // Global background scroll lock with exact scroll position preservation
  useEffect(() => {
    if (bookingModalItem || selectedVoucherBooking) {
      lockScroll('activities-booking-modal');
      return () => {
        unlockScroll('activities-booking-modal');
      };
    }
  }, [bookingModalItem, selectedVoucherBooking]);

  // Repeat customer lookup for Date of Birth & Wallet Balance & Loyalty Tier
  useEffect(() => {
    const clean = String(contactPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      setDobChecking(true);
      api.checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setContactDob(res.date_of_birth);
          setIsDobSaved(true);
          if (!contactName && res.name) {
            setContactName(res.name);
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
  }, [contactPhone]);

  // Load fresh activities if empty
  useEffect(() => {
    if (!activities || activities.length === 0) {
      setLoading(true);
      api.fetchActivities()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setItems(filterActiveActivities(data));
          }
        })
        .catch(err => console.warn('Failed to load activities:', err))
        .finally(() => setLoading(false));
    } else {
      setItems(filterActiveActivities(activities));
    }
  }, [activities]);

  // Keep contact info synced with currentUser
  useEffect(() => {
    if (currentUser) {
      if (!contactName && currentUser.name) setContactName(currentUser.name);
      if (!contactPhone && currentUser.phone) setContactPhone(currentUser.phone);
      if (!contactEmail && currentUser.email) setContactEmail(currentUser.email);
    }
  }, [currentUser]);

  // Filter activities — check both type and item_type fields, case-insensitively
  const filteredItems = items.filter(item => {
    // Resolve type from either `type` or `item_type` field, lowercase for comparison
    const rawType = (item.type || item.item_type || '').toLowerCase();
    const rawCat = (item.category || '').toLowerCase();
    const price = parseFloat(item.price || 0);
    const duration = (item.duration || '').toLowerCase();

    // 1. Quick pill filter (all / sightseeing / activity)
    if (typeFilter === 'sightseeing') {
      const isSight = rawType === 'sightseeing' ||
        rawCat.includes('sight') || rawCat.includes('heritage') ||
        rawCat.includes('tour') || rawCat.includes('monument');
      if (!isSight) return false;
    } else if (typeFilter === 'activity') {
      const isSight = rawType === 'sightseeing' ||
        rawCat.includes('sight') || rawCat.includes('heritage') ||
        rawCat.includes('tour') || rawCat.includes('monument');
      const isAct = rawType === 'activity' || rawType === 'addon' ||
        rawCat.includes('water') || rawCat.includes('adventure') ||
        rawCat.includes('sport') || rawCat.includes('cruise') ||
        rawCat.includes('experience') || (!isSight && rawType !== '');
      if (!isAct) return false;
    }

    // 2. Applied Categories / Types from popover
    const appTypes = appliedFilters?.activityTypes || [];
    if (appTypes.length > 0) {
      const typeMatch = appTypes.some(at => {
        const catLower = at.toLowerCase();
        if (catLower.includes('sightseeing')) {
          return rawType === 'sightseeing' || rawCat.includes('sight') || rawCat.includes('tour');
        }
        if (catLower.includes('water') || catLower.includes('adventure')) {
          return rawCat.includes('water') || rawCat.includes('adventure') || rawCat.includes('sport') || rawType === 'activity';
        }
        if (catLower.includes('cruise') || catLower.includes('boat')) {
          return rawCat.includes('cruise') || rawCat.includes('boat') || (item.title || '').toLowerCase().includes('cruise');
        }
        if (catLower.includes('heritage') || catLower.includes('culture')) {
          return rawCat.includes('heritage') || rawCat.includes('culture') || (item.title || '').toLowerCase().includes('heritage');
        }
        if (catLower.includes('island')) {
          return (item.location || '').toLowerCase().includes('island') || (item.title || '').toLowerCase().includes('island');
        }
        return rawCat.includes(catLower) || rawType.includes(catLower);
      });
      if (!typeMatch) return false;
    }

    // 3. Price range filter
    const appPrices = appliedFilters?.activityPriceRanges || [];
    if (appPrices.length > 0) {
      const priceMatch = appPrices.some(pr => {
        if (pr === '< 1500') return price < 1500;
        if (pr === '1500-2500') return price >= 1500 && price <= 2500;
        if (pr === '2500-4000') return price >= 2500 && price <= 4000;
        if (pr === '> 4000') return price > 4000;
        return true;
      });
      if (!priceMatch) return false;
    }

    // 4. Duration filter
    const appDurations = appliedFilters?.activityDurations || [];
    if (appDurations.length > 0) {
      const durMatch = appDurations.some(d => {
        const dLower = d.toLowerCase();
        if (dLower.includes('1–2') || dLower.includes('1-2')) return duration.includes('1') || duration.includes('2');
        if (dLower.includes('3–4') || dLower.includes('3-4')) return duration.includes('3') || duration.includes('4');
        if (dLower.includes('5–6') || dLower.includes('5-6')) return duration.includes('5') || duration.includes('6');
        if (dLower.includes('full')) return duration.includes('full') || duration.includes('day');
        return true;
      });
      if (!durMatch) return false;
    }

    // 5. Search query
    const effectiveQuery = (searchQuery || parentSearchQuery || '').trim().toLowerCase();
    if (effectiveQuery && effectiveQuery !== 'goa' && effectiveQuery !== 'all goa' && effectiveQuery !== 'all experiences') {
      const title = (item.title || item.name || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (!title.includes(effectiveQuery) && !loc.includes(effectiveQuery) && !rawCat.includes(effectiveQuery) && !desc.includes(effectiveQuery)) {
        return false;
      }
    }
    return true;
  });

  // Filter customer's existing activity/sightseeing bookings — unified across server, props, and local bookings
  const myActivityBookings = React.useMemo(() => {
    const combined = [...localCreatedBookings, ...(bookings || [])];
    const uniqueMap = new Map();
    combined.forEach(b => {
      if (b && (b.id || b.booking_id)) {
        uniqueMap.set(String(b.id || b.booking_id), b);
      }
    });
    const candidateList = Array.from(uniqueMap.values());

    const activePhone = String(
      currentUser?.phone || 
      contactPhone || 
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('customer_login_phone')) || 
      (typeof localStorage !== 'undefined' && localStorage.getItem('customer_login_phone')) || 
      ''
    ).replace(/\D/g, '');

    const activeEmail = String(currentUser?.email || contactEmail || '').trim().toLowerCase();
    const activeId = String(currentUser?.id || '').trim().toLowerCase();

    return candidateList.filter(b => {
      const type = String(b.package_type || b.type || '').toLowerCase();
      const itemId = String(b.item_id || '').toLowerCase();
      const isActivity = type === 'activity' || type === 'sightseeing' ||
        itemId.startsWith('act-') || itemId.startsWith('sight-') ||
        itemId.startsWith('act') || type.includes('activity') || type.includes('sightseeing');
      if (!isActivity) return false;

      // Match against customer's phone, email or ID
      const bPhone = String(b.customer_phone || b.phone || '').replace(/\D/g, '');
      const bEmail = String(b.customer_email || b.email || '').trim().toLowerCase();
      const bCid = String(b.customer_id || '').trim().toLowerCase();

      if (activePhone && bPhone && (activePhone === bPhone || (activePhone.length >= 10 && bPhone.endsWith(activePhone.slice(-10))) || (bPhone.length >= 10 && activePhone.endsWith(bPhone.slice(-10))))) return true;
      if (activeEmail && bEmail && activeEmail === bEmail) return true;
      if (activeId && bCid && activeId === bCid) return true;

      return false;
    });
  }, [bookings, localCreatedBookings, currentUser, contactPhone, contactEmail]);

  const handleOpenBooking = (item) => {
    if (!item) return;
    setBookingModalItem(item);
    setTravelDate(item.pickup_date || item.pickupDate || getTodayDateStr());
    setGuests(Math.max(1, Number(item.guests || item.adults || item.totalMembers || 2)));
    setFormError('');
    setBookingSuccess(null);

    // Reset Driver Options
    setDriverRequired(false);
    setDriverServiceType('PICKUP');
    setDriverPickupTime('08:00 AM');
    setDriverPickupLoc('Hotel');
    setDriverPickupCustomLoc('');
    setDriverDropTime('05:00 PM');
    setDriverDropLoc('Hotel');
    setDriverDropCustomLoc('');
    setDriverFullDayStartLoc('Hotel');
    setDriverFullDayCustomStartLoc('');

    if (currentUser?.date_of_birth) {
      setContactDob(currentUser.date_of_birth);
      setIsDobSaved(true);
    } else if (!contactDob) {
      setContactDob('');
      setIsDobSaved(false);
    }
  };

  const handleConfirmBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!contactName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    const cleanDigits = String(contactPhone || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setFormError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!contactDob) {
      setFormError('Please select your Date of Birth (Day, Month, and Year).');
      return;
    }
    if (!travelDate) {
      setFormError('Please select a valid tour date.');
      return;
    }

    // Driver location validations
    if (driverRequired) {
      if (driverServiceType === 'PICKUP' && driverPickupLoc === 'Custom Address' && !driverPickupCustomLoc.trim()) {
        setFormError('Please enter the custom address for driver pickup.');
        return;
      }
      if (driverServiceType === 'DROP' && driverDropLoc === 'Custom Address' && !driverDropCustomLoc.trim()) {
        setFormError('Please enter the custom address for driver drop.');
        return;
      }
      if (driverServiceType === 'FULL' && driverFullDayStartLoc === 'Custom Address' && !driverFullDayCustomStartLoc.trim()) {
        setFormError('Please enter the custom start address for the full-day driver.');
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const pricePerPerson = parseFloat(bookingModalItem.price || 0);
      const baseActivityCost = pricePerPerson * guests;
      const driverCharge = driverRequired ? (driverServiceType === 'FULL' ? 800 : 400) : 0;
      const subtotal = baseActivityCost + driverCharge;
      const gst = Math.round(subtotal * 0.05); // 5% GST
      const rawTotalCost = subtotal + gst;

      // Authoritative Loyalty Tier & Tier Discount Enforcement
      const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
      const isGold = customerTier === 'Gold';
      const isPlatinum = customerTier === 'Platinum';

      const isGoldEligible = isGold && rawTotalCost > 5000;
      const isPlatinumEligible = isPlatinum && rawTotalCost > 10000;

      let tierDiscount = 0;
      if (isGoldEligible) {
        tierDiscount = 500;
      } else if (isPlatinumEligible) {
        tierDiscount = 1000;
      }

      const postTierTotal = Math.max(0, rawTotalCost - tierDiscount);
      const maxWalletBenefit = Math.round(postTierTotal * 0.10);
      const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
      const finalPayable = Math.max(0, postTierTotal - appliedWalletAmount);

      const finalPickupLocResolved = driverPickupLoc === 'Custom Address' ? driverPickupCustomLoc : driverPickupLoc;
      const finalDropLocResolved = driverDropLoc === 'Custom Address' ? driverDropCustomLoc : driverDropLoc;
      const finalFullDayLocResolved = driverFullDayStartLoc === 'Custom Address' ? driverFullDayCustomStartLoc : driverFullDayStartLoc;

      const driverDetailsPayload = {
        enabled: Boolean(driverRequired),
        serviceType: driverRequired ? driverServiceType : null,
        pickup: {
          enabled: driverRequired && driverServiceType === 'PICKUP',
          date: travelDate,
          time: driverPickupTime,
          location: finalPickupLocResolved
        },
        drop: {
          enabled: driverRequired && driverServiceType === 'DROP',
          date: travelDate,
          time: driverDropTime,
          location: finalDropLocResolved
        },
        fullDay: {
          enabled: driverRequired && driverServiceType === 'FULL',
          date: travelDate,
          location: finalFullDayLocResolved,
          dutyDescription: '8–10 Hours Local Daily Duty for Tour'
        },
        charge: driverCharge
      };

      const payload = {
        name: contactName,
        customer_name: contactName,
        phone: contactPhone,
        customer_phone: contactPhone,
        email: contactEmail || `${cleanDigits}@customer.wowgoa.com`,
        customer_email: contactEmail || `${cleanDigits}@customer.wowgoa.com`,
        customer_id: currentUser?.id || `c_${cleanDigits}`,
        date_of_birth: contactDob,
        item_id: bookingModalItem.id || `act-${Date.now()}`,
        item_name: bookingModalItem.title || bookingModalItem.name,
        package_name: bookingModalItem.title || bookingModalItem.name,
        package_type: String(bookingModalItem.type || bookingModalItem.item_type || '').toLowerCase() === 'sightseeing' ? 'Sightseeing' : 'Activity',
        type: String(bookingModalItem.type || bookingModalItem.item_type || 'activity').toLowerCase(),
        service_type: String(bookingModalItem.type || bookingModalItem.item_type || 'activity').toUpperCase(),
        pickup_date: travelDate,
        pickup_time: '09:00 AM',
        drop_date: travelDate,
        pickup_loc: bookingModalItem.location || 'Goa',
        pickup_location: bookingModalItem.location || 'Goa',
        duration: bookingModalItem.duration || 'Flexible',
        booking_days: 1,
        driver_required: driverRequired ? 1 : 0,
        driver_service_type: driverRequired ? driverServiceType : null,
        driver_charge: driverCharge,
        driver_details: driverDetailsPayload,
        subtotal: subtotal,
        tax: gst,
        total_amount: rawTotalCost,
        tier_discount_applied: tierDiscount,
        customer_tier_at_booking: customerTier,
        wallet_amount_used: appliedWalletAmount,
        amount_paid: finalPayable,
        total_paid: postTierTotal,
        pending_amount: 0,
        status: 'Confirmed',
        notes: `Guests: ${guests} | Category: ${bookingModalItem.category || 'Experience'} | DOB: ${contactDob}${driverRequired ? ` | Driver: ${driverServiceType} (₹${driverCharge})` : ''}`
      };

      const res = await api.createBooking(payload);
      const confirmed = res && (res.id || res.booking_id)
        ? { ...payload, id: res.id || res.booking_id, cashback_preview: res.cashback_preview || null }
        : { ...payload, id: `WG-ACT-${Math.floor(1000 + Math.random() * 9000)}`, cashback_preview: null };

      setBookingSuccess(confirmed);
      setLocalCreatedBookings(prev => [confirmed, ...prev]);

      // Set customer phone and local bookings for instant Customer Portal access & tracking
      try {
        sessionStorage.setItem('customer_login_phone', cleanDigits);
        sessionStorage.setItem('last_created_booking', JSON.stringify(confirmed));
        localStorage.setItem('customer_login_phone', cleanDigits);
        localStorage.setItem('last_created_booking', JSON.stringify(confirmed));
        const existingLocal = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updatedLocal = [confirmed, ...existingLocal.filter(b => String(b.id) !== String(confirmed.id))];
        localStorage.setItem('local_bookings', JSON.stringify(updatedLocal));

        // Pre-create customerUser so customer portal can open immediately without friction
        const customerUserObj = {
          id: confirmed.customer_id || `c_${cleanDigits}`,
          name: confirmed.customer_name || confirmed.name || contactName || 'Valued Guest',
          username: confirmed.customer_name || confirmed.name || contactName || cleanDigits,
          phone: cleanDigits,
          email: confirmed.customer_email || confirmed.email || `${cleanDigits}@customer.wowgoa.com`,
          city: confirmed.pickup_location || 'Goa',
          role: 'customer'
        };
        localStorage.setItem('customerUser', JSON.stringify(customerUserObj));
      } catch (e) {}

      // Dispatch sync event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('new-booking-created', { detail: confirmed }));
        window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: confirmed }));
      }
    } catch (err) {
      setFormError(err.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-warning bg-opacity-10 text-dark fw-bold text-xs mb-1">
            <Sparkles size={14} className="text-warning" />
            <span>CURATED EXPERIENCES & TOURS</span>
          </div>
          <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '22px' }}>
            Sightseeing & Activities
          </h4>
          <p className="text-muted text-xs mb-0">
            Explore premier Goa coastal sightseeing, heritage monuments, water sports, and guided excursions.
          </p>
        </div>

        {/* Search */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: '260px' }}>
            <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input 
              type="text" 
              className="form-control form-control-sm ps-5 rounded-pill border"
              placeholder="Search tours & activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (setParentSearchQuery) setParentSearchQuery(e.target.value);
              }}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── Filter Pills Bar ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-2">
            {[
              { id: 'all', label: `✨ All Experiences (${items.length})` },
              { id: 'sightseeing', label: `🏛️ Sightseeing Tours (${items.filter(i => { const t = (i.type || i.item_type || '').toLowerCase(); const c = (i.category || '').toLowerCase(); return t === 'sightseeing' || c.includes('sight') || c.includes('heritage') || c.includes('tour'); }).length})` },
              { id: 'activity', label: `🌊 Activities & Adventures (${items.filter(i => { const t = (i.type || i.item_type || '').toLowerCase(); const c = (i.category || '').toLowerCase(); const isSight = t === 'sightseeing' || c.includes('sight') || c.includes('heritage') || c.includes('tour'); return !isSight && (t === 'activity' || t === 'addon' || c.includes('water') || c.includes('adventure') || c.includes('sport') || c.includes('cruise') || c.includes('experience') || t !== ''); }).length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-xs ${
                  typeFilter === tab.id ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-3">
            {((appliedFilters?.activityTypes?.length || 0) > 0 || (appliedFilters?.activityPriceRanges?.length || 0) > 0 || searchQuery) && (
              <button
                type="button"
                className="btn btn-sm btn-link text-danger text-decoration-none p-0 text-xs fw-bold"
                onClick={() => {
                  setTypeFilter('all');
                  setSearchQuery('');
                  if (setParentSearchQuery) setParentSearchQuery('');
                  if (setAppliedFilters) {
                    setAppliedFilters(prev => ({
                      ...prev,
                      activityTypes: [],
                      activityPriceRanges: [],
                      activityDurations: []
                    }));
                  }
                }}
              >
                ✕ Clear Filters
              </button>
            )}
            <div className="text-xs text-muted fw-bold">
              Showing {filteredItems.length} curated {filteredItems.length === 1 ? 'option' : 'options'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Cards Grid ─── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted text-xs mt-2">Loading Goa experiences...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <Compass size={40} className="text-muted mx-auto mb-2 opacity-50" />
          <h5 className="fw-bold text-dark mb-1">No Experiences Found</h5>
          <p className="text-muted text-xs mb-3">Try adjusting your filters or search keywords.</p>
          <button 
            className="btn btn-sm btn-dark rounded-pill px-4 mx-auto fw-bold"
            onClick={() => {
              setTypeFilter('all');
              setSearchQuery('');
              if (setParentSearchQuery) setParentSearchQuery('');
              if (setAppliedFilters) {
                setAppliedFilters(prev => ({
                  ...prev,
                  activityTypes: [],
                  activityPriceRanges: [],
                  activityDurations: []
                }));
              }
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="row g-3 mb-5">
          {filteredItems.map((item) => {
            const isSightseeing = (item.type || '').toLowerCase() === 'sightseeing';
            const price = parseFloat(item.price || 0);

            return (
              <div key={item.id} className="col-12 col-md-6 col-lg-6">
                <div 
                  className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden d-flex flex-column hover-shadow transition-all" 
                  style={{ border: '1px solid #eef2f6', cursor: 'pointer' }}
                  onClick={() => {
                    if (onViewDetails) onViewDetails(item);
                  }}
                >
                  {/* Card Image */}
                  <div className="position-relative" style={{ height: '200px', overflow: 'hidden', background: '#f1f5f9' }}>
                    {item.image_url || item.image ? (
                      <img 
                        src={item.image_url || item.image} 
                        alt={item.title || item.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted text-xs">
                        Image not available
                      </div>
                    )}
                    <div className="position-absolute top-0 start-0 m-3">
                      <span className={`badge px-2.5 py-1 rounded-pill fw-bold text-xxs shadow-sm ${
                        isSightseeing ? 'bg-primary text-white' : 'bg-success text-white'
                      }`}>
                        {isSightseeing ? '🏛️ Sightseeing' : '⚡ Activity'}
                      </span>
                    </div>

                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-dark bg-opacity-75 text-white px-2.5 py-1 rounded-pill fw-bold text-xxs shadow-sm d-flex align-items-center gap-1">
                        <Clock size={11} /> {item.duration || 'Flexible'}
                      </span>
                    </div>

                    <div className="position-absolute bottom-0 start-0 w-100 p-2 text-white d-flex align-items-center gap-1.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                      <MapPin size={12} className="text-warning flex-shrink-0" />
                      <span className="text-xxs fw-semibold text-truncate">{item.location || 'Goa'}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-light text-secondary border text-xxs rounded-pill px-2 py-0.5">
                        {item.category || (isSightseeing ? 'Sightseeing & Tours' : 'Adventure')}
                      </span>
                      <div className="text-end">
                        <span className="text-xxs text-muted">Starting from</span>
                        <div className="fw-black text-dark fs-5 font-heading">
                          ₹{price.toLocaleString('en-IN')}
                          <span className="text-muted fw-normal" style={{ fontSize: '11px' }}> /person</span>
                        </div>
                      </div>
                    </div>

                    <h5 className="fw-bold text-dark mb-1 font-heading" style={{ fontSize: '16px' }}>
                      {item.title || item.name}
                    </h5>

                    <p className="text-muted text-xs mb-3 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description || 'Not specified'}
                    </p>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewDetails) {
                              onViewDetails(item);
                            }
                          }}
                          className="btn btn-sm btn-outline-dark fw-bold rounded-pill px-3 py-1.5 text-xs d-flex align-items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBook) {
                              onBook(item);
                            } else {
                              handleOpenBooking(item);
                            }
                          }}
                          className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1.5 shadow-sm text-xs d-flex align-items-center gap-1"
                        >
                          <span>Book Experience</span>
                          <ArrowRight size={13} />
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

      {/* ─── My Booked Experiences History ─── */}
      {myActivityBookings.length > 0 && (
        <div className="mt-5 pt-4 border-top">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 font-heading">
                My Booked Sightseeing & Activities
              </h5>
              <p className="text-muted text-xs mb-0">Your confirmed experience reservations</p>
            </div>
            <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 text-xxs">
              {myActivityBookings.length} {myActivityBookings.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>

          <div className="row g-3">
            {myActivityBookings.map((b, idx) => (
              <div key={b.id || idx} className="col-12 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-light text-dark border text-xxs px-2 py-0.5 rounded fw-bold text-uppercase">
                        #{b.id || b.booking_id}
                      </span>
                      <h6 className="fw-bold text-dark mt-1 mb-0">{b.item_name || b.package_name}</h6>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold text-xxs">
                      {b.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="text-xs text-muted d-flex flex-wrap gap-3 my-2">
                    <span className="d-flex align-items-center gap-1"><Calendar size={13} /> {b.pickup_date || 'Upcoming'}</span>
                    <span className="d-flex align-items-center gap-1"><MapPin size={13} /> {b.pickup_loc || b.pickup_location || 'Goa'}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <div>
                      <span className="text-xxs text-muted">Amount Paid</span>
                      <div className="fw-bold text-dark">₹{parseFloat(b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1"
                        onClick={() => {
                          if (onOpenBookingDetails && typeof onOpenBookingDetails === 'function') {
                            onOpenBookingDetails(b);
                          } else {
                            setSelectedVoucherBooking(b);
                          }
                        }}
                      >
                        <Eye size={12} /> View Voucher
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1 shadow-2xs"
                        onClick={() => {
                          if (b.phone || b.customer_phone) {
                            try {
                              const clean = String(b.phone || b.customer_phone).replace(/\D/g, '');
                              sessionStorage.setItem('customer_login_phone', clean);
                              localStorage.setItem('customer_login_phone', clean);
                            } catch (e) {}
                          }
                          if (onNavigateTab) {
                            onNavigateTab('customer');
                          } else {
                            window.location.href = '/customer';
                          }
                        }}
                      >
                        <Compass size={12} /> Track in Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Direct Booking Modal (2-Column Layout) ─── */}
      {bookingModalItem && (() => {
        const pricePerPerson = parseFloat(bookingModalItem.price || 0);
        const driverCharge = driverRequired ? (driverServiceType === 'FULL' ? 800 : 400) : 0;
        const baseActivityCost = pricePerPerson * guests;
        const subtotal = baseActivityCost + driverCharge;
        const gst = Math.round(subtotal * 0.05); // 5% GST
        const rawTotal = subtotal + gst;

        // Authoritative Loyalty Tier & Tier Discount Enforcement
        const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
        const isGold = customerTier === 'Gold';
        const isPlatinum = customerTier === 'Platinum';
        const isGoldEligible = isGold && rawTotal > 5000;
        const isPlatinumEligible = isPlatinum && rawTotal > 10000;

        let tierDiscount = 0;
        if (isGoldEligible) tierDiscount = 500;
        else if (isPlatinumEligible) tierDiscount = 1000;

        const postTierTotal = Math.max(0, rawTotal - tierDiscount);
        const maxWalletBenefit = Math.round(postTierTotal * 0.10);
        const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
        const finalTotal = Math.max(0, postTierTotal - appliedWalletAmount);
        const projectedCashback = Math.round(finalTotal * 0.10);

        const itemThumbnail = bookingModalItem.image_url ||
          bookingModalItem.image ||
          bookingModalItem.thumbnail ||
          (Array.isArray(bookingModalItem.images) && bookingModalItem.images[0]) ||
          (Array.isArray(bookingModalItem.mediaList) && bookingModalItem.mediaList[0]?.url);

        return createPortal(
          <div
            className="activity-booking-backdrop animate-fade-in"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(11, 25, 44, 0.75)',
              zIndex: 99999,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overscrollBehavior: 'contain'
            }}
            onWheel={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
            onClick={() => setBookingModalItem(null)}
          >
            <div
              className="modal-dialog m-0 animate-scale-up"
              style={{
                maxWidth: '880px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content border-0 shadow-2xl rounded-4"
                style={{
                  background: '#ffffff',
                  maxHeight: '92vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Modal Header */}
                <div
                  className="modal-header border-0 py-3 px-4 d-flex align-items-center justify-content-between flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
                    borderTopLeftRadius: '1rem',
                    borderTopRightRadius: '1rem'
                  }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="rounded-circle p-1.5 d-flex align-items-center justify-content-center text-dark"
                      style={{ backgroundColor: '#FFC107', width: '32px', height: '32px' }}
                    >
                      <Compass size={18} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold text-white mb-0 font-heading" style={{ fontSize: '1.1rem' }}>
                        Book Experience
                      </h5>
                      <span className="text-warning text-xxs fw-semibold">
                        {String(bookingModalItem.type || bookingModalItem.item_type || '').toLowerCase() === 'sightseeing' ? '🏛️ Curated Sightseeing Tour' : '⚡ Adventure & Activity Experience'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-white-50 p-1 border-0 hover-text-white transition-colors"
                    onClick={() => setBookingModalItem(null)}
                    style={{ textDecoration: 'none' }}
                    title="Close Modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div
                  className="modal-body p-3 p-md-4 activity-modal-body"
                  data-scrollable="true"
                  style={{
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    flex: '1 1 auto'
                  }}
                >
                  {bookingSuccess ? (
                    <div className="py-2 px-1 animate-fade-in" style={{ maxWidth: '540px', margin: '0 auto' }}>
                      <BookingConfirmationCard 
                        bookingId={bookingSuccess.id}
                        customerName={bookingSuccess.name || 'Valued Guest'}
                        customerPhone={contactPhone}
                        serviceTitle={bookingSuccess.item_name}
                        serviceSubtitle={bookingSuccess.pickup_date ? `Tour Date: ${bookingSuccess.pickup_date}` : ''}
                        cashbackPreview={bookingSuccess.cashback_preview}
                        details={[
                          { label: 'Experience', value: bookingSuccess.item_name, icon: <Compass size={13} /> },
                          { label: 'Tour Date', value: bookingSuccess.pickup_date, icon: <Calendar size={13} /> },
                          { label: 'Guests', value: `${guests} ${guests === 1 ? 'Guest' : 'Guests'}`, icon: <Users size={13} /> },
                          bookingSuccess.date_of_birth ? { label: 'Birthday', value: bookingSuccess.date_of_birth } : null,
                          bookingSuccess.driver_required ? {
                            label: 'Driver Service',
                            value: bookingSuccess.driver_service_type === 'FULL' ? 'Full-Day Driver (₹800)' :
                                   bookingSuccess.driver_service_type === 'DROP' ? 'Drop Service (₹400)' : 'Pickup Service (₹400)',
                            icon: <Car size={13} />
                          } : null,
                        ].filter(Boolean)}
                        amountPaid={parseFloat(bookingSuccess.amount_paid || bookingSuccess.total_amount || 0)}
                        totalAmount={parseFloat(bookingSuccess.total_amount || 0)}
                        remainingBalance={0}
                        paymentStatus="Confirmed"
                        isModalView={true}
                        onTrackPortal={() => {
                          if (contactPhone) {
                            try {
                              const clean = String(contactPhone).replace(/\D/g, '');
                              sessionStorage.setItem('customer_login_phone', clean);
                              localStorage.setItem('customer_login_phone', clean);
                            } catch (e) {}
                          }
                          setBookingModalItem(null);
                          setBookingSuccess(null);
                          if (onNavigateTab) {
                            onNavigateTab('customer');
                          } else {
                            window.location.href = '/customer';
                          }
                        }}
                        actions={
                          <div className="d-flex gap-2 justify-content-center w-100">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill text-xs py-2 px-4 fw-bold"
                              onClick={() => {
                                setBookingModalItem(null);
                                setBookingSuccess(null);
                              }}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-dark rounded-pill text-xs py-2 px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                              onClick={() => {
                                const b = bookingSuccess;
                                if (onOpenBookingDetails && typeof onOpenBookingDetails === 'function') {
                                  onOpenBookingDetails(b);
                                } else {
                                  setSelectedVoucherBooking(b);
                                }
                              }}
                            >
                              <Eye size={14} />
                              <span>View Ticket Voucher</span>
                            </button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <form id="activity-booking-form" onSubmit={handleConfirmBooking} style={{ overflow: 'visible' }}>
                      <div className="row g-4" style={{ overflow: 'visible' }}>
                        {/* ── Left Column: Customer & Booking Form ── */}
                        <div className="col-12 col-lg-7" style={{ overflow: 'visible' }}>
                          <h6 className="fw-bold text-dark mb-3 border-bottom pb-2 font-heading d-flex align-items-center gap-2">
                            <span>Customer &amp; Tour Details</span>
                          </h6>

                          {formError && (
                            <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3 d-flex align-items-center gap-2">
                              <AlertCircle size={15} className="flex-shrink-0" />
                              <span>{formError}</span>
                            </div>
                          )}

                          {/* Full Name */}
                          <div className="mb-3">
                            <label className="form-label text-xs fw-bold text-dark mb-1">
                              Full Name <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light text-muted border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
                                <User size={15} />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Rohan Sharma"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                required
                                style={{ borderRadius: '0 8px 8px 0', fontSize: '0.88rem' }}
                              />
                            </div>
                          </div>

                          {/* Mobile Phone Number */}
                          <div className="mb-3">
                            <label className="form-label text-xs fw-bold text-dark mb-1">
                              Mobile Phone Number <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light fw-bold text-xs" style={{ borderRadius: '8px 0 0 8px' }}>
                                +91
                              </span>
                              <input
                                type="tel"
                                className="form-control"
                                placeholder="10-digit mobile number"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                maxLength={10}
                                required
                                style={{ borderRadius: '0 8px 8px 0', fontSize: '0.88rem' }}
                              />
                            </div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                              Booking confirmation &amp; tickets will be sent to this WhatsApp/SMS number.
                            </small>
                          </div>

                          {/* Date of Birth (3-Dropdown Selector) */}
                          <div className="mb-3">
                            <label className="form-label text-xs fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                              <span className="d-flex align-items-center gap-1.5">
                                <Cake size={14} className="text-warning" />
                                <span>Date of Birth <span className="text-danger">*</span></span>
                              </span>
                              <span className="text-muted text-xxs">[ Day / Month / Year ]</span>
                            </label>

                            {isDobSaved ? (
                              <div className="p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between animate-fade-in">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px' }}>
                                    <Cake size={13} />
                                  </div>
                                  <div>
                                    <div className="text-xs fw-bold text-success d-flex align-items-center gap-1">
                                      <ShieldCheck size={13} /> Verified DOB on WOW GOA
                                    </div>
                                    <div className="text-xs text-dark mt-0.5">
                                      🎂 Birthday: <strong>{contactDob}</strong>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsDobSaved(false)}
                                  className="btn btn-sm btn-link text-success text-xxs p-0 text-decoration-none fw-bold"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <DobPicker
                                value={contactDob}
                                onChange={(val) => setContactDob(val)}
                                required={true}
                                maxYear={2026}
                                minYear={1930}
                                id="customer-activities-dob"
                              />
                            )}
                            <small className="text-muted d-block mt-1.5" style={{ fontSize: '11px', color: '#64748b' }}>
                              🎁 Enter your birthday to unlock special birthday offers, discounts, and surprise perks from WOW GOA!
                            </small>
                          </div>

                          {/* Tour Date Picker (Interactive Calendar) */}
                          <div className="mb-3" style={{ overflow: 'visible' }}>
                            <label className="form-label text-xs fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                              <Calendar size={14} className="text-warning" />
                              <span>Select Tour Date <span className="text-danger">*</span></span>
                            </label>
                            <TourDatePicker
                              value={travelDate}
                              onChange={(newDate) => setTravelDate(newDate)}
                              minDate={getTodayDateStr()}
                              required={true}
                              id="tour-booking-date"
                            />
                          </div>

                          {/* Email Address & Number of Guests */}
                          <div className="row g-2 mb-2">
                            <div className="col-12 col-sm-7">
                              <label className="form-label text-xs fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                                <Mail size={13} className="text-muted" />
                                <span>Email Address <span className="text-muted fw-normal text-xxs">(Optional)</span></span>
                              </label>
                              <input
                                type="email"
                                className="form-control"
                                placeholder="e.g. rohan@example.com"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                style={{ borderRadius: '8px', fontSize: '0.88rem' }}
                              />
                            </div>
                            <div className="col-12 col-sm-5">
                              <label className="form-label text-xs fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                                <Users size={13} className="text-muted" />
                                <span>Guests <span className="text-danger">*</span></span>
                              </label>
                              <div className="input-group">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary px-2.5 py-1 border"
                                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                                  title="Decrease guests"
                                  style={{ borderRadius: '8px 0 0 8px' }}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="25"
                                  className="form-control text-center fw-bold text-xs"
                                  value={guests}
                                  onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                  required
                                  style={{ fontSize: '0.9rem' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary px-2.5 py-1 border"
                                  onClick={() => setGuests((g) => Math.min(25, g + 1))}
                                  title="Increase guests"
                                  style={{ borderRadius: '0 8px 8px 0' }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ── Driver Option (Optional Private Driver in Goa) ── */}
                          <div className="mb-3 p-3 rounded-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <div className="form-check d-flex align-items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                id="activity_modal_driver_req"
                                checked={driverRequired}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setDriverRequired(checked);
                                  if (checked && !driverServiceType) {
                                    setDriverServiceType('PICKUP');
                                  }
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <label className="form-check-label fw-bold text-dark mb-0 small d-flex align-items-center gap-1.5 flex-wrap font-heading" htmlFor="activity_modal_driver_req" style={{ cursor: 'pointer' }}>
                                <span>Need a Verified Private Driver in Goa?</span>
                              </label>
                            </div>
                            
                            <div className="text-muted small ps-4 mb-2" style={{ fontSize: '0.74rem' }}>
                              Add a trusted, verified private driver for your tour. Convenient hotel or airport pickup, drop-off, or full-day service.
                            </div>

                            {driverRequired && (
                              <div className="mt-3 pt-3 border-top border-warning border-opacity-40 d-flex flex-column gap-2.5 ps-1 pe-1 animate-fade-in">
                                
                                {/* Choice 1: 🚗 Pickup Service — ₹400 */}
                                <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'PICKUP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                                  <div className="form-check d-flex align-items-center justify-content-between mb-0">
                                    <div className="d-flex align-items-center gap-2">
                                      <input
                                        type="radio"
                                        name="activity_driver_service_type_selection"
                                        className="form-check-input mt-0"
                                        id="activity_driver_pickup"
                                        checked={driverServiceType === 'PICKUP'}
                                        onChange={() => setDriverServiceType('PICKUP')}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="activity_driver_pickup" style={{ cursor: 'pointer' }}>
                                        🚗 Pickup Service
                                      </label>
                                    </div>
                                    <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                      ₹400
                                    </span>
                                  </div>

                                  {driverServiceType === 'PICKUP' && (
                                    <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                      <div className="col-sm-6">
                                        <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Time</label>
                                        <select
                                          className="form-select form-select-sm text-xs"
                                          value={driverPickupTime}
                                          onChange={(e) => setDriverPickupTime(e.target.value)}
                                        >
                                          {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="col-sm-6">
                                        <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Location</label>
                                        <select
                                          className="form-select form-select-sm text-xs"
                                          value={driverPickupLoc}
                                          onChange={(e) => setDriverPickupLoc(e.target.value)}
                                        >
                                          <option value="Hotel">🏨 Hotel</option>
                                          <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                          <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                          <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                          <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
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

                                {/* Choice 2: 🏁 Drop Service — ₹400 */}
                                <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'DROP' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                                  <div className="form-check d-flex align-items-center justify-content-between mb-0">
                                    <div className="d-flex align-items-center gap-2">
                                      <input
                                        type="radio"
                                        name="activity_driver_service_type_selection"
                                        className="form-check-input mt-0"
                                        id="activity_driver_drop"
                                        checked={driverServiceType === 'DROP'}
                                        onChange={() => setDriverServiceType('DROP')}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="activity_driver_drop" style={{ cursor: 'pointer' }}>
                                        🏁 Drop Service
                                      </label>
                                    </div>
                                    <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                      ₹400
                                    </span>
                                  </div>

                                  {driverServiceType === 'DROP' && (
                                    <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                      <div className="col-sm-6">
                                        <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Time</label>
                                        <select
                                          className="form-select form-select-sm text-xs"
                                          value={driverDropTime}
                                          onChange={(e) => setDriverDropTime(e.target.value)}
                                        >
                                          {['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="col-sm-6">
                                        <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Location</label>
                                        <select
                                          className="form-select form-select-sm text-xs"
                                          value={driverDropLoc}
                                          onChange={(e) => setDriverDropLoc(e.target.value)}
                                        >
                                          <option value="Hotel">🏨 Hotel</option>
                                          <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                          <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                          <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                          <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
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

                                {/* Choice 3: 👨‍✈️ Full-Day Tour Driver — ₹800/day */}
                                <div className={`p-2.5 rounded-3 bg-white border ${driverServiceType === 'FULL' ? 'border-warning shadow-sm ring-1 ring-warning' : 'border-light'} shadow-xs`}>
                                  <div className="form-check d-flex align-items-center justify-content-between mb-0">
                                    <div className="d-flex align-items-center gap-2">
                                      <input
                                        type="radio"
                                        name="activity_driver_service_type_selection"
                                        className="form-check-input mt-0"
                                        id="activity_driver_fullday"
                                        checked={driverServiceType === 'FULL'}
                                        onChange={() => setDriverServiceType('FULL')}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="activity_driver_fullday" style={{ cursor: 'pointer' }}>
                                        👨‍✈️ Full-Day Tour Driver
                                      </label>
                                    </div>
                                    <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                      ₹800 / day
                                    </span>
                                  </div>

                                  <div className="text-muted text-xxs mt-1 ps-4" style={{ fontSize: '0.7rem' }}>
                                    ⏰ 09:00 AM – 07:00 PM (8–10 Hours Local Daily Duty for your tour)
                                  </div>

                                  {driverServiceType === 'FULL' && (
                                    <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                      <div className="col-12">
                                        <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup / Start Location</label>
                                        <select
                                          className="form-select form-select-sm text-xs"
                                          value={driverFullDayStartLoc}
                                          onChange={(e) => setDriverFullDayStartLoc(e.target.value)}
                                        >
                                          <option value="Hotel">🏨 Hotel</option>
                                          <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                          <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                          <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                          <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                          <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                          <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                          <option value="Custom Address">📍 Custom Address</option>
                                        </select>
                                        {driverFullDayStartLoc === 'Custom Address' && (
                                          <input
                                            type="text"
                                            className="form-control form-control-sm text-xs mt-1"
                                            placeholder="Enter start location address or landmark..."
                                            value={driverFullDayCustomStartLoc}
                                            onChange={(e) => setDriverFullDayCustomStartLoc(e.target.value)}
                                            required
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            )}
                          </div>

                        </div>

                        {/* ── Right Column: Experience Preview Card & Pricing Breakdown ── */}
                        <div className="col-12 col-lg-5">
                          <div
                            className="p-3.5 rounded-4 h-100 d-flex flex-column"
                            style={{
                              background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {/* Activity Thumbnail Image preview with rounded corners */}
                            <div
                              className="position-relative rounded-3 overflow-hidden mb-3 shadow-xs"
                              style={{ height: '140px', background: '#e2e8f0' }}
                            >
                              {itemThumbnail ? (
                                <img
                                  src={itemThumbnail}
                                  alt={bookingModalItem.title || bookingModalItem.name}
                                  className="w-100 h-100 object-fit-cover"
                                />
                              ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted text-xs">
                                  Image not available
                                </div>
                              )}
                              <div className="position-absolute top-2 start-2">
                                <span className="badge bg-dark bg-opacity-80 backdrop-blur text-white text-xxs px-2.5 py-1 rounded-pill fw-bold">
                                  {String(bookingModalItem.type || bookingModalItem.item_type || '').toLowerCase() === 'sightseeing' ? '🏛️ Sightseeing' : '⚡ Adventure'}
                                </span>
                              </div>
                              <div className="position-absolute bottom-2 end-2">
                                <span className="badge bg-warning text-dark text-xxs px-2 py-0.5 rounded-pill fw-bold shadow-xs">
                                  ₹{pricePerPerson.toLocaleString('en-IN')} / guest
                                </span>
                              </div>
                            </div>

                            {/* Activity Title with duration and location tags */}
                            <div className="mb-3">
                              <h5 className="fw-bold text-dark font-heading mb-1.5" style={{ fontSize: '1.05rem', lineHeight: '1.3' }}>
                                {bookingModalItem.title || bookingModalItem.name}
                              </h5>
                              <div className="d-flex flex-wrap gap-1.5 align-items-center">
                                <span className="badge bg-white text-dark border text-xxs px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-2xs">
                                  <MapPin size={11} className="text-warning" />
                                  <span>{bookingModalItem.location || 'Goa'}</span>
                                </span>
                                <span className="badge bg-white text-dark border text-xxs px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-2xs">
                                  <Clock size={11} className="text-primary" />
                                  <span>{bookingModalItem.duration || 'Flexible'}</span>
                                </span>
                                <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 text-xxs px-2 py-1 rounded-pill">
                                  {bookingModalItem.category || 'Experience'}
                                </span>
                              </div>
                            </div>

                            {/* Price calculation summary */}
                            <div
                              className="card border-0 rounded-3 p-3 mb-3 shadow-2xs"
                              style={{ background: '#ffffff', border: '1px solid #eef2f6' }}
                            >
                              <div className="text-xs fw-bold text-dark border-bottom pb-2 mb-2 d-flex justify-content-between align-items-center">
                                <span>Price Breakdown</span>
                                <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold text-xxs">
                                  {guests} {guests === 1 ? 'Guest' : 'Guests'}
                                </span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-2">
                                <span>Base Rate:</span>
                                <span className="text-dark fw-semibold">
                                  ₹{pricePerPerson.toLocaleString('en-IN')} × {guests} {guests === 1 ? 'Guest' : 'Guests'}
                                </span>
                              </div>

                              {driverRequired && (
                                <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-2 animate-fade-in">
                                  <span className="d-flex align-items-center gap-1">
                                    <span className="badge bg-warning bg-opacity-20 text-dark border border-warning border-opacity-50 text-xxs px-1.5 py-0.5">
                                      🚗 Driver
                                    </span>
                                    <span>
                                      {driverServiceType === 'PICKUP' && 'Pickup Service'}
                                      {driverServiceType === 'DROP' && 'Drop Service'}
                                      {driverServiceType === 'FULL' && 'Full-Day Tour Driver'}
                                    </span>
                                  </span>
                                  <span className="text-success fw-bold">+₹{driverCharge.toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-2">
                                <span>Subtotal:</span>
                                <span className="text-dark fw-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                              </div>

                              <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-2.5">
                                <span>GST / Taxes (5%):</span>
                                <span className="text-dark fw-semibold">₹{gst.toLocaleString('en-IN')}</span>
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
                                    </div>
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
                                  🥇 <strong>Gold Privilege:</strong> -₹500 applied!
                                </div>
                              )}
                              {isPlatinumEligible && (
                                <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#f5f3ff', border: '1px solid #a855f7', color: '#581c87' }}>
                                  💎 <strong>Platinum Privilege:</strong> -₹1,000 applied!
                                </div>
                              )}

                              {tierDiscount > 0 && (
                                <div className="d-flex justify-content-between align-items-center text-xs text-warning fw-bold mb-2">
                                  <span>Tier Privilege Discount:</span>
                                  <span>-₹{tierDiscount.toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              {walletBalance > 0 && (
                                <div className="p-2 rounded-3 my-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
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
                                        id="useActivityWallet"
                                        checked={useWalletCashback}
                                        onChange={(e) => setUseWalletCashback(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <label className="form-check-label text-xs fw-bold text-success" htmlFor="useActivityWallet">
                                        Use ₹{Math.min(walletBalance, maxWalletBenefit).toLocaleString('en-IN')}
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {appliedWalletAmount > 0 && (
                                <div className="d-flex justify-content-between align-items-center text-xs text-success fw-bold mb-2">
                                  <span>Wallet Cashback Applied:</span>
                                  <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              <div className="d-flex justify-content-between align-items-center pt-2.5 border-top border-slate-200">
                                <div>
                                  <span className="text-xxs text-uppercase fw-bold text-muted d-block">Final Total Payable</span>
                                </div>
                                <div className="fs-4 fw-black text-dark font-heading">
                                  ₹{finalTotal.toLocaleString('en-IN')}
                                </div>
                              </div>

                              {/* 10% Cashback Earning Preview */}
                              <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                                <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                                  <Gift size={13} className="text-warning" />
                                  <span>10% Cashback You Will Earn: <strong className="text-success font-heading">₹{projectedCashback.toLocaleString('en-IN')}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Primary action button inside right column */}
                            <div className="mt-auto">
                              <button
                                type="submit"
                                form="activity-booking-form"
                                disabled={isSubmitting}
                                className="btn w-100 py-2.5 fw-bold text-dark rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 font-heading transition-all"
                                style={{
                                  background: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
                                  border: 'none',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {isSubmitting ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span>Confirming Reservation...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Confirm &amp; Book Now</span>
                                    <ArrowRight size={16} />
                                  </>
                                )}
                              </button>
                              <div className="text-center text-muted text-xxs mt-2">
                                🔒 100% Safe &amp; Secure Experience Booking
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Interactive Printable Booking Voucher Modal */}
      {selectedVoucherBooking && (
        <BookingVoucher
          booking={selectedVoucherBooking}
          currentUser={currentUser}
          onClose={() => setSelectedVoucherBooking(null)}
        />
      )}

    </div>
  );
}
