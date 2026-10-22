import React, { useState } from 'react';
import { Car, Clock, Phone, ArrowLeft, Download, ShieldCheck, QrCode } from 'lucide-react';
import CustomerCabsPage from './CustomerCabsPage';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';

export default function TaxiAppShell({
  onNavigateWebsite,
  currentUser,
  pickupLoc,
  dropLoc,
  pickupDate,
  pickupTime,
  cabServiceType,
  onBookCab,
  isNativeApp = false
}) {
  const [showApkModal, setShowApkModal] = useState(false);

  return (
    <div className="taxi-app-standalone-root" style={{
      minHeight: '100vh',
      width: '100%',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* ── DEDICATED TAXI APP HEADER ── */}
      <header style={{
        background: '#0B192C',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1020,
        padding: '10px 16px'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Brand Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0B192C',
              border: '1.5px solid #ff9f1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              flexShrink: 0
            }}>
              <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '7px' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  WOW GOA
                </span>
                <span style={{
                  background: '#ff9f1c',
                  color: '#0B192C',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Cabs
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                Official Goa Cab & Airport Transfer App
              </span>
            </div>
          </div>

          {/* Actions Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Download APK trigger (helpful for web users) */}
            {!isNativeApp && (
              <button
                type="button"
                onClick={() => setShowApkModal(true)}
                style={{
                  background: 'rgba(255, 159, 28, 0.15)',
                  border: '1px solid rgba(255, 159, 28, 0.4)',
                  color: '#ff9f1c',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span className="d-none d-sm-inline">Get Android APK</span>
                <span className="d-sm-none">APK</span>
              </button>
            )}

            {/* Helpline button */}
            <a
              href="tel:+919822144510"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '20px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="24/7 Cab Dispatch Helpline"
            >
              <Phone size={13} color="#10b981" />
              <span className="d-none d-md-inline">+91 98221 44510</span>
              <span className="d-md-none">Call</span>
            </a>

            {/* Back to Website (only visible on regular browser, not native app) */}
            {!isNativeApp && onNavigateWebsite && (
              <button
                type="button"
                onClick={onNavigateWebsite}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                className="d-none d-lg-flex"
                title="Go back to WOW GOA Holiday Website"
              >
                <span>Website</span>
                <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN TAXI APP CONTENT (FULL VIEWPORT, ZERO WEBSITE WRAPPERS) ── */}
      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <CustomerCabsPage 
          onBookCab={onBookCab}
          initialPickup={pickupLoc}
          initialDrop={dropLoc}
          initialDate={pickupDate}
          initialTime={pickupTime}
          initialServiceType={cabServiceType}
        />
      </main>

      {/* Modal specifically for downloading the Taxi APK */}
      <AppDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        isBookingPrompt={false}
      />
    </div>
  );
}
