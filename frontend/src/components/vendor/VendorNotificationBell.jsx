import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import * as api from '../../services/api';
import NotificationSoundToggle from '../common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';

export default function VendorNotificationBell({
  currentUser,
  vendorType = 'hotel', // 'hotel' or 'vehicle'
  bookings = [],
  onNavigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const dropdownRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const bcNotifsRef = useRef(null);

  const storagePrefix = `vendor_notifs_${vendorType}_${currentUser?.id || 'vendor'}`;
  const readStorageKey = `${storagePrefix}_read`;
  const clearedStorageKey = `${storagePrefix}_cleared`;

  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(readStorageKey) || '[]');
    } catch {
      return [];
    }
  });

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
    } catch {
      return [];
    }
  });

  const readNotifIdsRef = useRef(readNotifIds);
  readNotifIdsRef.current = readNotifIds;

  const clearedNotifIdsRef = useRef(clearedNotifIds);
  clearedNotifIdsRef.current = clearedNotifIds;

  // Re-sync storage keys if user or vendorType changes
  useEffect(() => {
    try {
      const savedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      const savedCleared = JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
      setReadNotifIds(savedRead);
      readNotifIdsRef.current = savedRead;
      setClearedNotifIds(savedCleared);
      clearedNotifIdsRef.current = savedCleared;
    } catch (_) {}
  }, [readStorageKey, clearedStorageKey]);

  // Fetch real-time notifications strictly scoped to this portal type
  const refreshNotifications = async () => {
    try {
      if (!currentUser?.id) return;
      const [res, authRes] = await Promise.all([
        api.pmsListNotifications(currentUser.id, vendorType).catch(() => ({ notifications: [] })),
        api.fetchNotifications({ role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser.id }).catch(() => ({ notifications: [] }))
      ]);
      let notifs = (res && Array.isArray(res.notifications)) ? res.notifications : [];
      let authNotifs = (authRes && Array.isArray(authRes.notifications)) ? authRes.notifications : [];
      
      // Filter bookings strictly by portal type
      const isForCurrentPortal = (b) => {
        const isHotelItem = String(b.item_id || '').toLowerCase().startsWith('hotel') ||
                            b.property_type || b.stars || b.room_type ||
                            b.item_type === 'hotel' ||
                            String(b.item_name || '').toLowerCase().includes('hotel') ||
                            String(b.title || '').toLowerCase().includes('hotel');
        return vendorType === 'hotel' ? isHotelItem : !isHotelItem;
      };

      const portalBookings = (bookings || []).filter(isForCurrentPortal);

      const recentBookings = portalBookings.slice(0, 8).map(b => {
        const isHotel = vendorType === 'hotel';
        const typeLabel = isHotel ? 'Hotel Booking' : 'Vehicle Rental';
        const bId = b.booking_id || b.id || (isHotel ? 'BK-1000' : 'TG-1000');
        const code = String(bId).startsWith('#') ? bId : `#${bId}`;
        const price = b.total_price || b.amount || b.price || 0;
        const cust = b.customer_name || b.guest_name || b.name || 'Customer';
        const item = b.item_name || b.hotel_name || b.vehicle_name || (isHotel ? 'Deluxe Room' : 'Car/Bike');
        const status = b.status || 'Confirmed';
        const rawId = `bk-${b.id || b.booking_id}`;

        const isMarkedRead = readNotifIdsRef.current.includes(rawId) || (b.status === 'Completed');

        return {
          id: rawId,
          isBookingItem: true,
          bookingData: b,
          type: vendorType,
          title: `${typeLabel} ${code}`,
          message: `${cust} — ${item} (${status} • ₹${Number(price).toLocaleString('en-IN')})`,
          is_read: isMarkedRead ? 1 : 0,
          created_at: b.created_at || b.date || 'Recent'
        };
      });

      // Filter incoming backend notifications strictly
      const allIncomingNotifs = [...authNotifs, ...notifs];
      const filteredNotifs = allIncomingNotifs.filter(n => {
        const t = (n.type || '').toLowerCase();
        const title = (n.title || '').toLowerCase();
        const msg = (n.message || '').toLowerCase();

        if (vendorType === 'vehicle') {
          // Reject anything hotel-related
          if (t === 'hotel' || title.includes('hotel') || msg.includes('hotel') || title.includes('resort') || msg.includes('resort')) {
            return false;
          }
          return true;
        } else if (vendorType === 'hotel') {
          // Reject anything vehicle-related
          if (t === 'vehicle' || title.includes('vehicle') || msg.includes('vehicle') || title.includes('rental') || title.includes('car ') || title.includes('bike ')) {
            return false;
          }
          return true;
        }
        return true;
      });

      // Merge backend notifications and portal bookings
      const mergedMap = new Map();
      recentBookings.forEach(rb => mergedMap.set(rb.id, rb));
      filteredNotifs.forEach(n => {
        mergedMap.set(String(n.id), {
          ...n,
          type: vendorType
        });
      });

      let finalItems = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime() || 0;
        const timeB = new Date(b.created_at || 0).getTime() || 0;
        return timeB - timeA;
      });

      // If empty for Vehicle Vendor, provide clean fallback vehicle notifications
      if (finalItems.length === 0 && vendorType === 'vehicle') {
        finalItems = [
          {
            id: 'v-notif-1',
            type: 'vehicle',
            title: 'Vehicle Fleet Active',
            message: 'Your vehicle console is connected with live reservation monitoring.',
            is_read: 0,
            created_at: 'Recent'
          }
        ];
      }

      // 1. Exclude any notifications that have been cleared
      const activeItems = finalItems.filter(item => !clearedNotifIdsRef.current.includes(String(item.id)));

      // 2. Normalize read status based on database is_read or local readNotifIds
      const normalizedItems = activeItems.map(item => {
        const isRead = (item.is_read || readNotifIdsRef.current.includes(String(item.id))) ? 1 : 0;
        return {
          ...item,
          is_read: isRead
        };
      });

      setNotifications(normalizedItems);
      const unread = normalizedItems.filter(x => !x.is_read).length;
      setUnreadCount(unread);

      // Trigger notification sound only for genuinely new unread notifications
      if (isInitialLoadRef.current) {
        registerSeenNotifications(normalizedItems);
        isInitialLoadRef.current = false;
      } else {
        const newlyReceived = handleIncomingNotifications(normalizedItems, { isInitialLoad: false });
        if (Array.isArray(newlyReceived) && newlyReceived.length > 0) {
          window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync'));
          const freshToasts = newlyReceived.map(item => ({
            ...item,
            toastId: `vtoast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
          }));
          setToasts(prev => [...prev.slice(-4), ...freshToasts]);
        }
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  // Auto-dismiss toasts after 6s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 3500);

    const handleSync = () => {
      try {
        const savedRead = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
        const savedCleared = JSON.parse(localStorage.getItem(clearedStorageKey) || '[]');
        setReadNotifIds(savedRead);
        readNotifIdsRef.current = savedRead;
        setClearedNotifIds(savedCleared);
        clearedNotifIdsRef.current = savedCleared;
      } catch (_) {}
      refreshNotifications();
    };

    window.addEventListener('pms-notification-updated', handleSync);
    window.addEventListener('new-booking-created', refreshNotifications);
    window.addEventListener('booking-status-updated', refreshNotifications);
    window.addEventListener('booking-updated', refreshNotifications);
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('tripgalileo-booking-sync', refreshNotifications);

    let bcBookings;
    let bcNotifs;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = refreshNotifications;
        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = handleSync;
        bcNotifsRef.current = bcNotifs;
      }
    } catch (e) {}

    return () => {
      clearInterval(timer);
      window.removeEventListener('pms-notification-updated', handleSync);
      window.removeEventListener('new-booking-created', refreshNotifications);
      window.removeEventListener('booking-status-updated', refreshNotifications);
      window.removeEventListener('booking-updated', refreshNotifications);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('tripgalileo-booking-sync', refreshNotifications);
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, [currentUser?.id, bookings?.length, vendorType, readStorageKey, clearedStorageKey]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    const currentIds = notifications.map(n => String(n.id));
    const updatedRead = Array.from(new Set([...readNotifIdsRef.current, ...currentIds]));
    setReadNotifIds(updatedRead);
    readNotifIdsRef.current = updatedRead;
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(updatedRead));
    } catch (err) {}

    // Immediate UI feedback
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);

    // Call backend endpoints asynchronously
    try {
      await Promise.allSettled([
        api.pmsMarkNotificationRead(null, currentUser?.id || 'u-5', true),
        api.markNotificationRead(null, { role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser?.id || 'u-5', all: true })
      ]);
    } catch (err) {
      console.error(err);
    }

    try {
      if (bcNotifsRef.current) {
        bcNotifsRef.current.postMessage({ type: 'vendor_read_sync', vendorId: currentUser?.id, vendorType });
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
  };

  const handleClearAll = async (e) => {
    if (e) e.stopPropagation();
    const currentIds = notifications.map(n => String(n.id));
    const updatedCleared = Array.from(new Set([...clearedNotifIdsRef.current, ...currentIds]));
    setClearedNotifIds(updatedCleared);
    clearedNotifIdsRef.current = updatedCleared;
    try {
      localStorage.setItem(clearedStorageKey, JSON.stringify(updatedCleared));
    } catch (err) {}

    // Immediate UI clear
    setNotifications([]);
    setUnreadCount(0);

    // Call backend endpoints asynchronously
    try {
      await Promise.allSettled([
        api.pmsDeleteNotification(null, currentUser?.id || 'u-5', true),
        api.clearNotifications({ role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser?.id || 'u-5' })
      ]);
    } catch (err) {
      console.error(err);
    }

    try {
      if (bcNotifsRef.current) {
        bcNotifsRef.current.postMessage({ type: 'vendor_clear_sync', vendorId: currentUser?.id, vendorType });
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
  };

  const handleRemoveSingle = async (id, e) => {
    if (e) e.stopPropagation();
    const strId = String(id);
    const updatedCleared = Array.from(new Set([...clearedNotifIdsRef.current, strId]));
    setClearedNotifIds(updatedCleared);
    clearedNotifIdsRef.current = updatedCleared;
    try {
      localStorage.setItem(clearedStorageKey, JSON.stringify(updatedCleared));
    } catch (err) {}

    const targetItem = notifications.find(n => String(n.id) === strId);
    setNotifications(prev => prev.filter(n => String(n.id) !== strId));
    if (targetItem && !targetItem.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await Promise.allSettled([
        api.pmsDeleteNotification(strId, currentUser?.id || 'u-5'),
        api.clearNotifications({ role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser?.id || 'u-5' })
      ]);
    } catch (err) {
      console.error(err);
    }

    try {
      if (bcNotifsRef.current) {
        bcNotifsRef.current.postMessage({ type: 'vendor_clear_sync', vendorId: currentUser?.id, vendorType });
      }
    } catch (_) {}
  };

  const handleItemClick = async (n) => {
    setIsOpen(false);
    const strId = String(n.id);
    if (!n.is_read || !readNotifIdsRef.current.includes(strId)) {
      const updatedRead = Array.from(new Set([...readNotifIdsRef.current, strId]));
      setReadNotifIds(updatedRead);
      readNotifIdsRef.current = updatedRead;
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(updatedRead));
      } catch (err) {}

      setNotifications(prev => prev.map(x => String(x.id) === strId ? { ...x, is_read: 1 } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));

      try {
        await Promise.allSettled([
          api.pmsMarkNotificationRead(strId, currentUser?.id || 'u-5'),
          api.markNotificationRead(strId, { role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser?.id || 'u-5' })
        ]);
      } catch (err) {}

      try {
        if (bcNotifsRef.current) {
          bcNotifsRef.current.postMessage({ type: 'vendor_read_sync', vendorId: currentUser?.id, vendorType });
        }
      } catch (_) {}
    }

    if (onNavigate) {
      if (n.type === 'MANUAL_WALLET_RECHARGE_REMINDER' || n.reference_type === 'manual_reminder' || n.type === 'wallet_reminder' || (n.title && n.title.includes('Recharge'))) {
        onNavigate('wallet');
      } else {
        const targetTab = vendorType === 'hotel' ? 'all_bookings' : 'bookings';
        onNavigate(targetTab);
      }
    }
  };

  const handleViewAllBookings = () => {
    setIsOpen(false);
    if (onNavigate) {
      const targetTab = vendorType === 'hotel' ? 'all_bookings' : 'bookings';
      onNavigate(targetTab);
    }
  };

  const formatTime = (ts) => {
    if (!ts || ts === 'Recent') return 'Recent';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return ts;
    }
  };

  const portalBookingsCount = (bookings || []).filter(b => {
    const isHotelItem = String(b.item_id || '').toLowerCase().startsWith('hotel') ||
                        b.property_type || b.stars || b.room_type ||
                        b.item_type === 'hotel' ||
                        String(b.item_name || '').toLowerCase().includes('hotel');
    return vendorType === 'hotel' ? isHotelItem : !isHotelItem;
  }).length;

  const totalBookingsCount = portalBookingsCount || notifications.length;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          refreshNotifications();
        }}
        className="btn btn-sm border-0 p-2 position-relative rounded-circle d-flex align-items-center justify-content-center"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: isOpen ? '#FFB800' : 'rgba(255,255,255,0.75)',
          transition: 'all 0.2s',
          width: '38px',
          height: '38px'
        }}
        title="Live Notifications"
      >
        <Bell size={19} color={isOpen ? '#FFB800' : 'rgba(255,255,255,0.8)'} />
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger"
            style={{
              top: '2px',
              right: '2px',
              fontSize: '0.62rem',
              padding: '2px 5px',
              fontWeight: 'bold',
              boxShadow: '0 0 8px rgba(220,53,69,0.8)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pop-up Dropdown matching user mockup */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg animate-fade-in-up"
          style={{
            right: 0,
            top: '46px',
            width: '410px',
            maxWidth: 'calc(100vw - 20px)',
            zIndex: 1080,
            backgroundColor: '#0D1B2E',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.65)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2.5 border-bottom d-flex align-items-center justify-content-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#091422' }}
          >
            {/* Left: Title + Badge */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Bell size={15} className="text-warning flex-shrink-0" />
              <span className="fw-bold text-white small text-nowrap">Live Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="badge rounded-pill bg-danger text-nowrap"
                  style={{ fontSize: '0.62rem', padding: '0.22em 0.5em', fontWeight: 700 }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Right: Sound Control + Mark Read + Clear All */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <NotificationSoundToggle variant="dark" />
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="btn btn-link p-0 text-white-50 text-decoration-underline border-0 text-nowrap"
                  style={{ fontSize: '0.68rem', background: 'transparent' }}
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-sm px-2 py-0.5 rounded text-nowrap fw-semibold"
                style={{
                  fontSize: '0.66rem',
                  color: '#FF6B6B',
                  border: '1px solid rgba(229,57,53,0.4)',
                  background: 'rgba(229,57,53,0.1)'
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          {/* List Items with scrollbar clearance */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 px-3">
                <Bell size={26} className="text-white-50 opacity-25 mb-2 mx-auto" />
                <div className="text-white-50 small">No notifications right now</div>
                <div className="text-white-50 opacity-50" style={{ fontSize: '0.7rem' }}>You're all caught up!</div>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const isUnread = !n.is_read;
                const isHotel = n.type === 'hotel';
                const dotColor = isHotel ? '#00B8D9' : '#FF6333';
                const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="px-3 py-2.5 border-bottom d-flex align-items-start gap-2.5 position-relative"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: isUnread ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isUnread ? 'rgba(255,255,255,0.04)' : 'transparent')
                    }
                  >
                    {/* Cyan / Orange Status Dot */}
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: dotColor,
                        marginTop: '6px',
                        boxShadow: isUnread ? `0 0 6px ${dotColor}` : 'none',
                        opacity: isUnread ? 1 : 0.4
                      }}
                    ></span>

                    {/* Notification Text Details */}
                    <div className="flex-grow-1 overflow-hidden pe-1">
                      <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                        <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1">
                          <span
                            className="fw-bold text-white"
                            style={{
                              fontSize: '0.82rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}
                          >
                            {cleanTitle}
                          </span>
                          {status && (
                            <span
                              className="badge px-1.5 py-0.5 rounded-1 fw-semibold"
                              style={{
                                fontSize: '0.60rem',
                                background: badgeStyle?.bg || 'rgba(255,255,255,0.1)',
                                color: badgeStyle?.text || '#fff',
                                border: `1px solid ${badgeStyle?.border || 'rgba(255,255,255,0.2)'}`
                              }}
                            >
                              {status}
                            </span>
                          )}
                        </div>

                        {/* Dismiss button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(n.id, e)}
                          className="btn btn-sm p-0 text-white-50 border-0 d-flex align-items-center justify-content-center flex-shrink-0 ms-1"
                          style={{ width: '18px', height: '18px', background: 'transparent', opacity: 0.6 }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = '#FF5252';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.6';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                          }}
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="text-white-50" style={{ fontSize: '0.74rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.message}
                      </div>

                      <div className="text-white-50 opacity-50 mt-1" style={{ fontSize: '0.66rem' }}>
                        {getRelativeTimeString(n.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Gold button */}
          <div
            className="p-2.5 border-top text-center"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#091422' }}
          >
            <button
              type="button"
              onClick={handleViewAllBookings}
              className="btn btn-sm w-100 fw-bold py-2 rounded-3"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#FFB800',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.8rem',
                letterSpacing: '0.3px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,184,0,0.15)';
                e.currentTarget.style.color = '#FFC820';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#FFB800';
              }}
            >
              View All Bookings ({totalBookingsCount}) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Floating Real-Time Toasts Container (Multi-Desktop / Cross-Device Ready) */}
      {toasts.length > 0 && (
        <div 
          className="position-fixed d-flex flex-column gap-2"
          style={{ bottom: '24px', right: '24px', zIndex: 99999, maxWidth: '380px', pointerEvents: 'auto' }}
        >
          {toasts.map(toast => {
            const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(toast.title, toast.message);
            return (
              <div
                key={toast.toastId}
                className="card shadow-lg border rounded-4 p-3 d-flex flex-row align-items-start gap-3 animate__animated animate__fadeInUp"
                style={{
                  background: 'linear-gradient(135deg, #0D1B2E 0%, #172a45 100%)',
                  borderColor: 'rgba(255, 184, 0, 0.4)',
                  color: '#fff',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                  minWidth: '320px'
                }}
              >
                <div 
                  className="rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(255, 184, 0, 0.15)', color: '#FFB800' }}
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
                  onClick={() => setToasts(prev => prev.filter(t => t.toastId !== toast.toastId))}
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
