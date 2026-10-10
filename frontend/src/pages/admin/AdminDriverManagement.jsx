import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Clock, CheckCircle2, XCircle, Search, Filter,
  Eye, Shield, MapPin, Phone, Mail, FileText, AlertCircle, RefreshCw,
  Calendar, Check, X, Car, Award, ChevronRight, Download, ExternalLink,
  ShieldCheck, AlertTriangle, Trash2
} from 'lucide-react';
import * as api from '../../services/api';

function DriverStatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  if (s === 'approved' || s === 'active') {
    return (
      <span className="badge rounded-pill px-2.5 py-1 fw-bold text-success border border-success-subtle d-inline-flex align-items-center gap-1" style={{ background: '#dcfce7', fontSize: '0.72rem' }}>
        <span className="rounded-circle bg-success" style={{ width: '6px', height: '6px' }}></span>
        {status === 'Active' ? 'Active' : 'Approved'}
      </span>
    );
  }
  if (s === 'rejected') {
    return (
      <span className="badge rounded-pill px-2.5 py-1 fw-bold text-danger border border-danger-subtle d-inline-flex align-items-center gap-1" style={{ background: '#fee2e2', fontSize: '0.72rem' }}>
        <span className="rounded-circle bg-danger" style={{ width: '6px', height: '6px' }}></span>
        Rejected
      </span>
    );
  }
  if (s === 'inactive') {
    return (
      <span className="badge rounded-pill px-2.5 py-1 fw-bold text-secondary border border-secondary-subtle d-inline-flex align-items-center gap-1" style={{ background: '#f1f5f9', fontSize: '0.72rem' }}>
        <span className="rounded-circle bg-secondary" style={{ width: '6px', height: '6px' }}></span>
        Inactive
      </span>
    );
  }
  return (
    <span className="badge rounded-pill px-2.5 py-1 fw-bold text-warning border border-warning-subtle d-inline-flex align-items-center gap-1" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.72rem' }}>
      <span className="rounded-circle bg-warning" style={{ width: '6px', height: '6px' }}></span>
      Pending Approval
    </span>
  );
}

function JobStatusBadge({ status }) {
  const s = (status || 'assigned').toLowerCase();
  if (s === 'completed') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-success border border-success-subtle" style={{ background: '#dcfce7', fontSize: '0.72rem' }}>🟢 Completed</span>;
  }
  if (s === 'in progress' || s === 'in_progress') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-warning border border-warning-subtle" style={{ background: '#ffedd5', color: '#c2410c', fontSize: '0.72rem' }}>🟠 In Progress</span>;
  }
  if (s === 'accepted') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-warning border border-warning-subtle" style={{ background: '#fef9c3', color: '#a16207', fontSize: '0.72rem' }}>🟡 Accepted</span>;
  }
  if (s === 'rejected') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-danger border border-danger-subtle" style={{ background: '#fee2e2', fontSize: '0.72rem' }}>🔴 Rejected</span>;
  }
  if (s === 'cancelled') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-secondary border border-secondary-subtle" style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.72rem' }}>⚫ Cancelled</span>;
  }
  return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-primary border border-primary-subtle" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem' }}>🔵 Assigned</span>;
}

