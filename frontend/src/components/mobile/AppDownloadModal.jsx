import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Smartphone, Download, QrCode, ShieldCheck, CheckCircle2, 
  Car, Sparkles, ExternalLink, ArrowRight, Copy, Check 
} from 'lucide-react';

export default function AppDownloadModal({ 
  isOpen, 
  onClose, 
  onLaunchChauffeur, 
  isBookingPrompt = false, 
  onContinueWebBooking = null 
}) {
  const [activeSubTab, setActiveSubTab] = useState('apk'); // 'apk' | 'web' | 'driver'
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocalhost 
    ? `http://192.168.1.23:${(typeof window !== 'undefined' && window.location.port) || '5173'}` 
    : (typeof window !== 'undefined' ? window.location.origin : 'https://wowgoa.in');
  
  const apkDownloadUrl = `${baseUrl}/download/wowgoa-cabs.apk`;
  const webAppUrl = `${baseUrl}/cabs`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(apkDownloadUrl)}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(apkDownloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleDirectDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'wowgoa-cabs.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(11, 25, 44, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
          margin: 'auto',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/wowgoa-logo.png" 
              alt="WOW GOA" 
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0B192C', padding: '2px', border: '1.5px solid #ff9f1c' }} 
            />
            <div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#ff9f1c', letterSpacing: '0.06em' }}>
                OFFICIAL ANDROID APP
              </span>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                Download WOW GOA Cabs App
              </h4>
            </div>
          </div>

          <button 
            type="button" 
            aria-label="Close modal"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '4px 8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('apk')}
            style={{
              flex: 1,
              padding: '9px 6px',
              border: 'none',
              background: activeSubTab === 'apk' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'apk' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '10px',
              boxShadow: activeSubTab === 'apk' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            🤖 Android APK (QR)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('web')}
            style={{
              flex: 1,
              padding: '9px 6px',
              border: 'none',
              background: activeSubTab === 'web' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'web' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '10px',
              boxShadow: activeSubTab === 'web' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            🌐 Web App Link
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('driver')}
            style={{
              flex: 1,
              padding: '9px 6px',
              border: 'none',
              background: activeSubTab === 'driver' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'driver' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '10px',
              boxShadow: activeSubTab === 'driver' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            👨‍✈️ Chauffeur App
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* TAB 1: STANDALONE ANDROID APK WITH DIRECT QR CODE */}
          {activeSubTab === 'apk' && (
            <>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <ShieldCheck size={20} color="#16a34a" />
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                  Dedicated Cab App: Strictly for taxi booking with live driver GPS & OTP verification. Zero website clutter.
                </div>
              </div>

              {/* Centered, Clean QR Code Scanner Box pointing to direct APK download */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  display: 'inline-flex'
                }}>
                  <img 
                    src={qrUrl} 
                    alt="Scan to Download Taxi APK" 
                    style={{ width: '160px', height: '160px', display: 'block', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                    📸 Scan with Mobile Camera
                  </div>
                  <p style={{ margin: '2px 0 4px', fontSize: '0.78rem', color: '#64748b' }}>
                    Point phone camera here to start instant APK download:
                  </p>
                  <code style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#0f172a', fontWeight: 700, wordBreak: 'break-all' }}>
                    {apkDownloadUrl}
                  </code>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Direct 1-Tap Download Button */}
                  <button
                    type="button"
                    onClick={handleDirectDownload}
                    style={{
                      background: '#16a34a',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <Download size={14} />
                    <span>Download APK Directly</span>
                  </button>

                  {/* Copy Link Helper */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    <span>{copied ? 'Link Copied!' : 'Copy APK Link'}</span>
                  </button>
                </div>

                {downloadStarted && (
                  <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                    ✅ Download started! Open wowgoa-cabs.apk to install.
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#334155' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>How to install on phone:</div>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li>Scan QR code or click <strong>Download APK Directly</strong>.</li>
                  <li>When prompted, tap <em>"Download anyway"</em>.</li>
                  <li>Open <strong>wowgoa-cabs.apk</strong> and tap <em>"Install"</em>.</li>
                </ol>
              </div>

              {/* If triggered during booking: give user 1-click option to continue on web! */}
              {isBookingPrompt && onContinueWebBooking && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={onContinueWebBooking}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
                    }}
                  >
                    <span>💻 Continue Booking on Web (Laptop / Desktop)</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: WEB TAXI APP */}
          {activeSubTab === 'web' && (
            <>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '12px 14px', fontSize: '0.82rem', color: '#1e40af' }}>
                You can also book directly in your browser without downloading the APK:
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <code style={{ background: '#e2e8f0', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>
                  {webAppUrl}
                </code>

                <a
                  href="/cabs"
                  onClick={(e) => {
                    if (onContinueWebBooking) {
                      e.preventDefault();
                      onContinueWebBooking();
                    }
                  }}
                  style={{
                    background: '#0B192C',
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    padding: '11px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Car size={16} />
                  <span>Open Web Taxi App Now</span>
                </a>
              </div>
            </>
          )}

          {/* TAB 3: CHAUFFEUR COMPANION */}
          {activeSubTab === 'driver' && (
            <>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Car size={20} color="#d97706" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#92400e' }}>Chauffeur Companion Portal</div>
                  <div style={{ fontSize: '0.76rem', color: '#b45309' }}>
                    Driver app with duty alert chimes, 4-digit guest OTP verification, running meter & UPI QR code.
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px 14px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Chauffeur Quick Login:</div>
                <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Driver Name: <strong>Suresh Naik</strong></span>
                  <span>PIN: <strong>1234</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLaunchChauffeur) onLaunchChauffeur();
                }}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={16} />
                <span>Launch Chauffeur Companion Now</span>
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
