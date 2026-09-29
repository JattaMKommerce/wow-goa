/**
 * Canonical Pricing & Markup Helper for WOW GOA
 * Provides consistent package and vehicle pricing calculation across Listing, Details, Customization, and Checkout.
 */

export function getMarkupPrice(basePrice, vendorId, entityType, itemId = 'all', markups = [], targetChannel = 'b2c') {
  if (!markups || !Array.isArray(markups) || markups.length === 0) {
    return Number(basePrice) || 0;
  }
  const numBase = Number(basePrice) || 0;
  if (numBase <= 0) return 0;
  
  const isRuleActive = (r) => {
    if (!r) return false;
    if (r.is_active === 0 || r.is_active === false || r.status === 'Inactive') return false;
    return true;
  };

  const matchChannel = (r) => {
    if (!r) return false;
    const ch = String(r.target_channel || 'all').toLowerCase().trim();
    if (!ch || ch === 'all') return true;
    const reqCh = String(targetChannel || 'b2c').toLowerCase().trim();
    return ch === reqCh;
  };

  // Support vehicle umbrella ('vehicle' covers car, cars, bike, bikes, scooter, etc.)
  const matchType = (r) => {
    if (!r) return false;
    const ruleType = String(r.service_type || r.entity_type || '').toLowerCase().trim();
    const reqType = String(entityType || '').toLowerCase().trim();
    if (!ruleType || ruleType === 'all') return true;
    
    // Direct match (ignoring trailing 's')
    if (ruleType === reqType || ruleType.replace(/s$/, '') === reqType.replace(/s$/, '')) return true;

    // Vehicle umbrella: covers cars, bikes, vehicles, scooters
    const isVehicleReq = ['car', 'cars', 'bike', 'bikes', 'vehicle', 'vehicles', 'scooter', 'scooters'].includes(reqType);
    const isVehicleRule = ['vehicle', 'vehicles', 'car', 'cars', 'bike', 'bikes'].includes(ruleType);
    if (isVehicleReq && isVehicleRule) return true;

    // Activity umbrella
    const isActReq = ['activity', 'activities', 'sightseeing'].includes(reqType);
    const isActRule = ['activity', 'activities', 'sightseeing'].includes(ruleType);
    if (isActReq && isActRule) return true;

    return false;
  };

  const vIdStr = String(vendorId || '').trim();

  // 1. Item-specific markup for this vendor
  let applicable = markups.find(m => isRuleActive(m) && matchChannel(m) && matchType(m) && String(m.vendor_id) === vIdStr && String(m.item_id) === String(itemId) && m.item_id !== 'all');
  
  // 2. Specific service markup for this vendor (item_id = 'all' or empty)
  if (!applicable) {
    applicable = markups.find(m => isRuleActive(m) && matchChannel(m) && matchType(m) && String(m.vendor_id) === vIdStr && (m.item_id === 'all' || !m.item_id) && m.service_type !== 'all' && m.entity_type !== 'all');
  }

  // 3. Global service ('all') markup for this vendor
  if (!applicable) {
    applicable = markups.find(m => isRuleActive(m) && matchChannel(m) && String(m.vendor_id) === vIdStr && (m.service_type === 'all' || m.entity_type === 'all' || !m.service_type));
  }
  
  // 4. Global markup for all vendors on this specific service
  if (!applicable) {
    applicable = markups.find(m => isRuleActive(m) && matchChannel(m) && matchType(m) && (m.vendor_id === 'all' || !m.vendor_id || m.vendor_id === 'global') && (m.item_id === 'all' || !m.item_id) && m.service_type !== 'all' && m.entity_type !== 'all');
  }

  // 5. Global markup for all vendors on all services
  if (!applicable) {
    applicable = markups.find(m => isRuleActive(m) && matchChannel(m) && (m.vendor_id === 'all' || !m.vendor_id || m.vendor_id === 'global') && (m.service_type === 'all' || m.entity_type === 'all' || !m.service_type));
  }

  if (applicable) {
    const mType = applicable.markup_type || (applicable.amount > 0 ? 'fixed' : 'percentage');
    const val = parseFloat(applicable.markup_value !== undefined ? applicable.markup_value : (mType === 'percentage' ? applicable.percentage : applicable.amount));
    if (!isNaN(val) && val > 0) {
      if (mType === 'flat' || mType === 'fixed') {
        return Math.round(numBase + val);
      } else if (mType === 'percentage') {
        return Math.round(numBase + (numBase * (val / 100)));
      }
    }
  }
  return numBase;
}

