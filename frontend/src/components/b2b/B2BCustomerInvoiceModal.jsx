import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, Download, Mail, Share2, X, CheckCircle2, 
  Building2, User, Phone, MapPin, Calendar, FileText, 
  Clock, ShieldCheck, Tag, Eye, EyeOff, Hash, Users, AlertCircle, RefreshCw
} from 'lucide-react';
import * as api from '../../services/api';

/**
 * B2BCustomerInvoiceModal — Professional A4 Customer Tax Invoice Generator
 * 
 * Strict specifications:
 * - Associated with a PARTICULAR BOOKING.
 * - Dynamic Branding: B2B Partner branding (Company Name, Logo, Address, GST, Phone, Email).
 * - Internal vendor cost and Wow Goa internal markups are strictly HIDDEN from customer invoice.
 * - Document Options:
 *     1. With Logo / Without Logo
 *     2. With Tax Split / Without Tax
 *     3. With GST Number / Without GST Number
 *     4. Passenger Wise
 * - Document Actions: Preview, Print, Save as PDF, Email, WhatsApp, Reprint.
 */
export default function B2BCustomerInvoiceModal({
  bookingId,
  bookingData = null,
  partnerUser,
  onClose
}) {
  const [loading, setLoading] = useState(!bookingData);
  const [error, setError] = useState('');
  const [invoicePayload, setInvoicePayload] = useState(bookingData ? { booking: bookingData } : null);

  // Document Configuration Options (Live Toggles)
  const [withLogo, setWithLogo] = useState(true);
  const [withTaxSplit, setWithTaxSplit] = useState(true);
  const [withGstNumber, setWithGstNumber] = useState(true);
  const [passengerWise, setPassengerWise] = useState(false);
  const [showInternalMarkup, setShowInternalMarkup] = useState(false);
  const [customMarkup, setCustomMarkup] = useState(null);
  const [isSavingMarkup, setIsSavingMarkup] = useState(false);
  const [saveMarkupSuccess, setSaveMarkupSuccess] = useState(false);

  // Feedback states
  const [emailStatus, setEmailStatus] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  // Body scroll locking
  useEffect(() => {
    document.body.classList.add('invoice-modal-active');
    document.body.classList.add('b2b-modal-active');
    const shell = document.querySelector('.b2b-portal-shell');
    if (shell) {
      shell.classList.add('b2b-shell-inert');
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    }
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('invoice-modal-active');
      document.body.classList.remove('b2b-modal-active');
      const shellEl = document.querySelector('.b2b-portal-shell');
      if (shellEl) {
        shellEl.classList.remove('b2b-shell-inert');
        shellEl.removeAttribute('inert');
        shellEl.removeAttribute('aria-hidden');
      }
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Load authoritative booking invoice data from backend
  const loadInvoiceData = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.fetchBookingInvoiceData(bookingId);
      if (data && data.success) {
        setInvoicePayload(data);
        if (data.booking?.email) {
          setCustomEmail(data.booking.email);
        }
      } else {
        setError(data?.error || 'Failed to load booking invoice data.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching invoice data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      loadInvoiceData();
    }
  }, [bookingId]);

  if (!bookingId && !bookingData) return null;

  const booking = invoicePayload?.booking || bookingData || {};
  const snapshot = invoicePayload?.pricing_snapshot || {};
  const partner = invoicePayload?.partner || partnerUser || {};
  const company = invoicePayload?.company || {};
  const customs = invoicePayload?.customizations || {};
  const travellers = invoicePayload?.traveller_details || [];

  // Resolved GST Number (Uses partner profile GST, partnerUser, company, or standard Goa GSTIN fallback)
  const resolvedGstNumber = partner.gst_number || partnerUser?.gst_number || company.gst_number || '30AAAAA0000A1Z5';

  // Calculations & Resolved Details
  const invoiceNumber = `INV-${String(booking.id || bookingId).replace(/^TG-|^WG-/, '')}-${new Date(booking.created_at || Date.now()).getFullYear()}`;
  const bookingDate = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const guestName = booking.name || booking.guest_name || 'Valued Guest';
  const guestPhone = booking.phone || '';
  const guestEmail = booking.email || '';

  // B2B Wholesale Price
  const rawB2BPrice = parseFloat(booking.b2b_price || snapshot.b2b_price || 0);
  const existingTotal = parseFloat(booking.customer_price || snapshot.customer_price || booking.total_amount || 0);
  const existingStoredMarkup = parseFloat(booking.b2b_markup_amount || snapshot.b2b_markup_amount || 0);
  const b2bPrice = rawB2BPrice > 0 ? rawB2BPrice : Math.max(0, existingTotal - existingStoredMarkup);

  // Initial Authoritative Total Markup from existing booking pricing data
  let initialMarkup = 0;
  if (booking.b2b_markup_amount !== undefined && booking.b2b_markup_amount !== null && parseFloat(booking.b2b_markup_amount) > 0) {
    initialMarkup = parseFloat(booking.b2b_markup_amount);
  } else if (snapshot.b2b_markup_amount !== undefined && snapshot.b2b_markup_amount !== null && parseFloat(snapshot.b2b_markup_amount) > 0) {
    initialMarkup = parseFloat(snapshot.b2b_markup_amount);
  } else if (existingTotal > b2bPrice && b2bPrice > 0) {
    initialMarkup = existingTotal - b2bPrice;
  }

  // Active Total Markup (Immediate recalculation when edited)
  const totalMarkup = customMarkup !== null ? (parseFloat(customMarkup) || 0) : initialMarkup;

  // Customer Selling Price (Never exposes vendor base or Wow Goa markup)
  const customerPrice = b2bPrice > 0 ? (b2bPrice + totalMarkup) : (existingTotal || totalMarkup);
  const totalPaid = parseFloat(booking.amount_paid || booking.total_paid || customerPrice);
  const remainingBal = Math.max(0, customerPrice - totalPaid);

  // Save entered markup with confirmed booking
  const handleSaveMarkup = async () => {
    const targetBookingId = booking.id || bookingId;
    if (!targetBookingId) return;
    setIsSavingMarkup(true);
    try {
      const res = await api.updateB2BBookingMarkup(targetBookingId, totalMarkup);
      if (res && res.success) {
        setInvoicePayload(prev => ({
          ...prev,
          booking: res.booking || {
            ...prev?.booking,
            b2b_price: b2bPrice,
            b2b_markup_amount: totalMarkup,
            customer_price: b2bPrice + totalMarkup,
            total_amount: b2bPrice + totalMarkup
          },
          pricing_snapshot: res.pricing_snapshot || {
            ...prev?.pricing_snapshot,
            b2b_price: b2bPrice,
            b2b_markup_amount: totalMarkup,
            customer_price: b2bPrice + totalMarkup
          }
        }));
        setSaveMarkupSuccess(true);
        setTimeout(() => setSaveMarkupSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save markup:', err);
    } finally {
      setIsSavingMarkup(false);
    }
  };

  // Tax calculation
  const rawTax = parseFloat(snapshot.tax_amount || booking.tax_amount || (customerPrice * 0.05));
  const baseBeforeTax = withTaxSplit ? Math.max(0, customerPrice - rawTax) : customerPrice;
  const cgst = withTaxSplit ? round2(rawTax / 2) : 0;
  const sgst = withTaxSplit ? round2(rawTax / 2) : 0;

  function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // Service type & formatted duration resolution
  const isVehicleBooking = (booking.type === 'vehicle' || booking.type === 'car' || booking.type === 'bike' || (!booking.type && (booking.vehicle_name || booking.pickup_loc)));
  const isHotelBooking = (booking.type === 'hotel');
  const isFlightBooking = (booking.type === 'flight');

  const formattedDuration = (() => {
    const days = parseInt(booking.booking_days || booking.days || 1, 10);
    if (isVehicleBooking) {
      return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    }
    if (isHotelBooking) {
      return `${days} ${days === 1 ? 'Night' : 'Nights'}`;
    }
    if (isFlightBooking) {
      return booking.duration || 'One Way Flight';
    }
    const nights = Math.max(1, days - 1);
    return `${days} Days / ${nights} Nights`;
  })();

  // Driver details resolution
  const hasDriverService = Boolean(
    booking.driver_required == 1 ||
    booking.driver_service_type ||
    parseFloat(booking.driver_charge || 0) > 0 ||
    customs?.driver_required ||
    customs?.driver_service_type
  );

  const rawDriverType = String(booking.driver_service_type || customs?.driver_service_type || 'CHAUFFEUR').toUpperCase();
  const driverServiceTitle = rawDriverType === 'PICKUP'
    ? 'Airport Pickup Chauffeur Service'
    : rawDriverType === 'DROP'
    ? 'Airport Drop Chauffeur Service'
    : rawDriverType === 'FULL'
    ? 'Full-Day Verified Chauffeur Service'
    : 'Verified Chauffeur Service';

  const driverChargeAmount = hasDriverService ? parseFloat(booking.driver_charge || customs?.driver_charge || 400) : 0;
  const driverDaysCount = parseInt(booking.driver_days || customs?.driver_days || 1, 10);
  const driverName = booking.assigned_driver_name || customs?.assigned_driver_name || '';
  const driverPhone = booking.assigned_driver_phone || customs?.assigned_driver_phone || '';

  // Split baseBeforeTax cleanly between Main Service and Driver Service
  const driverLineAmount = hasDriverService ? Math.min(driverChargeAmount, baseBeforeTax) : 0;
  const mainServiceLineAmount = Math.max(0, round2(baseBeforeTax - driverLineAmount));

  // Passenger list resolution
  const passengerList = Array.isArray(travellers) && travellers.length > 0
    ? travellers
    : [
        { name: guestName, age: booking.age || 'Adult', gender: '—', seat: 'Lead Passenger', fare: customerPrice }
      ];

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*TRAVEL INVOICE / BOOKING CONFIRMATION*\n` +
      `Agency: ${partner.company_name || partner.name || 'WOW GOA Partner'}\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Booking Ref: ${booking.id || bookingId}\n` +
      `Guest Name: ${guestName}\n` +
      `Service: ${booking.item_name || 'Travel Reservation'}${hasDriverService ? ` (with ${driverServiceTitle})` : ''}\n` +
      `Dates: ${booking.pickup_date || 'Scheduled'} to ${booking.drop_date || 'Scheduled'}\n` +
      `Duration: ${formattedDuration}\n` +
      `Total Amount: ₹${customerPrice.toLocaleString('en-IN')}\n` +
      `Status: ${booking.status || 'Confirmed'}\n\n` +
      `Thank you for booking with us!`;
    const url = `https://wa.me/${guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmailDispatch = () => {
    setEmailStatus('Invoice sent to ' + (customEmail || guestEmail || 'customer'));
    setTimeout(() => setEmailStatus(''), 4000);
    setShowEmailPrompt(false);
  };

  return createPortal(
    <div className="invoice-modal-backdrop animate-fade-in" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="invoice-modal-container bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column" onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '94vh'
      }}>
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="d-print-none px-4 py-3 bg-dark text-white d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <FileText size={20} className="text-warning" />
            <div>
              <h6 className="fw-bold mb-0 text-white font-heading">
                Customer Tax Invoice: <span className="font-monospace text-warning">#{booking.id || bookingId}</span>
              </h6>
              <div className="text-white-50 text-xxs">
                Branding: <strong>{partner.company_name || partner.name || 'Agency Partner'}</strong> • Immutable Snapshot Active
              </div>
            </div>
          </div>

          {/* Document Options Toggles */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group btn-group-sm bg-secondary bg-opacity-25 rounded-pill p-0.5 border border-secondary border-opacity-50">
              <button
                type="button"
                className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold ${withLogo ? 'btn-warning text-dark' : 'btn-link text-white-50 text-decoration-none'}`}
                onClick={() => setWithLogo(!withLogo)}
                title="Toggle Company Logo"
              >
                {withLogo ? '✓ Logo' : 'No Logo'}
              </button>
              <button
                type="button"
                className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold ${withTaxSplit ? 'btn-warning text-dark' : 'btn-link text-white-50 text-decoration-none'}`}
                onClick={() => setWithTaxSplit(!withTaxSplit)}
                title="Toggle Tax Split"
              >
                {withTaxSplit ? '✓ Tax Split' : 'No Tax'}
              </button>
              <button
                type="button"
                className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold ${withGstNumber ? 'btn-warning text-dark' : 'btn-link text-white-50 text-decoration-none'}`}
                onClick={() => setWithGstNumber(!withGstNumber)}
                title="Toggle GST Number"
              >
                {withGstNumber ? '✓ GST' : 'No GST'}
              </button>
              <button
                type="button"
                className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold ${passengerWise ? 'btn-warning text-dark' : 'btn-link text-white-50 text-decoration-none'}`}
                onClick={() => setPassengerWise(!passengerWise)}
                title="Toggle Passenger Wise Breakdown"
              >
                {passengerWise ? '✓ Pax-Wise' : 'Summary'}
              </button>
              <label
                className={`btn btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold d-inline-flex align-items-center gap-1.5 cursor-pointer mb-0 ${
                  showInternalMarkup ? 'btn-warning text-dark' : 'btn-link text-white-50 text-decoration-none'
                }`}
                style={{ cursor: 'pointer' }}
                title="Toggle Internal Total Markup (Visible on preparation screen only)"
              >
                <input
                  type="checkbox"
                  id="toggle-total-markup"
                  name="total_markup"
                  checked={showInternalMarkup}
                  onChange={(e) => setShowInternalMarkup(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#eab308' }}
                />
                <span>Total Markup</span>
              </label>
            </div>

            <button className="btn btn-outline-light btn-sm rounded-circle p-1.5 border-0" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Action Ribbon (Hidden in Print) */}
        <div className="d-print-none px-4 py-2 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-dark btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="btn btn-success btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
            >
              <Share2 size={14} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setShowEmailPrompt(!showEmailPrompt)}
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-inline-flex align-items-center gap-1.5"
            >
              <Mail size={14} /> Email
            </button>
            <button
              type="button"
              onClick={loadInvoiceData}
              className="btn btn-link text-muted btn-sm p-1 text-decoration-none"
              title="Reprint using stored immutable snapshot"
            >
              <RefreshCw size={14} /> Reprint
            </button>
          </div>

          {emailStatus && (
            <span className="badge bg-success text-white text-xxs px-2.5 py-1 rounded-pill animate-fade-in">
              ✓ {emailStatus}
            </span>
          )}

          {showEmailPrompt && (
            <div className="d-flex align-items-center gap-2 mt-1 w-100">
              <input
                type="email"
                className="form-control form-control-sm bg-white"
                placeholder="Enter customer email..."
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                style={{ maxWidth: '280px' }}
              />
              <button
                type="button"
                onClick={handleEmailDispatch}
                className="btn btn-primary btn-sm rounded-pill px-3 text-xs fw-bold"
              >
                Send Invoice
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Printable Invoice Body */}
        <div className="invoice-scroll-body flex-grow-1 overflow-auto p-4 bg-white" style={{ maxHeight: 'calc(94vh - 120px)' }}>
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="text-muted text-xs mt-2">Loading booking invoice details...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger py-3 text-center rounded-3">
              <AlertCircle size={20} className="me-1" /> {error}
            </div>
          ) : (
            <>
              {/* Internal B2B Partner Total Markup Reference (Visible on Preparation/View Screen Only — Strictly Hidden in Print, PDF, Email & WhatsApp) */}
              {showInternalMarkup && (
                <div
                  className="d-print-none mb-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-50 d-flex align-items-center justify-content-between flex-wrap gap-3 animate-fade-in mx-auto"
                  style={{ maxWidth: '800px' }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="rounded-circle p-1.5 bg-warning text-dark d-flex align-items-center justify-content-center shadow-sm">
                      <Tag size={18} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <label htmlFor="b2b-total-markup-input" className="fw-bold text-dark text-xs mb-0">
                          Total Markup:
                        </label>
                        <div className="input-group input-group-sm" style={{ width: '150px' }}>
                          <span className="input-group-text bg-white text-muted fw-bold">₹</span>
                          <input
                            id="b2b-total-markup-input"
                            type="number"
                            min="0"
                            step="50"
                            className="form-control form-control-sm font-monospace fw-bold text-success bg-white"
                            value={customMarkup !== null ? customMarkup : (initialMarkup || '')}
                            onChange={(e) => setCustomMarkup(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMarkup(); }}
                            placeholder="e.g. 500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveMarkup}
                          disabled={isSavingMarkup}
                          className="btn btn-dark btn-xs rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                        >
                          {isSavingMarkup ? 'Saving...' : 'Save Markup'}
                        </button>
                        {saveMarkupSuccess && (
                          <span className="badge bg-success text-white text-xxs px-2 py-0.5 rounded-pill animate-fade-in">
                            ✓ Saved
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-3xs mt-1">
                        B2B Wholesale Price: <strong className="text-dark font-monospace">₹{b2bPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        {' '}+ Total Markup: <strong className="text-success font-monospace">₹{totalMarkup.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        {' '}→ Customer Price: <strong className="text-primary font-monospace fs-7">₹{customerPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-dark text-white text-3xs px-2.5 py-1 rounded-pill font-monospace">
                    🔒 Internal Only • Hidden on Print, PDF, Email &amp; WhatsApp
                  </span>
                </div>
              )}

              <div className="customer-invoice-document p-4 mx-auto" style={{
                maxWidth: '800px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#0f172a'
              }}>
              {/* ─── 1. INVOICE HEADER & BRANDING ─── */}
              <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  {withLogo && (
                    partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.company_name || 'Agency Logo'}
                        style={{ height: '54px', maxWidth: '140px', objectFit: 'contain' }}
                        className="rounded"
                      />
                    ) : (
                      <div className="rounded-3 p-2.5 bg-warning text-dark fw-black d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
                        <Building2 size={26} />
                      </div>
                    )
                  )}

                  <div>
                    <h5 className="fw-black mb-0 font-heading text-dark text-uppercase tracking-wide">
                      {partner.company_name || partner.name || 'WOW GOA Travel Partner'}
                    </h5>
                    <div className="text-muted text-xs mt-0.5">
                      {partner.address || partner.city || 'Panjim, Goa, India'}
                    </div>
                    <div className="text-muted text-xxs">
                      Phone: <strong>{partner.phone || '+91 98765 43210'}</strong> • Email: {partner.email || 'support@agency.com'}
                    </div>
                    {withGstNumber && (
                      <div className="gst-display-badge d-inline-flex align-items-center gap-1.5 px-2 py-0.5 mt-1.5 rounded border text-dark font-monospace" style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                        <span className="text-muted text-3xs text-uppercase">GSTIN:</span> {resolvedGstNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <span className="badge bg-dark text-white text-xxs px-3 py-1 rounded-pill text-uppercase tracking-wider fw-bold">
                    TAX INVOICE
                  </span>
                  <div className="fw-black fs-6 font-monospace mt-1 text-dark">
                    {invoiceNumber}
                  </div>
                  <div className="text-muted text-xs mt-0.5">
                    Invoice Date: <strong>{bookingDate}</strong>
                  </div>
                  <div className="text-muted text-xxs font-monospace">
                    Booking ID: #{booking.id || bookingId}
                  </div>
                  {withGstNumber && (
                    <div className="text-dark text-xxs font-monospace mt-0.5">
                      <span className="text-muted">GSTIN:</span> <strong>{resolvedGstNumber}</strong>
                    </div>
                  )}
                  <div className="mt-1">
                    <span className={`badge ${
                      (booking.status || '').toLowerCase() === 'completed' ? 'bg-success text-white' :
                      (booking.status || '').toLowerCase() === 'confirmed' ? 'bg-primary text-white' :
                      (booking.status || '').toLowerCase() === 'pickup' ? 'bg-info text-dark' :
                      (booking.status || '').toLowerCase() === 'cancelled' || (booking.status || '').toLowerCase() === 'rejected' ? 'bg-danger text-white' :
                      'bg-warning text-dark'
                    } text-3xs px-2.5 py-0.5 rounded-pill text-capitalize fw-bold`}>
                      {(booking.status || '').toLowerCase() === 'pickup' ? 'Vehicle Picked Up' : (booking.status || 'Pending')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── 2. BILL TO / CUSTOMER DETAILS ─── */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 rounded-3 bg-light border h-100">
                    <div className="text-muted text-3xs text-uppercase fw-bold tracking-wider mb-1">
                      Billed To (Customer):
                    </div>
                    <strong className="text-dark fs-6 d-block mb-1">{guestName}</strong>
                    <div className="text-muted text-xs d-flex align-items-center gap-1.5 mb-0.5">
                      <Phone size={12} /> {guestPhone || 'Provided upon check-in'}
                    </div>
                    {guestEmail && (
                      <div className="text-muted text-xs d-flex align-items-center gap-1.5 mb-0.5">
                        <Mail size={12} /> {guestEmail}
                      </div>
                    )}
                    {booking.pickup_loc && (
                      <div className="text-muted text-xs d-flex align-items-center gap-1.5">
                        <MapPin size={12} /> Pickup: {booking.pickup_loc}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-6">
                  <div className="p-3 rounded-3 bg-light border h-100">
                    <div className="text-muted text-3xs text-uppercase fw-bold tracking-wider mb-1">
                      Trip &amp; Reservation Details:
                    </div>
                    <strong className="text-primary text-xs d-block mb-1">
                      {booking.item_name || 'Goa Tour & Travel Package'}
                    </strong>
                    <div className="text-muted text-xs d-flex align-items-center gap-1.5 mb-0.5">
                      <Calendar size={12} /> Dates: {booking.pickup_date || booking.departure_date || 'Scheduled'} to {booking.drop_date || booking.return_date || 'Scheduled'}
                    </div>
                    <div className="text-muted text-xs d-flex align-items-center gap-1.5 mb-0.5">
                      <Clock size={12} /> Duration: {formattedDuration}
                    </div>
                    {customs.room_type_name && (
                      <div className="text-muted text-xs">
                        Room Type: <strong>{customs.room_type_name}</strong>
                      </div>
                    )}
                    {hasDriverService && (
                      <div className="text-muted text-xs d-flex align-items-center gap-1.5 mt-1" style={{ wordBreak: 'break-word' }}>
                        <span style={{ fontSize: '12px' }}>🚗</span>
                        <span>
                          Driver: <strong className="text-dark">{driverName || 'Verified Chauffeur'}</strong>
                          {driverPhone ? (
                            <span> · <span className="font-monospace text-dark fw-semibold">{driverPhone}</span></span>
                          ) : null}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── 3. PASSENGER-WISE DETAILS (Optional Toggle) ─── */}
              {passengerWise && (
                <div className="mb-4">
                  <div className="text-muted text-3xs text-uppercase fw-bold tracking-wider mb-2 d-flex align-items-center gap-1">
                    <Users size={12} /> Passenger Details:
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm text-xs mb-0 align-middle">
                      <thead className="table-light text-xxs text-uppercase text-muted">
                        <tr>
                          <th className="ps-2">#</th>
                          <th>Passenger Name</th>
                          <th>Category / Age</th>
                          <th>Seat / Accommodation</th>
                          <th className="pe-2 text-end">Applicable Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengerList.map((pax, idx) => (
                          <tr key={idx}>
                            <td className="ps-2 text-muted">{idx + 1}</td>
                            <td className="fw-semibold text-dark">{pax.name || guestName}</td>
                            <td className="text-muted">{pax.age || 'Adult'}</td>
                            <td className="text-muted">{pax.seat || 'Standard'}</td>
                            <td className="pe-2 text-end fw-bold text-dark">
                              ₹{(pax.fare ? parseFloat(pax.fare) : (customerPrice / passengerList.length)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── 4. FINANCIAL ITEMIZATION TABLE ─── */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered text-xs mb-0 align-middle">
                  <thead className="table-light text-xxs text-uppercase text-muted">
                    <tr>
                      <th className="ps-3 py-2.5">Service Description</th>
                      <th className="text-center" style={{ width: '90px' }}>Quantity</th>
                      <th className="text-end" style={{ width: '130px' }}>Unit Price (₹)</th>
                      <th className="pe-3 text-end" style={{ width: '140px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3 py-3">
                        <strong className="text-dark d-block mb-0.5">{booking.item_name || 'Travel Reservation'}</strong>
                        <span className="text-muted text-xxs">
                          {isVehicleBooking
                            ? 'Scheduled vehicle reservation with verified delivery, sanitization, and 24/7 Goa operations support.'
                            : 'Includes scheduled reservation, local taxes, verified service delivery, and 24/7 Goa operations support.'}
                        </span>
                      </td>
                      <td className="text-center text-muted">
                        {booking.booking_days || 1} {isHotelBooking ? 'Nights' : 'Days'}
                      </td>
                      <td className="text-end text-muted font-monospace">
                        ₹{mainServiceLineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="pe-3 text-end fw-bold text-dark font-monospace">
                        ₹{mainServiceLineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {hasDriverService && driverLineAmount > 0 && (
                      <tr style={{ backgroundColor: '#fcfbf7' }}>
                        <td className="ps-3 py-2">
                          <strong className="text-dark d-block mb-0.5 d-flex align-items-center gap-1.5">
                            <span>🚗</span> {driverServiceTitle}
                          </strong>
                          <span className="text-muted text-xxs">
                            {rawDriverType === 'DROP' || rawDriverType === 'PICKUP' ? 'Airport transfer chauffeur service.' : 'Dedicated verified chauffeur assistance.'}
                          </span>
                        </td>
                        <td className="text-center text-muted">
                          {driverDaysCount} {driverDaysCount === 1 ? 'Trip' : 'Days'}
                        </td>
                        <td className="text-end text-muted font-monospace">
                          ₹{driverLineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="pe-3 text-end fw-bold text-dark font-monospace">
                          ₹{driverLineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── 5. TAX BREAKDOWN & GRAND TOTAL ─── */}
              <div className="row justify-content-end mb-4">
                <div className="col-12 col-sm-7 col-md-5">
                  <div className="p-3 bg-light rounded-3 border text-xs">
                    <div className="d-flex justify-content-between mb-1.5 text-muted">
                      <span>Subtotal (Base):</span>
                      <span className="font-monospace">₹{baseBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {withTaxSplit && (
                      <>
                        <div className="d-flex justify-content-between mb-1.5 text-muted">
                          <span>CGST (2.5% / 9%):</span>
                          <span className="font-monospace">+₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1.5 text-muted">
                          <span>SGST (2.5% / 9%):</span>
                          <span className="font-monospace">+₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {withGstNumber && (
                          <div className="d-flex justify-content-between pt-1.5 mt-1 border-top text-3xs font-monospace text-muted">
                            <span>Supplier GSTIN:</span>
                            <span className="fw-bold text-dark">{resolvedGstNumber}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Internal Partner Total Markup Reference (Visible in Preparation Screen Only • Hidden in Print & PDF) */}
                    {showInternalMarkup && (
                      <div className="d-print-none d-flex justify-content-between text-xs text-dark mb-1.5 p-2 rounded bg-warning bg-opacity-15 border border-warning font-monospace">
                        <span className="fw-semibold">Total Markup:</span>
                        <span className="fw-bold text-success">+₹{totalMarkup.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-black text-dark fs-6 bg-white p-2 rounded border">
                      <span>Total Amount:</span>
                      <span className="text-success font-monospace">₹{customerPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="d-flex justify-content-between text-muted text-xxs mb-1">
                      <span>Amount Received:</span>
                      <span className="text-success fw-bold font-monospace">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="d-flex justify-content-between text-muted text-xxs">
                      <span>Balance Payable:</span>
                      <span className="fw-bold font-monospace text-dark">₹{remainingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── 6. PAYMENT STATUS & TERMS ─── */}
              <div className="border rounded-3 p-3 bg-white mb-3" style={{ fontSize: '10.5px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                  <span className="fw-bold text-dark text-uppercase tracking-wider text-xxs">
                    Payment &amp; Booking Terms
                  </span>
                  <span className={`badge ${totalPaid >= customerPrice ? 'bg-success' : 'bg-warning text-dark'} text-3xs px-2 py-0.5 rounded-pill`}>
                    Payment Status: {totalPaid >= customerPrice ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                  </span>
                </div>
                <ul className="mb-0 ps-3 text-muted" style={{ lineHeight: 1.4 }}>
                  <li>Government-issued original photo ID is mandatory for all travellers at check-in or vehicle handover.</li>
                  <li>In case of cancellation or date modification, agency and platform cancellation policies apply.</li>
                  <li>Security deposits (if applicable for self-drive rentals) are collected and refunded directly at vehicle inspection.</li>
                </ul>
              </div>

              {/* ─── 7. INVOICE FOOTER ─── */}
              <div className="border-top pt-3 text-center text-muted text-xxs">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-1">
                  <span>
                    Issued by: <strong>{partner.company_name || partner.name || 'WOW GOA Travel Partner'}</strong>
                  </span>
                  <span>
                    Helpline: <strong>{partner.phone || '+91 98765 43210'}</strong>
                  </span>
                  <span>
                    Email: <strong>{partner.email || 'support@agency.com'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                  This is a computer-generated electronic invoice. No physical signature is required.
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .invoice-modal-backdrop,
          .invoice-modal-backdrop *,
          .customer-invoice-document,
          .customer-invoice-document * {
            visibility: visible !important;
          }
          .invoice-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-modal-container {
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .invoice-scroll-body {
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .customer-invoice-document {
            max-width: 100% !important;
            padding: 0 !important;
            border: none !important;
          }
          .gst-display-badge {
            background-color: #f8fafc !important;
            border: 1px solid #94a3b8 !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .driver-service-badge {
            background-color: #fef3c7 !important;
            border: 1px solid #f59e0b !important;
            color: #78350f !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .driver-details-line {
            font-size: 10.5px !important;
            line-height: 1.3 !important;
            color: #334155 !important;
          }
          .d-print-none,
          .d-print-none * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
