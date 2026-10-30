import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, 
  Sparkles, Lock, RefreshCw, X, User, Mail, Car, Compass, ChevronDown, Check
} from 'lucide-react';
import { sendCustomerOtp, verifyCustomerOtp } from '../../services/api';

/**
 * Demo Registered Goa Drivers for quick testing
 */
const DEMO_DRIVERS = [
  {
    id: 'drv_01',
    name: 'Rajesh Naik',
    phone: '9822100001',
    cabNumber: 'GA-03-Z-8821',
    carModel: 'Toyota Innova Crysta',
    location: 'Dabolim Airport (GOI)'
  },
  {
    id: 'drv_02',
    name: 'Suresh Shirodkar',
    phone: '9822100002',
    cabNumber: 'GA-07-T-4310',
    carModel: 'Maruti Suzuki Ertiga',
    location: 'North Goa (Calangute / Baga)'
  },
  {
    id: 'drv_03',
    name: 'Anthony D\'Souza',
    phone: '9822100003',
    cabNumber: 'GA-01-A-1904',
    carModel: 'Swift Dzire Tour',
    location: 'Panjim Central & Airport Transfer'
  }
];

/**
 * CabAuthScreen
 * Crisp, Modern White Theme (Ola / Uber Style) for WOW GOA Cabs Mobile App.
 */
