import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { RefreshCw, Car, User, AlertTriangle, X, Check } from 'lucide-react';

const HotSwapReassignModal = ({ booking, vehicles, drivers, isOpen, onClose, onSuccess }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(booking?.assigned_vehicle || '');
  const [selectedDriverId, setSelectedDriverId] = useState(booking?.assigned_driver || '');
  const [reason, setReason] = useState('Vehicle breakdown / mechanical issue');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      await api.post(`dispatches/bookings/${booking.id}/reassign/`, {
        vehicle_id: selectedVehicleId || booking.assigned_vehicle,
        driver_id: selectedDriverId || booking.assigned_driver,
        reason: finalReason
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('Error reassigning: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const REASON_OPTIONS = [
    'Vehicle breakdown / mechanical issue',
    'Chauffeur fatigue / shift hour limit',
    'Severe flight delay / schedule conflict',
    'VIP client vehicle upgrade requested',
    'Route traffic delay / earlier backup needed',
    'Other'
  ];

  return createPortal(
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
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff7ed'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#ea580c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9a3412', margin: 0 }}>
                Dispatcher Hot-Swap Reassignment
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#c2410c', margin: '2px 0 0 0' }}>
                Trip: {booking.booking_reference} • {booking.passenger_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9a3412',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select Replacement Vehicle
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="input-field"
              style={{ width: '100%', height: '42px', borderRadius: '10px' }}
            >
              <option value="">Keep Currently Assigned Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} — {v.make} {v.model} ({v.vehicle_class}) [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Select Replacement Chauffeur
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="input-field"
              style={{ width: '100%', height: '42px', borderRadius: '10px' }}
            >
              <option value="">Keep Currently Assigned Chauffeur</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.user?.username} ({d.duty_status}) — Rating {d.rating}★
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Reassignment Reason (Logged for SLA Audit)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              style={{ width: '100%', height: '42px', borderRadius: '10px' }}
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginTop: '8px', height: '38px', borderRadius: '8px' }}
                required
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '9px 18px', borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '9px 20px', borderRadius: '10px', background: '#ea580c', borderColor: '#ea580c' }}
            >
              <Check size={16} />
              <span>{submitting ? 'Applying Hot-Swap...' : 'Confirm Hot-Swap'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default HotSwapReassignModal;