/**
 * Resolves consistent package base price and flight price with markup.
 * Idempotent: Never applies markup twice if already marked up.
 */
export function resolvePackagePrices(pkg, markups = []) {
  if (!pkg) return { price: 0, price_with_flight: null, originalPrice: 0, is_markup_applied: true };

  const rawPrice = pkg.originalPrice !== undefined ? Number(pkg.originalPrice) : (Number(pkg.price) || 0);
  const rawFlightPrice = pkg.originalFlightPrice !== undefined 
    ? Number(pkg.originalFlightPrice) 
    : (pkg.price_with_flight ? Number(pkg.price_with_flight) : null);

  const finalPrice = getMarkupPrice(rawPrice, pkg.vendor_id || 'global', 'packages', pkg.id, markups);
  const finalFlightPrice = rawFlightPrice !== null 
    ? getMarkupPrice(rawFlightPrice, pkg.vendor_id || 'global', 'packages', pkg.id, markups) 
    : null;

  return {
    price: Math.round(finalPrice),
    price_with_flight: finalFlightPrice !== null ? Math.round(finalFlightPrice) : null,
    originalPrice: rawPrice,
    originalFlightPrice: rawFlightPrice,
    is_markup_applied: true
  };
}

/**
 * Identifies the authentic baseline vehicle included in a Self Drive package
 * based on `pkg.car_included` or package details.
 */
export function findBaselineVehicle(pkg, vehicles = []) {
  if (!pkg || !pkg.car_included || !Array.isArray(vehicles) || vehicles.length === 0) {
    return null;
  }
  const target = String(pkg.car_included).toLowerCase().trim();
  if (!target) return null;

  // 1. Exact or substring match on vehicle name
  let matched = vehicles.find(v => {
    const vName = (v.name || '').toLowerCase().trim();
    return vName === target || vName.includes(target) || target.includes(vName);
  });

  // 2. Word-level token match (e.g. "Thar", "Creta", "Audi")
  if (!matched) {
    const keywords = target.split(/[\s/,-]+/).filter(w => w.length >= 3 && !['self', 'drive', 'with', 'cars', 'car'].includes(w));
    if (keywords.length > 0) {
      matched = vehicles.find(v => {
        const vName = (v.name || '').toLowerCase();
        return keywords.some(kw => vName.includes(kw));
      });
    }
  }

  return matched || null;
}

/**
 * Calculates genuine upgrade difference for Self Drive vehicles.
 * Baseline vehicle included in the package costs ₹0 upgrade.
 * Only higher-priced upgrades charge the difference.
 */
export function calculateVehicleUpgradeCost(selectedVehicle, baselineVehicle, isSelfDrivePackage) {
  if (!selectedVehicle) return 0;
  if (!isSelfDrivePackage) {
    // If it's a regular tour package and user optionally adds self-drive
    return Number(selectedVehicle.price) || 0;
  }
  if (!baselineVehicle) {
    // Package includes a generic vehicle, default selected vehicle is included at no extra cost
    return 0;
  }
  if (String(selectedVehicle.id) === String(baselineVehicle.id)) {
    return 0;
  }
  const diff = (Number(selectedVehicle.price) || 0) - (Number(baselineVehicle.price) || 0);
  return Math.max(0, diff);
}
