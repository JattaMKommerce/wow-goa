import React, { useState } from 'react';
import { 
  Globe, Clock, FileText, CheckCircle2, ArrowRight, 
  HelpCircle, MessageSquare, Phone, Calendar, User, Mail, 
  Sparkles, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';

const POPULAR_NATIONALITIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'OTHER', name: 'Other International Passport', flag: '🌐' }
];

const VISA_TYPES = [
  {
    id: '30days',
    title: '30-Day Tourist e-Visa',
    subtitle: 'Double Entry · Suitable for short vacations & charter trips',
    typicalTime: 'Approx. 3-4 days prior to travel'
  },
  {
    id: '1year',
    title: '1-Year Tourist e-Visa',
    subtitle: 'Multiple Entry · Ideal for winter stay & repeat holidays',
    typicalTime: 'Apply up to 120 days in advance'
  },
  {
    id: '5years',
    title: '5-Year Tourist e-Visa',
    subtitle: 'Multiple Entry · Maximum convenience for regular visitors',
    typicalTime: 'Long term multi-trip travel'
  }
];

const FAQS = [
  {
    q: 'Can international flights land directly in Goa?',
    a: 'Yes, both Manohar International Airport, Mopa (GOX) and Dabolim Airport (GOI) handle international arrivals with dedicated e-Visa immigration counters.'
  },
  {
    q: 'When should I apply before traveling?',
    a: 'Official portals typically recommend submitting your e-Visa application between 30 days and 4 days before your scheduled flight to Goa.'
  },
  {
    q: 'What basic documents are required?',
    a: 'A passport with at least 6 months validity, a digital passport photo with white background, and confirmed return flight details.'
  }
];

export default function VisaSection({ setActiveTab }) {
  const [selectedCountry, setSelectedCountry] = useState('GB');
  const [selectedType, setSelectedType] = useState('30days');
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    travelDate: ''
  });
  const [sent, setSent] = useState(false);

  const country = POPULAR_NATIONALITIES.find(c => c.code === selectedCountry) || POPULAR_NATIONALITIES[0];
  const visa = VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[0];

  const handleInquire = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const whatsappUrl = `https://wa.me/919822144510?text=${encodeURIComponent(
    `Hello Wow Goa, I am an international traveler from ${country.name} (${country.flag}) planning a trip to Goa around ${formData.travelDate || 'upcoming season'}. Looking for travel guidance and holiday concierge.`
  )}`;

  return (
    <div style={{ background: '#0B192C', minHeight: '80vh', color: '#ffffff', fontFamily: '"Outfit", "Inter", system-ui, sans-serif' }}>
      
      {/* ── MINIMAL TOP BAR / HEADER ── */}
      <div style={{ 
        background: 'linear-gradient(180deg, #162C46 0%, #0B192C 100%)', 
        padding: '36px 20px 28px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)' 
      }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 12px', marginBottom: '12px' }}>
            <Globe size={14} color="#38bdf8" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              International Guests Desk
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
            Goa Travel &amp; <span style={{ color: '#FF6B35' }}>Visa Guide</span>
          </h1>
          <p style={{ fontSize: '14.5px', color: '#94a3b8', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
            Essential entry requirements, tourist visa guidelines, and arrival support for international travelers vacationing in Goa.
          </p>

        </div>
      </div>

      {/* ── BALANCED 2-COLUMN MAIN CONTENT ── */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '32px 20px 50px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN: MINIMAL GUIDANCE & CHECKLIST ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* 1. Country Selection */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                1. Select Passport Country
              </label>
              
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
                    {nat.flag} {nat.name}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#38bdf8" />
                <span>{country.flag} {country.name} passport holders can apply for Indian e-Visa online.</span>
              </div>
            </div>

            {/* 2. Common Visa Options */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                2. Common Tourist e-Visa Categories
              </label>

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
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#FF6B35' : '#ffffff' }}>
                          {vt.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {vt.typicalTime}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        {vt.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Basic Travel Checklist */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} color="#FF6B35" />
                <span>Basic Entry Checklist</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                <li>Passport with minimum 6 months validity from arrival date</li>
                <li>At least 2 blank pages for airport immigration stamping</li>
                <li>Direct entry accepted at Mopa (GOX) and Dabolim (GOI)</li>
              </ul>
            </div>

          </div>

          {/* ── RIGHT COLUMN: FAST INQUIRY & CONCIERGE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
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
                Need Help Planning Your Goa Trip?
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
                Connect with our team for guidance on official application procedures, airport transfers, and holiday stays.
              </p>

              {sent ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    Thank you!
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#15803d', margin: '0 0 14px' }}>
                    We have noted your interest for travel from {country.name}. Tap below to connect directly on WhatsApp:
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}
                  >
                    <MessageSquare size={15} /> Chat on WhatsApp
                  </a>
                </div>
              ) : (
                <form onSubmit={handleInquire} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Your Name
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
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                          outline: 'none'
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
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#475569' }}>
                    Country: <strong>{country.name}</strong> · Category: <strong>{visa.title}</strong>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#FF6B35',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Send Quick Enquiry</span>
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

            {/* Cross-Link Card for Cabs & Stays */}
            <div style={{ background: '#132238', borderRadius: '14px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  Arriving at Goa Airport?
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Pre-book reliable cabs or view tour packages.
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

        {/* ── MINIMAL CONCISE FAQS ── */}
        <div style={{ marginTop: '28px', background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={17} color="#FF6B35" />
            <span>Common Questions for International Visitors</span>
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
