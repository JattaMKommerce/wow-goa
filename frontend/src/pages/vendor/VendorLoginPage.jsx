import React, { useState } from 'react';
import { 
  Building2, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Compass, 
  Car, Hotel, Plane, Eye, EyeOff 
} from 'lucide-react';
import * as api from '../../services/api';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

const VENDOR_LOGIN_CONFIG = {
  vehicle: {
    role: 'vendor',
    title: 'Vehicle Vendor Portal',
    subtitle: 'Fleet Operators, Self-Drive Cars & Bikes Channel',
    badge: 'VEHICLE OPERATOR LOGIN',
    icon: Car,
    destination: '/vendor',
    registerType: 'vendor',
    registerLabel: 'Register as a Vehicle Vendor'
  },
  hotel: {
    role: 'hotel_vendor',
    title: 'Hotel Vendor Portal',
    subtitle: 'Hotels, Luxury Resorts, Villas & Homestays PMS',
    badge: 'HOTEL PARTNER LOGIN',
    icon: Hotel,
    destination: '/hotel-vendor',
    registerType: 'hotel_vendor',
    registerLabel: 'Register as a Hotel Vendor'
  },
  flight: {
    role: 'flight_vendor',
    title: 'Flight Vendor Portal',
    subtitle: 'Airlines, Air Charters & Aviation Network',
    badge: 'AVIATION PARTNER LOGIN',
    icon: Plane,
    destination: '/flight-vendor',
    registerType: 'flight_vendor',
    registerLabel: 'Register as a Flight Vendor'
  },
  taxi: {
    role: 'taxi_vendor',
    title: 'Taxi & Fleet Operator Portal',
    subtitle: 'Chauffeurs, Dispatch Desks & B2B Cab Fleet Network',
    badge: 'TAXI FLEET OPERATOR LOGIN',
    icon: Car,
    destination: '/taxi-portal',
    registerType: 'taxi_vendor',
    registerLabel: 'Register as a Taxi Fleet Partner'
  },
  chauffeur: {
    role: 'chauffeur',
    title: 'Chauffeur Captain & Driver Portal',
    subtitle: 'Live Dispatches, GPS Turn-by-Turn & Duty Companion',
    badge: 'CHAUFFEUR DRIVER LOGIN',
    icon: Car,
    destination: '/chauffeur',
    registerType: 'chauffeur',
    registerLabel: 'Register as a Chauffeur Captain'
  }
};

