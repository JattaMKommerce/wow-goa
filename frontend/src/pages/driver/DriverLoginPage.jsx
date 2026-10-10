import React, { useState } from 'react';
import {
  Car, Shield, CheckCircle2, Lock, Mail, Phone, User, MapPin,
  FileText, Upload, AlertCircle, Eye, EyeOff, Award, ArrowRight,
  ShieldCheck, Check, Navigation, Wallet, Clock, Headphones,
  Users, ChevronDown
} from 'lucide-react';
import * as api from '../../services/api';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

export default function DriverLoginPage({ onLoginSuccess, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login Form State (Clean Blank)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State (Clean Blank)
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    aadhaar_card: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    pan_card: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    license_number: '',
    license_card: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    experience_years: '',
    vehicle_details: ''
  });

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!loginPhone || !loginPassword) {
      setErrorMsg('Please enter both mobile number / email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const user = await api.loginUser(loginPhone, loginPassword);
      if (user) {
        if (onLoginSuccess) onLoginSuccess(user);
        window.history.pushState(null, '', '/driver');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid driver credentials. Please check your mobile/password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignupData(prev => ({
          ...prev,
          [field]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupData.name || !signupData.phone || !signupData.email || !signupData.password || !signupData.address) {
      setErrorMsg('Please fill in all mandatory personal details (Name, Phone, Email, Password, Address).');
      return;
    }

    if (!signupData.aadhaar_card) {
      setErrorMsg('Mandatory Document Missing: Aadhaar Card document is strictly required.');
      return;
    }

    if (!signupData.pan_card) {
      setErrorMsg('Mandatory Document Missing: PAN Card document is strictly required.');
      return;
    }

    if (!signupData.license_card && !signupData.license_number) {
      setErrorMsg('Mandatory Document Missing: Driving Licence Number and Document are strictly required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.driverSignUp(signupData);
      setSuccessMsg(res.message || 'Driver registration submitted successfully! Your account status is PENDING APPROVAL. Admin will review and activate your account.');
      setLoginPhone(signupData.email);
      setLoginPassword(signupData.password);
      setTimeout(() => {
        setActiveTab('login');
      }, 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit driver registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2.5rem 1rem' }}>
      
      {/* ─── MAIN CARD CONTAINER ────────────────────────────────────────────── */}
      <div 
        className="w-100 animate-fade-in-up" 
        style={{ 
          maxWidth: '1060px', 
          background: '#ffffff', 
          borderRadius: '24px', 
          overflow: 'hidden',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div className="row g-0 align-items-stretch">
          
          {/* ─── LEFT COLUMN: HERO, VALUE PROPS & BACKGROUND ───────────────── */}
          <div 
            className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-between position-relative text-start"
            style={{
              backgroundImage: `url('/driver-login-bg.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 65%',
              minHeight: '520px'
            }}
          >
            {/* Top Light Gradient for crisp contrast */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0) 100%)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />

            {/* Top Text Content */}
            <div className="position-relative" style={{ zIndex: 2 }}>
              <h1 className="fw-black mb-1.5" style={{ color: '#0F172A', fontSize: '2.4rem', letterSpacing: '-0.8px', lineHeight: 1.15 }}>
                Drive. <span style={{ color: '#FF5A1F' }}>Earn.</span> Explore.
              </h1>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem', maxWidth: '320px', color: '#334155', lineHeight: 1.4, fontWeight: 500 }}>
                Join thousands of drivers who are earning more on their own terms.
              </p>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: LOGIN / SIGNUP FORM ───────────────────────────── */}
          <div className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center bg-white text-start">
            
            {/* Logo & Header with Official Wow Goa Logo */}
            <div className="text-center mb-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <img
                  src="/wowgoa-logo.png"
                  alt="wowgoa.in"
                  style={{
                    height: '56px',
                    width: 'auto',
                    maxWidth: '220px',
                    objectFit: 'contain'
                  }}
                />
              </div>

              <h2 className="fw-extrabold text-dark mb-1" style={{ fontSize: '1.75rem', color: '#0F172A', letterSpacing: '-0.5px' }}>
                {activeTab === 'login' ? 'Driver Login' : 'Driver Registration'}
              </h2>
              <p className="text-muted small mb-0" style={{ fontSize: '0.85rem' }}>
                {activeTab === 'login' 
                  ? 'Welcome back! Please login to your account' 
                  : 'Join Goa\'s premier chauffeur network with verified documents'}
              </p>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.82rem', background: '#FEF2F2', borderColor: '#FCA5A5', color: '#B91C1C' }}>
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.82rem', background: '#ECFDF5', borderColor: '#6EE7B7', color: '#047857' }}>
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* 1. DRIVER LOGIN TAB                                             */}
            {/* ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} autoComplete="off">
                {/* Mobile Number / Email Input */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark mb-1.5" style={{ fontSize: '0.82rem' }}>Mobile Number</label>
                  <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <span className="input-group-text bg-white border-0 text-muted fw-semibold d-flex align-items-center gap-1 ps-3 pe-2" style={{ fontSize: '0.82rem', borderRight: '1px solid #E2E8F0' }}>
                      <Phone size={13} className="text-muted" />
                      <span>+91</span>
                      <ChevronDown size={12} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 ps-3 py-2.5 fw-semibold"
                      placeholder=""
                      autoComplete="off"
                      name="driver_login_phone"
                      id="driver_login_phone"
                      style={{ fontSize: '0.88rem', outline: 'none', boxShadow: 'none' }}
                      value={loginPhone}
                      onChange={e => setLoginPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="mb-2">
                  <label className="form-label small fw-bold text-dark mb-1.5" style={{ fontSize: '0.82rem' }}>Password</label>
                  <div className="input-group" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <span className="input-group-text bg-white border-0 text-muted ps-3">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-0 ps-2 py-2.5 fw-semibold"
                      placeholder=""
                      autoComplete="new-password"
                      name="driver_login_pwd"
                      id="driver_login_pwd"
                      style={{ fontSize: '0.88rem', outline: 'none', boxShadow: 'none' }}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white border-0 text-muted pe-3 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex align-items-center justify-content-between mb-4 mt-2.5">
                  <div className="form-check d-flex align-items-center gap-1.5 mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0 cursor-pointer"
                      id="driver_remember"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#FF5A1F' }}
                    />
                    <label className="form-check-label text-muted small cursor-pointer" htmlFor="driver_remember" style={{ fontSize: '0.8rem' }}>
                      Remember me
                    </label>
                  </div>
                  <a
                    href="#forgot"
                    className="text-decoration-none small fw-bold cursor-pointer"
                    style={{ color: '#FF5A1F', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn w-100 py-2.5 fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-3 mb-4"
                  style={{
                    background: 'linear-gradient(90deg, #FF5A1F 0%, #FF6F1F 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.92rem',
                    boxShadow: '0 6px 16px -3px rgba(255, 90, 31, 0.4)'
                  }}
                  disabled={loading}
                >
                  <User size={16} />
                  <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
                </button>

                {/* Footer Switch */}
                <div className="text-center small text-muted pt-1" style={{ fontSize: '0.83rem' }}>
                  New to Wow Goa?{' '}
                  <span 
                    className="fw-bold cursor-pointer" 
                    style={{ color: '#FF5A1F' }}
                    onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
                  >
                    Register Now
                  </span>
                </div>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* 2. DRIVER REGISTRATION (SIGN UP) TAB                           */}
            {/* ─────────────────────────────────────────────────────────────── */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} autoComplete="off">
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-semibold"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.name}
                      onChange={e => setSignupData({ ...signupData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm fw-semibold"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.phone}
                      onChange={e => setSignupData({ ...signupData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-control form-control-sm fw-semibold"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.email}
                      onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Password *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm fw-semibold"
                      placeholder=""
                      autoComplete="new-password"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Goa Residential Address *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.address}
                      onChange={e => setSignupData({ ...signupData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Driving Experience (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.experience_years}
                      onChange={e => setSignupData({ ...signupData, experience_years: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.78rem' }}>Vehicle Details (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder=""
                      autoComplete="off"
                      value={signupData.vehicle_details}
                      onChange={e => setSignupData({ ...signupData, vehicle_details: e.target.value })}
                    />
                  </div>
                </div>

                {/* Mandatory Documents Upload Box */}
                <div className="p-3 rounded-3 mb-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <div className="fw-bold text-dark small mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                    <ShieldCheck size={14} style={{ color: '#FF5A1F' }} />
                    <span>Mandatory Verification Documents (Required)</span>
                  </div>
                  
                  <div className="row g-2 mt-1">
                    <div className="col-12">
                      <label className="form-label text-muted mb-0.5" style={{ fontSize: '0.7rem' }}>DL Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder=""
                        autoComplete="off"
                        value={signupData.license_number}
                        onChange={e => setSignupData({ ...signupData, license_number: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>Aadhaar *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        style={{ fontSize: '0.7rem' }}
                        onChange={e => handleFileUpload('aadhaar_card', e)}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>PAN Card *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        style={{ fontSize: '0.7rem' }}
                        onChange={e => handleFileUpload('pan_card', e)}
                      />
                    </div>

                    <div className="col-4">
                      <label className="form-label text-muted mb-0.5" style={{ fontSize: '0.68rem' }}>DL Photo *</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        style={{ fontSize: '0.7rem' }}
                        onChange={e => handleFileUpload('license_card', e)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-2.5 fw-bold text-white shadow-sm rounded-3 mb-2"
                  style={{ background: 'linear-gradient(90deg, #FF5A1F 0%, #FF7A1F 100%)', border: 'none', borderRadius: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Submitting Documents...' : 'Submit Driver Registration for Approval'}
                </button>

                <div className="text-center small text-muted" style={{ fontSize: '0.82rem' }}>
                  Already registered?{' '}
                  <span 
                    className="fw-bold cursor-pointer" 
                    style={{ color: '#FF5A1F' }}
                    onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                  >
                    Driver Sign In
                  </span>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* ─── BOTTOM TRUST BADGES STRIP ────────────────────────────────────────── */}
      <div 
        className="w-100 mt-4 px-3 py-3 shadow-sm d-flex flex-wrap align-items-center justify-content-around gap-3 text-start"
        style={{ 
          maxWidth: '1060px', 
          background: '#ffffff', 
          borderRadius: '16px',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
          border: '1px solid #F1F5F9'
        }}
      >
        {/* 1. Verified Platform */}
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', background: '#FFF1EB', color: '#FF5A1F' }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>Verified Platform</div>
            <div className="text-muted" style={{ fontSize: '0.73rem' }}>100% trusted & reliable</div>
          </div>
        </div>

        {/* 2. Best Earnings */}
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', background: '#ECFDF5', color: '#10B981' }}
          >
            <span className="fw-black fs-6">₹</span>
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>Best Earnings</div>
            <div className="text-muted" style={{ fontSize: '0.73rem' }}>More trips, more earnings</div>
          </div>
        </div>

        {/* 3. 24/7 Support */}
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', background: '#EFF6FF', color: '#3B82F6' }}
          >
            <Headphones size={18} />
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>24/7 Support</div>
            <div className="text-muted" style={{ fontSize: '0.73rem' }}>We're here to help you</div>
          </div>
        </div>

        {/* 4. Driver Benefits */}
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', background: '#F5F3FF', color: '#8B5CF6' }}
          >
            <Users size={18} />
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>Driver Benefits</div>
            <div className="text-muted" style={{ fontSize: '0.73rem' }}>Exclusive offers & rewards</div>
          </div>
        </div>

      </div>

      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          initialIdentifier={loginPhone}
          onSuccessReturnToLogin={(usedId) => {
            if (usedId) setLoginPhone(usedId);
            setLoginPassword('');
            setSuccessMsg('Password reset successfully! Please sign in with your new password.');
            setShowForgotPassword(false);
          }}
        />
      )}

    </div>
  );
}
