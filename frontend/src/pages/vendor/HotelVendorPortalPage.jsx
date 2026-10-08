import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building, PlusCircle, BedDouble, CalendarDays, Tag, Lock,
  BookOpen, FilePlus, ConciergeBell, LogIn, LogOut as LogOutIcon, Users,
  Star, CreditCard, FileText, BarChart2, Bell, Headphones, UserCircle,
  Landmark, Settings, Activity, ChevronDown, ChevronRight, Menu, X,
  Compass, LogOut, Shield, Sparkles, Trash2, CheckCheck, ArrowRight, Check,
  Globe
} from 'lucide-react';
import * as api from '../../services/api';
import VendorStorefrontWizard from '../../components/vendor/VendorStorefrontWizard';

// PMS Module Imports
import PMSDashboard from './pms/PMSDashboard';
import PMSMyHotels from './pms/PMSMyHotels';
import PMSAddHotelWizard from './pms/PMSAddHotelWizard';
import PMSRoomTypes from './pms/PMSRoomTypes';
import PMSAvailabilityCalendar from './pms/PMSAvailabilityCalendar';
import PMSRatePlans from './pms/PMSRatePlans';
import PMSAllBookings from './pms/PMSAllBookings';
import PMSCreateBooking from './pms/PMSCreateBooking';
import PMSFrontDesk from './pms/PMSFrontDesk';
import PMSGuestDirectory from './pms/PMSGuestDirectory';
import PMSReviews from './pms/PMSReviews';
import PMSPayments from './pms/PMSPayments';
import PMSReports from './pms/PMSReports';
import PMSStaff from './pms/PMSStaff';
import VendorPaymentSettings from './VendorPaymentSettings';
import PMSNotifications from './pms/PMSNotifications';
import PMSSupport from './pms/PMSSupport';
import PMSVendorProfile from './pms/PMSVendorProfile';
import PMSSettings from './pms/PMSSettings';
import PMSActivityLog from './pms/PMSActivityLog';
import PMSPaymentVerification from './pms/PMSPaymentVerification';
import VendorWallet from '../../components/vendor/VendorWallet';
import PMSPaymentSettings from './pms/PMSPaymentSettings';
import VendorNotificationBell from '../../components/vendor/VendorNotificationBell';
import VendorCancellationPolicyManager from '../../components/vendor/VendorCancellationPolicyManager';
import VendorSuspendedBanner from '../../components/vendor/VendorSuspendedBanner';
import VendorRechargeReminderBanner from '../../components/vendor/VendorRechargeReminderBanner';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }
    ]
  },
  {
    label: 'Property Management',
    items: [
      { id: 'my_hotels', label: 'My Hotels', icon: <Building size={16} /> },
      { id: 'add_hotel', label: 'Add Hotel', icon: <PlusCircle size={16} /> },
      { id: 'room_types', label: 'Rooms & Room Types', icon: <BedDouble size={16} /> },
      { id: 'availability', label: 'Availability Calendar', icon: <CalendarDays size={16} /> },
      { id: 'rate_plans', label: 'Rates & Offers', icon: <Tag size={16} /> },
      { id: 'restrictions', label: 'Booking Restrictions', icon: <Lock size={16} /> }
    ]
  },
  {
    label: 'Reservations',
    items: [
      { id: 'all_bookings', label: 'All Bookings', icon: <BookOpen size={16} /> },
      { id: 'create_booking', label: 'Create Booking', icon: <FilePlus size={16} /> }
    ]
  },
  {
    label: 'Front Desk',
    items: [
      { id: 'arrivals', label: 'Arrivals', icon: <LogIn size={16} /> },
      { id: 'departures', label: 'Departures', icon: <LogOutIcon size={16} /> },
      { id: 'inhouse', label: 'In-house Guests', icon: <ConciergeBell size={16} /> }
    ]
  },
  {
    label: 'Guests',
    items: [
      { id: 'guests', label: 'Guest Directory', icon: <Users size={16} /> },
      { id: 'reviews', label: 'Reviews & Ratings', icon: <Star size={16} /> }
    ]
  },
  {
    label: 'Finance',
    items: [
      { id: 'payment_verification', label: 'Payment Verification', icon: <CreditCard size={16} /> },
      { id: 'wallet', label: 'Platform Wallet', icon: <Landmark size={16} /> },
      { id: 'payments', label: 'Booking Payments', icon: <CreditCard size={16} /> },
      { id: 'payment_settings', label: 'Payment Settings', icon: <Settings size={16} /> },
      { id: 'cancellation_policy', label: 'Cancellation Policy', icon: <Shield size={16} /> },
      { id: 'billing', label: 'Subscription & Billing', icon: <FileText size={16} /> }
    ]
  },
  {
    label: 'Management',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: <BarChart2 size={16} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
      { id: 'support', label: 'Support', icon: <Headphones size={16} /> }
    ]
  },
  {
    label: 'Online Storefront',
    items: [
      { id: 'website_builder', label: 'My Website', icon: <Globe size={16} /> }
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Vendor Profile', icon: <UserCircle size={16} /> },
      { id: 'bank_details', label: 'Bank Details', icon: <Landmark size={16} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      { id: 'activity_log', label: 'Activity Log', icon: <Activity size={16} /> }
    ]
  }
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  my_hotels: 'My Hotels',
  add_hotel: 'Add Hotel',
  room_types: 'Rooms & Room Types',
  availability: 'Availability Calendar',
  rate_plans: 'Rates & Offers',
  restrictions: 'Booking Restrictions',
  all_bookings: 'All Bookings',
  create_booking: 'Create Booking',
  arrivals: 'Today\'s Arrivals',
  departures: 'Today\'s Departures',
  inhouse: 'In-house Guests',
  guests: 'Guest Directory',
  payment_verification: 'Payment Verification',
  wallet: 'Platform Wallet',
  payments: 'Booking Payments',
  payment_settings: 'Payment Settings',
  cancellation_policy: 'Cancellation Policy',
  website_builder: 'My Website Storefront',
  settlements: 'Settlements',
  billing: 'Subscription & Billing',
  staff: 'Staff & Permissions',
  reports: 'Reports & Analytics',
  notifications: 'Notifications',
  support: 'Support',
  profile: 'Vendor Profile',
  bank_details: 'Bank Details',
  settings: 'Settings',
  activity_log: 'Activity Log'
};

