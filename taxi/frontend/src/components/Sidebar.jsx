import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  FileCheck, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout, activeRole } = useAuth();

  // Strict role-specific navigation menus:
  const adminNavItems = [
    { id: 'dashboard', label: 'P&L Financial Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Live Cars & Rate Card', icon: DollarSign },
    { id: 'vehicles', label: 'Fleet Garage & Vehicles', icon: Car },
    { id: 'drivers', label: 'Chauffeur Records & KYC', icon: Users },
    { id: 'compliance', label: 'RTO Compliance & Vault', icon: FileCheck },
    { id: 'settlements', label: 'Corporate Invoicing & GST', icon: DollarSign },
  ];

  const dispatcherNavItems = [
    { id: 'dispatches', label: 'Dispatcher Operations Desk', icon: Briefcase },
    { id: 'directory', label: 'Live Cars & Rate Card', icon: DollarSign },
    { id: 'telematics', label: 'Live Fleet GPS Tracking', icon: MapPin },
    { id: 'drivers', label: 'On-Duty Chauffeur Roster', icon: Users },
  ];

  const navItems = activeRole === 'DISPATCHER' ? dispatcherNavItems : adminNavItems;

  return (
    <aside style={{
      width: '280px',
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      flexShrink: 0
    }}>
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0 8px 24px 8px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: activeRole === 'DISPATCHER' ? '#0284c7' : '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)'
          }}>
            <Car size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>APEX FLEET</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500, margin: 0 }}>
              {activeRole === 'DISPATCHER' ? 'Control Room Operations' : 'Executive Fleet Management'}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.08em', padding: '0 12px 12px 12px' }}>
            {activeRole === 'DISPATCHER' ? '🎧 CONTROL ROOM DISPATCH' : '👑 FLEET & BUSINESS MGMT'}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: '24px',
                    border: 'none',
                    background: isActive ? (activeRole === 'DISPATCHER' ? '#0284c7' : '#0f172a') : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(241, 245, 249, 0.9)';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isActive ? '#ffffff' : '#64748b'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={15} color="#ffffff" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Info & Role Banner */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(241, 245, 249, 0.75)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: activeRole === 'DISPATCHER' ? '#0284c7' : '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                {user?.username || 'Fleet Manager'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0, textTransform: 'capitalize' }}>
                {activeRole === 'DISPATCHER' ? 'Operations Dispatcher' : 'Fleet Managing Director'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              transition: 'color 0.2s ease'
            }}
            title="Log Out"
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
