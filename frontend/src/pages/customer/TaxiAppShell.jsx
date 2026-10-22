import React, { useState } from 'react';
import CustomerCabsPage from './CustomerCabsPage';
import CabAuthScreen from '../../components/mobile/CabAuthScreen';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';

/**
 * TaxiAppShell: Full-Screen Dedicated Ola / Uber Cab Application Host
 * Flow:
 * 1. If user is not authenticated: Show authentic Mobile Auth Page (Google Sign-In & Phone Number + OTP).
 * 2. After authentication: Show the clean, spacious, uncongested Cab Booking Page.
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

  // Controls whether the authentication screen or cab booking screen is shown
  const [showAuthScreen, setShowAuthScreen] = useState(() => !cabUser);

  // Auth Success Handler
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

  // Skip / Guest Mode
  const handleSkipAuth = () => {
    setShowAuthScreen(false);
  };

  // Logout / Switch Account Handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('wowgoa_cab_user');
    } catch (e) {}
    setCabUser(null);
    setShowAuthScreen(true);
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
      {/* ── STEP 1: AUTHENTICATION SCREEN (Google Sign-In & Phone Number + OTP) ── */}
      {showAuthScreen ? (
        <CabAuthScreen
          onAuthSuccess={handleAuthSuccess}
          onSkip={handleSkipAuth}
          isNativeApp={isNativeApp}
        />
      ) : (
        /* ── STEP 2: CLEAN, SPACIOUS, UNCONGESTED CAB BOOKING PAGE ── */
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
          onOpenAuth={() => setShowAuthScreen(true)}
          onLogout={handleLogout}
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
