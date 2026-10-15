import React, { useState } from 'react';
import { 
  Globe, ShieldCheck, Clock, FileText, CheckCircle2, ArrowRight, 
  HelpCircle, MessageSquare, Phone, Calendar, User, Mail, 
  Plane, Sparkles, Check, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';

const POPULAR_NATIONALITIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'FR', name: 'France', flag: '🇫🇷', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'US', name: 'United States', flag: '🇺🇸', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', eligibility: 'e-Tourist Visa / VoA Eligible', time: '48-72 Hours' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', eligibility: 'Visa on Arrival & e-Visa Eligible', time: 'Instant / 48h' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', eligibility: 'Visa on Arrival & e-Visa Eligible', time: 'Instant / 48h' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', eligibility: 'e-Tourist Visa (30d, 1yr, 5yr)', time: '72 Hours' },
  { code: 'OTHER', name: 'Other International Passports', flag: '🌐', eligibility: '165+ Countries Eligible', time: '72-96 Hours' }
];

const VISA_TIERS = [
  {
    id: '30days',
    title: '30-Day Double Entry e-Tourist Visa',
    badge: 'Most Popular for Vacations',
    validity: '30 days from date of first entry',
    entries: 'Double Entry',
    description: 'Perfect for standard Goa holidays, beach vacations, and charter flights.',
    processing: '2 to 4 working days',
    idealFor: 'Tourists visiting Goa for 1 to 4 weeks'
  },
  {
    id: '1year',
    title: '1-Year Multiple Entry e-Tourist Visa',
    badge: 'Best for Repeat Travelers',
    validity: '365 days from ETA grant date',
    entries: 'Multiple Entries (Max 90 or 180 days per visit)',
    description: 'Ideal if you plan multiple trips to Goa and India throughout the year.',
    processing: '3 to 4 working days',
    idealFor: 'Digital nomads, long-stay winter tourists & regular visitors'
  },
  {
    id: '5years',
    title: '5-Year Multiple Entry e-Tourist Visa',
    badge: 'Maximum Convenience',
    validity: '5 years from ETA grant date',
    entries: 'Multiple Entries (Max 90 or 180 days per stay)',
    description: 'Long term travel freedom with zero repeat visa hassles.',
    processing: '3 to 5 working days',
    idealFor: 'Frequent India & Goa travelers'
  }
];

const FAQS = [
  {
    q: 'Can I enter directly into Goa with an Indian e-Tourist Visa?',
    a: 'Yes! Both Manohar International Airport, Mopa (GOX) and Dabolim Airport (GOI) in Goa are authorized international ports of entry equipped with dedicated e-Visa immigration counters and biometrics.'
  },
  {
    q: 'How far in advance should I apply for my Goa tourist visa?',
    a: 'For the 30-Day e-Tourist Visa, you can submit your application 30 days to 4 days prior to your arrival. For the 1-Year or 5-Year e-Visa, you can apply up to 120 days prior to your arrival.'
  },
  {
    q: 'What basic documents do I need to prepare?',
    a: 'You only need: 1) A clear color scan of your passport bio-page with at least 6 months remaining validity, 2) A recent passport-size digital photograph with white background, and 3) Return flight or onward ticket details.'
  },
  {
    q: 'Can Wow Goa assist me with booking airport cabs and hotels once visa is approved?',
    a: 'Absolutely! Wow Goa provides complete 360° support: airport transfers from Mopa (GOX) or Dabolim (GOI), self-drive cars, luxury beach villas, and curated heritage tours so you do not have to leave our platform.'
  }
];

