import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, Clock, FileText, CheckCircle2, ArrowRight, 
  HelpCircle, MessageSquare, Calendar, User, Mail, 
  Sparkles, AlertCircle, Check, ShieldCheck, Plane, 
  MapPin, Camera, AlertTriangle, Upload, X, ShieldAlert, 
  Award, Phone, Compass
} from 'lucide-react';
import { createLead } from '../../services/api';
import { COUNTRIES } from '../../utils/countryCurrencyData';

// ─── AUTHORITATIVE DATASETS (Maintained for cross-component compatibility) ───

export const POPULAR_NATIONALITIES = [
  { 
    code: 'GB', 
    name: 'United Kingdom', 
    flag: '🇬🇧', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Top Goa Visitor',
    popular: true,
    guidance: 'Direct charter and scheduled flights to Goa Mopa (GOX). Up to 180 days continuous stay per visit on multiple entry.'
  },
  { 
    code: 'RU', 
    name: 'Russia', 
    flag: '🇷🇺', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Charter Direct',
    popular: true,
    guidance: 'Regular charter flights direct to Goa Mopa & Dabolim. Up to 90 days continuous stay permitted per entry.'
  },
  { 
    code: 'DE', 
    name: 'Germany', 
    flag: '🇩🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: true,
    guidance: 'Schengen passport holders eligible for 30-Day, 1-Year, and 5-Year e-Tourist Visa. Max 90 days per stay.'
  },
  { 
    code: 'FR', 
    name: 'France', 
    flag: '🇫🇷', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: true,
    guidance: 'Biometric capture upon landing in Goa. Double or multiple entry available.'
  },
  { 
    code: 'US', 
    name: 'United States', 
    flag: '🇺🇸', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: '180 Days Stay',
    popular: true,
    guidance: 'Enjoy extended holiday stays up to 180 days per visit. 1-Year and 5-Year multiple entry e-Visas widely preferred.'
  },
  { 
    code: 'CA', 
    name: 'Canada', 
    flag: '🇨🇦', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: '180 Days Stay',
    popular: true,
    guidance: 'Canadian passport holders fully eligible for all e-Tourist visa categories. Continuous stay up to 180 days.'
  },
  { 
    code: 'AU', 
    name: 'Australia', 
    flag: '🇦🇺', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'High Demand',
    popular: true,
    guidance: 'Quick online ETA authorization. Stay up to 90 days continuous per visit on tourist category.'
  },
  { 
    code: 'KZ', 
    name: 'Kazakhstan', 
    flag: '🇰🇿', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Winter Sun Favorite',
    popular: true,
    guidance: 'Popular seasonal charter destination. Up to 90 days continuous stay at Goa beach resorts.'
  },
  { 
    code: 'IL', 
    name: 'Israel', 
    flag: '🇮🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Middle East',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Goa Favorite',
    popular: true,
    guidance: 'Long-standing favorite holiday destination in North & South Goa. ETA valid for double or multiple entries.'
  },
  { 
    code: 'AE', 
    name: 'United Arab Emirates', 
    flag: '🇦🇪', 
    stayLimit: 'e-Visa / VoA Eligible',
    region: 'Middle East',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Approx. $25–$40 / VoA Fee',
    badge: 'VoA & e-Visa',
    popular: true,
    guidance: 'Direct flights from Dubai & Sharjah to Goa Mopa (GOX) & Dabolim (GOI). Eligible for Visa-on-Arrival if previously issued Indian visa.'
  },
  { 
    code: 'IT', 
    name: 'Italy', 
    flag: '🇮🇹', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Easy online ETA with double or multiple entries. Permitted stay up to 90 days per visit.'
  },
  { 
    code: 'ES', 
    name: 'Spain', 
    flag: '🇪🇸', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Fast-track electronic travel authorization. Direct connection via Gulf hubs to Goa Mopa.'
  },
  { 
    code: 'NL', 
    name: 'Netherlands', 
    flag: '🇳🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Dutch passport holders enjoy seamless e-Visa approval. 30-day, 1-year and 5-year options.'
  },
  { 
    code: 'SE', 
    name: 'Sweden', 
    flag: '🇸🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Winter Sun',
    popular: false,
    guidance: 'Ideal for winter sun getaways in Goa. Multiple entry available for long vacations.'
  },
  { 
    code: 'CH', 
    name: 'Switzerland', 
    flag: '🇨🇭', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Quick online application turnaround. Continuous stay up to 90 days per visit.'
  },
  { 
    code: 'PL', 
    name: 'Poland', 
    flag: '🇵🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Direct charter connectivity during peak holiday season. Up to 90 days stay.'
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    flag: '🇯🇵', 
    stayLimit: 'VoA & e-Visa Eligible',
    region: 'Asia',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Official VoA / e-Visa Fee',
    badge: 'Visa on Arrival',
    popular: true,
    guidance: 'Special bilateral facility: Japanese nationals are eligible for Visa on Arrival (VoA) as well as online e-Visa.'
  },
  { 
    code: 'KR', 
    name: 'South Korea', 
    flag: '🇰🇷', 
    stayLimit: 'VoA & e-Visa Eligible',
    region: 'Asia',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Official VoA / e-Visa Fee',
    badge: 'Visa on Arrival',
    popular: true,
    guidance: 'South Korean passport holders benefit from both Visa on Arrival (VoA) and online e-Tourist visa facilities.'
  },
  { 
    code: 'SG', 
    name: 'Singapore', 
    flag: '🇸🇬', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Ultra Fast',
    popular: true,
    guidance: 'Fastest ETA processing turnaround. Direct and connecting flights into Goa via Singapore & Gulf carriers.'
  },
  { 
    code: 'MY', 
    name: 'Malaysia', 
    flag: '🇲🇾', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Excellent air connectivity. Double and multiple entry e-Visa valid for Goa entry.'
  },
  { 
    code: 'TH', 
    name: 'Thailand', 
    flag: '🇹🇭', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Fast-track electronic approval. Stay up to 90 days continuous per visit.'
  },
  { 
    code: 'PT', 
    name: 'Portugal', 
    flag: '🇵🇹', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Heritage Tie',
    popular: true,
    guidance: 'Strong historical & cultural ties with Goa. Eligible for all tourist e-Visa tiers with smooth processing.'
  },
  { 
    code: 'NZ', 
    name: 'New Zealand', 
    flag: '🇳🇿', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'High Demand',
    popular: false,
    guidance: 'Quick online issuance. Multiple entry options for exploring Goa and surrounding western coast.'
  },
  { 
    code: 'IE', 
    name: 'Ireland', 
    flag: '🇮🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Irish passport holders enjoy streamlined e-Visa granting with double or multiple entries.'
  },
  { 
    code: 'SA', 
    name: 'Saudi Arabia', 
    flag: '🇸🇦', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Middle East',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'High Demand',
    popular: false,
    guidance: 'Convenient flight connections via Gulf carriers directly into Goa Mopa Airport (GOX).'
  },
  { 
    code: 'ZA', 
    name: 'South Africa', 
    flag: '🇿🇦', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Other',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Holiday Fav',
    popular: false,
    guidance: 'South African citizens are eligible for standard e-Tourist visas with multiple entries.'
  },
  { 
    code: 'BR', 
    name: 'Brazil', 
    flag: '🇧🇷', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Culture Bond',
    popular: false,
    guidance: 'Warm shared cultural appreciation for music, beaches, and heritage in Goa.'
  },
  { 
    code: 'OTHER', 
    name: 'Other Eligible International Country', 
    flag: '🌐', 
    stayLimit: '165+ Countries Eligible',
    region: 'Other',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Standard Official Fee',
    badge: '165+ Eligible',
    popular: false,
    guidance: 'Over 165 countries are officially eligible for Indian e-Tourist visas. Inquire with our concierge desk for your passport country.'
  }
];

