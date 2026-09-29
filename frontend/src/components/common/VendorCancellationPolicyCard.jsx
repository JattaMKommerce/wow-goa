import React from 'react';
import { ShieldAlert, CheckCircle, Info, ChevronRight, AlertTriangle } from 'lucide-react';

export default function VendorCancellationPolicyCard({
  policy,
  agreed = false,
  onAgreementChange,
  customerPayment = 0
}) {
  const rules = policy?.rules || [];
  const vendorAmountEstimate = Math.round(customerPayment * 0.90);
  const platformFeeEstimate = Math.round(customerPayment * 0.10);

  return (
    <div className="card shadow-sm border rounded-3 mb-3 overflow-hidden text-start" style={{ background: '#ffffff', borderColor: '#fed7aa' }}>
      <div className="px-3 py-2.5 d-flex align-items-center justify-content-between" style={{ background: '#fff7ed', borderBottom: '1px solid #ffedd5' }}>
        <div className="d-flex align-items-center gap-2">
          <ShieldAlert size={16} className="text-warning flex-shrink-0" />
          <div>
            <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>
              Cancellation Policy ({policy?.policy_name || 'Vendor Standard Policy'})
            </span>
            <span className="text-muted d-block text-xxs">
              Vendor-controlled refund schedule
            </span>
          </div>
        </div>
        <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-1 rounded-pill">
          Vendor Terms
        </span>
      </div>

      <div className="card-body p-3">
        {/* Rules Table / List */}
        <div className="mb-2">
          {rules.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle mb-2 text-xxs" style={{ borderColor: '#fed7aa' }}>
                <thead style={{ background: '#fffbeb' }}>
                  <tr>
                    <th className="py-1 px-2 text-dark">Cancellation Notice Window</th>
                    <th className="py-1 px-2 text-center text-dark">Vendor Refund %</th>
                    {customerPayment > 0 && <th className="py-1 px-2 text-end text-dark">Est. Refund</th>}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => {
                    let windowDesc = rule.rule_description;
                    if (!windowDesc) {
                      if (rule.maximum_hours_before === null || rule.maximum_hours_before === undefined) {
                        windowDesc = `More than ${rule.minimum_hours_before} hours before service`;
                      } else {
                        windowDesc = `${rule.minimum_hours_before} to ${rule.maximum_hours_before} hours before service`;
                      }
                    }
                    const refundAmt = Math.round(vendorAmountEstimate * (parseFloat(rule.refund_percentage || 0) / 100.0));

                    return (
                      <tr key={rule.id || idx}>
                        <td className="py-1 px-2 text-muted fw-semibold">{windowDesc}</td>
                        <td className="py-1 px-2 text-center">
                          <span className={`badge ${parseFloat(rule.refund_percentage) > 0 ? 'bg-success text-white' : 'bg-danger text-white'} text-xxs`}>
                            {parseFloat(rule.refund_percentage)}%
                          </span>
                        </td>
                        {customerPayment > 0 && (
                          <td className="py-1 px-2 text-end fw-bold text-success">
                            ₹{refundAmt.toLocaleString('en-IN')}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-2 rounded bg-light text-muted text-xxs mb-2">
              Standard Vendor Policy: 100% refund if cancelled &gt; 48 hours prior to service; 50% refund between 24–48 hours; non-refundable under 24 hours.
            </div>
          )}
        </div>

        {/* Platform Fee Non-Refundable Banner */}
        <div className="p-2 rounded-2 mb-2.5 d-flex align-items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b' }}>
          <AlertTriangle size={15} className="text-danger flex-shrink-0 mt-0.5" />
          <div style={{ fontSize: '10.5px', lineHeight: '1.4' }}>
            <strong>Important Policy Notice:</strong> WOW GOA's platform fee (10%
            {customerPayment > 0 ? ` = ₹${platformFeeEstimate.toLocaleString('en-IN')}` : ''}) is <strong>strictly non-refundable</strong> after successful booking/payment. Refund percentages are calculated exclusively on the <strong>Vendor Service Amount (90%{customerPayment > 0 ? ` = ₹${vendorAmountEstimate.toLocaleString('en-IN')}` : ''})</strong>.
          </div>
        </div>

        {/* Mandatory Agreement Checkbox */}
        <div className="form-check d-flex align-items-start gap-2 mb-0">
          <input
            className="form-check-input mt-0.5 flex-shrink-0"
            type="checkbox"
            id="cancellationPolicyAgreeCheckbox"
            checked={agreed}
            onChange={(e) => onAgreementChange && onAgreementChange(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            required
          />
          <label className="form-check-label text-dark fw-bold" htmlFor="cancellationPolicyAgreeCheckbox" style={{ fontSize: '11px', cursor: 'pointer' }}>
            I have read and agree to the vendor cancellation policy and platform terms. <span className="text-danger">*</span>
          </label>
        </div>
      </div>
    </div>
  );
}
