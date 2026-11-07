import React, { useState } from 'react';
import {
  Building, MapPin, Phone, Mail, Globe, FileText, ChevronRight,
  ChevronLeft, Check, Save, Star, Upload, Wifi, Car, Dumbbell,
  Waves, Wind, Zap, Camera, Coffee, Shield, AlertCircle, BedDouble,
  Eye, Trash2, FileCheck
} from 'lucide-react';
import { uploadImage, addMasterHotel } from '../../../services/api';

const STEPS = [
  { num: 1, label: 'Basic Information' },
  { num: 2, label: 'Location' },
  { num: 3, label: 'Images & Media' },
  { num: 4, label: 'Facilities' },
  { num: 5, label: 'Policies' },
  { num: 6, label: 'Room Setup' },
  { num: 7, label: 'Room Numbers' },
  { num: 8, label: 'Pricing' },
  { num: 9, label: 'Documents' },
  { num: 10, label: 'Review & Submit' }
];

const REQUIRED_DOCUMENTS = [
  { id: 'prop_reg', label: 'Property Registration Document', required: true },
  { id: 'biz_reg', label: 'Business Registration', required: true },
  { id: 'gst_cert', label: 'GST Certificate', required: false },
  { id: 'pan_doc', label: 'PAN Document', required: true },
  { id: 'bank_proof', label: 'Bank Proof / Cancelled Cheque', required: true },
  { id: 'owner_id', label: 'Owner ID Proof (Aadhaar / Passport)', required: true },
  { id: 'fire_safety', label: 'Fire Safety Certificate', required: false }
];

const PROPERTY_TYPES = ['Hotel', 'Resort', 'Villa', 'Apartment', 'Homestay', 'Hostel', 'Guest House', 'Boutique Hotel', 'Service Apartment', 'Cottage'];

