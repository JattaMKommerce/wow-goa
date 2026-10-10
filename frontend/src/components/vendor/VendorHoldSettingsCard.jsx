import React, { useState, useEffect } from 'react';
import { ShieldCheck, Percent, DollarSign, Calendar, Clock, CheckCircle2, AlertCircle, Info, Sparkles, RefreshCw, Layers } from 'lucide-react';
import * as api from '../../services/api';

export default function VendorHoldSettingsCard({ currentUser, vendorId: propVendorId, onSaved }) {
  const effectiveVendorId = propVendorId || currentUser?.vendor_id || currentUser?.id || 'u-4';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [allowHold, setAllowHold] = useState(true);
  const [holdType, setHoldType] = useState('percentage'); // 'percentage' | 'fixed'
  const [holdValue, setHoldValue] = useState(20);
  const [holdDuePolicy, setHoldDuePolicy] = useState('checkin');
  const [minBookingAmount, setMinBookingAmount] = useState(500);

  // Interactive Live Preview State (allows vendor to click & test both options)
  const [previewMode, setPreviewMode] = useState('hold'); // 'hold' | 'full'

  // Load existing settings
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await api.fetchVendorHoldSettings(effectiveVendorId);
        if (isMounted && data) {
          setAllowHold(data.allow_hold_booking !== 0);
          setHoldType(data.hold_type || 'percentage');
          setHoldValue(data.hold_value !== undefined ? Number(data.hold_value) : 20);
          setHoldDuePolicy(data.hold_due_policy || 'checkin');
          setMinBookingAmount(data.min_booking_amount !== undefined ? Number(data.min_booking_amount) : 500);
        }
      } catch (err) {
        console.warn("Could not load hold settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, [effectiveVendorId]);

  // Handle Save
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        vendor_id: effectiveVendorId,
        allow_hold_booking: allowHold ? 1 : 0,
        hold_type: holdType,
        hold_value: Number(holdValue) || 20,
        hold_due_policy: holdDuePolicy,
        min_booking_amount: Number(minBookingAmount) || 500
      };

      const res = await api.saveVendorHoldSettings(payload);
      if (res?.success) {
        setSuccessMsg("Hold booking settings successfully updated!");
        if (onSaved) onSaved(res.settings);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(res?.error || "Failed to update hold settings.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Simulation calculations
  const sampleTotal = 10000;
  const simulatedHoldAmount = holdType === 'percentage'
    ? Math.round(sampleTotal * (Math.min(100, Math.max(1, holdValue)) / 100))
    : Math.min(sampleTotal, Math.max(100, Number(holdValue)));
  const simulatedRemaining = Math.max(0, sampleTotal - simulatedHoldAmount);

  const getPolicyLabel = (key) => {
    switch (key) {
      case 'checkin': return 'At Check-in / Delivery';
      case '24h_before': return '24 Hours Before Pickup / Arrival';
      case '48h_before': return '48 Hours Before Pickup / Arrival';
      case '7d_before': return '7 Days Before Pickup / Arrival';
      default: return 'At Check-in';
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
        <div className="spinner-border spinner-border-sm text-primary mx-auto mb-2" role="status" />
        <div className="text-muted small">Loading Hold Booking settings...</div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
      {/* Header */}
      <div className="p-4 border-bottom bg-gradient" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <ShieldCheck size={24} className="text-info" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-white">Hold Booking & Token Advance Settings</h5>
                <span className="badge rounded-pill bg-info text-dark fw-bold px-2.5 py-1" style={{ fontSize: '0.65rem' }}>
                  MMT Standard
                </span>
              </div>
              <p className="mb-0 text-white-50 small mt-0.5">
                Allow customers to lock & reserve your inventory by paying a token amount upfront.
              </p>
            </div>
          </div>
          <div className="form-check form-switch fs-5 mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="holdToggle"
              checked={allowHold}
              onChange={(e) => setAllowHold(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Status Alert Banner */}
        {successMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-4" role="alert">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <div className="small fw-semibold">{successMsg}</div>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-4" role="alert">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div className="small fw-semibold">{errorMsg}</div>
          </div>
        )}

        {!allowHold ? (
          <div className="text-center py-4 px-3 rounded-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={32} className="text-secondary mx-auto mb-2 opacity-75" />
            <h6 className="fw-bold text-dark mb-1">Hold Booking Option is Disabled</h6>
            <p className="text-muted small mb-3" style={{ maxWidth: '480px', margin: '0 auto' }}>
              Customers booking your inventory must pay 100% of the booking total upfront. Turn the switch above ON to allow partial token advance reservations.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold"
              onClick={() => setAllowHold(true)}
            >
              Enable Hold Booking Option
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="row g-4">
              {/* Left Column: Configuration Controls */}
              <div className="col-lg-7">
                {/* 1. Hold Type Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small mb-2 d-flex align-items-center gap-1.5">
                    <Layers size={15} className="text-primary" />
                    <span>Hold Amount Type</span>
                  </label>
                  <div className="d-grid d-sm-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm py-2 px-3 rounded-3 flex-fill d-flex align-items-center justify-content-center gap-2 fw-semibold ${
                        holdType === 'percentage' ? 'btn-primary text-white shadow-sm' : 'btn-light border text-secondary'
                      }`}
                      onClick={() => {
                        setHoldType('percentage');
                        if (holdValue > 100) setHoldValue(20);
                      }}
                    >
                      <Percent size={15} /> Percentage of Total (%)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm py-2 px-3 rounded-3 flex-fill d-flex align-items-center justify-content-center gap-2 fw-semibold ${
                        holdType === 'fixed' ? 'btn-primary text-white shadow-sm' : 'btn-light border text-secondary'
                      }`}
                      onClick={() => {
                        setHoldType('fixed');
                        if (holdValue < 100) setHoldValue(1500);
                      }}
                    >
                      <DollarSign size={15} /> Fixed Flat Amount (₹)
                    </button>
                  </div>
                </div>

                {/* 2. Hold Value Input & Quick Pills */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold text-dark small mb-0">
                      {holdType === 'percentage' ? 'Hold Percentage (%)' : 'Fixed Token Amount (₹)'}
                    </label>
                    <span className="text-muted text-xs">
                      {holdType === 'percentage' ? 'Recommended: 20% – 25%' : 'Recommended: ₹1,000 – ₹2,500'}
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">
                      {holdType === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      className="form-control fw-bold"
                      min={holdType === 'percentage' ? 5 : 100}
                      max={holdType === 'percentage' ? 90 : 50000}
                      step={holdType === 'percentage' ? 5 : 100}
                      value={holdValue}
                      onChange={(e) => setHoldValue(Number(e.target.value))}
                      required
                    />
                  </div>

                  {/* Quick Select Pills */}
                  <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-muted text-xxs me-1">Quick Select:</span>
                    {(holdType === 'percentage' ? [10, 15, 20, 25, 30] : [500, 1000, 1500, 2000, 3000]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`btn btn-xs py-0.5 px-2 rounded-pill fw-semibold ${
                          holdValue === val ? 'btn-dark text-white' : 'btn-outline-secondary'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => setHoldValue(val)}
                      >
                        {holdType === 'percentage' ? `${val}%` : `₹${val}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Balance Due Policy */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small mb-1 d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-primary" />
                    <span>Remaining Balance Collection Schedule</span>
                  </label>
                  <select
                    className="form-select fw-semibold"
                    value={holdDuePolicy}
                    onChange={(e) => setHoldDuePolicy(e.target.value)}
                  >
                    <option value="checkin">At Check-in / Delivery (Recommended - Maximum Conversion)</option>
                    <option value="24h_before">24 Hours Before Pickup / Check-in</option>
                    <option value="48h_before">48 Hours Before Pickup / Check-in</option>
                    <option value="7d_before">7 Days Before Pickup / Check-in</option>
                  </select>
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    Customer vouchers and invoices will clearly state when the remaining balance must be cleared.
                  </div>
                </div>

                {/* 4. Minimum Booking Amount */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1 d-flex align-items-center gap-1.5">
                    <Clock size={15} className="text-primary" />
                    <span>Minimum Booking Amount to Offer Hold (₹)</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="100"
                    step="100"
                    value={minBookingAmount}
                    onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                  />
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    Only bookings with a total cost at or above this amount will display the partial Hold option.
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Customer Checkout Preview */}
              <div className="col-lg-5">
                <div className="p-3.5 rounded-4 border bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-1 text-primary fw-bold small">
                        <Sparkles size={14} />
                        <span>Live Customer Checkout Preview</span>
                      </div>
                      <span className="badge bg-white text-muted border px-2 py-0.5 rounded-pill" style={{ fontSize: '0.65rem' }}>
                        Customer View
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2.5">
                      <p className="text-muted text-xs mb-0">
                        Live checkout simulation (Click either option to test):
                      </p>
                      <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill text-3xs">
                        Interactive
                      </span>
                    </div>

                    {/* Simulated Choice 1: Pay Full Amount */}
                    <div
                      className={`p-3 rounded-3 border mb-2.5 shadow-xs transition-all ${
                        previewMode === 'full'
                          ? 'border-primary bg-primary-subtle shadow-sm'
                          : 'border-light-subtle bg-white opacity-85'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease', borderWidth: previewMode === 'full' ? '2px' : '1px' }}
                      onClick={() => setPreviewMode('full')}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-start gap-2.5">
                          <input
                            type="radio"
                            name="vendorPreviewPaymentMode"
                            checked={previewMode === 'full'}
                            onChange={() => setPreviewMode('full')}
                            className="form-check-input mt-0.5"
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 flex-wrap">
                              <span>Pay Full Amount</span>
                              <span className="badge bg-success text-white rounded-pill px-1.5 py-0.2" style={{ fontSize: '0.60rem' }}>
                                100% CONFIRMED
                              </span>
                            </div>
                            <div className="text-muted text-3xs mt-0.5">
                              Instant 100% confirmation. Zero remaining balance at check-in.
                            </div>
                          </div>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <div className="fw-bold text-dark text-sm font-monospace">₹{sampleTotal.toLocaleString('en-IN')}</div>
                          <div className="text-success text-3xs fw-bold">Pay Today</div>
                        </div>
                      </div>

                      {previewMode === 'full' && (
                        <div className="border-top border-primary-subtle pt-2 mt-2 d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                          <span>Remaining Balance Due:</span>
                          <span className="fw-bold text-success font-monospace">₹0 (Zero Dues)</span>
                        </div>
                      )}
                    </div>

                    {/* Simulated Choice 2: Hold Booking */}
                    <div
                      className={`p-3 rounded-3 border mb-3 shadow-xs transition-all ${
                        previewMode === 'hold'
                          ? 'border-primary bg-primary-subtle shadow-sm'
                          : 'border-light-subtle bg-white opacity-85'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease', borderWidth: previewMode === 'hold' ? '2px' : '1px' }}
                      onClick={() => setPreviewMode('hold')}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-start gap-2.5">
                          <input
                            type="radio"
                            name="vendorPreviewPaymentMode"
                            checked={previewMode === 'hold'}
                            onChange={() => setPreviewMode('hold')}
                            className="form-check-input mt-0.5"
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div className="fw-bold text-primary text-xs d-flex align-items-center gap-1.5 flex-wrap">
                              <span>Hold Booking by paying {holdType === 'percentage' ? `${holdValue}%` : `₹${holdValue}`}</span>
                              <span className="badge bg-primary text-white rounded-pill px-1.5 py-0.2" style={{ fontSize: '0.60rem' }}>
                                POPULAR
                              </span>
                            </div>
                            <div className="text-muted text-3xs mt-0.5">
                              Reserve slot now. Pay remainder {getPolicyLabel(holdDuePolicy).toLowerCase()}.
                            </div>
                          </div>
                        </div>
                        <div className="text-end flex-shrink-0">
                          <div className="fw-bold text-primary text-sm font-monospace">₹{simulatedHoldAmount.toLocaleString('en-IN')}</div>
                          <div className="text-success text-3xs fw-bold">Pay Today</div>
                        </div>
                      </div>

                      <div className="border-top border-primary-subtle pt-2 mt-2 d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                        <span>Remaining Balance Due:</span>
                        <span className="fw-bold text-dark font-monospace">₹{simulatedRemaining.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Benefit Box */}
                    <div className="p-2.5 rounded-3 bg-white border d-flex align-items-start gap-2">
                      <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
                      <div className="text-muted text-3xs" style={{ lineHeight: '1.4' }}>
                        <strong>Why this works:</strong> Customers are <strong>35% more likely</strong> to complete their booking immediately when offered a low token hold option!
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="mt-4 pt-2 border-top">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary w-100 py-2.5 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={16} className="spinner-border spinner-border-sm" />
                          <span>Saving Settings...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Save & Apply Hold Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
