import React, { useState } from 'react';
import { QrCode, Copy, Check, ShieldCheck, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';

export default function StaticQRPaymentCard({
  amount = 0,
  upiId = 'wowgoa@upi',
  accountName = 'WOW GOA Tourism / TripGalileo',
  paymentReference = '',
  onReferenceChange,
  paymentScreenshot = '',
  onScreenshotChange,
  serviceTitle = ''
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyAmt = () => {
    navigator.clipboard.writeText(String(amount));
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 2000);
  };

  // Generate SVG QR Code pattern for UPI payment
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(serviceTitle || 'WOW GOA Booking')}`;

  return (
    <div className="card shadow-sm border rounded-4 overflow-hidden mb-3" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
      {/* Header */}
      <div className="px-4 py-3 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1a2f4c 100%)' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1.5 rounded-3 bg-white bg-opacity-10 text-warning">
            <QrCode size={18} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '13px', letterSpacing: '0.3px' }}>WOW GOA Static QR Payment</div>
            <div className="text-white-50" style={{ fontSize: '10.5px' }}>Official Direct UPI Account • Instant Confirmation</div>
          </div>
        </div>
        <span className="badge d-flex align-items-center gap-1 px-2.5 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '10px' }}>
          <ShieldCheck size={12} /> Verified Merchant
        </span>
      </div>

      <div className="card-body p-4 text-center">
        {/* QR Code Container */}
        <div className="d-inline-block p-3 rounded-4 bg-white shadow-sm mb-3 border position-relative" style={{ borderColor: '#cbd5e1' }}>
          {/* Custom crisp SVG UPI QR Code graphic */}
          <svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="d-block">
            {/* Background */}
            <rect width="170" height="170" rx="8" fill="#ffffff"/>
            
            {/* Position markers (Top-Left, Top-Right, Bottom-Left) */}
            {/* Top-Left */}
            <rect x="14" y="14" width="38" height="38" rx="6" fill="#0D1B2E"/>
            <rect x="20" y="20" width="26" height="26" rx="3" fill="#ffffff"/>
            <rect x="26" y="26" width="14" height="14" rx="2" fill="#FF6333"/>
            
            {/* Top-Right */}
            <rect x="118" y="14" width="38" height="38" rx="6" fill="#0D1B2E"/>
            <rect x="124" y="20" width="26" height="26" rx="3" fill="#ffffff"/>
            <rect x="130" y="26" width="14" height="14" rx="2" fill="#FF6333"/>
            
            {/* Bottom-Left */}
            <rect x="14" y="118" width="38" height="38" rx="6" fill="#0D1B2E"/>
            <rect x="20" y="124" width="26" height="26" rx="3" fill="#ffffff"/>
            <rect x="26" y="130" width="14" height="14" rx="2" fill="#FF6333"/>

            {/* Stylized QR Matrix Pattern */}
            <rect x="62" y="18" width="8" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="76" y="18" width="16" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="98" y="18" width="8" height="8" rx="1.5" fill="#0D1B2E"/>

            <rect x="62" y="32" width="18" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="86" y="32" width="12" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="104" y="32" width="8" height="8" rx="1.5" fill="#0D1B2E"/>

            <rect x="62" y="46" width="10" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="78" y="46" width="20" height="8" rx="1.5" fill="#0D1B2E"/>
            
            {/* Middle Section */}
            <rect x="18" y="62" width="8" height="16" rx="1.5" fill="#0D1B2E"/>
            <rect x="32" y="62" width="14" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="52" y="62" width="12" height="14" rx="1.5" fill="#0D1B2E"/>
            
            {/* Center Brand Badge */}
            <rect x="68" y="68" width="34" height="34" rx="8" fill="#0D1B2E" stroke="#FF6333" strokeWidth="2"/>
            <text x="85" y="84" textAnchor="middle" fill="#FF6333" fontSize="8" fontWeight="bold" fontFamily="sans-serif">WOW</text>
            <text x="85" y="94" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">GOA</text>

            <rect x="108" y="62" width="18" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="132" y="62" width="18" height="16" rx="1.5" fill="#0D1B2E"/>
            <rect x="114" y="76" width="12" height="14" rx="1.5" fill="#0D1B2E"/>

            <rect x="18" y="84" width="18" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="42" y="82" width="18" height="18" rx="1.5" fill="#0D1B2E"/>

            {/* Bottom-Right & Alignment */}
            <rect x="62" y="108" width="14" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="82" y="108" width="16" height="14" rx="1.5" fill="#0D1B2E"/>
            <rect x="104" y="108" width="14" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="124" y="108" width="14" height="18" rx="1.5" fill="#0D1B2E"/>
            <rect x="144" y="108" width="8" height="8" rx="1.5" fill="#0D1B2E"/>

            <rect x="62" y="128" width="20" height="8" rx="1.5" fill="#0D1B2E"/>
            <rect x="88" y="128" width="12" height="18" rx="1.5" fill="#0D1B2E"/>
            <rect x="106" y="122" width="14" height="24" rx="1.5" fill="#0D1B2E"/>
            <rect x="126" y="132" width="26" height="8" rx="1.5" fill="#0D1B2E"/>

            <rect x="62" y="142" width="10" height="14" rx="1.5" fill="#0D1B2E"/>
            <rect x="78" y="142" width="22" height="10" rx="1.5" fill="#0D1B2E"/>
            <rect x="126" y="146" width="20" height="10" rx="1.5" fill="#0D1B2E"/>
          </svg>
          <div className="mt-1 d-flex align-items-center justify-content-center gap-1 text-muted" style={{ fontSize: '10px' }}>
            <span>Scan via</span>
            <strong className="text-dark">GPay • PhonePe • Paytm • BHIM</strong>
          </div>
        </div>

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
              <span className="text-muted d-block text-xxs fw-bold text-uppercase">Official UPI ID</span>
              <div className="d-flex align-items-center justify-content-between mt-0.5">
                <span className="fw-bold text-dark font-monospace text-truncate me-1" style={{ fontSize: '13px' }}>
                  {upiId}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none text-primary d-flex align-items-center gap-0.5 flex-shrink-0"
                  onClick={handleCopyId}
                  style={{ fontSize: '11px' }}
                >
                  {copiedId ? <><Check size={12} className="text-success" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
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
            <span>After scanning the QR and paying ₹{Number(amount).toLocaleString('en-IN')}, paste your 12-digit UPI UTR number here. Admin verifies this reference to confirm your booking.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
