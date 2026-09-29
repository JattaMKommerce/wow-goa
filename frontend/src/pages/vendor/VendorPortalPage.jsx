import React, { useState, useEffect } from 'react';
import {
  Compass, LogOut, Car, Shield, LayoutDashboard, Calendar,
  Wallet, BarChart2, Settings, CreditCard, Users, DollarSign,
  ChevronDown, ChevronRight, Menu
} from 'lucide-react';
import VehiclePMSDashboard from './vehicle-pms/VehiclePMSDashboard';
import VehicleFleetManagement from './vehicle-pms/VehicleFleetManagement';
import VehicleBookingManagement from './vehicle-pms/VehicleBookingManagement';
import VehicleCustomerManagement from './vehicle-pms/VehicleCustomerManagement';
import VehicleFleetCalendar from './vehicle-pms/VehicleFleetCalendar';
import VehiclePricing from './vehicle-pms/VehiclePricing';
import VendorWallet from '../../components/vendor/VendorWallet';
import PMSPaymentSettings from './pms/PMSPaymentSettings';
import VehicleReports from './vehicle-pms/VehicleReports';
import VehicleVendorProfileSettings from './vehicle-pms/VehicleVendorProfileSettings';
import VendorDashboard from './VendorDashboard';
import VendorNotificationBell from '../../components/vendor/VendorNotificationBell';
import VendorCancellationPolicyManager from '../../components/vendor/VendorCancellationPolicyManager';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }]
  },
  {
    label: 'Fleet',
    items: [
      { id: 'fleet', label: 'Fleet Management', icon: <Car size={15} /> },
      { id: 'calendar', label: 'Fleet Calendar', icon: <Calendar size={15} /> },
      { id: 'pricing', label: 'Pricing', icon: <DollarSign size={15} /> },
    ]
  },
  {
    label: 'Bookings',
    items: [
      { id: 'bookings', label: 'All Bookings', icon: <Calendar size={15} /> },
      { id: 'customers', label: 'Customers', icon: <Users size={15} /> },
    ]
  },
  {
    label: 'Finance',
    items: [
      { id: 'wallet', label: 'Wallet', icon: <Wallet size={15} /> },
      { id: 'payment_settings', label: 'Payment Settings', icon: <CreditCard size={15} /> },
      { id: 'cancellation_policy', label: 'Cancellation Policy', icon: <Shield size={15} /> },
    ]
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', icon: <BarChart2 size={15} /> },
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', label: 'Profile & Settings', icon: <Settings size={15} /> },
    ]
  }
];

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : group.items.some(i => i.id === activeTab));
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0" style={{ background: 'transparent', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>
        <span>{group.label}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1">
          {group.items.map(item => (
            <button key={item.id} onClick={() => onSelect(item.id)} className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1" style={{ fontSize: '0.83rem', background: activeTab === item.id ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : 'transparent', color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)', boxShadow: activeTab === item.id ? '0 4px 12px rgba(255,99,51,0.3)' : 'none', fontWeight: activeTab === item.id ? 700 : 400 }}>
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VendorPortalPage({
  currentUser,
  triggerOpenLogin,
  vendors,
  cars = [],
  bikes = [],
  onAddCar,
  onAddBike,
  onUpdateCar,
  onUpdateBike,
  onDeleteCar,
  onDeleteBike,
  onLogout,
  bookings = [],
  setBookingsList,
  onRefreshVehicles
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (onRefreshVehicles) {
      onRefreshVehicles();
    }
  }, [onRefreshVehicles]);

  const handleNavigate = (tab, params = {}) => {
    setActiveTab(tab);
    setTabParams(params || {});
  };

  if (!currentUser || currentUser.role !== 'vendor') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Car size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Vehicle Vendor Console</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Sign in with your vehicle vendor account to continue</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Vendor Console
          </button>
        </div>
      </div>
    );
  }

  // Flexible Vehicle Vendor Inventory Isolation
  const isVehicleOwner = (v) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
    const vId = String(v?.vendor_id || v?.vendorId || '').trim().toLowerCase();
    const uId = String(currentUser?.id || '').trim().toLowerCase();
    const uName = String(currentUser?.username || '').trim().toLowerCase();
    const uVendorId = String(currentUser?.vendor_id || '').trim().toLowerCase();
    
    // Direct match with user ID, username, or vendor_id attribute
    if (vId && (vId === uId || vId === uName || (uVendorId && vId === uVendorId))) return true;
    
    // Primary vehicle vendor mapping: user 'u-4' or 'vendor' owns default fleet + added vehicles
    const isMainVendor = uId === 'u-4' || uName === 'vendor';
    if (isMainVendor) {
      if (vId === 'u-4' || vId === 'vendor' || vId === 'vendor-1' || vId === 'vendor-2' || !vId) return true;
    }
    return false;
  };

  const vendorCars = (cars || []).filter(isVehicleOwner);
  const vendorBikes = (bikes || []).filter(isVehicleOwner);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <VehiclePMSDashboard currentUser={currentUser} cars={vendorCars} bikes={vendorBikes} bookings={bookings} onNavigate={handleNavigate} />;
      case 'fleet':
        return (
          <VehicleFleetManagement
            currentUser={currentUser}
            cars={vendorCars}
            bikes={vendorBikes}
            initialFilter={tabParams.filter}
            onAddCar={onAddCar}
            onAddBike={onAddBike}
            onUpdateCar={onUpdateCar}
            onUpdateBike={onUpdateBike}
            onDeleteCar={onDeleteCar}
            onDeleteBike={onDeleteBike}
          />
        );
      case 'bookings':
        return (
          <VehicleBookingManagement
            bookings={bookings}
            cars={vendorCars}
            bikes={vendorBikes}
            initialStatus={tabParams.statusFilter || tabParams.filter}
            setBookingsList={setBookingsList}
            currentUser={currentUser}
          />
        );
      case 'calendar':
        return <VehicleFleetCalendar cars={vendorCars} bikes={vendorBikes} bookings={bookings} />;
      case 'pricing':
        return <VehiclePricing cars={vendorCars} bikes={vendorBikes} onUpdateCar={onUpdateCar} onUpdateBike={onUpdateBike} />;
      case 'customers':
        return <VehicleCustomerManagement bookings={bookings} />;
      case 'wallet':
        return <VendorWallet currentUser={currentUser} />;
      case 'payment_settings':
        return <PMSPaymentSettings currentUser={currentUser} />;
      case 'cancellation_policy':
        return <VendorCancellationPolicyManager currentUser={currentUser} serviceType="vehicle" />;
      case 'reports':
        return <VehicleReports cars={vendorCars} bikes={vendorBikes} bookings={bookings} onNavigate={handleNavigate} />;
      case 'settings':
        return <VehicleVendorProfileSettings currentUser={currentUser} />;
      default:
        return <VehiclePMSDashboard currentUser={currentUser} cars={vendorCars} bikes={vendorBikes} bookings={bookings} onNavigate={handleNavigate} />;
    }
  };

  const PAGE_TITLES = Object.fromEntries(SIDEBAR_GROUPS.flatMap(g => g.items).map(i => [i.id, i.label]));

  return (
    <div className="d-flex w-100" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0" style={{ width: sidebarOpen ? '256px' : '0px', minWidth: sidebarOpen ? '256px' : '0px', height: '100vh', overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#0D1B2E', borderRight: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }}>
        <div className="px-3 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Compass size={22} style={{ color: '#FF6333' }} />
          <div>
            <div className="fw-extrabold text-white" style={{ fontSize: '15px' }}>TRIPGALILEO</div>
            <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#00B8D9' }}>Vehicle PMS</div>
          </div>
        </div>
        <div className="flex-grow-1 py-2">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <SidebarGroup key={group.label} group={group} activeTab={activeTab} onSelect={(id) => handleNavigate(id, {})} defaultOpen={idx < 2} />
          ))}
        </div>
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', maxHeight: '100vh', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><Menu size={20} /></button>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{PAGE_TITLES[activeTab] || 'Vehicle PMS'}</div>
              <div className="text-white-50" style={{ fontSize: '0.68rem' }}>TripGalileo Vendor Console</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              Online
            </span>

            {/* Live Notifications Bell */}
            <VendorNotificationBell
              currentUser={currentUser}
              vendorType="vehicle"
              bookings={bookings}
              onNavigate={setActiveTab}
            />

            <div className="position-relative">
              <button className="btn p-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', border: '2px solid #FF6333', background: 'linear-gradient(135deg,#FFC107,#FF8A00)' }} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{currentUser.username?.[0]?.toUpperCase()}</span>
              </button>
              {showProfileDropdown && (
                <div className="position-absolute shadow-lg" style={{ right: 0, top: '48px', minWidth: '180px', background: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1050 }}>
                  <div className="text-center px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="fw-bold text-white" style={{ fontSize: '13px' }}>{currentUser.username}</div>
                    <span className="badge mt-1" style={{ background: 'rgba(0,184,217,0.15)', color: '#00B8D9', fontSize: '0.6rem' }}>VEHICLE VENDOR</span>
                  </div>
                  <div className="p-2">
                    <button className="btn w-100 d-flex align-items-center gap-2 py-2 px-2 rounded fw-bold" style={{ color: '#FF6333', background: 'rgba(255,99,51,0.1)', fontSize: '0.82rem' }} onClick={onLogout}>
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div 
          className="flex-grow-1" 
          style={{ 
            height: 'calc(100vh - 56px)', 
            maxHeight: 'calc(100vh - 56px)', 
            minHeight: 0, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
