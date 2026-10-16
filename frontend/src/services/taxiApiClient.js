// ============================================================================
// TAXI B2B UNIFIED API CLIENT
// Axios-compatible interface for Taxi B2B operations with live Django proxy
// and resilient offline fallback so all 8 operations tabs render smoothly.
// ============================================================================

const DJANGO_API_BASE = 'http://127.0.0.1:8000/api/';

const DEFAULT_VEHICLES = [
  {
    id: 1,
    registration_number: 'GA-03-Z-8899',
    make_model: 'Toyota Innova Crysta',
    category: 'SUV',
    status: 'ACTIVE',
    fuel_type: 'DIESEL',
    seating_capacity: 7,
    hourly_rate_inr: 450,
    per_km_rate_inr: 24,
    assigned_driver_name: 'Suresh Kamat',
    assigned_driver: 1,
    fitness_validity_date: '2027-04-15',
    puc_validity_date: '2026-11-20',
    insurance_validity_date: '2027-01-10',
    current_location: 'Candolim Hub, North Goa',
    health_score: 98,
    photo_front: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'
  },
  {
    id: 2,
    registration_number: 'GA-07-T-1240',
    make_model: 'Maruti Suzuki Dzire',
    category: 'SEDAN',
    status: 'ON_DUTY',
    fuel_type: 'PETROL',
    seating_capacity: 4,
    hourly_rate_inr: 350,
    per_km_rate_inr: 16,
    assigned_driver_name: 'Bikram Naik',
    assigned_driver: 2,
    fitness_validity_date: '2026-11-20',
    puc_validity_date: '2026-10-25',
    insurance_validity_date: '2027-03-14',
    current_location: 'Panjim Terminal',
    health_score: 94,
    photo_front: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800'
  },
  {
    id: 3,
    registration_number: 'GA-08-EV-4412',
    make_model: 'Tata Tigor EV',
    category: 'EV',
    status: 'ACTIVE',
    fuel_type: 'ELECTRIC',
    seating_capacity: 4,
    hourly_rate_inr: 380,
    per_km_rate_inr: 15,
    assigned_driver_name: 'Rahul Gaonkar',
    assigned_driver: 3,
    fitness_validity_date: '2027-08-10',
    puc_validity_date: '2027-08-10',
    insurance_validity_date: '2027-08-10',
    current_location: 'Mopa Airport Taxi Bay',
    health_score: 99,
    photo_front: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'
  },
  {
    id: 4,
    registration_number: 'GA-01-M-9021',
    make_model: 'Force Urbania Executive',
    category: 'VAN',
    status: 'MAINTENANCE',
    fuel_type: 'DIESEL',
    seating_capacity: 13,
    hourly_rate_inr: 800,
    per_km_rate_inr: 32,
    assigned_driver_name: 'Unassigned',
    assigned_driver: null,
    fitness_validity_date: '2026-10-30',
    puc_validity_date: '2026-10-15',
    insurance_validity_date: '2026-12-05',
    current_location: 'Apex Central Workshop, Verna',
    health_score: 76,
    photo_front: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'
  },
  {
    id: 5,
    registration_number: 'GA-03-L-0007',
    make_model: 'Mercedes-Benz E-Class',
    category: 'LUXURY',
    status: 'ACTIVE',
    fuel_type: 'PETROL',
    seating_capacity: 4,
    hourly_rate_inr: 1200,
    per_km_rate_inr: 45,
    assigned_driver_name: "Antonio D'Souza",
    assigned_driver: 4,
    fitness_validity_date: '2027-12-01',
    puc_validity_date: '2027-06-20',
    insurance_validity_date: '2027-12-01',
    current_location: 'Dabolim Airport Highway',
    health_score: 100,
    photo_front: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'
  }
];