const FACILITIES_LIST = [
  { cat: 'Internet & Tech', items: ['Free Wi-Fi', 'Business Centre', 'Conference Hall'] },
  { cat: 'Transport', items: ['Parking', 'Airport Transfer', 'Valet Parking'] },
  { cat: 'Recreation', items: ['Swimming Pool', 'Gym', 'Spa', 'Garden', 'Terrace'] },
  { cat: 'Services', items: ['24-Hour Reception', 'Laundry Service', 'Luggage Storage', 'Travel Desk', 'Room Service'] },
  { cat: 'Safety', items: ['CCTV', 'Fire Safety Equipment', 'First Aid'] },
  { cat: 'Accessibility', items: ['Lift', 'Wheelchair Access', 'Ramp'] },
  { cat: 'Events', items: ['Banquet Hall', 'Outdoor Event Space'] },
  { cat: 'Other', items: ['Power Backup', 'Air Conditioning', 'Restaurant (On-site)', 'Bar'] }
];

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between mb-1">
        <span className="text-muted" style={{ fontSize: '0.78rem' }}>Step {current} of {total}</span>
        <span className="fw-bold" style={{ fontSize: '0.78rem', color: '#0D1B2E' }}>{pct}% complete</span>
      </div>
      <div className="rounded-pill overflow-hidden" style={{ height: '6px', background: '#dee2e6' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0D1B2E, #FF6333)', transition: 'width 0.4s' }}></div>
      </div>
      <div className="d-flex gap-1 mt-3 flex-wrap">
        {STEPS.map(s => (
          <div key={s.num} className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
              width: '22px', height: '22px',
              background: s.num < current ? '#00b894' : s.num === current ? '#0D1B2E' : '#dee2e6',
              color: s.num <= current ? '#fff' : '#6c757d',
              fontWeight: 700, fontSize: '0.68rem', flexShrink: 0
            }}>
              {s.num < current ? <Check size={11} /> : s.num}
            </div>
            <span className="d-none d-md-inline" style={{ color: s.num === current ? '#0D1B2E' : s.num < current ? '#00b894' : '#adb5bd', fontWeight: s.num === current ? 700 : 400 }}>{s.label}</span>
            {s.num < STEPS.length && <ChevronRight size={10} className="text-muted d-none d-md-inline" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function FacilitiesSelector({ selected, onChange }) {
  const toggle = (f) => {
    if (selected.includes(f)) onChange(selected.filter(x => x !== f));
    else onChange([...selected, f]);
  };
  return (
    <div>
      {FACILITIES_LIST.map(cat => (
        <div key={cat.cat} className="mb-4">
          <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a', fontSize: '0.85rem' }}>{cat.cat}</h6>
          <div className="d-flex flex-wrap gap-2">
            {cat.items.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="btn btn-sm rounded-pill px-3 py-1"
                style={{
                  border: '1px solid',
                  borderColor: selected.includes(item) ? '#0D1B2E' : '#dee2e6',
                  background: selected.includes(item) ? '#0D1B2E' : '#fff',
                  color: selected.includes(item) ? '#fff' : '#495057',
                  fontSize: '0.8rem',
                  transition: 'all 0.15s'
                }}
              >
                {selected.includes(item) && <Check size={11} className="me-1" />}
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PMSAddHotelWizard({ currentUser, onAddHotel, onUpdateHotel, vendorHotels, editingHotelId, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [createdHotelId, setCreatedHotelId] = useState(editingHotelId || null);

  // All form state
  const [form, setForm] = useState({
    name: '', property_type: 'Hotel', stars: '3', short_description: '', description: '',
    year_established: '', total_rooms: '', floors: '', phone: '', reservation_phone: '',
    email: '', website: '', property_registration_no: '', gst_number: '',
    // Location
    country: 'India', state: 'Goa', city: 'Panaji', area: '', address: '',
    pincode: '', landmark: '', latitude: '', longitude: '',
    // Images
    images: [], image_urls: '', cover_image: '',
    // Facilities
    facilities: [],
    // Policies
    checkin_time: '14:00', checkout_time: '12:00', cancellation_policy: '',
    child_policy: '', smoking_policy: 'Non-Smoking Property', pet_policy: 'No Pets Allowed',
    unmarried_couple_policy: 'Allowed', property_rules: '',
    // Pricing
    base_price: '', selling_price: '', weekend_price: '',
    // Documents
    documents: {}
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDocUpload = async (docId, file) => {
    if (!file) return;
    setUploadingDoc(prev => ({ ...prev, [docId]: true }));
    try {
      const uploadedUrl = await uploadImage(file);
      const finalUrl = typeof uploadedUrl === 'string' ? uploadedUrl : (uploadedUrl?.url || '');
      setForm(f => ({
        ...f,
        documents: {
          ...(f.documents || {}),
          [docId]: {
            name: file.name,
            url: finalUrl,
            size: (file.size / 1024).toFixed(1) + ' KB',
            date: new Date().toLocaleDateString()
          }
        }
      }));
    } catch (err) {
      console.error('Doc upload fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({
          ...f,
          documents: {
            ...(f.documents || {}),
            [docId]: {
              name: file.name,
              url: reader.result,
              size: (file.size / 1024).toFixed(1) + ' KB',
              date: new Date().toLocaleDateString()
            }
          }
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleDocRemove = (docId) => {
    setForm(f => {
      const nextDocs = { ...(f.documents || {}) };
      delete nextDocs[docId];
      return { ...f, documents: nextDocs };
    });
  };

  React.useEffect(() => {
    if (editingHotelId && vendorHotels) {
      const existing = vendorHotels.find(h => h.id === editingHotelId);
      if (existing) {
        setForm({
          ...form,
          name: existing.name || '',
          property_type: existing.property_type || 'Hotel',
          stars: existing.stars || '3',
          description: existing.description || '',
          phone: existing.phone || '',
          email: existing.email || '',
          website: existing.website || '',
          country: existing.country || 'India',
          state: existing.state || 'Goa',
          city: existing.city || 'Panaji',
          area: existing.location || '',
          address: existing.address || '',
          pincode: existing.pincode || '',
          images: (() => { try { return existing.images_json ? JSON.parse(existing.images_json) : []; } catch { return []; } })(),
          facilities: (() => {
            if (Array.isArray(existing.amenities)) return existing.amenities;
            if (existing.facilities_json) {
              try {
                const parsed = JSON.parse(existing.facilities_json);
                if (Array.isArray(parsed)) return parsed;
              } catch(e) {}
            }
            if (typeof existing.amenities === 'string' && existing.amenities.trim()) {
              return existing.amenities.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
          })(),
          checkin_time: existing.checkin_time || '14:00',
          checkout_time: existing.checkout_time || '12:00',
          base_price: existing.price || '',
          documents: (() => { try { return existing.documents_json ? JSON.parse(existing.documents_json) : {}; } catch { return {}; } })()
        });
        setStep(existing.wizard_step || 1);
      }
    }
  }, [editingHotelId]);

  const fld = (label, key, type = 'text', placeholder = '', required = false, extra = {}) => (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem', color: '#495057' }}>{label}{required && <span className="text-danger ms-1">*</span>}</label>
      {type === 'select' ? (
        <select className="form-select form-select-sm" value={form[key]} onChange={e => set(key, e.target.value)} {...extra}>
          {extra.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-control form-control-sm" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} rows={3} {...extra}></textarea>
      ) : (
        <input className="form-control form-control-sm" type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} {...extra} />
      )}
    </div>
  );

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const effectiveId = editingHotelId || createdHotelId;
      const payload = {
        name: form.name || 'Draft Hotel',
        location: form.area || form.city || 'Goa',
        price: parseInt(form.selling_price || form.base_price || 0),
        amenities: Array.isArray(form.facilities) ? form.facilities.join(', ') : (form.facilities || ''),
        images_json: form.images,
        stars: parseInt(form.stars),
        rating: 4.0,
        badge: 'Standard',
        description: form.description,
        vendor_id: currentUser.id,
        hotel_status: 'Draft',
        property_type: form.property_type,
        phone: form.phone,
        email: form.email,
        website: form.website,
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        wizard_step: step,
        profile_completion: Math.round((step / 10) * 100),
        documents_json: JSON.stringify(form.documents || {})
      };
      if (effectiveId) {
        if (onUpdateHotel) await onUpdateHotel({ ...payload, id: effectiveId });
        else await api.updateHotel({ ...payload, id: effectiveId });
      } else {
        let res;
        if (onAddHotel) res = await onAddHotel(payload);
        else res = await addMasterHotel(payload);
        if (res && (res.id || res.hotel_id)) {
          setCreatedHotelId(res.id || res.hotel_id);
        }
      }
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) { setError('Hotel name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const effectiveId = editingHotelId || createdHotelId;
      const payload = {
        name: form.name,
        location: form.area || form.city || 'Goa',
        price: parseInt(form.selling_price || form.base_price || 0),
        amenities: Array.isArray(form.facilities) ? form.facilities.join(', ') : (form.facilities || ''),
        images_json: form.images,
        stars: parseInt(form.stars),
        rating: 4.0,
        badge: 'Standard',
        description: form.description,
        vendor_id: currentUser.id,
        hotel_status: 'Submitted',
        property_type: form.property_type,
        phone: form.phone,
        email: form.email,
        website: form.website,
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        gst_number: form.gst_number,
        property_registration_no: form.property_registration_no,
        facilities_json: JSON.stringify(form.facilities),
        wizard_step: 10,
        profile_completion: 100,
        documents_json: JSON.stringify(form.documents || {})
      };
      if (effectiveId) {
        if (onUpdateHotel) await onUpdateHotel({ ...payload, id: effectiveId });
        else await api.updateHotel({ ...payload, id: effectiveId });
      } else {
        let res;
        if (onAddHotel) res = await onAddHotel(payload);
        else res = await addMasterHotel(payload);
        if (res && (res.id || res.hotel_id)) {
          setCreatedHotelId(res.id || res.hotel_id);
        }
      }
      setSuccess('Hotel submitted for approval!');
      setTimeout(() => onComplete(), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="row g-3">
          <div className="col-12 col-md-8">{fld('Hotel Name', 'name', 'text', 'e.g. Taj Exotica Resort & Spa', true)}</div>
          <div className="col-12 col-md-4">{fld('Property Type', 'property_type', 'select', '', false, { options: PROPERTY_TYPES })}</div>
          <div className="col-12 col-md-4">
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Star Classification</label>
              <div className="d-flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => set('stars', String(n))} className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: parseInt(form.stars) >= n ? '#FFC107' : '#f0f2f5', border: 'none' }}>
                    <Star size={16} fill={parseInt(form.stars) >= n ? '#FFC107' : 'none'} color={parseInt(form.stars) >= n ? '#FFC107' : '#adb5bd'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">{fld('Year Established', 'year_established', 'number', '2010')}</div>
          <div className="col-12 col-md-4">{fld('Total Rooms', 'total_rooms', 'number', '50')}</div>
          <div className="col-12 col-md-4">{fld('Number of Floors', 'floors', 'number', '5')}</div>
          <div className="col-12 col-md-4">{fld('Reception Phone', 'phone', 'tel', '+91 9876543210')}</div>
          <div className="col-12 col-md-4">{fld('Official Email', 'email', 'email', 'hotel@example.com')}</div>
          <div className="col-12 col-md-4">{fld('Website', 'website', 'url', 'https://hotel.com')}</div>
          <div className="col-12">{fld('Short Description', 'short_description', 'text', 'One line about your property')}</div>
          <div className="col-12">{fld('Full Hotel Description', 'description', 'textarea', 'Describe your property, location, unique features...')}</div>
          <div className="col-12 col-md-6">{fld('Property Registration No.', 'property_registration_no', 'text', 'e.g. REG/GOA/2024/1234')}</div>
          <div className="col-12 col-md-6">{fld('GST Number (if applicable)', 'gst_number', 'text', 'e.g. 30AABCT1332L1ZT')}</div>
        </div>
      );

      case 2: return (
        <div className="row g-3">
          <div className="col-12 col-md-4">{fld('Country', 'country', 'text', 'India')}</div>
          <div className="col-12 col-md-4">{fld('State', 'state', 'text', 'Goa')}</div>
          <div className="col-12 col-md-4">
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>City / Area</label>
              <select className="form-select form-select-sm" value={form.city} onChange={e => set('city', e.target.value)}>
                {['Panaji', 'Calangute', 'Baga', 'Anjuna', 'Candolim', 'Vagator', 'Morjim', 'Arambol', 'North Goa', 'South Goa', 'Margao', 'Vasco da Gama', 'Colva', 'Benaulim', 'Palolem', 'Agonda', 'Cavelossim'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="col-12">{fld('Full Address', 'address', 'textarea', 'Street, building name, landmark...', true)}</div>
          <div className="col-12 col-md-4">{fld('PIN Code', 'pincode', 'text', '403001')}</div>
          <div className="col-12 col-md-4">{fld('Nearby Landmark', 'landmark', 'text', 'Near Calangute Beach')}</div>
          <div className="col-12 col-md-4">{fld('Area / Locality', 'area', 'text', 'Calangute')}</div>
          <div className="col-12 col-md-6">{fld('Latitude', 'latitude', 'text', '15.5477')}</div>
          <div className="col-12 col-md-6">{fld('Longitude', 'longitude', 'text', '73.7516')}</div>
          <div className="col-12">
            <div className="alert alert-info py-2 px-3 mb-2" style={{ fontSize: '0.8rem' }}>
              💡 <strong>Tip:</strong> Enter lat/lng from Google Maps to pin your exact location. Guests will see your location on the map when browsing.
            </div>
            <div className="alert py-2.5 px-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#0D9488' }}><MapPin size={16} /></span>
                <span className="text-xs text-dark">
                  <strong>Nearby Beaches &amp; Attractions:</strong> You can add verified distances to beaches, forts, and landmarks in the <strong>Nearby Destinations</strong> tab so guests see them highlighted on your hotel card.
                </span>
              </div>
              {editingHotelId && (
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('nearby_destinations', editingHotelId)}
                  className="btn btn-xs rounded-pill px-3 py-1 text-white fw-bold shadow-xs border-0"
                  style={{ background: '#0D9488', fontSize: '0.75rem' }}
                >
                  Manage Attractions Now →
                </button>
              )}
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div>
          <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-start gap-2" style={{ fontSize: '0.8rem' }}>
            <Camera size={14} className="mt-1 flex-shrink-0" />
            <span>Upload at least <strong>5 high-quality images</strong> for your property. Select multiple images at once. Click any thumbnail to set it as the cover photo.</span>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Upload Hotel Images (Select Multiple Files)</label>
            <div 
              className="border-2 border-dashed rounded-4 p-4 text-center" 
              style={{ borderColor: isDragging ? '#FF6333' : '#dee2e6', background: isDragging ? '#FFF5F2' : '#FAFAFA', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => document.getElementById('hotelImageUpload').click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={async e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  setSaving(true);
                  try {
                    const uploadedUrls = [];
                    for (const file of files) {
                      const resUrl = await uploadImage(file);
                      const finalUrl = typeof resUrl === 'string' ? resUrl : (resUrl?.url || '');
                      if (finalUrl) uploadedUrls.push(finalUrl);
                    }
                    set('images', [...form.images, ...uploadedUrls]);
                  } catch (err) {
                    console.error('Upload failed:', err);
                  } finally {
                    setSaving(false);
                  }
                }
              }}
            >
              <Upload size={32} className="text-muted mb-2 opacity-50" />
              <p className="text-muted mb-1 fw-medium" style={{ fontSize: '0.85rem' }}>
                {saving ? '⏳ Uploading images, please wait...' : 'Click to choose multiple images or drag & drop here'}
              </p>
              <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Select multiple JPG, PNG, WEBP files (Hold Ctrl/Cmd or Shift to select multiple)</p>
              <input id="hotelImageUpload" type="file" multiple accept="image/*" className="d-none"
                onChange={async e => {
                  const files = Array.from(e.target.files);
                  if (!files.length) return;
                  setSaving(true);
                  try {
                    const uploadedUrls = [];
                    for (const file of files) {
                      const resUrl = await uploadImage(file);
                      const finalUrl = typeof resUrl === 'string' ? resUrl : (resUrl?.url || '');
                      if (finalUrl) {
                        uploadedUrls.push(finalUrl);
                      }
                    }
                    set('images', [...form.images, ...uploadedUrls]);
                  } catch (err) {
                    console.error('Image upload failed:', err);
                  } finally {
                    setSaving(false);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Or Add Image URLs (One per line)</label>
            <textarea className="form-control form-control-sm" rows={3} placeholder="https://example.com/hotel1.jpg&#10;https://example.com/hotel2.jpg" value={form.image_urls} onChange={e => { set('image_urls', e.target.value); const urls = e.target.value.split('\n').map(u => u.trim()).filter(Boolean); set('images', urls); }}></textarea>
          </div>
          {form.images.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0" style={{ fontSize: '0.82rem' }}>
                  Uploaded Gallery ({form.images.length} images)
                </label>
                <button type="button" className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => set('images', [])}>Clear All</button>
              </div>
              <div className="row g-2">
                {form.images.map((img, i) => (
                  <div key={i} className="col-4 col-md-3 col-lg-2 position-relative group-img">
                    <img 
                      src={img} 
                      alt="" 
                      className="w-100 rounded-3 border" 
                      style={{ height: '85px', objectFit: 'cover', cursor: 'pointer', border: i === 0 ? '2px solid #FF6333 !important' : '1px solid #dee2e6' }} 
                      onClick={() => {
                        // Move this clicked image to index 0 (make Cover)
                        if (i !== 0) {
                          const updated = [...form.images];
                          const [picked] = updated.splice(i, 1);
                          updated.unshift(picked);
                          set('images', updated);
                        }
                      }}
                      title="Click to set as cover image"
                    />
                    {i === 0 ? (
                      <span className="position-absolute top-0 start-0 badge" style={{ background: '#FF6333', fontSize: '0.6rem', margin: '4px' }}>Cover</span>
                    ) : (
                      <span className="position-absolute bottom-0 start-0 badge bg-dark bg-opacity-75" style={{ fontSize: '0.55rem', margin: '4px' }}>#{i+1}</span>
                    )}
                    <button type="button" className="position-absolute top-0 end-0 btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', margin: '4px' }} onClick={(ev) => { ev.stopPropagation(); set('images', form.images.filter((_, idx) => idx !== i)); }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.75rem' }}>💡 Tip: Click any photo above to make it the main cover photo.</p>
            </div>
          )}
        </div>
      );

      case 4: return (
        <div>
          <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Select all facilities available at your property. These will be shown to guests when browsing.</p>
          <FacilitiesSelector selected={form.facilities} onChange={v => set('facilities', v)} />
          <div className="alert alert-info py-2 px-3 mt-2" style={{ fontSize: '0.78rem' }}>
            {form.facilities.length} facilities selected
          </div>
        </div>
      );

      case 5: return (
        <div className="row g-3">
          <div className="col-12 col-md-3">{fld('Standard Check-in', 'checkin_time', 'time')}</div>
          <div className="col-12 col-md-3">{fld('Standard Check-out', 'checkout_time', 'time')}</div>
          <div className="col-12 col-md-3">
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Smoking Policy</label>
              <select className="form-select form-select-sm" value={form.smoking_policy} onChange={e => set('smoking_policy', e.target.value)}>
                {['Non-Smoking Property', 'Smoking Allowed in Designated Areas', 'Smoking Allowed'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Pet Policy</label>
              <select className="form-select form-select-sm" value={form.pet_policy} onChange={e => set('pet_policy', e.target.value)}>
                {['No Pets Allowed', 'Pets Welcome', 'Small Pets Only'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="col-12">{fld('Cancellation Policy', 'cancellation_policy', 'textarea', 'Free cancellation up to 24 hours before check-in. After that, first night charge applies...')}</div>
          <div className="col-12">{fld('Child Policy', 'child_policy', 'textarea', 'Children below 5 years stay free. Extra bed available at additional charge...')}</div>
          <div className="col-12">{fld('Property Rules & Special Instructions', 'property_rules', 'textarea', 'No loud music after 11 PM. ID proof mandatory for all guests...')}</div>
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Unmarried Couples Policy</label>
              <select className="form-select form-select-sm" value={form.unmarried_couple_policy} onChange={e => set('unmarried_couple_policy', e.target.value)}>
                {['Allowed', 'Not Allowed', 'With ID Proof'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      );

      case 6: return (
        <div>
          <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-start gap-2" style={{ fontSize: '0.82rem' }}>
            <BedDouble size={14} className="mt-1 flex-shrink-0" />
            <span>Create room types for your hotel. You can add multiple types (Standard, Deluxe, Suite, etc.). After saving this hotel, go to <strong>Rooms & Room Types</strong> to manage them in detail.</span>
          </div>
          <div className="card border-0 rounded-4 p-4" style={{ background: '#f8f9fa' }}>
            <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a' }}>Room Types Summary</h6>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>You can create room types after saving the hotel. Click "Save Draft" now and go to <strong>Rooms & Room Types</strong> module to add detailed room configurations.</p>
            <button type="button" className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }} onClick={() => { handleSaveDraft(); }}>
              Save Draft & Configure Rooms Later
            </button>
          </div>
        </div>
      );

      case 7: return (
        <div>
          <div className="alert alert-info py-2 px-3" style={{ fontSize: '0.82rem' }}>
            <strong>Physical Room Numbers</strong> — After your hotel is saved, go to <strong>Rooms & Room Types</strong> to add individual room numbers (101, 102, 201...) with floor assignments and status. This step is completed there.
          </div>
        </div>
      );

      case 8: return (
        <div className="row g-3">
          <div className="col-12">
            <div className="alert alert-warning py-2 px-3" style={{ fontSize: '0.82rem' }}>
              ⚠️ Set pricing for each room type from <strong>Rates & Offers</strong> module. You can set a base price here for quick listing.
            </div>
          </div>
          <div className="col-12 col-md-4">{fld('Base Price (₹/night)', 'base_price', 'number', '5000', true)}</div>
          <div className="col-12 col-md-4">{fld('Selling Price (₹/night)', 'selling_price', 'number', '5500')}</div>
          <div className="col-12 col-md-4">{fld('Weekend Price (₹/night)', 'weekend_price', 'number', '6500')}</div>
        </div>
      );

      case 9: return (
        <div>
          <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Upload required documents for verification. Documents are reviewed by admin before your hotel goes live.</p>
          {REQUIRED_DOCUMENTS.map(doc => {
            const uploaded = form.documents && form.documents[doc.id];
            const isUploading = uploadingDoc[doc.id];
            return (
              <div key={doc.id} className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 border" style={{ background: uploaded ? '#f0fbf4' : '#f8f9fa', borderColor: uploaded ? '#bbf7d0' : '#e5e7eb', transition: 'all 0.2s' }}>
                <div className="d-flex align-items-center gap-2 flex-grow-1 me-2 overflow-hidden">
                  {uploaded ? <FileCheck size={20} className="text-success flex-shrink-0" /> : <FileText size={20} className="text-muted flex-shrink-0" />}
                  <div className="text-truncate">
                    <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem', color: '#1a2b4a' }}>
                      {doc.label} {doc.required && <span className="text-danger">*</span>}
                    </div>
                    {uploaded ? (
                      <div className="text-success d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                        <span className="fw-medium text-truncate">✓ {uploaded.name}</span>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-0.5 px-1.5" style={{ fontSize: '0.68rem' }}>{uploaded.size || 'Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        PDF, JPG, PNG or WEBP (Up to 10MB)
                      </div>
                    )}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  {uploaded ? (
                    <>
                      {uploaded.url && (
                        <a 
                          href={uploaded.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Eye size={12} /> View
                        </a>
                      )}
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-dark rounded-pill px-2.5 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => document.getElementById(`docUpload_${doc.id}`).click()}
                      >
                        Replace
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger rounded-circle p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px' }}
                        onClick={() => handleDocRemove(doc.id)}
                        title="Remove document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm" 
                      style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.78rem' }}
                      disabled={isUploading}
                      onClick={() => document.getElementById(`docUpload_${doc.id}`).click()}
                    >
                      <Upload size={13} /> {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                  <input 
                    id={`docUpload_${doc.id}`} 
                    type="file" 
                    accept=".pdf,image/*" 
                    className="d-none" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocUpload(doc.id, e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );

      case 10: return (
        <div>
          <div className="row g-3 mb-4">
            {[
              { label: 'Hotel Name', value: form.name || '—', ok: !!form.name },
              { label: 'Location', value: `${form.area || form.city || '—'}, ${form.state}`, ok: !!(form.city) },
              { label: 'Property Type', value: form.property_type, ok: true },
              { label: 'Star Rating', value: `${form.stars} Star`, ok: true },
              { label: 'Contact', value: form.phone || form.email || '—', ok: !!(form.phone || form.email) },
              { label: 'Base Price', value: form.base_price ? `₹${form.base_price}/night` : '—', ok: !!form.base_price },
              { label: 'Facilities', value: `${form.facilities.length} selected`, ok: form.facilities.length > 0 },
              { label: 'Images', value: `${form.images.length} uploaded`, ok: form.images.length >= 1 },
              { label: 'Documents', value: `${Object.keys(form.documents || {}).length} uploaded`, ok: Object.keys(form.documents || {}).length >= 1 }
            ].map(item => (
              <div key={item.label} className="col-12 col-md-6">
                <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: item.ok ? '#edf7f0' : '#fff3f0' }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.label}</div>
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{item.value}</div>
                  </div>
                  {item.ok ? <Check size={18} color="#00b894" /> : <AlertCircle size={18} color="#e17055" />}
                </div>
              </div>
            ))}
          </div>
          <div className="alert py-3 px-4" style={{ background: '#fff9e6', border: '1px solid #fdcb6e', borderRadius: '12px', fontSize: '0.82rem' }}>
            <strong>📋 Terms & Conditions:</strong> By submitting this hotel, you confirm that all information is accurate and you have the legal right to list this property. The platform will review and approve the listing within 2-3 business days.
          </div>
          <div className="d-flex align-items-center gap-2 mt-3">
            <input type="checkbox" id="terms" className="form-check-input" />
            <label htmlFor="terms" className="form-check-label" style={{ fontSize: '0.82rem' }}>I agree to the terms and conditions and confirm all information is accurate</label>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Add New Hotel</h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Fill in the details step by step. You can save as a draft anytime and continue later.</p>
      </div>

      <div className="card border-0 rounded-4 shadow-sm p-4">
        <ProgressBar current={step} total={10} />

        {error && <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}><AlertCircle size={14} /> {error}</div>}
        {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>✅ {success}</div>}

        <div className="mb-4">
          <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a', borderBottom: '2px solid #FF6333', paddingBottom: '8px', display: 'inline-block' }}>
            Step {step}: {STEPS[step - 1].label}
          </h6>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="d-flex align-items-center justify-content-between pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
          <button type="button" className="btn rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }} onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            <ChevronLeft size={16} /> Back
          </button>

          <div className="d-flex gap-2">
            <button type="button" className="btn rounded-pill px-4 d-flex align-items-center gap-1" style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.85rem' }} onClick={handleSaveDraft} disabled={saving}>
              <Save size={14} /> Save Draft
            </button>

            {step < 10 ? (
              <button type="button" className="btn rounded-pill px-4 fw-bold d-flex align-items-center gap-1" style={{ background: '#0D1B2E', color: '#fff' }} onClick={() => setStep(step + 1)}>
                Next: {STEPS[step].label} <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn rounded-pill px-4 fw-bold d-flex align-items-center gap-1" style={{ background: '#00b894', color: '#fff' }} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Submitting...' : '🚀 Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
