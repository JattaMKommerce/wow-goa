import React from 'react';
import { Star, MapPin, Waves } from 'lucide-react';

export default function DynamicFeaturedHotels({ config, hotels = [], onBook, onBookHotel, onViewDetails, onViewHotel }) {
  if (config && !config.visible) return null;

  const handleAction = (hotel) => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (onViewHotel) onViewHotel(hotel);
    else if (onViewDetails) onViewDetails(hotel);
    else if (onBookHotel) onBookHotel(hotel);
    else if (onBook) onBook(hotel);
  };

  // Real data: take top 4 highest rated or cheapest
  const topHotels = hotels.slice(0, 4);

  return (
    <div className="py-5 bg-white">
      <div className="container">
        <div className="section-header text-center mb-5">
          <div className="section-tagline text-primary fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>
            Luxury Stays
          </div>
          <h2 className="section-title fw-bold" style={{ color: '#0D1B2E', fontSize: '2rem' }}>
            {config?.heading || 'Premium Luxury Stays'}
          </h2>
          <p className="text-muted mt-3 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'Handpicked hotels and resorts in prime locations'}
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {topHotels.map(hotel => (
            <div key={hotel.id} className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden cursor-pointer" style={{ transition: 'transform 0.3s ease' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }} onClick={() => handleAction(hotel)}>
                  <img 
                    src={hotel.image || hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'} 
                    alt={hotel.name} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'; }}
                  />
                  <span className="position-absolute top-0 start-0 m-2 badge bg-dark text-white rounded-pill">
                    {hotel.stars} Star
                  </span>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center text-warning mb-2">
                    {[...Array(parseInt(hotel.stars) || 3)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '1.1rem' }} onClick={() => handleAction(hotel)}>{hotel.name}</h5>
                  <div className="d-flex align-items-center text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    <MapPin size={14} className="me-1" /> {hotel.area}
                  </div>
                  {hotel.nearest_destination && (
                    <div className="d-flex align-items-center gap-1.5 mb-3 px-2.5 py-1 rounded-pill fw-bold" style={{ background: '#F0FDF4', color: '#047857', border: '1px solid #A7F3D0', fontSize: '11px' }}>
                      <Waves size={12} className="flex-shrink-0" />
                      <span className="text-truncate">
                        {hotel.nearest_destination.distance_value} {hotel.nearest_destination.distance_unit} from {hotel.nearest_destination.destination_name}
                      </span>
                    </div>
                  )}
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Starts from</div>
                      <div className="fw-bold text-primary" style={{ fontSize: '1.2rem' }}>₹{parseFloat(hotel.price).toLocaleString()}</div>
                    </div>
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => handleAction(hotel)}>
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {topHotels.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No hotels available right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
