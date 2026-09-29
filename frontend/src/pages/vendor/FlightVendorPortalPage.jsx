import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, LogOut, LayoutDashboard, Plane, PlusCircle,
  BookOpen, BarChart2, Settings, UserCircle, Activity,
  Wallet, Tag, DollarSign, ChevronDown, ChevronRight, Menu,
  Trash2, Edit2, AlertCircle, CheckCircle, X, Users, Search,
  Luggage, Clock, ShieldCheck, TrendingUp, Phone, Mail
} from 'lucide-react';
import VendorWallet from '../../components/vendor/VendorWallet';
import * as api from '../../services/api';
import { calculateFlightDuration } from '../../utils/flightHelper';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }
    ]
  },
  {
    label: 'Fleet Management',
    items: [
      { id: 'flights', label: 'My Routes', icon: <Plane size={15} /> },
      { id: 'add_flight', label: 'Add Route', icon: <PlusCircle size={15} /> },
      { id: 'pricing', label: 'Pricing & Fares', icon: <Tag size={15} /> },
    ]
  },
  {
    label: 'Bookings',
    items: [
      { id: 'all_bookings', label: 'All Bookings', icon: <BookOpen size={15} /> },
      { id: 'passengers', label: 'Passenger Directory', icon: <Users size={15} /> },
    ]
  },
  {
    label: 'Finance',
    items: [
      { id: 'wallet', label: 'Platform Wallet', icon: <Wallet size={15} /> },
      { id: 'earnings', label: 'Earnings & Reports', icon: <BarChart2 size={15} /> },
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Vendor Profile', icon: <UserCircle size={15} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
      { id: 'activity_log', label: 'Activity Log', icon: <Activity size={15} /> },
    ]
  }
];

