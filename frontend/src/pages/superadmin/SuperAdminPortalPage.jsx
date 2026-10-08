import React, { useState, useEffect } from 'react';
import {
  Compass, LogOut, Users, Settings, Shield, LayoutDashboard,
  Building, Car, Hotel, Plane, CalendarDays, Wallet, CreditCard,
  Percent, BarChart2, Globe, ChevronDown, ChevronRight,
  Bell, Menu, X, UserCog, CheckCircle, Map as MapIcon,
  Briefcase, Clock, Gift, Tag, AlertCircle, FileText, Star
} from 'lucide-react';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminReviewsManagement from '../admin/AdminReviewsManagement';
import AdminStorefrontLeadsTab from '../admin/AdminStorefrontLeadsTab';
import * as api from '../../services/api';
import { 
  aiLeadsData as defaultAiLeads, 
  customEnquiriesData as defaultCustomEnquiries,
  bookingsData as defaultBookings,
  vendorsData as defaultVendors,
  usersData as defaultUsers
} from '../../data/mockData';
import NotificationSoundToggle from '../../components/common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { id: 'lead_management', label: 'Lead Management', icon: <Users size={15} /> }
    ]
  },
  {
    label: 'Administration',
    items: [
      { id: 'admin_management', label: 'Admin Management', icon: <UserCog size={15} /> },
      { id: 'user_management', label: 'Global User Management', icon: <Users size={15} /> },
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
    label: 'Fleet & Drivers',
    items: [
      { id: 'drivers', label: 'Driver Management', icon: <Users size={15} /> },
    ]
  },
  {
    label: 'Vendors',
    items: [
      { id: 'vendor_management', label: 'Vendor Management', icon: <Building size={15} /> },
      { id: 'vendor_verification', label: 'KYC & Verification', icon: <CheckCircle size={15} /> },
      { id: 'storefront_leads', label: 'Storefront Visitor Leads', icon: <Compass size={15} /> },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'packages', label: 'Trip Packages', icon: <Compass size={15} /> },
      { id: 'vehicle_bookings', label: 'Vehicle Booking', icon: <Car size={15} /> },
      { id: 'hotel_bookings', label: 'Hotel Booking', icon: <Hotel size={15} /> },
      { id: 'hotel_booking_settings', label: 'Hotel Booking Settings', icon: <Hotel size={15} /> },
      { id: 'flight_bookings', label: 'Flight Booking', icon: <Plane size={15} /> },
      { id: 'trip_bookings', label: 'Trip Booking', icon: <CalendarDays size={15} /> },
      { id: 'activity_bookings', label: 'Sightseeing & Activity Booking', icon: <MapIcon size={15} /> },
    ]
  },
  {
    label: 'Finance & Monetization',
    items: [
      { id: 'subscription_plans', label: 'Subscription Plans', icon: <CreditCard size={15} /> },
      { id: 'payment_gateway', label: 'Payment Gateways', icon: <Globe size={15} /> },
      { id: 'wallet', label: 'Wallet & Approvals', icon: <Wallet size={15} /> },
      { id: 'commission', label: 'Commission Rules', icon: <Percent size={15} /> },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: <BarChart2 size={15} /> },
      { id: 'reviews', label: 'Customer Reviews', icon: <Star size={15} /> },
    ]
  },
  {
    label: 'Platform',
    items: [
      { id: 'global_settings', label: 'Global Settings', icon: <Globe size={15} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    ]
  },
];

