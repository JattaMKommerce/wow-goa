import React, { useState, useEffect } from 'react';
import { 
  Car, MapPin, Phone, MessageSquare, Key, CheckCircle2, 
  X, ChevronUp, ChevronDown, Navigation, Star, ShieldCheck, 
  Clock, DollarSign, ExternalLink
} from 'lucide-react';
import { fetchRideLiveTrack, rateCustomerTrip } from '../../services/api';

export default function LiveCustomerRideBar() {
  const [activeRide, setActiveRide] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Poll backend telematics & local storage dispatches
  const checkActiveRide = async () => {
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      let current = null;
      if (Array.isArray(dispatches) && dispatches.length > 0) {
        current = dispatches.find(d => 
          d.status === 'Requested' ||
          d.status === 'Confirmed' || 
          d.status === 'Dispatched' || 
          d.status === 'Driver Arrived' || 
          d.status === 'In Progress'
        );
        if (!current) {
          current = dispatches.find(d => d.status === 'Completed' && !d.dismissed);
        }
      }

      // Also query backend ride live tracking for real-time status and driver assignment
      const targetId = current?.id || activeRide?.id;
      if (targetId) {
        const liveRes = await fetchRideLiveTrack(targetId);
        if (liveRes?.success && liveRes?.dispatch) {
          const d = liveRes.dispatch;
          let mappedStatus = 'Requested';
          if (d.status === 'PENDING_ALLOCATION' || d.status === 'ALLOCATED') mappedStatus = 'Requested';
          else if (d.status === 'DISPATCHED') mappedStatus = 'Dispatched';
          else if (d.status === 'ARRIVED') mappedStatus = 'Driver Arrived';
          else if (d.status === 'ON_TRIP') mappedStatus = 'In Progress';
          else if (d.status === 'COMPLETED') mappedStatus = 'Completed';

          setActiveRide(prev => ({
            ...(prev || current || {}),
            id: d.id,
            status: mappedStatus,
            otp: d.otp || prev?.otp || current?.otp,
            chauffeur: d.assigned_driver_name || prev?.chauffeur || current?.chauffeur,
            vehiclePlate: d.assigned_vehicle_plate || prev?.vehiclePlate || current?.vehiclePlate,
            car: d.assigned_vehicle_model || prev?.car || current?.car,
            phone: d.assigned_driver_phone || prev?.phone || current?.phone,
            telematics: liveRes.telematics
          }));
          return;
        }
      }

      if (current) {
        setActiveRide(current);
      } else {
        setActiveRide(null);
      }
    } catch (e) {
      // Keep existing state if offline
    }
  };

  useEffect(() => {
    checkActiveRide();
    const interval = setInterval(checkActiveRide, 2000); // Poll every 2s

    const handleUpdate = () => checkActiveRide();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('wowgoa_dispatch_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('wowgoa_dispatch_updated', handleUpdate);
    };
  }, []);

  if (!activeRide) return null;

  const isRequested = activeRide.status === 'Requested';
  const isDriverArrived = activeRide.status === 'Driver Arrived';
  const isOnTrip = activeRide.status === 'In Progress';
  const isCompleted = activeRide.status === 'Completed';
  const isEnRoute = activeRide.status === 'Confirmed' || activeRide.status === 'Dispatched';

  const pickup = activeRide.service ? activeRide.service.split('➔')[0].trim() : 'Pickup Point';
  const dropoff = activeRide.service ? (activeRide.service.split('➔')[1] || '').trim() : 'Destination';

  const handleDismiss = () => {
    try {
      const dispatches = JSON.parse(localStorage.getItem('wowgoa_taxi_dispatches') || '[]');
      const updated = dispatches.map(d => d.id === activeRide.id ? { ...d, dismissed: true } : d);
      localStorage.setItem('wowgoa_taxi_dispatches', JSON.stringify(updated));
    } catch (e) {}
    setActiveRide(null);
    setIsExpanded(false);
  };

  return (
    <>
      {/* ── FLOATING MINI BOTTOM BAR (Visible on mobile above bottom nav, bottom right on desktop) ── */}
      <aside 
        aria-label="Active Ride Tracker"
        style={{
          position: 'fixed',
          bottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '74px' : '24px',
          left: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : 'auto',
          right: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '24px',
          width: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'auto' : '380px',
          zIndex: 999,
          background: isRequested ? '#78350f' : (isDriverArrived ? '#7c3aed' : (isOnTrip ? '#16a34a' : (isCompleted ? '#0f172a' : '#0B192C'))),
          color: '#ffffff',
          borderRadius: '18px',
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          animation: (isDriverArrived || isRequested) ? 'pulse 2s infinite' : 'none'
        }}
        onClick={() => setIsExpanded(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {isRequested ? '⏳' : (isDriverArrived ? '📍' : (isOnTrip ? '🚗' : (isCompleted ? '🏁' : '🚕')))}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                background: isRequested ? '#b45309' : 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '6px',
                letterSpacing: '0.04em'
              }}>
                {isRequested && 'AWAITING DRIVER ACCEPT'}
                {isDriverArrived && 'CHAUFFEUR ARRIVED'}
                {isOnTrip && 'RIDE IN PROGRESS'}
                {isCompleted && 'RIDE COMPLETED'}
                {isEnRoute && 'CHAUFFEUR EN ROUTE'}
              </span>
              <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 700 }}>
                OTP: <strong style={{ color: '#fef08a' }}>{activeRide.otp || '4821'}</strong>
              </span>
            </div>

            <div style={{
              fontSize: '0.86rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px'
            }}>
              {isRequested && `Waiting for ${activeRide.chauffeur || 'Suresh Naik'} to accept`}
              {isDriverArrived && 'Chauffeur is waiting at pickup spot!'}
              {isOnTrip && `Heading to ${dropoff.slice(0, 20)}`}
              {isCompleted && `Total ₹${activeRide.amount || 2450} • View Duty Slip`}
              {isEnRoute && `${activeRide.chauffeur || 'Suresh Naik'} · ${activeRide.car || 'Innova Crysta'}`}
            </div>
          </div>
        </div>

        <button 
          type="button"
          aria-label="Expand ride details"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '6px 12px',
            fontSize: '0.76rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            cursor: 'pointer'
          }}
        >
          <span>Track</span>
          <ChevronUp size={14} />
        </button>
      </aside>

      {/* ── EXPANDED FULL-SCREEN / MODAL RIDE TRACKING SHEET ── */}
      {isExpanded && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Live Ride Tracking & Driver Arrival Modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExpanded(false);
          }}
        >
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '28px 28px 0 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Sheet Handle & Header */}
            <div style={{
              background: isRequested ? '#78350f' : (isDriverArrived ? '#7c3aed' : (isOnTrip ? '#16a34a' : (isCompleted ? '#0f172a' : '#0B192C'))),
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.85, letterSpacing: '0.06em' }}>
                  WOW GOA LIVE RIDE TRACKER
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '2px 0 0', color: '#ffffff' }}>
                  {isRequested && '⏳ Waiting for Chauffeur to Accept...'}
                  {isDriverArrived && '📍 Chauffeur Has Arrived!'}
                  {isOnTrip && '🟢 On Trip to Destination'}
                  {isCompleted && '✅ Trip Concluded & Paid'}
                  {isEnRoute && '🚗 Chauffeur Is En Route (~3 mins)'}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Close ride tracker"
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* 1. 4-DIGIT RIDE START OTP CARD (Always visible for safety) */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: isDriverArrived ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                borderRadius: '20px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isDriverArrived ? '0 6px 20px rgba(124, 58, 237, 0.15)' : 'none'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={15} color={isDriverArrived ? '#7c3aed' : '#0f172a'} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
                      RIDE START OTP
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {isDriverArrived ? 'Share this OTP with chauffeur to begin' : 'Show to chauffeur when picked up'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {String(activeRide.otp || '4821').split('').map((digit, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '36px',
                        height: '42px',
                        background: '#0f172a',
                        color: '#ffffff',
                        borderRadius: '10px',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. CHAUFFEUR & VEHICLE PROFILE CARD */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.2rem',
                      border: '2px solid #e0f2fe'
                    }}>
                      👨‍✈️
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                        {activeRide.chauffeur || 'Suresh Naik'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 800 }}>★ 4.95</span>
                        <span>• Executive B2B Chauffeur</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    letterSpacing: '0.04em'
                  }}>
                    {activeRide.vehiclePlate || 'GA-03-Z-8899'}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: '#475569'
                }}>
                  <span>Vehicle: <strong>{activeRide.car || 'Toyota Innova Crysta'}</strong></span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>AC Verified • Bottled Water</span>
                </div>

                {/* 1-Tap Contact Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <a
                    href={`tel:${activeRide.phone || '+919822144510'}`}
                    style={{
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#0f172a',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Phone size={15} />
                    <span>Call Chauffeur</span>
                  </a>

                  <a
                    href={`https://wa.me/${String(activeRide.phone || '919822144510').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi Suresh, I am your passenger for WOW GOA booking (${activeRide.id}). Pickup at: ${pickup}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '11px',
                      borderRadius: '12px',
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* 3. ROUTE SUMMARY */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                  Trip Route Details
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pickup Location</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{pickup}</div>
                    </div>
                  </div>

                  <div style={{ borderLeft: '2px dashed #cbd5e1', height: '12px', marginLeft: '4px' }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', marginTop: '4px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Destination</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{dropoff}</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '10px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Fare (Inclusive of GST):</span>
                  <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>
                    ₹{Number(activeRide.amount || 2450).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* 4. RIDE COMPLETED FEEDBACK & RATING (If completed) */}
              {isCompleted && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '20px',
                  padding: '16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#166534' }}>
                    ⭐ How was your journey with {activeRide.chauffeur || 'Suresh'}?
                  </div>
                  
                  {!ratingSubmitted ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '28px',
                              cursor: 'pointer',
                              color: userRating >= star ? '#f59e0b' : '#cbd5e1'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          setRatingSubmitted(true);
                          try {
                            await rateCustomerTrip({
                              dispatch_id: activeRide.id,
                              rating: userRating,
                              feedback: `Customer gave ${userRating} stars on trip conclusion`
                            });
                          } catch (e) {}
                        }}
                        disabled={userRating === 0}
                        style={{
                          background: userRating > 0 ? '#16a34a' : '#cbd5e1',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: userRating > 0 ? 'pointer' : 'default'
                        }}
                      >
                        Submit Feedback
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                      🎉 Thank you for rating! We hope you enjoy your stay in Goa!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDismiss}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    Close & Dismiss Tracker
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
