import React, { useState, useEffect } from 'react';
import { 
  Car, Users, LayoutDashboard, Plus, Phone, MapPin, 
  CheckCircle2, Clock, AlertCircle, X, Trash2, Edit3, 
  ExternalLink, LogOut, ArrowRight, Shield, RefreshCw, Key
} from 'lucide-react';
import { fetchCustomerPastTrips } from '../../services/api';

// Starter fleet if none added yet
const INITIAL_STARTER_VEHICLES = [
  {
    id: 'sedan-prime',
    name: 'Prime Sedan',
    model: 'Maruti Suzuki Dzire',
    plate: 'GA-03-Z-8899',
    classType: 'sedan',
    seats: 4,
    bags: 3,
    baseFare: 350,
    perKm: 24,
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
    classType: 'suv',
    seats: 6,
    bags: 4,
    baseFare: 550,
    perKm: 34,
    eta: 5,
    badge: 'Family Favorite',
    icon: '🚙',
    driverName: 'Ramesh Sawant',
    driverPhone: '+91 98229 11200',
    active: true,
    desc: 'Plush 6-seater SUV with captain recliner seats and dual AC.'
  },
  {
    id: 'normal-hatchback',
    name: 'Normal Hatchback',
    model: 'Maruti WagonR / Swift',
    plate: 'GA-03-Z-1011',
    classType: 'normal',
    seats: 4,
    bags: 2,
    baseFare: 280,
    perKm: 20,
    eta: 4,
    badge: 'Budget Choice',
    icon: '🚗',
    driverName: 'Vijay Gaonkar',
    driverPhone: '+91 97645 88910',
    active: true,
    desc: 'Affordable, clean AC hatchback for swift beach hops.'
  }
];

const INITIAL_STARTER_DRIVERS = [
  { id: 1, name: 'Suresh Naik', phone: '+91 98221 44510', car: 'GA-03-Z-8899 (Maruti Dzire)', status: 'On Ride' },
  { id: 2, name: 'Ramesh Sawant', phone: '+91 98229 11200', car: 'GA-03-Z-4521 (Innova Crysta)', status: 'Available' },
  { id: 3, name: 'Vijay Gaonkar', phone: '+91 97645 88910', car: 'GA-03-Z-1011 (WagonR)', status: 'Available' }
];

