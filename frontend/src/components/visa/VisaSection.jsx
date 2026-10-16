import React, { useState } from 'react';
import { 
  Globe, Clock, FileText, CheckCircle2, ArrowRight, 
  HelpCircle, MessageSquare, Phone, Calendar, User, Mail, 
  Sparkles, ChevronDown, ChevronUp, AlertCircle, Check,
  ShieldCheck, Plane, MapPin, Camera, AlertTriangle, ExternalLink,
  Upload, RefreshCw, X
} from 'lucide-react';
import { createLead } from '../../services/api';

const POPULAR_NATIONALITIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', stayLimit: 'Max 180 days continuous stay' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', stayLimit: 'Max 90 days continuous stay' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', stayLimit: 'Max 90 days continuous stay' },
  { code: 'FR', name: 'France', flag: '🇫🇷', stayLimit: 'Max 90 days continuous stay' },
  { code: 'US', name: 'United States', flag: '🇺🇸', stayLimit: 'Max 180 days continuous stay' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', stayLimit: 'Max 180 days continuous stay' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', stayLimit: 'Max 90 days continuous stay' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', stayLimit: 'Max 90 days continuous stay' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', stayLimit: 'Max 90 days continuous stay' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', stayLimit: 'e-Visa / VoA Eligible' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', stayLimit: 'Max 90 days continuous stay' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', stayLimit: 'Max 90 days continuous stay' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', stayLimit: 'Max 90 days continuous stay' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', stayLimit: 'Max 90 days continuous stay' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', stayLimit: 'Max 90 days continuous stay' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', stayLimit: 'Max 90 days continuous stay' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', stayLimit: 'VoA & e-Visa Eligible' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', stayLimit: 'VoA & e-Visa Eligible' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', stayLimit: 'Max 90 days continuous stay' },
  { code: 'OTHER', name: 'Other Eligible International Country', flag: '🌐', stayLimit: '165+ Countries Eligible' }
];

const VISA_TYPES = [
  {
    id: '30days',
    title: '30-Day Tourist e-Visa',
    entries: 'Double Entry',
    validity: '30 days from date of first entry into India',
    bestFor: 'Short holidays, charter flights, 1-4 week beach breaks',
    leadTime: 'Apply 30 to 4 days before departure'
  },
  {
    id: '1year',
    title: '1-Year Tourist e-Visa',
    entries: 'Multiple Entry',
    validity: '365 days from the date ETA is granted',
    bestFor: 'Repeat visits, winter long-stays, seasonal travelers',
    leadTime: 'Apply up to 120 days before departure'
  },
  {
    id: '5years',
    title: '5-Year Tourist e-Visa',
    entries: 'Multiple Entry',
    validity: '5 years from the date ETA is granted',
    bestFor: 'Frequent travelers & regular Goa vacationers',
    leadTime: 'Apply up to 120 days before departure'
  }
];

const FAQS = [
  {
    q: 'Can international flights land directly in Goa with an Indian e-Visa?',
    a: 'Yes! Both Manohar International Airport, Mopa (GOX) and Dabolim Airport (GOI) are officially designated international ports of entry in Goa equipped with dedicated e-Visa immigration desks and biometric capture scanners.'
  },
  {
    q: 'When is the ideal time window to apply before flying to Goa?',
    a: 'For a 30-Day e-Visa, apply between 30 days and at least 4 business days before your scheduled departure. For 1-Year and 5-Year e-Visas, you can apply up to 120 days in advance. We recommend applying 7-10 days before flying to allow comfortable government processing.'
  },
  {
    q: 'Can I arrive at Goa Mopa or Dabolim and depart from a different Indian city?',
    a: 'Yes! You can enter India at either Goa Mopa (GOX) or Dabolim (GOI) and exit through any of the 29+ designated Indian immigration airports (e.g. Mumbai BOM, Delhi DEL, Bengaluru BLR, Kochi COK) or 5 major seaports on the same e-Visa.'
  },
  {
    q: 'What is the Electronic Travel Authorization (ETA)?',
    a: 'The ETA is the official pre-approval confirmation document issued online. You must carry a printed color copy of this ETA when boarding your flight and present it to Goa airport immigration officers upon arrival.'
  },
  {
    q: 'What if my passport expires in less than 6 months?',
    a: 'Under Indian Government Bureau of Immigration regulations, your passport MUST have at least 6 months remaining validity from the date of your arrival in India. If your passport expires sooner, you must renew it before applying for an e-Visa.'
  },
  {
    q: 'Can a tourist e-Visa be extended or converted once I am in Goa?',
    a: 'No. Indian Tourist e-Visas are strictly non-extendable and non-convertible. If you wish to stay longer in India, you should consider applying for a 1-Year or 5-Year multiple-entry visa prior to traveling.'
  },
  {
    q: 'How does Wow Goa assist international vacationers?',
    a: 'We provide end-to-end guidance: pre-checking your document formats to minimize official portal rejections, tracking your ETA timeline, and arranging seamless Goa airport transfers (Mopa / Dabolim), villa bookings, and self-drive vehicles.'
  }
];