const DEFAULT_DRIVERS = [
  {
    id: 1,
    full_name: 'Suresh Kamat',
    phone_number: '+91 98221 44510',
    badge_number: 'GA-TX-8841',
    license_number: 'DL-042018002931',
    police_verification_status: 'VERIFIED',
    status: 'ON_DUTY',
    rating: 4.9,
    trips_completed: 342,
    assigned_vehicle: 1,
    assigned_vehicle_reg: 'GA-03-Z-8899',
    assigned_vehicle_model: 'Toyota Innova Crysta',
    experience_years: 8,
    pcc_reference: 'PCC-GOA-2024-81',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
  },
  {
    id: 2,
    full_name: 'Bikram Naik',
    phone_number: '+91 94220 78129',
    badge_number: 'GA-TX-5510',
    license_number: 'DL-042016001192',
    police_verification_status: 'VERIFIED',
    status: 'ON_DUTY',
    rating: 4.85,
    trips_completed: 512,
    assigned_vehicle: 2,
    assigned_vehicle_reg: 'GA-07-T-1240',
    assigned_vehicle_model: 'Maruti Suzuki Dzire',
    experience_years: 11,
    pcc_reference: 'PCC-GOA-2023-14',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300'
  },
  {
    id: 3,
    full_name: 'Rahul Gaonkar',
    phone_number: '+91 99231 66201',
    badge_number: 'GA-TX-9920',
    license_number: 'DL-042021008741',
    police_verification_status: 'VERIFIED',
    status: 'ON_DUTY',
    rating: 4.95,
    trips_completed: 189,
    assigned_vehicle: 3,
    assigned_vehicle_reg: 'GA-08-EV-4412',
    assigned_vehicle_model: 'Tata Tigor EV',
    experience_years: 4,
    pcc_reference: 'PCC-GOA-2024-99',
    profile_photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300'
  },
  {
    id: 4,
    full_name: "Antonio D'Souza",
    phone_number: '+91 98812 30948',
    badge_number: 'GA-TX-1102',
    license_number: 'DL-042012004819',
    police_verification_status: 'VERIFIED',
    status: 'ON_DUTY',
    rating: 5.0,
    trips_completed: 870,
    assigned_vehicle: 5,
    assigned_vehicle_reg: 'GA-03-L-0007',
    assigned_vehicle_model: 'Mercedes-Benz E-Class',
    experience_years: 14,
    pcc_reference: 'PCC-GOA-2022-04',
    profile_photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300'
  },
  {
    id: 5,
    full_name: 'Mahesh Sawant',
    phone_number: '+91 88062 19485',
    badge_number: 'GA-TX-4409',
    license_number: 'DL-042023000512',
    police_verification_status: 'UNDER_REVIEW',
    status: 'OFF_DUTY',
    rating: 4.7,
    trips_completed: 45,
    assigned_vehicle: null,
    assigned_vehicle_reg: 'Unassigned',
    assigned_vehicle_model: '',
    experience_years: 2,
    pcc_reference: 'PCC-GOA-2025-PENDING',
    profile_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300'
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: 1,
    booking_reference: 'WG-TX-476903',
    passenger_name: 'Valued Goa Guest',
    passenger_phone: '+91 98221 90000',
    client: 1,
    client_name: 'Taj Exotica B2B Concierge',
    pickup_location: 'Manohar Intl Airport, Mopa (GOX)',
    dropoff_location: 'Candolim Beach Resort',
    pickup_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: 'ALLOCATED',
    vehicle_class_requested: 'SUV',
    assigned_vehicle: 1,
    assigned_vehicle_reg: 'GA-03-Z-8899',
    assigned_vehicle_model: 'Toyota Innova Crysta',
    assigned_driver: 1,
    assigned_driver_name: 'Suresh Kamat',
    base_rate_inr: 2450,
    flight_number: '6E-2041',
    flight_status: 'On Time (ETA 14:15)',
    otp: '4821',
    special_instructions: 'Greet with VIP placard inside arrival gate.'
  },
  {
    id: 2,
    booking_reference: 'WG-TX-476904',
    passenger_name: 'Priya Mehra',
    passenger_phone: '+91 98920 11843',
    client: 2,
    client_name: 'W Goa Concierge',
    pickup_location: 'W Goa Vagator',
    dropoff_location: 'South Goa Sightseeing (8 Hr / 80 Km)',
    pickup_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'IN_PROGRESS',
    vehicle_class_requested: 'LUXURY',
    assigned_vehicle: 5,
    assigned_vehicle_reg: 'GA-03-L-0007',
    assigned_vehicle_model: 'Mercedes-Benz E-Class',
    assigned_driver: 4,
    assigned_driver_name: "Antonio D'Souza",
    base_rate_inr: 6500,
    flight_number: '',
    flight_status: '',
    otp: '7102',
    special_instructions: 'Chilled sparkling water and English-speaking chauffeur required.'
  },
  {
    id: 3,
    booking_reference: 'WG-TX-476905',
    passenger_name: 'Rohan Deshmukh',
    passenger_phone: '+91 97665 90123',
    client: 3,
    client_name: 'Alila Diwa Corporate',
    pickup_location: 'Panjim Business Hub',
    dropoff_location: 'Dabolim Airport (GOI)',
    pickup_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'EN_ROUTE',
    vehicle_class_requested: 'SEDAN',
    assigned_vehicle: 2,
    assigned_vehicle_reg: 'GA-07-T-1240',
    assigned_vehicle_model: 'Maruti Suzuki Dzire',
    assigned_driver: 2,
    assigned_driver_name: 'Bikram Naik',
    base_rate_inr: 1650,
    flight_number: 'AI-684',
    flight_status: 'On Time',
    otp: '3391',
    special_instructions: 'Express drop-off at Terminal 1 departure gate.'
  },
  {
    id: 4,
    booking_reference: 'WG-TX-476906',
    passenger_name: 'Verma Family Tour',
    passenger_phone: '+91 94140 88219',
    client: 4,
    client_name: 'Mopa VIP Lounge Desk',
    pickup_location: 'Manohar Intl Airport, Mopa (GOX)',
    dropoff_location: 'Calangute, Anjuna, Aguada Circuit',
    pickup_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'NEEDS_DRIVER',
    vehicle_class_requested: 'VAN',
    assigned_vehicle: null,
    assigned_vehicle_reg: '',
    assigned_vehicle_model: '',
    assigned_driver: null,
    assigned_driver_name: '',
    base_rate_inr: 8200,
    flight_number: 'UK-812',
    flight_status: 'Expected On Time',
    otp: '9014',
    special_instructions: 'Large luggage space needed for 6 suitcases.'
  }
];

