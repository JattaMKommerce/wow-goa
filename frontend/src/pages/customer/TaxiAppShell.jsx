import React, { useState, useEffect } from 'react';
import CustomerCabsPage from './CustomerCabsPage';
import CabAuthScreen from '../../components/mobile/CabAuthScreen';
import AppDownloadModal from '../../components/mobile/AppDownloadModal';
import ChauffeurPortal from '../taxi/ChauffeurPortal';
import { AuthProvider } from '../../context/TaxiAuthContext';
import SelfDriveCategoryShowcase from '../../components/widgets/SelfDriveCategoryShowcase';
import { fetchCars, fetchBikes } from '../../services/api';
import { 
  Car, Compass, LogOut, User, Sparkles, ShieldCheck, 
  ArrowRight, X, Phone, CheckCircle2 
} from 'lucide-react';

/**
 * TaxiAppShell: Full-Screen Dedicated Mobile APK Application Host
 * Behavior:
 * 1. Downloaded Mobile App (isNativeApp = true): Provides mobile sign-in / OTP authentication.
 * 2. On Authentication:
 *    - Driver Partner: routes directly to ChauffeurPortal with live duty and trips.
 *    - Passenger / Customer (e.g. Jenny): shows the Service Choice screen to choose between:
 *        * "Self Drive" (Cars & Scooters rental)
 *        * "Book Taxi" (Chauffeur-driven cab booking)
 *    - Customer can also toggle anytime between [ 🚖 Book Taxi ] and [ 🚗 Self Drive ] in the top pill.
 * 3. Desktop & Web Browser (isNativeApp = false): Displays cab experience without blocking gates.
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
  const [showAuthScreen, setShowAuthScreen] = useState(() => Boolean(isNativeApp && !cabUser));

  // Service Choice Modal (Shown to customer right after login per user flow)
  const [showServiceChoiceModal, setShowServiceChoiceModal] = useState(false);

  // Active APK Feature Mode: 'cabs' (Taxi Booking) | 'selfdrive' (Self Drive Vehicles)
  const [apkMode, setApkMode] = useState('cabs');

  // Self Drive Inventory
  const [carsList, setCarsList] = useState([]);
  const [bikesList, setBikesList] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Load live cars & bikes when switching to self-drive
  useEffect(() => {
    let isMounted = true;
    if (apkMode === 'selfdrive' && carsList.length === 0) {
      setVehiclesLoading(true);
      Promise.all([
        fetchCars().catch(() => []),
        fetchBikes().catch(() => [])
      ]).then(([cars, bikes]) => {
        if (!isMounted) return;
        setCarsList(Array.isArray(cars) ? cars : []);
        setBikesList(Array.isArray(bikes) ? bikes : []);
      }).finally(() => {
        if (isMounted) setVehiclesLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, [apkMode, carsList.length]);

  const handleAuthSuccess = (userObj) => {
    setCabUser(userObj);
    try {
      localStorage.setItem('wowgoa_cab_user', JSON.stringify(userObj));
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      localStorage.setItem('wowgoa_rider_name', userObj.name || '');
      localStorage.setItem('wowgoa_rider_phone', userObj.phone || '');
    } catch (e) {}
    setShowAuthScreen(false);

    // If customer just logged in (e.g., Jenny), open service choice modal
    if (userObj.role === 'customer') {
      setShowServiceChoiceModal(true);
    }
  };

  const handleSkipAuth = () => {
    setShowAuthScreen(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('wowgoa_cab_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('active_role');
      localStorage.removeItem('access_token');
    } catch (e) {}
    setCabUser(null);
    setShowAuthScreen(true);
    setShowServiceChoiceModal(false);
  };

  const isDriver = cabUser?.role === 'chauffeur' || cabUser?.role === 'driver';

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

      {/* ── STEP 1: AUTHENTICATION SCREEN FOR DOWNLOADED MOBILE APK ── */}
      {isNativeApp && showAuthScreen ? (
        <CabAuthScreen
          onAuthSuccess={handleAuthSuccess}
          onSkip={handleSkipAuth}
          isNativeApp={true}
        />
      ) : isDriver ? (
        /* ── STEP 2: DRIVER PARTNER EXPERIENCE (CHAUFFEUR PORTAL) ── */
        <AuthProvider>
          <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Driver Header */}
            <div style={{
              background: '#0B192C',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#10B981',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.4px'
                }}>
                  DUTY LIVE
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 800 }}>
                  {cabUser.name || 'Goa Chauffeur'}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  ({cabUser.cabNumber || 'GA-03-Z-8821'})
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={13} />
                <span>Switch / Exit</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ChauffeurPortal
                currentUser={cabUser}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </AuthProvider>
      ) : (
        /* ── STEP 3: PASSENGER EXPERIENCE (JENNY) — CABS OR SELF DRIVE ── */
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Top APK Navigation Bar with Mode Switcher & Profile */}
          <div style={{
            background: '#0B192C',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            flexShrink: 0,
            zIndex: 100
          }}>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src="/wowgoa-logo.png" 
                alt="WOW GOA" 
                style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#fff', objectFit: 'contain' }} 
              />
              <span style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-0.01em' }}>
                WOW GOA
              </span>
            </div>

            {/* Mode Switcher Pill (Book Taxi vs Self Drive) */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.12)',
              padding: '3px',
              borderRadius: '20px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setApkMode('cabs')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: apkMode === 'cabs' ? '#FFB703' : 'transparent',
                  color: apkMode === 'cabs' ? '#0B192C' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🚖</span>
                <span>Taxi</span>
              </button>

              <button
                type="button"
                onClick={() => setApkMode('selfdrive')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: apkMode === 'selfdrive' ? '#FFB703' : 'transparent',
                  color: apkMode === 'selfdrive' ? '#0B192C' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🚗</span>
                <span>Self Drive</span>
              </button>
            </div>

            {/* User Profile / Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowServiceChoiceModal(true)}
                title="Change Service"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: '#FFB703',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {cabUser?.name ? cabUser.name.split(' ')[0] : 'Jenny'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Switch Account / Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Body Content based on active mode */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {apkMode === 'cabs' ? (
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
            ) : (
              /* Self Drive Showcase View */
              <div style={{ padding: '16px', background: '#F8FAFC', minHeight: '100%' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
                  borderRadius: '16px',
                  padding: '18px',
                  color: '#ffffff',
                  marginBottom: '16px',
                  boxShadow: '0 4px 16px rgba(11, 25, 44, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Compass size={18} color="#FFB703" />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#FFB703', letterSpacing: '0.5px' }}>
                      Self Drive Holidays
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>
                    Rent &amp; Drive Across Goa
                  </h2>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.4 }}>
                    Choose your favorite car or scooter with unlimited kilometers &amp; doorstep delivery.
                  </p>
                </div>

                {vehiclesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚗</div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading self-drive fleet...</span>
                  </div>
                ) : (
                  <SelfDriveCategoryShowcase
                    cars={carsList}
                    bikes={bikesList}
                    onBookVehicle={(veh, type) => {
                      if (onBookCab) onBookCab(veh, type || 'vehicle');
                    }}
                    onViewVehicle={(veh) => {
                      if (onBookCab) onBookCab(veh, 'vehicle');
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              SERVICE CHOICE MODAL (Self Drive vs Book Taxi for Jenny)
              Crisp White Theme
             ════════════════════════════════════════════════════════════════════ */}
          {showServiceChoiceModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '16px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px 20px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                position: 'relative',
                color: '#0F172A',
                border: '2px solid #0F172A'
              }}>
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowServiceChoiceModal(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#F1F5F9',
                    border: '1.5px solid #0F172A',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0F172A'
                  }}
                >
                  <X size={16} />
                </button>

                {/* Greeting */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '26px'
                  }}>
                    🌴
                  </div>
                  <h3 style={{ fontSize: '21px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Welcome, <span style={{ color: '#D97706' }}>{cabUser?.name || 'Jenny'}!</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                    How would you like to travel in Goa today?
                  </p>
                </div>

                {/* Option 1: Book Taxi / Cabs */}
                <div 
                  onClick={() => {
                    setApkMode('cabs');
                    setShowServiceChoiceModal(false);
                  }}
                  style={{
                    border: apkMode === 'cabs' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                    borderRadius: '18px',
                    padding: '16px',
                    marginBottom: '14px',
                    cursor: 'pointer',
                    background: apkMode === 'cabs' ? '#F8FAFC' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>🚖</span>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>
                        Book Taxi / Cab
                      </span>
                    </div>
                    <span style={{
                      background: '#10B981',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.4px'
                    }}>
                      CHAUFFEUR
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Airport transfers &amp; point-to-point Goa cabs with professional verified chauffeurs. Zero surge pricing.
                  </p>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: '#0B192C',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Book Taxi Now</span>
                    <ArrowRight size={15} color="#FFB703" />
                  </button>
                </div>

                {/* Option 2: Self Drive (Car & Scooter) */}
                <div 
                  onClick={() => {
                    setApkMode('selfdrive');
                    setShowServiceChoiceModal(false);
                  }}
                  style={{
                    border: apkMode === 'selfdrive' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                    borderRadius: '18px',
                    padding: '16px',
                    cursor: 'pointer',
                    background: apkMode === 'selfdrive' ? '#FFFBEB' : '#ffffff',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>🚗</span>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>
                        Self Drive Holidays
                      </span>
                    </div>
                    <span style={{
                      background: '#F59E0B',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.4px'
                    }}>
                      CARS &amp; BIKES
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>
                    Rent Thar 4x4, Creta, Swift, or Activa Scooters to explore Goa on your own schedule.
                  </p>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      padding: '11px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Explore Self Drive</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
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
