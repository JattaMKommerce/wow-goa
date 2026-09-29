import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Plus, Edit2, Trash2, CheckCircle2, AlertCircle,
  HelpCircle, Clock, Percent, DollarSign, RefreshCw, Sparkles, X, Check
} from 'lucide-react';
import * as api from '../../services/api';

const DEFAULT_SAMPLE_RULES = [
  { minimum_hours_before: 168, maximum_hours_before: null, refund_percentage: 90, cancellation_charge_percentage: 10, rule_description: 'More than 7 days before service: 90% refund' },
  { minimum_hours_before: 72, maximum_hours_before: 168, refund_percentage: 75, cancellation_charge_percentage: 25, rule_description: '3–7 days before service: 75% refund' },
  { minimum_hours_before: 24, maximum_hours_before: 72, refund_percentage: 50, cancellation_charge_percentage: 50, rule_description: '1–3 days before service: 50% refund' },
  { minimum_hours_before: 0, maximum_hours_before: 24, refund_percentage: 25, cancellation_charge_percentage: 75, rule_description: 'Less than 24 hours before service: 25% refund' },
  { minimum_hours_before: -999999, maximum_hours_before: 0, refund_percentage: 0, cancellation_charge_percentage: 100, rule_description: 'After service starts: No refund' }
];

