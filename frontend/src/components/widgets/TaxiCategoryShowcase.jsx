import React, { useRef, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Car, Users, Crown, Star, Camera
} from 'lucide-react';

// ─── CURATED TAXI FLEET DATA (Matching Self Drive Architecture) ─────────────────
const DEFAULT_COMFORT_SEDANS = [
  {
    id: 'tx-def-dzire',
    name: 'Maruti Suzuki Dzire',
    category: 'Sedan',
    badge: 'Popular Choice',
    price: 1600,
    rating: 4.85,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '2 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 3200,
    type: 'taxi'
  },
  {
    id: 'tx-def-etios',
    name: 'Toyota Platinum Etios',
    category: 'Sedan',
    badge: 'Extra Legroom',
    price: 1600,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '3 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 3200,
    type: 'taxi'
  },
  {
    id: 'tx-def-amaze',
    name: 'Honda Amaze Executive',
    category: 'Sedan',
    badge: 'Smooth Ride',
    price: 1700,
    rating: 4.75,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '2 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 3400,
    type: 'taxi'
  },
  {
    id: 'tx-def-aura',
    name: 'Hyundai Aura',
    category: 'Compact Sedan',
    badge: 'Clean AC',
    price: 1650,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '2 Bags',
    fuel: 'CNG / Petrol',
    ac: true,
    fullDayRate: 3300,
    type: 'taxi'
  },
  {
    id: 'tx-def-tigor-ev',
    name: 'Tata Tigor EV (Green Cab)',
    category: 'Electric Sedan',
    badge: 'Zero Emission',
    price: 1800,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '2 Bags',
    fuel: 'Electric',
    ac: true,
    fullDayRate: 3600,
    type: 'taxi'
  },
  {
    id: 'tx-def-ciaz',
    name: 'Maruti Suzuki Ciaz',
    category: 'Premium Sedan',
    badge: 'Executive',
    price: 1950,
    rating: 4.85,
    image: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '3 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 3800,
    type: 'taxi'
  }
];

const DEFAULT_FAMILY_MUVS = [
  {
    id: 'tx-def-ertiga',
    name: 'Maruti Suzuki Ertiga',
    category: 'Family MUV',
    badge: 'Family Favorite',
    price: 2100,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    seating: '6-7 Seater',
    luggage: '3 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 4200,
    type: 'taxi'
  },
  {
    id: 'tx-def-carens',
    name: 'Kia Carens Luxury',
    category: 'Premium MUV',
    badge: 'Modern Interior',
    price: 2400,
    rating: 4.85,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    seating: '6-7 Seater',
    luggage: '3 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 4600,
    type: 'taxi'
  },
  {
    id: 'tx-def-rumion',
    name: 'Toyota Rumion',
    category: 'Comfort MUV',
    badge: 'Reliable Toyota',
    price: 2200,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
    seating: '7 Seater',
    luggage: '3 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 4300,
    type: 'taxi'
  },
  {
    id: 'tx-def-marazzo',
    name: 'Mahindra Marazzo',
    category: 'Spacious MUV',
    badge: 'Extra Space',
    price: 2300,
    rating: 4.75,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    seating: '7 Seater',
    luggage: '4 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 4400,
    type: 'taxi'
  },
  {
    id: 'tx-def-urbania',
    name: 'Force Urbania Executive',
    category: 'Group Van',
    badge: '10-12 Seater',
    price: 4500,
    rating: 4.95,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
    seating: '10-12 Seater',
    luggage: '8 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 7500,
    type: 'taxi'
  }
];

const DEFAULT_VIP_FLEET = [
  {
    id: 'tx-def-innova-crysta',
    name: 'Toyota Innova Crysta',
    category: 'Executive SUV',
    badge: 'Executive VIP',
    price: 2900,
    rating: 4.95,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
    seating: '7 Seater',
    luggage: '4 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 5500,
    type: 'taxi'
  },
  {
    id: 'tx-def-hycross',
    name: 'Toyota Innova Hycross Hybrid',
    category: 'VIP Lounge SUV',
    badge: 'Ottoman Seats',
    price: 3400,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    seating: '6 Seater',
    luggage: '4 Bags',
    fuel: 'Strong Hybrid',
    ac: true,
    fullDayRate: 6200,
    type: 'taxi'
  },
  {
    id: 'tx-def-fortuner',
    name: 'Toyota Fortuner 4x4 VIP',
    category: 'Luxury VIP SUV',
    badge: 'Presidential',
    price: 5500,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=600&q=80',
    seating: '6 Seater',
    luggage: '5 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 9800,
    type: 'taxi'
  },
  {
    id: 'tx-def-mercedes-e',
    name: 'Mercedes-Benz E-Class',
    category: 'Ultra Luxury Sedan',
    badge: 'VIP Escort',
    price: 8500,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '3 Bags',
    fuel: 'Petrol',
    ac: true,
    fullDayRate: 15000,
    type: 'taxi'
  },
  {
    id: 'tx-def-bmw-5',
    name: 'BMW 5 Series Chauffeur',
    category: 'Luxury Sedan',
    badge: 'Executive',
    price: 8000,
    rating: 4.95,
    image: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=600&q=80',
    seating: '4 Seater',
    luggage: '3 Bags',
    fuel: 'Diesel',
    ac: true,
    fullDayRate: 14000,
    type: 'taxi'
  }
];

