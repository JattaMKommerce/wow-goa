import React, { useState, useEffect, useCallback } from 'react';
import CustomerCabsPage from './CustomerCabsPage';
import CabAuthScreen from '../../components/mobile/CabAuthScreen';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';
import AppUpdateModal from '../../components/mobile/AppUpdateModal';

// Current client bundle metadata
export const CURRENT_CLIENT_BUNDLE_ID = 'wowgoa_cabs_20261022_v253';
export const CURRENT_CLIENT_VERSION = '2.5.3';
export const CURRENT_CLIENT_VERSION_CODE = 253;

/**
 * TaxiAppShell: Full-Screen Dedicated Ola / Uber Cab Application Host
 * Features:
 * 1. Automatic in-app update detection & notification (checks app-version.json)
 * 2. If user is not authenticated: Show Mobile Auth Page (Google Sign-In & Phone Number + OTP).
 * 3. After authentication: Show the clean, spacious, uncongested Cab Booking Page.
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

  // In-App Update States
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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

  // Check for updates against server version manifest
  const checkForAppUpdate = useCallback(async (manual = false) => {
    try {
      const res = await fetch(`/app-version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const manifest = await res.json();
        const storedBundle = localStorage.getItem('wowgoa_installed_bundle_id');

        // Check if server version is newer than running client or stored bundle
        const isBundleNewer = manifest.bundleId && (manifest.bundleId !== CURRENT_CLIENT_BUNDLE_ID || (storedBundle && manifest.bundleId !== storedBundle));
        const isCodeHigher = manifest.versionCode && manifest.versionCode > CURRENT_CLIENT_VERSION_CODE;

        if (isBundleNewer || isCodeHigher) {
          setUpdateInfo(manifest);
          setShowUpdateModal(true);
          return true;
        } else if (manual) {
          return false;
        }
      }
    } catch (e) {
      console.warn('Update check error:', e);
    }
    return false;
  }, []);

  // Background update check on launch and every 3 minutes
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      checkForAppUpdate(false);
    }, 2000);

    const intervalTimer = setInterval(() => {
      checkForAppUpdate(false);
    }, 180000); // Check every 3 mins

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [checkForAppUpdate]);

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
          onCheckForUpdates={checkForAppUpdate}
          currentAppVersion={CURRENT_CLIENT_VERSION}
        />
      )}

      {/* In-App Automatic Update Notification Modal */}
      <AppUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        updateInfo={updateInfo}
        isNativeApp={isNativeApp}
      />

      {/* APK download modal if triggered manually */}
      <AppDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        isBookingPrompt={false}
      />
    </div>
  );
}
