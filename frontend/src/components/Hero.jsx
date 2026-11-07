import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, Calendar,
  Users, Search, ChevronRight, X, Sparkles, Navigation, 
  Compass, Car, Hotel, Check, Info, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { getTodayDateStr, getNextDayDateStr } from '../utils/dateUtils';
import { GOA_DESTINATIONS, TYPEWRITER_WORDS } from '../data/goaDestinations';

// ─── HIGH-PRECISION TYPEWRITER ENGINE ─────────────────────────────────────────
// Adds letter-by-letter, pauses for reading, and smoothly deletes back
function TypewriterWord({ targetWord, onWordDone }) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState('typing'); // 'typing' | 'paused' | 'deleting' | 'done'

  useEffect(() => {
    let charCount = 0;
    let currentPhase = 'typing';
    let lastTime = performance.now();
    let pauseEndTime = 0;
    let animId;

    setDisplayed('');
    setPhase('typing');

    const tick = (now) => {
      if (currentPhase === 'typing') {
        if (now - lastTime >= 65) {
          charCount++;
          setDisplayed(targetWord.slice(0, charCount));
          lastTime = now;

          if (charCount >= targetWord.length) {
            currentPhase = 'paused';
            setPhase('paused');
            pauseEndTime = now + 2400; // 2.4s comfortable pause to read
          }
        }
      } else if (currentPhase === 'paused') {
        if (now >= pauseEndTime) {
          currentPhase = 'deleting';
          setPhase('deleting');
          lastTime = now;
        }
      } else if (currentPhase === 'deleting') {
        if (now - lastTime >= 35) {
          charCount--;
          setDisplayed(targetWord.slice(0, charCount));
          lastTime = now;

          if (charCount <= 0) {
            currentPhase = 'done';
            setPhase('done');
            setTimeout(() => {
              if (onWordDone) onWordDone();
            }, 180);
            return;
          }
        }
      }

      if (currentPhase !== 'done') {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [targetWord, onWordDone]);

  const isTypingOrDeleting = phase === 'typing' || phase === 'deleting';

  return (
    <span className="hero-typewriter-wrapper">
      <span className="hero-typewriter-text">{displayed}</span>
      <span className={`hero-typewriter-cursor ${isTypingOrDeleting ? 'typing' : 'blinking'}`} />
    </span>
  );
}

// ─── MAIN LUXURY FULL-SCREEN HERO COMPONENT ──────────────────────────────────
export default function Hero({
  onNavigateTab,
  activeTab = 'selfdrive',
  pickupLoc = '',
  setPickupLoc,
  dropLoc = '',
  setDropLoc,
  pickupDate = '',
  setPickupDate,
  dropDate = '',
  setDropDate,
  hotelAdults = 2,
  setHotelAdults,
  hotelRooms = 1,
  setHotelRooms,
  handleSearchSubmit,
  setSearchTriggered,
  searchQuery = '',
  setSearchQuery
}) {
  const [destIdx, setDestIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Search Widget Internal State
  const [searchTab, setSearchTab] = useState('selfdrive'); // 'selfdrive' | 'cabs' | 'packages' | 'hotels' | 'activities'
  const [localDestination, setLocalDestination] = useState('Calangute & Baga Beach');
  const [localCheckIn, setLocalCheckIn] = useState(() => pickupDate || getTodayDateStr());
  const [localCheckOut, setLocalCheckOut] = useState(() => dropDate || getNextDayDateStr(3));
  const [localGuests, setLocalGuests] = useState(hotelAdults || 2);
  const [localVehicleType, setLocalVehicleType] = useState('All Self Drive (Cars & Thar)');
  const [transferPickup, setTransferPickup] = useState(pickupLoc || 'Manohar Intl Airport, Mopa (GOX)');
  const [transferDropoff, setTransferDropoff] = useState(dropLoc || 'Candolim & Calangute Beach');
  const [packageStyle, setPackageStyle] = useState('Beach & Nightlife');
  const [activityType, setActivityType] = useState('Scuba Diving & Grand Island Cruise');

  // Synchronize internal search tab with activeTab prop if provided
  useEffect(() => {
    if (activeTab === 'cabs' || activeTab === 'taxi') {
      setSearchTab('cabs');
    } else if (activeTab === 'packages' || activeTab === 'custom-trip') {
      setSearchTab('packages');
    } else if (activeTab === 'hotels') {
      setSearchTab('hotels');
    } else if (activeTab === 'activities') {
      setSearchTab('activities');
    } else if (activeTab === 'selfdrive' || activeTab === 'cars' || activeTab === 'bikes') {
      setSearchTab('selfdrive');
    }
  }, [activeTab]);

  const videoRef = useRef(null);
  const activeDest = GOA_DESTINATIONS[destIdx] || GOA_DESTINATIONS[0];

  // Video playback sync
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle typewriter word completion -> auto rotates to next destination
  const handleWordDone = useCallback(() => {
    setWordIdx((prev) => {
      const nextWord = (prev + 1) % TYPEWRITER_WORDS.length;
      const target = TYPEWRITER_WORDS[nextWord].toLowerCase();
      const foundIdx = GOA_DESTINATIONS.findIndex(
        (d) => d.name.toLowerCase() === target ||
               d.highlightWord?.toLowerCase() === target ||
               d.name.toLowerCase().includes(target)
      );
      if (foundIdx !== -1) {
        setDestIdx(foundIdx);
        setLocalDestination(`${GOA_DESTINATIONS[foundIdx].name}, Goa`);
      }
      return nextWord;
    });
  }, []);

  const handleSelectDest = (idx) => {
    setDestIdx(idx);
    const dest = GOA_DESTINATIONS[idx];
    if (dest) {
      setLocalDestination(`${dest.name}, Goa`);
    }
    const word = dest?.highlightWord || dest?.name || 'Baga Beach';
    const foundWordIdx = TYPEWRITER_WORDS.findIndex(
      (w) => w.toLowerCase() === word.toLowerCase() ||
             w.toLowerCase() === dest?.name.toLowerCase() ||
             dest?.name.toLowerCase().includes(w.toLowerCase())
    );
    if (foundWordIdx !== -1) {
      setWordIdx(foundWordIdx);
    }
  };

  const scrollToResultsSection = () => {
    const performScroll = () => {
      const el = document.getElementById('results-section');
      if (el) {
        const navHeight = 75;
        const bodyTop = document.body.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const targetY = Math.max(0, elTop - bodyTop - navHeight);
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    };

    performScroll();
    setTimeout(performScroll, 60);
    setTimeout(performScroll, 200);
    setTimeout(performScroll, 400);
  };

  const handleSearchClick = (e) => {
    if (e) e.preventDefault();

    if (searchTab === 'cabs') {
      if (setPickupLoc && transferPickup) setPickupLoc(transferPickup);
      if (setDropLoc && transferDropoff) setDropLoc(transferDropoff);
      if (setPickupDate && localCheckIn) setPickupDate(localCheckIn);
      if (setSearchTriggered) setSearchTriggered(true);
      if (onNavigateTab) onNavigateTab('cabs');
      return;
    }

    if (searchTab === 'packages') {
      if (setPickupDate && localCheckIn) setPickupDate(localCheckIn);
      if (setSearchQuery && localDestination) setSearchQuery(localDestination);
      if (setSearchTriggered) setSearchTriggered(true);
      if (onNavigateTab) onNavigateTab('packages');
      if (handleSearchSubmit) handleSearchSubmit('packages');
      scrollToResultsSection();
      return;
    }

    if (searchTab === 'hotels') {
      if (setPickupLoc && localDestination) setPickupLoc(localDestination);
      if (setSearchQuery && localDestination) setSearchQuery(localDestination);
      if (setPickupDate && localCheckIn) setPickupDate(localCheckIn);
      if (setDropDate && localCheckOut) setDropDate(localCheckOut);
      if (setSearchTriggered) setSearchTriggered(true);
      if (onNavigateTab) onNavigateTab('hotels');
      if (handleSearchSubmit) handleSearchSubmit('hotels');
      scrollToResultsSection();
      return;
    }

    if (searchTab === 'activities') {
      if (setSearchQuery && activityType) setSearchQuery(activityType);
      if (setPickupDate && localCheckIn) setPickupDate(localCheckIn);
      if (setSearchTriggered) setSearchTriggered(true);
      if (onNavigateTab) onNavigateTab('activities');
      if (handleSearchSubmit) handleSearchSubmit('activities');
      scrollToResultsSection();
      return;
    }

    // Default: Self Drive
    if (setPickupDate && localCheckIn) setPickupDate(localCheckIn);
    if (setDropDate && localCheckOut) setDropDate(localCheckOut);
    if (setPickupLoc && localDestination) setPickupLoc(localDestination);
    if (setDropLoc) setDropLoc('');
    if (setSearchTriggered) setSearchTriggered(true);

    if (localVehicleType && localVehicleType.includes('Bikes')) {
      if (onNavigateTab) onNavigateTab('bikes');
    } else {
      if (onNavigateTab) onNavigateTab('selfdrive');
      if (handleSearchSubmit) handleSearchSubmit('selfdrive');
    }
    scrollToResultsSection();
  };

  const currentWord = TYPEWRITER_WORDS[wordIdx] || 'Baga Beach';

  return (
    <div className="wow-luxury-hero-container" id="hero-banner">
      <style>{`
        /* ─── FONTS & BASE LAYOUT ───────────────────────────────── */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .wow-luxury-hero-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          background: #060B17;
          color: #ffffff;
          font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 80px 0 16px;
          max-height: 100vh;
          box-sizing: border-box;
        }

        @media (max-width: 991px) {
          .wow-luxury-hero-container {
            height: auto;
            min-height: 100vh;
            padding: 85px 0 35px;
            max-height: none;
          }
        }

        /* ─── VIDEO & IMAGE BACKGROUND LAYERS ───────────────────── */
        .hero-media-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-video-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.88;
          transition: opacity 1.2s ease;
        }

        .hero-bg-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.0);
          transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 12s cubic-bezier(0.1, 0, 0.2, 1);
          z-index: 1;
        }

        .hero-bg-photo.active {
          opacity: 1;
          transform: scale(1.06);
          z-index: 2;
        }

        /* Cinema Vignette & Gradients */
        .hero-vignette-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, 
            rgba(6, 11, 23, 0.35) 0%, 
            rgba(6, 11, 23, 0.05) 30%, 
            rgba(6, 11, 23, 0.35) 70%, 
            rgba(6, 11, 23, 0.85) 100%
          );
          z-index: 3;
          pointer-events: none;
        }

        .hero-side-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 25% 45%, rgba(6, 11, 23, 0.2) 0%, rgba(6, 11, 23, 0.75) 100%);
          z-index: 3;
          pointer-events: none;
        }

        /* ─── CONTENT GRID ──────────────────────────────────────── */
        .hero-inner-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 40px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        @media (max-width: 768px) {
          .hero-inner-container {
            padding: 0 18px;
          }
        }

        .hero-main-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          margin-top: 20px;
          gap: 28px;
        }

        @media (max-width: 991px) {
          .hero-main-row {
            flex-direction: column;
            align-items: stretch;
            margin-top: 10px;
            gap: 18px;
          }
        }

        /* ─── LEFT: TYPOGRAPHY & HEADING ────────────────────────── */
        .hero-left-column {
          max-width: 660px;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(245, 197, 24, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(245, 197, 24, 0.4);
          border-radius: 100px;
          padding: 4px 14px;
          color: #F5C518;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .hero-title-group {
          margin-bottom: 14px;
        }

        .hero-serif-discover {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-weight: 700;
          font-size: clamp(38px, 4.8vw, 68px);
          line-height: 1.1;
          letter-spacing: -0.2px;
          color: #ffffff;
          display: block;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
        }

        .hero-serif-destination {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700;
          font-size: clamp(42px, 5.2vw, 76px);
          line-height: 1.15;
          letter-spacing: 0.5px;
          display: block;
          background: linear-gradient(135deg, #FFF0B3 0%, #F5C518 40%, #E5A826 80%, #FF9F1C 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 22px rgba(229, 168, 38, 0.45));
        }

        /* Typewriter text styling */
        .hero-typewriter-wrapper {
          display: inline-flex;
          align-items: baseline;
          position: relative;
          min-width: clamp(260px, 22vw, 460px);
          white-space: nowrap;
        }

        .hero-typewriter-text {
          background: linear-gradient(135deg, #FFF0B3 0%, #F5C518 40%, #E5A826 80%, #FF9F1C 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          /* Gradient text is only painted inside the element's box; Playfair's
             descenders (g, p, y, j) hang below it and got cut off. Extend the
             box with padding and cancel it with negative margin so layout is unchanged. */
          display: inline-block;
          padding: 0.06em 0.08em 0.24em 0.02em;
          margin: -0.06em -0.08em -0.24em -0.02em;
        }

        .hero-typewriter-cursor {
          display: inline-block;
          width: 3px;
          height: 0.74em;
          background: #F5C518;
          margin-left: 6px;
          vertical-align: -0.02em;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(245, 197, 24, 0.8);
        }

        .hero-typewriter-cursor.blinking {
          animation: cursorBlink 0.9s infinite;
        }

        .hero-typewriter-cursor.typing {
          opacity: 1 !important;
          animation: none !important;
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .hero-subtitle {
          font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
          font-size: clamp(14px, 1.15vw, 15.5px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.92);
          max-width: 580px;
          margin-bottom: 22px;
          font-weight: 450;
          text-transform: none !important;
          letter-spacing: 0.15px !important;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
        }

        /* Watch destination preview pill */
        .hero-preview-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(11, 22, 44, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 100px;
          padding: 6px 20px 6px 6px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }

        .hero-preview-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(245, 197, 24, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(245, 197, 24, 0.3);
        }

        .hero-play-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F5C518, #E5A826);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #06101E;
          box-shadow: 0 4px 12px rgba(245, 197, 24, 0.5);
          transition: transform 0.3s ease;
        }

        .hero-preview-btn:hover .hero-play-icon-circle {
          transform: scale(1.1);
        }

        /* ─── RIGHT: DESTINATION CARDS VERTICAL STACK ───────────── */
        .hero-right-column {
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 5;
          max-height: 480px;
        }

        @media (max-width: 991px) {
          .hero-right-column {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 6px;
            width: 100%;
            scrollbar-width: none;
          }
          .hero-right-column::-webkit-scrollbar {
            display: none;
          }
        }

        .dest-card-item {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(11, 22, 44, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 4px 12px 4px 5px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          min-width: 175px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
        }

        .dest-card-item:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(245, 197, 24, 0.6);
          transform: translateX(-4px);
        }

        .dest-card-item.active {
          background: rgba(11, 22, 44, 0.94);
          border: 1.5px solid #F5C518;
          box-shadow: 0 6px 20px rgba(245, 197, 24, 0.35);
          transform: translateX(-6px);
        }

        @media (max-width: 991px) {
          .dest-card-item:hover, .dest-card-item.active {
            transform: translateY(-2px);
          }
        }

        .dest-card-thumb {
          width: 36px;
          height: 30px;
          border-radius: 6px;
          object-fit: cover;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          flex-shrink: 0;
        }

        .dest-card-name {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .dest-card-item.active .dest-card-name {
          color: #F5C518;
        }

        /* ─── CENTER BOTTOM: FLOATING FROSTED SEARCH CARD ───────── */
        .hero-search-wrapper {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto 10px;
          z-index: 12;
        }

        .hero-search-glass-card {
          background: rgba(9, 18, 36, 0.82);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 20px;
          padding: 8px 14px 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2) inset;
        }

        /* Tabs on top of the search bar */
        .hero-search-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 6px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .hero-search-tabs::-webkit-scrollbar {
          display: none;
        }

        .hero-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .hero-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .hero-tab-btn.active {
          background: linear-gradient(135deg, #F5C518, #E5A826);
          color: #06101E;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(245, 197, 24, 0.4);
        }

        /* Fields Row */
        .hero-search-fields-grid {
          display: grid;
          grid-template-columns: 2fr 1.3fr 1.3fr 1.4fr auto;
          align-items: center;
          gap: 10px;
        }

        @media (max-width: 991px) {
          .hero-search-fields-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .hero-search-cta-col {
            grid-column: span 2;
          }
        }

        @media (max-width: 576px) {
          .hero-search-fields-grid {
            grid-template-columns: 1fr;
          }
          .hero-search-cta-col {
            grid-column: span 1;
          }
        }

        .search-field-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .search-field-box:hover, .search-field-box:focus-within {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(245, 197, 24, 0.5);
        }

        .search-field-icon {
          color: #F5C518;
          flex-shrink: 0;
        }

        .search-field-content {
          flex: 1;
          min-width: 0;
        }

        .search-field-label {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 1px;
          display: block;
        }

        .search-field-input {
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          width: 100%;
          padding: 0;
          font-family: inherit;
        }

        .search-field-input::placeholder {
          color: rgba(255, 255, 255, 0.65);
        }

        .search-field-input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        /* Gold CTA button */
        .hero-search-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #F5C518 0%, #E5A826 100%);
          color: #06101E;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          box-shadow: 0 6px 18px rgba(245, 197, 24, 0.45);
          height: 100%;
        }

        .hero-search-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(245, 197, 24, 0.65);
          background: linear-gradient(135deg, #FFE066 0%, #F5C518 100%);
        }

        /* ─── BOTTOM CONTROLS ROW ────────────────────────────────── */
        .hero-bottom-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding-top: 6px;
        }

        /* Slide indicators dashes */
        .hero-slide-indicators {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hero-indicator-dash {
          width: 24px;
          height: 3px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.25);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .hero-indicator-dash.active {
          width: 40px;
          background: #F5C518;
          box-shadow: 0 0 10px rgba(245, 197, 24, 0.8);
        }

        /* Scroll to explore center */
        .hero-scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .hero-scroll-indicator:hover {
          color: #ffffff;
        }

        .hero-mouse-icon {
          width: 16px;
          height: 25px;
          border: 1.8px solid rgba(255, 255, 255, 0.7);
          border-radius: 10px;
          position: relative;
        }

        .hero-mouse-wheel {
          width: 2.5px;
          height: 5px;
          background: #F5C518;
          border-radius: 2px;
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          animation: mouseWheelScroll 1.6s infinite;
        }

        @keyframes mouseWheelScroll {
          0% { top: 4px; opacity: 1; }
          100% { top: 12px; opacity: 0; }
        }

        /* ─── VIDEO PREVIEW MODAL ────────────────────────────────── */
        .video-preview-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .video-preview-modal-dialog {
          position: relative;
          width: 100%;
          max-width: 920px;
          background: #091224;
          border: 1px solid rgba(245, 197, 24, 0.4);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85);
        }

        .video-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* ─── 1. BACKGROUND LAYERS: VIDEO + KEN BURNS PHOTOGRAPHY ─── */}
      <div className="hero-media-wrapper">
        {/* Background MP4 Video Loop (Goa Coast) */}
        <video
          ref={videoRef}
          className="hero-video-bg"
          src="/beach.mp4"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        />

        {/* Dynamic Ken Burns Destination Photos with smooth crossfade */}
        {GOA_DESTINATIONS.map((dest, idx) => {
          const isActive = destIdx === idx;
          // Only download the current photo, the next one (so it's ready in time)
          // and the previous one (still fading out) — not all 7 photos at page load.
          const n = GOA_DESTINATIONS.length;
          const isNear = isActive || idx === (destIdx + 1) % n || idx === (destIdx - 1 + n) % n;
          return (
            <div
              key={dest.id}
              className={`hero-bg-photo ${isActive ? 'active' : ''}`}
              style={isNear ? { backgroundImage: `url(${dest.bgImage})` } : undefined}
            />
          );
        })}

        {/* Cinematic Vignette & Lighting Overlays */}
        <div className="hero-vignette-overlay" />
        <div className="hero-side-gradient" />
      </div>

      {/* ─── 2. MAIN INNER HERO CONTENT ──────────────────── */}
      <div className="hero-inner-container">
        
        {/* Top Split: Title (Left) + Destination Cards (Right) */}
        <div className="hero-main-row">
          
          {/* Left Column: Heading + Typewriter + Preview button */}
          <div className="hero-left-column">
            <div className="hero-badge-pill">
              <Sparkles size={13} />
              <span>{activeDest.eyebrow}</span>
            </div>

            <div className="hero-title-group">
              <span className="hero-serif-discover">Discover</span>
              <span className="hero-serif-destination">
                <TypewriterWord 
                  targetWord={currentWord}
                  onWordDone={handleWordDone}
                />
              </span>
            </div>

            <p className="hero-subtitle">
              {activeDest.tagline}
            </p>
          </div>

        </div>

        {/* Center Bottom: Floating Frosted-Glass Search Card */}
        <div className="hero-search-wrapper">
          <div className="hero-search-glass-card">
            
                        {/* Service Tabs on Top */}
            <div className="hero-search-tabs">
              <button
                type="button"
                className={`hero-tab-btn ${searchTab === 'selfdrive' ? 'active' : ''}`}
                onClick={() => {
                  setSearchTab('selfdrive');
                  if (onNavigateTab) onNavigateTab('selfdrive');
                  scrollToResultsSection();
                }}
              >
                <Car size={14} />
                <span>Self Drive Holidays</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${searchTab === 'cabs' ? 'active' : ''}`}
                onClick={() => {
                  setSearchTab('cabs');
                  if (onNavigateTab) onNavigateTab('cabs');
                }}
              >
                <Navigation size={14} />
                <span>🚕 Taxis &amp; Cabs</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${searchTab === 'packages' ? 'active' : ''}`}
                onClick={() => {
                  setSearchTab('packages');
                  if (onNavigateTab) onNavigateTab('packages');
                  scrollToResultsSection();
                }}
              >
                <Compass size={14} />
                <span>Trip Packages</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${searchTab === 'hotels' ? 'active' : ''}`}
                onClick={() => {
                  setSearchTab('hotels');
                  if (onNavigateTab) onNavigateTab('hotels');
                  scrollToResultsSection();
                }}
              >
                <Hotel size={14} />
                <span>Hotels</span>
              </button>

              <button
                type="button"
                className={`hero-tab-btn ${searchTab === 'activities' ? 'active' : ''}`}
                onClick={() => {
                  setSearchTab('activities');
                  if (onNavigateTab) onNavigateTab('activities');
                  scrollToResultsSection();
                }}
              >
                <MapPin size={14} />
                <span>Sightseeing &amp; Activities</span>
              </button>
            </div>

            {/* Dynamic Search Fields based on Selected Tab */}
            <form onSubmit={handleSearchClick} className="hero-search-fields-grid">
              
              {/* TAB 1: SELF DRIVE (CARS & BIKES) */}
              {searchTab === 'selfdrive' && (
                <>
                  <div className="search-field-box">
                    <MapPin size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Delivery Hub / Pickup</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. Mopa Airport / Calangute / Panaji"
                        value={localDestination}
                        onChange={(e) => setLocalDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Pickup Date</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckIn}
                        onChange={(e) => setLocalCheckIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Drop-off Date</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckOut}
                        onChange={(e) => setLocalCheckOut(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Car size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Vehicle Type</span>
                      <select 
                        className="search-field-input"
                        style={{ cursor: 'pointer', background: 'transparent', color: '#fff' }}
                        value={localVehicleType}
                        onChange={(e) => setLocalVehicleType(e.target.value)}
                      >
                        <option value="All Self Drive" style={{ background: '#091224', color: '#fff' }}>All (Cars &amp; Thar)</option>
                        <option value="Thar & 4x4" style={{ background: '#091224', color: '#fff' }}>Open Thar &amp; 4x4 SUVs</option>
                        <option value="Automatic Cars" style={{ background: '#091224', color: '#fff' }}>Automatic Hatch / Sedans</option>
                        <option value="Bikes & Scooters" style={{ background: '#091224', color: '#fff' }}>Sports Motorbikes &amp; Scooters</option>
                      </select>
                    </div>
                  </div>

                  <div className="hero-search-cta-col">
                    <button type="submit" className="hero-search-submit-btn">
                      <Search size={15} />
                      <span>Find Vehicles</span>
                    </button>
                  </div>
                </>
              )}

              {/* TAB 2: TAXIS & AIRPORT TRANSFERS */}
              {searchTab === 'cabs' && (
                <>
                  <div className="search-field-box">
                    <MapPin size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Pickup Point</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. Manohar Intl Airport, Mopa (GOX)"
                        value={transferPickup}
                        onChange={(e) => setTransferPickup(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Navigation size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Drop Destination</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. Candolim / Calangute / Baga"
                        value={transferDropoff}
                        onChange={(e) => setTransferDropoff(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Transfer Date</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckIn}
                        onChange={(e) => setLocalCheckIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Car size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Service Type</span>
                      <div className="search-field-input" style={{ paddingTop: '2px', fontSize: '12.5px' }}>
                        Airport Chauffeur Transfer
                      </div>
                    </div>
                  </div>

                  <div className="hero-search-cta-col">
                    <button type="submit" className="hero-search-submit-btn">
                      <Car size={15} />
                      <span>Book Cab</span>
                    </button>
                  </div>
                </>
              )}

              {/* TAB 3: TRIP PACKAGES */}
              {searchTab === 'packages' && (
                <>
                  <div className="search-field-box">
                    <Compass size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Goa Region / Style</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. North Goa Beaches, South Goa Villas"
                        value={localDestination}
                        onChange={(e) => setLocalDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Travel Date</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckIn}
                        onChange={(e) => setLocalCheckIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Users size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Travelers</span>
                      <div className="search-field-input" style={{ paddingTop: '2px' }}>
                        {localGuests} Adults (Private Tour)
                      </div>
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Sparkles size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Package Style</span>
                      <select 
                        className="search-field-input"
                        style={{ cursor: 'pointer', background: 'transparent', color: '#fff' }}
                        value={packageStyle}
                        onChange={(e) => setPackageStyle(e.target.value)}
                      >
                        <option value="Beach & Nightlife" style={{ background: '#091224', color: '#fff' }}>Beach &amp; Nightlife Hub</option>
                        <option value="South Goa & Sunsets" style={{ background: '#091224', color: '#fff' }}>South Goa &amp; Betalbatim Sunsets</option>
                        <option value="Romantic Getaway" style={{ background: '#091224', color: '#fff' }}>Couples &amp; Honeymoon</option>
                        <option value="Adventure Safari" style={{ background: '#091224', color: '#fff' }}>Dudhsagar &amp; Waterfalls</option>
                      </select>
                    </div>
                  </div>

                  <div className="hero-search-cta-col">
                    <button type="submit" className="hero-search-submit-btn">
                      <Search size={15} />
                      <span>Explore Packages</span>
                    </button>
                  </div>
                </>
              )}

              {/* TAB 4: HOTELS */}
              {searchTab === 'hotels' && (
                <>
                  <div className="search-field-box">
                    <MapPin size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Where to stay?</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. Calangute, Candolim, Palolem"
                        value={localDestination}
                        onChange={(e) => setLocalDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Check-in</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckIn}
                        onChange={(e) => setLocalCheckIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Check-out</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckOut}
                        onChange={(e) => setLocalCheckOut(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Users size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Guests &amp; Rooms</span>
                      <div className="search-field-input" style={{ paddingTop: '2px' }}>
                        {localGuests} Adults • {hotelRooms} Room
                      </div>
                    </div>
                  </div>

                  <div className="hero-search-cta-col">
                    <button type="submit" className="hero-search-submit-btn">
                      <Search size={15} />
                      <span>Search Hotels</span>
                    </button>
                  </div>
                </>
              )}

              {/* TAB 5: SIGHTSEEING & ACTIVITIES */}
              {searchTab === 'activities' && (
                <>
                  <div className="search-field-box">
                    <Compass size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Experience</span>
                      <input 
                        type="text"
                        className="search-field-input"
                        placeholder="e.g. Grand Island Scuba, Dudhsagar Safari"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Calendar size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Activity Date</span>
                      <input 
                        type="date"
                        className="search-field-input"
                        value={localCheckIn}
                        onChange={(e) => setLocalCheckIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Users size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Participants</span>
                      <div className="search-field-input" style={{ paddingTop: '2px' }}>
                        {localGuests} Travelers
                      </div>
                    </div>
                  </div>

                  <div className="search-field-box">
                    <Sparkles size={17} className="search-field-icon" />
                    <div className="search-field-content">
                      <span className="search-field-label">Category</span>
                      <div className="search-field-input" style={{ paddingTop: '2px' }}>
                        Water Sports &amp; Island Cruise
                      </div>
                    </div>
                  </div>

                  <div className="hero-search-cta-col">
                    <button type="submit" className="hero-search-submit-btn">
                      <Search size={15} />
                      <span>Search Activities</span>
                    </button>
                  </div>
                </>
              )}

            </form>

          </div>
        </div>

        {/* ─── 3. BOTTOM CONTROLS: DASHES, SCROLL MOUSE ─── */}
        <div className="hero-bottom-controls-row">
          
          {/* Progress Indicators (Left) */}
          <div className="hero-slide-indicators">
            {GOA_DESTINATIONS.map((_, i) => (
              <div 
                key={i} 
                className={`hero-indicator-dash ${destIdx === i ? 'active' : ''}`}
                onClick={() => handleSelectDest(i)}
                title={GOA_DESTINATIONS[i]?.name}
              />
            ))}
          </div>

          {/* Mouse Scroll Indicator (Center) */}
          <div 
            className="hero-scroll-indicator"
            onClick={() => {
              scrollToResultsSection();
            }}
          >
            <div className="hero-mouse-icon">
              <div className="hero-mouse-wheel" />
            </div>
            <span>Scroll to Explore</span>
          </div>

          {/* Empty spacer (Right): keeps the scroll indicator in its position */}
          <div aria-hidden="true" style={{ width: '72px' }} />

        </div>

      </div>

      {/* ─── 4. VIDEO PREVIEW MODAL ──────────────────────────────── */}
      {showVideoModal && (
        <div 
          className="video-preview-modal-backdrop"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="video-preview-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <div className="d-flex align-items-center gap-2">
                <Sparkles size={17} style={{ color: '#F5C518' }} />
                <span className="fw-bold text-white" style={{ fontSize: '14.5px' }}>
                  WOW GOA • Destination Cinema Preview ({activeDest.name})
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-dark rounded-circle p-1"
                onClick={() => setShowVideoModal(false)}
              >
                <X size={17} />
              </button>
            </div>
            
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <video 
                src="/beach.mp4" 
                controls 
                autoPlay 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
