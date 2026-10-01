import React, { useState } from 'react';
import {
  User, Mail, Phone, MapPin, ShieldCheck, Key,
  Save, CheckCircle2, AlertCircle, FileText, Lock, Cake, Sparkles
} from 'lucide-react';
import { formatBirthdayDisplay } from '../../utils/loyaltyHelper';
import InternationalPhoneInput from '../common/InternationalPhoneInput';
import { useCustomerCurrency } from '../../context/CustomerCurrencyContext';

import { getCustomerCategory } from '../../utils/countryCurrencyData';

export default function CustomerProfileTab({
  currentUser,
  bookings = [],
  onUpdateProfile
}) {
  // Find DOB from currentUser or any booking
  const savedDob = currentUser?.date_of_birth || 
    (bookings.find(b => b.date_of_birth)?.date_of_birth) || '';

  const { country, currency, setCountry, setCurrency, availableCurrencies } = useCustomerCurrency();

  const [formData, setFormData] = useState({
    name: currentUser?.name || currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    country: currentUser?.country || country?.name || 'India',
    countryCode: currentUser?.country_code || country?.code || 'IN',
    preferredCurrency: currentUser?.preferred_currency || currency || 'INR',
    dateOfBirth: savedDob,
    city: currentUser?.city || 'Goa',
    address: currentUser?.address || '',
    licenseNumber: currentUser?.license_number || currentUser?.licenseNumber || '',
    emergencyContact: currentUser?.emergency_contact || '',
  });

  const customerCategory = getCustomerCategory(formData.countryCode || formData.country);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile booking stats
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => {
    const s = (b.status || 'pending').toLowerCase();
    return s === 'confirmed' || s === 'upcoming' || s === 'ongoing';
  }).length;
  const completedBookings = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
  const cancelledBookings = bookings.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.countryCode) {
      setCountry(formData.countryCode);
    }
    if (formData.preferredCurrency) {
      setCurrency(formData.preferredCurrency);
    }
    const profilePayload = {
      ...formData,
      customer_category: customerCategory,
      customerCategory
    };
    if (onUpdateProfile) {
      onUpdateProfile(profilePayload);
    }
    // Update local storage session
    try {
      const existing = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updated = { ...existing, ...profilePayload };
      localStorage.setItem('currentUser', JSON.stringify(updated));
    } catch (err) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            Customer Profile & Verification
          </h4>
          <p className="text-muted text-xs mb-0">
            Keep your traveler details and driving license updated for fast, paperless Self Drive delivery in Goa.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="alert alert-success border-0 shadow-sm rounded-3 py-2.5 px-4 d-flex align-items-center gap-2 mb-4 text-xs">
          <CheckCircle2 size={16} />
          <span>Profile information updated successfully!</span>
        </div>
      )}

      <div className="row g-4">
        
        {/* Left Column: Avatar & Verification Badge */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 text-white fw-black font-heading shadow-sm" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0B192C 0%, #FF6026 100%)', fontSize: '28px' }}>
              {(formData.name || 'G').charAt(0).toUpperCase()}
            </div>

            <h5 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '18px' }}>
              {formData.name || 'Verified Explorer'}
            </h5>
            <div className="text-muted text-xs mb-2">{formData.email || 'No email attached'}</div>

            <div className="mb-3">
              <span
                className="badge rounded-pill fw-bold"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.4px',
                  color: customerCategory === 'FOREIGN' ? '#7c3aed' : '#059669',
                  backgroundColor: customerCategory === 'FOREIGN' ? '#f3e8ff' : '#ecfdf5',
                  border: `1px solid ${customerCategory === 'FOREIGN' ? '#ddd6fe' : '#a7f3d0'}`
                }}
              >
                {customerCategory === 'FOREIGN' ? '✈️ FOREIGN CUSTOMER' : '🇮🇳 INDIAN RESIDENT'}
              </span>
            </div>

            {/* Travel Summary Stats */}
            <div className="p-3 bg-light rounded-3 text-start border mb-3">
              <div className="d-flex align-items-center justify-content-between text-xs mb-2 pb-2 border-bottom">
                <span className="text-muted">Total Bookings</span>
                <span className="fw-black text-dark">{totalBookings}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-xs mb-2 pb-2 border-bottom">
                <span className="text-muted">Active / Upcoming</span>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-0.5 rounded">{activeBookings}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-xs mb-2 pb-2 border-bottom">
                <span className="text-muted">Completed Trips</span>
                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-0.5 rounded">{completedBookings}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between text-xs mb-2 pb-2 border-bottom">
                <span className="text-muted">Cancelled</span>
                <span className="text-danger fw-bold">{cancelledBookings}</span>
              </div>
              {savedDob && (
                <div className="d-flex align-items-center justify-content-between text-xs mb-2 pb-2 border-bottom">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <Cake size={13} className="text-warning" /> Birthday
                  </span>
                  <span className="fw-bold text-success">{formatBirthdayDisplay(savedDob)}</span>
                </div>
              )}
              <div className="d-flex align-items-center justify-content-between text-xs">
                <span className="text-muted">KYC & License</span>
                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-0.5 rounded">Verified</span>
              </div>
            </div>

            <div className="text-xxs text-muted">
              🔒 Your identification details and birthday are saved securely on your WOW GOA profile.
            </div>
          </div>
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <h6 className="fw-bold text-dark mb-3 font-heading">Personal & Travel Details</h6>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Full Legal Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><User size={14} /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 text-xs"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Mail size={14} /></span>
                    <input 
                      type="email" 
                      className="form-control border-start-0 text-xs"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <InternationalPhoneInput 
                    value={formData.phone}
                    onChange={(val, c) => {
                      setFormData(prev => ({
                        ...prev,
                        phone: val ? String(val) : '',
                        country: c?.name || prev.country,
                        countryCode: c?.code || prev.countryCode,
                        preferredCurrency: c?.currency || prev.preferredCurrency
                      }));
                    }}
                    label="Mobile Number (WhatsApp Enabled)"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Preferred Display Currency (ISO 4217)</label>
                  <select 
                    className="form-select text-xs"
                    value={formData.preferredCurrency}
                    onChange={(e) => {
                      const newCur = e.target.value;
                      setFormData({ ...formData, preferredCurrency: newCur });
                      setCurrency(newCur);
                    }}
                  >
                    {availableCurrencies.map(c => (
                      <option key={c.currency} value={c.currency}>
                        {c.flag} {c.currency} - {c.country} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted" style={{ fontSize: '10px' }}>
                    WOW GOA prices will automatically convert and display in this currency.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">City / State of Residence</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><MapPin size={14} /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 text-xs"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Date of Birth</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Cake size={14} className="text-warning" /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 text-xs bg-light"
                      value={formData.dateOfBirth ? `${formData.dateOfBirth} (${formatBirthdayDisplay(formData.dateOfBirth)})` : 'Saved on First Booking'}
                      disabled
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: '10px' }}>
                    🎂 Saved for your annual birthday wishes and exclusive WOW GOA membership privileges.
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted">Full Address</label>
                  <textarea 
                    className="form-control text-xs"
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your residential address"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Driving License Number (For Self Drive)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Key size={14} /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 text-xs"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="DL-0420110012345"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted">Emergency Contact Name & Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Phone size={14} /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 text-xs"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Contact Person (+91 ...)"
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 text-xs d-flex align-items-center gap-2 shadow-sm">
                  <Save size={15} />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
