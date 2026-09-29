import React, { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, DollarSign, Calendar, Users, Building, Car,
  ArrowUpRight, ArrowDownRight, Hotel, Percent, Activity, Clock, Star,
  BarChart2, PieChart, Target, Zap, Eye, FileText, RefreshCw, Compass
} from 'lucide-react';

function StatCard({ label, value, icon, color, trend, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3 p-3 h-100 ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      title={onClick ? `Click to open ${label}` : undefined}
    >
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div className="rounded-2 p-2" style={{ background: `${color}18`, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined ? (
          <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        ) : onClick && (
          <span className="text-muted small" style={{ fontSize: '0.65rem' }}>↗ View</span>
        )}
      </div>
      <div className="fw-bold mt-1" style={{ fontSize: '1.3rem', color: '#0D1B2E', lineHeight: 1.1 }}>{value}</div>
      <div className="mt-1" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function MiniChart({ data, color }) {
  const safeData = Array.isArray(data) ? data.map(v => Number(v) || 0) : [1];
  const max = Math.max(...safeData, 1);
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: '48px' }}>
      {safeData.map((v, i) => (
        <div key={i} className="rounded-1 flex-grow-1" style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.7 + (i / safeData.length) * 0.3, minWidth: '6px' }} />
      ))}
    </div>
  );
}

