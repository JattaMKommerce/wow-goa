import React from 'react';
import { Car, Compass, CalendarCheck, Bike, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, onOpenSupport, currentUser }) {
  // Check if logged-in user is a driver/chauffeur
  const isDriverMode = currentUser?.role === 'chauffeur' || currentUser?.role === 'chauffer' || currentUser?.role === 'driver';

  const customerNavItems = [
    {
      id: 'cabs',
      label: 'Cabs',
      sub: 'Chauffeur',
      icon: Car,
      badge: 'LIVE',
      badgeColor: '#10b981'
    },
    {
      id: 'selfdrive',
      label: 'Self Drive',
      sub: 'Cars',
      icon: Compass,
      badge: null
    },
    {
      id: 'bikes',
      label: 'Bikes',
      sub: 'Scooters',
      icon: Bike,
      badge: 'POPULAR',
      badgeColor: '#f59e0b'
    },
    {
      id: 'customer',
      label: 'My Trips',
      sub: 'Passes',
      icon: CalendarCheck,
      badge: null
    },
    {
      id: 'packages',
      label: 'Holiday',
      sub: 'Packages',
      icon: Sparkles,
      badge: null
    }
  ];

  const navItems = customerNavItems;

  const handleSelect = (id) => {
    // Light haptic feedback if supported
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(10); } catch (e) {}
    }

    if (id === 'chauffeur') {
      // Navigate to driver companion app
      setActiveTab('chauffeur');
      try { window.history.pushState(null, '', '/chauffeur'); } catch (e) {}
      return;
    }

    if (id === 'bikes') {
      // Switch to self-drive with bike category filter
      setActiveTab('selfdrive');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('filter-vehicle-type', { detail: { type: 'bike' } }));
        const sec = document.getElementById('results-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    setActiveTab(id);
    const dest = id === 'cabs' ? '/cabs' : (id === 'selfdrive' ? '/' : `/${id}`);
    try {
      window.history.pushState(null, '', dest);
    } catch (e) {}

    // Smooth scroll down to interactive booking area if needed
    setTimeout(() => {
      const sec = document.getElementById('results-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const isDriverRoute = activeTab === 'chauffeur';

  return (
    <nav 
      className="mobile-bottom-nav d-md-none" 
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '66px',
        background: isDriverRoute ? 'rgba(15, 23, 42, 0.98)' : 'rgba(11, 25, 44, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: isDriverRoute ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1040,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id || (item.id === 'selfdrive' && activeTab === 'home');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              padding: '4px 2px',
              position: 'relative',
              transition: 'all 0.2s ease',
              color: isActive ? '#ff9f1c' : 'rgba(255, 255, 255, 0.65)'
            }}
          >
            {/* Active Pill Glow */}
            {isActive && (
              <span 
                style={{
                  position: 'absolute',
                  top: '4px',
                  width: '36px',
                  height: '3px',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, #ff9f1c, #f59e0b)',
                  boxShadow: '0 0 10px rgba(255, 159, 28, 0.7)'
                }}
              />
            )}

            {/* Icon Wrapper with Mini Badge */}
            <div style={{ position: 'relative', marginTop: isActive ? '2px' : '0' }}>
              <div 
                style={{
                  width: '36px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'rgba(255, 159, 28, 0.16)' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <IconComponent size={item.id === 'cabs' ? 21 : 19} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>

              {item.badge && !isActive && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-10px',
                    fontSize: '8px',
                    fontWeight: '800',
                    background: item.badgeColor,
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '8px',
                    lineHeight: '1',
                    letterSpacing: '0.3px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span 
              style={{
                fontSize: '11px',
                fontWeight: isActive ? '800' : '500',
                lineHeight: '1.2',
                marginTop: '1px',
                letterSpacing: '0.2px'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Driver App Tab — always visible, glowing accent */}
      <button
        type="button"
        onClick={() => handleSelect('chauffeur')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: isDriverRoute
            ? 'linear-gradient(180deg, rgba(56,189,248,0.18) 0%, transparent 100%)'
            : 'none',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          padding: '4px 2px',
          position: 'relative',
          transition: 'all 0.2s ease',
          color: isDriverRoute ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)'
        }}
      >
        {/* Active Pill — cyan for driver */}
        {isDriverRoute && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              width: '36px',
              height: '3px',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)'
            }}
          />
        )}

        <div style={{ position: 'relative', marginTop: isDriverRoute ? '2px' : '0' }}>
          <div
            style={{
              width: '36px',
              height: '32px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDriverRoute ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
              border: isDriverRoute ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Steering wheel emoji-style car icon */}
            <span style={{ fontSize: '16px', lineHeight: 1 }}>🚗</span>
          </div>

          {/* Pulse dot — indicates driver mode */}
          {!isDriverRoute && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 6px rgba(56, 189, 248, 0.9)',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </div>

        <span
          style={{
            fontSize: '10px',
            fontWeight: isDriverRoute ? '800' : '600',
            lineHeight: '1.2',
            marginTop: '1px',
            letterSpacing: '0.2px'
          }}
        >
          Driver
        </span>
      </button>
    </nav>
  );
}
