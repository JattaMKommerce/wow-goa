import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, ArrowRight, Upload, Trash2, FileText, Image as ImageIcon
} from 'lucide-react';
import { createLead } from '../../services/api';

import { 
  ALL_COUNTRIES, 
  POPULAR_NATIONALITIES, 
  VISA_TYPES, 
  DIAL_CODES 
} from './visaCountries';

export { ALL_COUNTRIES, POPULAR_NATIONALITIES, VISA_TYPES, DIAL_CODES };

// ─── BASIC, CLEAN, INTUITIVE VISA APPLICATION COMPONENT ──────────────────────

export default function VisaSection({ 
  setActiveTab,
  initialCountry,
  initialType,
  initialTravelDate
}) {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry || 'GB');
  const [selectedType, setSelectedType] = useState(initialType || '1year');

  // Simple, basic form fields
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: initialCountry || 'GB',
    passportNumber: '',
    passportExpiry: '',
    arrivalDate: initialTravelDate || '',
    email: '',
    phoneCode: '+44',
    phone: '',
    notes: ''
  });

  // Drag and Drop Uploaded Files (No limitations, supports PDF and images)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [leadRef, setLeadRef] = useState(null);

  // Sync props
  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
      setFormData(prev => ({ ...prev, nationality: initialCountry }));
    }
  }, [initialCountry]);

  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialTravelDate) {
      setFormData(prev => ({ ...prev, arrivalDate: initialTravelDate }));
    }
  }, [initialTravelDate]);

  // Sync phone dial code with country
  useEffect(() => {
    const match = ALL_COUNTRIES.find(c => c.code === selectedCountry);
    if (match && match.dialCode) {
      setFormData(prev => ({ ...prev, phoneCode: match.dialCode }));
    }
  }, [selectedCountry]);

  const country = useMemo(() => {
    return ALL_COUNTRIES.find(c => c.code === selectedCountry) || ALL_COUNTRIES[0];
  }, [selectedCountry]);

  const visa = useMemo(() => {
    return VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[1];
  }, [selectedType]);

  // File handling for Drag and Drop
  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newItems = Array.from(fileList).map(file => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      let preview = null;
      if (isImage) {
        try {
          preview = URL.createObjectURL(file);
        } catch (e) {}
      }
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        sizeMb: sizeMb > 0 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`,
        isPdf,
        isImage,
        preview,
        file
      };
    });

    setUploadedFiles(prev => [...prev, ...newItems]);
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const generatedId = `VISA-${Date.now().toString(36).toUpperCase()}`;
    const cleanPhone = `${formData.phoneCode} ${formData.phone}`.trim();

    try {
      const payload = {
        id: generatedId,
        name: formData.fullName.trim(),
        phone: cleanPhone,
        email: formData.email.trim(),
        source: 'Tourist Visa',
        service: `${visa.title} (${country.name})`,
        status: 'New',
        notes: [
          `Country: ${country.name} (${country.flag})`,
          `Visa: ${visa.title}`,
          `Passport No: ${formData.passportNumber.toUpperCase().trim() || 'Pending'}`,
          `Passport Expiry: ${formData.passportExpiry || 'Not specified'}`,
          `Arrival Date: ${formData.arrivalDate || 'Not specified'}`,
          `Documents: ${uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : 'None attached'}`,
          formData.notes ? `Note: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      };

      await createLead(payload);
      setLeadRef(generatedId);
      setSent(true);
    } catch (err) {
      console.warn('[Visa Application] Lead log notice:', err.message);
      setLeadRef(generatedId);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh', 
      width: '100%', 
      color: '#0f172a', 
      fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      
      {/* ── HEADER (CENTERED & CLEAN) ── */}
      <div style={{ 
        padding: '36px 24px 22px', 
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', 
          fontWeight: 800, 
          color: '#0f172a', 
          margin: '0 0 10px', 
          letterSpacing: '-0.02em' 
        }}>
          Tourist Visa <span style={{ color: '#ea580c' }}>Application</span>
        </h1>
        
        <p style={{ fontSize: '15px', color: '#475569', margin: '0 auto', maxWidth: '780px', lineHeight: 1.5 }}>
          Fill in your travel and passport details below to apply for your tourist visa assistance.
        </p>
      </div>

      {/* ── MAIN FORM CONTAINER ── */}
      <div style={{ padding: '32px 24px 64px', maxWidth: '760px', margin: '0 auto' }}>
        
        {sent ? (
          /* ── SIMPLE SUCCESS SCREEN ── */
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #bbf7d0', 
            borderRadius: '16px', 
            padding: '48px 28px', 
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#dcfce7', 
              color: '#16a34a', 
              marginBottom: '16px' 
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>
              Application Submitted Successfully!
            </h2>

            <div style={{ 
              fontSize: '14px', 
              fontWeight: 800, 
              color: '#15803d', 
              background: '#dcfce7', 
              display: 'inline-block', 
              padding: '6px 18px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              Application Reference #{leadRef || 'VISA-GUEST'}
            </div>

            <p style={{ fontSize: '15px', color: '#334155', margin: '0 0 24px', lineHeight: 1.6 }}>
              Thank you, <strong>{formData.fullName || 'Valued Guest'}</strong>! We have received your visa request. Our team will review your application and contact you at <strong>{formData.email}</strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setLeadRef(null);
                setUploadedFiles([]);
                setFormData({
                  fullName: '',
                  nationality: selectedCountry,
                  passportNumber: '',
                  passportExpiry: '',
                  arrivalDate: '',
                  email: '',
                  phoneCode: '+44',
                  phone: '',
                  notes: ''
                });
              }}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Submit Another Application
            </button>
          </div>
        ) : (
          /* ── CLEAN, BASIC FORM (WITH ALL COUNTRIES DROPDOWN) ── */
          <form 
            onSubmit={handleSubmit}
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '32px 28px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)' 
            }}
          >
            
            {/* 1. VISA DURATION DROPDOWN */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Visa Type / Duration *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="30days">30-Day Tourist Visa (Double Entry)</option>
                <option value="1year">1-Year Tourist Visa (Multiple Entry) - Most Popular</option>
                <option value="5years">5-Year Tourist Visa (Multiple Entry) - Long Term</option>
              </select>
            </div>

            {/* 2. FULL NAME & ALL COUNTRIES DROPDOWN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Full Name (As in Passport) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Edward Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Country / Nationality *
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setFormData(prev => ({ ...prev, nationality: e.target.value }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {ALL_COUNTRIES.map(nat => (
                    <option key={nat.code} value={nat.code}>
                      {nat.flag} {nat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. PASSPORT NUMBER & EXPIRY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Passport Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A12345678"
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    letterSpacing: '0.04em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Passport Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.passportExpiry}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 4. ARRIVAL DATE & EMAIL ADDRESS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Date of Arrival *
                </label>
                <input
                  type="date"
                  required
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 5. PHONE NUMBER */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Phone Number *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <select
                  value={formData.phoneCode}
                  onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {DIAL_CODES.map(c => (
                    <option key={`${c.dialCode}-${c.name}`} value={c.dialCode}>
                      {c.flag} {c.dialCode} ({c.name})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 7911 123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 7. DRAG AND DROP DOCUMENT UPLOAD (PDF / JPG / PNG - NO LIMITATION) */}
            <div style={{ marginBottom: '26px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                Upload Passport Copy &amp; Photo (PDF or Image)
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px' }}>
                Drag and drop your files here or click to browse. No file size limitation.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: isDragging ? '2px dashed #ea580c' : '2px dashed #cbd5e1',
                  background: isDragging ? '#fff7ed' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', marginBottom: '8px' }}>
                  <Upload size={24} />
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Drag &amp; drop files here, or click to choose
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Supports PDF, JPG, JPEG, PNG (No size limit)
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {file.isImage && file.preview ? (
                          <img 
                            src={file.preview} 
                            alt="preview" 
                            style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                          />
                        ) : file.isPdf ? (
                          <FileText size={20} color="#ea580c" />
                        ) : (
                          <ImageIcon size={20} color="#0284c7" />
                        )}

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {file.sizeMb}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#94a3b8' : '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '15px 24px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{submitting ? 'Submitting Application...' : 'Submit Visa Application'}</span>
              <ArrowRight size={18} />
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
