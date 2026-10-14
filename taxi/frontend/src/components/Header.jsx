import React from 'react';
import { Shield, Radio, Globe, Crown, Headphones, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, onViewWebsite, onRoleChange }) => {
  const { user, activeRole, setActiveRole } = useAuth();

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  return (
    <header style={{
      height: '74px',
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      flexShrink: 0,
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.03)',
      gap: '16px'
    }}>
      {/* Title & Context */}
      <div style={{ minWidth: '220px' }}>
        <h2 style={{ 
          fontSize: '1.28rem', 
          fontWeight: 800, 
          color: '#0f172a', 
          letterSpacing: '-0.015em',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {title}
        </h2>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#64748b', 
          fontWeight: 500,
          margin: 0,
          marginTop: '2px',
          letterSpacing: '0.01em'
        }}>
          {activeRole === 'FLEET_ADMIN' && '👑 Owner Portal • Financials, Fleet Inventory & RTO Compliance'}
          {activeRole === 'DISPATCHER' && '🎧 Control Room • Flight Radar, Duty Kanban & Live GPS'}
          {activeRole === 'DRIVER' && '🚗 Chauffeur App • Mobile Duty Companion & Live Meter'}
        </p>
      </div>

      {/* Role Switcher Pill Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#f1f5f9',
        borderRadius: '24px',
        padding: '3px',
        border: '1px solid #cbd5e1',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
      }}>
        {/* Role 1: Fleet Admin */}
        <button
          onClick={() => handleRoleSelect('FLEET_ADMIN')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: activeRole === 'FLEET_ADMIN' ? 700 : 500,
            border: 'none',
            cursor: 'pointer',
            background: activeRole === 'FLEET_ADMIN' ? '#0f172a' : 'transparent',
            color: activeRole === 'FLEET_ADMIN' ? '#ffffff' : '#475569',
            boxShadow: activeRole === 'FLEET_ADMIN' ? '0 2px 6px rgba(15,23,42,0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Fleet Admin: P&L Dashboard, Vehicles, Driver Records, RTO Vault, GST Billing"
        >
          <Crown size={14} color={activeRole === 'FLEET_ADMIN' ? '#f59e0b' : '#64748b'} />
          <span>Fleet Admin</span>
        </button>

        {/* Role 2: Dispatcher */}
        <button
          onClick={() => handleRoleSelect('DISPATCHER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: activeRole === 'DISPATCHER' ? 700 : 500,
            border: 'none',
            cursor: 'pointer',
            background: activeRole === 'DISPATCHER' ? '#0284c7' : 'transparent',
            color: activeRole === 'DISPATCHER' ? '#ffffff' : '#475569',
            boxShadow: activeRole === 'DISPATCHER' ? '0 2px 6px rgba(2,132,199,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Dispatcher: Goa Flight Radar, Duty Kanban Board, AI Matchmaker, GPS Tracking"
        >
          <Headphones size={14} color={activeRole === 'DISPATCHER' ? '#ffffff' : '#64748b'} />
          <span>Dispatcher Desk</span>
        </button>

        {/* Role 3: Chauffeur */}
        <button
          onClick={() => handleRoleSelect('DRIVER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: activeRole === 'DRIVER' ? 700 : 500,
            border: 'none',
            cursor: 'pointer',
            background: activeRole === 'DRIVER' ? '#16a34a' : 'transparent',
            color: activeRole === 'DRIVER' ? '#ffffff' : '#475569',
            boxShadow: activeRole === 'DRIVER' ? '0 2px 6px rgba(22,163,74,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Chauffeur: Mobile Phone Companion, Shift Checklist, 1-Tap Maps, VIP Placard, Meter"
        >
          <Smartphone size={14} color={activeRole === 'DRIVER' ? '#ffffff' : '#64748b'} />
          <span>Chauffeur Mobile</span>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* View Public Website */}
        {onViewWebsite && (
          <button
            onClick={onViewWebsite}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              fontSize: '0.76rem',
              color: '#1e293b',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Preview Public Marketing Website"
          >
            <Globe size={13} color="#1e293b" />
            <span>Public Site</span>
          </button>
        )}

        {/* System Health */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success-border)',
          borderRadius: '20px',
          fontSize: '0.76rem',
          color: 'var(--color-success)',
          fontWeight: 600
        }}>
          <Radio size={12} className="animate-pulse" />
          <span>Fleet Live</span>
        </div>

        {/* Company Badge */}
        <div style={{
          padding: '5px 14px',
          background: 'rgba(241, 245, 249, 0.9)',
          border: '1px solid #cbd5e1',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: '#1e293b',
          fontWeight: 600
        }}>
          <Shield size={13} color="#334155" />
          <span>{user?.company_name || 'Apex Fleet'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
