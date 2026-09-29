import React, { useMemo } from 'react';
import { ChevronRight, ArrowLeft, Star, MapPin, Users, Fuel, CheckCircle, Shield, Settings, Zap, Camera } from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';

export default function VehicleDetailsPage({ vehicle, type, onBack, onBook }) {
  if (!vehicle) return null;

  const isBike = type === 'bike' || !vehicle.seating;
  const features = isBike 
    ? ['Helmet Included', 'Full Tank', 'Well Maintained', 'Instant Booking', '24/7 Roadside Assistance']
    : ['AC', 'Music System', 'Airbags', 'Power Windows', 'Clean Interior', '24/7 Roadside Assistance'];
    
  const price = parseFloat(vehicle.price) || 0;
  const originalPrice = Math.round(price * 1.25); // 25% markup for strikethrough

  // Collect all images for the vehicle (main, images_json, documents, etc.)
  const vehicleImages = useMemo(() => {
    const list = [];
    const addImg = (img) => {
      if (!img) return;
      if (typeof img === 'string' && img.trim().length > 0 && !list.includes(img.trim())) {
        list.push(img.trim());
      } else if (Array.isArray(img)) {
        img.forEach(addImg);
      }
    };

    addImg(vehicle.image);
    addImg(vehicle.image_url);

    if (vehicle.images_json) {
      try {
        const parsed = typeof vehicle.images_json === 'string' ? JSON.parse(vehicle.images_json) : vehicle.images_json;
        addImg(parsed);
      } catch (e) {}
    }

    if (vehicle.documents_json) {
      try {
        const parsed = typeof vehicle.documents_json === 'string' ? JSON.parse(vehicle.documents_json) : vehicle.documents_json;
        addImg(parsed);
      } catch (e) {}
    }

    // DO NOT INJECT UNRELATED UNSPLASH PHOTOS OF BIKES/CARS
    return list;
  }, [vehicle, isBike]);

  return (
    <div className="vehicle-details-page animate-fade-in-up pb-5" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => { if (document.activeElement?.blur) document.activeElement.blur(); onBack(); }} className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center">
            <ArrowLeft size={20} />
          </button>
          <h4 className="mb-0 fw-bold">{vehicle.name}</h4>
        </div>
        <button onClick={() => { if (document.activeElement?.blur) document.activeElement.blur(); onBack(); }} className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3 py-1">
          Back
        </button>
      </div>

      <div className="container py-4">
        <div className="bg-white rounded-4 shadow-sm p-4">
          
          {/* Header Info */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <span className="badge bg-primary bg-opacity-10 text-primary">{vehicle.category || (isBike ? 'Bike' : 'Self-Drive Car')}</span>
              {isBike ? <Zap size={16} /> : <Settings size={16} />} 
              <span>{vehicle.transmission || (isBike ? 'Manual' : 'Automatic')}</span>
              {vehicleImages.length > 1 && (
                <span className="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1">
                  <Camera size={13} /> {vehicleImages.length} Photos
                </span>
              )}
            </div>
            <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
              {vehicle.name}
              <div className="d-flex text-warning ms-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
            </h2>
            <div className="text-muted d-flex align-items-center gap-1">
              <MapPin size={16} /> Available for pickup in Goa
            </div>
          </div>

          <div className="row g-5">
            {/* Left Col: Interactive Multi-Image Carousel & Specs */}
            <div className="col-12 col-lg-8">
              <div className="mb-4">
                {vehicleImages.length > 0 ? (
                  <ImageCarousel 
                    images={vehicleImages}
                    alt={vehicle.name}
                    height="420px"
                    rounded="20px"
                  />
                ) : (
                  <div 
                    className="d-flex flex-column align-items-center justify-content-center text-muted rounded-4 border p-5 shadow-sm"
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

              <h4 className="fw-bold mb-3">Vehicle Specifications</h4>
              <div className="row g-3 mb-5">
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Users className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Seating</div>
                    <div className="fw-bold">{vehicle.seating || (isBike ? '2' : '5')} Seats</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Fuel className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Fuel Type</div>
                    <div className="fw-bold">{vehicle.fuel || 'Petrol'}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Settings className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Transmission</div>
                    <div className="fw-bold">{vehicle.transmission || (isBike ? 'Manual' : 'Automatic')}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Shield className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Insurance</div>
                    <div className="fw-bold">Included</div>
                  </div>
                </div>
              </div>

              <h4 className="fw-bold mb-3">Key Features</h4>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {features.map((feature, idx) => (
                  <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                    <CheckCircle size={14} className="text-success" />
                    {feature}
                  </span>
                ))}
              </div>
              
              <div className="alert alert-info d-flex align-items-center gap-3 rounded-4 mt-4">
                <Shield size={32} className="text-primary" />
                <div>
                  <h6 className="fw-bold mb-1">Safety First Guarantee</h6>
                  <p className="mb-0 small text-muted">All our vehicles are thoroughly sanitized and inspected before every trip to ensure your safety and comfort.</p>
                </div>
              </div>
            </div>
            
            {/* Right Col: Pricing Sidebar */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold mb-3">Booking Details</h5>
                
                <div className="mb-4 text-center py-4 bg-light rounded-4">
                  <div className="text-decoration-line-through text-muted small">₹ {originalPrice.toLocaleString()}</div>
                  <h2 className="fw-bold text-primary mb-0 d-inline-block">₹ {price.toLocaleString()}</h2>
                  <span className="text-muted ms-1">/ day</span>
                </div>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex justify-content-between text-muted">
                    <span>Base Fare (1 Day)</span>
                    <span className="fw-bold text-dark">₹ {price.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Taxes & GST (18%)</span>
                    <span className="fw-bold text-dark">₹ {Math.round(price * 0.18).toLocaleString()}</span>
                  </div>
                  <hr className="my-1" />
                  <div className="d-flex justify-content-between fs-5 fw-bold">
                    <span>Estimated Total</span>
                    <span className="text-primary">₹ {Math.round(price * 1.18).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (document.activeElement && typeof document.activeElement.blur === 'function') {
                      document.activeElement.blur();
                    }
                    if (onBook) onBook(vehicle);
                  }} 
                  className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  Book Now <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
