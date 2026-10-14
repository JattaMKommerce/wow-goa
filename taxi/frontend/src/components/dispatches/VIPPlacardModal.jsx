import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Crown, Plane, Car, User, ShieldCheck } from 'lucide-react';

const VIPPlacardModal = ({ booking, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        background: '#090d16',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '850px',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#ffffff'
      }}>
        {/* Top Control Bar (Non-printed) */}
        <div className="no-print" style={{
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crown size={14} color="#f59e0b" />
            Digital VIP Chauffeur Greeting Placard (Tablet Display)
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print Placard</span>
            </button>

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
        </div>

        {/* LUXURY GOLD/BLACK AIRPORT PLACARD CANVAS */}
        <div style={{
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          background: 'radial-gradient(ellipse at center, #131c2e 0%, #080c14 100%)'
        }}>
          {/* Subtle Luxury Border Ring */}
          <div style={{
            position: 'absolute',
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '20px',
            pointerEvents: 'none'
          }} />

          {/* Corporate / Fleet Brand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: '0.85rem',
            color: '#d4af37',
            fontWeight: 800,
            marginBottom: '40px'
          }}>
            <Crown size={20} color="#d4af37" />
            <span>APEX FLEET • EXECUTIVE CHAUFFEUR SERVICE</span>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
            Welcoming Distinguished Guest
          </div>

          {/* Passenger Name in Huge Elegant Type */}
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            {booking.passenger_name}
          </h1>

          {/* Corporate Client Subtitle */}
          <div style={{
            fontSize: '1.25rem',
            color: '#38bdf8',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '40px'
          }}>
            {booking.client_name}
          </div>

          {/* Flight & Chauffeur Info Pill Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            padding: '16px 28px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.88rem'
          }}>
            {booking.flight_number && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <Plane size={16} color="#38bdf8" />
                Flight: <strong>{booking.flight_number}</strong>
              </span>
            )}

            {booking.assigned_vehicle_detail && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <Car size={16} color="#d4af37" />
                Vehicle: <strong>{booking.assigned_vehicle_detail.make} {booking.assigned_vehicle_detail.model} ({booking.assigned_vehicle_detail.registration_number})</strong>
              </span>
            )}

            {booking.assigned_driver_detail && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                <User size={16} color="#4ade80" />
                Chauffeur: <strong>{booking.assigned_driver_detail.full_name}</strong>
              </span>
            )}
          </div>

          <div style={{ marginTop: '36px', fontSize: '0.74rem', color: '#64748b', letterSpacing: '0.08em' }}>
            Duty Ref: {booking.booking_reference} • Authorized Commercial Transport • Goa
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VIPPlacardModal;