function SidebarGroup({ group, activeTab, onSelect, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen || group.items.some(i => i.id === activeTab));

  useEffect(() => {
    if (group.items.some(i => i.id === activeTab)) setOpen(true);
  }, [activeTab]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex align-items-center justify-content-between px-3 py-2 border-0 text-white-50"
        style={{ background: 'transparent', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}
      >
        <span>{group.label}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0">
          {group.items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="btn w-100 text-start d-flex align-items-center gap-3 py-2 px-3 border-0 rounded-pill mb-1 mx-auto"
              style={{
                fontSize: '0.85rem',
                background: activeTab === item.id ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
                boxShadow: activeTab === item.id ? '0 4px 12px rgba(255, 99, 51, 0.3)' : 'none',
                fontWeight: activeTab === item.id ? 700 : 400,
                width: 'calc(100% - 8px)'
              }}
            >
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotelVendorPortalPage({
  currentUser,
  triggerOpenLogin,
  hotels,
  onAddHotel,
  onUpdateHotel,
  onDeleteHotel,
  onLogout,
  bookings = []
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshNotifications = async () => {
    try {
      if (currentUser?.id) {
        const res = await api.pmsListNotifications(currentUser.id);
        if (res) {
          if (res.unread_count !== undefined) setUnreadNotifications(res.unread_count);
          if (Array.isArray(res.notifications)) setNotificationsList(res.notifications);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    window.addEventListener('pms-notification-updated', refreshNotifications);
    window.addEventListener('new-booking-created', refreshNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pms-notification-updated', refreshNotifications);
      window.removeEventListener('new-booking-created', refreshNotifications);
    };
  }, [currentUser?.id]);

  const handleNavigate = (tab, hotelId = null) => {
    setEditingHotelId(hotelId);
    setActiveTab(tab);
  };

  const handleNotificationClick = async (n) => {
    setShowNotificationsDropdown(false);
    if (!n.is_read) {
      try {
        await api.pmsMarkNotificationRead(n.id, currentUser.id);
        setNotificationsList(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
        setUnreadNotifications(prev => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent('pms-notification-updated'));
      } catch (err) {}
    }
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();
    
    if (type === 'booking' || title.includes('booking') || title.includes('reservation') || msg.includes('reservation') || msg.includes('#bk-')) {
      setActiveTab('all_bookings');
    } else if (type === 'hotel' || type === 'approval' || title.includes('hotel') || title.includes('registered')) {
      setActiveTab('my_hotels');
    } else if (type === 'payment' || title.includes('payment') || title.includes('settlement')) {
      setActiveTab('payments');
    } else if (type === 'review' || title.includes('review') || title.includes('rating')) {
      setActiveTab('reviews');
    } else if (type === 'support' || title.includes('ticket')) {
      setActiveTab('support');
    } else {
      setActiveTab('notifications');
    }
  };

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.pmsMarkNotificationRead(null, currentUser.id, true);
      setUnreadNotifications(0);
      setNotificationsList(prev => prev.map(n => ({ ...n, is_read: 1 })));
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) { console.error(err); }
  };

  const handleClearAllNotifs = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.pmsDeleteNotification(null, currentUser.id, true);
      setUnreadNotifications(0);
      setNotificationsList([]);
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) { console.error(err); }
  };

  const handleRemoveSingleNotif = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.pmsDeleteNotification(id, currentUser.id);
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) { console.error(err); }
  };

  if (!currentUser || currentUser.role !== 'hotel_vendor') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Building size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Hotel Operator Console</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Sign in with your hotel vendor account to continue</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Hotel Console
          </button>
        </div>
      </div>
    );
  }

  const vendorHotels = (hotels || []).filter((h, idx, self) => {
    const isOwner = 
      h.vendor_id === currentUser?.id ||
      h.vendor_id === currentUser?.username ||
      (currentUser?.id && h.vendor_id && String(h.vendor_id).toLowerCase() === String(currentUser.id).toLowerCase()) ||
      (h.admin_id && h.admin_id === currentUser?.username) ||
      (currentUser?.role === 'hotel_vendor' && (!h.vendor_id || h.vendor_id === 'u-5' || h.vendor_id === 'u-4' || h.vendor_id === 'vendor-3' || h.vendor_id === 'hotel_vendor'));
    return isOwner && self.findIndex(other => other.id === h.id) === idx;
  });
  
  const vendorBookings = (bookings || []).filter(b => {
    const isHotel = b.type === 'hotel' || String(b.item_id).startsWith('hotel-') || b.property_type || b.stars || b.hotel_name || b.room_type;
    if (!isHotel) return false;
    if (vendorHotels.length === 0) return true;
    return vendorHotels.some(h => 
      h.id === b.item_id || 
      h.id === b.hotel_id || 
      (b.item_name && h.name && b.item_name.toLowerCase().includes(h.name.toLowerCase())) ||
      (b.hotel_name && h.name && b.hotel_name.toLowerCase().includes(h.name.toLowerCase()))
    ) || (!b.vendor_id || b.vendor_id === currentUser?.id || b.vendor_id === currentUser?.username);
  });

  const filteredSidebarGroups = SIDEBAR_GROUPS;

  const commonProps = {
    currentUser,
    vendorHotels,
    vendorBookings,
    allBookings: bookings,
    onAddHotel,
    onUpdateHotel,
    onDeleteHotel,
    onNavigate: handleNavigate
  };

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard': return <PMSDashboard {...commonProps} />;
      case 'my_hotels': return <PMSMyHotels {...commonProps} />;
      case 'add_hotel': return <PMSAddHotelWizard {...commonProps} editingHotelId={editingHotelId} onComplete={() => handleNavigate('my_hotels')} />;
      case 'room_types': return <PMSRoomTypes {...commonProps} />;
      case 'availability': return <PMSAvailabilityCalendar {...commonProps} />;
      case 'rate_plans': return <PMSRatePlans {...commonProps} />;
      case 'restrictions': return <PMSRoomTypes mode="restrictions" {...commonProps} />;
      case 'all_bookings': return <PMSAllBookings {...commonProps} />;
      case 'create_booking': return <PMSCreateBooking {...commonProps} onComplete={() => setActiveTab('all_bookings')} />;
      case 'arrivals': return <PMSFrontDesk mode="arrivals" {...commonProps} />;
      case 'departures': return <PMSFrontDesk mode="departures" {...commonProps} />;
      case 'inhouse': return <PMSFrontDesk mode="inhouse" {...commonProps} />;
      case 'guests': return <PMSGuestDirectory {...commonProps} />;
      case 'reviews': return <PMSReviews {...commonProps} />;
      case 'payments': return <PMSPayments mode="payments" {...commonProps} />;
      case 'settlements': return <PMSPayments mode="settlements" {...commonProps} />;
      case 'billing': return <PMSPayments mode="billing" {...commonProps} />;
      case 'staff': return <PMSStaff {...commonProps} />;
      case 'reports': return <PMSReports {...commonProps} />;
      case 'notifications': return <PMSNotifications {...commonProps} onNotificationClick={handleNotificationClick} />;
      case 'support': return <PMSSupport {...commonProps} />;
      case 'profile': return <PMSVendorProfile {...commonProps} />;
      case 'bank_details': return <PMSVendorProfile mode="bank" {...commonProps} />;
      case 'settings': return <PMSSettings {...commonProps} />;
      case 'activity_log': return <PMSActivityLog {...commonProps} />;
      case 'payment_verification': return <PMSPaymentVerification {...commonProps} />;
      case 'wallet': return <VendorWallet currentUser={currentUser} />;
      case 'payment_settings': return <PMSPaymentSettings {...commonProps} />;
      case 'cancellation_policy': return <VendorCancellationPolicyManager currentUser={currentUser} serviceType="hotel" />;
      case 'website_builder': 
        return (
          <VendorStorefrontWizard 
            currentUser={currentUser} 
            vendorType="hotel" 
            inventory={vendorHotels} 
            onExit={() => setActiveTab('dashboard')} 
          />
        );
      default: return <PMSDashboard {...commonProps} />;
    }
  };

  return (
    <div className="d-flex w-100 text-start" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        className="d-flex flex-column position-relative"
        style={{
          width: sidebarOpen ? '270px' : '0px',
          minWidth: sidebarOpen ? '270px' : '0px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#0D1B2E',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.3s ease',
          flexShrink: 0
        }}
      >
        {/* Brand */}
        <div className="p-3 border-bottom d-flex align-items-center gap-2 mb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#FF6333' }}><Compass size={26} /></div>
          <div>
            <span className="fw-extrabold text-white" style={{ fontSize: '17px' }}>WOW GOA</span>
            <span className="d-block text-uppercase fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '1.5px', color: '#00B8D9' }}>Hotel Operator PMS</span>
          </div>
        </div>

        {/* Nav Groups */}
        <div className="flex-grow-1 px-2 py-2">
          {filteredSidebarGroups.map((group, idx) => (
            <SidebarGroup
              key={group.label}
              group={group}
              activeTab={activeTab}
              onSelect={setActiveTab}
              defaultOpen={idx === 0 || idx === 1}
            />
          ))}
        </div>

        {/* Logout */}
        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={onLogout}
            className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-pill text-white"
            style={{ background: 'rgba(255,99,51,0.12)', color: '#FF6333', fontSize: '0.85rem' }}
          >
            <LogOut size={16} style={{ color: '#FF6333' }} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header className="px-4 py-2 d-flex justify-content-between align-items-center shadow-sm flex-shrink-0" style={{ backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: '56px' }}>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-sm p-1 d-flex align-items-center text-white-50 border-0"
              style={{ background: 'transparent' }}
            >
              <Menu size={20} />
            </button>
            <div>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>{PAGE_TITLES[activeTab] || 'PMS'}</h6>
              <span className="text-white-50" style={{ fontSize: '0.7rem' }}>Manage your hotel properties, reservations, guests, room availability and settlements</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Online badge */}
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ backgroundColor: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              PMS Online
            </span>

            {/* Notifications quick button & Interactive Pop-up */}
            <VendorNotificationBell
              currentUser={currentUser}
              vendorType="hotel"
              bookings={bookings}
              onNavigate={handleNavigate}
            />

            {/* Profile */}
            <div className="position-relative">
              <button
                className="btn p-0 rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                style={{ width: '38px', height: '38px', border: '2px solid #FF6333', background: 'transparent' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="text-dark d-flex align-items-center justify-content-center fw-bold" style={{ width: '100%', height: '100%', fontSize: '15px', background: 'linear-gradient(135deg, #FFC107, #FF8A00)' }}>
                  {currentUser.username[0].toUpperCase()}
                </div>
              </button>

              {showProfileDropdown && (
                <div className="dropdown-menu dropdown-menu-end show shadow-lg border-0 mt-2 position-absolute" style={{ right: 0, minWidth: '200px', zIndex: 1050, backgroundColor: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-3 border-bottom text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-2" style={{ width: '48px', height: '48px', fontSize: '20px', background: 'linear-gradient(135deg, #FFC107, #FF8A00)' }}>
                      {currentUser.username[0].toUpperCase()}
                    </div>
                    <h6 className="mb-0 fw-bold text-white">{currentUser.username}</h6>
                    <span className="badge mt-1" style={{ backgroundColor: 'rgba(0,184,217,0.15)', color: '#00B8D9', fontSize: '0.65rem' }}>Hotel Vendor</span>
                  </div>
                  <div className="p-2">
                    <button className="dropdown-item text-white-50 rounded py-2 d-flex align-items-center gap-2" onClick={() => { setShowProfileDropdown(false); setActiveTab('profile'); }}>
                      <UserCircle size={14} /> My Profile
                    </button>
                    <button className="dropdown-item text-white-50 rounded py-2 d-flex align-items-center gap-2" onClick={() => { setShowProfileDropdown(false); setActiveTab('settings'); }}>
                      <Settings size={14} /> Settings
                    </button>
                    <hr className="my-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                    <button className="dropdown-item rounded py-2 fw-bold d-flex align-items-center gap-2" style={{ color: '#FF6333' }} onClick={onLogout}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Module Content */}
        <div className="flex-grow-1 overflow-auto p-0">
          <VendorSuspendedBanner 
            vendorId={currentUser?.id} 
            onRechargeClick={() => setActiveTab('wallet')} 
          />
          <VendorRechargeReminderBanner
            vendorId={currentUser?.id}
            onRechargeClick={() => setActiveTab('wallet')}
          />
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
