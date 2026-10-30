import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Phone, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, 
  Sparkles, Lock, RefreshCw, X, User, Mail, Car, Compass, ChevronDown, Check,
  Sun, Moon, Globe, MapPin, Award, Search
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
 * Languages Supported
 */
const LANGUAGES = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'kok', label: 'Konkani', native: 'कोंकणी' },
  { id: 'ru', label: 'Russian', native: 'Русский' },
  { id: 'mr', label: 'Marathi', native: 'मराठी' },
  { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'pt', label: 'Portuguese', native: 'Português' },
  { id: 'he', label: 'Hebrew', native: 'עברית' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
  { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

/**
 * Multi-Language UI Strings
 */
const I18N = {
  en: {
    chooseLang: 'Choose Language',
    selectLangSub: 'Select your preferred language',
    confirm: 'Confirm',
    continue: 'Continue',
    getMoving: 'Get moving with WOW GOA',
    enterOtp: 'Enter OTP',
    resendIn: 'Resend OTP in',
    change: 'Change',
    skip: 'Skip',
    terms: 'By continuing, you agree to the terms of service and privacy policy'
  },
  hi: {
    chooseLang: 'भाषा चुनें',
    selectLangSub: 'अपनी पसंदीदा भाषा चुनें',
    confirm: 'पुष्टि करें',
    continue: 'आगे बढ़ें',
    getMoving: 'WOW GOA के साथ यात्रा शुरू करें',
    enterOtp: 'OTP दर्ज करें',
    resendIn: 'पुनः भेजें',
    change: 'बदलें',
    skip: 'छोड़ें',
    terms: 'जारी रखकर, आप सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं'
  },
  kok: {
    chooseLang: 'भास वेंचून काडात',
    selectLangSub: 'तुमी पसंत केल्ली भास वेंचून काडात',
    confirm: 'निश्चीत करात',
    continue: 'फुडें वचात',
    getMoving: 'WOW GOA सयत प्रवास सुरू करात',
    enterOtp: 'OTP घालात',
    resendIn: 'परत धाडात',
    change: 'बदलात',
    skip: 'सोडात',
    terms: 'फुडें वचून, तुमी सेवा अटी आनी गोपनीयता धोरणाक मान्यताय दितात'
  },
  mr: {
    chooseLang: 'भाषा निवडा',
    selectLangSub: 'आपली पसंतीची भाषा निवडा',
    confirm: 'पुष्टी करा',
    continue: 'पुढे चालू ठेवा',
    getMoving: 'WOW GOA सह प्रवास सुरू करा',
    enterOtp: 'OTP प्रविष्ट करा',
    resendIn: 'पुन्हा पाठवा',
    change: 'बदला',
    skip: 'वगळा',
    terms: 'पुढे चालू ठेवून, आपण सेवा अटी आणि गोपनीयता धोरणास सहमती दर्शवता'
  }
};

/**
 * Onboarding Slides (Clarity, Trust, Freedom)
 */
const ONBOARDING_SLIDES = [
  {
    id: 'clarity',
    badge: 'ZERO SURGE PROMISE',
    title: 'CLARITY & HONEST FARES',
    description: "Fair pricing, crystal clear, Your trust, our promise sincere. With WOW GOA, you'll find no hidden fee, Transparency is our guarantee across Goa.",
    themeColor: '#FFB703',
    image: '/assets/mobile/slide_sunset.jpg'
  },
  {
    id: 'chauffeurs',
    badge: 'GOA TOURISM CERTIFIED',
    title: 'VERIFIED LOCAL DRIVERS',
    description: 'Travel safely with polite, background-verified tourist chauffeurs who know every beach, airport terminal, and scenic highway detour.',
    themeColor: '#10B981',
    image: '/assets/mobile/slide_airport.jpg'
  },
  {
    id: 'choice',
    badge: 'ALL-IN-ONE MOBILITY',
    title: 'CABS & SELF DRIVE IN ONE APP',
    description: 'Book point-to-point chauffeur cabs or rent Thar 4x4, Creta, Swift & Activa scooters with door-step delivery & unlimited kilometers.',
    themeColor: '#3B82F6',
    image: '/assets/mobile/slide_thar.jpg'
  }
];

export default function CabAuthScreen({ onAuthSuccess, onSkip, isNativeApp = false }) {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('wowgoa_cab_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('wowgoa_cab_theme', nextTheme);
    } catch (e) {}
  };

  const isDark = theme === 'dark';

  // Language state
  const [selectedLang, setSelectedLang] = useState(() => {
    try {
      return localStorage.getItem('wowgoa_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const t = I18N[selectedLang] || I18N.en;

  // Language live search query
  const [langSearch, setLangSearch] = useState('');
  const filteredLanguages = useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(l => 
      l.label.toLowerCase().includes(q) || 
      l.native.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  }, [langSearch]);

  // Flow Step: 'splash' -> 'language' -> 'onboarding' -> 'getmoving' -> 'otp'
  const [flowStep, setFlowStep] = useState('splash');

  // Onboarding slide index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto transition from splash after 1.4s
  useEffect(() => {
    if (flowStep === 'splash') {
      const timer = setTimeout(() => {
        setFlowStep('language');
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [flowStep]);

  // Role: 'customer' (Passenger/Rider) | 'driver' (Chauffeur Partner)
  const [role, setRole] = useState('customer');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Auth method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState('phone');
  
  // Passenger fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  
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
    if (flowStep === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [flowStep, resendTimer]);

  // Focus first OTP box
  useEffect(() => {
    if (flowStep === 'otp') {
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 200);
    }
  }, [flowStep]);

  // Handle Confirm Language
  const handleConfirmLanguage = () => {
    try {
      localStorage.setItem('wowgoa_lang', selectedLang);
    } catch (e) {}
    setFlowStep('onboarding');
  };

  // Handle Onboarding Next
  const handleNextOnboarding = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      try {
        localStorage.setItem('wowgoa_onboarded_completed', 'true');
      } catch (e) {}
      setFlowStep('getmoving');
    }
  };

  const handleSkipOnboarding = () => {
    try {
      localStorage.setItem('wowgoa_onboarded_completed', 'true');
    } catch (e) {}
    setFlowStep('getmoving');
  };

  // Handle Request OTP
  const handleSubmitInput = async (e) => {
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
        setInfoMsg(`Driver code sent to +91 ${cleanDriverPhone}. Use code ${localOtp} to start duty.`);
        setFlowStep('otp');
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

      setFlowStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
    } catch (err) {
      setFlowStep('otp');
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

  // Base background style
  const rootBg = isDark ? '#0F1216' : '#FFFFFF';
  const rootColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      background: rootBg,
      color: rootColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: flowStep === 'splash' ? '0' : '16px 20px',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>

      {/* ── BACKGROUND WATERMARK: WOW GOA LOGO AT AN ACUTE ANGLE (LOGGH / FAINT) ── */}
      <div style={{
        position: 'absolute',
        top: '48%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-25deg)',
        width: '320px',
        maxWidth: '82vw',
        height: '320px',
        opacity: isDark ? 0.05 : 0.075,
        pointerEvents: 'none',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}>
        <img 
          src="/wowgoa-logo.png" 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain'
          }} 
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 1: SPLASH SCREEN (WOW GOA LOGO + CAR ACCENT + SPINNER)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'splash' && (
        <div 
          onClick={() => setFlowStep('language')}
          style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Centered Brand Emblem */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: '#ffffff',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              border: '2px solid #FFB703',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}>
              <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* Glowing Brand Title with Car Accent */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 900, 
                letterSpacing: '1px',
                color: isDark ? '#FFFFFF' : '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>WOW GOA</span>
                <span style={{ color: '#FFB703', fontWeight: 900 }}>Cabs</span>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: isDark ? '#94A3B8' : '#64748B', 
                letterSpacing: '1.2px', 
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '4px 0 0'
              }}>
                Goa Tourism Certified Mobility
              </p>
            </div>
          </div>

          {/* Bottom Spinner / Loading Arc */}
          <div style={{
            position: 'absolute',
            bottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '3px solid rgba(255, 183, 3, 0.2)',
              borderTopColor: '#FFB703',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
              Tap anywhere to continue
            </span>
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 2: CHOOSE LANGUAGE (Exact Flow from Reference)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'language' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '12px 0 8px'
        }}>
          {/* Top Header & Normal Theme Button */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {t.chooseLang}
                </h1>
                <p style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#475569', margin: 0 }}>
                  {t.selectLangSub}
                </p>
              </div>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '7px 11px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>

            {/* Search Language Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isDark ? '#161B22' : '#FFFFFF',
                border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                borderRadius: '14px',
                padding: '0 14px',
                boxShadow: isDark ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.05)'
              }}>
                <Search size={16} color={isDark ? "#FFB703" : "#0F172A"} />
                <input
                  type="text"
                  placeholder="Search language (e.g. English, Русский, हिन्दी)..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    padding: '12px 0',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                {langSearch && (
                  <button
                    type="button"
                    onClick={() => setLangSearch('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDark ? '#94A3B8' : '#64748B',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Language Selection List (Scrollable) */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '9px',
              maxHeight: 'calc(100vh - 250px)',
              overflowY: 'auto',
              paddingRight: '2px'
            }}>
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <div
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '15px 16px',
                      borderRadius: '14px',
                      background: isSelected 
                        ? (isDark ? '#FFFFFF' : '#0F172A') 
                        : (isDark ? '#161B22' : '#FFFFFF'),
                      border: isSelected 
                        ? (isDark ? '2px solid #FFFFFF' : '2px solid #0F172A') 
                        : (isDark ? '1.5px solid #30363D' : '2px solid #0F172A'), // Visible borders in light mode
                      color: isSelected 
                        ? (isDark ? '#0F172A' : '#FFFFFF') 
                        : (isDark ? '#E6EDF3' : '#0F172A'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '15.5px', fontWeight: 800 }}>
                        {lang.label}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        marginLeft: '8px', 
                        opacity: isSelected ? 0.8 : 0.6,
                        fontWeight: 600
                      }}>
                        ({lang.native})
                      </span>
                    </div>

                    {/* Check Circle Icon */}
                    {isSelected ? (
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isDark ? '#0F172A' : '#FFB703',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#FFFFFF' : '#0F172A'
                      }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: isDark ? '1.5px solid #484F58' : '2px solid #CBD5E1'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Solid Yellow "Confirm" CTA Button */}
          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleConfirmLanguage}
              style={{
                width: '100%',
                background: '#FFB703',
                color: '#000000',
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 183, 3, 0.35)',
                letterSpacing: '0.3px'
              }}
            >
              <span>{t.confirm}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 3: ONBOARDING INTRO (Clarity / Trust / Carousel with Illustration)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'onboarding' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '10px 0 8px'
        }}>
          {/* Top Nav: Back & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
                else setFlowStep('language');
              }}
              style={{
                background: isDark ? '#1E293B' : '#FFFFFF',
                border: isDark ? '1px solid #475569' : '2px solid #0F172A',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleSkipOnboarding}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#FFB703' : '#0F172A',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px 10px'
              }}
            >
              {t.skip}
            </button>
          </div>

          {/* Classy Photographic Card (Mature, Ultra-Realistic Goa Photography) */}
          <div style={{
            borderRadius: '22px',
            overflow: 'hidden',
            height: '240px',
            width: '100%',
            position: 'relative',
            border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
            boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15, 23, 42, 0.1)',
            background: '#000000'
          }}>
            <img 
              src={ONBOARDING_SLIDES[currentSlide].image} 
              alt={ONBOARDING_SLIDES[currentSlide].title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.3s ease'
              }}
            />

            {/* Bottom Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
            }} />

            {/* Slide Badge Capsule */}
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '16px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: `1.5px solid ${ONBOARDING_SLIDES[currentSlide].themeColor}`,
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 900,
              color: ONBOARDING_SLIDES[currentSlide].themeColor,
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}>
              {ONBOARDING_SLIDES[currentSlide].badge}
            </div>
          </div>

          {/* Slide Text Content */}
          <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
            <h2 style={{ 
              fontSize: '22px', 
              fontWeight: 900, 
              color: isDark ? '#FFFFFF' : '#0F172A', 
              margin: '0 0 8px', 
              letterSpacing: '-0.01em' 
            }}>
              {ONBOARDING_SLIDES[currentSlide].title}
            </h2>
            <p style={{ 
              fontSize: '13px', 
              color: isDark ? '#94A3B8' : '#475569', 
              margin: 0, 
              lineHeight: 1.5 
            }}>
              {ONBOARDING_SLIDES[currentSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '12px 0 16px' }}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: currentSlide === idx ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlide === idx ? '#FFB703' : (isDark ? '#30363D' : '#CBD5E1'),
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Bottom Solid Yellow "Continue" CTA */}
          <div>
            <button
              type="button"
              onClick={handleNextOnboarding}
              style={{
                width: '100%',
                background: '#FFB703',
                color: '#000000',
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 183, 3, 0.35)',
                letterSpacing: '0.3px'
              }}
            >
              <span>{currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : t.continue}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 4: GET MOVING / AUTH INPUT (Bottom Sheet Style from Reference)
         ═════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'getmoving' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Top Bar with Language Pill & Normal Theme Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0 10px',
            zIndex: 50
          }}>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ffffff',
                border: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}>
                <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                WOW GOA
              </span>
            </div>

            {/* Top Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Language Selector Pill EN 🌐 */}
              <button
                type="button"
                onClick={() => setFlowStep('language')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #475569' : '2px solid #0F172A',
                  borderRadius: '20px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>{selectedLang.toUpperCase()}</span>
                <Globe size={13} />
                <ChevronDown size={11} />
              </button>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* WOW GOA Branded Emblem Area (Classy Logo instead of cartoon car) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 0 10px',
            position: 'relative'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              background: '#ffffff',
              border: isDark ? '2px solid #FFB703' : '2px solid #0F172A',
              boxShadow: isDark ? '0 10px 28px rgba(255, 183, 3, 0.3)' : '0 8px 24px rgba(15, 23, 42, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px'
            }}>
              <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em' }}>
                WOW GOA <span style={{ color: '#FFB703' }}>Cabs</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '3px' }}>
                Goa Tourism Certified Mobility
              </div>
            </div>
          </div>

          {/* Bottom Sheet Drawer Card */}
          <div style={{
            background: isDark ? '#161B22' : '#FFFFFF',
            border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '16px 20px 20px',
            boxShadow: isDark ? '0 -10px 30px rgba(0,0,0,0.5)' : '0 -10px 30px rgba(15, 23, 42, 0.12)',
            zIndex: 60
          }}>
            {/* Sheet Handle Bar */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: isDark ? '#484F58' : '#CBD5E1',
              margin: '0 auto 14px'
            }} />

            {/* Role Switcher Pill */}
            <div style={{
              display: 'flex',
              background: isDark ? '#0F1216' : '#F1F5F9',
              border: isDark ? '1px solid #30363D' : '1.5px solid #0F172A',
              borderRadius: '12px',
              padding: '3px',
              marginBottom: '16px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setRole('customer'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  borderRadius: '9px',
                  border: 'none',
                  background: role === 'customer' ? '#FFB703' : 'transparent',
                  color: role === 'customer' ? '#000000' : (isDark ? '#94A3B8' : '#64748B'),
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>🚗</span>
                <span>Passenger / Rider</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('driver'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  borderRadius: '9px',
                  border: 'none',
                  background: role === 'driver' ? '#10B981' : 'transparent',
                  color: role === 'driver' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>🚖</span>
                <span>Driver Partner</span>
              </button>
            </div>

            {/* Heading: Get moving with WOW GOA */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 900,
              color: isDark ? '#FFFFFF' : '#0F172A',
              margin: '0 0 14px',
              letterSpacing: '-0.02em'
            }}>
              {role === 'driver' ? 'Chauffeur Duty Login' : t.getMoving}
            </h2>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '2px solid #EF4444',
                color: '#B91C1C',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmitInput}>
              {role === 'customer' ? (
                <div>
                  {/* Phone / Email Input with Gold Focus Border */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#0D1117' : '#FFFFFF',
                      border: isDark ? '2px solid #FFB703' : '2px solid #0F172A',
                      borderRadius: '14px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '13px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRight: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #0F172A',
                        background: isDark ? '#161B22' : '#F1F5F9',
                        fontSize: '14px',
                        fontWeight: 900,
                        color: isDark ? '#FFB703' : '#0F172A'
                      }}>
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="Mobile number or Email"
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
                          padding: '13px 12px',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                      />
                    </div>
                  </div>


                </div>
              ) : (
                /* Driver Account Quick Select */
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
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
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isSelected 
                              ? '2px solid #10B981' 
                              : (isDark ? '1px solid #30363D' : '2px solid #0F172A'),
                            background: isSelected 
                              ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') 
                              : (isDark ? '#0D1117' : '#FFFFFF'),
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>{drv.name}</span>
                            <span style={{ fontSize: '10px', marginLeft: '6px', color: '#10B981', fontWeight: 700 }}>{drv.cabNumber}</span>
                          </div>
                          {isSelected && <Check size={14} color="#10B981" />}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isDark ? '#0D1117' : '#FFFFFF',
                    border: '2px solid #10B981',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <span style={{ padding: '11px', background: isDark ? '#161B22' : '#ECFDF5', fontSize: '13px', fontWeight: 800, color: '#10B981' }}>+91</span>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '11px', fontSize: '15px', fontWeight: 800, color: isDark ? '#fff' : '#000' }}
                    />
                  </div>
                </div>
              )}

              {/* Solid Yellow "Continue" Button */}
              <button
                type="submit"
                disabled={isLoading || (role === 'driver' ? driverPhone.length < 10 : phone.length < 10)}
                style={{
                  width: '100%',
                  background: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
                    ? '#FFB703' 
                    : (isDark ? '#21262D' : '#E2E8F0'),
                  color: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
                    ? '#000000' 
                    : (isDark ? '#64748B' : '#94A3B8'),
                  border: isDark ? 'none' : '2px solid #0F172A',
                  borderRadius: '14px',
                  padding: '15px',
                  fontSize: '15.5px',
                  fontWeight: 900,
                  cursor: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
                    ? '0 4px 16px rgba(255, 183, 3, 0.35)' 
                    : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {isLoading ? (
                  <span>Sending code...</span>
                ) : (
                  <>
                    <span>{t.continue}</span>
                    <ArrowRight size={17} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Legal Terms Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '10.5px',
              color: isDark ? '#8B949E' : '#64748B',
              lineHeight: 1.4
            }}>
              By continuing, you agree to the <span style={{ textDecoration: 'underline', color: isDark ? '#FFB703' : '#0F172A', fontWeight: 700 }}>terms of service</span> and <span style={{ textDecoration: 'underline', color: isDark ? '#FFB703' : '#0F172A', fontWeight: 700 }}>privacy policy</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 5: ENTER OTP SCREEN (Exact Flow & Structure from Reference)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'otp' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '10px 0 8px'
        }}>
          <div>
            {/* Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setFlowStep('getmoving')}
                style={{
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #475569' : '2px solid #0F172A',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#FFFFFF' : '#0F172A'
                }}
              >
                <ArrowLeft size={18} />
              </button>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>

            {/* Title & Phone with "Change" Link (from reference screenshot) */}
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t.enterOtp}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '16px' }}>🇮🇳</span>
              <span style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#E6EDF3' : '#0F172A' }}>
                {role === 'driver' ? `+91 ${driverPhone}` : `+91 ${phone || '9876543210'}`}
              </span>
              <button
                type="button"
                onClick={() => setFlowStep('getmoving')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFB703',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
              >
                {t.change}
              </button>
            </div>

            {infoMsg && (
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                border: isDark ? '1.5px solid #10B981' : '2px solid #059669',
                color: isDark ? '#34D399' : '#047857',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '2px solid #EF4444',
                color: '#B91C1C',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Label: Enter OTP */}
            <div style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#8B949E' : '#475569', marginBottom: '12px' }}>
              Enter OTP
            </div>

            {/* 4 Digit Boxes (With Rounded Corners & High Visibility Borders) */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px'
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
                    flex: 1,
                    height: '62px',
                    borderRadius: '14px',
                    border: digit
                      ? (isDark ? '2px solid #FFB703' : '2.5px solid #0F172A')
                      : (isDark ? '1.5px solid #30363D' : '2px solid #0F172A'), // Visible border in white mode
                    background: digit 
                      ? (isDark ? '#21262D' : '#F8FAFC') 
                      : (isDark ? '#161B22' : '#FFFFFF'),
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                />
              ))}
            </div>

            {/* Resend Timer Text */}
            <div style={{ marginBottom: '20px' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFB703',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Resend OTP Code
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: isDark ? '#8B949E' : '#64748B', fontWeight: 600 }}>
                  Resend OTP in <strong style={{ color: isDark ? '#FFB703' : '#0F172A' }}>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong>
                </span>
              )}
            </div>

            {/* 1-Tap Demo OTP Helper */}
            <div style={{
              background: isDark ? '#161B22' : '#FFFBEB',
              border: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #D97706',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: isDark ? '#8B949E' : '#78350F', display: 'block', fontWeight: 600 }}>
                  Instant Demo Code:
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#FFB703' : '#B45309', letterSpacing: '0.08em' }}>
                  {generatedOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                style={{
                  background: '#FFB703',
                  color: '#000000',
                  border: isDark ? 'none' : '1.5px solid #0F172A',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Auto-Fill
              </button>
            </div>
          </div>

          {/* Bottom Solid Yellow "Confirm" Button */}
          <div>
            <button
              type="button"
              onClick={() => verifyOtpCode(otpDigits.join(''))}
              disabled={isLoading || otpDigits.join('').length < 4}
              style={{
                width: '100%',
                background: otpDigits.join('').length === 4 
                  ? '#FFB703' 
                  : (isDark ? '#21262D' : '#E2E8F0'),
                color: otpDigits.join('').length === 4 
                  ? '#000000' 
                  : (isDark ? '#64748B' : '#94A3B8'),
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: otpDigits.join('').length === 4 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: otpDigits.join('').length === 4 
                  ? '0 4px 16px rgba(255, 183, 3, 0.35)' 
                  : 'none',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease'
              }}
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>{t.confirm}</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Clean Bottom Home Indicator Bar (Mobile App Feel) */}
      <div style={{
        width: '130px',
        height: '4px',
        borderRadius: '2px',
        background: isDark ? '#484F58' : '#CBD5E1',
        margin: '8px auto 0',
        zIndex: 10
      }} />

    </div>
  );
}
