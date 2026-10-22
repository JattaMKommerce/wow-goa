import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export default function MobileInstallBanner({ activeTab }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode (already installed & running as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user recently dismissed (within 24 hours)
    const lastDismissed = localStorage.getItem('wowgoa_pwa_dismissed');
    if (lastDismissed && Date.now() - Number(lastDismissed) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Capture native Android install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    // Direct APK download for Android users or anyone requesting the taxi app
    if (!isIOS) {
      const link = document.createElement('a');
      link.href = '/download/wowgoa-cabs.apk';
      link.download = 'wowgoa-cabs.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      window.location.href = '/download';
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('wowgoa_pwa_dismissed', String(Date.now()));
    } catch (e) {}
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* Floating Slim Banner on Mobile */}
      <div 
        className="d-md-none animate-fade-in-up" 
        style={{
          position: 'fixed',
          top: '60px',
          left: '12px',
          right: '12px',
          zIndex: 1030,
          background: 'linear-gradient(135deg, rgba(11, 25, 44, 0.96) 0%, rgba(30, 62, 98, 0.94) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 159, 28, 0.3)',
          padding: '10px 14px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
          <img 
            src="/wowgoa-logo.png" 
            alt="WOW GOA" 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              objectFit: 'cover',
              background: '#0B192C',
              padding: '2px',
              border: '1.5px solid rgba(255, 159, 28, 0.4)',
              flexShrink: 0
            }} 
          />
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-1.5">
              <span className="fw-bold text-white text-truncate" style={{ fontSize: '13px' }}>
                {(activeTab === 'cabs' || activeTab === 'taxi') ? 'WOW GOA Cabs App' : 'WOW GOA App'}
              </span>
              <span className="badge bg-warning text-dark px-1.5 py-0.5 rounded-pill" style={{ fontSize: '8px', fontWeight: 800 }}>
                FREE
              </span>
            </div>
            <p className="text-white-50 mb-0 text-truncate" style={{ fontSize: '10px' }}>
              {(activeTab === 'cabs' || activeTab === 'taxi') ? 'Instant Airport Cabs & Live Chauffeur GPS' : 'Instant Cabs & Self Drive on your phone'}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-warning btn-sm fw-bold d-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill text-dark shadow-sm"
            style={{ fontSize: '11px', letterSpacing: '0.2px' }}
            onClick={handleInstallClick}
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Install App</span>
          </button>
          <button
            type="button"
            className="btn btn-link text-white-50 p-1 text-decoration-none"
            aria-label="Close"
            onClick={handleDismiss}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div 
          className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 25, 44, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="bg-white rounded-4 p-4 text-dark shadow-lg animate-fade-in-up"
            style={{ maxWidth: '340px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <img 
                src="/wowgoa-logo.png" 
                alt="WOW GOA" 
                style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '8px' }} 
              />
              <h5 className="fw-extrabold mb-1">Install on iPhone</h5>
              <p className="text-muted small mb-0">Add WOW GOA to your Home Screen in 2 quick taps:</p>
            </div>

            <div className="d-flex flex-column gap-2.5 mb-4 bg-light p-3 rounded-3 small">
              <div className="d-flex align-items-center gap-2.5">
                <span className="badge bg-primary rounded-circle p-1.5" style={{ width: '22px', height: '22px' }}>1</span>
                <span>Tap the <strong>Share</strong> button <Share size={15} className="text-primary d-inline mx-1" /> at the bottom of Safari</span>
              </div>
              <div className="d-flex align-items-center gap-2.5">
                <span className="badge bg-primary rounded-circle p-1.5" style={{ width: '22px', height: '22px' }}>2</span>
                <span>Scroll down and tap <strong>'Add to Home Screen'</strong> <PlusSquare size={15} className="text-success d-inline mx-1" /></span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-warning w-100 fw-bold py-2 rounded-3 text-dark"
              onClick={() => setShowIOSModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
