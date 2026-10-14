import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { 
  Sparkles, Check, Car, User, Star, ShieldCheck, 
  MapPin, Clock, X, Zap, ArrowRight, CheckCircle2 
} from 'lucide-react';

const AIMatchmakerModal = ({ booking, isOpen, onClose, onSuccess }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !booking) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await api.get(`dispatches/bookings/${booking.id}/matchmaker_recommendations/`);
        setRecommendations(res.data || []);
      } catch (err) {
        console.error('Failed to load AI matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleSelectRecommendation = async (rec) => {
    setSubmittingId(rec.vehicle.id);
    try {
      await api.post(`dispatches/bookings/${booking.id}/dispatch/`, {
        vehicle_id: rec.vehicle.id,
        driver_id: rec.driver.id
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('Error assigning recommendation: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingId(null);
    }
  };

  const handle1ClickAutoAssign = async () => {
    setSubmittingId('auto');
    try {
      await api.post(`dispatches/bookings/${booking.id}/auto_assign/`);
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('Error in auto-assign: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingId(null);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
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
        maxWidth: '780px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                AI Dispatch Matchmaker
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Algorithmic Chauffeur & Vehicle Pairing • {booking.booking_reference}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Booking Summary Strip */}
        <div style={{
          padding: '14px 28px',
          background: '#f8fafc',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Client:</span> <strong>{booking.client_name}</strong> • 
            <span style={{ color: '#64748b' }}> Passenger:</span> <strong>{booking.passenger_name}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Class Requested:</span> <strong style={{ color: '#0284c7' }}>{booking.vehicle_class_requested}</strong> • 
            <span style={{ color: '#64748b' }}> Pickup:</span> <strong>{new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          <button
            onClick={handle1ClickAutoAssign}
            disabled={submittingId === 'auto' || loading}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Zap size={13} />
            <span>{submittingId === 'auto' ? 'Assigning...' : '1-Click Auto Assign Top Match'}</span>
          </button>
        </div>

        {/* Matches List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analyzing fleet telematics & chauffeur ratings...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Car size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
              <p>No available vehicles or chauffeurs match this criteria.</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  border: idx === 0 ? '2px solid #38bdf8' : '1px solid var(--border-color)',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  background: idx === 0 ? 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)' : '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header row with Match Score badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: idx === 0 ? '#0284c7' : '#1e293b',
                      color: '#ffffff'
                    }}>
                      {rec.tag}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      Match Score: <strong style={{ color: '#0284c7', fontSize: '0.9rem' }}>{rec.score}%</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectRecommendation(rec)}
                    disabled={submittingId === rec.vehicle.id}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '20px',
                      background: idx === 0 ? '#0284c7' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={14} />
                    <span>{submittingId === rec.vehicle.id ? 'Allocating...' : 'Allocate Pairing'}</span>
                  </button>
                </div>

                {/* Pairing Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '12px 14px',
                  background: 'rgba(241, 245, 249, 0.6)',
                  borderRadius: '12px'
                }}>
                  {/* Vehicle Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Car size={20} color="#1e293b" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        {rec.vehicle.registration_number}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {rec.vehicle.make} {rec.vehicle.model} • {rec.vehicle.vehicle_class} ({rec.vehicle.fuel_type})
                      </div>
                    </div>
                  </div>

                  {/* Chauffeur Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={20} color="#1e293b" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        {rec.driver.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', color: '#d97706', fontWeight: 700 }}>
                          <Star size={11} fill="#d97706" style={{ marginRight: '2px' }} />
                          {rec.driver.rating}
                        </span>
                        <span>• Safety: {rec.driver.safety_score}%</span>
                        <span>• {rec.driver.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Algorithmic Reason */}
                <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic' }}>
                  💡 {rec.reason}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AIMatchmakerModal;
