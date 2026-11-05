import React, { useState, useEffect, useRef } from 'react';

/**
 * IntroAnimationOverlay
 * Pure CSS styled (no Tailwind dependency) to guarantee flawless fullscreen layout,
 * proper button positioning, responsive video scaling, and session persistence.
 */
export default function IntroAnimationOverlay({ activeTab }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Check URL parameter for forced preview: ?intro=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1' || params.get('intro') === 'true') {
      return true;
    }

    // Never show on administrative or partner portals
    const path = window.location.pathname.toLowerCase();
    if (
      path.includes('/admin') ||
      path.includes('/vendor') ||
      path.includes('/driver') ||
      path.includes('/b2b') ||
      activeTab === 'admin' ||
      activeTab === 'vendor' ||
      activeTab === 'driver' ||
      activeTab === 'b2b'
    ) {
      return false;
    }

    // Show only once per browser session
    try {
      const hasSeen = sessionStorage.getItem('wow_goa_intro_seen');
      return !hasSeen;
    } catch (e) {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const handleDismiss = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    try {
      sessionStorage.setItem('wow_goa_intro_seen', 'true');
    } catch (e) {}
    setTimeout(() => {
      setVisible(false);
    }, 600);
  };

  useEffect(() => {
    if (!visible) return;

    // Auto-dismiss safety fallback
    const safetyTimeout = setTimeout(() => {
      handleDismiss();
    }, 11000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }

    return () => {
      clearTimeout(safetyTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    }
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #f8faf7 0%, #ece8df 55%, #d1c7bd 100%)',
        cursor: 'pointer',
        userSelect: 'none',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
        transition: 'opacity 0.6s ease-out',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      title="Click anywhere to skip intro"
    >
      {/* Top Floating Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: '#1f2937',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Unmute</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#059669">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span style={{ color: '#059669' }}>Sound On</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderRadius: '9999px',
            backgroundColor: '#111827',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s',
          }}
        >
          <span>Skip</span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Centered Video Display */}
      <div
        style={{
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          src="/wow-intro-animation.mp4"
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleDismiss}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
            display: 'block',
          }}
        />
      </div>

      {/* Bottom Progress Bar & Prompt */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '240px',
            maxWidth: '80%',
            height: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f59e0b, #ea580c, #10b981)',
              borderRadius: '9999px',
              transition: 'width 0.15s ease-out',
            }}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Tap anywhere or press <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>Esc</kbd> to explore Goa
        </p>
      </div>
    </div>
  );
}
