import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Award, 
  Plane, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  PhoneCall, 
  ChevronRight,
  Navigation,
  FileCheck,
  Compass
} from 'lucide-react';

const TAXI_FLEET_DATA = [
  {
    id: 'tx-sedan-dzire',
    name: 'Swift Dzire / Toyota Etios',
    category: 'Sedan',
    badge: 'Popular Choice',
    badgeColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    seating: 4,
    luggage: 2,
    transmission: 'Automatic / Manual',
    fuel: 'Petrol / Hybrid',
    ac: true,
    rating: 4.9,
    reviewsCount: 428,
    perKmRate: 38,
    airportRates: {
      mopa: 2100,
      dabolim: 1600
    },
    fullDayRate: 3200,
    features: ['Uniformed Chauffeur', 'Flight Delay Tracking', 'Clean Sanitized Cabin', 'Terminal Meet & Greet'],
    desc: 'Ideal for couples and solo corporate travelers. Swift, comfortable, and fuel-efficient for quick transfers across Goa.'
  },
  {
    id: 'tx-muv-ertiga',
    name: 'Maruti Ertiga (Comfort MUV)',
    category: 'MUV',
    badge: 'Family Favorite',
    badgeColor: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    seating: 6,
    luggage: 3,
    transmission: 'Manual',
    fuel: 'Petrol',
    ac: true,
    rating: 4.9,
    reviewsCount: 562,
    perKmRate: 46,
    airportRates: {
      mopa: 2600,
      dabolim: 2100
    },
    fullDayRate: 4200,
    features: ['Dual Zone AC', 'Large Luggage Boot', 'Comfortable 3-Row Seating', 'Professional Driver'],
    desc: 'Spacious 6-seater MUV with ample legroom for family vacations and small groups heading to North or South Goa.'
  },
  {
    id: 'tx-suv-innova',
    name: 'Toyota Innova Crysta',
    category: 'Executive SUV',
    badge: 'Executive VIP',
    badgeColor: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    seating: 7,
    luggage: 4,
    transmission: 'Automatic',
    fuel: 'Diesel',
    ac: true,
    rating: 5.0,
    reviewsCount: 894,
    perKmRate: 58,
    airportRates: {
      mopa: 3400,
      dabolim: 2900
    },
    fullDayRate: 5500,
    features: ['Captain Seats', 'Premium Audio', 'VIP Arrival Placard', 'Bottled Mineral Water', 'High Speed Fastag'],
    desc: 'The gold standard for luxury travel in Goa. Plush executive captain seats, powerful dual AC, and smooth suspension.'
  },
  {
    id: 'tx-luxury-fortuner',
    name: 'Toyota Fortuner 4x4 (VIP Escort)',
    category: 'Luxury VIP',
    badge: 'Ultra Luxury',
    badgeColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    seating: 6,
    luggage: 5,
    transmission: 'Automatic',
    fuel: 'Diesel',
    ac: true,
    rating: 5.0,
    reviewsCount: 180,
    perKmRate: 95,
    airportRates: {
      mopa: 6200,
      dabolim: 5500
    },
    fullDayRate: 9800,
    features: ['Full Leather Cabin', 'Chauffeur in Formal Attire', 'VIP Security Clearance', 'Zero Waiting Time'],
    desc: 'High-end presence and presidential luxury. Ideal for wedding delegations, celebrities, VIP guests, and nightlife transfers.'
  }
];

