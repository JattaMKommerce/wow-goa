import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, LayoutDashboard, Gift, Tag, Hotel, Car, Compass, 
  FileText, Users, TrendingUp, User, LogOut, Globe, Menu, X, ArrowLeft,
  Lock, Clock, ShieldCheck, Plane, Wand2, Wallet
} from 'lucide-react';
import * as api from '../../services/api';
import B2BLoginPage from './B2BLoginPage';
import B2BRegisterPage from './B2BRegisterPage';
import RegistrationFlow from '../auth/RegistrationFlow';
import B2BDashboardTab from './B2BDashboardTab';
import B2BInventoryTab from './B2BInventoryTab';
import B2BBookingsTab from './B2BBookingsTab';
import B2BCustomersTab from './B2BCustomersTab';
import B2BReportsTab from './B2BReportsTab';
import B2BProfileTab from './B2BProfileTab';
import B2BWalletTab from './B2BWalletTab';
import B2BNotificationBell from '../../components/b2b/B2BNotificationBell';

const TAB_TITLES = {
  dashboard: 'B2B Dashboard',
  commission_services: 'Commission Inventory',
  commission_bookings: 'Commission Bookings',
  commission_reports: 'Commission Earnings',
  non_commission_services: 'Net Wholesale Inventory',
  non_commission_bookings: 'Net Wholesale Bookings',
  customers: 'Guest Directory',
  wallet: 'Agent Wallet',
  profile: 'Partner Profile & Modes'
};