export default function CabAuthScreen({ onAuthSuccess, onSkip, isNativeApp = false }) {
  // Role: 'customer' (Passenger/Rider) | 'driver' (Chauffeur Partner)
  const [role, setRole] = useState('customer');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Auth method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState('phone');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  
  // Passenger fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('Jenny'); // Default Jenny per user request
  
  // Driver fields
  const [selectedDriver, setSelectedDriver] = useState(DEMO_DRIVERS[0]);
  const [driverPhone, setDriverPhone] = useState(DEMO_DRIVERS[0].phone);
  
  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('4821');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // Focus first OTP box
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 200);
    }
  }, [step]);

  // Handle Request OTP
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (role === 'driver') {
      const cleanDriverPhone = driverPhone.replace(/\D/g, '');
      if (cleanDriverPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit driver mobile number.');
        return;
      }

      setIsLoading(true);
      const localOtp = '1234';
      setGeneratedOtp(localOtp);

      setTimeout(() => {
        setIsLoading(false);
        setInfoMsg(`Driver OTP sent to +91 ${cleanDriverPhone}. Use code ${localOtp} to start duty.`);
        setStep('otp');
        setResendTimer(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '']);
      }, 350);
      return;
    }

    // Customer
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (authMethod === 'email') {
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMsg('Please enter a valid Gmail or Email address.');
        return;
      }
    } else {
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsLoading(true);
    const localOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(localOtp);

    try {
      const res = await sendCustomerOtp(
        authMethod === 'phone' ? cleanPhone : '',
        authMethod === 'email' ? cleanEmail : ''
      );

      if (res && res.otp) {
        setGeneratedOtp(String(res.otp));
      }

      setInfoMsg(authMethod === 'email' 
        ? `4-digit code sent to ${cleanEmail}` 
        : `4-digit code sent to +91 ${cleanPhone}`);

      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
    } catch (err) {
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (value && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === 4) {
      verifyOtpCode(fullOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    const digits = generatedOtp.split('');
    setOtpDigits(digits);
    verifyOtpCode(generatedOtp);
  };

  // Verify OTP
  const verifyOtpCode = async (enteredCode) => {
    setIsLoading(true);
    setErrorMsg('');

    if (role === 'driver') {
      const cleanDriverPhone = driverPhone.replace(/\D/g, '');
      const valid = enteredCode === generatedOtp || enteredCode === '1234' || enteredCode === '4821';

      if (!valid) {
        setIsLoading(false);
        setErrorMsg('Invalid driver code. Use hint code 1234.');
        return;
      }

      const driverObj = {
        id: selectedDriver?.id || `drv_${cleanDriverPhone}`,
        name: selectedDriver?.name || `Goa Chauffeur ${cleanDriverPhone.slice(-4)}`,
        phone: `+91 ${cleanDriverPhone}`,
        email: `${(selectedDriver?.name || 'driver').toLowerCase().replace(/\s+/g, '')}@wowgoa.in`,
        role: 'chauffeur',
        cabNumber: selectedDriver?.cabNumber || 'GA-03-Z-8821',
        carModel: selectedDriver?.carModel || 'Toyota Innova Crysta',
        location: selectedDriver?.location || 'Dabolim Airport (GOI)',
        verifiedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('wowgoa_cab_user', JSON.stringify(driverObj));
        localStorage.setItem('active_role', 'DRIVER');
        localStorage.setItem('user', JSON.stringify(driverObj));
        localStorage.setItem('currentUser', JSON.stringify(driverObj));
      } catch (e) {}

      setIsLoading(false);
      onAuthSuccess(driverObj);
      return;
    }

    // Customer
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    try {
      let isSuccess = false;
      let returnedCust = null;

      if (enteredCode === generatedOtp || enteredCode === '1234' || enteredCode === '4821') {
        isSuccess = true;
      } else {
        const verifyRes = await verifyCustomerOtp(
          authMethod === 'phone' ? cleanPhone : '',
          authMethod === 'email' ? cleanEmail : '',
          enteredCode
        );
        if (verifyRes && verifyRes.success) {
          isSuccess = true;
          returnedCust = verifyRes.customer;
        }
      }

      if (isSuccess) {
        const userObj = {
          id: returnedCust?.id || (authMethod === 'email' ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`),
          name: fullName.trim() || returnedCust?.name || (authMethod === 'email' ? cleanEmail.split('@')[0] : 'Jenny'),
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : (returnedCust?.phone || '+91 9876543210'),
          email: cleanEmail || returnedCust?.email || 'jenny@example.com',
          authMethod: authMethod === 'email' ? 'gmail_otp' : 'phone_otp',
          role: 'customer',
          verifiedAt: new Date().toISOString()
        };

        try {
          localStorage.setItem('wowgoa_cab_user', JSON.stringify(userObj));
          localStorage.setItem('currentUser', JSON.stringify(userObj));
          localStorage.setItem('wowgoa_rider_name', userObj.name);
          if (userObj.phone) localStorage.setItem('wowgoa_rider_phone', userObj.phone);
          if (userObj.email) localStorage.setItem('wowgoa_rider_email', userObj.email);
        } catch (e) {}

        onAuthSuccess(userObj);
      } else {
        setErrorMsg('Invalid verification code. Please check your code.');
      }
    } catch (err) {
      if (enteredCode === generatedOtp || enteredCode === '1234') {
        const userObj = {
          id: authMethod === 'email' ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`,
          name: fullName.trim() || 'Jenny',
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : '+91 9876543210',
          email: cleanEmail || 'jenny@example.com',
          authMethod: authMethod === 'email' ? 'gmail_otp' : 'phone_otp',
          role: 'customer',
          verifiedAt: new Date().toISOString()
        };
        onAuthSuccess(userObj);
      } else {
        setErrorMsg('Invalid verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    const newOtp = role === 'driver' ? '1234' : String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newOtp);
    setResendTimer(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '']);
    setErrorMsg('');

    if (role === 'driver') {
      setInfoMsg('New code dispatched: ' + newOtp);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await sendCustomerOtp(
        authMethod === 'phone' ? cleanPhone : '',
        authMethod === 'email' ? cleanEmail : ''
      );
      if (res && res.otp) setGeneratedOtp(String(res.otp));
      setInfoMsg('New verification code dispatched.');
    } catch (e) {}
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      background: '#ffffff',
      color: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 20px 20px'
    }}>

      {/* ── TOP BAR: LOGO & ROLE DROPDOWN (CRISP WHITE THEME) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto 16px',
        position: 'relative',
        zIndex: 50
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px'
          }}>
            <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A' }}>
              WOW GOA
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: role === 'driver' ? '#059669' : '#D97706', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {role === 'driver' ? 'Chauffeur Partner' : 'Cabs & Self Drive'}
            </div>
          </div>
        </div>

        {/* ── ROLE DROPDOWN SELECTOR (Passenger vs Driver Partner) ── */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowRoleDropdown(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: role === 'driver' ? '#ECFDF5' : '#FFFBEB',
              border: role === 'driver' ? '1.5px solid #10B981' : '1.5px solid #F59E0B',
              borderRadius: '20px',
              padding: '7px 14px',
              color: role === 'driver' ? '#047857' : '#B45309',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <span>{role === 'driver' ? '🚖 Driver Partner' : '🚗 Passenger'}</span>
            <ChevronDown size={14} style={{ transform: showRoleDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Dropdown Menu */}
          {showRoleDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.15)',
              overflow: 'hidden',
              zIndex: 100,
              minWidth: '200px'
            }}>
              <div style={{ padding: '10px 14px 6px', fontSize: '10.5px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.6px' }}>
                Select Role:
              </div>

              {/* Passenger Option */}
              <button
                type="button"
                onClick={() => {
                  setRole('customer');
                  setShowRoleDropdown(false);
                  setStep('input');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  background: role === 'customer' ? '#FFFBEB' : '#ffffff',
                  color: role === 'customer' ? '#B45309' : '#1E293B',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚗</span>
                  <span>Passenger / Rider</span>
                </div>
                {role === 'customer' && <Check size={14} color="#B45309" />}
              </button>

              {/* Driver Option */}
              <button
                type="button"
                onClick={() => {
                  setRole('driver');
                  setShowRoleDropdown(false);
                  setStep('input');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  background: role === 'driver' ? '#ECFDF5' : '#ffffff',
                  color: role === 'driver' ? '#047857' : '#1E293B',
                  border: 'none',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚖</span>
                  <span>Driver Partner</span>
                </div>
                {role === 'driver' && <Check size={14} color="#047857" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (WHITE THEME) ── */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '10px 0'
      }}>

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: PHONE / EMAIL INPUT (CRISP OLA/UBER WHITE STYLE)
           ════════════════════════════════════════════════════════════════════ */}
        {step === 'input' && (
          <div>
            {role === 'customer' ? (
              /* ─── PASSENGER MODE (JENNY) ─── */
              <div>
                {/* Hero Titles */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#B45309',
                    marginBottom: '10px'
                  }}>
                    <Sparkles size={12} color="#B45309" />
                    <span>Goa Mobility Companion</span>
                  </div>

                  <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#0F172A', lineHeight: 1.15 }}>
                    Enter your mobile number
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                    We’ll send a 4-digit code to verify and get you moving in Goa.
                  </p>
                </div>

                {errorMsg && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '16px'
                  }}>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Phone Input (Ola/Uber Style Crisp White) */}
                  {authMethod === 'phone' ? (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}>
                        {/* Country Flag Badge */}
                        <div style={{
                          padding: '14px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRight: '1px solid #E2E8F0',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: '#0F172A',
                          background: '#F1F5F9'
                        }}>
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>

                        {/* Phone Number Field */}
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="98765 43210"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, ''));
                            setErrorMsg('');
                          }}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            padding: '14px 14px',
                            fontSize: '18px',
                            fontWeight: 800,
                            color: '#0F172A',
                            letterSpacing: '0.04em'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Gmail / Email Input */
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '16px',
                        padding: '0 14px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}>
                        <Mail size={18} color="#D97706" style={{ flexShrink: 0 }} />
                        <input
                          type="email"
                          placeholder="yourname@gmail.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorMsg('');
                          }}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            padding: '14px 12px',
                            fontSize: '15.5px',
                            fontWeight: 700,
                            color: '#0F172A'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rider Name (Jenny) */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '0 14px'
                    }}>
                      <User size={16} color="#94A3B8" />
                      <input
                        type="text"
                        placeholder="Passenger Name (e.g. Jenny)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          padding: '12px 10px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      />
                    </div>
                  </div>

                  {/* High-Contrast Bold Black CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (authMethod === 'email' ? !email.trim() : phone.length < 10)}
                    style={{
                      width: '100%',
                      background: (authMethod === 'email' ? email.trim() : phone.length >= 10) 
                        ? '#0B192C' 
                        : '#E2E8F0',
                      color: (authMethod === 'email' ? email.trim() : phone.length >= 10) ? '#ffffff' : '#94A3B8',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '15px',
                      fontSize: '15.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: (authMethod === 'email' ? email.trim() : phone.length >= 10) ? 'pointer' : 'not-allowed',
                      boxShadow: (authMethod === 'email' ? email.trim() : phone.length >= 10) ? '0 4px 16px rgba(11, 25, 44, 0.25)' : 'none',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.2px'
                    }}
                  >
                    {isLoading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={18} color="#FFB703" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch between Phone and Email */}
                <div style={{ textAlign: 'center', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod(authMethod === 'phone' ? 'email' : 'phone');
                      setErrorMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0F172A',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {authMethod === 'phone' ? 'Or continue with Email / Gmail' : 'Or continue with Phone Number'}
                  </button>
                </div>
              </div>
            ) : (
              /* ─── DRIVER PARTNER MODE (WHITE THEME) ─── */
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#059669',
                    marginBottom: '10px'
                  }}>
                    <span>🚖</span>
                    <span>Goa Chauffeur Network</span>
                  </div>

                  <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#0F172A' }}>
                    Chauffeur Duty Login
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                    Enter your registered driver phone number to start receiving trips.
                  </p>
                </div>

                {errorMsg && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '16px'
                  }}>
                    {errorMsg}
                  </div>
                )}

                {/* Quick Driver Profile Select */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                    Select Driver Account:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DEMO_DRIVERS.map((drv) => {
                      const isSelected = selectedDriver?.id === drv.id;
                      return (
                        <div
                          key={drv.id}
                          onClick={() => {
                            setSelectedDriver(drv);
                            setDriverPhone(drv.phone);
                            setErrorMsg('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '11px 14px',
                            borderRadius: '14px',
                            border: isSelected ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                            background: isSelected ? '#ECFDF5' : '#F8FAFC',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>{drv.name}</span>
                              <span style={{ fontSize: '10.5px', background: '#E2E8F0', padding: '1px 6px', borderRadius: '4px', color: '#047857', fontWeight: 800 }}>
                                {drv.cabNumber}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                              {drv.carModel} · {drv.location}
                            </div>
                          </div>
                          {isSelected && <Check size={16} color="#10B981" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Phone input */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      border: '1.5px solid #10B981',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRight: '1px solid #E2E8F0',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#0F172A',
                        background: '#ECFDF5'
                      }}>
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="Driver Mobile"
                        maxLength={10}
                        value={driverPhone}
                        onChange={(e) => {
                          setDriverPhone(e.target.value.replace(/\D/g, ''));
                          setErrorMsg('');
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          padding: '14px',
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#0F172A'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || driverPhone.length < 10}
                    style={{
                      width: '100%',
                      background: driverPhone.length >= 10 ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : '#E2E8F0',
                      color: driverPhone.length >= 10 ? '#ffffff' : '#94A3B8',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '15px',
                      fontSize: '15px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: driverPhone.length >= 10 ? 'pointer' : 'not-allowed',
                      boxShadow: driverPhone.length >= 10 ? '0 4px 16px rgba(16, 185, 129, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isLoading ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <span>Get Driver OTP to Start Duty</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: OTP VERIFICATION (CRISP WHITE DIGIT BOXES)
           ════════════════════════════════════════════════════════════════════ */}
        {step === 'otp' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setStep('input')}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0F172A'
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Enter 4-Digit Code
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {role === 'driver' 
                    ? `Dispatched to +91 ${driverPhone}` 
                    : (authMethod === 'email' ? `Sent to ${email}` : `Sent to +91 ${phone}`)}
                </span>
              </div>
            </div>

            {infoMsg && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#047857',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* 4 Crisp White Boxes */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              margin: '24px 0 20px'
            }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpInputRefs[idx]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '60px',
                    height: '66px',
                    borderRadius: '16px',
                    border: digit 
                      ? (role === 'driver' ? '2px solid #10B981' : '2px solid #0B192C') 
                      : '1.5px solid #CBD5E1',
                    background: digit ? '#F8FAFC' : '#ffffff',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#0F172A',
                    outline: 'none',
                    boxShadow: digit ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* 1-Tap Auto Fill Helper */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔑</span>
                <div>
                  <span style={{ fontSize: '11px', color: '#78350F', display: 'block' }}>
                    Instant Demo OTP:
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#B45309', letterSpacing: '0.08em' }}>
                    {generatedOtp}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                style={{
                  background: '#F59E0B',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Auto-Fill
              </button>
            </div>

            {/* Verify CTA */}
            <button
              type="button"
              onClick={() => verifyOtpCode(otpDigits.join(''))}
              disabled={isLoading || otpDigits.join('').length < 4}
              style={{
                width: '100%',
                background: otpDigits.join('').length === 4 
                  ? (role === 'driver' ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : '#0B192C') 
                  : '#E2E8F0',
                color: otpDigits.join('').length === 4 ? '#ffffff' : '#94A3B8',
                border: 'none',
                borderRadius: '16px',
                padding: '15px',
                fontSize: '15.5px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: otpDigits.join('').length === 4 ? 'pointer' : 'not-allowed',
                boxShadow: otpDigits.join('').length === 4 ? '0 4px 16px rgba(11, 25, 44, 0.25)' : 'none'
              }}
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>{role === 'driver' ? 'Verify & Enter Driver Portal' : 'Verify & Enter App'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Resend Option */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0B192C',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Resend Verification Code
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Resend code in <strong style={{ color: '#0F172A' }}>{resendTimer}s</strong>
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER: GOA ASSURANCE ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 600,
        textAlign: 'center',
        maxWidth: '440px',
        margin: '0 auto'
      }}>
        <ShieldCheck size={14} color="#10B981" />
        <span>Goa Tourism Certified · Zero Surge Guaranteed 24/7</span>
      </div>

    </div>
  );
}
