import React, { useState } from 'react';
import { 
  CheckCircle, 
  MapPin, 
  Hotel, 
  Car, 
  Compass, 
  Star, 
  Plus, 
  Check, 
  Trash2, 
  Send, 
  Mic, 
  User, 
  Edit3, 
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { 
  plannerLocations, 
  plannerStays, 
  plannerVehicles, 
  plannerExperiences, 
  plannerComparison 
} from '../../data/mockData';

export default function AIPlannerPage() {
  // Workflow step state (1 to 8)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selection states
  const [selectedLocation, setSelectedLocation] = useState(plannerLocations[0]); // Default North Goa
  const [selectedStay, setSelectedStay] = useState(plannerStays[0]); // Default Marbela Beach
  const [selectedVehicle, setSelectedVehicle] = useState(plannerVehicles[0]); // Default Hatchback
  const [selectedExperiences, setSelectedExperiences] = useState([plannerExperiences[0], plannerExperiences[1]]); // Default Cruise + Water sports
  const [activePackagePreset, setActivePackagePreset] = useState('ap-comp-1');

  // Checkout info
  const [kycName, setKycName] = useState('');
  const [kycPhone, setKycPhone] = useState('');
  const [kycLicense, setKycLicense] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Chat conversation log
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Welcome to Wow Goa Holidays. How would you like to plan your trip?", time: "10:30 AM" },
    { sender: 'user', text: "I'm looking for a 4-day North Goa trip for 2 adults with a hatchback.", time: "10:31 AM" },
    { sender: 'ai', text: "Great! I found 5 suitable options for your 4-day North Goa trip for 2 adults. Let's build your perfect holiday step by step.", time: "10:31 AM" }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Handle preset package selection
  const handleSelectPackage = (pkg) => {
    setActivePackagePreset(pkg.id);
    if (pkg.id === 'ap-comp-1') {
      setSelectedLocation(plannerLocations[0]);
      setSelectedStay(plannerStays[0]);
      setSelectedVehicle(plannerVehicles[0]);
      setSelectedExperiences([plannerExperiences[0], plannerExperiences[1]]);
    } else if (pkg.id === 'ap-comp-2') {
      setSelectedLocation(plannerLocations[0]);
      setSelectedStay(plannerStays[1]);
      setSelectedVehicle(plannerVehicles[0]);
      setSelectedExperiences([plannerExperiences[0], plannerExperiences[1], plannerExperiences[3]]);
    } else {
      setSelectedLocation(plannerLocations[0]);
      setSelectedStay(plannerStays[2]);
      setSelectedVehicle(plannerVehicles[1]);
      setSelectedExperiences([plannerExperiences[0], plannerExperiences[1], plannerExperiences[2], plannerExperiences[4]]);
    }
  };

  // Toggle Experience Selection
  const handleToggleExperience = (exp) => {
    if (selectedExperiences.some(item => item.id === exp.id)) {
      setSelectedExperiences(selectedExperiences.filter(item => item.id !== exp.id));
    } else {
      setSelectedExperiences([...selectedExperiences, exp]);
    }
  };

  // Send a custom chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: chatInput, time: timeNow };
    
    // Simple replies simulation
    let aiMsgText = "I have updated your holiday plan details. You can view the dynamic price changes in the summary pane.";
    if (chatInput.toLowerCase().includes('south')) {
      aiMsgText = "Understood. Switching your location preference to South Goa. Let's see some quiet stay choices.";
      setSelectedLocation(plannerLocations[1]);
    } else if (chatInput.toLowerCase().includes('bike')) {
      aiMsgText = "Selecting RE Himalayan Premium Bike as your self-drive ride choice.";
      setSelectedVehicle(plannerVehicles[2]);
    } else if (chatInput.toLowerCase().includes('scuba')) {
      aiMsgText = "Adding Scuba Diving experience package to your add-ons list.";
      if (!selectedExperiences.some(item => item.id === 'ap-exp-3')) {
        setSelectedExperiences([...selectedExperiences, plannerExperiences[2]]);
      }
    }

    const aiMsg = { sender: 'ai', text: aiMsgText, time: timeNow };
    setChatMessages([...chatMessages, userMsg, aiMsg]);
    setChatInput('');
  };

  // Calculate pricing breakdown
  const stayCost = selectedStay ? selectedStay.price * 3 : 0; // 3 nights
  const vehicleCost = selectedVehicle ? selectedVehicle.price * 4 : 0; // 4 days
  const experiencesCost = selectedExperiences.reduce((sum, item) => sum + item.price, 0) * 2; // for 2 adults
  
  const basePrice = 24999;
  const serviceCharge = 1499;
  const tax = Math.round((stayCost + vehicleCost + experiencesCost) * 0.12);
  const discount = 2600;
  const finalPrice = Math.round(stayCost + vehicleCost + experiencesCost + serviceCharge + tax - discount);
  const refundableDeposit = Math.round(finalPrice * 0.10);

  // Workflow validation helpers
  const getWorkflowCheck = (step) => {
    if (step === 1) return true; // Details checked
    if (step === 2) return selectedLocation !== null;
    if (step === 3) return selectedStay !== null;
    if (step === 4) return selectedVehicle !== null;
    if (step === 5) return selectedExperiences.length > 0;
    if (step === 6) return currentStep >= 6;
    if (step === 7) return kycName && kycPhone && kycLicense;
    return bookingConfirmed;
  };

  const handleNextStep = () => {
    if (currentStep === 6) {
      setCurrentStep(7);
    } else if (currentStep === 7) {
      if (!kycName || !kycPhone || !kycLicense) {
        alert("Please complete all KYC details before booking confirmation.");
        return;
      }
      setCurrentStep(8);
      setBookingConfirmed(true);
    }
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        
        {/* 1. LEFT PANEL: AI PLANNER WORKFLOW */}
        <div className="col-lg-3 col-md-4">
          <div className="bg-white rounded-4 shadow-sm p-3 border h-100">
            <h6 className="fw-extrabold text-uppercase text-secondary mb-4 border-bottom pb-2 small" style={{ letterSpacing: '1px' }}>
              AI Planner Workflow
            </h6>

            <div className="workflow-steps-list">
              {[
                { num: 1, label: "Travel Details", desc: "4 Days • 2 Adults" },
                { num: 2, label: "Goa Location", desc: selectedLocation ? selectedLocation.name : "Select Location" },
                { num: 3, label: "Stay Selection", desc: selectedStay ? selectedStay.name : "Select Stay" },
                { num: 4, label: "Vehicle Selection", desc: selectedVehicle ? selectedVehicle.name : "Select Vehicle" },
                { num: 5, label: "Activities", desc: `${selectedExperiences.length} Experiences Selected` },
                { num: 6, label: "Quote Summary", desc: "Review & Confirm" },
                { num: 7, label: "KYC Verification", desc: "Driving License Upload" },
                { num: 8, label: "Booking", desc: "Confirm & Pay" }
              ].map((step) => {
                const isCompleted = getWorkflowCheck(step.num);
                const isActive = currentStep === step.num;
                return (
                  <div 
                    key={step.num} 
                    className={`workflow-step-item mb-3 ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      if (step.num <= 6 || isCompleted) setCurrentStep(step.num);
                    }}
                  >
                    <div className="step-number-circle">
                      {isCompleted ? <Check size={14} className="text-white" /> : step.num}
                    </div>
                    <div className="step-text-container">
                      <div className="step-title fw-bold text-dark">{step.label}</div>
                      <div className="step-desc text-muted small">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Help prompt */}
            <div className="bg-light rounded-3 p-3 border mt-4 text-center">
              <span className="d-block fw-bold small text-primary mb-1">Need Help?</span>
              <p className="small text-muted mb-2">Our holiday planners are online to assist.</p>
              <a href="tel:+919876543210" className="btn btn-warning btn-sm text-white px-3 py-1.5 rounded-pill w-100 fw-bold">
                Chat with Expert
              </a>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE PANEL: INTERACTIVE BUILDER WORKSPACE */}
        <div className="col-lg-6 col-md-8">
          <div className="bg-white rounded-4 shadow-sm border p-4 h-100 d-flex flex-column justify-content-between">
            
            <div>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                <h4 className="fw-bold m-0 font-heading">Wow Goa AI Planner</h4>
                <span className="badge bg-success-light text-success fw-semibold border border-success px-2.5 py-1 rounded">
                  Plan your Goa holiday with AI
                </span>
              </div>

              {/* Chat Messages */}
              <div className="chat-conversation-box mb-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-bubble-container mb-3 ${msg.sender === 'user' ? 'user-side' : 'ai-side'}`}>
                    <div className="chat-avatar-wrapper">
                      {msg.sender === 'user' ? (
                        <div className="user-avatar-circle bg-secondary text-white"><User size={14} /></div>
                      ) : (
                        <div className="ai-avatar-circle bg-warning text-dark fw-bold">G</div>
                      )}
                    </div>
                    <div className="chat-bubble-payload">
                      <p className="m-0 small">{msg.text}</p>
                      <span className="chat-time-label">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat action starter choices */}
              {chatMessages.length === 1 && (
                <div className="d-flex gap-2 mb-4 justify-content-center">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5"
                    onClick={() => {
                      setChatMessages([...chatMessages, 
                        { sender: 'user', text: "Explore Ready Packages", time: "10:31 AM" },
                        { sender: 'ai', text: "Here are some of our popular ready-made packages. Select one or click 'Build My Goa Holiday' to customize.", time: "10:31 AM" }
                      ]);
                    }}
                  >
                    Explore Ready Packages
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-warning btn-sm rounded-pill px-3 py-1.5"
                    onClick={() => {
                      setChatMessages([...chatMessages, 
                        { sender: 'user', text: "Build My Goa Holiday", time: "10:31 AM" },
                        { sender: 'ai', text: "Awesome! Let's choose your locations, stay, self-drive vehicle, and experiences step-by-step.", time: "10:31 AM" }
                      ]);
                    }}
                  >
                    Build My Goa Holiday
                  </button>
                </div>
              )}

              {/* STEP INTERACTIVE CARDS SECTIONS */}
              {currentStep < 7 && !bookingConfirmed && (
                <div className="interactive-selections-container">
                  
                  {/* Location Selector */}
                  <div className="selection-group-block mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark fs-6">1. Recommended Goa Locations</span>
                      <span className="small text-primary cursor-pointer fw-semibold">View All</span>
                    </div>
                    <div className="row g-2">
                      {plannerLocations.map((loc) => {
                        const isSelected = selectedLocation?.id === loc.id;
                        return (
                          <div key={loc.id} className="col-4">
                            <div 
                              className={`card selection-item-card border p-2 cursor-pointer ${isSelected ? 'active border-primary' : ''}`}
                              onClick={() => {
                                setSelectedLocation(loc);
                                if (currentStep === 2) setCurrentStep(3);
                              }}
                            >
                              <img src={loc.image} alt={loc.name} className="img-fluid rounded mb-1 object-fit-cover" style={{ height: '50px', width: '100%' }} />
                              <span className="fw-bold d-block text-dark small-text-ellipsis">{loc.name}</span>
                              <span className="text-muted text-xs d-block">{loc.badge}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stay Selector */}
                  <div className="selection-group-block mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark fs-6">2. Stay Selection</span>
                      <span className="small text-primary cursor-pointer fw-semibold">View All Stays</span>
                    </div>
                    <div className="row g-2">
                      {plannerStays.map((stay) => {
                        const isSelected = selectedStay?.id === stay.id;
                        return (
                          <div key={stay.id} className="col-4">
                            <div 
                              className={`card selection-item-card border p-2 cursor-pointer ${isSelected ? 'active border-primary' : ''}`}
                              onClick={() => {
                                setSelectedStay(stay);
                                if (currentStep === 3) setCurrentStep(4);
                              }}
                            >
                              <img src={stay.image} alt={stay.name} className="img-fluid rounded mb-1 object-fit-cover" style={{ height: '50px', width: '100%' }} />
                              <span className="fw-bold d-block text-dark small-text-ellipsis">{stay.name}</span>
                              <div className="d-flex justify-content-between align-items-center text-xs mt-1">
                                <span className="text-warning fw-bold"><Star size={10} fill="currentColor" className="d-inline-block me-0.5" />{stay.rating}</span>
                                <span className="fw-bold text-primary">₹{stay.price}/n</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vehicle Selector */}
                  <div className="selection-group-block mb-4">
                    <span className="fw-bold text-dark fs-6 d-block mb-2">3. Vehicle Selection</span>
                    <div className="row g-2">
                      {plannerVehicles.map((veh) => {
                        const isSelected = selectedVehicle?.id === veh.id;
                        return (
                          <div key={veh.id} className="col-4">
                            <div 
                              className={`card selection-item-card border p-2 cursor-pointer ${isSelected ? 'active border-primary' : ''}`}
                              onClick={() => {
                                setSelectedVehicle(veh);
                                if (currentStep === 4) setCurrentStep(5);
                              }}
                            >
                              <img src={veh.image} alt={veh.name} className="img-fluid rounded mb-1 object-fit-cover" style={{ height: '50px', width: '100%' }} />
                              <span className="fw-bold d-block text-dark small">{veh.name}</span>
                              <span className="text-muted text-xs d-block">From ₹{veh.price}/day</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Experiences Selector */}
                  <div className="selection-group-block mb-4">
                    <span className="fw-bold text-dark fs-6 d-block mb-2">4. Experience Add-ons</span>
                    <div className="d-flex gap-2 overflow-auto pb-2 custom-horizontal-scroll">
                      {plannerExperiences.map((exp) => {
                        const isSelected = selectedExperiences.some(item => item.id === exp.id);
                        return (
                          <div 
                            key={exp.id} 
                            className={`card selection-item-card border p-2 cursor-pointer flex-shrink-0 ${isSelected ? 'active border-primary' : ''}`}
                            style={{ width: '120px' }}
                            onClick={() => {
                              handleToggleExperience(exp);
                              if (currentStep === 5) setCurrentStep(6);
                            }}
                          >
                            <img src={exp.image} alt={exp.name} className="img-fluid rounded mb-1 object-fit-cover" style={{ height: '40px', width: '100%' }} />
                            <span className="fw-bold d-block text-dark text-xs small-text-ellipsis">{exp.name}</span>
                            <span className="text-muted text-xs">₹{exp.price}/p</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Package Preset Comparisons */}
                  <div className="selection-group-block mb-4">
                    <span className="fw-bold text-dark fs-6 d-block mb-2">5. Package Comparison (AI Recommended)</span>
                    <div className="row g-2">
                      {plannerComparison.map((comp) => {
                        const isSelected = activePackagePreset === comp.id;
                        return (
                          <div key={comp.id} className="col-4">
                            <div 
                              className={`card selection-item-card border p-2 cursor-pointer text-start ${isSelected ? 'active border-primary' : ''}`}
                              onClick={() => handleSelectPackage(comp)}
                            >
                              <span className="badge bg-warning-light text-dark text-xs mb-1 align-self-start">{comp.badge}</span>
                              <span className="fw-extrabold d-block text-dark small-text-ellipsis">{comp.name}</span>
                              <span className="text-xs text-muted d-block">{comp.duration}</span>
                              <span className="fw-bold text-primary text-sm mt-1 d-block">₹{comp.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* Step 7: KYC Panel */}
              {currentStep === 7 && !bookingConfirmed && (
                <div className="kyc-panel border rounded-3 p-3 bg-light animate-fade-in text-start">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-1">
                    <AlertCircle className="text-warning" />
                    Complete Booking KYC Verification
                  </h5>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name (Matches ID)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Rohan Sharma"
                      value={kycName}
                      onChange={(e) => setKycName(e.target.value)} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Contact Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="e.g. +91 9876543210"
                      value={kycPhone}
                      onChange={(e) => setKycPhone(e.target.value)} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Driving License Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. DL-123456789"
                      value={kycLicense}
                      onChange={(e) => setKycLicense(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-warning w-100 text-white fw-bold py-2 rounded-pill mt-2"
                    onClick={handleNextStep}
                  >
                    Confirm & Proceed to Book
                  </button>
                </div>
              )}

              {/* Step 8: Success Panel */}
              {bookingConfirmed && (
                <div className="booking-success-panel text-center py-5 border rounded-3 bg-success-light border-success animate-fade-in">
                  <CheckCircle size={64} className="text-success mx-auto mb-3" />
                  <h3 className="fw-bold text-success">Holiday Booked Successfully!</h3>
                  <p className="text-muted max-w-400 mx-auto small px-3">
                    Congratulations <strong>{kycName}</strong>! Your self-drive trip to <strong>{selectedLocation?.name}</strong> starting on 12 Sep 2026 is confirmed. Receipts have been sent to <strong>{kycPhone}</strong>.
                  </p>
                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline-success btn-sm px-4 rounded-pill"
                      onClick={() => {
                        setBookingConfirmed(false);
                        setCurrentStep(1);
                        setKycName('');
                        setKycPhone('');
                        setKycLicense('');
                      }}
                    >
                      Plan New Holiday
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Chat message input bottom pane */}
            <form onSubmit={handleSendMessage} className="chat-input-bar border-top pt-3 mt-3">
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control rounded-start-pill border-end-0 px-3 py-2.5 bg-light"
                  placeholder="Ask anything about your Goa trip..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={bookingConfirmed}
                />
                <button type="button" className="btn btn-light border-top border-bottom border-end-0 px-3 text-muted">
                  <Mic size={18} />
                </button>
                <button type="submit" className="btn btn-warning rounded-end-pill px-3.5 text-white" disabled={bookingConfirmed}>
                  <Send size={18} />
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* 3. RIGHT PANEL: YOUR TRIP SUMMARY */}
        <div className="col-lg-3 col-md-12">
          <div className="bg-white rounded-4 shadow-sm p-3 border h-100 text-start d-flex flex-column justify-content-between">
            
            <div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h5 className="fw-bold m-0 font-heading">Your Trip Summary</h5>
                <span className="badge bg-success-light text-success fw-bold border border-success small">Live Quote</span>
              </div>

              {/* Summary blocks */}
              <div className="trip-summary-blocks">
                
                {/* Trip Dates */}
                <div className="summary-block mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="d-block text-muted text-xs fw-bold text-uppercase">Trip Dates</span>
                      <span className="fw-bold text-dark text-sm">12 Sep 2026 – 15 Sep 2026</span>
                    </div>
                    <span className="badge bg-light border text-dark text-xs">4 Days / 3 Nights</span>
                  </div>
                </div>

                {/* Travellers */}
                <div className="summary-block mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="d-block text-muted text-xs fw-bold text-uppercase">Travellers</span>
                      <span className="fw-bold text-dark text-sm">2 Adults • 0 Children</span>
                    </div>
                    <button type="button" className="btn btn-link p-0 text-xs text-primary fw-bold text-decoration-none">
                      <Edit3 size={12} className="me-0.5" />Edit
                    </button>
                  </div>
                </div>

                {/* Stay selected */}
                <div className="summary-block mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="d-block text-muted text-xs fw-bold text-uppercase">Stay Selected</span>
                      <span className="fw-bold text-dark text-sm">
                        {selectedStay ? selectedStay.name : "None chosen"}
                      </span>
                      {selectedStay && <span className="d-block text-xs text-muted">3 Nights • 1 Room • Breakfast</span>}
                    </div>
                    <button type="button" className="btn btn-link p-0 text-xs text-primary fw-bold text-decoration-none">
                      <Edit3 size={12} className="me-0.5" />Edit
                    </button>
                  </div>
                </div>

                {/* Vehicle selected */}
                <div className="summary-block mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="d-block text-muted text-xs fw-bold text-uppercase">Vehicle Selected</span>
                      <span className="fw-bold text-dark text-sm">
                        {selectedVehicle ? `${selectedVehicle.name} (${selectedVehicle.details})` : "None chosen"}
                      </span>
                      {selectedVehicle && <span className="d-block text-xs text-muted">4 Days Rental</span>}
                    </div>
                    <button type="button" className="btn btn-link p-0 text-xs text-primary fw-bold text-decoration-none">
                      <Edit3 size={12} className="me-0.5" />Edit
                    </button>
                  </div>
                </div>

                {/* Experience Addons */}
                <div className="summary-block mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="d-block text-muted text-xs fw-bold text-uppercase">Experience Add-ons</span>
                      <span className="fw-bold text-dark text-sm">
                        {selectedExperiences.length > 0 ? selectedExperiences.map(e => e.name).join(', ') : "None selected"}
                      </span>
                    </div>
                    <button type="button" className="btn btn-link p-0 text-xs text-primary fw-bold text-decoration-none">
                      <Edit3 size={12} className="me-0.5" />Edit
                    </button>
                  </div>
                </div>

              </div>

              {/* Price Breakdown */}
              <div className="billing-breakdown-card bg-light rounded-3 p-3 border mt-3">
                <span className="d-block fw-bold text-dark text-xs text-uppercase mb-2">Price Breakdown</span>
                
                <div className="d-flex justify-content-between text-xs mb-1.5">
                  <span className="text-secondary">Base Package Price:</span>
                  <span className="fw-semibold">₹{basePrice}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-1.5">
                  <span className="text-secondary">Stay (3 Nights):</span>
                  <span className="fw-semibold">₹{stayCost}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-1.5">
                  <span className="text-secondary">Vehicle (4 Days):</span>
                  <span className="fw-semibold">₹{vehicleCost}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-1.5">
                  <span className="text-secondary">Activities & Experiences:</span>
                  <span className="fw-semibold">₹{experiencesCost}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-1.5 text-muted">
                  <span>Service Charge:</span>
                  <span>₹{serviceCharge}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-1.5 text-muted">
                  <span>Taxes & Fees:</span>
                  <span>₹{tax}</span>
                </div>
                <div className="d-flex justify-content-between text-xs mb-2 text-success">
                  <span>Discount:</span>
                  <span>- ₹{discount}</span>
                </div>

                <div className="d-flex justify-content-between border-top pt-2 fw-extrabold text-primary fs-5">
                  <span>Final Package:</span>
                  <span>₹{finalPrice}</span>
                </div>
                <span className="text-xs text-muted d-block text-end mt-0.5">Inclusive of all taxes</span>
              </div>

              {/* Refundable Deposit block */}
              <div className="d-flex justify-content-between mt-3 text-xs fw-bold px-2 py-1.5 border border-dashed rounded bg-warning-light border-warning">
                <span>Refundable Deposit (To Confirm):</span>
                <span>₹{refundableDeposit}</span>
              </div>
            </div>

            {/* Next trigger CTA */}
            {currentStep < 7 && (
              <button 
                type="button" 
                className="btn btn-warning text-white fw-bold py-2.5 rounded-pill w-100 shadow-sm mt-4"
                onClick={() => setCurrentStep(7)}
              >
                Proceed to KYC
              </button>
            )}

            {currentStep === 7 && !bookingConfirmed && (
              <button 
                type="button" 
                className="btn btn-warning text-white fw-bold py-2.5 rounded-pill w-100 shadow-sm mt-4"
                onClick={handleNextStep}
              >
                Confirm Booking Summary
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
