import React, { useState } from 'react';
import {
  Compass, LogOut, LayoutDashboard, Calendar, Wallet, Heart, Star,
  User, Bell, ChevronDown, ChevronRight, Menu, Shield, Download,
  Clock, CheckCircle, XCircle, MapPin, Car, Hotel, Package, ArrowRight,
  Phone, Mail, Edit, Save, X
} from 'lucide-react';

function StatusBadge({ status }) {
  const m = {
    pending: ['#fef9c3', '#ca8a04'],
    confirmed: ['#dcfce7', '#16a34a'],
    cancelled: ['#fee2e2', '#dc2626'],
    rejected: ['#fee2e2', '#dc2626'],
    completed: ['#dcfce7', '#059669'],
    active: ['#dbeafe', '#2563eb'],
  };
  const [bg, color] = m[status?.toLowerCase()] || ['#f1f5f9', '#64748b'];
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: bg, color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status || 'Pending'}</span>;
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <div className="rounded-2 p-1 d-flex align-items-center justify-content-center" style={{ background: `${color}18`, width: '30px', height: '30px' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="fw-bold mt-1" style={{ fontSize: '1.3rem', color: '#0D1B2E', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function MyBookingsTab({ bookings, currentUser }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const myBookings = (bookings || []).filter(b => b.customer_id === currentUser?.id || b.name === currentUser?.username);
  
  const filtered = statusFilter === 'all' ? myBookings : myBookings.filter(b => b.status?.toLowerCase() === statusFilter);

  const typeIcon = (type) => {
    if (type === 'hotel') return <Hotel size={14} />;
    if (type === 'vehicle') return <Car size={14} />;
    return <Package size={14} />;
  };
  const typeColor = (type) => type === 'hotel' ? '#059669' : type === 'vehicle' ? '#d97706' : '#7c3aed';

  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>My Bookings</h5>
      <div className="d-flex gap-2 mb-4">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold text-capitalize" style={{ fontSize: '0.72rem', background: statusFilter === s ? '#0D1B2E' : '#fff', color: statusFilter === s ? '#fff' : '#475569', border: '1px solid rgba(0,0,0,0.1)' }}>
            {s}
          </button>
        ))}
      </div>
      <div className="d-flex flex-column gap-3">
        {filtered.map(b => (
          <div key={b.id} className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px', background: `${typeColor(b.type)}15` }}>
                  <span style={{ color: typeColor(b.type) }}>{typeIcon(b.type)}</span>
                </div>
                <div>
                  <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '14px' }}>{b.item_name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Booked on {b.created_at?.slice(0, 10)}</div>
                  <div className="mt-1">
                    {b.check_in && <span style={{ fontSize: '0.72rem', color: '#475569' }}>📅 Check-in: {b.check_in} </span>}
                    {b.pickup && <span style={{ fontSize: '0.72rem', color: '#475569' }}>🚗 Pickup: {b.pickup} </span>}
                    {b.travel_date && <span style={{ fontSize: '0.72rem', color: '#475569' }}>✈️ Travel: {b.travel_date}</span>}
                  </div>

                  {(b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) && (
                    <div className="mt-2">
                      {b.assigned_driver_id ? (
                        <div className="p-2 rounded-2 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ fontSize: '0.74rem' }}>
                          <div className="d-flex align-items-center gap-1.5 text-success fw-bold">
                            <span>🟢 Assigned Chauffeur:</span>
                            <span className="text-dark">{b.assigned_driver_name || b.assigned_driver_id}</span>
                            {b.assigned_driver_phone && <span className="text-muted fw-normal">({b.assigned_driver_phone})</span>}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-secondary small">🚗 Driver Charge: ₹{(b.driver_charge || (800 * Math.max(1, parseInt(b.driver_days || b.booking_days || 1)))).toLocaleString()} (₹800/d)</span>
                            {b.assigned_driver_vehicle && (
                              <span className="text-secondary small">• {b.assigned_driver_vehicle}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-2 bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-1 text-dark" style={{ fontSize: '0.73rem' }}>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="fw-bold text-dark">🚗 Driver Service:</span>
                            <span className="text-secondary">Requested • Awaiting chauffeur acceptance</span>
                          </div>
                          <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.68rem' }}>
                            ₹800/day • Driver Fee: ₹{(b.driver_charge || (800 * Math.max(1, parseInt(b.driver_days || b.booking_days || 1)))).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-end flex-shrink-0">
                <StatusBadge status={b.status} />
                <div className="fw-bold mt-2" style={{ color: '#16a34a', fontSize: '1.1rem' }}>₹{parseFloat(b.total_paid || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px' }}>
              <button className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem' }}>
                <Download size={11} /> Invoice
              </button>
              {(b.status === 'Pending' || b.status === 'Confirmed') && (
                <button className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem' }}>
                  <X size={11} /> Cancel
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-5 rounded-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <Calendar size={40} style={{ color: '#94a3b8' }} className="mb-2" />
            <div className="fw-bold mb-1" style={{ color: '#64748b' }}>No bookings found</div>
            <a href="/" className="btn px-4 py-2 mt-2 rounded-3 fw-bold text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>Start Booking</a>
          </div>
        )}
      </div>
    </div>
  );
}

function WalletTab() {
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>My Wallet</h5>
      <div className="rounded-3 p-4 mb-4 text-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
        <Wallet size={32} style={{ color: 'rgba(255,255,255,0.6)' }} className="mb-2" />
        <div className="fw-bold text-white" style={{ fontSize: '2rem' }}>₹0.00</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>Available Balance</div>
        <div className="d-flex gap-2 justify-content-center mt-3">
          <button className="btn py-2 px-4 rounded-3 fw-bold text-white" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', fontSize: '0.82rem' }}>Add Money</button>
          <button className="btn py-2 px-4 rounded-3 fw-bold text-white" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', fontSize: '0.82rem' }}>Withdraw</button>
        </div>
      </div>
      <div className="text-center py-4 text-muted" style={{ fontSize: '0.85rem' }}>No wallet transactions yet</div>
    </div>
  );
}

function WishlistTab() {
  const [wishlist] = useState([
    { id: 1, type: 'hotel', name: 'Taj Exotica Resort & Spa', location: 'Benaulim, Goa', price: '₹12,000/night', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300' },
    { id: 2, type: 'vehicle', name: 'Royal Enfield Classic 350', location: 'Calangute, Goa', price: '₹800/day', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
  ]);
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>My Wishlist</h5>
      <div className="row g-3">
        {wishlist.map(item => (
          <div key={item.id} className="col-md-6">
            <div className="rounded-3 overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div className="p-3">
                <div className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '14px' }}>{item.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📍 {item.location}</div>
                <div className="d-flex align-items-center justify-content-between mt-2">
                  <div className="fw-bold" style={{ color: '#FF6333', fontSize: '0.9rem' }}>{item.price}</div>
                  <button className="btn btn-sm px-3 py-1 rounded-2 fw-bold text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.72rem' }}>
                    Book Now <ArrowRight size={11} className="ms-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {wishlist.length === 0 && <div className="col-12 text-center py-5 text-muted">No saved items yet</div>}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [reviews] = useState([
    { id: 1, item: 'Sea View Villa, Calangute', rating: 5, review: 'Amazing property with stunning views. Highly recommend!', date: '2026-07-15' },
    { id: 2, item: 'Swift Dzire Rental', rating: 4, review: 'Good car, well maintained. Would use again.', date: '2026-07-05' },
  ]);
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>My Reviews</h5>
      <div className="d-flex flex-column gap-3">
        {reviews.map(r => (
          <div key={r.id} className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between mb-2">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '14px' }}>{r.item}</div>
              <div>{'⭐'.repeat(r.rating)}</div>
            </div>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '6px' }}>"{r.review}"</p>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Reviewed on {r.date}</div>
          </div>
        ))}
        {reviews.length === 0 && <div className="text-center py-5 text-muted">No reviews yet</div>}
      </div>
    </div>
  );
}

function ProfileTab({ currentUser }) {
  const [form, setForm] = useState({ name: currentUser?.username || '', email: currentUser?.email || '', phone: '', city: '', dob: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>My Profile</h5>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="rounded-3 p-4 text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="rounded-circle fw-bold d-flex align-items-center justify-content-center mx-auto mb-3 text-white" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg,#FF6333,#FF8A00)', fontSize: '2rem' }}>
              {form.name?.[0]?.toUpperCase() || 'G'}
            </div>
            <div className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '16px' }}>{form.name || 'Guest User'}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{form.email || 'No email set'}</div>
            <span className="badge mt-2" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem' }}>VERIFIED CUSTOMER</span>
          </div>
        </div>
        <div className="col-md-8">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Information</div>
            <form onSubmit={handleSave}>
              <div className="row g-3">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
                  { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                  { label: 'City', key: 'city', type: 'text', placeholder: 'Your city' },
                  { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key} className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>{f.label}</label>
                    <input type={f.type} className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn mt-4 px-5 py-2 rounded-3 fw-bold text-white d-flex align-items-center gap-2" style={{ background: saved ? '#16a34a' : 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                <Save size={14} />{saved ? 'Saved!' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const notifs = [
    { id: 1, type: 'booking', msg: 'Your booking #B001 has been confirmed!', time: '2 hours ago', read: false },
    { id: 2, type: 'offer', msg: 'Flash Deal: 25% off on all hotels this weekend!', time: '1 day ago', read: true },
    { id: 3, type: 'reminder', msg: 'Your check-in at Sea View Villa is tomorrow', time: '2 days ago', read: true },
  ];
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '16px' }}>Notifications</h5>
      <div className="d-flex flex-column gap-2">
        {notifs.map(n => (
          <div key={n.id} className="rounded-3 p-3 d-flex gap-3" style={{ background: n.read ? '#fff' : '#FFF5F2', border: `1px solid ${n.read ? 'rgba(0,0,0,0.07)' : 'rgba(255,99,51,0.2)'}` }}>
            <div className="rounded-circle flex-shrink-0 mt-1" style={{ width: '8px', height: '8px', background: n.read ? '#94a3b8' : '#FF6333' }}></div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#0D1B2E', fontWeight: n.read ? 400 : 700 }}>{n.msg}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'bookings', label: 'My Bookings', icon: <Calendar size={16} /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={16} /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} /> },
  { id: 'reviews', label: 'My Reviews', icon: <Star size={16} /> },
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
];

export default function CustomerDashboard({ currentUser, triggerOpenLogin, bookings, hotels, cars, bikes, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!currentUser) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <User size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Customer Dashboard</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Sign in to manage your bookings, wallet and profile</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const myBookings = (bookings || []).filter(b => b.name === currentUser.username);
  const totalSpent = myBookings.reduce((s, b) => s + parseFloat(b.total_paid || b.amount_paid || 0), 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-4">
            <div className="rounded-3 p-4 mb-4 d-flex align-items-center gap-4" style={{ background: 'linear-gradient(135deg,#0D1B2E,#1e3a5f)' }}>
              <div className="rounded-circle fw-bold d-flex align-items-center justify-content-center text-dark flex-shrink-0" style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', fontSize: '1.5rem' }}>
                {currentUser.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold text-white mb-1">Welcome back, {currentUser.username}! 👋</h5>
                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3"><StatCard label="Total Bookings" value={myBookings.length} icon={<Calendar size={16} />} color="#2563eb" /></div>
              <div className="col-6 col-md-3"><StatCard label="Total Spent" value={`₹${(totalSpent / 1000).toFixed(1)}K`} icon={<Wallet size={16} />} color="#16a34a" /></div>
              <div className="col-6 col-md-3"><StatCard label="Wishlist" value={2} icon={<Heart size={16} />} color="#dc2626" /></div>
              <div className="col-6 col-md-3"><StatCard label="Reviews" value={2} icon={<Star size={16} />} color="#d97706" /></div>
            </div>
            <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Quick Links</div>
              <div className="row g-2">
                {[
                  { label: 'Book a Hotel', icon: '🏨', href: '/hotels', color: '#059669' },
                  { label: 'Rent a Vehicle', icon: '🚗', href: '/self-drive', color: '#d97706' },
                  { label: 'Book a Package', icon: '✈️', href: '/explore', color: '#7c3aed' },
                  { label: 'AI Trip Planner', icon: '🤖', href: '/ai-planner', color: '#2563eb' },
                ].map(link => (
                  <div key={link.label} className="col-6 col-md-3">
                    <a href={link.href} className="btn w-100 py-2 px-3 rounded-3 fw-bold text-decoration-none d-flex align-items-center gap-2" style={{ background: `${link.color}10`, color: link.color, border: `1px solid ${link.color}30`, fontSize: '0.82rem' }}>
                      {link.icon} {link.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'bookings': return <MyBookingsTab bookings={bookings} currentUser={currentUser} />;
      case 'wallet': return <WalletTab />;
      case 'wishlist': return <WishlistTab />;
      case 'reviews': return <ReviewsTab />;
      case 'profile': return <ProfileTab currentUser={currentUser} />;
      case 'notifications': return <NotificationsTab />;
      default: return null;
    }
  };

  return (
    <div className="d-flex w-100" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0" style={{ width: sidebarOpen ? '240px' : '0px', minWidth: sidebarOpen ? '240px' : '0px', height: '100vh', overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#0D1B2E', borderRight: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }}>
        <div className="px-3 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Compass size={22} style={{ color: '#FF6333' }} />
          <div>
            <div className="fw-extrabold text-white" style={{ fontSize: '15px' }}>WOW GOA</div>
            <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#00B8D9' }}>My Account</div>
          </div>
        </div>
        {/* User Info */}
        <div className="px-3 py-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="rounded-circle fw-bold d-flex align-items-center justify-content-center text-dark flex-shrink-0" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', fontSize: '15px' }}>
            {currentUser.username?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="fw-bold text-white text-truncate" style={{ fontSize: '13px' }}>{currentUser.username}</div>
            <div className="text-truncate" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>{currentUser.email}</div>
          </div>
        </div>
        <div className="flex-grow-1 py-2 px-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1" style={{ fontSize: '0.83rem', background: activeTab === item.id ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : 'transparent', color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)', boxShadow: activeTab === item.id ? '0 4px 12px rgba(255,99,51,0.3)' : 'none', fontWeight: activeTab === item.id ? 700 : 400 }}>
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/" className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-2" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.85rem', fontWeight: 600 }}>
            <Compass size={15} /> Go to Homepage
          </a>
          <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 text-white transition-all shadow-xs" style={{ background: 'rgba(255,255,255,0.12)', fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={15} className="text-white-50" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden' }}>
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><Menu size={20} /></button>
            <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}</div>
          </div>
          <a href="/" className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ background: 'rgba(255,99,51,0.15)', color: '#FF6333', fontSize: '0.75rem', border: 'none' }}>
            ← Back to Site
          </a>
        </header>
        <div className="flex-grow-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
