import React, { useState, useEffect } from 'react';
import { Hotel, Car, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import * as api from '../../services/api';

/**
 * HotelBookingDriverSetting Component
 * 
 * Objective:
 * Backend-controlled Enable / Disable setting for the Driver option ONLY inside Hotel Booking.
 * Accessible in Super Admin and Admin portals.
 */
export default function HotelBookingDriverSetting({ 
  currentUser, 
  title = "Hotel Booking Settings",
  subtitle = "Control chauffeur / private cab availability for hotel guests on the main website",
  showCard = true
}) {
  const [driverEnabled, setDriverEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.fetchHotelBookingSettings();
      if (res && typeof res.hotel_booking_driver_enabled !== 'undefined') {
        setDriverEnabled(Boolean(res.hotel_booking_driver_enabled));
      }
    } catch (e) {
      console.warn('[HotelBookingDriverSetting] Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    const handleSync = (e) => {
      if (e.detail && typeof e.detail.hotel_booking_driver_enabled !== 'undefined') {
        setDriverEnabled(Boolean(e.detail.hotel_booking_driver_enabled));
      }
    };
    window.addEventListener('hotel-booking-settings-updated', handleSync);
    return () => window.removeEventListener('hotel-booking-settings-updated', handleSync);
  }, []);

  const handleToggle = async (e) => {
    if (e) e.preventDefault();
    if (saving || loading) return;

    const nextState = !driverEnabled;
    // Optimistic UI update
    setDriverEnabled(nextState);
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await api.updateHotelBookingSettings({
        hotel_booking_driver_enabled: nextState,
        user_role: currentUser?.role || (isSuperAdmin ? 'superadmin' : 'admin')
      });
      setStatusMessage({
        type: 'success',
        text: `Driver Option ${nextState ? 'ENABLED' : 'DISABLED'} and saved to database.`
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      // Revert optimistic change on error
      setDriverEnabled(!nextState);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update setting'
      });
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: '#0D1B2E', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Hotel size={18} style={{ color: '#FF6333' }} /> {title}
          </h6>
          {subtitle && <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>{subtitle}</p>}
        </div>
        <div className="d-flex align-items-center gap-2">
          {saving && (
            <span className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '14px', height: '14px' }}></span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div 
          className={`alert ${statusMessage.type === 'success' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'} py-2 px-3 rounded-3 small d-flex align-items-center gap-2 mb-3 animate-fade-in`}
          style={{ fontSize: '0.8rem' }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Setting Row */}
      <div 
        onClick={handleToggle}
        className="p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition"
        style={{ 
          background: driverEnabled ? '#f0fdf4' : '#f8fafc',
          borderColor: driverEnabled ? '#bbf7d0' : '#e2e8f0',
          cursor: saving ? 'wait' : 'pointer'
        }}
      >
        <div className="d-flex align-items-start gap-3">
          <div 
            className="rounded-3 p-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ 
              background: driverEnabled ? 'rgba(16, 185, 129, 0.15)' : '#e2e8f0',
              color: driverEnabled ? '#10b981' : '#64748b',
              width: '42px',
              height: '42px'
            }}
          >
            <Car size={22} />
          </div>

          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>Driver Option</span>
              
              <span 
                className="badge rounded-pill fw-bold"
                style={{ 
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  background: driverEnabled ? '#dcfce7' : '#f1f5f9',
                  color: driverEnabled ? '#15803d' : '#64748b',
                  border: driverEnabled ? '1px solid #86efac' : '1px solid #cbd5e1'
                }}
              >
                {driverEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              {driverEnabled ? (
                <span>Customer can opt for <strong>Dedicated Goa Chauffeur / Private Cab Service</strong> (+₹800 - ₹1,800) during hotel checkout.</span>
              ) : (
                <span>The Chauffeur / Driver selection block is <strong>hidden</strong> from customers in Hotel Booking. No driver charges will be applied.</span>
              )}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="ms-4 flex-shrink-0 d-flex flex-column align-items-end">
          <div
            className="position-relative d-flex align-items-center"
            style={{
              width: '50px',
              height: '28px',
              borderRadius: '9999px',
              background: driverEnabled ? '#10b981' : '#cbd5e1',
              transition: 'background-color 250ms ease, box-shadow 250ms ease',
              boxShadow: driverEnabled ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
              cursor: 'pointer'
            }}
          >
            <span
              className="rounded-circle d-block"
              style={{
                width: '22px',
                height: '22px',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                transform: driverEnabled ? 'translateX(25px)' : 'translateX(3px)',
                transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          <span 
            className="fw-bold mt-1 text-uppercase" 
            style={{ 
              fontSize: '0.65rem', 
              color: driverEnabled ? '#10b981' : '#94a3b8',
              letterSpacing: '0.5px'
            }}
          >
            {driverEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Scope Isolation Notice */}
      <div className="mt-3 ps-2 d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.74rem' }}>
        <Sparkles size={12} className="text-warning flex-shrink-0" />
        <span>This setting applies <strong>strictly to Main Website → Hotel Booking</strong>. Trip Packages, Vehicle Rentals, and Flights remain completely separate.</span>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        {content}
      </div>
    </div>
  );
}