export default function TaxiOperationsHub({ initialTab = 'dashboard', onLogout, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path === '/taxi-fleet' || path === '/taxi-vehicles') return 'vehicles';
    if (path === '/taxi-drivers') return 'drivers';
    return initialTab === 'fleet' ? 'vehicles' : (initialTab === 'drivers' ? 'drivers' : 'dashboard');
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

  // ── 3. Bookings State ────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'needs_driver' | 'on_road' | 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    model: '',
    plate: '',
    classType: 'sedan',
    seats: 4,
    bags: 3,
    baseFare: 350,
    perKm: 24,
    driverName: '',
    driverPhone: '',
    desc: ''
  });
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    carPlate: ''
  });

  // Load Bookings from localStorage and Backend
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      // 1. Local dispatches
      const localDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const activeRide = JSON.parse(localStorage.getItem('wowgoa_active_ride') || 'null');

      let combined = [...localDispatches];
      if (activeRide && activeRide.refId && !combined.some(b => b.id === activeRide.refId)) {
        combined.unshift({
          id: activeRide.refId,
          customer: activeRide.passengerName || 'Valued Goa Guest',
          phone: activeRide.passengerPhone || '+91 98765 43210',
          service: `${activeRide.pickup || 'Goa'} ➔ ${activeRide.dropoff || 'Goa'}`,
          pickup: activeRide.pickup,
          dropoff: activeRide.dropoff,
          car: activeRide.vehicle?.name || activeRide.vehicle?.model || 'Prime Sedan',
          chauffeur: activeRide.chauffeur?.name || 'Suresh Naik',
          vehiclePlate: activeRide.chauffeur?.vehiclePlate || 'GA-03-Z-8899',
          pickupTime: activeRide.time || 'Immediate',
          status: activeRide.status || 'Requested',
          amount: activeRide.fare || 850,
          otp: activeRide.otp || '7457',
          source: 'Storefront App'
        });
      }

      // 2. Fetch from backend
      try {
        const backendRes = await fetchCustomerPastTrips();
        if (backendRes?.success && Array.isArray(backendRes.trips)) {
          backendRes.trips.forEach(bt => {
            const id = bt.id || bt.refId;
            if (id && !combined.some(c => c.id === id)) {
              combined.push({
                id: id,
                customer: bt.customer_name || 'Goa Visitor',
                phone: bt.customer_phone || '+91 98221 00000',
                service: `${bt.pickup || 'Goa'} ➔ ${bt.dropoff || 'Goa'}`,
                pickup: bt.pickup,
                dropoff: bt.dropoff,
                car: bt.carName || bt.vehicle_name || 'Cab',
                chauffeur: bt.chauffeur?.name || bt.assigned_driver_name || 'Assigned Driver',
                vehiclePlate: bt.vehiclePlate || bt.assigned_vehicle_plate || 'GA-03-Z-8899',
                pickupTime: bt.date || 'Today',
                status: bt.status || 'Requested',
                amount: bt.fare || bt.total_amount || 850,
                otp: bt.otp || '4821',
                source: 'Online Booking'
              });
            }
          });
        }
      } catch (err) {}

      // Fallback demo bookings if completely empty
      if (combined.length === 0) {
        combined = [
          {
            id: 'WG-CAB-9120',
            customer: 'Rohit Sharma',
            phone: '+91 98221 44510',
            service: 'Mopa Airport (GOX) ➔ Calangute Beach Resort',
            pickup: 'Mopa Airport (GOX)',
            dropoff: 'Calangute Beach Resort',
            car: 'Toyota Innova Crysta',
            chauffeur: 'Suresh Naik',
            vehiclePlate: 'GA-03-Z-8899',
            pickupTime: '10 mins ago',
            status: 'Requested',
            amount: 1850,
            otp: '7457',
            source: 'Wow Goa Cab App'
          },
          {
            id: 'WG-CAB-9118',
            customer: 'Pooja Hegde',
            phone: '+91 98902 33411',
            service: 'Dabolim Airport (GOI) ➔ Candolim Taj Holiday',
            pickup: 'Dabolim Airport (GOI)',
            dropoff: 'Candolim Taj Holiday',
            car: 'Maruti Suzuki Dzire',
            chauffeur: 'Ramesh Sawant',
            vehiclePlate: 'GA-03-Z-4521',
            pickupTime: '25 mins ago',
            status: 'In Progress',
            amount: 1450,
            otp: '4821',
            source: 'Wow Goa Cab App'
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

  // Save vehicles and broadcast
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

  // ── Booking Status Actions ──────────────────────────────────────────────────
  const updateBookingStatus = (id, newStatus) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

    // Also update active ride if same
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
      classType: 'sedan',
      seats: 4,
      bags: 3,
      baseFare: 350,
      perKm: 24,
      driverName: '',
      driverPhone: '',
      desc: ''
    });
    setIsAddVehicleOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setVehicleForm({
      name: veh.name || '',
      model: veh.model || '',
      plate: veh.plate || '',
      classType: veh.classType || 'sedan',
      seats: veh.seats || 4,
      bags: veh.bags || 3,
      baseFare: veh.baseFare || 350,
      perKm: veh.perKm || 24,
      driverName: veh.driverName || '',
      driverPhone: veh.driverPhone || '',
      desc: veh.desc || ''
    });
    setIsAddVehicleOpen(true);
  };

  const handleSaveVehicle = (e) => {
    e.preventDefault();
    if (!vehicleForm.name.trim() || !vehicleForm.model.trim()) {
      alert('Please enter Car Name and Model');
      return;
    }

    if (editingVehicle) {
      // Edit existing
      const updated = vehicles.map(v => {
        if (v.id === editingVehicle.id) {
          return {
            ...v,
            name: vehicleForm.name.trim(),
            model: vehicleForm.model.trim(),
            plate: vehicleForm.plate.trim() || 'GA-03-Z-9999',
            classType: vehicleForm.classType,
            seats: Number(vehicleForm.seats) || 4,
            bags: Number(vehicleForm.bags) || 3,
            baseFare: Number(vehicleForm.baseFare) || 350,
            perKm: Number(vehicleForm.perKm) || 24,
            driverName: vehicleForm.driverName.trim(),
            driverPhone: vehicleForm.driverPhone.trim(),
            desc: vehicleForm.desc.trim()
          };
        }
        return v;
      });
      saveVehiclesList(updated);
    } else {
      // Create new
      const newId = `cab-${Date.now().toString(36)}`;
      let icon = '🚗';
      if (vehicleForm.classType === 'suv') icon = '🚙';
      if (vehicleForm.classType === 'sedan') icon = '🚕';
      if (vehicleForm.classType === 'luxury') icon = '👑';
      if (vehicleForm.classType === 'coach') icon = '🚐';

      const newVeh = {
        id: newId,
        name: vehicleForm.name.trim(),
        model: vehicleForm.model.trim(),
        plate: vehicleForm.plate.trim() || 'GA-03-Z-9999',
        classType: vehicleForm.classType,
        seats: Number(vehicleForm.seats) || 4,
        bags: Number(vehicleForm.bags) || 3,
        baseFare: Number(vehicleForm.baseFare) || 350,
        perKm: Number(vehicleForm.perKm) || 24,
        eta: 4,
        badge: 'Newly Added',
        icon: icon,
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
    if (window.confirm('Delete this vehicle from customer booking?')) {
      const updated = vehicles.filter(v => v.id !== id);
      saveVehiclesList(updated);
    }
  };

  // ── Driver Add ──────────────────────────────────────────────────────────────
  const handleSaveDriver = (e) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      alert('Please enter Driver Name and Phone Number');
      return;
    }
    const newDriver = {
      id: Date.now(),
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      car: driverForm.carPlate.trim() || 'Unassigned',
      status: 'Available'
    };
    saveDriversList([...drivers, newDriver]);
    setIsAddDriverOpen(false);
    setDriverForm({ name: '', phone: '', carPlate: '' });
  };

  const handleDeleteDriver = (id) => {
    if (window.confirm('Remove this driver?')) {
      const updated = drivers.filter(d => d.id !== id);
      saveDriversList(updated);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const st = (b.status || '').toLowerCase();
    if (bookingFilter === 'needs_driver' && st !== 'requested' && st !== 'pending' && st !== 'pending_allocation') return false;
    if (bookingFilter === 'on_road' && st !== 'driver arrived' && st !== 'arrived' && st !== 'in progress' && st !== 'on_trip' && st !== 'allocated') return false;
    if (bookingFilter === 'completed' && st !== 'completed') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (b.customer || '').toLowerCase().includes(q);
      const matchPhone = (b.phone || '').includes(q);
      const matchId = (b.id || '').toLowerCase().includes(q);
      const matchService = (b.service || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId && !matchService) return false;
    }
    return true;
  });

  // Counters
  const countNeedsDriver = bookings.filter(b => {
    const st = (b.status || '').toLowerCase();
    return st === 'requested' || st === 'pending' || st === 'pending_allocation';
  }).length;

  const countOnRoad = bookings.filter(b => {
    const st = (b.status || '').toLowerCase();
    return st === 'driver arrived' || st === 'arrived' || st === 'in progress' || st === 'on_trip' || st === 'allocated';
  }).length;

  const countCompleted = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
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
              Cab Fleet Operator
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* 1. Dashboard & Live Bookings */}
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
              <span>Live Bookings</span>
            </div>
            {countNeedsDriver > 0 && (
              <span style={{
                background: activeTab === 'dashboard' ? '#ffffff' : '#ef4444',
                color: activeTab === 'dashboard' ? '#FF6333' : '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '12px'
              }}>
                {countNeedsDriver} New
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
              <span>My Vehicles (Add Cab)</span>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {vehicles.filter(v => v.active !== false).length}
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
              <span>Drivers</span>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {drivers.length}
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
              {activeTab === 'dashboard' && 'Cab Bookings & Daily Duties'}
              {activeTab === 'vehicles' && 'My Vehicles (Add Cabs for Customers)'}
              {activeTab === 'drivers' && 'Drivers & Chauffeur Roster'}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeTab === 'dashboard' && 'Monitor customer bookings, assigned cabs, OTPs, and ride completion in real time.'}
              {activeTab === 'vehicles' && 'Only active vehicles added below will be displayed to customers on the cab booking page.'}
              {activeTab === 'drivers' && 'Manage your verified local chauffeurs and contact numbers.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'dashboard' && (
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
            )}

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
                <span>+ Add Driver</span>
              </button>
            )}
          </div>
        </header>

        {/* ─── TAB 1: DASHBOARD & LIVE BOOKINGS ──────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              {/* 1. Needs Driver */}
              <div 
                onClick={() => setBookingFilter('needs_driver')}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: bookingFilter === 'needs_driver' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Needs Driver / New
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    {countNeedsDriver}
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🟡
                </div>
              </div>

              {/* 2. On Road */}
              <div 
                onClick={() => setBookingFilter('on_road')}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: bookingFilter === 'on_road' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Cabs On Road
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    {countOnRoad}
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🟢
                </div>
              </div>

              {/* 3. Completed */}
              <div 
                onClick={() => setBookingFilter('completed')}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: bookingFilter === 'completed' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Completed Trips
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    {countCompleted}
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🏁
                </div>
              </div>

              {/* 4. Total Revenue */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Completed Revenue
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  💰
                </div>
              </div>

            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setBookingFilter('all')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: bookingFilter === 'all' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    background: bookingFilter === 'all' ? '#0f172a' : '#ffffff',
                    color: bookingFilter === 'all' ? '#ffffff' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All Bookings ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter('needs_driver')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: bookingFilter === 'needs_driver' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    background: bookingFilter === 'needs_driver' ? '#d97706' : '#ffffff',
                    color: bookingFilter === 'needs_driver' ? '#ffffff' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🟡 Needs Driver ({countNeedsDriver})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter('on_road')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: bookingFilter === 'on_road' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    background: bookingFilter === 'on_road' ? '#16a34a' : '#ffffff',
                    color: bookingFilter === 'on_road' ? '#ffffff' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🟢 On Road ({countOnRoad})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter('completed')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: bookingFilter === 'completed' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: bookingFilter === 'completed' ? '#2563eb' : '#ffffff',
                    color: bookingFilter === 'completed' ? '#ffffff' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏁 Completed ({countCompleted})
                </button>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search passenger name, phone, booking ref..."
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  width: '280px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Bookings List Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredBookings.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px 20px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚗</div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>No Bookings Found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    When a customer books a ride on the cab page, it will immediately appear right here.
                  </div>
                </div>
              ) : (
                filteredBookings.map((b, idx) => {
                  const isCompleted = (b.status || '').toLowerCase() === 'completed';
                  const isArrived = (b.status || '').toLowerCase() === 'driver arrived' || (b.status || '').toLowerCase() === 'arrived';
                  const isInProgress = (b.status || '').toLowerCase() === 'in progress' || (b.status || '').toLowerCase() === 'on_trip';
                  const isRequested = (b.status || '').toLowerCase() === 'requested' || (b.status || '').toLowerCase() === 'pending' || (b.status || '').toLowerCase() === 'pending_allocation';

                  return (
                    <div
                      key={b.id || idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '18px 22px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                      {/* Top Header Line */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                            #{b.id}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            · {b.pickupTime || 'Today'}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#475569'
                          }}>
                            {b.source || 'Cab App'}
                          </span>
                        </div>

                        {/* Status Badge & OTP Box */}
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

                          {/* Status */}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '8px',
                            background: isCompleted ? '#dcfce7' : (isInProgress ? '#eff6ff' : (isArrived ? '#fef3c7' : '#fee2e2')),
                            color: isCompleted ? '#15803d' : (isInProgress ? '#1d4ed8' : (isArrived ? '#b45309' : '#b91c1c')),
                            border: isCompleted ? '1px solid #86efac' : (isInProgress ? '1px solid #bfdbfe' : '1px solid #fde68a')
                          }}>
                            {isCompleted ? '✓ Completed' : (isInProgress ? '🚗 In Progress' : (isArrived ? '📍 Driver Arrived' : '🟡 Needs Driver'))}
                          </span>
                        </div>
                      </div>

                      {/* Passenger Details & Route */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        
                        {/* Passenger & Driver */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                👤 {b.customer || 'Goa Guest'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                📱 {b.phone || '+91 98765 43210'}
                              </div>
                            </div>
                            {b.phone && (
                              <a
                                href={`tel:${b.phone}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={12} />
                                <span>Call</span>
                              </a>
                            )}
                          </div>

                          <div style={{
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#334155'
                          }}>
                            <strong>Cab & Chauffeur:</strong> {b.car || 'Prime Sedan'} · {b.vehiclePlate || 'GA-03-Z-8899'} ({b.chauffeur || 'Suresh Naik'})
                          </div>
                        </div>

                        {/* Pickup ➔ Dropoff Route */}
                        <div style={{
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {b.pickup || (b.service ? b.service.split('➔')[0] : 'Goa Pickup')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              {b.dropoff || (b.service ? b.service.split('➔').slice(-1)[0] : 'Goa Dropoff')}
                            </span>
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                            Fare: ₹{b.amount || 850}
                          </div>
                        </div>

                      </div>

                      {/* 1-Click Action Buttons for Vehicle Handler */}
                      <div style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {isRequested && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.id, 'Driver Arrived')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#0f172a',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Accept & Mark Driver Arrived
                          </button>
                        )}

                        {isArrived && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.id, 'In Progress')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12.5px',
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
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            🏁 End & Complete Ride
                          </button>
                        )}

                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.id, 'Cancelled')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#16a34a' }}>
                            ✓ Ride completed & recorded
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ─── TAB 2: MY VEHICLES (ADD CAB & FLEET) ────────────────────────── */}
        {activeTab === 'vehicles' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Informational Banner */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>💡</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a' }}>
                    Customer Cab Display Notice
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '2px' }}>
                    Only the active vehicles listed below will be shown to customers when they book a cab on Wow Goa. 
                    If you turn off or delete a vehicle, customers will not see it.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddVehicle}
                style={{
                  background: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                + Add Cab
              </button>
            </div>

            {/* Vehicles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {vehicles.map((veh) => {
                const isActive = veh.active !== false;

                return (
                  <div
                    key={veh.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      border: isActive ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      opacity: isActive ? 1 : 0.65
                    }}
                  >
                    {/* Top line: Icon, Name & Active toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px'
                        }}>
                          {veh.icon || '🚗'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            {veh.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {veh.model}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVehicleActive(veh.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: isActive ? '1px solid #86efac' : '1px solid #cbd5e1',
                          background: isActive ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#15803d' : '#64748b',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isActive ? '✓ Showing in App' : 'Hidden'}
                      </button>
                    </div>

                    {/* Plate, Capacity & Pricing */}
                    <div style={{
                      padding: '12px 14px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <span style={{ color: '#64748b' }}>Number Plate:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                          {veh.plate || 'GA-03-Z-8899'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <span style={{ color: '#64748b' }}>Capacity:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {veh.seats || 4} Passenger Seats · {veh.bags || 3} Bags
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <span style={{ color: '#64748b' }}>Pricing:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>
                          Base ₹{veh.baseFare || 350} · ₹{veh.perKm || 24}/km
                        </span>
                      </div>
                      {veh.driverName && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                          <span style={{ color: '#64748b' }}>Driver:</span>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            {veh.driverName} ({veh.driverPhone || ''})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(veh)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(veh.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ─── TAB 3: DRIVERS ──────────────────────────────────────────────── */}
        {activeTab === 'drivers' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      👨‍✈️ {d.name}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: d.status === 'Available' ? '#dcfce7' : '#fef3c7',
                      color: d.status === 'Available' ? '#15803d' : '#b45309'
                    }}>
                      {d.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    📱 {d.phone}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                    Assigned: <strong>{d.car}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
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
                      <Phone size={13} />
                      <span>Call Driver</span>
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
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ─── MODAL: ADD / EDIT VEHICLE ─────────────────────────────────────── */}
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
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingVehicle ? 'Edit Cab / Vehicle' : 'Add New Cab / Vehicle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Cab Category Name (e.g. Prime Sedan, Executive SUV) *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  placeholder="e.g. Prime Sedan"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Car Model (e.g. Maruti Suzuki Dzire, Toyota Innova Crysta) *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="e.g. Maruti Suzuki Dzire"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Number Plate
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                    placeholder="e.g. GA-03-Z-8899"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Type
                  </label>
                  <select
                    value={vehicleForm.classType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, classType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#ffffff' }}
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="normal">Hatchback</option>
                    <option value="luxury">Luxury VIP</option>
                    <option value="coach">Maxi Coach</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Passenger Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={vehicleForm.seats}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, seats: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Luggage Bags
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={vehicleForm.bags}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, bags: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Base Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    value={vehicleForm.baseFare}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, baseFare: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Price Per KM (₹)
                  </label>
                  <input
                    type="number"
                    value={vehicleForm.perKm}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, perKm: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    placeholder="e.g. Suresh Naik"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                    Driver Mobile Number
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.driverPhone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                    placeholder="e.g. +91 98221 44510"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Short Description for Customers
                </label>
                <input
                  type="text"
                  value={vehicleForm.desc}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, desc: e.target.value })}
                  placeholder="e.g. Clean AC sedan with boot space for 3 bags"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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

      {/* ─── MODAL: ADD DRIVER ─────────────────────────────────────────────── */}
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
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                + Add New Driver
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Naik"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Mobile Number (with +91) *
                </label>
                <input
                  type="text"
                  required
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  placeholder="e.g. +91 98221 44510"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Assigned Car & Number Plate
                </label>
                <input
                  type="text"
                  value={driverForm.carPlate}
                  onChange={(e) => setDriverForm({ ...driverForm, carPlate: e.target.value })}
                  placeholder="e.g. GA-03-Z-8899 (Swift Dzire)"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
                    background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Save Driver
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
