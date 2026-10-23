import React, { useState } from 'react';
import CustomerCabsPage from './CustomerCabsPage';
import CabAuthScreen from '../../components/mobile/CabAuthScreen';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';

/**
 * TaxiAppShell: Full-Screen Dedicated Ola / Uber Cab Application Host
 * Behavior:
 * 1. Desktop & Web Browser (isNativeApp = false): Directly displays the authentic Ola/Uber cab experience we created. NO authentication modal / gate.
 * 2. Downloaded Mobile App (isNativeApp = true): Provides mobile sign-in / OTP authentication only inside the app.
 */
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

  // Authenticated Cab User State (Persisted in localStorage)
  const [cabUser, setCabUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wowgoa_cab_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.phone || parsed.email || parsed.name)) return parsed;
      }
      if (currentUser && (currentUser.phone || currentUser.email || currentUser.name)) {
        return currentUser;
      }
    } catch (e) {}
    return null;
  });

  // ONLY show auth screen if strictly inside the downloaded mobile app AND user is not authenticated.
  // On website (wowgoa.in/cabs, desktop or mobile web browser), NEVER show this auth gate.
  const [showAuthScreen, setShowAuthScreen] = useState(() => Boolean(isNativeApp && !cabUser));

  const handleAuthSuccess = (userObj) => {
    setCabUser(userObj);
    try {
      localStorage.setItem('wowgoa_cab_user', JSON.stringify(userObj));
      localStorage.setItem('currentUser', JSON.stringify({ ...userObj, role: 'customer' }));
      localStorage.setItem('wowgoa_rider_name', userObj.name || '');
      localStorage.setItem('wowgoa_rider_phone', userObj.phone || '');
    } catch (e) {}
    setShowAuthScreen(false);
  };

  const handleSkipAuth = () => {
    setShowAuthScreen(false);
  };

  return (
    <div className="taxi-app-standalone-root" style={{
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      maxHeight: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── STEP 1: AUTHENTICATION SCREEN ONLY FOR DOWNLOADED MOBILE APP ── */}
      {isNativeApp && showAuthScreen ? (
        <CabAuthScreen
          onAuthSuccess={handleAuthSuccess}
          onSkip={handleSkipAuth}
          isNativeApp={true}
        />
      ) : (
        /* ── STEP 2: AUTHENTIC CAB EXPERIENCE WE CREATED (WEBSITE & AUTHENTICATED APP) ── */
        <CustomerCabsPage 
          onBookCab={onBookCab}
          initialPickup={pickupLoc}
          initialDrop={dropLoc}
          initialDate={pickupDate}
          initialTime={pickupTime}
          initialServiceType={cabServiceType}
          isNativeApp={isNativeApp}
          onNavigateWebsite={onNavigateWebsite}
          onShowApkModal={() => setShowApkModal(true)}
          cabUser={cabUser}
        />
      )}

      {/* APK download modal if triggered */}
      <AppDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        isBookingPrompt={false}
      />
    </div>
  );
}
