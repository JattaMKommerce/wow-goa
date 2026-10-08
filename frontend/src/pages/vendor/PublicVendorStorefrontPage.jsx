import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, MessageSquare, MapPin, Shield, Star, Car, Bike, Crown, 
  Building, Calendar, Search, CheckCircle, ChevronRight, AlertCircle, 
  Loader2, ExternalLink, HelpCircle, Gift, Sparkles
} from 'lucide-react';
import { fetchPublicStorefront } from '../../services/api';
import VendorBookingTrackerModal from '../../components/vendor/VendorBookingTrackerModal';
import VendorStorefrontLeadModal from '../../components/vendor/VendorStorefrontLeadModal';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';

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
    // If drop date is missing or on/before new pickup date, auto-advance drop date
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

  // Friendly auto-trigger for discount lead modal (4.5s delay if not dismissed or claimed)
  useEffect(() => {
    if (!site) return;
    try {
      const dismissed = sessionStorage.getItem(`tg_lead_dismissed_${slug}`);
      const claimed = localStorage.getItem(`tg_lead_claimed_${slug}`) || sessionStorage.getItem(`tg_lead_claimed_${slug}`);
      if (!dismissed && !claimed) {
        const timer = setTimeout(() => {
          setShowLeadModal(true);
        }, 4500);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [site, slug]);

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
        <Loader2 className="animate-spin text-warning mb-3" size={42} />
        <h5 className="fw-bold text-dark">Opening Storefront...</h5>
        <p className="text-muted small">Loading verified inventory and booking engine.</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
        <div className="p-4 bg-white rounded-4 shadow-sm border max-w-md" style={{ maxWidth: '440px' }}>
          <div className="rounded-circle p-3 bg-warning text-dark mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
            <AlertCircle size={32} />
          </div>
          <h4 className="fw-black text-dark mb-2">Storefront Offline</h4>
          <p className="text-muted small mb-4">{error || 'The requested storefront could not be located or is in draft mode.'}</p>
          <div className="d-flex gap-2">
            <button 
              type="button" 
              className="btn btn-dark w-100 rounded-pill py-2 fw-semibold"
              onClick={onNavigateHome || (() => { window.location.href = '/'; })}
            >
              Browse All Goa Rentals
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary w-100 rounded-pill py-2 fw-semibold"
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

  const primaryColor = site.primary_color || '#FF6333';
  const whatsappUrl = `https://wa.me/${site.whatsapp_number || site.phone || '919822100000'}?text=${encodeURIComponent(`Hi ${site.site_title}! I am browsing your website and want to check availability.`)}`;

  return (
    <div className="public-vendor-storefront-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* ─── Top Promotional Discount Bar ─── */}
      <div 
        className="py-1.5 px-3 text-center text-white fw-bold d-flex flex-wrap align-items-center justify-content-center gap-2 shadow-2xs"
        style={{ background: 'linear-gradient(90deg, #0D1B2E 0%, #1E3A5F 100%)', fontSize: '0.78rem' }}
      >
        <span className="d-flex align-items-center gap-1.5">
          <Gift size={14} className="text-warning" />
          <span>Special Direct Offer: Claim <strong>Up To ₹500 Instant Discount &amp; Cashback</strong> on your booking with {site.site_title}!</span>
        </span>
        <button 
          type="button" 
          className="btn btn-warning text-dark btn-sm rounded-pill py-0.5 px-3 fw-bold text-xxs shadow-2xs transition-all"
          onClick={() => setShowLeadModal(true)}
        >
          Claim Up To ₹500 Discount →
        </button>
      </div>

      {/* ─── 1. Brand Navbar ─── */}
      <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-xs py-2.5 px-3 px-md-4 border-bottom">
        <div className="container-fluid max-w-7xl">
          <div className="d-flex align-items-center gap-2.5">
            {site.logo_url ? (
              <img src={site.logo_url} alt={site.site_title} className="rounded-2" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            ) : (
              <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-black shadow-xs" style={{ width: '38px', height: '38px', background: primaryColor }}>
                {site.site_title.charAt(0)}
              </div>
            )}
            <div>
              <div className="fw-black text-dark fs-6 line-height-1 mb-0">{site.site_title}</div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                <span className="text-success fw-bold">✓ Verified Host</span> • {site.city_region || 'Goa'}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-xs"
              style={{ fontSize: '0.82rem' }}
              onClick={() => setShowTrackerModal(true)}
            >
              <Search size={14} />
              <span>Track Booking</span>
            </button>
            {site.phone && (
              <a 
                href={`tel:${site.phone}`} 
                className="btn btn-sm text-white rounded-pill px-3 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1 shadow-xs"
                style={{ background: primaryColor, fontSize: '0.82rem' }}
              >
                <Phone size={14} />
                <span>Call Us</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ─── 2. Hero Banner ─── */}
      <section 
        className="position-relative text-white py-5 px-3 px-md-4 text-center overflow-hidden"
        style={{
          background: `linear-gradient(rgba(13,27,46,0.65), rgba(13,27,46,0.85)), url(${site.banner_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80'}) center/cover no-repeat`,
          minHeight: '280px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="container py-3">
          <span className="badge rounded-pill px-3 py-1.5 mb-3 fw-bold text-uppercase shadow-xs" style={{ background: primaryColor, letterSpacing: '1px', fontSize: '0.72rem' }}>
            {site.city_region || 'Goa'} • Verified Direct Booking
          </span>
          <h1 className="display-6 fw-black mb-2 text-white font-heading">{site.site_title}</h1>
          <p className="lead fs-6 text-white-50 max-w-xl mx-auto mb-4" style={{ maxWidth: '640px' }}>
            {site.tagline || 'Experience Goa on your own schedule with our verified fleet and doorstep delivery.'}
          </p>

          {/* Quick Date Bar */}
          <div className="bg-white rounded-4 p-2.5 shadow-lg d-inline-flex flex-wrap align-items-center justify-content-center gap-2 max-w-lg mx-auto" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
            <div className="px-3 py-1 text-start">
              <span className="text-muted d-block" style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup Date</span>
              <input 
                type="date" 
                min={todayStr}
                className="form-control form-control-sm border-0 p-0 fw-bold text-dark" 
                style={{ width: '138px', cursor: 'pointer', fontSize: '0.92rem' }}
                value={pickupDate}
                onChange={(e) => handlePickupChange(e.target.value)}
              />
              <span className="text-primary fw-semibold d-block" style={{ fontSize: '0.72rem', marginTop: '-2px' }}>
                {formatDisplayDate(pickupDate)}
              </span>
            </div>
            <div className="vr d-none d-md-block my-2" />
            <div className="px-3 py-1 text-start">
              <div className="d-flex align-items-center justify-content-between gap-1">
                <span className="text-muted d-block" style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drop Date</span>
                <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5 text-3xs fw-bold">
                  {tripDays} Day{tripDays > 1 ? 's' : ''}
                </span>
              </div>
              <input 
                type="date" 
                min={pickupDate || todayStr}
                className="form-control form-control-sm border-0 p-0 fw-bold text-dark" 
                style={{ width: '138px', cursor: 'pointer', fontSize: '0.92rem' }}
                value={dropDate}
                onChange={(e) => handleDropChange(e.target.value)}
              />
              <span className="text-primary fw-semibold d-block" style={{ fontSize: '0.72rem', marginTop: '-2px' }}>
                {formatDisplayDate(dropDate)}
              </span>
            </div>
            <button 
              type="button"
              className="btn text-white rounded-pill px-4 py-2.5 fw-bold text-xs shadow-xs"
              style={{ background: primaryColor }}
              onClick={() => {
                const el = document.getElementById('inventory-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Available Fleet ↓
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. Delivery Radius & USPs Strip ─── */}
      <div className="bg-white border-bottom py-3 px-3 shadow-xs">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 text-xs">
          <div className="d-flex align-items-center gap-2 text-dark fw-bold">
            <MapPin size={16} style={{ color: primaryColor }} />
            <span>Base: {site.base_address || 'Goa Airport & Panaji'}</span>
            <span className="badge rounded-pill bg-light text-secondary border">Radius: {site.service_radius_km || 25} KM</span>
          </div>
          <div className="d-flex align-items-center gap-3 text-muted">
            <span>✓ 24/7 Roadside Assistance</span>
            <span className="d-none d-md-inline">•</span>
            <span className="d-none d-md-inline">✓ Sanitized Vehicles</span>
            <span className="d-none d-md-inline">•</span>
            <span className="d-none d-md-inline">✓ Zero Deposit Options</span>
          </div>
        </div>
      </div>

      {/* ─── 4. Main Inventory Catalog ─── */}
      <div className="container py-5" id="inventory-section">
        {/* Category Pills Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h3 className="fw-black text-dark mb-1 font-heading">
              {isHotel ? 'Available Rooms & Suites' : 'Available Fleet & Rates'}
            </h3>
            <p className="text-muted small mb-0">Book directly with verified instant confirmation</p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all shadow-xs ${selectedCategory === cat ? 'text-white' : 'btn-white text-secondary border'}`}
                style={{
                  background: selectedCategory === cat ? primaryColor : '#FFFFFF',
                  borderColor: selectedCategory === cat ? primaryColor : '#E2E8F0',
                  fontSize: '0.82rem'
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'Two Wheelers' && <Bike size={14} className="me-1" />}
                {cat === 'Four Wheelers' && <Car size={14} className="me-1" />}
                {cat === 'Luxury' && <Crown size={14} className="me-1" />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="row g-4">
            {filteredItems.map(item => {
              const itemType = item.vehicle_type || (item.seating ? 'car' : 'bike');
              return (
                <div key={item.id} className="col-lg-4 col-md-6">
                  <div className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden transition-all bg-white hover-shadow-md">
                    {/* Image */}
                    <div className="position-relative" style={{ height: '200px', background: '#F1F5F9', overflow: 'hidden' }}>
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.name} 
                        className="w-100 h-100 object-fit-cover"
                      />
                      <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge rounded-pill fw-bold text-white shadow-xs" style={{ background: primaryColor, fontSize: '0.68rem' }}>
                          {item.vehicle_group || item.category || 'Rental'}
                        </span>
                      </div>
                      <div className="position-absolute bottom-0 end-0 m-2">
                        <span className="badge bg-dark bg-opacity-75 text-white rounded-pill px-2.5 py-1 text-xs">
                          ★ {item.rating || 4.8}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="fw-black text-dark mb-2 font-heading">{item.name}</h5>
                        <div className="d-flex flex-wrap gap-1.5 mb-3">
                          {item.fuel && <span className="badge bg-light text-secondary rounded-2 px-2 py-1 text-xs">⛽ {item.fuel}</span>}
                          {item.transmission && <span className="badge bg-light text-secondary rounded-2 px-2 py-1 text-xs">⚙️ {item.transmission}</span>}
                          {item.seating && <span className="badge bg-light text-secondary rounded-2 px-2 py-1 text-xs">👥 {item.seating}</span>}
                          {item.engine && <span className="badge bg-light text-secondary rounded-2 px-2 py-1 text-xs">⚡ {item.engine}</span>}
                        </div>
                      </div>

                      <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                        <div>
                          <div className="fs-5 fw-black text-dark">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            <span className="text-muted fs-6 fw-normal"> / day</span>
                          </div>
                          <span className="text-success text-xs fw-bold">Instant Confirmation</span>
                        </div>

                        <button 
                          type="button" 
                          className="btn text-white rounded-pill px-3.5 py-2 fw-bold text-xs d-flex align-items-center gap-1 shadow-xs"
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
                          <ChevronRight size={15} />
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
            <Car size={42} className="text-muted mb-2" />
            <h5 className="fw-bold text-dark">No vehicles currently listed in this category</h5>
            <p className="text-muted small">Please choose another category or contact the host directly on WhatsApp.</p>
          </div>
        )}

        {/* ─── 5. About Story & Verified Reviews ─── */}
        <div className="row g-4 mt-4">
          <div className="col-lg-7">
            <div className="p-4 p-md-5 bg-white rounded-4 border shadow-sm h-100">
              <h4 className="fw-black text-dark mb-3 font-heading">About {site.site_title}</h4>
              <p className="text-secondary small leading-relaxed mb-4">
                {site.about_us || 'We are an authorized, verified travel operator in Goa. Our fleet is maintained to the highest standards with regular sanitization, comprehensive insurance, and doorstep airport delivery across North and South Goa.'}
              </p>
              <div className="p-3 rounded-3 border bg-light">
                <div className="fw-bold text-dark small mb-1">📍 Handover & Delivery Policy</div>
                <p className="text-muted text-xs mb-0">{site.delivery_charge_policy || 'Free pickup at Goa Airport and nearby hubs. Doorstep delivery available across Goa.'}</p>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="p-4 p-md-5 bg-white rounded-4 border shadow-sm h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-black text-dark mb-0 font-heading">Verified Customer Reviews</h5>
                <span className="badge bg-success rounded-pill px-2.5 py-1 text-xs">★ 4.9 Rating</span>
              </div>
              {reviews.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {reviews.slice(0, 3).map((r, i) => (
                    <div key={i} className="pb-3 border-bottom text-xs">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark">{r.customer_name || 'Verified Traveler'}</span>
                        <span className="text-warning">{'★'.repeat(r.rating || 5)}</span>
                      </div>
                      <p className="text-secondary mb-0">{r.review_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">
                  <div>★★★★★ 4.9 / 5.0</div>
                  <span className="text-xs">Based on 120+ verified Goa road trips</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. Floating WhatsApp Button ─── */}
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noreferrer" 
        className="position-fixed bottom-0 end-0 m-4 btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
        style={{ width: '58px', height: '58px', zIndex: 1050 }}
        title="Chat with Host on WhatsApp"
      >
        <MessageSquare size={26} />
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
        siteTitle={site.site_title}
        vendorSlug={slug}
        vendorId={site.vendor_id}
        vendorType={site.vendor_type || 'vehicle'}
        primaryColor={primaryColor}
      />
    </div>
  );
}
