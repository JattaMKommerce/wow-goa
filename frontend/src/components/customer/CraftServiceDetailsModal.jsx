import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, CheckCircle, Star, MapPin, Users, Fuel, Settings,
  ShieldCheck, Clock, Calendar, AlertCircle, ArrowRight, Shield,
  Award, Sparkles, Car, Bike, Hotel, Compass, Info, CheckCircle2
} from 'lucide-react';
import ImageCarousel from '../common/ImageCarousel';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

/**
 * CraftServiceDetailsModal
 * Dedicated Service Details view for services within Craft My Trip.
 * Displays real images, specifications, duration, inclusions, rental/stay policies,
 * live availability, and provides a clear "Continue / Book" action.
 */
export default function CraftServiceDetailsModal({
  isOpen,
  serviceType, // 'vehicle' | 'hotel' | 'activity'
  item,
  pickupDate,
  dropDate,
  bookingDays = 1,
  memberCount = 1,
  isSelected = false,
  onClose,
  onSelect,
  onDeselect,
  onContinue
}) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      lockScroll('craft-service-details');
      return () => {
        unlockScroll('craft-service-details');
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Normalize Images
  const images = useMemo(() => {
    if (!item) return [];
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

    add(item.image);
    add(item.image_url);
    add(item.photo);

    if (item.images_json) {
      try {
        const parsed = typeof item.images_json === 'string' ? JSON.parse(item.images_json) : item.images_json;
        add(parsed);
      } catch (e) {}
    }

    if (Array.isArray(item.mediaList)) add(item.mediaList.map(m => m?.url || m));
    if (Array.isArray(item.media_list)) add(item.media_list.map(m => m?.url || m));

    if (list.length === 0) {
      if (serviceType === 'vehicle') {
        list.push('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80');
      } else if (serviceType === 'hotel') {
        list.push('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
      } else {
        list.push('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80');
      }
    }
    return list;
  }, [item, serviceType]);

  // Duration & Pricing Calculations
  const calculatedDays = useMemo(() => {
    if (pickupDate && dropDate) {
      const diff = Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return bookingDays || 1;
  }, [pickupDate, dropDate, bookingDays]);

  const nights = calculatedDays;

  if (!isOpen || !item) return null;

  // Type-specific computations
  const isVehicle = serviceType === 'vehicle';
  const isHotel = serviceType === 'hotel';
  const isActivity = serviceType === 'activity';

  const isBike = isVehicle && (item.vehicle_type === 'bike' || item.type === 'bike' || (parseInt(item.seating) <= 2 && !item.category?.toLowerCase().includes('car')));

  // Pricing
  const unitPrice = parseFloat(
    isVehicle ? (item.price || 1500)
    : isHotel ? (item.price_per_night || item.price || 2500)
    : (item.price || 800)
  );

  const totalPrice = isVehicle
    ? unitPrice * calculatedDays
    : isHotel
    ? unitPrice * nights
    : unitPrice * memberCount;

  const gst = Math.round(totalPrice * 0.18);
  const grandTotal = totalPrice + gst;

  // Availability check
  const isAvailable = item.is_available === 1 || item.is_available === '1' || item.is_available === true || item.is_available === undefined;

  // Inclusions and Policies based on service
  const inclusions = isVehicle
    ? [
        { label: 'Comprehensive Insurance', desc: 'Zero liability coverage for peace of mind' },
        { label: '24/7 Roadside Assistance', desc: 'Emergency support across all Goa areas' },
        { label: 'Sanitised & Serviced', desc: 'Multi-point inspection before delivery' },
        { label: 'Zero Hidden Charges', desc: 'Transparent upfront pricing and free cancellation' },
        ...(isBike ? [{ label: 'Standard Helmets Included', desc: 'Rider & pillion safety helmets' }] : [{ label: 'Climate Control AC', desc: 'Chilled air-conditioning in all vehicles' }])
      ]
    : isHotel
    ? [
        { label: 'Complimentary High-Speed WiFi', desc: 'Fast connection in rooms & lobby' },
        { label: 'Air-Conditioned Accommodations', desc: 'Independent room temperature control' },
        { label: 'Swimming Pool & Sun Deck', desc: 'Full access during operating hours' },
        { label: 'Daily Housekeeping & Fresh Towels', desc: 'Clean linen and hygiene standards' },
        { label: '24-Hour Front Desk Support', desc: 'On-demand guest assistance and concierge' }
      ]
    : [
        { label: 'Certified Tour Guide / Instructor', desc: 'Verified local specialist guiding experience' },
        { label: 'Safety Gear & Life Jackets', desc: 'Certified safety equipment for all guests' },
        { label: 'Sightseeing & Entry Permits', desc: 'Permits included where applicable' },
        { label: 'First Aid & Safety Briefing', desc: 'Comprehensive safety orientation before start' }
      ];

  const importantInfo = isVehicle
    ? [
        'Original Driving Licence (DL) and Govt Photo ID (Aadhaar / Passport) must be presented at delivery.',
        '100% Refundable Security Deposit collected during hand-over and refunded on return inspection.',
        'Same-to-same fuel policy: return the vehicle with the same fuel level as provided.',
        'Speed limit strictly capped at 60 km/h in Goa state roads; strictly NO driving on beaches.'
      ]
    : isHotel
    ? [
        'Standard Check-in: 14:00 hrs | Check-out: 11:00 hrs.',
        'Govt-approved photo ID required for all adult guests at check-in (Aadhaar/Passport/DL).',
        'Free cancellation available up to 24 hours prior to scheduled check-in.',
        'Early check-in and late check-out subject to availability upon request.'
      ]
    : [
        'Mandatory safety briefing conducted 10 minutes before tour or activity departure.',
        'Wear comfortable footwear and carry appropriate attire (swimwear/sunscreen for water activities).',
        'Please arrive at the assembly location 15 minutes prior to the scheduled departure time.',
        'Water sports and outdoor sightseeing are subject to permissible sea and weather conditions.'
      ];

  const handleActionClick = () => {
    if (isSelected) {
      if (onDeselect) onDeselect(item);
      onClose();
    } else {
      if (onContinue) {
        onContinue(item);
      } else if (onSelect) {
        onSelect(item);
        onClose();
      }
    }
  };

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in"
      style={{
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
        overscrollBehavior: 'contain'
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Modal Header ─── */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 p-1.5 text-white d-flex align-items-center justify-content-center"
              style={{
                background: isVehicle
                  ? 'linear-gradient(135deg, #0052ff, #00c6ff)'
                  : isHotel
                  ? 'linear-gradient(135deg, #ff6b35, #f7c59f)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                width: 34,
                height: 34
              }}
            >
              {isVehicle ? (isBike ? <Bike size={18} /> : <Car size={18} />) : isHotel ? <Hotel size={18} /> : <Compass size={18} />}
            </div>
            <div>
              <span className="text-muted text-xxs text-uppercase fw-bold letter-spacing-1">
                {isVehicle ? (isBike ? 'Self-Drive Bike Details' : 'Self-Drive Car Details') : isHotel ? 'Hotel Information' : 'Experience Details'}
              </span>
              <h5 className="mb-0 fw-bold text-dark font-heading text-truncate" style={{ maxWidth: '520px', fontSize: '17px' }}>
                {item.name || item.title}
              </h5>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-muted hover-text-dark border"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Modal Scrollable Body ─── */}
        <div 
          className="p-4 overflow-y-auto" 
          data-scrollable="true" 
          style={{ 
            maxHeight: 'calc(92vh - 140px)', 
            overscrollBehavior: 'contain',
            touchAction: 'pan-y'
          }}
        >
          {/* 1. Image Carousel & Gallery */}
          <div className="mb-4">
            <ImageCarousel
              images={images}
              alt={item.name || item.title}
              height="320px"
              rounded="16px"
            />
          </div>

          {/* 2. Top Info Row */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-8">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  {item.category || item.type || (isVehicle ? (isBike ? 'Bike' : 'Car') : isHotel ? 'Hotel Stay' : 'Experience')}
                </span>
                {item.badge && (
                  <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 text-xxs">
                    ⭐ {item.badge}
                  </span>
                )}
                {isAvailable ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 text-xxs fw-bold d-flex align-items-center gap-1">
                    <CheckCircle2 size={12} /> Available
                  </span>
                ) : (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    Unavailable
                  </span>
                )}
                {item.rating && (
                  <span className="badge bg-warning-subtle text-dark border border-warning-subtle rounded-pill px-2 py-1 text-xxs fw-bold d-flex align-items-center gap-1">
                    <Star size={12} className="text-warning fill-warning" /> {item.rating} / 5
                  </span>
                )}
              </div>

              <h4 className="fw-black text-dark font-heading mb-1" style={{ fontSize: '22px' }}>
                {item.name || item.title}
              </h4>

              <div className="d-flex flex-wrap align-items-center gap-3 text-muted text-xs mb-3">
                <span className="d-flex align-items-center gap-1">
                  <MapPin size={14} className="text-danger" />
                  {item.location || item.area || 'Goa'}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Clock size={14} className="text-primary" />
                  {isVehicle
                    ? `${calculatedDays} Day${calculatedDays > 1 ? 's' : ''} Rental`
                    : isHotel
                    ? `${nights} Night${nights > 1 ? 's' : ''} Stay`
                    : (item.duration || 'Flexible Duration')}
                </span>
              </div>

              {/* Description */}
              <div className="p-3 bg-light rounded-3 mb-3 border text-secondary text-xs leading-relaxed">
                {item.description || (
                  isVehicle
                    ? `Premium ${item.name} self-drive rental in Goa. Cleaned, thoroughly inspected, and ready for immediate delivery across North and South Goa locations.`
                    : isHotel
                    ? `${item.name} offers warm Goan hospitality, well-appointed guest rooms, and premium amenities situated close to premier coastal attractions.`
                    : `Enjoy an authentic Goan experience with our guided tour. Verified safety measures, expert local escort, and unforgettable memories guaranteed.`
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="col-12 col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between" style={{ border: '1px solid #e2e8f0' }}>
                <div>
                  <span className="text-muted text-xxs text-uppercase fw-bold">Rate Breakdown</span>
                  <div className="d-flex align-items-baseline gap-1 mt-1">
                    <span className="fs-3 fw-black text-dark font-heading">
                      ₹{unitPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted text-xs">
                      {isVehicle ? ' / day' : isHotel ? ' / night' : ' / person'}
                    </span>
                  </div>

                  <div className="border-top pt-2 mt-3 text-xs">
                    <div className="d-flex justify-content-between text-muted mb-1">
                      <span>
                        {isVehicle ? `Base Fare (${calculatedDays}d)` : isHotel ? `Room Fare (${nights}n)` : `Guests (${memberCount} pax)`}
                      </span>
                      <span className="fw-semibold text-dark">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-1">
                      <span>GST (18%)</span>
                      <span className="fw-semibold text-dark">₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top fw-bold text-dark fs-6 mt-2">
                      <span>Est. Total</span>
                      <span className="text-primary font-heading">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xxs text-muted d-flex align-items-center gap-1">
                  <ShieldCheck size={14} className="text-success flex-shrink-0" />
                  <span>Transparent pricing · No hidden fees</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Specifications Strip (Vehicles & Hotels) */}
          {isVehicle && (
            <div className="mb-4">
              <h6 className="fw-bold text-dark font-heading mb-2 text-xs text-uppercase letter-spacing-1">
                Vehicle Specifications
              </h6>
              <div className="row g-2">
                <div className="col-6 col-sm-3">
                  <div className="p-2.5 rounded-3 bg-white border text-center">
                    <Users size={18} className="text-primary mx-auto mb-1" />
                    <div className="text-muted text-3xs">Seating</div>
                    <div className="fw-bold text-xs text-dark">{item.seating || (isBike ? '2 Persons' : '5 Persons')}</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2.5 rounded-3 bg-white border text-center">
                    <Fuel size={18} className="text-success mx-auto mb-1" />
                    <div className="text-muted text-3xs">Fuel Type</div>
                    <div className="fw-bold text-xs text-dark">{item.fuel || 'Petrol'}</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2.5 rounded-3 bg-white border text-center">
                    <Settings size={18} className="text-warning mx-auto mb-1" />
                    <div className="text-muted text-3xs">Transmission</div>
                    <div className="fw-bold text-xs text-dark">{item.transmission || 'Manual'}</div>
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="p-2.5 rounded-3 bg-white border text-center">
                    <Award size={18} className="text-info mx-auto mb-1" />
                    <div className="text-muted text-3xs">Kilometers</div>
                    <div className="fw-bold text-xs text-dark">{item.mileage || 'Unlimited Kms'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Included Services */}
          <div className="mb-4">
            <h6 className="fw-bold text-dark font-heading mb-2.5 text-xs text-uppercase letter-spacing-1 d-flex align-items-center gap-1.5">
              <Sparkles size={14} className="text-warning" />
              Included with this {isVehicle ? 'Rental' : isHotel ? 'Stay' : 'Experience'}
            </h6>
            <div className="row g-2">
              {inclusions.map((inc, i) => (
                <div key={i} className="col-12 col-sm-6">
                  <div className="p-2.5 rounded-3 bg-light border d-flex align-items-start gap-2 h-100">
                    <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="fw-bold text-xs text-dark">{inc.label}</div>
                      <div className="text-muted text-3xs">{inc.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Important Information & Policies */}
          <div>
            <h6 className="fw-bold text-dark font-heading mb-2 text-xs text-uppercase letter-spacing-1 d-flex align-items-center gap-1.5">
              <Info size={14} className="text-info" />
              Important Terms &amp; Policies
            </h6>
            <div className="p-3 bg-light rounded-3 border">
              <ul className="mb-0 ps-3 text-secondary text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {importantInfo.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Modal Sticky Bottom CTA Bar ─── */}
        <div className="p-3 px-4 border-top bg-white d-flex align-items-center justify-content-between gap-3">
          <div>
            <span className="text-muted text-3xs d-block">Estimated Total</span>
            <span className="fw-black text-dark font-heading fs-5">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-muted text-3xs ms-1">
              ({isVehicle ? `${calculatedDays}d` : isHotel ? `${nights}n` : `${memberCount} guests`})
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-3 py-2 text-xs fw-semibold"
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="button"
              className={`btn rounded-pill px-4 py-2 text-xs fw-bold shadow-sm d-flex align-items-center gap-2 ${
                isSelected ? 'btn-success text-white' : 'btn-primary'
              }`}
              style={{ minWidth: '170px', justifyContent: 'center' }}
              onClick={handleActionClick}
            >
              {isSelected ? (
                <>
                  <Check size={15} /> Selected for Trip
                </>
              ) : isVehicle ? (
                <>
                  <span>Select &amp; Continue</span> <ArrowRight size={15} />
                </>
              ) : isHotel ? (
                <>
                  <span>Select &amp; Continue</span> <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>+ Add to Trip</span> <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
