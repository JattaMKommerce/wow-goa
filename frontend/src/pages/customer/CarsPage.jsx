import React, { useState, useMemo } from 'react';
import { Star, Users, TrendingUp, ShieldCheck, Award, Filter, AlertCircle, RotateCcw, ChevronRight, Camera } from 'lucide-react';
import { getMarkupPrice } from '../../utils/pricingHelper';

const BIKE_CATEGORIES = new Set([
  'scooter', 'scooter / moped', 'sports bike', 'cruiser', 'tourer / adventure',
  'electric scooter (ev)', 'superbike', 'dirt / off-road', 'cafe racer', 'standard / commuter', 'bike'
]);

function isBikeItem(item) {
  if (!item) return false;
  if (item._type === 'bike' || item.type === 'bike') return true;
  const cat = (item.category || '').toLowerCase().trim();
  if (BIKE_CATEGORIES.has(cat) || cat.includes('bike') || cat.includes('scooter') || cat.includes('moped')) return true;
  const name = (item.name || '').toLowerCase().trim();
  if (name.includes('ninja') || name.includes('kavasaki') || name.includes('kawasaki') || name.includes('activa') || name.includes('jupiter') || name.includes('bullet') || name.includes('ktm') || name.includes('duke') || name.includes('r15') || name.includes('pulsar')) return true;
  return false;
}

