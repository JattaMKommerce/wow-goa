import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Plane, Clock, AlertTriangle, CheckCircle2, 
  RefreshCw, MapPin, User, Briefcase, ArrowRight, 
  Luggage, ShieldAlert, Zap, Radio 
} from 'lucide-react';

const FlightRadarDesk = ({ onSelectBooking }) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingFlight, setSyncingFlight] = useState(null);

  const fetchFlightRadar = async () => {
    setLoading(true);
    try {
      const res = await api.get('dispatches/bookings/flight_radar/');
      setFlights(res.data || []);
    } catch (err) {
      console.error('Failed to load flight radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightRadar();
    const interval = setInterval(fetchFlightRadar, 30000); // 30s live poll
    return () => clearInterval(interval);
  }, []);

  const handleSyncDelay = async (bookingId, delayMinutes) => {
    setSyncingFlight(bookingId);
    try {
      await api.post(`dispatches/bookings/${bookingId}/sync_flight_delay/`, {
        delay_minutes: delayMinutes
      });
      alert(`Flight delay of ${delayMinutes} minutes successfully synced to chauffeur duty schedule.`);
      fetchFlightRadar();
    } catch (err) {
      alert('Error syncing flight delay: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncingFlight(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Flight Radar Control Ribbon */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '22px 28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Plane size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Goa Air Traffic & Chauffeur Radar
              </h3>
              <span style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                LIVE RADAR
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Real-time flight arrival stream for Manohar International (GOX) & Dabolim (GOI) linked to corporate bookings.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFlightRadar}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* Flight Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '18px' }}>
        {flights.map((flight, idx) => {
          const isDelayed = flight.status === 'DELAYED';
          const isLanded = flight.status === 'LANDED';

          return (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: isDelayed ? '1.5px solid #fed7aa' : '1px solid var(--border-color)',
                padding: '22px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Top Row: Flight Code, Airline & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {flight.flight_number}
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
                    {flight.airline}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: isDelayed ? '#fff7ed' : isLanded ? '#f0fdf4' : '#f8fafc',
                  color: isDelayed ? '#c2410c' : isLanded ? '#15803d' : '#0284c7',
                  border: `1px solid ${isDelayed ? '#fed7aa' : isLanded ? '#bbf7d0' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isDelayed ? <AlertTriangle size={12} /> : isLanded ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {flight.status} {flight.delay_minutes > 0 ? `(+${flight.delay_minutes}m)` : ''}
                </span>
              </div>

              {/* Route & Timing Corridor */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '14px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Origin</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{flight.origin}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <Plane size={16} color="#0284c7" style={{ transform: 'rotate(90deg)' }} />
                  <div style={{ width: '60px', height: '2px', background: '#cbd5e1' }} />
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Destination</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>{flight.airport}</div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '14px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Scheduled / Est</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {flight.scheduled_arrival} ➔ <strong style={{ color: isDelayed ? '#c2410c' : '#15803d' }}>{flight.estimated_arrival}</strong>
                  </div>
                </div>
              </div>

              {/* Terminal & Baggage */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b' }}>
                <span>Gate: <strong style={{ color: '#0f172a' }}>{flight.gate}</strong></span>
                <span>Baggage Claim: <strong style={{ color: '#0f172a' }}>{flight.belt}</strong></span>
              </div>

              {/* Linked Executive Bookings */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Linked Corporate Chauffeur Duty
                </div>
                {flight.matched_bookings.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No corporate bookings currently linked to flight {flight.flight_number}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {flight.matched_bookings.map((mb) => (
                      <div
                        key={mb.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isDelayed ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${isDelayed ? '#fde68a' : '#dcfce7'}`,
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{mb.passenger}</strong> ({mb.client})
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Ref: {mb.reference} • Chauffeur: <strong>{mb.driver || 'Pending Allocation'}</strong>
                          </div>
                        </div>

                        {isDelayed && (
                          <button
                            onClick={() => handleSyncDelay(mb.id, flight.delay_minutes)}
                            disabled={syncingFlight === mb.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '14px',
                              background: '#c2410c',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Zap size={12} />
                            <span>{syncingFlight === mb.id ? 'Syncing...' : `Sync +${flight.delay_minutes}m Lead`}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlightRadarDesk;
