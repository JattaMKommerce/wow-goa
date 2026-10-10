import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Lock, Mail, Smartphone, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles
} from 'lucide-react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import * as api from '../services/api';

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  initialIdentifier = '',
  onSuccessReturnToLogin 
}) {
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password, 4: Success
  const [identifier, setIdentifier] = useState(initialIdentifier || '');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [devOtp, setDevOtp] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      lockScroll('forgot-password-modal');
      if (initialIdentifier && !identifier) {
        setIdentifier(initialIdentifier);
      }
      return () => {
        unlockScroll('forgot-password-modal');
      };
    } else {
      // Reset state when closed
      setStep(1);
      setErrorMsg('');
      setOtp('');
      setResetToken('');
      setMaskedTarget('');
      setDevOtp('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialIdentifier]);

  // Resend timer countdown
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Focus OTP input when entering step 2
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Please enter your registered email address or phone number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requestPasswordReset(cleanId);
      if (res && res.success) {
        setMaskedTarget(res.masked_target || cleanId);
        setResetToken(res.reset_token || '');
        setDevOtp(res.dev_otp || '');
        setStep(2);
        setResendCountdown(30);
      } else {
        setErrorMsg(res.error || 'Account not found. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not verify account. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.requestPasswordReset(identifier.trim());
      if (res && res.success) {
        setResetToken(res.reset_token || '');
        setDevOtp(res.dev_otp || '');
        setResendCountdown(45);
      } else {
        setErrorMsg(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyResetOtp(identifier.trim(), cleanOtp, resetToken);
      if (res && res.success) {
        setStep(3);
      } else {
        setErrorMsg(res.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.submitPasswordReset(
        identifier.trim(),
        otp.trim(),
        resetToken,
        newPassword.trim(),
        confirmPassword.trim()
      );
      if (res && res.success) {
        setStep(4);
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(newPassword);

  return createPortal(
    <div 
      className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(11, 25, 44, 0.72)', 
        backdropFilter: 'blur(10px)', 
        zIndex: 100000 
      }}
      onClick={onClose}
    >
      <div 
        className="card border-0 rounded-4 shadow-2xl overflow-hidden animate-fade-in-up"
        style={{ 
          maxWidth: '460px', 
          width: '100%', 
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(11, 25, 44, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 text-white position-relative"
          style={{ 
            background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
            borderBottom: '3px solid #FF6500'
          }}
        >
          <button 
            type="button" 
            className="btn-close btn-close-white position-absolute top-0 end-0 m-3 shadow-none cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          />

          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{ 
                width: '46px', 
                height: '46px', 
                background: 'linear-gradient(135deg, #FF6500 0%, #FF8A00 100%)' 
              }}
            >
              <KeyRound size={22} className="text-white" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold font-heading text-white">Reset Account Password</h5>
              <span className="text-white-50 text-xs">
                {step === 1 && "Step 1 of 3: Identify your account"}
                {step === 2 && "Step 2 of 3: Verify 6-digit OTP"}
                {step === 3 && "Step 3 of 3: Create new password"}
                {step === 4 && "Password Reset Complete"}
              </span>
            </div>
          </div>

          {/* Step Progress Line */}
          {step < 4 && (
            <div className="d-flex gap-1.5 mt-3 pt-2">
              <div 
                className="flex-fill rounded-pill" 
                style={{ height: '4px', background: step >= 1 ? '#FF6500' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} 
              />
              <div 
                className="flex-fill rounded-pill" 
                style={{ height: '4px', background: step >= 2 ? '#FF6500' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} 
              />
              <div 
                className="flex-fill rounded-pill" 
                style={{ height: '4px', background: step >= 3 ? '#FF6500' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} 
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4">
          {errorMsg && (
            <div className="alert alert-danger d-flex align-items-center gap-2 p-2.5 rounded-3 mb-3 text-xs border-0 shadow-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              <AlertCircle size={16} className="flex-shrink-0" />
              <div className="flex-grow-1">{errorMsg}</div>
            </div>
          )}

          {/* ================= STEP 1: IDENTIFIER ================= */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <p className="text-muted text-xs mb-3">
                Enter your registered <b>Email address</b>, <b>Mobile phone number</b>, or <b>Username</b>. We will send a secure 6-digit verification code to reset your password.
              </p>

              <div className="mb-4">
                <label className="form-label text-xs fw-bold text-uppercase text-secondary mb-1.5">
                  Email, Mobile, or Username
                </label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-light border-0 text-muted px-3">
                    {identifier.includes('@') ? <Mail size={16} /> : <Smartphone size={16} />}
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 py-2.5 text-sm"
                    placeholder="e.g. user@domain.com or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3 py-2 text-xs fw-bold text-muted"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="btn flex-grow-1 text-white fw-bold py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FF6500 0%, #FF8A00 100%)',
                    border: 'none',
                    opacity: (loading || !identifier.trim()) ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-3 text-center">
                <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-normal mb-2 d-inline-block">
                  Code sent to: <b>{maskedTarget || identifier}</b>
                </span>
                <p className="text-muted text-xs mb-0">
                  Please enter the 6-digit code sent to your registered contact. Code expires in 15 minutes.
                </p>
              </div>

              {/* Dev Test Quick Fill Helper */}
              {devOtp && (
                <div 
                  className="p-2 mb-3 rounded-3 text-center cursor-pointer select-none border border-warning"
                  style={{ background: '#FFFBEB' }}
                  onClick={() => setOtp(devOtp)}
                  title="Click to auto-fill development OTP"
                >
                  <span className="text-xs fw-bold text-amber-800 d-inline-flex align-items-center gap-1.5">
                    <Sparkles size={14} className="text-warning" />
                    <span>Dev Preview OTP: <b>{devOtp}</b> (Click to fill)</span>
                  </span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-uppercase text-secondary mb-1.5 text-center d-block">
                  Enter 6-Digit OTP
                </label>
                <div className="d-flex justify-content-center">
                  <input
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    className="form-control text-center fw-bold fs-4 rounded-3 border py-2"
                    style={{ 
                      maxWidth: '220px', 
                      letterSpacing: '0.45rem', 
                      borderColor: '#CBD5E1',
                      background: '#F8FAFC' 
                    }}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="text-center mb-4">
                <span className="text-xs text-muted">Didn't receive the code? </span>
                {resendCountdown > 0 ? (
                  <span className="text-xs text-muted fw-bold">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-xs fw-bold text-decoration-none"
                    style={{ color: '#FF6500' }}
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    Resend Code Now
                  </button>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3 py-2 text-xs fw-bold text-muted d-flex align-items-center gap-1"
                  onClick={() => { setStep(1); setErrorMsg(''); }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="btn flex-grow-1 text-white fw-bold py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FF6500 0%, #FF8A00 100%)',
                    border: 'none',
                    opacity: (loading || otp.length < 4) ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: NEW PASSWORD ================= */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p className="text-muted text-xs mb-3">
                Create a strong new password for your account. It must be at least 6 characters.
              </p>

              {/* New Password */}
              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-uppercase text-secondary mb-1">
                  New Password
                </label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-light border-0 text-muted px-3">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-control border-0 py-2.5 text-sm"
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-0 text-muted cursor-pointer"
                    onClick={() => setShowNewPass(!showNewPass)}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-1.5">
                    <div className="d-flex justify-content-between text-xxs mb-1">
                      <span className="text-muted" style={{ fontSize: '11px' }}>Strength:</span>
                      <span className="fw-bold" style={{ fontSize: '11px', color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="w-100 rounded-pill overflow-hidden" style={{ height: '4px', background: '#E2E8F0' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${(strength.score / 3) * 100}%`, 
                          background: strength.color,
                          transition: 'all 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="form-label text-xs fw-bold text-uppercase text-secondary mb-1">
                  Confirm New Password
                </label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-light border-0 text-muted px-3">
                    <ShieldCheck size={16} />
                  </span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-control border-0 py-2.5 text-sm"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-0 text-muted cursor-pointer"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="mt-1 text-xxs">
                    {newPassword === confirmPassword ? (
                      <span className="text-success fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                        <CheckCircle2 size={12} /> Passwords match
                      </span>
                    ) : (
                      <span className="text-danger fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                        <AlertCircle size={12} /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3 py-2 text-xs fw-bold text-muted d-flex align-items-center gap-1"
                  onClick={() => { setStep(2); setErrorMsg(''); }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="btn flex-grow-1 text-white fw-bold py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    opacity: (loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 4 && (
            <div className="text-center py-2">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-lg"
                style={{ 
                  width: '68px', 
                  height: '68px', 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                }}
              >
                <CheckCircle2 size={36} className="text-white" />
              </div>

              <h5 className="fw-bold text-dark font-heading mb-1.5">Password Reset Successfully!</h5>
              <p className="text-muted text-xs mb-4">
                Your credentials have been securely updated in the system. You can now sign in with your new password.
              </p>

              <button
                type="button"
                className="btn w-100 text-white fw-bold py-2.5 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #FF6500 0%, #FF8A00 100%)',
                  border: 'none'
                }}
                onClick={() => {
                  onClose();
                  if (onSuccessReturnToLogin) {
                    onSuccessReturnToLogin(identifier);
                  }
                }}
              >
                <span>Sign In to Account</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