export const VISA_TYPES = [
  {
    id: '30days',
    title: '30-Day Tourist e-Visa',
    subtitle: 'Short Vacation / Beach Trip',
    entries: 'Double Entry',
    validity: '30 days from date of first entry into India',
    bestFor: '1 to 4 week holidays, charter flight guests',
    leadTime: 'Apply 30 to 4 days before flight',
    govtFee: 'Approx. $25–$40 Official Fee',
    processingHours: '24 to 72 Hours',
    features: ['Double entry permitted', 'Biometrics on arrival in Goa', 'Fast turnaround']
  },
  {
    id: '1year',
    title: '1-Year Tourist e-Visa',
    subtitle: '⭐ Most Popular for Goa Visitors',
    entries: 'Multiple Entry',
    validity: '365 days from date ETA is granted',
    bestFor: 'Winter sun stays, repeat trips, extended vacations',
    leadTime: 'Apply up to 120 days before flight',
    govtFee: 'Approx. $40 Official Fee',
    processingHours: '48 to 72 Hours',
    badge: 'Most Popular',
    features: ['Multiple entries over 365 days', 'Stay up to 90–180 days per visit', 'Great for holiday season']
  },
  {
    id: '5years',
    title: '5-Year Tourist e-Visa',
    subtitle: 'Frequent Travelers to India',
    entries: 'Multiple Entry',
    validity: '5 years from date ETA is granted',
    bestFor: 'Frequent travelers & regular Goa vacationers',
    leadTime: 'Apply up to 120 days before flight',
    govtFee: 'Approx. $80 Official Fee',
    processingHours: '48 to 96 Hours',
    badge: 'Best Value',
    features: ['Multiple entries over 5 full years', 'Max 90 or 180 days continuous stay', 'Best long-term value']
  }
];

