import React, { useState } from 'react';
import { 
  Car, 
  Users, 
  Crown, 
  ShieldCheck, 
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
  Compass,
  Award
} from 'lucide-react';
import TaxiCategoryShowcase from '../../components/widgets/TaxiCategoryShowcase';
import CustomerReviewsSection from '../../components/reviews/CustomerReviewsSection';

export default function TaxiServicesPage({
  pickupLoc = '',
  dropLoc = '',
  pickupDate = '',
  pickupTime = '',
  onBookTaxi
}) {
  const [activeTripType, setActiveTripType] = useState('airport');

  const handleBookCar = (car, price) => {
    const bookingItem = {
      ...car,
      type: 'taxi',
      item_type: 'taxi',
      driverRequired: true,
      isSelfDriveRental: false,
      price: price || car.price,
      price_per_day: price || car.price,
      pickupLocation: pickupLoc || 'Goa International Airport',
      dropLocation: dropLoc || 'North Goa (Calangute / Candolim / Baga)',
      pickupDate: pickupDate || new Date().toISOString().split('T')[0],
      pickupTime: pickupTime || '12:00 PM',
      tripMode: activeTripType
    };
    if (onBookTaxi) {
      onBookTaxi(bookingItem);
    }
  };

  return (
    <div className="taxi-services-page pb-5" style={{ background: '#f8fafc' }}>
      
      {/* ─── HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-white border-bottom shadow-xs py-4 mb-4">
        <div className="container px-md-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge rounded-pill px-3 py-1 text-uppercase fw-bold" style={{ background: '#FF6B35', color: '#ffffff', fontSize: '11px', letterSpacing: '0.5px' }}>
                  24x7 Direct Dispatch
                </span>
                <span className="badge rounded-pill bg-dark text-white px-2.5 py-1 fw-bold" style={{ fontSize: '11px' }}>
                  Zero Surge Pricing
                </span>
              </div>
              <h1 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.9rem', letterSpacing: '-0.5px' }}>
                Goa Chauffeur &amp; Taxi Services
              </h1>
              <p className="text-muted small mb-0" style={{ maxWidth: '680px' }}>
                Verified commercial fleet, uniformed chauffeurs, transparent tariffs, and guaranteed airport terminal meet &amp; greet at Mopa (GOX) &amp; Dabolim (GOI).
              </p>
            </div>

            {/* Quick Trip Mode Pills */}
            <div className="d-flex flex-wrap gap-1 align-items-center p-1.5 rounded-pill border bg-light shadow-xs">
              {[
                { id: 'airport', label: '✈️ Airport Transfer' },
                { id: 'point_to_point', label: '📍 Point-to-Point' },
                { id: 'full_day', label: '⏰ 8hr / 80km Full Day' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                    activeTripType === type.id 
                      ? 'btn-dark text-white shadow-xs' 
                      : 'text-muted border-0 bg-transparent hover-text-dark'
                  }`}
                  style={{ fontSize: '12.5px' }}
                  onClick={() => setActiveTripType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-md-3">

        {/* ─── ROUTE HIGHLIGHT ALERT (If user searched in SearchWidget) ──── */}
        {(pickupLoc || dropLoc) && (
          <div className="alert border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: '#0B192C', color: '#ffffff' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>
                <Navigation size={20} />
              </div>
              <div>
                <span className="text-warning text-uppercase fw-bold text-xxs d-block" style={{ letterSpacing: '1px' }}>Active Booking Route</span>
                <div className="fw-bold fs-6">
                  {pickupLoc || 'Goa Airport'} <span className="text-warning">➔</span> {dropLoc || 'Goa Destination'}
                </div>
                {(pickupDate || pickupTime) && (
                  <div className="text-white-50 small mt-0.5" style={{ fontSize: '12px' }}>
                    Scheduled for: <strong>{pickupDate}</strong> {pickupTime && `at ${pickupTime}`}
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill bg-success text-white px-3 py-1.5 fw-bold">
                ✓ Fixed Tariff Guaranteed
              </span>
            </div>
          </div>
        )}

        {/* ─── PRIMARY 3-ROW CATEGORY SHOWCASE (Matching Self Drive Architecture) ── */}
        <TaxiCategoryShowcase
          tripMode={activeTripType}
          pickupLoc={pickupLoc}
          dropLoc={dropLoc}
          onBookTaxi={handleBookCar}
          onViewDetails={handleBookCar}
        />

        {/* ─── WHY BOOK WOW GOA TAXIS (Quality Standards) ────────────────── */}
        <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5 my-4">
          <div className="text-center mb-4">
            <span className="badge rounded-pill px-3 py-1 text-uppercase fw-bold mb-2" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: '11px', letterSpacing: '0.5px' }}>
              Premium Chauffeur Standards
            </span>
            <h3 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.6rem' }}>
              Why Book Wow Goa Taxi Services?
            </h3>
            <p className="text-muted small mb-0">Experience hassle-free mobility with complete transparency and top-rated local hospitality.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-3 p-2.5 text-white flex-shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">100% Commercial Fleet</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                    Every cab carries yellow commercial registration plates, comprehensive passenger transit insurance, and valid Goa transport permits.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-3 p-2.5 text-white flex-shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #D84A1B 100%)' }}>
                  <Plane size={24} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Live Flight Radar Sync</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                    Flight delayed? No worries! Our dispatcher desk automatically tracks your flight into Mopa (GOX) or Dabolim (GOI) with 60 minutes free wait time.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-3 p-2.5 text-white flex-shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                  <Award size={24} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Zero Surge Guarantee</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                    Fixed pre-confirmed tariffs with no surprise nighttime multipliers, rainy season spikes, or last-minute extortion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CUSTOMER REVIEWS SECTION ─────────────────────────────────── */}
        <CustomerReviewsSection />

        {/* ─── FAQ ACCORDION ────────────────────────────────────────────── */}
        <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5 my-4">
          <div className="mb-4">
            <span className="badge rounded-pill bg-light text-dark px-3 py-1 text-uppercase fw-bold mb-2 border" style={{ fontSize: '11px' }}>
              Help &amp; FAQs
            </span>
            <h4 className="fw-black text-dark mb-1 font-heading">
              Frequently Asked Questions About Goa Taxis
            </h4>
          </div>

          <div className="accordion accordion-flush" id="taxiFaqAccordion">
            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqOneHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqOne">
                  Where will the driver meet me at Goa Airport (Mopa / Dabolim)?
                </button>
              </h2>
              <div id="faqOne" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Your chauffeur will wait right outside the arrival terminal gate holding a personalized name placard with your name. You will receive the driver's contact and vehicle number via WhatsApp 30 minutes before your scheduled landing.
                </div>
              </div>
            </div>

            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqTwoHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqTwo">
                  What if my flight arrives late at night or is delayed?
                </button>
              </h2>
              <div id="faqTwo" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  We offer 24x7 operations. Our dispatcher system tracks flight arrival times in real time. We provide up to 60 minutes of complimentary waiting time starting from when your flight actually touches down on the runway.
                </div>
              </div>
            </div>

            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqThreeHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqThree">
                  Can I book a full-day cab for South Goa / North Goa sightseeing?
                </button>
              </h2>
              <div id="faqThree" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Yes! Choose our <strong>"8hr / 80km Full Day"</strong> package. Your private chauffeur will take you to forts, beaches, churches, and spice plantations at your own pace with clean air conditioning throughout the day.
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="faqFourHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqFour">
                  What is your cancellation and refund policy?
                </button>
              </h2>
              <div id="faqFour" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Full 100% refund for cancellations made up to 12 hours before scheduled pickup. For any urgent flight cancellations or changes, our 24/7 dispatcher helpline will immediately assist you with rescheduling.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