export default function TaxiServicesPage({
  pickupLoc = '',
  dropLoc = '',
  pickupDate = '',
  pickupTime = '',
  onBookTaxi,
  onOpenDetails
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTripType, setActiveTripType] = useState('airport');

  const categories = ['All', 'Sedan', 'MUV', 'Executive SUV', 'Luxury VIP'];

  const filteredFleet = useMemo(() => {
    if (selectedCategory === 'All') return TAXI_FLEET_DATA;
    return TAXI_FLEET_DATA.filter(car => car.category === selectedCategory);
  }, [selectedCategory]);

  const isMopa = (pickupLoc || '').toLowerCase().includes('mopa') || (dropLoc || '').toLowerCase().includes('mopa');
  const isDabolim = (pickupLoc || '').toLowerCase().includes('dabolim') || (dropLoc || '').toLowerCase().includes('dabolim');

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '100vh' }}>
      
      {/* ─── SECTION HEADER ──────────────────────────────────────────────── */}
      <div className="section-header mb-4 text-start">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill mb-2 fw-semibold" style={{ background: '#fff7ed', color: '#c2410c', fontSize: '13px', border: '1px solid #ffedd5' }}>
              <Sparkles size={14} className="text-warning" /> Professional Chauffeur Mobility in Goa
            </div>
            <h2 className="fs-2 fw-bold text-dark font-heading mb-1">
              Goa Airport Cabs & Chauffeur Services
            </h2>
            <p className="text-muted small mb-0" style={{ maxWidth: '650px' }}>
              Fixed guaranteed fares from <strong>Mopa (GOX)</strong> and <strong>Dabolim (GOI)</strong> airports. 
              Zero surge pricing, verified commercial drivers, and terminal meet & greet placard.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="bg-white border rounded-3 px-3 py-2 text-center shadow-sm">
              <span className="d-block fw-bold fs-5 text-dark font-heading">100%</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Fixed Tariff</span>
            </div>
            <div className="bg-white border rounded-3 px-3 py-2 text-center shadow-sm">
              <span className="d-block fw-bold fs-5 text-dark font-heading">60 Min</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Free Wait</span>
            </div>
            <div className="bg-white border rounded-3 px-3 py-2 text-center shadow-sm">
              <span className="d-block fw-bold fs-5 text-dark font-heading">4.9 ★</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>Rated Cabs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROUTE HIGHLIGHT ALERT BANNER (If location selected) ──────────── */}
      {(pickupLoc || dropLoc) && (
        <div className="alert border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#0B192C', color: '#ffffff' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ background: 'rgba(255, 107, 53, 0.2)' }}>
              <Navigation size={22} className="text-warning" />
            </div>
            <div>
              <div className="small text-white-50 text-uppercase fw-bold" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                Active Route Selected
              </div>
              <div className="fw-bold fs-6 text-white d-flex align-items-center gap-2">
                <span>{pickupLoc || 'Goa Airport'}</span>
                <ChevronRight size={16} className="text-warning" />
                <span>{dropLoc || 'North / South Goa'}</span>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill px-3 py-2 fw-semibold" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
              📅 {pickupDate || 'Today'} · {pickupTime || 'Immediate'}
            </span>
            <span className="badge rounded-pill px-3 py-2 fw-bold" style={{ background: '#FF6B35', color: '#ffffff', fontSize: '12px' }}>
              ✓ Flight Delay Tracking Active
            </span>
          </div>
        </div>
      )}

      {/* ─── CATEGORY & FILTER PILLS ──────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 bg-white p-3 rounded-4 shadow-sm border">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-bold me-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${selectedCategory === cat ? 'btn-dark text-white' : 'btn-light border text-secondary'}`}
              style={{ fontSize: '13px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-1 align-items-center p-1 rounded-pill border" style={{ background: '#f8fafc' }}>
          {[
            { id: 'airport', label: '✈️ Airport Transfer' },
            { id: 'point_to_point', label: '📍 Point-to-Point' },
            { id: 'full_day', label: '⏰ 8hr / 80km Full Day' }
          ].map(type => (
            <button
              key={type.id}
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${activeTripType === type.id ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted border-0'}`}
              style={{ fontSize: '12px' }}
              onClick={() => setActiveTripType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FLEET GRID ───────────────────────────────────────────────────── */}
      <div className="row g-4 mb-5">
        {filteredFleet.map(car => {
          let calculatedPrice = car.airportRates.dabolim;
          let priceLabel = 'Dabolim Airport Drop';
          if (isMopa) {
            calculatedPrice = car.airportRates.mopa;
            priceLabel = 'Mopa (GOX) Transfer';
          } else if (activeTripType === 'full_day') {
            calculatedPrice = car.fullDayRate;
            priceLabel = 'Full Day (8hr/80km)';
          } else if (activeTripType === 'point_to_point') {
            calculatedPrice = car.perKmRate * 35;
            priceLabel = `Est. ~35km (@ ₹${car.perKmRate}/km)`;
          }

          return (
            <div key={car.id} className="col-md-6 col-lg-6 col-xl-3">
              <div 
                className="card h-100 border rounded-4 shadow-sm overflow-hidden bg-white d-flex flex-column transition-smooth position-relative"
                style={{ 
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)' 
                }}
              >
                <div className="position-relative overflow-hidden" style={{ height: '190px', background: '#f1f5f9' }}>
                  <img 
                    src={car.image} 
                    alt={car.name} 
                    className="w-100 h-100 object-fit-cover transition-smooth"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="position-absolute top-0 start-0 m-2.5">
                    <span 
                      className="badge rounded-pill px-2.5 py-1 fw-bold text-white shadow-sm"
                      style={{ background: car.badgeColor, fontSize: '11px' }}
                    >
                      {car.badge}
                    </span>
                  </div>

                  <div className="position-absolute bottom-0 start-0 m-2.5">
                    <span className="badge rounded-pill bg-dark text-white px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1" style={{ fontSize: '11px', backdropFilter: 'blur(4px)', background: 'rgba(15,23,42,0.85)' }}>
                      <Star size={11} className="text-warning fill-warning" /> {car.rating} ({car.reviewsCount})
                    </span>
                  </div>
                </div>

                <div className="p-3 d-flex flex-column flex-grow-1">
                  <div className="mb-2">
                    <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.6px' }}>
                      {car.category} · Chauffeur Driven
                    </div>
                    <h5 className="fw-bold text-dark font-heading mb-1 text-truncate" title={car.name}>
                      {car.name}
                    </h5>
                    <p className="text-muted mb-2 line-clamp-2" style={{ fontSize: '12px', minHeight: '36px', lineHeight: '1.4' }}>
                      {car.desc}
                    </p>
                  </div>

                  <div className="d-flex flex-wrap gap-1.5 mb-3">
                    <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                      <Users size={12} className="text-primary" /> {car.seating} Seats
                    </span>
                    <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                      <Briefcase size={12} className="text-secondary" /> {car.luggage} Bags
                    </span>
                    <span className="badge bg-light text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                      <ShieldCheck size={12} /> Chauffeur
                    </span>
                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11px' }}>
                      ❄️ Chilled AC
                    </span>
                  </div>

                  <div className="mb-3 border-top pt-2 flex-grow-1">
                    <ul className="list-unstyled mb-0" style={{ fontSize: '11px' }}>
                      {car.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="d-flex align-items-center gap-1.5 text-muted mb-1 text-truncate">
                          <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted" style={{ fontSize: '10px', fontWeight: 600 }}>
                        {priceLabel}
                      </div>
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="fs-4 fw-bold text-dark font-heading">
                          ₹{calculatedPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                          (All Incl.)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm rounded-pill px-3 py-2 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-1.5 transition-smooth"
                      style={{ 
                        background: '#FF6B35',
                        borderColor: '#FF6B35',
                        fontSize: '12.5px' 
                      }}
                      onClick={() => {
                        if (onBookTaxi) {
                          onBookTaxi({
                            ...car,
                            package_name: `${car.name} (${priceLabel})`,
                            package_type: 'Taxi Transfer',
                            type: 'taxi',
                            price: calculatedPrice,
                            pickup_location: pickupLoc || 'Goa Airport',
                            drop_location: dropLoc || 'North / South Goa',
                            pickup_date: pickupDate,
                            pickup_time: pickupTime || '10:00'
                          });
                        }
                      }}
                    >
                      Book Cab <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ─── WHY CHOOSE WOW GOA CHAUFFEURS ─────────────────────────────────── */}
      <div className="bg-white rounded-4 border p-4 shadow-sm mb-5">
        <h4 className="fw-bold text-dark font-heading mb-3 text-center">
          Why Travelers Rely on Wow Goa Chauffeur Mobility
        </h4>
        <div className="row g-3 text-start">
          <div className="col-md-3">
            <div className="d-flex align-items-start gap-2.5">
              <div className="p-2 rounded-3 bg-light text-primary">
                <Plane size={20} className="text-warning" />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 small">Real-Time Flight Radar</h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  We track your arrival at Dabolim or Mopa. Even if your flight is delayed, your chauffeur will be waiting.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="d-flex align-items-start gap-2.5">
              <div className="p-2 rounded-3 bg-light text-primary">
                <ShieldCheck size={20} className="text-success" />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 small">Zero Surge Guarantee</h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Pre-booked transparent rates without airport counter hassles, midnight surge fees, or bargaining.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="d-flex align-items-start gap-2.5">
              <div className="p-2 rounded-3 bg-light text-primary">
                <FileCheck size={20} className="text-primary" />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 small">KYC Verified Chauffeurs</h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Police-verified professional drivers with commercial yellow-board transport permits and tourist badges.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="d-flex align-items-start gap-2.5">
              <div className="p-2 rounded-3 bg-light text-primary">
                <PhoneCall size={20} className="text-info" />
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1 small">24/7 Dispatch Control</h6>
                <p className="text-muted small mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Dedicated operations desk in Goa ready to assist your transfers, luggage needs, and itinerary modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
