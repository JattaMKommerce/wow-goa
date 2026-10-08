import React, { useState } from 'react';
import { 
  Building2, User, Phone, Mail, MapPin, ShieldCheck, Gift, Tag, 
  Wallet, CreditCard, Clock, AlertCircle, CheckCircle2, ArrowRight, Lock, Check
} from 'lucide-react';
import * as api from '../../services/api';
import B2BModalPortal from '../../components/b2b/B2BModalPortal';

export default function B2BProfileTab({ partnerUser, onLogout, onPartnerRefresh }) {
  if (!partnerUser) return null;

  const hasCommission = Boolean(partnerUser.allow_commission);
  const hasNonCommission = Boolean(partnerUser.allow_non_commission);

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestError, setRequestError] = useState('');

  // Local state for mode request to reflect instantly
  const [localReqStatus, setLocalReqStatus] = useState(partnerUser.mode_request_status || null);
  const [localReqMode, setLocalReqMode] = useState(partnerUser.requested_mode || null);

  const isPendingRequest = (localReqStatus === 'PENDING' && localReqMode);

  const handleRequestMode = async (modeToRequest) => {
    setRequestLoading(true);
    setRequestMsg('');
    setRequestError('');
    try {
      const res = await api.b2bRequestMode(partnerUser.id, modeToRequest);
      if (res && res.success) {
        setLocalReqStatus('PENDING');
        setLocalReqMode(modeToRequest);
        setRequestMsg(`Request for ${modeToRequest === 'COMMISSION' ? 'Commission' : 'Non-Commission Net'} mode submitted successfully! It is now pending Admin approval.`);
        if (onPartnerRefresh) onPartnerRefresh();
      } else {
        setRequestError(res.error || 'Failed to submit mode change request.');
      }
    } catch (err) {
      setRequestError(err.message || 'Error submitting mode request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    company_name: partnerUser.company_name || '',
    name: partnerUser.name || '',
    phone: partnerUser.phone || '',
    email: partnerUser.email || '',
    address: partnerUser.address || '',
    gst_number: partnerUser.gst_number || '',
    logo_url: partnerUser.logo_url || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveSuccess('');
    setProfileSaveError('');
    try {
      const res = await api.updateB2BProfile({
        b2b_partner_id: partnerUser.id,
        ...profileForm
      });
      if (res && res.success) {
        setProfileSaveSuccess('Company profile & branding updated successfully!');
        setEditProfileOpen(false);
        if (onPartnerRefresh) onPartnerRefresh();
      } else {
        setProfileSaveError(res.error || 'Failed to update company profile.');
      }
    } catch (err) {
      setProfileSaveError(err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '840px' }}>
      {/* Agency Identity Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom mb-4">
          <div className="d-flex align-items-center gap-3">
            {partnerUser.logo_url ? (
              <img
                src={partnerUser.logo_url}
                alt={partnerUser.company_name || 'Agency Logo'}
                style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                className="rounded-3 border p-1 bg-light"
              />
            ) : (
              <div className="rounded-circle p-3 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <Building2 size={28} />
              </div>
            )}
            <div>
              <h5 className="fw-black text-dark font-heading mb-0.5">{partnerUser.company_name || partnerUser.name}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-success text-white text-xs fw-bold px-2.5 py-1 rounded-pill">
                  ✓ Active Agency Partner
                </span>
                <span className="text-muted text-xs font-monospace">Agency ID: {partnerUser.id}</span>
                {partnerUser.initial_mode && (
                  <span className="badge bg-light text-muted border text-xs px-2.5 py-1 rounded-pill">
                    Registered Initial Mode: {partnerUser.initial_mode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => {
                setProfileForm({
                  company_name: partnerUser.company_name || '',
                  name: partnerUser.name || '',
                  phone: partnerUser.phone || '',
                  email: partnerUser.email || '',
                  address: partnerUser.address || '',
                  gst_number: partnerUser.gst_number || '',
                  logo_url: partnerUser.logo_url || ''
                });
                setEditProfileOpen(true);
              }}
              className="btn btn-warning text-dark btn-sm rounded-pill px-3.5 text-xs fw-bold font-heading shadow-sm"
            >
              Edit Branding &amp; Details
            </button>
            <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3.5 text-xs font-heading">
              Logout
            </button>
          </div>
        </div>

        {profileSaveSuccess && (
          <div className="alert alert-success py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{profileSaveSuccess}</span>
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Primary Contact Person</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.name || partnerUser.contact_name || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Agency Email</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.email || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Contact Phone</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.phone || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">GST Registration Number</label>
            <div className="fw-semibold text-dark text-sm font-monospace">{partnerUser.gst_number || 'Unregistered / Not Provided'}</div>
          </div>
          <div className="col-12">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Agency Registered Address</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.address || partnerUser.city || 'Goa, India'}</div>
          </div>
        </div>
      </div>

      {/* Edit Company Profile & Branding Modal */}
      <B2BModalPortal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        ariaLabel="Edit Agency Profile & Invoice Branding"
      >
        {editProfileOpen && (
          <div className="card border-0 rounded-4 shadow-2xl p-4 bg-white" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
              <h6 className="fw-bold mb-0 font-heading text-dark">Edit Agency Profile &amp; Invoice Branding</h6>
              <button type="button" className="btn btn-link text-muted p-0" onClick={() => setEditProfileOpen(false)}>
                ✕
              </button>
            </div>

            {profileSaveError && (
              <div className="alert alert-danger py-2 text-xs mb-3">
                {profileSaveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="row g-3 text-start">
                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Company / Agency Name</label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm"
                    value={profileForm.company_name}
                    onChange={e => setProfileForm({ ...profileForm, company_name: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Company Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    className="form-control form-control-sm"
                    value={profileForm.logo_url}
                    onChange={e => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                  />
                  {profileForm.logo_url && (
                    <div className="mt-2 p-2 bg-light rounded border text-center">
                      <span className="text-xxs text-muted d-block mb-1">Logo Preview:</span>
                      <img src={profileForm.logo_url} alt="Logo Preview" style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control form-control-sm"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">GST Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 30AABCT1234F1Z5"
                    className="form-control form-control-sm font-monospace"
                    value={profileForm.gst_number}
                    onChange={e => setProfileForm({ ...profileForm, gst_number: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Registered Address</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-sm"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 text-xs" onClick={() => setEditProfileOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="btn btn-warning text-dark btn-sm rounded-pill px-4 text-xs fw-bold">
                  {savingProfile ? 'Saving...' : 'Save Branding Details'}
                </button>
              </div>
            </form>
          </div>
        )}
      </B2BModalPortal>

      {/* Authorized Pricing Modes & Additional Mode Request Section */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark font-heading mb-0">Authorized B2B Pricing Modes</h6>
            <span className="text-muted text-xs">Governed strictly by Admin verification in database.</span>
          </div>
          {hasCommission && hasNonCommission ? (
            <span 
              className="badge px-3 py-1.5 rounded-pill fw-bold text-xs"
              style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
            >
              ✓ Dual Mode Access Enabled
            </span>
          ) : (
            <span 
              className="badge px-3 py-1.5 rounded-pill fw-bold text-xs"
              style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
            >
              Single Mode Approved
            </span>
          )}
        </div>

        {/* Feedback alert messages */}
        {requestMsg && (
          <div className="alert alert-success py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{requestMsg}</span>
          </div>
        )}
        {requestError && (
          <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {/* Pending Banner if user has a pending request */}
        {isPendingRequest && (
          <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning mb-3">
            <div className="d-flex align-items-start gap-2.5">
              <Clock size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-dark text-xs d-block mb-0.5">
                  Mode Change Request Pending Admin Approval
                </strong>
                <p className="text-muted text-xs mb-0 leading-relaxed">
                  Your request for <strong>{localReqMode === 'COMMISSION' ? 'Commission Mode' : 'Non-Commission Net Mode'}</strong> is under review by the WOW GOA Admin team. 
                  The second mode remains locked until approved.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3">
          {/* Commission Mode Card */}
          <div className="col-12 col-md-6">
            <div className={`p-4 rounded-3 border h-100 ${
              hasCommission 
                ? 'bg-warning bg-opacity-10 border-warning border-opacity-50' 
                : 'bg-light border-light-subtle opacity-75'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1.5 text-warning fw-bold text-xs">
                  <Gift size={16} />
                  <span>Commission Mode</span>
                </div>
                {hasCommission ? (
                  <span className="badge bg-success text-white text-xs px-2.5 py-1 rounded-pill fw-bold">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white text-xs px-2.5 py-1 rounded-pill d-flex align-items-center gap-1">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              <div className="fs-5 fw-black text-dark font-heading mb-1">
                {partnerUser.default_commission_rate ? `${partnerUser.default_commission_rate}%` : '10.00%'} Commission
              </div>

              <p className="text-muted text-xs mb-3 leading-relaxed">
                Guest pays retail price; agency earns direct commission payout on every completed booking.
              </p>

              {/* Request button if not active */}
              {!hasCommission && (
                <div>
                  {isPendingRequest && localReqMode === 'COMMISSION' ? (
                    <button disabled className="btn btn-warning btn-sm w-100 rounded-pill text-xs fw-bold py-1.5 opacity-75">
                      ⏳ Verification Pending
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={requestLoading}
                      onClick={() => handleRequestMode('COMMISSION')}
                      className="btn btn-dark btn-sm w-100 rounded-pill text-xs fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Request Commission Access</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Non-Commission Mode Card */}
          <div className="col-12 col-md-6">
            <div className={`p-4 rounded-3 border h-100 ${
              hasNonCommission 
                ? 'bg-primary bg-opacity-10 border-primary border-opacity-50' 
                : 'bg-light border-light-subtle opacity-75'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1.5 text-primary fw-bold text-xs">
                  <Tag size={16} />
                  <span>Non-Commission Mode</span>
                </div>
                {hasNonCommission ? (
                  <span className="badge bg-success text-white text-xs px-2.5 py-1 rounded-pill fw-bold">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white text-xs px-2.5 py-1 rounded-pill d-flex align-items-center gap-1">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              <div className="fs-5 fw-black text-dark font-heading mb-1">
                {partnerUser.default_net_discount_rate ? `${partnerUser.default_net_discount_rate}%` : '10.00%'} Wholesale Net
              </div>

              <p className="text-muted text-xs mb-3 leading-relaxed">
                Direct wholesale net rates; agency applies its own markup to end travelers directly.
              </p>

              {/* Request button if not active */}
              {!hasNonCommission && (
                <div>
                  {isPendingRequest && localReqMode === 'NON_COMMISSION' ? (
                    <button disabled className="btn btn-primary btn-sm w-100 rounded-pill text-xs fw-bold py-1.5 opacity-75">
                      ⏳ Verification Pending
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={requestLoading}
                      onClick={() => handleRequestMode('NON_COMMISSION')}
                      className="btn btn-primary btn-sm w-100 rounded-pill text-xs fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Request Non-Commission Access</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasCommission && hasNonCommission && (
          <div 
            className="mt-3 p-3 rounded-3 text-xs d-flex align-items-center gap-2 fw-medium"
            style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
          >
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>Congratulations! Your agency has active permissions for both Commission and Net Wholesale booking sections.</span>
          </div>
        )}
      </div>

      {/* Security Information */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-bold text-xs">
          <ShieldCheck size={16} className="text-success" />
          <span>B2B Channel Compliance &amp; Security Terms</span>
        </div>
        <ul className="text-muted text-xs mb-0 ps-3 leading-relaxed">
          <li className="mb-1">All bookings placed under your account carry authoritative B2B contract terms.</li>
          <li className="mb-1">Mode switching is governed strictly by administrator approval to preserve audit accuracy.</li>
          <li>Real-time notifications will update you the moment any mode requests or booking approvals occur.</li>
        </ul>
      </div>
    </div>
  );
}
