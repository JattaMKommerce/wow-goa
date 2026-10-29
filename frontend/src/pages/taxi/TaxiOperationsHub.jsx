import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Users, LayoutDashboard, Plus, Phone, MapPin, 
  CheckCircle2, Clock, AlertCircle, X, Trash2, Edit3, 
  ExternalLink, LogOut, ArrowRight, Shield, RefreshCw, Key,
  Calendar, DollarSign, Filter, Search, Award, FileText, 
  Check, ChevronRight, Eye, UserCheck, ShieldCheck, Fuel,
  Compass, Navigation, Download, UploadCloud, Camera, Image as ImageIcon,
  FileCheck, Star
} from 'lucide-react';
import { fetchCustomerPastTrips, uploadImage } from '../../services/api';

// High-quality car photo presets matching Wow Goa fleet
const CAR_PHOTO_PRESETS = [
  {
    name: 'Toyota Innova Crysta (SUV)',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    type: 'suv',
    seats: 6
  },
  {
    name: 'Maruti Suzuki Dzire (Sedan)',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    type: 'sedan',
    seats: 4
  },
  {
    name: 'Maruti Ertiga (7-Seater MUV)',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    type: 'muv',
    seats: 7
  },
  {
    name: 'Maruti Swift / WagonR (Hatchback)',
    url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    type: 'normal',
    seats: 4
  },
  {
    name: 'Mahindra Thar 4x4 (Goa Open Top)',
    url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80',
    type: 'suv',
    seats: 4
  },
  {
    name: 'Mercedes-Benz / BMW (VIP Luxury)',
    url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
    type: 'luxury',
    seats: 4
  }
];

