import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Car, Hotel, Plane, Utensils, MapPin, Check, ChevronDown, ChevronRight, ChevronLeft, AlertCircle, RotateCcw, X, Sparkles, SlidersHorizontal } from 'lucide-react';

import { getMarkupPrice, resolvePackagePrices } from '../../utils/pricingHelper';
import CustomerReviewsSection from '../../components/reviews/CustomerReviewsSection';

export default function SelfDrivePage({
  handleOpenBooking,
  onViewDetails,
  packages = [],
  searchQuery = '',
  onClearSearch,
  markups = [],
  appliedFilters = {},
  setAppliedFilters
}) {
  const [activeTab, setActiveTab] = useState('ALL PACKAGES');

  const normalizePrice = (priceStr) => {
    if (priceStr === null || priceStr === undefined || priceStr === '') return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleanStr = String(priceStr).replace(/[^\d.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const hasFlight = (pkg) => {
    if (pkg.flights_included === '0' || pkg.flights_included === 'false' || pkg.flights_included === false) return false;
    return !!pkg.flights_included || !!pkg.price_with_flight;
  };

  const getPackageNights = (pkg) => {
    let nights = 0;
    if (pkg.day_wise_itinerary) {
      try {
        const parsed = typeof pkg.day_wise_itinerary === 'string' ? JSON.parse(pkg.day_wise_itinerary) : pkg.day_wise_itinerary;
        if (Array.isArray(parsed) && parsed.length > 0) {
          nights = Math.max(1, parsed.length - 1);
        }
      } catch (e) {}
    }
    if (nights === 0 && pkg.duration) {
      const nMatch = pkg.duration.match(/(\d+)\s*Nights?/i);
      if (nMatch) nights = parseInt(nMatch[1]);
      else {
        const dMatch = pkg.duration.match(/(\d+)\s*Days?/i);
        if (dMatch) nights = Math.max(1, parseInt(dMatch[1]) - 1);
      }
    }
    return nights || 3;
  };

  // Base list of packages with markup prices applied via shared pricing helper
  const displayPackages = useMemo(() => {
    return (packages || []).map(pkg => {
      const resolved = resolvePackagePrices(pkg, markups);
      return {
        ...pkg,
        price: resolved.price,
        price_with_flight: resolved.price_with_flight,
        originalPrice: resolved.originalPrice,
        originalFlightPrice: resolved.originalFlightPrice
      };
    });
  }, [packages, markups]);

  // Extract unique themes for Tabs WITH counts
  const tabs = useMemo(() => {
    const counts = { 'ALL PACKAGES': (packages || []).length };
    (packages || []).forEach(pkg => {
      if (pkg.tag) {
        const t = pkg.tag.toUpperCase();
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.keys(counts).map(t => ({ id: t, label: t, count: counts[t] }));
  }, [packages]);

  // Extract filter parameters from appliedFilters prop
  const activePriceRanges = appliedFilters?.priceRanges || [];
  const activeHotelStars = appliedFilters?.hotelStars || [];
  const activeTripTypes = appliedFilters?.tripTypes || [];
  const activeDurations = appliedFilters?.durations || [];
  const activeInclusions = appliedFilters?.inclusions || [];
  const activeActivities = appliedFilters?.packageActivities || [];
  const activeBudgetBasis = appliedFilters?.packageBudgetBasis || [];
  const activeMeals = appliedFilters?.packageMeals || [];

  const totalActiveFiltersCount = 
    activePriceRanges.length +
    activeHotelStars.length +
    activeTripTypes.length +
    activeDurations.length +
    activeInclusions.length +
    activeActivities.length +
    activeBudgetBasis.length +
    activeMeals.length +
    (activeTab !== 'ALL PACKAGES' ? 1 : 0);

  // Helper matching functions
  const checkPriceRange = (price, rangeId) => {
    if (rangeId === '< 15000' || rangeId === '< ₹15,000' || rangeId === '< 15k') {
      return price < 15000;
    }
    if (rangeId === '15000-25000' || rangeId === '₹15,000 - ₹20,000' || rangeId === '₹15,000 - ₹25,000' || rangeId === '15k - 25k') {
      return price >= 15000 && price <= 25000;
    }
    if (rangeId === '25000-40000' || rangeId === '₹25,000 - ₹40,000' || rangeId === '25k - 40k') {
      return price >= 25000 && price <= 40000;
    }
    if (rangeId === '> 40000' || rangeId === '> ₹40,000' || rangeId === '> 40k') {
      return price > 40000;
    }
    if (rangeId === '> 25000' || rangeId === '> ₹20,000' || rangeId === '> ₹25k') {
      return price > 25000 || price > 20000;
    }
    return true;
  };

  const checkHotelStar = (pkg, starId) => {
    const s = String(starId).replace(/[^\d]/g, '') || String(starId);
    const hotelStr = `${pkg.hotel_included || ''} ${pkg.hotel_category || ''} ${pkg.hotel?.category || ''} ${pkg.hotel_stars || ''} ${pkg.tag || ''}`.toLowerCase();
    
    if (s === '5') {
      return hotelStr.includes('5') || hotelStr.includes('5-star') || hotelStr.includes('5 star') || hotelStr.includes('5★') || hotelStr.includes('luxury') || hotelStr.includes('w goa') || hotelStr.includes('marriott') || hotelStr.includes('taj');
    }
    if (s === '4') {
      return hotelStr.includes('4') || hotelStr.includes('4-star') || hotelStr.includes('4 star') || hotelStr.includes('4★') || hotelStr.includes('premium') || hotelStr.includes('resort');
    }
    if (s === '3') {
      return hotelStr.includes('3') || hotelStr.includes('3-star') || hotelStr.includes('3 star') || hotelStr.includes('3★') || hotelStr.includes('standard') || (!hotelStr.includes('5') && !hotelStr.includes('4'));
    }
    return true;
  };

  const checkThemeMatch = (pkg, theme) => {
    const t = theme.toLowerCase();
    const pkgText = `${pkg.name || ''} ${pkg.tag || ''} ${pkg.category || ''} ${pkg.package_type || ''} ${pkg.description || ''} ${pkg.places_included || ''}`.toLowerCase();

    if (t === 'family') {
      return pkgText.includes('family') || pkgText.includes('popular') || pkgText.includes('explorer') || pkgText.includes('sightseeing') || !pkgText.includes('honeymoon');
    }
    if (t === 'couple' || t.includes('honeymoon') || t.includes('couples')) {
      return pkgText.includes('couple') || pkgText.includes('romantic') || pkgText.includes('honeymoon') || pkgText.includes('sunset') || pkgText.includes('candlelight');
    }
    if (t === 'adventure') {
      return pkgText.includes('adventure') || pkgText.includes('water sports') || pkgText.includes('sports') || pkgText.includes('scuba') || pkgText.includes('trek') || pkgText.includes('thar') || pkgText.includes('4x4') || pkgText.includes('explorer');
    }
    if (t.includes('group') || t.includes('friends')) {
      return pkgText.includes('group') || pkgText.includes('friends') || pkgText.includes('bachelor') || pkgText.includes('party') || pkgText.includes('villa');
    }
    if (t === 'luxury') {
      return pkgText.includes('luxury') || pkgText.includes('audi') || pkgText.includes('cabriolet') || pkgText.includes('convertible') || pkgText.includes('5-star') || pkgText.includes('5★') || pkgText.includes('w goa') || pkgText.includes('marriott') || normalizePrice(pkg.price) >= 25000;
    }
    if (t.includes('beach') || t.includes('leisure')) {
      return pkgText.includes('beach') || pkgText.includes('leisure') || pkgText.includes('relax') || pkgText.includes('resort') || pkgText.includes('shack') || pkgText.includes('calangute') || pkgText.includes('candolim');
    }
    if (t === 'self drive') {
      return (pkg.package_type || '').toLowerCase().includes('self drive') || !!pkg.car_included || !!pkg.self_drive_included;
    }
    return pkgText.includes(t);
  };

  const checkDurationMatch = (pkg, durLabel) => {
    const nights = getPackageNights(pkg);
    const days = nights + 1;
    const cleanDur = durLabel.replace('–', '-');
    if (cleanDur.includes('1-3')) {
      return days <= 3 || nights <= 2;
    }
    if (cleanDur.includes('4-6')) {
      return (days >= 4 && days <= 6) || (nights >= 3 && nights <= 5);
    }
    if (cleanDur.includes('7+')) {
      return days >= 7 || nights >= 6;
    }
    return true;
  };

  const checkInclusionMatch = (pkg, incLabel) => {
    const inc = incLabel.toLowerCase();
    if (inc.includes('flight')) {
      return hasFlight(pkg);
    }
    if (inc.includes('cab') || inc.includes('car') || inc.includes('drive')) {
      return !!pkg.car_included || !!pkg.self_drive_included || !!pkg.is_cab_customizable || !!pkg.pickup_drop_included;
    }
    if (inc.includes('transfer') || inc.includes('airport')) {
      return !!pkg.pickup_drop_included || !!pkg.car_included || (pkg.inclusions || '').toLowerCase().includes('transfer') || (pkg.description || '').toLowerCase().includes('airport');
    }
    if (inc.includes('guide')) {
      return !!pkg.guide_included || (pkg.inclusions || '').toLowerCase().includes('guide') || (pkg.description || '').toLowerCase().includes('guide');
    }
    if (inc.includes('meal') || inc.includes('food')) {
      const foodStr = (pkg.food_included || pkg.meals_included || '').toLowerCase();
      return !!pkg.food_included || !!pkg.meals_included || (foodStr && !foodStr.includes('no meal'));
    }
    return true;
  };

  const checkActivityMatch = (pkg, act) => {
    const actLower = act.toLowerCase();
    const pkgText = `${pkg.name || ''} ${pkg.tag || ''} ${pkg.category || ''} ${pkg.description || ''} ${pkg.places_included || ''} ${pkg.inclusions || ''}`.toLowerCase();

    if (actLower.includes('water sports')) {
      return pkgText.includes('water sport') || pkgText.includes('watersport') || pkgText.includes('parasail') || pkgText.includes('banana') || pkgText.includes('jet ski') || pkgText.includes('scooter') || pkgText.includes('adventure');
    }
    if (actLower.includes('cruise') || actLower.includes('mandovi')) {
      return pkgText.includes('cruise') || pkgText.includes('mandovi') || pkgText.includes('boat') || pkgText.includes('sunset');
    }
    if (actLower.includes('scuba') || actLower.includes('island')) {
      return pkgText.includes('scuba') || pkgText.includes('dive') || pkgText.includes('island') || pkgText.includes('grand island');
    }
    if (actLower.includes('north goa')) {
      return pkgText.includes('north goa') || pkgText.includes('calangute') || pkgText.includes('baga') || pkgText.includes('aguada') || pkgText.includes('anjuna') || pkgText.includes('vagator');
    }
    if (actLower.includes('south goa')) {
      return pkgText.includes('south goa') || pkgText.includes('old goa') || pkgText.includes('basilica') || pkgText.includes('mangeshi') || pkgText.includes('miramar') || pkgText.includes('dona paula');
    }
    if (actLower.includes('dudhsagar') || actLower.includes('waterfall')) {
      return pkgText.includes('dudhsagar') || pkgText.includes('waterfall') || pkgText.includes('safari');
    }
    if (actLower.includes('club') || actLower.includes('nightlife')) {
      return pkgText.includes('club') || pkgText.includes('nightlife') || pkgText.includes('party') || pkgText.includes('casino') || pkgText.includes('tito');
    }
    return pkgText.includes(actLower);
  };

  const checkBudgetBasisMatch = (pkg, basis) => {
    const basisLower = basis.toLowerCase();
    const pkgText = `${pkg.name || ''} ${pkg.tag || ''} ${pkg.category || ''} ${pkg.package_type || ''} ${pkg.description || ''}`.toLowerCase();
    if (basisLower.includes('couple')) {
      return pkgText.includes('couple') || pkgText.includes('romantic') || pkgText.includes('honeymoon') || (pkg.tag || '').toLowerCase() === 'couple';
    }
    if (basisLower.includes('person')) {
      return !pkgText.includes('couple only') || pkgText.includes('person') || pkgText.includes('adult');
    }
    return true;
  };

  const checkMealMatch = (pkg, meal) => {
    const mealLower = meal.toLowerCase();
    const pkgText = `${pkg.food_included || ''} ${pkg.meals_included || ''} ${pkg.inclusions || ''} ${pkg.description || ''}`.toLowerCase();
    if (mealLower.includes('all meal')) {
      return pkgText.includes('all meal') || pkgText.includes('lunch & dinner') || pkgText.includes('full board') || pkgText.includes('apa');
    }
    if (mealLower.includes('breakfast')) {
      return !!pkg.food_included || !!pkg.meals_included || pkgText.includes('breakfast') || pkgText.includes('b/f') || pkgText.includes('cpa') || pkgText.includes('meal');
    }
    return true;
  };

  // Filter packages based on all active criteria
  const filteredPackages = useMemo(() => {
    return displayPackages.filter(pkg => {
      const pkgPrice = normalizePrice(pkg.price);

      // 1. Destination / Search query matching
      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' ||
                          (pkg.name && pkg.name.toLowerCase().includes(q)) || 
                          (pkg.description && pkg.description.toLowerCase().includes(q)) ||
                          (pkg.destination && pkg.destination.toLowerCase().includes(q)) ||
                          (pkg.places_included && pkg.places_included.toLowerCase().includes(q)) ||
                          (pkg.location && pkg.location.toLowerCase().includes(q)) ||
                          (pkg.tag && pkg.tag.toLowerCase().includes(q)) ||
                          (pkg.package_type && pkg.package_type.toLowerCase().includes(q)) ||
                          (pkg.category && pkg.category.toLowerCase().includes(q));

      if (!searchMatch) return false;

      // 2. Top Tab theme filter (if not ALL PACKAGES)
      if (activeTab !== 'ALL PACKAGES') {
        const tagUpper = (pkg.tag || '').toUpperCase();
        const typeUpper = (pkg.package_type || '').toUpperCase();
        const catUpper = (pkg.category || '').toUpperCase();
        const nameUpper = (pkg.name || '').toUpperCase();
        const tabMatch = tagUpper.includes(activeTab) || typeUpper.includes(activeTab) || catUpper.includes(activeTab) || nameUpper.includes(activeTab);
        if (!tabMatch) return false;
      }

      // 3. Price Ranges filter (OR logic: matches if price falls in any selected range)
      if (activePriceRanges.length > 0) {
        const matchesPrice = activePriceRanges.some(rangeId => checkPriceRange(pkgPrice, rangeId));
        if (!matchesPrice) return false;
      }

      // 4. Hotel Stars filter (OR logic: matches if hotel fits any selected star category)
      if (activeHotelStars.length > 0) {
        const matchesStars = activeHotelStars.some(starId => checkHotelStar(pkg, starId));
        if (!matchesStars) return false;
      }

      // 5. Trip Theme / Types filter (OR logic: matches if package fits any selected theme)
      if (activeTripTypes.length > 0) {
        const matchesTheme = activeTripTypes.some(theme => checkThemeMatch(pkg, theme));
        if (!matchesTheme) return false;
      }

      // 6. Duration filter (OR logic)
      if (activeDurations.length > 0) {
        const matchesDur = activeDurations.some(dur => checkDurationMatch(pkg, dur));
        if (!matchesDur) return false;
      }

      // 7. Inclusions filter (AND logic: package must include all selected inclusions)
      if (activeInclusions.length > 0) {
        const matchesIncs = activeInclusions.every(inc => checkInclusionMatch(pkg, inc));
        if (!matchesIncs) return false;
      }

      // 8. Activities filter (OR logic)
      if (activeActivities.length > 0) {
        const matchesAct = activeActivities.some(act => checkActivityMatch(pkg, act));
        if (!matchesAct) return false;
      }

      // 9. Budget Basis filter (OR logic)
      if (activeBudgetBasis.length > 0) {
        const matchesBasis = activeBudgetBasis.some(basis => checkBudgetBasisMatch(pkg, basis));
        if (!matchesBasis) return false;
      }

      // 10. Meals filter (OR logic)
      if (activeMeals.length > 0) {
        const matchesMeal = activeMeals.some(meal => checkMealMatch(pkg, meal));
        if (!matchesMeal) return false;
      }

      return true;
    });
  }, [displayPackages, searchQuery, activeTab, activePriceRanges, activeHotelStars, activeTripTypes, activeDurations, activeInclusions, activeActivities, activeBudgetBasis, activeMeals]);

  // Handler to remove a specific filter
  const removeFilter = (type, value) => {
    if (!setAppliedFilters) return;
    const current = { ...appliedFilters };
    if (type === 'priceRanges') {
      current.priceRanges = (current.priceRanges || []).filter(v => v !== value);
    } else if (type === 'hotelStars') {
      current.hotelStars = (current.hotelStars || []).filter(v => v !== value);
    } else if (type === 'tripTypes') {
      current.tripTypes = (current.tripTypes || []).filter(v => v !== value);
    } else if (type === 'durations') {
      current.durations = (current.durations || []).filter(v => v !== value);
    } else if (type === 'inclusions') {
      current.inclusions = (current.inclusions || []).filter(v => v !== value);
    } else if (type === 'packageActivities') {
      current.packageActivities = (current.packageActivities || []).filter(v => v !== value);
    } else if (type === 'packageBudgetBasis') {
      current.packageBudgetBasis = (current.packageBudgetBasis || []).filter(v => v !== value);
    } else if (type === 'packageMeals') {
      current.packageMeals = (current.packageMeals || []).filter(v => v !== value);
    }
    setAppliedFilters(current);
  };

  const handleClearAllFilters = () => {
    setActiveTab('ALL PACKAGES');
    if (setAppliedFilters) {
      setAppliedFilters({
        priceRanges: [],
        hotelStars: [],
        tripTypes: [],
        durations: [],
        inclusions: [],
        packageActivities: [],
        packageBudgetBasis: [],
        packageMeals: []
      });
    }
    if (onClearSearch) onClearSearch();
  };

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '80vh' }}>
      
      {/* TOP TABS BAR */}
      <div className="d-flex align-items-center mb-3 border-bottom pb-2">
        <h4 className="fw-bold text-dark mb-0 me-4 d-flex align-items-center gap-2">
          <Sparkles size={20} className="text-primary" /> Holiday Packages
        </h4>
        <div className="d-flex gap-4 overflow-auto no-scrollbar py-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              type="button"
              className={`btn btn-link text-decoration-none fw-bold p-0 position-relative tab-mmt ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize: '14px', whiteSpace: 'nowrap' }}
            >
              {tab.label} <span className="text-muted fw-normal">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE FILTERS CHIPS BAR */}
      {totalActiveFiltersCount > 0 && (
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 p-3 bg-light rounded-4 border">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="small text-muted fw-bold d-flex align-items-center gap-1">
              <SlidersHorizontal size={14} className="text-primary" /> Active Filters:
            </span>
            
            {activeTab !== 'ALL PACKAGES' && (
              <span className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                Theme: {activeTab}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => setActiveTab('ALL PACKAGES')}></button>
              </span>
            )}

            {activePriceRanges.map(pr => (
              <span key={pr} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                Budget: {pr.replace('< 15000', '< ₹15k').replace('15000-25000', '₹15k - ₹25k').replace('> 25000', '> ₹25k')}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('priceRanges', pr)}></button>
              </span>
            ))}

            {activeHotelStars.map(st => (
              <span key={st} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                Hotel: {st}★
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('hotelStars', st)}></button>
              </span>
            ))}

            {activeTripTypes.map(tt => (
              <span key={tt} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                Theme: {tt}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('tripTypes', tt)}></button>
              </span>
            ))}

            {activeDurations.map(dur => (
              <span key={dur} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                Duration: {dur}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('durations', dur)}></button>
              </span>
            ))}

            {activeInclusions.map(inc => (
              <span key={inc} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                {inc}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('inclusions', inc)}></button>
              </span>
            ))}

            {activeActivities.map(act => (
              <span key={act} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                {act}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('packageActivities', act)}></button>
              </span>
            ))}

            {activeBudgetBasis.map(basis => (
              <span key={basis} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                {basis}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('packageBudgetBasis', basis)}></button>
              </span>
            ))}

            {activeMeals.map(meal => (
              <span key={meal} className="badge bg-white text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs">
                {meal}
                <button type="button" className="btn-close btn-close-xs ms-1" style={{ fontSize: '9px' }} onClick={() => removeFilter('packageMeals', meal)}></button>
              </span>
            ))}
          </div>

          <button 
            type="button" 
            className="btn btn-sm btn-link text-danger fw-bold p-0 text-decoration-none d-flex align-items-center gap-1"
            onClick={handleClearAllFilters}
          >
            <RotateCcw size={13} /> Clear All Filters
          </button>
        </div>
      )}

      {/* RESULTS COUNT & STATUS */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small fw-semibold">
          Showing <strong className="text-dark">{filteredPackages.length}</strong> package{filteredPackages.length !== 1 ? 's' : ''}
          {searchQuery && <span> matching "<strong className="text-primary">{searchQuery}</strong>"</span>}
        </span>
      </div>

      {/* FULL WIDTH RESULTS GRID OR CLEAN EMPTY STATE */}
      <div className="row g-4 mb-5">
        {filteredPackages.length === 0 ? (
          <div className="col-12">
            <div className="text-center py-5 px-3 bg-white rounded-4 border shadow-sm my-4">
              <div className="d-inline-flex p-4 rounded-circle bg-light text-muted mb-3">
                <SlidersHorizontal size={36} className="text-muted opacity-75" />
              </div>
              <h4 className="fw-bold text-dark mb-2">No Packages Found Matching Your Filters</h4>
              <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '480px' }}>
                We couldn't find any packages matching all your active filter criteria. Try clearing some filters or searching for another theme or destination.
              </p>
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                style={{ background: '#FF6333', borderColor: '#FF6333' }}
                onClick={handleClearAllFilters}
              >
                <RotateCcw size={15} /> Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            let dynamicDuration = pkg.duration || '3N/4D';
            const nights = getPackageNights(pkg);
            if (nights > 0) {
              dynamicDuration = `${nights}N/${nights+1}D`;
            }
            
            return (
              <div key={pkg.id} className="col-12">
                <div className="premium-card bg-white rounded-4 overflow-hidden shadow-sm border position-relative transition-all hover-lift" style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                  <div className="row g-0">
                    {/* Image Section */}
                    <div 
                      className="col-md-4 position-relative cursor-pointer overflow-hidden" 
                      style={{ minHeight: '260px', cursor: 'pointer' }}
                      onClick={() => onViewDetails(pkg)}
                      title={`View details of ${pkg.name}`}
                    >
                      <img 
                        src={pkg.imageUrl || pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'} 
                        alt={pkg.name} 
                        className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'; }}
                      />
                      {pkg.tag && (
                        <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill shadow-sm" style={{ backdropFilter: 'blur(4px)', fontSize: '11px', letterSpacing: '0.5px', zIndex: 2 }}>
                          ✨ {pkg.tag}
                        </span>
                      )}
                      {(pkg.hotel_category || pkg.hotel?.category) && (
                        <span className="badge bg-white bg-opacity-95 text-dark fw-bold position-absolute top-0 end-0 m-3 px-2.5 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1" style={{ fontSize: '11px', zIndex: 2 }}>
                          ⭐ {pkg.hotel_category || pkg.hotel?.category}
                        </span>
                      )}
                      <div className="position-absolute bottom-0 start-0 w-100 p-3 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', zIndex: 2 }}>
                        <span className="badge bg-primary rounded-pill px-2.5 py-1 small fw-bold shadow-xs">{dynamicDuration}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="col-md-8 p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h4 className="fw-bold text-dark mb-0 hover-primary cursor-pointer" onClick={() => onViewDetails(pkg)} title={`View details of ${pkg.name}`}>
                            {pkg.name}
                          </h4>
                          <div className="text-end">
                            <span className="text-muted small d-block">Starting from</span>
                            <h3 className="text-primary fw-black mb-0">₹{Number(pkg.price).toLocaleString('en-IN')}</h3>
                            <span className="text-muted" style={{ fontSize: '10px' }}>Per Person</span>
                          </div>
                        </div>

                        {/* Rating and Destination */}
                        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-2.5">
                          <span className="d-flex align-items-center gap-1 text-dark fw-bold">
                            <span className="text-warning">★</span> 4.9 <span className="text-muted fw-normal" style={{ fontSize: '11px' }}>(142 Reviews)</span>
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <MapPin size={13} className="text-danger" /> {pkg.places_included || pkg.destination || 'Goa, India'}
                          </span>
                        </div>

                        <p className="text-muted small line-clamp-2 mb-3">
                          {pkg.description || 'Experience the best of Goa with premium stays, customizable travel itinerary, and scenic locations.'}
                        </p>

                        {/* Structured Service Summaries */}
                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="row g-2" style={{ fontSize: '11.5px' }}>
                            <div className="col-12 col-md-6">
                              <span className="text-muted d-block" style={{ fontSize: '10px' }}>HOTEL STAY:</span>
                              <strong className="text-dark d-block text-truncate" title={pkg.hotel?.name || pkg.hotel_included || 'Luxury Resort Stay'}>
                                🏨 {pkg.hotel?.name || pkg.hotel_included || 'Luxury Beach Resort'} {pkg.hotel_category ? `(${pkg.hotel_category})` : ''}
                              </strong>
                            </div>

                            <div className="col-12 col-md-6">
                              <span className="text-muted d-block" style={{ fontSize: '10px' }}>VEHICLE:</span>
                              <strong className="text-dark d-block text-truncate">
                                🚗 {pkg.vehicle?.name || pkg.car_included || (pkg.package_type === 'Self Drive Package' ? 'Self Drive Vehicle' : 'Tour Vehicle')} (AC)
                              </strong>
                            </div>

                            <div className="col-12 col-md-6">
                              <span className="text-muted d-block" style={{ fontSize: '10px' }}>MEAL PLAN:</span>
                              <span className="text-success fw-bold d-block text-truncate">
                                🍽️ {pkg.hotel?.meal_plan || pkg.food_included || 'Daily Buffet Breakfast Included'}
                              </span>
                            </div>

                            <div className="col-12 col-md-6">
                              <span className="text-muted d-block" style={{ fontSize: '10px' }}>DRIVER SERVICE:</span>
                              <span className={`fw-bold d-block text-truncate ${Boolean(pkg.driver_included || pkg.driver?.included) ? 'text-primary' : 'text-muted'}`}>
                                {Boolean(pkg.driver_included || pkg.driver?.included) 
                                  ? `🧑‍✈️ ${pkg.driver?.type === 'full_day' ? 'Full Day Chauffeur' : (pkg.driver_type || 'Chauffeur Included')}`
                                  : 'Driver: Not Included'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
                        <span className="badge bg-light text-secondary border px-2.5 py-1">
                          ✓ Guaranteed Fixed Package
                        </span>
                        <div>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm px-4 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }}
                            onClick={(e) => {
                              if (document.activeElement && typeof document.activeElement.blur === 'function') {
                                document.activeElement.blur();
                              }
                              onViewDetails(pkg);
                            }}
                            title={`View full details & book ${pkg.name}`}
                          >
                            <span>View Details &amp; Book</span>
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Published Customer Reviews (Strictly 5★ to 1★) */}
      <CustomerReviewsSection className="mt-5 rounded-4 overflow-hidden shadow-sm" />
    </div>
  );
}
