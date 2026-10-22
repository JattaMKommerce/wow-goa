import React, { useState } from 'react';
import CustomerCabsPage from './CustomerCabsPage';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';

/**
 * TaxiAppShell: Full-Screen Dedicated Ola / Uber Cab Application Host
 * Provides zero-website-overhead native app container for APK & mobile cab bookings.
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
      />

      {/* APK download modal if triggered */}
      <AppDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        isBookingPrompt={false}
      />
    </div>
  );
}
