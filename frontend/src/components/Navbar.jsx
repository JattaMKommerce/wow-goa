import React from 'react';
import { Compass, LogOut, User, ChevronDown } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Navbar({ activeTab, setActiveTab, currentUser, triggerOpenLogin, onOpenLogin, onLogout }) {
  const { liveConfig } = useSiteConfig();
  const headerLinks = liveConfig?.menus?.header || [];
  const handleOpenLogin = triggerOpenLogin || onOpenLogin;

  // Filter core primary links
  const coreCategoryIds = ['selfdrive', 'packages', 'hotels', 'flights'];
  const primaryLinks = headerLinks.filter(l => coreCategoryIds.includes(l.id));

  // Determine if any item inside the "More" dropdown is active
  const isMoreActive = activeTab === 'activities' || 
    activeTab === 'craftmytrip' || 
    activeTab === 'craft' || 
    activeTab === 'visa' || 
    activeTab === 'download-apk' || 
    (activeTab === 'portal' && (!currentUser || currentUser.role === 'driver'));

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
            <span className="brand-sub">
              {(activeTab === 'cabs' || activeTab === 'taxi') ? 'Taxis & Chauffeur' : 'Self Drive Holidays'}
            </span>
          </div>
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-1">
            {/* 1. Self Drive */}
            {primaryLinks.filter(l => l.id === 'selfdrive').map(link => {
              const isActive = activeTab === 'selfdrive' || activeTab === 'home';
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

            {/* 2. Cabs & Taxi */}
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'cabs' ? 'active' : ''}`}
                style={{ color: activeTab === 'cabs' ? '#ff9f1c' : '#ffffff', fontWeight: 700 }}
                href="/cabs" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('cabs');
                }}
              >
                <span>🚕 Cabs & Taxi</span>
              </a>
            </li>

            {/* 3. Other Core Links (Trip Packages, Hotels, Flights) */}
            {primaryLinks.filter(l => l.id !== 'selfdrive').map(link => {
              const isActive = activeTab === link.id || activeTab === link.href.replace('/', '');
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

            {/* 4. More Services Dropdown */}
            <li className="nav-item dropdown">
              <a 
                className={`nav-link dropdown-toggle d-inline-flex align-items-center gap-1 ${isMoreActive ? 'active' : ''}`}
                style={{ color: isMoreActive ? '#ff9f1c' : 'rgba(255,255,255,0.85)', fontWeight: isMoreActive ? 700 : 500 }}
                href="#" 
                id="moreServicesDropdown" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span>More</span>
                <ChevronDown size={13} className="opacity-75" />
              </a>
              <ul 
                className="dropdown-menu dropdown-menu-end shadow-lg border-0 py-2 mt-2" 
                aria-labelledby="moreServicesDropdown"
                style={{ 
                  minWidth: '230px', 
                  background: 'rgba(11, 25, 44, 0.98)', 
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
                }}
              >
                {/* Sightseeing & Activities */}
                <li>
                  <a 
                    className={`dropdown-item d-flex align-items-center justify-content-between py-2 px-3 text-white ${activeTab === 'activities' ? 'bg-primary' : ''}`}
                    href="/activities" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('activities');
                      setTimeout(() => {
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <span>🏖️</span>
                      <span style={{ fontSize: '13px' }}>Sightseeing & Activities</span>
                    </span>
                  </a>
                </li>

                {/* Craft My Trip */}
                <li>
                  <a 
                    className={`dropdown-item d-flex align-items-center justify-content-between py-2 px-3 text-white ${(activeTab === 'craftmytrip' || activeTab === 'craft') ? 'bg-primary' : ''}`}
                    href="/craft" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('craftmytrip');
                      setTimeout(() => {
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <span>✨</span>
                      <span style={{ fontSize: '13px' }}>Craft My Trip</span>
                    </span>
                    <span className="badge rounded-pill bg-warning text-dark px-2 py-0.5" style={{ fontSize: '9px', fontWeight: 800 }}>Custom</span>
                  </a>
                </li>

                <li><hr className="dropdown-divider my-1 border-secondary opacity-25" /></li>

                {/* Goa Tourist Visa */}
                <li>
                  <a 
                    className={`dropdown-item d-flex align-items-center justify-content-between py-2 px-3 text-white ${activeTab === 'visa' ? 'bg-primary' : ''}`}
                    href="/visa" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('visa');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <span>🛂</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '13px' }}>Goa Tourist Visa</span>
                    </span>
                    <span className="badge rounded-pill bg-info text-dark px-2 py-0.5" style={{ fontSize: '9px', fontWeight: 800 }}>e-Visa</span>
                  </a>
                </li>

                {/* Taxi APK Download */}
                <li>
                  <a 
                    className={`dropdown-item d-flex align-items-center justify-content-between py-2 px-3 text-white ${activeTab === 'download-apk' ? 'bg-primary' : ''}`}
                    href="/download" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('download-apk');
                      window.history.pushState(null, '', '/download');
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <span>📲</span>
                      <span style={{ color: '#ff9f1c', fontWeight: 600, fontSize: '13px' }}>Taxi Customer App</span>
                    </span>
                    <span className="badge rounded-pill bg-warning text-dark px-2 py-0.5" style={{ fontSize: '9px', fontWeight: 900 }}>APK</span>
                  </a>
                </li>

                {/* Driver Companion App */}
                <li>
                  <a 
                    className={`dropdown-item d-flex align-items-center justify-content-between py-2 px-3 text-white ${activeTab === 'portal' ? 'bg-primary' : ''}`}
                    href="/driver" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('portal');
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <span>👨‍✈️</span>
                      <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>Driver Companion App</span>
                    </span>
                    <span className="badge rounded-pill bg-success text-white px-2 py-0.5" style={{ fontSize: '9px', fontWeight: 800 }}>Partner</span>
                  </a>
                </li>
              </ul>
            </li>

            {/* 5. Customer Bookings Link */}
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
            <li className="nav-item ms-lg-1 me-1">
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
                Enquire Package
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
                  {(currentUser.role === 'taxi_vendor' || currentUser.role === 'chauffeur' || currentUser.role === 'chauffer') && (
                    <li>
                      <a 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 fw-bold text-dark" 
                        style={{ fontSize: '13px' }}
                        href={(currentUser.role === 'chauffeur' || currentUser.role === 'chauffer') ? '/chauffeur' : '/taxi-vendor'}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('portal');
                          const dest = (currentUser.role === 'chauffeur' || currentUser.role === 'chauffer') ? '/chauffeur' : '/taxi-vendor';
                          window.history.pushState(null, '', dest);
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <span>{(currentUser.role === 'chauffeur' || currentUser.role === 'chauffer') ? '👔 Chauffeur Portal' : '🚕 Taxi & Cab Vendor Portal'}</span>
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

