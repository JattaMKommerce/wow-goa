// Curated authentic flight & airline photography
export const AIRLINE_IMAGE_MAP = {
  indigo: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1200&q=80'
  ],
  airindia: [
    'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80'
  ],
  akasa: [
    'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1200&q=80'
  ],
  spicejet: [
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
  ],
  vistara: [
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80'
  ]
};

export const DEFAULT_FLIGHT_IMAGES = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80'
];

export const isFlightItem = (item, type = '') => {
  if (!item) return String(type || '').toLowerCase().includes('flight');
  const t = String(type || item.type || item.service_type || item.category || '').toLowerCase();
  if (t.includes('flight')) return true;
  if (item.flight_number || item.flight || item.airline) return true;
  if (item.departure_time && item.arrival_time) return true;
  if (item.from_loc || item.to_loc) return true;
  const name = String(item.name || item.title || item.item_name || '').toLowerCase();
  if (name.includes('flight') || name.includes('indigo') || name.includes('air india') || name.includes('akasa') || name.includes('spicejet') || name.includes('vistara')) {
    return true;
  }
  return false;
};

export const getFlightDefaultImage = (airlineName = '') => {
  const norm = String(airlineName || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, imgs] of Object.entries(AIRLINE_IMAGE_MAP)) {
    if (norm.includes(key)) return imgs[0];
  }
  return DEFAULT_FLIGHT_IMAGES[0];
};

export const getFlightImages = (airlineName = '') => {
  const norm = String(airlineName || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, imgs] of Object.entries(AIRLINE_IMAGE_MAP)) {
    if (norm.includes(key)) return imgs;
  }
  return DEFAULT_FLIGHT_IMAGES;
};

// Check if a URL belongs to known vehicle/hotel/package fallbacks
export const isUnrelatedInventoryImage = (url) => {
  if (!url || typeof url !== 'string') return true;
  const s = url.toLowerCase();
  // Known vehicle fallbacks:
  if (s.includes('1549399542') || s.includes('1558981403') || s.includes('1568772585') || s.includes('1533473359') || s.includes('1503376780')) return true;
  // Known hotel fallbacks:
  if (s.includes('1566073771') || s.includes('1582719478') || s.includes('1540555700')) return true;
  // Known package/beach fallbacks:
  if (s.includes('1512343879') || s.includes('1507525428')) return true;
  return false;
};

export const normalizeUrl = (u) => {
  if (typeof u !== 'string') return u;
  let s = u.trim();
  if (s.startsWith('http://localhost:8000/uploads/')) {
    return s.replace('http://localhost:8000/uploads/', '/backend/uploads/');
  }
  if (s.startsWith('http://localhost/tripgalileo/backend/uploads/')) {
    return s.replace('http://localhost/tripgalileo/backend/uploads/', '/backend/uploads/');
  }
  return s;
};