// ─── INDIVIDUAL CATEGORY ROW ──────────────────────────────────────────────────
function TaxiCategoryRow({
  badgeGradient,
  badgeIcon: BadgeIcon,
  badgeTitle,
  badgeSubtitle,
  vehicles = [],
  tripMode = 'one_way',
  onBookTaxi,
  onViewDetails
}) {
  const scrollContainerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const pauseTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Triple the list to create a seamless, continuous 2-way infinite slide
  const loopVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return [...vehicles, ...vehicles, ...vehicles];
  }, [vehicles]);

  const pauseAutoScroll = (duration = 3500) => {
    isInteractingRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, duration);
  };

  // Continuous auto-slide forward with seamless looping
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || loopVehicles.length === 0) return;

    const initTimer = setTimeout(() => {
      if (el && el.scrollWidth > el.clientWidth && el.scrollLeft < 10) {
        const singleSet = el.scrollWidth / 3;
        el.scrollLeft = singleSet;
      }
    }, 150);

    let animId;
    let lastTime = performance.now();
    const speed = 0.55;

    const step = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      if (!isInteractingRef.current && !isDraggingRef.current && el && el.scrollWidth > el.clientWidth) {
        const factor = Math.min(delta / 16.67, 2.0);
        el.scrollLeft += speed * factor;

        const singleSet = el.scrollWidth / 3;
        if (singleSet > 50) {
          if (el.scrollLeft >= singleSet * 2) {
            el.scrollLeft -= singleSet;
          } else if (el.scrollLeft <= 5) {
            el.scrollLeft += singleSet;
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      clearTimeout(initTimer);
      if (animId) cancelAnimationFrame(animId);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [loopVehicles]);

  const handleScrollLeft = () => {
    pauseAutoScroll(4000);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    pauseAutoScroll(4000);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
    pauseAutoScroll(5000);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseAutoScroll(3000);
    }
  };

  // Dynamic pricing calculation based on selected trip mode
  const getDynamicPrice = (v) => {
    if (tripMode === 'full_day') {
      return { price: v.fullDayRate || (v.price * 2), unit: '/ 8 hrs' };
    }
    if (tripMode === 'round_trip') {
      return { price: Math.round((v.price || 1600) * 1.8), unit: '/ round trip' };
    }
    // Default: One-Way Trip
    return { price: v.price || 1600, unit: '/ trip' };
  };

  return (
    <div 
      className="sd-category-row-card shadow-sm mb-4"
      onMouseEnter={() => { isInteractingRef.current = true; }}
      onMouseLeave={() => { 
        handleMouseUpOrLeave();
        pauseAutoScroll(1500); 
      }}
    >
      {/* ─── Left Brand / Category Banner ─── */}
      <div 
        className="sd-category-banner"
        style={{ background: badgeGradient }}
      >
        <div className="sd-category-icon-wrap">
          <BadgeIcon size={36} strokeWidth={2.4} className="text-white" />
        </div>
        <div className="sd-category-info">
          <h3 className="sd-category-title">{badgeTitle}</h3>
          <p className="sd-category-subtitle mb-0">{badgeSubtitle}</p>
        </div>
      </div>

      {/* ─── Slider & Vehicle Cards Section ─── */}
      <div className="sd-slider-wrapper">
        {/* Left Arrow Button */}
        <button 
          type="button" 
          className="sd-nav-btn sd-nav-btn-left" 
          onClick={handleScrollLeft}
          aria-label={`Scroll ${badgeTitle} left`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Top-Right Tag */}
        <div className="sd-view-all-container">
          <span 
            className="badge rounded-pill fw-bold text-uppercase"
            style={{ background: '#f1f5f9', color: '#0B192C', fontSize: '11px', letterSpacing: '0.4px', padding: '5px 12px' }}
          >
            Chauffeur Included
          </span>
        </div>

        {/* Horizontal Vehicle Cards Track */}
        <div 
          className="sd-cards-scroll-track" 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onTouchStart={() => pauseAutoScroll(5000)}
          onTouchEnd={() => pauseAutoScroll(2500)}
          style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        >
          {loopVehicles.map((v, idx) => {
            const { price, unit } = getDynamicPrice(v);

            return (
              <div 
                key={`${v.id || 'tx'}-${idx}`} 
                className="sd-vehicle-card"
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  if (onBookTaxi) onBookTaxi(v, price);
                  else if (onViewDetails) onViewDetails(v);
                }}
              >
                {/* Vehicle Image */}
                <div className="sd-card-img-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
                  {v.image ? (
                    <img 
                      src={v.image} 
                      alt={v.name}
                      className="sd-card-img"
                      loading="lazy"
                      draggable={false}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackEl = e.target.parentElement.querySelector('.no-photo-wrap');
                        if (fallbackEl) fallbackEl.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="no-photo-wrap flex-column align-items-center justify-content-center w-100 h-100 text-muted p-2" 
                    style={{ display: v.image ? 'none' : 'flex', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '120px' }}
                  >
                    <Camera size={22} className="text-secondary opacity-50 mb-1" />
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>No photo uploaded</span>
                  </div>

                  {/* Top-Right Seating Badge */}
                  <span 
                    className="position-absolute top-0 end-0 m-2 badge rounded-pill px-2 py-1 shadow-xs fw-bold"
                    style={{ background: 'rgba(11, 25, 44, 0.85)', color: '#ffffff', fontSize: '10px', backdropFilter: 'blur(4px)' }}
                  >
                    {v.seating}
                  </span>
                </div>

                {/* Vehicle Name */}
                <div className="sd-card-title" title={v.name}>
                  {v.name}
                </div>

                {/* Price and Rating Row */}
                <div className="sd-card-meta">
                  <span className="sd-card-price">
                    ₹{Number(price || 0).toLocaleString('en-IN')} <span className="sd-card-per">{unit}</span>
                  </span>
                  <span className="sd-card-rating">
                    <Star size={12} className="sd-star-icon" fill="#10B981" color="#10B981" />
                    <span className="sd-rating-num">{v.rating || 4.9}</span>
                  </span>
                </div>

                {/* Little dash indicator */}
                <div className="sd-dash-indicator-wrap">
                  <span className={`sd-dash ${idx % 3 === 0 ? 'active' : ''}`} />
                  <span className={`sd-dash ${idx % 3 === 1 ? 'active' : ''}`} />
                  <span className={`sd-dash ${idx % 3 === 2 ? 'active' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button 
          type="button" 
          className="sd-nav-btn sd-nav-btn-right" 
          onClick={handleScrollRight}
          aria-label={`Scroll ${badgeTitle} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN TAXI CATEGORY SHOWCASE COMPONENT ────────────────────────────────────
export default function TaxiCategoryShowcase({
  tripMode = 'one_way',
  onBookTaxi,
  onViewDetails
}) {
  return (
    <section className="sd-category-showcase-section" id="taxi-categories">
      <div className="container px-md-3">
        {/* Row 1: Comfort Sedans (Deep Navy Gradient) */}
        <TaxiCategoryRow
          badgeGradient="linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)"
          badgeIcon={Car}
          badgeTitle="Comfort Sedans"
          badgeSubtitle="Swift Dzire, Etios & Compacts"
          vehicles={DEFAULT_COMFORT_SEDANS}
          tripMode={tripMode}
          onBookTaxi={onBookTaxi}
          onViewDetails={onViewDetails}
        />

        {/* Row 2: Family MUVs (Signature Wow Goa Orange Gradient) */}
        <TaxiCategoryRow
          badgeGradient="linear-gradient(135deg, #FF6026 0%, #FF833E 100%)"
          badgeIcon={Users}
          badgeTitle="Family MUVs"
          badgeSubtitle="Ertiga, Carens & 7-Seaters"
          vehicles={DEFAULT_FAMILY_MUVS}
          tripMode={tripMode}
          onBookTaxi={onBookTaxi}
          onViewDetails={onViewDetails}
        />

        {/* Row 3: Luxury & VIP (Midnight Executive Gradient) */}
        <TaxiCategoryRow
          badgeGradient="linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)"
          badgeIcon={Crown}
          badgeTitle="Luxury & VIP"
          badgeSubtitle="Innova Crysta, Fortuner & Executive"
          vehicles={DEFAULT_VIP_FLEET}
          tripMode={tripMode}
          onBookTaxi={onBookTaxi}
          onViewDetails={onViewDetails}
        />
      </div>
    </section>
  );
}