export default function CarsPage({
  carFilterFuel = 'All',
  setCarFilterFuel,
  carFilterTrans = 'All',
  setCarFilterTrans,
  handleOpenBooking,
  onViewDetails,
  cars = [],
  searchQuery,
  markups = [],
  appliedFilters = {},
  setAppliedFilters
}) {
  const displayCars = useMemo(() => {
    return (cars || []).filter(c => !isBikeItem(c)).map(car => ({
      ...car,
      price: getMarkupPrice(parseFloat(car.price || 0), car.vendor_id || 'global', 'cars', car.id, markups, 'b2c')
    }));
  }, [cars, markups]);

  const filteredCars = useMemo(() => {
    const carSubs = appliedFilters?.carSubFilters || [];
    const appTrans = appliedFilters?.vehicleTransmission || [];
    const appFuel = appliedFilters?.vehicleFuel || [];
    const appSeats = appliedFilters?.vehicleSeating || [];
    const appBudget = appliedFilters?.vehicleBudget || [];

    const results = displayCars.filter(car => {
      const name = (car.name || '').toLowerCase();
      const cat = (car.category || '').toLowerCase();
      const vFuel = (car.fuel || '').toLowerCase();
      const vTrans = (car.transmission || '').toLowerCase();
      const vSeat = String(car.seating || '5');
      const price = parseFloat(car.price || 0);

      const fuelMatch = (!carFilterFuel || carFilterFuel === 'All' || car.fuel === carFilterFuel) &&
        (appFuel.length === 0 || appFuel.some(f => {
          if (f.toLowerCase().includes('petrol')) return vFuel.includes('petrol');
          if (f.toLowerCase().includes('diesel')) return vFuel.includes('diesel');
          if (f.toLowerCase().includes('electric') || f.toLowerCase().includes('ev')) return vFuel.includes('electric') || vFuel.includes('ev');
          return true;
        }));

      const transMatch = (!carFilterTrans || carFilterTrans === 'All' || car.transmission === carFilterTrans) &&
        (appTrans.length === 0 || appTrans.some(t => {
          if (t.toLowerCase() === 'manual') return vTrans.includes('manual');
          if (t.toLowerCase() === 'automatic') return vTrans.includes('auto') || vTrans.includes('amt') || vTrans.includes('at') || vTrans.includes('cvt') || vTrans.includes('dct');
          return true;
        }));

      const bodyMatch = carSubs.length === 0 || carSubs.some(sub => {
        const s = sub.toLowerCase();
        if (s.includes('hatchback')) return cat.includes('hatchback') || name.includes('swift') || name.includes('i10') || name.includes('i20');
        if (s.includes('sedan')) return cat.includes('sedan') || name.includes('dzire') || name.includes('city') || name.includes('verna');
        if (s.includes('suv')) return cat.includes('suv') || name.includes('creta') || name.includes('brezza') || name.includes('seltos');
        if (s.includes('7-seater') || s.includes('muv')) return cat.includes('7') || cat.includes('muv') || name.includes('ertiga') || name.includes('innova');
        if (s.includes('open top') || s.includes('thar')) return cat.includes('open') || cat.includes('thar') || name.includes('thar') || name.includes('jimny');
        if (s.includes('convertible')) return cat.includes('convertible') || cat.includes('cabriolet') || cat.includes('coupe');
        return cat.includes(s) || name.includes(s);
      });

      const seatMatch = appSeats.length === 0 || appSeats.some(st => {
        if (st.includes('2')) return vSeat.includes('2');
        if (st.includes('4') || st.includes('5')) return vSeat.includes('4') || vSeat.includes('5');
        if (st.includes('7')) return vSeat.includes('7') || vSeat.includes('8');
        return true;
      });

      const budgetMatch = appBudget.length === 0 || appBudget.some(b => {
        if (b === '< 1500') return price < 1500;
        if (b === '1500-3000') return price >= 1500 && price <= 3000;
        if (b === '3000-6000') return price >= 3000 && price <= 6000;
        if (b === '> 6000') return price > 6000;
        return true;
      });

      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' ||
                          name.includes(q) || 
                          cat.includes(q) || 
                          (car.location && car.location.toLowerCase().includes(q));

      return fuelMatch && transMatch && bodyMatch && seatMatch && budgetMatch && searchMatch;
    });

    return results;
  }, [displayCars, carFilterFuel, carFilterTrans, searchQuery, appliedFilters]);

  const carsToRender = filteredCars;

  const [activeMediaIndexes, setActiveMediaIndexes] = useState({});

  const handlePrevMedia = (carId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[carId] || 0;
      const nextIdx = (curr - 1 + mediaCount) % mediaCount;
      return { ...prev, [carId]: nextIdx };
    });
  };

  const handleNextMedia = (carId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[carId] || 0;
      const nextIdx = (curr + 1) % mediaCount;
      return { ...prev, [carId]: nextIdx };
    });
  };

  const handleResetFilters = () => {
    if (setCarFilterFuel) setCarFilterFuel('All');
    if (setCarFilterTrans) setCarFilterTrans('All');
  };

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="section-header mb-4 text-start">
        <h2 className="fs-3 fw-bold text-dark">Self Drive Rental Cars in Goa</h2>
        <p className="text-muted small">
          Showing {carsToRender.length} verified cars with unlimited kilometres and insurance.
        </p>
      </div>


      {/* Filter Bar */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4 bg-white p-3 rounded-4 shadow-sm border">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-bold me-1">Fuel:</span>
          {['All', 'Petrol', 'Diesel', 'Electric'].map(fuel => (
            <button
              key={fuel}
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${carFilterFuel === fuel ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setCarFilterFuel && setCarFilterFuel(fuel)}
            >
              {fuel}
            </button>
          ))}
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-bold me-1">Transmission:</span>
          {['All', 'Manual', 'Automatic'].map(trans => (
            <button
              key={trans}
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${carFilterTrans === trans ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setCarFilterTrans && setCarFilterTrans(trans)}
            >
              {trans}
            </button>
          ))}
        </div>
      </div>

      {/* Car Grid */}
      <div className="row g-4 mb-5">
        {carsToRender.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm">
            <h4 className="text-muted mb-2">No rental cars available in this category.</h4>
            <button 
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 mt-2"
              onClick={handleResetFilters}
            >
              View All Cars
            </button>
          </div>
        ) : (
          carsToRender.map(car => {
            const parsedImages = [];
            if (car.images_json) {
              try {
                const p = typeof car.images_json === 'string' ? JSON.parse(car.images_json) : car.images_json;
                if (Array.isArray(p)) parsedImages.push(...p);
              } catch (e) {}
            }
            if (car.mediaList && Array.isArray(car.mediaList)) {
              parsedImages.push(...car.mediaList.map(m => m?.url || m));
            }
            if (car.media_list && Array.isArray(car.media_list)) {
              parsedImages.push(...car.media_list.map(m => m?.url || m));
            }
            if (car.additional_images && Array.isArray(car.additional_images)) {
              parsedImages.push(...car.additional_images);
            }
            if (car.image) parsedImages.push(car.image);

            const mediaList = Array.from(new Set(parsedImages.filter(Boolean)));
            const activeIdx = activeMediaIndexes[car.id] || 0;
            const currentImg = mediaList[activeIdx] || car.image || '';

            return (
              <div key={car.id} className="col-md-6 col-lg-4">
                <div 
                  className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-scale"
                  style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                  onClick={() => {
                    if (document.activeElement?.blur) document.activeElement.blur();
                    if (onViewDetails) onViewDetails(car);
                  }}
                >
                  <div className="position-relative" style={{ height: '200px', background: '#f8fafc' }}>
                    {currentImg ? (
                      <img 
                        src={currentImg} 
                        alt={car.name} 
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallbackEl = e.target.parentElement.querySelector('.no-photo-fallback');
                          if (fallbackEl) fallbackEl.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="no-photo-fallback flex-column align-items-center justify-content-center w-100 h-100 text-muted" 
                      style={{ display: currentImg ? 'none' : 'flex', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
                    >
                      <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-xs" style={{ width: '44px', height: '44px', background: 'rgba(100,116,139,0.1)', border: '1px dashed rgba(100,116,139,0.25)' }}>
                        <Camera size={20} className="text-secondary opacity-75" />
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', letterSpacing: '0.2px' }}>No Photo Uploaded</span>
                    </div>
                    <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-2 py-1 rounded-pill small" style={{ zIndex: 2 }}>
                      {car.category || 'Hatchback'}
                    </span>
                    {mediaList.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark position-absolute start-0 top-50 translate-middle-y ms-2 rounded-circle d-flex align-items-center justify-content-center opacity-75 shadow"
                          style={{ width: '26px', height: '26px', padding: 0, zIndex: 2 }}
                          onClick={(e) => handlePrevMedia(car.id, mediaList.length, e)}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark position-absolute end-0 top-50 translate-middle-y me-2 rounded-circle d-flex align-items-center justify-content-center opacity-75 shadow"
                          style={{ width: '26px', height: '26px', padding: 0, zIndex: 2 }}
                          onClick={(e) => handleNextMedia(car.id, mediaList.length, e)}
                        >
                          ›
                        </button>
                        <div className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white rounded" style={{ zIndex: 2 }}>
                          📷 {activeIdx + 1} / {mediaList.length}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="fw-bold text-dark mb-1 font-heading">{car.name}</h5>
                      <div className="d-flex align-items-center gap-2 text-muted small mb-2 flex-wrap">
                        <span>👥 {car.seating || 5} Seats</span>
                        <span>•</span>
                        <span>⛽ {car.fuel || 'Petrol'}</span>
                        <span>•</span>
                        <span>⚙️ {car.transmission || 'Manual'}</span>
                      </div>

                      {/* Rental Trust Badges */}
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        <span className="badge bg-light text-dark border px-2 py-1 text-xxs fw-semibold">
                          {car.has_ac === 0 || car.has_ac === false || car.has_ac === '0' ? '💨 Non-AC' : '❄️ AC'}
                        </span>
                        <span className="badge bg-light text-dark border px-2 py-1 text-xxs fw-semibold">
                          💰 ₹{Number(car.security_deposit || 3000).toLocaleString('en-IN')} Deposit
                        </span>
                        <span className="badge bg-light text-success border px-2 py-1 text-xxs fw-semibold">
                          🛣️ {car.km_limit || 'Unlimited Kms'}
                        </span>
                        {(car.has_fastag === 1 || car.has_fastag === true || car.has_fastag === '1' || car.has_fastag === undefined) && (
                          <span className="badge bg-light text-primary border px-2 py-1 text-xxs fw-semibold">
                            ⚡ FASTag
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div>
                        <span className="text-muted small d-block">per day</span>
                        <h4 className="fw-black text-primary mb-0 font-heading">₹{Number(car.price).toLocaleString('en-IN')}</h4>
                      </div>
                      <div>
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-bold font-heading d-flex align-items-center gap-1 hover-scale shadow-sm"
                          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (document.activeElement?.blur) document.activeElement.blur();
                            if (onViewDetails) onViewDetails(car);
                          }}
                        >
                          <span>View Details &amp; Book</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