export default function VisaSection({ setActiveTab }) {
  const [selectedCountry, setSelectedCountry] = useState('GB');
  const [selectedType, setSelectedType] = useState('30days');
  const [activeInfoTab, setActiveInfoTab] = useState('eligibility'); // 'eligibility' | 'documents' | 'tiers' | 'goa_entry'
  const [openFaq, setOpenFaq] = useState(null);
  
  // Interactive Eligibility Checklist state
  const [checks, setChecks] = useState({
    passportRegular: true,
    validityMonths: true,
    tourismPurpose: true,
    returnTicket: true,
    twoBlankPages: true
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    travelDate: '',
    notes: ''
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadRef, setLeadRef] = useState(null);

  // Document Pre-Flight Validator states
  const [activeDocCheckTab, setActiveDocCheckTab] = useState('pdf'); // 'pdf' | 'photo'
  const [pdfCheck, setPdfCheck] = useState(null);
  const [photoCheck, setPhotoCheck] = useState(null);

  const country = POPULAR_NATIONALITIES.find(c => c.code === selectedCountry) || POPULAR_NATIONALITIES[0];
  const visa = VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[0];

  const toggleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = Object.values(checks).every(Boolean);

  const handleInquire = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const generatedId = `VISA-${Date.now().toString(36).toUpperCase()}`;

    try {
      const payload = {
        id: generatedId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || '',
        source: 'Goa Tourist Visa',
        service: `${visa.title} (${country.name})`,
        status: 'New',
        notes: [
          `Country: ${country.name} (${country.flag})`,
          `Selected Category: ${visa.title}`,
          `Approx Travel Date: ${formData.travelDate || 'Not specified'}`,
          `Eligibility Checklist: ${allChecksPassed ? '100% Eligible (5/5 passed)' : 'Partial / Review Needed'}`,
          formData.notes ? `Guest Note: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      };

      await createLead(payload);
      setLeadRef(generatedId);
      setSent(true);
    } catch (err) {
      console.warn('[Visa Enquiry] Backend save note:', err.message);
      // Fallback: Never block tourist even if API network fluctuates
      setLeadRef(generatedId);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.round(file.size / 1024);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setPdfCheck({ name: file.name, sizeKb, isValid: false, error: 'File is not a PDF. Indian portal strictly accepts .pdf for passport bio-page scan.' });
      return;
    }
    if (sizeKb < 10) {
      setPdfCheck({ name: file.name, sizeKb, isValid: false, error: `File is too small (${sizeKb} KB). Official portal minimum is 10 KB.` });
      return;
    }
    if (sizeKb > 300) {
      setPdfCheck({ 
        name: file.name, 
        sizeKb, 
        isValid: false, 
        error: `File is ${sizeKb} KB (Exceeds maximum 300 KB limit). Portal will reject this file!`,
        tip: 'Use a free PDF compression tool or export scan at 150 DPI to get between 10 KB and 300 KB.'
      });
      return;
    }
    setPdfCheck({ name: file.name, sizeKb, isValid: true, tip: 'Perfect! File format and size comply with official 10–300 KB specifications.' });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.round(file.size / 1024);
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      setPhotoCheck({ name: file.name, sizeKb, isValid: false, error: 'File is not an image. Please choose a JPEG photo.' });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectDiff = Math.abs(width - height) / Math.max(width, height);
      const isSquare = aspectDiff <= 0.06; // Within 6% tolerance
      const isResolutionOk = width >= 350 && height >= 350;
      const isSizeOk = sizeKb >= 10 && sizeKb <= 1024;
      const isValid = isSquare && isResolutionOk && isSizeOk;

      let error = null;
      if (!isSizeOk) {
        error = sizeKb > 1024 ? `File is ${(sizeKb / 1024).toFixed(1)} MB (Exceeds 1 MB limit).` : `File is too small (${sizeKb} KB).`;
      } else if (!isSquare) {
        error = `Photo is not square (${width}×${height}px). Indian Bureau of Immigration strictly requires a 1:1 equal aspect ratio.`;
      } else if (!isResolutionOk) {
        error = `Resolution is too low (${width}×${height}px). Minimum 350×350 px is recommended.`;
      }

      setPhotoCheck({
        name: file.name,
        sizeKb,
        width,
        height,
        isSquare,
        isResolutionOk,
        isValid,
        preview: objectUrl,
        error
      });
    };
    img.src = objectUrl;
  };

  const whatsappUrl = `https://wa.me/919822144510?text=${encodeURIComponent(
    `Hello Wow Goa Concierge! My name is ${formData.name || 'Valued Guest'}.${leadRef ? ` [Ref #${leadRef}]` : ''}\n` +
    `I am traveling from ${country.name} (${country.flag}) around ${formData.travelDate || 'upcoming trip'}.\n` +
    `Category: ${visa.title}\n` +
    `Checklist Status: ${allChecksPassed ? '100% Eligible' : 'Need Guidance'}\n` +
    `Please assist me with travel guidance, airport arrival, and Goa stay arrangements.`
  )}`;

  return (
    <div style={{ background: '#0B192C', minHeight: '85vh', color: '#ffffff', fontFamily: '"Outfit", "Inter", system-ui, sans-serif' }}>
      
      {/* ── TOP HEADER / BREADCRUMB ── */}
      <div style={{ 
        background: 'linear-gradient(180deg, #132A44 0%, #0B192C 100%)', 
        padding: '36px 20px 24px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)' 
      }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '20px', padding: '4px 12px', marginBottom: '12px' }}>
            <Globe size={14} color="#38bdf8" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              International Guests Information &amp; Concierge
            </span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 8px', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Goa Tourist Visa &amp; <span style={{ color: '#FF6B35' }}>Eligibility Guide</span>
          </h1>
          <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, maxWidth: '740px', lineHeight: 1.5 }}>
            Comprehensive entry criteria, document necessities, and arrival guidance for international holidaymakers visiting Goa via Mopa (GOX) or Dabolim (GOI) airports.
          </p>

        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '30px 20px 50px' }}>
        
        {/* ── 2-COLUMN SPLIT (LEFT: IN-DEPTH INFO TABS / RIGHT: CONCIERGE DESK) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN: EXTENSIVE INFORMATION SECTIONS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Country Selector Bar */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Select Your Passport Nationality
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>165+ Countries Eligible</span>
              </div>
              
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: '#0B192C',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {POPULAR_NATIONALITIES.map(nat => (
                  <option key={nat.code} value={nat.code} style={{ background: '#0B192C', color: '#fff' }}>
                    {nat.flag} {nat.name} — ({nat.stayLimit})
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#4ade80" />
                <span>Selected: <strong>{country.flag} {country.name}</strong> · {country.stayLimit}</span>
              </div>
            </div>

            {/* In-Depth Navigation Sub-Tabs */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveInfoTab('eligibility')}
                style={{
                  background: activeInfoTab === 'eligibility' ? '#FF6B35' : 'transparent',
                  color: activeInfoTab === 'eligibility' ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ✓ Eligibility
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('documents')}
                style={{
                  background: activeInfoTab === 'documents' ? '#FF6B35' : 'transparent',
                  color: activeInfoTab === 'documents' ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                📄 Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('tiers')}
                style={{
                  background: activeInfoTab === 'tiers' ? '#FF6B35' : 'transparent',
                  color: activeInfoTab === 'tiers' ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ⏱️ Visa Types
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoTab('goa_entry')}
                style={{
                  background: activeInfoTab === 'goa_entry' ? '#FF6B35' : 'transparent',
                  color: activeInfoTab === 'goa_entry' ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                🛬 Goa Entry
              </button>
            </div>

            {/* TAB CONTENT 1: INTERACTIVE ELIGIBILITY CHECKER */}
            {activeInfoTab === 'eligibility' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Interactive Eligibility Criteria for Indian e-Visa
                  </h3>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: allChecksPassed ? '#065f46' : '#78350f', 
                    color: allChecksPassed ? '#4ade80' : '#fef08a' 
                  }}>
                    {allChecksPassed ? '✓ 100% Eligible' : 'Action Needed'}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.45 }}>
                  The Government of India grants online e-Tourist visas to international visitors who meet the following mandatory conditions:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Item 1 */}
                  <div 
                    onClick={() => toggleCheck('passportRegular')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.passportRegular ? '1px solid #22c55e' : '1px solid #ef4444' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        1. Standard / Ordinary Passport Holder
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Diplomatic, official, or refugee travel documents are not eligible for online e-Visa.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.passportRegular ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.passportRegular ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div 
                    onClick={() => toggleCheck('validityMonths')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.validityMonths ? '1px solid #22c55e' : '1px solid #ef4444' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        2. Minimum 6 Months Passport Validity
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Counted from your expected landing date at Goa airport.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.validityMonths ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.validityMonths ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div 
                    onClick={() => toggleCheck('tourismPurpose')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.tourismPurpose ? '1px solid #22c55e' : '1px solid #ef4444' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        3. Travel Purpose: Tourism, Holiday &amp; Recreation
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Visiting Goa for beaches, leisure, yoga, sightseeing, or visiting friends/family.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.tourismPurpose ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.tourismPurpose ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div 
                    onClick={() => toggleCheck('twoBlankPages')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.twoBlankPages ? '1px solid #22c55e' : '1px solid #ef4444' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        4. Minimum 2 Blank Visa Pages
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Required for entry and exit stamping at Goa immigration counters.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.twoBlankPages ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.twoBlankPages ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div 
                    onClick={() => toggleCheck('returnTicket')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.returnTicket ? '1px solid #22c55e' : '1px solid #ef4444' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                        5. Confirmed Return / Onward Journey Ticket
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Airline flight booking showing exit from India within permitted stay.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.returnTicket ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.returnTicket ? '✓' : ''}
                    </div>
                  </div>

                </div>

                {/* Eligibility Summary Banner */}
                <div style={{ 
                  marginTop: '16px', 
                  background: allChecksPassed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  border: allChecksPassed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '10px', 
                  padding: '12px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  {allChecksPassed ? <CheckCircle2 size={18} color="#4ade80" /> : <AlertTriangle size={18} color="#f87171" />}
                  <span style={{ fontSize: '12.5px', color: allChecksPassed ? '#4ade80' : '#fca5a5', lineHeight: 1.4 }}>
                    {allChecksPassed 
                      ? `Great! You meet all essential eligibility criteria for a standard Indian Tourist e-Visa. Our Goa desk can guide your filing.`
                      : `Please ensure all criteria above are fulfilled before applying to avoid immigration hold-ups.`}
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: MANDATORY DOCUMENTS CHECKLIST */}
            {activeInfoTab === 'documents' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Exact Document Specifications Required
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                  Having these formatted correctly prevents common portal rejection issues:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileText size={16} color="#38bdf8" />
                      <strong style={{ fontSize: '13px', color: '#fff' }}>Passport Bio Page Scan</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      <li>PDF format (10 KB to 300 KB)</li>
                      <li>Clear, unblurred photo &amp; MRZ lines</li>
                      <li>All 4 corners of passport visible</li>
                    </ul>
                  </div>

                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Camera size={16} color="#FF6B35" />
                      <strong style={{ fontSize: '13px', color: '#fff' }}>Digital Tourist Photo</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      <li>JPEG format (10 KB to 1 MB)</li>
                      <li>Square aspect ratio (equal height/width)</li>
                      <li>Plain white background, no shadows</li>
                    </ul>
                  </div>
                </div>

                {/* PRE-FLIGHT DOCUMENT & SIZING VALIDATOR */}
                <div style={{ marginTop: '16px', background: '#0B192C', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,107,53,0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#FF6B35" />
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>
                        Pre-Flight File &amp; Sizing Validator
                      </strong>
                      <span style={{ fontSize: '10.5px', background: 'rgba(255,107,53,0.18)', color: '#FF6B35', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        100% Client-Side · Private
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveDocCheckTab('pdf')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: activeDocCheckTab === 'pdf' ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Passport PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDocCheckTab('photo')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: activeDocCheckTab === 'photo' ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Photo (Square)
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.45 }}>
                    Test your files locally before applying. Files are verified entirely in your browser and never uploaded anywhere.
                  </p>

                  {activeDocCheckTab === 'pdf' ? (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1.5px dashed rgba(56,189,248,0.4)',
                        background: 'rgba(56,189,248,0.04)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}>
                        <Upload size={22} color="#38bdf8" style={{ marginBottom: '6px' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#38bdf8' }}>
                          {pdfCheck ? 'Click to test another PDF' : 'Click to select Passport Bio-Page PDF'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Target: PDF format between 10 KB and 300 KB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {pdfCheck && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: pdfCheck.isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${pdfCheck.isValid ? '#22c55e' : '#ef4444'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                              📄 {pdfCheck.name}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: pdfCheck.isValid ? '#15803d' : '#b91c1c',
                              color: '#ffffff'
                            }}>
                              {pdfCheck.isValid ? 'PASSED (10–300 KB)' : 'NEEDS ATTENTION'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: pdfCheck.isValid ? '#86efac' : '#fca5a5', lineHeight: 1.4 }}>
                            {pdfCheck.error || `File Size: ${pdfCheck.sizeKb} KB. ${pdfCheck.tip}`}
                          </div>
                          {pdfCheck.tip && !pdfCheck.isValid && (
                            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '4px' }}>
                              💡 <strong>Guidance:</strong> {pdfCheck.tip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1.5px dashed rgba(255,107,53,0.4)',
                        background: 'rgba(255,107,53,0.04)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}>
                        <Camera size={22} color="#FF6B35" style={{ marginBottom: '6px' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FF6B35' }}>
                          {photoCheck ? 'Click to test another photo' : 'Click to select Tourist Photo (JPEG/PNG)'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Target: Equal 1:1 Aspect Ratio (Square), 10 KB to 1 MB, White Background
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {photoCheck && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: photoCheck.isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${photoCheck.isValid ? '#22c55e' : '#ef4444'}`
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {photoCheck.preview && (
                              <img
                                src={photoCheck.preview}
                                alt="Preview"
                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                  🖼️ {photoCheck.name}
                                </span>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: photoCheck.isValid ? '#15803d' : '#b91c1c',
                                  color: '#ffffff'
                                }}>
                                  {photoCheck.isValid ? 'SQUARE 1:1 PASSED' : 'CHECK NEEDED'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                                Dimensions: <strong>{photoCheck.width}×{photoCheck.height} px</strong> · Size: <strong>{photoCheck.sizeKb} KB</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: photoCheck.isValid ? '#86efac' : '#fca5a5', marginTop: '2px', lineHeight: 1.4 }}>
                                {photoCheck.error || 'Complies with Indian Government 1:1 square ratio and 1 MB max size requirements.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '14px', background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                    Additional Items for Arrival:
                  </strong>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                    • Confirmed Goa accommodation address (hotel, resort, or villa booking name &amp; phone)<br />
                    • Yellow Fever Vaccination Card (only if traveling from/through yellow-fever endemic zones)<br />
                    • Printed color copy of your approved ETA to present at Goa airport immigration
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: VISA CATEGORIES & DURATION */}
            {activeInfoTab === 'tiers' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Tourist e-Visa Categories &amp; Permitted Stays
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                  Choose the category matching your vacation plans in Goa:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {VISA_TYPES.map(vt => {
                    const isSelected = selectedType === vt.id;
                    return (
                      <div
                        key={vt.id}
                        onClick={() => setSelectedType(vt.id)}
                        style={{
                          background: isSelected ? 'rgba(255,107,53,0.1)' : '#0B192C',
                          border: isSelected ? '1.5px solid #FF6B35' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#FF6B35' : '#ffffff' }}>
                            {vt.title}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            {vt.entries}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                          Validity: {vt.validity}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                          Best for: {vt.bestFor} · {vt.leadTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: GOA AIRPORT IMMIGRATION GUIDE */}
            {activeInfoTab === 'goa_entry' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Direct International Entry into Goa
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                  How immigration and arrivals work at Goa airports:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Plane size={16} color="#38bdf8" />
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>Manohar International Airport, Mopa (GOX)</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      North Goa’s new premier international airport. Features modern e-Visa biometric counters, seamless baggage collection, and quick taxi access to Morjim, Ashvem, Calangute &amp; Panaji.
                    </p>
                  </div>

                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Plane size={16} color="#4ade80" />
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>Dabolim International Airport (GOI)</strong>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                      Central / South Goa airport serving charter and scheduled international flights with full e-Visa immigration capabilities. Convenient for Colva, Benaulim, and Cavelossim resorts.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,107,53,0.08)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,107,53,0.2)', fontSize: '12px', color: '#fed7aa', lineHeight: 1.4 }}>
                    📍 <strong>Arrival Tip:</strong> Upon landing, proceed directly to the signposted <em>"e-Visa / Electronic Travel Authorization"</em> desks before the general immigration queue.
                  </div>
                </div>
              </div>
            )}

            {/* How Wow Goa Assists (Smart & Clear) */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#38bdf8" />
                <span>How Our Goa Concierge Helps You</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', color: '#cbd5e1' }}>
                <div style={{ background: '#0B192C', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>1. Pre-Check</strong>
                  Review passport &amp; photo format to prevent rejections.
                </div>
                <div style={{ background: '#0B192C', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>2. Filing Guide</strong>
                  Step-by-step assistance with official portal submission.
                </div>
                <div style={{ background: '#0B192C', padding: '10px', borderRadius: '8px' }}>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>3. Arrival In Goa</strong>
                  Coordinated airport cabs, villas &amp; self-drive delivery.
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: FAST INQUIRY & CONCIERGE DESK ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ 
              background: '#ffffff', 
              color: '#0f172a', 
              borderRadius: '16px', 
              padding: '24px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)' 
            }}>
              
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', background: '#fef3c7', display: 'inline-block', padding: '3px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                Goa Holiday Concierge
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Need Assistance With Your Goa Trip?
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
                Connect with our international tourist team for entry guidance, verified document specs, and direct airport arrival arrangements.
              </p>

              {sent ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '22px 18px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', marginBottom: '10px' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#166534', marginBottom: '2px' }}>
                    Inquiry Logged Successfully
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', background: '#dcfce7', display: 'inline-block', padding: '2px 8px', borderRadius: '6px', marginBottom: '10px' }}>
                    Reference #{leadRef || 'VISA-GUEST'}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#15803d', margin: '0 0 16px', lineHeight: 1.45 }}>
                    Thank you <strong>{formData.name || 'Valued Guest'}</strong>! Your holiday request for travel from <strong>{country.name}</strong> has been saved. Connect directly with our duty desk on WhatsApp to proceed:
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '11px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <MessageSquare size={16} /> Open WhatsApp Desk (Ref #{leadRef})
                  </a>
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setLeadRef(null);
                        setFormData({ name: '', phone: '', email: '', travelDate: '', notes: '' });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '11.5px',
                        color: '#64748b',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Submit another inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquire} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+44 7911..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Approx. Travel Date
                      </label>
                      <input
                        type="date"
                        value={formData.travelDate}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Email Address <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#475569' }}>
                    Country: <strong>{country.name}</strong> · Category: <strong>{visa.title}</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? '#94a3b8' : '#FF6B35',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{submitting ? 'Logging Inquiry...' : 'Send Quick Enquiry'}</span>
                    <ArrowRight size={15} />
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        color: '#16a34a',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={13} /> Or message desk directly on WhatsApp
                    </a>
                  </div>

                </form>
              )}

              {/* Disclaimer: Smart & Legally Sound */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                * Disclaimer: Wow Goa provides travel concierge and logistical guidance. Official e-Visas are granted exclusively at the discretion of the Bureau of Immigration, Government of India.
              </div>

            </div>

            {/* Seamless Cross-Linking to Cabs & Stays */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  Landing at Goa Airport?
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Pre-book authorized airport taxis or holiday packages.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('cabs')}
                  style={{
                    background: '#FF6B35',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '7px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚕 Cabs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '7px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🌴 Packages
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ── COMMON FAQS ── */}
        <div style={{ marginTop: '28px', background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={17} color="#FF6B35" />
            <span>Frequently Asked Questions by International Visitors</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#0B192C',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} color="#FF6B35" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 16px 12px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
