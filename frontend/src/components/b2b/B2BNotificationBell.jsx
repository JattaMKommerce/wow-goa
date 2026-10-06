import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X, Clock, ShieldCheck, CheckCheck, Trash2 } from 'lucide-react';
import * as api from '../../services/api';
import NotificationSoundToggle from '../common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTimeAgo = (dateStr) => getRelativeTimeString(dateStr);

const getTypeIcon = (type) => {
  switch (type) {
    case 'booking_confirmed':
    case 'b2b_booking_created':
      return <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: '#34D399' }} />;
    case 'mode_approved':
    case 'registration_approved':
      return <ShieldCheck size={15} className="flex-shrink-0" style={{ color: '#FCD34D' }} />;
    case 'mode_rejected':
    case 'registration_rejected':
      return <AlertCircle size={15} className="flex-shrink-0" style={{ color: '#F87171' }} />;
    default:
      return <Info size={15} className="flex-shrink-0" style={{ color: '#60A5FA' }} />;
  }
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function B2BNotificationBell({ partner, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const partnerId = partner?.id || partner?.username || '';
  const isFirstLoad = useRef(true);
  const dropdownRef = useRef(null);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async () => {
    if (!partnerId) return;
    try {
      const res = await api.fetchB2BNotifications(partnerId);
      if (res?.success) {
        const fetched = Array.isArray(res.notifications) ? res.notifications : [];
        setNotifications(fetched);
        const unread = fetched.filter(n => !n.is_read).length;
        setUnreadCount(unread);

        if (isFirstLoad.current) {
          registerSeenNotifications(fetched);
          isFirstLoad.current = false;
        } else {
          const fresh = handleIncomingNotifications(fetched, { isInitialLoad: false });
          fresh.forEach(item => triggerToast(item));
        }
      }
    } catch (err) {
      console.warn('[B2B Bell] fetch error:', err);
    }
  }, [partnerId]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3500);
    const sync = () => loadNotifications();
    const events = [
      'tripgalileo-notification-sync',
      'tripgalileo-booking-sync',
      'new-booking-created',
      'booking-status-updated',
    ];
    events.forEach(e => window.addEventListener(e, sync));

    let bc;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_notifications_sync');
        bc.onmessage = sync;
      }
    } catch (_) {}

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, sync));
      bc?.close();
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Toasts ──────────────────────────────────────────────────────────────────

  const triggerToast = (item) => {
    const toastId = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [{ ...item, toastId }, ...prev.slice(0, 3)]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 6000);
  };

  const removeToast = (toastId) => setToasts(prev => prev.filter(t => t.toastId !== toastId));

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleMarkSingleRead = async (notifId, e) => {
    e?.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.markB2BNotificationRead(notifId, partnerId, false);
    } catch (_) {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try {
      await api.markB2BNotificationRead('', partnerId, true);
    } catch (_) {
      loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDismiss = (notifId, e) => {
    e.stopPropagation();
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notifId);
      setUnreadCount(updated.filter(n => !n.is_read).length);
      return updated;
    });
  };

  const handleClearAll = async () => {
    if (isClearing) return;
    setIsClearing(true);
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.clearB2BNotifications(partnerId);
    } catch (_) {
      loadNotifications();
    } finally {
      setIsClearing(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const filtered = activeFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  // ─── Render ──────────────────────────────────────────────────────────────────

  const S = {
    toast: {
      background: '#0D1B2E', border: '1px solid rgba(252,211,77,0.35)',
      borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      marginBottom: '10px', overflow: 'hidden',
    },
    accentBar: { height: '3px', background: 'linear-gradient(90deg,#FCD34D,#F59E0B)' },
    bellBtn: (open, hasUnread) => ({
      width: '38px', height: '38px', borderRadius: '50%',
      border: 'none', cursor: 'pointer', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: open ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.08)',
      color: hasUnread ? '#FCD34D' : 'rgba(255,255,255,0.75)',
      transition: 'all 0.2s',
    }),
    badge: {
      position: 'absolute', top: '2px', right: '2px',
      background: '#EF4444', color: '#fff',
      borderRadius: '99px', fontSize: '0.58rem', fontWeight: 800,
      padding: '1px 4px', lineHeight: 1.4,
      border: '1.5px solid #0D1B2E', minWidth: '16px', textAlign: 'center',
    },
    panel: {
      position: 'absolute', top: '46px', right: 0,
      width: '420px', maxWidth: '94vw',
      background: '#111C2E', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      zIndex: 1080, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    },
    panelHeader: {
      background: '#0B1526',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '12px 16px 0',
    },
    filterBtn: (active) => ({
      border: 'none', borderRadius: '20px', cursor: 'pointer',
      padding: '3px 10px', fontSize: '0.68rem', fontWeight: 600,
      background: active ? '#FCD34D' : 'rgba(255,255,255,0.08)',
      color: active ? '#1a1100' : 'rgba(255,255,255,0.5)',
      transition: 'all 0.15s',
    }),
    markReadBtn: (disabled) => ({
      display: 'flex', alignItems: 'center', gap: '4px',
      border: 'none', background: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? 'rgba(255,255,255,0.3)' : '#60A5FA',
      fontSize: '0.68rem', fontWeight: 600, padding: '2px 0', whiteSpace: 'nowrap',
    }),
    clearBtn: (disabled) => ({
      display: 'flex', alignItems: 'center', gap: '4px',
      border: '1px solid rgba(239,68,68,0.35)',
      background: 'rgba(239,68,68,0.10)',
      borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? 'rgba(239,68,68,0.4)' : '#F87171',
      fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', whiteSpace: 'nowrap',
    }),
    list: {
      maxHeight: '400px', overflowY: 'auto',
      paddingRight: '6px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.12) transparent',
    },
    emptyWrap: { padding: '44px 24px', textAlign: 'center' },
    emptyIcon: {
      width: '52px', height: '52px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 12px',
    },
    cardRow: (isUnread) => ({
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', cursor: 'pointer',
      background: isUnread ? 'rgba(252,211,77,0.04)' : 'transparent',
      borderLeft: isUnread ? '3px solid #FCD34D' : '3px solid transparent',
      transition: 'background 0.15s', position: 'relative',
    }),
    cardTitle: (isUnread) => ({
      color: '#fff', fontWeight: isUnread ? 700 : 500,
      fontSize: '0.80rem', lineHeight: 1.35, flex: 1, minWidth: 0,
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    }),
    dismissBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'rgba(255,255,255,0.25)', padding: '1px 2px',
      borderRadius: '4px', flexShrink: 0, lineHeight: 1, transition: 'color 0.15s',
    },
    cardMsg: {
      color: 'rgba(255,255,255,0.5)', fontSize: '0.71rem',
      margin: '0 0 6px', lineHeight: 1.45,
    },
    cardTime: {
      color: 'rgba(255,255,255,0.3)', fontSize: '0.63rem',
      display: 'flex', alignItems: 'center', gap: '3px',
    },
    cardMarkBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#60A5FA', fontSize: '0.64rem', fontWeight: 600,
      padding: 0, display: 'flex', alignItems: 'center', gap: '3px',
    },
    footer: {
      background: '#0B1526', borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '10px 16px', textAlign: 'center', flexShrink: 0,
    },
    footerBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#FCD34D', fontSize: '0.74rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 0', transition: 'opacity 0.15s',
    },
  };

  return (
    <>
      {/* ── Floating Toasts ── */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, width: '340px', maxWidth: '90vw', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.toastId} style={{ ...S.toast, pointerEvents: 'auto' }}>
            <div style={S.accentBar} />
            <div style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'rgba(252,211,77,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} style={{ color: '#FCD34D' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.3 }}>{toast.title}</span>
                  <button onClick={() => removeToast(toast.toastId)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1 }}>
                    <X size={13} />
                  </button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', margin: '0 0 6px', lineHeight: 1.4 }}>{toast.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.64rem' }}>Just now</span>
                  <button onClick={() => { removeToast(toast.toastId); setIsOpen(true); onNotificationClick?.(toast); }}
                    style={{ background: '#FCD34D', color: '#1a1a1a', border: 'none', borderRadius: '20px', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bell + Dropdown ── */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>

        {/* Bell Button */}
        <button type="button" onClick={() => setIsOpen(o => !o)} title="B2B Notifications" aria-label="View B2B notifications"
          style={S.bellBtn(isOpen, unreadCount > 0)}>
          <Bell size={18} />
          {unreadCount > 0 && <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div onClick={e => e.stopPropagation()} style={S.panel}>

            {/* Header */}
            <div style={S.panelHeader}>
              {/* Row 1: Title + badge + sound */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <Bell size={15} style={{ color: '#FCD34D', flexShrink: 0 }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Live Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background: '#EF4444', color: '#fff', borderRadius: '99px', fontSize: '0.60rem', fontWeight: 800, padding: '1px 6px', whiteSpace: 'nowrap' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <NotificationSoundToggle variant="dark" />
              </div>

              {/* Row 2: Filter tabs + Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => setActiveFilter('all')} style={S.filterBtn(activeFilter === 'all')}>
                    All ({notifications.length})
                  </button>
                  <button type="button" onClick={() => setActiveFilter('unread')} style={S.filterBtn(activeFilter === 'unread')}>
                    Unread ({unreadCount})
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button type="button" onClick={handleMarkAllRead} disabled={isMarkingAll} title="Mark all as read" style={S.markReadBtn(isMarkingAll)}>
                      <CheckCheck size={12} /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button type="button" onClick={handleClearAll} disabled={isClearing} title="Clear all notifications" style={S.clearBtn(isClearing)}>
                      <Trash2 size={11} /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div style={S.list}>
              {filtered.length === 0 ? (
                <div style={S.emptyWrap}>
                  <div style={S.emptyIcon}><Bell size={22} style={{ color: 'rgba(255,255,255,0.2)' }} /></div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 4px' }}>
                    {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.70rem', margin: 0 }}>
                    {activeFilter === 'unread' ? 'No unread notifications right now.' : 'Live booking & approval updates will appear here.'}
                  </p>
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isUnread = !item.is_read;
                  const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(item.title, item.message);

                  return (
                    <div
                      key={item.id}
                      onClick={() => { if (isUnread) handleMarkSingleRead(item.id); onNotificationClick?.(item); }}
                      style={{ ...S.cardRow(isUnread), borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = isUnread ? 'rgba(252,211,77,0.08)' : 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(252,211,77,0.04)' : 'transparent'}
                    >
                      {/* Icon */}
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>{getTypeIcon(item.type)}</div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            <span style={S.cardTitle(isUnread)}>
                              {cleanTitle}
                              {isUnread && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#FCD34D', marginLeft: '6px', verticalAlign: 'middle' }} />}
                            </span>
                            {status && (
                              <span style={{
                                fontSize: '0.60rem',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: badgeStyle?.bg || 'rgba(255,255,255,0.1)',
                                color: badgeStyle?.text || '#fff',
                                border: `1px solid ${badgeStyle?.border || 'rgba(255,255,255,0.2)'}`,
                                whiteSpace: 'nowrap'
                              }}>
                                {status}
                              </span>
                            )}
                          </div>
                          <button type="button" onClick={e => handleDismiss(item.id, e)} title="Dismiss"
                            style={S.dismissBtn}
                            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                            <X size={12} />
                          </button>
                        </div>
                        <p style={S.cardMsg}>{item.message}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={S.cardTime}><Clock size={10} />{getRelativeTimeString(item.created_at)}</span>
                          {isUnread && (
                            <button type="button" onClick={e => handleMarkSingleRead(item.id, e)} style={S.cardMarkBtn}>
                              <CheckCheck size={11} /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Footer */}
            <div style={S.footer}>
              <button type="button"
                onClick={() => { setIsOpen(false); onNotificationClick?.({ type: 'view_all' }); }}
                style={S.footerBtn}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                View All Notifications →
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
