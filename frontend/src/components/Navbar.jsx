import React from 'react';
import { Compass, LogOut, User } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Navbar({ activeTab, setActiveTab, currentUser, triggerOpenLogin, onOpenLogin, onLogout }) {
  const { liveConfig } = useSiteConfig();
  const headerLinks = liveConfig?.menus?.header || [];
  const handleOpenLogin = triggerOpenLogin || onOpenLogin;
  return (
    <nav className="navbar navbar-expand-lg navbar-dark premium-navbar">
      <div className="container-fluid px-xl-5 px-lg-4 px-3" style={{ maxWidth: '1440px' }}>
        <a className="navbar-brand d-flex align-items-center" href="/" onClick={(e) => { e.preventDefault(); setActiveTab('selfdrive'); }}>
          <div className="me-2 text-warning d-flex align-items-center">
            <Compass size={22} className="float-animation" />
          </div>
          <div>
            <span className="text-white">WOW </span>
            <span className="brand-accent">GOA</span>
            <span className="brand-sub">Self Drive Holidays</span>
          </div>
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-1">
            {headerLinks.map(link => {
              // Active state match
              const isActive = activeTab === link.id || 
                (link.id === 'craftmytrip' && (activeTab === 'craftmytrip' || activeTab === 'craft')) ||
                (link.id === 'selfdrive' && (activeTab === 'selfdrive' || activeTab === 'home')) ||
                activeTab === link.href.replace('/', '');
              return (
                <li key={link.id} className="nav-item">
                  <a 
                    className={`nav-link ${isActive ? 'active' : ''}`} 
                    href={link.href} 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(link.id);
                      setTimeout(() => {
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}

            {/* Customer Bookings Link */}
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'customer' ? 'active' : ''}`} 
                href="/customer" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('customer');
                }}
              >
                <span>🎫 My Bookings</span>
              </a>
            </li>

            {/* Custom Trip Enquiry Button */}
            <li className="nav-item ms-lg-2 me-1">
              <button 
                type="button" 
                className="btn btn-enquire-nav" 
                onClick={() => {
                  setActiveTab('custom-trip');
                  setTimeout(() => {
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              >
                Enquire Your Own Package
              </button>
            </li>

            {/* Conditional Authentication Display */}
            {currentUser ? (
              <li className="nav-item ms-lg-2 dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center gap-2 text-white py-1 px-2" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <User size={15} />
                  </div>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="profileDropdown">
                  <li className="px-3 py-2 border-bottom mb-2 bg-light">
                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '13px' }}>{currentUser.username || currentUser.name}</div>
                    <span className="badge bg-primary text-uppercase" style={{ fontSize: '9px' }}>{currentUser.role}</span>
                  </li>
                  {(currentUser.role === 'subadmin' || currentUser.role === 'sub_admin') && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-purple" 
                        style={{ fontSize: '13px', color: '#7c3aed' }}
                        href="/sub-admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('portal');
                          window.history.pushState(null, '', '/sub-admin');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>🛡️ Sub-Admin Portal</span>
                      </a>
                    </li>
                  )}
                  {['admin', 'superadmin'].includes(currentUser.role) && (
                    <>
                      <li>
                        <a 
                          className="dropdown-item d-flex align-items-center gap-2 py-2 fw-semibold text-dark" 
                          style={{ fontSize: '13px' }}
                          href="/admin"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('portal');
                            window.history.pushState(null, '', '/admin');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                        >
                          <span>⚙️ Admin Panel</span>
                        </a>
                      </li>
                      <li>
                        <a 
                          className="dropdown-item d-flex align-items-center gap-2 py-1.5 text-muted" 
                          style={{ fontSize: '12px' }}
                          href="/sub-admin"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('portal');
                            window.history.pushState(null, '', '/sub-admin');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                        >
                          <span>🛡️ View Sub-Admin Desk</span>
                        </a>
                      </li>
                    </>
                  )}
                  {currentUser.role === 'b2b' && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-primary" 
                        style={{ fontSize: '13px' }}
                        href="/b2b"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('b2b');
                          window.history.pushState(null, '', '/b2b');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>💼 B2B Partner Hub</span>
                      </a>
                    </li>
                  )}
                  {currentUser.role === 'driver' && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-warning" 
                        style={{ fontSize: '13px' }}
                        href="/driver"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('driver');
                          window.history.pushState(null, '', '/driver');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>🚗 Driver Portal</span>
                      </a>
                    </li>
                  )}
                  {(currentUser.role === 'customer' || currentUser.role === 'user') && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-primary" 
                        style={{ fontSize: '13px' }}
                        href="/dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('dashboard');
                          window.history.pushState(null, '', '/dashboard');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>👤 Customer Dashboard</span>
                      </a>
                    </li>
                  )}
                  {currentUser.role === 'vendor' && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-dark" 
                        style={{ fontSize: '13px' }}
                        href="/vendor"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('portal');
                          window.history.pushState(null, '', '/vendor');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>🚗 Vehicle Vendor Portal</span>
                      </a>
                    </li>
                  )}
                  {currentUser.role === 'hotel_vendor' && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-dark" 
                        style={{ fontSize: '13px' }}
                        href="/hotel-vendor"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('portal');
                          window.history.pushState(null, '', '/hotel-vendor');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>🏨 Hotel Vendor Portal</span>
                      </a>
                    </li>
                  )}
                  {currentUser.role === 'flight_vendor' && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-dark" 
                        style={{ fontSize: '13px' }}
                        href="/flight-vendor"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('portal');
                          window.history.pushState(null, '', '/flight-vendor');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>✈️ Flight Vendor Portal</span>
                      </a>
                    </li>
                  )}
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button 
                      className="dropdown-item text-danger d-flex align-items-center gap-2 py-2 fw-bold" 
                      style={{ fontSize: '13px' }}
                      onClick={onLogout}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item ms-lg-1">
                <button
                  type="button"
                  className="btn btn-premium-nav"
                  onClick={handleOpenLogin}
                >
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

