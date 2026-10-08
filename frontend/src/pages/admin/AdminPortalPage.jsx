import React, { useState, useEffect, useRef } from 'react';
import {
  Compass, LogOut, Box, Building, MessageSquare, CreditCard, Calendar,
  Plane, Hotel, Shield, LayoutDashboard, Globe, Users, Tag, BarChart2,
  ChevronDown, ChevronRight, Menu, Bell, Layers, FileText, Star, PlusCircle, Settings, X, UserPlus,
  Briefcase, Gift, Clock, AlertCircle, Wallet, CheckCircle2, Map as MapIcon, DollarSign
} from 'lucide-react';
import * as api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import AdminDashboardOverview from './AdminDashboardOverview';
import AdminB2BPortal from './b2b/AdminB2BPortal';

import AdminCMS from './AdminCMS';
import AdminCustomerManagement from './AdminCustomerManagement';
import AdminBookingManagement from './AdminBookingManagement';
import AdminStorefrontLeadsTab from './AdminStorefrontLeadsTab';
import AdminActivitiesManagement from './AdminActivitiesManagement';
import HotelVendorDashboard from '../vendor/HotelVendorDashboard';
import VendorDashboard from '../vendor/VendorDashboard';
import FlightVendorDashboard from '../vendor/FlightVendorDashboard';
import PMSPaymentSettings from '../vendor/pms/PMSPaymentSettings';
import AdminAvailabilityCalendar from './AdminAvailabilityCalendar';
import AdminPromotions from './AdminPromotions';
import AdminAnalytics from './AdminAnalytics';
import AnalyticsView from '../../components/shared/AnalyticsView';
import AdminPlatformSettings from './AdminPlatformSettings';
import HotelBookingDriverSetting from '../../components/common/HotelBookingDriverSetting';
import AdminWalletRecharges from './AdminWalletRecharges';
import WalletApprovalCenter from '../../components/superadmin/WalletApprovalCenter';
import AdminMarkupPanel from './AdminMarkupPanel';
import AdminEnquiryCRM from './AdminEnquiryCRM';
import LeadManagement from '../../components/shared/LeadManagement';
import AdminSubscriptionPanel from '../../components/admin/AdminSubscriptionPanel';
import AdminDriverManagement from './AdminDriverManagement';
import AdminReviewsManagement from './AdminReviewsManagement';
import TripPackagesManagementView from '../../components/admin/TripPackagesManagementView';
import NotificationSoundToggle from '../../components/common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { id: 'leads', label: 'Lead Management', icon: <Users size={15} /> },
      { id: 'customers', label: 'Customer Management', icon: <Users size={15} /> },
    ]
  },

  {
    label: 'B2B Distribution',
    items: [
      { id: 'b2b_dashboard', label: 'B2B Dashboard', icon: <Briefcase size={15} /> },
      { id: 'b2b_applications', label: 'Partner Applications', icon: <Clock size={15} /> },
      { id: 'b2b_all_partners', label: 'All Partners', icon: <Users size={15} /> },
      { id: 'b2b_wallets', label: 'Agent Wallets & Ledgers', icon: <Wallet size={15} /> },
      { id: 'b2b_commission_partners', label: 'Commission Partners', icon: <Gift size={15} /> },
      { id: 'b2b_non_commission_partners', label: 'Non-Commission Partners', icon: <Tag size={15} /> },
      { id: 'b2b_mode_requests', label: 'Mode Change Requests', icon: <AlertCircle size={15} /> },
      { id: 'b2b_commission_bookings', label: 'Commission Bookings', icon: <FileText size={15} /> },
      { id: 'b2b_non_commission_bookings', label: 'Non-Commission Bookings', icon: <FileText size={15} /> },
      { id: 'b2b_settings', label: 'B2B Settings & Rules', icon: <Settings size={15} /> },
    ]
  },

  {
    label: 'Inventory',
    items: [
      { id: 'packages', label: 'Manage Packages', icon: <Compass size={15} /> },
      { id: 'admin_hotels', label: 'Manage Hotel', icon: <Hotel size={15} /> },
      { id: 'admin_vehicles', label: 'Manage Vehicle', icon: <Shield size={15} /> },
      { id: 'admin_activities', label: 'Manage Sightseeing & Activity', icon: <MapIcon size={15} /> },
      { id: 'availability', label: 'Availability Calendar', icon: <Calendar size={15} /> },
    ]
  },
  {
    label: 'Partners',
    items: [
      { id: 'drivers', label: 'Driver Management', icon: <Users size={15} /> },
      { id: 'vendors', label: 'Vendor Management', icon: <Building size={15} /> },
      { id: 'wallets', label: 'Vendor Wallets', icon: <Wallet size={15} /> },
    ]
  },
  {
    label: 'Customers',
    items: [
      { id: 'bookings', label: 'Booking Management', icon: <Calendar size={15} /> },
      { id: 'storefront_leads', label: 'Storefront Visitor Leads', icon: <Compass size={15} /> },
      { id: 'reviews', label: 'Customer Reviews', icon: <Star size={15} /> },
      { id: 'lead_management', label: 'Lead Management (AI)', icon: <Users size={15} /> },
      { id: 'enquiries', label: 'Custom Enquiries', icon: <FileText size={15} /> },
      { id: 'add_users', label: 'Create Sub-Admin / Add Users', icon: <UserPlus size={15} /> },
    ]
  },
  {
    label: 'Revenue & Finance',
    items: [
      { id: 'platform_revenue', label: 'Platform Revenue Ledger', icon: <DollarSign size={15} /> },
      { id: 'wallet_recharges', label: 'Wallet Recharge Approvals', icon: <Wallet size={15} /> },
      { id: 'promotions', label: 'Promotions & Offers', icon: <Tag size={15} /> },
      { id: 'markup_reports', label: 'Markup & Reports', icon: <CreditCard size={15} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
    ]
  },
  {
    label: 'Settings',
    items: [
      { id: 'platform_settings', label: 'Platform Settings', icon: <Settings size={15} /> },
      { id: 'hotel_booking_settings', label: 'Hotel Booking Settings', icon: <Hotel size={15} /> },
      { id: 'payment_settings', label: 'Payment Gateways', icon: <CreditCard size={15} /> },
    ]
  },
  {
    label: 'Subscription',
    items: [
      { id: 'subscription', label: 'My Subscription', icon: <Star size={15} /> },
    ]
  },
  {
    label: 'Legacy',
    items: [
      { id: 'coupons', label: 'Coupons Master', icon: <Box size={15} /> },
    ]
  },
];

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(group.label === 'Customers' || group.label === 'Overview' || group.label === 'B2B Distribution' || defaultOpen || group.items.some(i => i.id === activeTab));
  
  const storageKey = 'admin_sidebar_order_v3_' + group.label.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const [orderedItems, setOrderedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const orderIds = JSON.parse(saved);
        if (Array.isArray(orderIds)) {
          const itemMap = new Map(group.items.map(it => [it.id, it]));
          const reordered = [];
          for (const id of orderIds) {
            if (itemMap.has(id)) {
              reordered.push(itemMap.get(id));
              itemMap.delete(id);
            }
          }
          for (const remaining of itemMap.values()) {
            reordered.push(remaining);
          }
          return reordered;
        }
      }
    } catch (e) {}
    return group.items;
  });

  useEffect(() => {
    setOrderedItems(prev => {
      const itemMap = new Map(group.items.map(it => [it.id, it]));
      const next = [];
      for (const it of prev) {
        if (itemMap.has(it.id)) {
          next.push(itemMap.get(it.id));
          itemMap.delete(it.id);
        }
      }
      for (const remaining of itemMap.values()) {
        next.push(remaining);
      }
      return next;
    });
  }, [group.items]);

  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverItemId) {
      setDragOverItemId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (!sourceId || sourceId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }
    const sourceIdx = orderedItems.findIndex(it => it.id === sourceId);
    const targetIdx = orderedItems.findIndex(it => it.id === targetId);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const newItems = [...orderedItems];
      const [moved] = newItems.splice(sourceIdx, 1);
      newItems.splice(targetIdx, 0, moved);
      setOrderedItems(newItems);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newItems.map(it => it.id)));
      } catch (err) {}
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0" style={{ background: 'transparent', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>
        <span>{group.label}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1">
          {orderedItems.map(item => (
            <button
              key={item.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(item.id)}
              className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1"
              style={{
                fontSize: '0.83rem',
                background: activeTab === item.id ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : (dragOverItemId === item.id ? 'rgba(255,255,255,0.08)' : 'transparent'),
                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
                boxShadow: activeTab === item.id ? '0 4px 12px rgba(255,99,51,0.3)' : 'none',
                fontWeight: activeTab === item.id ? 700 : 400,
                opacity: draggedItemId === item.id ? 0.4 : 1,
                cursor: 'grab',
                border: dragOverItemId === item.id ? '1px dashed #FF8A00' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
              <span className="flex-grow-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN HOTELS VIEW (with Add Hotel button) ───────────────────────────────
function AdminHotelsView({ hotels, onAddHotel, onUpdateHotel, onDeleteHotel, bookings, currentUser }) {
  const [innerTab, setInnerTab] = React.useState('hotels');
  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E' }}>Manage Hotels</h5>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>{hotels.length} hotels in inventory</p>
        </div>
        <button
          className="btn fw-bold text-white d-flex align-items-center gap-2"
          style={{ background: innerTab === 'add_hotel' ? '#64748b' : 'linear-gradient(90deg,#FF6333,#FF8A00)', borderRadius: '8px', fontSize: '0.85rem' }}
          onClick={() => setInnerTab(innerTab === 'add_hotel' ? 'hotels' : 'add_hotel')}>
          <PlusCircle size={16} /> {innerTab === 'add_hotel' ? 'Back to List' : 'Add Hotel'}
        </button>
      </div>
      <div className="rounded-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <HotelVendorDashboard
          activeTab={innerTab}
          hotels={hotels}
          onAddHotel={async (data) => {
            await onAddHotel(data);
            setInnerTab('hotels');
          }}
          onUpdateHotel={async (hotelData, extraData) => {
            const payload = (extraData && typeof extraData === 'object') ? { ...extraData, id: hotelData } : hotelData;
            await onUpdateHotel(payload);
            setInnerTab('hotels');
          }}
          onDeleteHotel={onDeleteHotel}
          bookings={bookings}
          currentUser={currentUser}
          onEditRequest={() => setInnerTab('add_hotel')}
        />
      </div>
    </div>
  );
}

export default function AdminPortalPage({
  initialTab,
  currentUser,
  triggerOpenLogin,
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onSetVendorPassword,
  onAddPackage,
  allPackages,
  cars = [],
  bikes = [],
  onUpdatePackage,
  onDeletePackage,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onAddBike,
  onUpdateBike,
  onDeleteBike,
  onLogout,
  flights = [],
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  hotels = [],
  onAddHotel,
  onUpdateHotel,
  onDeleteHotel,
  markups = [],
  onSaveMarkup,
  bookings = [],
  usersList = [],
  vehicleUnits = []
}) {
  const [adminActiveTab, setAdminActiveTab] = useState(() => {
    if (initialTab) return initialTab === 'payment' ? 'wallets' : initialTab;
    const currentPath = window.location.pathname;
    if (currentPath === '/admin/leads' || currentPath === '/admin/lead-management') return 'lead_management';
    if (currentPath === '/admin/custom-enquiries') return 'enquiries';
    if (currentPath === '/admin/customers') return 'customers';
    if (currentPath === '/admin/add-users') return 'add_users';
    if (currentPath === '/admin/bookings') return 'bookings';
    if (currentPath === '/admin/drivers') return 'drivers';
    if (currentPath === '/admin/activities' || currentPath === '/admin/sightseeing') return 'admin_activities';
    if (currentPath === '/admin/reviews') return 'reviews';
    if (currentPath === '/admin/wallets' || currentPath === '/admin/payment' || currentPath === '/admin/payments' || currentPath === '/admin/settlements') return 'wallets';
    if (currentPath === '/admin/platform-revenue') return 'platform_revenue';
    if (currentPath === '/admin/wallet-recharges') return 'wallet_recharges';
    const saved = localStorage.getItem('adminActiveTab');
    if (saved === 'payment') {
      try { localStorage.setItem('adminActiveTab', 'wallets'); } catch (e) {}
      return 'wallets';
    }
    return saved || 'overview';
  });

  const handleTabChange = (tabId) => {
    const targetTab = tabId === 'payment' ? 'wallets' : tabId;
    setAdminActiveTab(targetTab);
    try {
      localStorage.setItem('adminActiveTab', targetTab);
      if (targetTab === 'leads' || targetTab === 'lead_management') {
        window.history.replaceState(null, '', '/admin/leads');
      } else if (targetTab === 'enquiries') {
        window.history.replaceState(null, '', '/admin/custom-enquiries');
      } else if (targetTab === 'customers') {
        window.history.replaceState(null, '', '/admin/customers');
      } else if (targetTab === 'add_users') {
        window.history.replaceState(null, '', '/admin/add-users');
      } else if (targetTab === 'bookings') {
        window.history.replaceState(null, '', '/admin/bookings');
      } else if (targetTab === 'drivers') {
        window.history.replaceState(null, '', '/admin/drivers');
      } else if (targetTab === 'reviews') {
        window.history.replaceState(null, '', '/admin/reviews');
      } else if (targetTab === 'wallets') {
        window.history.replaceState(null, '', '/admin/wallets');
      } else if (targetTab === 'platform_revenue') {
        window.history.replaceState(null, '', '/admin/platform-revenue');
      } else if (targetTab === 'wallet_recharges') {
        window.history.replaceState(null, '', '/admin/wallet-recharges');
      } else if (targetTab === 'overview') {
        window.history.replaceState(null, '', '/admin');
      }
      if (typeof window !== 'undefined' && window.innerWidth < 992) {
        setSidebarOpen(false);
      }
    } catch (e) {}
  };
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [adminVehiclesInnerTab, setAdminVehiclesInnerTab] = useState('fleet');
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  const getAdminBookingCategory = (b) => {
    if (b.booking_channel === 'B2B' || b.b2b_mode) {
      const isNet = b.b2b_mode === 'NON_COMMISSION';
      return { 
        tab: isNet ? 'b2b_non_commission_bookings' : 'b2b_commission_bookings', 
        type: isNet ? 'B2B Net Booking' : 'B2B Commission Booking', 
        color: isNet ? '#3b82f6' : '#eab308' 
      };
    }

    const itemId = String(b.item_id || '').toLowerCase();
    const itemName = String(b.item_name || '').toLowerCase();
    const type = String(b.type || b.item_type || '').toLowerCase();

    if (type === 'hotel' || b.hotel_id || itemId.startsWith('hotel-') || itemId.startsWith('htl-') || 
        itemName.includes('marriott') || itemName.includes('taj') || itemName.includes('resort') || itemName.includes('hotel') || itemName.includes('stay')) {
      return { tab: 'admin_hotels', type: 'Hotel Booking', color: '#0284c7' };
    }

    if (['vehicle', 'car', 'bike', 'rental'].includes(type) || b.vehicle_id || itemId.startsWith('car-') || itemId.startsWith('bike-') || itemId.startsWith('veh-') || 
        itemName.includes('thar') || itemName.includes('swift') || itemName.includes('creta') || itemName.includes('activa')) {
      return { tab: 'admin_vehicles', type: 'Vehicle Rental', color: '#ea580c' };
    }

    return { tab: 'bookings', type: 'Holiday Package Booking', color: '#f97316' };
  };

  const [liveBookings, setLiveBookings] = useState(bookings);
  const [liveUsers, setLiveUsers] = useState(usersList);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [liveVendors, setLiveVendors] = useState(vendors);
  const [liveB2BPartners, setLiveB2BPartners] = useState([]);
  const [liveAiLeads, setLiveAiLeads] = useState([]);
  const [liveEnquiries, setLiveEnquiries] = useState([]);
  const [liveVehicleUnits, setLiveVehicleUnits] = useState(vehicleUnits);
  const [isDataSyncing, setIsDataSyncing] = useState(false);

  useEffect(() => {
    if (bookings && bookings.length > 0) setLiveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (usersList && usersList.length > 0) setLiveUsers(usersList);
  }, [usersList]);

  useEffect(() => {
    if (vendors && vendors.length > 0) setLiveVendors(vendors);
  }, [vendors]);

  useEffect(() => {
    if (vehicleUnits && vehicleUnits.length > 0) setLiveVehicleUnits(vehicleUnits);
  }, [vehicleUnits]);

  const [backendNotifs, setBackendNotifs] = useState([]);
  const [adminToasts, setAdminToasts] = useState([]);
  const prevNotifIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Central live data synchronization for Admin portal
  const loadAllAdminData = async () => {
    setIsDataSyncing(true);
    try {
      const [
        freshBookings,
        freshUsers,
        freshDrivers,
        freshVendors,
        freshB2BPartners,
        freshAiLeads,
        freshEnquiries,
        freshVehicleUnits,
        notifsRes
      ] = await Promise.all([
        api.fetchBookings().catch(() => []),
        api.fetchUsers().catch(() => []),
        api.fetchDrivers().catch(() => []),
        api.fetchVendors().catch(() => []),
        api.fetchB2BPartners().catch(() => []),
        api.fetchAiLeads().catch(() => []),
        api.fetchCustomEnquiries().catch(() => []),
        api.fetchVehicleUnits().catch(() => []),
        api.fetchNotifications({ role: 'admin', userId: currentUser?.id || 'admin' }).catch(() => ({ notifications: [] }))
      ]);

      if (Array.isArray(freshBookings) && freshBookings.length > 0) setLiveBookings(freshBookings);
      if (Array.isArray(freshUsers) && freshUsers.length > 0) setLiveUsers(freshUsers);
      if (Array.isArray(freshDrivers) && freshDrivers.length > 0) setLiveDrivers(freshDrivers);
      if (Array.isArray(freshVendors) && freshVendors.length > 0) setLiveVendors(freshVendors);
      if (Array.isArray(freshB2BPartners) && freshB2BPartners.length > 0) setLiveB2BPartners(freshB2BPartners);
      if (Array.isArray(freshAiLeads)) setLiveAiLeads(freshAiLeads);
      if (Array.isArray(freshEnquiries)) setLiveEnquiries(freshEnquiries);
      if (Array.isArray(freshVehicleUnits) && freshVehicleUnits.length > 0) setLiveVehicleUnits(freshVehicleUnits);

      if (notifsRes && Array.isArray(notifsRes.notifications)) {
        setBackendNotifs(prev => {
          if (
            prev.length === notifsRes.notifications.length &&
            prev.every((n, idx) => n.id === notifsRes.notifications[idx].id && n.is_read === notifsRes.notifications[idx].is_read)
          ) {
            return prev;
          }
          return notifsRes.notifications;
        });

        // Detect new unread notifications, trigger sound once and show live toasts
        if (isInitialLoadRef.current) {
          registerSeenNotifications(notifsRes.notifications);
        } else if (notifsRes.notifications.length > 0) {
          const fresh = handleIncomingNotifications(notifsRes.notifications, { isInitialLoad: false });
          if (fresh.length > 0) {
            fresh.forEach(item => {
              const toastId = `toast_${Date.now()}_${Math.random()}`;
              setAdminToasts(prev => [{ ...item, toastId }, ...prev.slice(0, 3)]);
              setTimeout(() => {
                setAdminToasts(prev => prev.filter(t => t.toastId !== toastId));
              }, 6000);
            });
          }
        }
        prevNotifIdsRef.current = new Set(notifsRes.notifications.map(n => String(n.id)));
      }
      isInitialLoadRef.current = false;
    } catch (e) {
      console.warn('Admin portal data sync error:', e);
    } finally {
      setIsDataSyncing(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(loadAllAdminData, 4000);

    const handleSync = () => {
      loadAllAdminData();
    };

    const handleNewBooking = (e) => {
      if (e?.detail) {
        setLiveBookings(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
      }
      loadAllAdminData();
    };

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('booking-updated', handleSync);
    window.addEventListener('booking-deleted', handleSync);
    window.addEventListener('driver-assigned', handleSync);
    window.addEventListener('driver-status-updated', handleSync);
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('authoritative-notification-received', handleSync);
    window.addEventListener('tripgalileo-booking-sync', handleSync);
    window.addEventListener('realtime-lead-created', handleSync);
    window.addEventListener('lead_created', handleSync);
    window.addEventListener('ai_leads_updated', handleSync);

    let bc = null;
    let bcNotifs = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.onmessage = handleSync;
        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = handleSync;
      }
    } catch (err) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('booking-updated', handleSync);
      window.removeEventListener('booking-deleted', handleSync);
      window.removeEventListener('driver-assigned', handleSync);
      window.removeEventListener('driver-status-updated', handleSync);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('authoritative-notification-received', handleSync);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      window.removeEventListener('realtime-lead-created', handleSync);
      window.removeEventListener('lead_created', handleSync);
      window.removeEventListener('ai_leads_updated', handleSync);
      if (bc) bc.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, [currentUser?.id]);

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_cleared_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  const mergedAdminNotifications = React.useMemo(() => {
    const notifMap = new Map();

    // 1. Authoritative Backend Notifications from database
    (backendNotifs || []).forEach(n => {
      const isB2B = n.type?.includes('b2b') || n.b2b_partner_id;
      notifMap.set(String(n.id), {
        id: String(n.id),
        title: n.title || 'System Notification',
        message: n.message || '',
        time: n.created_at ? String(n.created_at).slice(0, 16) : 'Recent',
        color: isB2B ? '#3b82f6' : '#FF6333',
        tab: isB2B ? 'b2b_commission_bookings' : 'bookings',
        isActionable: !n.is_read,
        is_read: n.is_read
      });
    });

    // 2. Real-time bookings from live sync
    (liveBookings || []).forEach(b => {
      const cat = getAdminBookingCategory(b);
      const isActionable = b.status === 'Draft' || b.status === 'Pending' || b.status === 'Payment Verification Pending' || b.status === 'New' || b.status === 'CONFIRMED' || b.status === 'Confirmed';
      const bKey = `b-${b.id}`;
      if (!notifMap.has(bKey)) {
        notifMap.set(bKey, {
          id: bKey,
          title: `${cat.type} #${b.id}`,
          message: `${b.name || b.customer_name || 'Customer'} — ${b.item_name || 'Item'} (${b.status || 'Enquiry'} • ₹${parseFloat(b.total_paid || b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')})`,
          time: b.created_at ? String(b.created_at).slice(0, 16) : 'Recent',
          color: cat.color,
          tab: cat.tab,
          isActionable,
          is_read: readNotifIds.includes(bKey) ? 1 : 0
        });
      }
    });

    return Array.from(notifMap.values());
  }, [backendNotifs, liveBookings, readNotifIds]);

  const activeAdminNotifications = mergedAdminNotifications.filter(n => !clearedNotifIds.includes(n.id));
  const adminUnreadCount = activeAdminNotifications.filter(n => n.isActionable && !readNotifIds.includes(n.id) && !n.is_read).length;

  const handleAdminMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    const allIds = activeAdminNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('admin_read_notifs', JSON.stringify(allIds));
    } catch (err) {}
    await api.markNotificationRead(null, { role: 'admin', userId: currentUser?.id || 'admin', all: true });
    loadAllAdminData();
  };

  const handleAdminClearAll = async (e) => {
    if (e) e.stopPropagation();
    const allIds = [...clearedNotifIds, ...mergedAdminNotifications.map(n => n.id)];
    setClearedNotifIds(allIds);
    try {
      localStorage.setItem('admin_cleared_notifs', JSON.stringify(allIds));
    } catch (err) {}
    await api.clearNotifications({ role: 'admin', userId: currentUser?.id || 'admin' });
    loadAllAdminData();
  };

  const handleAdminDismissNotification = (e, id) => {
    e.stopPropagation();
    const updated = [...clearedNotifIds, id];
    setClearedNotifIds(updated);
    try {
      localStorage.setItem('admin_cleared_notifs', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleAdminNotificationClick = async (n) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('admin_read_notifs', JSON.stringify(updated));
      } catch (err) {}
    }
    if (!String(n.id).startsWith('b-')) {
      await api.markNotificationRead(n.id, { role: 'admin', userId: currentUser?.id || 'admin' });
    }
    setAdminActiveTab(n.tab);
    setShowNotificationDropdown(false);
  };

  React.useEffect(() => {
    localStorage.setItem('adminActiveTab', adminActiveTab);
  }, [adminActiveTab]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'subadmin' && currentUser.role !== 'agent')) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Shield size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Admin Console</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Please sign in with an admin or sub-admin account to continue</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Admin Console
          </button>
        </div>
      </div>
    );
  }

  // Force subscription tab if suspended
  if (currentUser?.status === 'suspended' && adminActiveTab !== 'subscription') {
    setAdminActiveTab('subscription');
  }

  const NEW_TABS = ['overview', 'cms', 'customers', 'promotions', 'analytics', 'admin_flights', 'admin_hotels', 'markup_reports'];

  const renderContent = () => {
    switch (adminActiveTab) {
      case 'overview':
      case 'dashboard':
        return (
          <AdminDashboardOverview
            vendors={liveVendors}
            allPackages={allPackages}
            hotels={hotels}
            cars={cars}
            bikes={bikes}
            bookings={liveBookings}
            currentUser={currentUser}
            usersList={liveUsers}
            drivers={liveDrivers}
            b2bPartners={liveB2BPartners}
            aiLeads={liveAiLeads}
            enquiries={liveEnquiries}
            onNavigate={(tab) => handleTabChange(tab)}
            onRefresh={loadAllAdminData}
          />
        );

      case 'b2b_dashboard':
      case 'b2b_applications':
      case 'b2b_all_partners':
      case 'b2b_wallets':
      case 'b2b_commission_partners':
      case 'b2b_non_commission_partners':
      case 'b2b_mode_requests':
      case 'b2b_commission_bookings':
      case 'b2b_non_commission_bookings':
      case 'b2b_settings':
        return <AdminB2BPortal activeSubTab={adminActiveTab} onNavigateSubTab={(sub) => setAdminActiveTab(sub)} />;

      case 'drivers':
        return <AdminDriverManagement currentUser={currentUser} bookings={liveBookings} onRefresh={loadAllAdminData} />;

      case 'subscription':
        return <AdminSubscriptionPanel currentUser={currentUser} />;
      case 'cms':
        return <AdminCMS />;
      case 'customers':
        return <AdminCustomerManagement usersList={liveUsers} bookings={liveBookings} currentUser={currentUser} onRefresh={loadAllAdminData} />;
      case 'add_users':
        return <AdminCustomerManagement usersList={liveUsers} bookings={liveBookings} initialOpenAddUser={true} currentUser={currentUser} onRefresh={loadAllAdminData} />;
      case 'bookings':
        return (
          <AdminBookingManagement
            bookings={liveBookings}
            currentUser={currentUser}
            hotels={hotels}
            cars={cars}
            bikes={bikes}
            packages={allPackages}
            flights={flights}
            onRefreshBookings={loadAllAdminData}
            onNavigateToCalendar={() => handleTabChange('availability')}
            onNavigateToPayments={() => handleTabChange('payment')}
            onNavigateToLeads={() => handleTabChange('storefront_leads')}
          />
        );
      case 'storefront_leads':
        return <AdminStorefrontLeadsTab />;
      case 'leads':
      case 'lead_management':
        return <LeadManagement usersList={liveUsers} currentUser={currentUser} />;
      case 'enquiries':
      case 'custom_enquiries':
        return <AdminEnquiryCRM usersList={liveUsers} currentUser={currentUser} />;
      case 'promotions':
        return <AdminPromotions />;
      case 'analytics':
        return <AnalyticsView bookings={liveBookings} hotels={hotels} cars={cars} bikes={bikes} vendors={liveVendors} allPackages={allPackages} />;
      case 'admin_flights':
        return (
          <div className="p-4">
            <div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}>
              <FlightVendorDashboard activeTab="flights" flights={flights} onAddFlight={onAddFlight} onUpdateFlight={onUpdateFlight} onDeleteFlight={onDeleteFlight} bookings={liveBookings} currentUser={currentUser} />
            </div>
          </div>
        );
      case 'admin_hotels':
        return <AdminHotelsView hotels={hotels} onAddHotel={onAddHotel} onUpdateHotel={onUpdateHotel} onDeleteHotel={onDeleteHotel} bookings={liveBookings} currentUser={currentUser} />;
      case 'admin_vehicles':
        return (
          <div className="p-4">
            <div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}>
              <VendorDashboard activeTab={adminVehiclesInnerTab} setActiveTab={setAdminVehiclesInnerTab} vendors={liveVendors} cars={cars} bikes={bikes} onAddCar={onAddCar} onUpdateCar={onUpdateCar} onDeleteCar={onDeleteCar} onAddBike={onAddBike} onUpdateBike={onUpdateBike} onDeleteBike={onDeleteBike} bookings={liveBookings} currentUser={currentUser} />
            </div>
          </div>
        );
      case 'admin_activities':
        return <AdminActivitiesManagement currentUser={currentUser} />;
      case 'availability': {
        return (
          <div className="p-3 p-xl-4 w-100" style={{ boxSizing: 'border-box' }}>
            <AdminAvailabilityCalendar
              currentUser={currentUser}
              hotels={hotels}
              cars={cars}
              bikes={bikes}
              packages={allPackages}
              vehicleUnits={liveVehicleUnits}
              bookings={liveBookings}
              onRefresh={loadAllAdminData}
            />
          </div>
        );
      }
      case 'markup_reports':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><AdminMarkupPanel markups={markups} onSaveMarkup={onSaveMarkup} vendors={liveVendors} bookings={liveBookings} flights={flights} hotels={hotels} cars={cars} bikes={bikes} packages={allPackages} /></div></div>;
      case 'platform_settings':
        return <AdminPlatformSettings currentUser={currentUser} />;
      case 'hotel_booking_settings':
        return (
          <div className="p-4" style={{ minHeight: '100%' }}>
            <div className="mb-4">
              <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Hotel Booking Configuration</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Global settings for hotel guest booking preferences</p>
            </div>
            <div className="row">
              <div className="col-lg-7">
                <HotelBookingDriverSetting currentUser={currentUser} />
              </div>
            </div>
          </div>
        );
      case 'payment_settings':
        return (
          <div className="p-4">
            <div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}>
              <PMSPaymentSettings currentUser={currentUser} />
            </div>
          </div>
        );
      case 'wallets':
      case 'vendor_wallets':
        return <WalletApprovalCenter defaultTab="wallets" />;
      case 'wallet_recharges':
      case 'wallet_recharge':
        return <WalletApprovalCenter defaultTab="recharge" />;
      case 'blocked_booking_alerts':
      case 'blocked_alerts':
        return <WalletApprovalCenter defaultTab="blocked_alerts" />;
      case 'reactivations':
      case 'reactivation_requests':
        return <WalletApprovalCenter defaultTab="reactivations" />;
      case 'platform_revenue':
      case 'wallet_approvals':
        return <WalletApprovalCenter defaultTab="revenue" />;
      case 'payment':
        return <WalletApprovalCenter defaultTab="wallets" />;
      case 'reviews':
      case 'customer_reviews':
        return <AdminReviewsManagement portalTitle="Admin Portal" onSelectTab={handleTabChange} />;
      case 'packages':
      case 'admin_packages':
        return (
          <TripPackagesManagementView
            packages={allPackages}
            hotels={hotels}
            cars={cars}
            bikes={bikes}
            flights={flights}
            onAddPackage={onAddPackage}
            onUpdatePackage={onUpdatePackage}
            onDeletePackage={onDeletePackage}
            portalTitle="Trip Packages Management"
          />
        );
      default:
        return (
          <div className="p-4">
            <AdminDashboard
              vendors={liveVendors}
              allPackages={allPackages}
              onAddVendor={onAddVendor}
              onUpdateVendor={onUpdateVendor}
              onDeleteVendor={onDeleteVendor}
              onSetVendorPassword={onSetVendorPassword}
              onAddPackage={onAddPackage}
              onUpdatePackage={onUpdatePackage}
              onDeletePackage={onDeletePackage}
              activeTab={adminActiveTab}
              currentUser={currentUser}
              cars={cars}
              bikes={bikes}
              hotels={hotels}
              flights={flights}
            />
          </div>
        );
    }
  };

  return (
    <div className="d-flex w-100 position-relative" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Mobile Off-canvas Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 27, 46, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1040
          }}
        />
      )}

      {/* Sidebar */}
      {currentUser?.status !== 'suspended' && (
        <div
          className="d-flex flex-column flex-shrink-0"
          style={{
            position: isMobile ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            bottom: 0,
            width: isMobile ? '260px' : (sidebarOpen ? '256px' : '0px'),
            minWidth: isMobile ? '260px' : (sidebarOpen ? '256px' : '0px'),
            maxWidth: isMobile ? '85vw' : 'none',
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: '#0D1B2E',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transition: isMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.3s ease, min-width 0.3s ease',
            transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
            zIndex: isMobile ? 1050 : 'auto',
            boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          <div className="px-3 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Compass size={22} style={{ color: '#FF6333' }} />
            <div>
              <div className="fw-extrabold text-white" style={{ fontSize: '15px' }}>TRIPGALILEO</div>
              <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#00B8D9' }}>Admin Panel</div>
            </div>
          </div>
          <div className="flex-grow-1 py-2">
            {SIDEBAR_GROUPS.map((group, idx) => (
              <SidebarGroup key={group.label} group={group} activeTab={adminActiveTab} onSelect={handleTabChange} defaultOpen={idx < 3} />
            ))}
          </div>
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.85rem', fontWeight: 600 }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden', minWidth: 0, width: '100%' }}>
        {/* Topbar */}
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            {currentUser?.status !== 'suspended' && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><Menu size={20} /></button>
            )}
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>
                {SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === adminActiveTab)?.label || 'Admin Panel'}
              </div>
              <div className="text-white-50" style={{ fontSize: '0.68rem' }}>TripGalileo Admin Console</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              Online
            </span>

            {/* Admin Notification Bell with Badge */}
            <div className="position-relative">
              <button
                type="button"
                className="btn p-2 rounded-circle border-0 d-flex align-items-center justify-content-center text-white"
                style={{
                  background: showNotificationDropdown ? 'rgba(255,99,51,0.2)' : 'rgba(255,255,255,0.08)',
                  width: '36px',
                  height: '36px',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowProfileDropdown(false);
                }}
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell size={18} style={{ color: adminUnreadCount > 0 ? '#FF6333' : 'rgba(255,255,255,0.7)' }} />
                {adminUnreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-dark"
                    style={{ fontSize: '0.6rem', padding: '0.25em 0.45em' }}
                  >
                    {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDropdown && (
                <div
                  className="position-absolute shadow-lg animate-fade-in-up"
                  style={{
                    right: 0,
                    top: '46px',
                    width: '410px',
                    maxWidth: 'calc(100vw - 20px)',
                    background: '#10243A',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    zIndex: 1060,
                    overflow: 'hidden',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center justify-content-between px-3 py-2.5 flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    {/* Left: Title + Badge */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <Bell size={15} className="text-warning flex-shrink-0" />
                      <span className="fw-bold text-white small text-nowrap">Live Notifications</span>
                      {adminUnreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill text-nowrap" style={{ fontSize: '0.62rem', padding: '0.25em 0.5em', fontWeight: 700 }}>
                          {adminUnreadCount}
                        </span>
                      )}
                    </div>

                    {/* Right: Sound Control + Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <NotificationSoundToggle variant="dark" />
                      {adminUnreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-white-50 text-decoration-underline border-0 text-nowrap"
                          style={{ fontSize: '0.70rem' }}
                          onClick={handleAdminMarkAllRead}
                        >
                          Mark read
                        </button>
                      )}
                      {activeAdminNotifications.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm px-2 py-0.5 text-danger border border-danger border-opacity-40 rounded text-nowrap fw-semibold"
                          style={{ fontSize: '0.68rem', background: 'rgba(220,38,38,0.1)' }}
                          onClick={handleAdminClearAll}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeAdminNotifications.length === 0 ? (
                      <div className="p-4 text-center text-white-50 small">
                        No active notifications
                      </div>
                    ) : (
                      activeAdminNotifications.slice(0, 7).map((n) => {
                        const isUnread = !readNotifIds.includes(n.id) && n.isActionable;
                        const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);
                        return (
                          <div
                            key={n.id}
                            className="px-3 py-2.5 border-bottom border-secondary border-opacity-10 cursor-pointer d-flex align-items-start justify-content-between gap-2"
                            style={{ background: isUnread ? 'rgba(255,99,51,0.08)' : 'transparent', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(255,99,51,0.08)' : 'transparent'}
                            onClick={() => handleAdminNotificationClick(n)}
                          >
                            <div className="d-flex align-items-start gap-2 flex-grow-1 overflow-hidden pe-1">
                              <div className="rounded-circle mt-1 flex-shrink-0" style={{ width: '8px', height: '8px', background: n.color || '#FF6333' }}></div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex flex-wrap align-items-center gap-1.5 mb-0.5">
                                  <span
                                    className="fw-bold text-white"
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
                                        background: badgeStyle?.bg || 'rgba(255,255,255,0.1)',
                                        color: badgeStyle?.text || '#fff',
                                        border: `1px solid ${badgeStyle?.border || 'rgba(255,255,255,0.2)'}`
                                      }}
                                    >
                                      {status}
                                    </span>
                                  )}
                                </div>
                                <div className="text-white-50" style={{ fontSize: '0.72rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {n.message}
                                </div>
                                <div className="text-white-50 opacity-50 mt-1" style={{ fontSize: '0.65rem' }}>
                                  {getRelativeTimeString(n.time || n.created_at)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm p-0 text-white-50 border-0 flex-shrink-0 ms-1 opacity-75"
                              style={{ background: 'transparent' }}
                              title="Dismiss notification"
                              onClick={(e) => handleAdminDismissNotification(e, n.id)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    <button
                      type="button"
                      className="btn btn-sm w-100 text-warning fw-bold py-1 border-0"
                      style={{ fontSize: '0.75rem', background: 'rgba(255,159,28,0.08)' }}
                      onClick={() => {
                        setAdminActiveTab('bookings');
                        setShowNotificationDropdown(false);
                      }}
                    >
                      View All Bookings ({activeAdminNotifications.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const displayName = currentUser?.username || currentUser?.name || currentUser?.email || 'Admin';
              const initial = (displayName[0] || 'A').toUpperCase();
              return (
                <div className="position-relative">
                  <button className="btn p-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', border: '2px solid #FF6333', background: 'linear-gradient(135deg,#FFC107,#FF8A00)' }} onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotificationDropdown(false); }}>
                    <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{initial}</span>
                  </button>
                  {showProfileDropdown && (
                    <div className="position-absolute shadow-lg" style={{ right: 0, top: '48px', minWidth: '200px', background: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1050 }}>
                      <div className="text-center px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-2" style={{ width: '44px', height: '44px', fontSize: '18px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', color: '#000' }}>{initial}</div>
                        <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{displayName}</div>
                        <span className="badge mt-1" style={{ background: 'rgba(0,184,217,0.15)', color: '#00B8D9', fontSize: '0.6rem' }}>{String(currentUser?.role || 'admin').toUpperCase()}</span>
                      </div>
                      <div className="p-2">
                        <button className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 rounded fw-bold" style={{ color: '#FF6333', background: 'rgba(255,99,51,0.1)', fontSize: '0.85rem' }} onClick={onLogout}>
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </header>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto" style={{ minWidth: 0, width: '100%' }}>
          {renderContent()}
        </div>
      </div>

      {/* Real-Time Floating Notification Toasts */}
      {adminToasts.length > 0 && (
        <div 
          className="position-fixed bottom-0 end-0 p-3" 
          style={{ zIndex: 9999, maxWidth: '380px', width: '100%', pointerEvents: 'none' }}
        >
          {adminToasts.map((toast) => (
            <div
              key={toast.toastId}
              className="card border-0 shadow-lg mb-2 text-white animate-fade-in-up cursor-pointer"
              style={{
                background: '#10243A',
                borderLeft: '4px solid #FF6333',
                borderRadius: '10px',
                pointerEvents: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              onClick={() => {
                setAdminActiveTab('bookings');
                setAdminToasts(prev => prev.filter(t => t.toastId !== toast.toastId));
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <Bell size={15} className="text-warning" />
                    <strong style={{ fontSize: '0.82rem' }}>{toast.title || 'Live Notification'}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm p-0 text-white-50 border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdminToasts(prev => prev.filter(t => t.toastId !== toast.toastId));
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mb-0 text-white-50" style={{ fontSize: '0.74rem' }}>{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
