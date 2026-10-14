import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
  MapPin,
  Navigation,
  Compass,
  Radio,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Car,
  User,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Layers,
  Search,
  Filter,
  Plus,
  X,
  Crosshair,
  BatteryCharging,
  Fuel,
  Clock,
  Briefcase,
  ChevronRight,
  Maximize2,
  Check,
  Building2,
  Info
} from 'lucide-react';

const LiveTelematicsMap = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const geofenceLayersRef = useRef([]);
  const breadcrumbLayerRef = useRef(null);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    total_vehicles: 0,
    online_tracked: 0,
    in_motion: 0,
    idling: 0,
    active_geofences: 0,
    unresolved_alerts: 0
  });
  const [loading, setLoading] = useState(true);

  // Active side panel tab: 'fleet' | 'alerts' | 'geofences'
  const [sidebarTab, setSidebarTab] = useState('fleet');

  // Selected vehicle for HUD inspector
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'MOTION' | 'IDLE'

  // Auto-refresh simulation
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Modals
  const [showAddGeofenceModal, setShowAddGeofenceModal] = useState(false);
  const [geofenceForm, setGeofenceForm] = useState({
    name: '',
    zone_type: 'TECH_PARK',
    center_latitude: 15.4989,
    center_longitude: 73.8278,
    radius_meters: 1500,
    speed_limit_kmh: 50,
    color_hex: '#1e293b'
  });
  const [geofenceSubmitting, setGeofenceSubmitting] = useState(false);
  const hasFittedBoundsRef = useRef(false);

  // Fetch Telematics Data
  const fetchTelematicsData = async () => {
    try {
      const [fleetRes, summaryRes, geofencesRes, alertsRes] = await Promise.all([
        api.get('telematics/ops/live-fleet/'),
        api.get('telematics/ops/summary/'),
        api.get('telematics/geofences/'),
        api.get('telematics/alerts/')
      ]);

      const loadedVehicles = fleetRes.data || [];
      setVehicles(loadedVehicles);
      setSummary(summaryRes.data || {});
      setGeofences(geofencesRes.data.results || geofencesRes.data || []);
      setAlerts(alertsRes.data.results || alertsRes.data || []);

      // Auto fit fleet bounds on first fetch
      if (!hasFittedBoundsRef.current && loadedVehicles.length > 0 && mapInstanceRef.current && typeof window.L !== 'undefined') {
        const L = window.L;
        const validCoords = loadedVehicles
          .filter(v => v.latest_telemetry?.latitude && v.latest_telemetry?.longitude)
          .map(v => [v.latest_telemetry.latitude, v.latest_telemetry.longitude]);
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
          hasFittedBoundsRef.current = true;
        }
      }
    } catch (err) {
      console.error('Failed to load telematics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFitAllVehicles = () => {
    if (!mapInstanceRef.current || typeof window.L === 'undefined') return;
    const L = window.L;
    const validCoords = vehicles
      .filter(v => v.latest_telemetry?.latitude && v.latest_telemetry?.longitude)
      .map(v => [v.latest_telemetry.latitude, v.latest_telemetry.longitude]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else {
      mapInstanceRef.current.setView([15.4989, 73.8278], 10);
    }
  };

  useEffect(() => {
    fetchTelematicsData();
  }, []);

  // Live Auto-Stream Interval (every 6 seconds)
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      fetchTelematicsData();
    }, 6000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if Leaflet window.L is available
    if (typeof window.L === 'undefined') {
      return;
    }

    const L = window.L;

    if (!mapInstanceRef.current) {
      // Goa coordinates center
      const map = L.map(mapContainerRef.current, {
        center: [15.4989, 73.8278],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap high-definition tiles (100% free, reliable, no watermark or API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after layout completes to ensure full tile coverage
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, []);

  // Update Geofence Circles on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window.L === 'undefined') return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Remove previous geofences
    geofenceLayersRef.current.forEach(layer => map.removeLayer(layer));
    geofenceLayersRef.current = [];

    geofences.forEach(zone => {
      const circle = L.circle([parseFloat(zone.center_latitude), parseFloat(zone.center_longitude)], {
        color: zone.color_hex || '#1e293b',
        fillColor: zone.color_hex || '#1e293b',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '6, 6',
        radius: zone.radius_meters
      }).addTo(map);

      circle.bindTooltip(
        `<strong>${zone.name}</strong><br/>Limit: ${zone.speed_limit_kmh} km/h • Radius: ${zone.radius_meters}m`,
        { permanent: false, direction: 'top', className: 'geofence-tooltip' }
      );

      geofenceLayersRef.current.push(circle);
    });
  }, [geofences]);

  // Update Vehicle Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window.L === 'undefined') return;
    const L = window.L;
    const map = mapInstanceRef.current;

    vehicles.forEach(v => {
      const telem = v.latest_telemetry;
      if (!telem || !telem.latitude || !telem.longitude) return;

      const isInMotion = telem.speed_kmh > 5;
      const isSelected = selectedVehicle?.id === v.id;

      // Color coding: Blue = In Motion, Slate = Idle, Amber = Alert
      const markerColor = isSelected ? '#2563eb' : isInMotion ? '#1e293b' : '#64748b';
      const pulseHtml = isInMotion ? `<div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(37,99,235,0.25); animation:pulseRing 1.8s infinite; top:-6px; left:-6px; pointer-events:none;"></div>` : '';

      const customHtml = `
        <div style="position:relative; width:26px; height:26px; cursor:pointer;">
          ${pulseHtml}
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: ${markerColor};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            transform: rotate(${telem.heading || 0}deg);
            transition: all 0.3s ease;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: 28px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.88);
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 8px;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${telem.speed_kmh > 0 ? `${Math.round(telem.speed_kmh)} km/h` : 'IDLE'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'vehicle-marker-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      if (markersRef.current[v.id]) {
        // Move existing marker smoothly
        markersRef.current[v.id].setLatLng([telem.latitude, telem.longitude]);
        markersRef.current[v.id].setIcon(customIcon);
        markersRef.current[v.id].off('click');
        markersRef.current[v.id].on('click', () => {
          handleSelectVehicle(v);
        });
      } else {
        // Create new marker
        const marker = L.marker([telem.latitude, telem.longitude], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          handleSelectVehicle(v);
        });
        markersRef.current[v.id] = marker;
      }
    });
  }, [vehicles, selectedVehicle]);

  // Handle Vehicle Selection & Fetch Breadcrumb Route Trail
  const handleSelectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);

    if (mapInstanceRef.current && vehicle.latest_telemetry) {
      mapInstanceRef.current.setView(
        [vehicle.latest_telemetry.latitude, vehicle.latest_telemetry.longitude],
        14,
        { animate: true }
      );
    }

    // Fetch GPS breadcrumbs
    setHistoryLoading(true);
    try {
      const res = await api.get(`telematics/ops/history/?vehicle_id=${vehicle.id}`);
      const historyPoints = res.data || [];
      setRouteHistory(historyPoints);

      // Render polyline trail on map
      if (mapInstanceRef.current && typeof window.L !== 'undefined') {
        const L = window.L;
        const map = mapInstanceRef.current;

        if (breadcrumbLayerRef.current) {
          map.removeLayer(breadcrumbLayerRef.current);
        }

        const latlngs = historyPoints.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
        if (latlngs.length > 1) {
          const polyline = L.polyline(latlngs, {
            color: '#2563eb',
            weight: 3.5,
            opacity: 0.8,
            dashArray: '4, 8'
          }).addTo(map);
          breadcrumbLayerRef.current = polyline;
        }
      }
    } catch (err) {
      console.error('Failed to load GPS trail:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 1-Click Route Simulator
  const handleSimulateMovement = async () => {
    setSimulating(true);
    try {
      await api.post('telematics/ops/simulate/');
      await fetchTelematicsData();
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Resolve Alert
  const handleResolveAlert = async (alertId) => {
    try {
      await api.post(`telematics/alerts/${alertId}/resolve/`);
      fetchTelematicsData();
    } catch (err) {
      alert('Error resolving alert: ' + err.message);
    }
  };

  // Create Geofence
  const handleCreateGeofence = async (e) => {
    e.preventDefault();
    setGeofenceSubmitting(true);
    try {
      await api.post('telematics/geofences/', geofenceForm);
      setShowAddGeofenceModal(false);
      fetchTelematicsData();
    } catch (err) {
      alert('Error creating geofence: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setGeofenceSubmitting(false);
    }
  };

  // Filtered vehicle list
  const filteredVehicles = vehicles.filter(v => {
    const telem = v.latest_telemetry;
    if (statusFilter === 'MOTION' && (!telem || telem.speed_kmh <= 5)) return false;
    if (statusFilter === 'IDLE' && telem && telem.speed_kmh > 5) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPlate = v.registration_number?.toLowerCase().includes(q);
      const matchModel = v.model?.toLowerCase().includes(q);
      const matchDriver = v.assigned_driver?.name?.toLowerCase().includes(q);
      if (!matchPlate && !matchModel && !matchDriver) return false;
    }
    return true;
  });

  return (
    <div style={{ height: 'calc(100vh - 74px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      
      {/* TOP CONTROL ROOM TELEMETRY BAR */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        zIndex: 10
      }}>
        {/* Left: Stream Indicator & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isLiveStreaming ? '#15803d' : '#94a3b8',
              boxShadow: isLiveStreaming ? '0 0 10px rgba(21, 128, 61, 0.6)' : 'none'
            }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
              {isLiveStreaming ? 'Live GPS Telematics Active' : 'Stream Paused'}
            </span>
          </div>

          <div style={{ height: '18px', width: '1px', background: 'var(--border-color)' }} />

          {/* KPI Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', background: '#f1f5f9', color: '#0f172a', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
              Online: <strong>{summary.online_tracked} / {summary.total_vehicles}</strong>
            </span>
            <span style={{ fontSize: '0.76rem', background: 'rgba(240, 253, 244, 0.9)', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
              In Motion: <strong>{summary.in_motion}</strong>
            </span>
            <span style={{ fontSize: '0.76rem', background: '#f8fafc', color: '#475569', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
              Idling: <strong>{summary.idling}</strong>
            </span>
            {summary.unresolved_alerts > 0 && (
              <span style={{ fontSize: '0.76rem', background: 'rgba(254, 242, 242, 0.9)', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} />
                {summary.unresolved_alerts} Speed/Geofence Alerts
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleFitAllVehicles}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '10px', fontSize: '0.8rem' }}
            title="Auto-fit all fleet vehicles in view"
          >
            <Maximize2 size={14} />
            <span>Fit Fleet</span>
          </button>

          <button
            onClick={handleSimulateMovement}
            disabled={simulating}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.8rem' }}
          >
            <Zap size={14} className={simulating ? 'spin' : ''} />
            <span>{simulating ? 'Simulating...' : '⚡ Simulate Live GPS Run'}</span>
          </button>

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '10px', fontSize: '0.8rem' }}
          >
            {isLiveStreaming ? <Pause size={14} /> : <Play size={14} />}
            <span>{isLiveStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={fetchTelematicsData}
            className="btn-secondary"
            style={{ padding: '7px 10px', borderRadius: '10px' }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* WORKSPACE: MAP CANVAS + SIDE DRAWER */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* LEAFLET MAP CONTAINER */}
        <div 
          ref={mapContainerRef} 
          style={{ flex: 1, height: '100%', width: '100%', background: '#e2e8f0', position: 'relative' }}
        >
          {/* Fallback alert if map script loading */}
          {typeof window.L === 'undefined' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '24px 32px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}>
              <Radio size={32} color="#1e293b" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontWeight: 800, margin: '0 0 4px 0' }}>Initializing OpenStreetMap Layer...</h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Streaming live coordinates from backend telematics API
              </p>
            </div>
          )}

          {/* FLOATING VEHICLE TELEMETRY HUD INSPECTOR (WHEN VEHICLE CLICKED) */}
          {selectedVehicle && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '380px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '22px',
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.16)',
              zIndex: 1000
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={18} color="#ffffff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'var(--font-mono)' }}>
                      {selectedVehicle.registration_number}
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {selectedVehicle.make} {selectedVehicle.model} • {selectedVehicle.vehicle_class}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="btn-secondary"
                  style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Live Telemetry Dial & Speed */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '14px',
                background: 'rgba(248, 250, 252, 0.9)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Speed</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: selectedVehicle.latest_telemetry?.speed_kmh > 75 ? '#b91c1c' : '#0f172a', letterSpacing: '-0.02em' }}>
                    {selectedVehicle.latest_telemetry?.speed_kmh?.toFixed(1) || '0.0'} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Gov Limit: 80 km/h
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Engine Status</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedVehicle.latest_telemetry?.speed_kmh > 0 ? '#15803d' : '#475569', marginTop: '4px' }}>
                    {selectedVehicle.latest_telemetry?.engine_status || 'IDLE'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Heading: {selectedVehicle.latest_telemetry?.heading || 0}°
                  </div>
                </div>
              </div>

              {/* Active Chauffeur & Trip */}
              <div style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <User size={14} color="#64748b" />
                  <span>Chauffeur: <strong>{selectedVehicle.assigned_driver?.name || 'Unassigned / Depot'}</strong></span>
                </div>
                {selectedVehicle.active_dispatch ? (
                  <div style={{ padding: '10px', background: 'rgba(240, 253, 244, 0.9)', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d' }}>
                      ON B2B DISPATCH: {selectedVehicle.active_dispatch.booking_reference}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', marginTop: '2px' }}>
                      {selectedVehicle.active_dispatch.client_name} • {selectedVehicle.active_dispatch.passenger_name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      {selectedVehicle.active_dispatch.pickup_location?.slice(0, 26)} ➔ {selectedVehicle.active_dispatch.dropoff_location?.slice(0, 26)}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    No active passenger dispatch (Vehicle status: {selectedVehicle.status})
                  </div>
                )}
              </div>

              {/* Geofence & Battery */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span>Zone: <strong>{selectedVehicle.latest_telemetry?.current_zone_name || 'Highway Corridor'}</strong></span>
                <span>Battery: <strong>{selectedVehicle.latest_telemetry?.battery_pct || 96}%</strong></span>
                <span>Odometer: <strong>{selectedVehicle.latest_telemetry?.odometer_km?.toFixed(0) || selectedVehicle.current_odometer} km</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR OPERATIONAL DRAWER */}
        <div style={{
          width: '380px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          {/* Drawer Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <button
              onClick={() => setSidebarTab('fleet')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: sidebarTab === 'fleet' ? '#ffffff' : 'transparent',
                borderBottom: sidebarTab === 'fleet' ? '2px solid #0f172a' : 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: sidebarTab === 'fleet' ? '#0f172a' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Fleet Cars ({vehicles.length})
            </button>

            <button
              onClick={() => setSidebarTab('alerts')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: sidebarTab === 'alerts' ? '#ffffff' : 'transparent',
                borderBottom: sidebarTab === 'alerts' ? '2px solid #0f172a' : 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: sidebarTab === 'alerts' ? '#0f172a' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Alerts ({alerts.filter(a => !a.is_resolved).length})
            </button>

            <button
              onClick={() => setSidebarTab('geofences')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: sidebarTab === 'geofences' ? '#ffffff' : 'transparent',
                borderBottom: sidebarTab === 'geofences' ? '2px solid #0f172a' : 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: sidebarTab === 'geofences' ? '#0f172a' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Geofences ({geofences.length})
            </button>
          </div>

          {/* TAB CONTENT: FLEET LIST */}
          {sidebarTab === 'fleet' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                  <input
                    type="text"
                    placeholder="Search plate, model, driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '32px', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['ALL', 'MOTION', 'IDLE'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-color)',
                        background: statusFilter === s ? '#1e293b' : '#ffffff',
                        color: statusFilter === s ? '#ffffff' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {s === 'ALL' ? 'All Cars' : s === 'MOTION' ? 'In Motion' : 'Idling'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredVehicles.map((v) => {
                  const telem = v.latest_telemetry;
                  const isMoving = telem && telem.speed_kmh > 5;
                  const isSelected = selectedVehicle?.id === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVehicle(v)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isSelected ? '#2563eb' : 'var(--border-color)',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          {v.registration_number}
                        </strong>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: isMoving ? 'rgba(240, 253, 244, 0.9)' : '#f1f5f9',
                          color: isMoving ? '#15803d' : '#64748b'
                        }}>
                          {isMoving ? `${Math.round(telem.speed_kmh)} km/h` : 'IDLE'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                        {v.make} {v.model} ({v.vehicle_class})
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Driver: <strong>{v.assigned_driver?.name || 'Unassigned'}</strong></span>
                        <span>{telem?.current_zone_name || 'Corridor'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: REAL-TIME ALERTS */}
          {sidebarTab === 'alerts' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: alert.severity === 'CRITICAL' ? '#fecaca' : '#fed7aa',
                    background: alert.is_resolved ? '#f8fafc' : alert.severity === 'CRITICAL' ? '#fff5f5' : '#fffbeb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: alert.severity === 'CRITICAL' ? '#b91c1c' : '#b45309',
                      color: '#ffffff'
                    }}>
                      {alert.alert_type_display}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {alert.created_at?.slice(11, 16) || 'Now'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                    {alert.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      Car: {alert.vehicle_registration}
                    </span>
                    {!alert.is_resolved ? (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="btn-secondary"
                        style={{ fontSize: '0.74rem', padding: '4px 8px', borderRadius: '8px' }}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CONTENT: GEOFENCES */}
          {sidebarTab === 'geofences' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Operational Boundaries</span>
                <button
                  onClick={() => setShowAddGeofenceModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.76rem', padding: '5px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} />
                  <span>New Zone</span>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {geofences.map((zone) => (
                  <div
                    key={zone.id}
                    style={{
                      padding: '12px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{zone.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>● Active</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      {zone.zone_type_display}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#475569', marginTop: '6px' }}>
                      <span>Radius: <strong>{zone.radius_meters}m</strong></span>
                      <span>Speed Limit: <strong>{zone.speed_limit_kmh} km/h</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD GEOFENCE OPERATIONAL ZONE */}
      {/* ========================================================= */}
      {showAddGeofenceModal && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowAddGeofenceModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Add Geofence Boundary
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGeofenceModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGeofence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Zone Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dabolim Cargo Terminal"
                  value={geofenceForm.name}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, name: e.target.value })}
                  required
                  className="input-field"
                  style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Zone Type *
                </label>
                <select
                  className="select-field"
                  value={geofenceForm.zone_type}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, zone_type: e.target.value })}
                  style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                >
                  <option value="AIRPORT">Airport Terminal</option>
                  <option value="HOTEL_CLUSTER">Luxury Hotel & Resort</option>
                  <option value="TECH_PARK">Corporate Tech Park</option>
                  <option value="DEPOT">Depot & Service Yard</option>
                  <option value="RESTRICTED">Restricted Zone</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geofenceForm.center_latitude}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, center_latitude: e.target.value })}
                    required
                    className="input-field"
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geofenceForm.center_longitude}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, center_longitude: e.target.value })}
                    required
                    className="input-field"
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Radius (Meters) *
                  </label>
                  <input
                    type="number"
                    value={geofenceForm.radius_meters}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, radius_meters: e.target.value })}
                    required
                    className="input-field"
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Speed Limit (km/h) *
                  </label>
                  <input
                    type="number"
                    value={geofenceForm.speed_limit_kmh}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, speed_limit_kmh: e.target.value })}
                    required
                    className="input-field"
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddGeofenceModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={geofenceSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '10px' }}
                >
                  {geofenceSubmitting ? 'Creating...' : 'Create Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default LiveTelematicsMap;
