import React from 'react';
import { ArrowLeft, Users, User, Mail, Phone, ShieldCheck, Calendar, Hotel, Car, Plane, Compass, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import InternationalPhoneInput from '../../components/common/InternationalPhoneInput';

export default function PackageCheckoutStep2({
  pkg,
  departureDate,
  returnDate,
  travellers,
  setTravellers,
  numAdults,
  setNumAdults,
  numChildren,
  setNumChildren,
  numInfants = 0,
  setNumInfants = () => {},
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  isSelfDrivePackage,
  drivingLicense,
  setDrivingLicense,
  vehiclePickupLoc,
  setVehiclePickupLoc,
  vehicleDropLoc,
  setVehicleDropLoc,
  totalPrice = 0,
  basePrice = 0,
  advancePercentage = 25,
  advanceAmount = 0,
  customizations = {},
  selectedVehicle = null,
  cabType = 'company',
  withFlight = false,
  nights = 0,
  days = 1,
  onBack,
  onProceed
}) {
  const updateTravellerCount = (type, increment) => {
    if (type === 'adults') {
      const newCount = numAdults + increment;
      if (newCount < 1 || newCount > 6) return;
      setNumAdults(newCount);
      adjustTravellersArray(newCount, numChildren);
    } else if (type === 'children') {
      const newCount = numChildren + increment;
      if (newCount < 0 || newCount > 4) return;
      setNumChildren(newCount);
      adjustTravellersArray(numAdults, newCount);
    } else if (type === 'infants') {
      const newCount = (numInfants || 0) + increment;
      if (newCount < 0 || newCount > 3) return;
      if (setNumInfants) setNumInfants(newCount);
    }
  };

  const adjustTravellersArray = (adults, children) => {
    const total = adults + children;
    let newTravellers = [...travellers];
    
    if (newTravellers.length < total) {
      while (newTravellers.length < total) {
        const isAdult = newTravellers.length < adults;
        newTravellers.push({
          type: isAdult ? 'Adult' : 'Child',
          firstName: '',
          lastName: '',
          gender: '',
          age: '',
          idType: 'Aadhaar'
        });
      }
    } else if (newTravellers.length > total) {
      newTravellers = newTravellers.slice(0, total);
    }
    
    for (let i = 0; i < newTravellers.length; i++) {
      newTravellers[i].type = i < adults ? 'Adult' : 'Child';
    }
    
    setTravellers(newTravellers);
  };

  const handleTravellerChange = (index, field, value) => {
    const updated = [...travellers];
    updated[index][field] = value;
    setTravellers(updated);
  };

  const handleProceedClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const lead = travellers[0];
    if (!lead || !lead.firstName?.trim() || !lead.lastName?.trim()) {
      alert("Please enter First and Last Name for Lead Traveller.");
      return;
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      alert("Please enter a valid email address to receive your trip voucher.");
      return;
    }
    if (!contactPhone || contactPhone.trim().length < 10) {
      alert("Please enter a valid 10-digit mobile phone number for trip updates.");
      return;
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onProceed(e);
  };

  const remainingAmount = Math.max(0, totalPrice - advanceAmount);
  const durationDisplay = `${nights} Nights / ${days} Days`;
  const vehicleName = selectedVehicle?.name || pkg?.car_included || (isSelfDrivePackage ? 'Self Drive Vehicle' : 'Dedicated Private Cab');

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Symmetrical Back Navigation (Section 13) */}
      <button 
        type="button" 
        onClick={(e) => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          onBack(e);
        }} 
        className="btn btn-link text-dark text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold"
      >
        <ArrowLeft size={18} /> Back to Customization
      </button>

      <div className="row g-4 text-start">
        {/* Left Column: Traveller Forms (Section 7) */}
        <div className="col-lg-8">
          <div className="mb-4">
            <h2 className="fw-extrabold text-dark mb-1">Traveller Details</h2>
            <p className="text-muted small">Please enter guest details exactly as they appear on your government-issued ID.</p>
          </div>

          {/* Confirmed Trip & Travel Dates Summary Banner */}
          <div className="bg-white border rounded-3 p-3 mb-4 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ borderLeft: '4px solid #FF6333' }}>
            <div>
              <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Selected Package</span>
              <h5 className="fw-bold text-dark mb-0">{pkg?.name}</h5>
              <span className="text-muted small">{pkg?.duration || durationDisplay} • {pkg?.destination || 'Goa, India'}</span>
            </div>
            {(departureDate || returnDate) && (
              <div className="bg-light p-2.5 px-3 rounded-3 border text-start text-md-end">
                <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.65rem' }}>Travel Dates</span>
                <span className="fw-bold text-primary small d-flex align-items-center gap-1.5">
                  <Calendar size={14} className="text-danger" /> 
                  <span>{departureDate ? (formatDisplayDate ? formatDisplayDate(departureDate) : departureDate) : 'Flexible'}</span>
                  <span>→</span>
                  <span>{returnDate ? (formatDisplayDate ? formatDisplayDate(returnDate) : returnDate) : 'Flexible'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Manage Guests: Adults, Children, Infants */}
          <div className="bg-white border rounded shadow-sm mb-4">
             <div className="p-3 border-bottom bg-light">
                 <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><Users size={18}/> Manage Guests</h6>
             </div>
             <div className="p-4 d-flex flex-wrap gap-4">
                 <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{ minWidth: '180px', maxWidth: '240px' }}>
                     <span className="fw-bold small">Adults (12+ yrs)</span>
                     <div className="d-flex align-items-center border rounded">
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('adults', -1)}>-</button>
                         <span className="px-3 fw-bold small">{numAdults}</span>
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('adults', 1)}>+</button>
                     </div>
                 </div>
                 <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{ minWidth: '180px', maxWidth: '240px' }}>
                     <span className="fw-bold small">Children (2-11 yrs)</span>
                     <div className="d-flex align-items-center border rounded">
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('children', -1)}>-</button>
                         <span className="px-3 fw-bold small">{numChildren}</span>
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('children', 1)}>+</button>
                     </div>
                 </div>
                 <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{ minWidth: '180px', maxWidth: '240px' }}>
                     <span className="fw-bold small">Infants (&lt;2 yrs)</span>
                     <div className="d-flex align-items-center border rounded">
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('infants', -1)}>-</button>
                         <span className="px-3 fw-bold small">{numInfants}</span>
                         <button type="button" className="btn btn-sm btn-light px-2.5 fw-bold" onClick={() => updateTravellerCount('infants', 1)}>+</button>
                     </div>
                 </div>
             </div>
          </div>

          {/* Guest Forms */}
          {travellers.map((traveller, idx) => (
              <div key={idx} className="bg-white border rounded shadow-sm mb-4">
                  <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                     <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                         <User size={18} className="text-muted"/> {traveller.type} {idx + 1}
                     </h6>
                     {idx === 0 && <span className="badge bg-success bg-opacity-25 text-success">Lead Traveller</span>}
                  </div>
                  <div className="p-4">
                      <div className="row g-3">
                          <div className="col-md-2">
                             <label className="form-label small fw-bold text-secondary">Title *</label>
                             <select className="form-select" value={traveller.gender} onChange={(e) => handleTravellerChange(idx, 'gender', e.target.value)}>
                                 <option value="">Select</option>
                                 <option value="Mr">Mr</option>
                                 <option value="Ms">Ms</option>
                                 <option value="Mrs">Mrs</option>
                                 <option value="Mstr">Mstr (Child)</option>
                                 <option value="Miss">Miss (Child)</option>
                             </select>
                          </div>
                          <div className="col-md-5">
                             <label className="form-label small fw-bold text-secondary">First &amp; Middle Name *</label>
                             <input type="text" className="form-control" placeholder="e.g. John" value={traveller.firstName} onChange={(e) => handleTravellerChange(idx, 'firstName', e.target.value)} required />
                          </div>
                          <div className="col-md-5">
                             <label className="form-label small fw-bold text-secondary">Last Name *</label>
                             <input type="text" className="form-control" placeholder="e.g. Doe" value={traveller.lastName} onChange={(e) => handleTravellerChange(idx, 'lastName', e.target.value)} required />
                          </div>
                          <div className="col-md-4">
                             <label className="form-label small fw-bold text-secondary">Age *</label>
                             <input type="number" className="form-control" placeholder="e.g. 30" min={traveller.type === 'Adult' ? 12 : 2} max={traveller.type === 'Adult' ? 100 : 11} value={traveller.age} onChange={(e) => handleTravellerChange(idx, 'age', e.target.value)} />
                          </div>
                      </div>
                  </div>
              </div>
          ))}

          {/* Self-Drive Specific: Driving License & Locations (Retained strictly for self-drive, Section 7) */}
          {isSelfDrivePackage && (
            <div className="bg-white border rounded shadow-sm mb-4">
              <div className="p-3 border-bottom bg-light">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><ShieldCheck size={18}/> Driving License &amp; Vehicle Pickup</h6>
              </div>
              <div className="p-4 row g-3">
                  <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Upload Driving License</label>
                      <div className="d-flex align-items-center gap-2">
                        <input type="file" className="form-control" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setDrivingLicense(reader.result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                        {drivingLicense ? (
                          <span className="badge bg-warning text-dark border p-2">Uploaded</span>
                        ) : (
                          <span className="badge bg-secondary p-2">Optional Now</span>
                        )}
                      </div>
                      <small className="text-muted" style={{fontSize:'11px'}}>Required for self-drive vehicle handover. Can also verify on delivery.</small>
                  </div>
                  <div className="col-md-3">
                      <label className="form-label small fw-bold text-secondary">Pickup Location</label>
                      <input type="text" className="form-control" placeholder="e.g. Goa Airport" value={vehiclePickupLoc} onChange={(e) => setVehiclePickupLoc(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                      <label className="form-label small fw-bold text-secondary">Drop Location</label>
                      <input type="text" className="form-control" placeholder="e.g. Calangute" value={vehicleDropLoc} onChange={(e) => setVehicleDropLoc(e.target.value)} />
                  </div>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="bg-white border rounded shadow-sm mb-4">
             <div className="p-3 border-bottom bg-light">
                 <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><ShieldCheck size={18}/> Contact Details</h6>
             </div>
             <div className="p-4 row g-3">
                 <div className="col-md-6">
                     <label className="form-label small fw-bold text-secondary">Email Address *</label>
                     <div className="input-group">
                         <span className="input-group-text bg-white text-muted"><Mail size={16}/></span>
                         <input type="email" className="form-control" placeholder="john@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                     </div>
                     <small className="text-muted" style={{fontSize:'11px'}}>Your booking voucher will be sent here.</small>
                 </div>
                 <div className="col-md-6">
                     <label className="form-label small fw-bold text-secondary">Mobile Number *</label>
                     <InternationalPhoneInput value={contactPhone} onChange={val => setContactPhone(val ? String(val) : '')} required />
                     <small className="text-muted" style={{fontSize:'11px'}}>For trip updates and driver details.</small>
                 </div>
             </div>
          </div>

          {/* Primary Action Button (Section 12: Continue to Payment) */}
          <div className="d-flex justify-content-end mb-4">
              <button 
                type="button" 
                className="btn btn-primary btn-lg fw-bold px-5 rounded-pill shadow d-flex align-items-center gap-2" 
                onClick={handleProceedClick}
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }}
              >
                  <span>Continue to Payment</span>
                  <ChevronRight size={18} />
              </button>
          </div>
        </div>

        {/* Right Column: Visible Booking Summary (Section 8 Requirement) */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 position-sticky overflow-hidden" style={{ top: '20px' }}>
            <div className="p-3.5 bg-primary bg-opacity-10 border-bottom d-flex align-items-center justify-content-between">
              <span className="text-uppercase fw-bold text-primary small" style={{ fontSize: '12px', letterSpacing: '0.6px' }}>
                Booking Summary
              </span>
              <span className="badge bg-white text-primary border rounded-pill px-2.5 py-0.5 fw-bold" style={{ fontSize: '11px' }}>
                {durationDisplay}
              </span>
            </div>

            <div className="p-3.5 bg-white border-bottom">
              {/* Package & Destination */}
              <div className="mb-2.5 pb-2.5 border-bottom border-light">
                <div className="fw-bold text-dark" style={{ fontSize: '14.5px', lineHeight: '1.3' }}>{pkg?.name}</div>
                <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '12px' }}>
                  <Calendar size={13} className="text-danger flex-shrink-0" />
                  <span>Dates: {departureDate ? (formatDisplayDate ? formatDisplayDate(departureDate) : departureDate) : 'Flexible'} → {returnDate ? (formatDisplayDate ? formatDisplayDate(returnDate) : returnDate) : 'Flexible'}</span>
                </div>
              </div>

              {/* Travelers */}
              <div className="mb-2.5 pb-2.5 border-bottom border-light">
                <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
                  <div className="d-flex align-items-center gap-1.5 text-muted">
                    <Users size={13} className="text-secondary" />
                    <span>Travelers:</span>
                  </div>
                  <strong className="text-dark">
                    {numAdults} Adult{numAdults > 1 ? 's' : ''}{numChildren > 0 ? `, ${numChildren} Child${numChildren > 1 ? 'ren' : ''}` : ''}{numInfants > 0 ? `, ${numInfants} Infant${numInfants > 1 ? 's' : ''}` : ''}
                  </strong>
                </div>
              </div>

              {/* Hotel */}
              <div className="mb-2.5 pb-2.5 border-bottom border-light">
                <div className="d-flex align-items-start gap-2" style={{ fontSize: '12px' }}>
                  <Hotel size={14} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-dark">{pkg?.hotel_included || 'Luxury Resort Stay'}</strong>
                      <span className="badge bg-warning bg-opacity-25 text-dark fw-bold" style={{ fontSize: '10px' }}>
                        ⭐ {pkg?.hotel_category || pkg?.hotel?.category || '4 Star'}
                      </span>
                    </div>
                    <div className="text-muted text-xxs mt-0.5">
                      <span>{pkg?.room_type || 'Standard / Deluxe'}</span> • <span>{pkg?.food_included || 'Breakfast Included'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Driver */}
              <div className="mb-2.5 pb-2.5 border-bottom border-light">
                <div className="d-flex align-items-start gap-2" style={{ fontSize: '12px' }}>
                  <Car size={14} className="text-success flex-shrink-0 mt-0.5" />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-dark">{vehicleName}</strong>
                      <span className="badge bg-light text-dark border fw-bold" style={{ fontSize: '10px' }}>
                        {isSelfDrivePackage ? 'Self Drive' : 'Chauffeur'}
                      </span>
                    </div>
                    <div className="text-muted text-xxs mt-0.5">
                      {pkg?.driver_included || pkg?.driver?.included ? (
                        <span className="text-success fw-semibold">✓ Dedicated Driver Included</span>
                      ) : (
                        <span>Self-drive rental / driver on request</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight */}
              <div className="mb-2 pb-2">
                <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
                  <div className="d-flex align-items-center gap-1.5 text-muted">
                    <Plane size={13} className="text-primary" />
                    <span>Flight:</span>
                  </div>
                  <strong className={withFlight ? 'text-primary' : 'text-dark'}>
                    {withFlight ? '✓ Flights Included' : 'No Flights (Land Only)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pricing Summary (Existing Pricing, Section 8) */}
            <div className="p-3.5 bg-white">
              <div className="d-flex justify-content-between mb-1.5 small">
                <span className="text-muted">Total Package Cost:</span>
                <strong className="text-dark">₹{totalPrice.toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1.5 small">
                <span className="text-muted">Advance to Hold ({advancePercentage}%):</span>
                <strong className="text-success">₹{advanceAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2 small pt-1.5 border-top">
                <span className="text-muted">Remaining Balance:</span>
                <span className="fw-bold text-primary">₹{remainingAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-2.5 small mb-0 mt-3" style={{ fontSize: '11px' }}>
                <ShieldCheck size={15} className="text-success flex-shrink-0" />
                <span>Protected by TripGalileo Guarantee</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