export default function AdminDashboardOverview({
  vendors = [],
  allPackages = [],
  hotels = [],
  cars = [],
  bikes = [],
  bookings = [],
  usersList = [],
  drivers = [],
  b2bPartners = [],
  aiLeads = [],
  enquiries = [],
  currentUser,
  onNavigate,
  onRefresh
}) {
  const [refreshing, setRefreshing] = useState(false);
  const b = Array.isArray(bookings) ? bookings : [];

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setRefreshing(false), 600);
      }
    }
  };

  const totalRevenue = b.reduce((s, bk) => s + (Number(bk.total_amount || bk.total_paid || bk.amount_paid || bk.price || 0) || 0), 0);
  const pendingBookings = b.filter(bk => (bk.status || '').toLowerCase() === 'pending').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = b.filter(bk => String(bk.created_at || bk.pickup_date || '').slice(0, 10) === todayStr).length;
  const confirmedBookings = b.filter(bk => (bk.status || '').toLowerCase() === 'confirmed').length;

  const totalCustomers = (usersList || []).filter(u => !['admin', 'superadmin', 'driver', 'subadmin'].includes(u.role)).length || (usersList || []).length;
  const totalDrivers = (drivers || []).length;

  // Calculate real last 7 days revenue & bookings from live DB bookings
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7DaysLabels = [];
  const weeklyRevenue = [];
  const weeklyBookings = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = daysOfWeek[d.getDay()];
    last7DaysLabels.push(dayLabel);

    const dayBks = b.filter(bk => String(bk.created_at || bk.pickup_date || '').slice(0, 10) === dateStr);
    const dayRev = dayBks.reduce((sum, bk) => sum + (Number(bk.total_amount || bk.total_paid || bk.amount_paid || bk.price || 0) || 0), 0);
    
    weeklyRevenue.push(dayRev);
    weeklyBookings.push(dayBks.length);
  }

  // Real Top Hotels derived from live bookings
  const hotelBookingMap = {};
  b.forEach(bk => {
    const name = bk.item_name || 'Hotel Stay';
    if (!hotelBookingMap[name]) hotelBookingMap[name] = { bookings: 0, revenue: 0 };
    hotelBookingMap[name].bookings += 1;
    hotelBookingMap[name].revenue += Number(bk.total_amount || bk.total_paid || bk.amount_paid || 0) || 0;
  });

  const topHotels = (hotels || []).slice(0, 5).map(h => {
    const matched = hotelBookingMap[h.name] || { bookings: 0, revenue: 0 };
    return {
      name: h.name || 'Hotel',
      bookings: matched.bookings,
      revenue: matched.revenue || (matched.bookings * (Number(h.price) || 5000))
    };
  });

  const stats = [
    { 
      label: 'Total Revenue', 
      value: totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(2)}L` : `₹${(totalRevenue / 1000).toFixed(1)}K`, 
      icon: <DollarSign size={16} />, 
      color: '#16a34a',
      sub: `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`,
      onClick: () => onNavigate?.('analytics')
    },
    { 
      label: 'Total Bookings', 
      value: b.length, 
      icon: <Calendar size={16} />, 
      color: '#2563eb',
      sub: `${confirmedBookings} confirmed`,
      onClick: () => onNavigate?.('bookings')
    },
    { 
      label: 'Pending Bookings', 
      value: pendingBookings, 
      icon: <Clock size={16} />, 
      color: '#ca8a04',
      sub: 'Action required',
      onClick: () => onNavigate?.('bookings')
    },
    { 
      label: "Today's Schedule", 
      value: todayBookings, 
      icon: <Activity size={16} />, 
      color: '#7c3aed',
      sub: 'View calendar',
      onClick: () => onNavigate?.('availability')
    },
    { 
      label: 'Total Hotels', 
      value: (hotels || []).length, 
      icon: <Hotel size={16} />, 
      color: '#059669',
      sub: 'Manage rooms',
      onClick: () => onNavigate?.('admin_hotels')
    },
    { 
      label: 'Fleet Vehicles', 
      value: (cars?.length || 0) + (bikes?.length || 0), 
      icon: <Car size={16} />, 
      color: '#d97706', 
      sub: `${cars?.length || 0} cars · ${bikes?.length || 0} bikes`,
      onClick: () => onNavigate?.('admin_vehicles')
    },
    { 
      label: 'Active Vendors', 
      value: (vendors || []).length, 
      icon: <Building size={16} />, 
      color: '#0891b2',
      sub: 'Partners & operators',
      onClick: () => onNavigate?.('vendors')
    },
    { 
      label: 'AI Leads & Inquiries', 
      value: (aiLeads?.length || 0) + (enquiries?.length || 0), 
      icon: <Users size={16} />, 
      color: '#16a34a',
      sub: `${aiLeads?.length || 0} Sophia AI · ${enquiries?.length || 0} custom`,
      onClick: () => onNavigate?.('lead_management')
    },
    { 
      label: 'Customers / Users', 
      value: totalCustomers, 
      icon: <Users size={16} />, 
      color: '#be185d',
      sub: 'CRM & loyalty',
      onClick: () => onNavigate?.('customers')
    },
    { 
      label: 'Registered Drivers', 
      value: totalDrivers, 
      icon: <Car size={16} />, 
      color: '#0284c7',
      sub: 'Fleet operators',
      onClick: () => onNavigate?.('drivers')
    },
    { 
      label: 'Holiday Packages', 
      value: (allPackages || []).length, 
      icon: <Compass size={16} />, 
      color: '#ea580c',
      sub: 'Itineraries & tours',
      onClick: () => onNavigate?.('packages')
    },
  ];

  return (
    <div className="p-4">
      {/* Welcome Banner */}
      <div className="rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ background: 'linear-gradient(135deg,#0D1B2E 0%,#1e3a5f 100%)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h5 className="fw-bold text-white mb-0">Admin Command Center 📊</h5>
            <span className="badge rounded-pill bg-success bg-opacity-25 text-success border border-success-subtle fw-semibold" style={{ fontSize: '0.7rem' }}>
              ● Live Sync
            </span>
          </div>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="d-flex align-items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          )}

          <div className="text-end d-none d-md-block border-start ps-3" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="fw-bold text-white" style={{ fontSize: '1.6rem', lineHeight: 1.1 }}>
              {totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(2)}L` : `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Total Platform Revenue</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-2.4 col-xl-2.4" style={{ flex: '0 0 auto', width: '20%' }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Weekly Revenue Trend</div>
              <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700 }}>Live DB Pipeline</span>
            </div>
            <MiniChart data={weeklyRevenue} color="#FF6333" />
            <div className="d-flex justify-content-between mt-2">
              {last7DaysLabels.map((d, i) => (
                <span key={i} style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Daily Bookings</div>
              <span style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: 700 }}>Real Operational Volume</span>
            </div>
            <MiniChart data={weeklyBookings} color="#2563eb" />
            <div className="d-flex justify-content-between mt-2">
              {last7DaysLabels.map((d, i) => (
                <span key={i} style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Hotels & Recent Bookings */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="rounded-3 p-4 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Top Performing Hotels</div>
              <button onClick={() => onNavigate?.('admin_hotels')} className="btn btn-sm btn-link p-0 text-decoration-none" style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                View All →
              </button>
            </div>
            {topHotels.map((h, i) => (
              <div key={h.name + i} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: i < topHotels.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: `hsl(${i * 60},60%,90%)`, color: `hsl(${i * 60},60%,40%)`, fontSize: '0.75rem' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0D1B2E' }}>{h.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Verified Property</div>
                  </div>
                </div>
                <div className="text-end">
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>₹{Math.round(h.revenue).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{h.bookings} bookings</div>
                </div>
              </div>
            ))}
            {topHotels.length === 0 && <div className="text-center text-muted py-3" style={{ fontSize: '0.82rem' }}>No hotels registered yet</div>}
          </div>
        </div>

        <div className="col-md-7">
          <div className="rounded-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Recent Operational Bookings</div>
              <button onClick={() => onNavigate?.('bookings')} className="btn btn-sm btn-link p-0 text-decoration-none" style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                View All Bookings →
              </button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Item / Service</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Schedule</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Amount</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {b.slice(0, 6).map(bk => (
                    <tr key={bk.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className="px-3 py-2">
                        <div className="fw-bold">{bk.name || bk.customer_name || 'Guest'}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>#{bk.id}</div>
                        {(bk.customer_payment_utr || bk.payment_reference) && (
                          <div className="mt-1 d-inline-block px-1 rounded font-monospace" style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            Cust UTR: {bk.customer_payment_utr || bk.payment_reference}
                          </div>
                        )}
                        {(bk.vendor_payout_utr || bk.vendor_payout_reference) && (
                          <div className="mt-0.5 d-inline-block px-1 rounded font-monospace" style={{ fontSize: '0.62rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
                            Vendor UTR: {bk.vendor_payout_utr || bk.vendor_payout_reference}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bk.vehicle_name || bk.hotel_name || bk.item_name || '—'}
                      </td>
                      <td className="px-3 py-2 text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {bk.pickup_date || bk.departure_date || bk.created_at?.slice(0, 10) || '—'}
                      </td>
                      <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>
                        ₹{parseFloat(bk.total_paid || bk.amount_paid || bk.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-pill fw-bold" style={{
                          fontSize: '0.65rem',
                          background: (bk.status || '').toLowerCase() === 'completed' ? '#dcfce7' : (bk.status || '').toLowerCase() === 'confirmed' ? '#dbeafe' : ((bk.status || '').toLowerCase() === 'cancelled' || (bk.status || '').toLowerCase() === 'rejected') ? '#fee2e2' : '#fef9c3',
                          color: (bk.status || '').toLowerCase() === 'completed' ? '#059669' : (bk.status || '').toLowerCase() === 'confirmed' ? '#1d4ed8' : ((bk.status || '').toLowerCase() === 'cancelled' || (bk.status || '').toLowerCase() === 'rejected') ? '#991b1b' : '#ca8a04',
                          textTransform: 'uppercase'
                        }}>
                          {bk.status || 'Pending'}
                        </span>
                        {bk.payment_verification_status === 'Pending Verification' && (
                          <div className="text-warning fw-semibold mt-1" style={{ fontSize: '0.65rem' }}>
                            ⏳ Needs UTR Verification
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.length === 0 && <div className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>No bookings yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

