import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wallet, X, Clock, Bell } from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

export default function VendorRechargeReminderBanner({
  vendorId,
  onRechargeClick,
  onDismissed
}) {
  const [alertData, setAlertData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAlert = async () => {
    if (!vendorId) return;
    try {
      const res = await apiFetch(`${API_BASE}?resource=vendor_wallet_info&vendor_id=${encodeURIComponent(vendorId)}`);
      const data = await res.json();
      if (!data || data.error) return;

      const balance = Number(data.balance || 0);
      const isNegative = balance < 0;
      const isBlocked = Boolean(data.is_blocked) || (balance < 0 && Number(data.negative_booking_count || 0) >= Number(data.max_negative_bookings || 2));
      const isSuspended = Number(data.services_suspended) === 1;
      const isRestricted = isNegative || isBlocked || isSuspended;

      const updateAlertData = (newAlert) => {
        setAlertData(prev => {
          if (!prev && !newAlert) return null;
          if (!prev || !newAlert) return newAlert;
          if (
            prev.alertId === newAlert.alertId &&
            prev.notifId === newAlert.notifId &&
            prev.type === newAlert.type &&
            prev.message === newAlert.message &&
            prev.balance === newAlert.balance
          ) {
            return prev;
          }
          return newAlert;
        });
      };

      // If the vendor is in good standing (balance >= 0, not blocked, not suspended):
      // Do NOT show recharge required / negative balance warnings!
      if (!isRestricted) {
        // Only show if there is an active non-negative LOW_BALANCE alert below threshold
        const threshold = Number(data.min_vendor_wallet_balance || 1000);
        if (balance <= threshold && data.active_portal_alert && data.active_portal_alert.active && data.active_portal_alert.event_type === 'LOW_BALANCE') {
          updateAlertData({
            alertId: data.active_portal_alert.alert_id,
            type: 'LOW_BALANCE',
            title: 'Low Wallet Balance Notice',
            message: data.active_portal_alert.message || `Your vendor wallet balance is low (₹${balance.toLocaleString()}). Please recharge to prevent booking disruption.`,
            balance,
            createdAt: data.active_portal_alert.created_at
          });
          return;
        }
        updateAlertData(null);
        return;
      }

      // 1. Active Portal Alert (e.g. MANUAL_REMINDER, ESCALATION_REMINDER, LOW_BALANCE)
      if (data.active_portal_alert && data.active_portal_alert.active) {
        updateAlertData({
          alertId: data.active_portal_alert.alert_id,
          type: data.active_portal_alert.event_type || 'MANUAL_REMINDER',
          title: data.active_portal_alert.event_type === 'MANUAL_REMINDER' 
            ? 'Official Notice from Administration: Wallet Recharge Required'
            : (data.active_portal_alert.event_type === 'LOW_BALANCE' ? 'Low Wallet Balance Notice' : 'Urgent: Wallet Recharge Required'),
          message: data.active_portal_alert.message || (isNegative 
            ? `Your WOW GOA vendor wallet requires recharge. Your current wallet balance is -₹${Math.abs(balance).toLocaleString()}. Please recharge your wallet to continue your services.`
            : `Your vendor wallet balance is low (₹${balance.toLocaleString()}). Please recharge to prevent booking disruption.`),
          balance,
          createdAt: data.active_portal_alert.created_at
        });
        return;
      }

      // 2. Latest Manual Reminder from Notifications
      if (data.latest_manual_reminder) {
        const notif = data.latest_manual_reminder;
        const dismissedKey = `dismissed_manual_reminder_${vendorId}_${notif.id}`;
        if (!localStorage.getItem(dismissedKey)) {
          updateAlertData({
            notifId: notif.id,
            alertId: notif.reference_id,
            type: 'MANUAL_REMINDER',
            title: notif.title || 'Official Notice from Administration: Wallet Recharge Required',
            message: notif.message,
            balance,
            createdAt: notif.created_at
          });
          return;
        }
      }

      // 3. Fallback for negative balance without suspension
      if (isNegative && !isSuspended) {
        updateAlertData({
          type: 'NEGATIVE_BALANCE',
          title: 'Negative Wallet Balance Notice',
          message: `Your current wallet balance is -₹${Math.abs(balance).toLocaleString()}. Please recharge your wallet to maintain service operations.`,
          balance,
          createdAt: null
        });
        return;
      }

      updateAlertData(null);
    } catch (err) {
      console.warn('Error loading vendor alert:', err);
    }
  };

  useEffect(() => {
    loadAlert();
    const interval = setInterval(loadAlert, 20000);
    const handleSync = () => loadAlert();
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('pms-notification-updated', handleSync);
    window.addEventListener('vendor-wallet-updated', handleSync);
    const handleStorage = (e) => {
      if (e.key === 'tg_wallet_updated') handleSync();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('pms-notification-updated', handleSync);
      window.removeEventListener('vendor-wallet-updated', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [vendorId]);

  const handleDismiss = async () => {
    if (!alertData) return;
    setDismissed(true);

    if (alertData.notifId) {
      try {
        localStorage.setItem(`dismissed_manual_reminder_${vendorId}_${alertData.notifId}`, '1');
      } catch (_) {}
    }

    if (alertData.alertId) {
      try {
        await apiFetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'dismiss_portal_alert',
            vendor_id: vendorId,
            alert_id: alertData.alertId
          })
        });
      } catch (e) {
        console.warn('Dismiss alert error:', e);
      }
    }

    if (onDismissed) onDismissed();
  };

  if (!alertData || dismissed) return null;

  const isNeg = Number(alertData.balance) < 0;
  const balStr = isNeg 
    ? `-₹${Math.abs(Number(alertData.balance)).toLocaleString()}` 
    : `₹${Number(alertData.balance).toLocaleString()}`;

  return (
    <div
      className="w-100 p-3 shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        borderBottom: '2.5px solid #f59e0b',
        color: '#78350f'
      }}
    >
      <div className="container-fluid px-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-start gap-3">
          <div
            className="p-2 rounded-3 text-white flex-shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#92400e' }}>
                {alertData.title}
              </span>
              <span
                className="badge bg-warning text-dark fw-bold text-uppercase"
                style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}
              >
                {alertData.type === 'MANUAL_REMINDER' ? 'Admin Reminder' : 'Wallet Alert'}
              </span>
              <span className="badge bg-danger-subtle text-danger font-monospace fw-bold" style={{ fontSize: '0.72rem' }}>
                Balance: {balStr}
              </span>
            </div>
            <div className="mt-1" style={{ fontSize: '0.8rem', color: '#92400e', maxWidth: '780px' }}>
              {alertData.message}
            </div>
            {alertData.createdAt && (
              <div className="d-flex align-items-center gap-1 mt-1 text-muted" style={{ fontSize: '0.68rem' }}>
                <Clock size={11} /> Sent: {new Date(alertData.createdAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {onRechargeClick && (
            <button
              type="button"
              className="btn btn-warning text-dark fw-bold px-3 py-1.5 rounded-pill d-flex align-items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.78rem' }}
              onClick={onRechargeClick}
            >
              <Wallet size={13} />
              Recharge Now
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Dismiss notice"
            onClick={handleDismiss}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