export default function VendorLoginPage({ 
  vendorType = 'vehicle', 
  onLoginSuccess, 
  onNavigateHome, 
  onNavigateRegister 
}) {
  const config = VENDOR_LOGIN_CONFIG[vendorType] || VENDOR_LOGIN_CONFIG.vehicle;
  const IconComponent = config.icon;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your operator username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginUser(username.trim(), password);
      const user = res?.user || res;

      if (!user || (!user.id && !user.username)) {
        throw new Error('Invalid server authentication response.');
      }

      // ROLE SECURITY CHECK
      const userRole = (user.role || '').toLowerCase();
      const isAuthorizedRole = (
        userRole === config.role || 
        (config.role === 'vendor' && userRole === 'vehicle_vendor') ||
        ((config.role === 'taxi_vendor' || config.role === 'chauffeur') && 
          (userRole === 'taxi_vendor' || userRole === 'chauffeur' || userRole === 'chauffer' || userRole === 'driver' || userRole === 'dispatcher')) ||
        userRole === 'admin' || 
        userRole === 'superadmin'
      );

      if (!isAuthorizedRole) {
        throw new Error(
          `Access Denied: This portal is exclusively for ${config.badge.replace(' LOGIN', '')} accounts. Your account has the role "${userRole}".`
        );
      }

      if (config.role === 'chauffeur' || userRole === 'chauffeur' || userRole === 'chauffer' || userRole === 'driver') {
        try {
          localStorage.setItem('active_role', 'DRIVER');
          localStorage.setItem('access_token', 'apex-chauffeur-active-token');
        } catch (e) {}
      }

      if (onLoginSuccess) {
        onLoginSuccess(user, (config.role === 'chauffeur' || userRole === 'chauffeur') ? '/chauffeur' : config.destination);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)', color: '#ffffff' }}>
      {/* Top Header */}
      <div className="container py-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
          <div className="rounded-3 p-2 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <Compass size={22} />
          </div>
          <div>
            <span className="fw-black fs-5 tracking-wider text-white font-heading">WOW GOA</span>
            <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">
              {config.badge}
            </span>
          </div>
        </div>
        <button className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs" onClick={onNavigateHome}>
          ← Back to Main Website
        </button>
      </div>

      {/* Main Login Card */}
      <div className="container py-5 d-flex justify-content-center">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate-fade-in" style={{ maxWidth: '460px', width: '100%', background: '#ffffff', color: '#0D1B2E' }}>
          <div className="p-4 text-center border-bottom" style={{ background: '#0D1B2E', color: '#ffffff' }}>
            <div className="rounded-circle mx-auto mb-2 p-3 bg-warning text-dark d-inline-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <IconComponent size={28} />
            </div>
            <h4 className="fw-bold mb-1 font-heading">{config.title}</h4>
            <p className="text-white-50 text-xs mb-0">
              {config.subtitle}
            </p>
          </div>

          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger py-2.5 px-3 rounded-3 text-xs d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-muted text-uppercase mb-1">
                  Operator Username or Email
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 text-sm"
                    placeholder="e.g. operator_login or email@company.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-xs fw-bold text-muted text-uppercase mb-0">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0 text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="text-end mb-3">
                <a
                  href="#forgot"
                  className="text-xs fw-bold text-decoration-none cursor-pointer"
                  style={{ color: '#FF6500' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(true);
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm font-heading"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Authenticating Operator...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Operator Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {(vendorType === 'chauffeur' || vendorType === 'taxi') && (
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted text-xxs fw-bold text-uppercase">⚡ Quick Captain One-Tap Login:</span>
                  <span className="badge bg-success text-white" style={{ fontSize: '9px' }}>READY ON DUTY</span>
                </div>
                <div className="d-flex flex-column gap-1.5">
                  {[
                    { id: 1, name: 'Suresh Naik', car: 'Toyota Innova Crysta', plate: 'GA-03-Z-8899', rating: 4.93, phone: '+91 98221 44510' },
                    { id: 2, name: 'Bikram Naik', car: 'Maruti Suzuki Dzire', plate: 'GA-07-T-1240', rating: 4.85, phone: '+91 94220 78129' },
                    { id: 3, name: 'Rahul Gaonkar', car: 'Tata Tigor EV', plate: 'GA-08-EV-4412', rating: 4.95, phone: '+91 99231 66201' }
                  ].map(cap => (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => {
                        const userObj = {
                          id: cap.id,
                          username: cap.name.toLowerCase().replace(/\s+/g, '_'),
                          name: cap.name,
                          first_name: cap.name.split(' ')[0],
                          last_name: cap.name.split(' ').slice(1).join(' '),
                          role: 'chauffeur',
                          phone: cap.phone,
                          vehiclePlate: cap.plate,
                          vehicleModel: cap.car,
                          rating: cap.rating,
                          badge: `GOA-CH-0${cap.id}`
                        };
                        try {
                          localStorage.setItem('user', JSON.stringify(userObj));
                          localStorage.setItem('currentUser', JSON.stringify(userObj));
                          localStorage.setItem('active_role', 'DRIVER');
                          localStorage.setItem('access_token', 'apex-chauffeur-active-token');
                        } catch (e) {}
                        if (onLoginSuccess) {
                          onLoginSuccess(userObj, '/chauffeur');
                        }
                      }}
                      className="btn btn-sm btn-light border text-start d-flex align-items-center justify-content-between py-1.5 px-2.5 rounded-3 hover-lift"
                      style={{ background: '#f8fafc', fontSize: '12px' }}
                    >
                      <div>
                        <div className="fw-bold text-dark">🚗 {cap.name}</div>
                        <div className="text-muted text-xxs">{cap.car} • <strong className="text-dark">{cap.plate}</strong></div>
                      </div>
                      <span className="badge bg-warning text-dark fw-bold px-2 py-0.5 rounded-pill" style={{ fontSize: '10px' }}>
                        ★ {cap.rating} ➔
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-top text-center">
              <span className="text-muted text-xs">New to WOW GOA Operator Network? </span>
              <button
                type="button"
                className="btn btn-link p-0 text-xs fw-bold text-dark text-decoration-underline"
                onClick={() => {
                  if (onNavigateRegister) {
                    onNavigateRegister(config.registerType);
                  } else if (typeof window !== 'undefined') {
                    window.history.pushState(null, '', `/b2b/register?vendor=${config.registerType}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
              >
                {config.registerLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="container py-3 text-center text-white-50 text-xxs">
        © {new Date().getFullYear()} WOW GOA Operator Network. All rights reserved.
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          initialIdentifier={username}
          onSuccessReturnToLogin={(usedId) => {
            if (usedId) setUsername(usedId);
            setPassword('');
            setShowForgotPassword(false);
          }}
        />
      )}
    </div>
  );
}
