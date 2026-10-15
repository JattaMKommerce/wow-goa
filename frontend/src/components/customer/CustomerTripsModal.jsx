import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Car, CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';
import { fetchCustomerPastTrips } from '../../services/api';

export default function CustomerTripsModal({ isOpen, onClose, onSelectTrip, onRebookTrip, activeRefId }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrips = async () => {
    setLoading(true);
    try {
      // 1. Fetch from backend
      const res = await fetchCustomerPastTrips();
      const backendTrips = res?.success && Array.isArray(res.trips) ? res.trips : [];

      // 2. Fetch from localStorage customer trips & dispatches
      const localHistory = JSON.parse(localStorage.getItem('wowgoa_customer_trips') || '[]');
      const localDispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const activeRide = JSON.parse(localStorage.getItem('wowgoa_active_ride') || 'null');

      const normalizedDispatches = localDispatches.map(d => ({
        refId: d.id,
        id: d.id,
        pickup: d.service ? d.service.split('➔')[0].trim() : (d.pickup || 'Goa'),
        dropoff: d.service ? (d.service.split('➔').slice(-1)[0] || '').trim() : (d.dropoff || 'Goa'),
        fare: d.amount || 1450,
        status: d.status === 'Dispatched' ? 'Confirmed' : (d.status === 'CANCELLED' ? 'Cancelled' : d.status),
        date: d.time || d.created_at || new Date().toISOString(),
        vehiclePlate: d.vehiclePlate || 'GA-03-Z-8899',
        carName: d.carName || 'Toyota Innova Crysta',
        chauffeur: {
          name: d.chauffeur || 'Suresh Naik',
          phone: d.phone || '+91 98221 44510',
          rating: 4.93
        },
        stops: d.stops || []
      }));

      // Combine and deduplicate
      const map = new Map();
      
      // Add local active ride if present
      if (activeRide && activeRide.refId) {
        map.set(activeRide.refId, activeRide);
      }

      // Add local history
      localHistory.forEach(t => {
        if (t?.refId) map.set(t.refId, t);
      });

      // Add normalized local dispatches
      normalizedDispatches.forEach(t => {
        if (t?.refId && !map.has(t.refId)) {
          map.set(t.refId, t);
        } else if (t?.refId && map.has(t.refId)) {
          // Update status if latest
          map.set(t.refId, { ...map.get(t.refId), ...t });
        }
      });

      // Add backend trips
      backendTrips.forEach(t => {
        const id = t.refId || t.id;
        if (id && !map.has(id)) {
          map.set(id, t);
        }
      });

      // Convert to array and sort latest first
      const combined = Array.from(map.values()).sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setTrips(combined);
    } catch (e) {
      console.warn('Error loading customer trips:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const completedTrips = trips.filter(t => t.status === 'Completed' || t.status === 'COMPLETED');
  const cancelledTrips = trips.filter(t => t.status === 'Cancelled' || t.status === 'Declined' || t.status === 'CANCELLED' || t.status === 'DECLINED');

  const filteredTrips = trips.filter(t => {
    const st = t.status?.toLowerCase();
    if (filterTab === 'completed') return st === 'completed';
    if (filterTab === 'cancelled') return st === 'cancelled' || st === 'declined';
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              My Trips & Activity
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              View all your completed, cancelled, and upcoming rides
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={loadTrips}
              title="Refresh trips"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs Strip */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'all', label: 'All Trips', count: trips.length },
            { id: 'completed', label: 'Completed', count: completedTrips.length, color: '#16a34a' },
            { id: 'cancelled', label: 'Cancelled', count: cancelledTrips.length, color: '#dc2626' }
          ].map(tab => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: active ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                  background: active ? '#0f172a' : '#ffffff',
                  color: active ? '#ffffff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: active ? '#ffffff' : (tab.color || '#64748b'),
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Trips List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#f8fafc'
        }}>
          {filteredTrips.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: '#64748b'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {filterTab === 'cancelled' ? '🚫' : (filterTab === 'completed' ? '🏁' : '🚗')}
              </div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b' }}>
                No {filterTab !== 'all' ? filterTab : ''} trips found
              </div>
              <div style={{ fontSize: '13px', maxWidth: '320px', lineHeight: 1.4 }}>
                {filterTab === 'cancelled'
                  ? 'You have not cancelled any bookings.'
                  : filterTab === 'completed'
                    ? 'You have not completed any rides yet.'
                    : 'Your completed and cancelled trip history will appear here once you take a ride.'}
              </div>
            </div>
          ) : (
            filteredTrips.map((trip, idx) => {
              const isCompleted = trip.status === 'Completed' || trip.status === 'COMPLETED';
              const isCancelled = trip.status === 'Cancelled' || trip.status === 'Declined' || trip.status === 'CANCELLED' || trip.status === 'DECLINED';
              const isInProgress = trip.status === 'In Progress' || trip.status === 'ON_TRIP';
              const isArrived = trip.status === 'Driver Arrived' || trip.status === 'ARRIVED';

              return (
                <div
                  key={trip.refId || trip.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '16px 18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {/* Trip Card Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="#64748b" />
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {trip.date ? new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent Duty'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>· #{trip.refId || trip.id}</span>
                    </div>

                    {/* Status Badge */}
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: isCompleted ? '#ecfdf5' : (isCancelled ? '#fee2e2' : (isInProgress ? '#eff6ff' : '#fef3c7')),
                      color: isCompleted ? '#15803d' : (isCancelled ? '#b91c1c' : (isInProgress ? '#1d4ed8' : '#b45309')),
                      border: isCompleted ? '1px solid #86efac' : (isCancelled ? '1px solid #fca5a5' : '1px solid #e2e8f0')
                    }}>
                      {isCompleted && <CheckCircle2 size={13} />}
                      {isCancelled && <XCircle size={13} />}
                      {isInProgress && <Clock size={13} />}
                      <span>
                        {isCompleted ? 'Completed' : (isCancelled ? 'Cancelled' : (isInProgress ? 'In Progress' : (isArrived ? 'Driver Arrived' : 'Confirmed')))}
                      </span>
                    </span>
                  </div>

                  {/* Route Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    {/* Pickup */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      <div style={{ fontWeight: 700, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trip.pickup}
                      </div>
                    </div>

                    {/* Stops if any */}
                    {trip.stops && trip.stops.map((s, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '1px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                          🛑 Via: {s.name || s} (+₹{s.extraFare || 220})
                        </div>
                      </div>
                    ))}

                    {/* Dropoff */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }} />
                      <div style={{ fontWeight: 700, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trip.dropoff}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle, Chauffeur & Total Fare */}
                  <div style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        🚕
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                          {trip.carName || 'Toyota Innova Crysta'} · {trip.chauffeur?.name || 'Suresh Naik'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {trip.vehiclePlate || 'GA-03-Z-8899'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{trip.fare}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {isCancelled ? 'No charge applied' : 'Paid Cash / UPI'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
                    {/* If Active ride */}
                    {(isInProgress || isArrived || trip.status === 'Confirmed' || trip.status === 'Requested') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTrip) onSelectTrip(trip);
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#0f172a',
                          color: '#ffffff',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        Track Live Ride ➔
                      </button>
                    )}

                    {/* Re-book route button */}
                    {(isCompleted || isCancelled) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRebookTrip) onRebookTrip(trip);
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <RefreshCw size={12} /> Re-book this Ride
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
