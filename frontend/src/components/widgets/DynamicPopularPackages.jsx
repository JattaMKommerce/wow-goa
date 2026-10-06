import React from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

export default function DynamicPopularPackages({ config, packages = [], onBook, onBookPackage, onViewDetails, onViewPackage }) {
  if (config && !config.visible) return null;

  const handleView = (pkg) => {
    if (onViewPackage) onViewPackage(pkg);
    else if (onViewDetails) onViewDetails(pkg);
    else if (onBookPackage) onBookPackage(pkg);
    else if (onBook) onBook(pkg);
  };

  const handleBook = (pkg) => {
    if (onBookPackage) onBookPackage(pkg);
    else if (onBook) onBook(pkg);
    else handleView(pkg);
  };

  // Take top packages dynamically
  let topPackages = packages.slice(0, 6);

  return (
    <div className="py-5 bg-white">
      <div className="container">
        <div className="section-header text-center mb-5">
          <div className="section-tagline text-primary fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>
            Exclusive Deals
          </div>
          <h2 className="section-title fw-bold" style={{ color: '#0D1B2E', fontSize: '2rem' }}>
            {config?.heading || 'Popular Trip Packages'}
          </h2>
          <p className="text-muted mt-3 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'Curated experiences for the perfect getaway'}
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {topPackages.map(pkg => (
            <div key={pkg.id} className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ transition: 'transform 0.3s ease' }}>
                <div style={{ height: '220px', position: 'relative', cursor: 'pointer' }} onClick={() => handleView(pkg)}>
                  <img 
                    src={pkg.imageUrl || pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500'} 
                    alt={pkg.name} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500'; }}
                  />
                  {(pkg.hotel_category || pkg.hotel?.category) && (
                    <span className="position-absolute top-0 start-0 m-3 badge bg-dark bg-opacity-75 text-white rounded-pill px-2.5 py-1.5 shadow-sm fw-bold" style={{ fontSize: '11px' }}>
                      ⭐ {pkg.hotel_category || pkg.hotel?.category}
                    </span>
                  )}
                  <span className="position-absolute top-0 end-0 m-3 badge bg-primary text-white rounded-pill px-3 py-2 shadow-sm">
                    {pkg.package_type || 'Tour'}
                  </span>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-1.5">
                    <span className="badge bg-light text-dark border px-2 py-0.5 fw-bold" style={{ fontSize: '11px' }}>
                      <span className="text-warning">★</span> 4.9 (142 Reviews)
                    </span>
                    <span className="text-muted text-xxs d-flex align-items-center"><MapPin size={12} className="me-0.5 text-danger" /> {pkg.destination || 'Goa'}</span>
                    <span className="text-muted text-xxs d-flex align-items-center"><Clock size={12} className="me-0.5 text-primary" /> {pkg.duration || '3N/4D'}</span>
                  </div>
                  <h4 className="fw-bold mb-2 cursor-pointer text-truncate" style={{ color: '#0D1B2E', fontSize: '1.2rem' }} onClick={() => handleView(pkg)} title={pkg.name}>
                    {pkg.name}
                  </h4>
                  
                  {/* Service Summaries */}
                  <div className="p-2.5 bg-light rounded-3 border mb-3 text-start" style={{ fontSize: '11.5px' }}>
                    <div className="d-flex flex-column gap-1 text-truncate">
                      <div className="text-truncate">🏨 <strong>Stay:</strong> {pkg.hotel?.name || pkg.hotel_included || 'Beach Resort'} {pkg.hotel_category ? `(${pkg.hotel_category})` : ''}</div>
                      <div className="text-truncate">🚗 <strong>Vehicle:</strong> {pkg.vehicle?.name || pkg.car_included || 'Tour Vehicle'} (AC)</div>
                      <div className="text-truncate text-success fw-semibold">🍽️ <strong>Meal:</strong> {pkg.hotel?.meal_plan || pkg.food_included || 'Daily Buffet Breakfast'}</div>
                      <div className="text-truncate">
                        🧑‍✈️ <strong>Driver:</strong> <span className={Boolean(pkg.driver_included || pkg.driver?.included) ? 'text-primary fw-bold' : 'text-muted'}>
                          {Boolean(pkg.driver_included || pkg.driver?.included) ? 'Full Day Chauffeur Included' : 'Not Included'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted mb-3 line-clamp-2" style={{ fontSize: '0.85rem', flexGrow: 1 }}>
                    {pkg.description || 'Pre-configured premium holiday package with verified stays and vehicle.'}
                  </p>
                  <div className="d-flex align-items-center justify-content-between pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Starting from</div>
                      <div className="fw-black text-primary" style={{ fontSize: '1.25rem', color: '#FF6333' }}>₹{parseFloat(pkg.price).toLocaleString()}</div>
                    </div>
                    <div>
                      <button 
                        className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm" 
                        style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }} 
                        onClick={() => handleView(pkg)}
                        title={`View details of ${pkg.name}`}
                      >
                        <span>View Details &amp; Book</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {topPackages.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No packages available right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
