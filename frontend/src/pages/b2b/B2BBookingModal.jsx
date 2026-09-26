import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, User, Phone, Mail, Calendar, Clock, DollarSign, Gift, Tag, Building2, Cake, AlertCircle, FileText, Download } from 'lucide-react';
import * as api from '../../services/api';
import { validateBookingDates } from '../../utils/dateUtils';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

export default function B2BBookingModal({
  selectedItem,
  serviceType = 'hotel',
  b2bMode = 'COMMISSION',
  partnerUser,
  onClose,
  onBookingSuccess
}) {
  if (!selectedItem) return null;

  useEffect(() => {
    lockScroll('b2b-booking-modal');
    return () => {
      unlockScroll('b2b-booking-modal');
    };
  }, []);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDob, setGuestDob] = useState('');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dropDate, setDropDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [numRooms, setNumRooms] = useState(1);
  const [numGuests, setNumGuests] = useState(2);
  const [bookingDays, setBookingDays] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');

  // B2B Partner Customer Markup State
  const [b2bMarkupType, setB2bMarkupType] = useState('fixed'); // 'fixed' or 'percentage'
  const [b2bMarkupValue, setB2bMarkupValue] = useState(500);

  // Authoritative Pricing State
  const [pricingSnapshot, setPricingSnapshot] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Recalculate authoritative price preview whenever relevant fields change
  useEffect(() => {
    let isMounted = true;
    const fetchPricing = async () => {
      setLoadingPricing(true);
      setError('');
      try {
        const preview = await api.fetchB2BPricingPreview({
          b2b_partner_id: partnerUser?.id,
          service_type: serviceType,
          item_id: selectedItem.id,
          days: bookingDays,
          qty: serviceType === 'hotel' ? numRooms : numGuests,
          mode: b2bMode,
          room_price: selectedItem.price || selectedItem.price_per_night,
          guests: numGuests,
          total_amount: selectedItem.price ? (selectedItem.price * bookingDays) : 5000,
          b2b_markup_type: b2bMarkupType,
          b2b_markup_value: b2bMarkupValue
        });
        if (isMounted) {
          setPricingSnapshot(preview);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to calculate B2B pricing.');
        }
      } finally {
        if (isMounted) setLoadingPricing(false);
      }
    };

    fetchPricing();
    return () => { isMounted = false; };
  }, [selectedItem, serviceType, b2bMode, bookingDays, numRooms, numGuests, partnerUser, b2bMarkupType, b2bMarkupValue]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = String(guestPhone || '').replace(/\D/g, '');
    if (!guestName || cleanPhone.length < 10) {
      setError('Please enter a valid guest name and 10-digit mobile phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `idemp_${partnerUser.id}_${selectedItem.id}_${Date.now()}`;
      const payload = {
        b2b_partner_id: partnerUser.id,
        b2b_mode: b2bMode,
        service_type: serviceType,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        guest_name: guestName,
        guest_phone: cleanPhone,
        guest_email: guestEmail,
        guest_dob: guestDob,
        pickup_date: pickupDate,
        drop_date: dropDate,
        booking_days: bookingDays,
        num_rooms: numRooms,
        guests: numGuests,
        special_requests: specialRequests,
        b2b_markup_type: b2bMarkupType,
        b2b_markup_value: parseFloat(b2bMarkupValue || 0),
        idempotency_key: idempotencyKey,
        payment_method: 'B2B Account / Cash'
      };

      const res = await api.b2bBook(payload);
      if (res && res.success) {
        setConfirmedBooking(res);
        if (onBookingSuccess) onBookingSuccess(res);
      } else {
        setError(res.error || 'Failed to confirm B2B booking.');
      }
    } catch (err) {
      setError(err.message || 'B2B Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 1060 }}>
      <div className="checkout-modal-content rounded-4 overflow-hidden shadow-2xl" style={{ maxWidth: confirmedBooking ? '560px' : '880px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-4 py-3 text-white d-flex justify-content-between align-items-center" style={{ background: '#0D1B2E' }}>
          <div className="d-flex align-items-center gap-2">
            <Building2 size={20} className="text-warning" />
            <div>
              <h5 className="fw-bold mb-0 font-heading">
                {confirmedBooking ? 'B2B Booking Voucher Confirmed' : `B2B Booking: ${selectedItem.name}`}
              </h5>
              <div className="text-white-50 text-xxs">
                Agency: <strong>{partnerUser?.company_name || partnerUser?.name}</strong> • Mode: <span className="badge bg-warning text-dark text-xxs">{b2bMode}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-link text-white-50 p-0 border-0" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="text-center py-3">
              <div className="rounded-circle mx-auto mb-3 p-3 bg-success text-white d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 className="fw-bold text-dark font-heading mb-1">
                {(confirmedBooking.status || 'Pending').toLowerCase() === 'pending'
                  ? 'Booking Received (Pending Confirmation)'
                  : `Booking ${confirmedBooking.status || 'Confirmed'} Successfully!`}
              </h4>
              <p className="text-muted text-xs mb-3">
                B2B Reservation Reference: <strong className="text-primary font-monospace">{confirmedBooking.booking_id}</strong>
              </p>

              {/* Voucher Card */}
              <div className="card border-0 rounded-3 p-3 bg-light text-start mx-auto mb-4 border" style={{ maxWidth: '440px', fontSize: '0.82rem' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Item / Service:</span>
                  <span className="fw-bold text-dark">{selectedItem.name}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Guest Name:</span>
                  <span className="fw-bold text-dark">{guestName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Guest Contact:</span>
                  <span>{guestPhone}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Dates:</span>
                  <span>{pickupDate} to {dropDate}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 mb-2">
                  <span className="text-muted">Fulfillment Status:</span>
                  <span className={`badge ${
                    (confirmedBooking.status || '').toLowerCase() === 'completed' ? 'bg-success text-white' :
                    (confirmedBooking.status || '').toLowerCase() === 'confirmed' ? 'bg-primary text-white' :
                    (confirmedBooking.status || '').toLowerCase() === 'cancelled' || (confirmedBooking.status || '').toLowerCase() === 'rejected' ? 'bg-danger text-white' :
                    'bg-warning text-dark'
                  } text-capitalize px-2.5 py-1 rounded-pill fw-bold`}>
                    {confirmedBooking.status || 'Pending'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">B2B Mode:</span>
                  <span className="badge bg-dark text-warning">{b2bMode}</span>
                </div>

                {b2bMode === 'COMMISSION' ? (
                  <div className="d-flex justify-content-between bg-success bg-opacity-10 p-2 rounded text-success fw-bold">
                    <span>Partner Commission Earned:</span>
                    <span>₹{Number(confirmedBooking.pricing_snapshot?.b2b_commission_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between bg-primary bg-opacity-10 p-2 rounded text-primary fw-bold">
                    <span>Partner Net Price Paid:</span>
                    <span>₹{Number(confirmedBooking.pricing_snapshot?.final_payable_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-warning text-dark fw-bold rounded-pill px-4 text-xs font-heading" onClick={onClose}>
                  Done & Return to B2B
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form + Authoritative Price Breakdown */
            <form onSubmit={handleBookingSubmit}>
              {error && (
                <div className="alert alert-danger py-2 px-3 rounded-3 text-xs d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="row g-4">
                {/* Guest Details Column */}
                <div className="col-lg-7">
                  <h6 className="fw-bold text-dark text-xs text-uppercase tracking-wider mb-3 pb-2 border-bottom">
                    1. Guest & Travel Details
                  </h6>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Mobile Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="10-digit mobile number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="guest@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Date of Birth</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={guestDob}
                        onChange={(e) => setGuestDob(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Check-in / Start Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Check-out / End Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={dropDate}
                        onChange={(e) => setDropDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    {serviceType === 'hotel' ? (
                      <>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Number of Rooms</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control form-control-sm"
                            value={numRooms}
                            onChange={(e) => setNumRooms(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Nights</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className="form-control form-control-sm"
                            value={bookingDays}
                            onChange={(e) => setBookingDays(parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Rental / Tour Days</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className="form-control form-control-sm"
                            value={bookingDays}
                            onChange={(e) => setBookingDays(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Number of Guests</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="form-control form-control-sm"
                            value={numGuests}
                            onChange={(e) => setNumGuests(parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </>
                    )}
                    {/* Agency Customer Markup Section */}
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label text-xs fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                          <Tag size={13} className="text-warning" /> 3. Total Markup (B2B Partner Markup)
                        </label>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className={`btn btn-xs ${b2bMarkupType === 'fixed' ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
                            onClick={() => setB2bMarkupType('fixed')}
                          >
                            ₹ Fixed
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs ${b2bMarkupType === 'percentage' ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
                            onClick={() => setB2bMarkupType('percentage')}
                          >
                            % Percent
                          </button>
                        </div>
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-end-0">
                          {b2bMarkupType === 'fixed' ? '₹' : '%'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step={b2bMarkupType === 'percentage' ? '0.5' : '50'}
                          className="form-control"
                          placeholder={b2bMarkupType === 'fixed' ? "e.g. 500" : "e.g. 5"}
                          value={b2bMarkupValue}
                          onChange={(e) => setB2bMarkupValue(e.target.value)}
                        />
                      </div>
                      <small className="text-muted text-xxs mt-1 d-block">
                        Total B2B Partner markup for this booking. Applied to wholesale B2B price to compute final customer price.
                      </small>
                    </div>
                  </div>
                </div>

                {/* Authoritative Financial Breakdown Column */}
                <div className="col-lg-5">
                  <div className="card border-0 rounded-4 shadow-sm p-3 bg-light border">
                    <h6 className="fw-bold text-dark text-xs text-uppercase tracking-wider mb-2 pb-2 border-bottom d-flex align-items-center justify-content-between">
                      <span>Authoritative Pricing Breakdown</span>
                      <span className="badge bg-dark text-white text-3xs">{b2bMode}</span>
                    </h6>

                    {loadingPricing ? (
                      <div className="text-center py-4">
                        <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                        <div className="text-muted text-xxs mt-2">Computing authoritative B2B price...</div>
                      </div>
                    ) : pricingSnapshot ? (
                      <div className="small">
                        {/* Price 1: Vendor / Base Price */}
                        <div className="d-flex justify-content-between mb-1.5 text-muted">
                          <span>1. Vendor / Base Price:</span>
                          <span className="font-monospace">₹{pricingSnapshot.vendor_base_price?.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Wow Goa Markup */}
                        <div className="d-flex justify-content-between mb-1.5 text-muted">
                          <span>• Wow Goa Markup ({pricingSnapshot.wow_markup_type === 'percentage' ? `${pricingSnapshot.wow_markup_value}%` : `₹${pricingSnapshot.wow_markup_value}`}):</span>
                          <span className="text-dark font-monospace">+₹{pricingSnapshot.wow_markup_amount?.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Price 2: B2B Wholesale Price */}
                        <div className="d-flex justify-content-between mb-2 p-2 rounded bg-primary bg-opacity-10 text-primary fw-bold">
                          <span>2. B2B Wholesale Price:</span>
                          <span className="font-monospace">₹{pricingSnapshot.b2b_price?.toLocaleString('en-IN')}</span>
                        </div>

                        {/* B2B Partner Customer Markup */}
                        <div className="d-flex justify-content-between mb-1.5 text-success fw-semibold">
                          <span>• Total Markup:</span>
                          <span className="font-monospace">+₹{pricingSnapshot.b2b_markup_amount?.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Price 3: Final Customer Selling Price */}
                        <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-bold text-dark fs-6 bg-white p-2 rounded border">
                          <span className="text-dark">3. Final Customer Price:</span>
                          <span className="text-success font-heading font-monospace">₹{pricingSnapshot.customer_price?.toLocaleString('en-IN')}</span>
                        </div>

                        {b2bMode === 'COMMISSION' ? (
                          <div className="p-2 rounded bg-success bg-opacity-10 text-success text-xs mb-2">
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Agency Commission ({pricingSnapshot.b2b_commission_percentage}%):</span>
                              <span>+₹{pricingSnapshot.b2b_commission_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <small className="text-muted text-xxs d-block mt-0.5">
                              * Accrues to agency statement upon trip completion.
                            </small>
                          </div>
                        ) : (
                          <div className="p-2 rounded bg-warning bg-opacity-15 text-dark text-xs mb-2">
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Wholesale Payable:</span>
                              <span>₹{pricingSnapshot.final_payable_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <small className="text-muted text-xxs d-block mt-0.5">
                              * Net wholesale booking. Customer pays you ₹{pricingSnapshot.customer_price?.toLocaleString('en-IN')}.
                            </small>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting || loadingPricing}
                      className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-pill mt-4 shadow-sm font-heading d-flex align-items-center justify-content-center gap-2"
                      style={{ fontSize: '0.88rem' }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span>
                          <span>Confirming Booking...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm B2B Booking</span>
                          <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
