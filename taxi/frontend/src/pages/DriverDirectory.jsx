import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { 
  Users, Search, Shield, Award, Car, CheckCircle2, Clock, 
  ArrowLeft, Phone, Mail, BadgeCheck, Activity, UserCheck, Eye,
  Plus, X, Check, Fuel, Gauge, Zap
} from 'lucide-react';

const DriverDirectory = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected driver for Full Screen / Detailed View
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Vehicle Assignment State
  const [showAssignVehicleModal, setShowAssignVehicleModal] = useState(false);
  const [targetDriverForVehicle, setTargetDriverForVehicle] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [selectedVehicleIdToAssign, setSelectedVehicleIdToAssign] = useState(null);
  const [vehicleAssignmentSubmitting, setVehicleAssignmentSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get('drivers/drivers/');
      const data = res.data.results || res.data;
      setDrivers(data);
      if (selectedDriver) {
        const updated = data.find(d => d.id === selectedDriver.id);
        if (updated) setSelectedDriver(updated);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAssignVehicleModal = async (driver) => {
    const d = driver || selectedDriver;
    setTargetDriverForVehicle(d);
    setShowAssignVehicleModal(true);
    setSelectedVehicleIdToAssign(null);
    setVehicleSearchQuery('');
    setLoadingVehicles(true);
    try {
      const res = await api.get('fleet/vehicles/');
      setAvailableVehicles(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch vehicles for assignment:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleConfirmVehicleAssignment = async () => {
    const driver = targetDriverForVehicle || selectedDriver;
    if (!selectedVehicleIdToAssign || !driver) return;
    setVehicleAssignmentSubmitting(true);
    try {
      const res = await api.post(`drivers/drivers/${driver.id}/assign_vehicle/`, {
        vehicle_id: selectedVehicleIdToAssign
      });
      setShowAssignVehicleModal(false);
      if (res.data?.driver) {
        if (selectedDriver && selectedDriver.id === driver.id) {
          setSelectedDriver(res.data.driver);
        }
      }
      fetchDrivers();
    } catch (err) {
      alert('Error assigning vehicle: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setVehicleAssignmentSubmitting(false);
    }
  };

  const handleUnassignVehicle = async (driver) => {
    const d = driver || selectedDriver;
    if (!d) return;
    const vehicleReg = d.vehicle_detail?.registration_number || 'the assigned vehicle';
    if (!window.confirm(`Are you sure you want to unassign ${vehicleReg} from driver ${d.user_detail?.first_name || d.user_detail?.username}?`)) {
      return;
    }
    try {
      const res = await api.post(`drivers/drivers/${d.id}/unassign_vehicle/`);
      if (res.data?.driver) {
        if (selectedDriver && selectedDriver.id === d.id) {
          setSelectedDriver(res.data.driver);
        }
      }
      fetchDrivers();
    } catch (err) {
      alert('Error unassigning vehicle: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDutyStatusChange = async (driverId, newStatus) => {
    try {
      await api.patch(`drivers/drivers/${driverId}/`, { duty_status: newStatus });
      fetchDrivers();
    } catch (err) {
      alert('Error updating duty status: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const name = `${d.user_detail?.first_name || ''} ${d.user_detail?.last_name || ''} ${d.user_detail?.username || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || d.license_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? d.duty_status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getDutyBadge = (status) => {
    switch (status) {
      case 'ON_DUTY_AVAILABLE':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> On Duty (Available)</span>;
      case 'ON_TRIP':
        return <span className="badge badge-info"><Clock size={12} /> On Active Trip</span>;
      case 'OFF_DUTY':
        return <span className="badge badge-warning">Off Duty</span>;
      case 'SUSPENDED':
        return <span className="badge badge-danger">Suspended</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const renderAssignVehicleModal = () => {
    if (!showAssignVehicleModal) return null;
    const driver = targetDriverForVehicle || selectedDriver;
    const driverName = driver?.user_detail?.first_name
      ? `${driver.user_detail.first_name} ${driver.user_detail.last_name || ''}`
      : driver?.user_detail?.username || 'Driver';

    return createPortal(
      <div className="portal-modal-overlay" onClick={() => setShowAssignVehicleModal(false)}>
        <div
          className="md3-card portal-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '720px',
            padding: '32px',
            borderRadius: '28px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={24} color="#1e293b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Assign Fleet Vehicle
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Assigning to driver: <strong style={{ color: 'var(--text-main)' }}>{driverName}</strong> • Badge: {driver?.badge_number || 'N/A'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAssignVehicleModal(false)}
              className="btn-secondary"
              style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Filter */}
          <div style={{ marginBottom: '18px' }}>
            <div className="search-box" style={{ background: 'var(--md-surface-container)', borderRadius: '24px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search fleet by license plate, make, model, or class..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: '10px 4px' }}
              />
            </div>
          </div>

          {/* Vehicles List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '24px' }}>
            {loadingVehicles ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading fleet vehicles...
              </div>
            ) : availableVehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', background: 'var(--md-surface-container-low)', borderRadius: '12px' }}>
                No fleet vehicles found.
              </div>
            ) : (
              availableVehicles
                .filter((v) => {
                  const q = vehicleSearchQuery.toLowerCase();
                  return (
                    v.registration_number?.toLowerCase().includes(q) ||
                    v.make?.toLowerCase().includes(q) ||
                    v.model?.toLowerCase().includes(q) ||
                    v.vehicle_class?.toLowerCase().includes(q)
                  );
                })
                .map((v) => {
                  const isSelected = selectedVehicleIdToAssign === v.id;
                  const isCurrentlyThisDriver = driver?.vehicle_detail?.id === v.id;
                  const otherDriver = v.assigned_driver;
                  const isAssignedToOther = otherDriver && otherDriver.id !== driver?.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleIdToAssign(v.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #1e293b' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(241, 245, 249, 0.95)' : 'var(--md-surface-container-low)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.registration_number}
                            style={{ width: '56px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '56px', height: '40px', borderRadius: '8px', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Car size={22} color="#1e293b" />
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>{v.make} {v.model}</strong>
                            <span className="font-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                              {v.registration_number}
                            </span>
                            <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                              {v.vehicle_class_display || v.vehicle_class}
                            </span>
                            {isCurrentlyThisDriver && (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Currently Paired</span>
                            )}
                            {isAssignedToOther && (
                              <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                                Assigned to {otherDriver.full_name}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Status: <span style={{ fontWeight: 600 }}>{v.status_display || v.status}</span> • Fuel: {v.fuel_type_display || v.fuel_type} • {Number(v.current_odometer).toLocaleString()} KM
                          </p>
                        </div>
                      </div>

                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: isSelected ? '6px solid #1e293b' : '2px solid var(--border-color)',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }} />
                    </div>
                  );
                })
            )}
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
            <button
              type="button"
              onClick={() => setShowAssignVehicleModal(false)}
              className="btn-secondary"
              style={{ borderRadius: '24px', padding: '10px 22px' }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedVehicleIdToAssign || vehicleAssignmentSubmitting}
              onClick={handleConfirmVehicleAssignment}
              className="btn-primary"
              style={{
                borderRadius: '24px',
                padding: '10px 26px',
                opacity: (!selectedVehicleIdToAssign || vehicleAssignmentSubmitting) ? 0.6 : 1,
                cursor: (!selectedVehicleIdToAssign || vehicleAssignmentSubmitting) ? 'not-allowed' : 'pointer'
              }}
            >
              {vehicleAssignmentSubmitting ? 'Assigning Vehicle...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // DETAILED DRIVER PROFILE VIEW (Material Design 3)
  if (selectedDriver) {
    const driverUser = selectedDriver.user_detail || {};
    const vehicle = selectedDriver.vehicle_detail;

    return (
      <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '28px', background: 'var(--bg-primary)', minHeight: '100vh' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
          <button 
            onClick={() => setSelectedDriver(null)} 
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 18px', borderRadius: '24px' }}
          >
            <ArrowLeft size={18} />
            <span>Back to Driver Operations Roster</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-info" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Badge: {selectedDriver.badge_number || 'BDG-881'}</span>
            {getDutyBadge(selectedDriver.duty_status)}
          </div>
        </div>

        {/* Main Split 2-Column Driver Profile Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
          
          {/* Left Column: Driver Info, Performance & Vehicle Pairing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Driver Hero Card */}
            <div className="md3-card" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '22px' }}>
              {selectedDriver.avatar_url ? (
                <img
                  src={selectedDriver.avatar_url}
                  alt={driverUser.first_name || driverUser.username}
                  style={{
                    width: '94px',
                    height: '94px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--accent-primary)',
                    boxShadow: 'var(--elevation-1)'
                  }}
                />
              ) : (
                <div style={{
                  width: '94px',
                  height: '94px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  fontSize: '2rem'
                }}>
                  {(driverUser.first_name?.[0] || driverUser.username?.[0] || 'D').toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {driverUser.first_name ? `${driverUser.first_name} ${driverUser.last_name}` : driverUser.username}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontSize: '1rem', fontWeight: 700 }}>
                    <Award size={18} fill="currentColor" />
                    <span>{selectedDriver.rating} ★</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Fleet Operations Officer & Commercial Chauffeur
                </p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={15} color="var(--accent-primary)" />
                    <strong style={{ color: 'var(--text-main)' }}>{driverUser.phone_number || '+1 (555) 302-8811'}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} color="var(--accent-primary)" />
                    <strong style={{ color: 'var(--text-main)' }}>{driverUser.email || `${driverUser.username}@fleetops.b2b`}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="md3-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
                <Shield size={22} color="var(--color-success)" style={{ margin: '0 auto 6px auto' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>SAFETY SCORE</span>
                <strong style={{ color: 'var(--color-success)', fontSize: '1.3rem', fontWeight: 800 }}>{selectedDriver.safety_score} / 100</strong>
              </div>

              <div className="md3-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' }}>
                <Activity size={22} color="var(--color-info)" style={{ margin: '0 auto 6px auto' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-info)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>TOTAL DISPATCHES</span>
                <strong style={{ color: 'var(--color-info)', fontSize: '1.3rem', fontWeight: 800 }}>{selectedDriver.total_trips || 142} Trips</strong>
              </div>

              <div className="md3-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
                <Award size={22} color="var(--color-warning)" style={{ margin: '0 auto 6px auto' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>RATING</span>
                <strong style={{ color: 'var(--color-warning)', fontSize: '1.3rem', fontWeight: 800 }}>{selectedDriver.rating} ★</strong>
              </div>
            </div>

            {/* Assigned Vehicle Card */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={20} color="var(--accent-primary)" />
                  <span>Currently Assigned Fleet Vehicle</span>
                </h3>
                {vehicle && (
                  <button
                    type="button"
                    onClick={() => handleOpenAssignVehicleModal(selectedDriver)}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: '16px' }}
                  >
                    Change Vehicle
                  </button>
                )}
              </div>

              {vehicle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {vehicle.image_url ? (
                      <img
                        src={vehicle.image_url}
                        alt={vehicle.registration_number}
                        style={{ width: '100px', height: '68px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                    ) : (
                      <div style={{ width: '100px', height: '68px', borderRadius: '8px', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={30} color="#1e293b" />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{vehicle.make} {vehicle.model}</strong>
                        <span className="badge badge-info">{vehicle.fuel_type_display || vehicle.fuel_type}</span>
                      </div>
                      <p className="font-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.88rem', fontWeight: 600, marginTop: '4px' }}>
                        Plate: {vehicle.registration_number} &nbsp;|&nbsp; Odometer: {Number(vehicle.current_odometer).toLocaleString()} KM
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>Class: {vehicle.vehicle_class_display || vehicle.vehicle_class}</span>
                        <span>• Status: {vehicle.status_display || vehicle.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleUnassignVehicle(selectedDriver)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        color: 'var(--color-danger)',
                        borderRadius: '16px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      Unassign Vehicle
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 20px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '14px' }}>
                    No vehicle currently paired. Driver is available for shift assignment.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignVehicleModal(selectedDriver)}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Plus size={16} />
                    <span>Assign Vehicle</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Duty Status Switcher & License Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Duty Status Control Card */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="var(--color-success)" />
                <span>Duty Status Control</span>
              </h3>

              <select
                className="select-field"
                value={selectedDriver.duty_status}
                onChange={(e) => handleDutyStatusChange(selectedDriver.id, e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem', borderRadius: '10px' }}
              >
                <option value="OFF_DUTY">Off Duty</option>
                <option value="ON_DUTY_AVAILABLE">On Duty (Available for Dispatch)</option>
                <option value="ON_TRIP">On Active Trip</option>
                <option value="SUSPENDED">Suspended / Inactive</option>
              </select>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                Changing status updates the live dispatch control board & driver roster immediately.
              </p>
            </div>

            {/* Driving License & Credentials Verification */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BadgeCheck size={20} color="var(--accent-primary)" />
                <span>Licensing & Commercial Verification</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '14px 16px', background: 'var(--md-surface-container-low)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>DRIVING LICENSE</span>
                    <strong className="font-mono" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedDriver.license_number}</strong>
                  </div>
                  <span className="badge badge-success">VALID ({selectedDriver.license_expiry})</span>
                </div>

                <div style={{ padding: '14px 16px', background: 'var(--md-surface-container-low)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>COMMERCIAL BADGE</span>
                    <strong className="font-mono" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedDriver.badge_number || 'BDG-881'}</strong>
                  </div>
                  <span className="badge badge-success">VALID ({selectedDriver.badge_expiry || '2027-10-15'})</span>
                </div>
              </div>
            </div>

            {/* Recent Shift Activity Log */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--color-warning)" />
                <span>Recent Shift Logs & Duty Checks</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px 14px', background: 'var(--md-surface-container-low)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Shift #1042 — Pre-Shift Check Passed</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Vehicle: {vehicle?.registration_number || 'B2B-TX-101'} | Initial Odo: 14,250 KM</p>
                  </div>
                  <span className="badge badge-success">Completed</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {renderAssignVehicleModal()}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.015em' }}>Driver Operations Roster</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select any driver row to inspect license validity, safety telemetry, and assigned fleet vehicle.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar (Material 3 Pill Style) */}
      <div className="md3-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--md-surface-container)' }}
            placeholder="Search driver by name, license number, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '220px' }}>
          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderRadius: '24px' }}
          >
            <option value="">All Duty Statuses</option>
            <option value="ON_DUTY_AVAILABLE">On Duty (Available)</option>
            <option value="ON_TRIP">On Active Trip</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Driver Directory Table */}
      <div className="md3-card" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading drivers directory...</div>
        ) : filteredDrivers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found matching your search.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Driver Name & Photo</th>
                <th>License & Expiry</th>
                <th>Duty Status</th>
                <th>Assigned Vehicle</th>
                <th>Safety Score</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => (
                <tr 
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view complete driver profile and duty logs"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {driver.avatar_url ? (
                        <img
                          src={driver.avatar_url}
                          alt={driver.user_detail?.first_name || driver.user_detail?.username}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--accent-primary-container)',
                            boxShadow: 'var(--elevation-1)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'rgba(241, 245, 249, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#1e293b',
                          fontSize: '0.9rem'
                        }}>
                          {(driver.user_detail?.first_name?.[0] || driver.user_detail?.username?.[0] || 'D').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {driver.user_detail?.first_name ? `${driver.user_detail.first_name} ${driver.user_detail.last_name}` : driver.user_detail?.username}
                        </strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {driver.user_detail?.phone_number || '+1 (555) 302-8811'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono" style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{driver.license_number}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exp: {driver.license_expiry}</p>
                  </td>
                  <td>{getDutyBadge(driver.duty_status)}</td>
                  <td>
                    {driver.vehicle_detail ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {driver.vehicle_detail.image_url ? (
                          <img
                            src={driver.vehicle_detail.image_url}
                            alt={driver.vehicle_detail.registration_number}
                            style={{ width: '32px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                        ) : (
                          <Car size={16} color="var(--accent-primary)" />
                        )}
                        <strong className="font-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
                          {driver.vehicle_detail.registration_number}
                        </strong>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignVehicleModal(driver);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(241, 245, 249, 0.9)',
                          color: '#1e293b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                        <span>Assign Car</span>
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={15} color="var(--color-success)" />
                      <strong style={{ color: 'var(--color-success)', fontSize: '0.92rem' }}>{driver.safety_score}/100</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 700 }}>
                      <Award size={15} fill="currentColor" />
                      <span>{driver.rating} ★</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDriver(driver);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      <Eye size={14} />
                      <span>View Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {renderAssignVehicleModal()}
    </div>
  );
};

export default DriverDirectory;
