import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, Lock, User, LogOut, MessageSquare, CheckCircle, AlertCircle, Sparkles, 
  Phone, Mail, MessageCircle, PhoneCall, RefreshCw, Send, X, Users, Tag, Building, Car, Calendar, Search, Filter, ArrowUpRight,
  Bell, CheckCheck, Trash2
} from 'lucide-react';
import LeadManagement from '../../components/shared/LeadManagement';
import NotificationSoundToggle from '../../components/common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';
import * as api from '../../services/api';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

export default function SubAdminPortalPage({ currentUser: propCurrentUser, onLogout, onLoginSuccess, usersList = [] }) {
  const [localUser, setLocalUser] = useState(() => {
    if (propCurrentUser && ['subadmin', 'sub_admin', 'agent', 'admin', 'superadmin'].includes(propCurrentUser.role)) {
      return propCurrentUser;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (saved && ['subadmin', 'sub_admin', 'agent', 'admin', 'superadmin'].includes(saved.role)) {
        return saved;
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    if (propCurrentUser && ['subadmin', 'sub_admin', 'agent', 'admin', 'superadmin'].includes(propCurrentUser.role)) {
      setLocalUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  const [activeSidebarTab, setActiveSidebarTab] = useState('assigned_leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Assigned leads counter for badge
  const [assignedCount, setAssignedCount] = useState(0);

  // Sub-Admin Notifications & Live Toasts
  const [subNotifs, setSubNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [subToasts, setSubToasts] = useState([]);
  const isInitialLoadRef = useRef(true);
  const notifDropdownRef = useRef(null);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch subadmin notifications
  const fetchSubNotifications = useCallback(async () => {
    if (!localUser) return;
    try {
      const res = await api.fetchNotifications({ role: 'subadmin', userId: localUser.id || localUser.username });
      if (res && Array.isArray(res.notifications)) {
        setSubNotifs(res.notifications);
        setUnreadCount(Number(res.unread_count) || res.notifications.filter(n => !n.is_read).length);
        if (isInitialLoadRef.current) {
          registerSeenNotifications(res.notifications);
          isInitialLoadRef.current = false;
        } else {
          const newlyReceived = handleIncomingNotifications(res.notifications, { isInitialLoad: false });
          if (Array.isArray(newlyReceived) && newlyReceived.length > 0) {
            const freshToasts = newlyReceived.map(item => ({
              ...item,
              toastId: `stoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            }));
            setSubToasts(prev => [...prev.slice(-4), ...freshToasts]);
          }
        }
      }
    } catch (e) {}
  }, [localUser]);

  // Auto-dismiss subadmin toasts after 6s
  useEffect(() => {
    if (subToasts.length === 0) return;
    const timer = setTimeout(() => {
      setSubToasts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [subToasts]);

  // Periodic polling for subadmin notifications (3.5s)
  useEffect(() => {
    if (localUser) {
      fetchSubNotifications();
      const interval = setInterval(fetchSubNotifications, 3500);
      return () => clearInterval(interval);
    }
  }, [localUser, fetchSubNotifications]);

  const handleMarkRead = async (id, all = false) => {
    try {
      await api.markNotificationRead(id, { role: 'subadmin', userId: localUser.id || localUser.username, all });
      if (all) {
        setSubNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      } else {
        setSubNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {}
  };

  const handleClearAll = async () => {
    try {
      await api.clearNotifications({ role: 'subadmin', userId: localUser.id || localUser.username });
      setSubNotifs([]);
      setUnreadCount(0);
    } catch (e) {}
  };

  // Send online heartbeat when Sub-Admin is logged in
  useEffect(() => {
    if (!localUser) return;

    // Send immediate online status update
    const userId = localUser.id || localUser.username;
    api.updateOnlineStatus(userId, 1);

    // Heartbeat ping every 15 seconds
    const pingInterval = setInterval(() => {
      api.updateOnlineStatus(userId, 1);
    }, 15000);

    const handleBeforeUnload = () => {
      api.updateOnlineStatus(userId, 0);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      api.updateOnlineStatus(userId, 0);
    };
  }, [localUser]);

  // Load assigned leads count for sidebar badge
  const fetchAssignedLeadsCount = useCallback(async () => {
    if (!localUser) return;
    try {
      const data = await api.fetchLeads();
      if (Array.isArray(data)) {
        const u = (localUser.username || '').toLowerCase();
        const n = (localUser.name || '').toLowerCase();
        const count = data.filter(l => {
          const a = (l.assigned_to || l.assignedTo || '').toLowerCase();
          return a === u || a === n || (u && a.includes(u)) || (n && a.includes(n));
        }).length;
        setAssignedCount(count);
      }
    } catch (e) {}
  }, [localUser]);

  useEffect(() => {
    if (localUser) {
      fetchAssignedLeadsCount();
      const interval = setInterval(fetchAssignedLeadsCount, 10000);
      return () => clearInterval(interval);
    }
  }, [localUser, fetchAssignedLeadsCount]);

  const handleSubAdminLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username/email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const user = await api.loginUser(username.trim(), password.trim());
      if (user) {
        const isSubRole = ['subadmin', 'sub_admin', 'agent'].includes(user.role?.toLowerCase());
        if (!isSubRole && user.role !== 'admin' && user.role !== 'superadmin') {
          throw new Error("Access denied. Your account is not authorized as a Sub-Admin.");
        }

        const activeSubUser = { ...user, role: user.role === 'admin' ? 'subadmin' : user.role };
        localStorage.setItem('currentUser', JSON.stringify(activeSubUser));
        setLocalUser(activeSubUser);
        if (onLoginSuccess) onLoginSuccess(activeSubUser);

        // Update online status in database immediately
        await api.updateOnlineStatus(activeSubUser.id || activeSubUser.username, 1);
      } else {
        throw new Error("Invalid username or password.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutLocal = async () => {
    if (localUser) {
      await api.updateOnlineStatus(localUser.id || localUser.username, 0);
    }
    localStorage.removeItem('currentUser');
    setLocalUser(null);
    if (onLogout) onLogout();
  };

  // Render Login Screen if unauthenticated
  if (!localUser) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center px-3"
        style={{
          background: 'linear-gradient(135deg, #0D1B2E 0%, #1A2B4C 50%, #0D1B2E 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255, 99, 51, 0.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.15)', filter: 'blur(80px)' }} />

        <div className="w-100" style={{ maxWidth: '420px', zIndex: 2 }}>
          <div className="text-center mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle p-3 mb-3 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', width: '64px', height: '64px' }}
            >
              <Shield size={32} color="#fff" />
            </div>
            <h3 className="fw-bold text-white font-heading tracking-wide mb-1">Sub-Admin Portal</h3>
            <p className="text-white-50" style={{ fontSize: '0.85rem' }}>
              WOW GOA — Lead Operations & Customer Response Desk
            </p>
          </div>

          <div className="p-4 rounded-4 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.8rem' }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubAdminLogin}>
              <div className="mb-3">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                  Sub-Admin Username / Email
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><User size={16} /></span>
                  <input
                    type="text"
                    required
                    className="form-control border-start-0 bg-light"
                    placeholder="Enter username or email"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted"><Lock size={16} /></span>
                  <input
                    type="password"
                    required
                    className="form-control border-start-0 bg-light"
                    placeholder="Enter account password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="text-end mb-3">
                <a
                  href="#forgot"
                  className="text-decoration-none fw-semibold cursor-pointer"
                  style={{ fontSize: '0.8rem', color: '#FF6333' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(true);
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn w-100 py-2.5 rounded-3 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2 mb-2"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
              >
                {loading ? 'Authenticating...' : 'Login to Sub-Admin Portal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('rahul_subadmin');
                  setPassword('admin@2026');
                }}
                className="btn btn-sm btn-outline-secondary w-100 py-1.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: '0.78rem', background: '#f8fafc' }}
              >
                <span>⚡ Fill Demo: <b>rahul_subadmin</b> / <b>admin@2026</b></span>
              </button>
            </form>

            <div className="text-center mt-3 pt-3 border-top d-flex justify-content-between align-items-center" style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <span>Live status broadcasting</span>
              <a href="/" className="text-primary text-decoration-none fw-semibold" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
                Return to Home →
              </a>
            </div>
          </div>
        </div>

        {showForgotPassword && (
          <ForgotPasswordModal
            isOpen={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
            initialIdentifier={username}
            onSuccessReturnToLogin={(usedId) => {
              if (usedId) setUsername(usedId);
              setPassword('');
              setShowForgotPassword(false);
            }}
          />
        )}
      </div>
    );
  }

  // Once Logged In as Sub-Admin
  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* SIDEBAR NAVIGATION */}
      <aside 
        className="d-flex flex-column shadow-lg flex-shrink-0"
        style={{
          width: sidebarCollapsed ? '70px' : '260px',
          background: '#0D1B2E',
          color: '#fff',
          transition: 'all 0.25s ease',
          zIndex: 100
        }}
      >
        {/* Brand Section */}
        <div className="p-3 d-flex align-items-center justify-content-between border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)' }}>
              <Shield size={20} color="#fff" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h6 className="mb-0 fw-bold font-heading text-white tracking-wide" style={{ fontSize: '0.95rem' }}>WOW GOA</h6>
                <span className="text-warning font-monospace fw-semibold" style={{ fontSize: '0.68rem' }}>SUB-ADMIN DESK</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-grow-1 py-3 px-2">
          <button
            onClick={() => setActiveSidebarTab('assigned_leads')}
            className={`w-100 text-start btn border-0 py-2.5 px-3 rounded-3 mb-2 d-flex align-items-center justify-content-between text-decoration-none transition-all ${
              activeSidebarTab === 'assigned_leads' ? 'fw-bold text-white shadow-sm' : 'text-white-50 hover-bg-white-10'
            }`}
            style={{
              background: activeSidebarTab === 'assigned_leads' ? 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)' : 'transparent',
              fontSize: '0.84rem'
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <Users size={17} />
              {!sidebarCollapsed && <span>My Assigned Leads</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="badge rounded-pill bg-white text-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                {assignedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('profile')}
            className={`w-100 text-start btn border-0 py-2.5 px-3 rounded-3 mb-2 d-flex align-items-center justify-content-between text-decoration-none transition-all ${
              activeSidebarTab === 'profile' ? 'fw-bold text-white shadow-sm' : 'text-white-50 hover-bg-white-10'
            }`}
            style={{
              background: activeSidebarTab === 'profile' ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : 'transparent',
              fontSize: '0.84rem'
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <User size={17} />
              {!sidebarCollapsed && <span>Sub-Admin Profile</span>}
            </div>
          </button>
        </div>

        {/* User Presence Pill & Logout Footer */}
        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          {!sidebarCollapsed && (
            <div className="mb-2.5 p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.8rem', maxWidth: '140px' }}>
                  {localUser.name || localUser.username}
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5 font-monospace" style={{ fontSize: '0.62rem' }}>
                  🟢 ONLINE
                </span>
              </div>
              <div className="text-white-50" style={{ fontSize: '0.7rem' }}>
                @{localUser.username}
              </div>
            </div>
          )}

          <button
            onClick={handleLogoutLocal}
            className="btn btn-outline-danger btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            style={{ fontSize: '0.8rem' }}
          >
            <LogOut size={15} /> {!sidebarCollapsed && 'Logout Sub-Admin'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top Header */}
        <header className="px-4 py-3 shadow-sm d-flex align-items-center justify-content-between flex-shrink-0" style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 fw-bold font-heading text-dark" style={{ letterSpacing: '0.3px' }}>
              {activeSidebarTab === 'assigned_leads' ? 'Assigned Leads & Response Desk' : 'Sub-Admin Profile'}
            </h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 font-monospace fw-bold" style={{ fontSize: '0.72rem' }}>
              🟢 Live Presence Broadcast Active
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Sound Toggle */}
            <NotificationSoundToggle />

            {/* Notification Bell Dropdown */}
            <div className="position-relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(prev => !prev)}
                className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center position-relative border shadow-sm"
                style={{ width: '40px', height: '40px' }}
                title="Notifications"
              >
                <Bell size={18} className="text-secondary" />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white border border-white"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div
                  className="position-absolute end-0 mt-2 card shadow-lg border rounded-4 overflow-hidden"
                  style={{ width: '360px', zIndex: 1050, background: '#fff' }}
                >
                  <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                    <div className="d-flex align-items-center gap-2">
                      <Bell size={16} className="text-primary" />
                      <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Sub-Admin Alerts</span>
                      {unreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(null, true)}
                          className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold d-flex align-items-center gap-1"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <CheckCheck size={13} /> Mark all read
                        </button>
                      )}
                      {subNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-semibold ms-2 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <Trash2 size={13} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {subNotifs.length === 0 ? (
                      <div className="text-center py-4 text-muted" style={{ fontSize: '0.8rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      subNotifs.map(n => {
                        const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);
                        return (
                          <div
                            key={n.id}
                            className={`p-3 border-bottom d-flex align-items-start gap-2 transition-all ${
                              !n.is_read ? 'bg-primary-subtle bg-opacity-25' : 'hover-bg-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (!n.is_read) handleMarkRead(n.id);
                            }}
                          >
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className={`text-dark ${!n.is_read ? 'fw-bold' : 'fw-semibold'}`} style={{ fontSize: '0.82rem' }}>
                                  {cleanTitle}
                                </span>
                                {badgeStyle && (
                                  <span className="badge px-1.5 py-0.5 rounded-pill font-monospace" style={{ ...badgeStyle, fontSize: '0.62rem' }}>
                                    {status}
                                  </span>
                                )}
                              </div>
                              <p className="mb-1 text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.35 }}>
                                {n.message}
                              </p>
                              <span className="text-muted opacity-75" style={{ fontSize: '0.68rem' }}>
                                {getRelativeTimeString(n.created_at)}
                              </span>
                            </div>
                            {!n.is_read && (
                              <span className="rounded-circle bg-primary mt-1" style={{ width: '8px', height: '8px', flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-1.5 rounded-pill border bg-light d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
              <User size={14} className="text-primary" />
              <span className="fw-bold text-dark">{localUser.name || localUser.username}</span>
              <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.65rem' }}>SUB-ADMIN</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow-1 overflow-auto p-0">
          {activeSidebarTab === 'assigned_leads' ? (
            <LeadManagement usersList={usersList} currentUser={localUser} />
          ) : (
            <div className="p-4">
              <div className="rounded-4 p-4 shadow-sm border" style={{ background: '#fff', maxWidth: '600px' }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                  <User size={20} className="text-primary" /> Sub-Admin Account Profile
                </h5>

                <div className="p-3 rounded-3 mb-3 bg-light border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Full Name:</span>
                    <span className="fw-bold text-dark">{localUser.name || 'Sub-Admin'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Username:</span>
                    <span className="fw-bold font-monospace text-primary">@{localUser.username}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Email Address:</span>
                    <span className="fw-semibold text-secondary">{localUser.email}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Role Permission:</span>
                    <span className="badge bg-purple-subtle text-purple border font-monospace">SUB-ADMIN</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Presence Status:</span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold">🟢 ONLINE</span>
                  </div>
                </div>

                <div className="p-3 rounded-3" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff', fontSize: '0.8rem', color: '#6b21a8' }}>
                  ⚡ When logged into this Sub-Admin Desk, your online status automatically updates in real-time on the Admin Panel. When you logout or close the tab, your status updates to Offline.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating SubAdmin Real-Time Toasts */}
      {subToasts.length > 0 && (
        <div 
          className="position-fixed d-flex flex-column gap-2"
          style={{ bottom: '24px', right: '24px', zIndex: 99999, maxWidth: '380px', pointerEvents: 'auto' }}
        >
          {subToasts.map(toast => {
            const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(toast.title, toast.message);
            return (
              <div
                key={toast.toastId}
                className="card shadow-lg border rounded-4 p-3 d-flex flex-row align-items-start gap-3 animate__animated animate__fadeInUp"
                style={{
                  background: 'linear-gradient(135deg, #0D1B2E 0%, #1e293b 100%)',
                  borderColor: 'rgba(255, 99, 51, 0.4)',
                  color: '#fff',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                  minWidth: '320px'
                }}
              >
                <div 
                  className="rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(255, 99, 51, 0.2)', color: '#FF6333' }}
                >
                  <Bell size={18} />
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                    <span className="fw-bold text-truncate" style={{ fontSize: '0.84rem', color: '#fff' }}>
                      {cleanTitle}
                    </span>
                    {badgeStyle && (
                      <span 
                        className="badge px-1.5 py-0.5 rounded-pill font-monospace"
                        style={{ ...badgeStyle, fontSize: '0.62rem' }}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <p className="text-white-50 mb-0" style={{ fontSize: '0.74rem', lineHeight: 1.35 }}>
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
                  className="btn btn-sm p-0 text-white-50 hover-text-white border-0"
                  style={{ background: 'transparent' }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