// ─── PURE WHITE, FULL-WIDTH, STREAMLINED VISA SECTION ────────────────────────

export default function VisaSection({ 
  setActiveTab,
  initialCountry,
  initialType,
  initialAirport,
  initialTravelDate
}) {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry || 'GB');
  const [selectedType, setSelectedType] = useState(initialType || '1year');

  // Exact fields needed by a professional visa specialist
  const [formData, setFormData] = useState({
    givenName: '',
    surname: '',
    dob: '',
    gender: 'Male',
    nationality: initialCountry || 'GB',
    passportNumber: '',
    passportExpiry: '',
    arrivalDate: initialTravelDate || '',
    arrivalPort: initialAirport || 'GOX',
    stayLocation: '',
    travelers: '2',
    email: '',
    phoneCode: '+44',
    phone: '',
    docsViaWhatsApp: true, // Default to convenient WhatsApp flow to avoid mobile friction
    passportScanName: '',
    photoScanName: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [leadRef, setLeadRef] = useState(null);

  // Sync props
  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
      setFormData(prev => ({ ...prev, nationality: initialCountry }));
    }
  }, [initialCountry]);

  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialAirport) {
      setFormData(prev => ({ ...prev, arrivalPort: initialAirport }));
    }
  }, [initialAirport]);

  useEffect(() => {
    if (initialTravelDate) {
      setFormData(prev => ({ ...prev, arrivalDate: initialTravelDate }));
    }
  }, [initialTravelDate]);

  // Derive country and visa objects
  const country = useMemo(() => {
    return POPULAR_NATIONALITIES.find(c => c.code === selectedCountry) || POPULAR_NATIONALITIES[0];
  }, [selectedCountry]);

  const visa = useMemo(() => {
    return VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[1];
  }, [selectedType]);

  // Sync phone dial code when nationality changes
  useEffect(() => {
    const match = COUNTRIES.find(c => c.code === selectedCountry);
    if (match && match.dialCode) {
      setFormData(prev => ({ ...prev, phoneCode: match.dialCode }));
    }
  }, [selectedCountry]);

  // Real-time 6-month passport validity check
  const passportValidityWarning = useMemo(() => {
    if (!formData.passportExpiry) return null;
    const expiry = new Date(formData.passportExpiry);
    const travel = formData.arrivalDate ? new Date(formData.arrivalDate) : new Date();
    if (isNaN(expiry.getTime()) || isNaN(travel.getTime())) return null;

    const sixMonthsLater = new Date(travel);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (expiry < travel) {
      return 'Passport will be expired before your planned arrival date in Goa.';
    }
    if (expiry < sixMonthsLater) {
      return 'Indian Bureau of Immigration requires at least 6 months validity from arrival date. Your passport expires sooner; please renew.';
    }
    return null;
  }, [formData.passportExpiry, formData.arrivalDate]);

  // Form submission handler
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const generatedId = `VISA-${Date.now().toString(36).toUpperCase()}`;
    const cleanPhone = `${formData.phoneCode} ${formData.phone}`.trim();
    const fullName = `${formData.givenName} ${formData.surname}`.trim();

    try {
      const payload = {
        id: generatedId,
        name: fullName,
        phone: cleanPhone,
        email: formData.email.trim(),
        source: 'Goa Tourist Visa',
        service: `${visa.title} (${country.name})`,
        status: 'New',
        notes: [
          `Country: ${country.name} (${country.flag})`,
          `Category: ${visa.title}`,
          `Passport No: ${formData.passportNumber.toUpperCase().trim() || 'Pending'}`,
          `Passport Expiry: ${formData.passportExpiry || 'Not specified'}`,
          `DOB: ${formData.dob || 'Not specified'} | Gender: ${formData.gender}`,
          `Arrival Port: ${formData.arrivalPort === 'GOI' ? 'Dabolim Airport (GOI)' : formData.arrivalPort === 'SEAPORT' ? 'Mormugao Seaport' : 'Manohar Intl Mopa (GOX)'}`,
          `Arrival Date: ${formData.arrivalDate || 'Not specified'}`,
          `Goa Hotel/Stay: ${formData.stayLocation || 'Not specified'}`,
          `Travelers: ${formData.travelers} Pax`,
          `Docs Submission: ${formData.docsViaWhatsApp ? 'Sending on WhatsApp' : (formData.passportScanName ? `Attached: ${formData.passportScanName}` : 'Pending')}`,
          formData.notes ? `Guest Note: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      };

      await createLead(payload);
      setLeadRef(generatedId);
      setSent(true);
    } catch (err) {
      console.warn('[Visa Application] Lead save note:', err.message);
      setLeadRef(generatedId);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp Concierge Link
  const fullName = `${formData.givenName} ${formData.surname}`.trim() || 'Valued Guest';
  const whatsappUrl = `https://wa.me/919822144510?text=${encodeURIComponent(
    `Hello Wow Goa Visa Desk! My name is ${fullName}.${leadRef ? ` [Ref #${leadRef}]` : ''}\n` +
    `I am applying for an India Tourist e-Visa for Goa.\n` +
    `• Nationality: ${country.name} (${country.flag})\n` +
    `• Visa Category: ${visa.title}\n` +
    `• Passport No: ${formData.passportNumber || 'Provided in form'}\n` +
    `• Expected Arrival: ${formData.arrivalDate || 'Upcoming holiday'}\n` +
    `• Arrival Port: ${formData.arrivalPort === 'GOI' ? 'Dabolim Airport (GOI)' : formData.arrivalPort === 'SEAPORT' ? 'Mormugao Seaport' : 'Manohar Intl Airport Mopa (GOX)'}\n` +
    `• Travelers: ${formData.travelers} Pax\n` +
    `• Email: ${formData.email || 'Provided in form'}\n` +
    `Please verify my documents and advise on ETA issuance.`
  )}`;

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh', 
      width: '100%', 
      color: '#0f172a', 
      fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      
      {/* ── TOP HERO HEADER: FULL-WIDTH, CLEAN WHITE / SOFT SLATE ── */}
      <div style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '36px clamp(20px, 4vw, 56px)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: '#fff7ed', 
            border: '1px solid #fed7aa', 
            color: '#c2410c', 
            fontSize: '11.5px', 
            fontWeight: 700, 
            padding: '4px 12px', 
            borderRadius: '20px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.03em' 
          }}>
            <Globe size={13} color="#ea580c" />
            Official India Tourist e-Visa Desk · Goa
          </span>

          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            color: '#15803d', 
            fontSize: '11.5px', 
            fontWeight: 700, 
            padding: '4px 12px', 
            borderRadius: '20px' 
          }}>
            <ShieldCheck size={13} color="#16a34a" />
            99.4% Pre-Check Accuracy · 24–72h Approval
          </span>
        </div>

        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', 
          fontWeight: 800, 
          color: '#0f172a', 
          margin: '0 0 8px', 
          letterSpacing: '-0.02em', 
          lineHeight: 1.2 
        }}>
          Goa Tourist e-Visa <span style={{ color: '#ea580c' }}>Application</span>
        </h1>
        
        <p style={{ fontSize: '14.5px', color: '#475569', margin: 0, maxWidth: '880px', lineHeight: 1.55 }}>
          Direct electronic travel authorization for international visitors traveling to Goa. Verified by visa specialists before government filing to guarantee fast biometric entry at Manohar Intl (GOX) or Dabolim (GOI) airports.
        </p>
      </div>

      {/* ── VISA DURATION SELECTOR (3 CLEAN CARDS, FULL WIDTH) ── */}
      <div style={{ 
        padding: '28px clamp(20px, 4vw, 56px) 12px', 
        borderBottom: '1px solid #f1f5f9' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 2px', color: '#0f172a' }}>
              Choose Visa Duration
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Select the option that best fits your holiday duration in Goa:
            </p>
          </div>

          <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>
            {country.flag} Applying for {country.name} passport
          </span>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px'
        }}>
          {VISA_TYPES.map(vt => {
            const isSelected = selectedType === vt.id;
            return (
              <div
                key={vt.id}
                onClick={() => setSelectedType(vt.id)}
                style={{
                  background: isSelected ? '#fff7ed' : '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 16px rgba(234, 88, 12, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? '#ea580c' : '#0f172a' }}>
                    {vt.title}
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: isSelected ? '#fed7aa' : '#f1f5f9', 
                    color: isSelected ? '#9a3412' : '#475569' 
                  }}>
                    {vt.entries}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {vt.subtitle}
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingTop: '8px', 
                  borderTop: '1px solid #f1f5f9', 
                  fontSize: '11.5px', 
                  color: '#475569' 
                }}>
                  <span>Turnaround: <strong style={{ color: '#16a34a' }}>{vt.processingHours}</strong></span>
                  <span style={{ color: isSelected ? '#ea580c' : '#0284c7', fontWeight: 700 }}>
                    {isSelected ? '✓ Selected' : 'Select tier'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN SECTION: APPLICATION FORM (LEFT) + SUMMARY (RIGHT) ── */}
      <div style={{ 
        padding: '32px clamp(20px, 4vw, 56px) 56px' 
      }}>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.9fr) minmax(320px, 1fr)', 
          gap: '36px', 
          alignItems: 'start' 
        }}>
          
          {/* ── LEFT COLUMN: STREAMLINED FORM ── */}
          <div>
            {sent ? (
              /* Success Confirmation Card */
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '16px', 
                padding: '40px 32px', 
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
              }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: '#dcfce7', 
                  color: '#16a34a', 
                  marginBottom: '16px' 
                }}>
                  <CheckCircle2 size={38} />
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#166534' }}>
                  Visa Application Received
                </h3>

                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 800, 
                  color: '#15803d', 
                  background: '#dcfce7', 
                  display: 'inline-block', 
                  padding: '5px 16px', 
                  borderRadius: '8px', 
                  marginBottom: '18px' 
                }}>
                  Application Reference #{leadRef || 'VISA-GUEST'}
                </div>

                <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 24px', lineHeight: 1.6, maxWidth: '560px', marginInline: 'auto' }}>
                  Thank you, <strong>{fullName}</strong>! Your application for <strong>{visa.title}</strong> has been logged. Our duty officer has queued your documents for 24–72 hour expedited clearance.
                </p>

                {/* Summary Table */}
                <div style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  marginBottom: '24px',
                  fontSize: '13px',
                  lineHeight: 1.8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Applicant Name:</span>
                    <strong>{fullName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                    <span style={{ color: '#64748b' }}>Passport Number:</span>
                    <strong>{formData.passportNumber.toUpperCase() || 'Pending'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                    <span style={{ color: '#64748b' }}>Nationality:</span>
                    <strong>{country.flag} {country.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                    <span style={{ color: '#64748b' }}>Expected Arrival:</span>
                    <strong>{formData.arrivalDate || 'Upcoming Trip'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                    <span style={{ color: '#64748b' }}>Arrival Port:</span>
                    <strong>{formData.arrivalPort === 'GOI' ? 'Dabolim Airport (GOI)' : 'Manohar Intl Mopa (GOX)'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                    <span style={{ color: '#64748b' }}>Delivery Channel:</span>
                    <strong style={{ color: '#16a34a' }}>● Electronic PDF (ETA) via Email &amp; WhatsApp</strong>
                  </div>
                </div>

                {/* Primary WhatsApp Action */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: '#25D366',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '14.5px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                    marginBottom: '14px'
                  }}
                >
                  <MessageSquare size={18} /> Open WhatsApp to Connect with Visa Officer
                </a>

                {/* Submit Another Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setLeadRef(null);
                    setFormData({
                      givenName: '',
                      surname: '',
                      dob: '',
                      gender: 'Male',
                      nationality: selectedCountry,
                      passportNumber: '',
                      passportExpiry: '',
                      arrivalDate: '',
                      arrivalPort: 'GOX',
                      stayLocation: '',
                      travelers: '2',
                      email: '',
                      phoneCode: '+44',
                      phone: '',
                      docsViaWhatsApp: true,
                      passportScanName: '',
                      photoScanName: '',
                      notes: ''
                    });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#64748b',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Submit another applicant (e.g. family member or travel companion)
                </button>
              </div>
            ) : (
              /* The Clean Application Form */
              <form 
                onSubmit={handleSubmitApplication}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '16px', 
                  padding: '32px clamp(18px, 3vw, 36px)', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)' 
                }}
              >
                
                <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                    1. Applicant &amp; Passport Information
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Must match your passport Machine Readable Zone (MRZ) exactly to avoid airport boarding delays.
                  </p>
                </div>

                {/* Given Name & Surname (2 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Given / First &amp; Middle Name(s) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Edward"
                      value={formData.givenName}
                      onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Surname / Family Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smith"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* DOB, Gender & Nationality (3 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1.2fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Passport Nationality *
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        setFormData(prev => ({ ...prev, nationality: e.target.value }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      {POPULAR_NATIONALITIES.map(nat => (
                        <option key={nat.code} value={nat.code}>
                          {nat.flag} {nat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Passport Number & Expiry (2 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Passport Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456789"
                      value={formData.passportNumber}
                      onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        letterSpacing: '0.04em',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Passport Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.passportExpiry}
                      onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: passportValidityWarning ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Smart Passport Expiry Alert */}
                {passportValidityWarning && (
                  <div style={{ 
                    background: '#fffbeb', 
                    border: '1px solid #fde68a', 
                    borderRadius: '8px', 
                    padding: '9px 12px', 
                    fontSize: '12px', 
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                    <span>{passportValidityWarning}</span>
                  </div>
                )}

                {/* ── SECTION 2: TRAVEL & GOA STAY ── */}
                <div style={{ margin: '28px 0 20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                    2. Travel Schedule &amp; Goa Arrival
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Details required for Indian immigration entry port clearance.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Expected Arrival Date in Goa *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Goa Port of Entry *
                    </label>
                    <select
                      value={formData.arrivalPort}
                      onChange={(e) => setFormData({ ...formData, arrivalPort: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="GOX">Manohar Intl Mopa (GOX) - North Goa</option>
                      <option value="GOI">Dabolim Airport (GOI) - South Goa</option>
                      <option value="SEAPORT">Mormugao Seaport - Cruise Terminal</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Hotel, Resort or Area in Goa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Taj Fort Aguada, Candolim or Resort in Anjuna"
                      value={formData.stayLocation}
                      onChange={(e) => setFormData({ ...formData, stayLocation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Total Applicants / Travelers
                    </label>
                    <select
                      value={formData.travelers}
                      onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9.5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="1">1 Solo Traveler</option>
                      <option value="2">2 Couples / Friends</option>
                      <option value="3">3 Travelers</option>
                      <option value="4">4 Family Members</option>
                      <option value="5+">5+ Group Travel</option>
                    </select>
                  </div>
                </div>

                {/* ── SECTION 3: CONTACT & SUBMISSION ── */}
                <div style={{ margin: '28px 0 20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                    3. Contact &amp; ETA Delivery
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Your official approved Electronic Travel Authorization (ETA) PDF will be delivered directly here.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Email Address (Official ETA sent here) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john.smith@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      WhatsApp / Mobile Number *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '6px' }}>
                      <select
                        value={formData.phoneCode}
                        onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                        style={{
                          padding: '9.5px 6px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.dialCode}>
                            {c.flag} {c.dialCode}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 7911 123456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Convenient Document Submission Choice */}
                <div style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '14px 16px', 
                  margin: '16px 0' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Document Submission (Passport &amp; Photo)
                    </strong>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#ea580c', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={formData.docsViaWhatsApp}
                        onChange={(e) => setFormData({ ...formData, docsViaWhatsApp: e.target.checked })}
                        style={{ accentColor: '#ea580c' }}
                      />
                      <span>I will send documents via WhatsApp</span>
                    </label>
                  </div>

                  {formData.docsViaWhatsApp ? (
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                      ✓ <strong>Easy Mobile Flow:</strong> Submit your application details now, then simply forward your passport photo and scan directly to our Visa Officer on WhatsApp.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '8px' }}>
                      <label style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        background: '#ffffff'
                      }}>
                        <FileText size={18} color="#ea580c" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {formData.passportScanName || 'Passport Bio-Page'}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            {formData.passportScanName ? '✓ Attached' : 'Select PDF or Photo'}
                          </div>
                        </div>
                        <input type="file" accept=".pdf,image/*" onChange={(e) => setFormData({ ...formData, passportScanName: e.target.files?.[0]?.name || '' })} style={{ display: 'none' }} />
                      </label>

                      <label style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        background: '#ffffff'
                      }}>
                        <Camera size={18} color="#0284c7" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {formData.photoScanName || 'Passport Photo'}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            {formData.photoScanName ? '✓ Attached' : 'Select Photo (JPEG)'}
                          </div>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photoScanName: e.target.files?.[0]?.name || '' })} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Special Requests / Notes */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Special Requests or Airport Transfer Needs <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please arrange airport taxi transfer to Candolim villa, previously issued Indian visa holder, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#94a3b8' : '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{submitting ? 'Submitting to Visa Desk...' : `Submit Visa Application for ${country.name}`}</span>
                  <ArrowRight size={16} />
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12.5px',
                      color: '#15803d',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={14} /> Questions before applying? Chat directly with our Visa Officer
                  </a>
                </div>

              </form>
            )}
          </div>

          {/* ── RIGHT COLUMN: CLEAN SIDEBAR SUMMARY & WHATSAPP DESK ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Overview Card */}
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Award size={18} color="#ea580c" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ea580c' }}>
                  Application Overview
                </h4>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                {visa.title}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                {country.flag} Nationality: <strong style={{ color: '#0f172a' }}>{country.name}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Entries Permitted:</span>
                  <strong style={{ color: '#0284c7' }}>{visa.entries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Validity Period:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{visa.validity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Processing Turnaround:</span>
                  <strong style={{ color: '#16a34a' }}>24 to 72 Hours</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Official Gov Fee:</span>
                  <span style={{ color: '#c2410c', fontWeight: 700 }}>{visa.govtFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Arrival Port:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{formData.arrivalPort === 'GOI' ? 'Dabolim (GOI)' : 'Manohar Mopa (GOX)'}</span>
                </div>
              </div>
            </div>

            {/* What You Need Checklist */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '22px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#16a34a' }}>
                  What You Need
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>1.</span>
                  <div>
                    <strong>Passport with 6+ Months Validity</strong>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Minimum 2 blank pages for entry/exit stamps.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>2.</span>
                  <div>
                    <strong>Color Photograph</strong>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Plain white background, no eyeglasses.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>3.</span>
                  <div>
                    <strong>Goa Stay / Hotel Name</strong>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>Address of resort or villa for immigration.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Desk Direct Support */}
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: '16px', 
              padding: '22px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MessageSquare size={18} color="#16a34a" />
                <strong style={{ fontSize: '14.5px', color: '#14532d' }}>Direct Visa Desk Support</strong>
              </div>
              <p style={{ fontSize: '12.5px', color: '#166534', margin: '0 0 14px', lineHeight: 1.5 }}>
                Have questions regarding passport renewal, group families, or urgent charter flights?
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#25D366',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.2)'
                }}
              >
                <MessageSquare size={16} /> Chat on WhatsApp (+91 9822144510)
              </a>
            </div>

            {/* Official Legal Notice */}
            <div style={{ 
              fontSize: '11px', 
              color: '#94a3b8', 
              lineHeight: 1.5,
              padding: '0 4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <ShieldAlert size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Official Authority Notice:</strong> Wow Goa provides travel facilitation and document pre-checking. Granting of an Indian Visa or ETA is the sovereign prerogative of the Bureau of Immigration, Ministry of Home Affairs, Government of India.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