const DEFAULT_CLIENTS = [
  { id: 1, name: 'Taj Exotica B2B Concierge', contact_person: 'Ramesh Shenoy', phone: '+91 832 6683333', gst_number: '30AACCT2049L1Z2', credit_limit_inr: 250000 },
  { id: 2, name: 'W Goa Concierge', contact_person: 'Natasha Dsouza', phone: '+91 832 6718888', gst_number: '30AACCW9902M1Z8', credit_limit_inr: 500000 },
  { id: 3, name: 'Alila Diwa Corporate', contact_person: 'Vikram Joshi', phone: '+91 832 2746800', gst_number: '30AADCA4108P1Z4', credit_limit_inr: 150000 },
  { id: 4, name: 'Mopa VIP Lounge Desk', contact_person: 'GMR VIP Officer', phone: '+91 832 2499000', gst_number: '30AABCG8192K1Z9', credit_limit_inr: 1000000 }
];

const DEFAULT_DOCUMENTS = [
  { id: 1, vehicle: 1, vehicle_reg: 'GA-03-Z-8899', document_type: 'RTO_PERMIT', document_name: 'All Goa Commercial Taxi Permit', validity_date: '2027-04-15', status: 'ACTIVE', file_url: '#' },
  { id: 2, vehicle: 5, vehicle_reg: 'GA-03-L-0007', document_type: 'INSURANCE', document_name: 'Commercial Comprehensive Fleet Insurance', validity_date: '2027-12-01', status: 'ACTIVE', file_url: '#' },
  { id: 3, vehicle: 2, vehicle_reg: 'GA-07-T-1240', document_type: 'PUC', document_name: 'Pollution Under Control Certificate', validity_date: '2026-11-20', status: 'ACTIVE', file_url: '#' },
  { id: 4, vehicle: 4, vehicle_reg: 'GA-01-M-9021', document_type: 'FITNESS', document_name: 'RTO Annual Fitness Certificate', validity_date: '2026-10-30', status: 'EXPIRING_SOON', file_url: '#' },
  { id: 5, vehicle: 3, vehicle_reg: 'GA-08-EV-4412', document_type: 'EV_GREEN_PERMIT', document_name: 'Goa EV Zero-Emission Commercial Permit', validity_date: '2027-08-10', status: 'ACTIVE', file_url: '#' }
];

const DEFAULT_INVOICES = [
  { id: 1, invoice_number: 'INV-2026-001', client_name: 'Taj Exotica B2B Concierge', amount_inr: 42500, gst_inr: 2125, total_inr: 44625, status: 'PAID', issued_date: '2026-10-01' },
  { id: 2, invoice_number: 'INV-2026-002', client_name: 'W Goa Concierge', amount_inr: 64000, gst_inr: 3200, total_inr: 67200, status: 'PAID', issued_date: '2026-10-05' },
  { id: 3, invoice_number: 'INV-2026-003', client_name: 'Mopa VIP Lounge Desk', amount_inr: 42000, gst_inr: 2100, total_inr: 44100, status: 'SENT', issued_date: '2026-10-10' }
];

const DEFAULT_TELEMETRY = [
  { id: 1, vehicle_id: 1, registration_number: 'GA-03-Z-8899', model: 'Toyota Innova Crysta', driver: 'Suresh Kamat', lat: 15.518, lng: 73.765, speed: 42, heading: 180, status: 'MOVING', battery: 98, location_name: 'Candolim Beach Road' },
  { id: 2, vehicle_id: 2, registration_number: 'GA-07-T-1240', model: 'Maruti Suzuki Dzire', driver: 'Bikram Naik', lat: 15.498, lng: 73.827, speed: 35, heading: 90, status: 'MOVING', battery: 94, location_name: 'Panjim Causeway' },
  { id: 3, vehicle_id: 3, registration_number: 'GA-08-EV-4412', model: 'Tata Tigor EV', driver: 'Rahul Gaonkar', lat: 15.753, lng: 73.868, speed: 0, heading: 0, status: 'IDLE', battery: 82, location_name: 'Mopa GOX Airport Taxi Bay' },
  { id: 4, vehicle_id: 4, registration_number: 'GA-01-M-9021', model: 'Force Urbania Executive', driver: 'Unassigned', lat: 15.399, lng: 73.811, speed: 0, heading: 0, status: 'MAINTENANCE', battery: 76, location_name: 'Verna Garage' },
  { id: 5, vehicle_id: 5, registration_number: 'GA-03-L-0007', model: 'Mercedes-Benz E-Class', driver: "Antonio D'Souza", lat: 15.380, lng: 73.831, speed: 58, heading: 270, status: 'MOVING', battery: 100, location_name: 'Dabolim Airport Highway' }
];

