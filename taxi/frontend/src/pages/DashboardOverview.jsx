import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Car, Users, CheckCircle2, AlertTriangle, ShieldCheck, Activity, Wrench, ArrowUpRight, Navigation } from 'lucide-react';

const DashboardOverview = ({ setActiveTab }) => {
  const [vehicleSummary, setVehicleSummary] = useState({ total_vehicles: 0, available: 0, on_duty: 0, in_maintenance: 0 });
  const [driverSummary, setDriverSummary] = useState({ total_drivers: 0, on_duty: 0, on_trip: 0, off_duty: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          api.get('fleet/vehicles/summary/'),
          api.get('drivers/drivers/summary/'),
        ]);
        setVehicleSummary(vRes.data);
        setDriverSummary(dRes.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const utilizationRate = vehicleSummary.total_vehicles > 0 
    ? Math.round((vehicleSummary.on_duty / vehicleSummary.total_vehicles) * 100) 
    : 0;

  return (
    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner / Hero Metric with Glassmorphism */}
      <div style={{
        padding: '28px 34px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '24px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--elevation-2)'
      }}>
        <div>
          <span className="badge badge-info" style={{ marginBottom: '10px' }}>B2B Operations Status</span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0, marginTop: '4px' }}>
            Fleet Operational Readiness: <span style={{ color: 'var(--color-success)' }}>94.2%</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '650px', margin: 0 }}>
            Active duty assignments, driver safety scores, and real-time compliance monitoring across Metro Fleet.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('telematics')} className="btn-primary" style={{ padding: '11px 22px', background: '#0f172a', gap: '8px' }}>
            <Navigation size={18} color="#38bdf8" />
            <span>Live GPS Map</span>
          </button>
          <button onClick={() => setActiveTab('vehicles')} className="btn-secondary" style={{ padding: '11px 22px' }}>
            <Car size={18} />
            <span>Manage Vehicles</span>
          </button>
          <button onClick={() => setActiveTab('drivers')} className="btn-secondary" style={{ padding: '11px 22px' }}>
            <Users size={18} />
            <span>Driver Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Total Fleet */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>TOTAL VEHICLES</span>
            <div style={{ width: '42px', height: '42px', background: 'rgba(241, 245, 249, 0.9)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={22} color="#1e293b" />
            </div>
          </div>
          <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '12px', letterSpacing: '-0.02em', margin: 0 }}>
            {loading ? '...' : vehicleSummary.total_vehicles}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}>
            <CheckCircle2 size={16} />
            <span>{vehicleSummary.available} Available for dispatch</span>
          </div>
        </div>

        {/* Card 2: On Duty Vehicles */}
        <div className="md3-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>ON DUTY / DISPATCHED</span>
            <div style={{ width: '42px', height: '42px', background: 'var(--color-success-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="var(--color-success)" />
            </div>
          </div>
          <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : vehicleSummary.on_duty}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Fleet Utilization: <strong style={{ color: 'var(--accent-primary)' }}>{utilizationRate}%</strong></span>
          </div>
        </div>

        {/* Card 3: Active Drivers */}
        <div className="md3-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>ACTIVE DRIVERS</span>
            <div style={{ width: '42px', height: '42px', background: 'var(--color-info-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="var(--color-info)" />
            </div>
          </div>
          <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : driverSummary.total_drivers}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}>
            <ShieldCheck size={16} />
            <span>Avg Safety Score: <strong>97.8/100</strong></span>
          </div>
        </div>

        {/* Card 4: In Maintenance */}
        <div className="md3-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>IN MAINTENANCE</span>
            <div style={{ width: '42px', height: '42px', background: 'var(--color-warning-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={22} color="var(--color-warning)" />
            </div>
          </div>
          <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {loading ? '...' : vehicleSummary.in_maintenance}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-warning)' }}>
            <AlertTriangle size={16} />
            <span>Scheduled routine service</span>
          </div>
        </div>

      </div>

      {/* Operational Highlights Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Quick B2B Fleet Capabilities */}
        <div className="md3-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '18px' }}>
            B2B Operations Architecture Capabilities
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '18px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-success">Phase 1 Live</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>Vehicle & Driver Registry</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                ACID relational models for VIN, compliance documents, driver licensing & duty status.
              </p>
            </div>

            <div style={{ padding: '18px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-info">Phase 2 Next</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>Shift Handover & Inspection</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Digital pre-inspection checklist, start/end odometer verification, shift log logs.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab && setActiveTab('settlements')}
              style={{ 
                padding: '18px', 
                background: 'rgba(255, 255, 255, 0.88)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Phase 3 Live</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>Corporate Billing Engine</strong>
                </div>
                <ArrowUpRight size={16} color="#64748b" />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Contract pricing cards, corporate retainer billing, toll reimbursements & driver settlements.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab && setActiveTab('telematics')}
              style={{ 
                padding: '18px', 
                background: 'rgba(255, 255, 255, 0.88)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Phase 4 Live</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>Live GPS Map & Telematics</strong>
                </div>
                <ArrowUpRight size={16} color="#64748b" />
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Real-time GPS tracking, active geofence alerts, speed governor monitoring & live operational radar.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Fleet Compliance Alert Box */}
        <div className="md3-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle size={22} color="var(--color-warning)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Compliance Alerts</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px 14px', background: 'var(--color-warning-bg)', borderLeft: '4px solid var(--color-warning)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)' }}>PUC Certificate Expiring</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>B2B-TX-101 (Toyota Camry) — Expiry in 15 days</p>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', borderLeft: '4px solid var(--color-danger)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-danger)' }}>Fitness Certificate Expired</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>B2B-VAN-404 (Mercedes Metris) — Expired 10 days ago</p>
              </div>
            </div>
          </div>

          <button onClick={() => setActiveTab('vehicles')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px', padding: '11px' }}>
            <span>View Full Compliance Vault</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default DashboardOverview;
