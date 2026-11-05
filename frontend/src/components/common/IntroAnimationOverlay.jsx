import React, { useState, useEffect, useRef } from 'react';

/**
 * IntroAnimationOverlay
 * Shows the WOW Goa 3D animated logo reveal once per visitor session upon landing.
 * - Stored in sessionStorage ('wow_goa_intro_seen') so it only shows ONE time.
 * - Supports instant 'Skip Intro' button and Esc/click-to-dismiss.
 * - Smooth 600ms fade-out transition into the main website UI.
 * - Seamless background radial gradient matching video lighting.
 * - Audio toggle (muted by default to respect browser autoplay policy).
 * - Debug support: add `?intro=1` to URL to preview anytime.
 */
export default function IntroAnimationOverlay({ activeTab }) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Allow forced preview via URL parameter (e.g. localhost:5173/?intro=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1' || params.get('intro') === 'true') {
      return true;
    }

    // Do not show on administrative or partner portals
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
    } catch (e) {
      // Ignore storage errors in private browsing
    }
    setTimeout(() => {
      setVisible(false);
    }, 600);
  };

  useEffect(() => {
    if (!visible) return;

    // Safety fallback: if video stalls or takes too long, dismiss after 11 seconds
    const safetyTimeout = setTimeout(() => {
      handleDismiss();
    }, 11000);

    // Keyboard listener: Escape or Space to skip
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Autoplay attempt
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: muted play
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
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-600 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #f8faf7 0%, #ece8df 55%, #d1c7bd 100%)',
      }}
      title="Click anywhere to skip intro"
    >
      {/* Top Floating Controls */}
      <div
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm border border-black/10 backdrop-blur-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span>Unmute</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span>Sound On</span>
            </>
          )}
        </button>

        {/* Skip Intro Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-1.5 rounded-full bg-black/80 hover:bg-black text-white shadow-md backdrop-blur-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <span>Skip</span>
          <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Main Centered Video Container */}
      <div className="relative w-full max-w-4xl max-h-[85vh] aspect-video flex items-center justify-center p-2 sm:p-6">
        <video
          ref={videoRef}
          src="/wow-intro-animation.mp4"
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleDismiss}
          className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
          style={{
            filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.08))',
          }}
        />
      </div>

      {/* Bottom Progress Bar & Prompt */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex flex-col items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-xs sm:max-w-md h-1 bg-black/10 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-gray-500/90 font-medium tracking-wide">
          Tap anywhere or press <kbd className="px-1.5 py-0.5 bg-black/5 rounded text-[10px] font-mono">Esc</kbd> to explore Goa
        </p>
      </div>
    </div>
  );
}
