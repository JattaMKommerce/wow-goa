import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, X, Check, Trash2, CheckCheck } from 'lucide-react';
import * as api from '../../../services/api';
import { getRelativeTimeString } from '../../../utils/notificationSound';

const NOTIF_ICONS = { booking: '📅', payment: '💳', review: '⭐', system: '🔔', approval: '✅', alert: '⚠️' };
const NOTIF_COLORS = { booking: '#6c5ce7', payment: '#00b894', review: '#FFC107', system: '#0984e3', approval: '#00b894', alert: '#e17055' };

export default function PMSNotifications({ currentUser, onNavigate, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const storagePrefix = `vendor_notifs_hotel_${currentUser?.id || 'vendor'}`;
  const readStorageKey = `${storagePrefix}_read`;
  const clearedStorageKey = `${storagePrefix}_cleared`;

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListNotifications(currentUser.id);
      const fetched = res.notifications || [];
      const savedCleared = JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
      const savedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      const active = fetched.filter(n => !savedCleared.includes(String(n.id))).map(n => ({
        ...n,
        is_read: n.is_read || savedRead.includes(String(n.id)) ? 1 : 0
      }));
      setNotifications(active);
    } catch {
      setNotifications([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, [currentUser.id]);

  const markAllRead = async () => {
    try {
      const allIds = notifications.map(n => String(n.id));
      const savedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      localStorage.setItem(readStorageKey, JSON.stringify(Array.from(new Set([...savedRead, ...allIds]))));
    } catch (_) {}
    await api.pmsMarkNotificationRead(null, currentUser.id, true);
    setNotifications(n => n.map(x => ({ ...x, is_read: 1 })));
    window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
  };

  const markRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const savedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      localStorage.setItem(readStorageKey, JSON.stringify(Array.from(new Set([...savedRead, String(id)]))));
    } catch (_) {}
    await api.pmsMarkNotificationRead(id, currentUser.id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: 1 } : x));
    window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
  };

  const deleteNotif = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const savedCleared = JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
      localStorage.setItem(clearedStorageKey, JSON.stringify(Array.from(new Set([...savedCleared, String(id)]))));
      await api.pmsDeleteNotification(id, currentUser.id);
      setNotifications(n => n.filter(x => x.id !== id));
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
      window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifs = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      const allIds = notifications.map(n => String(n.id));
      const savedCleared = JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
      localStorage.setItem(clearedStorageKey, JSON.stringify(Array.from(new Set([...savedCleared, ...allIds]))));
      await api.pmsDeleteNotification(null, currentUser.id, true);
      setNotifications([]);
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
      window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = (n) => {
    if (!n.is_read) {
      markRead(n.id);
    }
    if (onNotificationClick) {
      onNotificationClick(n);
    } else if (onNavigate) {
      const type = (n.type || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      const msg = (n.message || '').toLowerCase();
      if (type === 'booking' || title.includes('booking') || title.includes('reservation') || msg.includes('reservation') || msg.includes('#bk-')) {
        onNavigate('all_bookings');
      } else if (type === 'hotel' || type === 'approval' || title.includes('hotel') || title.includes('registered')) {
        onNavigate('my_hotels');
      } else if (type === 'payment' || title.includes('payment')) {
        onNavigate('payments');
      } else if (type === 'review' || title.includes('review')) {
        onNavigate('reviews');
      } else if (type === 'support' || title.includes('ticket')) {
        onNavigate('support');
      }
    }
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const filtered = filter === 'All' ? notifications : filter === 'Unread' ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.is_read);

  const timeAgo = (dateStr) => getRelativeTimeString(dateStr);

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>Notifications</h4>
          {unread > 0 && <span className="badge rounded-pill" style={{ background: '#d63031', color: '#fff', fontSize: '0.78rem' }}>{unread} unread</span>}
        </div>
        <div className="d-flex align-items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.78rem', color: '#0984e3' }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAllNotifs} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm text-danger" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        {['All', 'Unread', 'Read'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn btn-sm rounded-pill px-3"
            style={{ background: filter === f ? '#0D1B2E' : '#fff', color: filter === f ? '#fff' : '#6c757d', border: '1px solid #dee2e6' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Bell size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No notifications</h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(n => (
            <div 
              key={n.id} 
              onClick={() => handleCardClick(n)}
              className="card border-0 rounded-4 shadow-sm p-4 cursor-pointer" 
              style={{ 
                background: '#fff', 
                borderLeft: !n.is_read ? `4px solid ${NOTIF_COLORS[n.type] || '#0984e3'}` : '4px solid transparent',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="d-flex align-items-start gap-3">
                <span style={{ fontSize: '1.4rem', lineHeight: 1.2 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="fw-bold d-flex align-items-center gap-2" style={{ color: '#1a2b4a', fontSize: '0.9rem' }}>
                      <span>{n.title}</span>
                      {!n.is_read && <span className="badge rounded-pill bg-warning text-dark" style={{ fontSize: '0.62rem' }}>New</span>}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgo(n.created_at)}</span>
                      {!n.is_read && (
                        <button onClick={(e) => markRead(n.id, e)} title="Mark as read" className="btn btn-sm p-0 d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', background: '#edf7f0', border: 'none', borderRadius: '50%' }}>
                          <Check size={11} color="#00b894" />
                        </button>
                      )}
                      <button onClick={(e) => deleteNotif(n.id, e)} title="Remove notification" className="btn btn-sm p-0 d-flex align-items-center justify-content-center text-muted hover-danger" style={{ width: '22px', height: '22px', background: '#f8f9fa', border: 'none', borderRadius: '50%' }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.83rem', lineHeight: 1.5 }}>{n.message}</p>
                  <div className="mt-2 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge rounded-pill" style={{ background: `${NOTIF_COLORS[n.type] || '#6c757d'}20`, color: NOTIF_COLORS[n.type] || '#6c757d', fontSize: '0.68rem' }}>
                        {n.type}
                      </span>
                      {!n.is_read && <span className="badge rounded-pill ms-1" style={{ background: '#fff3f0', color: '#e17055', fontSize: '0.68rem' }}>Unread</span>}
                    </div>
                    <span className="text-primary small fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