export default function B2BPortalPage({
  onNavigateHome,
  activities = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = [],
  bookings = []
}) {
  const [partnerUser, setPartnerUser] = useState(() => {
    try {
      const stored = localStorage.getItem('b2b_partner_user');
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && parsed.status !== 'active') {
        localStorage.removeItem('b2b_partner_user');
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [authSubView, setAuthSubView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/register') || path.includes('/registration-success')) {
        return 'register';
      }
    }
    return 'login';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeServiceTab, setActiveServiceTab] = useState('selfdrive');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine allowed modes from database values
  const hasCommission = Boolean(partnerUser?.allow_commission);
  const hasNonCommission = Boolean(partnerUser?.allow_non_commission);
  const isPendingMode = (partnerUser?.mode_request_status === 'PENDING');
  const requestedMode = partnerUser?.requested_mode;

  const handleLoginSuccess = (user) => {
    if (user.status !== 'active') {
      alert(user.status === 'pending' 
        ? 'Your B2B application is still under review. You will be able to access the B2B Portal after admin approval.'
        : 'Your B2B application was not approved. Please contact WOW GOA support.');
      return;
    }
    setPartnerUser(user);
    try {
      localStorage.setItem('b2b_partner_user', JSON.stringify(user));
      if (user?.id) localStorage.setItem('b2b_partner_token', user.id);
    } catch (e) {}
  };

  const handleLogout = () => {
    setPartnerUser(null);
    try {
      localStorage.removeItem('b2b_partner_user');
      localStorage.removeItem('b2b_partner_token');
    } catch (e) {}
  };

  const handleWalletUpdated = useCallback((newBal) => {
    setPartnerUser(prev => {
      if (!prev) return prev;
      if (parseFloat(prev.wallet_balance || 0) === parseFloat(newBal || 0)) return prev;
      const updated = { ...prev, wallet_balance: parseFloat(newBal || 0) };
      try { localStorage.setItem('b2b_partner_user', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  }, []);

  const loadDashboard = async () => {
    if (!partnerUser || partnerUser.status !== 'active') return;
    setLoadingDashboard(true);
    try {
      const data = await api.fetchB2BDashboard(partnerUser.id);
      setDashboardData(data);
      if (data?.partner) {
        setPartnerUser(prev => ({ ...prev, ...data.partner }));
        try {
          localStorage.setItem('b2b_partner_user', JSON.stringify({ ...partnerUser, ...data.partner }));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to load B2B dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (partnerUser) {
      loadDashboard();
    }
  }, [partnerUser?.id]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/register') || path.includes('/registration-success')) {
        setAuthSubView('register');
      } else {
        setAuthSubView('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!partnerUser) {
    if (authSubView === 'register') {
      return (
        <RegistrationFlow 
          onNavigateLogin={() => {
            if (typeof window !== 'undefined') window.history.pushState(null, '', '/b2b/login');
            setAuthSubView('login');
          }} 
          onNavigateHome={onNavigateHome} 
        />
      );
    }
    return (
      <B2BLoginPage 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateHome={onNavigateHome}
        onNavigateRegister={() => {
          if (typeof window !== 'undefined') window.history.pushState(null, '', '/b2b/register');
          setAuthSubView('register');
        }} 
      />
    );
  }

  const handleSelectServiceFromHome = (serviceKey) => {
    if (serviceKey === 'taxi') {
      window.location.href = '/taxi';
      return;
    }
    setActiveServiceTab(serviceKey);
    // Route to appropriate active mode tab
    if (hasCommission) {
      setActiveTab('commission_services');
    } else {
      setActiveTab('non_commission_services');
    }
  };

  return (
    <div className="b2b-portal-shell">
      {/* Mobile / Tablet Backdrop */}
      {sidebarOpen && (
        <div 
          className="b2b-sidebar-backdrop position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ zIndex: 1045, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* ─── 1. B2B LEFT SIDEBAR (Desktop: 264px fixed-width column, Mobile: Drawer) ─── */}
      <aside 
        className={`b2b-sidebar ${sidebarOpen ? 'b2b-sidebar-open' : ''}`}
        aria-label="B2B Portal Navigation"
      >
        {/* Brand Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-shrink-0" style={{ height: '58px' }}>
          <div 
            className="d-flex align-items-center gap-2" 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="rounded-3 p-1.5 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
              <Building2 size={18} />
            </div>
            <div>
              <span className="fw-black fs-6 tracking-wider text-dark font-heading">WOW GOA</span>
              <span className="badge bg-dark text-warning text-xxs ms-1.5 px-2 py-0.5 rounded-pill">B2B PORTAL</span>
            </div>
          </div>

          {/* Close button for Mobile / Tablet drawer */}
          <button 
            type="button"
            className="btn btn-sm btn-light d-lg-none p-1 rounded-circle border d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="p-3 overflow-y-auto flex-grow-1 custom-sidebar-scroll">
          {/* Dashboard Link */}
          <nav className="nav flex-column gap-1.5 mb-3">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                activeTab === 'dashboard' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
              }`}
            >
              <LayoutDashboard size={17} />
              <span>B2B Dashboard</span>
            </button>
          </nav>

          {/* COMMISSION MODE SECTION (Case 1 & Case 3) */}
          {hasCommission && (
            <div className="mb-3 pb-1">
              <div className="text-muted fw-bold text-uppercase px-2 mb-2 d-flex align-items-center justify-content-between" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                <span>💰 Commission Channel</span>
                <span className="badge bg-warning text-dark px-2 py-0.5 rounded-pill font-monospace" style={{ fontSize: '10px' }}>ACTIVE</span>
              </div>
              <nav className="nav flex-column gap-1.5">
                <button
                  onClick={() => { setActiveTab('commission_services'); setSidebarOpen(false); }}
                  className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                    activeTab === 'commission_services' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                  }`}
                >
                  <Compass size={16} />
                  <span>Commission Inventory</span>
                </button>
                <button
                  onClick={() => { setActiveTab('commission_bookings'); setSidebarOpen(false); }}
                  className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                    activeTab === 'commission_bookings' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                  }`}
                >
                  <FileText size={16} />
                  <span>Commission Bookings</span>
                </button>
                <button
                  onClick={() => { setActiveTab('commission_reports'); setSidebarOpen(false); }}
                  className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                    activeTab === 'commission_reports' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                  }`}
                >
                  <TrendingUp size={16} />
                  <span>Commission Earnings</span>
                </button>
              </nav>
            </div>
          )}

          {/* NON-COMMISSION (NET) SECTION (Case 2 & Case 3) */}
          {hasNonCommission && (
            <div className="mb-3 pb-1">
              <div className="text-muted fw-bold text-uppercase px-2 mb-2 d-flex align-items-center justify-content-between" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                <span>🏷️ Non-Commission Channel</span>
                <span className="badge bg-primary text-white px-2 py-0.5 rounded-pill font-monospace" style={{ fontSize: '10px' }}>ACTIVE</span>
              </div>
              <nav className="nav flex-column gap-1.5">
                <button
                  onClick={() => { setActiveTab('non_commission_services'); setSidebarOpen(false); }}
                  className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                    activeTab === 'non_commission_services' ? 'bg-primary text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                  }`}
                >
                  <Compass size={16} />
                  <span>Net Wholesale Inventory</span>
                </button>
                <button
                  onClick={() => { setActiveTab('non_commission_bookings'); setSidebarOpen(false); }}
                  className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                    activeTab === 'non_commission_bookings' ? 'bg-primary text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                  }`}
                >
                  <FileText size={16} />
                  <span>Net Wholesale Bookings</span>
                </button>
              </nav>
            </div>
          )}

          {/* CASE 4: ONE APPROVED, SECOND MODE PENDING REVIEW */}
          {!hasNonCommission && isPendingMode && requestedMode === 'NON_COMMISSION' && (
            <div className="mb-3 pb-1">
              <div className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                <span>🏷️ Non-Commission Channel</span>
              </div>
              <button
                onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                className="nav-link text-start rounded-3 px-3 py-2.5 text-xs text-muted border border-dashed border-warning bg-warning bg-opacity-10 d-flex align-items-center gap-2 w-100"
                title="Non-Commission Mode is pending admin review"
              >
                <Clock size={15} className="text-warning flex-shrink-0" />
                <span className="text-truncate">Pending Admin Review</span>
              </button>
            </div>
          )}

          {!hasCommission && isPendingMode && requestedMode === 'COMMISSION' && (
            <div className="mb-3 pb-1">
              <div className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>
                <span>💰 Commission Channel</span>
              </div>
              <button
                onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                className="nav-link text-start rounded-3 px-3 py-2.5 text-xs text-muted border border-dashed border-warning bg-warning bg-opacity-10 d-flex align-items-center gap-2 w-100"
                title="Commission Mode is pending admin review"
              >
                <Clock size={15} className="text-warning flex-shrink-0" />
                <span className="text-truncate">Pending Admin Review</span>
              </button>
            </div>
          )}

          {/* COMMON OPERATIONS */}
          <div className="text-muted fw-bold text-uppercase px-2 mb-2" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Agency Management</div>
          <nav className="nav flex-column gap-1.5">
            <button
              onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}
              className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                activeTab === 'customers' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
              }`}
            >
              <Users size={16} />
              <span>Guest Directory</span>
            </button>
            <button
              onClick={() => { setActiveTab('wallet'); setSidebarOpen(false); }}
              className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center justify-content-between ${
                activeTab === 'wallet' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
              }`}
            >
              <div className="d-flex align-items-center gap-2.5">
                <Wallet size={16} className="text-warning" />
                <span>Agent Wallet</span>
              </div>
              <span className="badge bg-warning text-dark px-2 py-1 rounded-pill font-monospace fw-bold" style={{ fontSize: '11px' }}>
                ₹{parseFloat(partnerUser?.wallet_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
              className={`nav-link text-start rounded-3 px-3 py-2.5 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                activeTab === 'profile' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
              }`}
            >
              <User size={16} />
              <span>Partner Profile &amp; Modes</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-top flex-shrink-0 bg-light bg-opacity-50">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-xxs text-muted font-monospace">WOW GOA B2B v2.6</span>
            <button 
              onClick={handleLogout}
              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 border-0"
              style={{ fontSize: '11px', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}
              title="Logout Agency"
            >
              <LogOut size={12} />
              <span className="fw-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── 2. RIGHT WORKSPACE CONTAINER (Header + Main Page Content) ─── */}
      <div className="b2b-workspace">
        {/* Top Navbar */}
        <header className="b2b-topbar px-3 px-lg-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2.5">
            {/* Mobile Sidebar Toggle Button */}
            <button 
              type="button"
              className="btn btn-sm btn-light d-lg-none p-1.5 rounded-3 border d-flex align-items-center justify-content-center"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={19} />
            </button>

            {/* Mobile Brand Title (shown only when sidebar is off-canvas) */}
            <div className="d-flex align-items-center gap-2 d-lg-none">
              <span className="fw-bold text-dark text-xs text-truncate" style={{ maxWidth: '160px' }}>
                {TAB_TITLES[activeTab] || 'B2B Portal'}
              </span>
            </div>

            {/* Desktop Active Tab Title / Breadcrumb */}
            <div className="d-none d-lg-flex align-items-center gap-2 text-xs">
              <span className="text-muted fw-semibold">Agency Portal</span>
              <span className="text-muted opacity-50">/</span>
              <span className="fw-bold text-dark font-heading">
                {TAB_TITLES[activeTab] || activeTab.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Right Header: Approved Mode Indicator + Notification Bell + Agency Profile */}
          <div className="d-flex align-items-center gap-2 gap-sm-2.5">
            {/* Database Approved Mode Indicator (No free switching) */}
            <div className="d-none d-md-flex align-items-center gap-1.5 flex-shrink-0">
              {hasCommission && hasNonCommission ? (
                <span 
                  className="badge text-xs px-2.5 py-1.5 rounded-pill fw-bold text-nowrap shadow-2xs"
                  style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                  title="Dual Mode Active: Agency has permission for Commission & Net Wholesale booking sections"
                >
                  ✓ Dual Mode Active <span className="d-none d-xl-inline">(Commission + Net)</span>
                </span>
              ) : hasCommission ? (
                <span 
                  className="badge text-xs px-2.5 py-1.5 rounded-pill fw-bold text-nowrap shadow-2xs"
                  style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                >
                  💰 Commission Mode
                </span>
              ) : hasNonCommission ? (
                <span 
                  className="badge text-xs px-2.5 py-1.5 rounded-pill fw-bold text-nowrap shadow-2xs"
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                >
                  🏷️ Net Wholesale Mode
                </span>
              ) : null}
            </div>

            {/* Main D2C Site Link */}
            <button 
              onClick={onNavigateHome}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 text-xs d-none d-sm-flex align-items-center gap-1.5"
            >
              <Globe size={14} />
              <span>Main D2C Site</span>
            </button>

            {/* Prepaid Wallet Quick Balance Pill */}
            <div 
              onClick={() => setActiveTab('wallet')}
              className="cursor-pointer d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-light border hover-bg-warning-subtle transition-all shadow-2xs"
              style={{ cursor: 'pointer' }}
              title="Click to view Agent Prepaid Wallet & Statement"
            >
              <Wallet size={15} className="text-warning flex-shrink-0" />
              <span className="text-xs text-muted fw-semibold d-none d-md-inline">Wallet:</span>
              <strong className="text-dark text-xs fw-bold font-monospace">
                ₹{parseFloat(partnerUser.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </strong>
            </div>

            {/* Real-Time Notification Bell Component (Requirements 18-23) */}
            <B2BNotificationBell 
              partner={partnerUser} 
              onNotificationClick={(notif) => {
                if (notif.type?.includes('mode')) {
                  setActiveTab('profile');
                } else if (notif.type?.includes('booking')) {
                  setActiveTab(hasCommission ? 'commission_bookings' : 'non_commission_bookings');
                }
              }} 
            />

            {/* Agency User Pill */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="d-flex align-items-center gap-2 p-1.5 pe-3 bg-light rounded-pill border shadow-2xs"
              style={{ cursor: 'pointer' }}
            >
              <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                {(partnerUser.company_name || partnerUser.name || 'A')[0]?.toUpperCase()}
              </div>
              <div className="d-none d-sm-block text-start" style={{ lineHeight: '1.2' }}>
                <div className="fw-bold text-dark text-xs text-truncate" style={{ maxWidth: '160px' }}>
                  {partnerUser.company_name || partnerUser.name}
                </div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Agent ID: {partnerUser.id || 'N/A'}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm rounded-circle p-1.5 border-0 d-flex align-items-center justify-content-center"
              title="Logout Agency"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="b2b-main-content p-3 p-lg-4">
          {activeTab === 'dashboard' && (
            <B2BDashboardTab 
              dashboardData={dashboardData}
              partnerUser={partnerUser}
              onNavigateTab={(tabKey) => {
                if (tabKey === 'commission_services' || tabKey === 'commission') {
                  setActiveTab('commission_services');
                } else if (tabKey === 'non_commission_services' || tabKey === 'non-commission') {
                  setActiveTab('non_commission_services');
                } else if (tabKey === 'profile') {
                  setActiveTab('profile');
                } else {
                  setActiveTab(tabKey);
                }
              }}
              onSelectService={handleSelectServiceFromHome}
            />
          )}

          {/* Commission Services Workspace */}
          {activeTab === 'commission_services' && hasCommission && (
            <B2BInventoryTab 
              mode="COMMISSION"
              partnerUser={partnerUser}
              initialService={activeServiceTab}
              initialActivities={activities}
              onInitiateBooking={() => loadDashboard()}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Non-Commission (Net) Services Workspace */}
          {activeTab === 'non_commission_services' && hasNonCommission && (
            <B2BInventoryTab 
              mode="NON_COMMISSION"
              partnerUser={partnerUser}
              initialService={activeServiceTab}
              initialActivities={activities}
              onInitiateBooking={() => loadDashboard()}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Commission Bookings */}
          {activeTab === 'commission_bookings' && hasCommission && (
            <B2BBookingsTab 
              partnerUser={partnerUser} 
              forcedMode="COMMISSION"
            />
          )}

          {/* Non-Commission Net Bookings */}
          {activeTab === 'non_commission_bookings' && hasNonCommission && (
            <B2BBookingsTab 
              partnerUser={partnerUser} 
              forcedMode="NON_COMMISSION"
            />
          )}

          {/* Commission Reports */}
          {activeTab === 'commission_reports' && hasCommission && (
            <B2BReportsTab partnerUser={partnerUser} />
          )}

          {/* Customers Directory */}
          {activeTab === 'customers' && (
            <B2BCustomersTab partnerUser={partnerUser} />
          )}

          {/* Partner Profile */}
          {activeTab === 'profile' && (
            <B2BProfileTab 
              partnerUser={partnerUser} 
              onLogout={handleLogout} 
              onPartnerRefresh={loadDashboard}
            />
          )}

          {/* Agent Prepaid Wallet */}
          {activeTab === 'wallet' && (
            <B2BWalletTab 
              partnerUser={partnerUser} 
              onWalletUpdated={handleWalletUpdated}
            />
          )}
        </main>
      </div>
    </div>
  );
}
