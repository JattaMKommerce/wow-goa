import React, { useState } from 'react';
import { X, MapPin, Plus, Check, ArrowRight, Compass, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

// Popular tourist and market waypoints across Goa with realistic fair surcharges
export const POPULAR_GOA_STOPS = [
  { name: 'Panaji Market & Latin Quarter', label: 'Panaji Latin Quarter', surcharge: 220, icon: '🏛️', tag: 'Shopping & Heritage' },
  { name: 'Mapusa Market & Bus Stand', label: 'Mapusa Market', surcharge: 180, icon: '🛍️', tag: 'Spices & Souvenirs' },
  { name: 'Calangute Beach Circle', label: 'Calangute Circle', surcharge: 200, icon: '🏖️', tag: 'North Coast Hub' },
  { name: 'Baga Beach & Tito’s Lane', label: 'Baga Tito’s Lane', surcharge: 220, icon: '🎶', tag: 'Nightlife & Cafes' },
  { name: 'Old Goa (Basilica of Bom Jesus)', label: 'Old Goa Heritage', surcharge: 240, icon: '⛪', tag: 'UNESCO World Heritage' },
  { name: 'Porvorim Mall de Goa', label: 'Mall de Goa (Porvorim)', surcharge: 180, icon: '🏬', tag: 'ATM & Pharmacy' },
  { name: 'Dona Paula Jetty & Viewpoint', label: 'Dona Paula Viewpoint', surcharge: 250, icon: '🌅', tag: 'Sea View' },
  { name: 'Candolim Beach Market', label: 'Candolim Market', surcharge: 190, icon: '🌴', tag: 'Beach Walk & Cafes' }
];

export default function AddStopModal({
  isOpen,
  onClose,
  pickupLocation,
  dropoffLocation,
  currentFare = 790,
  currentStops = [],
  onConfirmStop,
  userRole = 'customer' // 'customer' | 'driver'
}) {
  const [selectedPreset, setSelectedPreset] = useState(POPULAR_GOA_STOPS[0].name);
  const [customStopText, setCustomStopText] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen) return null;

  const activePreset = POPULAR_GOA_STOPS.find(p => p.name === selectedPreset) || POPULAR_GOA_STOPS[0];
  const surcharge = useCustom ? 220 : activePreset.surcharge;
  const chosenStopName = useCustom ? (customStopText.trim() || 'Custom Goa Via Stop') : activePreset.name;
  const newTotalFare = Number(currentFare) + surcharge;

  const handleApply = (e) => {
    e.preventDefault();
    if (useCustom && !customStopText.trim()) {
      alert('Please enter a location name for the stop.');
      return;
    }
    onConfirmStop(chosenStopName, newTotalFare, surcharge);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#38bdf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={22} strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>
                {userRole === 'driver' ? 'Add Stop to Duty (Ola/Uber Style)' : 'Add a Stop Along Route'}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Intermediate waypoint & dynamic fare adjustment
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Visual Multi-Stop Itinerary Route */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Pickup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pickup Location</span>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pickupLocation}
                </div>
              </div>
            </div>

            {/* Stop Indicator */}
            <div style={{ borderLeft: '2px dashed #f59e0b', marginLeft: '4px', height: '14px' }} />

            {/* Intermediate Stop Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', padding: '8px 10px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.25)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Intermediate Stop 1 (Up to 10 mins wait)</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#78350f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chosenStopName}
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '2px 7px', borderRadius: '6px' }}>
                +₹{surcharge}
              </span>
            </div>

            <div style={{ borderLeft: '2px dashed #cbd5e1', marginLeft: '4px', height: '14px' }} />

            {/* Destination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Final Destination</span>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dropoffLocation}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Popular Goa Stops Chips */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Choose Quick Stop in Goa:</span>
              <button
                type="button"
                onClick={() => setUseCustom(!useCustom)}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                {useCustom ? '← View Popular Presets' : '+ Type Custom Location'}
              </button>
            </div>

            {!useCustom ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {POPULAR_GOA_STOPS.map(item => {
                  const isSelected = selectedPreset === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => { setSelectedPreset(item.name); setUseCustom(false); }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: isSelected ? '#0284c7' : '#64748b' }}>
                          +₹{item.surcharge}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#0369a1' : '#0f172a', marginTop: '2px', lineHeight: 1.2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {item.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Type any landmark, hotel, cafe, or beach..."
                  value={customStopText}
                  onChange={(e) => setCustomStopText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #0284c7',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Standard via stop detour rate: +₹220 (adds approx. 6-8 km and 10 mins wait)
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Fare Impact Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                Updated Fare with Stop
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Base ₹{currentFare} + Via Stop ₹{surcharge}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#15803d' }}>
                ₹{newTotalFare}
              </div>
              <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>
                Includes GST & Tolls
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div style={{
          padding: '14px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Check size={17} strokeWidth={2.5} />
            <span>Confirm Stop (₹{newTotalFare})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
