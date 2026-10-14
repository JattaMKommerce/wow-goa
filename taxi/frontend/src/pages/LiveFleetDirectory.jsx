import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Car, Users, DollarSign, Search, Filter, Phone, 
  CheckCircle2, Clock, AlertTriangle, Shield, Zap, 
  MapPin, Fuel, UserCheck, RefreshCw, Calculator, 
  ArrowRight, Info, Sparkles, Navigation, Award
} from 'lucide-react';

const LiveFleetDirectory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Active View Tab: 'cars' | 'drivers' | 'rate_card'
  const [activeTab, setActiveTab] = useState('cars');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [carStatusFilter, setCarStatusFilter] = useState('ALL');
  const [carClassFilter, setCarClassFilter] = useState('ALL');
  const [driverStatusFilter, setDriverStatusFilter] = useState('ALL');

  // Interactive Fare Calculator State
  const [calcCarClass, setCalcCarClass] = useState('SUV');
  const [calcDistanceKm, setCalcDistanceKm] = useState(45);
  const [calcIsNight, setCalcIsNight] = useState(false);

  // Standard Goa B2B Fleet Tariff Catalog
  const rateCatalog = [
    {
      vehicle_class: 'SEDAN',
      name: 'Executive Sedan',
      models: 'Toyota Camry, Hyundai Verna, Honda City',
      seating: '4 Passengers + 2 Bags',
      base_fare_inr: 2200,
      included_km: 40,
      extra_km_rate_inr: 16,
      extra_hour_rate_inr: 150,
      night_allowance_inr: 350,
      best_for: 'Corporate business executives & couples',
      badge_color: '#0284c7'
    },
    {
      vehicle_class: 'SUV',
      name: 'Premium Executive SUV',
      models: 'Toyota Innova Crysta, Toyota Fortuner, Hyundai Alcazar',
      seating: '6-7 Passengers + 5 Bags',
      base_fare_inr: 3200,
      included_km: 40,
      extra_km_rate_inr: 22,
      extra_hour_rate_inr: 250,
      night_allowance_inr: 400,
      best_for: 'VIP families, 5-star hotel transfers & luxury leisure',
      badge_color: '#16a34a'
    },
    {
      vehicle_class: 'EV',
      name: 'Green Electric Mobility (EV)',
      models: 'Tata Tigor EV, MG ZS EV, BYD Atto 3',
      seating: '4 Passengers + 2 Bags',
      base_fare_inr: 2400,
      included_km: 40,
      extra_km_rate_inr: 15,
      extra_hour_rate_inr: 150,
      night_allowance_inr: 350,
      best_for: 'Eco-conscious ESG corporate travel & zero emission rides',
      badge_color: '#059669'
    },
    {
      vehicle_class: 'LUXURY',
      name: 'Ultra Luxury Chauffeur',
      models: 'Mercedes-Benz E-Class, BMW 5 Series, Audi A6',
      seating: '4 Passengers + 3 Bags',
      base_fare_inr: 6500,
      included_km: 40,
      extra_km_rate_inr: 45,
      extra_hour_rate_inr: 600,
      night_allowance_inr: 600,
      best_for: 'CEOs, Celebrity delegations, Taj Exotica VIP suites',
      badge_color: '#7c3aed'
    },
    {
      vehicle_class: 'VAN',
      name: 'Multi-Passenger Executive Van',
      models: 'Force Urbania, Mercedes Sprinter, Toyota HiAce',
      seating: '10-15 Passengers + 12 Bags',
      base_fare_inr: 5500,
      included_km: 50,
      extra_km_rate_inr: 32,
      extra_hour_rate_inr: 450,
      night_allowance_inr: 500,
      best_for: 'Corporate event groups, wedding transfers & delegations',
      badge_color: '#ea580c'
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('fleet/vehicles/'),
        api.get('drivers/drivers/')
      ]);
      setVehicles(vehiclesRes.data.results || vehiclesRes.data || []);
      setDrivers(driversRes.data.results || driversRes.data || []);
    } catch (err) {
      console.error('Failed to load fleet directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Cars
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      v.registration_number?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.assigned_driver?.user_detail?.first_name?.toLowerCase().includes(q) ||
      v.assigned_driver?.user_detail?.last_name?.toLowerCase().includes(q);

    const matchesStatus = carStatusFilter === 'ALL' || v.status === carStatusFilter;
    const matchesClass = carClassFilter === 'ALL' || v.vehicle_class === carClassFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Filtered Drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const name = `${d.user_detail?.first_name || ''} ${d.user_detail?.last_name || ''}`.toLowerCase();
    const phone = d.user_detail?.phone_number?.toLowerCase() || '';
    const badge = d.badge_number?.toLowerCase() || '';
    const carReg = d.vehicle_detail?.registration_number?.toLowerCase() || '';

    const matchesSearch = name.includes(q) || phone.includes(q) || badge.includes(q) || carReg.includes(q);
    const matchesStatus = driverStatusFilter === 'ALL' || d.duty_status === driverStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Quick stats
  const totalCars = vehicles.length;
  const availableCars = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const onDutyCars = vehicles.filter(v => v.status === 'ON_DUTY').length;
  const maintenanceCars = vehicles.filter(v => v.status === 'IN_MAINTENANCE').length;

  const totalDrivers = drivers.length;
  const onDutyAvailableDrivers = drivers.filter(d => d.duty_status === 'ON_DUTY_AVAILABLE').length;
  const onTripDrivers = drivers.filter(d => d.duty_status === 'ON_TRIP').length;
  const offDutyDrivers = drivers.filter(d => d.duty_status === 'OFF_DUTY').length;

  // Selected rate for calculator
  const selectedTariff = rateCatalog.find(r => r.vehicle_class === calcCarClass) || rateCatalog[1];
  const calcExtraKm = Math.max(0, calcDistanceKm - selectedTariff.included_km);
  const calcExtraCharge = calcExtraKm * selectedTariff.extra_km_rate_inr;
  const calcNightCharge = calcIsNight ? selectedTariff.night_allowance_inr : 0;
  const calcSubtotal = selectedTariff.base_fare_inr + calcExtraCharge + calcNightCharge;
  const calcGst = calcSubtotal * 0.05;
  const calcTotal = calcSubtotal + calcGst;
  const driverShare = calcSubtotal * 0.20; // 20% driver commission

  return (
    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        padding: '24px 32px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
          }}>
            <Car size={24} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Live Fleet & Driver Availability Directory
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', margin: 0, fontWeight: 500 }}>
              Real-time available taxis, on-duty chauffeurs, and official per-kilometer rate card for Goa mobility.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="btn-secondary"
          style={{ padding: '9px 18px', borderRadius: '20px', fontSize: '0.84rem', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* Top Status Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* 1. Available Cars */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CARS READY FOR HIRE
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: 700 }}>
              ● {availableCars} Free
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '6px', margin: 0 }}>
            {availableCars} <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#64748b' }}>/ {totalCars} Total</span>
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Cleaned, fueled & ready at Goa depots
          </p>
        </div>

        {/* 2. Cars On Road */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CARS ON LIVE TRIPS
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', fontWeight: 700 }}>
              Active
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '6px', margin: 0 }}>
            {onDutyCars} <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#64748b' }}>Cars</span>
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Passenger on board / airport transfer
          </p>
        </div>

        {/* 3. On-Duty Chauffeurs */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CHAUFFEURS AVAILABLE
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: 700 }}>
              ● Ready
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '6px', margin: 0 }}>
            {onDutyAvailableDrivers} <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#64748b' }}>/ {totalDrivers} Drivers</span>
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
            In uniform, rested & ready to drive
          </p>
        </div>

        {/* 4. Base Starting Price */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              STARTING TARIFF
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: 700 }}>
              Official
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '6px', margin: 0 }}>
            ₹16 <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#64748b' }}>/ extra KM</span>
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Base ₹2,200 (Includes first 40 KM)
          </p>
        </div>

      </div>

      {/* Main Tab Selector & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Navigation Tabs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '30px',
          padding: '4px',
          display: 'inline-flex',
          gap: '4px',
          alignSelf: 'flex-start'
        }}>
          <button
            onClick={() => setActiveTab('cars')}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'cars' ? 700 : 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'cars' ? '#0f172a' : 'transparent',
              color: activeTab === 'cars' ? '#ffffff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Car size={15} />
            <span>Available Cars & Fleet ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'drivers' ? 700 : 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'drivers' ? '#0f172a' : 'transparent',
              color: activeTab === 'drivers' ? '#ffffff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={15} />
            <span>Available Chauffeurs ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rate_card')}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'rate_card' ? 700 : 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'rate_card' ? '#0284c7' : 'transparent',
              color: activeTab === 'rate_card' ? '#ffffff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <DollarSign size={15} />
            <span>Per-KM Rate Card & Fare Calculator</span>
          </button>
        </div>

        {/* Filter controls for Cars / Drivers */}
        {activeTab !== 'rate_card' && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '44px', borderRadius: '24px' }}
                placeholder={activeTab === 'cars' ? "Search car model, registration number, driver name..." : "Search driver name, phone number, Goa badge..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === 'cars' && (
              <>
                <div style={{ width: '180px' }}>
                  <select
                    className="select-field"
                    value={carStatusFilter}
                    onChange={(e) => setCarStatusFilter(e.target.value)}
                    style={{ borderRadius: '24px' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">🟢 Available Now</option>
                    <option value="ON_DUTY">🔵 On Duty / Trip</option>
                    <option value="IN_MAINTENANCE">🟠 In Maintenance</option>
                  </select>
                </div>

                <div style={{ width: '180px' }}>
                  <select
                    className="select-field"
                    value={carClassFilter}
                    onChange={(e) => setCarClassFilter(e.target.value)}
                    style={{ borderRadius: '24px' }}
                  >
                    <option value="ALL">All Car Classes</option>
                    <option value="SEDAN">Executive Sedan</option>
                    <option value="SUV">Premium SUV</option>
                    <option value="EV">Electric EV</option>
                    <option value="LUXURY">Luxury Class</option>
                    <option value="VAN">Multi-Passenger Van</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'drivers' && (
              <div style={{ width: '200px' }}>
                <select
                  className="select-field"
                  value={driverStatusFilter}
                  onChange={(e) => setDriverStatusFilter(e.target.value)}
                  style={{ borderRadius: '24px' }}
                >
                  <option value="ALL">All Duty Statuses</option>
                  <option value="ON_DUTY_AVAILABLE">🟢 On Duty (Available)</option>
                  <option value="ON_TRIP">🔵 On Active Trip</option>
                  <option value="OFF_DUTY">⚪ Off Duty</option>
                </select>
              </div>
            )}

            {(searchQuery || carStatusFilter !== 'ALL' || carClassFilter !== 'ALL' || driverStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCarStatusFilter('ALL');
                  setCarClassFilter('ALL');
                  setDriverStatusFilter('ALL');
                }}
                className="btn-secondary"
                style={{ borderRadius: '24px', padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: AVAILABLE CARS DIRECTORY */}
      {activeTab === 'cars' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredVehicles.map((car) => {
            const isAvailable = car.status === 'AVAILABLE';
            const isOnDuty = car.status === 'ON_DUTY';
            const assignedDriver = car.assigned_driver;

            return (
              <div
                key={car.id}
                className="glass-card"
                style={{
                  padding: '22px',
                  borderRadius: '20px',
                  border: isAvailable ? '1.5px solid #86efac' : isOnDuty ? '1.5px solid #93c5fd' : '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Top Card Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#0f172a',
                        background: '#f8fafc',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1'
                      }}>
                        {car.registration_number}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: 'rgba(241, 245, 249, 0.9)',
                        color: '#475569',
                        fontWeight: 700
                      }}>
                        {car.vehicle_class_display || car.vehicle_class}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 0 0' }}>
                      {car.make} {car.model} ({car.year})
                    </h4>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '14px',
                    background: isAvailable ? 'var(--color-success-bg)' : isOnDuty ? 'rgba(2, 132, 199, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: isAvailable ? 'var(--color-success)' : isOnDuty ? '#0284c7' : '#d97706',
                    border: `1px solid ${isAvailable ? 'var(--color-success-border)' : isOnDuty ? '#bae6fd' : '#fde68a'}`
                  }}>
                    {isAvailable ? '🟢 AVAILABLE' : isOnDuty ? '🔵 ON TRIP' : '🟠 MAINTENANCE'}
                  </span>
                </div>

                {/* Car Specs & Capacity Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'rgba(241, 245, 249, 0.6)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>CAPACITY</span>
                    <strong style={{ color: '#0f172a' }}>{car.seating_capacity} Seater</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>FUEL TYPE</span>
                    <strong style={{ color: '#0f172a' }}>{car.fuel_type_display || car.fuel_type}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>ODOMETER</span>
                    <strong style={{ color: '#0f172a' }}>{Number(car.current_odometer).toLocaleString()} KM</strong>
                  </div>
                </div>

                {/* Pricing Rates */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>BASE SHIFT (40 KM)</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{Number(car.shift_rate_inr || 2500).toLocaleString()}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>PER-KM EXTRA RATE</span>
                    <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>₹{car.extra_km_rate_inr || 15} / KM</strong>
                  </div>
                </div>

                {/* Currently Assigned Driver */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: assignedDriver ? 'rgba(2, 132, 199, 0.05)' : '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={16} color={assignedDriver ? '#0284c7' : '#94a3b8'} />
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>ASSIGNED CHAUFFEUR</span>
                      <strong style={{ color: '#0f172a' }}>
                        {assignedDriver 
                          ? `${assignedDriver.user_detail?.first_name} ${assignedDriver.user_detail?.last_name || ''}`
                          : 'No driver checked in'}
                      </strong>
                    </div>
                  </div>

                  {assignedDriver?.user_detail?.phone_number && (
                    <a
                      href={`tel:${assignedDriver.user_detail.phone_number}`}
                      style={{
                        padding: '6px 10px',
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AVAILABLE CHAUFFEURS DIRECTORY */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredDrivers.map((driver) => {
            const isReady = driver.duty_status === 'ON_DUTY_AVAILABLE';
            const isOnTrip = driver.duty_status === 'ON_TRIP';
            const isOffDuty = driver.duty_status === 'OFF_DUTY';
            const assignedCar = driver.vehicle_detail;

            return (
              <div
                key={driver.id}
                className="glass-card"
                style={{
                  padding: '22px',
                  borderRadius: '20px',
                  border: isReady ? '1.5px solid #86efac' : isOnTrip ? '1.5px solid #93c5fd' : '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Driver Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#0f172a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem'
                    }}>
                      {driver.user_detail?.first_name?.[0] || 'D'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {driver.user_detail?.first_name} {driver.user_detail?.last_name || driver.user_detail?.username}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                        Badge: <strong>{driver.badge_number || 'GOA-CH-01'}</strong> • Rating: <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {driver.rating || '5.0'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '14px',
                    background: isReady ? 'var(--color-success-bg)' : isOnTrip ? 'rgba(2, 132, 199, 0.1)' : 'rgba(148, 163, 184, 0.2)',
                    color: isReady ? 'var(--color-success)' : isOnTrip ? '#0284c7' : '#64748b',
                    border: `1px solid ${isReady ? 'var(--color-success-border)' : isOnTrip ? '#bae6fd' : '#cbd5e1'}`
                  }}>
                    {isReady ? '🟢 AVAILABLE' : isOnTrip ? '🔵 ON TRIP' : '⚪ OFF DUTY'}
                  </span>
                </div>

                {/* Assigned Vehicle Pill */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(241, 245, 249, 0.7)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Car size={16} color="#0284c7" />
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>ASSIGNED VEHICLE</span>
                      <strong style={{ color: '#0f172a' }}>
                        {assignedCar 
                          ? `${assignedCar.registration_number} (${assignedCar.make} ${assignedCar.model})`
                          : 'No vehicle checked out'}
                      </strong>
                    </div>
                  </div>

                  {assignedCar && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      fontWeight: 700
                    }}>
                      {assignedCar.vehicle_class}
                    </span>
                  )}
                </div>

                {/* Driver Contact & Safety Score */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>SAFETY SCORE</span>
                    <strong style={{ color: '#16a34a' }}>{driver.safety_score || 100}% Clean Record</strong>
                  </div>

                  <a
                    href={`tel:${driver.user_detail?.phone_number || '+919822000000'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: '#16a34a',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <Phone size={13} />
                    <span>Call Chauffeur</span>
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: OFFICIAL PER-KM RATE CARD & INTERACTIVE FARE CALCULATOR */}
      {activeTab === 'rate_card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Rate Cards Grid */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              Official B2B Fleet Tariff Catalog (Commercial Goa Transport)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {rateCatalog.map((rate) => (
                <div
                  key={rate.vehicle_class}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    borderRadius: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    border: `1.5px solid ${rate.badge_color}33`,
                    background: 'rgba(255, 255, 255, 0.95)'
                  }}
                >
                  <div>
                    {/* Segment Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: `${rate.badge_color}15`,
                        color: rate.badge_color,
                        border: `1px solid ${rate.badge_color}30`
                      }}>
                        {rate.vehicle_class} SEGMENT
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        {rate.seating}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {rate.name}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>
                      {rate.models}
                    </p>
                  </div>

                  {/* Pricing Breakdown Box */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Base Fare (Includes {rate.included_km} KM):</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{rate.base_fare_inr.toLocaleString()}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Extra Per-KM Price:</span>
                      <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>₹{rate.extra_km_rate_inr} / KM</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Extra Waiting / Hour:</span>
                      <strong style={{ color: '#0f172a' }}>₹{rate.extra_hour_rate_inr} / hr</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Night Surcharge (11PM - 6AM):</span>
                      <strong style={{ color: '#d97706' }}>+₹{rate.night_allowance_inr}</strong>
                    </div>
                  </div>

                  {/* Best For Tag */}
                  <div style={{ fontSize: '0.74rem', color: '#475569', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px' }}>
                    💡 <strong>Ideal for:</strong> {rate.best_for}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Live Fare Calculator Tool */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '24px',
            padding: '28px 32px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#38bdf8',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calculator size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Instant Trip Fare & Per-KM Quote Estimator
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Calculate exact guest bills or quote hotel concierges in under 5 seconds.
                </p>
              </div>
            </div>

            {/* Calculator Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              {/* Select Car Segment */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  1. Select Vehicle Segment
                </label>
                <select
                  value={calcCarClass}
                  onChange={(e) => setCalcCarClass(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 700,
                    padding: '0 12px',
                    border: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  {rateCatalog.map(r => (
                    <option key={r.vehicle_class} value={r.vehicle_class}>
                      {r.name} (Base ₹{r.base_fare_inr} + ₹{r.extra_km_rate_inr}/km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Enter Estimated Distance KM */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  2. Trip Distance (Kilometers)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={calcDistanceKm}
                    onChange={(e) => setCalcDistanceKm(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 800,
                      padding: '0 14px',
                      border: 'none',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700 }}>KM</span>
                </div>
              </div>

              {/* Night Allowance Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  3. Night Shift (11 PM - 6 AM)
                </label>
                <button
                  type="button"
                  onClick={() => setCalcIsNight(!calcIsNight)}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '12px',
                    background: calcIsNight ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                    color: calcIsNight ? '#0f172a' : '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{calcIsNight ? '🌙 Night Surcharge Applied (+₹' + selectedTariff.night_allowance_inr + ')' : '☀️ Normal Daytime Fare'}</span>
                </button>
              </div>

            </div>

            {/* Calculated Quote Output Strip */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 22px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Base Fare ({selectedTariff.included_km} KM included): <strong>₹{selectedTariff.base_fare_inr}</strong>
                  {calcExtraKm > 0 && <> • Extra {calcExtraKm} KM @ ₹{selectedTariff.extra_km_rate_inr}/km: <strong>+₹{calcExtraCharge}</strong></>}
                  {calcIsNight && <> • Night Allowance: <strong>+₹{calcNightCharge}</strong></>}
                  {' '}• 5% Transport GST: <strong>+₹{calcGst.toFixed(0)}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
                  👨‍✈️ Driver 20% Commission Share: ₹{driverShare.toFixed(0)} • 🏢 Company Net Margin: ₹{(calcSubtotal - driverShare).toFixed(0)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Estimated Client Quote
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em' }}>
                  ₹{Math.round(calcTotal).toLocaleString()}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default LiveFleetDirectory;