const PAGE_TITLES = {
  dashboard: 'Flight Dashboard',
  flights: 'My Routes',
  add_flight: 'Add New Route',
  pricing: 'Pricing & Fares',
  all_bookings: 'All Bookings',
  passengers: 'Passenger Directory',
  wallet: 'Platform Wallet',
  earnings: 'Earnings & Reports',
  profile: 'Vendor Profile',
  settings: 'Settings',
  activity_log: 'Activity Log',
};

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : group.items.some(i => i.id === activeTab));

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0"
        style={{
          background: 'transparent',
          fontSize: '0.62rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(255,255,255,0.4)'
        }}
      >
        <span>{group.label}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1 mt-1">
          {group.items.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1"
                style={{
                  fontSize: '0.83rem',
                  background: isActive ? 'linear-gradient(90deg,#00B8D9,#0090b8)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  boxShadow: isActive ? '0 4px 12px rgba(0,184,217,0.3)' : 'none',
                  fontWeight: isActive ? 700 : 400,
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ color: isActive ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
                <span className="text-truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="rounded-3 p-3 h-100 position-relative overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        minWidth: 0
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div
          className="rounded-2 p-2 d-flex align-items-center justify-content-center"
          style={{ background: `${color}18`, color, width: '38px', height: '38px', flexShrink: 0 }}
        >
          {icon}
        </div>
      </div>
      <div className="fw-bold text-truncate" style={{ fontSize: '1.3rem', color: '#0D1B2E' }} title={String(value)}>
        {value}
      </div>
      <div className="text-truncate" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

function FlightDashboard({ flights, bookings, onNavigate }) {
  const revenue = bookings.reduce((s, b) => s + (parseFloat(b.total_paid || b.total_amount || b.amount_paid || b.amount || b.price || 0) || 0), 0);

  return (
    <div className="p-3 p-md-4">
      {/* Banner */}
      <div
        className="rounded-4 p-3 p-md-4 mb-4 text-white shadow-sm"
        style={{
          background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)',
          border: '1px solid rgba(0,184,217,0.2)'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '52px', height: '52px', background: 'rgba(0,184,217,0.15)', border: '1px solid rgba(0,184,217,0.3)' }}
          >
            <Plane size={26} style={{ color: '#00B8D9' }} />
          </div>
          <div className="min-w-0">
            <h4 className="fw-bold mb-1 text-truncate" style={{ fontSize: '1.25rem' }}>Flight Operations Dashboard</h4>
            <p className="mb-0 text-truncate" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>
              Real-time monitoring of airline schedules, reservations, passengers, and platform wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard label="Active Routes" value={flights.length} color="#00B8D9" icon={<Plane size={18} />} />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="Total Bookings" value={bookings.length} color="#059669" icon={<BookOpen size={18} />} />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="Total Revenue" value={`₹${Math.round(revenue).toLocaleString('en-IN')}`} color="#d97706" icon={<DollarSign size={18} />} />
        </div>
        <div className="col-6 col-md-3">
          <StatCard label="Passengers" value={bookings.length} color="#7c3aed" icon={<Users size={18} />} />
        </div>
      </div>

      {/* Actions and Recent Reservations */}
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="rounded-3 p-3 p-md-4 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ fontSize: '13px', color: '#0D1B2E' }}>Quick Actions</h6>
            <div className="d-flex flex-column gap-2">
              <button
                className="btn d-flex align-items-center justify-content-between fw-bold text-white px-3 py-2.5"
                style={{ background: 'linear-gradient(90deg,#00B8D9,#0090b8)', fontSize: '0.85rem', borderRadius: '8px' }}
                onClick={() => onNavigate('add_flight')}
              >
                <span className="d-flex align-items-center gap-2"><PlusCircle size={16} /> Add New Flight Route</span>
                <ChevronRight size={14} />
              </button>
              <button
                className="btn d-flex align-items-center justify-content-between fw-bold px-3 py-2.5"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.85rem', borderRadius: '8px' }}
                onClick={() => onNavigate('all_bookings')}
              >
                <span className="d-flex align-items-center gap-2"><BookOpen size={16} /> View All Bookings</span>
                <ChevronRight size={14} />
              </button>
              <button
                className="btn d-flex align-items-center justify-content-between fw-bold px-3 py-2.5"
                style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', fontSize: '0.85rem', borderRadius: '8px' }}
                onClick={() => onNavigate('pricing')}
              >
                <span className="d-flex align-items-center gap-2"><Tag size={16} /> Manage Fares &amp; Markups</span>
                <ChevronRight size={14} />
              </button>
              <button
                className="btn d-flex align-items-center justify-content-between fw-bold px-3 py-2.5"
                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.85rem', borderRadius: '8px' }}
                onClick={() => onNavigate('wallet')}
              >
                <span className="d-flex align-items-center gap-2"><Wallet size={16} /> Platform Wallet &amp; Top-up</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="rounded-3 p-3 p-md-4 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px', color: '#0D1B2E' }}>Recent Reservations</h6>
              <button
                className="btn btn-sm text-primary p-0 fw-bold"
                style={{ fontSize: '0.75rem', background: 'transparent' }}
                onClick={() => onNavigate('all_bookings')}
              >
                View all ({bookings.length})
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <Plane size={32} className="mb-2 opacity-25" />
                <p className="mb-0" style={{ fontSize: '0.82rem' }}>No flight reservations received yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {bookings.slice(0, 5).map((b, i) => (
                  <div
                    key={b.id || i}
                    className="d-flex justify-content-between align-items-center p-2 rounded-2 border"
                    style={{ fontSize: '0.82rem', borderColor: 'rgba(0,0,0,0.06)', background: '#fafbfc' }}
                  >
                    <div className="min-w-0 me-2">
                      <div className="fw-bold text-truncate" style={{ color: '#0D1B2E' }}>
                        {b.name || 'Passenger'}
                        <span className="badge ms-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>
                          #{b.id}
                        </span>
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                        {b.item_name || 'Scheduled Flight'} {b.phone ? `• ${b.phone}` : ''}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold" style={{ color: '#16a34a' }}>
                        ₹{Number(b.total_paid || b.total_amount || b.amount_paid || b.amount || b.price || 0).toLocaleString('en-IN')}
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-pill fw-bold"
                        style={{
                          background: (b.status === 'Confirmed' || b.status === 'completed') ? '#dcfce7' : '#fef9c3',
                          color: (b.status === 'Confirmed' || b.status === 'completed') ? '#16a34a' : '#ca8a04',
                          fontSize: '0.65rem'
                        }}
                      >
                        {b.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyRoutes({ flights, onDelete, onEditClick, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return flights;
    const q = searchTerm.toLowerCase();
    return flights.filter(f =>
      (f.airline || '').toLowerCase().includes(q) ||
      (f.flight_number || '').toLowerCase().includes(q) ||
      (f.from_loc || '').toLowerCase().includes(q) ||
      (f.to_loc || '').toLowerCase().includes(q)
    );
  }, [flights, searchTerm]);

  return (
    <div className="p-3 p-md-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>
            Flight Routes &amp; Schedules
            <span className="badge ms-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>
              {flights.length}
            </span>
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Manage your active flight route inventory and seat prices.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn fw-bold text-white d-flex align-items-center gap-2 px-3 py-2"
            style={{ background: 'linear-gradient(90deg,#00B8D9,#0090b8)', fontSize: '0.82rem', borderRadius: '8px' }}
            onClick={() => onNavigate('add_flight')}
          >
            <PlusCircle size={15} /> Add Route
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-3 rounded-3" style={{ background: '#fff' }}>
        <div className="position-relative">
          <Search size={16} className="position-absolute" style={{ left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control form-control-sm ps-5"
            placeholder="Search by airline, flight number (e.g. 6E-204), or airport code (e.g. GOI)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ fontSize: '0.83rem', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Plane size={40} className="mb-3 opacity-25" />
            <p className="mb-2">No matching flight routes found.</p>
            {flights.length === 0 && (
              <button
                className="btn btn-sm text-white fw-bold px-3 py-1.5"
                style={{ background: '#00B8D9', borderRadius: '6px' }}
                onClick={() => onNavigate('add_flight')}
              >
                Add Your First Route
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table align-middle mb-0" style={{ fontSize: '0.83rem', minWidth: '680px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Airline', 'Flight No.', 'Route', 'Schedule', 'Base Fare', 'Seats', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="py-3 px-3 fw-bold text-nowrap"
                      style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <td className="px-3 py-2.5 fw-bold" style={{ color: '#0D1B2E' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded p-1" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                          <Plane size={14} />
                        </div>
                        <span>{f.airline}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="badge text-uppercase" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>
                        {f.flight_number}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-nowrap">
                      <span className="fw-bold" style={{ color: '#00B8D9' }}>{f.from_loc}</span>
                      <span className="mx-2 text-muted">→</span>
                      <span className="fw-bold" style={{ color: '#00B8D9' }}>{f.to_loc}</span>
                    </td>
                    <td className="px-3 py-2.5 text-nowrap">
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        <span className="text-muted">Dep:</span> {f.departure_time || 'N/A'} • <span className="text-muted">Arr:</span> {f.arrival_time || 'N/A'}
                      </div>
                      {f.duration && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          <Clock size={11} className="me-1 inline" />Dur: {f.duration}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 fw-bold text-nowrap" style={{ color: '#059669' }}>
                      ₹{Number(f.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-muted" style={{ fontSize: '0.78rem' }}>
                      {f.seats || 180}
                    </td>
                    <td className="px-3 py-2.5 text-nowrap">
                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm d-inline-flex align-items-center gap-1"
                          style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', borderRadius: '6px', padding: '4px 8px' }}
                          onClick={() => onEditClick(f)}
                          title="Edit Route"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm d-inline-flex align-items-center gap-1"
                          style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px', padding: '4px 8px' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete flight ${f.flight_number} (${f.airline})?`)) {
                              onDelete(f.id);
                            }
                          }}
                          title="Delete Route"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const BLANK_ROUTE = {
  airline: '',
  flight_number: '',
  from_loc: 'GOI',
  to_loc: 'DEL',
  departure_time: '',
  arrival_time: '',
  price: '',
  duration: '',
  seats: 180
};

function AddRouteForm({ onAdd, onUpdate, editingFlight, onCancelEdit, onNavigate, currentUser }) {
  const [form, setForm] = useState(BLANK_ROUTE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (editingFlight) {
      setForm({
        airline: editingFlight.airline || '',
        flight_number: editingFlight.flight_number || '',
        from_loc: (editingFlight.from_loc || 'GOI').toUpperCase(),
        to_loc: (editingFlight.to_loc || 'DEL').toUpperCase(),
        departure_time: editingFlight.departure_time || '',
        arrival_time: editingFlight.arrival_time || '',
        price: editingFlight.price || '',
        duration: editingFlight.duration || '',
        seats: editingFlight.seats || 180
      });
    } else {
      setForm(BLANK_ROUTE);
    }
    setError('');
  }, [editingFlight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const air = form.airline.trim();
    const fn = form.flight_number.trim().toUpperCase();
    const fl = form.from_loc.trim().toUpperCase();
    const tl = form.to_loc.trim().toUpperCase();
    const pr = Number(form.price);
    const st = Number(form.seats);

    if (!air || !fn || !form.price) {
      setError('Airline Name, Flight Number, and Base Fare are strictly required.');
      return;
    }
    if (isNaN(pr) || pr <= 0) {
      setError('Base Fare must be a valid positive number greater than zero.');
      return;
    }
    if (isNaN(st) || st <= 0) {
      setError('Total seats must be a positive number greater than zero.');
      return;
    }
    if (fl.length !== 3 || tl.length !== 3) {
      setError('Origin and destination must be valid 3-letter IATA airport codes.');
      return;
    }
    if (fl === tl) {
      setError('Origin and destination airport codes cannot be identical.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        airline: air,
        flight_number: fn,
        from_loc: fl,
        to_loc: tl,
        departure_time: form.departure_time,
        arrival_time: form.arrival_time,
        price: pr,
        duration: form.duration.trim() || calculateFlightDuration(form.departure_time, form.arrival_time) || '2h 00m',
        seats: st || 180,
        vendor_id: currentUser?.id || 'admin'
      };

      if (editingFlight) {
        await onUpdate(editingFlight.id, payload);
        setSuccessMsg('Route updated successfully!');
      } else {
        await onAdd(payload);
        setSuccessMsg('Route listed successfully!');
      }
      setTimeout(() => {
        onNavigate('flights');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to save route. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key, value) => {
    if (error) setError('');
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'departure_time' || key === 'arrival_time') {
        const dep = key === 'departure_time' ? value : prev.departure_time;
        const arr = key === 'arrival_time' ? value : prev.arrival_time;
        if (dep && arr) {
          const autoDur = calculateFlightDuration(dep, arr);
          if (autoDur) next.duration = autoDur;
        }
      }
      return next;
    });
  };

  return (
    <div className="p-3 p-md-4">
      <div
        className="rounded-4 p-3 p-md-4 mb-4 shadow-sm"
        style={{ background: 'linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%)', border: '1px solid rgba(0,184,217,0.25)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <span
            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
            style={{ width: '48px', height: '48px', background: '#fff', color: '#00B8D9' }}
          >
            <Plane size={24} />
          </span>
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              {editingFlight ? `Edit Route (${editingFlight.flight_number})` : 'Add New Flight Route'}
            </h5>
            <p className="mb-0 text-secondary" style={{ fontSize: '0.82rem' }}>
              Configure airline details, schedule timings, and commercial seat fares.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3 p-3 p-md-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.85rem' }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.85rem' }}>
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Airline Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. IndiGo, Star Air, Air India"
                value={form.airline}
                onChange={e => updateField('airline', e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Flight Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 6E-204"
                value={form.flight_number}
                onChange={e => updateField('flight_number', e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                From (Origin Code)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. GOI"
                maxLength={4}
                value={form.from_loc}
                onChange={e => updateField('from_loc', e.target.value.toUpperCase())}
                required
              />
              <div className="form-text text-muted" style={{ fontSize: '0.68rem' }}>3-letter IATA code</div>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                To (Dest Code)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. DEL"
                maxLength={4}
                value={form.to_loc}
                onChange={e => updateField('to_loc', e.target.value.toUpperCase())}
                required
              />
              <div className="form-text text-muted" style={{ fontSize: '0.68rem' }}>3-letter IATA code</div>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Departure Time
              </label>
              <input
                type="time"
                className="form-control"
                value={form.departure_time}
                onChange={e => updateField('departure_time', e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Arrival Time
              </label>
              <input
                type="time"
                className="form-control"
                value={form.arrival_time}
                onChange={e => updateField('arrival_time', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Base Fare (₹) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g. 4500"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                required
              />
            </div>

            <div className="col-6 col-md-4">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fw-bold mb-0" style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Duration
                </label>
                {form.duration && form.departure_time && form.arrival_time && (
                  <span className="badge" style={{ fontSize: '0.66rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                    Auto-calculated
                  </span>
                )}
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 2h 15m"
                value={form.duration}
                onChange={e => updateField('duration', e.target.value)}
              />
              <div className="form-text text-muted" style={{ fontSize: '0.68rem' }}>
                Auto-calculated from departure & arrival (editable)
              </div>
            </div>

            <div className="col-6 col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>
                Total Seats
              </label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="180"
                value={form.seats}
                onChange={e => updateField('seats', e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn fw-bold text-white px-4 py-2"
              style={{ background: 'linear-gradient(90deg,#00B8D9,#0090b8)', borderRadius: '8px' }}
            >
              <CheckCircle size={16} className="me-1.5 inline" />
              {submitting ? 'Saving Route...' : editingFlight ? 'Update Route' : 'Publish Route'}
            </button>
            {editingFlight && (
              <button
                type="button"
                className="btn fw-bold px-4 py-2"
                style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '8px' }}
                onClick={onCancelEdit}
              >
                <X size={16} className="me-1 inline" /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function FlightBookings({ bookings, onUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.phone || '').includes(searchTerm) ||
        (b.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.flight_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.id || '').includes(searchTerm);

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      return (b.status || 'Pending').toUpperCase() === statusFilter;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      if (onUpdateStatus) {
        await onUpdateStatus(bookingId, newStatus);
      } else {
        await api.updateBookingStatus(bookingId, newStatus);
      }
      // Dispatch sync events
      window.dispatchEvent(new CustomEvent('new-booking-created'));
      window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId, status: newStatus } }));
      window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId, status: newStatus } }));
    } catch (err) {
      alert('Failed to update booking status: ' + (err.message || 'Network error'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-3 p-md-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>
            Flight Bookings Ledger
            <span className="badge ms-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem' }}>
              {bookings.length}
            </span>
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>View passenger manifests and manage reservations.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-3 rounded-3" style={{ background: '#fff' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <Search size={16} className="position-absolute" style={{ left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search passenger name, phone, or booking ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.83rem', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="d-flex flex-wrap gap-1">
              {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm px-2.5 py-1 rounded-pill fw-bold ${statusFilter === st ? 'text-white' : 'text-secondary'}`}
                  style={{
                    fontSize: '0.72rem',
                    background: statusFilter === st ? '#00B8D9' : '#f1f5f9',
                    border: 'none'
                  }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BookOpen size={40} className="mb-3 opacity-25" />
            <p className="mb-0">No flight reservations match your criteria.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table align-middle mb-0" style={{ fontSize: '0.83rem', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Booking ID', 'Passenger', 'Contact', 'Flight / Route', 'Paid (₹)', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="py-3 px-3 fw-bold text-nowrap"
                      style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const s = (b.status || 'Pending').toLowerCase();
                  let badgeBg = '#fef9c3';
                  let badgeColor = '#ca8a04';
                  if (s === 'confirmed') { badgeBg = '#dbeafe'; badgeColor = '#1e40af'; }
                  if (s === 'completed') { badgeBg = '#dcfce7'; badgeColor = '#15803d'; }
                  if (s === 'cancelled' || s === 'rejected') { badgeBg = '#fee2e2'; badgeColor = '#b91c1c'; }

                  return (
                    <tr key={b.id} className="border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-3 py-2.5 fw-bold" style={{ color: '#0369a1' }}>#{b.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="fw-bold" style={{ color: '#0D1B2E' }}>{b.name || 'Passenger'}</div>
                        {b.email && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.email}</div>}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {b.phone || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 fw-bold" style={{ color: '#00B8D9' }}>
                        {b.item_name || 'Scheduled Route'}
                      </td>
                      <td className="px-3 py-2.5 fw-bold text-nowrap" style={{ color: '#16a34a' }}>
                        ₹{Number(b.total_paid || b.total_amount || b.amount_paid || b.amount || b.price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-nowrap">
                        <span
                          className="px-2 py-1 rounded-pill fw-bold text-capitalize"
                          style={{ background: badgeBg, color: badgeColor, fontSize: '0.7rem' }}
                        >
                          {b.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-nowrap">
                        <div className="d-flex align-items-center gap-1">
                          {s !== 'confirmed' && s !== 'completed' && s !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-xs fw-bold px-2 py-1 rounded-pill text-white"
                              style={{ background: '#0284c7', fontSize: '0.7rem' }}
                              disabled={updatingId === b.id}
                              onClick={() => handleUpdateStatus(b.id, 'Confirmed')}
                            >
                              {updatingId === b.id ? 'Updating...' : 'Confirm'}
                            </button>
                          )}
                          {s !== 'completed' && s !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-xs fw-bold px-2 py-1 rounded-pill text-white"
                              style={{ background: '#16a34a', fontSize: '0.7rem' }}
                              disabled={updatingId === b.id}
                              onClick={() => handleUpdateStatus(b.id, 'Completed')}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PricingFares({ flights }) {
  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Pricing, Fares &amp; Markups</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Configure cabin class fare rules, baggage policies, dynamic surcharges, and cancellation structures.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card p-3 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-primary">
              <Tag size={18} />
              <span className="fw-bold" style={{ fontSize: '0.82rem' }}>Economy Class</span>
            </div>
            <div className="fw-extrabold fs-5 mb-1 text-dark">Base Rate (1.0x)</div>
            <p className="text-muted small mb-0">Standard seat, 7kg cabin baggage, complimentary water.</p>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card p-3 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-info">
              <TrendingUp size={18} />
              <span className="fw-bold" style={{ fontSize: '0.82rem' }}>Premium Economy</span>
            </div>
            <div className="fw-extrabold fs-5 mb-1 text-dark">1.35x Multiplier</div>
            <p className="text-muted small mb-0">Extra legroom, priority boarding, 15kg check-in baggage included.</p>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card p-3 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-warning">
              <Luggage size={18} />
              <span className="fw-bold" style={{ fontSize: '0.82rem' }}>Extra Baggage Fees</span>
            </div>
            <div className="fw-extrabold fs-5 mb-1 text-dark">+₹1,200 / 15kg</div>
            <p className="text-muted small mb-0">Standard tier add-on across all domestic flight routes.</p>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card p-3 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-danger">
              <ShieldCheck size={18} />
              <span className="fw-bold" style={{ fontSize: '0.82rem' }}>Cancellation Fee</span>
            </div>
            <div className="fw-extrabold fs-5 mb-1 text-dark">₹999 / Sector</div>
            <p className="text-muted small mb-0">Applicable on cancellations &gt; 48h before scheduled flight.</p>
          </div>
        </div>
      </div>

      {/* Routes Rate Sheet */}
      <div className="card border-0 shadow-sm rounded-3 p-4" style={{ background: '#fff' }}>
        <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', color: '#0D1B2E' }}>Active Sector Fare Sheet</h6>
        <div className="table-responsive">
          <table className="table align-middle table-hover small mb-0">
            <thead className="table-light">
              <tr>
                <th>Airline</th>
                <th>Flight No</th>
                <th>Sector</th>
                <th>Base Fare (₹)</th>
                <th>Prem. Economy (₹)</th>
                <th>Baggage Included</th>
                <th>Cancellation Policy</th>
              </tr>
            </thead>
            <tbody>
              {flights.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No route pricing configured yet.</td></tr>
              ) : (
                flights.map(f => {
                  const base = Number(f.price || 0);
                  const prem = Math.round(base * 1.35);
                  return (
                    <tr key={f.id}>
                      <td className="fw-bold text-primary">{f.airline}</td>
                      <td><span className="badge bg-light text-dark border">{f.flight_number}</span></td>
                      <td className="fw-bold">{f.from_loc} → {f.to_loc}</td>
                      <td className="fw-bold text-success">₹{base.toLocaleString('en-IN')}</td>
                      <td className="fw-bold text-info">₹{prem.toLocaleString('en-IN')}</td>
                      <td>7kg Cabin + 15kg Check-in</td>
                      <td><span className="badge bg-success bg-opacity-10 text-success">Refundable with Fee</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PassengerDirectory({ bookings }) {
  const [search, setSearch] = useState('');

  const passengers = useMemo(() => {
    return bookings.filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (b.name || '').toLowerCase().includes(q) ||
        (b.phone || '').includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.item_name || '').toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Passenger Directory</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Manifest of flyers and traveler contact records across your flights.
        </p>
      </div>

      <div className="card border-0 shadow-sm p-3 mb-3 rounded-3" style={{ background: '#fff' }}>
        <div className="position-relative">
          <Search size={16} className="position-absolute" style={{ left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control form-control-sm ps-5"
            placeholder="Search passenger by full name, phone number, email, or flight route..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '0.83rem', borderRadius: '6px' }}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ background: '#fff' }}>
        {passengers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Users size={36} className="mb-2 opacity-25" />
            <p className="mb-0">No passengers found in directory.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table align-middle table-hover mb-0" style={{ fontSize: '0.83rem', minWidth: '650px' }}>
              <thead className="table-light">
                <tr>
                  <th>Passenger Name</th>
                  <th>Contact Info</th>
                  <th>Booked Flight / Route</th>
                  <th>Booking Ref</th>
                  <th>Cabin Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="fw-bold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary" style={{ width: '30px', height: '30px' }}>
                          <UserCircle size={18} />
                        </div>
                        <span>{p.name || 'Passenger'}</span>
                      </div>
                    </td>
                    <td>
                      <div><Phone size={11} className="inline me-1 text-muted" />{p.phone || 'N/A'}</div>
                      {p.email && <div className="text-muted" style={{ fontSize: '0.72rem' }}><Mail size={11} className="inline me-1 text-muted" />{p.email}</div>}
                    </td>
                    <td className="fw-bold text-info">{p.item_name || 'Scheduled Flight'}</td>
                    <td className="fw-bold text-primary">#{p.id}</td>
                    <td>Economy Class</td>
                    <td>
                      <span className="badge rounded-pill bg-success bg-opacity-10 text-success">
                        {p.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EarningsReports({ bookings }) {
  const grossRevenue = bookings.reduce((s, b) => s + (parseFloat(b.total_paid || b.total_amount || b.amount_paid || b.amount || b.price || 0) || 0), 0);
  const platformCommissionRate = 0.05; // 5% default
  const platformCommission = grossRevenue * platformCommissionRate;
  const netEarnings = grossRevenue - platformCommission;

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Earnings &amp; Settlements</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Detailed financial audit of flight ticket sales, platform commission deductions, and net payouts.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 p-md-4 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <span className="text-muted small fw-bold">Gross Flight Bookings</span>
            <div className="fw-extrabold fs-3 mt-1" style={{ color: '#0D1B2E' }}>
              ₹{Math.round(grossRevenue).toLocaleString('en-IN')}
            </div>
            <span className="text-muted small mt-2">Total customer ticket payments</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 p-md-4 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <span className="text-muted small fw-bold">Platform Fee (5%)</span>
            <div className="fw-extrabold fs-3 mt-1 text-danger">
              -₹{Math.round(platformCommission).toLocaleString('en-IN')}
            </div>
            <span className="text-muted small mt-2">TripGalileo standard flight commission</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 p-md-4 border-0 shadow-sm rounded-3 h-100" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' }}>
            <span className="text-white-50 small fw-bold">Net Operator Earnings</span>
            <div className="fw-extrabold fs-3 mt-1 text-white">
              ₹{Math.round(netEarnings).toLocaleString('en-IN')}
            </div>
            <span className="text-white-50 small mt-2">Available for platform bank transfer</span>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 p-4" style={{ background: '#fff' }}>
        <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', color: '#0D1B2E' }}>Recent Financial Transactions</h6>
        {bookings.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">No booking settlement records available.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Booking ID</th>
                  <th>Sector</th>
                  <th>Gross Fare</th>
                  <th>Fee (5%)</th>
                  <th>Net Receivable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((b, i) => {
                  const gross = parseFloat(b.total_paid || b.total_amount || b.amount_paid || b.amount || b.price || 0) || 0;
                  const comm = gross * 0.05;
                  const net = gross - comm;
                  return (
                    <tr key={b.id || i}>
                      <td className="fw-bold text-primary">#{b.id}</td>
                      <td>{b.item_name || 'Scheduled Flight'}</td>
                      <td>₹{Math.round(gross).toLocaleString('en-IN')}</td>
                      <td className="text-danger">-₹{Math.round(comm).toLocaleString('en-IN')}</td>
                      <td className="fw-bold text-success">₹{Math.round(net).toLocaleString('en-IN')}</td>
                      <td>
                        <span className="badge rounded-pill bg-success bg-opacity-10 text-success">
                          Settled to Wallet
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorProfile({ currentUser }) {
  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Aviation Operator Profile</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Verified enterprise flight partner credentials and authorized representative records.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card p-4 border-0 shadow-sm rounded-3 text-center h-100" style={{ background: '#fff' }}>
            <div
              className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '70px', height: '70px', background: 'rgba(0,184,217,0.15)', color: '#00B8D9' }}
            >
              <Plane size={36} />
            </div>
            <h5 className="fw-bold mb-1 text-dark">{currentUser?.company_name || currentUser?.name || 'IndiGo Flight Connect'}</h5>
            <span className="badge mx-auto px-3 py-1 rounded-pill" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>
              FLIGHT VENDOR
            </span>
            <div className="mt-3 text-start small border-top pt-3 text-muted">
              <div className="mb-1"><strong className="text-dark">User ID:</strong> {currentUser?.id || 'u-6'}</div>
              <div className="mb-1"><strong className="text-dark">Username:</strong> {currentUser?.username || 'flight_vendor'}</div>
              <div className="mb-1"><strong className="text-dark">Status:</strong> <span className="text-success fw-bold">Active / Verified</span></div>
              <div><strong className="text-dark">Hub:</strong> Goa International Airport (GOI / GOX)</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card p-4 border-0 shadow-sm rounded-3 h-100" style={{ background: '#fff' }}>
            <h6 className="fw-bold mb-3 text-dark">Enterprise Credentials &amp; Verification</h6>
            <div className="row g-3 small">
              <div className="col-12 col-sm-6">
                <label className="text-muted fw-bold">Official Business Email</label>
                <div className="fw-bold text-dark mt-1">{currentUser?.email || 'flight_vendor@tripgalileo.com'}</div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="text-muted fw-bold">Operations Support Telephone</label>
                <div className="fw-bold text-dark mt-1">{currentUser?.phone || '+91 96666 55555'}</div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="text-muted fw-bold">Operating Base</label>
                <div className="fw-bold text-dark mt-1">Dabolim Airport (GOI) &amp; Mopa (GOX), Goa</div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="text-muted fw-bold">Aviation Category</label>
                <div className="fw-bold text-dark mt-1">Scheduled Commercial &amp; Air Charter</div>
              </div>
              <div className="col-12">
                <div className="p-3 rounded-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-1">
                    <ShieldCheck size={16} /> Certified DGCA &amp; GDS Connected Partner
                  </div>
                  <p className="text-muted mb-0 text-xs">
                    Your flight vendor account is fully authorized by the platform administrator to publish scheduled route inventory, issue e-tickets, and collect settlements via platform wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlightSettings() {
  const [checkinMins, setCheckinMins] = useState('60');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Flight Operator Settings</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Configure automated passenger check-in thresholds and dispatch settings.
        </p>
      </div>

      <div className="card p-4 border-0 shadow-sm rounded-3" style={{ background: '#fff', maxWidth: '720px' }}>
        {saved && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.85rem' }}>
            <CheckCircle size={16} /> Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label fw-bold small text-secondary">Check-In Window Closing (Minutes before departure)</label>
            <select className="form-select form-select-sm" value={checkinMins} onChange={e => setCheckinMins(e.target.value)}>
              <option value="45">45 minutes prior to departure</option>
              <option value="60">60 minutes prior to departure (Recommended)</option>
              <option value="90">90 minutes prior to departure</option>
            </select>
          </div>

          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoConfirmSwitch"
                checked={autoConfirm}
                onChange={e => setAutoConfirm(e.target.checked)}
              />
              <label className="form-check-label fw-bold small text-dark" htmlFor="autoConfirmSwitch">
                Instant Auto-Confirmation for Prepaid Bookings
              </label>
            </div>
            <div className="text-muted text-xs ms-4">Automatically transition successful customer payments to Confirmed.</div>
          </div>

          <div className="mb-4">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="smsNotifySwitch"
                checked={notifySms}
                onChange={e => setNotifySms(e.target.checked)}
              />
              <label className="form-check-label fw-bold small text-dark" htmlFor="smsNotifySwitch">
                Automated SMS &amp; WhatsApp Passenger Alerts
              </label>
            </div>
            <div className="text-muted text-xs ms-4">Send instant flight confirmation notifications to passenger mobile numbers.</div>
          </div>

          <button
            type="submit"
            className="btn fw-bold text-white px-4 py-2"
            style={{ background: 'linear-gradient(90deg,#00B8D9,#0090b8)', borderRadius: '8px' }}
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
}

function FlightActivityLog() {
  const events = [
    { title: 'Flight Route Published', desc: 'IndiGo 6E-204 (GOI → DEL) listed at ₹4,500', time: 'Today at 09:30 AM', icon: <Plane size={14} /> },
    { title: 'Passenger Reservation Confirmed', desc: 'Booking #TG-276666 confirmed for flight sector', time: 'Yesterday at 04:15 PM', icon: <CheckCircle size={14} /> },
    { title: 'Platform Wallet Top-up Verified', desc: '₹25,000 credit approved by Superadmin', time: '2 days ago', icon: <Wallet size={14} /> },
    { title: 'Fare Rule Updated', desc: 'Premium economy multiplier updated to 1.35x', time: '3 days ago', icon: <Tag size={14} /> },
  ];

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Flight Operations Audit Trail</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
          Historical record of route additions, fare edits, booking transitions, and wallet transactions.
        </p>
      </div>

      <div className="card p-4 border-0 shadow-sm rounded-3" style={{ background: '#fff', maxWidth: '720px' }}>
        <div className="d-flex flex-column gap-3">
          {events.map((ev, i) => (
            <div key={i} className="d-flex align-items-start gap-3 pb-3 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <div
                className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ background: '#e0f2fe', color: '#0369a1', width: '32px', height: '32px' }}
              >
                {ev.icon}
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{ev.title}</div>
                <div className="text-muted text-truncate" style={{ fontSize: '0.78rem' }}>{ev.desc}</div>
              </div>
              <span className="text-muted text-nowrap" style={{ fontSize: '0.7rem' }}>{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FlightVendorPortalPage({
  currentUser,
  triggerOpenLogin,
  flights = [],
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  onLogout,
  bookings = []
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [localFlights, setLocalFlights] = useState(flights || []);
  const [localBookings, setLocalBookings] = useState(bookings || []);

  useEffect(() => {
    if (flights && flights.length > 0) {
      setLocalFlights(flights);
    }
  }, [flights]);

  useEffect(() => {
    if (bookings) {
      setLocalBookings(bookings);
    }
  }, [bookings]);

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setLocalBookings(prev => prev.map(b => String(b.id) === String(bookingId) ? { ...b, status: newStatus } : b));
    try {
      await api.updateBookingStatus(bookingId, newStatus);
    } catch (e) {
      console.warn('Booking status update background sync:', e);
    }
  };

  const reloadFlights = async () => {
    try {
      const fresh = await api.fetchFlights();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setLocalFlights(fresh);
      }
    } catch {}
  };

  useEffect(() => {
    reloadFlights();
  }, []);

  const handleAddFlightRoute = async (payload) => {
    if (onAddFlight) await onAddFlight(payload);
    await reloadFlights();
  };

  const handleUpdateFlightRoute = async (id, payload) => {
    if (onUpdateFlight) await onUpdateFlight(id, payload);
    await reloadFlights();
  };

  const handleDeleteFlightRoute = async (id) => {
    if (onDeleteFlight) await onDeleteFlight(id);
    await reloadFlights();
  };

  // Responsive drawer state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if current user is the default seeded flight vendor entity
  const isDefaultFlightVendor = currentUser?.id === 'u-6' || currentUser?.username === 'flight_vendor' || currentUser?.id === 'vendor-4';

  // Authoritative flight routes owned by or attributed to this vendor
  const myFlights = useMemo(() => {
    const list = (localFlights && localFlights.length > 0) ? localFlights : (flights || []);
    if (!currentUser) return list;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      return list;
    }
    return list.filter(f => {
      // 1. Direct match with current user ID or username
      if (String(f.vendor_id) === String(currentUser.id) || f.vendor_id === currentUser.username) {
        return true;
      }
      // 2. Default seeded IndiGo Flight Connect vendor account (u-6) owns vendor-4 and default platform routes
      if (isDefaultFlightVendor && (f.vendor_id === 'vendor-4' || f.vendor_id === 'flight_vendor' || f.vendor_id === 'u-6' || !f.vendor_id)) {
        return true;
      }
      return false;
    });
  }, [localFlights, flights, currentUser, isDefaultFlightVendor]);

  // Authoritative flight bookings owned by or attributed to this vendor
  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    const activeBookings = (localBookings && localBookings.length > 0) ? localBookings : (bookings || []);
    return activeBookings.filter(b => {
      if (!b) return false;
      // Admin inspection mode: show all flight bookings
      if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        const t = (b.type || '').toLowerCase();
        const pt = (b.package_type || '').toLowerCase();
        if (t === 'flight' || pt.includes('flight') || Boolean(b.flight_number)) return true;
      }
      // 1. Direct match on item_id or flight number of vendor's flights
      if (myFlights.some(f => String(f.id) === String(b.item_id) || String(b.item_id) === `flight-${f.id}` || String(b.item_id) === `FL-${f.id}` || (f.flight_number && (f.flight_number === b.flight_number || f.flight_number === b.item_id)))) {
        return true;
      }
      // 2. Vendor ID direct match
      if (b.vendor_id && (String(b.vendor_id) === String(currentUser?.id) || b.vendor_id === currentUser?.username)) {
        return true;
      }
      // 3. Seeded default vendor
      if (isDefaultFlightVendor && (b.vendor_id === 'vendor-4' || b.vendor_id === 'u-6' || b.vendor_id === 'flight_vendor')) {
        return true;
      }
      // 4. Package customization flight match
      if (b.customizations) {
        try {
          const cust = typeof b.customizations === 'string' ? JSON.parse(b.customizations) : b.customizations;
          if (cust && cust.flight && myFlights.some(f => String(f.id) === String(cust.flight.id) || f.flight_number === cust.flight.flight_number)) {
            return true;
          }
        } catch {}
      }
      return false;
    });
  }, [localBookings, bookings, myFlights, currentUser, isDefaultFlightVendor]);

  if (!currentUser || (currentUser.role !== 'flight_vendor' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-4 p-md-5">
          <div
            className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center shadow-lg"
            style={{ width: '90px', height: '90px', background: 'rgba(0,184,217,0.15)', border: '2px solid rgba(0,184,217,0.3)' }}
          >
            <Plane size={42} style={{ color: '#00B8D9' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Flight Vendor Console</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Sign in with your verified flight vendor account to continue</p>
          <button
            type="button"
            className="btn px-5 py-2.5 fw-bold text-white rounded-pill shadow"
            style={{ background: 'linear-gradient(90deg,#00B8D9,#0090b8)' }}
            onClick={triggerOpenLogin}
          >
            Sign In to Flight Console
          </button>
        </div>
      </div>
    );
  }

  const handleEditClick = (flight) => {
    setEditingFlight(flight);
    setActiveTab('add_flight');
    if (isMobile) setSidebarOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingFlight(null);
    setActiveTab('flights');
  };

  const handleSelectTab = (id) => {
    if (id !== 'add_flight') setEditingFlight(null);
    setActiveTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FlightDashboard flights={myFlights} bookings={myBookings} onNavigate={handleSelectTab} />;
      case 'flights':
        return <MyRoutes flights={myFlights} onDelete={handleDeleteFlightRoute} onEditClick={handleEditClick} onNavigate={handleSelectTab} />;
      case 'add_flight':
        return <AddRouteForm onAdd={handleAddFlightRoute} onUpdate={handleUpdateFlightRoute} editingFlight={editingFlight} onCancelEdit={handleCancelEdit} onNavigate={handleSelectTab} currentUser={currentUser} />;
      case 'pricing':
        return <PricingFares flights={myFlights} />;
      case 'all_bookings':
        return <FlightBookings bookings={myBookings} onUpdateStatus={handleUpdateBookingStatus} />;
      case 'passengers':
        return <PassengerDirectory bookings={myBookings} />;
      case 'wallet':
        return <VendorWallet currentUser={currentUser} />;
      case 'earnings':
        return <EarningsReports bookings={myBookings} />;
      case 'profile':
        return <VendorProfile currentUser={currentUser} />;
      case 'settings':
        return <FlightSettings />;
      case 'activity_log':
        return <FlightActivityLog />;
      default:
        return <FlightDashboard flights={myFlights} bookings={myBookings} onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div className="d-flex w-100 position-relative" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Mobile Off-canvas Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 27, 46, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1040
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          width: isMobile ? '280px' : (sidebarOpen ? '256px' : '0px'),
          minWidth: isMobile ? '280px' : (sidebarOpen ? '256px' : '0px'),
          maxWidth: isMobile ? '85vw' : 'none',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#0D1B2E',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: isMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.3s ease, min-width 0.3s ease',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          zIndex: isMobile ? 1050 : 'auto',
          boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div className="px-3 py-3 d-flex align-items-center justify-content-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="d-flex align-items-center gap-2 min-w-0">
            <Compass size={22} style={{ color: '#00B8D9', flexShrink: 0 }} />
            <div className="min-w-0">
              <div className="fw-extrabold text-white text-truncate" style={{ fontSize: '15px' }}>TRIPGALILEO</div>
              <div className="fw-bold text-uppercase text-truncate" style={{ fontSize: '0.55rem', letterSpacing: '1.5px', color: '#00B8D9' }}>Flight Operator PMS</div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="btn btn-sm text-white-50 p-1 border-0"
              style={{ background: 'transparent' }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Groups */}
        <div className="flex-grow-1 py-2">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <SidebarGroup
              key={group.label}
              group={group}
              activeTab={activeTab}
              onSelect={handleSelectTab}
              defaultOpen={idx < 2}
            />
          ))}
        </div>

        {/* Sign Out Button */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onLogout}
            className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 text-truncate"
            style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <LogOut size={15} className="flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column min-w-0" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Top Bar Header */}
        <header
          className="d-flex align-items-center justify-content-between px-3 px-md-4 flex-shrink-0"
          style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="d-flex align-items-center gap-2 gap-md-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-sm p-1.5 border-0 text-white-50 d-flex align-items-center justify-content-center"
              style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <div className="fw-bold text-white text-truncate" style={{ fontSize: '14px' }}>
                {PAGE_TITLES[activeTab] || 'Flight PMS'}
              </div>
              <div className="text-white-50 text-truncate d-none d-sm-block" style={{ fontSize: '0.68rem' }}>
                TripGalileo Flight Operator Console
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
            <span
              className="d-none d-sm-flex align-items-center gap-1 px-3 py-1 rounded-pill"
              style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}
            >
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              Online
            </span>

            {/* Profile Dropdown */}
            <div className="position-relative">
              <button
                className="btn p-0 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', border: '2px solid #00B8D9', background: 'linear-gradient(135deg,#00B8D9,#0090b8)' }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-label="User profile"
              >
                <span className="fw-bold text-white" style={{ fontSize: '14px' }}>
                  {currentUser?.username?.[0]?.toUpperCase() || 'F'}
                </span>
              </button>

              {showProfileDropdown && (
                <div
                  className="position-absolute shadow-lg"
                  style={{
                    right: 0,
                    top: '46px',
                    minWidth: '200px',
                    background: '#10243A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 1055
                  }}
                >
                  <div className="text-center px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="fw-bold text-white text-truncate" style={{ fontSize: '13px' }}>
                      {currentUser?.username || 'flight_vendor'}
                    </div>
                    <span className="badge mt-1" style={{ background: 'rgba(0,184,217,0.15)', color: '#00B8D9', fontSize: '0.65rem' }}>
                      FLIGHT VENDOR
                    </span>
                  </div>
                  <div className="p-2 d-flex flex-column gap-1">
                    <button
                      className="btn w-100 text-start py-1.5 px-2 text-white-50"
                      style={{ fontSize: '0.8rem', background: 'transparent' }}
                      onClick={() => { handleSelectTab('profile'); setShowProfileDropdown(false); }}
                    >
                      <UserCircle size={14} className="me-2 inline" /> My Profile
                    </button>
                    <button
                      className="btn w-100 text-start py-1.5 px-2 text-white-50"
                      style={{ fontSize: '0.8rem', background: 'transparent' }}
                      onClick={() => { handleSelectTab('settings'); setShowProfileDropdown(false); }}
                    >
                      <Settings size={14} className="me-2 inline" /> Settings
                    </button>
                    <hr className="my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <button
                      className="btn w-100 d-flex align-items-center gap-2 py-2 px-2 rounded fw-bold"
                      style={{ color: '#00B8D9', background: 'rgba(0,184,217,0.1)', fontSize: '0.82rem' }}
                      onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-grow-1 overflow-auto min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}