export default function VisaSection({ setActiveTab }) {
  const [selectedNationality, setSelectedNationality] = useState('GB');
  const [selectedTier, setSelectedTier] = useState('30days');
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    arrivalDate: '',
    travelersCount: '1',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const activeCountry = POPULAR_NATIONALITIES.find(n => n.code === selectedNationality) || POPULAR_NATIONALITIES[0];
  const activeVisaTier = VISA_TIERS.find(t => t.id === selectedTier) || VISA_TIERS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const whatsappInquiryUrl = `https://wa.me/919822144510?text=${encodeURIComponent(
    `Hi Wow Goa Team! I am planning a Goa vacation from ${activeCountry.name} (${activeCountry.flag}). I would like assistance with ${activeVisaTier.title}. My tentative arrival date is ${formData.arrivalDate || 'soon'}. Please assist me!`
  )}`;

  return (
    <div style={{ background: '#0B192C', minHeight: '80vh', color: '#ffffff', fontFamily: '"Outfit", "Inter", system-ui, sans-serif' }}>
      
      {/* ── HERO BANNER ── */}
      <div style={{ 
        background: 'linear-gradient(180deg, #1E3E62 0%, #0B192C 100%)', 
        padding: '50px 20px 40px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,53,0.18)', border: '1px solid rgba(255,107,53,0.4)', borderRadius: '24px', padding: '6px 16px', marginBottom: '16px' }}>
            <Sparkles size={16} color="#FF6B35" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              International Guests Concierge
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ maxWidth: '720px' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px', color: '#ffffff' }}>
                Goa & India Tourist <span style={{ color: '#FF6B35' }}>e-Visa Assistance</span>
              </h1>
              <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                Planning your dream holiday in Goa? International travelers from 165+ countries can obtain an official Indian e-Tourist Visa seamlessly. Explore verified requirements, choose your stay duration, and get dedicated concierge assistance directly from Wow Goa.
              </p>
            </div>

            {/* Quick Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#f8fafc' }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span>Direct Entry at <strong>Mopa (GOX)</strong> & <strong>Dabolim (GOI)</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#f8fafc' }}>
                <Clock size={16} color="#38bdf8" />
                <span>Fast <strong>72-Hour</strong> Standard Processing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#f8fafc' }}>
                <ShieldCheck size={16} color="#facc15" />
                <span>100% Official Govt Approved Guidelines</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN INTERACTIVE SECTION ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 60px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
          
          {/* ── LEFT: STEP-BY-STEP LOGICAL ELIGIBILITY & TIER SELECTOR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Step 1: Nationality Selector */}
            <div style={{ background: '#132238', borderRadius: '18px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF6B35', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                  1
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Select Your Nationality
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 14px' }}>
                Check instant e-Visa eligibility for Goa vacationers:
              </p>

              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#0B192C',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {POPULAR_NATIONALITIES.map(nat => (
                  <option key={nat.code} value={nat.code} style={{ background: '#0B192C', color: '#fff' }}>
                    {nat.flag} {nat.name} — {nat.eligibility}
                  </option>
                ))}
              </select>

              {/* Instant Eligibility Status Box */}
              <div style={{ 
                marginTop: '16px', 
                background: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                borderRadius: '12px', 
                padding: '14px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '10px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '26px' }}>{activeCountry.flag}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>
                      Eligible for India Tourist e-Visa
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                      {activeCountry.name} passport holders can apply online
                    </div>
                  </div>
                </div>
                <div style={{ background: '#0B192C', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  ⚡ ~{activeCountry.time}
                </div>
              </div>
            </div>

            {/* Step 2: Visa Tier Options */}
            <div style={{ background: '#132238', borderRadius: '18px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF6B35', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                  2
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Choose Your Stay Duration
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {VISA_TIERS.map(tier => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      style={{
                        background: isSelected ? 'rgba(255,107,53,0.12)' : '#0B192C',
                        border: isSelected ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? '#FF6B35' : '#ffffff' }}>
                            {tier.title}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {tier.entries}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          background: isSelected ? '#FF6B35' : 'rgba(255,255,255,0.1)', 
                          color: '#ffffff', 
                          padding: '3px 8px', 
                          borderRadius: '6px' 
                        }}>
                          {tier.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.4 }}>
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Checklist Pill Box */}
            <div style={{ background: '#132238', borderRadius: '18px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#FF6B35" />
                Mandatory Entry Requirements for Goa
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                <li>Original passport with at least <strong>6 months validity</strong> from date of arrival</li>
                <li>At least <strong>2 blank pages</strong> for stamping at Mopa (GOX) or Dabolim (GOI)</li>
                <li>Confirmed return flight ticket or onward journey booking</li>
                <li>Recent digital photograph with white background</li>
              </ul>
            </div>

          </div>

          {/* ── RIGHT: FAST ASSISTANCE ENQUIRY / CONCIERGE CARD ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            <div style={{ 
              background: '#ffffff', 
              color: '#0f172a', 
              borderRadius: '20px', 
              padding: '28px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px' }}>
                  Concierge Support
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Zero Service Fee Consultation</span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Get Visa Guidance & Holiday Concierge
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                Fill out your travel details and our Goa tourist team will assist you with official application steps, documentation, and arrival logistics.
              </p>

              {submitted ? (
                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '14px', padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px' }}>
                    ✓
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', margin: '0 0 6px' }}>
                    Enquiry Received!
                  </h4>
                  <p style={{ fontSize: '13px', color: '#047857', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Thank you {formData.fullName || 'Valued Guest'}! Our international guest concierge has received your request for <strong>{activeVisaTier.title}</strong>. We will message you on WhatsApp shortly.
                  </p>
                  <a
                    href={whatsappInquiryUrl}
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
                      padding: '11px 20px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13.5px'
                    }}
                  >
                    <MessageSquare size={16} /> Open WhatsApp Chat Directly
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Full Name (As on Passport) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Johnathan Smith"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Email Address *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        WhatsApp Number *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="tel"
                          required
                          placeholder="+44 7911 123456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13.5px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Expected Arrival in Goa *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="date"
                          required
                          value={formData.arrivalDate}
                          onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        No. of Travelers
                      </label>
                      <select
                        value={formData.travelersCount}
                        onChange={(e) => setFormData({ ...formData, travelersCount: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13.5px',
                          outline: 'none',
                          background: '#fff'
                        }}
                      >
                        <option value="1">1 Person (Solo)</option>
                        <option value="2">2 People (Couple)</option>
                        <option value="3-5">3 to 5 (Family/Group)</option>
                        <option value="6+">6+ (Large Group)</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#475569' }}>
                    Selected: <strong>{activeVisaTier.title}</strong> for <strong>{activeCountry.name}</strong> citizen
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #FF6B35 0%, #e55a2b 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '13px',
                      borderRadius: '12px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
                      marginTop: '4px'
                    }}
                  >
                    <span>Request Free Visa Assistance</span>
                    <ArrowRight size={16} />
                  </button>

                  <div style={{ textAlign: 'center', margin: '4px 0 0' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>or talk directly to our desk:</span>
                  </div>

                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      color: '#15803d',
                      textDecoration: 'none',
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}
                  >
                    <MessageSquare size={16} color="#25D366" />
                    <span>Instant WhatsApp Concierge (+91 98221 44510)</span>
                  </a>

                </form>
              )}

            </div>

            {/* Quick Link to Cabs & Hotels */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '18px 22px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  Need Goa Airport Pickups or Resort?
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Pre-book reliable chauffeur cabs or beachfront hotels directly.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('cabs')}
                  style={{
                    background: '#FF6B35',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚕 Goa Cabs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
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

        {/* ── FREQUENTLY ASKED QUESTIONS ACCORDION ── */}
        <div style={{ marginTop: '50px', background: '#132238', borderRadius: '20px', padding: '32px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={22} color="#FF6B35" />
            Frequently Asked Questions for International Visitors to Goa
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#0B192C',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#FF6B35" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 16px', fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
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