// Helper to get from local storage or set initial
function getStore(key, initial) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function setStore(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Router for offline mock responses
function handleMockRoute(method, url, data) {
  const clean = url.replace(/^\/?api\/?/, '').replace(/^\//, '');

  // 1. Fleet Vehicles
  if (clean === 'auth/login/' || clean === 'auth/login') {
    const rawU = (data?.username || '').toLowerCase();
    const isChauffeur = rawU.includes('chauff');
    const isDispatcher = rawU.includes('dispatch');
    const role = isChauffeur ? 'DRIVER' : (isDispatcher ? 'DISPATCHER' : 'FLEET_ADMIN');
    return {
      data: {
        access: 'apex-b2b-active-session',
        refresh: 'apex-b2b-refresh-token',
        user: {
          id: 1,
          username: isChauffeur ? 'Executive Chauffeur' : (isDispatcher ? 'Control Room Dispatcher' : 'Fleet Director'),
          email: isChauffeur ? 'chauffeur@wowgoa.in' : 'taxivendor@wowgoa.in',
          role: role,
          company_name: 'WOW GOA B2B Fleet'
        }
      }
    };
  }

  if (clean === 'fleet/vehicles/' || clean === 'fleet/vehicles') {
    const list = getStore('apex_b2b_vehicles', DEFAULT_VEHICLES);
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...data, status: data.status || 'ACTIVE' };
      const updated = [newItem, ...list];
      setStore('apex_b2b_vehicles', updated);
      return { data: newItem };
    }
    return { data: list };
  }

  if (clean.startsWith('fleet/vehicles/') && method === 'PUT') {
    const id = clean.split('/')[2];
    const list = getStore('apex_b2b_vehicles', DEFAULT_VEHICLES);
    const updated = list.map(v => String(v.id) === String(id) ? { ...v, ...data } : v);
    setStore('apex_b2b_vehicles', updated);
    return { data: { success: true } };
  }

  if (clean === 'fleet/vehicles/summary/' || clean === 'fleet/vehicles/summary') {
    const list = getStore('apex_b2b_vehicles', DEFAULT_VEHICLES);
    const available = list.filter(v => v.status === 'ACTIVE').length;
    const on_duty = list.filter(v => v.status === 'ON_DUTY' || v.status === 'ACTIVE').length;
    const in_maintenance = list.filter(v => v.status === 'MAINTENANCE').length;
    return { data: { total_vehicles: list.length, available, on_duty, in_maintenance } };
  }

  // 2. Drivers
  if (clean === 'drivers/drivers/' || clean === 'drivers/drivers') {
    const list = getStore('apex_b2b_drivers', DEFAULT_DRIVERS);
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...data, rating: 5.0, trips_completed: 0 };
      const updated = [newItem, ...list];
      setStore('apex_b2b_drivers', updated);
      return { data: newItem };
    }
    return { data: list };
  }

  if (clean === 'drivers/drivers/summary/' || clean === 'drivers/drivers/summary') {
    const list = getStore('apex_b2b_drivers', DEFAULT_DRIVERS);
    const on_duty = list.filter(d => d.status === 'ON_DUTY').length;
    const on_trip = list.filter(d => d.assigned_vehicle_reg && d.assigned_vehicle_reg !== 'Unassigned').length;
    const off_duty = list.filter(d => d.status === 'OFF_DUTY').length;
    return { data: { total_drivers: list.length, on_duty, on_trip, off_duty } };
  }

  if (clean.includes('/chauffeur_portal')) {
    const id = clean.split('/')[2];
    const drivers = getStore('apex_b2b_drivers', DEFAULT_DRIVERS);
    const d = drivers.find(drv => String(drv.id) === String(id)) || drivers[0];
    let bookings = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);

    // Merge any live customer storefront bookings from wowgoa_taxi_dispatches
    try {
      const liveDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      if (liveDispatches.length > 0) {
        liveDispatches.forEach(ld => {
          const exists = bookings.some(b => b.booking_reference === ld.id || String(b.id) === String(ld.id));
          if (!exists) {
            let mappedStatus = 'ALLOCATED';
            if (ld.status === 'Completed') mappedStatus = 'COMPLETED';
            else if (ld.status === 'In Progress' || ld.status === 'ON_TRIP') mappedStatus = 'ON_TRIP';
            else if (ld.status === 'Driver Arrived' || ld.status === 'ARRIVED') mappedStatus = 'ARRIVED';
            else if (ld.status === 'Dispatched') mappedStatus = 'DISPATCHED';

            bookings.unshift({
              id: ld.id,
              booking_reference: ld.id,
              passenger_name: ld.customer || 'Valued Goa Guest',
              passenger_phone: ld.phone || '+91 98221 44510',
              passenger_count: 2,
              client_name: 'WOW GOA Vacation App',
              pickup_location: ld.service ? ld.service.split('➔')[0].trim() : 'Mopa Airport (GOX)',
              dropoff_location: ld.service ? (ld.service.split('➔').pop() || '').trim() : 'Candolim Beach Resort',
              stops: ld.stops || [],
              pickup_time: ld.pickupTime || 'Immediate Dispatch',
              status: mappedStatus,
              vehicle_class_requested: 'SEDAN',
              assigned_vehicle: 1,
              assigned_vehicle_reg: 'GA-03-Z-8899',
              assigned_vehicle_model: ld.car || 'Toyota Innova Crysta',
              assigned_driver: d.id,
              assigned_driver_name: d.full_name || 'Suresh Kamat',
              base_rate_inr: ld.amount || ld.fare || 2450,
              otp: ld.otp || '4821',
              flight_number: ld.flightNumber || '6E-241',
              special_instructions: 'Customer booked via WOW GOA Mobile App. Please greet with chilled water bottle.'
            });
          } else {
            const existingB = bookings.find(b => b.booking_reference === ld.id || String(b.id) === String(ld.id));
            if (existingB) {
              if (ld.stops) existingB.stops = ld.stops;
              if (ld.amount) existingB.base_rate_inr = ld.amount;
              if (ld.service) {
                const parts = ld.service.split('➔');
                existingB.dropoff_location = parts[parts.length - 1].trim();
              }
            }
          }
        });
      }
    } catch (e) {}

    const myBookings = bookings.filter(b => String(b.assigned_driver) === String(d.id) || !b.assigned_driver);
    const activeBooking = myBookings.find(b => b.status === 'ALLOCATED' || b.status === 'DISPATCHED' || b.status === 'ARRIVED' || b.status === 'ON_TRIP' || b.status === 'IN_PROGRESS') || myBookings[0] || null;

    return {
      data: {
        driver: d,
        assigned_vehicle: DEFAULT_VEHICLES[0],
        active_shift: {
          id: 101,
          start_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          vehicle_detail: DEFAULT_VEHICLES[0]
        },
        active_booking: activeBooking,
        active_trip: activeBooking,
        upcoming_trips: myBookings,
        recent_trips: myBookings.filter(b => b.status === 'COMPLETED'),
        stats: {
          today_earnings_inr: 4250,
          today_trips_count: 3,
          today_kms: 114
        }
      }
    };
  }

  if (clean.includes('/start_shift') || clean.includes('/end_shift') || clean.includes('/trigger_sos')) {
    return { data: { success: true, message: 'Status updated' } };
  }

  // Handle accept_duty, decline_duty, arrived, start_trip, complete_trip lifecycle actions
  if (clean.includes('/accept_duty') || clean.includes('/decline_duty') || clean.includes('/arrived') || clean.includes('/start_trip') || clean.includes('/complete_trip')) {
    const id = clean.split('/')[2];
    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    let newStatus = 'IN_PROGRESS';
    if (clean.includes('/accept_duty')) newStatus = 'DISPATCHED';
    if (clean.includes('/decline_duty')) newStatus = 'CANCELLED';
    if (clean.includes('/arrived')) newStatus = 'ARRIVED';
    if (clean.includes('/start_trip')) newStatus = 'ON_TRIP';
    if (clean.includes('/complete_trip')) newStatus = 'COMPLETED';

    const updated = list.map(b => {
      if (String(b.id) === String(id) || b.booking_reference === String(id)) {
        return { 
          ...b, 
          status: newStatus,
          start_odometer: data?.start_odometer || b.start_odometer || 14200,
          end_odometer: data?.end_odometer || b.end_odometer,
          toll_parking_inr: data?.toll_parking_inr || b.toll_parking_inr || 0,
          payment_method: data?.payment_method || b.payment_method || 'UPI',
          payment_status: newStatus === 'COMPLETED' ? 'PAID' : b.payment_status
        };
      }
      return b;
    });
    setStore('apex_b2b_bookings', updated);

    // Also sync to wowgoa_taxi_dispatches
    try {
      const liveDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updatedDispatches = liveDispatches.map(ld => {
        if (ld.id === id || String(ld.id) === String(id)) {
          let customerStatus = 'Confirmed';
          if (newStatus === 'DISPATCHED') customerStatus = 'Dispatched';
          if (newStatus === 'ARRIVED') customerStatus = 'Driver Arrived';
          if (newStatus === 'ON_TRIP') customerStatus = 'In Progress';
          if (newStatus === 'COMPLETED') customerStatus = 'Completed';
          if (newStatus === 'CANCELLED') customerStatus = 'Cancelled';
          return { 
            ...ld, 
            status: customerStatus,
            paymentStatus: newStatus === 'COMPLETED' ? 'Paid' : (ld.paymentStatus || 'Pending')
          };
        }
        return ld;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updatedDispatches));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { 
          detail: { id, status: newStatus } 
        }));
      }
    } catch (e) {}

    return { data: { success: true, status: newStatus, message: `Trip status updated to ${newStatus}` } };
  }

  // 3. Compliance Vault
  if (clean === 'fleet/compliance/' || clean === 'fleet/compliance') {
    const list = getStore('apex_b2b_compliance', DEFAULT_DOCUMENTS);
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...data, status: 'ACTIVE' };
      const updated = [newItem, ...list];
      setStore('apex_b2b_compliance', updated);
      return { data: newItem };
    }
    return { data: list };
  }

  if (clean === 'fleet/compliance/summary/' || clean === 'fleet/compliance/summary') {
    const list = getStore('apex_b2b_compliance', DEFAULT_DOCUMENTS);
    return { data: { total_documents: list.length, active: list.filter(d => d.status === 'ACTIVE').length, expiring_soon: 1, expired: 0 } };
  }

  // 4. Dispatches & Bookings
  if (clean === 'dispatches/bookings/' || clean === 'dispatches/bookings') {
    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    if (method === 'POST') {
      const newItem = {
        id: Date.now(),
        booking_reference: `WG-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'NEEDS_DRIVER',
        ...data
      };
      const updated = [newItem, ...list];
      setStore('apex_b2b_bookings', updated);
      return { data: newItem };
    }
    return { data: list };
  }

  if (clean === 'dispatches/bookings/summary/' || clean === 'dispatches/bookings/summary') {
    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    return {
      data: {
        total_bookings: list.length,
        pending_allocation: list.filter(b => b.status === 'NEEDS_DRIVER').length,
        active_live: list.filter(b => b.status === 'ALLOCATED' || b.status === 'EN_ROUTE' || b.status === 'IN_PROGRESS').length,
        completed: list.filter(b => b.status === 'COMPLETED').length,
        total_revenue_inr: list.reduce((sum, b) => sum + (Number(b.base_rate_inr) || 0), 0)
      }
    };
  }

  if (clean.startsWith('dispatches/bookings/') && (method === 'PUT' || method === 'PATCH')) {
    const id = clean.split('/')[2];
    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    const updated = list.map(b => String(b.id) === String(id) ? { ...b, ...data } : b);
    setStore('apex_b2b_bookings', updated);
    return { data: { success: true } };
  }

  if (clean.includes('/start_trip') || clean.includes('/complete_trip')) {
    const id = clean.split('/')[2];
    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    const isComplete = clean.includes('/complete_trip');
    const updated = list.map(b => String(b.id) === String(id) ? { ...b, status: isComplete ? 'COMPLETED' : 'IN_PROGRESS' } : b);
    setStore('apex_b2b_bookings', updated);
    return { data: { success: true } };
  }

  if (clean.includes('/dispatch/') || clean.includes('/auto_assign/')) {
    const id = clean.split('/')[2];
    const vehicles = getStore('apex_b2b_vehicles', DEFAULT_VEHICLES);
    const drivers = getStore('apex_b2b_drivers', DEFAULT_DRIVERS);
    const v = vehicles.find(item => String(item.id) === String(data?.vehicle_id)) || vehicles[0];
    const d = drivers.find(item => String(item.id) === String(data?.driver_id)) || drivers[0];

    const list = getStore('apex_b2b_bookings', DEFAULT_BOOKINGS);
    const updated = list.map(b => {
      if (String(b.id) === String(id) || b.booking_reference === String(id)) {
        return {
          ...b,
          status: 'ALLOCATED',
          assigned_vehicle: v?.id || 1,
          assigned_vehicle_reg: v?.registration_number || 'GA-03-Z-8899',
          assigned_vehicle_model: v?.make_model || 'Toyota Innova Crysta',
          assigned_driver: d?.id || 1,
          assigned_driver_name: d?.full_name || 'Suresh Naik',
          assigned_driver_phone: d?.phone || '+91 98221 44510'
        };
      }
      return b;
    });
    setStore('apex_b2b_bookings', updated);

    // Sync into wowgoa_taxi_dispatches
    try {
      const liveDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updatedDispatches = liveDispatches.map(ld => {
        if (ld.id === id || String(ld.id) === String(id)) {
          return {
            ...ld,
            status: 'Confirmed',
            chauffeur: d?.full_name || 'Suresh Naik',
            vehiclePlate: v?.registration_number || 'GA-03-Z-8899',
            car: v?.make_model || 'Toyota Innova Crysta'
          };
        }
        return ld;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updatedDispatches));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { detail: { id, status: 'Confirmed' } }));
      }
    } catch (e) {}

    return { data: { success: true, message: 'Vehicle and Chauffeur allocated successfully!' } };
  }

  if (clean === 'dispatches/clients/' || clean === 'dispatches/clients') {
    return { data: DEFAULT_CLIENTS };
  }

  // 5. Billing & Invoices
  if (clean === 'billing/invoices/' || clean === 'billing/invoices') {
    const list = getStore('apex_b2b_invoices', DEFAULT_INVOICES);
    return { data: list };
  }

  if (clean === 'billing/invoices/summary/' || clean === 'billing/invoices/summary') {
    return {
      data: {
        total_invoiced_inr: 148500,
        pending_clearance_inr: 42000,
        collected_inr: 106500,
        overdue_inr: 0
      }
    };
  }

  if (clean.includes('generate_invoice') || clean.includes('mark_sent') || clean.includes('mark_paid')) {
    return { data: { success: true, message: 'Invoice updated successfully' } };
  }

  if (clean === 'billing/pricing/' || clean === 'billing/pricing') {
    return { data: [] };
  }

  if (clean === 'billing/payouts/' || clean === 'billing/payouts') {
    return { data: [] };
  }

  // 6. Telematics
  if (clean === 'telematics/ops/live-fleet/' || clean === 'telematics/ops/live-fleet') {
    return { data: DEFAULT_TELEMETRY };
  }

  if (clean === 'telematics/ops/summary/' || clean === 'telematics/ops/summary') {
    return { data: { active_tracking: 5, moving: 3, idle: 1, maintenance: 1, geofence_breaches: 0 } };
  }

  if (clean === 'telematics/geofences/' || clean === 'telematics/geofences') {
    return {
      data: [
        { id: 1, name: 'Manohar Intl Airport Mopa (GOX)', radius_km: 4.5, lat: 15.753, lng: 73.868 },
        { id: 2, name: 'Dabolim Airport (GOI)', radius_km: 3.0, lat: 15.380, lng: 73.831 },
        { id: 3, name: 'Candolim Tourist Corridor', radius_km: 5.0, lat: 15.518, lng: 73.765 }
      ]
    };
  }

  if (clean === 'telematics/alerts/' || clean === 'telematics/alerts') {
    return {
      data: [
        { id: 1, vehicle_reg: 'GA-03-L-0007', alert_type: 'SPEED_WARNING', message: 'Vehicle touched 58 km/h on Airport Highway (Safe Limit: 60)', created_at: new Date().toISOString() }
      ]
    };
  }

  // 7. Auth Login
  if (clean === 'auth/login/' || clean === 'auth/login') {
    return {
      data: {
        access: 'mock-access-token-apex',
        refresh: 'mock-refresh-token-apex',
        user: {
          id: 1,
          username: data?.username || 'Fleet Director',
          role: 'FLEET_ADMIN',
          company_name: 'WOW GOA B2B Taxi Operations'
        }
      }
    };
  }

  // Generic fallback
  return { data: [] };
}

// Unified client matching Axios signature
const taxiApiClient = {
  defaults: {
    baseURL: DJANGO_API_BASE,
    headers: {
      common: {
        'Content-Type': 'application/json'
      }
    }
  },

  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },

  async request(method, url, data = null, config = {}) {
    const getPhpBase = () => {
      if (typeof window === 'undefined') return 'http://localhost:8000/api.php';
      const host = window.location.hostname || 'localhost';
      return (host === 'localhost' || host === '127.0.0.1')
        ? 'http://localhost:8000/api.php'
        : (window.location.port === '5173' ? `http://${host}:8000/api.php` : '/backend/api.php');
    };

    const PHP_API = getPhpBase();
    const cleanUrl = url.replace(/^\//, '');

    // 1. Try PHP Unified Backend API
    try {
      let phpUrl = null;
      let phpMethod = method.toUpperCase();
      let phpBody = data;

      if (cleanUrl === 'dispatches/bookings/' || cleanUrl === 'dispatches/bookings') {
        phpUrl = `${PHP_API}?resource=vendor_dispatches`;
      } else if (cleanUrl === 'dispatches/bookings/summary/' || cleanUrl === 'dispatches/bookings/summary') {
        phpUrl = `${PHP_API}?resource=vendor_dispatches`;
      } else if (cleanUrl.includes('/chauffeur_portal')) {
        const drvId = cleanUrl.split('/')[2] || 'drv-suresh';
        phpUrl = `${PHP_API}?resource=driver_active_duty&driver_id=${encodeURIComponent(drvId)}`;
      } else if (cleanUrl.includes('/dispatch/') || cleanUrl.includes('/auto_assign/')) {
        const dispatchId = cleanUrl.split('/')[2];
        const vehicles = getStore('apex_b2b_vehicles', DEFAULT_VEHICLES);
        const drivers = getStore('apex_b2b_drivers', DEFAULT_DRIVERS);
        const v = vehicles.find(item => String(item.id) === String(data?.vehicle_id)) || vehicles[0];
        const d = drivers.find(item => String(item.id) === String(data?.driver_id)) || drivers[0];

        phpUrl = `${PHP_API}?action=vendor_assign_dispatch`;
        phpMethod = 'POST';
        phpBody = {
          dispatch_id: dispatchId,
          vehicle_id: v?.id || data?.vehicle_id,
          vehicle_plate: v?.registration_number || data?.vehicle_plate || 'GA-03-Z-8899',
          vehicle_model: v?.make_model || data?.vehicle_model || 'Toyota Innova Crysta',
          driver_id: d?.id || data?.driver_id || 'drv-suresh',
          driver_name: d?.full_name || data?.driver_name || 'Suresh Naik',
          driver_phone: d?.phone || data?.driver_phone || '+91 98221 44510'
        };
      } else if (cleanUrl.includes('/accept_duty')) {
        const id = cleanUrl.split('/')[2];
        phpUrl = `${PHP_API}?action=driver_update_status`;
        phpMethod = 'POST';
        phpBody = { dispatch_id: id, status: 'DISPATCHED' };
      } else if (cleanUrl.includes('/decline_duty')) {
        const id = cleanUrl.split('/')[2];
        phpUrl = `${PHP_API}?action=driver_update_status`;
        phpMethod = 'POST';
        phpBody = { dispatch_id: id, status: 'CANCELLED' };
      } else if (cleanUrl.includes('/arrived')) {
        const id = cleanUrl.split('/')[2];
        phpUrl = `${PHP_API}?action=driver_update_status`;
        phpMethod = 'POST';
        phpBody = { dispatch_id: id, status: 'ARRIVED' };
      } else if (cleanUrl.includes('/start_trip')) {
        const id = cleanUrl.split('/')[2];
        phpUrl = `${PHP_API}?action=driver_update_status`;
        phpMethod = 'POST';
        phpBody = { 
          dispatch_id: id, 
          status: 'ON_TRIP',
          otp: data?.otp || '4821',
          start_odometer: data?.start_odometer || 14200
        };
      } else if (cleanUrl.includes('/complete_trip')) {
        const id = cleanUrl.split('/')[2];
        phpUrl = `${PHP_API}?action=driver_update_status`;
        phpMethod = 'POST';
        phpBody = { 
          dispatch_id: id, 
          status: 'COMPLETED',
          end_odometer: data?.end_odometer || 14235,
          toll_parking_inr: data?.toll_parking_inr || 0,
          payment_method: data?.payment_method || 'UPI'
        };
      } else if (cleanUrl.includes('telematics/ops/live-fleet')) {
        phpUrl = `${PHP_API}?resource=vendor_telematics`;
      }

      if (phpUrl) {
        const token = localStorage.getItem('access_token');
        const res = await fetch(phpUrl, {
          method: phpMethod,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          ...(phpMethod !== 'GET' && phpBody ? { body: JSON.stringify(phpBody) } : {})
        });

        if (res.ok) {
          const json = await res.json();
          if (cleanUrl.includes('dispatches/bookings/summary')) {
            return { data: json.summary || json.counts || {}, status: 200 };
          }
          if (cleanUrl === 'dispatches/bookings/' || cleanUrl === 'dispatches/bookings') {
            const list = json.dispatches || (Array.isArray(json) ? json : []);
            return { data: list, results: list, status: 200 };
          }
          if (cleanUrl.includes('telematics/ops/live-fleet')) {
            return { data: json.active_units || DEFAULT_TELEMETRY, status: 200 };
          }
          if (cleanUrl.includes('/chauffeur_portal')) {
            return { data: json, status: 200 };
          }
          return { data: json, status: 200 };
        }
      }
    } catch (err) {
      // Backend unavailable or network error: gracefully fall back to offline handler
    }

    // Seamless offline fallback
    return handleMockRoute(method.toUpperCase(), url, data);
  },

  get(url, config) {
    return this.request('GET', url, null, config);
  },

  post(url, data, config) {
    return this.request('POST', url, data, config);
  },

  put(url, data, config) {
    return this.request('PUT', url, data, config);
  },

  patch(url, data, config) {
    return this.request('PATCH', url, data, config);
  },

  delete(url, config) {
    return this.request('DELETE', url, null, config);
  }
};

export default taxiApiClient;
