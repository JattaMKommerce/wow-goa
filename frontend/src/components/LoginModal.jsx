import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Lock, User, Eye, EyeOff, Palmtree, 
  TrendingUp, Award, Headphones, ChevronRight, ChevronDown, ShieldAlert 
} from 'lucide-react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showQuickDemo, setShowQuickDemo] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      lockScroll('login-modal');
      return () => {
        unlockScroll('login-modal');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    
    const success = await onLogin(username, password);
    if (!success) {
      setErrorMsg("Invalid username or password. Check credentials.");
    } else {
      setErrorMsg('');
      setUsername('');
      setPassword('');
      onClose();
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
    
    const success = await onLogin(u, p);
    if (success) {
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg("Invalid username or password. Check credentials.");
    }
  };

  return createPortal(
    <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.6)', backdropFilter: 'blur(8px)', zIndex: 99999 }} onClick={onClose}>
      <div className="login-split-card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        
        {/* LEFT COLUMN: BRANDING & FEATURES */}
        <div className="login-left-banner d-none d-md-flex" style={{ position: 'relative', overflow: 'hidden', background: 'none' }}>
          {/* Background Video */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          >
            <source src="/beach.mp4" type="video/mp4" />
          </video>

          {/* Dark Overlay */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(11, 25, 44, 0.8) 0%, rgba(11, 25, 44, 0.45) 100%)',
              zIndex: 2
            }}
          />

          {/* Top Logo */}
          <div className="d-flex align-items-center gap-2.5" style={{ position: 'relative', zIndex: 3 }}>
            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
              <Palmtree className="text-warning" size={22} />
            </div>
            <div>
              <h5 className="fw-extrabold text-white mb-0 tracking-wider font-heading" style={{ fontSize: '16px', lineHeight: '1.2' }}>WOW GOA</h5>
              <span className="text-warning text-xxs tracking-wider text-uppercase fw-bold" style={{ fontSize: '9px' }}>Partner Hub</span>
            </div>
          </div>

          {/* Middle Headings */}
          <div className="my-auto text-start" style={{ position: 'relative', zIndex: 3 }}>
            <h1 className="fw-extrabold text-white mb-3 font-heading" style={{ fontSize: '32px', lineHeight: '1.2' }}>
              Grow with<br />WOW GOA
            </h1>
            <p className="text-white-50 small mb-0" style={{ maxWidth: '280px', fontSize: '13px' }}>
              Your partner in creating unforgettable Goa self drive holiday experiences.
            </p>
          </div>

          {/* Bottom Bullet Points */}
          <div className="d-flex justify-content-between align-items-start gap-2 pt-3 border-top border-white border-opacity-10" style={{ position: 'relative', zIndex: 3 }}>
            <div className="text-center" style={{ width: '30%' }}>
              <div className="login-feature-circle mx-auto">
                <TrendingUp size={16} className="text-warning" />
              </div>
              <span className="text-white fw-bold d-block text-xxs mb-1">Grow</span>
              <span className="text-white-50 text-xxs d-block" style={{ fontSize: '9px' }}>Your Business</span>
            </div>
            <div className="text-center" style={{ width: '30%' }}>
              <div className="login-feature-circle mx-auto">
                <Award size={16} className="text-warning" />
              </div>
              <span className="text-white fw-bold d-block text-xxs mb-1">Trusted</span>
              <span className="text-white-50 text-xxs d-block" style={{ fontSize: '9px' }}>Partnerships</span>
            </div>
            <div className="text-center" style={{ width: '30%' }}>
              <div className="login-feature-circle mx-auto">
                <Headphones size={16} className="text-warning" />
              </div>
              <span className="text-white fw-bold d-block text-xxs mb-1">Dedicated</span>
              <span className="text-white-50 text-xxs d-block" style={{ fontSize: '9px' }}>Support</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="login-right-form">
          {/* Close Button */}
          <button type="button" className="login-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>

          {/* Form Header */}
          <div className="text-center mb-4">
            <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2.5" style={{ width: '52px', height: '52px', background: 'rgba(255, 159, 28, 0.08)' }}>
              <Lock className="text-warning" size={24} />
            </div>
            <h4 className="fw-extrabold text-primary font-heading mb-0 text-uppercase tracking-wider" style={{ fontSize: '18px' }}>Partner Sign In</h4>
            
            {/* Palm divider decorative */}
            <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
              <span style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, transparent, #FF9F1C)' }}></span>
              <Palmtree size={14} className="text-warning" />
              <span style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, #FF9F1C, transparent)' }}></span>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3" role="alert" style={{ background: 'rgba(220, 53, 69, 0.05)', borderColor: 'rgba(220, 53, 69, 0.15)', color: '#dc3545' }}>
              <ShieldAlert size={15} />
              <span className="text-start">{errorMsg}</span>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="text-start">
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary mb-1">Username or Email</label>
              <div className="login-input-group">
                <div className="login-input-addon">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  className="login-input-control" 
                  placeholder="Enter your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-bold text-secondary mb-0">Password</label>
              </div>
              <div className="login-input-group">
                <div className="login-input-addon">
                  <Lock size={16} />
                </div>
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="login-input-control" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="bg-transparent border-0 px-3 text-muted" 
                  style={{ outline: 'none' }}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-end mb-4">
              <a 
                href="#forgot" 
                className="text-xs fw-bold text-warning text-decoration-none cursor-pointer" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setShowForgotPassword(true); 
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="btn btn-amber-gradient w-100 py-2.5 rounded-pill fw-extrabold text-white shadow-sm mb-3 text-uppercase tracking-wider d-flex align-items-center justify-content-center gap-2">
              <span>Sign In</span>
              <span>→</span>
            </button>
          </form>

          {/* Quick Access Drawer */}
          <div className="login-deco-divider">
            <span className="text-xxs text-uppercase text-muted fw-bold px-2 bg-white">OR</span>
          </div>

          <div className="text-start">
            <div 
              className="p-3 rounded-3 border d-flex justify-content-between align-items-center cursor-pointer select-none"
              style={{ background: '#f8fafc', borderColor: 'rgba(11,25,44,0.06)', transition: 'all 0.2s ease' }}
              onClick={() => setShowQuickDemo(!showQuickDemo)}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
                  <span style={{ fontSize: '16px' }}>🪄</span>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-primary small">Quick Access Demo Accounts</h6>
                  <span className="text-xxs text-muted d-block" style={{ fontSize: '10px' }}>Explore the partner portal with demo access</span>
                </div>
              </div>
              <div className="text-muted">
                {showQuickDemo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>

            {showQuickDemo && (
              <div className="d-grid gap-1.5 mt-2 p-2 rounded-3 border border-dashed" style={{ background: '#fcfdfe' }}>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f1f5f9' }}
                  onClick={() => handleQuickLogin('superadmin@gmail.com', 'superadmin')}
                >
                  <span className="fw-bold small" style={{ fontSize: '11px' }}>Superadmin (Full Access)</span>
                  <span className="text-xxs text-muted">superadmin / superadmin</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f1f5f9' }}
                  onClick={() => handleQuickLogin('admin@gmail.com', 'admin@2026')}
                >
                  <span className="fw-bold small" style={{ fontSize: '11px' }}>Admin (Operators)</span>
                  <span className="text-xxs text-muted">admin / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f1f5f9' }}
                  onClick={() => handleQuickLogin('vendor@tripgalileo.com', 'admin@2026')}
                >
                  <span className="fw-bold small" style={{ fontSize: '11px' }}>Vehicle Vendor (Fleet Listings)</span>
                  <span className="text-xxs text-muted">vendor / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f1f5f9' }}
                  onClick={() => handleQuickLogin('hotel_vendor@tripgalileo.com', 'admin@2026')}
                >
                  <span className="fw-bold small" style={{ fontSize: '11px' }}>Hotel Vendor (Hotel PMS)</span>
                  <span className="text-xxs text-muted">hotel_vendor / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f1f5f9' }}
                  onClick={() => handleQuickLogin('flight_vendor@tripgalileo.com', 'admin@2026')}
                >
                  <span className="fw-bold small" style={{ fontSize: '11px' }}>Flight Vendor (Flight PMS)</span>
                  <span className="text-xxs text-muted">flight_vendor / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                  onClick={() => handleQuickLogin('subadmin@tripgalileo.com', 'admin@2026')}
                >
                  <span className="fw-bold small text-dark" style={{ fontSize: '11px' }}>🛡️ Sub-Admin Portal (Lead Operations)</span>
                  <span className="text-xxs fw-bold" style={{ color: '#7c3aed' }}>subadmin / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}
                  onClick={() => handleQuickLogin('partner_a@agency.com', 'admin@2026')}
                >
                  <span className="fw-bold small text-dark" style={{ fontSize: '11px' }}>💼 B2B Portal (Travel Partner Agency)</span>
                  <span className="text-xxs text-primary fw-bold">partner_a / admin@2026</span>
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2 border-0 small text-dark"
                  style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}
                  onClick={() => handleQuickLogin('driver@gmail.com', 'driver')}
                >
                  <span className="fw-bold small text-dark" style={{ fontSize: '11px' }}>🚗 Driver Portal (WOW GOA Fleet)</span>
                  <span className="text-xxs text-warning fw-bold">driver@gmail.com</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          initialIdentifier={username}
          onSuccessReturnToLogin={(usedId) => {
            if (usedId) setUsername(usedId);
            setPassword('');
            setErrorMsg('Password reset successfully! Please sign in with your new password.');
            setShowForgotPassword(false);
          }}
        />
      )}
    </div>,
    document.body
  );
}
