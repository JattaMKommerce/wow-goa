import React, { useState } from 'react';
import { Building2, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import * as api from '../../services/api';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

export default function B2BLoginPage({ onLoginSuccess, onNavigateHome, onNavigateRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter your agency username/email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.b2bLogin(username, password);
      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError('Login failed: Invalid server response.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)', color: '#ffffff' }}>
      {/* Top Bar */}
      <div className="container py-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
          <div className="rounded-3 p-2 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <Compass size={22} />
          </div>
          <div>
            <span className="fw-black fs-5 tracking-wider text-white font-heading">WOW GOA</span>
            <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">B2B PORTAL</span>
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
              <Building2 size={28} />
            </div>
            <h4 className="fw-bold mb-1 font-heading">B2B Partner Portal</h4>
            <p className="text-white-50 text-xs mb-0">
              Travel Agent & Corporate Business Channel Login
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
                <label className="form-label text-xs fw-bold text-muted text-uppercase mb-1">Agency Username or Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="e.g. partner_agency or email@agency.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ fontSize: '0.88rem' }}
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
                    type="password"
                    className="form-control border-start-0 ps-0"
                    placeholder="Enter partner account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.88rem' }}
                  />
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
                style={{ fontSize: '0.92rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Authenticating Agency...</span>
                  </>
                ) : (
                  <>
                    <span>Enter B2B Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 text-center">
              <span className="text-muted text-xs">New to WOW GOA Partner Network? </span>
              <button
                type="button"
                className="btn btn-link p-0 text-xs fw-bold text-dark text-decoration-underline font-heading"
                onClick={onNavigateRegister}
              >
                Register as Partner / Vendor
              </button>
            </div>

            <div className="mt-4 pt-3 border-top text-center">
              <div className="d-flex align-items-center justify-content-center gap-2 text-muted text-xs mb-2">
                <ShieldCheck size={16} className="text-success" />
                <span>Verified B2B Business Channel • 256-Bit SSL Encrypted</span>
              </div>
              <p className="text-muted text-xxs mb-0">
                Want to become an official WOW GOA B2B travel partner? Contact <strong className="text-dark">b2b@wowgoa.in</strong> or WhatsApp <strong className="text-dark">+91 99999 88888</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container py-3 text-center text-white-50 text-xxs">
        &copy; {new Date().getFullYear()} WOW GOA B2B Travel Platform. All Rights Reserved.
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
