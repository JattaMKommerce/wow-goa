import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Fuel, Settings, ShieldCheck, 
  CheckCircle, ChevronRight, AlertCircle, PhoneCall, FileText, 
  Clock, Award, Sparkles, X, Zap, Shield, Camera
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';

/**
 * BikeDetailsPage
 * Dedicated information and review page for Self-Drive Rental Two-Wheelers & Bikes.
 * Displays authoritative vehicle specifications from available data,
 * rental terms, transparent pricing, and connects seamlessly to the existing booking flow.
 */
export default function BikeDetailsPage({
  bike,
  pickupDate,
  dropDate,
  bookingDays = 2,
  onBack,
  onBook,
  backLabel,
  actionLabel,
  breadcrumbPrefix,
  memberCount,
  onMemberCountChange,
  isCraftMyTrip = false
}) {
  const [capacityError, setCapacityError] = useState(null);

  // 1. Calculate rental days and pricing (consistent with existing vehicle pricing)
  const pricePerDay = Math.round(parseFloat(bike?.price || 500));
  const originalPricePerDay = Math.round(pricePerDay * 1.25); // 25% standard strikethrough

  const calculatedDays = useMemo(() => {
    if (pickupDate && dropDate) {
      const diff = Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return bookingDays || 2;
  }, [pickupDate, dropDate, bookingDays]);

  const baseRentalTotal = pricePerDay * calculatedDays;
  const gstAmount = Math.round(baseRentalTotal * 0.18);
  const estimatedTotal = baseRentalTotal + gstAmount;

  // 2. Normalize all bike images from actual DB columns
  const bikeImages = useMemo(() => {
    if (!bike) return [];
    const list = [];
    const add = (img) => {
      if (!img) return;
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      } else if (Array.isArray(img)) {
        img.forEach(add);
      }
    };

    // Primary images
    add(bike.image);
    add(bike.image_url);
    add(bike.imageUrl);

    // images_json
    if (bike.images_json) {
      try {
        const parsed = typeof bike.images_json === 'string' ? JSON.parse(bike.images_json) : bike.images_json;
        add(parsed);
      } catch (e) {}
    }

    // mediaList / additional_images
    if (Array.isArray(bike.mediaList)) add(bike.mediaList.map(m => m?.url || m));
    if (Array.isArray(bike.media_list)) add(bike.media_list.map(m => m?.url || m));
    if (Array.isArray(bike.additional_images)) add(bike.additional_images);
    if (Array.isArray(bike.images)) add(bike.images);

    return list;
  }, [bike]);

  // 3. Collect only specs that actually exist in the data
  const availableSpecs = useMemo(() => {
    if (!bike) return [];
    const specs = [];
    if (bike.engine) {
      specs.push({
        label: 'Engine / Displacement',
        val: bike.engine,
        icon: Zap
      });
    }
    if (bike.fuel) {
      specs.push({
        label: 'Fuel Type',
        val: bike.fuel,
        icon: Fuel
      });
    }
    if (bike.transmission) {
      specs.push({
        label: 'Transmission',
        val: bike.transmission,
        icon: Settings
      });
    }
    if (bike.mileage) {
      specs.push({
        label: 'Fuel Economy / Mileage',
        val: bike.mileage,
        icon: Sparkles
      });
    }
    if (bike.seating) {
      specs.push({
        label: 'Seating Capacity',
        val: String(bike.seating).toLowerCase().includes('seat') ? bike.seating : `${bike.seating} Seats`,
        icon: Award
      });
    }
    return specs;
  }, [bike]);

  if (!bike) return null;

  const isAvailable = bike.is_available === 1 || bike.is_available === true || bike.is_available === '1' || bike.is_available === undefined;
  const ratingVal = parseFloat(bike.rating || 4.8);
  const seatingCapacity = 2;

  const depositAmount = bike?.security_deposit !== undefined && bike?.security_deposit !== null && bike?.security_deposit !== '' 
    ? Number(bike.security_deposit) 
    : 1000;
  const kmAllowance = bike?.km_limit || 'Unlimited Kilometres';
  const fuelRule = bike?.fuel_policy || 'Same-to-Same';
  const helmetsCount = bike?.helmets_included !== undefined && bike?.helmets_included !== null && bike?.helmets_included !== ''
    ? bike.helmets_included
    : 2;
  const hasMobileHolder = bike?.has_mobile_holder == 1 || bike?.has_mobile_holder === true || bike?.has_mobile_holder === '1';
  const permitLabel = bike?.permit_type || 'Commercial Self-Drive (Black Plate)';
  const deliveryLocations = bike?.delivery_options || 'Airport, Railway Station & Hotel Delivery';

  const handleBookNowClick = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (isCraftMyTrip && memberCount && memberCount > seatingCapacity) {
      setCapacityError(`This vehicle accommodates up to ${seatingCapacity} passengers. Please choose another vehicle or reduce the number of members.`);
      return;
    }
    setCapacityError(null);
    if (onBook) onBook(bike);
  };

  return (
    <div className="bike-details-page animate-fade-in-up pb-5" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ─── 1. TOP STICKY NAVBAR ─── */}
      <div 
        className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between"
        style={{ zIndex: 1020 }}
      >
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (document.activeElement?.blur) document.activeElement.blur();
              onBack();
            }}
            className={`btn btn-light border hover-scale d-flex align-items-center gap-1.5 ${
              backLabel ? 'rounded-pill px-3 py-1.5 fw-bold text-xs' : 'rounded-circle p-2 justify-content-center'
            }`}
            title={backLabel || "Back"}
          >
            <ArrowLeft size={16} />
            {backLabel && <span>{backLabel.replace(/^←\s*/, '')}</span>}
          </button>
          <div>
            <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
              {breadcrumbPrefix || 'Self-Drive Rental Bikes'} &gt; {bike.category || 'Goa'} &gt; {bike.name}
            </div>
            <h5 className="mb-0 fw-bold text-dark font-heading">{bike.name}</h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button"
            onClick={handleBookNowClick}
            className="btn btn-warning text-dark btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
            style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
          >
            <span>{actionLabel || 'Book Now'}</span>
            <ChevronRight size={15} />
          </button>
          <button 
            type="button"
            onClick={() => {
              if (document.activeElement?.blur) document.activeElement.blur();
              onBack();
            }}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
          >
            <X size={15} /> Close
          </button>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: '1200px' }}>

        {/* ─── 2. BIKE HEADER & HIGHLIGHTS ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge rounded-pill px-3 py-1 text-xs fw-bold" style={{ background: '#0B192C', color: '#FFFFFF' }}>
                  🏍️ {bike.category || 'Two Wheeler'}
                </span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  ✓ WOW GOA Certified Fleet
                </span>
                {bike.badge && (
                  <span
                    className="badge rounded-pill px-2.5 py-1 text-xxs fw-bold"
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#B45309',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    ★ {bike.badge}
                  </span>
                )}
                {isAvailable ? (
                  <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    ● Instant Confirmation
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    On Request
                  </span>
                )}
              </div>

              <h1 className="fw-black text-dark mb-1 fs-2 font-heading tracking-tight">{bike.name}</h1>
              
              <div className="d-flex align-items-center gap-3 text-muted text-sm flex-wrap mt-2">
                <div className="d-flex align-items-center gap-1">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span className="fw-bold text-dark">{ratingVal.toFixed(1)}</span>
                  <span className="text-muted text-xs">(Verified Host)</span>
                </div>
                <span>•</span>
                <div className="d-flex align-items-center gap-1">
                  <MapPin size={15} className="text-warning" />
                  <span>{bike.location || 'All Goa Delivery'}</span>
                </div>
              </div>
            </div>

            {/* Quick Price Badge */}
            <div className="d-flex flex-column align-items-start align-items-md-end bg-light p-3 rounded-3 border flex-shrink-0" style={{ minWidth: '220px' }}>
              <span className="text-muted text-xxs text-uppercase fw-bold">Daily Rental Rate</span>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-decoration-line-through text-muted text-xs">₹{originalPricePerDay.toLocaleString('en-IN')}</span>
                <h3 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '26px' }}>₹{pricePerDay.toLocaleString('en-IN')}</h3>
                <span className="text-muted text-xs">/ day</span>
              </div>
              <span className="text-success text-xxs fw-bold mt-0.5">Includes Unlimited Kilometres</span>
            </div>
          </div>
        </div>

        {/* ─── 3. INTERACTIVE BIKE IMAGE GALLERY ─── */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          {bikeImages.length > 0 ? (
            <>
              <ImageCarousel
                images={bikeImages}
                alt={bike.name}
                height="440px"
                rounded="16px"
              />
              <div className="d-flex justify-content-between align-items-center mt-2 px-1 text-muted text-xs">
                <span>📸 Showing all real vehicle photos ({bikeImages.length} total)</span>
                <span className="text-muted">Click photo to zoom fullscreen</span>
              </div>
            </>
          ) : (
            <div 
              className="d-flex flex-column align-items-center justify-content-center text-muted rounded-3 p-5"
              style={{ height: '360px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
            >
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-xs" style={{ width: '64px', height: '64px', background: 'rgba(100,116,139,0.1)', border: '1px dashed rgba(100,116,139,0.3)' }}>
                <Camera size={30} className="text-secondary opacity-75" />
              </div>
              <h6 className="fw-bold text-dark mb-1">No Photos Uploaded</h6>
              <p className="text-muted small mb-0">The vehicle vendor has not uploaded photographs for this listing yet.</p>
            </div>
          )}
        </div>

        {/* ─── 4. MAIN CONTENT ROW (SPECS & SIDEBAR) ─── */}
        <div className="row g-4">
          
          {/* Left Column: Specifications & Rental Policies */}
          <div className="col-12 col-lg-8">

            {/* Rental Highlights & Trust Badges */}
            <div className="bg-white rounded-4 shadow-sm p-3.5 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <div className="row g-2.5">
                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 bg-light border text-center h-100 d-flex flex-column justify-content-center align-items-center">
                    <span className="fs-5 mb-1">🪖</span>
                    <span className="text-muted text-xxs text-uppercase fw-bold">Helmets</span>
                    <span className="fw-bold text-dark text-xs">{helmetsCount} Included Free</span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 bg-light border text-center h-100 d-flex flex-column justify-content-center align-items-center">
                    <span className="fs-5 mb-1">💰</span>
                    <span className="text-muted text-xxs text-uppercase fw-bold">Security Deposit</span>
                    <span className="fw-bold text-dark text-xs">₹{depositAmount.toLocaleString('en-IN')} (Refundable)</span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 bg-light border text-center h-100 d-flex flex-column justify-content-center align-items-center">
                    <span className="fs-5 mb-1">🛣️</span>
                    <span className="text-muted text-xxs text-uppercase fw-bold">KM Limit</span>
                    <span className="fw-bold text-dark text-xs">{kmAllowance}</span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 bg-light border text-center h-100 d-flex flex-column justify-content-center align-items-center">
                    <span className="fs-5 mb-1">🛡️</span>
                    <span className="text-muted text-xxs text-uppercase fw-bold">Goa Permit</span>
                    <span className="fw-bold text-dark text-xs">{permitLabel.includes('Black') ? 'Black Plate Legal' : 'Verified Permit'}</span>
                  </div>
                </div>
              </div>

              {/* Extra amenity tags */}
              <div className="d-flex flex-wrap gap-2 pt-3 mt-3 border-top text-xs">
                {hasMobileHolder && (
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                    📱 Mobile GPS Holder Mounted
                  </span>
                )}
                <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                  ⛽ {fuelRule} Fuel Policy
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                  ✈️ {deliveryLocations}
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                  ⚡ Clean &amp; Freshly Serviced
                </span>
              </div>
            </div>

            {/* Vehicle Specifications Grid */}
            {availableSpecs.length > 0 && (
              <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
                <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                  <Award size={20} className="text-warning" />
                  Vehicle Specifications &amp; Features
                </h5>

                <div className="row g-3">
                  {availableSpecs.map((spec, sIdx) => {
                    const IconComp = spec.icon;
                    return (
                      <div key={sIdx} className="col-6 col-sm-4">
                        <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                          <IconComp className="text-primary mb-1.5 mx-auto" size={24} />
                          <span className="text-muted text-xxs text-uppercase fw-bold">{spec.label}</span>
                          <span className="fw-bold text-dark fs-6 mt-1">{spec.val}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* How Renting Works: 3 Simple Steps */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <Clock size={20} className="text-primary" />
                How To Rent This Bike in Goa
              </h5>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border h-100 position-relative">
                    <span className="badge bg-primary text-white rounded-circle p-2 fw-bold d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '28px', height: '28px' }}>
                      1
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Book Online</h6>
                    <p className="text-muted text-xs mb-0">
                      Reserve instantly with booking confirmation sent straight to your WhatsApp and email.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border h-100 position-relative">
                    <span className="badge bg-primary text-white rounded-circle p-2 fw-bold d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '28px', height: '28px' }}>
                      2
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Present DL &amp; Take Keys</h6>
                    <p className="text-muted text-xs mb-0">
                      Meet the delivery host at airport/hotel, show physical DL, complete quick joint video inspection &amp; hand over deposit.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border h-100 position-relative">
                    <span className="badge bg-success text-white rounded-circle p-2 fw-bold d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '28px', height: '28px' }}>
                      3
                    </span>
                    <h6 className="fw-bold text-dark mb-1">Return &amp; Get Deposit</h6>
                    <p className="text-muted text-xs mb-0">
                      Hand back the bike at scheduled time. Your ₹{depositAmount.toLocaleString('en-IN')} security deposit is refunded on the spot via UPI/Cash.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Handover Document Checklist */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <ShieldCheck size={20} className="text-success" />
                Mandatory Handover Document Checklist
              </h5>

              <div className="row g-3 text-xs">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5 p-2.5 rounded-3 bg-light border">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-dark d-block">Original Physical Driving License</strong>
                      <span className="text-muted">Must hold a valid two-wheeler physical license. (Learners license or digital phone photos not permitted by Goa Police).</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5 p-2.5 rounded-3 bg-light border">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-dark d-block">Government ID Proof</strong>
                      <span className="text-muted">Original Aadhaar Card, Passport, or Voter ID required for identity verification during key handover.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5 p-2.5 rounded-3 bg-light border">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-dark d-block">Age Eligibility (18+ Years)</strong>
                      <span className="text-muted">Rider must be at least 18 years of age with a minimum of 6 months active riding experience.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5 p-2.5 rounded-3 bg-light border">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-dark d-block">Refundable Security Deposit</strong>
                      <span className="text-muted">Deposit of ₹{depositAmount.toLocaleString('en-IN')} is paid at handover via GPay/PhonePe/Cash and refunded upon return inspection.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Terms & Riding Conditions */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <FileText size={20} className="text-warning" />
                Goa Tourist Riding Guidelines &amp; Rules
              </h5>

              <div className="row g-3 text-sm">
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Mandatory Helmet Usage (Rider &amp; Pillion)</span>
                      <span className="text-muted text-xs">Goa Traffic Police strictly enforces helmets for both rider and passenger at all times. {helmetsCount} helmets are provided free.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Kilometre Allowance</span>
                      <span className="text-muted text-xs">{kmAllowance}. Explore North and South Goa beaches, waterfalls, and forts with complete freedom.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Fuel Policy</span>
                      <span className="text-muted text-xs">{fuelRule}. The bike is handed over with an indicated fuel level; please return with the same level.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <CheckCircle size={18} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Commercial Self-Drive Legal Permit</span>
                      <span className="text-muted text-xs">This vehicle holds a verified {permitLabel} compliant with the Goa Motor Vehicles Act.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <AlertCircle size={18} className="text-danger mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Strict No Beach Riding</span>
                      <span className="text-muted text-xs">Riding any vehicle on Goa beaches is strictly illegal by state law and subject to heavy police impoundment and fines.</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-2.5">
                    <AlertCircle size={18} className="text-danger mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="fw-bold text-dark d-block">Zero Alcohol Tolerance</span>
                      <span className="text-muted text-xs">Drunk driving is strictly penalized by Goa police checkpoints with breathalyzer tests across all coastal belts.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance & Guarantee */}
            <div className="alert alert-info d-flex align-items-center gap-3 rounded-4 p-3.5 mb-0 border-0 shadow-xs" style={{ background: '#EFF6FF', color: '#1E40AF' }}>
              <Shield size={28} className="flex-shrink-0" />
              <div className="text-xs">
                <span className="fw-bold d-block mb-0.5">24/7 Verified Support &amp; Roadside Assistance</span>
                <span>All vehicles in WOW GOA fleet are inspected and serviced prior to delivery. Dedicated local roadside support is available for emergencies across Goa.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Pricing Breakdown & Booking Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card border shadow-sm rounded-4 p-4 sticky-top" style={{ top: '90px', borderColor: '#E2E8F0' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark font-heading mb-0">Rental Summary</h5>
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  Guaranteed Rate
                </span>
              </div>

              {/* Rental Dates Summary */}
              <div className="bg-light rounded-3 p-3 mb-3 border text-xs">
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Rental Duration:</span>
                  <span className="fw-bold text-dark">{calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}</span>
                </div>
                {pickupDate && (
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Pickup Date:</span>
                    <span className="fw-semibold text-dark">{pickupDate}</span>
                  </div>
                )}
                {dropDate && (
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Drop-off Date:</span>
                    <span className="fw-semibold text-dark">{dropDate}</span>
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="d-flex flex-column gap-2 mb-3 text-xs">
                <div className="d-flex justify-content-between text-muted">
                  <span>Base Rate (₹{pricePerDay.toLocaleString('en-IN')} × {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'})</span>
                  <span className="fw-bold text-dark">₹{baseRentalTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Taxes &amp; GST (18%)</span>
                  <span className="fw-bold text-dark">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Kilometre Allowance</span>
                  <span className="text-success fw-bold">{kmAllowance}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Helmets Included</span>
                  <span className="text-success fw-bold">{helmetsCount} Sanitized (Free)</span>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="fw-bold text-dark fs-6">Booking Amount</span>
                  <div className="text-end">
                    <span className="fw-black text-primary fs-5 font-heading">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                    <span className="text-muted text-xxs d-block">incl. all taxes</span>
                  </div>
                </div>

                {/* Refundable Security Deposit Note */}
                <div className="p-2.5 rounded-3 bg-light border mt-1">
                  <div className="d-flex justify-content-between align-items-center mb-0.5">
                    <span className="fw-bold text-dark text-xxs">Refundable Security Deposit:</span>
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold text-xxs">₹{depositAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="text-muted text-xxs d-block" style={{ fontSize: '10px' }}>
                    Collected at vehicle key handover &amp; 100% refunded immediately upon vehicle return.
                  </span>
                </div>
              </div>

              {/* Capacity Validation Notice */}
              {isCraftMyTrip && (memberCount > seatingCapacity || capacityError) && (
                <div className="alert alert-warning border border-warning rounded-3 p-3 mb-3 text-xs" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <div className="d-flex align-items-start gap-2">
                    <AlertCircle size={17} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="fw-bold text-dark mb-1">Capacity Notice</div>
                      <div className="text-secondary mb-2">
                        {capacityError || `This vehicle accommodates up to ${seatingCapacity} passengers. Please choose another vehicle or reduce the number of members.`}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {onMemberCountChange && (
                          <button
                            type="button"
                            className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-2.5 py-1 text-xxs"
                            onClick={() => {
                              onMemberCountChange(seatingCapacity);
                              setCapacityError(null);
                            }}
                          >
                            Update to {seatingCapacity} members
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-xxs"
                          onClick={() => {
                            if (document.activeElement?.blur) document.activeElement.blur();
                            onBack();
                          }}
                        >
                          Choose Another Vehicle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleBookNowClick}
                className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-scale font-heading py-2.5"
                style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
              >
                <span>{actionLabel || 'Book This Bike'}</span>
                <ChevronRight size={18} />
              </button>

              <div className="text-center text-muted text-xxs mt-3">
                🔒 Safe &amp; Secure Booking • Instant Confirmation
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── 5. MOBILE STICKY BOTTOM BAR ─── */}
      <div 
        className="d-lg-none fixed-bottom bg-white border-top px-4 py-3 shadow-lg d-flex justify-content-between align-items-center"
        style={{ zIndex: 1010 }}
      >
        <div>
          <span className="text-muted text-xxs d-block">Total ({calculatedDays} {calculatedDays === 1 ? 'day' : 'days'})</span>
          <div className="fw-black text-primary font-heading fs-5 mb-0">
            ₹{estimatedTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleBookNowClick}
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
        >
          <span>{actionLabel || 'Book This Bike'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
