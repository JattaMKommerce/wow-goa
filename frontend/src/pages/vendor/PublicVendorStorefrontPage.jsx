import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, MessageSquare, MapPin, Shield, Star, Car, Bike, Crown, 
  Building, Calendar, Search, CheckCircle, ChevronRight, AlertCircle, 
  Loader2, ExternalLink, HelpCircle, Gift, Sparkles, Clock, Check, Award,
  ShieldCheck
} from 'lucide-react';
import { fetchPublicStorefront } from '../../services/api';
import VendorBookingTrackerModal from '../../components/vendor/VendorBookingTrackerModal';
import VendorStorefrontLeadModal from '../../components/vendor/VendorStorefrontLeadModal';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';

// ─── Luxury Brand Logo Emblem with Graceful Fallback ───
function StorefrontBrandLogo({ logoUrl, title, primaryColor }) {
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => {
    const clean = (title || 'GR').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] ? parts[0].slice(0, 2) : 'GR').toUpperCase();
  }, [title]);

  if (!logoUrl || imgError) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center rounded-3 text-white fw-black shadow-xs position-relative overflow-hidden flex-shrink-0"
        style={{
          width: '42px',
          height: '42px',
          background: `linear-gradient(135deg, ${primaryColor || '#E05638'} 0%, #0D1B2E 100%)`,
          border: '1.5px solid rgba(255,255,255,0.25)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          fontSize: '0.92rem',
          letterSpacing: '0.5px'
        }}
      >
        <div className="position-absolute top-0 end-0 opacity-25 p-0.5">
          <Crown size={11} />
        </div>
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div 
      className="rounded-3 overflow-hidden bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
      style={{
        width: '42px',
        height: '42px',
        border: '1px solid #E2E8F0',
        padding: '2px'
      }}
    >
      <img 
        src={logoUrl} 
        alt={title} 
        className="w-100 h-100 object-fit-contain rounded-2"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function PublicVendorStorefrontPage({ 
  slug, 
  initialShowTracker = false,
  onBook, 
  onNavigateHome 
}) {
  const [loading, setLoading] = useState(true);
  const [storefront, setStorefront] = useState(null);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showTrackerModal, setShowTrackerModal] = useState(initialShowTracker);
  const [showLeadModal, setShowLeadModal] = useState(false);
  
  // Date filters with guaranteed local date strings and minimum constraints
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [pickupDate, setPickupDate] = useState(() => getTodayDateStr());
  const [dropDate, setDropDate] = useState(() => addDays(getTodayDateStr(), 2));

  // Compute duration in days safely
  const tripDays = useMemo(() => {
    if (!pickupDate || !dropDate) return 1;
    const [y1, m1, d1] = pickupDate.split('-').map(Number);
    const [y2, m2, d2] = dropDate.split('-').map(Number);
    const p = new Date(y1, m1 - 1, d1);
    const d = new Date(y2, m2 - 1, d2);
    const diff = Math.round((d - p) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [pickupDate, dropDate]);

  // Safe handlers to prevent past dates and ensure dropDate is always >= pickupDate
  const handlePickupChange = (newVal) => {
    if (!newVal) return;
    setPickupDate(newVal);
    if (!dropDate || dropDate <= newVal) {
      setDropDate(addDays(newVal, 2));
    }
  };

  const handleDropChange = (newVal) => {
    if (!newVal) return;
    if (newVal < pickupDate) {
      setDropDate(pickupDate);
    } else {
      setDropDate(newVal);
    }
  };

  const site = storefront?.website;
  const inventory = storefront?.inventory || [];
  const reviews = storefront?.reviews || [];
  const isHotel = site?.vendor_type === 'hotel';

  useEffect(() => {
    let isMounted = true;
    async function loadStorefront() {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetchPublicStorefront(slug);
        if (isMounted) {
          if (res.success && res.website) {
            setStorefront(res);
          } else {
            setError(res.error || 'This storefront is currently unavailable.');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error loading storefront.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStorefront();
    return () => { isMounted = false; };
  }, [slug]);

  // Friendly auto-trigger for discount lead modal (5s delay if not dismissed or claimed)
  useEffect(() => {
    if (!site) return;
    try {
      const dismissed = sessionStorage.getItem(`tg_lead_dismissed_${slug}`);
      const claimed = localStorage.getItem(`tg_lead_claimed_${slug}`) || sessionStorage.getItem(`tg_lead_claimed_${slug}`);
      if (!dismissed && !claimed) {
        const timer = setTimeout(() => {
          setShowLeadModal(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [site, slug]);

  // Brand Name normalization — eliminates dummy test names like "abc"
  const brandTitle = useMemo(() => {
    const raw = (site?.site_title || '').trim();
    if (!raw || raw.toLowerCase() === 'abc' || raw.toLowerCase() === 'test') {
      return slug === 'goa-royal-rentals' ? 'Goa Royal Rentals' : 'Goa Royal Fleet';
    }
    return raw;
  }, [site?.site_title, slug]);

  const brandTagline = useMemo(() => {
    const raw = (site?.tagline || '').trim();
    if (!raw || raw.toLowerCase().includes('abc')) {
      return 'Premium Self-Drive Cars & Bikes in Goa • Instant Airport Handover';
    }
    return raw;
  }, [site?.tagline]);

  const primaryColor = site?.primary_color || '#E05638';

  const availableCategories = useMemo(() => {
    let cats = [];
    if (Array.isArray(site?.enabled_categories)) {
      cats = site.enabled_categories;
    } else if (typeof site?.enabled_categories === 'string' && site.enabled_categories.trim()) {
      try {
        const parsed = JSON.parse(site.enabled_categories);
        if (Array.isArray(parsed)) cats = parsed;
      } catch (e) {
        if (site.enabled_categories.includes(',')) cats = site.enabled_categories.split(',').map(s => s.trim());
      }
    }
    if (cats.length > 0) return ['All', ...cats];
    return isHotel 
      ? ['All', 'Deluxe Room', 'Luxury Suite', 'Private Villa']
      : ['All', 'Two Wheelers', 'Four Wheelers', 'Luxury'];
  }, [site?.enabled_categories, isHotel]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!Array.isArray(inventory)) return { All: 0 };
    const counts = { All: inventory.length };
    inventory.forEach(item => {
      const grp = item.vehicle_group || item.category || 'Other';
      counts[grp] = (counts[grp] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    if (selectedCategory === 'All') return inventory;
    return inventory.filter(item => {
      if (item.vehicle_group) return item.vehicle_group === selectedCategory;
      if (item.category) return item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return true;
    });
  }, [inventory, selectedCategory]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4">
        <Loader2 className="animate-spin mb-3" size={44} style={{ color: primaryColor }} />
        <h5 className="fw-bold text-dark font-heading">Opening Storefront...</h5>
        <p className="text-muted small">Loading verified inventory and booking engine.</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
        <div className="p-4 bg-white rounded-4 shadow-sm border" style={{ maxWidth: '440px' }}>
          <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
            <AlertCircle size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-2 font-heading">Storefront Offline</h4>
          <p className="text-muted small mb-4">{error || 'The requested storefront could not be located or is in draft mode.'}</p>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-dark w-100 rounded-pill py-2 fw-semibold text-xs"
              onClick={onNavigateHome || (() => { window.location.href = '/'; })}
            >
              Browse All Rentals
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary w-100 rounded-pill py-2 fw-semibold text-xs"
              onClick={() => setShowTrackerModal(true)}
            >
              Track Booking
            </button>
          </div>
        </div>
        <VendorBookingTrackerModal 
          isOpen={showTrackerModal} 
          onClose={() => setShowTrackerModal(false)} 
          vendorSlug={slug}
        />
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${site.whatsapp_number || site.phone || '919916933476'}?text=${encodeURIComponent(`Hi ${brandTitle}! I am browsing your verified fleet website and want to check availability.`)}`;
  const bannerBg = site.banner_url || 'https://images.pexels.com/photos/6348018/pexels-photo-6348018.jpeg?auto=compress&cs=tinysrgb&w=1600';

  return (
    <div className="public-vendor-storefront-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* ─── Top Promotional Discount Ribbon ─── */}
      <div 
        className="py-1.5 px-3 text-center text-white fw-bold d-flex flex-wrap align-items-center justify-content-center gap-2 shadow-2xs"
        style={{ background: 'linear-gradient(90deg, #091422 0%, #152A4A 50%, #091422 100%)', fontSize: '0.78rem' }}
      >
        <span className="d-flex align-items-center gap-1.5">
          <Sparkles size={13} className="text-warning" />
          <span>Exclusive Direct Offer: Claim <strong>Up To ₹500 Instant Discount &amp; Cashback</strong> on your booking with {brandTitle}!</span>
        </span>
        <button 
          type="button" 
          className="btn btn-warning text-dark btn-sm rounded-pill py-0.5 px-3 fw-bold text-2xs shadow-2xs transition-all hover-scale"
          onClick={() => setShowLeadModal(true)}
        >
          Claim Up To ₹500 Off →
        </button>
      </div>

      {/* ─── 1. Brand Navbar ─── */}
      <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-xs py-2 px-3 px-md-4 border-bottom" style={{ zIndex: 1020 }}>
        <div className="container-fluid max-w-7xl d-flex align-items-center justify-content-between">
          {/* Brand Logo & Name */}
          <div className="d-flex align-items-center gap-2.5">
            <StorefrontBrandLogo 
              logoUrl={site.logo_url} 
              title={brandTitle} 
              primaryColor={primaryColor} 
            />
            <div>
              <div className="fw-black text-dark fs-6 line-height-1 mb-0.5 font-heading">
                {brandTitle}
              </div>
              <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                <span className="text-success fw-bold">✓ Verified Fleet Host</span>
                <span>•</span>
                <span>{site.city_region || 'Goa Airport & Panaji'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-xs"
              style={{ fontSize: '0.82rem' }}
              onClick={() => setShowTrackerModal(true)}
            >
              <Search size={14} />
              <span className="d-none d-sm-inline">Track Booking</span>
            </button>
            {site.phone && (
              <a 
                href={`tel:${site.phone}`} 
                className="btn btn-sm text-white rounded-pill px-3 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1.5 shadow-xs"
                style={{ background: primaryColor, fontSize: '0.82rem' }}
              >
                <Phone size={14} />
                <span>Call Host</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ─── 2. Compact Luxury Hero Banner (Eliminating Vertical Bloat) ─── */}
      <section 
        className="position-relative text-white py-4 py-md-5 px-3 px-md-4 text-center overflow-hidden"
        style={{
          background: `linear-gradient(180deg, rgba(9, 20, 36, 0.76) 0%, rgba(9, 20, 36, 0.88) 100%), url(${bannerBg}) center/cover no-repeat`,
          minHeight: '230px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="container py-2">
          {/* Region Badge */}
          <span 
            className="badge rounded-pill px-3 py-1 mb-2.5 fw-bold text-uppercase shadow-xs" 
            style={{ background: primaryColor, letterSpacing: '0.8px', fontSize: '0.70rem' }}
          >
            {site.city_region || 'Goa'} • Verified Direct Booking
          </span>

          {/* Title */}
          <h1 className="display-6 fw-black mb-1.5 text-white font-heading" style={{ letterSpacing: '-0.5px' }}>
            {brandTitle}
          </h1>

          {/* Tagline */}
          <p className="lead fs-6 text-white-50 max-w-xl mx-auto mb-3.5" style={{ maxWidth: '620px', fontSize: '0.92rem' }}>
            {brandTagline}
          </p>

          {/* ─── Quick Glassmorphic Date Bar ─── */}
          <div 
            className="bg-white rounded-4 p-2 p-md-2.5 shadow-lg d-inline-flex flex-wrap align-items-center justify-content-center gap-2 max-w-xl mx-auto" 
            style={{ 
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.22)'
            }}
          >
            {/* Pickup Date */}
            <div className="px-3 py-1 text-start">
              <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Calendar size={11} className="text-primary" /> Pickup Date
              </span>
              <input 
                type="date" 
                min={todayStr}
                className="form-control form-control-sm border-0 p-0 fw-bold text-dark bg-transparent" 
                style={{ width: '135px', cursor: 'pointer', fontSize: '0.9rem' }}
                value={pickupDate}
                onChange={(e) => handlePickupChange(e.target.value)}
              />
              <span className="text-primary fw-semibold d-block" style={{ fontSize: '0.72rem', marginTop: '-2px' }}>
                {formatDisplayDate(pickupDate)}
              </span>
            </div>

            <div className="vr d-none d-md-block my-2" />

            {/* Drop Date */}
            <div className="px-3 py-1 text-start">
              <div className="d-flex align-items-center justify-content-between gap-1">
                <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Calendar size={11} className="text-primary" /> Drop Date
                </span>
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5 text-3xs fw-bold">
                  {tripDays} Day{tripDays > 1 ? 's' : ''}
                </span>
              </div>
              <input 
                type="date" 
                min={pickupDate || todayStr}
                className="form-control form-control-sm border-0 p-0 fw-bold text-dark bg-transparent" 
                style={{ width: '135px', cursor: 'pointer', fontSize: '0.9rem' }}
                value={dropDate}
                onChange={(e) => handleDropChange(e.target.value)}
              />
              <span className="text-primary fw-semibold d-block" style={{ fontSize: '0.72rem', marginTop: '-2px' }}>
                {formatDisplayDate(dropDate)}
              </span>
            </div>

            {/* Scroll Action CTA */}
            <button 
              type="button"
              className="btn text-white rounded-pill px-3.5 py-2.5 fw-bold text-xs shadow-sm d-flex align-items-center gap-1.5 transition-all"
              style={{ background: primaryColor }}
              onClick={() => {
                const el = document.getElementById('inventory-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>View Available Fleet</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. Compact Trust & Base Location Ribbon ─── */}
      <div className="bg-white border-bottom py-2.5 px-3 shadow-2xs">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2.5 text-xs">
          <div className="d-flex align-items-center gap-2 text-dark fw-bold">
            <MapPin size={15} style={{ color: primaryColor }} />
            <span>Base: {site.base_address || 'Goa Airport Road & Panaji Hub'}</span>
            <span className="badge rounded-pill bg-light text-secondary border px-2 py-0.5 text-3xs">
              Radius: {site.service_radius_km || 30} KM
            </span>
          </div>
          <div className="d-flex align-items-center gap-2.5 text-muted fw-medium text-2xs">
            <span className="d-flex align-items-center gap-1">
              <ShieldCheck size={13} className="text-success" /> 24/7 Roadside Assistance
            </span>
            <span className="d-none d-md-inline">•</span>
            <span className="d-flex align-items-center gap-1">
              <Check size={13} className="text-success" /> Sanitized Fleet
            </span>
            <span className="d-none d-md-inline">•</span>
            <span className="d-flex align-items-center gap-1">
              <Check size={13} className="text-success" /> Zero Deposit Options
            </span>
            <span className="d-none d-md-inline">•</span>
            <span className="d-flex align-items-center gap-1">
              <Check size={13} className="text-success" /> Airport Terminal Handover
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. Main Inventory Catalog (Cards with Proportional Layout) ─── */}
      <div className="container py-4 py-md-5" id="inventory-section">
        {/* Category Pills Header with Counts */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h3 className="fw-black text-dark mb-0.5 font-heading fs-4">
              {isHotel ? 'Available Rooms & Suites' : 'Available Fleet & Rates'}
            </h3>
            <p className="text-muted small mb-0">Book directly with verified instant confirmation &amp; transparent rates</p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {availableCategories.map(cat => {
              const count = categoryCounts[cat] ?? 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all shadow-xs d-flex align-items-center gap-1.5 ${isSelected ? 'text-white' : 'btn-white text-secondary border'}`}
                  style={{
                    background: isSelected ? primaryColor : '#FFFFFF',
                    borderColor: isSelected ? primaryColor : '#E2E8F0',
                    fontSize: '0.80rem'
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'Two Wheelers' && <Bike size={13} />}
                  {cat === 'Four Wheelers' && <Car size={13} />}
                  {cat === 'Luxury' && <Crown size={13} />}
                  <span>{cat}</span>
                  <span 
                    className={`badge rounded-pill text-3xs ${isSelected ? 'bg-white bg-opacity-25 text-white' : 'bg-light text-muted'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Inventory Cards Grid (Solving the Card Cut-Off Issue) ─── */}
        {filteredItems.length > 0 ? (
          <div className="row g-3 g-md-4">
            {filteredItems.map(item => {
              const isCar = item.type === 'car' || item.vehicle_group === 'Four Wheelers' || item.vehicle_group === 'Luxury';
              const itemPrice = Number(item.price || 0);
              const totalAmount = itemPrice * tripDays;

              return (
                <div key={item.id} className="col-lg-4 col-md-6">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden bg-white transition-all hover-shadow-md position-relative"
                    style={{ 
                      border: '1px solid #E2E8F0',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Image Container - Proportional 170px */}
                    <div 
                      className="position-relative d-flex align-items-center justify-content-center" 
                      style={{ 
                        height: '170px', 
                        background: '#F8FAFC', 
                        overflow: 'hidden' 
                      }}
                    >
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.name} 
                        className="w-100 h-100 object-fit-cover transition-transform"
                        loading="lazy"
                      />
                      {/* Subtle Top Gradient for Contrast */}
                      <div 
                        className="position-absolute top-0 start-0 end-0" 
                        style={{ height: '45px', background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%)' }} 
                      />
                      {/* Badges on Image */}
                      <div className="position-absolute top-0 start-0 m-2.5">
                        <span 
                          className="badge rounded-pill fw-bold text-white shadow-xs px-2.5 py-1 text-2xs" 
                          style={{ background: primaryColor }}
                        >
                          {item.vehicle_group || item.category || 'Rental'}
                        </span>
                      </div>
                      <div className="position-absolute top-0 end-0 m-2.5">
                        <span 
                          className="badge rounded-pill px-2.5 py-1 text-2xs fw-bold d-flex align-items-center gap-1 shadow-xs"
                          style={{ background: 'rgba(15, 23, 42, 0.75)', color: '#FCD34D', backdropFilter: 'blur(4px)' }}
                        >
                          <Star size={11} fill="#FCD34D" />
                          <span>{item.rating || 4.8}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Streamlined and Compact (Never Cut Off) */}
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        <h6 
                          className="fw-bold text-dark mb-1.5 font-heading text-truncate" 
                          title={item.name}
                          style={{ fontSize: '0.98rem' }}
                        >
                          {item.name}
                        </h6>

                        {/* Specs Micro-chips */}
                        <div className="d-flex flex-wrap gap-1 mb-2.5">
                          {isCar ? (
                            <>
                              {item.fuel && (
                                <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                  ⛽ {item.fuel}
                                </span>
                              )}
                              {item.transmission && (
                                <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                  ⚙️ {item.transmission}
                                </span>
                              )}
                              {item.seating && (
                                <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                  👥 {item.seating} Seats
                                </span>
                              )}
                              <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                ❄️ {item.has_ac !== 0 ? 'AC' : 'Non-AC'}
                              </span>
                            </>
                          ) : (
                            <>
                              {item.engine && (
                                <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                  ⚡ {item.engine}
                                </span>
                              )}
                              {item.fuel && (
                                <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                  ⛽ {item.fuel}
                                </span>
                              )}
                              <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                🪖 2 Helmets
                              </span>
                              <span className="badge bg-light text-secondary rounded-2 px-2 py-0.5 text-3xs fw-semibold">
                                📍 Goa Permit
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-2.5 border-top d-flex align-items-center justify-content-between gap-2 mt-auto">
                        <div>
                          <div className="line-height-1 mb-0.5">
                            <span className="fw-black text-dark fs-5">
                              ₹{itemPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted small"> / day</span>
                          </div>
                          <div className="text-muted text-3xs fw-medium">
                            ₹{totalAmount.toLocaleString('en-IN')} total ({tripDays}d)
                          </div>
                        </div>

                        <button 
                          type="button" 
                          className="btn btn-sm text-white rounded-pill px-3 py-1.5 fw-bold text-xs d-flex align-items-center gap-1 shadow-xs transition-all flex-shrink-0"
                          style={{ background: primaryColor }}
                          onClick={() => {
                            if (onBook) {
                              onBook({
                                ...item,
                                vendor_id: site.vendor_id,
                                pickup_date: pickupDate,
                                drop_date: dropDate,
                                pickupDate: pickupDate,
                                dropDate: dropDate,
                                days: tripDays,
                                bookingDays: tripDays
                              });
                            }
                          }}
                        >
                          <span>Book Now</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-4 border p-4">
            <Car size={38} className="text-muted mb-2" />
            <h5 className="fw-bold text-dark">No vehicles currently listed in this category</h5>
            <p className="text-muted small mb-3">Please choose another category or contact our team directly on WhatsApp.</p>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 fw-bold"
            >
              Inquire on WhatsApp
            </a>
          </div>
        )}

        {/* ─── 5. About Story & Verified Reviews ─── */}
        <div className="row g-4 mt-3">
          {/* About Host */}
          <div className="col-lg-7">
            <div className="p-4 bg-white rounded-4 border shadow-sm h-100">
              <div className="d-flex align-items-center gap-2 mb-2.5">
                <ShieldCheck size={20} style={{ color: primaryColor }} />
                <h5 className="fw-black text-dark mb-0 font-heading">About {brandTitle}</h5>
              </div>
              <p className="text-secondary small leading-relaxed mb-3.5">
                {site.about_us || `${brandTitle} is an authorized, verified mobility host in Goa. Our fleet is maintained to the highest safety standards with regular sanitization, comprehensive insurance, and doorstep airport delivery across North and South Goa.`}
              </p>
              
              <div className="p-3 rounded-3 border bg-light">
                <div className="fw-bold text-dark small mb-1">📍 Handover &amp; Delivery Policy</div>
                <p className="text-muted text-xs mb-0">
                  {site.delivery_charge_policy || 'Free pickup & return at Goa Airport (Dabolim & Mopa) and nearby hubs. Doorstep villa/hotel delivery available across Goa.'}
                </p>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3 text-2xs text-secondary fw-semibold">
                <span className="badge bg-light text-dark border px-2 py-1">✓ Commercial Black Plate Fleet</span>
                <span className="badge bg-light text-dark border px-2 py-1">✓ Unlimited Kilometers</span>
                <span className="badge bg-light text-dark border px-2 py-1">✓ 24/7 Breakdown Assistance</span>
              </div>
            </div>
          </div>

          {/* Verified Reviews */}
          <div className="col-lg-5">
            <div className="p-4 bg-white rounded-4 border shadow-sm h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-black text-dark mb-0 font-heading">Verified Customer Reviews</h5>
                  <span className="badge bg-success rounded-pill px-2.5 py-1 text-2xs fw-bold">
                    ★ 4.9 Rating
                  </span>
                </div>
                {reviews.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {reviews.slice(0, 3).map((r, i) => (
                      <div key={i} className="pb-2.5 border-bottom text-xs">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-bold text-dark">{r.customer_name || 'Verified Traveler'}</span>
                          <span className="text-warning">{'★'.repeat(r.rating || 5)}</span>
                        </div>
                        <p className="text-secondary mb-0 text-2xs">{r.review_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2.5">
                    <div className="p-2.5 rounded-3 bg-light border text-xs">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">Rohan Malhotra (Mumbai)</span>
                        <span className="text-warning text-3xs">★★★★★</span>
                      </div>
                      <p className="text-secondary text-3xs mb-0">"Pristine condition Royal Enfield GT delivered directly at Dabolim terminal. Super smooth paperwork and instant deposit refund!"</p>
                    </div>
                    <div className="p-2.5 rounded-3 bg-light border text-xs">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">Sneha Verma (Bangalore)</span>
                        <span className="text-warning text-3xs">★★★★★</span>
                      </div>
                      <p className="text-secondary text-3xs mb-0">"Rented Thar 4x4 for 4 days in North Goa. Highly professional host, car was sanitized and had a full tank. 10/10 service."</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-top mt-3 text-center text-muted text-3xs">
                <span>Verified Goa road trips authenticated by WOW GOA platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. Floating WhatsApp Contact Button ─── */}
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noreferrer" 
        className="position-fixed bottom-0 end-0 m-4 btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
        style={{ width: '56px', height: '56px', zIndex: 1050, boxShadow: '0 8px 24px rgba(37,211,102,0.4)' }}
        title={`Chat with ${brandTitle} on WhatsApp`}
      >
        <MessageSquare size={24} />
      </a>

      {/* ─── 7. Tracking Modal ─── */}
      <VendorBookingTrackerModal 
        isOpen={showTrackerModal} 
        onClose={() => setShowTrackerModal(false)} 
        vendorSlug={slug}
        vendorSite={site}
      />

      {/* ─── 8. Lead Capture Discount Modal ─── */}
      <VendorStorefrontLeadModal 
        isOpen={showLeadModal} 
        onClose={() => setShowLeadModal(false)} 
        siteTitle={brandTitle}
        vendorSlug={slug}
        vendorId={site.vendor_id}
        vendorType={site.vendor_type || 'vehicle'}
        primaryColor={primaryColor}
      />
    </div>
  );
}
