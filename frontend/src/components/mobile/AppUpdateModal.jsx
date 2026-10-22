import React, { useState } from 'react';
import { Download, RefreshCw, Sparkles, CheckCircle2, X, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * AppUpdateModal: In-App Automatic Update Prompt
 * Inspired by Google Play In-App Updates and Ola/Uber app update prompts.
 * Alerts installed users when changes are deployed and applies updates seamlessly.
 */
export default function AppUpdateModal({
  isOpen,
  onClose,
  updateInfo,
  isNativeApp = false
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleApplyUpdate = async () => {
    setIsUpdating(true);

    try {
      // 1. Clear Service Worker caches if supported
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }

      // 2. Unregister old service workers to guarantee instant reload
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      }

      // 3. Update local stored version stamp
      if (updateInfo.bundleId) {
        localStorage.setItem('wowgoa_installed_bundle_id', updateInfo.bundleId);
      }
      if (updateInfo.version) {
        localStorage.setItem('wowgoa_installed_version', updateInfo.version);
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }

    // 4. Only trigger APK download if server specifically flags a major native binary update
    if (isNativeApp && updateInfo.requiresNativeApkUpdate && updateInfo.downloadUrl) {
      setTimeout(() => {
        window.location.href = updateInfo.downloadUrl;
      }, 500);
      return;
    }

    // 5. Instant Over-The-Air Update: Reload app with cache bust query
    setTimeout(() => {
      window.location.href = window.location.pathname + `?mode=app&v=${Date.now()}`;
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 25, 44, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '420px',
        width: '100%',
        padding: '24px 20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        animation: 'fadeInUp 0.3s ease'
      }}>
        {/* Dismiss button if not mandatory */}
        {!updateInfo.forceUpdate && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Header Icon & Version Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0B192C 0%, #1e3a5f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 14px rgba(11, 25, 44, 0.25)',
            flexShrink: 0
          }}>
            🚀
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                Update Available!
              </span>
              <span style={{
                background: '#ff9f1c',
                color: '#0B192C',
                fontSize: '10px',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                v{updateInfo.version || '2.5.0'}
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              WOW GOA Cabs · Official App
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 14px', lineHeight: 1.45 }}>
          {updateInfo.description || 'A new update is ready with our new authentication system and enhanced cab booking experience.'}
        </p>

        {/* Changelog Highlights */}
        {updateInfo.changelog && updateInfo.changelog.length > 0 && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '18px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              What's New in this Update:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {updateInfo.changelog.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#1e293b' }}>
                  <CheckCircle2 size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            style={{
              width: '100%',
              background: '#0B192C',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px',
              fontSize: '14.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(11, 25, 44, 0.25)',
              cursor: isUpdating ? 'wait' : 'pointer'
            }}
          >
            {isUpdating ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                <span>Applying Updates...</span>
              </>
            ) : (
              <>
                <span>Update Now (Instant)</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {!updateInfo.forceUpdate && (
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                padding: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Update Later
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '12px', color: '#94a3b8', fontSize: '10.5px' }}>
          <ShieldCheck size={12} color="#10b981" />
          <span>Automatic Over-the-Air Update System</span>
        </div>
      </div>
    </div>
  );
}
