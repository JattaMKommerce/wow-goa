import React, { useState, useEffect } from 'react';
import {
  Compass, LayoutDashboard, Calendar, Car, Users, Wallet,
  Gift, CreditCard, Bell, User, HelpCircle, LogOut, Menu,
  X, ChevronDown, ChevronRight, ArrowLeft, ArrowRight,
  Shield, Phone, CheckCircle2, AlertCircle, Eye, Download,
  MapPin, Clock, Hotel, Sparkles, Plane, MessageCircle
} from 'lucide-react';

import CustomerOverviewTab from '../../components/customer/CustomerOverviewTab';
import CustomerSelfDriveTab from '../../components/customer/CustomerSelfDriveTab';
import CustomerDriverTripsTab from '../../components/customer/CustomerDriverTripsTab';
import CustomerBookingsTab from '../../components/customer/CustomerBookingsTab';
import CustomerWalletTab from '../../components/customer/CustomerWalletTab';
import CustomerPaymentsTab from '../../components/customer/CustomerPaymentsTab';
import CustomerNotificationsTab from '../../components/customer/CustomerNotificationsTab';
import CustomerProfileTab from '../../components/customer/CustomerProfileTab';
import CustomerSupportTab from '../../components/customer/CustomerSupportTab';
import CustomerActivitiesTab from '../../components/customer/CustomerActivitiesTab';
import BookingModal from '../../components/BookingModal';
import HotelBookingModal from '../../components/HotelBookingModal';
import BookingVoucher from '../../components/common/BookingVoucher';
import CarDetailsPage from './CarDetailsPage';
import BikeDetailsPage from './BikeDetailsPage';
import HotelDetailsPage from './HotelDetailsPage';
import ActivityDetailsPage from './ActivityDetailsPage';
import PackageDetailsPage from './PackageDetailsPage';
import FlightDetailsPage from './FlightDetailsPage';
import { isBikeVehicle, normalizeVehicleType } from '../../utils/vehicleHelper';
import * as api from '../../services/api';
import { getTodayDateStr, addDays } from '../../utils/dateUtils';
import NotificationSoundToggle from '../../components/common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';
import CustomerReviewModal from '../../components/customer/CustomerReviewModal';
import ReviewReminderBanner from '../../components/customer/ReviewReminderBanner';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    ]
  },
  {
    label: 'My Trips',
    items: [
      { id: 'selfdrive', label: 'My Self Drive Holidays', icon: <Compass size={16} />, highlight: true },
      { id: 'activities', label: 'Sightseeing & Activities', icon: <Sparkles size={16} /> },
      { id: 'bookings', label: 'All My Bookings', icon: <Calendar size={16} /> },
    ]
  },
  {
    label: 'Finances',
    items: [
      { id: 'wallet', label: 'Wallet & Rewards', icon: <Wallet size={16} /> },
      { id: 'payments', label: 'Payments & Invoices', icon: <CreditCard size={16} /> },
    ]
  },
  {
    label: 'Account & Support',
    items: [
      { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
      { id: 'profile', label: 'My Profile & KYC', icon: <User size={16} /> },
      { id: 'support', label: 'Customer Support', icon: <HelpCircle size={16} /> },
    ]
  }
];

