import React, { useMemo } from 'react';
import { 
  ArrowLeft, Plane, Clock, ShieldCheck, CheckCircle2, ChevronRight, 
  Luggage, Info, Check, Calendar
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { getFlightDefaultImage, isUnrelatedInventoryImage } from '../../utils/bookingImageHelper';

// Airport metadata dictionary for friendly city and airport names
const AIRPORT_DIRECTORY = {
  'DEL': { name: 'Indira Gandhi International Airport', city: 'New Delhi', terminal: 'Terminal 1 / 3' },
  'BOM': { name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', terminal: 'Terminal 2' },
  'BLR': { name: 'Kempegowda International Airport', city: 'Bengaluru', terminal: 'Terminal 1 / 2' },
  'GOI': { name: 'Dabolim Airport', city: 'Goa (South/Central)', terminal: 'Terminal 1' },
  'GOX': { name: 'Manohar International Airport', city: 'Mopa, Goa (North)', terminal: 'Terminal 1' },
  'HYD': { name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', terminal: 'Main Terminal' },
  'MAA': { name: 'Chennai International Airport', city: 'Chennai', terminal: 'Domestic Terminal' },
  'CCU': { name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', terminal: 'Terminal 2' },
  'PNQ': { name: 'Pune Airport', city: 'Pune', terminal: 'Main Terminal' },
  'AMD': { name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', terminal: 'Terminal 1' },
  'COK': { name: 'Cochin International Airport', city: 'Kochi', terminal: 'Terminal 1' },
  'DXB': { name: 'Dubai International Airport', city: 'Dubai', terminal: 'Terminal 1 / 3' }
};

export default function FlightDetailsPage({
  flight,
  flightAdults = 1,
  flightChildren = 0,
  flightInfants = 0,
  flightClass = 'economy',
  pickupDate,
  onBack,
  onBook,
  isCraftMyTrip = false,
  backLabel,
  actionLabel,
  breadcrumbPrefix,
  isSelected = false,
  memberCount
}) {
  // 1. Travel date resolution (declared unconditionally for React rules of hooks)
  const travelDate = useMemo(() => {
    if (!flight) return '';
    if (flight.departureDate) return flight.departureDate;
    if (flight.departure && String(flight.departure).includes('T')) {
      return String(flight.departure).split('T')[0];
    }
    return pickupDate || new Date().toISOString().split('T')[0];
  }, [flight, pickupDate]);

  if (!flight) return null;

  // 2. Resolve basic flight information
  const airlineName = flight.airline?.name || flight.airline || 'Commercial Airline';
  const defaultFlightLogo = getFlightDefaultImage(airlineName);

  let resolvedLogo = defaultFlightLogo;
  const candidateLogos = [flight.logo, flight.airline_logo, flight.airline_image, flight.flight_image, flight.image];
  for (const cand of candidateLogos) {
    if (cand && typeof cand === 'string' && !isUnrelatedInventoryImage(cand)) {
      resolvedLogo = cand;
      break;
    }
  }
  const airlineLogo = resolvedLogo;
  const flightCode = flight.flight?.iata || flight.flight_number || flight.id || 'FL-Schedule';
  const stops = flight.stops || 'Non-stop';
  const isNonStop = String(stops).toLowerCase().includes('non') || String(stops) === '0';
  
  const fromCode = (flight.from || flight.departure?.iata || flight.from_loc || 'DEL').toUpperCase();
  const toCode = (flight.to || flight.arrival?.iata || flight.to_loc || 'GOI').toUpperCase();

  const originInfo = AIRPORT_DIRECTORY[fromCode] || { name: `${fromCode} Airport`, city: flight.from_city || fromCode, terminal: 'Domestic Terminal' };
  const destinationInfo = AIRPORT_DIRECTORY[toCode] || { name: `${toCode} Airport`, city: flight.to_city || toCode, terminal: 'Domestic Terminal' };

  // 3. Format departure and arrival times
  const formatTimeStr = (tStr) => {
    if (!tStr) return '10:00 AM';
    if (typeof tStr === 'string' && tStr.includes(':') && tStr.length <= 8) return tStr;
    try {
      const d = new Date(tStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {}
    return String(tStr);
  };

  const departureTime = formatTimeStr(flight.departure?.scheduled || flight.departure);
  const arrivalTime = formatTimeStr(flight.arrival?.scheduled || flight.arrival);

  // 4. Passenger counts and pricing
  const effectiveAdults = isCraftMyTrip ? (memberCount || flightAdults || 1) : Number(flight.adults || flightAdults || 1);
  const adultsCount = effectiveAdults;
  const childrenCount = isCraftMyTrip ? 0 : Number(flight.children || flightChildren || 0);
  const infantsCount = isCraftMyTrip ? 0 : Number(flight.infants || flightInfants || 0);
  const totalPayingPassengers = Math.max(1, adultsCount + childrenCount);
  const _totalPassengers = adultsCount + childrenCount + infantsCount;

  const farePerPassenger = Math.round(Number(flight.price || 4500));
  const totalFare = farePerPassenger * totalPayingPassengers;
  const originalPerPax = Math.round(farePerPassenger * 1.18);

  const durationStr = flight.duration || '2h 15m';
  const cabinClassDisplay = String(flight.cabin_class || flightClass || 'Economy').toUpperCase();

  const handleProceedToBooking = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (onBook) {
      onBook({
        ...flight,
        type: 'flight',
        airline: airlineName,
        from: fromCode,
        to: toCode,
        departure: departureTime,
        arrival: arrivalTime,
        departureDate: travelDate,
        pickup_date: travelDate,
        drop_date: travelDate,
        duration: durationStr,
        price: farePerPassenger,
        total_amount: totalFare,
        cabin_class: cabinClassDisplay.toLowerCase(),
        adults: adultsCount,
        children: childrenCount,
        infants: infantsCount
      });
    }
  };

  return (
    <div className="flight-details-page animate-fade-in-up pb-5" style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ─── 1. TOP NAVIGATION BAR ─── */}
      <div className="bg-white border-bottom sticky-top shadow-xs px-4 py-3" style={{ zIndex: 1020 }}>
        <div className="container d-flex align-items-center justify-content-between">
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
              style={backLabel ? {} : { width: '40px', height: '40px' }}
              title={backLabel || "Return to Flights Search"}
            >
              <ArrowLeft size={16} className="text-dark" />
              {backLabel && <span>{backLabel.replace(/^←\s*/, '')}</span>}
            </button>
            <div>
              {breadcrumbPrefix && (
                <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
                  {breadcrumbPrefix} &gt; {fromCode} → {toCode} &gt; {airlineName}
                </div>
              )}
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-5">{airlineName}</span>
                <span className="badge bg-light text-secondary border px-2 py-0.5 text-xxs font-monospace">
                  {flightCode}
                </span>
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-0.5 rounded-pill text-xxs fw-bold">
                  {cabinClassDisplay}
                </span>
                {isSelected && (
                  <span className="badge bg-success text-white rounded-pill px-2.5 py-0.5 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                    <Check size={11} /> Selected Flight
                  </span>
                )}
              </div>
              <div className="text-muted text-xs d-flex align-items-center gap-2 mt-0.5">
                <span>{fromCode} ({originInfo.city})</span>
                <ChevronRight size={12} />
                <span>{toCode} ({destinationInfo.city})</span>
                <span>•</span>
                <Calendar size={12} className="text-primary me-0.5" />
                <span>{formatDisplayDate(travelDate)}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="d-none d-md-flex align-items-center gap-3">
              <div className="text-end">
                <span className="text-muted text-xxs d-block">
                  {isCraftMyTrip ? `Total (${totalPayingPassengers} pax)` : 'Starting from'}
                </span>
                <span className="fw-black text-primary fs-5">
                  ₹{(isCraftMyTrip ? totalFare : farePerPassenger).toLocaleString('en-IN')}
                </span>
                {!isCraftMyTrip && <span className="text-muted text-xxs"> / pax</span>}
              </div>
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
                style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
              >
                <span>{actionLabel || (isCraftMyTrip ? (isSelected ? 'Continue to Review' : 'Select & Continue') : 'Book Flight')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
            {isCraftMyTrip && (
              <button 
                type="button"
                onClick={() => {
                  if (document.activeElement?.blur) document.activeElement.blur();
                  onBack();
                }}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN DETAILS CONTENT ─── */}
      <div className="container py-4">
        <div className="row g-4 text-start">
          
          {/* Left Column: Comprehensive Flight Schedule & Inclusions */}
          <div className="col-12 col-lg-8">
            
            {/* CARD 1: Flight Itinerary Banner & Live Visual Timeline */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
              <div className="bg-light p-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={airlineLogo} 
                    alt={airlineName} 
                    className="rounded-3 bg-white border p-1" 
                    style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = defaultFlightLogo; }}
                  />
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{airlineName}</h5>
                    <span className="text-muted text-xs">Aircraft Schedule ID: <strong className="text-dark font-monospace">{flightCode}</strong></span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${isNonStop ? 'bg-success' : 'bg-info'} bg-opacity-10 text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold`}>
                    {isNonStop ? '✓ Direct / Non-Stop' : stops}
                  </span>
                  <span className="badge bg-light text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill text-xs fw-bold">
                    ✓ Refundable Flight
                  </span>
                </div>
              </div>

              {/* Graphical Flight Sector Timeline */}
              <div className="p-4 p-md-5">
                <div className="row align-items-center text-center text-md-start g-3">
                  
                  {/* Origin */}
                  <div className="col-12 col-md-4 text-md-start text-center">
                    <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs font-monospace mb-2">
                      DEPARTURE
                    </span>
                    <h2 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '2.2rem' }}>
                      {departureTime}
                    </h2>
                    <div className="fw-bold text-dark fs-5">{fromCode}</div>
                    <div className="text-muted text-xs fw-semibold">{originInfo.city}</div>
                    <div className="text-muted text-xxs mt-1 text-truncate" title={originInfo.name}>{originInfo.name}</div>
                    <div className="text-muted text-xxs mt-0.5 text-primary fw-bold">{originInfo.terminal}</div>
                    <div className="small fw-bold text-secondary mt-2">
                      <Calendar size={13} className="d-inline me-1 text-primary" />
                      {formatDisplayDate(travelDate)}
                    </div>
                  </div>

                  {/* Flight Mid-Segment Visual */}
                  <div className="col-12 col-md-4 text-center my-2 my-md-0">
                    <span className="text-muted text-xs fw-bold d-block mb-1">
                      <Clock size={13} className="d-inline me-1 text-muted" />
                      {durationStr}
                    </span>
                    <div className="position-relative py-2 w-100 px-3">
                      <div className="border-top border-2 border-secondary position-relative w-100" style={{ borderStyle: 'dashed' }}>
                        <div className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-primary">
                          <Plane size={22} style={{ transform: 'rotate(90deg)' }} />
                        </div>
                      </div>
                    </div>
                    <span className="badge bg-light text-muted border px-2.5 py-1 text-xxs mt-1">
                      {stops}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="col-12 col-md-4 text-md-end text-center">
                    <span className="badge bg-light text-dark border px-2.5 py-1 text-xxs font-monospace mb-2">
                      ARRIVAL
                    </span>
                    <h2 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '2.2rem' }}>
                      {arrivalTime}
                    </h2>
                    <div className="fw-bold text-dark fs-5">{toCode}</div>
                    <div className="text-muted text-xs fw-semibold">{destinationInfo.city}</div>
                    <div className="text-muted text-xxs mt-1 text-truncate" title={destinationInfo.name}>{destinationInfo.name}</div>
                    <div className="text-muted text-xxs mt-0.5 text-primary fw-bold">{destinationInfo.terminal}</div>
                    <div className="small fw-bold text-secondary mt-2">
                      <Calendar size={13} className="d-inline me-1 text-primary" />
                      {formatDisplayDate(travelDate)}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sector Notice Bar */}
              <div className="bg-light bg-opacity-70 px-4 py-2.5 border-top d-flex align-items-center gap-2 text-xs text-muted">
                <Info size={14} className="text-primary flex-shrink-0" />
                <span>Flight schedules operate on local Indian Standard Time (IST). Terminal assignments are subject to change by airport authority.</span>
              </div>
            </div>

            {/* CARD 2: Baggage Policy & Fare Rules */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 p-4 bg-white">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Luggage size={18} className="text-primary" />
                <span>Baggage Policy &amp; Fare Allowances</span>
              </h6>

              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 rounded-circle bg-white text-primary shadow-xs">
                        <Luggage size={16} />
                      </div>
                      <div>
                        <strong className="text-dark d-block text-sm">Cabin Baggage</strong>
                        <span className="text-success text-xs fw-bold">7 Kg Included / Adult</span>
                      </div>
                    </div>
                    <p className="text-muted text-xs mb-0">
                      1 piece of cabin baggage (e.g. laptop bag, trolley or handbag) up to 7 kg fitting the overhead bin.
                    </p>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 rounded-circle bg-white text-primary shadow-xs">
                        <Luggage size={16} />
                      </div>
                      <div>
                        <strong className="text-dark d-block text-sm">Check-in Baggage</strong>
                        <span className="text-success text-xs fw-bold">15 Kg Included / Adult</span>
                      </div>
                    </div>
                    <p className="text-muted text-xs mb-0">
                      1 piece of checked baggage per passenger up to 15 kg. Additional weight can be added during airline web check-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Passenger Guidelines & Airport Requirements */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 p-4 bg-white">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                <span>Important Travel &amp; Check-In Guidelines</span>
              </h6>

              <div className="d-flex flex-column gap-3 text-xs text-muted">
                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-dark d-block">Mandatory Government Photo ID:</strong>
                    All passengers must present an original valid government photo ID (Aadhaar Card, Driving Licence, Passport, or Voter ID) at airport entry.
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-dark d-block">Web Check-in Required:</strong>
                    Web check-in opens 48 hours prior to scheduled departure. Boarding pass and baggage tags can be generated online directly with the airline.
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-dark d-block">Airport Reporting Time:</strong>
                    Domestic flight counters close 60 minutes before departure. Arriving at least 2 hours prior to scheduled flight time is recommended.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Fare Breakdown & Booking Summary */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top bg-white" style={{ top: '90px' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-warning bg-opacity-15 text-dark fw-bold px-2.5 py-1 text-xxs rounded-pill">
                  ⚡ Best Live Airline Rate
                </span>
                <span className="text-success text-xxs fw-bold">✓ Instant Booking</span>
              </div>

              {/* Price Banner */}
              <div className="text-center py-3.5 mb-3 bg-light rounded-4 border">
                <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Fare Per Passenger</span>
                <div className="d-flex align-items-baseline justify-content-center gap-1.5">
                  <span className="text-decoration-line-through text-muted small">₹{originalPerPax.toLocaleString('en-IN')}</span>
                  <h2 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '32px' }}>₹{farePerPassenger.toLocaleString('en-IN')}</h2>
                  <span className="text-muted text-xs">/ pax</span>
                </div>
                <span className="badge bg-success bg-opacity-10 text-success text-xxs mt-1">Inclusive of GST &amp; Airport Surcharges</span>
              </div>

              {/* Flight Summary Box */}
              <div className="p-3 bg-light rounded-3 mb-3 border text-xs">
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Airline:</span>
                  <strong className="text-dark">{airlineName}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Sector:</span>
                  <strong className="text-dark">{fromCode} → {toCode}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Travel Date:</span>
                  <strong className="text-dark">{formatDisplayDate(travelDate)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Class:</span>
                  <strong className="text-dark text-capitalize">{cabinClassDisplay}</strong>
                </div>
                <div className="d-flex justify-content-between pt-1.5 border-top">
                  <span className="text-muted">Travellers:</span>
                  <strong className="text-primary">{adultsCount} Adult{adultsCount > 1 ? 's' : ''}{childrenCount > 0 ? `, ${childrenCount} Child` : ''}{infantsCount > 0 ? `, ${infantsCount} Infant` : ''}</strong>
                </div>
              </div>

              {/* Fare Breakdown Details */}
              <div className="d-flex flex-column gap-2 mb-4 text-xs">
                <div className="d-flex justify-content-between text-muted">
                  <span>Base Airfare ({totalPayingPassengers} pax × ₹{farePerPassenger.toLocaleString('en-IN')})</span>
                  <span className="fw-semibold text-dark">₹{totalFare.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Aviation Taxes &amp; Passenger Service Fee</span>
                  <span className="text-success fw-semibold">INCLUDED</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Cabin (7kg) &amp; Check-in (15kg) Baggage</span>
                  <span className="text-success fw-semibold">INCLUDED</span>
                </div>

                {isCraftMyTrip ? (
                  <>
                    <div className="text-muted text-xxs">+ Taxes &amp; fees calculated at checkout</div>
                    <hr className="my-1 border-secondary border-opacity-25" />
                    <div className="d-flex justify-content-between align-items-baseline">
                      <div>
                        <span className="fw-bold text-dark fs-6 d-block">Flight Total</span>
                        <span className="text-muted text-xxs">For {totalPayingPassengers} traveller{totalPayingPassengers > 1 ? 's' : ''}</span>
                      </div>
                      <span className="fw-black text-primary fs-4">₹{totalFare.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <hr className="my-1 border-secondary border-opacity-25" />
                    <div className="d-flex justify-content-between align-items-baseline">
                      <div>
                        <span className="fw-bold text-dark fs-6 d-block">Total Payable</span>
                        <span className="text-muted text-xxs">All taxes &amp; fees included</span>
                      </div>
                      <span className="fw-black text-primary fs-4">₹{totalFare.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action: Book Flight */}
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-scale font-heading"
                style={{ background: '#FF6333', borderColor: '#FF6333', padding: '12px 20px', fontSize: '15px' }}
              >
                <span>{actionLabel || (isCraftMyTrip ? (isSelected ? 'Continue to Review' : 'Select & Continue') : 'Book Flight')}</span>
                <ChevronRight size={18} />
              </button>

              <div className="text-center mt-3 text-muted text-xxs">
                🔒 Safe &amp; Secure Booking • Instant E-Ticket Confirmation via WhatsApp/Email
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─── 4. MOBILE STICKY BOTTOM BAR ─── */}
      <div 
        className="d-lg-none fixed-bottom bg-white border-top px-4 py-3 shadow-lg d-flex justify-content-between align-items-center"
        style={{ zIndex: 1010 }}
      >
        <div>
          <span className="text-muted text-xxs d-block">
            {isCraftMyTrip ? `Total (${totalPayingPassengers} ${totalPayingPassengers === 1 ? 'traveller' : 'travellers'})` : 'Total Payable'}
          </span>
          <div className="fw-black font-heading fs-5 mb-0" style={{ color: '#FF6333' }}>
            ₹{totalFare.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleProceedToBooking}
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
        >
          <span>{actionLabel || (isCraftMyTrip ? (isSelected ? 'Continue to Review' : 'Select & Continue') : 'Book Flight')}</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