export default function AdminDriverManagement({ currentUser, bookings = [], onRefresh }) {
  const [drivers, setDrivers] = useState([]);
  const [localBookings, setLocalBookings] = useState(bookings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleOpenOriginalDoc = (url, title) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          handleDownloadDoc(url, title);
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (e) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>${title || 'Document Preview'}</title><style>body{margin:0;background:#0d1b2e;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.6);}</style></head>
              <body><img src="${url}" alt="${title || 'Document'}" /></body>
            </html>
          `);
          win.document.close();
        }
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadDoc = (url, title) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'driver_document').toLowerCase().replace(/\\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Assign Driver Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      setLocalBookings(bookings);
    }
  }, [bookings]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const [data, freshBookings] = await Promise.all([
        api.fetchDrivers().catch(() => []),
        api.fetchBookings().catch(() => [])
      ]);
      setDrivers(data || []);
      if (Array.isArray(freshBookings) && freshBookings.length > 0) {
        setLocalBookings(freshBookings);
      }
      if (onRefresh) {
        onRefresh();
      }
      // If modal for driver details is currently open, refresh their data with fresh assignments
      if (selectedDriverDetails?.driver?.id) {
        try {
          const freshDetails = await api.fetchDriverDetails(selectedDriverDetails.driver.id);
          if (freshDetails) {
            setSelectedDriverDetails(freshDetails);
          }
        } catch (err) {}
      }
    } catch (e) {
      console.error('Failed to load drivers and bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    const interval = setInterval(loadDrivers, 3500);

    const handleSync = () => {
      loadDrivers();
    };

    window.addEventListener('tripgalileo-booking-sync', handleSync);
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('driver-assigned', handleSync);
    window.addEventListener('driver-status-updated', handleSync);

    let bcBookings;
    let bcNotifs;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = handleSync;
        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = handleSync;
      }
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('driver-assigned', handleSync);
      window.removeEventListener('driver-status-updated', handleSync);
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, []);

  const handleOpenDriverDetails = async (driver) => {
    setLoadingDetails(true);
    try {
      const data = await api.fetchDriverDetails(driver.id);
      setSelectedDriverDetails(data || { driver, assignments: [], stats: { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 } });
    } catch (e) {
      console.error('Failed to fetch driver details:', e);
      setSelectedDriverDetails({ driver, assignments: [], stats: { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 } });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (driverId, newStatus) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.updateDriverStatus(driverId, newStatus);
      setSuccessMsg(`Driver status updated to ${newStatus} successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadDrivers();
      if (selectedDriverDetails && selectedDriverDetails.driver.id === driverId) {
        setSelectedDriverDetails(prev => ({
          ...prev,
          driver: { ...prev.driver, status: newStatus }
        }));
      }
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update driver status.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDriver = async (driverId, driverName) => {
    if (!window.confirm(`Are you sure you want to permanently delete driver "${driverName || driverId}"? This will also unassign any associated active trips.`)) {
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.deleteDriver(driverId);
      setSuccessMsg(`Driver "${driverName || driverId}" was successfully deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (selectedDriverDetails && selectedDriverDetails.driver?.id === driverId) {
        setSelectedDriverDetails(null);
      }
      await loadDrivers();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to delete driver account.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessMonthlyPayment = async (driverId, monthlyData) => {
    if (!driverId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await api.processDriverMonthlyPayment({
        driver_id: driverId,
        month_year: monthlyData.month_year || new Date().toISOString().slice(0, 7),
        working_days: monthlyData.working_days || 0,
        paid_leave: monthlyData.paid_leave || 0,
        unpaid_leave: monthlyData.unpaid_leave || 0,
        payable_days: monthlyData.payable_days || 0,
        total_bookings: monthlyData.total_bookings || 0,
        status: 'PAID'
      });
      setSuccessMsg(res.message || 'Monthly salary payment processed successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
      const freshData = await api.fetchDriverDetails(driverId);
      if (freshData) {
        setSelectedDriverDetails(freshData);
      }
      await loadDrivers();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to process monthly payment.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForAssign || !assignDriverId) {
      setErrorMsg('Please select both a booking and an approved driver.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.assignDriver(selectedBookingForAssign.id, assignDriverId, assignNotes);
      setSuccessMsg(`Driver successfully assigned to booking #${selectedBookingForAssign.id}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAssignModal(false);
      setSelectedBookingForAssign(null);
      setAssignDriverId('');
      setAssignNotes('');
      await loadDrivers();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to assign driver.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalDriversCount = drivers.length;
  const pendingCount = drivers.filter(d => (d.status || '').toLowerCase() === 'pending').length;
  const activeCount = drivers.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').length;
  const totalCompletedJobs = drivers.reduce((sum, d) => sum + Number(d.completed_jobs || 0), 0);

  // Filtered List
  const filteredDrivers = drivers.filter(d => {
    const s = (d.status || 'pending').toLowerCase();
    const matchStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && s === 'pending') ||
      (statusFilter === 'approved' && (s === 'approved' || s === 'active')) ||
      (statusFilter === 'inactive' && (s === 'inactive' || s === 'rejected'));

    const q = search.toLowerCase();
    const matchSearch =
      String(d.name || '').toLowerCase().includes(q) ||
      String(d.phone || '').toLowerCase().includes(q) ||
      String(d.email || '').toLowerCase().includes(q) ||
      String(d.license_number || '').toLowerCase().includes(q) ||
      String(d.address || '').toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const approvedDriversList = drivers.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active');
  const isDriverServiceBooking = (b) => {
    if (!b) return false;
    if (b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) return true;
    const sType = String(b.driver_service_type || '').toUpperCase().trim();
    return sType === 'PICKUP' || sType === 'DROP' || sType === 'FULL';
  };
  const driverRequiredBookings = (localBookings || []).filter(isDriverServiceBooking);

  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold mb-0" style={{ color: '#0D1B2E' }}>Driver Management</h4>
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.75rem' }}>
              WOW GOA Fleet
            </span>
          </div>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Verify registered drivers, review verification documents, track real-time assignment history, and assign drivers to customer requests.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-3 fw-semibold"
            style={{ fontSize: '0.8rem' }}
            onClick={loadDrivers}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn fw-bold text-white d-flex align-items-center gap-2 rounded-3 shadow-sm"
            style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.85rem' }}
            onClick={() => setShowAssignModal(true)}
          >
            <Car size={15} /> Assign Driver
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} className="text-success flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.85rem' }}>
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #3b82f6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Total Drivers</div>
                <div className="fs-4 fw-bold text-dark mt-1">{totalDriversCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                <Users size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Pending Approval</div>
                <div className="fs-4 fw-bold text-warning mt-1">{pendingCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Approved / Active</div>
                <div className="fs-4 fw-bold text-success mt-1">{activeCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                <UserCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #8b5cf6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Jobs Completed</div>
                <div className="fs-4 fw-bold text-dark mt-1">{totalCompletedJobs}</div>
              </div>
              <div className="p-2.5 rounded-3" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <Award size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-3" style={{ background: '#fff' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search driver by name, phone, email, license..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-7 d-flex justify-content-md-end gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Drivers' },
              { id: 'pending', label: `Pending Approval (${pendingCount})` },
              { id: 'approved', label: 'Approved / Active' },
              { id: 'inactive', label: 'Inactive / Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm px-3 py-1 rounded-pill fw-semibold ${statusFilter === tab.id ? 'btn-dark' : 'btn-light border'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-3">Driver Profile</th>
                <th className="py-3">Contact & City</th>
                <th className="py-3">Documents Verification</th>
                <th className="py-3">Experience / Vehicle</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-center">Assigned Jobs</th>
                <th className="pe-3 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Users size={36} className="text-muted opacity-50 mb-2" />
                    <div>No drivers found matching current filters.</div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(d => {
                  const initial = (d.name?.[0] || 'D').toUpperCase();
                  const isPending = (d.status || '').toLowerCase() === 'pending';
                  const isApproved = (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active';

                  return (
                    <tr key={d.id}>
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2.5">
                          {d.profile_photo ? (
                            <img
                              src={d.profile_photo}
                              alt={d.name}
                              className="rounded-circle object-fit-cover shadow-sm flex-shrink-0"
                              style={{ width: '38px', height: '38px', border: '2px solid #FF6333' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark flex-shrink-0"
                              style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', fontSize: '14px' }}
                            >
                              {initial}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold text-dark">{d.name}</div>
                            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                              Registered: {d.created_at ? String(d.created_at).slice(0, 10) : 'Recent'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1.5 text-dark fw-semibold">
                          <Phone size={12} className="text-muted" />
                          <span>{d.phone || '—'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5 text-muted small" style={{ fontSize: '0.73rem' }}>
                          <Mail size={11} />
                          <span>{d.email || '—'}</span>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span
                            className={`badge rounded-pill px-2 py-0.5 fw-bold ${d.aadhaar_card ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                            style={{ fontSize: '0.67rem', cursor: d.aadhaar_card ? 'pointer' : 'default' }}
                            onClick={() => d.aadhaar_card && setPreviewDoc({ title: 'Aadhaar Card', url: d.aadhaar_card, driverName: d.name })}
                          >
                            Aadhaar {d.aadhaar_card ? '✅' : '❌'}
                          </span>
                          <span
                            className={`badge rounded-pill px-2 py-0.5 fw-bold ${d.pan_card ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                            style={{ fontSize: '0.67rem', cursor: d.pan_card ? 'pointer' : 'default' }}
                            onClick={() => d.pan_card && setPreviewDoc({ title: 'PAN Card', url: d.pan_card, driverName: d.name })}
                          >
                            PAN {d.pan_card ? '✅' : '❌'}
                          </span>
                          <span
                            className={`badge rounded-pill px-2 py-0.5 fw-bold ${d.license_card || d.license_number ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                            style={{ fontSize: '0.67rem', cursor: d.license_card ? 'pointer' : 'default' }}
                            onClick={() => d.license_card && setPreviewDoc({ title: 'Driving Licence', url: d.license_card, driverName: d.name, licenseNumber: d.license_number })}
                          >
                            DL {d.license_card || d.license_number ? '✅' : '❌'}
                          </span>
                        </div>
                        {d.license_number && (
                          <div className="text-muted small mt-0.5 font-monospace" style={{ fontSize: '0.7rem' }}>
                            {d.license_number}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }} title={d.experience_years || 'Local Experience'}>
                          {d.experience_years || 'Standard Experience'}
                        </div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '180px', fontSize: '0.72rem' }} title={d.vehicle_details || 'Company Provided / Private Vehicle'}>
                          {d.vehicle_details || 'Commercial Fleet'}
                        </div>
                      </td>

                      <td>
                        <DriverStatusBadge status={d.status} />
                      </td>

                      <td className="text-center">
                        <span className="badge rounded-pill bg-light text-dark border px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                          {d.total_jobs || 0} Total ({d.completed_jobs || 0} Done)
                        </span>
                      </td>

                      <td className="pe-3 text-end">
                        <div className="btn-group btn-group-sm">
                          {/* 👁 Eye Icon for complete details & history */}
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1 fw-bold"
                            style={{ fontSize: '0.75rem' }}
                            title="View Driver Details & Complete Assignment History"
                            onClick={() => handleOpenDriverDetails(d)}
                          >
                            <Eye size={14} className="text-primary" />
                            <span>Details</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                title="Approve Driver"
                                disabled={actionLoading}
                                onClick={() => handleUpdateStatus(d.id, 'Approved')}
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                title="Reject Driver"
                                disabled={actionLoading}
                                onClick={() => handleUpdateStatus(d.id, 'Rejected')}
                              >
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              className={`btn btn-sm ${d.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              title={d.status === 'Active' ? 'Deactivate Driver' : 'Set as Active'}
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(d.id, d.status === 'Active' ? 'Inactive' : 'Active')}
                            >
                              {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            title="Delete Driver Account"
                            disabled={actionLoading}
                            onClick={() => handleDeleteDriver(d.id, d.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 👁 DRIVER EYE DETAILS & ASSIGNMENT TRACKING MODAL                         */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {selectedDriverDetails && (
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,25,44,0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}
          onClick={() => setSelectedDriverDetails(null)}
        >
          <div
            className="bg-white rounded-3 shadow-lg overflow-hidden animate-fade-in-up"
            style={{ width: '920px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 text-white" style={{ background: '#0D1B2E' }}>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
                  style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', fontSize: '16px' }}
                >
                  {(selectedDriverDetails.driver?.name?.[0] || 'D').toUpperCase()}
                </div>
                <div>
                  <h5 className="fw-bold mb-0 text-white">{selectedDriverDetails.driver?.name}</h5>
                  <div className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                    Driver ID: <span className="font-monospace text-warning">{selectedDriverDetails.driver?.id}</span> • Status: <span className="text-success fw-bold">{selectedDriverDetails.driver?.status}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-white-50 p-0 border-0"
                onClick={() => setSelectedDriverDetails(null)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-auto flex-grow-1" style={{ background: '#f8fafc' }}>
              {/* Top Stats Cards */}
              <div className="row g-2.5 mb-4">
                <div className="col-6 col-md-2.4 col-lg">
                  <div className="card border-0 shadow-sm p-2.5 rounded-3 text-center" style={{ background: '#fff' }}>
                    <div className="text-muted small fw-semibold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Assigned</div>
                    <div className="fs-5 fw-bold text-dark mt-0.5">{selectedDriverDetails.stats?.total || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-2.4 col-lg">
                  <div className="card border-0 shadow-sm p-2.5 rounded-3 text-center" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
                    <div className="text-success small fw-semibold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Completed ✅</div>
                    <div className="fs-5 fw-bold text-success mt-0.5">{selectedDriverDetails.stats?.completed || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-2.4 col-lg">
                  <div className="card border-0 shadow-sm p-2.5 rounded-3 text-center" style={{ background: '#ffedd5', border: '1px solid #fdba74' }}>
                    <div className="small fw-semibold" style={{ color: '#c2410c', fontSize: '0.7rem', textTransform: 'uppercase' }}>In Progress 🟠</div>
                    <div className="fs-5 fw-bold mt-0.5" style={{ color: '#c2410c' }}>{selectedDriverDetails.stats?.in_progress || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-2.4 col-lg">
                  <div className="card border-0 shadow-sm p-2.5 rounded-3 text-center" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
                    <div className="small fw-semibold" style={{ color: '#854d0e', fontSize: '0.7rem', textTransform: 'uppercase' }}>Pending / Assigned 🟡</div>
                    <div className="fs-5 fw-bold mt-0.5" style={{ color: '#854d0e' }}>{selectedDriverDetails.stats?.pending || 0}</div>
                  </div>
                </div>
                <div className="col-6 col-md-2.4 col-lg">
                  <div className="card border-0 shadow-sm p-2.5 rounded-3 text-center" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                    <div className="text-danger small fw-semibold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Cancelled / Rej 🔴</div>
                    <div className="fs-5 fw-bold text-danger mt-0.5">{selectedDriverDetails.stats?.cancelled || 0}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Driver Salary & Settlement Card (₹800/Working Day) */}
              {(() => {
                const ms = selectedDriverDetails.monthly_salary || {};
                const dRate = ms.daily_rate || 800;
                const wDays = ms.working_days || 0;
                const pLeave = ms.paid_leave || 0;
                const uLeave = ms.unpaid_leave || 0;
                const payDays = ms.payable_days || (wDays + pLeave);
                const tBookings = ms.total_bookings || selectedDriverDetails.assignments?.length || 0;
                const mPay = ms.monthly_pay || (payDays * dRate);
                const pStatus = (ms.payment_status || 'Pending').toUpperCase();
                const isPaid = pStatus === 'PAID';

                return (
                  <div className="card border-0 shadow-sm rounded-3 p-3.5 mb-4" style={{ background: '#fff', borderLeft: '4px solid #FF6333' }}>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                          <Calendar size={18} className="text-primary" />
                          Driver Monthly Salary & Settlement — {ms.month_label || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h6>
                        <div className="text-muted small mt-0.5" style={{ fontSize: '0.75rem' }}>
                          Rule: Driver earns <strong>₹800 per unique working day</strong>. Completed bookings ({tBookings}) are informational only and do NOT multiply salary.
                        </div>
                      </div>
                      <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle fw-bold px-3 py-1.5" style={{ fontSize: '0.75rem' }}>
                        Fixed Daily Rate: ₹800 / Working Day
                      </span>
                    </div>

                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="row g-3 text-center align-items-center">
                        <div className="col-6 col-md-2 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Daily Rate</div>
                          <div className="fs-5 fw-bold text-dark mt-1">₹{dRate}</div>
                        </div>
                        <div className="col-6 col-md-2 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Working Days</div>
                          <div className="fs-5 fw-bold text-primary mt-1">{wDays}</div>
                        </div>
                        <div className="col-4 col-md-1.5 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Paid Leave</div>
                          <div className="fs-5 fw-bold text-success mt-1">{pLeave}</div>
                        </div>
                        <div className="col-4 col-md-1.5 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Unpaid Leave</div>
                          <div className="fs-5 fw-bold text-muted mt-1">{uLeave}</div>
                        </div>
                        <div className="col-4 col-md-1.5 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Payable Days</div>
                          <div className="fs-5 fw-bold text-dark mt-1">{payDays}</div>
                        </div>
                        <div className="col-6 col-md-1.5 border-end">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Total Bookings</div>
                          <div className="fs-5 fw-bold text-secondary mt-1">{tBookings} <span className="small text-muted fw-normal" style={{ fontSize: '0.65rem' }}>(Info)</span></div>
                        </div>
                        <div className="col-6 col-md-2">
                          <div className="text-muted small fw-semibold" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Monthly Driver Pay</div>
                          <div className="fs-5 fw-bold text-success mt-1">₹{mPay.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted fw-semibold">Payment Status:</span>
                          <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${isPaid ? 'bg-success text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.78rem' }}>
                            {isPaid ? `PAID (${ms.paid_date || 'Processed'} • Ref: ${ms.payment_reference || 'SAL-OFFICIAL'})` : 'PENDING'}
                          </span>
                        </div>

                        {!isPaid ? (
                          <button
                            type="button"
                            className="btn btn-sm text-white fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
                            style={{ background: 'linear-gradient(90deg,#16a34a,#15803d)', fontSize: '0.8rem' }}
                            onClick={() => handleProcessMonthlyPayment(selectedDriverDetails.driver?.id, ms)}
                            disabled={actionLoading}
                          >
                            💰 PROCESS MONTHLY PAYMENT (₹{mPay.toLocaleString()})
                          </button>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 fw-semibold" style={{ fontSize: '0.75rem' }}>
                            ✅ Monthly Settlement Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Driver Details & Verification Documents Box */}
              <div className="card border-0 shadow-sm rounded-3 p-3.5 mb-4" style={{ background: '#fff' }}>
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                  <ShieldCheck size={16} className="text-primary" /> Driver Profile & Verification Information
                </h6>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 rounded-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">Full Name:</span>
                        <span className="fw-bold text-dark small">{selectedDriverDetails.driver?.name}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">Mobile Number:</span>
                        <span className="fw-bold text-dark small">{selectedDriverDetails.driver?.phone}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">Email Address:</span>
                        <span className="fw-bold text-dark small">{selectedDriverDetails.driver?.email}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                        <span className="text-muted small">Residential Address:</span>
                        <span className="fw-bold text-dark small text-end" style={{ maxWidth: '60%' }}>{selectedDriverDetails.driver?.address || 'Goa'}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span className="text-muted small">Experience / Vehicle:</span>
                        <span className="fw-bold text-dark small text-end">{selectedDriverDetails.driver?.experience_years || 'Experienced'} • {selectedDriverDetails.driver?.vehicle_details || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 rounded-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="fw-bold text-dark small mb-2">Uploaded Verification Documents</div>
                      
                      <div className="d-flex flex-column gap-2">
                        {/* Aadhaar */}
                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-white border">
                          <div className="d-flex align-items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            <span className="small fw-semibold">Aadhaar Card Verification</span>
                          </div>
                          {selectedDriverDetails.driver?.aadhaar_card ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0.5 px-2 fw-bold"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setPreviewDoc({ title: 'Aadhaar Card', url: selectedDriverDetails.driver.aadhaar_card, driverName: selectedDriverDetails.driver.name })}
                            >
                              <Eye size={12} className="me-1" /> View Document
                            </button>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.68rem' }}>Missing</span>
                          )}
                        </div>

                        {/* PAN */}
                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-white border">
                          <div className="d-flex align-items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            <span className="small fw-semibold">PAN Card Verification</span>
                          </div>
                          {selectedDriverDetails.driver?.pan_card ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0.5 px-2 fw-bold"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setPreviewDoc({ title: 'PAN Card', url: selectedDriverDetails.driver.pan_card, driverName: selectedDriverDetails.driver.name })}
                            >
                              <Eye size={12} className="me-1" /> View Document
                            </button>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.68rem' }}>Missing</span>
                          )}
                        </div>

                        {/* DL */}
                        <div className="d-flex align-items-center justify-content-between p-2 rounded bg-white border">
                          <div className="d-flex align-items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            <div>
                              <div className="small fw-semibold">Driving Licence Verification</div>
                              {selectedDriverDetails.driver?.license_number && (
                                <div className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{selectedDriverDetails.driver.license_number}</div>
                              )}
                            </div>
                          </div>
                          {selectedDriverDetails.driver?.license_card ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0.5 px-2 fw-bold"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setPreviewDoc({ title: 'Driving Licence', url: selectedDriverDetails.driver.license_card, driverName: selectedDriverDetails.driver.name, licenseNumber: selectedDriverDetails.driver.license_number })}
                            >
                              <Eye size={12} className="me-1" /> View Document
                            </button>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.68rem' }}>Missing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment History Section */}
              <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ background: '#fff' }}>
                <div className="px-3.5 py-3 border-bottom d-flex align-items-center justify-content-between" style={{ background: '#f8fafc' }}>
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Car size={16} className="text-primary" />
                    Complete Assignment History ({selectedDriverDetails.assignments?.length || 0})
                  </h6>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    All customer-requested trips assigned to this driver
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th className="ps-3 py-2.5">Booking ID</th>
                        <th className="py-2.5">Customer Details</th>
                        <th className="py-2.5">Pickup Location</th>
                        <th className="py-2.5">Drop / Trip Item</th>
                        <th className="py-2.5">Date & Time</th>
                        <th className="py-2.5">Assigned Date</th>
                        <th className="pe-3 py-2.5 text-end">Job Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedDriverDetails.assignments || selectedDriverDetails.assignments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            <Car size={28} className="text-muted opacity-40 mb-1.5" />
                            <div>No jobs have been assigned to this driver yet.</div>
                          </td>
                        </tr>
                      ) : (
                        selectedDriverDetails.assignments.map(a => (
                          <tr key={a.booking_id || a.id}>
                            <td className="ps-3 fw-bold font-monospace text-dark">
                              #{a.booking_id || a.id}
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{a.customer_name || 'Customer'}</div>
                              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>{a.customer_phone || '—'}</div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1 text-muted">
                                <MapPin size={11} /> {a.pickup_loc || 'Goa Delivery'}
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold text-truncate" style={{ maxWidth: '160px' }}>{a.item_name || 'Tour Package'}</div>
                            </td>
                            <td>
                              <div className="small fw-semibold">{a.pickup_date || '—'}</div>
                              <div className="text-muted small" style={{ fontSize: '0.7rem' }}>{a.pickup_time || '10:00 AM'}</div>
                            </td>
                            <td>
                              <div className="small text-muted">{a.driver_assigned_at ? String(a.driver_assigned_at).slice(0, 16) : '—'}</div>
                            </td>
                            <td className="pe-3 text-end">
                              <JobStatusBadge status={a.driver_job_status || 'Assigned'} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-light border-top">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Update Status:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', fontSize: '0.78rem' }}
                  value={selectedDriverDetails.driver?.status || 'Pending'}
                  onChange={e => handleUpdateStatus(selectedDriverDetails.driver.id, e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="Pending">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm px-3 fw-bold d-inline-flex align-items-center gap-1.5"
                  disabled={actionLoading}
                  onClick={() => handleDeleteDriver(selectedDriverDetails.driver.id, selectedDriverDetails.driver.name)}
                >
                  <Trash2 size={13} /> Delete Account
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4 fw-bold"
                  onClick={() => setSelectedDriverDetails(null)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* DOCUMENT PREVIEW MODAL                                                    */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {previewDoc && (
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1080 }}
          onClick={() => setPreviewDoc(null)}
        >
          <div className="bg-white rounded-3 shadow-lg p-3 text-center animate-fade-in" style={{ maxWidth: '600px', width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div className="text-start">
                <h6 className="fw-bold mb-0 text-dark">{previewDoc.title} Verification</h6>
                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{previewDoc.driverName} {previewDoc.licenseNumber ? `• ${previewDoc.licenseNumber}` : ''}</div>
              </div>
              <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setPreviewDoc(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-2 rounded bg-light mb-3" style={{ maxHeight: '420px', overflow: 'hidden' }}>
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="img-fluid rounded object-fit-contain"
                style={{ maxHeight: '400px', width: '100%' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="d-flex justify-content-end gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-semibold d-flex align-items-center gap-1"
                onClick={() => handleDownloadDoc(previewDoc.url, previewDoc.title)}
                title="Download this document"
              >
                <Download size={13} /> Download
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1"
                onClick={() => handleOpenOriginalDoc(previewDoc.url, previewDoc.title)}
                title="Open image in new tab"
              >
                <ExternalLink size={13} className="me-1" /> Open Original
              </button>
              <button type="button" className="btn btn-sm btn-dark px-3 fw-bold" onClick={() => setPreviewDoc(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* ASSIGN DRIVER TO BOOKING MODAL                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,25,44,0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}
          onClick={() => setShowAssignModal(false)}
        >
          <div className="bg-white rounded-3 shadow-lg overflow-hidden animate-fade-in-up" style={{ width: '560px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3 text-white" style={{ background: '#0D1B2E' }}>
              <div className="d-flex align-items-center gap-2">
                <Car size={18} className="text-warning" />
                <h5 className="fw-bold mb-0 text-white">Manual Driver Assignment</h5>
              </div>
              <button type="button" className="btn btn-sm btn-link text-white-50 p-0 border-0" onClick={() => setShowAssignModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-4">
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  1. Select Customer Booking (Requires Driver)
                </label>
                {driverRequiredBookings.length === 0 ? (
                  <div className="alert alert-info py-2 px-3 small mb-0">
                    No customer bookings currently have driver service requested. Select from all active bookings:
                    <select
                      className="form-select form-select-sm mt-2 fw-semibold"
                      value={selectedBookingForAssign?.id || ''}
                      onChange={e => {
                        const found = (localBookings || []).find(b => String(b.id) === e.target.value);
                        setSelectedBookingForAssign(found || null);
                      }}
                      required
                    >
                      <option value="">-- Choose Booking --</option>
                      {(localBookings || []).slice(0, 30).map(b => (
                        <option key={b.id} value={b.id}>
                          #{b.id} — {b.name || b.customer_name || 'Customer'} ({b.item_name || 'Trip'} • {b.pickup_date || 'Date'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={selectedBookingForAssign?.id || ''}
                    onChange={e => {
                      const found = (localBookings || []).find(b => String(b.id) === e.target.value);
                      setSelectedBookingForAssign(found || null);
                    }}
                    required
                  >
                    <option value="">-- Select Customer-Requested Booking --</option>
                    {driverRequiredBookings.map(b => {
                      const sType = String(b.driver_service_type || '').toUpperCase().trim() || 'FULL';
                      return (
                        <option key={b.id} value={b.id}>
                          🚗 #{b.id} — {b.name || b.customer_name || 'Customer'} ({b.item_name} • {sType} Service • {b.pickup_date || 'Date'})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {selectedBookingForAssign && (
                <div className="p-3 rounded bg-light border mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Customer:</span>
                    <span className="fw-bold">{selectedBookingForAssign.name || selectedBookingForAssign.customer_name} ({selectedBookingForAssign.phone})</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Driver Service:</span>
                    <span className="fw-bold text-primary">{selectedBookingForAssign.driver_service_type || (selectedBookingForAssign.driver_required ? 'FULL' : 'Standard')} Service</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Pickup Location:</span>
                    <span className="fw-bold">{selectedBookingForAssign.pickup_loc || 'Goa'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Travel Date / Time:</span>
                    <span className="fw-bold">{selectedBookingForAssign.pickup_date || '—'} {selectedBookingForAssign.pickup_time ? `@ ${selectedBookingForAssign.pickup_time}` : ''}</span>
                  </div>
                  {selectedBookingForAssign.assigned_driver_id && (
                    <div className="d-flex justify-content-between mt-2 pt-2 border-top text-warning">
                      <span>Current Driver:</span>
                      <span className="fw-bold">ID #{selectedBookingForAssign.assigned_driver_id} ({selectedBookingForAssign.driver_job_status || 'Assigned'})</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  2. Select Approved & Active Driver
                </label>
                {approvedDriversList.length === 0 ? (
                  <div className="alert alert-warning py-2 px-3 small">
                    No approved drivers available. Please approve pending drivers first.
                  </div>
                ) : (
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={assignDriverId}
                    onChange={e => setAssignDriverId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Approved Driver --</option>
                    {approvedDriversList.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone} • {d.vehicle_details || 'Commercial Fleet'} • Status: {d.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary mb-1">
                  3. Assignment Instructions / Notes (Optional)
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="e.g. Meet customer at Dabolim Airport with name board..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light btn-sm px-3 fw-bold" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm px-4 fw-bold text-white shadow-sm"
                  style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}
                  disabled={actionLoading || !assignDriverId || !selectedBookingForAssign}
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
