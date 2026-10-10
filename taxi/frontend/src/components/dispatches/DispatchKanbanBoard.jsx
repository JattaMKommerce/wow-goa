import React from 'react';
import { 
  Car, User, Clock, MapPin, Sparkles, Zap, 
  ArrowRight, CheckCircle2, AlertCircle, Play, 
  Receipt, RefreshCw, Crown, Plane, ChevronRight 
} from 'lucide-react';

const DispatchKanbanBoard = ({ 
  bookings, 
  onOpenMatchmaker, 
  onOpenAllocate, 
  onOpenTripControl, 
  onOpenInvoice, 
  onOpenPlacard, 
  onOpenReassign,
  onStartTrip,
  onAutoAssign
}) => {
  // Columns definition
  const columns = [
    {
      id: 'PENDING',
      title: 'Pending Allocation',
      subtitle: 'SLA Risk • Needs Car & Chauffeur',
      color: '#c2410c',
      bg: '#fff7ed',
      border: '#fed7aa',
      items: bookings.filter(b => b.status === 'PENDING')
    },
    {
      id: 'DISPATCHED',
      title: 'Dispatched / En Route',
      subtitle: 'Chauffeur moving to pickup',
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      items: bookings.filter(b => b.status === 'DISPATCHED')
    },
    {
      id: 'ON_TRIP',
      title: 'Active Passenger Ride',
      subtitle: 'Live trip • Meter Running',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      items: bookings.filter(b => b.status === 'ON_TRIP')
    },
    {
      id: 'COMPLETED',
      title: 'Completed & Billed',
      subtitle: 'Duty done • Invoiced',
      color: '#475569',
      bg: '#f8fafc',
      border: '#e2e8f0',
      items: bookings.filter(b => b.status === 'COMPLETED')
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
      gap: '18px',
      overflowX: 'auto',
      paddingBottom: '16px'
    }}>
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: `1.5px solid ${col.border}`,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 280px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
          }}
        >
          {/* Column Header */}
          <div style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${col.border}`,
            background: col.bg,
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: col.color }}>
                  {col.title}
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: col.color,
                  border: `1px solid ${col.border}`
                }}>
                  {col.items.length}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                {col.subtitle}
              </div>
            </div>
          </div>

          {/* Column Cards Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {col.items.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 12px',
                color: '#94a3b8',
                fontSize: '0.82rem',
                border: '1.5px dashed #e2e8f0',
                borderRadius: '14px'
              }}>
                No duties in this state
              </div>
            ) : (
              col.items.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Card Reference & Client */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      background: '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {b.booking_reference}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#0284c7',
                      background: '#f0f9ff',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {b.vehicle_class_requested}
                    </span>
                  </div>

                  {/* Passenger & Client Name */}
                  <div>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {b.passenger_name}
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      {b.client_name} • {b.passenger_count} Pax
                    </div>
                  </div>

                  {/* Flight Info if Airport Transfer */}
                  {b.flight_number && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.76rem',
                      color: '#0284c7',
                      background: '#f0f9ff',
                      padding: '4px 8px',
                      borderRadius: '8px'
                    }}>
                      <Plane size={13} />
                      <span>Flight: <strong>{b.flight_number}</strong></span>
                    </div>
                  )}

                  {/* Route & Timing */}
                  <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="#64748b" />
                      <span>{new Date(b.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(b.pickup_time).toLocaleDateString()})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={13} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.pickup_location?.slice(0, 26)} ➔ {b.dropoff_location?.slice(0, 26)}
                      </div>
                    </div>
                  </div>

                  {/* Allocated Car & Driver if any */}
                  {b.assigned_vehicle_detail && (
                    <div style={{
                      padding: '8px 10px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700 }}>
                        <Car size={13} color="#64748b" />
                        {b.assigned_vehicle_detail.registration_number}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                        <User size={13} color="#64748b" />
                        {b.assigned_driver_detail?.full_name?.split(' ')[0]}
                      </span>
                    </div>
                  )}

                  {/* Fare if Completed */}
                  {b.status === 'COMPLETED' && (
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '6px'
                    }}>
                      <span>Fare (5% GST):</span>
                      <span>₹{Number(b.total_fare_inr).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Dynamic Action Buttons per column */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onOpenMatchmaker(b)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '10px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Sparkles size={12} />
                          <span>AI Match</span>
                        </button>

                        <button
                          onClick={() => onAutoAssign(b)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            background: '#1e293b',
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
                          <span>Auto</span>
                        </button>
                      </>
                    )}

                    {b.status === 'DISPATCHED' && (
                      <>
                        <button
                          onClick={() => onStartTrip(b.id)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '10px',
                            background: '#15803d',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Play size={12} />
                          <span>Start Ride</span>
                        </button>

                        <button
                          onClick={() => onOpenPlacard(b)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                          title="VIP Airport Arrival Placard"
                        >
                          <Crown size={12} />
                          <span>Placard</span>
                        </button>

                        <button
                          onClick={() => onOpenReassign(b)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                          title="Dispatcher Hot-Swap"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </>
                    )}

                    {b.status === 'ON_TRIP' && (
                      <button
                        onClick={() => onOpenTripControl(b)}
                        style={{
                          width: '100%',
                          padding: '7px 12px',
                          borderRadius: '10px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={13} color="#4ade80" />
                        <span>Conclude Ride & Calculate Meter</span>
                      </button>
                    )}

                    {b.status === 'COMPLETED' && (
                      <button
                        onClick={() => onOpenInvoice(b)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          color: '#0f172a',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Receipt size={13} color="#0284c7" />
                        <span>Duty Tax Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DispatchKanbanBoard;