const PAGE_TITLES = {
  dashboard: 'ERP Dashboard',
  packages: 'Trip Packages Management',
  admin_management: 'Admin Management',
  user_management: 'Global User Management',
  reviews: 'Customer Reviews & Ratings Management',
  b2b_dashboard: 'B2B Dashboard',
  b2b_applications: 'B2B Partner Applications',
  b2b_all_partners: 'B2B All Partners',
  b2b_wallets: 'B2B Agent Wallets & Ledgers',
  b2b_commission_partners: 'B2B Commission Partners',
  b2b_non_commission_partners: 'B2B Non-Commission Partners',
  b2b_mode_requests: 'B2B Mode Change Requests',
  b2b_commission_bookings: 'B2B Commission Bookings',
  b2b_non_commission_bookings: 'B2B Non-Commission Bookings',
  b2b_settings: 'B2B Settings & Rules',
  drivers: 'Driver Management',
  vendor_management: 'Vendor Management',
  vendor_verification: 'KYC & Verification',
  lead_management: 'Lead Management',
  hotel_bookings: 'Hotel Booking',
  hotel_booking_settings: 'Hotel Booking Settings',
  trip_bookings: 'Trip Booking',
  vehicle_bookings: 'Vehicle Booking',
  flight_bookings: 'Flight Booking',
  activity_bookings: 'Sightseeing & Activity Bookings',
  all_bookings: 'Booking Management',
  bookings: 'Vehicle Booking',
  wallet: 'Wallet & Approvals',
  payment_gateway: 'Payment Gateways',
  subscription_plans: 'Subscription Plans',
  commission: 'Commission Rules',
  reports: 'Reports & Analytics',
  global_settings: 'Global Settings',
  notifications: 'Notifications',
};

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const isCurrentGroupActive = group.items.some(i => i.id === activeTab);
  const [open, setOpen] = useState(defaultOpen || isCurrentGroupActive);

  useEffect(() => {
    if (isCurrentGroupActive) {
      setOpen(true);
    } else if (!defaultOpen) {
      setOpen(false);
    }
  }, [activeTab, isCurrentGroupActive, defaultOpen]);

  const storageKey = 'superadmin_sidebar_order_v2_' + group.label.toLowerCase().replace(/[^a-z0-9]/g, '_');

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
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0"
        style={{ background: 'transparent', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)' }}
      >
        <span>{group.label}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
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
                background: activeTab === item.id ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : (dragOverItemId === item.id ? 'rgba(255,255,255,0.08)' : 'transparent'),
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

export default function SuperAdminPortalPage({
  currentUser,
  triggerOpenLogin,
  usersList,
  vendors,
  cars,
  bikes,
  hotels,
  bookings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLogout,
  allPackages = [],
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  flights = []
}) {
  const getInitialTab = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTab = urlParams.get('tab');
      if (queryTab && PAGE_TITLES[queryTab]) return queryTab;

      const hash = window.location.hash.replace('#', '');
      if (hash && PAGE_TITLES[hash]) return hash;

      const pathPart = window.location.pathname.replace(/^\/(superadmin|super-admin)\/?/, '');
      if (pathPart && PAGE_TITLES[pathPart]) return pathPart;
      if (pathPart === 'admins' || pathPart === 'admin-management') return 'admin_management';
      if (pathPart === 'users' || pathPart === 'user-management') return 'user_management';

      const saved = localStorage.getItem('superAdminActiveTab');
      if (saved && PAGE_TITLES[saved]) return saved;
    } catch (e) {}
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setSidebarOpen(false);
    }
    try {
      localStorage.setItem('superAdminActiveTab', tabId);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch (e) {}
  };

  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTab();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
  const [superToasts, setSuperToasts] = useState([]);
  const [liveUsers, setLiveUsers] = useState(usersList?.length ? usersList : defaultUsers);
  const [liveBookings, setLiveBookings] = useState(bookings?.length ? bookings : defaultBookings);
  const [liveVendors, setLiveVendors] = useState(vendors?.length ? vendors : defaultVendors);
  const [liveB2BPartners, setLiveB2BPartners] = useState([]);
  const [liveB2BBookings, setLiveB2BBookings] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [aiLeads, setAiLeads] = useState(defaultAiLeads);
  const [customEnquiries, setCustomEnquiries] = useState(defaultCustomEnquiries);

  useEffect(() => {
    if (usersList?.length) {
      setLiveUsers(prev => {
        if (!prev || !prev.length) return usersList;
        const incomingUsernames = new Set(usersList.map(u => (u.username || '').toLowerCase().trim()));
        const incomingIds = new Set(usersList.map(u => String(u.id)));
        const missingFromIncoming = prev.filter(u => 
          !incomingUsernames.has((u.username || '').toLowerCase().trim()) && 
          !incomingIds.has(String(u.id))
        );
        return missingFromIncoming.length ? [...missingFromIncoming, ...usersList] : usersList;
      });
    }
  }, [usersList]);

  useEffect(() => {
    if (bookings?.length) setLiveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (vendors?.length) setLiveVendors(vendors);
  }, [vendors]);

  const isInitialLoadRef = React.useRef(true);

  // Fetch real leads, custom enquiries, bookings, vendors, users, B2B partners/bookings, drivers and authoritative notifications in real-time
  const loadAllPortalData = async () => {
    try {
      const [
        leadsData,
        enquiriesData,
        bookingsData,
        vendorsData,
        freshUsers,
        b2bPartnersData,
        b2bBookingsData,
        driversData,
        authNotifsRes
      ] = await Promise.all([
        api.fetchAiLeads().catch(() => []),
        api.fetchCustomEnquiries().catch(() => []),
        api.fetchBookings().catch(() => []),
        api.fetchVendors().catch(() => []),
        api.fetchUsers().catch(() => []),
        api.fetchB2BPartners().catch(() => []),
        api.fetchB2BBookings('all', { mode: '' }).catch(() => []),
        api.fetchDrivers().catch(() => []),
        api.fetchNotifications({ role: 'superadmin' }).catch(() => ({ notifications: [] }))
      ]);
      if (leadsData && leadsData.length) setAiLeads(leadsData);
      if (enquiriesData && enquiriesData.length) setCustomEnquiries(enquiriesData);
      if (bookingsData && bookingsData.length) setLiveBookings(bookingsData);
      if (b2bPartnersData && Array.isArray(b2bPartnersData)) setLiveB2BPartners(b2bPartnersData);
      if (b2bBookingsData && Array.isArray(b2bBookingsData)) setLiveB2BBookings(b2bBookingsData);
      if (driversData && Array.isArray(driversData)) setLiveDrivers(driversData);
      if (authNotifsRes && Array.isArray(authNotifsRes.notifications)) {
        if (isInitialLoadRef.current) {
          registerSeenNotifications(authNotifsRes.notifications);
        } else {
          const newlyReceived = handleIncomingNotifications(authNotifsRes.notifications, { isInitialLoad: false });
          if (Array.isArray(newlyReceived) && newlyReceived.length > 0) {
            const freshToasts = newlyReceived.map(item => ({
              ...item,
              toastId: `stoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            }));
            setSuperToasts(prev => [...prev.slice(-4), ...freshToasts]);
          }
        }
      }
      isInitialLoadRef.current = false;
      if (vendorsData && vendorsData.length) setLiveVendors(vendorsData);
      if (freshUsers && freshUsers.length) {
        setLiveUsers(prev => {
          if (!prev || !prev.length) return freshUsers;
          const freshUsernames = new Set(freshUsers.map(u => (u.username || '').toLowerCase().trim()));
          const freshIds = new Set(freshUsers.map(u => String(u.id)));
          const missing = prev.filter(u => 
            !freshUsernames.has((u.username || '').toLowerCase().trim()) && 
            !freshIds.has(String(u.id))
          );
          return missing.length ? [...missing, ...freshUsers] : freshUsers;
        });
      }
    } catch (e) {
      console.warn('Portal real-time refresh:', e);
    }
  };

  // Auto-dismiss superadmin toasts after 6s
  useEffect(() => {
    if (superToasts.length === 0) return;
    const timer = setTimeout(() => {
      setSuperToasts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [superToasts]);

  const handlePortalAddUser = async (newUser) => {
    // 1. Instant optimistic update to local state so administrator shows immediately
    const optimisticUser = {
      id: newUser.id || `u-${Date.now()}`,
      username: newUser.username,
      name: newUser.name || newUser.username,
      email: newUser.email,
      phone: newUser.phone || '',
      city: newUser.city || '',
      role: (newUser.role || 'admin').toLowerCase().trim(),
      billing_price: Number(newUser.billing_price) || 0,
      status: newUser.status || 'active',
      plain_password: newUser.password || newUser.plain_password || 'admin@2026',
      password: newUser.password || newUser.plain_password || 'admin@2026',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Cache locally immediately so reload also preserves it
    try {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      const filtered = localUsers.filter(u => (u.username || '').toLowerCase() !== optimisticUser.username.toLowerCase());
      filtered.unshift(optimisticUser);
      localStorage.setItem('local_users', JSON.stringify(filtered));

      const passMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      passMap[optimisticUser.id] = optimisticUser.plain_password;
      passMap[optimisticUser.username] = optimisticUser.plain_password;
      passMap[optimisticUser.email] = optimisticUser.plain_password;
      localStorage.setItem('user_passwords', JSON.stringify(passMap));
    } catch (e) {}

    setLiveUsers(prev => [optimisticUser, ...prev.filter(u => (u.username || '').toLowerCase() !== (newUser.username || '').toLowerCase() && (u.email || '').toLowerCase() !== (newUser.email || '').toLowerCase())]);

    try {
      let created = null;
      if (onAddUser) created = await onAddUser(newUser);
      else created = await api.registerUser(newUser);
      const userObj = created?.user || (created && created.username ? created : optimisticUser);
      setLiveUsers(prev => [userObj, ...prev.filter(u => (u.username || '').toLowerCase() !== (userObj.username || '').toLowerCase() && (u.email || '').toLowerCase() !== (userObj.email || '').toLowerCase())]);
      
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(u => 
          (u.username && u.username.toLowerCase() === userObj.username?.toLowerCase()) || 
          (u.email && u.email.toLowerCase() === userObj.email?.toLowerCase()) ||
          String(u.id) === String(userObj.id)
        );
        setLiveUsers(hasUser ? fresh : [userObj, ...fresh]);
      }
    } catch (e) {
      console.warn('Add user:', e);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(u => 
          (u.username && u.username.toLowerCase() === optimisticUser.username?.toLowerCase()) || 
          (u.email && u.email.toLowerCase() === optimisticUser.email?.toLowerCase()) ||
          String(u.id) === String(optimisticUser.id)
        );
        setLiveUsers(hasUser ? fresh : [optimisticUser, ...fresh]);
      }
    }
  };

  const handlePortalUpdateUser = async (user) => {
    setLiveUsers(prev => prev.map(u => String(u.id) === String(user.id) ? { ...u, ...user } : u));
    try {
      if (onUpdateUser) await onUpdateUser(user);
      else await api.updateUser(user);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setLiveUsers(fresh);
    } catch (e) {
      console.warn('Update user:', e);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setLiveUsers(fresh);
    }
  };

  const handlePortalDeleteUser = async (userId) => {
    setLiveUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
    try {
      if (onDeleteUser) await onDeleteUser(userId);
      else await api.deleteUser(userId);
      const fresh = await api.fetchUsers();
      if (fresh) setLiveUsers(fresh);
    } catch (e) {
      console.warn('Delete user:', e);
      const fresh = await api.fetchUsers();
      if (fresh) setLiveUsers(fresh);
    }
  };

  const handlePortalApproveVendor = async (vendorId) => {
    try {
      const res = await api.approveVendor(vendorId);
      if (res && res.success) {
        setSuperToasts(prev => [
          ...prev.slice(-4),
          {
            toastId: `stoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title: 'Vendor Approved',
            message: res.message || 'Vendor account successfully approved and activated.'
          }
        ]);
        await loadAllPortalData();
        return res;
      } else {
        throw new Error(res?.error || 'Failed to approve vendor.');
      }
    } catch (err) {
      console.error('Approve vendor error:', err);
      setSuperToasts(prev => [
        ...prev.slice(-4),
        {
          toastId: `stoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: 'Approval Failed',
          message: err.message || 'Error occurred while approving vendor.'
        }
      ]);
      throw err;
    }
  };

  useEffect(() => {
    loadAllPortalData();
    const interval = setInterval(loadAllPortalData, 3500); // 3.5s real-time periodic polling
    
    const handleNewBooking = (e) => {
      if (e.detail) {
        setLiveBookings(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
      }
      loadAllPortalData();
    };

    const handleSync = () => {
      loadAllPortalData();
    };

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('booking-updated', handleSync);
    window.addEventListener('booking-deleted', handleSync);
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('tripgalileo-booking-sync', handleSync);
    window.addEventListener('authoritative-notification-received', handleSync);
    window.addEventListener('realtime-lead-created', handleSync);
    window.addEventListener('lead_created', handleSync);
    window.addEventListener('ai_leads_updated', handleSync);
    window.addEventListener('driver-assigned', handleSync);
    window.addEventListener('driver-status-updated', handleSync);
    window.addEventListener('b2b-booking-created', handleSync);
    window.addEventListener('b2b-partner-updated', handleSync);
    window.addEventListener('pms-notification-updated', handleSync);

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
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('booking-updated', handleSync);
      window.removeEventListener('booking-deleted', handleSync);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      window.removeEventListener('authoritative-notification-received', handleSync);
      window.removeEventListener('realtime-lead-created', handleSync);
      window.removeEventListener('lead_created', handleSync);
      window.removeEventListener('ai_leads_updated', handleSync);
      window.removeEventListener('driver-assigned', handleSync);
      window.removeEventListener('driver-status-updated', handleSync);
      window.removeEventListener('b2b-booking-created', handleSync);
      window.removeEventListener('b2b-partner-updated', handleSync);
      window.removeEventListener('pms-notification-updated', handleSync);
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, []);

  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Helper to determine booking category accurately
  const getBookingCategory = (b) => {
    const itemId = String(b.item_id || '').toLowerCase();
    const itemName = String(b.item_name || b.name || '').toLowerCase();
    const type = String(b.type || b.item_type || '').toLowerCase();
    const pkgType = String(b.package_type || '').toLowerCase();

    // 1. Standalone Flight
    if (type === 'flight' || b.flight_id || b.flight_number || itemId.startsWith('fl-') || itemId.startsWith('flt-') || itemId.startsWith('flight-') ||
        itemName.includes('flight') || itemName.includes('air india') || itemName.includes('indigo') || itemName.includes('vistara') || itemName.includes('akasa')) {
      return { tab: 'flight_bookings', type: 'Flight Booking', color: '#6366f1' };
    }

    // Custom packages / Craft My Trip are strictly Trip Bookings
    const isMultiItemOrPackage = itemName.includes('craft my trip') || itemName.includes('custom trip') || 
                                 itemName.includes('package') || itemName.includes('tour') || 
                                 itemName.includes('experience') || itemName.includes('self drive') ||
                                 pkgType.includes('package') || pkgType.includes('self_drive');

    if (isMultiItemOrPackage) {
      return { tab: 'trip_bookings', type: 'Package / Holiday Booking', color: '#f97316' };
    }

    // 2. Standalone Hotel
    if (type === 'hotel' || b.hotel_id || b.room_id || b.room_type || itemId.startsWith('hotel-') || itemId.startsWith('htl-') || 
        (!itemId.startsWith('car-') && !itemId.startsWith('bike-') && !itemId.startsWith('veh-') && !itemId.startsWith('pkg-') && (
          itemName.includes('marriott') || itemName.includes('taj') || itemName.includes('resort') || 
          itemName.includes('hotel') || itemName.includes('stay') || itemName.includes('villa') || 
          itemName.includes('suite') || itemName.includes('palms') || itemName.includes('inn') || 
          itemName.includes('cidade') || itemName.includes('leela') || itemName.includes('alila') || 
          itemName.includes('moustache') || itemName.includes('exotica')
        ))) {
      return { tab: 'hotel_bookings', type: 'Hotel Stay Booking', color: '#0284c7' };
    }

    // 3. Standalone Vehicle
    if (['vehicle', 'car', 'bike', 'rental'].includes(type) || b.vehicle_id || b.car_id || b.bike_id || 
        itemId.startsWith('car-') || itemId.startsWith('bike-') || itemId.startsWith('veh-') || 
        itemName.includes('thar') || itemName.includes('swift') || itemName.includes('creta') || itemName.includes('scooter') || itemName.includes('activa')) {
      return { tab: 'vehicle_bookings', type: 'Vehicle Rental Booking', color: '#ea580c' };
    }

    // 4. Standalone Sightseeing & Activity
    if (type === 'activity' || type === 'sightseeing' || pkgType === 'activity' || pkgType === 'sightseeing' ||
        itemId.startsWith('act-') || itemId.startsWith('activity-') || itemId.startsWith('sight-') || itemId.startsWith('act_')) {
      return { tab: 'activity_bookings', type: 'Sightseeing & Activity Booking', color: '#10b981' };
    }

    return { tab: 'trip_bookings', type: 'Package / Holiday Booking', color: '#f97316' };
  };

  // Compute unified notifications from real data
  const bookingNotifs = (liveBookings || []).map(b => {
    const cat = getBookingCategory(b);
    const isActionable = b.status === 'Draft' || b.status === 'Pending' || b.status === 'Payment Verification Pending' || b.status === 'New' || b.status === 'CONFIRMED' || b.status === 'Confirmed';
    return {
      id: `b-${b.id}`,
      type: 'booking',
      title: `${cat.type} #${b.id}`,
      message: `${b.name || b.customer_name || 'Customer'} — ${b.item_name || 'Item'} (${b.status || 'Enquiry'} • ₹${parseFloat(b.total_paid || b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')})`,
      time: b.created_at?.slice(0, 16) || 'Recent',
      color: cat.color,
      tab: cat.tab,
      isActionable
    };
  });

  const enquiryNotifs = (customEnquiries || []).map(e => ({
    id: `e-${e.enquiry_id || e.id}`,
    type: 'enquiry',
    title: `Custom Trip Enquiry #${e.enquiry_id || e.id}`,
    message: `${e.customer_name || 'Customer'} inquired for ${e.destinations || 'Goa Custom Trip'} (${e.travel_dates || 'Flexible Dates'})`,
    time: e.created_at?.slice(0, 16) || 'Recent',
    color: '#8b5cf6',
    tab: 'trip_bookings',
    isActionable: e.status === 'New Enquiry' || !e.status || e.status === 'Pending'
  }));

  const leadNotifs = (aiLeads || []).map(l => ({
    id: `l-${l.id}`,
    type: 'lead',
    title: `Sophia AI Lead: ${l.name}`,
    message: `Customer ${l.name} (${l.phone || 'No phone'}) chatted with Sophia AI`,
    time: l.created_at?.slice(0, 16) || 'Recent',
    color: '#059669',
    tab: 'lead_management',
    isActionable: true
  }));

  const kycNotifs = (liveVendors || []).filter(v => !v.verified).map(v => ({
    id: `v-${v.id}`,
    type: 'kyc',
    title: 'Vendor KYC Pending',
    message: `${v.name || v.username} (${v.vendor_type || 'Vendor'}) is awaiting KYC verification`,
    time: 'Action Required',
    color: '#ca8a04',
    tab: 'vendor_verification',
    isActionable: true
  }));

  const driverNotifs = (liveDrivers || []).filter(d => (d.status || '').toLowerCase() === 'pending').map(d => ({
    id: `drv-${d.id}`,
    type: 'driver',
    title: 'Driver Approval Pending',
    message: `Driver ${d.name || d.phone} (${d.vehicle_details || 'Fleet'}) requires document verification & approval`,
    time: 'Action Required',
    color: '#3b82f6',
    tab: 'drivers',
    isActionable: true
  }));

  const b2bNotifs = (liveB2BPartners || []).filter(p => (p.status || '').toLowerCase() === 'pending').map(p => ({
    id: `b2b-${p.id}`,
    type: 'b2b',
    title: 'B2B Partner Application',
    message: `Partner ${p.company_name || p.contact_name || p.username} submitted B2B registration`,
    time: 'Action Required',
    color: '#8b5cf6',
    tab: 'b2b_applications',
    isActionable: true
  }));

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cleared_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Combine and sort by date descending
  const notificationsList = [...kycNotifs, ...driverNotifs, ...b2bNotifs, ...bookingNotifs, ...enquiryNotifs, ...leadNotifs].sort((a, b) => {
    if (a.time === 'Action Required') return -1;
    if (b.time === 'Action Required') return 1;
    return (b.time || '').localeCompare(a.time || '');
  });

  const activeNotifications = notificationsList.filter(n => !clearedNotifIds.includes(n.id));
  const unreadCount = activeNotifications.filter(n => n.isActionable && !readNotifIds.includes(n.id)).length;

  const handleMarkAllRead = (e) => {
    if (e) e.stopPropagation();
    const allIds = activeNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('read_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    const allIds = [...clearedNotifIds, ...notificationsList.map(n => n.id)];
    setClearedNotifIds(allIds);
    try {
      localStorage.setItem('cleared_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleDismissNotification = (e, id) => {
    e.stopPropagation();
    const updated = [...clearedNotifIds, id];
    setClearedNotifIds(updated);
    try {
      localStorage.setItem('cleared_notifs', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleNotificationClick = (n) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('read_notifs', JSON.stringify(updated));
      } catch (err) {}
    }
    handleTabChange(n.tab);
    setShowNotificationDropdown(false);
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B2E 0%, #1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Shield size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Master Console Access</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>This area requires Superadmin credentials</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Master Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex w-100 position-relative" style={{ height: '100vh', background: '#0f1923', overflow: 'hidden' }}>
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
      <div
        className="d-flex flex-column flex-shrink-0"
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? '260px' : (sidebarOpen ? '260px' : '0px'),
          minWidth: isMobile ? '260px' : (sidebarOpen ? '260px' : '0px'),
          maxWidth: isMobile ? '85vw' : 'none',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#0D1B2E',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: isMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.3s ease, min-width 0.3s ease',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          zIndex: isMobile ? 1050 : 'auto',
          boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
          flexShrink: 0
        }}
      >
        {/* Brand */}
        <div className="px-4 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Compass size={24} style={{ color: '#FF6333' }} />
          <div>
            <div className="fw-extrabold text-white" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>TRIPGALILEO</div>
            <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#FF6333' }}>Superadmin ERP</div>
          </div>
        </div>

        {/* Nav */}
        <div 
          className="flex-grow-1 py-2 custom-sidebar-scroll"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {SIDEBAR_GROUPS.map((group, idx) => {
            const hasActive = group.items.some(it => it.id === activeTab);
            const isDefaultOpen = hasActive || (idx === 0 && !SIDEBAR_GROUPS.some(g => g.items.some(it => it.id === activeTab)));
            return (
              <SidebarGroup 
                key={group.label} 
                group={group} 
                activeTab={activeTab} 
                onSelect={handleTabChange} 
                defaultOpen={isDefaultOpen} 
              />
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden', minWidth: 0, width: '100%' }}>
        {/* Top Bar */}
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }} aria-label="Toggle sidebar">
              <Menu size={20} />
            </button>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{PAGE_TITLES[activeTab] || 'Dashboard'}</div>
              <div className="text-white-50" style={{ fontSize: '0.68rem' }}>TripGalileo Master Control Panel</div>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill d-none d-sm-flex" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              System Online
            </span>

            {/* Notification Bell with Badge */}
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
                <Bell size={18} style={{ color: unreadCount > 0 ? '#FF6333' : 'rgba(255,255,255,0.7)' }} />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-dark"
                    style={{ fontSize: '0.6rem', padding: '0.25em 0.45em' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
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
                    overflow: 'hidden'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    {/* Left: Title + Badge */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <Bell size={15} className="text-warning flex-shrink-0" />
                      <span className="fw-bold text-white small text-nowrap">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill text-nowrap" style={{ fontSize: '0.62rem', padding: '0.22em 0.5em', fontWeight: 700 }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Right: Sound Control + Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <NotificationSoundToggle variant="dark" />
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-white-50 border-0 text-nowrap"
                          style={{ fontSize: '0.68rem', textDecoration: 'underline' }}
                          onClick={handleMarkAllRead}
                        >
                          Mark read
                        </button>
                      )}
                      {activeNotifications.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm px-2 py-0.5 text-danger border border-danger border-opacity-40 rounded text-nowrap fw-semibold"
                          style={{ fontSize: '0.66rem', background: 'rgba(220,38,38,0.1)' }}
                          onClick={handleClearAll}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeNotifications.length === 0 ? (
                      <div className="p-4 text-center text-white-50 small">
                        No active notifications
                      </div>
                    ) : (
                      activeNotifications.slice(0, 10).map((n) => {
                        const isUnread = !readNotifIds.includes(n.id) && n.isActionable;
                        const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);

                        return (
                          <div
                            key={n.id}
                            className="px-3 py-2.5 border-bottom border-secondary border-opacity-10 cursor-pointer d-flex align-items-start justify-content-between gap-2"
                            style={{ background: isUnread ? 'rgba(255,99,51,0.08)' : 'transparent', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(255,99,51,0.08)' : 'transparent'}
                            onClick={() => handleNotificationClick(n)}
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
                              onClick={(e) => handleDismissNotification(e, n.id)}
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
                        handleTabChange('notifications');
                        setShowNotificationDropdown(false);
                      }}
                    >
                      View All Notifications ({activeNotifications.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

              {/* Profile Menu */}
              {(() => {
                const displayName = currentUser?.username || currentUser?.name || currentUser?.email || 'Superadmin';
                const initial = (displayName[0] || 'S').toUpperCase();
                return (
                  <div className="position-relative">
                    <button
                      className="btn p-0 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', border: '2px solid #FF6333', background: 'linear-gradient(135deg,#FFC107,#FF8A00)' }}
                      onClick={() => {
                        setShowProfileDropdown(!showProfileDropdown);
                        setShowNotificationDropdown(false);
                      }}
                      aria-label="Profile menu"
                    >
                      <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{initial}</span>
                    </button>
                    {showProfileDropdown && (
                      <div className="position-absolute shadow-lg" style={{ right: 0, top: '48px', minWidth: '200px', background: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1050 }} onClick={e => e.stopPropagation()}>
                        <div className="text-center px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-2" style={{ width: '44px', height: '44px', fontSize: '18px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', color: '#000' }}>
                            {initial}
                          </div>
                          <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{displayName}</div>
                          <span className="badge mt-1" style={{ background: 'rgba(255,99,51,0.15)', color: '#FF6333', fontSize: '0.6rem' }}>SUPERADMIN</span>
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
        <div className="flex-grow-1 overflow-auto" style={{ background: '#f0f2f5', minWidth: 0, width: '100%' }}>
          {activeTab === 'reviews' ? (
            <AdminReviewsManagement portalTitle="Super Admin Portal" onSelectTab={handleTabChange} />
          ) : activeTab === 'storefront_leads' ? (
            <AdminStorefrontLeadsTab />
          ) : (
            <SuperAdminDashboard
              activeTab={activeTab}
              onNavigate={handleTabChange}
              usersList={Array.isArray(liveUsers) ? liveUsers : []}
              vendors={Array.isArray(liveVendors) ? liveVendors : []}
              cars={cars || []}
              bikes={bikes || []}
              hotels={hotels || []}
              bookings={Array.isArray(liveBookings) ? liveBookings : []}
              aiLeads={Array.isArray(aiLeads) ? aiLeads : []}
              customEnquiries={Array.isArray(customEnquiries) ? customEnquiries : []}
              b2bPartners={Array.isArray(liveB2BPartners) ? liveB2BPartners : []}
              b2bBookings={Array.isArray(liveB2BBookings) ? liveB2BBookings : []}
              drivers={Array.isArray(liveDrivers) ? liveDrivers : []}
              currentUser={currentUser}
              onRefreshLeads={loadAllPortalData}
              onAddUser={handlePortalAddUser}
              onUpdateUser={handlePortalUpdateUser}
              onDeleteUser={handlePortalDeleteUser}
              onApproveVendor={handlePortalApproveVendor}
              allPackages={allPackages}
              onAddPackage={onAddPackage}
              onUpdatePackage={onUpdatePackage}
              onDeletePackage={onDeletePackage}
              flights={flights}
            />
          )}
        </div>
      </div>

      {/* Floating SuperAdmin Live Toasts */}
      {superToasts.length > 0 && (
        <div 
          className="position-fixed d-flex flex-column gap-2"
          style={{ bottom: '24px', right: '24px', zIndex: 99999, maxWidth: '380px', pointerEvents: 'auto' }}
        >
          {superToasts.map(toast => {
            const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(toast.title, toast.message);
            return (
              <div
                key={toast.toastId}
                className="card shadow-lg border rounded-4 p-3 d-flex flex-row align-items-start gap-3 animate__animated animate__fadeInUp"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderColor: 'rgba(234, 179, 8, 0.4)',
                  color: '#fff',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                  minWidth: '320px'
                }}
              >
                <div 
                  className="rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}
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
                  onClick={() => setSuperToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
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
    </div>
  );
}