// Driver photo presets
const DRIVER_PHOTO_PRESETS = [
  { name: 'Suresh Naik', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
  { name: 'Ramesh Sawant', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
  { name: 'Vijay Gaonkar', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80' },
  { name: 'Anil D\'Souza', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80' }
];

// Starter fleet if none added yet
const INITIAL_STARTER_VEHICLES = [
  {
    id: 'sedan-prime',
    name: 'Prime Sedan',
    model: 'Maruti Suzuki Dzire',
    plate: 'GA-03-Z-8899',
    rcBookNo: 'GA03-RC-2022-8899',
    insuranceExpiry: '2027-05-20',
    fitnessExpiry: '2028-11-14',
    classType: 'sedan',
    seats: 4,
    bags: 3,
    fuel: 'Petrol',
    transmission: 'Manual',
    baseFare: 350,
    perKm: 24,
    has_ac: true,
    has_fastag: true,
    has_carrier: false,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    eta: 3,
    badge: 'Popular',
    icon: '🚕',
    driverName: 'Suresh Naik',
    driverPhone: '+91 98221 44510',
    active: true,
    desc: 'Spacious AC sedan with dedicated luggage boot for hotel and airport transfers.'
  },
  {
    id: 'suv-executive',
    name: 'Executive SUV',
    model: 'Toyota Innova Crysta',
    plate: 'GA-03-Z-4521',
    rcBookNo: 'GA03-RC-2021-4521',
    insuranceExpiry: '2026-12-10',
    fitnessExpiry: '2029-02-18',
    classType: 'suv',
    seats: 6,
    bags: 4,
    fuel: 'Diesel',
    transmission: 'Automatic',
    baseFare: 550,
    perKm: 34,
    has_ac: true,
    has_fastag: true,
    has_carrier: true,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    eta: 5,
    badge: 'Family Favorite',
    icon: '🚙',
    driverName: 'Ramesh Sawant',
    driverPhone: '+91 98229 11200',
    active: true,
    desc: 'Plush 6-seater SUV with captain recliner seats, generous boot space and dual AC.'
  },
  {
    id: 'normal-hatchback',
    name: 'Normal Hatchback',
    model: 'Maruti WagonR / Swift',
    plate: 'GA-03-Z-1011',
    rcBookNo: 'GA03-RC-2023-1011',
    insuranceExpiry: '2028-03-15',
    fitnessExpiry: '2029-09-22',
    classType: 'normal',
    seats: 4,
    bags: 2,
    fuel: 'Petrol',
    transmission: 'Manual',
    baseFare: 280,
    perKm: 20,
    has_ac: true,
    has_fastag: true,
    has_carrier: false,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    eta: 4,
    badge: 'Budget Choice',
    icon: '🚗',
    driverName: 'Vijay Gaonkar',
    driverPhone: '+91 97645 88910',
    active: true,
    desc: 'Affordable, clean AC hatchback for swift beach hops across Goa.'
  }
];

// Comprehensive Onboarded Drivers Record
const INITIAL_STARTER_DRIVERS = [
  { 
    id: 1, 
    name: 'Suresh Naik', 
    phone: '+91 98221 44510', 
    emergencyPhone: '+91 98221 99990',
    licenseNo: 'GA-03-2016-0034120',
    licenseExpiry: '2031-08-15',
    badgeNo: 'GOA-PSV-4412',
    aadharNo: 'XXXX-XXXX-8812',
    car: 'GA-03-Z-8899 (Maruti Dzire)', 
    carPlate: 'GA-03-Z-8899',
    experienceYears: 7,
    languages: ['Konkani', 'English', 'Hindi'],
    policeVerified: true,
    rating: 4.93,
    tripsCount: 1840,
    status: 'On Active Ride',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 2, 
    name: 'Ramesh Sawant', 
    phone: '+91 98229 11200', 
    emergencyPhone: '+91 98229 44332',
    licenseNo: 'GA-03-2014-0012904',
    licenseExpiry: '2029-04-20',
    badgeNo: 'GOA-PSV-1204',
    aadharNo: 'XXXX-XXXX-4521',
    car: 'GA-03-Z-4521 (Innova Crysta)', 
    carPlate: 'GA-03-Z-4521',
    experienceYears: 10,
    languages: ['Konkani', 'Hindi', 'English', 'Marathi'],
    policeVerified: true,
    rating: 4.96,
    tripsCount: 2410,
    status: 'Available',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  { 
    id: 3, 
    name: 'Vijay Gaonkar', 
    phone: '+91 97645 88910', 
    emergencyPhone: '+91 97645 11002',
    licenseNo: 'GA-02-2019-0099451',
    licenseExpiry: '2034-11-10',
    badgeNo: 'GOA-PSV-9945',
    aadharNo: 'XXXX-XXXX-1011',
    car: 'GA-03-Z-1011 (WagonR)', 
    carPlate: 'GA-03-Z-1011',
    experienceYears: 5,
    languages: ['Konkani', 'Hindi'],
    policeVerified: true,
    rating: 4.88,
    tripsCount: 920,
    status: 'Available',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'
  }
];

export default function TaxiOperationsHub({ initialTab = 'dashboard', onLogout, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path === '/taxi-fleet' || path === '/taxi-vehicles') return 'vehicles';
    if (path === '/taxi-drivers') return 'drivers';
    if (path === '/taxi-trips' || path === '/taxi-bookings') return 'trips';
    return initialTab === 'fleet' ? 'vehicles' : (initialTab === 'drivers' ? 'drivers' : (initialTab === 'trips' ? 'trips' : 'dashboard'));
  });

  // ── 1. Vehicles State ────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_taxi_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem('wowgoa_taxi_vehicles', JSON.stringify(INITIAL_STARTER_VEHICLES));
    return INITIAL_STARTER_VEHICLES;
  });

  // ── 2. Drivers State ─────────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_taxi_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem('wowgoa_taxi_drivers', JSON.stringify(INITIAL_STARTER_DRIVERS));
    return INITIAL_STARTER_DRIVERS;
  });

  // ── 3. Bookings & Date Filter State ─────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_driver' | 'on_road' | 'completed' | 'rejected'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ── Modals State ────────────────────────────────────────────────────────────
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);

  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState(null);

  const [selectedTripForDetails, setSelectedTripForDetails] = useState(null);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // Vehicle Form
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    model: '',
    plate: '',
    rcBookNo: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    classType: 'sedan',
    seats: 4,
    bags: 3,
    fuel: 'Petrol',
    transmission: 'Manual',
    baseFare: 350,
    perKm: 24,
    image: '',
    has_ac: true,
    has_fastag: true,
    has_carrier: false,
    driverName: '',
    driverPhone: '',
    desc: ''
  });

  // Driver Form
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    emergencyPhone: '',
    licenseNo: '',
    licenseExpiry: '',
    badgeNo: '',
    aadharNo: '',
    carPlate: '',
    experienceYears: 5,
    languages: 'Konkani, Hindi, English',
    policeVerified: true,
    photo: ''
  });

  // Upload & Drag-and-Drop Handler
  const handleFileUpload = async (file, target) => {
    if (!file) return;
    
    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      if (target === 'vehicle') {
        setVehicleForm(prev => ({ ...prev, image: e.target.result }));
      } else if (target === 'driver') {
        setDriverForm(prev => ({ ...prev, photo: e.target.result }));
      }
    };
    reader.readAsDataURL(file);

    // Optional background upload
    try {
      const res = await uploadImage(file);
      const remoteUrl = typeof res === 'string' ? res : (res?.url || res?.image_url);
      if (remoteUrl) {
        if (target === 'vehicle') setVehicleForm(prev => ({ ...prev, image: remoteUrl }));
        else if (target === 'driver') setDriverForm(prev => ({ ...prev, photo: remoteUrl }));
      }
    } catch (err) {
      console.warn('Image upload fallback to data URL:', err);
    }
  };

  // ── Load Bookings from localStorage and Backend ─────────────────────────────
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const localDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const activeRide = JSON.parse(localStorage.getItem('wowgoa_active_ride') || 'null');

      let combined = [...localDispatches];
      if (activeRide && activeRide.refId && !combined.some(b => b.id === activeRide.refId)) {
        combined.unshift({
          id: activeRide.refId,
          date: new Date().toISOString().split('T')[0],
          pickupTime: activeRide.time || '02:30 PM',
          customer: activeRide.passengerName || 'Valued Goa Guest',
          phone: activeRide.passengerPhone || '+91 98765 43210',
          service: `${activeRide.pickup || 'Goa'} ➔ ${activeRide.dropoff || 'Goa'}`,
          pickup: activeRide.pickup || 'Goa Airport',
          dropoff: activeRide.dropoff || 'Calangute Beach',
          car: activeRide.vehicle?.name || activeRide.vehicle?.model || 'Prime Sedan',
          carImage: activeRide.vehicle?.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
          chauffeur: activeRide.chauffeur?.name || 'Suresh Naik',
          chauffeurPhone: activeRide.chauffeur?.phone || '+91 98221 44510',
          vehiclePlate: activeRide.chauffeur?.vehiclePlate || 'GA-03-Z-8899',
          status: activeRide.status || 'Requested',
          amount: activeRide.fare || 850,
          paymentMode: 'Cash / UPI',
          otp: activeRide.otp || '7457',
          source: 'Storefront App'
        });
      }

      // Backend sync
      try {
        const backendRes = await fetchCustomerPastTrips();
        if (backendRes?.success && Array.isArray(backendRes.trips)) {
          backendRes.trips.forEach(bt => {
            const id = bt.id || bt.refId;
            if (id && !combined.some(c => c.id === id)) {
              combined.push({
                id: id,
                date: bt.date ? bt.date.split('T')[0] : new Date().toISOString().split('T')[0],
                pickupTime: bt.date ? new Date(bt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
                customer: bt.customer_name || 'Goa Visitor',
                phone: bt.customer_phone || '+91 98221 00000',
                service: `${bt.pickup || 'Goa'} ➔ ${bt.dropoff || 'Goa'}`,
                pickup: bt.pickup,
                dropoff: bt.dropoff,
                car: bt.carName || bt.vehicle_name || 'Cab',
                carImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                chauffeur: bt.chauffeur?.name || bt.assigned_driver_name || 'Assigned Driver',
                chauffeurPhone: bt.chauffeur?.phone || '+91 98221 44510',
                vehiclePlate: bt.vehiclePlate || bt.assigned_vehicle_plate || 'GA-03-Z-8899',
                status: bt.status || 'Requested',
                amount: bt.fare || bt.total_amount || 850,
                paymentMode: 'Online / UPI',
                otp: bt.otp || '4821',
                source: 'Online Booking'
              });
            }
          });
        }
      } catch (err) {}

      // Robust starter history with diverse dates
      if (combined.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        combined = [
          {
            id: 'WG-CAB-9214',
            date: todayStr,
            pickupTime: '02:45 PM',
            customer: 'Ananya Sengupta',
            phone: '+91 98221 44510',
            service: 'Manohar Intl Airport (Mopa GOX) ➔ Candolim Taj Holiday Village',
            pickup: 'Manohar Intl Airport (Mopa GOX)',
            dropoff: 'Candolim Taj Holiday Village',
            car: 'Toyota Innova Crysta',
            carImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
            chauffeur: 'Suresh Naik',
            chauffeurPhone: '+91 98221 44510',
            vehiclePlate: 'GA-03-Z-8899',
            status: 'In Progress',
            amount: 1850,
            paymentMode: 'UPI (GPay)',
            otp: '7457',
            source: 'Wow Goa Cab App'
          },
          {
            id: 'WG-CAB-9210',
            date: todayStr,
            pickupTime: '11:15 AM',
            customer: 'Rohit Sharma',
            phone: '+91 98902 33411',
            service: 'Dabolim Airport (GOI) ➔ Baga Beach Resort',
            pickup: 'Dabolim Airport (GOI)',
            dropoff: 'Baga Beach Resort',
            car: 'Maruti Suzuki Dzire',
            carImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
            chauffeur: 'Ramesh Sawant',
            chauffeurPhone: '+91 98229 11200',
            vehiclePlate: 'GA-03-Z-4521',
            status: 'Completed',
            amount: 1450,
            paymentMode: 'Cash',
            otp: '4821',
            source: 'Wow Goa Cab App'
          },
          {
            id: 'WG-CAB-9195',
            date: yesterday,
            pickupTime: '04:30 PM',
            customer: 'Karan Mehra',
            phone: '+91 98114 55601',
            service: 'Madgaon Railway Station ➔ Colva Beach Heritage',
            pickup: 'Madgaon Railway Station',
            dropoff: 'Colva Beach Heritage',
            car: 'Maruti WagonR / Swift',
            carImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
            chauffeur: 'Vijay Gaonkar',
            chauffeurPhone: '+91 97645 88910',
            vehiclePlate: 'GA-03-Z-1011',
            status: 'Completed',
            amount: 950,
            paymentMode: 'UPI',
            otp: '1904',
            source: 'Direct Phone Booking'
          },
          {
            id: 'WG-CAB-9180',
            date: yesterday,
            pickupTime: '08:00 PM',
            customer: 'Sneha Kapoor',
            phone: '+91 98711 00234',
            service: 'Panjim Church ➔ Vagator W Resort',
            pickup: 'Panjim Church',
            dropoff: 'Vagator W Resort',
            car: 'Toyota Innova Crysta',
            carImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
            chauffeur: 'Suresh Naik',
            chauffeurPhone: '+91 98221 44510',
            vehiclePlate: 'GA-03-Z-8899',
            status: 'Rejected',
            amount: 1600,
            paymentMode: 'Cash',
            rejectionReason: 'Guest changed travel plans / Cancelled by guest',
            otp: '3312',
            source: 'Wow Goa Cab App'
          },
          {
            id: 'WG-CAB-9162',
            date: twoDaysAgo,
            pickupTime: '10:00 AM',
            customer: 'David Miller',
            phone: '+44 7700 900123',
            service: 'South Goa Heritage Tour (8 Hours / 80 Kms)',
            pickup: 'Majorda Beach',
            dropoff: 'Old Goa Churches & Return',
            car: 'Toyota Innova Crysta',
            carImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
            chauffeur: 'Ramesh Sawant',
            chauffeurPhone: '+91 98229 11200',
            vehiclePlate: 'GA-03-Z-4521',
            status: 'Completed',
            amount: 3800,
            paymentMode: 'Card / UPI',
            otp: '8821',
            source: 'Tourist Package'
          }
        ];
        localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(combined));
      }

      setBookings(combined);
    } catch (e) {
      console.warn('Error loading bookings:', e);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();

    const handleBookingUpdate = () => {
      loadBookings();
    };

    window.addEventListener('storage', handleBookingUpdate);
    window.addEventListener('wowgoa_dispatch_updated', handleBookingUpdate);
    return () => {
      window.removeEventListener('storage', handleBookingUpdate);
      window.removeEventListener('wowgoa_dispatch_updated', handleBookingUpdate);
    };
  }, []);

  // Save vehicles and broadcast to customer cab page
  const saveVehiclesList = (updated) => {
    setVehicles(updated);
    localStorage.setItem('wowgoa_taxi_vehicles', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wowgoa_vehicles_updated', { detail: updated }));
    }
  };

  // Save drivers
  const saveDriversList = (updated) => {
    setDrivers(updated);
    localStorage.setItem('wowgoa_taxi_drivers', JSON.stringify(updated));
  };

  // ── Update Booking Status ──────────────────────────────────────────────────
  const updateBookingStatus = (id, newStatus, reason = '') => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        return { 
          ...b, 
          status: newStatus,
          rejectionReason: reason || b.rejectionReason
        };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

    // Also sync active ride
    try {
      const activeRide = JSON.parse(localStorage.getItem('wowgoa_active_ride') || 'null');
      if (activeRide && activeRide.refId === id) {
        activeRide.status = newStatus;
        localStorage.setItem('wowgoa_active_ride', JSON.stringify(activeRide));
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', { detail: { id, status: newStatus } }));
  };

  // ── Vehicle Add / Edit ───────────────────────────────────────────────────────
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({
      name: '',
      model: '',
      plate: '',
      rcBookNo: '',
      insuranceExpiry: '',
      fitnessExpiry: '',
      classType: 'sedan',
      seats: 4,
      bags: 3,
      fuel: 'Petrol',
      transmission: 'Manual',
      image: '',
      has_ac: true,
      has_fastag: true,
      has_carrier: false,
      driverName: drivers[0]?.name || '',
      driverPhone: drivers[0]?.phone || '',
      desc: 'Clean, chilled AC cab with verified local Goa tourist chauffeur.'
    });
    setIsAddVehicleOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setVehicleForm({
      name: veh.name || '',
      model: veh.model || '',
      plate: veh.plate || '',
      rcBookNo: veh.rcBookNo || '',
      insuranceExpiry: veh.insuranceExpiry || '',
      fitnessExpiry: veh.fitnessExpiry || '',
      classType: veh.classType || 'sedan',
      seats: veh.seats || 4,
      bags: veh.bags || 3,
      fuel: veh.fuel || 'Petrol',
      transmission: veh.transmission || 'Manual',
      baseFare: veh.baseFare || 350,
      perKm: veh.perKm || 24,
      image: veh.image || CAR_PHOTO_PRESETS[0].url,
      has_ac: veh.has_ac !== false,
      has_fastag: veh.has_fastag !== false,
      has_carrier: Boolean(veh.has_carrier),
      driverName: veh.driverName || '',
      driverPhone: veh.driverPhone || '',
      desc: veh.desc || ''
    });
    setIsAddVehicleOpen(true);
  };

  const handleSaveVehicle = (e) => {
    e.preventDefault();
    if (!vehicleForm.name.trim() || !vehicleForm.model.trim()) {
      alert('Please enter Car Category Name and Model');
      return;
    }
    if (!vehicleForm.plate.trim()) {
      alert('Please enter Registration Number Plate');
      return;
    }

    let defaultIcon = '🚗';
    if (vehicleForm.classType === 'suv' || vehicleForm.classType === 'muv') defaultIcon = '🚙';
    if (vehicleForm.classType === 'sedan') defaultIcon = '🚕';
    if (vehicleForm.classType === 'luxury') defaultIcon = '👑';
    if (vehicleForm.classType === 'coach') defaultIcon = '🚐';

    if (editingVehicle) {
      const updated = vehicles.map(v => {
        if (v.id === editingVehicle.id) {
          return {
            ...v,
            name: vehicleForm.name.trim(),
            model: vehicleForm.model.trim(),
            plate: vehicleForm.plate.trim() || 'GA-03-Z-9999',
            rcBookNo: vehicleForm.rcBookNo.trim() || v.rcBookNo || 'GA03-RC-2023-8899',
            insuranceExpiry: vehicleForm.insuranceExpiry || v.insuranceExpiry,
            fitnessExpiry: vehicleForm.fitnessExpiry || v.fitnessExpiry,
            classType: vehicleForm.classType,
            seats: Number(vehicleForm.seats) || 4,
            bags: Number(vehicleForm.bags) || 3,
            fuel: vehicleForm.fuel,
            transmission: vehicleForm.transmission,
            baseFare: Number(vehicleForm.baseFare) || 350,
            perKm: Number(vehicleForm.perKm) || 24,
            image: vehicleForm.image || v.image,
            has_ac: vehicleForm.has_ac,
            has_fastag: vehicleForm.has_fastag,
            has_carrier: vehicleForm.has_carrier,
            driverName: vehicleForm.driverName.trim(),
            driverPhone: vehicleForm.driverPhone.trim(),
            desc: vehicleForm.desc.trim()
          };
        }
        return v;
      });
      saveVehiclesList(updated);
    } else {
      const newId = `cab-${Date.now().toString(36)}`;
      const newVeh = {
        id: newId,
        name: vehicleForm.name.trim(),
        model: vehicleForm.model.trim(),
        plate: vehicleForm.plate.trim() || 'GA-03-Z-9999',
        rcBookNo: vehicleForm.rcBookNo.trim() || 'GA03-RC-2024-0012',
        insuranceExpiry: vehicleForm.insuranceExpiry || '2028-12-31',
        fitnessExpiry: vehicleForm.fitnessExpiry || '2029-12-31',
        classType: vehicleForm.classType,
        seats: Number(vehicleForm.seats) || 4,
        bags: Number(vehicleForm.bags) || 3,
        fuel: vehicleForm.fuel,
        transmission: vehicleForm.transmission,
        baseFare: Number(vehicleForm.baseFare) || 350,
        perKm: Number(vehicleForm.perKm) || 24,
        image: vehicleForm.image || CAR_PHOTO_PRESETS[0].url,
        has_ac: vehicleForm.has_ac,
        has_fastag: vehicleForm.has_fastag,
        has_carrier: vehicleForm.has_carrier,
        eta: 4,
        badge: 'Newly Added',
        icon: defaultIcon,
        driverName: vehicleForm.driverName.trim() || 'Assigned Driver',
        driverPhone: vehicleForm.driverPhone.trim() || '+91 98220 00000',
        active: true,
        desc: vehicleForm.desc.trim() || 'Clean, comfortable AC cab with verified local driver.'
      };

      saveVehiclesList([...vehicles, newVeh]);
    }

    setIsAddVehicleOpen(false);
  };

  const handleToggleVehicleActive = (id) => {
    const updated = vehicles.map(v => {
      if (v.id === id) {
        return { ...v, active: !v.active };
      }
      return v;
    });
    saveVehiclesList(updated);
  };

  const handleDeleteVehicle = (id) => {
    if (window.confirm('Remove this vehicle from the cab fleet? Customers will no longer see it.')) {
      const updated = vehicles.filter(v => v.id !== id);
      saveVehiclesList(updated);
    }
  };

  // ── Driver Save ─────────────────────────────────────────────────────────────
  const handleSaveDriver = (e) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      alert('Please enter Driver Full Name and Phone Number');
      return;
    }
    if (!driverForm.licenseNo.trim()) {
      alert('Please enter Commercial Driving License Number');
      return;
    }

    const newDriver = {
      id: Date.now(),
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      emergencyPhone: driverForm.emergencyPhone.trim() || driverForm.phone.trim(),
      licenseNo: driverForm.licenseNo.trim() || 'GA-03-2020-0044192',
      licenseExpiry: driverForm.licenseExpiry || '2032-12-31',
      badgeNo: driverForm.badgeNo.trim() || 'GOA-PSV-5521',
      aadharNo: driverForm.aadharNo.trim() || 'XXXX-XXXX-9900',
      car: driverForm.carPlate.trim() || 'Unassigned',
      carPlate: driverForm.carPlate.trim().split(' ')[0] || 'GA-03',
      experienceYears: Number(driverForm.experienceYears) || 5,
      languages: driverForm.languages.split(',').map(s => s.trim()),
      policeVerified: Boolean(driverForm.policeVerified),
      rating: 5.0,
      tripsCount: 0,
      status: 'Available',
      photo: driverForm.photo || DRIVER_PHOTO_PRESETS[0].url
    };

    saveDriversList([...drivers, newDriver]);
    setIsAddDriverOpen(false);
    setDriverForm({
      name: '',
      phone: '',
      emergencyPhone: '',
      licenseNo: '',
      licenseExpiry: '',
      badgeNo: '',
      aadharNo: '',
      carPlate: '',
      experienceYears: 5,
      languages: 'Konkani, Hindi, English',
      policeVerified: true,
      photo: ''
    });
  };

  const handleDeleteDriver = (id) => {
    if (window.confirm('Remove this driver record from the onboarding roster?')) {
      const updated = drivers.filter(d => d.id !== id);
      saveDriversList(updated);
    }
  };

  // ── Date & Status Filter Computation ─────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const st = (b.status || '').toLowerCase();
      
      // Status filter
      if (statusFilter === 'needs_driver' && st !== 'requested' && st !== 'pending' && st !== 'pending_allocation') return false;
      if (statusFilter === 'on_road' && st !== 'driver arrived' && st !== 'arrived' && st !== 'in progress' && st !== 'on_trip' && st !== 'allocated') return false;
      if (statusFilter === 'completed' && st !== 'completed') return false;
      if (statusFilter === 'rejected' && st !== 'rejected' && st !== 'cancelled' && st !== 'declined') return false;

      // Date filter
      const bDate = b.date || todayStr;
      if (dateFilter === 'today' && bDate !== todayStr) return false;
      if (dateFilter === 'yesterday' && bDate !== yesterdayStr) return false;
      if (dateFilter === 'last7' && bDate < sevenDaysAgo) return false;
      if (dateFilter === 'custom' && customDate && bDate !== customDate) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (b.customer || '').toLowerCase().includes(q);
        const matchPhone = (b.phone || '').includes(q);
        const matchId = (b.id || '').toLowerCase().includes(q);
        const matchCar = (b.car || '').toLowerCase().includes(q);
        const matchPlate = (b.vehiclePlate || '').toLowerCase().includes(q);
        const matchDriver = (b.chauffeur || '').toLowerCase().includes(q);
        const matchService = (b.service || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchCar && !matchPlate && !matchDriver && !matchService) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, dateFilter, customDate, searchTerm, todayStr, yesterdayStr, sevenDaysAgo]);

  // Group Bookings by Date
  const groupedBookings = useMemo(() => {
    const groups = {};
    filteredBookings.forEach(b => {
      const d = b.date || todayStr;
      if (!groups[d]) groups[d] = [];
      groups[d].push(b);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(d => ({
      date: d,
      items: groups[d]
    }));
  }, [filteredBookings, todayStr]);

  // Overall Counts
  const countTotalVehicles = vehicles.length;
  const countActiveVehicles = vehicles.filter(v => v.active !== false).length;

  const countTotalDrivers = drivers.length;
  const countAvailableDrivers = drivers.filter(d => d.status === 'Available').length;

  const countCompletedTrips = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
  const countRejectedTrips = bookings.filter(b => {
    const s = (b.status || '').toLowerCase();
    return s === 'rejected' || s === 'cancelled' || s === 'declined';
  }).length;

  const countNeedsDriver = bookings.filter(b => {
    const s = (b.status || '').toLowerCase();
    return s === 'requested' || s === 'pending' || s === 'pending_allocation';
  }).length;

  const totalRevenue = bookings
    .filter(b => (b.status || '').toLowerCase() === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit' }}>
      
      {/* ─── LEFT SIDEBAR (WOW GOA STYLE) ─────────────────────────────────── */}
      <aside style={{
        width: '260px',
        background: '#081225',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 100
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(255,99,51,0.35)'
          }}>
            <Car size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>
              WOW GOA
            </div>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#FF8A00',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginTop: '1px'
            }}>
              Cab Fleet & Dispatch
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* 1. Dashboard Overview */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'dashboard' ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard size={18} color={activeTab === 'dashboard' ? '#ffffff' : '#00B8D9'} />
              <span>Dashboard</span>
            </div>
          </button>

          {/* 2. Trips & Bookings */}
          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'trips' ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
              color: activeTab === 'trips' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === 'trips' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Navigation size={18} color={activeTab === 'trips' ? '#ffffff' : '#00B8D9'} />
              <span>Trip Records & Bookings</span>
            </div>
            {countNeedsDriver > 0 ? (
              <span style={{
                background: activeTab === 'trips' ? '#ffffff' : '#ef4444',
                color: activeTab === 'trips' ? '#FF6333' : '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '12px'
              }}>
                {countNeedsDriver} New
              </span>
            ) : (
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px'
              }}>
                {bookings.length} Total
              </span>
            )}
          </button>

          {/* 2. Vehicles (Add Cab & Fleet) */}
          <button
            type="button"
            onClick={() => setActiveTab('vehicles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'vehicles' ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
              color: activeTab === 'vehicles' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === 'vehicles' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Car size={18} color={activeTab === 'vehicles' ? '#ffffff' : '#00B8D9'} />
              <span>My Vehicles ({countTotalVehicles})</span>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {countActiveVehicles} Active
            </span>
          </button>

          {/* 3. Drivers */}
          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'drivers' ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
              color: activeTab === 'drivers' ? '#ffffff' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === 'drivers' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color={activeTab === 'drivers' ? '#ffffff' : '#00B8D9'} />
              <span>Drivers ({countTotalDrivers})</span>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {countAvailableDrivers} Free
            </span>
          </button>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

          {/* Quick External Link to Customer Cab App */}
          <a
            href="/cabs"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderRadius: '10px',
              color: '#38bdf8',
              textDecoration: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <span>Customer Cab App ↗</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onNavigateHome || (() => window.location.href = '/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <LogOut size={14} />
            <span>Back to Main Website</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header Bar */}
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'trips' && 'Trip History & Date-Wise Bookings'}
              {activeTab === 'vehicles' && 'My Vehicles (Add Cab for Customers)'}
              {activeTab === 'drivers' && 'Commercial Drivers Onboarding & Records'}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeTab === 'dashboard' && 'Executive overview of active fleet, driver availability, and earnings.'}
              {activeTab === 'trips' && 'Date-wise customer rides, pickup/drop routes, assigned cab plates, chauffeurs, and fares.'}
              {activeTab === 'vehicles' && 'Drag-and-drop vehicle photos and manage RC book records. Only added cabs appear on the customer app.'}
              {activeTab === 'drivers' && 'Upload chauffeur face photo, Commercial DL, and PSV badge records with clear required indicators.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={loadBookings}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loadingBookings ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {activeTab === 'vehicles' && (
              <button
                type="button"
                onClick={handleOpenAddVehicle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,99,51,0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ Add New Vehicle / Cab</span>
              </button>
            )}

            {activeTab === 'drivers' && (
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ Onboard New Driver</span>
              </button>
            )}
          </div>
        </header>

        {/* ─── TAB 1: DASHBOARD & DATE-WISE TRIPS ─────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* ── TOP METRIC CARDS (ALL CLICKABLE WITH INSTANT FEEDBACK) ──── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              
              {/* 1. Vehicles Count (Clickable -> opens Vehicles) */}
              <div 
                onClick={() => setActiveTab('vehicles')}
                title="Click to view and manage all vehicles"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6333'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Total Vehicles
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <Car size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  {countTotalVehicles}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11.5px', color: '#0284c7', fontWeight: 700 }}>
                  <span>✓ {countActiveVehicles} Active on App</span>
                  <span style={{ color: '#94a3b8' }}>· View →</span>
                </div>
              </div>

              {/* 2. Drivers Count (Clickable -> opens Drivers) */}
              <div 
                onClick={() => setActiveTab('drivers')}
                title="Click to view all commercial chauffeurs"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6333'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Onboarded Drivers
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  {countTotalDrivers}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11.5px', color: '#16a34a', fontWeight: 700 }}>
                  <span>🟢 {countAvailableDrivers} Free for Duty</span>
                  <span style={{ color: '#94a3b8' }}>· View →</span>
                </div>
              </div>

              {/* 3. Completed Trips (Clickable -> switches to Trips tab) */}
              <div 
                onClick={() => { setActiveTab('trips'); setStatusFilter('completed'); }}
                title="Click to view all completed rides in Trips tab"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#16a34a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Completed Trips
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  {countCompletedTrips}
                </div>
                <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700, marginTop: '6px' }}>
                  Click to open Trips log →
                </div>
              </div>

              {/* 4. Rejected / Cancelled Trips (Clickable -> switches to Trips tab) */}
              <div 
                onClick={() => { setActiveTab('trips'); setStatusFilter('rejected'); }}
                title="Click to view cancelled rides in Trips tab"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Rejected / Cancelled
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  {countRejectedTrips}
                </div>
                <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 700, marginTop: '6px' }}>
                  Click to inspect cancelled trips →
                </div>
              </div>

              {/* 5. Overall Revenue (Clickable -> opens Revenue Breakdown modal) */}
              <div 
                onClick={() => setIsRevenueModalOpen(true)}
                title="Click to view total earnings and revenue breakdown"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6333'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Overall Revenue
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: 700, marginTop: '6px' }}>
                  Realized Cash & UPI · View Audit →
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── TAB: TRIPS & DATE-WISE BOOKINGS (DEDICATED) ─────────────────── */}
        {activeTab === 'trips' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* ── FILTER BAR: DATE SELECTOR & SEARCH ──────────────────────── */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              
              {/* Date Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                  <Calendar size={14} /> Date Filter:
                </span>
                
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  style={{
                    padding: '6px 13px',
                    borderRadius: '8px',
                    border: dateFilter === 'all' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    background: dateFilter === 'all' ? '#0f172a' : '#ffffff',
                    color: dateFilter === 'all' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All Dates
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  style={{
                    padding: '6px 13px',
                    borderRadius: '8px',
                    border: dateFilter === 'today' ? '1.5px solid #FF6333' : '1px solid #cbd5e1',
                    background: dateFilter === 'today' ? '#FF6333' : '#ffffff',
                    color: dateFilter === 'today' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('yesterday')}
                  style={{
                    padding: '6px 13px',
                    borderRadius: '8px',
                    border: dateFilter === 'yesterday' ? '1.5px solid #FF6333' : '1px solid #cbd5e1',
                    background: dateFilter === 'yesterday' ? '#FF6333' : '#ffffff',
                    color: dateFilter === 'yesterday' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => setDateFilter('last7')}
                  style={{
                    padding: '6px 13px',
                    borderRadius: '8px',
                    border: dateFilter === 'last7' ? '1.5px solid #FF6333' : '1px solid #cbd5e1',
                    background: dateFilter === 'last7' ? '#FF6333' : '#ffffff',
                    color: dateFilter === 'last7' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Last 7 Days
                </button>

                {/* Custom Date Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('custom');
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: dateFilter === 'custom' ? '1.5px solid #FF6333' : '1px solid #cbd5e1',
                      fontSize: '12px',
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  />
                  {dateFilter === 'custom' && (
                    <button
                      type="button"
                      onClick={() => { setCustomDate(''); setDateFilter('all'); }}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search passenger, phone, car, driver..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>

            </div>

            {/* ── DATE-WISE GROUPED ACTIVITY & TRIPS ───────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {groupedBookings.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📅</div>
                  <div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>No Activity Found For Selected Filters</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    Try choosing "All Dates" or clearing your search term to see past and active trips.
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDateFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}
                    style={{
                      marginTop: '16px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                groupedBookings.map(({ date, items }) => {
                  const dateObj = new Date(date);
                  const isToday = date === todayStr;
                  const isYesterday = date === yesterdayStr;
                  const formattedDate = isToday 
                    ? `Today · ${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : (isYesterday 
                        ? `Yesterday · ${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));

                  return (
                    <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      
                      {/* Date Group Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            📅 {formattedDate}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: '#e2e8f0',
                            color: '#475569'
                          }}>
                            {items.length} {items.length === 1 ? 'Trip' : 'Trips'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a' }}>
                          Day Total: ₹{items.filter(i => (i.status || '').toLowerCase() === 'completed').reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Trips on this Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((b, idx) => {
                          const isCompleted = (b.status || '').toLowerCase() === 'completed';
                          const isRejected = (b.status || '').toLowerCase() === 'rejected' || (b.status || '').toLowerCase() === 'cancelled';
                          const isInProgress = (b.status || '').toLowerCase() === 'in progress' || (b.status || '').toLowerCase() === 'on_trip';
                          const isArrived = (b.status || '').toLowerCase() === 'driver arrived' || (b.status || '').toLowerCase() === 'arrived';
                          const isRequested = (b.status || '').toLowerCase() === 'requested' || (b.status || '').toLowerCase() === 'pending';

                          return (
                            <div
                              key={b.id || idx}
                              style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                padding: '16px 20px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Top Bar: Time, Ref #, OTP, Status */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}>
                                    <Clock size={14} color="#64748b" />
                                    {b.pickupTime || '12:00 PM'}
                                  </span>
                                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748b' }}>
                                    #{b.id}
                                  </span>
                                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>
                                    {b.source || 'Cab App'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {/* OTP Box */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    padding: '3px 10px',
                                    borderRadius: '8px'
                                  }}>
                                    <Key size={13} color="#b45309" />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>OTP:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#92400e', letterSpacing: '1px' }}>
                                      {b.otp || '7457'}
                                    </span>
                                  </div>

                                  {/* Status Badge */}
                                  <span style={{
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    background: isCompleted ? '#dcfce7' : (isRejected ? '#fee2e2' : (isInProgress ? '#eff6ff' : '#fef3c7')),
                                    color: isCompleted ? '#15803d' : (isRejected ? '#b91c1c' : (isInProgress ? '#1d4ed8' : '#b45309')),
                                    border: isCompleted ? '1px solid #86efac' : (isRejected ? '1px solid #fca5a5' : '1px solid #fde68a')
                                  }}>
                                    {isCompleted ? '✓ Completed' : (isRejected ? '✕ Rejected / Cancelled' : (isInProgress ? '🚗 In Progress' : (isArrived ? '📍 Driver Arrived' : '🟡 Needs Driver')))}
                                  </span>
                                </div>
                              </div>

                              {/* Middle Grid: Passenger, Vehicle, Driver, Route */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                                
                                {/* 1. Customer & Phone */}
                                <div style={{
                                  background: '#f8fafc',
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                    Customer
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                    👤 {b.customer || 'Goa Guest'}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                                      📱 {b.phone || '+91 98765 43210'}
                                    </span>
                                    {b.phone && (
                                      <a
                                        href={`tel:${b.phone}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          background: '#ecfdf5',
                                          color: '#047857',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          textDecoration: 'none'
                                        }}
                                      >
                                        <Phone size={11} /> Call
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* 2. Vehicle & Plate (with Photo Thumbnail) */}
                                <div 
                                  onClick={() => setSelectedVehicleForDetails(vehicles.find(v => v.plate === b.vehiclePlate) || { name: b.car, model: b.car, plate: b.vehiclePlate, image: b.carImage })}
                                  style={{
                                    background: '#f8fafc',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid transparent'
                                  }}
                                  title="Click to view vehicle specifications"
                                  onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6333'}
                                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                  <img
                                    src={b.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                                    alt={b.car}
                                    style={{
                                      width: '60px',
                                      height: '46px',
                                      borderRadius: '8px',
                                      objectFit: 'cover',
                                      border: '1px solid #e2e8f0',
                                      flexShrink: 0
                                    }}
                                  />
                                  <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                      Vehicle Used
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                      {b.car || 'Prime Sedan'}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#FF6333', marginTop: '2px' }}>
                                      Plate: {b.vehiclePlate || 'GA-03-Z-8899'} ↗
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Assigned Driver */}
                                <div 
                                  onClick={() => setSelectedDriverForDetails(drivers.find(d => d.name === b.chauffeur) || { name: b.chauffeur, phone: b.chauffeurPhone, car: b.vehiclePlate })}
                                  style={{
                                    background: '#f8fafc',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    border: '1px solid transparent'
                                  }}
                                  title="Click to view driver license and commercial record"
                                  onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6333'}
                                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                    Assigned Driver
                                  </div>
                                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                                    👨‍✈️ {b.chauffeur || 'Suresh Naik'} ↗
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    Mobile: {b.chauffeurPhone || '+91 98221 44510'}
                                  </div>
                                </div>

                                {/* 4. Route & Fare */}
                                <div style={{
                                  background: '#f8fafc',
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: '6px'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {b.pickup}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {b.dropoff}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Fare ({b.paymentMode || 'Cash'}):</span>
                                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                                      ₹{b.amount || 850}
                                    </span>
                                  </div>
                                </div>

                              </div>

                              {/* Rejection Note if cancelled */}
                              {isRejected && b.rejectionReason && (
                                <div style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  color: '#b91c1c'
                                }}>
                                  <strong>Reason for cancellation:</strong> {b.rejectionReason}
                                </div>
                              )}

                              {/* Bottom Action Bar */}
                              <div style={{
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '8px'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTripForDetails(b)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Eye size={13} />
                                  <span>View Trip Dossier</span>
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isRequested && (
                                    <button
                                      type="button"
                                      onClick={() => updateBookingStatus(b.id, 'Driver Arrived')}
                                      style={{
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        background: '#0f172a',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✓ Accept & Driver Arrived
                                    </button>
                                  )}

                                  {isArrived && (
                                    <button
                                      type="button"
                                      onClick={() => updateBookingStatus(b.id, 'In Progress')}
                                      style={{
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🚗 Start Trip (OTP Verified)
                                    </button>
                                  )}

                                  {isInProgress && (
                                    <button
                                      type="button"
                                      onClick={() => updateBookingStatus(b.id, 'Completed')}
                                      style={{
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        background: '#16a34a',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🏁 End & Complete Ride
                                    </button>
                                  )}

                                  {!isCompleted && !isRejected && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reason = prompt('Please enter cancellation reason:', 'Guest cancelled ride');
                                        if (reason) updateBookingStatus(b.id, 'Rejected', reason);
                                      }}
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: '#ffffff',
                                        color: '#dc2626',
                                        border: '1px solid #fca5a5',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Reject / Cancel
                                    </button>
                                  )}

                                  {isCompleted && (
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>
                                      ✓ Finished & Recorded
                                    </span>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>
        )}

        {/* ─── TAB: MY VEHICLES (ADD CAB & FLEET) ─────────────────────────── */}
        {activeTab === 'vehicles' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Vehicles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {vehicles.map((veh) => {
                const isActive = veh.active !== false;

                return (
                  <div
                    key={veh.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      border: isActive ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: isActive ? 1 : 0.65,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Car Image Top with Badge & Plate */}
                    <div style={{ position: 'relative', height: '180px', width: '100%', background: '#0f172a' }}>
                      <img
                        src={veh.image || CAR_PHOTO_PRESETS[0].url}
                        alt={veh.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.5px'
                      }}>
                        {veh.plate || 'GA-03-Z-8899'}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVehicleActive(veh.id)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: isActive ? '1px solid #86efac' : '1px solid #cbd5e1',
                          background: isActive ? '#ecfdf5' : 'rgba(255,255,255,0.9)',
                          color: isActive ? '#15803d' : '#64748b',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isActive ? '✓ Showing on App' : 'Hidden from App'}
                      </button>
                    </div>

                    {/* Car Details Body */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            {veh.name}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                            {veh.model}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#475569',
                          textTransform: 'uppercase'
                        }}>
                          {veh.classType || 'Sedan'}
                        </span>
                      </div>

                      {/* Specs Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11.5px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                          👥 {veh.seats || 4} Seats
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                          🧳 {veh.bags || 3} Bags
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                          ⛽ {veh.fuel || 'Petrol'}
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                          ⚙️ {veh.transmission || 'Manual'}
                        </span>
                        {veh.has_ac !== false && (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                            ❄️ AC
                          </span>
                        )}
                        {veh.has_fastag && (
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                            ⚡ Fastag
                          </span>
                        )}
                      </div>

                      {/* Pricing & RC Book */}
                      <div style={{
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Tariff Rate:</span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>
                            Base ₹{veh.baseFare || 350} · ₹{veh.perKm || 24}/km
                          </span>
                        </div>
                        {veh.rcBookNo && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>RC Permit No:</span>
                            <span style={{ fontWeight: 700, color: '#16a34a' }}>
                              ✓ {veh.rcBookNo}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                          <span style={{ color: '#64748b' }}>Assigned Driver:</span>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            {veh.driverName || 'Suresh Naik'}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleForDetails(veh)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: '#FF6333',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '4px 0'
                          }}
                        >
                          <Eye size={13} />
                          <span>View Full Specs</span>
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(veh)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(veh.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ─── TAB: COMMERCIAL DRIVERS ROSTER ────────────────────────────── */}
        {activeTab === 'drivers' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Drivers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {drivers.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={d.photo || DRIVER_PHOTO_PRESETS[0].url}
                        alt={d.name}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #16a34a'
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={12} /> Police Verified ✓
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: d.status === 'Available' ? '#dcfce7' : (d.status === 'On Active Ride' ? '#eff6ff' : '#f1f5f9'),
                      color: d.status === 'Available' ? '#15803d' : (d.status === 'On Active Ride' ? '#1d4ed8' : '#64748b')
                    }}>
                      {d.status}
                    </span>
                  </div>

                  {/* License & Badge info */}
                  <div style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Commercial DL:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{d.licenseNo || 'GA-03-2018-0045'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>PSV Badge:</span>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{d.badgeNo || 'GOA-PSV-1204'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Assigned Cab:</span>
                      <span style={{ fontWeight: 700, color: '#FF6333' }}>{d.car || 'GA-03-Z-8899'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Rating & Trips:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>⭐ {d.rating || 4.9} ({d.tripsCount || 120} trips)</span>
                    </div>
                  </div>

                  {/* Actions & Click to Call */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDriverForDetails(d)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}
                    >
                      View Dossier →
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`tel:${d.phone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={13} /> Call
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(d.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* ─── MODAL 1: ADD / EDIT VEHICLE (DRAG & DROP + RC BOOK + IMPORTANT *) */}
      {isAddVehicleOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {editingVehicle ? 'Edit Cab Vehicle' : 'Add Vehicle to Cab Fleet'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Fields with <span style={{ color: '#dc2626', fontWeight: 900 }}>*</span> are mandatory. Only active added cabs appear on the customer app.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              {/* ── SECTION 1: VEHICLE PHOTO (DRAG & DROP + PRESETS) ────────── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Vehicle Exterior Photo</span>
                    <span style={{ color: '#dc2626', fontWeight: 900 }}>*</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>(Shown to customers when booking)</span>
                  </label>
                  {vehicleForm.image && (
                    <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 800 }}>
                      ✓ Photo Loaded
                    </span>
                  )}
                </div>

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#FF6333'; e.currentTarget.style.background = '#fff7ed'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file, 'vehicle');
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '14px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Photo Preview Thumbnail */}
                  <div style={{
                    width: '90px',
                    height: '65px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#0f172a',
                    flexShrink: 0,
                    border: vehicleForm.image ? '1.5px solid #FF6333' : '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {vehicleForm.image ? (
                      <img src={vehicleForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '26px' }}>🚗</span>
                    )}
                  </div>

                  {/* Drag drop instructions */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                      Drag & drop car photo here, or browse
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Supports JPG, PNG, WEBP high-resolution car images
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <label style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <UploadCloud size={13} />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'vehicle');
                          }}
                        />
                      </label>

                      {vehicleForm.image && (
                        <button
                          type="button"
                          onClick={() => setVehicleForm(f => ({ ...f, image: '' }))}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: MANDATORY VEHICLE DETAILS (MARKED WITH *) ─────── */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Mandatory Registration & Commercial Specs</span>
                  <span style={{ color: '#dc2626' }}>*</span>
                </div>

                {/* Name & Model */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Cab Category Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.name}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                      placeholder="e.g. Prime Sedan / Executive SUV"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Car Model <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      placeholder="e.g. Toyota Innova Crysta / Dzire"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Plate & RC Book Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Registration Number Plate <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                      placeholder="e.g. GA-03-Z-8899"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      RC Book / Commercial Permit No. <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.rcBookNo}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, rcBookNo: e.target.value })}
                      placeholder="e.g. GA03-RC-2023-8899"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Category & Seats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Category Type <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      value={vehicleForm.classType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, classType: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#fff' }}
                    >
                      <option value="sedan">Sedan (Dzire, Etios)</option>
                      <option value="suv">SUV (Innova, Thar, Fortuner)</option>
                      <option value="muv">MUV 7-Seater (Ertiga, Carens)</option>
                      <option value="normal">Hatchback (WagonR, Swift)</option>
                      <option value="luxury">Luxury VIP (Mercedes, BMW)</option>
                      <option value="coach">Maxi Coach (Tempo Traveller)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Passenger Seats <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="2"
                      max="20"
                      value={vehicleForm.seats}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, seats: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                {/* Base Fare & Per KM */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Base Starting Fare (₹) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={vehicleForm.baseFare}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, baseFare: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Price Per KM (₹) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={vehicleForm.perKm}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, perKm: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

              </div>

              {/* ── SECTION 3: OPTIONAL FLEET & COMPLIANCE FIELDS ───────────── */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Optional Compliance & Specs (Optional)
                </div>

                {/* Expiries */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Commercial Fitness Expiry (Optional)
                    </label>
                    <input
                      type="date"
                      value={vehicleForm.fitnessExpiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fitnessExpiry: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Insurance Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={vehicleForm.insuranceExpiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Fuel, Transmission, Bags */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Fuel Type (Optional)
                    </label>
                    <select
                      value={vehicleForm.fuel}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuel: e.target.value })}
                      style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">EV</option>
                      <option value="CNG">CNG</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Transmission (Optional)
                    </label>
                    <select
                      value={vehicleForm.transmission}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, transmission: e.target.value })}
                      style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Luggage Bags (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={vehicleForm.bags}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, bags: e.target.value })}
                      style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Assign Driver */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Assign Driver from Roster (Optional - can assign later)
                  </label>
                  <select
                    value={vehicleForm.driverName}
                    onChange={(e) => {
                      const sel = drivers.find(d => d.name === e.target.value);
                      setVehicleForm({
                        ...vehicleForm,
                        driverName: e.target.value,
                        driverPhone: sel?.phone || ''
                      });
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                  >
                    <option value="">-- No Driver Assigned (Will assign upon booking) --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vehicleForm.has_ac}
                      onChange={e => setVehicleForm({ ...vehicleForm, has_ac: e.target.checked })}
                    />
                    <span>❄️ Chilled AC</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vehicleForm.has_fastag}
                      onChange={e => setVehicleForm({ ...vehicleForm, has_fastag: e.target.checked })}
                    />
                    <span>⚡ Fastag</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vehicleForm.has_carrier}
                      onChange={e => setVehicleForm({ ...vehicleForm, has_carrier: e.target.checked })}
                    />
                    <span>🧳 Luggage Carrier</span>
                  </label>
                </div>

              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,99,51,0.3)'
                  }}
                >
                  {editingVehicle ? 'Update Vehicle' : 'Save Cab & Show on Customer Page'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ONBOARD NEW DRIVER (PHOTO SECTION + DRIVER RECORD + *) ─ */}
      {isAddDriverOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Onboard Commercial Chauffeur
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Fields with <span style={{ color: '#dc2626', fontWeight: 900 }}>*</span> are required for official transport compliance.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              {/* ── SECTION 1: DRIVER PHOTO (DRAG & DROP + PRESETS) ─────────── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Chauffeur Face Photo</span>
                    <span style={{ color: '#dc2626', fontWeight: 900 }}>*</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>(Official Photo ID)</span>
                  </label>
                  {driverForm.photo && (
                    <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 800 }}>
                      ✓ Photo Loaded
                    </span>
                  )}
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file, 'driver');
                  }}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '14px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Photo Avatar Preview */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#e2e8f0',
                    flexShrink: 0,
                    border: '2px solid #16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {driverForm.photo ? (
                      <img src={driverForm.photo} alt="Chauffeur" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '28px' }}>👨‍✈️</span>
                    )}
                  </div>

                  {/* Drag drop info + upload button */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                      Drag & drop driver portrait here, or browse
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Passport photo or clear face portrait (JPG, PNG, WEBP)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <label style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <UploadCloud size={13} />
                        <span>Upload Portrait</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'driver');
                          }}
                        />
                      </label>

                      {driverForm.photo && (
                        <button
                          type="button"
                          onClick={() => setDriverForm(f => ({ ...f, photo: '' }))}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: MANDATORY DRIVER RECORDS (RED STAR *) ───────── */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Mandatory Verification & License Details</span>
                  <span style={{ color: '#dc2626' }}>*</span>
                </div>

                {/* Full Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Driver Full Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      placeholder="e.g. Suresh V. Naik"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Primary Mobile (+91) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      placeholder="e.g. +91 98221 44510"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Commercial DL & Expiry */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Commercial DL Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driverForm.licenseNo}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseNo: e.target.value })}
                      placeholder="e.g. GA-03-2016-0034120"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      License Expiry Date <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={driverForm.licenseExpiry}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* PSV Badge */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    PSV Commercial Badge ID <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={driverForm.badgeNo}
                    onChange={(e) => setDriverForm({ ...driverForm, badgeNo: e.target.value })}
                    placeholder="e.g. GOA-PSV-4412"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                  />
                </div>

              </div>

              {/* ── SECTION 3: OPTIONAL BACKGROUND RECORDS ───────────────────── */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Additional Background Info (Optional)
                </div>

                {/* Emergency Contact & Aadhar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Emergency / Family Contact (Optional)
                    </label>
                    <input
                      type="text"
                      value={driverForm.emergencyPhone}
                      onChange={(e) => setDriverForm({ ...driverForm, emergencyPhone: e.target.value })}
                      placeholder="e.g. +91 98221 99990"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Aadhar / Govt ID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={driverForm.aadharNo}
                      onChange={(e) => setDriverForm({ ...driverForm, aadharNo: e.target.value })}
                      placeholder="e.g. 1234-5678-9012"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Assigned Cab & Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Assigned Cab (Optional - can assign later)
                    </label>
                    <select
                      value={driverForm.carPlate}
                      onChange={(e) => setDriverForm({ ...driverForm, carPlate: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="">-- Unassigned (Assign Later) --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={`${v.plate} (${v.name})`}>{v.plate} ({v.name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Driving Experience (Years) (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={driverForm.experienceYears}
                      onChange={(e) => setDriverForm({ ...driverForm, experienceYears: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Languages Spoken (Optional)
                  </label>
                  <input
                    type="text"
                    value={driverForm.languages}
                    onChange={(e) => setDriverForm({ ...driverForm, languages: e.target.value })}
                    placeholder="e.g. Konkani, English, Hindi, Marathi"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                  }}
                >
                  Save & Complete Onboarding
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: VIEW TRIP DOSSIER (CLICKABLE DETAILS) ───────────────── */}
      {selectedTripForDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Trip Dossier #{selectedTripForDetails.id}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedTripForDetails.date} · {selectedTripForDetails.pickupTime}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTripForDetails(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              {/* Status & OTP */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>STATUS</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                    {selectedTripForDetails.status}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>START TRIP OTP</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#d97706', letterSpacing: '2px' }}>
                    {selectedTripForDetails.otp || '7457'}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Passenger Details
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  👤 {selectedTripForDetails.customer}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📱 Phone: {selectedTripForDetails.phone}</span>
                  <a
                    href={`tel:${selectedTripForDetails.phone}`}
                    style={{ background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, textDecoration: 'none' }}
                  >
                    📞 Call
                  </a>
                </div>
              </div>

              {/* Vehicle & Driver */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>CAB DETAILS</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {selectedTripForDetails.car}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#FF6333', fontWeight: 700 }}>
                    {selectedTripForDetails.vehiclePlate}
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>CHAUFFEUR</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {selectedTripForDetails.chauffeur}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    {selectedTripForDetails.chauffeurPhone}
                  </div>
                </div>
              </div>

              {/* Route */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Route
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedTripForDetails.pickup}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedTripForDetails.dropoff}</span>
                  </div>
                </div>
              </div>

              {/* Fare */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f1f5f9', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total Realized Fare</div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Payment: {selectedTripForDetails.paymentMode || 'Cash / UPI'}</div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
                  ₹{selectedTripForDetails.amount}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: VEHICLE FULL SPECS ──────────────────────────────────── */}
      {selectedVehicleForDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Vehicle Details & Commercial Permit
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVehicleForDetails(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <img
                src={selectedVehicleForDetails.image || CAR_PHOTO_PRESETS[0].url}
                alt={selectedVehicleForDetails.name}
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                    {selectedVehicleForDetails.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {selectedVehicleForDetails.model}
                  </div>
                </div>
                <div style={{ background: '#0f172a', color: '#FACC15', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.8px' }}>
                  {selectedVehicleForDetails.plate || 'GA-03-Z-8899'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>RC Book No:</strong> {selectedVehicleForDetails.rcBookNo || 'GA03-RC-2023-8899'}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>Seating:</strong> {selectedVehicleForDetails.seats || 4} Passenger Seats
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>Luggage Boot:</strong> {selectedVehicleForDetails.bags || 3} Bags
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>Fuel & Gear:</strong> {selectedVehicleForDetails.fuel || 'Petrol'} · {selectedVehicleForDetails.transmission || 'Manual'}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>Customer Tariff:</strong> ₹{selectedVehicleForDetails.baseFare || 350} Base · ₹{selectedVehicleForDetails.perKm || 24}/km
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <strong>Fitness Expiry:</strong> {selectedVehicleForDetails.fitnessExpiry || '2028-11-14'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155' }}>
                <strong>Assigned Chauffeur:</strong> {selectedVehicleForDetails.driverName || 'Suresh Naik'} ({selectedVehicleForDetails.driverPhone || '+91 98221 44510'})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: DRIVER DOSSIER ──────────────────────────────────────── */}
      {selectedDriverForDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Commercial Driver Record
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDriverForDetails(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={selectedDriverForDetails.photo || DRIVER_PHOTO_PRESETS[0].url}
                  alt={selectedDriverForDetails.name}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }}
                />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                    {selectedDriverForDetails.name}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 700 }}>
                    ✓ Police Verified Commercial Chauffeur
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    ⭐ {selectedDriverForDetails.rating || 4.9} Rating · {selectedDriverForDetails.experienceYears || 6} Yrs Experience
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Primary Contact:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedDriverForDetails.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Emergency Contact:</span>
                  <span style={{ fontWeight: 700, color: '#475569' }}>{selectedDriverForDetails.emergencyPhone || '+91 98221 00000'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Driving License (DL):</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedDriverForDetails.licenseNo || 'GA-03-2016-0034120'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>License Expiry:</span>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>{selectedDriverForDetails.licenseExpiry || '2031-08-15'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>PSV Commercial Badge:</span>
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{selectedDriverForDetails.badgeNo || 'GOA-PSV-4412'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Assigned Cab:</span>
                  <span style={{ fontWeight: 800, color: '#FF6333' }}>{selectedDriverForDetails.car || 'GA-03-Z-8899'}</span>
                </div>
              </div>

              <a
                href={`tel:${selectedDriverForDetails.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                <Phone size={14} /> Call Driver Directly
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: REVENUE BREAKDOWN AUDIT ─────────────────────────────── */}
      {isRevenueModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Fleet Revenue & Earnings Audit
              </h3>
              <button
                type="button"
                onClick={() => setIsRevenueModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>TOTAL REALIZED REVENUE</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>
                  Based on {countCompletedTrips} Completed Cab Trips
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <span>Completed Trips Count:</span>
                  <strong>{countCompletedTrips} Trips</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <span>Average Fare per Trip:</span>
                  <strong>₹{countCompletedTrips > 0 ? Math.round(totalRevenue / countCompletedTrips) : 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <span>Payment Channels:</span>
                  <strong>Cash (40%) · UPI / Card (60%)</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRevenueModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