export default function CustomerPortalPage({
  currentUser,
  onLogout,
  bookings = [],
  packages = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = [],
  activities = [],
  markups = [],
  onNavigateHome,
  onViewDetails
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  // Customer session state (loaded from auth or local session)
  const [customerUser, setCustomerUser] = useState(() => {
    if (currentUser && currentUser.role === 'customer') return currentUser;
    try {
      const saved = localStorage.getItem('customerUser');
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (parsedSaved && (parsedSaved.role === 'customer' || !parsedSaved.role)) return parsedSaved;
      }
      const curr = localStorage.getItem('currentUser');
      if (curr) {
        const parsed = JSON.parse(curr);
        if (parsed && parsed.role === 'customer') return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Keep customer session synced strictly for customer roles
  useEffect(() => {
    if (currentUser && currentUser.role === 'customer') {
      setCustomerUser(currentUser);
      try {
        localStorage.setItem('customerUser', JSON.stringify(currentUser));
      } catch (e) {}
    }
  }, [currentUser]);

  // Phone & OTP state for customer authentication
  const [loginPhone, setLoginPhone] = useState(() => {
    try {
      return sessionStorage.getItem('customer_login_phone') || '';
    } catch (e) {
      return '';
    }
  });
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('8520');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpTimer, setOtpTimer] = useState(45);
  const [loginError, setLoginError] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Countdown timer for OTP resend (45 seconds)
  useEffect(() => {
    let interval = null;
    if (otpStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  // Live authoritative bookings loaded directly from database for the customer
  const [liveCustomerBookings, setLiveCustomerBookings] = useState([]);
  const [customerNotifs, setCustomerNotifs] = useState([]);
  const [customerToasts, setCustomerToasts] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customer_read_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  const isInitialLoadRef = React.useRef(true);

  // Fetch live customer bookings and authoritative notifications from database
  const refreshCustomerData = React.useCallback(async (overridePhone = null) => {
    const targetPhone = overridePhone || customerUser?.phone || loginPhone;
    if (!targetPhone) return;
    try {
      const [freshBookings, freshNotifs] = await Promise.all([
        api.fetchCustomerBookings(targetPhone).catch(() => []),
        api.fetchNotifications({ role: 'customer', phone: targetPhone, userId: customerUser?.id }).catch(() => ({ notifications: [] }))
      ]);

      if (Array.isArray(freshBookings) && freshBookings.length > 0) {
        setLiveCustomerBookings(freshBookings);
        try {
          const local = JSON.parse(localStorage.getItem('local_bookings') || '[]');
          if (Array.isArray(local) && local.length > 0) {
            const updated = local.map(lb => {
              const match = freshBookings.find(fb => String(fb.id || fb.booking_id) === String(lb.id || lb.booking_id));
              return match ? { ...lb, ...match } : lb;
            });
            localStorage.setItem('local_bookings', JSON.stringify(updated));
          }
        } catch (e) {}
      }
      if (freshNotifs && Array.isArray(freshNotifs.notifications)) {
        setCustomerNotifs(freshNotifs.notifications);
        if (isInitialLoadRef.current) {
          registerSeenNotifications(freshNotifs.notifications);
          isInitialLoadRef.current = false;
        } else {
          const newlyReceived = handleIncomingNotifications(freshNotifs.notifications, { isInitialLoad: false });
          if (Array.isArray(newlyReceived) && newlyReceived.length > 0) {
            const freshToasts = newlyReceived.map(item => ({
              ...item,
              toastId: `ctoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            }));
            setCustomerToasts(prev => [...prev.slice(-4), ...freshToasts]);
          }
        }
      }
    } catch (err) {
      console.warn('[CustomerPortal] Error loading fresh customer data:', err);
    }
  }, [customerUser, loginPhone]);

  // Auto-dismiss customer toasts after 6s
  useEffect(() => {
    if (customerToasts.length === 0) return;
    const timer = setTimeout(() => {
      setCustomerToasts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [customerToasts]);

  const refreshCustomerBookings = refreshCustomerData;

  // Periodic polling (every 3.5s) and immediate cross-channel sync
  useEffect(() => {
    if (customerUser) {
      refreshCustomerData();
      const interval = setInterval(() => {
        refreshCustomerData();
      }, 3500);

      const handleSync = () => {
        refreshCustomerData();
      };

      window.addEventListener('new-booking-created', handleSync);
      window.addEventListener('booking-status-updated', handleSync);
      window.addEventListener('booking-updated', handleSync);
      window.addEventListener('tripgalileo-notification-sync', handleSync);
      window.addEventListener('tripgalileo-booking-sync', handleSync);
      window.addEventListener('authoritative-notification-received', handleSync);

      let bcBookings;
      let bcNotifs;
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
          bcBookings.onmessage = handleSync;
          bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
          bcNotifs.onmessage = handleSync;
        }
      } catch (e) {}

      return () => {
        clearInterval(interval);
        window.removeEventListener('new-booking-created', handleSync);
        window.removeEventListener('booking-status-updated', handleSync);
        window.removeEventListener('booking-updated', handleSync);
        window.removeEventListener('tripgalileo-notification-sync', handleSync);
        window.removeEventListener('tripgalileo-booking-sync', handleSync);
        window.removeEventListener('authoritative-notification-received', handleSync);
        if (bcBookings) bcBookings.close();
        if (bcNotifs) bcNotifs.close();
      };
    }
  }, [customerUser, refreshCustomerData]);

  useEffect(() => {
    if (customerUser && (activeTab === 'driver-trips' || activeTab === 'bookings' || activeTab === 'selfdrive' || activeTab === 'overview' || activeTab === 'notifications')) {
      refreshCustomerData();
    }
  }, [activeTab, customerUser, refreshCustomerData]);

  // ─── STRICT CUSTOMER DATA ISOLATION ─────────────────────────────────────────
  // A customer MUST ONLY see their own bookings matching their verified identity
  const customerBookings = React.useMemo(() => {
    if (!customerUser) return [];
    const cid = String(customerUser.id || '').trim().toLowerCase();
    const cPhone = String(customerUser.phone || '').replace(/\D/g, '');
    const cEmail = String(customerUser.email || '').trim().toLowerCase();
    const cName = String(customerUser.name || customerUser.username || '').trim().toLowerCase();

    // Merge bookings prop, local_bookings, and liveCustomerBookings (server takes priority)
    const bookingMap = new Map();
    (bookings || []).forEach(b => {
      if (b && (b.id || b.booking_id)) {
        bookingMap.set(String(b.id || b.booking_id), b);
      }
    });

    try {
      const local = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      if (Array.isArray(local)) {
        local.forEach(b => {
          if (b && (b.id || b.booking_id)) {
            const id = String(b.id || b.booking_id);
            const prev = bookingMap.get(id);
            bookingMap.set(id, prev ? { ...prev, ...b } : b);
          }
        });
      }
    } catch (e) {}

    (liveCustomerBookings || []).forEach(b => {
      if (b && (b.id || b.booking_id)) {
        const id = String(b.id || b.booking_id);
        const prev = bookingMap.get(id);
        bookingMap.set(id, prev ? { ...prev, ...b } : b);
      }
    });

    const allCandidateBookings = Array.from(bookingMap.values());

    const verifiedBookings = allCandidateBookings.filter(b => {
      const bCid = String(b.customer_id || '').trim().toLowerCase();
      const bPhone = String(b.customer_phone || b.phone || '').replace(/\D/g, '');
      const bEmail = String(b.customer_email || b.email || '').trim().toLowerCase();
      const bName = String(b.customer_name || b.name || '').trim().toLowerCase();

      // Verified mobile number is the primary identity for customer bookings
      if (cPhone && bPhone && (cPhone === bPhone || (cPhone.length >= 10 && bPhone.endsWith(cPhone.slice(-10))) || (bPhone.length >= 10 && cPhone.endsWith(bPhone.slice(-10))))) return true;
      if (cid && bCid && cid === bCid) return true;
      if (cEmail && bEmail && cEmail === bEmail) return true;
      if (cName && bName && cName === bName) return true;

      return false;
    });

    // ─── MASTER & CHILD BOOKING GROUPING ARCHITECTURE ───
    // Child bookings (with non-empty parent_booking_id) belong to their parent Trip Package.
    // They must NEVER appear as separate customer bookings or inflate booking counts.
    const childBookings = verifiedBookings.filter(b => Boolean(b.parent_booking_id && String(b.parent_booking_id).trim() !== ''));
    const childrenByParent = new Map();
    childBookings.forEach(c => {
      const pId = String(c.parent_booking_id).trim();
      if (!childrenByParent.has(pId)) childrenByParent.set(pId, []);
      childrenByParent.get(pId).push(c);
    });

    // Master and Standalone bookings (bookings where parent_booking_id is empty/null)
    const masterBookings = verifiedBookings.filter(b => !b.parent_booking_id || String(b.parent_booking_id).trim() === '');

    return masterBookings.map(master => {
      const mId = String(master.id || master.booking_id || '').trim();
      const children = childrenByParent.get(mId) || [];
      
      const hotelChild = children.find(c => c.type === 'hotel' || String(c.id).startsWith('BK-H-'));
      const vehicleChild = children.find(c => c.type === 'car' || c.type === 'vehicle' || String(c.id).startsWith('BK-V-'));
      const driverChild = children.find(c => c.type === 'driver' || String(c.id).startsWith('BK-D-'));
      const sightseeingChildren = children.filter(c => c.type === 'sightseeing' || String(c.id).startsWith('BK-S-'));
      const activityChildren = children.filter(c => c.type === 'activity' || String(c.id).startsWith('BK-A-'));

      const matchedPkg = (packages || []).find(p => 
        (p && master.item_id && String(p.id).toLowerCase() === String(master.item_id).toLowerCase()) ||
        (p && p.name && (p.name.toLowerCase() === String(master.item_name || '').toLowerCase() || p.name.toLowerCase() === String(master.package_name || '').toLowerCase()))
      );

      const isPkg = master.type === 'package' || 
                    master.package_type === 'Trip Package' || 
                    String(master.package_type || '').toLowerCase().includes('package') ||
                    Boolean(matchedPkg);

      if (!isPkg && children.length === 0) {
        return master;
      }

      // Consolidate package master with its child components
      return {
        ...master,
        type: 'package',
        package_type: master.package_type || 'Trip Package',
        child_bookings: children,
        hotel_child: hotelChild,
        vehicle_child: vehicleChild,
        driver_child: driverChild,
        sightseeing_children: sightseeingChildren,
        activity_children: activityChildren,
        
        // Configured Hotel
        hotel_name: master.hotel_name || hotelChild?.item_name || matchedPkg?.hotel_included || matchedPkg?.hotel?.name || 'Resort Stay Included',
        hotel_category: master.hotel_category || matchedPkg?.hotel_category || matchedPkg?.hotel?.category || '4 Star',
        room_type: master.room_type || master.hotel_room_type || matchedPkg?.hotel_room_type || matchedPkg?.hotel?.room_type || 'Deluxe Room',
        meal_plan: master.meal_plan || matchedPkg?.food_included || matchedPkg?.hotel?.meal_plan || 'Daily Buffet Breakfast Included',
        
        // Configured Vehicle
        vehicle_name: master.vehicle_name || vehicleChild?.item_name || matchedPkg?.car_included || matchedPkg?.vehicle?.name || 'Maruti Suzuki Swift',
        vehicle_details: vehicleChild?.physical_unit_id ? `Assigned Unit: ${vehicleChild.physical_unit_id}` : (matchedPkg?.vehicle?.seats || 'AC Vehicle with Chauffeur'),
        
        // Configured Driver
        driver_required: master.driver_required ?? (matchedPkg?.driver_included ? 1 : (driverChild ? 1 : 0)),
        driver_service_type: master.driver_service_type || driverChild?.driver_service_type || (matchedPkg?.driver_type === 'full_day' ? 'Full Day Chauffeur' : 'Full Day Chauffeur'),
        driver_status: driverChild?.assigned_driver_name ? `Assigned: ${driverChild.assigned_driver_name}` : (master.assigned_driver_name ? `Assigned: ${master.assigned_driver_name}` : '24/7 Local Concierge Assigned'),
        assigned_driver_name: master.assigned_driver_name || driverChild?.assigned_driver_name,
        assigned_driver_phone: master.assigned_driver_phone || driverChild?.assigned_driver_phone,
        
        // Configured Sightseeing & Activities
        sightseeing_places: master.sightseeing_places || master.places_included || matchedPkg?.places_included || (matchedPkg?.sightseeing_custom_json ? (typeof matchedPkg.sightseeing_custom_json === 'string' ? JSON.parse(matchedPkg.sightseeing_custom_json).join(', ') : matchedPkg.sightseeing_custom_json.join(', ')) : 'Fort Aguada, Baga Beach, Anjuna Beach, Basilica of Bom Jesus, Mandovi River Cruise'),
        activities_list: matchedPkg?.activity_custom_json ? (typeof matchedPkg.activity_custom_json === 'string' ? JSON.parse(matchedPkg.activity_custom_json) : matchedPkg.activity_custom_json) : (activityChildren.length > 0 ? activityChildren.map(a => a.item_name) : [{ name: 'Mandovi Sunset River Cruise', duration: '1 Hour' }]),
        
        // Configured Flight
        flight_details: (master.flight_number || master.airline) ? `${master.airline || 'Flight'} ${master.flight_number}` : ((matchedPkg?.flights_included === '1' || matchedPkg?.flight_source === 'existing') ? 'Included Flight' : 'Without Flight'),
        
        // Configured Day-wise Itinerary
        day_wise_itinerary: master.day_wise_itinerary || master.itinerary || matchedPkg?.day_wise_itinerary || matchedPkg?.itinerary,
        
        package_data: matchedPkg
      };
    });
  }, [bookings, liveCustomerBookings, customerUser, packages]);

  // Helper to verify if a mobile number has ANY active or past bookings
  const findMatchingBooking = async (phoneToMatch) => {
    const clean = String(phoneToMatch || '').replace(/\D/g, '');
    if (!clean || clean.length < 10) return null;
    const cleanLast10 = clean.slice(-10);

    const searchInList = (list) => {
      if (!Array.isArray(list)) return null;
      return list.find(b => {
        const bPhone = String(b.customer_phone || b.phone || b.contact || '').replace(/\D/g, '');
        if (!bPhone || bPhone.length < 10) return false;
        const bLast10 = bPhone.slice(-10);
        return bPhone === clean || bLast10 === cleanLast10;
      });
    };

    // 1. Check live bookings from database by verified mobile number first!
    try {
      const serverBookings = await api.fetchCustomerBookings(clean);
      if (Array.isArray(serverBookings) && serverBookings.length > 0) {
        setLiveCustomerBookings(serverBookings);
        const match = searchInList(serverBookings) || serverBookings[0];
        if (match) return match;
      }
    } catch (e) {}

    // 2. Check in passed bookings prop
    let match = searchInList(bookings);
    if (match) return match;

    // 3. Check local_bookings in localStorage
    try {
      const localBookings = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      if (Array.isArray(localBookings)) {
        match = searchInList(localBookings);
        if (match) return match;
      }
    } catch (e) {}

    // 4. Check local/session recent bookings
    try {
      const recent = sessionStorage.getItem('last_created_booking') || localStorage.getItem('last_created_booking');
      if (recent) {
        const parsedRecent = JSON.parse(recent);
        if (searchInList([parsedRecent])) return parsedRecent;
      }
    } catch (e) {}

    // 5. Query dedicated customer booking existence check
    try {
      const exists = await api.checkCustomerBookingExists(clean);
      if (exists) {
        return { phone: clean, customer_name: 'Valued Guest', status: 'Confirmed' };
      }
    } catch (e) {}

    // 6. Check recently used session phone
    try {
      const sessionPhone = String(sessionStorage.getItem('customer_login_phone') || localStorage.getItem('customer_login_phone') || '').replace(/\D/g, '');
      if (sessionPhone && (sessionPhone === clean || sessionPhone.endsWith(cleanLast10))) {
        return { id: `BK-${Date.now()}`, phone: clean, customer_name: 'Valued Guest', status: 'Confirmed' };
      }
    } catch (e) {}

    return null;
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanDigits = loginPhone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setLoginError('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setCheckingPhone(true);
    setLoginError('');

    try {
      // STRICT CHECK: Verify that this mobile number was used when booking
      const matchedBooking = await findMatchingBooking(cleanDigits);

      if (!matchedBooking) {
        setLoginError('No booking found for this mobile number. Access is only allowed for the mobile number used when booking your trip.');
        setCheckingPhone(false);
        return;
      }

      // Generate fresh simulated 4-digit OTP code (invalidates any previous OTP)
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      // Set 5-minute expiry
      setOtpExpiry(Date.now() + 5 * 60 * 1000);
      setOtpStep('otp');
      setOtpCode('');
      setOtpTimer(45);
      setLoginError('');
    } catch (err) {
      setLoginError('Unable to verify mobile number. Please try again.');
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanDigits = loginPhone.replace(/\D/g, '');
    const entered = otpCode.trim();

    if (!entered) {
      setLoginError('Please enter the 4-digit verification code.');
      return;
    }

    // Check expiry
    if (otpExpiry && Date.now() > otpExpiry) {
      setLoginError('Verification code has expired. Please click Resend OTP to request a fresh code.');
      return;
    }

    // Verify OTP against generated code (or master demo code)
    if (entered !== generatedOtp && entered !== '1234' && entered !== '8520') {
      setLoginError('Incorrect verification code. Please enter the valid 4-digit OTP.');
      return;
    }

    // Strictly ensure matching booking exists
    const match = await findMatchingBooking(cleanDigits);
    if (!match) {
      setLoginError('Access denied. No active booking found for this mobile number.');
      return;
    }

    const userObj = {
      id: match.customer_id || `c_${cleanDigits}`,
      name: match.customer_name || match.name || `Traveler ${cleanDigits.slice(-4)}`,
      username: match.customer_name || match.name || cleanDigits,
      phone: cleanDigits,
      email: match.customer_email || match.email || `${cleanDigits}@customer.wowgoa.com`,
      city: match.pickup_location || 'Goa',
      role: 'customer'
    };

    setCustomerUser(userObj);
    try {
      localStorage.setItem('customerUser', JSON.stringify(userObj));
      sessionStorage.removeItem('customer_login_phone');
    } catch (err) {}
    setLoginError('');
    setOtpStep('phone');
    // Immediately fetch all bookings for this verified customer mobile
    refreshCustomerBookings(cleanDigits);
  };

  const handleCustomerLogout = () => {
    try {
      localStorage.removeItem('customerUser');
      sessionStorage.removeItem('customer_login_phone');
    } catch (e) {}
    setCustomerUser(null);
    setOtpStep('phone');
    setOtpCode('');
    setLoginError('');
    if (onLogout) onLogout();
  };

  // Wallet & Rewards — real-time data handled inside CustomerWalletTab via API

  const handleOpenBookingDetails = (booking) => {
    if (!booking) return;
    // Security verification: ensure booking matches the authenticated customer
    if (customerUser) {
      const cid = String(customerUser.id || '').trim().toLowerCase();
      const cPhone = String(customerUser.phone || '').replace(/\D/g, '');
      const cEmail = String(customerUser.email || '').trim().toLowerCase();
      const cName = String(customerUser.name || customerUser.username || '').trim().toLowerCase();

      const bCid = String(booking.customer_id || '').trim().toLowerCase();
      const bPhone = String(booking.customer_phone || booking.phone || '').replace(/\D/g, '');
      const bEmail = String(booking.customer_email || booking.email || '').trim().toLowerCase();
      const bName = String(booking.customer_name || booking.name || '').trim().toLowerCase();

      const isAuthorized = (cid && bCid && cid === bCid) ||
                           (cPhone && bPhone && (cPhone === bPhone || (cPhone.length >= 10 && bPhone.endsWith(cPhone.slice(-10))) || (bPhone.length >= 10 && cPhone.endsWith(bPhone.slice(-10))))) ||
                           (cEmail && bEmail && cEmail === bEmail) ||
                           (cName && bName && cName === bName);

      if (!isAuthorized) {
        alert("Access Denied: You are only authorized to view your own bookings.");
        return;
      }
    }
    setSelectedBookingDetails(booking);
  };

  const handleCloseBookingDetails = () => {
    setSelectedBookingDetails(null);
  };

  // Direct booking state within Customer Portal
  const [directBookingItem, setDirectBookingItem] = useState(null);
  const [directBookingSuccess, setDirectBookingSuccess] = useState(false);
  const [lastConfirmedDirectBooking, setLastConfirmedDirectBooking] = useState(null);
  const [bookingUserName, setBookingUserName] = useState(customerUser?.name || '');
  const [bookingUserPhone, setBookingUserPhone] = useState(customerUser?.phone || '');
  const [bookingUserLicense, setBookingUserLicense] = useState('');

  // Authoritative Details View state (reusing canonical D2C details components)
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [activeDetailType, setActiveDetailType] = useState(null);
  const [selectedHotelBookingItem, setSelectedHotelBookingItem] = useState(null);

  const handleOpenDetail = (item, type = null) => {
    if (!item) return;
    let resolvedType = type;
    if (!resolvedType) {
      if (item.property_type || item.stars || String(item.id).startsWith('hotel-') || item.type === 'hotel') {
        resolvedType = 'hotel';
      } else if (item.flight_number || item.airline || String(item.id).startsWith('FL-') || String(item.id).startsWith('fl-') || item.type === 'flight') {
        resolvedType = 'flight';
      } else if (item.category === 'Water Sports' || item.category === 'Sightseeing & Tours' || String(item.id).startsWith('act-') || String(item.id).startsWith('sight-') || item.type === 'activity' || item.type === 'sightseeing') {
        resolvedType = 'activity';
      } else if (item.places_included || item.package_type || item.day_wise_itinerary || item.duration) {
        resolvedType = 'package';
      } else {
        resolvedType = normalizeVehicleType(item);
      }
    }
    if (resolvedType === 'vehicle' || resolvedType === 'car' || resolvedType === 'bike') {
      resolvedType = normalizeVehicleType(item);
    }
    setActiveDetailItem(item);
    setActiveDetailType(resolvedType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── WOW GOA REVIEW & RATING POPUP & REMINDER SYSTEM ───────────────────────
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reminderBooking, setReminderBooking] = useState(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [dismissedReminderIds, setDismissedReminderIds] = useState(new Set());

  // 1. Authoritative Backend Synchronization: Sync reviewed booking IDs from backend database
  useEffect(() => {
    if (!customerUser) return;
    let isCancelled = false;

    const syncReviewedStatus = async () => {
      try {
        const ids = await api.fetchCustomerReviewedBookingIds(customerUser);
        if (!isCancelled && Array.isArray(ids)) {
          setReviewedBookingIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(String(id)));
            (customerBookings || []).forEach(b => {
              if (b && b.has_reviewed) {
                next.add(String(b.id || b.booking_id));
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.warn('[CustomerPortal] Failed to sync customer reviewed IDs:', err);
      }
    };

    syncReviewedStatus();
    return () => { isCancelled = true; };
  }, [customerUser, customerBookings]);

  // Synchronize reviewed status immediately from customerBookings when server data arrives
  useEffect(() => {
    if (!Array.isArray(customerBookings) || customerBookings.length === 0) return;
    const reviewedFromBookings = customerBookings
      .filter(b => b && b.has_reviewed)
      .map(b => String(b.id || b.booking_id));

    if (reviewedFromBookings.length > 0) {
      setReviewedBookingIds(prev => {
        let changed = false;
        const next = new Set(prev);
        reviewedFromBookings.forEach(id => {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [customerBookings]);

  // 2. Authoritative Reminder Evaluation
  // The reminder should be shown repeatedly ONLY while:
  // booking is completed AND review does NOT exist in backend database
  useEffect(() => {
    if (!customerUser || !Array.isArray(customerBookings) || customerBookings.length === 0) {
      setReminderBooking(null);
      return;
    }

    // Find completed bookings only
    const completedList = customerBookings.filter(b => {
      const st = String(b.status || '').toLowerCase().trim();
      return st === 'completed';
    });

    if (completedList.length === 0) {
      setReminderBooking(null);
      return;
    }

    // Check review status PER BOOKING
    // Authoritative condition:
    // review exists for this booking/customer:
    //   YES -> review already submitted -> DO NOT show reminder
    //   NO  -> review not submitted -> reminder may be shown
    const unreviewed = completedList.find(b => {
      const bId = String(b.id || b.booking_id);
      const isReviewed = Boolean(b.has_reviewed) || reviewedBookingIds.has(bId);
      if (isReviewed) return false;

      // If customer dismissed reminder in current view/session (by clicking "Maybe Later" or "X"):
      if (dismissedReminderIds.has(bId)) return false;

      return true;
    });

    setReminderBooking(unreviewed || null);
  }, [customerUser, customerBookings, reviewedBookingIds, dismissedReminderIds]);

  const handleCloseReviewModal = (reason = '') => {
    // Closing review modal or choosing "Maybe Later" does NOT mark booking as reviewed
    setReviewModalBooking(null);
  };

  const handleReviewSuccess = (bId, submittedRating) => {
    const cleanId = String(bId);
    // ONLY after backend confirms review was created:
    // 1. Mark booking as authoritatively reviewed
    setReviewedBookingIds(prev => new Set(prev).add(cleanId));
    // 2. Permanently stop showing the review reminder for that booking
    setReminderBooking(null);
    setReviewModalBooking(null);
    // 3. Refresh live server customer data so booking.has_reviewed becomes true on server record
    if (typeof refreshCustomerData === 'function') {
      refreshCustomerData();
    }
  };

  const handleDismissReminder = (bId, reason = 'dismissed') => {
    const cleanId = String(bId);
    // Dismiss/close the reminder for current view/session ONLY.
    // - Keep review status = NOT SUBMITTED.
    // - Do not create/update a review record.
    // - Do not permanently remove the reminder (DO NOT store in localStorage).
    // - The reminder can appear again later (e.g. on page refresh or next visit).
    setDismissedReminderIds(prev => new Set(prev).add(cleanId));
    setReminderBooking(null);
  };

  const handleTriggerReview = (booking) => {
    if (!booking) return;
    const bId = String(booking.id || booking.booking_id);
    const isReviewed = Boolean(booking.has_reviewed) || reviewedBookingIds.has(bId);
    if (isReviewed) {
      // Review already submitted in backend: Do not show Rate Now / modal
      return;
    }
    setReviewModalBooking(booking);
  };

  // Keep customer identity pre-filled in booking checkout
  useEffect(() => {
    if (customerUser) {
      if (!bookingUserName && customerUser.name) setBookingUserName(customerUser.name);
      if (!bookingUserPhone && customerUser.phone) setBookingUserPhone(customerUser.phone);
    }
  }, [customerUser]);

  const handleConfirmDirectBooking = async (e, paymentMethodId, extraDetails = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    setDirectBookingSuccess(false);
    setLastConfirmedDirectBooking(null);
    const details = (e && typeof e === 'object' && !e.preventDefault) ? e : extraDetails;
    try {
      const cleanDigits = String(bookingUserPhone || customerUser?.phone || '').replace(/\D/g, '');
      const pDate = details.pickupDate || getTodayDateStr();
      const dDate = details.dropDate || addDays(pDate, 2);
      const days = details.bookingDays || 2;
      const totalCost = details.total || (directBookingItem?.price * days) || 0;

      const enrichedPayload = {
        name: bookingUserName || customerUser?.name || 'Customer',
        customer_name: bookingUserName || customerUser?.name || 'Customer',
        phone: bookingUserPhone || customerUser?.phone || '',
        customer_phone: bookingUserPhone || customerUser?.phone || '',
        email: customerUser?.email || `${cleanDigits || 'guest'}@customer.wowgoa.com`,
        customer_email: customerUser?.email || `${cleanDigits || 'guest'}@customer.wowgoa.com`,
        customer_id: customerUser?.id || `c_${cleanDigits || Date.now()}`,
        license: bookingUserLicense || details.license || '',
        date_of_birth: details.date_of_birth || customerUser?.date_of_birth || '',
        pickup_loc: details.pickupLoc || 'Goa Airport',
        pickup_location: details.pickupLoc || 'Goa Airport',
        pickup_date: pDate,
        pickup_time: details.pickupTime || '10:00 AM',
        drop_date: dDate,
        drop_loc: details.drop_loc || details.dropLoc || null,
        drop_location: details.drop_location || details.dropLoc || null,
        drop_time: details.dropTime || '10:00 AM',
        item_id: directBookingItem?.id || 'custom',
        item_name: directBookingItem?.name || 'Trip Booking',
        package_name: directBookingItem?.name || 'Self Drive Holiday',
        package_type: directBookingItem?.package_type || 'Self Drive Package',
        type: directBookingItem?.type || 'selfdrive',
        vehicle_name: directBookingItem?.name || 'Self Drive Vehicle',
        vehicle_image: directBookingItem?.image || directBookingItem?.image_url || '',
        booking_days: days,
        duration: `${days} Days`,
        total_amount: totalCost,
        subtotal: typeof details.subtotal === 'number' ? details.subtotal : ((directBookingItem?.price || 0) * days),
        tax: typeof details.tax === 'number' ? details.tax : 0,
        fee: typeof details.fee === 'number' ? details.fee : 0,
        amount_paid: typeof details.amount_paid === 'number' ? details.amount_paid : totalCost,
        total_paid: totalCost,
        pending_amount: details.pending_amount !== undefined ? details.pending_amount : Math.max(0, totalCost - ((typeof details.amount_paid === 'number' ? details.amount_paid : totalCost) + (details.wallet_amount_used || 0))),
        wallet_amount_used: details.wallet_amount_used || 0,
        tier_discount_applied: details.tier_discount_applied || 0,
        customer_tier_at_booking: details.customer_tier_at_booking || 'New Member',
        customizations: details.customizations ? (typeof details.customizations === 'string' ? details.customizations : JSON.stringify(details.customizations)) : '',
        payment_method: (typeof paymentMethod === 'string' && paymentMethod) ? paymentMethod : 'Cash / Online',
        driver_required: details.driver_required ? 1 : 0,
        driver_service_type: details.driver_service_type || (details.driver_required ? 'FULL' : null),
        driver_charge: typeof details.driver_charge === 'number' ? details.driver_charge : 0,
        driver_days: typeof details.driver_days === 'number' ? details.driver_days : 0,
        driver_earning: typeof details.driver_earning === 'number' ? details.driver_earning : (details.driver_charge || 0),
        driver_pickup_enabled: details.driver_pickup_enabled ? 1 : 0,
        driver_pickup_date: details.driver_pickup_date || '',
        driver_pickup_time: details.driver_pickup_time || '',
        driver_pickup_loc: details.driver_pickup_loc || '',
        driver_drop_enabled: details.driver_drop_enabled ? 1 : 0,
        driver_drop_date: details.driver_drop_date || '',
        driver_drop_time: details.driver_drop_time || '',
        driver_drop_loc: details.driver_drop_loc || '',
        driver_fullday_enabled: details.driver_fullday_enabled ? 1 : 0,
        driver_fullday_start: details.driver_fullday_start || '',
        driver_fullday_end: details.driver_fullday_end || '',
        driver_fullday_days: details.driver_fullday_days || 0,
        driver_details: details.driver_details ? JSON.stringify(details.driver_details) : '',
        status: 'Confirmed'
      };

      const res = await api.createBooking(enrichedPayload);
      const confirmedBooking = {
        ...enrichedPayload,
        ...(res?.booking || {}),
        id: res?.booking_id || res?.id || res?.booking?.id || `WG${Math.floor(1000 + Math.random() * 9000)}`,
        booking_id: res?.booking_id || res?.id || res?.booking?.id,
        cashback_preview: res?.cashback_preview || res?.booking?.cashback_preview || null
      };

      setLastConfirmedDirectBooking(confirmedBooking);
      setDirectBookingSuccess(true);
      
      // Refresh customer data so wallet balance and bookings update immediately
      refreshCustomerData();
      
      // Prepend to live bookings list so customer dashboard reflects the new trip immediately
      if (bookings && Array.isArray(bookings)) {
        bookings.unshift(confirmedBooking);
      }
    } catch (err) {
      alert(err.message || "Failed to confirm booking. Please try again.");
    }
  };

  // State for mobile drawer and profile dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.customer-profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Direct category selection state for bookings tab
  const [bookingsCategoryFilter, setBookingsCategoryFilter] = useState('all');

  const handleNavClick = (tabId, optCategory = 'all') => {
    setActiveDetailItem(null);
    setActiveDetailType(null);
    setActiveTab(tabId);
    if (optCategory) {
      setBookingsCategoryFilter(optCategory);
    }
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    if (optCategory === 'explore' || optCategory === 'fleets' || optCategory === 'book') {
      const tryScroll = () => {
        const el = document.getElementById('explore-more-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };
      if (!tryScroll()) {
        setTimeout(() => {
          if (!tryScroll()) {
            setTimeout(tryScroll, 200);
          }
        }, 80);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const TOP_NAV_ITEMS = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'selfdrive', label: 'My Self Drive Holidays', icon: <Compass size={15} />, highlight: true },
    { id: 'activities', label: 'Sightseeing & Activities', icon: <Sparkles size={15} /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar size={15} /> },
    { id: 'explore', label: 'Explore', icon: <Sparkles size={15} /> },
    { id: 'wallet', label: 'Wallet & Rewards', icon: <Wallet size={15} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={15} /> },
  ];

  const customerNotificationItems = React.useMemo(() => {
    const itemsMap = new Map();

    // 1. Authoritative backend notifications
    (customerNotifs || []).forEach(n => {
      itemsMap.set(String(n.id), {
        id: String(n.id),
        title: n.title || 'Notification',
        message: n.message || '',
        time: n.created_at ? String(n.created_at).slice(0, 16) : 'Recent',
        type: n.type || 'info',
        is_read: n.is_read || (readNotifIds.includes(String(n.id)) ? 1 : 0),
        bookingId: n.reference_id
      });
    });

    // 2. Booking-derived updates
    (customerBookings || []).slice(0, 8).forEach((b, idx) => {
      const bKey = `b-${b.id || idx}`;
      if (!itemsMap.has(bKey)) {
        itemsMap.set(bKey, {
          id: bKey,
          title: `Booking #${b.id || b.booking_id} (${b.status || 'Pending'})`,
          message: `${b.item_name || b.package_name || 'Trip Reservation'} • ₹${parseFloat(b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')}`,
          time: b.created_at ? String(b.created_at).slice(0, 16) : 'Recent',
          type: 'booking',
          is_read: readNotifIds.includes(bKey) ? 1 : 0,
          booking: b
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [customerNotifs, customerBookings, readNotifIds]);

  const customerUnreadCount = customerNotificationItems.filter(n => !n.is_read).length;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* ─── 1. TOP FULL-WIDTH NAVBAR ─── */}
      <header className="sticky-top bg-white border-bottom shadow-xs customer-portal-header" style={{ zIndex: 1030, ...(selectedBookingDetails ? { display: 'none' } : {}) }}>
        <div className="container-fluid px-3 px-md-4 px-xl-5" style={{ maxWidth: '1440px' }}>
          <div className="d-flex align-items-center justify-content-between py-2.5" style={{ minHeight: '68px' }}>
            
            {/* ── LEFT: Brand Logo & Customer Portal Title ── */}
            <div className="d-flex align-items-center gap-3">
              <a 
                href="/" 
                onClick={(e) => {
                  if (onNavigateHome) {
                    e.preventDefault();
                    onNavigateHome();
                  }
                }}
                className="d-flex align-items-center gap-2 text-decoration-none"
              >
                <div className="bg-warning text-dark rounded-circle p-1.5 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                  <Compass size={22} className="animate-spin-slow" />
                </div>
                <div>
                  <div className="fw-black tracking-wider text-dark font-heading" style={{ fontSize: '18px', lineHeight: 1.1 }}>
                    WOW <span className="text-warning">GOA</span>
                  </div>
                  <span className="badge bg-dark text-warning text-xxs tracking-wider text-uppercase px-2 py-0.5 rounded-pill fw-bold" style={{ fontSize: '9px' }}>
                    CUSTOMER PORTAL
                  </span>
                </div>
              </a>
            </div>

            {/* ── CENTER: Desktop Top Navigation Links (lg and up) ── */}
            {customerUser && (
              <nav className="d-none d-lg-flex align-items-center gap-1 gap-xl-1.5 flex-nowrap">
                {TOP_NAV_ITEMS.map((item) => {
                  const isActive = (activeTab === item.id) || (item.id === 'explore' && activeTab === 'overview-explore');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id === 'explore' ? 'overview' : item.id, item.id === 'explore' ? 'explore' : 'all')}
                      className={`btn btn-sm rounded-pill px-2.5 px-xl-3 py-1.5 py-xl-2 text-xs fw-bold d-flex align-items-center gap-1.5 transition-all border-0 text-nowrap flex-shrink-0 ${
                        isActive
                          ? 'btn-warning text-dark shadow-xs'
                          : 'btn-light text-secondary hover-text-dark bg-transparent'
                      }`}
                      style={{
                        background: isActive ? '#FFC107' : 'transparent',
                        color: isActive ? '#0f172a' : '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="text-nowrap" style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="badge bg-warning text-dark text-xxs px-1.5 py-0.5 rounded-pill fw-black ms-0.5 text-nowrap" style={{ fontSize: '8px' }}>
                          HOT
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* ── RIGHT: Quick Actions, Notifications, Profile Dropdown & Mobile Hamburger ── */}
            <div className="d-flex align-items-center gap-2 gap-md-3">
              
              {/* Direct Storefront Link */}
              <a 
                href="/" 
                onClick={(e) => {
                  if (onNavigateHome) {
                    e.preventDefault();
                    onNavigateHome();
                  }
                }}
                className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 text-xs d-none d-xl-flex align-items-center gap-1.5 fw-bold"
              >
                <span>Storefront</span>
                <ArrowRight size={13} />
              </a>

              {customerUser && (
                <>
                  {/* Notification Bell Icon & Popover Dropdown */}
                  <div className="position-relative">
                    <button 
                      type="button" 
                      onClick={() => {
                        setNotifDropdownOpen(!notifDropdownOpen);
                        setProfileDropdownOpen(false);
                      }} 
                      className={`btn btn-sm rounded-circle p-2 position-relative text-dark border transition-all ${
                        notifDropdownOpen ? 'btn-warning border-warning' : 'btn-light'
                      }`}
                      title="View Notifications"
                      style={{ width: '38px', height: '38px' }}
                    >
                      <Bell size={16} />
                      {customerUnreadCount > 0 && (
                        <span 
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white"
                          style={{ fontSize: '0.62rem', padding: '0.22em 0.42em' }}
                        >
                          {customerUnreadCount > 9 ? '9+' : customerUnreadCount}
                        </span>
                      )}
                    </button>

                    {notifDropdownOpen && (
                      <div 
                        className="card border-0 shadow-lg rounded-4 position-absolute end-0 mt-2 bg-white overflow-hidden"
                        style={{ width: '390px', maxWidth: 'calc(100vw - 20px)', zIndex: 1060, border: '1px solid #eef2f6', boxShadow: '0 12px 36px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="d-flex align-items-center justify-content-between px-3 py-2.5 bg-light border-bottom flex-wrap gap-2">
                          {/* Left: Title + Badge */}
                          <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <Bell size={14} className="text-warning flex-shrink-0" />
                            <span className="fw-bold text-dark small text-nowrap">Notifications</span>
                            {customerUnreadCount > 0 && (
                              <span className="badge bg-danger rounded-pill text-nowrap" style={{ fontSize: '0.62rem', padding: '0.22em 0.45em' }}>
                                {customerUnreadCount}
                              </span>
                            )}
                          </div>

                          {/* Right: Sound Control + Mark All Read */}
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                            <NotificationSoundToggle variant="light" />
                            {customerUnreadCount > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm p-0 text-muted border-0 text-decoration-underline text-nowrap"
                                style={{ fontSize: '0.70rem' }}
                                onClick={async () => {
                                  const allIds = customerNotificationItems.map(n => n.id);
                                  setReadNotifIds(allIds);
                                  localStorage.setItem('customer_read_notifs', JSON.stringify(allIds));
                                  await api.markNotificationRead(null, { role: 'customer', phone: customerUser?.phone, all: true });
                                }}
                              >
                                Mark all read
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                          {customerNotificationItems.length === 0 ? (
                            <div className="p-4 text-center text-muted small">
                              No notifications yet
                            </div>
                          ) : (
                            customerNotificationItems.slice(0, 6).map(n => {
                              const unread = !n.is_read;
                              const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);
                              return (
                                <div
                                  key={n.id}
                                  className={`px-3 py-2.5 border-bottom cursor-pointer transition-all d-flex align-items-start gap-2 ${unread ? 'bg-light bg-opacity-75' : 'bg-white'}`}
                                  onClick={() => {
                                    if (!readNotifIds.includes(n.id)) {
                                      const updated = [...readNotifIds, n.id];
                                      setReadNotifIds(updated);
                                      localStorage.setItem('customer_read_notifs', JSON.stringify(updated));
                                    }
                                    if (!String(n.id).startsWith('b-')) {
                                      api.markNotificationRead(n.id, { role: 'customer', phone: customerUser?.phone });
                                    }
                                    setNotifDropdownOpen(false);
                                    if (n.booking) {
                                      handleOpenBookingDetails(n.booking);
                                    } else {
                                      handleNavClick('notifications');
                                    }
                                  }}
                                >
                                  <div className="rounded-circle mt-1.5 flex-shrink-0" style={{ width: '8px', height: '8px', background: unread ? '#FF6333' : '#cbd5e1' }}></div>
                                  <div className="flex-grow-1 overflow-hidden pe-1">
                                    <div className="d-flex flex-wrap align-items-center gap-1.5 mb-0.5">
                                      <span
                                        className="fw-bold text-dark"
                                        style={{
                                          fontSize: '0.80rem',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          lineHeight: 1.3
                                        }}
                                      >
                                        {cleanTitle}
                                      </span>
                                      {status && (
                                        <span
                                          className="badge px-1.5 py-0.5 rounded-1 fw-semibold"
                                          style={{
                                            fontSize: '0.60rem',
                                            background: badgeStyle?.bg || '#f1f5f9',
                                            color: badgeStyle?.text || '#1e293b',
                                            border: `1px solid ${badgeStyle?.border || '#cbd5e1'}`
                                          }}
                                        >
                                          {status}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.72rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</p>
                                    <span className="text-muted opacity-75 mt-0.5 d-inline-block" style={{ fontSize: '0.65rem' }}>{getRelativeTimeString(n.time || n.created_at)}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="p-2 text-center bg-light border-top">
                          <button
                            type="button"
                            className="btn btn-sm w-100 text-warning fw-bold p-1 border-0"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => {
                              setNotifDropdownOpen(false);
                              handleNavClick('notifications');
                            }}
                          >
                            View All Notifications →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Avatar & Dropdown Menu */}
                  <div className="position-relative customer-profile-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="btn btn-sm btn-light border rounded-pill py-1 ps-1.5 pe-2.5 d-flex align-items-center gap-2 shadow-xs transition-all"
                      style={{ background: '#ffffff' }}
                    >
                      <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark fw-bold font-heading flex-shrink-0 shadow-xs" style={{ width: '30px', height: '30px', fontSize: '13px' }}>
                        {(customerUser?.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <span className="fw-bold text-dark text-xs d-none d-sm-inline-block text-truncate" style={{ maxWidth: '110px' }}>
                        {customerUser?.name || 'Customer'}
                      </span>
                      <ChevronDown size={14} className="text-muted" />
                    </button>

                    {/* Profile Dropdown Popup */}
                    {profileDropdownOpen && (
                      <div 
                        className="card border-0 shadow-lg rounded-4 position-absolute end-0 mt-2 p-2 animate-fade-in-up bg-white"
                        style={{ width: '250px', zIndex: 1050, border: '1px solid #eef2f6' }}
                      >
                        <div className="p-2.5 rounded-3 bg-light mb-1 border-bottom">
                          <div className="fw-bold text-dark text-xs text-truncate">{customerUser?.name || 'Traveler'}</div>
                          <div className="text-muted text-xxs text-truncate">{customerUser?.phone || customerUser?.email || 'Verified Customer'}</div>
                          <span className="badge bg-success bg-opacity-20 text-success text-xxs px-2 py-0.5 rounded-pill fw-bold mt-1">
                            ✓ Verified Account
                          </span>
                        </div>

                        <div className="d-flex flex-column gap-1">
                          <button
                            type="button"
                            onClick={() => handleNavClick('profile')}
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark"
                          >
                            <User size={14} className="text-primary" />
                            <span>My Profile & KYC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavClick('support')}
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark"
                          >
                            <HelpCircle size={14} className="text-info" />
                            <span>Customer Support</span>
                          </button>
                          
                          <div className="border-top my-1"></div>

                          <a
                            href="/"
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-secondary"
                          >
                            <ArrowLeft size={14} />
                            <span>Back to Web Home</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleCustomerLogout}
                            className="btn btn-sm btn-light text-start text-xs fw-bold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark transition-all"
                            style={{ color: '#0F172A' }}
                          >
                            <LogOut size={14} className="text-secondary" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Hamburger Menu Toggle Button (Visible on < lg screens) */}
                  <button 
                    type="button" 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                    className="btn btn-sm btn-light border d-lg-none p-2 rounded-circle"
                    aria-label="Toggle navigation menu"
                    style={{ width: '38px', height: '38px' }}
                  >
                    {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ─── 2. MOBILE RESPONSIVE DRAWER OVERLAY ─── */}
      {mobileMenuOpen && customerUser && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none animate-fade-in"
          style={{ zIndex: 1040 }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="position-absolute top-0 end-0 bg-white h-100 shadow-lg d-flex flex-column animate-slide-left p-0"
            style={{ width: '290px', maxWidth: '85vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drawer Header */}
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-dark text-white">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-warning text-dark rounded-circle p-1 d-flex align-items-center justify-content-center">
                  <Compass size={18} />
                </div>
                <div className="fw-black text-white font-heading text-sm">
                  WOW <span className="text-warning">GOA</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)} 
                className="btn btn-sm text-white-50 p-1 border-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Profile Pill in Mobile Drawer */}
            <div className="p-3 bg-light border-bottom">
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark fw-bold font-heading flex-shrink-0 shadow-xs" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                  {(customerUser?.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-dark fw-bold text-xs text-truncate">{customerUser?.name || 'Explorer'}</div>
                  <span className="badge bg-success bg-opacity-20 text-success text-xxs px-2 py-0.5 rounded-pill fw-bold">
                    ✓ Verified Customer
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Links List */}
            <div className="p-2 flex-grow-1 overflow-y-auto d-flex flex-column gap-1">
              {TOP_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id === 'explore' ? 'overview' : item.id, item.id === 'explore' ? 'explore' : 'all')}
                    className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2.5 rounded-3 border-0 transition-all text-xs fw-bold ${
                      isActive 
                        ? 'btn-warning text-dark shadow-xs' 
                        : 'btn-light text-secondary hover-text-dark bg-transparent'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && (
                      <span className="badge bg-warning text-dark text-xxs px-1.5 py-0.5 rounded fw-black">
                        HOT
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleNavClick('notifications')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'notifications' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <Bell size={15} />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'profile' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <User size={15} />
                <span>My Profile & KYC</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('support')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'support' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <HelpCircle size={15} />
                <span>Customer Support</span>
              </button>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-top bg-light">
              <div className="d-grid gap-2">
                <a 
                  href="/" 
                  className="btn btn-sm btn-outline-dark rounded-pill py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 fw-bold"
                >
                  <ArrowLeft size={13} />
                  <span>Back to WOW GOA Home</span>
                </a>

                <button 
                  type="button" 
                  onClick={handleCustomerLogout} 
                  className="btn btn-sm btn-dark text-white rounded-pill py-2 text-xs d-flex align-items-center justify-content-center text-nowrap fw-bold shadow-xs transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. FULL-WIDTH CONTENT CANVAS ─── */}
      <div className="flex-grow-1 d-flex flex-column w-100">

        {/* Tab Body Content */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5" style={{ background: '#F8FAFC' }}>
          <div className="container-fluid px-0" style={{ maxWidth: '1300px' }}>
            
            {!customerUser ? (
              <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto bg-white text-center animate-fade-in" style={{ maxWidth: '500px', border: '1px solid #eef2f6' }}>
                <div className="rounded-circle p-3 bg-warning text-dark d-inline-flex mx-auto mb-3 shadow-sm">
                  <Compass size={32} />
                </div>

                {otpStep === 'phone' ? (
                  <>
                    <h4 className="fw-black text-dark mb-1 font-heading">Customer Portal Login</h4>
                    <p className="text-muted text-xs mb-4">
                      Enter the mobile number you provided during booking to receive a verification OTP and access your trip dashboard.
                    </p>

                    {sessionStorage.getItem('customer_login_phone') && (
                      <div className="alert alert-warning bg-warning bg-opacity-10 border-0 py-2 px-3 text-xs mb-3 rounded-3 text-start d-flex align-items-center gap-2">
                        <span className="badge bg-warning text-dark fw-bold">Recent Booking</span>
                        <span className="text-dark">Mobile number detected from your recent booking</span>
                      </div>
                    )}

                    {loginError && (
                      <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3 text-start">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={handleSendOtp}>
                      <div className="mb-3 text-start">
                        <label className="form-label text-xs fw-bold text-muted">Registered Mobile Number</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted fw-bold text-xs border-end-0">
                            🇮🇳 +91
                          </span>
                          <input 
                            type="tel"
                            maxLength={10}
                            className="form-control form-control-lg text-sm rounded-end-3"
                            placeholder="e.g. 9876543210"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={checkingPhone}
                        className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 text-xs shadow-sm mb-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        {checkingPhone ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Verifying Registered Booking...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification OTP</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h4 className="fw-black text-dark mb-1 font-heading">Enter Verification Code</h4>
                    <p className="text-muted text-xs mb-3">
                      We have sent a 4-digit verification code to <strong className="text-dark">+91 {loginPhone}</strong>
                      {' '}<button type="button" onClick={() => { setOtpStep('phone'); setLoginError(''); }} className="btn btn-link p-0 text-warning text-xs fw-bold">Change</button>
                    </p>

                    {/* Simulated OTP Notification Banner */}
                    <div className="card bg-light border border-warning border-opacity-25 rounded-3 p-3 mb-3 text-start">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="text-xxs text-muted fw-bold text-uppercase">One-Time Password (OTP)</div>
                          <div className="fw-black text-dark font-heading tracking-wider" style={{ fontSize: '18px' }}>
                            {generatedOtp}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning text-dark fw-bold text-xxs rounded-pill px-3 py-1 shadow-sm"
                          onClick={() => setOtpCode(generatedOtp)}
                        >
                          ⚡ Auto-Fill Code
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3 text-start">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp}>
                      <div className="mb-3 text-start">
                        <label className="form-label text-xs fw-bold text-muted">4-Digit OTP Code</label>
                        <input 
                          type="text"
                          maxLength={4}
                          className="form-control form-control-lg text-center fw-black text-dark tracking-widest rounded-3 font-heading"
                          style={{ fontSize: '24px', letterSpacing: '8px' }}
                          placeholder="••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                          required
                        />
                      </div>

                      <button 
                        type="submit"
                        className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 text-xs shadow-sm mb-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        <span>Verify & Access Customer Dashboard →</span>
                      </button>
                    </form>

                    <div className="text-center text-xs text-muted pt-1">
                      {otpTimer > 0 ? (
                        <div className="d-flex align-items-center justify-content-center gap-1.5 text-muted">
                          <Clock size={13} className="text-muted" />
                          <span>Resend OTP in <strong className="text-dark fw-bold">{otpTimer}s</strong></span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <span>Didn't receive code?</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="btn btn-link p-0 text-warning text-xs fw-bold text-decoration-none"
                          >
                            Resend OTP
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="text-xxs text-muted mt-4 pt-3 border-top">
                  🔒 Secure 256-bit Encrypted Customer Portal • WOW GOA
                </div>
              </div>
            ) : activeDetailItem ? (
              <div className="active-details-view animate-fade-in">
                {activeDetailType === 'bike' && (
                  <BikeDetailsPage
                    bike={activeDetailItem}
                    pickupDate={getTodayDateStr()}
                    dropDate={addDays(getTodayDateStr(), 2)}
                    bookingDays={2}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(bikeItem) => {
                      const itm = bikeItem || activeDetailItem;
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(itm);
                    }}
                  />
                )}
                {activeDetailType === 'car' && (
                  <CarDetailsPage
                    car={activeDetailItem}
                    pickupDate={getTodayDateStr()}
                    dropDate={addDays(getTodayDateStr(), 2)}
                    bookingDays={2}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(carItem) => {
                      const itm = carItem || activeDetailItem;
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(itm);
                    }}
                  />
                )}
                {activeDetailType === 'hotel' && (
                  <HotelDetailsPage
                    hotel={activeDetailItem}
                    pickupDate={getTodayDateStr()}
                    dropDate={addDays(getTodayDateStr(), 2)}
                    nights={2}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(enrichedHotel, room, plan) => {
                      const itm = {
                        ...enrichedHotel,
                        preselected_room: room,
                        preselected_rate_plan: plan
                      };
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setSelectedHotelBookingItem(itm);
                    }}
                  />
                )}
                {activeDetailType === 'activity' && (
                  <ActivityDetailsPage
                    activity={activeDetailItem}
                    pickupDate={getTodayDateStr()}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(activityPayload) => {
                      const itm = {
                        ...activeDetailItem,
                        ...(activityPayload || {})
                      };
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(itm);
                    }}
                  />
                )}
                {activeDetailType === 'package' && (
                  <PackageDetailsPage
                    pkg={activeDetailItem}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(pkgItem) => {
                      const itm = pkgItem || activeDetailItem;
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(itm);
                    }}
                  />
                )}
                {activeDetailType === 'flight' && (
                  <FlightDetailsPage
                    flight={activeDetailItem}
                    pickupDate={getTodayDateStr()}
                    backLabel="Back to Customer Portal"
                    breadcrumbPrefix="Customer Portal"
                    onBack={() => { setActiveDetailItem(null); setActiveDetailType(null); }}
                    onBook={(fltItem) => {
                      const itm = fltItem || activeDetailItem;
                      setActiveDetailItem(null);
                      setActiveDetailType(null);
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(itm);
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                {reminderBooking && (
                  <ReviewReminderBanner
                    booking={reminderBooking}
                    onRateNow={handleTriggerReview}
                    onDismiss={handleDismissReminder}
                  />
                )}

                {activeTab === 'overview' && (
                  <CustomerOverviewTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    packages={packages}
                    cars={cars}
                    bikes={bikes}
                    hotels={hotels}
                    flights={flights}
                    activities={activities}
                    markups={markups}
                    exploreFocus={bookingsCategoryFilter}
                    onNavigateTab={(tab, optCat) => handleNavClick(tab, optCat)}
                    onSelectBooking={handleOpenBookingDetails}
                    onViewDetails={handleOpenDetail}
                    onDirectBook={(item) => handleOpenDetail(item)}
                  />
                )}

                {activeTab === 'selfdrive' && (
                  <CustomerSelfDriveTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    packages={packages}
                    cars={cars}
                    bikes={bikes}
                    hotels={hotels}
                    flights={flights}
                    onOpenBookingDetails={handleOpenBookingDetails}
                    onNavigateTab={(tab, optCat) => handleNavClick(tab, optCat)}
                  />
                )}

                {activeTab === 'activities' && (
                  <CustomerActivitiesTab 
                    currentUser={customerUser}
                    activities={activities}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                    onNavigateTab={(tab, optCat) => handleNavClick(tab, optCat)}
                    onViewDetails={(item) => handleOpenDetail(item, 'activity')}
                    onBook={(item) => handleOpenDetail(item, 'activity')}
                  />
                )}

                {activeTab === 'driver-trips' && (
                  <CustomerDriverTripsTab
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                  />
                )}

                {activeTab === 'bookings' && (
                  <CustomerBookingsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                    initialCategory={bookingsCategoryFilter}
                  />
                )}

                {activeTab === 'wallet' && (
                  <CustomerWalletTab
                    currentUser={customerUser}
                    onNavigateTab={(tab, optCat) => handleNavClick(tab, optCat)}
                    onNavigateHome={onNavigateHome}
                  />
                )}

                {activeTab === 'payments' && (
                  <CustomerPaymentsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                  />
                )}

                {activeTab === 'notifications' && (
                  <CustomerNotificationsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'profile' && (
                  <CustomerProfileTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onUpdateProfile={(updated) => setCustomerUser({ ...customerUser, ...updated })}
                  />
                )}

                {activeTab === 'support' && (
                  <CustomerSupportTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                  />
                )}
              </>
            )}

          </div>
        </main>
      </div>

      {/* ─── 3. Full Booking Details & Professional Corporate Voucher Modal ─── */}
      {selectedBookingDetails && (
        <BookingVoucher
          booking={selectedBookingDetails}
          customerUser={customerUser}
          currentUser={currentUser}
          onClose={handleCloseBookingDetails}
          isModal={true}
        />
      )}

      {/* ─── 4a. Hotel Booking Modal with Room & Rate Plan Selection ─── */}
      {selectedHotelBookingItem && (
        <HotelBookingModal
          selectedBookingItem={selectedHotelBookingItem}
          setSelectedBookingItem={setSelectedHotelBookingItem}
          pickupDate={getTodayDateStr()}
          dropDate={addDays(getTodayDateStr(), 2)}
          bookingDays={2}
          isCustomerPortal={true}
        />
      )}

      {/* ─── 4b. Direct Booking Modal within Customer Portal ─── */}
      {directBookingItem && (
        <BookingModal
          key={directBookingItem ? `${directBookingItem.id || directBookingItem.name}_${lastConfirmedDirectBooking?.id || 'new'}` : 'closed'}
          selectedBookingItem={directBookingItem}
          setSelectedBookingItem={setDirectBookingItem}
          onCloseModal={() => {
            setDirectBookingItem(null);
            setDirectBookingSuccess(false);
            setLastConfirmedDirectBooking(null);
          }}
          showSuccess={Boolean(directBookingSuccess && lastConfirmedDirectBooking)}
          setShowSuccess={setDirectBookingSuccess}
          userName={bookingUserName}
          setUserName={setBookingUserName}
          userPhone={bookingUserPhone}
          setUserPhone={setBookingUserPhone}
          userLicense={bookingUserLicense}
          setUserLicense={setBookingUserLicense}
          pickupLoc="Goa Airport (Dabolim / Mopa)"
          pickupDate={getTodayDateStr()}
          pickupTime="10:00 AM"
          dropDate=""
          dropTime="10:00 AM"
          bookingDays={3}
          handleConfirmBooking={handleConfirmDirectBooking}
          lastConfirmedBooking={lastConfirmedDirectBooking}
          setLastConfirmedBooking={setLastConfirmedDirectBooking}
          allPackages={packages}
          allCars={cars}
          allBikes={bikes}
        />
      )}

      {/* ─── Floating Live Notification Toasts (Multi-Desktop / Cross-Device Ready) ─── */}
      {customerToasts.length > 0 && (
        <div 
          className="position-fixed d-flex flex-column gap-2"
          style={{ bottom: '24px', right: '24px', zIndex: 99999, maxWidth: '380px', pointerEvents: 'auto' }}
        >
          {customerToasts.map(toast => {
            const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(toast.title, toast.message);
            return (
              <div
                key={toast.toastId}
                className="card shadow-lg border rounded-4 p-3 d-flex flex-row align-items-start gap-3 animate__animated animate__fadeInUp"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  color: '#fff',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                  minWidth: '320px'
                }}
              >
                <div 
                  className="rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                >
                  <Bell size={18} />
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                    <span className="fw-bold text-truncate" style={{ fontSize: '0.84rem', color: '#fff' }}>
                      {cleanTitle}
                    </span>
                    {badgeStyle && (
                      <span 
                        className="badge px-1.5 py-0.5 rounded-pill font-monospace"
                        style={{ ...badgeStyle, fontSize: '0.62rem' }}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <p className="text-white-50 mb-0" style={{ fontSize: '0.74rem', lineHeight: 1.35 }}>
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
                  className="btn btn-sm p-0 text-white-50 hover-text-white border-0"
                  style={{ background: 'transparent' }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {reviewModalBooking && (
        <CustomerReviewModal
          booking={reviewModalBooking}
          customerUser={customerUser}
          isOpen={!!reviewModalBooking}
          onClose={handleCloseReviewModal}
          onSuccess={handleReviewSuccess}
        />
      )}

    </div>
  );
}
