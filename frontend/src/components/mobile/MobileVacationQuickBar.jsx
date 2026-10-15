import React, { useState } from 'react';
import { Car, Compass, Bike, MapPin, Sparkles, Navigation } from 'lucide-react';

export default function MobileVacationQuickBar({ activeTab, setActiveTab }) {
  const [detectingLocation, setDetectingLocation] = useState(false);

  const quickHotspots = [
    { label: '✈️ Mopa Airport (GOX)', type: 'cab', pickup: 'Manohar International Airport (MOPA), North Goa' },
    { label: '✈️ Dabolim Airport (GOI)', type: 'cab', pickup: 'Goa International Airport (Dabolim), South Goa' },
    { label: '🚙 Rent Thar 4x4', type: 'selfdrive', filter: 'thar' },
    { label: '🛵 Activa Scooter', type: 'bikes', filter: 'scooter' },
    { label: '🏖️ Baga & Calangute Cab', type: 'cab', pickup: 'Baga Beach, North Goa' },
    { label: '🌴 Panjim & Fontainhas', type: 'cab', pickup: 'Panjim City Center, Goa' }
  ];

  const handleHotspotClick = (spot) => {
    if (spot.type === 'cab') {
      setActiveTab('cabs');
      try {
        window.history.pushState(null, '', '/cabs');
      } catch (e) {}
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('prefill-cab-pickup', { detail: { location: spot.pickup } }));
        const sec = document.getElementById('results-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else if (spot.type === 'selfdrive') {
      setActiveTab('selfdrive');
      try {
        window.history.pushState(null, '', '/');
      } catch (e) {}
      setTimeout(() => {
        const sec = document.getElementById('results-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else if (spot.type === 'bikes') {
      setActiveTab('selfdrive');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('filter-vehicle-type', { detail: { type: 'bike' } }));
        const sec = document.getElementById('results-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('GPS location is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        const { latitude, longitude } = pos.coords;
        setActiveTab('cabs');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('gps-location-detected', { 
            detail: { lat: latitude, lng: longitude, label: 'My Current Location in Goa' } 
          }));
          const sec = document.getElementById('results-section');
          if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (err) => {
        setDetectingLocation(false);
        alert('Could not detect location. Please check location permissions on your phone.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="mobile-vacation-quickbar d-md-none px-3 py-2" style={{ background: '#0B192C' }}>
      {/* Mobility Segmented Switcher */}
      <div 
        className="d-flex align-items-center p-1 rounded-pill mb-2.5" 
        style={{ 
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <button
          type="button"
          className="btn btn-sm w-50 rounded-pill d-flex align-items-center justify-content-center gap-1.5 py-2 fw-bold"
          style={{
            fontSize: '12px',
            background: activeTab === 'cabs' ? '#ff9f1c' : 'transparent',
            color: activeTab === 'cabs' ? '#000000' : 'rgba(255, 255, 255, 0.75)',
            boxShadow: activeTab === 'cabs' ? '0 4px 12px rgba(255, 159, 28, 0.4)' : 'none',
            border: 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            setActiveTab('cabs');
            try { window.history.pushState(null, '', '/cabs'); } catch (e) {}
          }}
        >
          <Car size={15} strokeWidth={2.5} />
          <span>Cab / Chauffeur</span>
        </button>

        <button
          type="button"
          className="btn btn-sm w-50 rounded-pill d-flex align-items-center justify-content-center gap-1.5 py-2 fw-bold"
          style={{
            fontSize: '12px',
            background: (activeTab === 'selfdrive' || activeTab === 'home') ? '#ff9f1c' : 'transparent',
            color: (activeTab === 'selfdrive' || activeTab === 'home') ? '#000000' : 'rgba(255, 255, 255, 0.75)',
            boxShadow: (activeTab === 'selfdrive' || activeTab === 'home') ? '0 4px 12px rgba(255, 159, 28, 0.4)' : 'none',
            border: 'none',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            setActiveTab('selfdrive');
            try { window.history.pushState(null, '', '/'); } catch (e) {}
          }}
        >
          <Compass size={15} strokeWidth={2.5} />
          <span>Self-Drive Car/Bike</span>
        </button>
      </div>

      {/* GPS Detector & Vacation Quick Hotspots */}
      <div className="d-flex align-items-center gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <button
          type="button"
          className="btn btn-sm rounded-pill d-flex align-items-center gap-1 py-1.5 px-3 flex-shrink-0 fw-bold shadow-sm"
          style={{
            background: detectingLocation ? '#10b981' : 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#10b981',
            fontSize: '11px'
          }}
          onClick={handleDetectGPS}
          disabled={detectingLocation}
        >
          <Navigation size={13} className={detectingLocation ? 'spin-animation' : ''} />
          <span>{detectingLocation ? 'Locating...' : '📍 Pick up from my location'}</span>
        </button>

        {quickHotspots.map((spot, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-sm rounded-pill py-1.5 px-3 flex-shrink-0 text-white fw-semibold"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '11px'
            }}
            onClick={() => handleHotspotClick(spot)}
          >
            {spot.label}
          </button>
        ))}
      </div>
    </div>
  );
}
