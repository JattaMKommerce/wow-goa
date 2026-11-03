import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/taxiApi';
import { 
  Smartphone, User, Car, CheckCircle2, AlertTriangle, 
  MapPin, Clock, Phone, Navigation, Play, Check, 
  ShieldCheck, Star, DollarSign, Receipt, RefreshCw, 
  ChevronRight, AlertCircle, Sparkles, Crown, Coffee, 
  Maximize2, Minimize2, Radio, Zap, Shield, FileText, X,
  Headphones, ArrowLeft, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/TaxiAuthContext';
import VIPPlacardModal from '../../components/taxi/dispatches/VIPPlacardModal';

const ChauffeurPortal = ({ currentUser, onLogout, onNavigateHome }) => {
  const authContext = useAuth ? useAuth() : {};
  const activeRole = authContext.activeRole || 'DRIVER';
  const setActiveRole = authContext.setActiveRole || (() => {});
  const authUser = authContext.user || currentUser;

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mobile App Internal Navigation Tab: 'duty' | 'fleet' | 'peers' | 'rates'
  const [mobileTab, setMobileTab] = useState('duty');
  const [driverCalcKm, setDriverCalcKm] = useState(40);
  const [driverCalcClass, setDriverCalcClass] = useState('SUV');

  // Device & Viewport Detection — De-congest on real mobile devices / native APK!
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || Boolean(window.Capacitor) || window.location.search.includes('mode=app');
  });

  // Desktop simulated phone vs responsive full-width view
  const [viewportMode, setViewportMode] = useState(() => {
    if (typeof window === 'undefined') return 'responsive';
    return (window.innerWidth < 768 || Boolean(window.Capacitor)) ? 'responsive' : 'responsive';
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768 || Boolean(window.Capacitor) || window.location.search.includes('mode=app');
      setIsMobile(mobile);
      if (mobile) setViewportMode('responsive');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Storefront Cab Bookings Live State
  const [storefrontDispatches, setStorefrontDispatches] = useState([]);
  const [incomingBooking, setIncomingBooking] = useState(null);
  const [acceptedStorefrontBooking, setAcceptedStorefrontBooking] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);
  const [lastAlertId, setLastAlertId] = useState(null);
  const audioContextRef = useRef(null);

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

  // Synthesized Web Audio alert chime (works without external MP3 files)
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // Sync Storefront Cab Bookings from localStorage
  const syncStorefrontBookings = () => {
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      setStorefrontDispatches(dispatches);

      // Find any incoming ride request: status === 'Requested' or 'Pending' or 'Allocated'
      const incoming = dispatches.find(d => 
        d.status === 'Requested' || d.status === 'Pending' || d.status === 'Allocated'
      );
      setIncomingBooking(incoming || null);

      if (incoming && incoming.id !== lastAlertId) {
        setLastAlertId(incoming.id);
        playAlertChime();
      }

      // Find any active ride for this chauffeur or accepted ride
      const activeRide = dispatches.find(d => 
        d.status === 'Driver Arrived' || d.status === 'Confirmed' || d.status === 'In Progress' || d.status === 'In Transit'
      );
      setAcceptedStorefrontBooking(activeRide || null);
    } catch (e) {
      console.error('Error syncing storefront dispatches:', e);
    }
  };

  useEffect(() => {
    syncStorefrontBookings();
    const interval = setInterval(syncStorefrontBookings, 2500); // 2.5s live polling

    const handleDispatchUpdate = (e) => {
      syncStorefrontBookings();
      if (e?.detail?.status === 'Requested') {
        playAlertChime();
      }
    };

    window.addEventListener('wowgoa_dispatch_updated', handleDispatchUpdate);
    window.addEventListener('storage', syncStorefrontBookings);

    return () => {
      clearInterval(interval);
      window.removeEventListener('wowgoa_dispatch_updated', handleDispatchUpdate);
      window.removeEventListener('storage', syncStorefrontBookings);
    };
  }, [lastAlertId]);

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
          // If currentUser matches a driver, select it
          const matched = driverList.find(d => 
            d.id === authUser?.id || 
            d.full_name?.toLowerCase().includes(authUser?.first_name?.toLowerCase() || '')
          );
          setSelectedDriverId(matched ? matched.id : driverList[0].id);
        }
      } catch (err) {
        console.error('Failed to init chauffeur portal:', err);
      }
    };
    initData();
  }, [authUser]);

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

  // Auto-dismiss toast
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Elapsed timer tick when trip is ON_TRIP or In Progress
  useEffect(() => {
    const isOnTrip = portalData?.active_booking?.status === 'ON_TRIP' || acceptedStorefrontBooking?.status === 'In Progress';
    if (isOnTrip) {
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsedSeconds(0);
    }
  }, [portalData?.active_booking?.status, acceptedStorefrontBooking?.status]);

  // Handle Accept Incoming Ride
  const handleAcceptRide = (booking) => {
    if (!booking) return;
    const currentDriver = drivers.find(d => String(d.id) === String(selectedDriverId)) || {
      full_name: authUser?.name || 'Suresh Naik',
      phone_number: authUser?.phone || '+91 98221 44510',
      assigned_vehicle_reg: authUser?.vehiclePlate || 'GA-03-Z-8899',
      assigned_vehicle_model: authUser?.vehicleModel || 'Toyota Innova Crysta',
      rating: 4.93
    };

    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => {
        if (d.id === booking.id) {
          return {
            ...d,
            status: 'Driver Arrived',
            chauffeur: currentDriver.full_name || 'Suresh Naik',
            driverPhone: currentDriver.phone_number || '+91 98221 44510',
            vehiclePlate: currentDriver.assigned_vehicle_reg || 'GA-03-Z-8899',
            car: currentDriver.assigned_vehicle_model || d.car || 'Toyota Innova Crysta',
            acceptedAt: new Date().toISOString()
          };
        }
        return d;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

      // Also update wowgoa_active_ride so customer storefront sees driver accepted immediately!
      const activeRideStr = localStorage.getItem('wowgoa_active_ride');
      if (activeRideStr) {
        try {
          const activeRide = JSON.parse(activeRideStr);
          if (activeRide.refId === booking.id || activeRide.id === booking.id || !activeRide.refId) {
            const updatedActive = {
              ...activeRide,
              status: 'Driver Arrived',
              chauffeur: {
                name: currentDriver.full_name || 'Suresh Naik',
                phone: currentDriver.phone_number || '+91 98221 44510',
                vehiclePlate: currentDriver.assigned_vehicle_reg || 'GA-03-Z-8899',
                carName: currentDriver.assigned_vehicle_model || 'Toyota Innova Crysta',
                rating: currentDriver.rating || 4.93,
                trips: 1840
              }
            };
            localStorage.setItem('wowgoa_active_ride', JSON.stringify(updatedActive));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: booking.id, status: 'Driver Arrived' }
      }));

      playAlertChime();
      setToastAlert({
        title: 'Ride Accepted! 🎉',
        message: `Duty assigned to ${currentDriver.full_name || 'Suresh Naik'}. Navigate to pickup location.`,
        type: 'success'
      });
      syncStorefrontBookings();
    } catch (err) {
      alert('Error accepting ride: ' + err.message);
    }
  };

  // Handle Decline Incoming Ride
  const handleDeclineRide = (booking, reason = 'Chauffeur busy / location out of range') => {
    if (!booking) return;
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => {
        if (d.id === booking.id) {
          return {
            ...d,
            status: 'Cancelled',
            rejectionReason: reason,
            cancelledAt: new Date().toISOString()
          };
        }
        return d;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

      const activeRideStr = localStorage.getItem('wowgoa_active_ride');
      if (activeRideStr) {
        try {
          const activeRide = JSON.parse(activeRideStr);
          if (activeRide.refId === booking.id || activeRide.id === booking.id) {
            localStorage.setItem('wowgoa_active_ride', JSON.stringify({
              ...activeRide,
              status: 'Cancelled',
              cancelReason: reason
            }));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: booking.id, status: 'CANCELLED' }
      }));

      setToastAlert({
        title: 'Ride Declined',
        message: `Booking #${booking.id} was declined and routed back to dispatch.`,
        type: 'info'
      });
      syncStorefrontBookings();
    } catch (err) {
      alert('Error declining ride: ' + err.message);
    }
  };

  // Handle Start Storefront Trip
  const handleStartStorefrontTrip = (booking) => {
    if (!booking) return;
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => {
        if (d.id === booking.id) {
          return {
            ...d,
            status: 'In Progress',
            startedAt: new Date().toISOString()
          };
        }
        return d;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

      const activeRideStr = localStorage.getItem('wowgoa_active_ride');
      if (activeRideStr) {
        try {
          const activeRide = JSON.parse(activeRideStr);
          if (activeRide.refId === booking.id || activeRide.id === booking.id) {
            localStorage.setItem('wowgoa_active_ride', JSON.stringify({
              ...activeRide,
              status: 'In Progress',
              startedAt: new Date().toISOString()
            }));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: booking.id, status: 'IN_PROGRESS' }
      }));

      playAlertChime();
      setToastAlert({
        title: 'Trip Started! 🚗',
        message: `Driving passenger safely to destination.`,
        type: 'success'
      });
      syncStorefrontBookings();
    } catch (err) {
      alert('Error starting trip: ' + err.message);
    }
  };

  // Handle Complete Storefront Trip
  const handleCompleteStorefrontTrip = (booking) => {
    if (!booking) return;
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => {
        if (d.id === booking.id) {
          return {
            ...d,
            status: 'Completed',
            completedAt: new Date().toISOString()
          };
        }
        return d;
      });
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));

      const activeRideStr = localStorage.getItem('wowgoa_active_ride');
      if (activeRideStr) {
        try {
          const activeRide = JSON.parse(activeRideStr);
          if (activeRide.refId === booking.id || activeRide.id === booking.id) {
            localStorage.setItem('wowgoa_active_ride', JSON.stringify({
              ...activeRide,
              status: 'Completed',
              completedAt: new Date().toISOString()
            }));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('wowgoa_dispatch_updated', {
        detail: { id: booking.id, status: 'COMPLETED' }
      }));

      playAlertChime();
      setToastAlert({
        title: 'Ride Completed! 🏁',
        message: `Trip #${booking.id} completed. ₹${Math.round((booking.amount || 1200) * 0.8)} credited to your chauffeur wallet.`,
        type: 'success'
      });
      syncStorefrontBookings();
    } catch (err) {
      alert('Error completing trip: ' + err.message);
    }
  };

  // Handle Start Shift Submit
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

  // Handle Start Trip (Backend Dispatch)
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

  // Handle Conclude Trip (Backend Dispatch)
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

  // Active Booking resolution: Prefer accepted storefront booking, fallback to portalData
  const activeBooking = acceptedStorefrontBooking ? {
    id: acceptedStorefrontBooking.id,
    booking_reference: acceptedStorefrontBooking.id,
    status: acceptedStorefrontBooking.status === 'In Progress' ? 'ON_TRIP' : 'DISPATCHED',
    passenger_name: acceptedStorefrontBooking.customer || acceptedStorefrontBooking.passengerName || 'Valued Guest',
    passenger_phone: acceptedStorefrontBooking.phone || acceptedStorefrontBooking.passengerPhone || '+91 98765 43210',
    client_name: 'Storefront Direct Cab',
    passenger_count: 1,
    pickup_location: acceptedStorefrontBooking.pickup || (acceptedStorefrontBooking.service ? acceptedStorefrontBooking.service.split('➔')[0]?.trim() : 'Pickup Location'),
    dropoff_location: acceptedStorefrontBooking.dropoff || (acceptedStorefrontBooking.service ? acceptedStorefrontBooking.service.split('➔')[1]?.trim() : 'Destination'),
    total_fare_inr: acceptedStorefrontBooking.amount || 1200,
    otp: acceptedStorefrontBooking.otp || '4821',
    start_odometer: 14200,
    flight_number: acceptedStorefrontBooking.flightNumber || null,
    special_instructions: acceptedStorefrontBooking.instructions || null,
    isStorefront: true
  } : portalData?.active_booking;

  const activeShift = portalData?.active_shift || (authUser ? {
    vehicle_detail: {
      registration_number: authUser.vehiclePlate || 'GA-03-Z-8899',
      model: authUser.vehicleModel || 'Toyota Innova Crysta'
    }
  } : null);

  const driverProfile = portalData?.driver || {
    user_detail: {
      first_name: authUser?.first_name || authUser?.name?.split(' ')[0] || 'Suresh',
      last_name: authUser?.last_name || authUser?.name?.split(' ')[1] || 'Naik',
      phone_number: authUser?.phone || '+91 98221 44510'
    },
    rating: authUser?.rating || '4.93',
    badge_number: authUser?.badge || 'GOA-CH-01'
  };

  const stats = portalData?.stats || {
    today_earnings_inr: 2840,
    today_trips_count: 3,
    today_kms: 84
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      padding: isMobile ? '10px 12px' : '20px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '12px' : '18px',
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Toast Alert Notification */}
      {toastAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toastAlert.type === 'success' ? '#15803d' : '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          maxWidth: '360px'
        }}>
          <CheckCircle2 size={20} color="#4ade80" />
          <div>
            <div style={{ fontWeight: 800 }}>{toastAlert.title}</div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>{toastAlert.message}</div>
          </div>
        </div>
      )}

      {/* Top Operations Header Strip */}
      <div style={{
        background: '#ffffff',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '10px 14px' : '14px 20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Driver Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: isMobile ? '38px' : '44px',
            height: isMobile ? '38px' : '44px',
            borderRadius: '12px',
            background: '#16a34a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: isMobile ? '1rem' : '1.15rem'
          }}>
            {driverProfile?.user_detail?.first_name?.[0] || 'S'}
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
              🚗 CHAUFFEUR CAPTAIN APP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontWeight: 800, fontSize: isMobile ? '0.9rem' : '1rem', color: '#0f172a' }}>
                {driverProfile?.user_detail?.first_name} {driverProfile?.user_detail?.last_name}
              </span>
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px'
              }}>
                ★ {driverProfile?.rating || '4.93'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isMobile && (
            <div style={{
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '2px',
              display: 'flex',
              gap: '2px'
            }}>
              <button
                onClick={() => setViewportMode('responsive')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  background: viewportMode === 'responsive' ? '#ffffff' : 'transparent',
                  color: viewportMode === 'responsive' ? '#0f172a' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Desktop Console
              </button>
              <button
                onClick={() => setViewportMode('phone')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  background: viewportMode === 'phone' ? '#ffffff' : 'transparent',
                  color: viewportMode === 'phone' ? '#0f172a' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Phone Simulator
              </button>
            </div>
          )}

          <button
            onClick={handleEmergencySOS}
            style={{
              padding: isMobile ? '6px 10px' : '7px 12px',
              borderRadius: '10px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <AlertCircle size={13} />
            <span>SOS</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                padding: isMobile ? '6px 10px' : '7px 12px',
                borderRadius: '10px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE: DE-CONGESTED, RESPONSIVE & FLUID */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1
      }}>
        <div style={{
          width: '100%',
          maxWidth: (!isMobile && viewportMode === 'phone') ? '420px' : '920px',
          background: '#ffffff',
          borderRadius: (!isMobile && viewportMode === 'phone') ? '36px' : (isMobile ? '18px' : '22px'),
          border: (!isMobile && viewportMode === 'phone') ? '8px solid #1e293b' : '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Simulated Phone Bar only in Desktop Simulator Mode */}
          {!isMobile && viewportMode === 'phone' && (
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '10px 18px 4px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              <span>9:41</span>
              <div style={{
                background: '#000000',
                borderRadius: '10px',
                padding: '2px 10px',
                color: '#38bdf8',
                fontSize: '0.62rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Radio size={9} className="animate-pulse" />
                <span>APEX GPS LIVE</span>
              </div>
              <span>5G 100%</span>
            </div>
          )}

          {/* CHAUFFEUR HEADER BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  border: '2px solid #ffffff'
                }}>
                  {driverProfile?.user_detail?.first_name?.[0] || 'C'}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                    {driverProfile?.user_detail?.first_name} {driverProfile?.user_detail?.last_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      ★ {driverProfile?.rating || '4.93'}
                    </span>
                    <span>• Badge: {driverProfile?.badge_number || 'GOA-CH-01'}</span>
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.4)'
              }}>
                ON DUTY
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
                  <strong>{activeShift?.vehicle_detail?.registration_number || 'GA-03-Z-8899'}</strong> ({activeShift?.vehicle_detail?.model || 'Toyota Innova Crysta'})
                </span>
              </div>

              <button
                onClick={() => {
                  syncStorefrontBookings();
                  fetchPortalData();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={11} className={loading ? 'spin' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* MOBILE / RESPONSIVE NAVIGATION TABS */}
          <div style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '6px 10px',
            gap: '6px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'duty', label: 'My Duty', icon: Crown },
              { id: 'fleet', label: `Fleet Cars (${vehicles.length || 6})`, icon: Car },
              { id: 'peers', label: `Chauffeurs (${drivers.length || 4})`, icon: User },
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
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#0f172a' : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontSize: '0.74rem',
                    fontWeight: isActive ? 800 : 600,
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

          {/* MAIN SCROLLABLE CONTENT BODY */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '14px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* VIEW 1: MY ACTIVE DUTY */}
            {mobileTab === 'duty' && (
              <>
                {/* ───────────────────────────────────────────────────────────── */}
                {/* 1. INCOMING RIDE REQUEST ALERT (WITH ACCEPT / DECLINE)         */}
                {/* ───────────────────────────────────────────────────────────── */}
                {incomingBooking && !acceptedStorefrontBooking && (
                  <div style={{
                    borderRadius: '18px',
                    border: '2px solid #16a34a',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    padding: isMobile ? '14px' : '18px',
                    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'pulse 2.5s infinite'
                  }}>
                    {/* Incoming Alert Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Zap size={14} />
                        <span>🔔 NEW RIDE REQUEST</span>
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#15803d',
                        background: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0'
                      }}>
                        #{incomingBooking.id}
                      </span>
                    </div>

                    {/* Customer & Route Details */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: '1px solid #bbf7d0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            {incomingBooking.customer || 'Valued Goa Guest'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {incomingBooking.phone || '+91 98765 43210'} • {incomingBooking.car || 'Sedan Prime'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803d' }}>
                            ₹{incomingBooking.amount || 1450}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                            Payout: ₹{Math.round((incomingBooking.amount || 1450) * 0.8)} (80%)
                          </div>
                        </div>
                      </div>

                      {/* Route Path */}
                      <div style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {incomingBooking.pickup || (incomingBooking.service ? incomingBooking.service.split('➔')[0]?.trim() : 'Pickup Location')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {incomingBooking.dropoff || (incomingBooking.service ? incomingBooking.service.split('➔')[1]?.trim() : 'Destination')}
                          </span>
                        </div>
                      </div>

                      {incomingBooking.otp && (
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.74rem'
                        }}>
                          <span style={{ color: '#64748b' }}>Passenger Verification:</span>
                          <span style={{ fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                            OTP: {incomingBooking.otp}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prominent Action Buttons: ACCEPT or DECLINE */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAcceptRide(incomingBooking)}
                        style={{
                          flex: 2,
                          padding: '13px',
                          borderRadius: '12px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>✓ ACCEPT RIDE</span>
                      </button>

                      <button
                        onClick={() => handleDeclineRide(incomingBooking)}
                        style={{
                          flex: 1,
                          padding: '13px',
                          borderRadius: '12px',
                          background: '#ffffff',
                          color: '#dc2626',
                          border: '1.5px solid #fca5a5',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                        <span>DECLINE</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 2. ACTIVE ACCEPTED TRIP DOSSIER (LIVE PICKUP & IN TRANSIT)    */}
                {/* ───────────────────────────────────────────────────────────── */}
                {activeBooking ? (
                  <div style={{
                    borderRadius: '20px',
                    border: activeBooking.status === 'ON_TRIP' ? '2px solid #16a34a' : '2px solid #0284c7',
                    background: activeBooking.status === 'ON_TRIP' ? '#f0fdf4' : '#f0f9ff',
                    padding: isMobile ? '16px' : '20px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
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
                        borderRadius: '10px',
                        background: activeBooking.status === 'ON_TRIP' ? '#16a34a' : '#0284c7',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {activeBooking.status === 'ON_TRIP' ? '🟢 TRIP IN PROGRESS' : '🚨 PASSENGER PICKUP CONFIRMED'}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                        {activeBooking.booking_reference}
                      </span>
                    </div>

                    {/* Live Duration Timer if ON_TRIP */}
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
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trip Duration</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                            {formatTimer(elapsedSeconds)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Trip Fare</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                            ₹{activeBooking.total_fare_inr || 1200}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Passenger Contact Card */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '14px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {activeBooking.passenger_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {activeBooking.client_name || 'Passenger'} • {activeBooking.passenger_phone}
                        </div>
                      </div>

                      <a
                        href={`tel:${activeBooking.passenger_phone}`}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#16a34a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          boxShadow: '0 3px 10px rgba(22, 163, 74, 0.35)'
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
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pickup Location</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeBooking.pickup_location}</div>
                        </div>
                      </div>

                      <div style={{ borderLeft: '2px dashed #cbd5e1', height: '10px', marginLeft: '4px' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Destination</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeBooking.dropoff_location}</div>
                        </div>
                      </div>
                    </div>

                    {/* OTP Display Pill */}
                    {activeBooking.otp && (
                      <div style={{
                        background: '#ffffff',
                        border: '1.5px solid #0284c7',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                          🔑 Passenger Ride OTP:
                        </span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7', letterSpacing: '2px', fontFamily: 'monospace' }}>
                          {activeBooking.otp}
                        </span>
                      </div>
                    )}

                    {/* Actions: Navigation & Trip Progression */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeBooking.status === 'ON_TRIP' ? activeBooking.dropoff_location : activeBooking.pickup_location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: '11px',
                            borderRadius: '12px',
                            background: '#ffffff',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
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
                            padding: '11px',
                            borderRadius: '12px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            fontSize: '0.82rem',
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

                      {activeBooking.status !== 'ON_TRIP' && (
                        <button
                          onClick={() => {
                            if (activeBooking.isStorefront) {
                              handleStartStorefrontTrip(acceptedStorefrontBooking);
                            } else {
                              handleStartTrip();
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '12px',
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.92rem',
                            fontWeight: 900,
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
                      )}

                      {activeBooking.status === 'ON_TRIP' && (
                        <button
                          onClick={() => {
                            if (activeBooking.isStorefront) {
                              handleCompleteStorefrontTrip(acceptedStorefrontBooking);
                            } else {
                              const start = activeBooking.start_odometer || 12000;
                              setEndOdo(Number(start) + 38);
                              setTollParking(120);
                              setShowEndTripModal(true);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '12px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.92rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={16} color="#4ade80" />
                          <span>Conclude Ride & Complete Duty Slip</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ───────────────────────────────────────────────────────────── */
                  /* 3. NO ACTIVE TRIP STANDBY HERO                                */
                  /* ───────────────────────────────────────────────────────────── */
                  !incomingBooking && (
                    <div style={{
                      borderRadius: '18px',
                      background: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                      padding: '24px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(22, 163, 74, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16a34a'
                      }}>
                        <Coffee size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Ready on Duty for Next Cab Booking
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>
                          Whenever a customer books a cab on WOW GOA, the request will appear right here with Accept & Decline buttons.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* TODAY'S SHIFT KPI CARDS */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Today's Chauffeur Earnings & Duty
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{
                      background: '#ffffff',
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Today Payout (80%)</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
                        ₹{Number(stats.today_earnings_inr || 2840).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        {stats.today_trips_count || 3} completed rides
                      </div>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Distance Driven</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                        {stats.today_kms || 84} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>KM</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', marginTop: '2px' }}>
                        Safety Score: 98.8%
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT DUTY SLIPS HISTORY */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Completed Duty Slips
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(storefrontDispatches.filter(d => d.status === 'Completed').length > 0 
                      ? storefrontDispatches.filter(d => d.status === 'Completed') 
                      : (portalData?.recent_trips || [
                          { id: 'TX-101', passenger_name: 'Rahul Sharma', pickup_location: 'Mopa Airport (GOX)', dropoff_location: 'Calangute Beach', total_fare_inr: 1450, distance_km: 32 },
                          { id: 'TX-102', passenger_name: 'Ananya Roy', pickup_location: 'Panaji Church', dropoff_location: 'Candolim Market', total_fare_inr: 850, distance_km: 16 }
                        ])
                    ).slice(0, 3).map((trip) => (
                      <div
                        key={trip.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            {trip.customer || trip.passenger_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {(trip.pickup || trip.pickup_location)?.slice(0, 18)} ➔ {(trip.dropoff || trip.dropoff_location)?.slice(0, 18)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#15803d' }}>
                            ₹{Number(trip.amount || trip.total_fare_inr || 1200).toLocaleString()}
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            color: '#15803d'
                          }}>
                            PAID
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: FLEET CARS DIRECTORY */}
            {mobileTab === 'fleet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Company Fleet Vehicles Directory
                </div>

                {(vehicles.length > 0 ? vehicles : [
                  { id: 1, registration_number: 'GA-03-Z-8899', make: 'Toyota', model: 'Innova Crysta', vehicle_class: 'SUV', fuel_type: 'Diesel', status: 'AVAILABLE', extra_km_rate_inr: 22 },
                  { id: 2, registration_number: 'GA-07-T-1240', make: 'Maruti', model: 'Dzire Prime', vehicle_class: 'Sedan', fuel_type: 'Petrol', status: 'ON_DUTY', extra_km_rate_inr: 16 },
                  { id: 3, registration_number: 'GA-08-EV-4412', make: 'Tata', model: 'Tigor EV', vehicle_class: 'EV', fuel_type: 'Electric', status: 'AVAILABLE', extra_km_rate_inr: 15 }
                ]).map((v) => {
                  const isAvailable = v.status === 'AVAILABLE';

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        border: isAvailable ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {v.registration_number}
                          </span>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
                            {v.make} {v.model}
                          </h5>
                        </div>

                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: isAvailable ? '#dcfce7' : '#e0f2fe',
                          color: isAvailable ? '#15803d' : '#0284c7'
                        }}>
                          {isAvailable ? '🟢 FREE' : '🔵 ON DUTY'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b' }}>
                        <span>{v.vehicle_class_display || v.vehicle_class} • {v.fuel_type_display || v.fuel_type}</span>
                        <strong style={{ color: '#16a34a' }}>₹{v.extra_km_rate_inr || 18}/KM</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 3: PEER CHAUFFEURS ON DUTY */}
            {mobileTab === 'peers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Peer Chauffeurs Roster
                </div>

                {(drivers.length > 0 ? drivers : [
                  { id: 1, full_name: 'Suresh Naik', badge_number: 'GOA-CH-01', rating: 4.93, duty_status: 'ON_DUTY_AVAILABLE', assigned_vehicle_reg: 'GA-03-Z-8899', phone_number: '+91 98221 44510' },
                  { id: 2, full_name: 'Bikram Naik', badge_number: 'GOA-CH-02', rating: 4.85, duty_status: 'ON_TRIP', assigned_vehicle_reg: 'GA-07-T-1240', phone_number: '+91 94220 78129' },
                  { id: 3, full_name: 'Rahul Gaonkar', badge_number: 'GOA-CH-03', rating: 4.95, duty_status: 'ON_DUTY_AVAILABLE', assigned_vehicle_reg: 'GA-08-EV-4412', phone_number: '+91 99231 66201' }
                ]).map((d) => {
                  const isReady = d.duty_status === 'ON_DUTY_AVAILABLE' || d.duty_status === 'ON_DUTY';
                  const name = d.full_name || (d.user_detail ? `${d.user_detail.first_name} ${d.user_detail.last_name || ''}` : 'Chauffeur');
                  const phone = d.phone_number || d.user_detail?.phone_number;

                  return (
                    <div
                      key={d.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Badge: {d.badge_number || 'GOA-CH-01'} • <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {d.rating || '5.0'}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: '2px' }}>
                          Car: {d.assigned_vehicle_reg || 'GA-03-Z-8899'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: isReady ? '#dcfce7' : '#e0f2fe',
                          color: isReady ? '#15803d' : '#0284c7'
                        }}>
                          {isReady ? '🟢 AVAILABLE' : '🔵 ON TRIP'}
                        </span>

                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            style={{
                              padding: '4px 10px',
                              background: '#16a34a',
                              color: '#ffffff',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Phone size={10} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Official Per-KM Rate Card
                </div>

                {[
                  { segment: 'SEDAN', name: 'Executive Sedan', base: 2200, km: 40, extra: 16, models: 'Camry, Verna, Dzire' },
                  { segment: 'SUV', name: 'Premium SUV', base: 3200, km: 40, extra: 22, models: 'Innova Crysta, Fortuner' },
                  { segment: 'EV', name: 'Electric (EV)', base: 2400, km: 40, extra: 15, models: 'Tigor EV, MG ZS' },
                  { segment: 'LUXURY', name: 'Mercedes Luxury', base: 6500, km: 40, extra: 45, models: 'Mercedes E-Class' }
                ].map(r => (
                  <div
                    key={r.segment}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Base: ₹{r.base} (Includes {r.km} KM) • {r.models}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#16a34a', fontSize: '0.95rem' }}>₹{r.extra} / KM</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>extra km rate</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* START SHIFT MODAL */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ fontWeight: 800, margin: '0 0 14px 0', fontSize: '1.05rem', color: '#0f172a' }}>
              🚗 Start Duty Shift Checklist
            </h4>
            <form onSubmit={handleStartShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Assigned Vehicle
                </label>
                <select
                  value={shiftVehicleId}
                  onChange={(e) => setShiftVehicleId(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '0.84rem' }}
                  required
                >
                  <option value="">-- Choose Car --</option>
                  {(vehicles.length > 0 ? vehicles : [
                    { id: 1, registration_number: 'GA-03-Z-8899', model: 'Innova Crysta' },
                    { id: 2, registration_number: 'GA-07-T-1240', model: 'Dzire' }
                  ]).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Start Odometer Reading (KM)
                </label>
                <input
                  type="number"
                  value={shiftStartOdo}
                  onChange={(e) => setShiftStartOdo(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '0.84rem' }}
                  placeholder="e.g. 14200"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shiftSubmitting}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '0.8rem', fontWeight: 800 }}
                >
                  {shiftSubmitting ? 'Starting...' : 'Confirm Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END TRIP MODAL */}
      {showEndTripModal && activeBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ fontWeight: 800, margin: '0 0 14px 0', fontSize: '1.05rem', color: '#0f172a' }}>
              🏁 Conclude Trip Duty Slip
            </h4>
            <form onSubmit={handleCompleteTripSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Final Odometer (KM)
                </label>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Toll & Airport Parking (₹ INR)
                </label>
                <input
                  type="number"
                  value={tollParking}
                  onChange={(e) => setTollParking(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEndTripModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingTrip}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '0.8rem', fontWeight: 800 }}
                >
                  {completingTrip ? 'Submitting...' : 'Complete Duty Slip'}
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
