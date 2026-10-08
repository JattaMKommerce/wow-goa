import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, Check, ArrowRight, ArrowLeft, ExternalLink, Copy, QrCode, 
  Sparkles, Smartphone, Monitor, Car, Bike, Crown, Building, MapPin, 
  Phone, Mail, ShieldCheck, Star, Eye, AlertCircle, Save, Loader2, X
} from 'lucide-react';
import { fetchVendorWebsite, saveVendorWebsite } from '../../services/api';

const THEME_PRESETS = [
  { id: 'sunset', name: 'Goa Sunset', primary: '#FF6333', bg: '#0D1B2E', desc: 'Vibrant sunset coral & tropical energy' },
  { id: 'ocean', name: 'Ocean Breeze', primary: '#0284C7', bg: '#0F172A', desc: 'Deep sea azure & coastal calm' },
  { id: 'luxury_gold', name: 'Royal Gold & Dark', primary: '#D97706', bg: '#0B0F19', desc: 'Luxury VIP styling for premium fleet' },
  { id: 'emerald', name: 'Emerald Palms', primary: '#059669', bg: '#064E3B', desc: 'Lush tropical greenery & clean vibes' },
  { id: 'modern_dark', name: 'Cyber Stealth', primary: '#7C3AED', bg: '#18181B', desc: 'Modern high-tech purple & dark mode' }
];

