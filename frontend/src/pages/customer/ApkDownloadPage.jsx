import React, { useState, useEffect } from 'react';
import { 
  Download, Smartphone, ShieldCheck, CheckCircle2, ArrowRight, 
  ExternalLink, QrCode, AlertCircle, Sparkles, Car, PhoneCall, Copy, Check 
} from 'lucide-react';

export default function ApkDownloadPage({ onNavigateHome, onLaunchWebCabs }) {
  const [copied, setCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocalhost 
    ? `http://192.168.1.23:${(typeof window !== 'undefined' && window.location.port) || '5173'}` 
    : (typeof window !== 'undefined' ? window.location.origin : 'https://wowgoa.in');
  
  const apkUrl = `${baseUrl}/download/wowgoa-cabs.apk`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(apkUrl)}`;

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'wowgoa-cabs.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(apkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0B192C 0%, #1E3E62 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      {/* Container */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#ffffff',
          padding: '28px 24px 22px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: '#0B192C',
            border: '2px solid #ff9f1c',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            padding: '6px'
          }}>
            <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 159, 28, 0.2)', border: '1px solid #ff9f1c', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: '#ff9f1c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Sparkles size={13} /> Official Android App
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', color: '#ffffff', letterSpacing: '-0.02em' }}>
            WOW GOA Cabs
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
            Instant Airport Transfers & Verified Chauffeur Rides in Goa
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '14px', fontSize: '11.5px', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#10b981" /> 100% Verified APK
            </span>
            <span>•</span>
            <span>Version 1.2.0</span>
            <span>•</span>
            <span>Zero Surge Guarantee</span>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Download size={22} strokeWidth={2.5} />
            <span>Download Taxi APK (Direct)</span>
          </button>

          {downloadStarted && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '12px 14px', fontSize: '12.5px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Download initiated! Check your notifications bar.</span>
            </div>
          )}

          {/* QR Code Section (for desktop viewers to scan with mobile camera) */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '20px',
            padding: '18px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', display: 'inline-flex' }}>
              <img src={qrUrl} alt="Scan to Download APK" style={{ width: '160px', height: '160px', display: 'block', borderRadius: '8px' }} />
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                📸 Scan with Mobile Camera
              </div>
              <p style={{ margin: '3px 0 6px', fontSize: '12px', color: '#64748b' }}>
                Point your phone camera here to download the taxi APK directly:
              </p>
              <code style={{ background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#0f172a', fontWeight: 700, wordBreak: 'break-all' }}>
                {apkUrl}
              </code>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '12px',
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

          {/* Simple 3-Step Install Guide */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Easy 3-Step Installation:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0B192C', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <span>Tap <strong>Download</strong> (if prompted, choose <em>"Download anyway"</em>).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0B192C', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                <span>Open <strong>wowgoa-cabs.apk</strong> from your downloads.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0B192C', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                <span>Tap <strong>Install</strong> & enjoy seamless rides across Goa!</span>
              </div>
            </div>
          </div>

          {/* Fallback buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onLaunchWebCabs}
              style={{
                background: '#0B192C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Car size={16} />
              <span>Book Online (Web Taxi Portal)</span>
              <ArrowRight size={15} />
            </button>

            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                ← Back to WOW GOA Holiday Website
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
