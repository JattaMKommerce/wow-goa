import React, { useState, useEffect } from 'react';
import {
  Users, Building, Car, Hotel, Calendar, TrendingUp, Wallet, CreditCard,
  Percent, BarChart2, Globe, Bell, Shield, Settings, UserCog, CheckCircle,
  Plus, Edit, Trash2, X, Search, Eye, EyeOff, Lock, AlertTriangle, FileText,
  Download, Filter, RefreshCw, ToggleLeft, ToggleRight, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity, Star, MapPin, Clock, ChevronRight,
  XCircle, ShieldAlert, Key, Check, Compass, CalendarDays, Phone, Mail, MessageCircle,
  Briefcase, Tag, Gift
} from 'lucide-react';
import * as api from '../../services/api';
import SubscriptionPlansManager from '../../components/superadmin/SubscriptionPlansManager';
import PaymentGatewayManager from '../../components/superadmin/PaymentGatewayManager';
import WalletApprovalCenter from '../../components/superadmin/WalletApprovalCenter';
import AnalyticsView from '../../components/shared/AnalyticsView';
import AdminB2BPortal from '../admin/b2b/AdminB2BPortal';
import AdminDriverManagement from '../admin/AdminDriverManagement';
import LeadManagement from '../../components/shared/LeadManagement';

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, trend, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3 p-3 h-100 shadow-sm ${onClick ? 'stat-card-clickable' : ''}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease-in-out'
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = color || '#FF6333';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)';
        }
      }}
    >
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div className="rounded-2 p-2 d-flex align-items-center justify-content-center" style={{ background: `${color}18`, width: '38px', height: '38px' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="d-flex align-items-center gap-1">
          {trend !== undefined && (
            <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {onClick && <ChevronRight size={14} className="opacity-40" style={{ color: '#64748b' }} />}
        </div>
      </div>
      <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0D1B2E', lineHeight: 1 }}>{value}</div>
      <div className="mt-1" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────
function Section({ title, subtitle, actions, children }) {
  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>{title}</h5>
          {subtitle && <p className="mb-0 mt-1" style={{ fontSize: '0.8rem', color: '#64748b' }}>{subtitle}</p>}
        </div>
        {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── TABLE WRAPPER ───────────────────────────────────────────────────────────
function DataTable({ headers, children, empty }) {
  return (
    <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
      <div className="table-responsive">
        <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {headers.map(h => (
                <th key={h} className="py-3 px-3 fw-bold" style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
        {empty && (
          <div className="text-center py-5" style={{ color: '#94a3b8' }}>
            <BarChart2 size={32} className="mb-2 opacity-50" />
            <p className="mb-0 fw-bold" style={{ fontSize: '0.85rem' }}>{empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    suspended: { bg: '#fee2e2', color: '#dc2626' },
    pending: { bg: '#fef9c3', color: '#ca8a04' },
    approved: { bg: '#dcfce7', color: '#16a34a' },
    rejected: { bg: '#fee2e2', color: '#dc2626' },
    confirmed: { bg: '#dbeafe', color: '#2563eb' },
    cancelled: { bg: '#fee2e2', color: '#dc2626' },
    completed: { bg: '#dcfce7', color: '#16a34a' },
    admin: { bg: '#ede9fe', color: '#7c3aed' },
    superadmin: { bg: '#fce7f3', color: '#be185d' },
    vendor: { bg: '#dbeafe', color: '#2563eb' },
    hotel_vendor: { bg: '#d1fae5', color: '#059669' },
    flight_vendor: { bg: '#e0f2fe', color: '#0369a1' },
    customer: { bg: '#f0f9ff', color: '#0369a1' },
    'new enquiry': { bg: '#fef9c3', color: '#ca8a04' },
    captured: { bg: '#dcfce7', color: '#16a34a' },
    paid: { bg: '#dcfce7', color: '#16a34a' },
    'paid online': { bg: '#dcfce7', color: '#16a34a' },
    full: { bg: '#dcfce7', color: '#16a34a' },
    success: { bg: '#dcfce7', color: '#16a34a' },
    successful: { bg: '#dcfce7', color: '#16a34a' },
    partial: { bg: '#fef9c3', color: '#ca8a04' },
    'partially paid': { bg: '#fef9c3', color: '#ca8a04' },
    unpaid: { bg: '#fee2e2', color: '#dc2626' },
    failed: { bg: '#fee2e2', color: '#dc2626' },
    refunded: { bg: '#f1f5f9', color: '#64748b' },
    'pending verification': { bg: '#fef9c3', color: '#ca8a04' }
  };
  const s = status?.toLowerCase();
  const style = map[s] || { bg: '#f1f5f9', color: '#64748b' };
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: style.bg, color: style.color, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{status || 'Pending'}</span>;
}

// ─── MODAL WRAPPER ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children, size = '480px' }) {
  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.currentTarget.dataset.backdropClicked = 'true';
        } else {
          delete e.currentTarget.dataset.backdropClicked;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && e.currentTarget.dataset.backdropClicked === 'true') {
          delete e.currentTarget.dataset.backdropClicked;
          onClose();
        }
      }}
    >
      <div
        className="rounded-4 overflow-hidden shadow-lg animate-fade-in-up"
        style={{ width: '100%', maxWidth: size, background: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>{title}</h6>
          <button type="button" className="btn p-1 border-0 text-white-50" style={{ background: 'transparent' }} onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>
        <div className="p-4 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── FORM INPUT COMPONENT (Defined at top-level so it never loses focus on keystroke) ─────
function FormInputField({ label, type = 'text', value, onChange, required, placeholder, autoComplete = 'off', name }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>{label}{required && ' *'}</label>
      <input
        type={type}
        name={name}
        className="form-control"
        style={{ fontSize: '0.85rem', borderRadius: '8px' }}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  );
}

// ─── DASHBOARD TAB (Comprehensive Centralized Visibility) ───────────────────────────
function DashboardTab({
  usersList = [],
  vendors = [],
  cars = [],
  bikes = [],
  hotels = [],
  bookings = [],
  b2bPartners = [],
  b2bBookings = [],
  drivers = [],
  aiLeads = [],
  customEnquiries = [],
  onNavigate
}) {
  const admins = usersList.filter(u => u.role === 'admin').length;
  const hotelVendors = vendors.filter(v => v.role === 'hotel_vendor').length;
  const vehicleVendors = vendors.filter(v => v.role !== 'hotel_vendor').length;
  const totalVendors = vendors.length;
  const totalBookings = bookings.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter(b => b.created_at?.slice(0, 10) === todayStr).length;
  const pendingBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'pending').length;
  const totalRevenue = bookings.reduce((s, b) => s + parseFloat(b.total_paid || b.amount_paid || 0), 0);
  const customers = usersList.filter(u => u.role === 'customer').length;

  // B2B Metrics
  const commissionPartners = b2bPartners.filter(p => (p.mode || '').toLowerCase() === 'commission').length;
  const nonCommissionPartners = b2bPartners.filter(p => (p.mode || '').toLowerCase() !== 'commission').length;
  const totalB2BWalletBalance = b2bPartners.reduce((acc, p) => acc + (parseFloat(p.wallet_balance || 0)), 0);

  // Driver Metrics
  const activeDrivers = drivers.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').length;
  const pendingDrivers = drivers.filter(d => (d.status || '').toLowerCase() === 'pending').length;

  // Categorized Bookings
  const vehicleBookingsCount = bookings.filter(b => {
    const t = String(b.type || b.item_type || '').toLowerCase();
    const name = String(b.item_name || b.name || '').toLowerCase();
    return t.includes('car') || t.includes('bike') || t.includes('vehicle') || name.includes('car') || name.includes('bike') || name.includes('scooter') || name.includes('activa') || name.includes('thar') || name.includes('innova') || name.includes('self-drive');
  }).length;

  const hotelBookingsCount = bookings.filter(b => {
    const t = String(b.type || b.item_type || '').toLowerCase();
    const name = String(b.item_name || b.name || '').toLowerCase();
    return t.includes('hotel') || b.property_type || b.stars || name.includes('hotel') || name.includes('resort') || name.includes('villa');
  }).length;

  const tripBookingsCount = bookings.filter(b => {
    const name = String(b.item_name || b.name || '').toLowerCase();
    return name.includes('craft my trip') || name.includes('custom trip') || name.includes('package') || name.includes('holiday');
  }).length;

  const activityBookingsCount = bookings.filter(b => {
    const t = String(b.type || b.item_type || '').toLowerCase();
    const name = String(b.item_name || b.name || '').toLowerCase();
    return t.includes('activity') || t.includes('sightseeing') || name.includes('scuba') || name.includes('cruise') || name.includes('safari') || name.includes('water sports') || name.includes('tour');
  }).length;

  const stats = [
    { label: 'Administrators & Sub-Admins', value: admins, icon: <UserCog size={18} />, color: '#7c3aed', sub: 'Master & Sub-Admin Accounts', onClick: () => onNavigate?.('admin_management') },
    { label: 'Vendors (Hotels & Fleet)', value: totalVendors, icon: <Building size={18} />, color: '#0369a1', sub: `${hotelVendors} hotel · ${vehicleVendors} vehicle`, onClick: () => onNavigate?.('vendor_management') },
    { label: 'B2B Partners', value: b2bPartners.length, icon: <Briefcase size={18} />, color: '#8b5cf6', sub: `${commissionPartners} commission · ${nonCommissionPartners} net-rate`, onClick: () => onNavigate?.('b2b_all_partners') },
    { label: 'Fleet & Drivers', value: drivers.length, icon: <Car size={18} />, color: '#059669', sub: `${activeDrivers} active · ${pendingDrivers} pending approval`, onClick: () => onNavigate?.('drivers') },
    { label: 'Total Bookings', value: totalBookings, icon: <Calendar size={18} />, color: '#2563eb', trend: 12, sub: `${todayBookings} today · ${pendingBookings} pending`, onClick: () => onNavigate?.('vehicle_bookings') },
    { label: 'Vehicle Rentals', value: vehicleBookingsCount, icon: <Car size={18} />, color: '#d97706', sub: `${cars.length} cars · ${bikes.length} bikes in fleet`, onClick: () => onNavigate?.('vehicle_bookings') },
    { label: 'Hotel Reservations', value: hotelBookingsCount, icon: <Hotel size={18} />, color: '#0284c7', sub: `${hotels.length} partner properties listed`, onClick: () => onNavigate?.('hotel_bookings') },
    { label: 'Craft My Trip / Packages', value: tripBookingsCount, icon: <Compass size={18} />, color: '#f97316', sub: 'Custom holidays & packages', onClick: () => onNavigate?.('trip_bookings') },
    { label: 'Sightseeing & Activities', value: activityBookingsCount, icon: <MapPin size={18} />, color: '#10b981', sub: 'Water sports, cruises, tours', onClick: () => onNavigate?.('activity_bookings') },
    { label: 'B2B Agent Bookings', value: b2bBookings.length, icon: <FileText size={18} />, color: '#6366f1', sub: 'B2B distribution bookings', onClick: () => onNavigate?.('b2b_commission_bookings') },
    { label: 'B2B Wallet Balances', value: `₹${(totalB2BWalletBalance / 1000).toFixed(1)}K`, icon: <Wallet size={18} />, color: '#0d9488', sub: 'Prepaid agent deposits', onClick: () => onNavigate?.('b2b_wallets') },
    { label: 'Total Platform Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: <DollarSign size={18} />, color: '#0D1B2E', trend: 8, sub: `₹${(totalRevenue * 0.1 / 1000).toFixed(1)}K platform comm. (10%)` },
    { label: 'Active Customers', value: customers, icon: <Users size={18} />, color: '#0891b2', sub: 'Registered consumer travelers', onClick: () => onNavigate?.('user_management') },
    { label: 'AI Leads & Inquiries', value: aiLeads.length + customEnquiries.length, icon: <Activity size={18} />, color: '#16a34a', sub: `${aiLeads.length} Sophia AI · ${customEnquiries.length} custom`, onClick: () => onNavigate?.('lead_management') },
    { label: 'Pending KYC / Approvals', value: vendors.filter(v => !v.verified).length + pendingDrivers, icon: <AlertTriangle size={18} />, color: '#f59e0b', sub: `${vendors.filter(v => !v.verified).length} vendor · ${pendingDrivers} driver`, onClick: () => onNavigate?.('vendor_verification') },
    { label: 'Commission Rules & Config', value: '10% Platform', icon: <Percent size={18} />, color: '#7c3aed', sub: 'Active tier markup rules', onClick: () => onNavigate?.('commission') },
  ];

  return (
    <div className="p-4">
      {/* Welcome Banner */}
      <div className="rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between shadow-sm" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1a3a5c 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h4 className="fw-bold text-white mb-1">Welcome back, Superadmin 👋</h4>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · TripGalileo Master Control Panel
          </p>
        </div>
        <div className="text-end d-none d-md-block">
          <div className="fw-bold text-white" style={{ fontSize: '2rem' }}>₹{(totalRevenue / 1000).toFixed(1)}K</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Total Platform Revenue</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3">
        {stats.map((s, i) => (
          <div key={i} className="col-6 col-md-4 col-xl-3">
            <StatCard {...s} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADD ADMIN MODAL ────────────────────────────────────────────────────────
function AddAdminModal({ show, onClose, onAddUser }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin', billing_price: '', status: 'active' });
  const [showAddPass, setShowAddPass] = useState(false);

  useEffect(() => {
    if (show) {
      setForm({ username: '', email: '', password: '', role: 'admin', billing_price: '', status: 'active' });
      setShowAddPass(false);
    }
  }, [show]);

  if (!show) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      alert('Please fill in all required fields.');
      return;
    }
    const newPass = form.password;
    try {
      const map = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      if (form.username) map[form.username] = newPass;
      if (form.email) map[form.email] = newPass;
      localStorage.setItem('user_passwords', JSON.stringify(map));
    } catch (err) {}

    onAddUser({ ...form, billing_price: parseInt(form.billing_price, 10) || 0, password: newPass, plain_password: newPass, role: 'admin' });
    onClose();
  };

  return (
    <Modal title="Create Administrator Account" onClose={onClose}>
      <form onSubmit={handleAdd} autoComplete="off">
        <FormInputField
          label="Username"
          name="new_admin_username_field"
          autoComplete="new-password"
          value={form.username}
          onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
          required
          placeholder="e.g. admin_goa"
        />
        <FormInputField
          label="Email Address"
          type="email"
          name="new_admin_email_field"
          autoComplete="new-password"
          value={form.email}
          onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
          required
          placeholder="e.g. admin@example.com"
        />
        
        <div className="mb-3">
          <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Password *</label>
          <div className="position-relative">
            <input
              type={showAddPass ? 'text' : 'password'}
              name="new_admin_password_field"
              autoComplete="new-password"
              className="form-control"
              style={{ fontSize: '0.85rem', borderRadius: '8px', paddingRight: '38px' }}
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
              style={{ background: 'transparent' }}
              onClick={() => setShowAddPass(!showAddPass)}
              title={showAddPass ? "Hide password" : "Show password"}
              aria-label="Toggle password visibility"
            >
              {showAddPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <FormInputField
          label="Monthly Billing Price (₹)"
          type="number"
          name="new_admin_billing_field"
          autoComplete="off"
          value={form.billing_price}
          onChange={e => setForm(prev => ({ ...prev, billing_price: e.target.value }))}
          placeholder="e.g. 5000"
        />
        <button type="submit" className="btn w-100 py-2.5 fw-bold text-white rounded-3 mt-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>Create Administrator</button>
      </form>
    </Modal>
  );
}

// ─── EDIT ADMIN MODAL ───────────────────────────────────────────────────────
function EditAdminModal({ editing, onClose, onUpdateUser }) {
  const [editForm, setEditForm] = useState({});
  const [showEditPass, setShowEditPass] = useState(false);

  useEffect(() => {
    if (editing) {
      const userPassMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      const storedPass = userPassMap[editing.id] || userPassMap[editing.username] || userPassMap[editing.email];
      let defaultEditPass = 'Admin@Goa2026';
      if (editing.username === 'superadmin') defaultEditPass = 'superadmin';
      else if (editing.username === 'goa_operations') defaultEditPass = 'Ops@Goa2026';
      else if (editing.username) defaultEditPass = `${editing.username}@2026`;

      const displayPass = (storedPass && storedPass !== 'admin@2026')
        ? storedPass
        : (editing.plain_password && editing.plain_password !== 'admin@2026' ? editing.plain_password : defaultEditPass);
      setEditForm({
        username: editing.username || '',
        email: editing.email || '',
        role: editing.role || 'admin',
        password: displayPass,
        plain_password: displayPass,
        billing_price: editing.billing_price || 0,
        status: editing.status || 'active'
      });
      setShowEditPass(false);
    }
  }, [editing]);

  if (!editing) return null;

  const handleEdit = (e) => {
    e.preventDefault();
    const updatedPass = editForm.password || editing.plain_password || editing.password || 'admin@2026';
    try {
      const map = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      if (editing.id) map[editing.id] = updatedPass;
      if (editing.username) map[editing.username] = updatedPass;
      if (editing.email) map[editing.email] = updatedPass;
      localStorage.setItem('user_passwords', JSON.stringify(map));
    } catch (err) {}

    onUpdateUser({
      ...editing,
      ...editForm,
      password: updatedPass,
      plain_password: updatedPass
    });
    onClose();
  };

  return (
    <Modal title={`Edit Administrator — ${editing.username}`} onClose={onClose}>
      <form onSubmit={handleEdit}>
        <FormInputField label="Username" value={editForm.username || ''} onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))} required />
        <FormInputField label="Email Address" type="email" value={editForm.email || ''} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} required />
        
        <div className="mb-3">
          <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
            Password
          </label>
          <div className="position-relative">
            <input
              type={showEditPass ? 'text' : 'password'}
              className="form-control"
              style={{ fontSize: '0.85rem', borderRadius: '8px', paddingRight: '38px' }}
              value={editForm.password || ''}
              onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
            <button
              type="button"
              className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-2"
              style={{ background: 'transparent' }}
              onClick={() => setShowEditPass(!showEditPass)}
              title={showEditPass ? "Hide password" : "Show password"}
              aria-label="Toggle password visibility"
            >
              {showEditPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <FormInputField label="Monthly Billing Price (₹)" type="number" value={editForm.billing_price ?? ''} onChange={e => setEditForm(prev => ({ ...prev, billing_price: e.target.value }))} />
        
        <div className="mb-3">
          <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Account Status</label>
          <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.status || 'active'} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <button type="submit" className="btn w-100 py-2.5 fw-bold text-white rounded-3 mt-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>Save Changes</button>
      </form>
    </Modal>
  );
}

// ─── ADMIN MANAGEMENT TAB ────────────────────────────────────────────────────
function AdminManagementTab({ usersList = [], onAddUser, onUpdateUser, onDeleteUser }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [visiblePassMap, setVisiblePassMap] = useState({});

  const admins = usersList.filter(u => {
    const role = String(u.role || '').toLowerCase().trim();
    const isAdmin = ['admin', 'superadmin', 'subadmin', 'sub_admin', 'administrator'].includes(role);
    if (!isAdmin) return false;
    if (!search) return true;
    const s = search.toLowerCase().trim();
    return (u.username || '').toLowerCase().includes(s) ||
           (u.email || '').toLowerCase().includes(s) ||
           (u.name || '').toLowerCase().includes(s);
  });

  return (
    <Section
      title="Admin Management"
      subtitle="Create, edit, suspend, and manage all administrator accounts"
      actions={
        <button
          type="button"
          className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3 shadow-sm"
          style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}
          onClick={() => setShowAdd(true)}
        >
          <Plus size={14} /> Add Administrator
        </button>
      }
    >
      <div className="mb-3 position-relative">
        <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          className="form-control"
          style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }}
          placeholder="Search administrators by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <DataTable headers={['#', 'Username', 'Email Address', 'Password', 'Role', 'Status', 'Monthly Billing', 'Actions']} empty={admins.length === 0 ? 'No administrator accounts found' : null}>
        {admins.map((u, i) => {
          const userPassMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
          const storedPass = userPassMap[u.id] || userPassMap[u.username] || userPassMap[u.email];
          let defaultAdminPass = 'Admin@Goa2026';
          if (u.username === 'superadmin') defaultAdminPass = 'superadmin';
          else if (u.username === 'goa_operations') defaultAdminPass = 'Ops@Goa2026';
          else if (u.username) defaultAdminPass = `${u.username}@2026`;

          const displayPass = (storedPass && storedPass !== 'admin@2026')
            ? storedPass
            : (u.plain_password && u.plain_password !== 'admin@2026' ? u.plain_password : defaultAdminPass);
          return (
            <tr key={u.id}>
              <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
              <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{u.username}</td>
              <td className="px-3 py-2" style={{ color: '#475569' }}>{u.email}</td>
              <td className="px-3 py-2">
                <div className="d-flex align-items-center gap-1.5">
                  <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem', color: visiblePassMap[u.id] ? '#FF6333' : '#0f172a' }}>
                    {visiblePassMap[u.id] ? displayPass : '••••••••'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm p-0 text-muted border-0 ms-1"
                    style={{ background: 'transparent' }}
                    onClick={() => setVisiblePassMap(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                    title={visiblePassMap[u.id] ? "Hide password" : "Show password"}
                  >
                    {visiblePassMap[u.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </td>
              <td className="px-3 py-2"><StatusBadge status={u.role} /></td>
              <td className="px-3 py-2"><StatusBadge status={u.status || 'active'} /></td>
              <td className="px-3 py-2" style={{ color: '#475569' }}>₹{u.billing_price || 0}/month</td>
              <td className="px-3 py-2">
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2"
                    style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600 }}
                    onClick={() => setEditing(u)}
                  >
                    <Edit size={12} className="me-1" />Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2"
                    style={{ background: (u.status === 'suspended' ? '#dcfce7' : '#fef3c7'), color: (u.status === 'suspended' ? '#16a34a' : '#d97706'), fontSize: '0.72rem', fontWeight: 600 }}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to ${u.status === 'suspended' ? 'activate' : 'suspend'} this administrator?`)) {
                        onUpdateUser({ ...u, status: u.status === 'suspended' ? 'active' : 'suspended' });
                      }
                    }}
                  >
                    {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2"
                    style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600 }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this administrator account?')) {
                        onDeleteUser(u.id);
                      }
                    }}
                  >
                    <Trash2 size={12} className="me-1" />Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Add Admin Modal with Password Eye Icon */}
      <AddAdminModal show={showAdd} onClose={() => setShowAdd(false)} onAddUser={onAddUser} />

      {/* Edit Admin Modal with Password Eye Icon */}
      <EditAdminModal editing={editing} onClose={() => setEditing(null)} onUpdateUser={onUpdateUser} />
    </Section>
  );
}

// ─── USER MANAGEMENT TAB ─────────────────────────────────────────────────────
function UserManagementTab({ usersList = [] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [visibleUserPassMap, setVisibleUserPassMap] = useState({});
  const roles = ['all', 'superadmin', 'admin', 'hotel_vendor', 'vendor', 'customer'];
  
  const filtered = usersList.filter(u => {
    const uRole = String(u.role || '').toLowerCase().trim();
    const matchRole = roleFilter === 'all' || uRole === roleFilter.toLowerCase().trim();
    const s = search.toLowerCase().trim();
    const matchSearch = !s || (u.username || '').toLowerCase().includes(s) || 
                               (u.email || '').toLowerCase().includes(s) ||
                               (u.name || '').toLowerCase().includes(s);
    return matchRole && matchSearch;
  });

  const renderRoleBadge = (role) => {
    if (role === 'hotel_vendor') return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#d1fae5', color: '#059669', fontSize: '0.68rem' }}>HOTEL VENDOR</span>;
    if (role === 'vendor' || role === 'vehicle_vendor') return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem' }}>VEHICLE VENDOR</span>;
    if (role === 'admin') return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.68rem' }}>ADMINISTRATOR</span>;
    if (role === 'superadmin') return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#fce7f3', color: '#be185d', fontSize: '0.68rem' }}>SUPERADMIN</span>;
    return <StatusBadge status={role} />;
  };

  return (
    <Section title="Global User Management" subtitle="View, search, and manage all platform users by role">
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control" style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-1 flex-wrap">
          {roles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem', background: roleFilter === r ? '#0D1B2E' : '#f1f5f9', color: roleFilter === r ? '#fff' : '#475569' }}>
              {r === 'all' ? 'All Users' : r === 'hotel_vendor' ? 'Hotel Vendors' : r === 'vendor' ? 'Vehicle Vendors' : r === 'admin' ? 'Admins' : r}
            </button>
          ))}
        </div>
      </div>
      <DataTable headers={['#', 'Username', 'Email Address', 'Password', 'Role', 'Account Status', 'KYC Status']} empty={filtered.length === 0 ? 'No users found' : null}>
        {filtered.map((u, i) => {
          const userPassMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
          const storedPass = userPassMap[u.id] || userPassMap[u.username] || userPassMap[u.email];
          const isCustomer = u.role === 'customer';

          let defaultUserPass = `${u.username || 'User'}@2026`;
          if (u.username === 'superadmin') defaultUserPass = 'superadmin';
          else if (u.username === 'admin') defaultUserPass = 'Admin@Goa2026';
          else if (u.username === 'goa_operations') defaultUserPass = 'Ops@Goa2026';
          else if (u.role === 'hotel_vendor') defaultUserPass = 'Hotel@Goa2026';
          else if (u.role === 'flight_vendor') defaultUserPass = 'Flight@Goa2026';
          else if (u.role === 'vendor') defaultUserPass = 'Vendor@Fleet26';
          else if (u.role === 'b2b') defaultUserPass = `Partner@${String(u.username || u.id || '').slice(-4)}`;

          const displayPass = isCustomer
            ? ((storedPass && storedPass !== 'admin@2026' && storedPass !== 'Pass@123') ? storedPass : (u.plain_password && u.plain_password !== 'admin@2026' ? u.plain_password : 'OTP Login'))
            : ((storedPass && storedPass !== 'admin@2026') ? storedPass : (u.plain_password && u.plain_password !== 'admin@2026' ? u.plain_password : defaultUserPass));

          const isOtpAuth = isCustomer && (displayPass === 'OTP Login' || displayPass === 'OTP-Auth');

          return (
            <tr key={u.id}>
              <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
              <td className="px-3 py-2 fw-bold">{u.username}</td>
              <td className="px-3 py-2 text-muted">{u.email || '—'}</td>
              <td className="px-3 py-2">
                {isOtpAuth ? (
                  <span className="badge rounded-pill fw-semibold" style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '0.72rem', padding: '3px 8px' }}>
                    📱 Phone / OTP Login
                  </span>
                ) : (
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="font-monospace fw-bold" style={{ fontSize: '0.78rem', color: visibleUserPassMap[u.id] ? '#FF6333' : '#0f172a' }}>
                      {visibleUserPassMap[u.id] ? displayPass : '••••••••'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm p-0 text-muted border-0 ms-1"
                      style={{ background: 'transparent' }}
                      onClick={() => setVisibleUserPassMap(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                      title={visibleUserPassMap[u.id] ? "Hide password" : "Show password"}
                    >
                      {visibleUserPassMap[u.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                )}
              </td>
              <td className="px-3 py-2">{renderRoleBadge(u.role)}</td>
              <td className="px-3 py-2"><StatusBadge status={u.status || 'active'} /></td>
              <td className="px-3 py-2"><StatusBadge status={u.kyc_status || 'verified'} /></td>
            </tr>
          );
        })}
      </DataTable>
    </Section>
  );
}

// ─── VENDOR MANAGEMENT TAB (With Eye Icon / Details Modal) ──────────────────────
function VendorManagementTab({ vendors = [], cars = [], bikes = [], hotels = [], onApproveVendor }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewVendor, setViewVendor] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const handleApprove = async (vendorId) => {
    if (!onApproveVendor || approvingId) return;
    setApprovingId(vendorId);
    try {
      await onApproveVendor(vendorId);
    } catch (err) {
      alert(err.message || 'Failed to approve vendor');
    } finally {
      setApprovingId(null);
    }
  };
  
  const filtered = vendors.filter(v => {
    let matchType = true;
    if (typeFilter === 'hotel') matchType = v.role === 'hotel_vendor';
    else if (typeFilter === 'flight') matchType = v.role === 'flight_vendor';
    else if (typeFilter === 'vehicle') matchType = v.role === 'vendor' || !v.role;
    
    const matchSearch = (v.name || v.username || '').toLowerCase().includes(search.toLowerCase()) || (v.email || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const getRoleLabel = (role) => {
    if (role === 'hotel_vendor') return 'HOTEL VENDOR';
    if (role === 'flight_vendor') return 'FLIGHT VENDOR';
    return 'VEHICLE VENDOR';
  };

  const getVendorListingsCount = (vendorId) => {
    const vCars = cars.filter(c => c.vendor_id === vendorId || c.vendorId === vendorId).length;
    const vBikes = bikes.filter(b => b.vendor_id === vendorId || b.vendorId === vendorId).length;
    const vHotels = hotels.filter(h => h.vendor_id === vendorId || h.vendorId === vendorId).length;
    return { vCars, vBikes, vHotels, total: vCars + vBikes + vHotels };
  };

  return (
    <Section title="Vendor Management" subtitle="Approve, manage and monitor all hotel, flight and vehicle partner vendors">
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control" style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }} placeholder="Search vendors by name, email or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'hotel', 'vehicle', 'flight'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem', background: typeFilter === t ? '#0D1B2E' : '#f1f5f9', color: typeFilter === t ? '#fff' : '#475569' }}>
            {t === 'all' ? 'All Vendors' : t === 'hotel' ? 'Hotel Vendors' : t === 'flight' ? 'Flight Vendors' : 'Vehicle Vendors'}
          </button>
        ))}
      </div>

      <DataTable headers={['#', 'Vendor Name', 'Email Address', 'Category', 'City / Location', 'Status', 'Commission', 'Actions']} empty={filtered.length === 0 ? 'No vendors found' : null}>
        {filtered.map((v, i) => (
          <tr key={v.id}>
            <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
            <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{v.name || v.username}</td>
            <td className="px-3 py-2 text-muted">{v.email || '—'}</td>
            <td className="px-3 py-2">
              <span className="badge rounded-pill" style={{ background: v.role === 'hotel_vendor' ? '#e0e7ff' : v.role === 'flight_vendor' ? '#e0f2fe' : '#fef3c7', color: v.role === 'hotel_vendor' ? '#4338ca' : v.role === 'flight_vendor' ? '#0369a1' : '#b45309', fontSize: '0.65rem' }}>
                {getRoleLabel(v.role)}
              </span>
            </td>
            <td className="px-3 py-2">{v.city || '—'}</td>
            <td className="px-3 py-2"><StatusBadge status={v.status || 'active'} /></td>
            <td className="px-3 py-2" style={{ color: '#16a34a', fontWeight: 700 }}>10%</td>
            <td className="px-3 py-2">
              <div className="d-flex align-items-center gap-1.5">
                {(String(v.status || v.user_status || '').toLowerCase() === 'pending') && onApproveVendor && (
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2 fw-bold d-inline-flex align-items-center gap-1"
                    style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem' }}
                    disabled={approvingId === v.id}
                    onClick={() => handleApprove(v.id)}
                    title="Approve Pending Vendor"
                  >
                    <CheckCircle size={12} /> {approvingId === v.id ? 'Approving...' : 'Approve'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1"
                  style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600 }}
                  onClick={() => setViewVendor(v)}
                  title="View Vendor Details"
                >
                  <Eye size={12} /> View Details
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Vendor Details Modal */}
      {viewVendor && (
        <Modal title={`Vendor Details — ${viewVendor.name || viewVendor.username}`} onClose={() => setViewVendor(null)} size="580px">
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0 text-primary" style={{ fontSize: '14px' }}>{viewVendor.name || viewVendor.username}</h6>
                <StatusBadge status={viewVendor.status || 'active'} />
              </div>
              {(String(viewVendor.status || viewVendor.user_status || '').toLowerCase() === 'pending') && onApproveVendor && (
                <div className="p-2.5 rounded-2 d-flex align-items-center justify-content-between mb-2" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                  <small className="text-warning-emphasis fw-bold">Pending verification & approval</small>
                  <button
                    type="button"
                    className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-inline-flex align-items-center gap-1 text-white"
                    style={{ background: '#16a34a', fontSize: '0.75rem' }}
                    disabled={approvingId === viewVendor.id}
                    onClick={async () => {
                      await handleApprove(viewVendor.id);
                      setViewVendor(prev => prev ? { ...prev, status: 'active', user_status: 'active', verified: 1 } : null);
                    }}
                  >
                    <CheckCircle size={13} /> {approvingId === viewVendor.id ? 'Approving...' : 'Approve Account'}
                  </button>
                </div>
              )}
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Vendor ID:</span> <strong>{viewVendor.id}</strong></div>
                <div className="col-6"><span className="text-muted">Category:</span> <strong>{getRoleLabel(viewVendor.role)}</strong></div>
                <div className="col-6"><span className="text-muted">Email:</span> <strong>{viewVendor.email || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">Phone:</span> <strong>{viewVendor.phone || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">City / Area:</span> <strong>{viewVendor.city || 'Goa'}</strong></div>
                <div className="col-6"><span className="text-muted">Joined Date:</span> <strong>{viewVendor.created_at?.slice(0, 10) || '—'}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '13px' }}>Listings & Subscription Summary</h6>
              {(() => {
                const count = getVendorListingsCount(viewVendor.id);
                return (
                  <div className="row g-2" style={{ fontSize: '13px' }}>
                    <div className="col-6"><span className="text-muted">Total Fleet / Stays:</span> <strong>{count.total} active listings</strong></div>
                    <div className="col-6"><span className="text-muted">Monthly Plan:</span> <strong>₹{viewVendor.monthly_plan_price || 0}/mo</strong></div>
                    <div className="col-6"><span className="text-muted">Verification Status:</span> <strong>{viewVendor.verified ? 'Verified' : 'Pending Verification'}</strong></div>
                    <div className="col-6"><span className="text-muted">Platform Commission:</span> <strong className="text-success">10% Standard</strong></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─── LEAD MANAGEMENT TAB ───────────────────────────────────────────────────────
function LeadManagementTab({ aiLeads = [], customEnquiries = [], onRefresh, usersList = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAiLead, setSelectedAiLead] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const adminUsers = (usersList || []).filter(u => ['admin', 'superadmin'].includes(u.role));

  // Combine and sort leads
  const combinedLeads = [
    ...aiLeads.map(l => ({
      id: l.id,
      source: 'AI Assistant',
      name: l.name,
      phone: l.phone,
      email: '—',
      details: 'Inquired via Sophia AI Chatbot',
      created_at: l.created_at,
      status: l.status || 'Captured',
      assigned_to: l.assigned_to || null,
      raw: l,
      type: 'ai'
    })),
    ...customEnquiries.map(e => ({
      id: e.enquiry_id || e.id,
      source: 'Custom Trip CRM',
      name: e.customer_name || 'Enquiry',
      phone: e.phone,
      email: e.email || '—',
      details: `${e.destinations || 'Goa'} (${e.travel_dates || 'Flexible'}) - Budget: ${e.budget_range || 'Standard'}`,
      created_at: e.created_at,
      status: e.status || 'New Enquiry',
      assigned_to: e.assigned_to || null,
      raw: e,
      type: 'crm'
    }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const filtered = combinedLeads.filter(l => {
    let matchTab = true;
    if (activeSubTab === 'ai') matchTab = l.type === 'ai';
    if (activeSubTab === 'crm') matchTab = l.type === 'crm';

    const matchSearch = (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.assigned_to || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.status || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleUpdateCrmStatus = async (enquiryId, newStatus, newAssignedTo = null) => {
    const targetAssigned = newAssignedTo !== null ? newAssignedTo : (selectedEnquiry?.assigned_to || null);
    if (selectedEnquiry) {
      setSelectedEnquiry(prev => prev ? { ...prev, status: newStatus, assigned_to: targetAssigned } : null);
    }
    const target = customEnquiries.find(e => String(e.enquiry_id || e.id) === String(enquiryId));
    if (target) {
      target.status = newStatus;
      target.assigned_to = targetAssigned;
    }
    try {
      await api.updateEnquiryStatus(enquiryId, newStatus, targetAssigned);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Update status fallback:', err.message);
    }
  };

  const handleUpdateCrmAssignment = async (enquiryId, newAssignedTo) => {
    const currentStatus = selectedEnquiry?.status || 'New Enquiry';
    const val = newAssignedTo || null;
    if (selectedEnquiry) {
      setSelectedEnquiry(prev => prev ? { ...prev, assigned_to: val } : null);
    }
    const target = customEnquiries.find(e => String(e.enquiry_id || e.id) === String(enquiryId));
    if (target) {
      target.assigned_to = val;
    }
    try {
      await api.updateEnquiryStatus(enquiryId, currentStatus, val);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Update assignment fallback:', err.message);
    }
  };

  return (
    <Section
      title="Lead Management"
      subtitle="View, track, assign and follow up with all AI chatbot captures and custom trip enquiries"
      actions={
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm"
          onClick={() => { if (onRefresh) onRefresh(); }}
        >
          <RefreshCw size={13} /> Refresh Leads
        </button>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-control"
            style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }}
            placeholder="Search leads by name, phone, email, status, or assigned admin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="d-flex gap-1 flex-wrap">
          {[
            { id: 'all', label: `All Leads (${combinedLeads.length})` },
            { id: 'ai', label: `AI Assistant (${aiLeads.length})` },
            { id: 'crm', label: `Custom Trip Enquiries (${customEnquiries.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className="btn btn-sm px-3 py-1 rounded-pill fw-bold"
              style={{
                fontSize: '0.72rem',
                background: activeSubTab === tab.id ? '#0D1B2E' : '#f1f5f9',
                color: activeSubTab === tab.id ? '#fff' : '#475569'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        headers={['#', 'Lead Name', 'Phone & Email', 'Lead Source', 'Requirements / Summary', 'Assigned To', 'Status / Stage', 'Date', 'Actions']}
        empty={filtered.length === 0 ? 'No leads found in the system' : null}
      >
        {filtered.map((lead, i) => (
          <tr key={lead.id}>
            <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{i + 1}</td>
            <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{lead.name || 'Anonymous Lead'}</td>
            <td className="px-3 py-2">
              <div className="fw-bold" style={{ color: '#0f172a', fontSize: '0.8rem' }}>{lead.phone || '—'}</div>
              {lead.email && lead.email !== '—' && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{lead.email}</div>}
            </td>
            <td className="px-3 py-2">
              <span
                className="badge rounded-pill"
                style={{
                  background: lead.type === 'ai' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                  color: lead.type === 'ai' ? '#059669' : '#7c3aed',
                  fontSize: '0.65rem'
                }}
              >
                {lead.source}
              </span>
            </td>
            <td className="px-3 py-2" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.details}
            </td>
            <td className="px-3 py-2">
              {lead.assigned_to ? (
                <span className="badge rounded-pill fw-semibold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.7rem' }}>
                  {lead.assigned_to}
                </span>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Unassigned</span>
              )}
            </td>
            <td className="px-3 py-2"><StatusBadge status={lead.status} /></td>
            <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{lead.created_at?.slice(0, 10) || '—'}</td>
            <td className="px-3 py-2">
              <button
                type="button"
                className="btn btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1"
                style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600 }}
                onClick={() => {
                  if (lead.type === 'ai') setSelectedAiLead(lead.raw);
                  else setSelectedEnquiry(lead.raw);
                }}
                title="View Lead Details"
              >
                <Eye size={12} /> View Details
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* AI Lead Chat Transcript Modal */}
      {selectedAiLead && (
        <Modal title={`AI Lead Details — ${selectedAiLead.name}`} onClose={() => setSelectedAiLead(null)} size="560px">
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Lead Name:</span> <strong>{selectedAiLead.name}</strong></div>
                <div className="col-6"><span className="text-muted">Phone Number:</span> <strong>{selectedAiLead.phone}</strong></div>
                <div className="col-6"><span className="text-muted">Captured Date:</span> <strong>{selectedAiLead.created_at?.slice(0, 16) || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">Lead ID:</span> <strong>{selectedAiLead.id}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2.5" style={{ fontSize: '13px', color: '#0f172a' }}>AI Chatbot Conversation Transcript</h6>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {(() => {
                  let history = [];
                  try {
                    history = typeof selectedAiLead.chat_history === 'string' ? JSON.parse(selectedAiLead.chat_history) : (selectedAiLead.chat_history || []);
                  } catch (e) { history = []; }
                  
                  if (!Array.isArray(history) || history.length === 0) {
                    return <div className="text-muted small">No transcript recorded for this lead.</div>;
                  }

                  return history.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-3 small ${msg.role === 'user' ? 'bg-white ms-auto border' : 'bg-light me-auto border-0 text-primary'}`}
                      style={{ maxWidth: '85%' }}
                    >
                      <div className="fw-bold mb-0.5" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: msg.role === 'user' ? '#64748b' : '#FF6333' }}>
                        {msg.role === 'user' ? 'Customer' : 'Sophia AI Assistant'}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Enquiry Details Modal */}
      {selectedEnquiry && (
        <Modal title={`Custom Enquiry Details — #${selectedEnquiry.enquiry_id || selectedEnquiry.id}`} onClose={() => setSelectedEnquiry(null)} size="600px">
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Customer Contact Info</h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Status:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', fontSize: '0.75rem' }}
                    value={selectedEnquiry.status || 'New Enquiry'}
                    onChange={e => handleUpdateCrmStatus(selectedEnquiry.enquiry_id || selectedEnquiry.id, e.target.value)}
                  >
                    {['New Enquiry', 'Assigned', 'First Call Pending', 'First Call Completed', 'Customer Interested', 'Quotation Sent', 'Booking Confirmed', 'Closed', 'Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Name:</span> <strong>{selectedEnquiry.customer_name}</strong></div>
                <div className="col-6"><span className="text-muted">Phone:</span> <strong>{selectedEnquiry.phone}</strong></div>
                <div className="col-6"><span className="text-muted">Email:</span> <strong>{selectedEnquiry.email || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">Departure City:</span> <strong>{selectedEnquiry.departure_city || '—'}</strong></div>
              </div>
            </div>

            {/* Assignment Box */}
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Assigned Administrator / User</h6>
                  <span className="text-muted small">Lead owner responsible for follow-ups</span>
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '180px', fontSize: '0.8rem', fontWeight: 600 }}
                  value={selectedEnquiry.assigned_to || ''}
                  onChange={e => handleUpdateCrmAssignment(selectedEnquiry.enquiry_id || selectedEnquiry.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map(admin => (
                    <option key={admin.id || admin.username} value={admin.username}>
                      {admin.username} ({admin.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2.5" style={{ fontSize: '13px' }}>Trip Requirements & Preferences</h6>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-12"><span className="text-muted">Destinations:</span> <strong>{selectedEnquiry.destinations || 'Goa'}</strong></div>
                <div className="col-6"><span className="text-muted">Dates:</span> <strong>{selectedEnquiry.travel_dates || 'Flexible'}</strong></div>
                <div className="col-6"><span className="text-muted">Travellers:</span> <strong>{selectedEnquiry.adults || 2} Adults, {selectedEnquiry.children || 0} Children</strong></div>
                <div className="col-6"><span className="text-muted">Budget Range:</span> <strong>{selectedEnquiry.budget_range || 'Standard'}</strong></div>
                <div className="col-6"><span className="text-muted">Hotel Type:</span> <strong>{selectedEnquiry.hotel_category || '3/4 Star'}</strong></div>
                <div className="col-12 mt-2">
                  <span className="text-muted d-block mb-1">Required Inclusions:</span>
                  <div className="d-flex flex-wrap gap-1.5">
                    {selectedEnquiry.req_flight == 1 && <span className="badge bg-primary">Flights</span>}
                    {selectedEnquiry.req_car == 1 && <span className="badge bg-success">Car Rental</span>}
                    {selectedEnquiry.req_bike == 1 && <span className="badge bg-info">Bike Rental</span>}
                    {selectedEnquiry.req_airport_pickup == 1 && <span className="badge bg-warning text-dark">Airport Pickup</span>}
                    {selectedEnquiry.req_sightseeing == 1 && <span className="badge bg-secondary">Sightseeing</span>}
                  </div>
                </div>
                {selectedEnquiry.special_requests && (
                  <div className="col-12 mt-2">
                    <span className="text-muted d-block">Special Requests:</span>
                    <div className="p-2 bg-white rounded border small mt-1">{selectedEnquiry.special_requests}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─── KYC & VERIFICATION TAB ──────────────────────────────────────────────────
function KYCTab({ vendors = [], onApproveVendor }) {
  const [approvingId, setApprovingId] = useState(null);

  const isApproved = (v) => {
    const s = String(v.status || v.user_status || '').toLowerCase().trim();
    return s === 'active' || (s !== 'pending' && Boolean(v.verified));
  };

  const pending = vendors.filter(v => !isApproved(v));
  const approvedList = vendors.filter(v => isApproved(v));

  const handleApprove = async (vendorId) => {
    if (!onApproveVendor || approvingId) return;
    setApprovingId(vendorId);
    try {
      await onApproveVendor(vendorId);
    } catch (err) {
      alert(err.message || 'Failed to approve vendor');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Section title="KYC & Vendor Verification" subtitle="Review and approve vendor documents, GST, PAN, and bank details">
      <div className="row g-3 mb-4">
        <div className="col-md-4"><StatCard label="Pending Verification" value={pending.length} icon={<AlertTriangle size={18} />} color="#ca8a04" /></div>
        <div className="col-md-4"><StatCard label="Approved Vendors" value={approvedList.length} icon={<CheckCircle size={18} />} color="#16a34a" /></div>
        <div className="col-md-4"><StatCard label="Total Registered Vendors" value={vendors.length} icon={<Building size={18} />} color="#2563eb" /></div>
      </div>
      <DataTable headers={['Vendor', 'Email Address', 'Type', 'GST Status', 'PAN Status', 'Bank Status', 'Verification', 'Action']} empty={vendors.length === 0 ? 'No vendors found' : null}>
        {vendors.map(v => {
          const approved = isApproved(v);
          const isCurrentLoading = approvingId === v.id;
          return (
            <tr key={v.id}>
              <td className="px-3 py-2 fw-bold">{v.name || v.username}</td>
              <td className="px-3 py-2 text-muted">{v.email || '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={v.role === 'hotel_vendor' ? 'hotel_vendor' : (v.role === 'flight_vendor' ? 'flight_vendor' : 'vendor')} /></td>
              <td className="px-3 py-2"><StatusBadge status={v.gst_number ? 'approved' : 'pending'} /></td>
              <td className="px-3 py-2"><StatusBadge status={v.pan_number ? 'approved' : 'pending'} /></td>
              <td className="px-3 py-2"><StatusBadge status={v.bank_account ? 'approved' : 'pending'} /></td>
              <td className="px-3 py-2"><StatusBadge status={approved ? 'approved' : 'pending'} /></td>
              <td className="px-3 py-2">
                {approved ? (
                  <span className="badge rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem', padding: '5px 10px' }}>
                    ✓ Approved
                  </span>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-sm px-2.5 py-1 rounded-2 fw-bold" 
                    style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem' }}
                    disabled={isCurrentLoading}
                    onClick={() => handleApprove(v.id)}
                  >
                    {isCurrentLoading ? 'Approving...' : 'Approve'}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </Section>
  );
}

// ─── BOOKING CLASSIFIER HELPERS ───────────────────────────────────────────────
export const isFlightBookingItem = (b) => {
  if (!b) return false;
  const type = String(b.type || b.item_type || '').toLowerCase();
  if (type === 'flight') return true;
  if (b.flight_id || b.flight_number) return true;
  const iId = String(b.item_id || '').toLowerCase();
  if (iId.startsWith('fl-') || iId.startsWith('flt-') || iId.startsWith('flight-')) return true;
  const name = String(b.item_name || b.name || '').toLowerCase();
  return name.includes('flight') || name.includes('air india') || name.includes('indigo') || 
         name.includes('vistara') || name.includes('akasa') || name.includes('spicejet');
};

export const isHotelBookingItem = (b) => {
  if (!b) return false;
  if (isFlightBookingItem(b)) return false;
  
  const name = String(b.item_name || b.name || '').toLowerCase();
  const pkgType = String(b.package_type || '').toLowerCase();
  
  // Custom combos, craft my trip, or packages are strictly Trip Bookings
  if (name.includes('craft my trip') || name.includes('custom trip') || 
      name.includes('package') || name.includes('tour') || 
      name.includes('experience') || name.includes('self drive') ||
      pkgType.includes('package') || pkgType.includes('self_drive')) {
    return false;
  }
  
  const type = String(b.type || b.item_type || '').toLowerCase();
  if (type === 'hotel') return true;
  if (b.hotel_id || b.room_id || b.room_type) return true;
  
  const iId = String(b.item_id || '').toLowerCase();
  if (iId.startsWith('hotel-') || iId.startsWith('htl-')) return true;
  if (iId.startsWith('car-') || iId.startsWith('bike-') || iId.startsWith('veh-') || iId.startsWith('pkg-') || iId.startsWith('fl-')) return false;

  return name.includes('hotel') || name.includes('resort') || name.includes('stay') || 
         name.includes('marriott') || name.includes('taj') || name.includes('inn') || 
         name.includes('palms') || name.includes('villa') || name.includes('suite') || 
         name.includes('cidade') || name.includes('leela') || name.includes('alila') || 
         name.includes('moustache') || name.includes('exotica');
};

export const isVehicleBookingItem = (b) => {
  if (!b) return false;
  if (isFlightBookingItem(b)) return false;
  
  const name = String(b.item_name || b.name || '').toLowerCase();
  const pkgType = String(b.package_type || '').toLowerCase();
  
  // Custom combos, craft my trip, or packages are strictly Trip Bookings
  if (name.includes('craft my trip') || name.includes('custom trip') || 
      name.includes('package') || name.includes('tour') || 
      name.includes('experience') || name.includes('self drive') ||
      pkgType.includes('package') || pkgType.includes('self_drive')) {
    return false;
  }
  
  const type = String(b.type || b.item_type || '').toLowerCase();
  if (['vehicle', 'car', 'bike', 'rental'].includes(type)) return true;
  if (b.vehicle_id || b.car_id || b.bike_id) return true;
  
  const iId = String(b.item_id || '').toLowerCase();
  if (iId.startsWith('car-') || iId.startsWith('bike-') || iId.startsWith('veh-')) return true;
  if (iId.startsWith('hotel-') || iId.startsWith('htl-') || iId.startsWith('pkg-') || iId.startsWith('fl-')) return false;

  return name.includes('thar') || name.includes('swift') || name.includes('creta') || 
         name.includes('ertiga') || name.includes('fortuner') || name.includes('classic') || 
         name.includes('activa') || name.includes('yamaha') || name.includes('himalayan') || 
         name.includes('innova') || name.includes('scorpio');
};

export const isActivityBookingItem = (b) => {
  if (!b) return false;
  const type = String(b.type || b.item_type || '').trim().toLowerCase();
  const pkgType = String(b.package_type || '').trim().toLowerCase();
  const itemId = String(b.item_id || '').trim().toLowerCase();

  if (type === 'activity' || type === 'sightseeing' || pkgType === 'activity' || pkgType === 'sightseeing') {
    return true;
  }
  if (itemId.startsWith('act-') || itemId.startsWith('activity-') || itemId.startsWith('sight-') || itemId.startsWith('act_')) {
    return true;
  }
  return false;
};

export const isTripPackageBookingItem = (b) => {
  if (!b) return false;
  if (isFlightBookingItem(b)) return false;
  if (isActivityBookingItem(b)) return false;
  if (isHotelBookingItem(b)) return false;
  if (isVehicleBookingItem(b)) return false;
  return true;
};

// ─── BOOKINGS TAB (Hotel, Vehicle, Activity & Flight Bookings) ───────────────
function BookingsTab({ bookings = [], type, vendors = [], onRefresh }) {
  const [search, setSearch] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('search') || sessionStorage.getItem('tg_booking_search') || '';
      if (sessionStorage.getItem('tg_booking_search')) {
        sessionStorage.removeItem('tg_booking_search');
      }
      return q;
    } catch (_) {
      return '';
    }
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewBooking, setViewBooking] = useState(null);

  const filtered = bookings.filter(b => {
    let matchType = false;
    if (!type || type === 'all') {
      matchType = true;
    } else if (type === 'hotel') {
      matchType = isHotelBookingItem(b);
    } else if (type === 'vehicle') {
      matchType = isVehicleBookingItem(b);
    } else if (type === 'flight') {
      matchType = isFlightBookingItem(b);
    } else if (type === 'activity') {
      matchType = isActivityBookingItem(b);
    } else if (type === 'trip' || type === 'package') {
      matchType = isTripPackageBookingItem(b);
    }

    const matchStatus = statusFilter === 'all' || b.status?.toLowerCase() === statusFilter?.toLowerCase();
    const matchSearch = (b.name || b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.id || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });
  const statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      if (viewBooking && String(viewBooking.id) === String(bookingId)) {
        setViewBooking({ ...viewBooking, status: newStatus });
      }
      const target = bookings.find(b => String(b.id) === String(bookingId));
      if (target) target.status = newStatus;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update booking status: ' + err.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
    try {
      await api.deleteBooking(bookingId);
      if (viewBooking && String(viewBooking.id) === String(bookingId)) {
        setViewBooking(null);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete booking: ' + err.message);
    }
  };

  const typeLabel = type === 'hotel' ? 'Hotel' : type === 'vehicle' ? 'Vehicle' : type === 'activity' ? 'Sightseeing & Activity' : 'Flight';
  const itemHeader = type === 'hotel' ? 'Hotel & Room' : type === 'vehicle' ? 'Vehicle & Specs' : type === 'activity' ? 'Activity & Location' : 'Flight Route & Airline';

  return (
    <Section
      title={`${typeLabel} Bookings`}
      subtitle={`Manage all platform ${typeLabel.toLowerCase()} reservations — view customer details, verify payments and update status`}
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control" style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }} placeholder={`Search ${typeLabel.toLowerCase()} bookings by customer or item...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem', background: statusFilter === s ? '#0D1B2E' : '#f1f5f9', color: statusFilter === s ? '#fff' : '#475569', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All Bookings' : s}
            </button>
          ))}
        </div>
      </div>

      <DataTable headers={['ID', 'Customer Information', itemHeader, 'Amount', 'Status', 'Payment', 'Date', 'Actions']} empty={filtered.length === 0 ? `No ${typeLabel.toLowerCase()} bookings found` : null}>
        {filtered.map(b => {
          const v = vendors.find(v => v.id === b.vendor_id);
          const isPending = (b.status || '').toLowerCase() === 'pending';
          const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
          return (
            <tr key={b.id}>
              <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>#{b.id}</td>
              <td className="px-3 py-2">
                <div className="fw-bold" style={{ color: '#0D1B2E' }}>{b.name || b.customer_name || '—'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.phone || 'No phone'}</div>
              </td>
              <td className="px-3 py-2">
                <div className="fw-bold" style={{ color: '#0f172a' }}>{b.item_name || '—'}</div>
                {type === 'activity' ? (
                  <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <MapPin size={11} className="text-danger flex-shrink-0" />
                    <span>{b.pickup_loc || b.location || 'Goa'}</span>
                    {v && v.role === 'activity_vendor' && (
                      <span className="badge ms-1" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>Vendor: {v.name}</span>
                    )}
                  </div>
                ) : type === 'hotel' ? (
                  <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <MapPin size={11} className="text-secondary flex-shrink-0" />
                    <span>{b.pickup_loc || 'Goa Resort'}</span>
                    {(v || b.vendor_id) && (
                      <span className="badge ms-1" style={{ background: '#d1fae5', color: '#059669', fontSize: '0.65rem' }}>{v?.name || b.vendor_id}</span>
                    )}
                  </div>
                ) : (
                  (v || b.vendor_id) && (
                    <div className="mt-0.5">
                      <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>Vendor: {v?.name || b.vendor_id}</span>
                    </div>
                  )
                )}
              </td>
              <td className="px-3 py-2" style={{ whiteSpace: 'nowrap' }}>
                <div className="fw-bold text-dark">₹{parseFloat(b.total_amount || b.total_paid || b.amount_paid || 0).toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Paid: ₹{parseFloat(b.amount_paid || b.total_paid || 0).toLocaleString()}</div>
              </td>
              <td className="px-3 py-2" style={{ whiteSpace: 'nowrap' }}><StatusBadge status={b.status || 'pending'} /></td>
              <td className="px-3 py-2" style={{ whiteSpace: 'nowrap' }}><StatusBadge status={b.payment_status || 'pending'} /></td>
              <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{b.created_at?.slice(0, 10) || b.pickup_date || '—'}</td>
              <td className="px-3 py-2" style={{ whiteSpace: 'nowrap' }}>
                <div className="d-flex align-items-center gap-1.5 flex-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1 shadow-sm"
                    style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.72rem', fontWeight: 600, border: '1px solid #bfdbfe' }}
                    onClick={(e) => { e.stopPropagation(); setViewBooking(b); }}
                    title="View Booking Details"
                  >
                    <Eye size={12} /> View
                  </button>

                  <select
                    className="form-select form-select-sm"
                    style={{
                      width: '110px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 20px 3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                    value={b.status || 'Pending'}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleUpdateStatus(b.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-sm p-1 text-danger border-0 opacity-75 hover-opacity-100"
                    style={{ background: 'transparent' }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteBooking(b.id); }}
                    title="Delete Booking"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {/* Booking Details Modal */}
      {viewBooking && (
        <Modal 
          title={`${type === 'hotel' ? 'Hotel' : type === 'vehicle' ? 'Vehicle' : type === 'activity' ? 'Sightseeing & Activity' : 'Flight'} Booking Details — #${viewBooking.id}`} 
          onClose={() => setViewBooking(null)} 
          size="620px"
        >
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Customer Information</h6>
                <StatusBadge status={viewBooking.status || 'pending'} />
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Name:</span> <strong>{viewBooking.name || viewBooking.customer_name}</strong></div>
                <div className="col-6"><span className="text-muted">Phone:</span> <strong>{viewBooking.phone}</strong></div>
                <div className="col-6"><span className="text-muted">Email:</span> <strong>{viewBooking.email || '—'}</strong></div>
                {type === 'vehicle' && viewBooking.license && (
                  <div className="col-6"><span className="text-muted">Driving License:</span> <strong>{viewBooking.license}</strong></div>
                )}
                <div className="col-6"><span className="text-muted">Location / City:</span> <strong>{viewBooking.pickup_loc || 'Goa'}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2.5" style={{ fontSize: '13px' }}>
                {type === 'activity' ? 'Activity & Reservation Details' : type === 'hotel' ? 'Hotel Stay & Schedule' : 'Reservation Schedule & Vendor'}
              </h6>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-12"><span className="text-muted">{type === 'activity' ? 'Activity Name:' : 'Reserved Item:'}</span> <strong>{viewBooking.item_name}</strong></div>
                <div className="col-6"><span className="text-muted">{type === 'activity' ? 'Activity Date:' : 'Pickup Schedule:'}</span> <strong>{viewBooking.pickup_date || '—'} {viewBooking.pickup_time || ''}</strong></div>
                {type !== 'activity' && (
                  <div className="col-6"><span className="text-muted">Drop Schedule:</span> <strong>{viewBooking.drop_date || '—'} {viewBooking.drop_time || ''}</strong></div>
                )}
                <div className="col-6"><span className="text-muted">{type === 'activity' ? 'Duration / Type:' : 'Booking Duration:'}</span> <strong>{viewBooking.duration || (viewBooking.booking_days ? `${viewBooking.booking_days} Days` : 'Full Day')}</strong></div>
                {viewBooking.vendor_id && viewBooking.vendor_id !== 'vendor-1' && (
                  <div className="col-6"><span className="text-muted">Vendor ID:</span> <strong>{viewBooking.vendor_id}</strong></div>
                )}
                {viewBooking.pickup_loc && (
                  <div className="col-6"><span className="text-muted">Starting Point / Location:</span> <strong>{viewBooking.pickup_loc}</strong></div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Payment Summary</h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Change Status:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', fontSize: '0.75rem' }}
                    value={viewBooking.status || 'Pending'}
                    onChange={e => handleUpdateStatus(viewBooking.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Total Amount:</span> <strong className="text-success">₹{parseFloat(viewBooking.total_amount || viewBooking.total_paid || 0).toLocaleString()}</strong></div>
                <div className="col-6"><span className="text-muted">Amount Paid:</span> <strong>₹{parseFloat(viewBooking.amount_paid || viewBooking.total_paid || 0).toLocaleString()}</strong></div>
                <div className="col-6"><span className="text-muted">Remaining Balance:</span> <strong>₹{parseFloat(viewBooking.remaining_amount || 0).toLocaleString()}</strong></div>
                <div className="col-6"><span className="text-muted">Payment Status:</span> <StatusBadge status={viewBooking.payment_status || 'Pending'} /></div>
                <div className="col-6"><span className="text-muted">Payment Method:</span> <strong>{viewBooking.payment_method || 'Direct'}</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─── TRIP BOOKINGS TAB (Under Operations) ──────────────────────────────────────
function TripBookingsTab({ bookings = [], customEnquiries = [], vendors = [], onRefresh }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('search') || sessionStorage.getItem('tg_booking_search') || '';
      if (sessionStorage.getItem('tg_booking_search')) {
        sessionStorage.removeItem('tg_booking_search');
      }
      return q;
    } catch (_) {
      return '';
    }
  });
  const [viewBooking, setViewBooking] = useState(null);
  const [viewEnquiry, setViewEnquiry] = useState(null);

  // Strictly filter package and trip bookings (Hotel, Vehicle & Flight bookings excluded)
  const allTripBookings = bookings.filter(b => isTripPackageBookingItem(b));

  const craftMyTripBookings = allTripBookings.filter(b => {
    const name = (b.item_name || b.name || '').toLowerCase();
    return name.includes('craft my trip') || name.includes('custom trip');
  });

  const selfDriveBookings = allTripBookings.filter(b => {
    const name = (b.item_name || b.name || '').toLowerCase();
    const pkgType = (b.package_type || '').toLowerCase();
    return !name.includes('craft my trip') && !name.includes('custom trip') &&
      (name.includes('self drive') || name.includes('self-drive') || pkgType.includes('self_drive') || (b.customizations && String(b.customizations).includes('self_drive')));
  });

  const standardPackageBookings = allTripBookings.filter(b => {
    const name = (b.item_name || b.name || '').toLowerCase();
    const pkgType = (b.package_type || '').toLowerCase();
    const isCraft = name.includes('craft my trip') || name.includes('custom trip');
    const isSelf = name.includes('self drive') || name.includes('self-drive') || pkgType.includes('self_drive');
    return !isCraft && !isSelf;
  });

  const currentBookingsList = activeCategory === 'packages' 
    ? standardPackageBookings 
    : activeCategory === 'selfdrive' 
    ? selfDriveBookings 
    : activeCategory === 'craft_my_trip' 
    ? craftMyTripBookings 
    : allTripBookings;

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      if (viewBooking) setViewBooking({ ...viewBooking, status: newStatus });
      const target = bookings.find(b => b.id === bookingId);
      if (target) target.status = newStatus;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      await api.updateEnquiryStatus(enquiryId, newStatus);
      if (viewEnquiry) setViewEnquiry({ ...viewEnquiry, status: newStatus });
      const target = customEnquiries.find(e => (e.enquiry_id || e.id) === enquiryId);
      if (target) target.status = newStatus;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to update enquiry status: ' + err.message);
    }
  };

  return (
    <Section
      title="Trip & Holiday Bookings"
      subtitle="Manage all trip packages, self-drive holiday combos, and custom trip inquiries"
      actions={
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm"
          onClick={() => { if (onRefresh) onRefresh(); }}
        >
          <RefreshCw size={13} /> Refresh Data
        </button>
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-control"
            style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.85rem' }}
            placeholder="Search trip bookings by customer name, package or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="d-flex gap-1 flex-wrap">
          {[
            { id: 'all', label: `All Trips (${allTripBookings.length + customEnquiries.length})` },
            { id: 'packages', label: `Trip Packages (${standardPackageBookings.length})` },
            { id: 'selfdrive', label: `Self Drive Holidays (${selfDriveBookings.length})` },
            { id: 'craft_my_trip', label: `Craft My Trip (${craftMyTripBookings.length + customEnquiries.length})` }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className="btn btn-sm px-3 py-1 rounded-pill fw-bold"
              style={{
                fontSize: '0.72rem',
                background: activeCategory === c.id ? '#0D1B2E' : '#f1f5f9',
                color: activeCategory === c.id ? '#fff' : '#475569'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {activeCategory === 'craft_my_trip' && customEnquiries.length > 0 && craftMyTripBookings.length === 0 ? (
        <DataTable
          headers={['Enquiry ID', 'Customer Information', 'Destinations & Dates', 'Budget Range', 'Status', 'Date Received', 'Actions']}
          empty="No custom trip inquiries found"
        >
          {customEnquiries
            .filter(e =>
              (e.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (e.phone || '').toLowerCase().includes(search.toLowerCase()) ||
              (e.destinations || '').toLowerCase().includes(search.toLowerCase())
            )
            .map((e) => (
              <tr key={e.enquiry_id || e.id}>
                <td className="px-3 py-2 fw-bold" style={{ color: '#7c3aed', fontSize: '0.78rem' }}>#{e.enquiry_id || e.id}</td>
                <td className="px-3 py-2">
                  <div className="fw-bold" style={{ color: '#0D1B2E' }}>{e.customer_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{e.phone} {e.email ? `· ${e.email}` : ''}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="fw-bold" style={{ color: '#0f172a' }}>{e.destinations || 'Goa'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{e.travel_dates || 'Flexible Dates'}</div>
                </td>
                <td className="px-3 py-2 fw-bold" style={{ color: '#059669' }}>{e.budget_range || 'Standard'}</td>
                <td className="px-3 py-2"><StatusBadge status={e.status || 'New Enquiry'} /></td>
                <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{e.created_at?.slice(0, 10) || '—'}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="btn btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1"
                    style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600 }}
                    onClick={() => setViewEnquiry(e)}
                  >
                    <Eye size={12} /> View Enquiry
                  </button>
                </td>
              </tr>
            ))}
        </DataTable>
      ) : (
        <DataTable
          headers={['Booking ID', 'Customer Information', 'Package / Trip Item', 'Amount & Payment', 'Status', 'Travel Dates', 'Actions']}
          empty={currentBookingsList.length === 0 ? 'No trip bookings found' : null}
        >
          {currentBookingsList
            .filter(b =>
              (b.name || b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (b.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
              (b.phone || '').toLowerCase().includes(search.toLowerCase())
            )
            .map(b => (
              <tr key={b.id}>
                <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.78rem' }}>#{b.id}</td>
                <td className="px-3 py-2">
                  <div className="fw-bold" style={{ color: '#0D1B2E' }}>{b.name || b.customer_name || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.phone || 'No phone'}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="fw-bold" style={{ color: '#0f172a' }}>{b.item_name || 'Trip Package'}</div>
                  <div className="badge bg-light text-dark border mt-0.5" style={{ fontSize: '0.65rem' }}>
                    {b.booking_days ? `${b.booking_days} Days` : 'Complete Tour'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="fw-bold text-success">₹{parseFloat(b.total_amount || b.total_paid || b.amount_paid || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Paid: ₹{parseFloat(b.amount_paid || b.total_paid || 0).toLocaleString()} <StatusBadge status={b.payment_status || 'Pending'} />
                  </div>
                </td>
                <td className="px-3 py-2"><StatusBadge status={b.status || 'pending'} /></td>
                <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{b.pickup_date || b.created_at?.slice(0, 10) || '—'}</td>
                <td className="px-3 py-2">
                  <div className="d-flex align-items-center gap-1.5">
                    <button
                      type="button"
                      className="btn btn-sm px-2.5 py-1 rounded-2 d-inline-flex align-items-center gap-1"
                      style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600 }}
                      onClick={() => setViewBooking(b)}
                    >
                      <Eye size={12} /> View
                    </button>
                    <select
                      className="form-select form-select-sm"
                      style={{
                        width: '115px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '4px 24px 4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                      value={b.status || 'Pending'}
                      onChange={e => handleUpdateStatus(b.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
        </DataTable>
      )}

      {/* Booking View Modal */}
      {viewBooking && (
        <Modal title={`Trip Booking Details — #${viewBooking.id}`} onClose={() => setViewBooking(null)} size="620px">
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Customer Details</h6>
                <StatusBadge status={viewBooking.status || 'Pending'} />
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Name:</span> <strong>{viewBooking.name || viewBooking.customer_name}</strong></div>
                <div className="col-6"><span className="text-muted">Phone:</span> <strong>{viewBooking.phone}</strong></div>
                <div className="col-6"><span className="text-muted">Email:</span> <strong>{viewBooking.email || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">Pickup Location:</span> <strong>{viewBooking.pickup_loc || 'Goa'}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2.5" style={{ fontSize: '13px' }}>Package & Itinerary Info</h6>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-12"><span className="text-muted">Package:</span> <strong>{viewBooking.item_name}</strong></div>
                <div className="col-6"><span className="text-muted">Travel Dates:</span> <strong>{viewBooking.pickup_date || '—'} {viewBooking.drop_date ? `to ${viewBooking.drop_date}` : ''}</strong></div>
                <div className="col-6"><span className="text-muted">Duration:</span> <strong>{viewBooking.booking_days || 1} Days</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Payment & Status</h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Update Status:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', fontSize: '0.75rem' }}
                    value={viewBooking.status || 'Pending'}
                    onChange={e => handleUpdateStatus(viewBooking.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Total Amount:</span> <strong className="text-success">₹{parseFloat(viewBooking.total_amount || viewBooking.total_paid || 0).toLocaleString()}</strong></div>
                <div className="col-6"><span className="text-muted">Amount Paid:</span> <strong>₹{parseFloat(viewBooking.amount_paid || viewBooking.total_paid || 0).toLocaleString()}</strong></div>
                <div className="col-6"><span className="text-muted">Payment Status:</span> <StatusBadge status={viewBooking.payment_status || 'Pending'} /></div>
                <div className="col-6"><span className="text-muted">Payment Method:</span> <strong>{viewBooking.payment_method || 'Online'}</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Enquiry View Modal */}
      {viewEnquiry && (
        <Modal title={`Custom Trip Enquiry — #${viewEnquiry.enquiry_id || viewEnquiry.id}`} onClose={() => setViewEnquiry(null)} size="600px">
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Customer Contact Info</h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Status:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', fontSize: '0.75rem' }}
                    value={viewEnquiry.status || 'New Enquiry'}
                    onChange={e => handleUpdateEnquiryStatus(viewEnquiry.enquiry_id || viewEnquiry.id, e.target.value)}
                  >
                    {['New Enquiry', 'Assigned', 'Customer Interested', 'Quotation Sent', 'Booking Confirmed', 'Closed', 'Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-6"><span className="text-muted">Name:</span> <strong>{viewEnquiry.customer_name}</strong></div>
                <div className="col-6"><span className="text-muted">Phone:</span> <strong>{viewEnquiry.phone}</strong></div>
                <div className="col-6"><span className="text-muted">Email:</span> <strong>{viewEnquiry.email || '—'}</strong></div>
                <div className="col-6"><span className="text-muted">Departure City:</span> <strong>{viewEnquiry.departure_city || '—'}</strong></div>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h6 className="fw-bold mb-2.5" style={{ fontSize: '13px' }}>Trip Preferences</h6>
              <div className="row g-2" style={{ fontSize: '13px' }}>
                <div className="col-12"><span className="text-muted">Destinations:</span> <strong>{viewEnquiry.destinations || 'Goa'}</strong></div>
                <div className="col-6"><span className="text-muted">Dates:</span> <strong>{viewEnquiry.travel_dates || 'Flexible'}</strong></div>
                <div className="col-6"><span className="text-muted">Travellers:</span> <strong>{viewEnquiry.adults || 2} Adults, {viewEnquiry.children || 0} Children</strong></div>
                <div className="col-6"><span className="text-muted">Budget Range:</span> <strong>{viewEnquiry.budget_range || 'Standard'}</strong></div>
                <div className="col-6"><span className="text-muted">Hotel Type:</span> <strong>{viewEnquiry.hotel_category || '3/4 Star'}</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

// ─── WALLET TAB — uses WalletApprovalCenter ──────────────────────────────────
function WalletTab() {
  return <WalletApprovalCenter />;
}

// ─── PAYMENT GATEWAY TAB — uses PaymentGatewayManager ─────────────────────────
function PaymentGatewayTab() {
  return <PaymentGatewayManager />;
}

// ─── COMMISSION TAB ──────────────────────────────────────────────────────────
function CommissionTab({ vendors = [] }) {
  const [rules, setRules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [globalRates, setGlobalRates] = React.useState({
    hotel_vendor: { commission_type: 'percentage', commission_value: 10 },
    vendor: { commission_type: 'percentage', commission_value: 8 },
    flight_vendor: { commission_type: 'percentage', commission_value: 5 },
  });
  const [overrideForm, setOverrideForm] = React.useState({ vendor_type: 'hotel_vendor', vendor_id: '', commission_type: 'percentage', commission_value: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${api.API_BASE}?resource=commission_rules`);
      const data = await r.json();
      if (Array.isArray(data)) {
        setRules(data);
        const newG = { ...globalRates };
        data.forEach(d => {
          if (d.vendor_id === 'all' && newG[d.vendor_type]) {
            newG[d.vendor_type] = { commission_type: d.commission_type, commission_value: parseFloat(d.commission_value) };
          }
        });
        setGlobalRates(newG);
      }
    } catch (e) {}
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const saveGlobal = async (vendorType) => {
    setSaving(true);
    try {
      const r = await fetch(api.API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_commission_rule', vendor_type: vendorType, vendor_id: 'all', ...globalRates[vendorType] }) });
      const d = await r.json();
      setMsg(d.message || 'Global commission saved!');
      setTimeout(() => setMsg(''), 3000);
      load();
    } catch(e) { setMsg('Error saving commission rule.'); }
    setSaving(false);
  };

  const saveOverride = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(api.API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_commission_rule', ...overrideForm }) });
      const d = await r.json();
      setMsg(d.message || 'Override saved!');
      setTimeout(() => setMsg(''), 3000);
      setOverrideForm({ vendor_type: 'hotel_vendor', vendor_id: '', commission_type: 'percentage', commission_value: '', notes: '' });
      load();
    } catch(e) { setMsg('Error saving override.'); }
    setSaving(false);
  };

  const deleteOverride = async (id) => {
    if (!window.confirm('Remove this vendor commission override?')) return;
    await fetch(api.API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_commission_rule', id }) });
    load();
  };

  const typeLabels = { hotel_vendor: 'Hotel Vendors', vendor: 'Vehicle Vendors', flight_vendor: 'Flight Vendors' };
  const typeColors = { hotel_vendor: '#059669', vendor: '#d97706', flight_vendor: '#2563eb' };
  const typeIcons = { hotel_vendor: <Hotel size={18} />, vendor: <Car size={18} />, flight_vendor: <Star size={18} /> };

  const overrideRules = rules.filter(r => r.vendor_id !== 'all');

  return (
    <Section title="Commission Rules" subtitle="Set platform-wide commission rates per vendor type, plus per-vendor overrides">
      {msg && <div className="alert alert-success py-2 mb-3" style={{ fontSize: '0.85rem' }}>{msg}</div>}

      {/* Global Rates */}
      <div className="row g-3 mb-4">
        {Object.entries(globalRates).map(([vType, cfg]) => (
          <div key={vType} className="col-md-4">
            <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: `2px solid ${typeColors[vType]}22` }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{ color: typeColors[vType] }}>{typeIcons[vType]}</span>
                <span className="fw-bold" style={{ fontSize: '13px', color: '#0D1B2E' }}>{typeLabels[vType]}</span>
              </div>
              <div className="mb-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Commission Type</label>
                <select className="form-select form-select-sm" value={cfg.commission_type} onChange={e => setGlobalRates(g => ({ ...g, [vType]: { ...g[vType], commission_type: e.target.value } }))}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Rate {cfg.commission_type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">{cfg.commission_type === 'percentage' ? '%' : '₹'}</span>
                  <input type="number" className="form-control" value={cfg.commission_value} min="0" step="0.5"
                    onChange={e => setGlobalRates(g => ({ ...g, [vType]: { ...g[vType], commission_value: e.target.value } }))} />
                </div>
              </div>
              <button type="button" className="btn btn-sm w-100 fw-bold text-white" disabled={saving}
                style={{ background: `linear-gradient(90deg,${typeColors[vType]},${typeColors[vType]}bb)`, fontSize: '0.78rem' }}
                onClick={() => saveGlobal(vType)}>
                <CheckCircle size={13} className="me-1" /> Save Global Rate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Per-Vendor Override */}
      <div className="row g-3">
        <div className="col-lg-5">
          <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ fontSize: '13px', color: '#0D1B2E' }}>Add Per-Vendor Override</h6>
            <form onSubmit={saveOverride}>
              <div className="mb-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Vendor Type</label>
                <select className="form-select form-select-sm" value={overrideForm.vendor_type} onChange={e => setOverrideForm(f => ({ ...f, vendor_type: e.target.value, vendor_id: '' }))}>
                  <option value="hotel_vendor">Hotel Vendors</option>
                  <option value="vendor">Vehicle Vendors</option>
                  <option value="flight_vendor">Flight Vendors</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Select Specific Vendor</label>
                <select className="form-select form-select-sm" value={overrideForm.vendor_id} onChange={e => setOverrideForm(f => ({ ...f, vendor_id: e.target.value }))} required>
                  <option value="">-- Choose Vendor --</option>
                  {vendors.filter(v => v.role === overrideForm.vendor_type).map(v => (
                    <option key={v.id} value={v.id}>{v.name || v.username}</option>
                  ))}
                </select>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Type</label>
                  <select className="form-select form-select-sm" value={overrideForm.commission_type} onChange={e => setOverrideForm(f => ({ ...f, commission_type: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Value</label>
                  <input type="number" className="form-control form-control-sm" min="0" step="0.5" value={overrideForm.commission_value}
                    onChange={e => setOverrideForm(f => ({ ...f, commission_value: e.target.value }))} placeholder="e.g. 12" required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.72rem', color: '#64748b' }}>Notes (optional)</label>
                <input type="text" className="form-control form-control-sm" value={overrideForm.notes}
                  onChange={e => setOverrideForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for override" />
              </div>
              <button type="submit" className="btn btn-sm w-100 fw-bold text-white" disabled={saving} style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                <Plus size={13} className="me-1" /> {saving ? 'Saving...' : 'Save Override'}
              </button>
            </form>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
            <div className="px-3 py-2" style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span className="fw-bold" style={{ fontSize: '13px', color: '#0D1B2E' }}>Per-Vendor Overrides</span>
            </div>
            {loading ? (
              <div className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>Loading...</div>
            ) : overrideRules.length === 0 ? (
              <div className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>No vendor-specific overrides set. Global rates apply to all.</div>
            ) : (
              <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="py-2 px-3 fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Vendor</th>
                    <th className="py-2 px-3 fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Type</th>
                    <th className="py-2 px-3 fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Rate</th>
                    <th className="py-2 px-3 fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Notes</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {overrideRules.map(r => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">
                        <div className="fw-bold" style={{ color: '#0D1B2E' }}>{r.vendor_name || r.vendor_id}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{typeLabels[r.vendor_type]}</div>
                      </td>
                      <td className="px-3 py-2"><span className="badge" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.68rem' }}>{r.commission_type}</span></td>
                      <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>{r.commission_type === 'percentage' ? `${r.commission_value}%` : `₹${r.commission_value}`}</td>
                      <td className="px-3 py-2" style={{ color: '#64748b', fontSize: '0.78rem' }}>{r.notes || '—'}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="btn btn-sm p-1" style={{ color: '#ef4444' }} onClick={() => deleteOverride(r.id)} title="Remove override"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── REPORTS TAB ─────────────────────────────────────────────────────────────
function ReportsTab({ bookings = [], vendors = [], usersList = [] }) {
  const totalRevenue = bookings.reduce((s, b) => s + parseFloat(b.total_paid || b.amount_paid || 0), 0);
  const reports = [
    { label: 'Revenue Report', desc: 'Total platform revenue by period', value: `₹${(totalRevenue / 1000).toFixed(1)}K` },
    { label: 'Booking Report', desc: 'All bookings with status breakdown', value: `${bookings.length} bookings` },
    { label: 'Vendor Report', desc: 'Vendor performance and earnings', value: `${vendors.length} vendors` },
    { label: 'Commission Report', desc: 'Platform commission earned per vendor', value: `₹${(totalRevenue * 0.1 / 1000).toFixed(1)}K` },
    { label: 'User Report', desc: 'User registrations and activity', value: `${usersList.length} users` },
    { label: 'Refund Report', desc: 'All refund requests and statuses', value: '0 refunds' },
  ];
  return (
    <Section title="Reports & Analytics" subtitle="Generate and export platform-wide reports">
      <div className="row g-3">
        {reports.map(r => (
          <div key={r.label} className="col-md-4">
            <div className="rounded-3 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '14px' }}>{r.label}</div>
              <div className="mb-2" style={{ color: '#64748b', fontSize: '0.78rem' }}>{r.desc}</div>
              <div className="fw-bold mb-3" style={{ color: '#2563eb', fontSize: '1.1rem' }}>{r.value}</div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem' }}><Download size={11} />PDF</button>
                <button type="button" className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.72rem' }}><Download size={11} />Excel</button>
                <button type="button" className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#f0f9ff', color: '#0369a1', fontSize: '0.72rem' }}><Download size={11} />CSV</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── GLOBAL SETTINGS TAB ─────────────────────────────────────────────────────
function GlobalSettingsTab() {
  const [settings, setSettings] = useState({
    siteName: 'TripGalileo', currency: 'INR', taxRate: 18, supportEmail: 'support@tripgalileo.com',
    whatsappNumber: '', smsProvider: 'none', darkMode: false, maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${api.API_BASE}?resource=global_settings`)
      .then(r => r.json())
      .then(data => {
        if (data && data.siteName) {
          setSettings({
            siteName: data.siteName || 'TripGalileo',
            currency: data.currency || 'INR',
            taxRate: data.taxRate || 18,
            supportEmail: data.supportEmail || 'support@tripgalileo.com',
            whatsappNumber: data.whatsappNumber || '',
            smsProvider: data.smsProvider || 'none',
            darkMode: data.darkMode == 1,
            maintenanceMode: data.maintenanceMode == 1,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching global settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    fetch(api.API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_global_settings', ...settings })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) alert('Global settings updated and applied successfully!');
        else alert('Failed to update settings');
      })
      .catch(err => {
        console.error('Error saving global settings:', err);
        alert('Error saving global settings');
      });
  };

  if (loading) return <div className="p-4 text-center text-muted">Loading settings...</div>;

  return (
    <Section title="Global Platform Settings" subtitle="Configure platform-wide settings, branding, currency, taxes, and communication">
      <div className="row g-4">
        <div className="col-md-6">
          <div className="rounded-3 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand & Identity</h6>
            {[
              { label: 'Platform Name', key: 'siteName', type: 'text' },
              { label: 'Support Email', key: 'supportEmail', type: 'email' },
              { label: 'WhatsApp Number', key: 'whatsappNumber', type: 'text' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>{f.label}</label>
                <input type={f.type} className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={settings[f.key]} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div className="rounded-3 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finance & Tax</h6>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Default Currency</label>
              <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Default GST Rate (%)</label>
              <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={settings.taxRate} onChange={e => setSettings(s => ({ ...s, taxRate: e.target.value }))} />
            </div>
            <div className="d-flex gap-3">
              {[{ label: 'Maintenance Mode', key: 'maintenanceMode' }, { label: 'Dark Mode Default', key: 'darkMode' }].map(f => (
                <div key={f.key} className="d-flex align-items-center gap-2">
                  <input type="checkbox" className="form-check-input" id={f.key} checked={settings[f.key]} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.checked }))} />
                  <label htmlFor={f.key} className="form-check-label fw-bold" style={{ fontSize: '0.8rem', color: '#475569' }}>{f.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12">
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-3 shadow-sm" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={handleSave}>Save Global Settings</button>
        </div>
      </div>
    </Section>
  );
}

// ─── NOTIFICATIONS TAB (Real Notification Hub) ────────────────────────────────
function NotificationsTab({ bookings = [], vendors = [], usersList = [], aiLeads = [], customEnquiries = [], onNavigate }) {
  const getBookingCategory = (b) => {
    const itemId = String(b.item_id || '');
    const itemName = String(b.item_name || '').toLowerCase();
    if (itemId.startsWith('hotel-') || itemId.startsWith('HTL-') || itemName.includes('resort') || itemName.includes('hotel') || itemName.includes('stay')) {
      return { tab: 'hotel_bookings', type: 'Hotel Stay Booking', color: '#0284c7' };
    }
    if (itemId.startsWith('car-') || itemId.startsWith('bike-') || itemId.startsWith('veh-') || itemName.includes('thar') || itemName.includes('scooter') || itemName.includes('activa')) {
      return { tab: 'vehicle_bookings', type: 'Vehicle Rental Booking', color: '#ea580c' };
    }
    if (isActivityBookingItem(b)) {
      return { tab: 'activity_bookings', type: 'Sightseeing & Activity Booking', color: '#10b981' };
    }
    return { tab: 'trip_bookings', type: 'Package / Holiday Booking', color: '#f97316' };
  };

  const notifs = [
    ...vendors.filter(v => !v.verified).map(v => ({
      type: 'kyc',
      title: 'KYC Verification Required',
      msg: `Partner vendor ${v.name || v.username} (${v.role || 'vendor'}) submitted account details for review`,
      time: 'Action Required',
      color: '#ca8a04',
      tab: 'vendor_verification'
    })),
    ...bookings.map(b => {
      const cat = getBookingCategory(b);
      return {
        type: 'booking',
        title: `${cat.type} #${b.id}`,
        msg: `${b.name || b.customer_name || 'Customer'} — ${b.item_name || 'Item'} (${b.status || 'Enquiry'} • ₹${parseFloat(b.total_paid || b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')})`,
        time: b.created_at?.slice(0, 16) || 'Recently',
        color: cat.color,
        tab: cat.tab
      };
    }),
    ...customEnquiries.map(e => ({
      type: 'enquiry',
      title: `Custom Trip Enquiry #${e.enquiry_id || e.id}`,
      msg: `${e.customer_name || 'Customer'} inquired for ${e.destinations || 'Goa Custom Trip'} (${e.travel_dates || 'Flexible Dates'})`,
      time: e.created_at?.slice(0, 16) || 'Recently',
      color: '#8b5cf6',
      tab: 'trip_bookings'
    })),
    ...aiLeads.map(l => ({
      type: 'lead',
      title: `Sophia AI Lead: ${l.name}`,
      msg: `Customer ${l.name} (${l.phone || 'No phone'}) chatted with Sophia AI`,
      time: l.created_at?.slice(0, 16) || 'Recently',
      color: '#059669',
      tab: 'lead_management'
    }))
  ].sort((a, b) => {
    if (a.time === 'Action Required') return -1;
    if (b.time === 'Action Required') return 1;
    return (b.time || '').localeCompare(a.time || '');
  });

  return (
    <Section title="Notifications & System Alerts" subtitle="Real-time platform alerts, booking events, and vendor verification requests">
      <div className="d-flex flex-column gap-2.5">
        {notifs.map((n, i) => (
          <div
            key={i}
            className="rounded-3 p-3.5 d-flex align-items-start justify-content-between gap-3 shadow-sm"
            style={{ background: '#fff', border: `1px solid ${n.color}30` }}
          >
            <div className="d-flex align-items-start gap-3">
              <div className="rounded-circle flex-shrink-0" style={{ width: '10px', height: '10px', background: n.color, marginTop: '6px' }}></div>
              <div>
                <div className="fw-bold" style={{ fontSize: '0.88rem', color: '#0D1B2E' }}>{n.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>{n.msg}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="btn btn-sm px-3 py-1 rounded-2 flex-shrink-0 fw-bold"
                style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem' }}
                onClick={() => onNavigate(n.tab)}
              >
                Go to Section →
              </button>
            )}
          </div>
        ))}
        {notifs.length === 0 && (
          <div className="text-center py-5 rounded-3 bg-white border text-muted">
            <Bell size={32} className="opacity-50 mb-2" />
            <p className="mb-0 fw-bold">No active notifications</p>
            <small className="text-muted">All bookings, verifications and leads are up to date.</small>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SuperAdminDashboard({
  activeTab = 'dashboard',
  onNavigate,
  usersList = [],
  vendors = [],
  cars = [],
  bikes = [],
  hotels = [],
  bookings = [],
  aiLeads = [],
  customEnquiries = [],
  b2bPartners = [],
  b2bBookings = [],
  drivers = [],
  currentUser,
  onRefreshLeads,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onApproveVendor,
}) {
  switch (activeTab) {
    case 'dashboard':
      return (
        <DashboardTab
          usersList={usersList}
          vendors={vendors}
          cars={cars}
          bikes={bikes}
          hotels={hotels}
          bookings={bookings}
          b2bPartners={b2bPartners}
          b2bBookings={b2bBookings}
          drivers={drivers}
          aiLeads={aiLeads}
          customEnquiries={customEnquiries}
          onNavigate={onNavigate}
        />
      );
    case 'b2b_dashboard':
    case 'b2b_applications':
    case 'b2b_all_partners':
    case 'b2b_wallets':
    case 'b2b_commission_partners':
    case 'b2b_non_commission_partners':
    case 'b2b_mode_requests':
    case 'b2b_commission_bookings':
    case 'b2b_non_commission_bookings':
    case 'b2b_settings':
      return <AdminB2BPortal activeSubTab={activeTab} onNavigateSubTab={(sub) => onNavigate(sub)} />;
    case 'drivers':
      return <AdminDriverManagement currentUser={currentUser} bookings={bookings} />;
    case 'admin_management':
      return <AdminManagementTab usersList={usersList} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
    case 'user_management':
      return <UserManagementTab usersList={usersList} />;
    case 'vendor_management':
      return <VendorManagementTab vendors={vendors} cars={cars} bikes={bikes} hotels={hotels} onApproveVendor={onApproveVendor} />;
    case 'vendor_verification':
      return <KYCTab vendors={vendors} onApproveVendor={onApproveVendor} />;
    case 'lead_management':
      return <LeadManagement usersList={usersList} currentUser={currentUser} />;
    case 'hotel_bookings':
      return <BookingsTab bookings={bookings} type="hotel" vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'vehicle_bookings':
    case 'bookings':
      return <BookingsTab bookings={bookings} type="vehicle" vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'all_bookings':
      return <BookingsTab bookings={bookings} type="all" vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'activity_bookings':
      return <BookingsTab bookings={bookings} type="activity" vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'flight_bookings':
      return <BookingsTab bookings={bookings} type="flight" vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'trip_bookings':
      return <TripBookingsTab bookings={bookings} customEnquiries={customEnquiries} vendors={vendors} onRefresh={onRefreshLeads} />;
    case 'wallet':
      return <WalletTab />;
    case 'payment_gateway':
      return <PaymentGatewayTab />;
    case 'subscription_plans':
      return <SubscriptionPlansManager />;
    case 'commission':
      return <CommissionTab vendors={vendors} />;
    case 'reports':
      return <AnalyticsView bookings={bookings} hotels={hotels} cars={cars} bikes={bikes} vendors={vendors} allPackages={[]} />;
    case 'global_settings':
      return <GlobalSettingsTab />;
    case 'notifications':
      return (
        <NotificationsTab
          bookings={bookings}
          vendors={vendors}
          usersList={usersList}
          aiLeads={aiLeads}
          customEnquiries={customEnquiries}
          onNavigate={onNavigate}
        />
      );
    default:
      return (
        <DashboardTab
          usersList={usersList}
          vendors={vendors}
          cars={cars}
          bikes={bikes}
          hotels={hotels}
          bookings={bookings}
          b2bPartners={b2bPartners}
          b2bBookings={b2bBookings}
          drivers={drivers}
          aiLeads={aiLeads}
          customEnquiries={customEnquiries}
          onNavigate={onNavigate}
        />
      );
  }
}