export function getBookingDisplayImages(booking, allCars = [], allBikes = [], allPackages = [], allHotels = [], allFlights = []) {
  if (!booking) {
    return ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'];
  }

  const isFlight = isFlightItem(booking, booking?.type);

  // ── STRICT ISOLATION FOR FLIGHT BOOKINGS ──
  // A flight booking must NEVER display images of cars, bikes, hotels, or holiday packages.
  if (isFlight) {
    const flightImages = [];
    const addFlightImg = (img) => {
      if (!img) return;
      if (typeof img === 'string' && img.trim().length > 5 && !img.includes('undefined') && !img.includes('null')) {
        const clean = normalizeUrl(img.trim());
        if (!isUnrelatedInventoryImage(clean) && !flightImages.includes(clean)) {
          flightImages.push(clean);
        }
      } else if (Array.isArray(img)) {
        img.forEach(addFlightImg);
      } else if (typeof img === 'object' && img !== null) {
        addFlightImg(img.url || img.src || img.image || null);
      }
    };

    addFlightImg(booking.logo);
    addFlightImg(booking.airline_logo);
    addFlightImg(booking.airline_image);
    addFlightImg(booking.flight_image);
    addFlightImg(booking.image);
    addFlightImg(booking.image_url);

    const itemId = String(booking.item_id || booking.id || '').toLowerCase().trim();
    const itemName = String(booking.item_name || booking.name || booking.airline || '').toLowerCase().trim();

    const matchedFlight = (allFlights || []).find(f => 
      (f.id && String(f.id).toLowerCase().trim() === itemId) ||
      (f.flight_number && String(f.flight_number).toLowerCase().trim() === itemId) ||
      (f.flight_number && itemName.includes(String(f.flight_number).toLowerCase().trim())) ||
      (f.airline && itemName.includes(String(f.airline).toLowerCase().trim()))
    );

    if (matchedFlight) {
      addFlightImg(matchedFlight.logo);
      addFlightImg(matchedFlight.airline_logo);
      addFlightImg(matchedFlight.airline_image);
      addFlightImg(matchedFlight.image);
    }

    if (flightImages.length > 0) {
      return flightImages;
    }

    return getFlightImages(booking.airline || booking.item_name || itemName);
  }

  const images = [];

  const addImage = (img) => {
    if (!img) return;
    if (typeof img === 'string' && img.trim().length > 0) {
      const clean = normalizeUrl(img);
      if (!images.includes(clean)) images.push(clean);
    } else if (Array.isArray(img)) {
      img.forEach(addImage);
    } else if (typeof img === 'object' && img !== null) {
      if (img.url) addImage(img.url);
      else if (img.src) addImage(img.src);
      else if (img.image) addImage(img.image);
    }
  };

  // 1. Direct explicit images on booking object
  addImage(booking.vehicle_image);
  addImage(booking.image);
  addImage(booking.image_url);
  addImage(booking.hotel_image);
  addImage(booking.images);

  if (booking.images_json) {
    try {
      const parsed = typeof booking.images_json === 'string' ? JSON.parse(booking.images_json) : booking.images_json;
      addImage(parsed);
    } catch (e) {}
  }

  if (booking.documents_json) {
    try {
      const parsed = typeof booking.documents_json === 'string' ? JSON.parse(booking.documents_json) : booking.documents_json;
      addImage(parsed);
    } catch (e) {}
  }

  // 2. Extract from booking customizations
  if (booking.customizations) {
    try {
      const custom = typeof booking.customizations === 'string' ? JSON.parse(booking.customizations) : booking.customizations;
      if (custom) {
        if (custom.selectedSelfDriveVehicle) {
          const matchedCar = (allCars || []).find(c => c.id === custom.selectedSelfDriveVehicle);
          if (matchedCar) {
            addImage(matchedCar.image);
            addImage(matchedCar.image_url);
            if (matchedCar.images_json) {
              try { addImage(JSON.parse(matchedCar.images_json)); } catch (e) { addImage(matchedCar.images_json); }
            }
          }
        }
        if (custom.selectedHotels && typeof custom.selectedHotels === 'object') {
          Object.values(custom.selectedHotels).forEach(h => {
            if (h && typeof h === 'object') {
              addImage(h.image || h.image_url || h.images);
            }
          });
        }
      }
    } catch (e) {}
  }

  const itemId = String(booking.item_id || '').toLowerCase().trim();
  const itemName = String(booking.item_name || booking.name || booking.package_name || booking.vehicle_name || '').toLowerCase().trim();

  // 3. Search in bikes list
  const matchedBike = (allBikes || []).find(b => 
    (b.id && String(b.id).toLowerCase().trim() === itemId) ||
    (b.name && String(b.name).toLowerCase().trim() === itemName) ||
    (itemName && b.name && (itemName.includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(itemName)))
  );
  if (matchedBike) {
    addImage(matchedBike.image);
    addImage(matchedBike.image_url);
    if (matchedBike.images_json) {
      try { addImage(JSON.parse(matchedBike.images_json)); } catch (e) { addImage(matchedBike.images_json); }
    }
  }

  // 4. Search in cars list
  const matchedCar = (allCars || []).find(c => 
    (c.id && String(c.id).toLowerCase().trim() === itemId) ||
    (c.name && String(c.name).toLowerCase().trim() === itemName) ||
    (itemName && c.name && (itemName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(itemName)))
  );
  if (matchedCar) {
    addImage(matchedCar.image);
    addImage(matchedCar.image_url);
    if (matchedCar.images_json) {
      try { addImage(JSON.parse(matchedCar.images_json)); } catch (e) { addImage(matchedCar.images_json); }
    }
  }

  // 5. Search in packages list
  const matchedPkg = (allPackages || []).find(p => 
    (p.id && String(p.id).toLowerCase().trim() === itemId) ||
    (p.name && String(p.name).toLowerCase().trim() === itemName) ||
    (itemName && p.name && (itemName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(itemName)))
  );
  if (matchedPkg) {
    addImage(matchedPkg.image);
    addImage(matchedPkg.image_url);
    addImage(matchedPkg.imageUrl);
    if (matchedPkg.images_json) {
      try { addImage(JSON.parse(matchedPkg.images_json)); } catch (e) { addImage(matchedPkg.images_json); }
    }
  }

  // 6. Search in hotels list
  const matchedHotel = (allHotels || []).find(h => 
    (h.id && String(h.id).toLowerCase().trim() === itemId) ||
    (h.name && String(h.name).toLowerCase().trim() === itemName)
  );
  if (matchedHotel) {
    addImage(matchedHotel.image);
    addImage(matchedHotel.image_url);
    if (matchedHotel.images_json) {
      try { addImage(JSON.parse(matchedHotel.images_json)); } catch (e) { addImage(matchedHotel.images_json); }
    }
  }

  // Filter out invalid or broken URLs
  const validImages = images.filter(img => typeof img === 'string' && img.length > 5 && !img.includes('undefined') && !img.includes('null'));

  if (validImages.length > 0) {
    return Array.from(new Set(validImages));
  }

  // Fallback images based on keyword
  if (itemName.includes('gt') || itemName.includes('activa') || itemName.includes('ninja') || itemName.includes('jupiter') || itemName.includes('bullet') || itemName.includes('scooter') || itemName.includes('bike') || itemName.includes('himalayan') || itemName.includes('pulsar') || itemName.includes('r15')) {
    return [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80'
    ];
  }

  if (itemName.includes('swift') || itemName.includes('i20') || itemName.includes('creta') || itemName.includes('car') || itemName.includes('thar') || itemName.includes('defender') || itemName.includes('bmw') || itemName.includes('audi') || itemName.includes('mercedes') || itemName.includes('fortuner')) {
    return [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ];
  }

  return [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  ];
}

