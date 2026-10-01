import React, { useState, useEffect } from 'react';
import { Send, Upload, MapPin, Calendar, Users, DollarSign, Hotel, Utensils, Plane, Train, Car, Bike, Info, CheckCircle2, User, Compass, AlertCircle, Loader2, CalendarDays, Sparkles, X } from 'lucide-react';
import * as api from '../../services/api';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';
import InternationalPhoneInput from '../../components/common/InternationalPhoneInput';

export default function CustomTripEnquiryPage({ setActiveTab, currentUser, prefilledPackage, onClearPrefilledPackage }) {
  const [formData, setFormData] = useState({
    customer_name: currentUser?.name || currentUser?.username || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    whatsapp: currentUser?.phone || '',
    departure_city: '',
    destinations: '',
    travel_dates: '',
    flexible_dates: false,
    adults: 2,
    children: 0,
    infants: 0,
    budget_range: '',
    hotel_category: '',
    room_type: '',
    meal_pref: '',
    req_flight: false,
    req_train: false,
    req_car: false,
    req_bike: false,
    req_airport_pickup: false,
    req_sightseeing: false,
    req_adventure: false,
    trip_type: 'Family',
    special_requests: ''
  });
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const [enquiryId, setEnquiryId] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const today = getTodayDateStr();

  const updateTravelDatesString = (start, end, flexible) => {
    let result = '';
    if (start && end) {
      result = `${formatDisplayDate(start)} to ${formatDisplayDate(end)}`;
      if (flexible) result += ' (Flexible)';
    } else if (start) {
      result = `From ${formatDisplayDate(start)}`;
      if (flexible) result += ' (Flexible)';
    } else if (flexible) {
      result = 'Flexible dates';
    }
    setFormData(prev => ({
      ...prev,
      travel_dates: result,
      flexible_dates: flexible
    }));
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    let newEnd = endDate;
    if (endDate && endDate < val) {
      newEnd = val;
      setEndDate(newEnd);
    }
    updateTravelDatesString(val, newEnd, formData.flexible_dates);
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    updateTravelDatesString(startDate, val, formData.flexible_dates);
  };

  const handleFlexibleToggle = (checked) => {
    setFormData(prev => ({ ...prev, flexible_dates: checked }));
    updateTravelDatesString(startDate, endDate, checked);
  };

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        customer_name: prev.customer_name || currentUser.name || currentUser.username || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || '',
        whatsapp: prev.whatsapp || currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (prefilledPackage) {
      const dest = prefilledPackage.destinations || prefilledPackage.destination || prefilledPackage.places_included || 'Goa';
      const pkgName = prefilledPackage.name || prefilledPackage.package_name || 'Trip Package';
      const duration = prefilledPackage.duration ? ` (${prefilledPackage.duration})` : '';
      const priceStr = prefilledPackage.price ? ` — Starting ₹${Number(prefilledPackage.price).toLocaleString('en-IN')}/person` : '';
      
      setFormData(prev => ({
        ...prev,
        destinations: prev.destinations || dest,
        budget_range: prev.budget_range || (prefilledPackage.price ? `₹${Number(prefilledPackage.price).toLocaleString('en-IN')}` : ''),
        hotel_category: prev.hotel_category || (prefilledPackage.hotel_included ? '4-Star' : ''),
        req_car: prev.req_car || Boolean(prefilledPackage.car_included || prefilledPackage.self_drive_included),
        req_flight: prev.req_flight || Boolean(prefilledPackage.flights_included || prefilledPackage.price_with_flight),
        req_sightseeing: prev.req_sightseeing || Boolean(prefilledPackage.places_included),
        special_requests: prev.special_requests || `Inquiring about package: "${pkgName}"${duration}${priceStr}. Please provide availability and customized quote.`
      }));

      if (prefilledPackage.departureDate) {
        setStartDate(prefilledPackage.departureDate);
        if (prefilledPackage.returnDate) {
          setEndDate(prefilledPackage.returnDate);
          updateTravelDatesString(prefilledPackage.departureDate, prefilledPackage.returnDate, false);
        } else {
          updateTravelDatesString(prefilledPackage.departureDate, '', false);
        }
      }
    }
  }, [prefilledPackage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationError('');
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await api.uploadImage(file);
      setDocuments(prev => [...prev, { name: file.name, url }]);
    } catch (err) {
      alert('Failed to upload document. Please try again.');
    }
  };

  const validateForm = () => {
    if (!formData.customer_name.trim() || formData.customer_name.trim().length < 2) {
      return 'Please enter your full name (at least 2 characters).';
    }
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (formData.whatsapp) {
      const cleanWa = formData.whatsapp.replace(/[^0-9]/g, '');
      if (cleanWa.length < 10) {
        return 'Please enter a valid 10-digit WhatsApp number or leave it blank.';
      }
    }
    if (!formData.destinations.trim()) {
      return 'Please enter your preferred destination(s).';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const error = validateForm();
    if (error) {
      setValidationError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        customer_name: formData.customer_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        whatsapp: (formData.whatsapp || formData.phone).trim(),
        flexible_dates: formData.flexible_dates ? 1 : 0,
        req_flight: formData.req_flight ? 1 : 0,
        req_train: formData.req_train ? 1 : 0,
        req_car: formData.req_car ? 1 : 0,
        req_bike: formData.req_bike ? 1 : 0,
        req_airport_pickup: formData.req_airport_pickup ? 1 : 0,
        req_sightseeing: formData.req_sightseeing ? 1 : 0,
        req_adventure: formData.req_adventure ? 1 : 0,
        documents_json: documents,
        action: 'save_custom_enquiry'
      };
      const res = await api.makeApiCall('/api.php', { method: 'POST', body: JSON.stringify(payload) });
      if (res && res.success) {
        setEnquiryId(res.enquiry_id || 'ENQ-CONFIRMED');
        setSuccess(true);
      } else {
        throw new Error(res?.error || res?.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      setValidationError(err.message || 'Something went wrong while submitting your enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container py-5 text-center min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <CheckCircle2 size={80} className="text-success mb-4" />
        <h2 className="fw-bold mb-3">Enquiry Submitted Successfully!</h2>
        <p className="text-muted fs-5 mb-4" style={{ maxWidth: '560px' }}>
          Your custom enquiry has been submitted successfully. Our team will review your requirements and contact you shortly.
        </p>
        <div className="bg-light p-4 rounded-4 border shadow-sm d-inline-block mb-4 text-center" style={{ minWidth: '320px' }}>
          <p className="mb-1 text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '1px' }}>Enquiry Reference ID</p>
          <h3 className="fw-bold text-primary mb-2">{enquiryId}</h3>
          <div className="text-muted small">
            <span>Primary Contact: <strong>{formData.phone}</strong></span>
            {formData.email && <span className="ms-2">| <strong>{formData.email}</strong></span>}
          </div>
        </div>
        <div className="d-flex gap-3 flex-wrap justify-content-center">
          <button className="btn btn-outline-primary px-4 py-2.5 rounded-pill fw-bold" onClick={() => setActiveTab('packages')}>
            Explore Packages
          </button>
          <button className="btn btn-primary px-4 py-2.5 rounded-pill fw-bold shadow-sm" onClick={() => {
            setSuccess(false);
            setEnquiryId('');
            setFormData(prev => ({
              ...prev,
              destinations: '',
              travel_dates: '',
              special_requests: ''
            }));
          }}>
            Submit Another Enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <h1 className="fw-black display-5 text-dark mb-3">Design Your Dream Trip</h1>
            <p className="text-muted fs-5">Tell us what you're looking for, and we'll craft the perfect itinerary just for you.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light">
            {validationError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4 py-2.5 px-3" role="alert">
                <AlertCircle size={18} className="text-danger flex-shrink-0" />
                <span className="small fw-semibold">{validationError}</span>
              </div>
            )}
            
            {/* Contextual Package Enquiry Banner */}
            {prefilledPackage && (
              <div className="alert alert-info border-0 rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between shadow-xs" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <div className="d-flex align-items-center gap-2.5">
                  <Sparkles size={20} className="text-primary flex-shrink-0" />
                  <div>
                    <span className="fw-bold d-block" style={{ fontSize: '0.9rem' }}>
                      Enquiry For Package: {prefilledPackage.name || prefilledPackage.package_name}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {prefilledPackage.duration && <span className="me-2">⏱ {prefilledPackage.duration}</span>}
                      {prefilledPackage.price && <span className="me-2">💰 Starting ₹{Number(prefilledPackage.price).toLocaleString('en-IN')}/person</span>}
                      {prefilledPackage.departureDate && <span>📅 Departure: {formatDisplayDate(prefilledPackage.departureDate)}</span>}
                    </span>
                  </div>
                </div>
                {onClearPrefilledPackage && (
                  <button 
                    type="button" 
                    onClick={onClearPrefilledPackage}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                    style={{ fontSize: '0.72rem' }}
                    title="Clear package pre-fill"
                  >
                    <X size={12} className="me-1" /> Clear
                  </button>
                )}
              </div>
            )}
            
            {/* Section 1: Contact Details */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><User size={24} className="me-2"/> Contact Information</h4>
            <div className="row g-4 mb-5">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name *</label>
                <input type="text" className="form-control bg-light border-0 py-2" name="customer_name" required value={formData.customer_name} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <InternationalPhoneInput 
                  value={formData.phone} 
                  onChange={(val) => {
                    const s = val ? String(val) : '';
                    setFormData(prev => ({ ...prev, phone: s, whatsapp: prev.whatsapp || s }));
                  }} 
                  label="Mobile Number" 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email Address</label>
                <input type="email" className="form-control bg-light border-0 py-2" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">WhatsApp Number</label>
                <input type="tel" className="form-control bg-light border-0 py-2" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
              </div>
            </div>

            {/* Section 2: Trip Basics */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><MapPin size={24} className="me-2"/> Trip Basics</h4>
            <div className="row g-4 mb-5">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Departure City</label>
                <input type="text" className="form-control bg-light border-0 py-2" name="departure_city" value={formData.departure_city} onChange={handleChange} placeholder="e.g. Mumbai" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Destination(s) *</label>
                <input type="text" className="form-control bg-light border-0 py-2" name="destinations" required value={formData.destinations} onChange={handleChange} placeholder="e.g. North Goa, South Goa" />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Departure Date</label>
                <input 
                  type="date" 
                  className="form-control bg-light border-0 py-2" 
                  min={today}
                  value={startDate} 
                  onChange={(e) => handleStartDateChange(e.target.value)} 
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Return Date</label>
                <input 
                  type="date" 
                  className="form-control bg-light border-0 py-2" 
                  min={startDate || today}
                  value={endDate} 
                  onChange={(e) => handleEndDateChange(e.target.value)} 
                />
              </div>
              <div className="col-md-6 d-flex align-items-center mt-auto">
                <div className="form-check form-switch fs-5">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="flexDates" 
                    name="flexible_dates" 
                    checked={formData.flexible_dates} 
                    onChange={(e) => handleFlexibleToggle(e.target.checked)} 
                  />
                  <label className="form-check-label fs-6 fw-semibold text-muted ms-2" htmlFor="flexDates">My dates are flexible</label>
                </div>
              </div>
            </div>

            {/* Section 3: Travellers & Budget */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><Users size={24} className="me-2"/> Travellers & Budget</h4>
            <div className="row g-4 mb-5">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Adults</label>
                <input type="number" min="1" className="form-control bg-light border-0 py-2" name="adults" value={formData.adults} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Children (2-12)</label>
                <input type="number" min="0" className="form-control bg-light border-0 py-2" name="children" value={formData.children} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Infants (0-2)</label>
                <input type="number" min="0" className="form-control bg-light border-0 py-2" name="infants" value={formData.infants} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Trip Type</label>
                <select className="form-select bg-light border-0 py-2" name="trip_type" value={formData.trip_type} onChange={handleChange}>
                  <option value="Family">Family</option>
                  <option value="Honeymoon">Honeymoon</option>
                  <option value="Friends/Group">Friends / Group</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Solo">Solo</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold"><DollarSign size={16} className="mb-1"/> Overall Budget Range (per person)</label>
                <select className="form-select bg-light border-0 py-2" name="budget_range" value={formData.budget_range} onChange={handleChange}>
                  <option value="">Select Budget</option>
                  <option value="Below ₹10,000">Below ₹10,000</option>
                  <option value="₹10,000 - ₹20,000">₹10,000 - ₹20,000</option>
                  <option value="₹20,000 - ₹40,000">₹20,000 - ₹40,000</option>
                  <option value="₹40,000 - ₹80,000">₹40,000 - ₹80,000</option>
                  <option value="Above ₹80,000">Above ₹80,000</option>
                </select>
              </div>
            </div>

            {/* Section 4: Accommodation & Meals */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><Hotel size={24} className="me-2"/> Accommodation & Meals</h4>
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Hotel Category</label>
                <select className="form-select bg-light border-0 py-2" name="hotel_category" value={formData.hotel_category} onChange={handleChange}>
                  <option value="">Any</option>
                  <option value="3 Star">3 Star (Standard)</option>
                  <option value="4 Star">4 Star (Premium)</option>
                  <option value="5 Star">5 Star (Luxury)</option>
                  <option value="Boutique">Boutique / Villa</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Room Type</label>
                <select className="form-select bg-light border-0 py-2" name="room_type" value={formData.room_type} onChange={handleChange}>
                  <option value="">Any</option>
                  <option value="Standard Room">Standard Room</option>
                  <option value="Sea View Room">Sea View Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Private Villa">Private Villa</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Meal Preference</label>
                <select className="form-select bg-light border-0 py-2" name="meal_pref" value={formData.meal_pref} onChange={handleChange}>
                  <option value="">Any</option>
                  <option value="EP (Room Only)">EP (Room Only)</option>
                  <option value="CP (Breakfast Only)">CP (Breakfast Only)</option>
                  <option value="MAP (Breakfast + Dinner)">MAP (Breakfast + Dinner)</option>
                  <option value="AP (All Meals)">AP (All Meals)</option>
                </select>
              </div>
            </div>

            {/* Section 5: Add-ons & Requirements */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><Plane size={24} className="me-2"/> Transport & Activities</h4>
            <div className="row g-3 mb-5">
              {[
                { name: 'req_flight', label: 'Flights', icon: <Plane size={18}/> },
                { name: 'req_train', label: 'Trains', icon: <Train size={18}/> },
                { name: 'req_car', label: 'Self Drive Car', icon: <Car size={18}/> },
                { name: 'req_bike', label: 'Self Drive Bike', icon: <Bike size={18}/> },
                { name: 'req_airport_pickup', label: 'Airport Pickup/Drop', icon: <MapPin size={18}/> },
                { name: 'req_sightseeing', label: 'Guided Sightseeing', icon: <Compass size={18}/> },
                { name: 'req_adventure', label: 'Adventure Activities', icon: <Activity size={18}/> }
              ].map(item => (
                <div key={item.name} className="col-md-4 col-sm-6">
                  <div className={`p-3 rounded-3 border cursor-pointer transition-all ${formData[item.name] ? 'bg-primary bg-opacity-10 border-primary text-primary fw-bold' : 'bg-light border-light text-muted'}`}
                       onClick={() => setFormData(prev => ({...prev, [item.name]: !prev[item.name]}))}>
                    <div className="d-flex align-items-center gap-2">
                      {item.icon} {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 6: Special Requests & Documents */}
            <h4 className="fw-bold mb-4 border-bottom pb-2 text-primary"><Info size={24} className="me-2"/> Additional Details</h4>
            <div className="row g-4 mb-4">
              <div className="col-12">
                <label className="form-label fw-semibold">Special Requests / Specific Itinerary Ideas</label>
                <textarea className="form-control bg-light border-0 py-3" name="special_requests" rows="4" value={formData.special_requests} onChange={handleChange} placeholder="Tell us about any specific places you want to visit, dietary requirements, celebrations, or anything else..."></textarea>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold d-flex align-items-center gap-2">Upload References (Optional) <Upload size={16}/></label>
                <input type="file" className="form-control bg-light border-0 py-2" accept="image/*,.pdf" onChange={handleFileUpload} />
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {documents.map((doc, idx) => (
                    <span key={idx} className="badge bg-secondary">{doc.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-top mt-5">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold w-100 shadow-sm d-flex align-items-center justify-content-center mx-auto" 
                style={{ maxWidth: '400px', background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting Enquiry...
                  </>
                ) : (
                  <>
                    Submit Custom Enquiry <Send size={18} className="ms-2"/>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const Activity = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
