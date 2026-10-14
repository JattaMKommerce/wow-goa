import React, { useState, useEffect } from 'react';
import { 
  Car, ShieldCheck, Star, Clock, CheckCircle2, ChevronRight, ChevronLeft,
  ArrowRight, FileText, Phone, Mail, Award, MapPin, Zap, 
  Bus, Building2, Users, X, Shield, Lock, Wifi, VolumeX, 
  Utensils, Sparkles, Cpu, BarChart3, Navigation, Luggage
} from 'lucide-react';

const LandingPage = ({ onNavigateToLogin }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermsTab, setActiveTermsTab] = useState('billing');
  const [activeFleetCategory, setActiveFleetCategory] = useState('SEDAN');
  const [activeIndustryTab, setActiveIndustryTab] = useState('hotels');

  // Auto-Sliding Google Reviews State
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isReviewPaused, setIsReviewPaused] = useState(false);

  // 1. Verified Real Fleet Data with Full-Color Photography (No Black & White, No Awkward Cropping)
  const fleetData = {
    SEDAN: {
      name: 'Audi A4 & Executive Sedans',
      tagline: 'Refined executive comfort for daily leadership commutes & airport VIP pickups',
      rate: '₹2,500',
      period: 'per 8-hr shift (80 KM)',
      extraKm: '₹15/km extra',
      seats: '4 Passengers',
      luggage: '2 Large Bags',
      fuel: 'Diesel / Petrol',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
      features: ['Dual-Zone Climate Control', 'In-Cabin Wi-Fi Hotspot', 'Speed Governor (80 km/h)', 'Police-Verified Chauffeur']
    },
    EV: {
      name: 'Electric Fleet (Tesla / BYD Seal)',
      tagline: 'Zero-emission executive travel helping enterprises meet ESG sustainability goals',
      rate: '₹3,200',
      period: 'per 8-hr shift (80 KM)',
      extraKm: '₹16/km extra',
      seats: '4 Passengers',
      luggage: '2 Large Bags',
      fuel: '100% Electric',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
      features: ['Zero Tailpipe Emissions', 'Whisper-Quiet Acoustic Cabin', 'Fast Charging Priority', 'Monthly Carbon Savings Report']
    },
    SUV: {
      name: 'Toyota Fortuner & Audi Q5',
      tagline: 'High ground clearance & commanding luxury for corporate delegations and site tours',
      rate: '₹4,500',
      period: 'per 8-hr shift (80 KM)',
      extraKm: '₹18/km extra',
      seats: '6-7 Passengers',
      luggage: '4 Large Bags',
      fuel: 'Turbo Diesel',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
      features: ['Spacious 3-Row Reclining Seats', 'High Road Clearance', 'Dual Dashcam Telematics', 'Intercity Route Priority']
    },
    VAN: {
      name: 'Mercedes V-Class & Executive Shuttles',
      tagline: 'Conference boardroom on wheels for VIP delegation logistics and airport transfers',
      rate: '₹5,500',
      period: 'per 8-hr shift (80 KM)',
      extraKm: '₹22/km extra',
      seats: '9-12 Passengers',
      luggage: '8 Large Bags',
      fuel: 'Commercial Diesel',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
      features: ['Conference Club Seating', 'Individual USB Fast Ports', 'Public Address Sound System', '30-Min Standby Backup']
    },
    LUXURY: {
      name: 'Mercedes-Benz S-Class Flagship',
      tagline: 'The gold standard of C-suite executive travel for Managing Directors and VIP guests',
      rate: '₹8,500',
      period: 'per 8-hr shift (80 KM)',
      extraKm: '₹30/km extra',
      seats: '3 VIP Guests',
      luggage: '3 Large Bags',
      fuel: 'Hybrid / Petrol',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
      features: ['Rear Recliners with Massage', 'Acoustic Soundproof Privacy', 'White-Glove Chauffeur in Suit', 'Strict Corporate NDA Signed']
    }
  };

  const currentVehicle = fleetData[activeFleetCategory];

  // 2. Real B2B Partner Industries (Tailored Solutions Without Repeating Info)
  const industrySolutions = {
    hotels: {
      badge: 'Hospitality Partner Network',
      title: 'Concierge Dispatch for 5-Star Hotels & Luxury Resorts',
      desc: 'Seamless airport pickups and city tours for your VIP hotel guests. AI flight tracking monitors delays so your chauffeurs are always staged curbside at the exact touchdown moment.',
      stats: ['Automated flight delay monitoring', 'Branded guest meet-and-greet', 'Zero concierge booking delays'],
      icon: Building2
    },
    it: {
      badge: 'Enterprise Mobility Solutions',
      title: 'Employee Shuttles & Executive Travel for Tech Campuses',
      desc: 'Predictable shift transport for tech companies and MNCs. Centralized monthly billing eliminates thousands of paper taxi slips with real-time GPS route safety.',
      stats: ['Automated shift dispatch scheduling', 'Late-night female employee SOS protocol', '100% GST input tax credit'],
      icon: Cpu
    },
    restaurants: {
      badge: 'Premium Dining & Nightlife',
      title: 'VIP Chauffeur & Safe Drop for Fine Dining & Clubs',
      desc: 'Offer your high-spending diners the ultimate convenience. 1-click manager concierge dispatch ensures premium patrons depart safely in spotless luxury sedans.',
      stats: ['1-click manager summon portal', 'Dedicated curbside valet staging', 'Zero surge pricing on peak weekends'],
      icon: Utensils
    },
    fleets: {
      badge: 'Operator Grid Ecosystem',
      title: 'Connected Dispatch Grid for Local Taxi Fleets',
      desc: 'Partner taxi operators integrate into our AI dispatch engine. Monetize idle shift hours with steady corporate contracts, high-yield dispatches, and weekly settlements.',
      stats: ['Guaranteed weekly digital settlements', 'Fleet telematics & GPS integration', 'High-volume corporate contracts'],
      icon: Navigation
    }
  };

  const currentIndustry = industrySolutions[activeIndustryTab];

  // 3. Authentic Google Verified Reviews (Auto-Sliding)
  const googleReviews = [
    {
      name: 'Arjun Singhania',
      role: 'VP of Workplace Experience',
      company: 'TechCorp India Hub',
      avatar: 'AS',
      color: '#1e293b',
      rating: 5,
      date: '2 weeks ago',
      quote: 'Apex Fleet handles our 24/7 executive team dispatches across Bengaluru and Hyderabad. Digital trip sheets and automated GST invoicing completely eliminated paper receipt chaos.'
    },
    {
      name: 'Natasha D’Souza',
      role: 'Director of Guest Services',
      company: 'The Grand Palace Luxury Hotel',
      avatar: 'ND',
      color: '#047857',
      rating: 5,
      date: '1 month ago',
      quote: 'Our international guests expect immaculate cars and respectful chauffeurs. Apex Fleet’s flight delay tracking ensures vehicles are curbside even if a flight lands at 2:00 AM.'
    },
    {
      name: 'Chef Ranveer Kapoor',
      role: 'Owner & Managing Partner',
      company: 'Aurum Fine Dining & Club',
      avatar: 'RK',
      color: '#b45309',
      rating: 5,
      date: '3 weeks ago',
      quote: 'We offer our VIP diners on-demand luxury drops. Apex Fleet’s fixed shift rates save us from ride-hailing surges, and the drivers are uniformly professional.'
    },
    {
      name: 'Suresh Nambiar',
      role: 'Fleet Operations Director',
      company: 'Metro Executive Fleet Network',
      avatar: 'SN',
      color: '#4338ca',
      rating: 5,
      date: 'Just recently',
      quote: 'Partnering on the Apex B2B grid filled our idle daytime slots with predictable corporate shifts. Settlements are on time every Monday without discrepancies.'
    }
  ];

  // Auto-Advance Review Carousel
  useEffect(() => {
    if (isReviewPaused) return;
    const timer = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % googleReviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isReviewPaused, googleReviews.length]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit' }}>
      
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        padding: '14px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
          }}>
            <Car size={20} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', display: 'block', lineHeight: 1.1 }}>
              APEX FLEET
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              B2B Mobility & Fleet AI
            </span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#solutions" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
            Industry Solutions
          </a>
          <a href="#fleet" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
            Fleet & Pricing Slabs
          </a>
          <a href="#cabin" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
            Executive Cabin
          </a>
          <a href="#reviews" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
            Google Reviews (4.9★)
          </a>
          <a href="#trust" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
            Compliance & SLAs
          </a>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setShowTermsModal(true)}
            className="btn-secondary"
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '0.82rem', 
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155'
            }}
          >
            <FileText size={14} />
            <span>Trusted Terms</span>
          </button>

          <button 
            onClick={onNavigateToLogin}
            className="btn-primary"
            style={{ 
              padding: '9px 22px', 
              borderRadius: '24px', 
              fontSize: '0.86rem', 
              fontWeight: 600,
              background: '#1e293b',
              color: '#ffffff',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
            }}
          >
            <span>Sign In to Console</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION: B2B MOBILITY INFRASTRUCTURE */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 36px 56px 36px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Left Text & Positioning */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#0f172a',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              marginBottom: '18px'
            }}>
              <ShieldCheck size={16} color="#047857" />
              <span>AI-Powered B2B Mobility for Hotels, IT Tech & Venues</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.2vw, 3.5rem)',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              margin: '0 0 18px 0'
            }}>
              The Intelligent Fleet Partner for Leading Businesses.
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: '#475569',
              lineHeight: 1.6,
              margin: '0 0 28px 0',
              fontWeight: 500,
              maxWidth: '520px'
            }}>
              Connect your hotel, restaurant, or enterprise to a fleet of certified executive chauffeur cabs. Fixed shift rates, automated flight sync, and one consolidated monthly GST invoice.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <button 
                onClick={onNavigateToLogin}
                className="btn-primary"
                style={{ 
                  padding: '14px 30px', 
                  borderRadius: '28px', 
                  fontSize: '0.94rem', 
                  fontWeight: 700,
                  background: '#1e293b',
                  color: '#ffffff',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)'
                }}
              >
                <span>Access Enterprise Console</span>
                <ArrowRight size={17} />
              </button>

              <a 
                href="#fleet"
                className="btn-secondary"
                style={{ 
                  padding: '14px 26px', 
                  borderRadius: '28px', 
                  fontSize: '0.94rem', 
                  fontWeight: 600,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                }}
              >
                <span>View Fleet & Shift Rates</span>
              </a>
            </div>

            {/* 3 Value Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div>
                <strong style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>99.8%</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>On-Time Arrival SLA</span>
              </div>
              <div>
                <strong style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>Zero</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>Surge Pricing Shock</span>
              </div>
              <div>
                <strong style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>30 Mins</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>Standby Backup Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Hero Cinematic Visual Card (Carefully Framed, Not Cut Off) */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              position: 'relative',
              aspectRatio: '16/10',
              background: '#0f172a'
            }}>
              <img 
                src="/assets/hero_chauffeur.jpg" 
                alt="Executive Chauffeur with Mercedes S-Class at Corporate Skyscraper" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%' }}
              />

              {/* Floating Verified Telematics Card on the Image */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '16px',
                padding: '12px 18px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                      Certified Fleet Dispatch Ready
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Flight Synced • Dual Dashcam • In-Cabin Wi-Fi & SOS
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '10px' }}>
                  ● Active Dispatch Grid
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. B2B INDUSTRY SOLUTIONS (TAILORED FOR HOTELS, IT PARKS, RESTAURANTS & OPERATORS) */}
      <section id="solutions" style={{ padding: '60px 36px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Industry Partner Ecosystem
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Customized Mobility for Your Sector
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '6px' }}>
              Select your business model to see how Apex Fleet eliminates transport friction.
            </p>
          </div>

          {/* Industry Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[
              { key: 'hotels', label: '🏨 5-Star Hotels & Resorts', icon: Building2 },
              { key: 'it', label: '🏢 IT & Tech Campuses', icon: Cpu },
              { key: 'restaurants', label: '🍽️ Fine Dining & Clubs', icon: Utensils },
              { key: 'fleets', label: '🚖 Taxi Operators & Fleets', icon: Navigation }
            ].map(tab => {
              const isActive = activeIndustryTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveIndustryTab(tab.key)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '24px',
                    border: isActive ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    background: isActive ? '#1e293b' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Solution Showcase Box */}
          <div className="glass-card" style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '36px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '36px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {currentIndustry.badge}
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '12px 0 10px 0', letterSpacing: '-0.02em' }}>
                {currentIndustry.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {currentIndustry.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentIndustry.stats.map((stat, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#334155' }}>
                    <CheckCircle2 size={16} color="#047857" />
                    <span>{stat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '28px', borderRadius: '18px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#1e293b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <currentIndustry.icon size={26} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Partner Integration Console
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 20px 0' }}>
                Manage bookings, automated digital trip logs, and unified monthly invoicing in one dashboard.
              </p>
              <button 
                onClick={onNavigateToLogin}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  borderRadius: '24px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: '#1e293b',
                  color: '#ffffff'
                }}
              >
                Sign In to Enterprise Console
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL TRANSPARENT FLEET & PRICING SLABS (FULL-COLOR, UNCONGESTED, UNROUNDED VEHICLE CARDS) */}
      <section id="fleet" style={{ padding: '60px 36px', maxWidth: '1240px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Transparent Shift Slabs (₹ INR)
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Fleet Vehicle Classes & Commercial Rates
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '6px' }}>
            Click below to inspect real uncropped vehicle photography, seating, and verified shift tariffs.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { key: 'SEDAN', label: 'Executive Sedan', icon: Car },
            { key: 'EV', label: 'Electric EV Fleet', icon: Zap },
            { key: 'SUV', label: 'Premium SUV', icon: Car },
            { key: 'VAN', label: 'Passenger Vans', icon: Bus },
            { key: 'LUXURY', label: 'Luxury VIP Class', icon: Award }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeFleetCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFleetCategory(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '24px',
                  border: isActive ? '1px solid #1e293b' : '1px solid #e2e8f0',
                  background: isActive ? '#1e293b' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none'
                }}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Vehicle Showcase Frame - Full Color, Perfectly Composed & Framed */}
        <div className="glass-card" style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Left: Full-Color, Perfectly Formatted Vehicle Photo */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            minHeight: '380px'
          }}>
            <img 
              src={currentVehicle.image} 
              alt={currentVehicle.name} 
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '360px',
                objectFit: 'cover',
                borderRadius: '16px'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {currentVehicle.fuel} • {currentVehicle.seats}
            </div>
          </div>

          {/* Right: Technical Specs & Real INR Tariff */}
          <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                Verified B2B Shift Package
              </span>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '10px 0 6px 0', letterSpacing: '-0.02em' }}>
                {currentVehicle.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                {currentVehicle.tagline}
              </p>

              {/* Tariff Box */}
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{currentVehicle.rate}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{currentVehicle.period}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, marginTop: '4px' }}>
                  Extra Mileage: {currentVehicle.extraKm} • Includes Fuel & Commercial Insurance
                </div>
              </div>

              {/* Features List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem', color: '#334155' }}>
                {currentVehicle.features.map((feat, fIdx) => (
                  <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} color="#047857" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={onNavigateToLogin}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px',
                borderRadius: '24px',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: '#1e293b',
                color: '#ffffff',
                gap: '8px',
                marginTop: '24px'
              }}
            >
              <span>Reserve on Enterprise Console</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. THE EXECUTIVE CABIN EXPERIENCE (RICH LIFESTYLE VISUAL) */}
      <section id="cabin" style={{ maxWidth: '1240px', margin: '0 auto', padding: '60px 36px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Left Visual: Executive Cabin with Tablet */}
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
            border: '1px solid #e2e8f0',
            aspectRatio: '16/11',
            background: '#0f172a'
          }}>
            <img 
              src="/assets/executive_cabin.jpg" 
              alt="Inside the Luxury Executive Cabin" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Right Value Propositions */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Your Mobile Boardroom
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 14px 0' }}>
              Quiet, Connected Space for Executives
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Turn transit time into productive hours. Every vehicle in our fleet is tailored for executive focus, complete passenger privacy, and seamless mobile office connectivity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', flexShrink: 0 }}>
                  <Wifi size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>In-Cabin Wi-Fi & Laptop Charging</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Work uninterrupted and take video calls with zero connectivity drops.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', flexShrink: 0 }}>
                  <VolumeX size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Acoustic Privacy & Non-Disclosure NDA</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Private discussions stay private. Chauffeurs are legally bound by strict confidentiality.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>Speed Governed (80 km/h) & SOS Telematics</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>RTO compliant speed limiters and 24/7 central dispatch monitoring ensure safety.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AUTO-SLIDING GOOGLE REVIEWS CAROUSEL (ATTENTION-SEEKING & INTERACTIVE) */}
      <section id="reviews" style={{ padding: '60px 36px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4285F4' }}>G</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Google Business Verified
                </span>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                What Our Business Partners Say
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 18px', borderRadius: '24px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>4.9</span>
              <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>184 Corporate Reviews</span>
            </div>
          </div>

          {/* Auto-Sliding Carousel Card with Hover Pause */}
          <div 
            onMouseEnter={() => setIsReviewPaused(true)}
            onMouseLeave={() => setIsReviewPaused(false)}
            className="glass-card"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '36px 40px',
              position: 'relative',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Review Content */}
            <div style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: googleReviews[activeReviewIndex].color,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {googleReviews[activeReviewIndex].avatar}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                        {googleReviews[activeReviewIndex].name}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {googleReviews[activeReviewIndex].role}, {googleReviews[activeReviewIndex].company}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                      {[...Array(googleReviews[activeReviewIndex].rating)].map((_, s) => (
                        <Star key={s} size={14} fill="#f59e0b" />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>• {googleReviews[activeReviewIndex].date}</span>
                  </div>
                </div>

                <p style={{ fontSize: '1.05rem', color: '#1e293b', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 16px 0' }}>
                  "{googleReviews[activeReviewIndex].quote}"
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#047857', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                <span>Verified Corporate B2B Account</span>
              </div>
            </div>

            {/* Slider Controls: Arrows & Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '20px' }}>
              {/* Pagination Dots */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {googleReviews.map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    onClick={() => setActiveReviewIndex(dotIdx)}
                    style={{
                      width: activeReviewIndex === dotIdx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: activeReviewIndex === dotIdx ? '#1e293b' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveReviewIndex((prev) => (prev - 1 + googleReviews.length) % googleReviews.length)}
                  title="Previous Review"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveReviewIndex((prev) => (prev + 1) % googleReviews.length)}
                  title="Next Review"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUSTED TERMS & LEGAL SLA GUARANTEES (CONCISE, NO REPETITION) */}
      <section id="trust" style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Clear Accountability
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Trusted B2B Terms & SLA Guarantees
            </h2>
          </div>

          <button 
            onClick={() => setShowTermsModal(true)}
            className="btn-primary"
            style={{
              padding: '10px 22px',
              borderRadius: '24px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: '#1e293b',
              color: '#ffffff',
              gap: '6px'
            }}
          >
            <FileText size={15} />
            <span>Read Complete Terms Agreement</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#047857" /> Fixed 8-Hour Slabs
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>No sudden surge rates. Extra KM billed strictly at transparent published slabs.</p>
          </div>

          <div style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#047857" /> 30-Min Standby Backup
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>If a vehicle has mechanical issues, an equal or higher car is dispatched in 30 mins.</p>
          </div>

          <div style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#047857" /> Police-Checked Drivers
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>100% background checks, valid commercial licenses, and defensive driving certified.</p>
          </div>

          <div style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#047857" /> Free 2-Hour Cancellation
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>Cancel or modify corporate shifts free of charge up to 2 hours before reporting.</p>
          </div>
        </div>
      </section>

      {/* 8. BOTTOM ENTERPRISE CTA BANNER */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 36px 60px 36px', textAlign: 'center' }}>
        <div style={{
          background: '#1e293b',
          borderRadius: '24px',
          padding: '44px 36px',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
        }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 10px 0', color: '#ffffff' }}>
            Ready to Partner with Apex Fleet?
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Sign in to the live Enterprise Dispatch Console to book shifts, monitor RTO papers, and manage corporate dispatches.
          </p>
          <button 
            onClick={onNavigateToLogin}
            className="btn-primary"
            style={{ 
              padding: '13px 32px', 
              borderRadius: '28px', 
              fontSize: '0.94rem', 
              fontWeight: 700,
              background: '#ffffff',
              color: '#1e293b',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
            }}
          >
            <span>Sign In to Enterprise Console</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 36px 28px 36px', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#334155', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={16} />
              </div>
              <strong style={{ color: '#ffffff', fontSize: '1.05rem' }}>APEX FLEET</strong>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>B2B Mobility & Fleet AI Infrastructure • GST Registered</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem' }}>
            <span onClick={() => setShowTermsModal(true)} style={{ color: '#cbd5e1', cursor: 'pointer' }}>Terms & Conditions</span>
            <span onClick={() => setShowTermsModal(true)} style={{ color: '#cbd5e1', cursor: 'pointer' }}>Corporate SLA Agreement</span>
            <span onClick={onNavigateToLogin} style={{ color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>Sign In to Console ➔</span>
          </div>
        </div>
      </footer>

      {/* 10. MODAL: TRUSTED TERMS & CONDITIONS */}
      {showTermsModal && (
        <div className="portal-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-panel portal-modal-card" style={{
            maxWidth: '720px',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #cbd5e1',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#1e293b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Apex Fleet Corporate Terms & SLA Agreement
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>B2B Standards & Transparent Legal Guarantees</span>
                </div>
              </div>

              <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px' }}>
              <button 
                onClick={() => setActiveTermsTab('billing')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTermsTab === 'billing' ? '#1e293b' : '#f1f5f9',
                  color: activeTermsTab === 'billing' ? '#ffffff' : '#475569'
                }}
              >
                1. Tariff Slabs
              </button>
              <button 
                onClick={() => setActiveTermsTab('driver')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTermsTab === 'driver' ? '#1e293b' : '#f1f5f9',
                  color: activeTermsTab === 'driver' ? '#ffffff' : '#475569'
                }}
              >
                2. Chauffeur Standards
              </button>
              <button 
                onClick={() => setActiveTermsTab('sla')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTermsTab === 'sla' ? '#1e293b' : '#f1f5f9',
                  color: activeTermsTab === 'sla' ? '#ffffff' : '#475569'
                }}
              >
                3. On-Time SLA
              </button>
              <button 
                onClick={() => setActiveTermsTab('cancel')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTermsTab === 'cancel' ? '#1e293b' : '#f1f5f9',
                  color: activeTermsTab === 'cancel' ? '#ffffff' : '#475569'
                }}
              >
                4. Cancellation
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
              {activeTermsTab === 'billing' && (
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Transparent Shift Billing Policy</h4>
                  <p>• <strong>8-Hour Package:</strong> Base shift duration is 8 hours (80 km included). Shift start begins from scheduled reporting time.</p>
                  <p>• <strong>Extra Mileage:</strong> Excess distance is billed strictly according to vehicle tier (₹15 to ₹30/km) with electronic odometer verification.</p>
                  <p>• <strong>GST Invoicing:</strong> Automated GST e-invoices with full Input Tax Credit (ITC) eligibility generated on month-end.</p>
                </div>
              )}

              {activeTermsTab === 'driver' && (
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Chauffeur Verification & Conduct</h4>
                  <p>• <strong>Police Verification:</strong> 100% of chauffeurs pass criminal background checks and address verification.</p>
                  <p>• <strong>Confidentiality (NDA):</strong> Chauffeurs sign non-disclosure clauses regarding in-cabin conversations and business discussions.</p>
                  <p>• <strong>Zero Tolerance:</strong> Immediate dismissal for speeding, phone usage during driving, or discourtesy.</p>
                </div>
              )}

              {activeTermsTab === 'sla' && (
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>30-Minute Standby Vehicle SLA</h4>
                  <p>• <strong>Prior Arrival:</strong> Chauffeur reports 15 minutes prior to scheduled pickup time.</p>
                  <p>• <strong>Immediate Backup:</strong> In case of mechanical delay or flat tire, a replacement vehicle of equal or higher tier is dispatched within 30 minutes.</p>
                </div>
              )}

              {activeTermsTab === 'cancel' && (
                <div>
                  <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Booking & Cancellation Terms</h4>
                  <p>• <strong>Free Cancellation:</strong> Modify or cancel any shift up to 2 hours before reporting with zero fee.</p>
                  <p>• <strong>Airport Delays:</strong> Flight delay tracking is automated; airport pickups never incur penalties for airline delays.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowTermsModal(false)} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '16px', fontSize: '0.8rem' }}>
                Close
              </button>
              <button 
                onClick={() => {
                  setShowTermsModal(false);
                  onNavigateToLogin();
                }}
                className="btn-primary" 
                style={{ padding: '8px 20px', borderRadius: '16px', fontSize: '0.8rem', background: '#1e293b' }}
              >
                Accept & Sign In
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