export default function VendorCancellationPolicyManager({ currentUser, serviceType = 'all' }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formId, setFormId] = useState('');
  const [formPolicyName, setFormPolicyName] = useState('Standard Cancellation Policy');
  const [formServiceType, setFormServiceType] = useState(serviceType || 'all');
  const [formAllowAfterStarts, setFormAllowAfterStarts] = useState(false);
  const [formStatus, setFormStatus] = useState('Active');
  const [formRules, setFormRules] = useState([...DEFAULT_SAMPLE_RULES]);

  const vendorId = currentUser?.vendor_id || currentUser?.id || 'vendor-1';

  const loadPolicies = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.fetchVendorCancellationPolicies(vendorId);
      setPolicies(data || []);
    } catch (err) {
      console.error("Failed to load cancellation policies:", err);
      setErrorMsg("Failed to load cancellation policies. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [vendorId]);

  const handleOpenCreate = () => {
    setFormId('');
    setFormPolicyName('Standard Cancellation Policy');
    setFormServiceType(serviceType || 'all');
    setFormAllowAfterStarts(false);
    setFormStatus('Active');
    setFormRules([...DEFAULT_SAMPLE_RULES]);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (policy) => {
    setFormId(policy.id);
    setFormPolicyName(policy.policy_name || '');
    setFormServiceType(policy.service_type || 'all');
    setFormAllowAfterStarts(Boolean(policy.allow_after_service_starts));
    setFormStatus(policy.status || 'Active');
    setFormRules(policy.rules && policy.rules.length > 0 ? policy.rules.map(r => ({
      ...r,
      refund_percentage: parseFloat(r.refund_percentage),
      cancellation_charge_percentage: parseFloat(r.cancellation_charge_percentage),
      minimum_hours_before: parseInt(r.minimum_hours_before, 10),
      maximum_hours_before: r.maximum_hours_before !== null && r.maximum_hours_before !== '' ? parseInt(r.maximum_hours_before, 10) : null
    })) : [...DEFAULT_SAMPLE_RULES]);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...formRules];
    updated[index][field] = value;
    if (field === 'refund_percentage') {
      const refund = Math.min(100, Math.max(0, parseFloat(value) || 0));
      updated[index].refund_percentage = refund;
      updated[index].cancellation_charge_percentage = Math.round((100 - refund) * 100) / 100;
    }
    setFormRules(updated);
  };

  const handleAddRule = () => {
    setFormRules([
      ...formRules,
      {
        minimum_hours_before: 0,
        maximum_hours_before: null,
        refund_percentage: 50,
        cancellation_charge_percentage: 50,
        rule_description: 'Custom cancellation rule'
      }
    ]);
  };

  const handleRemoveRule = (index) => {
    if (formRules.length <= 1) {
      alert("A policy must have at least one rule.");
      return;
    }
    setFormRules(formRules.filter((_, i) => i !== index));
  };

  const handleLoadTemplate = () => {
    setFormRules([...DEFAULT_SAMPLE_RULES]);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!formPolicyName.trim()) {
      setErrorMsg("Policy name is required.");
      return;
    }
    if (formRules.length === 0) {
      setErrorMsg("Please add at least one cancellation rule.");
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      await api.saveVendorCancellationPolicy({
        id: formId || undefined,
        vendor_id: vendorId,
        service_type: formServiceType,
        policy_name: formPolicyName.trim(),
        allow_after_service_starts: formAllowAfterStarts ? 1 : 0,
        status: formStatus,
        rules: formRules
      });
      setSuccessMsg("Cancellation policy saved successfully!");
      setShowModal(false);
      await loadPolicies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm("Are you sure you want to delete this cancellation policy? Existing bookings will retain their original saved snapshot.")) {
      return;
    }
    try {
      await api.deleteVendorCancellationPolicy(policyId, vendorId);
      setSuccessMsg("Policy removed successfully.");
      await loadPolicies();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message || "Failed to delete policy.");
    }
  };

  return (
    <div className="p-3 p-md-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 text-white" style={{ background: 'linear-gradient(135deg, #FF6333, #FF8A00)' }}>
              <ShieldAlert size={22} />
            </div>
            <h4 className="fw-bold text-dark mb-0 font-heading">Cancellation Policy Management</h4>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Define your service cancellation windows and customer refund tiers. Policies apply automatically to new bookings.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn text-white fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', fontSize: '0.88rem' }}
        >
          <Plus size={16} /> Create Cancellation Policy
        </button>
      </div>

      {/* Business Notice Box */}
      <div className="alert border-0 rounded-4 p-3 mb-4 shadow-xs" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
        <div className="d-flex align-items-start gap-2.5">
          <HelpCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="small text-dark">
            <span className="fw-bold">Platform Financial Policy:</span> WOW GOA collects a <strong>10% platform fee</strong> which is <strong>strictly non-refundable</strong> after successful booking & payment.
            Your cancellation refund percentages apply to your <strong>Vendor Service Amount (90% of total customer booking)</strong>.
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3 text-xs fw-semibold">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3 text-xs fw-semibold">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Policies List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading policies...</span>
          </div>
          <div className="text-muted small mt-2">Loading configured cancellation policies...</div>
        </div>
      ) : policies.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <ShieldAlert size={48} className="mx-auto text-muted mb-3 opacity-30" />
          <h5 className="fw-bold text-dark">No Cancellation Policy Configured</h5>
          <p className="text-muted small mb-3">
            You have not configured any custom cancellation policy yet. A default standard policy is currently active for your services.
          </p>
          <div>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary px-4 py-2 rounded-pill fw-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}
            >
              Configure Policy Now
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {policies.map((pol) => (
            <div key={pol.id} className="col-12">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold fs-6 text-dark font-heading">{pol.policy_name}</span>
                    <span className={`badge rounded-pill px-2.5 py-1 text-xs fw-bold ${pol.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                      {pol.status || 'Active'}
                    </span>
                    <span className="badge rounded-pill px-2.5 py-1 text-xs fw-semibold bg-light text-dark border">
                      Service: {pol.service_type === 'all' ? 'All Services' : pol.service_type.toUpperCase()}
                    </span>
                    {pol.allow_after_service_starts == 1 ? (
                      <span className="badge rounded-pill px-2.5 py-1 text-xs fw-semibold bg-info-subtle text-info">
                        Allowed After Start
                      </span>
                    ) : (
                      <span className="badge rounded-pill px-2.5 py-1 text-xs fw-semibold bg-danger-subtle text-danger">
                        No Refund After Start
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(pol)}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3 py-1 text-xs fw-bold"
                    >
                      <Edit2 size={13} /> Edit Policy
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(pol.id)}
                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-pill px-2.5 py-1 text-xs fw-bold"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="card-body p-4">
                  <h6 className="fw-bold text-xs text-muted text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
                    Configured Cancellation Rules & Refund Tiers
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                      <thead className="table-light text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <tr>
                          <th className="py-2 px-3">Time Window Before Service</th>
                          <th className="py-2 px-3">Rule Description</th>
                          <th className="py-2 px-3 text-center">Customer Refund</th>
                          <th className="py-2 px-3 text-center">Cancellation Retained</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pol.rules || []).map((r, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 fw-semibold text-dark">
                              {r.maximum_hours_before === null || r.maximum_hours_before === undefined ? (
                                <span className="d-flex align-items-center gap-1.5 text-primary">
                                  <Clock size={14} /> More than {Math.round(r.minimum_hours_before / 24)} days ({r.minimum_hours_before}+ hrs)
                                </span>
                              ) : r.minimum_hours_before <= 0 ? (
                                <span className="d-flex align-items-center gap-1.5 text-danger">
                                  <Clock size={14} /> Service Started (0 hrs)
                                </span>
                              ) : (
                                <span className="d-flex align-items-center gap-1.5 text-dark">
                                  <Clock size={14} /> {Math.round(r.minimum_hours_before / 24)}–{Math.round(r.maximum_hours_before / 24)} days ({r.minimum_hours_before}–{r.maximum_hours_before} hrs)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-muted">{r.rule_description}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="badge bg-success-subtle text-success fw-black px-2.5 py-1 fs-6">
                                {parseFloat(r.refund_percentage)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="badge bg-warning-subtle text-dark fw-bold px-2 py-1 text-xs">
                                {parseFloat(r.cancellation_charge_percentage || (100 - r.refund_percentage))}% Retained
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Policy Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white px-4 py-3" style={{ background: '#0D1B2E' }}>
                <div className="d-flex align-items-center gap-2">
                  <ShieldAlert size={20} className="text-warning" />
                  <h5 className="modal-title fw-bold text-white fs-6">
                    {formId ? 'Edit Cancellation Policy' : 'Create Cancellation Policy'}
                  </h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSavePolicy}>
                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {errorMsg && (
                    <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3">
                      {errorMsg}
                    </div>
                  )}

                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark text-uppercase">Policy Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3 fw-semibold"
                        placeholder="e.g. Standard Vehicle Cancellation Policy"
                        value={formPolicyName}
                        onChange={(e) => setFormPolicyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark text-uppercase">Applicable Service Type</label>
                      <select
                        className="form-select form-select-sm rounded-3 fw-semibold"
                        value={formServiceType}
                        onChange={(e) => setFormServiceType(e.target.value)}
                      >
                        <option value="all">All Services</option>
                        <option value="vehicle">Vehicle Rental (Cars & Bikes)</option>
                        <option value="hotel">Hotel Stay</option>
                        <option value="package">Holiday Packages</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark text-uppercase">Policy Status</label>
                      <select
                        className="form-select form-select-sm rounded-3 fw-semibold"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                      >
                        <option value="Active">Active (Applied to future bookings)</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6 d-flex align-items-center pt-md-4">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="allowAfterStartsSwitch"
                          checked={formAllowAfterStarts}
                          onChange={(e) => setFormAllowAfterStarts(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label text-xs fw-bold text-dark ms-2" htmlFor="allowAfterStartsSwitch" style={{ cursor: 'pointer' }}>
                          Allow cancellation after service starts?
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Rules Builder Section */}
                  <div className="border-top pt-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-6">Cancellation Time Windows & Refund Rules</h6>
                        <p className="text-muted text-xxs mb-0">Percentage refunded to customer from vendor service amount.</p>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadTemplate}
                          className="btn btn-sm btn-outline-warning text-dark fw-bold rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1"
                        >
                          <Sparkles size={13} className="text-warning" /> Load Sample Template
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRule}
                          className="btn btn-sm btn-dark rounded-pill px-3 py-1 text-xs fw-bold d-flex align-items-center gap-1"
                        >
                          <Plus size={13} /> Add Rule Tier
                        </button>
                      </div>
                    </div>

                    <div className="d-flex flex-column gap-2.5">
                      {formRules.map((rule, idx) => (
                        <div key={idx} className="p-3 rounded-3 border bg-light">
                          <div className="row g-2 align-items-center">
                            <div className="col-12 col-md-3">
                              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Min Hours Before</label>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control rounded-start-2 fw-semibold"
                                  placeholder="e.g. 168"
                                  value={rule.minimum_hours_before}
                                  onChange={(e) => handleRuleChange(idx, 'minimum_hours_before', parseInt(e.target.value, 10) || 0)}
                                  required
                                />
                                <span className="input-group-text text-xxs bg-white text-muted">hrs</span>
                              </div>
                            </div>

                            <div className="col-12 col-md-3">
                              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Max Hours (Optional)</label>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control rounded-start-2 fw-semibold"
                                  placeholder="Leave blank for > min"
                                  value={rule.maximum_hours_before !== null && rule.maximum_hours_before !== undefined ? rule.maximum_hours_before : ''}
                                  onChange={(e) => handleRuleChange(idx, 'maximum_hours_before', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                />
                                <span className="input-group-text text-xxs bg-white text-muted">hrs</span>
                              </div>
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label text-xxs fw-bold text-success text-uppercase mb-1">Refund %</label>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="form-control rounded-start-2 fw-bold text-success"
                                  value={rule.refund_percentage}
                                  onChange={(e) => handleRuleChange(idx, 'refund_percentage', e.target.value)}
                                  required
                                />
                                <span className="input-group-text text-xxs bg-white text-muted">%</span>
                              </div>
                            </div>

                            <div className="col-6 col-md-2">
                              <label className="form-label text-xxs fw-bold text-warning text-uppercase mb-1">Retained %</label>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control rounded-start-2 fw-bold text-muted bg-white"
                                  value={rule.cancellation_charge_percentage}
                                  disabled
                                />
                                <span className="input-group-text text-xxs bg-white text-muted">%</span>
                              </div>
                            </div>

                            <div className="col-12 col-md-2 d-flex justify-content-end pt-2 pt-md-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveRule(idx)}
                                className="btn btn-sm btn-outline-danger border-0 p-1"
                                title="Delete Rule"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="col-12 mt-1">
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-2 text-xs"
                                placeholder="Rule description displayed to customer (e.g. More than 7 days: 90% refund)"
                                value={rule.rule_description}
                                onChange={(e) => handleRuleChange(idx, 'rule_description', e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4 text-xs fw-bold" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn text-white rounded-pill px-5 text-xs fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)' }}
                  >
                    {saving ? 'Saving...' : 'Save & Publish Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