const DEFAULT_BANNER_OPTIONS = [
  { label: 'Goa Scenic Coast', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80' },
  { label: 'Sunset Highway', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80' },
  { label: 'Luxury Beachfront', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80' },
  { label: 'Tropical Palm Road', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80' }
];

function parseArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (val.includes(',')) return val.split(',').map(s => s.trim()).filter(Boolean);
      return [val.trim()];
    }
  }
  return Array.isArray(fallback) ? fallback : [];
}

export default function VendorStorefrontWizard({
  currentUser,
  vendorType = 'vehicle', // 'vehicle' | 'hotel'
  inventory = [], // available cars/bikes or rooms
  onExit
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [copiedLink, setCopiedLink] = useState(false);

  const defaultCats = useMemo(() => (
    vendorType === 'hotel' 
      ? ['Deluxe Room', 'Luxury Suite', 'Private Villa']
      : ['Two Wheelers', 'Four Wheelers', 'Luxury']
  ), [vendorType]);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    vendor_id: currentUser?.id || currentUser?.username || 'vendor-1',
    vendor_type: vendorType,
    slug: '',
    site_title: '',
    tagline: '',
    about_us: '',
    logo_url: '',
    banner_url: DEFAULT_BANNER_OPTIONS[0].url,
    theme_preset: 'sunset',
    primary_color: '#FF6333',
    style_mode: 'light',
    base_address: '',
    city_region: 'Goa',
    service_radius_km: 25,
    delivery_charge_policy: 'Free airport terminal handover. Delivery available anywhere in Goa.',
    google_maps_url: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    instagram_url: '',
    operating_hours: '24/7',
    enabled_categories: defaultCats,
    featured_items: [],
    hotel_checkin_time: '01:00 PM',
    hotel_checkout_time: '11:00 AM',
    hotel_wifi_network: 'Guest_HighSpeed_WiFi',
    hotel_wifi_password: 'WelcomeToGoa',
    is_published: 1
  });

  const safeCategories = useMemo(() => parseArray(formData.enabled_categories, defaultCats), [formData.enabled_categories, defaultCats]);
  const safeFeatured = useMemo(() => parseArray(formData.featured_items, []), [formData.featured_items]);

  // Step definitions matching reference screenshot
  const STEPS = [
    { num: 1, label: vendorType === 'hotel' ? 'Hotel Basic Details' : 'Vendor Basic Details' },
    { num: 2, label: 'Location & Radius' },
    { num: 3, label: 'Choose Website Theme' },
    { num: 4, label: 'Branding & About' },
    { num: 5, label: vendorType === 'hotel' ? 'Room Categories' : 'Vehicle Categories' },
    { num: 6, label: vendorType === 'hotel' ? 'Room Inventory' : 'Fleet Showcase' },
    { num: 7, label: 'Website Preview' },
    { num: 8, label: 'Subdomain Branding' },
    { num: 9, label: 'Publish Website' }
  ];

  // Load existing website configuration from backend
  useEffect(() => {
    let isMounted = true;
    const vId = currentUser?.id || currentUser?.username || 'vendor-1';

    async function loadConfig() {
      setLoading(true);
      try {
        const res = await fetchVendorWebsite(vId);
        if (isMounted && res.success && res.website) {
          const w = res.website;
          setFormData(prev => ({
            ...prev,
            ...w,
            vendor_id: vId,
            vendor_type: vendorType,
            enabled_categories: parseArray(w.enabled_categories, defaultCats),
            featured_items: parseArray(w.featured_items, [])
          }));
        }
      } catch (e) {
        console.error('Failed to load vendor website settings', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConfig();
    return () => { isMounted = false; };
  }, [currentUser, vendorType, defaultCats]);

  const updateField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveStep = async (nextStep = null) => {
    setSaving(true);
    setSaveMessage({ type: '', text: '' });
    try {
      const res = await saveVendorWebsite(formData);
      if (res.success) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
        if (res.website) {
          setFormData(prev => ({
            ...prev,
            ...res.website,
            enabled_categories: parseArray(res.website.enabled_categories, prev.enabled_categories || defaultCats),
            featured_items: parseArray(res.website.featured_items, prev.featured_items || [])
          }));
        }
        if (nextStep && nextStep <= STEPS.length) {
          setCurrentStep(nextStep);
        }
      } else {
        setSaveMessage({ type: 'error', text: res.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message || 'Network error saving settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 4000);
    }
  };

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${formData.slug || 'my-store'}`;

  // QR Code URL (using standard secure quickchart QR API)
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(publicUrl)}&size=300&caption=${encodeURIComponent(formData.site_title || 'Book Direct')}`;

  const toggleCategory = (cat) => {
    const list = parseArray(formData.enabled_categories, defaultCats);
    if (list.includes(cat)) {
      updateField('enabled_categories', list.filter(c => c !== cat));
    } else {
      updateField('enabled_categories', [...list, cat]);
    }
  };

  const toggleFeaturedItem = (itemId) => {
    const list = parseArray(formData.featured_items, []);
    if (list.includes(itemId)) {
      updateField('featured_items', list.filter(i => i !== itemId));
    } else {
      updateField('featured_items', [...list, itemId]);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 bg-white rounded-4 shadow-sm" style={{ minHeight: '450px' }}>
        <Loader2 className="animate-spin text-teal mb-3" size={36} style={{ color: '#008080' }} />
        <h5 className="fw-bold text-dark">Loading Storefront Setup Wizard...</h5>
        <p className="text-muted small">Retrieving your brand details and fleet catalog.</p>
      </div>
    );
  }

  return (
    <div className="storefront-wizard-container" style={{ background: '#F0F7F7', minHeight: '100vh', padding: '24px 32px', fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Top Header ─── */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom" style={{ borderColor: 'rgba(0,128,128,0.15)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-2 d-flex align-items-center justify-content-center shadow-xs" style={{ background: '#E6F4F4', color: '#008080' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px' }}>Online Storefront Setup Wizard</h4>
            <p className="text-muted small mb-0">Follow the steps to configure and launch your digital booking portal</p>
          </div>
        </div>
        {onExit && (
          <button 
            type="button" 
            onClick={onExit} 
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1 fw-semibold"
            style={{ fontSize: '0.82rem' }}
          >
            <span>Exit Wizard</span>
            <X size={15} />
          </button>
        )}
      </div>

      {/* ─── Main Two-Column Wizard Grid ─── */}
      <div className="row g-4">
        {/* ─── Left Sidebar: Setup Progress ─── */}
        <div className="col-lg-3 col-md-4">
          <div className="bg-white rounded-4 p-4 shadow-sm h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-uppercase fw-bold text-secondary mb-3" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
              Setup Progress
            </div>
            <div className="d-flex flex-column gap-2">
              {STEPS.map(s => {
                const isActive = currentStep === s.num;
                const isPassed = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    className="btn w-100 text-start border-0 rounded-4 px-3 py-2.5 d-flex align-items-center gap-3 transition-all"
                    style={{
                      background: isActive ? '#285E61' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.84rem',
                      border: isActive ? 'none' : '1px solid transparent'
                    }}
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: '24px',
                        height: '24px',
                        fontSize: '0.72rem',
                        background: isActive ? '#FFFFFF' : (isPassed ? '#E6F4F4' : '#F1F5F9'),
                        color: isActive ? '#285E61' : (isPassed ? '#008080' : '#64748B'),
                        flexShrink: 0
                      }}
                    >
                      {isPassed ? <Check size={13} strokeWidth={3} /> : s.num}
                    </div>
                    <span className="text-truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Right Column: Step Form Card ─── */}
        <div className="col-lg-9 col-md-8">
          <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm" style={{ border: '1px solid #E2E8F0', minHeight: '560px' }}>
            {saveMessage.text && (
              <div className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2`} style={{ fontSize: '0.85rem' }}>
                {saveMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{saveMessage.text}</span>
              </div>
            )}

            {/* ══════════════ STEP 1: BASIC DETAILS ══════════════ */}
            {currentStep === 1 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 1: {vendorType === 'hotel' ? 'Hotel' : 'Vendor'} Basic Details</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">
                      {vendorType === 'hotel' ? 'Hotel / Resort Name *' : 'Business / Agency Name *'}
                    </label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder={vendorType === 'hotel' ? 'e.g. Goa Paradise Beach Resort' : 'e.g. Goa Royal Self-Drive Cabs'}
                      value={formData.site_title}
                      onChange={(e) => updateField('site_title', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Calling Phone *</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. +91 98221 00000"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Official Email *</label>
                    <input 
                      type="email" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. info@goaroyalcabs.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">Street Address *</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. Airport Road, Dabolim / Calangute Beach Road"
                      value={formData.base_address}
                      onChange={(e) => updateField('base_address', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-secondary small fw-bold">Area / Locality</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. North Goa / Airport Hub"
                      value={formData.city_region}
                      onChange={(e) => updateField('city_region', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-secondary small fw-bold">City</label>
                    <input type="text" className="form-control rounded-3 py-2 px-3" value="Goa" readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-secondary small fw-bold">WhatsApp Direct Number</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. 9822100000"
                      value={formData.whatsapp_number}
                      onChange={(e) => updateField('whatsapp_number', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 2: LOCATION & RADIUS ══════════════ */}
            {currentStep === 2 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 2: Location & Service Radius</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Service Delivery Radius (KM)</label>
                    <div className="d-flex align-items-center gap-3">
                      <input 
                        type="range" 
                        className="form-range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={formData.service_radius_km}
                        onChange={(e) => updateField('service_radius_km', parseInt(e.target.value, 10))}
                      />
                      <span className="badge rounded-pill px-3 py-2 fw-bold text-white shadow-xs" style={{ background: '#285E61', minWidth: '75px' }}>
                        {formData.service_radius_km} KM
                      </span>
                    </div>
                    <small className="text-muted">Coverage: Within {formData.service_radius_km} km of your base garage/hub.</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Operating Hours</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. 24/7 or 08:00 AM - 10:00 PM"
                      value={formData.operating_hours}
                      onChange={(e) => updateField('operating_hours', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">Delivery Charges & Handover Policy</label>
                    <textarea 
                      className="form-control rounded-3 p-3" 
                      rows={3}
                      placeholder="e.g. Free airport terminal handover (Mopa & Dabolim). Free doorstep delivery within 10 km."
                      value={formData.delivery_charge_policy}
                      onChange={(e) => updateField('delivery_charge_policy', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">Google Maps Location / Embed URL</label>
                    <input 
                      type="url" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="https://maps.google.com/..."
                      value={formData.google_maps_url}
                      onChange={(e) => updateField('google_maps_url', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 3: CHOOSE THEME ══════════════ */}
            {currentStep === 3 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 3: Choose Website Theme</h5>
                <p className="text-muted small mb-4">Pick a curated color palette that matches your brand vibe and fleet.</p>
                
                <div className="row g-3 mb-4">
                  {THEME_PRESETS.map(t => {
                    const isSelected = formData.theme_preset === t.id;
                    return (
                      <div key={t.id} className="col-md-6 col-lg-4">
                        <div 
                          className="p-3 rounded-4 border cursor-pointer transition-all"
                          style={{
                            borderColor: isSelected ? t.primary : '#E2E8F0',
                            borderWidth: isSelected ? '2px' : '1px',
                            background: isSelected ? '#FAF5FF' : '#FFFFFF',
                            boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none'
                          }}
                          onClick={() => {
                            updateField('theme_preset', t.id);
                            updateField('primary_color', t.primary);
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#0F172A' }}>{t.name}</span>
                            <div className="rounded-circle" style={{ width: '18px', height: '18px', background: t.primary }} />
                          </div>
                          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{t.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Custom Accent Color</label>
                    <div className="d-flex align-items-center gap-2">
                      <input 
                        type="color" 
                        className="form-control form-control-color rounded-3 border-0" 
                        value={formData.primary_color}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="form-control rounded-3" 
                        value={formData.primary_color}
                        onChange={(e) => updateField('primary_color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Style Mode</label>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className={`btn flex-grow-1 rounded-3 py-2 fw-semibold ${formData.style_mode === 'light' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => updateField('style_mode', 'light')}
                      >
                        ☀️ Clean Light
                      </button>
                      <button 
                        type="button" 
                        className={`btn flex-grow-1 rounded-3 py-2 fw-semibold ${formData.style_mode === 'dark' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => updateField('style_mode', 'dark')}
                      >
                        🌙 Sleek Dark
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 4: BRANDING & ABOUT ══════════════ */}
            {currentStep === 4 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 4: Branding & About Story</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Brand Logo URL</label>
                    <input 
                      type="url" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="https://example.com/logo.png"
                      value={formData.logo_url}
                      onChange={(e) => updateField('logo_url', e.target.value)}
                    />
                    <small className="text-muted">Square PNG or WebP with transparent background looks best.</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Catchy Brand Tagline</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="e.g. Drive Goa On Your Terms — Verified Fleet, Zero Hassle"
                      value={formData.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">Hero Banner Image</label>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {DEFAULT_BANNER_OPTIONS.map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-sm rounded-pill px-3 py-1 text-xs fw-semibold"
                          style={{
                            background: formData.banner_url === b.url ? '#285E61' : '#F1F5F9',
                            color: formData.banner_url === b.url ? '#fff' : '#475569'
                          }}
                          onClick={() => updateField('banner_url', b.url)}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="url" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="Or paste custom banner image URL..."
                      value={formData.banner_url}
                      onChange={(e) => updateField('banner_url', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-bold">About Us Story (Business Bio)</label>
                    <textarea 
                      className="form-control rounded-3 p-3" 
                      rows={3}
                      placeholder="Tell customers about your experience, fleet cleanliness, and verified customer reviews..."
                      value={formData.about_us}
                      onChange={(e) => updateField('about_us', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Instagram Profile Link</label>
                    <input 
                      type="url" 
                      className="form-control rounded-3 py-2 px-3" 
                      placeholder="https://instagram.com/yourhandle"
                      value={formData.instagram_url}
                      onChange={(e) => updateField('instagram_url', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 5: CATEGORIES ══════════════ */}
            {currentStep === 5 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">
                  Step 5: {vendorType === 'hotel' ? 'Room Categories' : 'Vehicle Categories'}
                </h5>
                <p className="text-muted small mb-4">
                  Select which categories to showcase on your website. Only enabled categories will be visible to your customers.
                </p>

                <div className="row g-3">
                  {vendorType === 'vehicle' ? (
                    <>
                      {[
                        { title: 'Two Wheelers', icon: <Bike size={24} />, desc: 'Scooters, Activa, Royal Enfield, Sports Bikes' },
                        { title: 'Four Wheelers', icon: <Car size={24} />, desc: 'Self-drive Hatchbacks, Sedans, Compact SUVs, MUVs' },
                        { title: 'Luxury', icon: <Crown size={24} />, desc: 'Luxury Sedans, Thar 4x4, Fortuner, Defender, VIP Convertibles' }
                      ].map(cat => {
                        const isEnabled = safeCategories.includes(cat.title);
                        return (
                          <div key={cat.title} className="col-md-4">
                            <div 
                              className="p-4 rounded-4 border text-center cursor-pointer transition-all h-100 d-flex flex-column justify-content-between"
                              style={{
                                borderColor: isEnabled ? '#285E61' : '#E2E8F0',
                                background: isEnabled ? '#E6F4F4' : '#FFFFFF',
                                boxShadow: isEnabled ? '0 4px 12px rgba(0,128,128,0.1)' : 'none'
                              }}
                              onClick={() => toggleCategory(cat.title)}
                            >
                              <div>
                                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: isEnabled ? '#285E61' : '#F1F5F9', color: isEnabled ? '#fff' : '#64748B' }}>
                                  {cat.icon}
                                </div>
                                <h6 className="fw-bold text-dark mb-1">{cat.title}</h6>
                                <p className="text-muted small mb-3">{cat.desc}</p>
                              </div>
                              <span className={`badge rounded-pill py-1.5 px-3 fw-bold ${isEnabled ? 'bg-success text-white' : 'bg-light text-secondary'}`}>
                                {isEnabled ? '✓ Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {[
                        { title: 'Deluxe Room', desc: 'Standard luxury room with AC, king bed, and private balcony' },
                        { title: 'Luxury Suite', desc: 'Spacious suite with living area and sea/pool view' },
                        { title: 'Private Villa', desc: 'Standalone exclusive villa with private plunge pool' }
                      ].map(cat => {
                        const isEnabled = safeCategories.includes(cat.title);
                        return (
                          <div key={cat.title} className="col-md-4">
                            <div 
                              className="p-4 rounded-4 border text-center cursor-pointer transition-all h-100 d-flex flex-column justify-content-between"
                              style={{
                                borderColor: isEnabled ? '#285E61' : '#E2E8F0',
                                background: isEnabled ? '#E6F4F4' : '#FFFFFF'
                              }}
                              onClick={() => toggleCategory(cat.title)}
                            >
                              <div>
                                <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: isEnabled ? '#285E61' : '#F1F5F9', color: isEnabled ? '#fff' : '#64748B' }}>
                                  <Building size={24} />
                                </div>
                                <h6 className="fw-bold text-dark mb-1">{cat.title}</h6>
                                <p className="text-muted small mb-3">{cat.desc}</p>
                              </div>
                              <span className={`badge rounded-pill py-1.5 px-3 fw-bold ${isEnabled ? 'bg-success text-white' : 'bg-light text-secondary'}`}>
                                {isEnabled ? '✓ Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════ STEP 6: FLEET / ITEM SHOWCASE ══════════════ */}
            {currentStep === 6 && (
              <div>
                <h5 className="fw-bold text-dark mb-2">
                  Step 6: {vendorType === 'hotel' ? 'Room Inventory & Details' : 'Fleet Showcase & Pinned Items'}
                </h5>
                <p className="text-muted small mb-4">
                  Select items to highlight at the top of your custom website as "Recommended by Host".
                </p>

                {inventory && inventory.length > 0 ? (
                  <div className="row g-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {inventory.map(item => {
                      const isFeatured = safeFeatured.includes(item.id);
                      return (
                        <div key={item.id} className="col-md-6">
                          <div 
                            className="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all"
                            style={{
                              borderColor: isFeatured ? '#285E61' : '#E2E8F0',
                              background: isFeatured ? '#E6F4F4' : '#FFFFFF'
                            }}
                            onClick={() => toggleFeaturedItem(item.id)}
                          >
                            <div className="d-flex align-items-center gap-3">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="rounded-3" style={{ width: '56px', height: '42px', objectFit: 'cover' }} />
                              ) : (
                                <div className="rounded-3 bg-light d-flex align-items-center justify-content-center" style={{ width: '56px', height: '42px' }}>
                                  <Car size={20} className="text-secondary" />
                                </div>
                              )}
                              <div>
                                <div className="fw-bold text-dark small">{item.name}</div>
                                <div className="text-muted text-xs">₹{item.price} / day</div>
                              </div>
                            </div>
                            <span className={`badge rounded-pill py-1 px-2.5 text-xs ${isFeatured ? 'bg-success text-white' : 'bg-light text-secondary'}`}>
                              {isFeatured ? '★ Featured' : 'Include'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-light rounded-4">
                    <Car size={36} className="text-muted mb-2" />
                    <h6 className="fw-bold text-dark">No inventory items found yet</h6>
                    <p className="text-muted small mb-0">Add your vehicles in the Fleet Management tab, and they will automatically appear on your website.</p>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ STEP 7: WEBSITE PREVIEW ══════════════ */}
            {currentStep === 7 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Step 7: Interactive Website Preview</h5>
                    <p className="text-muted small mb-0">See how customers will view your branded website in real time.</p>
                  </div>
                  <div className="btn-group p-1 bg-light rounded-pill border">
                    <button 
                      type="button" 
                      className={`btn btn-sm rounded-pill px-3 py-1 ${previewMode === 'desktop' ? 'btn-white shadow-xs fw-bold text-dark' : 'text-muted'}`}
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor size={14} className="me-1" /> Desktop
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm rounded-pill px-3 py-1 ${previewMode === 'mobile' ? 'btn-white shadow-xs fw-bold text-dark' : 'text-muted'}`}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone size={14} className="me-1" /> Mobile
                    </button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="d-flex justify-content-center">
                  <div 
                    className="preview-mockup-frame border shadow-md rounded-4 overflow-hidden transition-all"
                    style={{
                      width: previewMode === 'mobile' ? '360px' : '100%',
                      background: formData.style_mode === 'dark' ? '#0F172A' : '#FFFFFF',
                      color: formData.style_mode === 'dark' ? '#F8FAFC' : '#0F172A',
                      maxHeight: '480px',
                      overflowY: 'auto'
                    }}
                  >
                    {/* Mock Header */}
                    <div className="p-3 d-flex align-items-center justify-content-between border-bottom" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      <div className="d-flex align-items-center gap-2">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        ) : (
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '28px', height: '28px', background: formData.primary_color, fontSize: '0.75rem' }}>
                            {formData.site_title ? formData.site_title.charAt(0) : 'V'}
                          </div>
                        )}
                        <span className="fw-bold small">{formData.site_title || 'Your Storefront'}</span>
                      </div>
                      <span className="badge rounded-pill text-xs fw-bold" style={{ background: '#E6F4F4', color: '#008080' }}>
                        🔍 Track Booking
                      </span>
                    </div>

                    {/* Mock Hero Banner */}
                    <div 
                      className="p-4 text-center text-white position-relative"
                      style={{
                        background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${formData.banner_url || DEFAULT_BANNER_OPTIONS[0].url}) center/cover no-repeat`,
                        minHeight: '140px'
                      }}
                    >
                      <h6 className="fw-black mb-1">{formData.site_title || 'Goa Royal Fleet'}</h6>
                      <p className="small mb-2 opacity-90" style={{ fontSize: '0.72rem' }}>{formData.tagline || 'Drive Goa Your Way'}</p>
                      <button type="button" className="btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold text-white border-0 shadow-xs" style={{ background: formData.primary_color }}>
                        Book Online Now
                      </button>
                    </div>

                    {/* Mock Categories Bar */}
                    <div className="p-3 border-bottom d-flex gap-2 overflow-auto">
                      {safeCategories.map((cat, i) => (
                        <span key={i} className="badge rounded-pill px-3 py-1.5 text-xs fw-bold" style={{ background: i === 0 ? formData.primary_color : '#F1F5F9', color: i === 0 ? '#fff' : '#475569' }}>
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Mock Quick Info */}
                    <div className="p-3 text-xs opacity-75 d-flex justify-content-between">
                      <span>📍 {formData.base_address || 'Goa Airport & Panaji'}</span>
                      <span>📞 {formData.phone || '+91 98221 00000'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 8: SUBDOMAIN & SLUG BRANDING ══════════════ */}
            {currentStep === 8 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 8: Subdomain & Website Slug Branding</h5>
                <p className="text-muted small mb-4">
                  Choose your personalized website address. Tourists can visit this direct link to view and book only your inventory.
                </p>

                <div className="p-4 rounded-4 bg-light mb-4 border">
                  <label className="form-label text-secondary small fw-bold">Your Storefront URL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted small fw-semibold border-end-0">
                      tripgalileo.com/v/
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 py-2.5 px-3 fw-bold" 
                      style={{ color: '#008080' }}
                      placeholder="your-brand-name"
                      value={formData.slug}
                      onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    />
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Only lowercase letters, numbers, and hyphens (e.g. <code>sunshine-rentals</code>).
                  </small>
                </div>

                <div className="p-3 rounded-3 border d-flex align-items-center justify-content-between" style={{ background: '#E6F4F4' }}>
                  <div className="d-flex align-items-center gap-2">
                    <Check size={18} style={{ color: '#008080' }} />
                    <span className="small fw-bold" style={{ color: '#008080' }}>
                      Ready URL: {publicUrl}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                  >
                    {copiedLink ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════ STEP 9: PUBLISH WEBSITE ══════════════ */}
            {currentStep === 9 && (
              <div>
                <h5 className="fw-bold text-dark mb-4">Step 9: Launch & Publish Website</h5>
                
                <div className="p-4 rounded-4 border mb-4 d-flex align-items-center justify-content-between" style={{ background: formData.is_published ? '#F0FDF4' : '#FEF3C7' }}>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ color: formData.is_published ? '#166534' : '#92400E' }}>
                      {formData.is_published ? '🟢 Website is LIVE & Public' : '🟡 Website is in DRAFT Mode'}
                    </h6>
                    <p className="text-muted small mb-0">
                      {formData.is_published 
                        ? 'Anyone with your link or QR code can browse and make direct bookings.' 
                        : 'Your site is saved in draft mode. Visitors will see a coming soon notice.'}
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch"
                      checked={Boolean(formData.is_published)}
                      onChange={(e) => updateField('is_published', e.target.checked ? 1 : 0)}
                    />
                  </div>
                </div>

                {/* Printable QR Code & Share Card */}
                <div className="row g-4 align-items-center">
                  <div className="col-md-5 text-center">
                    <div className="p-3 bg-white rounded-4 border shadow-sm d-inline-block">
                      <img src={qrCodeUrl} alt="Storefront QR" style={{ width: '170px', height: '170px' }} />
                      <div className="fw-bold text-dark mt-2 small">{formData.site_title || 'Your Storefront'}</div>
                      <div className="text-muted text-xs">Scan to Book Direct</div>
                    </div>
                    <div className="mt-2">
                      <a 
                        href={qrCodeUrl} 
                        download={`${formData.slug || 'storefront'}-qr.png`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 fw-semibold text-xs"
                      >
                        <QrCode size={13} className="me-1" /> Download QR Code
                      </a>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="d-flex flex-column gap-2">
                      <a 
                        href={`/v/${formData.slug}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn text-white rounded-3 py-2.5 px-4 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{ background: '#285E61' }}
                      >
                        <ExternalLink size={18} /> Open Live Website
                      </a>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary rounded-3 py-2 px-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                      >
                        <Copy size={16} /> {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Link'}
                      </button>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`Check out our verified booking site: ${publicUrl}`)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-success text-white rounded-3 py-2 px-4 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      >
                        Share via WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Bottom Actions Bar (Save & Continue) ─── */}
            <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top">
              {currentStep > 1 ? (
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  className="btn btn-outline-secondary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                >
                  <ArrowLeft size={16} /> Previous Step
                </button>
              ) : <div />}

              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  onClick={() => handleSaveStep(null)}
                  disabled={saving}
                  className="btn btn-outline-dark rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-1.5"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Draft</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSaveStep(currentStep < STEPS.length ? currentStep + 1 : currentStep)}
                  disabled={saving}
                  className="btn text-white rounded-3 px-4 py-2.5 fw-bold d-flex align-items-center gap-2 shadow-sm"
                  style={{ background: '#285E61' }}
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  <span>{currentStep === STEPS.length ? 'Save & Complete' : 'Save & Continue'}</span>
                  {currentStep < STEPS.length && <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
