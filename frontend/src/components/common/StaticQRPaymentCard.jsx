import React, { useState } from 'react';
import { QrCode, Copy, Check, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export default function StaticQRPaymentCard({
  amount = 0,
  upiId = '',
  accountName = '',
  paymentReference = '',
  onReferenceChange,
  paymentScreenshot = '',
  onScreenshotChange,
  serviceTitle = '',
  vendorName = '',
  qrImageUrl = '',
  instructions = '',
  isNotConfigured = false
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  // If vendor has no QR image and no UPI ID, or explicitly marked unconfigured
  const hasValidPaymentMethod = !isNotConfigured && Boolean((qrImageUrl && qrImageUrl.trim()) || (upiId && upiId.trim()));

  if (!hasValidPaymentMethod) {
    return (
      <div className="card shadow-sm border border-warning rounded-4 overflow-hidden mb-3" style={{ background: '#fffbeb' }}>
        <div className="card-body p-4 text-center">
          <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-25 text-warning mb-3">
            <AlertCircle size={32} />
          </div>
          <h6 className="fw-bold text-dark mb-2">Vendor Payment Notice</h6>
          <div className="alert alert-warning border border-warning d-inline-block text-start mb-0 py-2.5 px-3" style={{ maxWidth: '460px', fontSize: '0.88rem' }}>
            <strong>Vendor payment QR is not configured. Please contact support.</strong>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyId = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyAmt = () => {
    navigator.clipboard.writeText(String(amount));
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 2000);
  };

  const effectiveDisplayName = vendorName || accountName || 'Vendor';
  const upiPayload = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName || effectiveDisplayName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(serviceTitle || 'Booking Payment')}` : '';

  return (
    <div className="card shadow-sm border rounded-4 overflow-hidden mb-3" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
      {/* Header */}
      <div className="px-4 py-3 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1a2f4c 100%)' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1.5 rounded-3 bg-white bg-opacity-10 text-warning">
            <QrCode size={18} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '13px', letterSpacing: '0.3px' }}>
              {effectiveDisplayName} Payment QR
            </div>
            <div className="text-white-50" style={{ fontSize: '10.5px' }}>Direct Payment to Vendor Account • Verified Partner</div>
          </div>
        </div>
        <span className="badge d-flex align-items-center gap-1 px-2.5 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '10px' }}>
          <ShieldCheck size={12} /> Direct Vendor Payment
        </span>
      </div>

      <div className="card-body p-4 text-center">
        {/* QR Code Container */}
        <div className="d-inline-block p-3 rounded-4 bg-white shadow-sm mb-3 border position-relative" style={{ borderColor: '#cbd5e1' }}>
          {qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt={`${effectiveDisplayName} Payment QR`}
              className="d-block mx-auto rounded-3"
              style={{ width: '180px', height: '180px', objectFit: 'contain' }}
            />
          ) : upiId ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}`}
              alt={`${effectiveDisplayName} UPI QR`}
              className="d-block mx-auto rounded-3"
              style={{ width: '180px', height: '180px', objectFit: 'contain' }}
            />
          ) : null}
          <div className="mt-2 d-flex align-items-center justify-content-center gap-1 text-muted" style={{ fontSize: '10px' }}>
            <span>Scan via</span>
            <strong className="text-dark">GPay • PhonePe • Paytm • BHIM • UPI</strong>
          </div>
        </div>

        {/* Instructions if provided by vendor */}
        {instructions && (
          <div className="alert alert-info border-0 p-2 mb-3 text-start small d-flex align-items-center gap-2" style={{ background: '#f0f9ff', color: '#0369a1', fontSize: '11px' }}>
            <Info size={14} className="flex-shrink-0" />
            <span>{instructions}</span>
          </div>
        )}

        {/* Amount & UPI ID Display */}
        <div className="row g-2 mb-3">
          <div className="col-sm-6">
            <div className="p-2.5 rounded-3 bg-light border text-start">
              <span className="text-muted d-block text-xxs fw-bold text-uppercase">Payable Amount</span>
              <div className="d-flex align-items-center justify-content-between mt-0.5">
                <span className="fw-black text-dark font-heading" style={{ fontSize: '15px' }}>
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none text-primary d-flex align-items-center gap-0.5"
                  onClick={handleCopyAmt}
                  style={{ fontSize: '11px' }}
                >
                  {copiedAmt ? <><Check size={12} className="text-success" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-2.5 rounded-3 bg-light border text-start">
              <span className="text-muted d-block text-xxs fw-bold text-uppercase">Vendor UPI ID</span>
              <div className="d-flex align-items-center justify-content-between mt-0.5">
                <span className="fw-bold text-dark font-monospace text-truncate me-1" style={{ fontSize: '13px' }}>
                  {upiId || accountName || 'Direct QR Scan'}
                </span>
                {upiId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none text-primary d-flex align-items-center gap-0.5 flex-shrink-0"
                    onClick={handleCopyId}
                    style={{ fontSize: '11px' }}
                  >
                    {copiedId ? <><Check size={12} className="text-success" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* UTR Input Section */}
        <div className="p-3 rounded-3 text-start mb-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <label className="form-label fw-bold text-dark mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
            <span>UPI Transaction Reference / UTR Number <span className="text-danger">*</span></span>
            <span className="text-muted fw-normal text-xxs">(12-digit Bank Ref / UTR)</span>
          </label>
          <input
            type="text"
            className="form-control form-control-sm font-monospace fw-bold"
            placeholder="e.g. 423589123456"
            value={paymentReference}
            onChange={(e) => onReferenceChange && onReferenceChange(e.target.value.trim())}
            required
            maxLength={30}
            style={{ fontSize: '13px', letterSpacing: '1px' }}
          />
          <div className="d-flex align-items-center gap-1.5 mt-1.5 text-muted" style={{ fontSize: '10.5px' }}>
            <AlertCircle size={12} className="text-warning flex-shrink-0" />
            <span>After scanning the vendor's QR and paying ₹{Number(amount).toLocaleString('en-IN')}, paste your 12-digit UPI UTR number here. The vendor verifies this reference to confirm your booking.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
