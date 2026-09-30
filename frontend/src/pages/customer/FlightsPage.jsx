import React, { useState, useEffect, useMemo } from 'react';
import { Plane, Calendar, MapPin, ChevronRight, Check, Clock, AlertTriangle } from 'lucide-react';
import * as api from '../../services/api';
import { getFlightDefaultImage } from '../../utils/bookingImageHelper';

export default function FlightsPage({
  searchQuery,
  searchTriggered,
  setSearchTriggered,
  pickupLoc,
  dropLoc,
  pickupDate,
  flightAdults,
  flightChildren,
  flightInfants,
  flightClass,
  onSelectFlight,
  onViewDetails,
  markups = [],
  appliedFilters = {},
  setAppliedFilters
}) {
  const [flights, setFlights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Filters State
  const [filterNonStop, setFilterNonStop] = useState(false);
  const [filterMorning, setFilterMorning] = useState(false);
  const [filterRefundable, setFilterRefundable] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [sortOption, setSortOption] = useState('price_asc');

  useEffect(() => {
    handleSearch();
  }, [searchTriggered, pickupLoc, dropLoc, pickupDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const fromCity = pickupLoc ? pickupLoc.split(' - ')[0].trim() : 'DEL';
      const toCity = dropLoc ? dropLoc.split(' - ')[0].trim() : 'GOI';
      const date = pickupDate || new Date().toISOString().split('T')[0];
      const results = await api.searchFlights(fromCity, toCity, date, flightAdults || 1, flightChildren || 0, flightInfants || 0, flightClass || 'economy');
      console.log('[FlightsPage Search Results]', { fromCity, toCity, date, count: results?.length });
      setFlights(results || []);
      
      // Reset filters when new search happens
      setSelectedAirlines([]);
      setFilterNonStop(false);
      setFilterMorning(false);
      setFilterRefundable(false);
    } catch (err) {
      console.error('[FlightsPage Search Error]', err);
      setFlights([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDurationStr = (pt) => {
    if (!pt) return 0;
    const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || '0', 10);
    const m = parseInt(match[2] || '0', 10);
    return h * 60 + m;
  };

  // Derive filters and sorted data
  const { filteredOffers, availableAirlines } = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return { filteredOffers: [], availableAirlines: [] };

    const getMarkupPrice = (basePrice, vendorId, entityType, itemId = 'all') => {
      if (!markups) return basePrice;
      
      // 1. Item-specific markup for this vendor
      let applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && m.item_id == itemId);
      
      // 2. Global markup for this vendor (item_id = 'all')
      if (!applicableMarkup) {
        applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && (m.item_id === 'all' || !m.item_id));
      }

      // 3. Global markup for all vendors
      if (!applicableMarkup) {
        applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id === 'global');
      }
      if (applicableMarkup) {
        const val = parseFloat(applicableMarkup.markup_value);
        if (applicableMarkup.markup_type === 'flat') {
          return basePrice + val;
        } else if (applicableMarkup.markup_type === 'percentage') {
          return basePrice + (basePrice * (val / 100));
        }
      }
      return basePrice;
    };

    let offers = flights.map(o => ({
      ...o,
      price: Math.round(getMarkupPrice(parseFloat(o.price || 0), o.vendor_id, 'flights', o.id))
    }));

    const airlinesSet = new Set();

    offers.forEach(o => {
      const airlineName = o.airline?.name || o.airline || 'Unknown Airline';
      airlinesSet.add(airlineName);
    });

    // Sub-filters from appliedFilters
    const activeStops = appliedFilters?.flightStops || [];
    const activeDepTimes = appliedFilters?.flightDepTimes || [];
    const activeArrTimes = appliedFilters?.flightArrTimes || [];
    const activeAirlines = appliedFilters?.flightAirlines || [];
    const activeClass = appliedFilters?.flightClassFilter || [];
    const activePrices = appliedFilters?.flightPriceRanges || [];
    const activeBaggage = appliedFilters?.flightBaggage || [];

    // Apply stops filter
    if (filterNonStop || activeStops.length > 0) {
      offers = offers.filter(o => {
        const s = (o.stops || '').toLowerCase();
        if (filterNonStop) return s.includes('non') || s === '0';
        return activeStops.some(stop => {
          const st = stop.toLowerCase();
          if (st.includes('non')) return s.includes('non') || s === '0' || s === 'direct';
          if (st.includes('1')) return s.includes('1');
          if (st.includes('2')) return s.includes('2') || s.includes('3');
          return true;
        });
      });
    }
    
    // Apply departure time filter
    if (filterMorning || activeDepTimes.length > 0) {
      offers = offers.filter(o => {
        let depHour = 10;
        if (o.departure) {
          try {
            const d = new Date(o.departure);
            if (!isNaN(d.getTime())) depHour = d.getHours();
            else {
              const match = String(o.departure).match(/(\d+):(\d+)/);
              if (match) depHour = parseInt(match[1], 10);
            }
          } catch (e) {
            depHour = 10;
          }
        }
        if (filterMorning && activeDepTimes.length === 0) {
          return depHour >= 5 && depHour <= 11;
        }
        return activeDepTimes.some(t => {
          if (t === 'early_morning') return depHour < 6;
          if (t === 'morning') return depHour >= 6 && depHour < 12;
          if (t === 'afternoon') return depHour >= 12 && depHour < 18;
          if (t === 'evening') return depHour >= 18;
          return true;
        });
      });
    }

    // Apply arrival time filter
    if (activeArrTimes.length > 0) {
      offers = offers.filter(o => {
        let arrHour = 14;
        if (o.arrival) {
          try {
            const d = new Date(o.arrival);
            if (!isNaN(d.getTime())) arrHour = d.getHours();
            else {
              const match = String(o.arrival).match(/(\d+):(\d+)/);
              if (match) arrHour = parseInt(match[1], 10);
            }
          } catch (e) {
            arrHour = 14;
          }
        }
        return activeArrTimes.some(t => {
          if (t === 'early_morning') return arrHour < 6;
          if (t === 'morning') return arrHour >= 6 && arrHour < 12;
          if (t === 'afternoon') return arrHour >= 12 && arrHour < 18;
          if (t === 'evening') return arrHour >= 18;
          return true;
        });
      });
    }

    if (filterRefundable) {
      offers = offers.filter(o => true); // All commercial flight inventory is refundable/reschedulable under airline terms
    }

    // Apply airline filter
    const effectiveAirlines = activeAirlines.length > 0 ? activeAirlines : selectedAirlines;
    if (effectiveAirlines.length > 0) {
      offers = offers.filter(o => {
        const airlineName = (o.airline?.name || o.airline || 'Unknown Airline').toLowerCase();
        return effectiveAirlines.some(a => airlineName.includes(a.toLowerCase()));
      });
    }

    // Apply flight class filter
    if (activeClass.length > 0) {
      offers = offers.filter(o => {
        const cls = (o.cabin_class || o.class || flightClass || 'economy').toLowerCase();
        return activeClass.some(c => cls.includes(c.toLowerCase()));
      });
    }

    // Apply price ranges filter
    if (activePrices.length > 0) {
      offers = offers.filter(o => {
        const p = parseFloat(o.price) || 0;
        return activePrices.some(pr => {
          if (pr === '< 4000') return p < 4000;
          if (pr === '4000-6000') return p >= 4000 && p <= 6000;
          if (pr === '6000-8000') return p >= 6000 && p <= 8000;
          if (pr === '> 8000') return p > 8000;
          return true;
        });
      });
    }

    // Apply baggage filter
    if (activeBaggage.length > 0) {
      offers = offers.filter(o => {
        const bag = (o.baggage || 'Cabin + Check-in baggage included').toLowerCase();
        return activeBaggage.some(b => {
          const bl = b.toLowerCase();
          if (bl.includes('not included')) return bag.includes('not') || bag.includes('cabin only');
          if (bl.includes('included')) return !bag.includes('not');
          if (bl.includes('check-in')) return bag.includes('check-in') || bag.includes('checkin') || !bag.includes('not');
          if (bl.includes('cabin')) return true;
          return true;
        });
      });
    }

    // Apply sorting
    offers.sort((a, b) => {
      if (sortOption === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortOption === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sortOption === 'duration') return parseInt(a.duration?.split('h')[0] || '2') - parseInt(b.duration?.split('h')[0] || '2');
      if (sortOption === 'earliest') return (a.departure || '').localeCompare(b.departure || '');
      return 0;
    });

    return { filteredOffers: offers, availableAirlines: Array.from(airlinesSet).sort() };
  }, [flights, filterNonStop, filterMorning, filterRefundable, selectedAirlines, sortOption, markups, appliedFilters, flightClass]);

  const toggleAirline = (airline) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) ? prev.filter(a => a !== airline) : [...prev, airline]
    );
  };

  return (
    <div id="results-section" className="py-4 bg-light min-vh-100" style={{ backgroundColor: '#f2f2f2' }}>
      <div className="bg-white shadow-sm mb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold mb-1 text-dark d-flex align-items-center">
              <span className="fs-5">{pickupLoc || 'DEL'}</span> 
              <ChevronRight size={20} className="mx-2 text-muted" /> 
              <span className="fs-5">{dropLoc || 'BOM'}</span>
            </h4>
            <div className="text-muted small">
              <span className="me-3"><Calendar size={14} className="me-1" /> {pickupDate || new Date().toISOString().split('T')[0]}</span>
              <span>{flightAdults || 1} Adult(s) | {flightClass || 'Economy'}</span>
            </div>
          </div>
          <button className="btn btn-primary px-4 py-2 fw-semibold rounded-pill" onClick={() => window.scrollTo(0,0)}>
            Modify Search
          </button>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-3 d-none d-lg-block">
            <div className="bg-white rounded p-3 shadow-sm mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">Popular Filters</h6>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="nonstop" checked={filterNonStop} onChange={(e) => setFilterNonStop(e.target.checked)} />
                <label className="form-check-label text-muted" htmlFor="nonstop">Non Stop</label>
              </div>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="morning" checked={filterMorning} onChange={(e) => setFilterMorning(e.target.checked)} />
                <label className="form-check-label text-muted" htmlFor="morning">Morning Departures (5AM - 12PM)</label>
              </div>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="refund" checked={filterRefundable} onChange={(e) => setFilterRefundable(e.target.checked)} />
                <label className="form-check-label text-muted" htmlFor="refund">Refundable Fares</label>
              </div>
            </div>

            {availableAirlines.length > 0 && (
              <div className="bg-white rounded p-3 shadow-sm mb-4">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Airlines</h6>
                {availableAirlines.map(airline => (
                  <div key={airline} className="form-check mb-2 d-flex justify-content-between">
                    <div>
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={airline} 
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => toggleAirline(airline)}
                      />
                      <label className="form-check-label text-muted text-truncate" style={{ maxWidth: '140px' }} htmlFor={airline}>{airline}</label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                Flights from {pickupLoc || 'DEL'} to {dropLoc || 'BOM'} 
                {!isLoading && flights?.offers && <span className="text-muted small ms-2">({filteredOffers.length} found)</span>}
              </h5>
              <div className="d-flex align-items-center">
                <span className="text-muted small me-2">Sorted By:</span>
                <select className="form-select form-select-sm fw-bold text-primary border-0 bg-transparent cursor-pointer shadow-none w-auto" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="price_asc">Price (Cheapest)</option>
                  <option value="price_desc">Price (Highest)</option>
                  <option value="duration">Duration (Fastest)</option>
                  <option value="earliest">Departure (Earliest)</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-5 bg-white rounded shadow-sm">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted fw-semibold">Searching global flight databases via Aviation API...</p>
              </div>
            ) : filteredOffers.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {filteredOffers.map((offer) => {
                  
                  const formatTime = (dateStr) => {
                    if (!dateStr) return '';
                    if (dateStr.includes(':') && dateStr.length <= 5) return dateStr;
                    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  };

                  const airlineName = offer.airline?.name || offer.airline || 'Unknown Airline';
                  const airlineLogo = offer.logo || getFlightDefaultImage(airlineName);
                  const stops = offer.stops || 'Non stop';
                  const price = parseFloat(offer.price).toLocaleString(undefined, { maximumFractionDigits: 0 });
                  const currency = '₹';

                  const durationHours = offer.duration ? parseInt(offer.duration.split('h')[0]) : 2;
                  const durationMins = offer.duration ? parseInt(offer.duration.split('h')[1]?.replace('m', '')) : 30;

                  const handleFlightAction = () => {
                    const fromIata = offer.departure?.iata || offer.from || (pickupLoc ? pickupLoc.split(' - ')[0].trim() : 'DEL');
                    const toIata = offer.arrival?.iata || offer.to || (dropLoc ? dropLoc.split(' - ')[0].trim() : 'GOI');
                    const depTime = formatTime(offer.departure?.scheduled || offer.departure || '10:00');
                    const arrTimeVal = formatTime(offer.arrival?.scheduled || offer.arrival || '12:30');
                    
                    const formattedFlight = {
                      ...offer,
                      id: offer.id ? (String(offer.id).startsWith('fl-') || String(offer.id).startsWith('FL-') ? String(offer.id) : `FL-${offer.id}`) : `FL-${Date.now()}`,
                      type: 'flight',
                      airline: airlineName,
                      from: fromIata,
                      to: toIata,
                      departure: depTime,
                      arrival: arrTimeVal,
                      departureDate: pickupDate || new Date().toISOString().split('T')[0],
                      duration: `${durationHours}h ${durationMins}m`,
                      stops: stops,
                      price: offer.price,
                      name: `${airlineName} Flight (${fromIata} → ${toIata})`,
                      image: airlineLogo,
                      cabin_class: flightClass || offer.cabin_class || 'economy',
                      adults: flightAdults || 1,
                      children: flightChildren || 0,
                      infants: flightInfants || 0
                    };
                    if (onViewDetails) {
                      onViewDetails(formattedFlight);
                    } else if (onSelectFlight) {
                      onSelectFlight(formattedFlight);
                    }
                  };

                  return (
                    <div 
                      key={offer.id} 
                      className="card border-0 shadow-sm rounded transition-all hover-scale" 
                      style={{ overflow: 'hidden', cursor: 'pointer' }}
                      onClick={handleFlightAction}
                    >
                      <div className="card-body p-4 d-flex flex-column flex-md-row align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3" style={{ width: '25%' }}>
                          <img src={airlineLogo} alt={airlineName} className="rounded bg-light" style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={(e)=>{e.target.src=getFlightDefaultImage(airlineName);}} />
                          <div>
                            <div className="fw-bold text-dark">{airlineName}</div>
                            <div className="text-muted small text-truncate" style={{ maxWidth: '120px' }}>{offer.flight?.iata || offer.id}</div>
                          </div>
                        </div>
                        
                        <div className="d-flex align-items-center justify-content-between flex-grow-1 px-4">
                          <div className="text-center">
                            <h4 className="fw-bold mb-0 text-dark">{formatTime(offer.departure?.scheduled || offer.departure)}</h4>
                            <span className="text-muted small">{offer.departure?.iata || offer.from}</span>
                          </div>
                          <div className="d-flex flex-column align-items-center w-100 px-3">
                            <span className="small text-muted mb-1">{durationHours}h {durationMins}m</span>
                            <div className="w-100 border-top border-secondary position-relative">
                              <div className="position-absolute top-50 start-50 translate-middle bg-white px-1">
                                <Plane size={14} className="text-muted" style={{ transform: 'rotate(90deg)' }} />
                              </div>
                            </div>
                            <span className="small text-muted mt-1">{stops}</span>
                          </div>
                          <div className="text-center">
                            <h4 className="fw-bold mb-0 text-dark">{formatTime(offer.arrival?.scheduled || offer.arrival)}</h4>
                            <span className="text-muted small">{offer.arrival?.iata || offer.to}</span>
                          </div>
                        </div>
                        
                        <div className="d-flex flex-column align-items-end justify-content-center ps-4" style={{ width: '25%', borderLeft: '1px solid #eee' }} onClick={(e) => e.stopPropagation()}>
                          <h3 className="fw-bold text-dark mb-2">{currency} {price}</h3>
                          
                          <button 
                            type="button"
                            className="btn btn-primary rounded-pill px-4 py-2 fw-bold w-100 d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                            style={{ fontSize: '14px', letterSpacing: '0.5px', background: '#FF6333', borderColor: '#FF6333' }}
                            onClick={handleFlightAction}
                          >
                            <span>Book Now</span>
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="bg-light px-4 py-2 d-flex justify-content-between text-muted" style={{ fontSize: '12px' }}>
                        <span>
                          <Check size={12} className="text-success me-1"/> Refundable Flight
                        </span>
                        <span className="text-primary cursor-pointer fw-semibold d-flex align-items-center gap-1" onClick={handleFlightAction}>
                          <span>View Flight Details</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 bg-white rounded shadow-sm">
                <Plane size={64} className="text-muted opacity-50 mb-3" />
                <h4 className="fw-bold text-dark">No Flights Found</h4>
                <button className="btn btn-outline-primary mt-3" onClick={() => { setFilterNonStop(false); setFilterMorning(false); setFilterRefundable(false); setSelectedAirlines([]); if (setAppliedFilters) setAppliedFilters({}); }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