export function getBookingDisplayImage(booking, allCars = [], allBikes = [], allPackages = [], allHotels = [], allFlights = []) {
  const images = getBookingDisplayImages(booking, allCars, allBikes, allPackages, allHotels, allFlights);
  if (isFlightItem(booking, booking?.type)) {
    return images[0] || getFlightDefaultImage(booking?.airline || booking?.item_name);
  }
  return images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
}

/**
 * Resolves all images for an individual inventory item (hotel, vehicle, package, flight)
 * for rich display in ImageCarousel and detail/booking modals across D2C and B2B portals.
 */
export function resolveItemImages(item, type = '') {
  const isFlight = isFlightItem(item, type);

  if (!item) {
    return isFlight ? DEFAULT_FLIGHT_IMAGES : ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80'];
  }

  const list = [];
  const add = (img) => {
    if (!img) return;
    if (typeof img === 'string' && img.trim().length > 5 && !img.includes('undefined') && !img.includes('null')) {
      const trimmed = normalizeUrl(img.trim());
      // For flight items, discard any vehicle, hotel, or package fallback images
      if (isFlight && isUnrelatedInventoryImage(trimmed)) {
        return;
      }
      if (!list.includes(trimmed)) list.push(trimmed);
    } else if (Array.isArray(img)) {
      img.forEach(add);
    } else if (typeof img === 'object' && img !== null) {
      add(img.url || img.src || img.image || null);
    }
  };

  if (isFlight) {
    add(item.logo);
    add(item.airline_logo);
    add(item.airline_image);
    add(item.flight_image);
  }

  add(item.image);
  add(item.image_url);
  add(item.imageUrl);
  add(item.images);
  add(item.gallery);

  if (item.images_json) {
    try {
      const parsed = typeof item.images_json === 'string' ? JSON.parse(item.images_json) : item.images_json;
      add(parsed);
    } catch (e) {}
  }

  if (item.documents_json) {
    try {
      const parsed = typeof item.documents_json === 'string' ? JSON.parse(item.documents_json) : item.documents_json;
      add(parsed);
    } catch (e) {}
  }

  // If this item has authentic verified images, return them
  if (list.length > 0) {
    return list;
  }

  // ── STRICT ISOLATION FOR FLIGHT ITEMS ──
  // A flight item must NEVER fall through to hotel or vehicle images!
  if (isFlight) {
    return getFlightImages(item?.airline || item?.name || item?.airline_name || type);
  }

  // Fallbacks ONLY if the record has NO images at all in the database:
  const name = String(item.name || item.title || '').toLowerCase();
  const cat = String(item.category || type || '').toLowerCase();

  if (type === 'hotels' || item.stars || item.star_rating || name.includes('resort') || name.includes('hotel') || name.includes('inn') || name.includes('baga') || name.includes('beach') || name.includes('candolim') || name.includes('exotica')) {
    return [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
    ];
  } else if (cat.includes('bike') || cat.includes('scooter') || name.includes('ninja') || name.includes('activa') || name.includes('bullet') || name.includes('bike')) {
    return [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'
    ];
  } else if (name.includes('thar') || name.includes('suv') || name.includes('fortuner') || name.includes('defender') || name.includes('creta') || name.includes('ertiga')) {
    return [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
    ];
  } else if (type === 'packages' || type === 'trips' || name.includes('holiday') || name.includes('package') || name.includes('tour') || name.includes('trip')) {
    return [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ];
  } else {
    return [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'
    ];
  }
}
