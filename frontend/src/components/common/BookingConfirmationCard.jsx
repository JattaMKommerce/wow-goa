import React from 'react';
import { 
  CheckCircle2, Gift, Clock, CreditCard, Lock, 
  Compass, Calendar, MapPin, Check, MessageSquare
} from 'lucide-react';

/**
 * CashbackRewardCard — Prominent Brand Reward Section
 * Used standalone (e.g. in full-page checkout step 4) or inside BookingConfirmationCard
 * 
 * Strictly uses server-returned authoritative cashback data (cashback_preview).
 * Never recalculates cashback on the frontend.
 */
export function CashbackRewardCard({ cashbackPreview, isModalView = true, className = '' }) {
  const cashbackAmount = typeof cashbackPreview === 'number' 
    ? cashbackPreview 
    : (typeof cashbackPreview?.amount === 'number' ? cashbackPreview.amount : parseFloat(cashbackPreview?.amount || 0));

  if (isNaN(cashbackAmount) || cashbackAmount <= 0) {
    return null;
  }

  return (
    <div 
      className={`card border-0 rounded-4 p-3 mb-3 text-start position-relative overflow-hidden shadow-sm ${className}`}
      style={{ 
        background: '#ffffff', 
        color: '#0D1B2E',
        border: '1.5px solid #fed7aa',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2.5">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', background: '#fef3c7', color: '#d97706' }}
          >
            <Gift size={20} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-black text-dark font-heading fs-5" style={{ lineHeight: 1.1 }}>
                ₹{Number(cashbackAmount).toLocaleString('en-IN')}
              </span>
              <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">
                Cashback Reward
              </span>
            </div>
            <div className="text-muted text-xs mt-0.5" style={{ fontSize: '11.5px' }}>
              Added to your <strong>WOW GOA Wallet &amp; Rewards</strong> after booking is completed.
            </div>
          </div>
        </div>
        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 text-xxs fw-bold px-2.5 py-1 rounded-pill flex-shrink-0">
          WOW GOA REWARDS
        </span>
      </div>
    </div>
  );
}

/**
 * BookingConfirmationCard — Unified WOW GOA Booking Confirmation Component
 * 
 * Standardized across all 7 D2C booking flows:
 * 1. Self Drive Cars
 * 2. Self Drive Bikes
 * 3. Vehicle + Driver
 * 4. Hotels
 * 5. Holiday Packages
 * 6. Craft My Trip
 * 7. Activities & Sightseeing
 * 
 * Strictly uses server-returned authoritative cashback data (cashback_preview).
 * Never recalculates cashback on the frontend.
 */
export default function BookingConfirmationCard({
  bookingId,
  customerName = 'Valued Guest',
  customerPhone = '',
  serviceTitle = '',
  serviceSubtitle = '',
  badgeText = '',
  cashbackPreview = null,
  details = [], // Array of { label, value, icon, badge, isHighlight, isSuccess }
  amountPaid = null,
  totalAmount = null,
  remainingBalance = null,
  paymentStatus = '',
  paymentMode = '',
  onClose = null,
  onTrackPortal = null,
  actions = null,
  showPortalCTA = true,
  isModalView = true,
  serviceType = '',
  portalDescription = null,
}) {
  const handlePortalRedirect = () => {
    if (customerPhone) {
      try {
        const clean = String(customerPhone).replace(/\D/g, '');
        if (clean) {
          sessionStorage.setItem('customer_login_phone', clean);
          localStorage.setItem('customer_login_phone', clean);
        }
      } catch (e) {}
    }

    if (onTrackPortal && typeof onTrackPortal === 'function') {
      onTrackPortal();
    } else {
      window.location.href = '/customer';
    }
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
    const waPhone = cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : '';
    const bId = String(bookingId || '').replace(/^#/, '');

    const summaryText = 
      `🎟️ *WOW GOA — BOOKING CONFIRMATION VOUCHER*\\n\\n` +
      `*Booking ID:* #${bId}\\n` +
      `*Guest Name:* ${customerName}\\n` +
      (serviceTitle ? `*Service:* ${serviceTitle}\\n` : '') +
      (totalAmount !== null ? `*Total Amount:* ₹${Number(totalAmount).toLocaleString('en-IN')}\\n` : '') +
      (amountPaid !== null ? `*Amount Paid:* ₹${Number(amountPaid).toLocaleString('en-IN')}\\n` : '') +
      (paymentStatus ? `*Payment Status:* ${paymentStatus}\\n` : '') +
      `\\nTrack booking itinerary or download official A4 voucher:\\n` +
      `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/customer\\n\\n` +
      `*WOW GOA Rentals & Stays* • Helpline: +91 9916933476`;

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(summaryText)}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }
  };

  const renderPortalDescription = () => {
    if (portalDescription) return portalDescription;

    const hasDriver = details.some(d => 
      d.label?.toLowerCase().includes('driver') || 
      d.label?.toLowerCase().includes('chauffeur') ||
      (typeof d.value === 'string' && (d.value.toLowerCase().includes('driver') || d.value.toLowerCase().includes('chauffeur')))
    );

    const isHotel = serviceType === 'hotel' || details.some(d => 
      d.label?.toLowerCase().includes('hotel') || 
      d.label?.toLowerCase().includes('stay schedule') || 
      d.label?.toLowerCase().includes('room')
    );

    const isVehicle = serviceType === 'vehicle' || details.some(d => 
      d.label?.toLowerCase().includes('vehicle') || 
      d.label?.toLowerCase().includes('two wheeler') || 
      d.label?.toLowerCase().includes('rental schedule')
    );

    const isActivity = serviceType === 'activity' || details.some(d => 
      d.label?.toLowerCase().includes('experience') || 
      d.label?.toLowerCase().includes('tour date')
    );

    if (isHotel) {
      if (hasDriver) {
        return (
          <>Track your hotel reservation, live chauffeur assignment, stay vouchers, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
        );
      }
      return (
        <>Track your hotel reservation, check-in voucher, stay itinerary, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
      );
    }

    if (isVehicle) {
      if (hasDriver) {
        return (
          <>Track your booking itinerary, live driver assignment, vehicle voucher, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
        );
      }
      return (
        <>Track your vehicle rental details, pickup schedule, voucher downloads, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
      );
    }

    if (isActivity) {
      return (
        <>Track your activity schedule, entry pass vouchers, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
      );
    }

    if (hasDriver) {
      return (
        <>Track your booking itinerary, live driver assignment, voucher downloads, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
      );
    }

    return (
      <>Track your booking itinerary, voucher downloads, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.</>
    );
  };

  return (
    <div className={`wowgoa-booking-confirmation ${isModalView ? 'text-start' : 'w-100'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── A. SUCCESS HEADER ── */}
      <div className="text-center mb-4">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
            color: '#10B981',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)'
          }}
        >
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>

        <h3 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
          ✓ Booking Confirmed!
        </h3>

        {bookingId && (
          <div className="d-inline-flex align-items-center gap-1.5 badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold mb-2 shadow-2xs">
            <span className="text-muted">Booking ID:</span>
            <span className="text-primary font-monospace fw-black" style={{ letterSpacing: '0.5px' }}>
              #{String(bookingId).replace(/^#/, '')}
            </span>
          </div>
        )}

        <p className="text-muted text-xs mb-0 px-2" style={{ maxWidth: '480px', margin: '0 auto' }}>
          Thank you, <strong className="text-dark">{customerName}</strong>. 
          {serviceTitle ? (
            <> Your reservation for <strong className="text-dark">{serviceTitle}</strong> has been successfully booked and confirmed.</>
          ) : (
            <> Your reservation has been successfully booked and confirmed.</>
          )}
        </p>

        {serviceSubtitle && (
          <p className="text-success text-xxs fw-bold mt-1 mb-0">
            {serviceSubtitle}
          </p>
        )}
      </div>

      {/* ── B. CASHBACK REWARD CARD (Authoritative Server Data) ── */}
      <CashbackRewardCard cashbackPreview={cashbackPreview} isModalView={isModalView} />

      {/* ── C. SERVICE-SPECIFIC BOOKING DETAILS ── */}
      {details && details.length > 0 && (
        <div 
          className="bg-light rounded-4 p-3.5 mb-3.5 border shadow-2xs text-start" 
          style={{ border: '1px solid #e2e8f0' }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom">
            <span className="text-secondary text-xs fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Reservation Summary
            </span>
            {paymentStatus && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill text-xxs fw-bold">
                {paymentStatus}
              </span>
            )}
          </div>

          <div className="d-flex flex-column gap-2">
            {details.map((item, idx) => (
              <div 
                key={idx} 
                className={`d-flex justify-content-between align-items-start gap-2 text-xs ${idx < details.length - 1 ? 'pb-2 border-bottom border-light' : ''}`}
              >
                <span className="text-muted d-flex align-items-center gap-1.5 flex-shrink-0">
                  {item.icon && <span className="text-secondary">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
                <span className={`text-end fw-bold ${item.isHighlight ? 'text-primary' : (item.isSuccess ? 'text-success' : 'text-dark')}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing & Payment Snapshot */}
          {(amountPaid !== null || totalAmount !== null) && (
            <div className="mt-2.5 pt-2.5 border-top d-flex flex-column gap-1.5">
              {totalAmount !== null && (
                <div className="d-flex justify-content-between align-items-center text-xs">
                  <span className="text-muted">Total Booking Value</span>
                  <span className="fw-bold text-dark">₹{Number(totalAmount).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* If amount was paid */}
              {amountPaid !== null && Number(amountPaid) > 0 && (
                <div className="d-flex justify-content-between align-items-center text-xs">
                  <span className="text-muted">
                    Amount Paid {paymentMode ? `(${paymentMode})` : ''}
                  </span>
                  <span className="fw-black text-success fs-6">₹{Number(amountPaid).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* If nothing paid yet (e.g. Pay at Hotel / Cash on Arrival) */}
              {(amountPaid === null || Number(amountPaid) === 0) && paymentMode && (
                <div className="d-flex justify-content-between align-items-center text-xs">
                  <span className="text-muted">Payment Mode</span>
                  <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-2 py-1 fw-bold">
                    {paymentMode}
                  </span>
                </div>
              )}

              {/* Remaining balance / Payable at Check-in */}
              {remainingBalance !== null && Number(remainingBalance) > 0 && (
                <div className="d-flex justify-content-between align-items-center text-xs text-primary fw-semibold pt-1 border-top border-light">
                  <span>
                    {paymentMode && paymentMode.toLowerCase().includes('hotel') 
                      ? 'Payable at Hotel Front Desk' 
                      : (Number(amountPaid) > 0 ? 'Remaining Balance (Due at Check-in)' : 'Payable on Arrival / Check-in')}
                  </span>
                  <span className="fw-black text-primary fs-6">₹{Number(remainingBalance).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── D. CUSTOMER PORTAL TRACKING CTA ── */}
      {showPortalCTA && (
        <div 
          className="card border-0 shadow-sm rounded-4 p-3.5 mb-3 text-start bg-white" 
          style={{ border: '1.5px solid #fed7aa', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)' }}
        >
          <div className="d-flex align-items-center gap-2 mb-1.5">
            <Compass size={20} className="text-warning flex-shrink-0" />
            <h6 className="fw-bold text-dark mb-0 font-heading" style={{ fontSize: '14.5px' }}>
              Track in WOW GOA Customer Portal
            </h6>
          </div>
          <p className="text-muted text-xs mb-3" style={{ lineHeight: 1.45 }}>
            {renderPortalDescription()}
          </p>
          <div className="d-flex flex-column gap-2">
            <button 
              type="button" 
              id="track-booking-portal-btn"
              className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 font-heading"
              onClick={handlePortalRedirect}
            >
              <span>Track in WOW GOA Customer Portal →</span>
            </button>
            <button
              type="button"
              id="share-voucher-whatsapp-btn"
              className="btn btn-success text-white fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 font-heading"
              style={{ background: '#25D366', borderColor: '#25D366' }}
              onClick={handleShareWhatsApp}
            >
              <MessageSquare size={15} />
              <span>Send / Share Voucher on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ── E. CUSTOM ACTIONS / BUTTONS ── */}
      {actions && (
        <div className="mt-2">
          {actions}
        </div>
      )}

      {onClose && !actions && (
        <div className="text-center mt-3">
          <button 
            type="button" 
            className="btn btn-outline-secondary rounded-pill px-4 py-2 text-xs fw-bold"
            onClick={onClose}
          >
            Close Window
          </button>
        </div>
      )}
    </div>
  );
}
