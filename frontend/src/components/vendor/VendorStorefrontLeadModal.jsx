import React, { useState } from 'react';
import { X, Gift, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Phone, User, AlertCircle, Loader2 } from 'lucide-react';
import { recordStorefrontLead } from '../../services/api';

export default function VendorStorefrontLeadModal({
  isOpen,
  onClose,
  siteTitle = 'Goa Rentals',
  vendorSlug = '',
  vendorId = '',
  vendorType = 'vehicle',
  primaryColor = '#FF6333',
  onLeadCaptured = null
}) {
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('userName') || '';
    } catch (_) {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('userPhone') || '';
    } catch (_) {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('WOW500');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await recordStorefrontLead({
        name: cleanName,
        phone: cleanPhone,
        slug: vendorSlug,
        vendor_id: vendorId,
        vendor_type: vendorType
      });

      if (res && res.success) {
        setSuccess(true);
        setCouponCode(res.discount_code || 'WOW500');

        // Store in localStorage for seamless pre-fill in BookingModal
        try {
          localStorage.setItem('userName', cleanName);
          localStorage.setItem('userPhone', cleanPhone);
          localStorage.setItem(`tg_lead_claimed_${vendorSlug}`, '1');
          sessionStorage.setItem(`tg_lead_claimed_${vendorSlug}`, '1');
        } catch (_) {}

        if (onLeadCaptured && typeof onLeadCaptured === 'function') {
          onLeadCaptured({ name: cleanName, phone: cleanPhone, code: res.discount_code || 'WOW500' });
        }
      } else {
        setError(res?.error || 'Failed to claim discount. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(`tg_lead_dismissed_${vendorSlug}`, '1');
    } catch (_) {}
    onClose();
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(13,27,46,0.85)', backdropFilter: 'blur(6px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white text-dark">
          {/* Header Gradient */}
          <div 
            className="p-4 text-white position-relative text-center"
            style={{ 
              background: 'linear-gradient(135deg, #0D1B2E 0%, #1A365D 100%)',
              borderBottom: `3px solid ${primaryColor}` 
            }}
          >
            <button 
              type="button" 
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
              onClick={handleDismiss} 
              aria-label="Close" 
            />
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-2 shadow-sm"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
            >
              <Gift size={28} className="text-warning" />
            </div>
            <h4 className="fw-black mb-1 text-white font-heading" style={{ letterSpacing: '-0.3px' }}>
              Claim Up To ₹500 Trip Discount
            </h4>
            <p className="text-white-50 text-xs mb-0" style={{ maxWidth: '320px', margin: '0 auto' }}>
              Unlock direct host pricing &amp; instant up to ₹500 cashback for your booking with <strong>{siteTitle}</strong>.
            </p>
          </div>

          {/* Body */}
          <div className="p-4">
            {success ? (
              <div className="text-center py-2 animate-fade-in">
                <div className="rounded-circle bg-success bg-opacity-10 text-success p-3 d-inline-flex align-items-center justify-content-center mb-3">
                  <CheckCircle2 size={36} />
                </div>
                <h5 className="fw-black text-dark mb-1">Coupon Activated!</h5>
                <p className="text-muted text-xs mb-3">
                  Your special direct booking voucher has been applied. It will automatically deduct up to ₹500 when you book your {vendorType === 'hotel' ? 'stay' : 'vehicle'}!
                </p>

                <div className="p-3 bg-light rounded-3 border mb-3 d-flex align-items-center justify-content-between">
                  <div className="text-start">
                    <span className="text-muted text-xxs text-uppercase fw-bold d-block">Promo Code</span>
                    <span className="font-monospace fw-black fs-5 text-primary">{couponCode}</span>
                  </div>
                  <span className="badge bg-success rounded-pill px-3 py-1.5 text-xs fw-bold">✓ Up To ₹500 OFF</span>
                </div>

                <button 
                  type="button"
                  className="btn w-100 text-white rounded-pill py-2.5 fw-bold text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  style={{ background: primaryColor }}
                  onClick={onClose}
                >
                  <span>Explore Available {vendorType === 'hotel' ? 'Rooms' : 'Fleet'} &amp; Book</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3 text-start">
                  <label className="form-label text-dark small fw-bold mb-1 d-flex align-items-center gap-1">
                    <User size={13} className="text-muted" />
                    <span>Your Full Name *</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control rounded-3 py-2 px-3 fw-bold text-sm" 
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3 text-start">
                  <label className="form-label text-dark small fw-bold mb-1 d-flex align-items-center gap-1">
                    <Phone size={13} className="text-muted" />
                    <span>Mobile Phone Number *</span>
                  </label>
                  <input 
                    type="tel" 
                    className="form-control rounded-3 py-2 px-3 fw-bold text-sm" 
                    placeholder="e.g. 9822114433"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <div className="d-flex align-items-center justify-content-between mt-1">
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>10 digits mobile number</span>
                    <span className="text-success fw-semibold" style={{ fontSize: '0.68rem' }}>🔒 No spam guarantee</span>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 mb-3 rounded-3 text-xs d-flex align-items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn w-100 text-white rounded-pill py-2.5 fw-bold text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  style={{ background: primaryColor }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Activating Voucher...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Claim Up To ₹500 Discount Voucher</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <button 
                    type="button" 
                    className="btn btn-link text-muted text-xs p-0 text-decoration-none"
                    onClick={handleDismiss}
                  >
                    I already have a booking / No thanks
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
