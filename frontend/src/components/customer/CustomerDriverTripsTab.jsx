import React from 'react';
import {
  Users, Car, Phone, MessageCircle, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, ShieldCheck, UserCheck, ArrowRight,
  Info, Navigation
} from 'lucide-react';

export default function CustomerDriverTripsTab({
  currentUser,
  bookings = [],
  onOpenBookingDetails
}) {
  // Filter bookings that requested a chauffeur / driver (excluding child bookings)
  const driverTrips = (bookings || []).filter(b => {
    if (b.parent_booking_id && String(b.parent_booking_id).trim() !== '') return false;
    const rawType = String(b.package_type || b.type || '').toLowerCase();
    const rawItem = String(b.item_name || b.package_name || b.vehicle_name || '').toLowerCase();
    const rawId = String(b.item_id || '').toLowerCase();
    if (
      rawType === 'bike' || rawType.includes('bike') || rawType.includes('scooter') ||
      rawId.startsWith('bike') || rawId.startsWith('bk-') ||
      /bike|scooter|activa|bullet|reborn|classic\s*350|himalayan|royal\s*enfield|jupiter|access/i.test(rawItem)
    ) {
      return false;
    }
    const svcType = String(b.driver_service_type || '').toUpperCase();
    return (
      ['PICKUP', 'DROP', 'FULL'].includes(svcType) ||
      b.driver_required == 1 || 
      b.driver_required === 'yes' || 
      b.driver_required === true || 
      Boolean(b.assigned_driver_id)
    );
  });

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-primary bg-opacity-10 text-primary fw-bold text-xs mb-1">
            <Users size={14} />
            <span>CHAUFFEUR SERVICE DISPATCH</span>
          </div>
          <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '22px' }}>
            Car + Driver Trips
          </h4>
          <p className="text-muted text-xs mb-0">
            Live chauffeur assignment status, verified Goa driver contacts, vehicle details, and pickup coordination.
          </p>
        </div>
      </div>

      {/* ─── Driver Trips List ─── */}
      <div className="d-flex flex-column gap-4">
        {driverTrips.map((b, idx) => {
          const hasDriverAssigned = Boolean(
            b.assigned_driver_name || 
            b.assigned_driver_id || 
            (b.driver_job_status && !['unassigned', 'pending', 'null', ''].includes(b.driver_job_status.toLowerCase()))
          );
          const rawJobStatus = (b.driver_job_status || (hasDriverAssigned ? 'Assigned' : 'Unassigned')).toLowerCase();
          
          let jobStatusLabel = 'Driver Not Assigned';
          let jobStage = 1; // 0: Booking Confirmed, 1: Driver Not Assigned, 2: Driver Assigned, 3: Driver Accepted, 4: Driver On The Way, 5: Driver Arrived, 6: Trip Started, 7: Trip Completed
          let statusTheme = 'warning';

          if (!hasDriverAssigned) {
            jobStatusLabel = 'Driver Not Assigned';
            jobStage = 1;
            statusTheme = 'warning';
          } else if (rawJobStatus === 'completed' || (b.status || '').toLowerCase() === 'completed') {
            jobStatusLabel = 'Trip Completed';
            jobStage = 7;
            statusTheme = 'success';
          } else if (rawJobStatus === 'in progress' || rawJobStatus === 'in_progress' || rawJobStatus === 'trip started') {
            jobStatusLabel = 'Trip Started (In Progress)';
            jobStage = 6;
            statusTheme = 'primary';
          } else if (rawJobStatus === 'arrived') {
            jobStatusLabel = 'Driver Arrived at Pickup Point';
            jobStage = 5;
            statusTheme = 'info';
          } else if (rawJobStatus === 'on the way' || rawJobStatus === 'on_the_way') {
            jobStatusLabel = 'Driver On The Way';
            jobStage = 4;
            statusTheme = 'info';
          } else if (rawJobStatus === 'accepted') {
            jobStatusLabel = 'Driver Accepted';
            jobStage = 3;
            statusTheme = 'success';
          } else {
            jobStatusLabel = 'Driver Assigned';
            jobStage = 2;
            statusTheme = 'primary';
          }

          const driverPhone = b.assigned_driver_phone || '';
          const driverName = b.assigned_driver_name || (b.assigned_driver_id && !b.assigned_driver_id.startsWith('drv-') ? b.assigned_driver_id : 'Assigned Driver');
          const vehicleInfo = b.assigned_driver_vehicle || b.vehicle_details || b.vehicle_name || b.item_name || 'Assigned Vehicle';
          const driverServiceType = b.driver_service_type || 'FULL';

          return (
            <div key={b.id || idx} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
              
              {/* Top Status Strip */}
              <div className={`p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 bg-${statusTheme} bg-opacity-10 border-bottom border-${statusTheme} border-opacity-25`}>
                <div className="d-flex align-items-center gap-2">
                  <div className={`rounded-circle p-1 bg-${statusTheme} text-white`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className={`fw-black text-${statusTheme} text-sm font-heading`}>{jobStatusLabel}</span>
                    <span className="text-muted text-xs ms-2">• Chauffeur service tracking</span>
                  </div>
                </div>

                <div className="text-xs d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark border px-2.5 py-1 rounded-pill fw-bold">
                    🚗 Service: {driverServiceType}
                  </span>
                  <span className="badge bg-dark text-white px-2.5 py-1 rounded-pill">
                    Booking #{b.id || b.booking_id || `WOW-DRV-${100 + idx}`}
                  </span>
                </div>
              </div>

              {/* Multi-Stage Visual Driver Progress Tracker */}
              <div className="bg-light p-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center position-relative px-2">
                  {[
                    { key: 0, label: 'Confirmed' },
                    { key: 2, label: 'Assigned' },
                    { key: 3, label: 'Accepted' },
                    { key: 4, label: 'On The Way' },
                    { key: 5, label: 'Arrived' },
                    { key: 6, label: 'Trip Started' },
                    { key: 7, label: 'Completed' }
                  ].map((step, sIdx) => {
                    const isPassed = jobStage >= step.key;
                    const isCurrent = (step.key === 0 && jobStage < 2) || (step.key === 2 && jobStage === 2) || (step.key === 3 && jobStage === 3) || (step.key === 4 && jobStage === 4) || (step.key === 5 && jobStage === 5) || (step.key === 6 && jobStage === 6) || (step.key === 7 && jobStage >= 7);

                    return (
                      <div key={sIdx} className="text-center flex-grow-1 position-relative" style={{ zIndex: 2 }}>
                        <div 
                          className={`rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold shadow-sm transition ${
                            isPassed 
                              ? 'bg-success text-white' 
                              : 'bg-white text-muted border'
                          }`}
                          style={{ width: '26px', height: '26px', fontSize: '11px', border: isCurrent ? '2px solid #10B981' : undefined }}
                        >
                          {isPassed ? '✓' : sIdx + 1}
                        </div>
                        <div className={`text-xxs mt-1 fw-bold ${isPassed ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '10px' }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body p-4">
                <div className="row g-4 align-items-center">
                  
                  {/* Driver Profile or Waiting Box */}
                  <div className="col-lg-5">
                    {hasDriverAssigned ? (
                      <div className="p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-dark text-warning fw-black flex-shrink-0" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                          {driverName.charAt(0).toUpperCase()}
                        </div>
                        <div className="w-100">
                          <div className="d-flex align-items-center justify-content-between">
                            <h5 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '17px' }}>
                              {driverName}
                            </h5>
                            <span className="badge bg-success bg-opacity-10 text-success text-xxs px-2 py-0.5 rounded-pill fw-bold">
                              Verified Chauffeur
                            </span>
                          </div>
                          <div className="text-muted text-xs mb-1">🚗 {vehicleInfo}</div>
                          <div className="text-dark text-xs mb-2">📞 Mobile: <strong>{driverPhone || 'Not available'}</strong></div>
                          
                          {driverPhone && (
                            <div className="d-flex flex-wrap gap-2">
                              <a 
                                href={`tel:${driverPhone}`} 
                                className="btn btn-sm btn-dark fw-bold rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1.5 shadow-sm"
                              >
                                <Phone size={13} className="text-warning" />
                                <span>Call Driver</span>
                              </a>
                              <a 
                                href={`https://wa.me/${driverPhone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(driverName)}%2C%20I%20am%20your%20passenger%20for%20Booking%20%23${b.id}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn btn-sm btn-success fw-bold rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1.5 shadow-sm"
                              >
                                <MessageCircle size={13} />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 text-center">
                        <Clock size={32} className="text-warning mb-2 animate-bounce-slow" />
                        <h6 className="fw-bold text-dark mb-1">Chauffeur Match in Progress</h6>
                        <p className="text-muted text-xs mb-0">
                          Our operations desk is assigning your preferred vehicle & local chauffeur. You will receive an instant update and driver details as soon as assigned.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trip Details */}
                  <div className="col-lg-4">
                    <h6 className="fw-black text-dark mb-2 font-heading">
                      {b.item_name || b.package_name || 'Car with Chauffeur Package'}
                    </h6>

                    <div className="d-flex flex-column gap-2 text-xs">
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={14} className="text-danger flex-shrink-0" />
                        <span><strong>Pickup:</strong> {b.pickup_location || b.pickup || 'Goa Airport / Resort'} ({b.pickup_time || '10:00 AM'})</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={14} className="text-success flex-shrink-0" />
                        <span><strong>Drop:</strong> {b.drop_location || b.drop || 'North / South Goa'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Calendar size={14} className="text-primary flex-shrink-0" />
                        <span><strong>Date:</strong> {b.pickup_date || b.travel_date || 'Upcoming'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Support */}
                  <div className="col-lg-3 text-lg-end border-start-lg ps-lg-4">
                    <div className="text-xs text-muted mb-1">Total Trip Fare</div>
                    <div className="fs-4 fw-black text-dark font-heading mb-2">
                      ₹{Number(b.total_amount || b.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xxs text-success fw-bold mb-3">✓ Chauffeur Allowances Included</div>

                    <button 
                      onClick={() => onOpenBookingDetails(b)}
                      className="btn btn-outline-dark btn-sm rounded-pill w-100 fw-bold"
                    >
                      View Trip Voucher
                    </button>
                  </div>

                </div>
              </div>
            </div>
          );
        })}

        {driverTrips.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <div className="rounded-circle p-4 bg-light d-inline-flex mx-auto mb-3 text-primary">
              <Users size={48} />
            </div>
            <h4 className="fw-black text-dark mb-2 font-heading">No Car + Driver Bookings</h4>
            <p className="text-muted text-sm mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
              Prefer to sit back and relax? You can book any vehicle with a professional, verified local Goa chauffeur.
            </p>
            <div>
              <a href="/#self-drive-categories" className="btn btn-dark text-white fw-bold rounded-pill px-4 py-2.5 shadow-sm">
                Book a Vehicle with Driver →
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
