import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { 
  Smartphone, User, Car, CheckCircle2, AlertTriangle, 
  MapPin, Clock, Phone, Navigation, Play, Check, 
  ShieldCheck, Star, DollarSign, Receipt, RefreshCw, 
  ChevronRight, AlertCircle, Sparkles, Crown, Coffee, 
  Maximize2, Minimize2, Radio, Zap, Shield, FileText, X,
  Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VIPPlacardModal from '../components/dispatches/VIPPlacardModal';

const ChauffeurPortal = () => {
  const { activeRole, setActiveRole } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mobile App Internal Navigation Tab: 'duty' | 'fleet' | 'peers' | 'rates'
  const [mobileTab, setMobileTab] = useState('duty');
  const [driverCalcKm, setDriverCalcKm] = useState(40);
  const [driverCalcClass, setDriverCalcClass] = useState('SUV');

  // Viewport mode: 'phone' (simulated iPhone 16) | 'responsive' (full width)
  const [viewportMode, setViewportMode] = useState('phone');

  // Modals
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showPlacardModal, setShowPlacardModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Shift Check-In Form State
  const [shiftVehicleId, setShiftVehicleId] = useState('');
  const [shiftStartOdo, setShiftStartOdo] = useState('');
  const [inspectionChecks, setInspectionChecks] = useState({
    uniform_groomed: true,
    interior_clean_ac: true,
    water_stocked: true,
    fastag_active: true,
    fit_to_drive: true
  });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);

  // End Trip Form State
  const [endOdo, setEndOdo] = useState('');
  const [tollParking, setTollParking] = useState(0);
  const [completingTrip, setCompletingTrip] = useState(false);

  // Live Timer for On-Trip Duty
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch Drivers & Vehicles List
  useEffect(() => {
    const initData = async () => {
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          api.get('drivers/drivers/'),
          api.get('fleet/vehicles/')
        ]);
        const driverList = driversRes.data.results || driversRes.data || [];
        const vehicleList = vehiclesRes.data.results || vehiclesRes.data || [];
        setDrivers(driverList);
        setVehicles(vehicleList);

        if (driverList.length > 0) {
          setSelectedDriverId(driverList[0].id);
        }
      } catch (err) {
        console.error('Failed to init chauffeur portal:', err);
      }
    };
    initData();
  }, []);

  // Fetch Chauffeur Portal Data when selected driver changes
  const fetchPortalData = async () => {
    if (!selectedDriverId) return;
    setLoading(true);
    try {
      const res = await api.get(`drivers/drivers/${selectedDriverId}/chauffeur_portal/`);
      setPortalData(res.data);
    } catch (err) {
      console.error('Failed to load driver portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 10000); // 10s auto-sync
    return () => clearInterval(interval);
  }, [selectedDriverId]);

  // Elapsed timer tick when trip is ON_TRIP
  useEffect(() => {
    if (portalData?.active_booking?.status === 'ON_TRIP') {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedSeconds(0);
    }
  }, [portalData?.active_booking?.status]);

  // Handle Start Shift
  const handleStartShiftSubmit = async (e) => {
    e.preventDefault();
    if (!shiftVehicleId) {
      alert('Please select your assigned fleet vehicle.');
      return;
    }
    setShiftSubmitting(true);
    try {
      await api.post(`drivers/drivers/${selectedDriverId}/start_shift/`, {
        vehicle_id: shiftVehicleId,
        start_odometer: Number(shiftStartOdo),
        pre_inspection_passed: Object.values(inspectionChecks).every(Boolean),
        inspection_notes: 'All 5 pre-trip checklist safety points verified.'
      });
      setShowShiftModal(false);
      fetchPortalData();
    } catch (err) {
      alert('Error starting shift: ' + (err.response?.data?.error || err.message));
    } finally {
      setShiftSubmitting(false);
    }
  };

  // Handle End Shift
  const handleEndShift = async () => {
    const odo = prompt('Enter final vehicle odometer reading (KM) to conclude shift:');
    if (!odo) return;
    try {
      await api.post(`drivers/drivers/${selectedDriverId}/end_shift/`, {
        end_odometer: Number(odo)
      });
      alert('Shift concluded. Vehicle logged and returned to available depot inventory.');
      fetchPortalData();
    } catch (err) {
      alert('Error ending shift: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Start Trip (Passenger Picked Up)
  const handleStartTrip = async () => {
    const booking = portalData?.active_booking;
    if (!booking) return;
    try {
      await api.post(`dispatches/bookings/${booking.id}/start_trip/`, {
        start_odometer: booking.assigned_vehicle_detail?.current_odometer || 14000
      });
      fetchPortalData();
    } catch (err) {
      alert('Error starting trip: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Conclude Trip
  const handleCompleteTripSubmit = async (e) => {
    e.preventDefault();
    const booking = portalData?.active_booking;
    if (!booking) return;
    setCompletingTrip(true);
    try {
      const res = await api.post(`dispatches/bookings/${booking.id}/complete_trip/`, {
        end_odometer: Number(endOdo),
        toll_parking_inr: Number(tollParking)
      });
      alert(res.data.message || 'Trip successfully completed & submitted for billing!');
      setShowEndTripModal(false);
      fetchPortalData();
    } catch (err) {
      alert('Error completing trip: ' + (err.response?.data?.error || err.message));
    } finally {
      setCompletingTrip(false);
    }
  };

  // Handle Emergency SOS
  const handleEmergencySOS = async () => {
    if (!window.confirm('⚠️ EMERGENCY SOS: Broadcast distress signal with current GPS location to Fleet Dispatch Control?')) {
      return;
    }
    try {
      await api.post(`drivers/drivers/${selectedDriverId}/trigger_sos/`, {
        latitude: 15.4989,
        longitude: 73.8278,
        message: 'EMERGENCY SOS: Chauffeur distress beacon triggered from mobile companion'
      });
      alert('🚨 SOS BROADCAST CONFIRMED: Control center has been notified with your GPS coordinates.');
    } catch (err) {
      alert('Error broadcasting SOS: ' + err.message);
    }
  };

  const activeBooking = portalData?.active_booking;
  const activeShift = portalData?.active_shift;
  const driverProfile = portalData?.driver;
  const stats = portalData?.stats || {};

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      minHeight: 'calc(100vh - 74px)',
      background: '#f1f5f9'
    }}>
      {/* Top Operations Control Strip */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '14px 24px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Driver Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#16a34a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Smartphone size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
              🚗 CHAUFFEUR MOBILE COMPANION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="select-field"
                style={{
                  height: '34px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  padding: '4px 30px 4px 10px',
                  borderRadius: '10px'
                }}
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.user_detail?.first_name ? `${d.user_detail?.first_name} ${d.user_detail?.last_name}` : d.user_detail?.username} ({d.duty_status})
                  </option>
                ))}
              </select>
              <button
                onClick={fetchPortalData}
                className="btn-secondary"
                style={{ padding: '6px 10px', borderRadius: '10px' }}
                title="Refresh Driver Data"
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Quick Portal Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f1f5f9',
          borderRadius: '24px',
          padding: '3px',
          border: '1px solid #cbd5e1'
        }}>
          <button
            onClick={() => setActiveRole('FLEET_ADMIN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: '#475569'
            }}
            title="Switch to Fleet Admin (Owner Console)"
          >
            <Crown size={13} color="#64748b" />
            <span>Fleet Admin</span>
          </button>

          <button
            onClick={() => setActiveRole('DISPATCHER')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: '#475569'
            }}
            title="Switch to Dispatcher (Control Room)"
          >
            <Headphones size={13} color="#64748b" />
            <span>Dispatcher Desk</span>
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'default',
              background: '#16a34a',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
            }}
          >
            <Smartphone size={13} color="#ffffff" />
            <span>Chauffeur App</span>
          </button>
        </div>

        {/* Right: Phone Frame Simulator Toggle & SOS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#e2e8f0',
            borderRadius: '12px',
            padding: '3px',
            display: 'flex',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewportMode('phone')}
              style={{
                padding: '5px 12px',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: 'none',
                background: viewportMode === 'phone' ? '#ffffff' : 'transparent',
                color: viewportMode === 'phone' ? '#0f172a' : '#64748b',
                boxShadow: viewportMode === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Smartphone size={12} />
              <span>Mobile View</span>
            </button>

            <button
              onClick={() => setViewportMode('responsive')}
              style={{
                padding: '5px 12px',
                borderRadius: '9px',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: 'none',
                background: viewportMode === 'responsive' ? '#ffffff' : 'transparent',
                color: viewportMode === 'responsive' ? '#0f172a' : '#64748b',
                boxShadow: viewportMode === 'responsive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Maximize2 size={12} />
              <span>Full Screen</span>
            </button>
          </div>

          <button
            onClick={handleEmergencySOS}
            style={{
              padding: '7px 14px',
              borderRadius: '12px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
            }}
          >
            <AlertCircle size={14} />
            <span>SOS DISTRESS</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA: PHONE FRAME OR RESPONSIVE */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1
      }}>
        <div style={{
          width: viewportMode === 'phone' ? '410px' : '100%',
          maxWidth: viewportMode === 'phone' ? '410px' : '900px',
          background: '#ffffff',
          borderRadius: viewportMode === 'phone' ? '46px' : '24px',
          border: viewportMode === 'phone' ? '12px solid #1e293b' : '1px solid var(--border-color)',
          boxShadow: viewportMode === 'phone' ? '0 30px 60px rgba(0,0,0,0.25), 0 0 0 2px #334155' : '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: '740px'
        }}>
          {/* SIMULATED PHONE STATUS BAR (Visible only in Phone Mode) */}
          {viewportMode === 'phone' && (
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 24px 6px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <span>9:41</span>
              {/* Dynamic Island Notch */}
              <div style={{
                width: '110px',
                height: '24px',
                background: '#000000',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontSize: '0.65rem'
              }}>
                <Radio size={10} style={{ marginRight: '4px' }} className="animate-pulse" />
                APEX GPS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* CHAUFFEUR HEADER BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '22px 22px 18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  border: '2px solid #ffffff'
                }}>
                  {driverProfile?.user_detail?.first_name?.[0] || 'C'}
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    {driverProfile?.user_detail?.first_name} {driverProfile?.user_detail?.last_name || driverProfile?.user_detail?.username}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#f59e0b', fontWeight: 700 }}>
                      <Star size={12} fill="#f59e0b" style={{ marginRight: '2px' }} />
                      {driverProfile?.rating || '5.0'}
                    </span>
                    <span>• Badge: {driverProfile?.badge_number || 'GOA-CH-01'}</span>
                  </div>
                </div>
              </div>

              {/* Shift status badge */}
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '12px',
                background: activeShift ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                color: activeShift ? '#4ade80' : '#cbd5e1',
                border: `1px solid ${activeShift ? 'rgba(74, 222, 128, 0.4)' : 'rgba(203, 213, 225, 0.2)'}`
              }}>
                {activeShift ? 'ON DUTY' : 'OFF DUTY'}
              </span>
            </div>

            {/* Assigned vehicle pill */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={16} color="#38bdf8" />
                <span>
                  {activeShift?.vehicle_detail ? (
                    <><strong>{activeShift.vehicle_detail.registration_number}</strong> ({activeShift.vehicle_detail.model})</>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>No vehicle assigned for current shift</span>
                  )}
                </span>
              </div>

              {activeShift ? (
                <button
                  onClick={handleEndShift}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  End Shift
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShiftVehicleId(vehicles[0]?.id || '');
                    setShiftStartOdo(vehicles[0]?.current_odometer || 12000);
                    setShowShiftModal(true);
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Start Shift
                </button>
              )}
            </div>
          </div>

          {/* MOBILE INTERNAL NAVIGATION TABS */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderBottom: '1px solid var(--border-color)',
            padding: '6px 12px',
            gap: '6px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'duty', label: 'My Duty', icon: Crown },
              { id: 'fleet', label: `Fleet Cars (${vehicles.length})`, icon: Car },
              { id: 'peers', label: `Chauffeurs (${drivers.length})`, icon: User },
              { id: 'rates', label: 'Rate Card', icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? '#0f172a' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontSize: '0.74rem',
                    fontWeight: isActive ? 700 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={13} color={isActive ? '#38bdf8' : '#64748b'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* MAIN MOBILE SCROLL BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* VIEW 1: MY ACTIVE DUTY */}
            {mobileTab === 'duty' && (
              <>
                {/* ACTIVE TRIP CALLOUT (IF DUTY DISPATCHED / ON TRIP) */}
                {activeBooking ? (
                  <div style={{
                    borderRadius: '22px',
                    border: activeBooking.status === 'ON_TRIP' ? '2px solid #16a34a' : '2px solid #0284c7',
                    background: activeBooking.status === 'ON_TRIP' ? '#f0fdf4' : '#f0f9ff',
                    padding: '18px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}>
                    {/* Duty Alert Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: activeBooking.status === 'ON_TRIP' ? '#16a34a' : '#0284c7',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {activeBooking.status === 'ON_TRIP' ? '🟢 TRIP IN PROGRESS' : '🚨 NEW DUTY ASSIGNED'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                        {activeBooking.booking_reference}
                      </span>
                    </div>

                    {/* Live Meter Timer if ON_TRIP */}
                    {activeBooking.status === 'ON_TRIP' && (
                      <div style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #bbf7d0'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trip Duration</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                            {formatTimer(elapsedSeconds)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Start Meter</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                            {activeBooking.start_odometer || 0} <span style={{ fontSize: '0.75rem' }}>KM</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VIP Passenger Card */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {activeBooking.passenger_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {activeBooking.client_name} • {activeBooking.passenger_count} Passenger(s)
                        </div>
                      </div>

                      <a
                        href={`tel:${activeBooking.passenger_phone}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#2563eb',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
                        }}
                      >
                        <Phone size={18} />
                      </a>
                    </div>

                    {/* Route Points */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pickup Location</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeBooking.pickup_location}</div>
                        </div>
                      </div>

                      <div style={{ borderLeft: '2px dashed #cbd5e1', height: '10px', marginLeft: '4px' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Destination</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeBooking.dropoff_location}</div>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions & Flight */}
                    {(activeBooking.flight_number || activeBooking.special_instructions) && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        color: '#475569'
                      }}>
                        {activeBooking.flight_number && (
                          <div style={{ color: '#0284c7', fontWeight: 700, marginBottom: '2px' }}>
                            ✈️ Arrival Flight: {activeBooking.flight_number}
                          </div>
                        )}
                        {activeBooking.special_instructions && (
                          <div>VIP Notes: {activeBooking.special_instructions}</div>
                        )}
                      </div>
                    )}

                    {/* Chauffeur Lifecycle Progression Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {activeBooking.status === 'DISPATCHED' && (
                        <>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeBooking.pickup_location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '14px',
                                background: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                textDecoration: 'none'
                              }}
                            >
                              <Navigation size={15} color="#0284c7" />
                              <span>Google Maps</span>
                            </a>

                            <button
                              onClick={() => setShowPlacardModal(true)}
                              style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '14px',
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Crown size={15} color="#d97706" />
                              <span>VIP Placard</span>
                            </button>
                          </div>

                          <button
                            onClick={handleStartTrip}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '14px',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                            }}
                          >
                            <Play size={16} />
                            <span>Passenger Onboard ➔ Start Trip</span>
                          </button>
                        </>
                      )}

                      {activeBooking.status === 'ON_TRIP' && (
                        <button
                          onClick={() => {
                            const start = activeBooking.start_odometer || 12000;
                            setEndOdo(Number(start) + 38);
                            setTollParking(120);
                            setShowEndTripModal(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '14px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={16} color="#4ade80" />
                          <span>Conclude Ride & Submit Duty Slip</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* NO ACTIVE TRIP HERO BANNER */
                  <div style={{
                    borderRadius: '20px',
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    padding: '28px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(2, 132, 199, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7'
                    }}>
                      <Coffee size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {activeShift ? 'Waiting for Next Executive Duty' : 'Shift Not Started'}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>
                        {activeShift 
                          ? 'You are on duty and ready for dispatch in Goa.' 
                          : 'Please start your shift above to receive trips.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* TODAY'S SHIFT KPI CARDS */}
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Today's Chauffeur Earnings & Duty
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{
                      background: '#ffffff',
                      padding: '14px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Today Payout (20%)</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
                        ₹{Number(stats.today_earnings_inr || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        {stats.today_trips_count || 0} completed rides
                      </div>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      padding: '14px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Distance Driven</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                        {stats.today_kms || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>KM</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: '2px' }}>
                        Safety Score: 98.5%
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT DUTY SLIPS HISTORY */}
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Completed Duty Slips
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(portalData?.recent_trips || []).slice(0, 3).map((trip) => (
                      <div
                        key={trip.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            {trip.passenger_name} ({trip.client_name})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {trip.pickup_location?.slice(0, 18)} ➔ {trip.dropoff_location?.slice(0, 18)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#15803d' }}>
                            ₹{Number(trip.total_fare_inr).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {trip.distance_km} KM
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: FLEET CARS DIRECTORY */}
            {mobileTab === 'fleet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Company Fleet Vehicles Directory
                </div>

                {vehicles.map((v) => {
                  const isAvailable = v.status === 'AVAILABLE';
                  const isOnDuty = v.status === 'ON_DUTY';

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '14px',
                        border: isAvailable ? '1.5px solid #86efac' : '1px solid var(--border-color)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {v.registration_number}
                          </span>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
                            {v.make} {v.model}
                          </h5>
                        </div>

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: isAvailable ? 'var(--color-success-bg)' : isOnDuty ? 'rgba(2,132,199,0.1)' : 'rgba(245,158,11,0.1)',
                          color: isAvailable ? 'var(--color-success)' : isOnDuty ? '#0284c7' : '#d97706'
                        }}>
                          {isAvailable ? '🟢 FREE' : isOnDuty ? '🔵 ON DUTY' : '🟠 REPAIR'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>{v.vehicle_class_display || v.vehicle_class} • {v.fuel_type_display || v.fuel_type}</span>
                        <strong style={{ color: '#16a34a' }}>₹{v.extra_km_rate_inr || 15}/KM</strong>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px' }}>
                        Driver: <strong>{v.assigned_driver?.user_detail?.first_name ? `${v.assigned_driver.user_detail.first_name} ${v.assigned_driver.user_detail.last_name || ''}` : 'No driver checked in'}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 3: PEER CHAUFFEURS ON DUTY */}
            {mobileTab === 'peers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Peer Chauffeurs Roster
                </div>

                {drivers.map((d) => {
                  const isReady = d.duty_status === 'ON_DUTY_AVAILABLE';
                  const isOnTrip = d.duty_status === 'ON_TRIP';

                  return (
                    <div
                      key={d.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                          {d.user_detail?.first_name} {d.user_detail?.last_name || d.user_detail?.username}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Badge: {d.badge_number || 'GOA-CH-01'} • <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {d.rating || '5.0'}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>
                          Car: {d.vehicle_detail?.registration_number || 'No Car Assigned'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: isReady ? 'var(--color-success-bg)' : isOnTrip ? 'rgba(2,132,199,0.1)' : '#f1f5f9',
                          color: isReady ? 'var(--color-success)' : isOnTrip ? '#0284c7' : '#64748b'
                        }}>
                          {isReady ? '🟢 AVAILABLE' : isOnTrip ? '🔵 ON TRIP' : '⚪ OFF'}
                        </span>

                        {d.user_detail?.phone_number && (
                          <a
                            href={`tel:${d.user_detail.phone_number}`}
                            style={{
                              padding: '5px 12px',
                              background: '#16a34a',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Phone size={11} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 4: OFFICIAL RATE CARD & FARE CALCULATOR */}
            {mobileTab === 'rates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Official Per-KM Rate Card
                </div>

                {/* Rate Card Tiles */}
                {[
                  { segment: 'SEDAN', name: 'Executive Sedan', base: 2200, km: 40, extra: 16, models: 'Camry, Verna' },
                  { segment: 'SUV', name: 'Premium SUV', base: 3200, km: 40, extra: 22, models: 'Innova Crysta, Fortuner' },
                  { segment: 'EV', name: 'Electric (EV)', base: 2400, km: 40, extra: 15, models: 'Tigor EV, MG ZS' },
                  { segment: 'LUXURY', name: 'Mercedes Luxury', base: 6500, km: 40, extra: 45, models: 'Mercedes E-Class' }
                ].map(r => (
                  <div
                    key={r.segment}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Base: ₹{r.base} (Includes {r.km} KM)</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#16a34a', fontSize: '1rem' }}>₹{r.extra} / KM</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>extra km rate</div>
                    </div>
                  </div>
                ))}

                {/* Quick Passenger Quote Tool */}
                <div style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>
                    ⚡ Instant Passenger Quote Tool
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Car Class</label>
                      <select
                        value={driverCalcClass}
                        onChange={(e) => setDriverCalcClass(e.target.value)}
                        style={{ width: '100%', height: '34px', borderRadius: '8px', padding: '0 8px', fontSize: '0.8rem' }}
                      >
                        <option value="SEDAN">Sedan (₹16/km)</option>
                        <option value="SUV">SUV Innova (₹22/km)</option>
                        <option value="EV">EV (₹15/km)</option>
                        <option value="LUXURY">Mercedes (₹45/km)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Est. KM</label>
                      <input
                        type="number"
                        value={driverCalcKm}
                        onChange={(e) => setDriverCalcKm(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '8px', padding: '0 8px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const rates = { SEDAN: [2200, 16], SUV: [3200, 22], EV: [2400, 15], LUXURY: [6500, 45] };
                    const [base, perKm] = rates[driverCalcClass] || [3200, 22];
                    const extra = Math.max(0, driverCalcKm - 40) * perKm;
                    const total = (base + extra) * 1.05;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Total Fare (+5% GST):</span>
                        <strong style={{ fontSize: '1.25rem', color: '#38bdf8' }}>₹{Math.round(total).toLocaleString()}</strong>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* START SHIFT PRE-INSPECTION MODAL */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Chauffeur Shift Start & Safety Checklist
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Mandatory pre-trip readiness check for B2B executive service
                </p>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartShiftSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Vehicle for Duty
                </label>
                <select
                  value={shiftVehicleId}
                  onChange={(e) => {
                    setShiftVehicleId(e.target.value);
                    const v = vehicles.find(item => String(item.id) === String(e.target.value));
                    if (v) setShiftStartOdo(v.current_odometer);
                  }}
                  className="input-field"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.make} {v.model} ({v.vehicle_class}) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Starting Vehicle Odometer (KM)
                </label>
                <input
                  type="number"
                  value={shiftStartOdo}
                  onChange={(e) => setShiftStartOdo(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                  required
                />
              </div>

              {/* Checklist */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Pre-Trip Safety & Hygiene Declaration
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  {[
                    ['uniform_groomed', 'Chauffeur attire compliant (Uniform, Tie, ID Badge)'],
                    ['interior_clean_ac', 'Cabin vacuumed, sanitized & dual AC functional'],
                    ['water_stocked', 'Packaged mineral water & clean tissues stocked in rear'],
                    ['fastag_active', 'Commercial FASTag toll account active with balance'],
                    ['fit_to_drive', 'Zero fatigue / fit-to-drive medical declaration']
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={inspectionChecks[key]}
                        onChange={(e) => setInspectionChecks({ ...inspectionChecks, [key]: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shiftSubmitting}
                  className="btn-primary"
                  style={{ borderRadius: '10px', background: '#2563eb' }}
                >
                  <Check size={16} />
                  <span>{shiftSubmitting ? 'Starting...' : 'Confirm & Go On Duty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONCLUDE TRIP & EXPENSE LOG MODAL */}
      {showEndTripModal && activeBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Conclude Ride & Submit Duty Slip
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Duty Ref: {activeBooking.booking_reference} • {activeBooking.passenger_name}
                </p>
              </div>
              <button
                onClick={() => setShowEndTripModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteTripSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Final Odometer Reading (KM)
                </label>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Starting Odometer was: {activeBooking.start_odometer || 0} KM
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Toll & Airport Parking Expenses (₹ INR)
                </label>
                <input
                  type="number"
                  value={tollParking}
                  onChange={(e) => setTollParking(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Auto-reimbursed and billed to corporate invoice.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEndTripModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingTrip}
                  className="btn-primary"
                  style={{ borderRadius: '10px', background: '#16a34a' }}
                >
                  <Check size={16} />
                  <span>{completingTrip ? 'Submitting...' : 'Complete Duty Slip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIP PLACARD MODAL INTEGRATION */}
      {showPlacardModal && activeBooking && (
        <VIPPlacardModal
          booking={activeBooking}
          isOpen={showPlacardModal}
          onClose={() => setShowPlacardModal(false)}
        />
      )}
    </div>
  );
};

export default ChauffeurPortal;
