import React, { useState } from 'react';
import { 
  Car, 
  Users, 
  Crown, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Sparkles, 
  Star, 
  Navigation, 
  Award,
  Zap,
  CheckCircle2
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
  const [activeTripType, setActiveTripType] = useState('one_way');

  const handleBookCar = (car, price) => {
    const bookingItem = {
      ...car,
      type: 'taxi',
      item_type: 'taxi',
      driverRequired: true,
      isSelfDriveRental: false,
      price: price || car.price,
      price_per_day: price || car.price,
      pickupLocation: pickupLoc || 'Doorstep Pickup (Goa)',
      dropLocation: dropLoc || 'Destination (North / South Goa)',
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
                Goa Chauffeur &amp; Taxi Hire
              </h1>
              <p className="text-muted small mb-0" style={{ maxWidth: '680px' }}>
                Verified commercial fleet, professional chauffeurs, fixed transparent tariffs, and 24x7 doorstep pickup across North &amp; South Goa.
              </p>
            </div>

            {/* Quick Trip Mode Pills */}
            <div className="d-flex flex-wrap gap-1 align-items-center p-1.5 rounded-pill border bg-light shadow-xs">
              {[
                { id: 'one_way', label: '📍 One-Way Trip' },
                { id: 'round_trip', label: '🔄 Round Trip' },
                { id: 'full_day', label: '⏰ Full Day Rental' }
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
                <span className="text-warning text-uppercase fw-bold text-xxs d-block" style={{ letterSpacing: '1px' }}>Selected Route</span>
                <div className="fw-bold fs-6">
                  {pickupLoc || 'Pickup Location'} <span className="text-warning">➔</span> {dropLoc || 'Drop Destination'}
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
                ✓ Fixed Pre-Confirmed Fare
              </span>
            </div>
          </div>
        )}

        {/* ─── PRIMARY 3-ROW CATEGORY SHOWCASE (Matching Self Drive Architecture) ── */}
        <TaxiCategoryShowcase
          tripMode={activeTripType}
          onBookTaxi={handleBookCar}
          onViewDetails={handleBookCar}
        />

        {/* ─── WHY BOOK WOW GOA TAXIS (Quality Standards) ────────────────── */}
        <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5 my-4">
          <div className="text-center mb-4">
            <span className="badge rounded-pill px-3 py-1 text-uppercase fw-bold mb-2" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontSize: '11px', letterSpacing: '0.5px' }}>
              Service Excellence
            </span>
            <h3 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.6rem' }}>
              Why Book Wow Goa Chauffeur Services?
            </h3>
            <p className="text-muted small mb-0">Experience stress-free travel with complete tariff transparency and reliable local chauffeurs.</p>
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
                    Every cab carries yellow commercial registration plates, comprehensive transit insurance, and verified tourist permits.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-3 p-2.5 text-white flex-shrink-0 shadow-xs" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #D84A1B 100%)' }}>
                  <Zap size={24} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">On-Time Pickup Guarantee</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                    Live GPS tracking and professional driver allocation ensure your cab arrives punctually at your doorstep or resort.
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
                    Fixed pre-confirmed tariffs with no surprise nighttime multipliers, rainy season spikes, or last-minute price jumps.
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
              Frequently Asked Questions About Goa Cabs
            </h4>
          </div>

          <div className="accordion accordion-flush" id="taxiFaqAccordion">
            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqOneHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqOne">
                  How will I receive driver and vehicle details?
                </button>
              </h2>
              <div id="faqOne" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Your chauffeur details, including vehicle registration number, driver name, and direct phone number, will be sent via WhatsApp and SMS well in advance of your scheduled ride.
                </div>
              </div>
            </div>

            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqTwoHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqTwo">
                  What is included in the Full Day Rental?
                </button>
              </h2>
              <div id="faqTwo" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Our Full Day package includes 8 hours and 80 kilometers of travel with a dedicated private chauffeur, clean air-conditioned cabin, and flexibility to visit beaches, cafes, and sightseeing spots across Goa.
                </div>
              </div>
            </div>

            <div className="accordion-item border-bottom">
              <h2 className="accordion-header" id="faqThreeHeader">
                <button className="accordion-button collapsed fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faqThree">
                  Can I book a cab for late-night transfers?
                </button>
              </h2>
              <div id="faqThree" className="accordion-collapse collapse" data-bs-parent="#taxiFaqAccordion">
                <div className="accordion-body text-muted small">
                  Yes, our operations operate 24x7 across all areas of North and South Goa. Pre-book your ride to ensure confirmed cab availability at any time of night.
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
                  Full 100% refund for cancellations requested up to 12 hours prior to scheduled pickup. Our customer support team is available around the clock to assist you with any schedule modifications.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
