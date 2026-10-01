import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, X, Check, XCircle, MapPin, Edit2, Save } from 'lucide-react';
import { API_BASE, toggleVehicleAvailability, updateVehicle, uploadImage, updateBookingStatus } from '../../services/api';
import WalletRechargeRequiredModal from '../../components/vendor/WalletRechargeRequiredModal';
import VendorMinimumBalanceAlertModal from '../../components/vendor/VendorMinimumBalanceAlertModal';

// ─── GOA LOCATIONS ──────────────────────────────────────────────────────────
const GOA_LOCATIONS = [
  'Panaji, Goa',
  'Calangute, Goa',
  'Baga, Goa',
  'Anjuna, Goa',
  'Vagator, Goa',
  'Mapusa, Goa',
  'Margao, Goa',
  'Vasco da Gama, Goa',
  'Ponda, Goa',
  'Candolim, Goa',
  'Sinquerim, Goa',
  'Colva, Goa',
  'Benaulim, Goa',
  'Palolem, Goa',
  'Arambol, Goa',
  'Morjim, Goa',
  'Dabolim Airport, Goa',
  'Madgaon Railway Station, Goa',
  'North Goa',
  'South Goa',
  'Goa (General)',
];

// ─── EDIT VEHICLE MODAL ──────────────────────────────────────────────────────
function EditVehicleModal({ vehicle, vehicleType, onClose, onSaved, onUpdateCar, onUpdateBike }) {
  const isCar = vehicleType === 'car';

  const [name, setName] = useState(vehicle.name || '');
  const [price, setPrice] = useState(vehicle.price || '');
  const [location, setLocation] = useState(vehicle.location || 'Panaji, Goa');
  const [fuel, setFuel] = useState(vehicle.fuel || 'Petrol');
  const [transmission, setTransmission] = useState(vehicle.transmission || 'Automatic');
  const [seating, setSeating] = useState(vehicle.seating || '5 Seater');
  const [engine, setEngine] = useState(vehicle.engine || '150cc');
  const [mileage, setMileage] = useState(vehicle.mileage || '40 km/l');
  const [image, setImage] = useState(vehicle.image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !price) { setError('Name and Price are required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        id: vehicle.id,
        type: isCar ? 'car' : 'bike',
        name,
        price: parseInt(price, 10),
        location,
        fuel,
        transmission: isCar ? transmission : undefined,
        seating: isCar ? seating : undefined,
        engine: !isCar ? engine : undefined,
        mileage: !isCar ? mileage : undefined,
        image: image || vehicle.image,
        category: vehicle.category,
      };
      if (isCar && onUpdateCar) {
        await onUpdateCar(payload);
      } else if (!isCar && onUpdateBike) {
        await onUpdateBike(payload);
      } else {
        await updateVehicle(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-0 pb-0 px-4 pt-4" style={{ background: 'linear-gradient(135deg, #0D1B2E, #1a3050)' }}>
            <div>
              <h5 className="modal-title fw-bold text-white mb-1 d-flex align-items-center gap-2">
                <Edit2 size={18} style={{ color: '#FF8A00' }} />
                Edit Vehicle — {vehicle.name}
              </h5>
              <span className="badge" style={{ background: isCar ? '#0052ff22' : '#ff990022', color: isCar ? '#60a5fa' : '#fb923c', border: `1px solid ${isCar ? '#0052ff44' : '#ff990044'}`, fontSize: '11px' }}>
                {isCar ? '🚗 Car' : '🏍️ Bike'}
              </span>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-4 text-start">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3 rounded-3" style={{ fontSize: '13px' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="row g-3">
                {/* Vehicle Name */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary mb-1">Vehicle Name / Model *</label>
                  <input
                    type="text"
                    className="form-control premium-input-field"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Honda Activa 6G"
                    required
                  />
                </div>

                {/* Price + Fuel */}
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Price per Day (₹) *</label>
                  <input
                    type="number"
                    className="form-control premium-input-field"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Fuel Type</label>
                  <select className="form-select premium-input-field" value={fuel} onChange={e => setFuel(e.target.value)}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric (EV)">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                {/* Car-specific: Transmission + Seating */}
                {isCar ? (
                  <>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Gearbox</label>
                      <select className="form-select premium-input-field" value={transmission} onChange={e => setTransmission(e.target.value)}>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Seating Capacity</label>
                      <input
                        type="text"
                        list="editSeatingOptions"
                        className="form-control premium-input-field"
                        value={seating}
                        onChange={e => setSeating(e.target.value)}
                        placeholder="e.g. 5 Seater"
                      />
                      <datalist id="editSeatingOptions">
                        <option value="2 Seater" />
                        <option value="4 Seater" />
                        <option value="5 Seater" />
                        <option value="6 Seater" />
                        <option value="7 Seater" />
                      </datalist>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Engine CC</label>
                      <input type="text" className="form-control premium-input-field" value={engine} onChange={e => setEngine(e.target.value)} placeholder="e.g. 150cc" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-secondary mb-1">Mileage</label>
                      <input type="text" className="form-control premium-input-field" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="e.g. 40 km/l" />
                    </div>
                  </>
                )}

                {/* 📍 LOCATION — Key new field */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1">
                    <MapPin size={14} style={{ color: '#0052ff' }} /> Vehicle Pickup Location (Goa)
                  </label>
                  <select
                    className="form-select premium-input-field"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  >
                    {GOA_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                    📍 This location will be shown to customers on vehicle cards
                  </small>
                </div>

                {/* Image URL */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-secondary mb-1">Vehicle Image URL (optional)</label>
                  <input
                    type="url"
                    className="form-control premium-input-field"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="https://example.com/car.jpg"
                  />
                  {image && (
                    <img src={image} alt="preview" className="mt-2 rounded-3 border" style={{ height: '70px', objectFit: 'cover' }} />
                  )}
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px' }} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" /> Saving…</> : <><Save size={16} /> Save Changes</>}
                </button>
                <button type="button" className="btn btn-outline-secondary fw-bold px-4" onClick={onClose} style={{ borderRadius: '10px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboard({
  currentUser,
  vendors,
  cars,
  bikes,
  onAddCar,
  onAddBike,
  onUpdateCar,
  onUpdateBike,
  onDeleteCar,
  onDeleteBike,
  bookings = [],
  activeTab = 'fleet',
  setActiveTab
}) {
  const isVendorRole = currentUser && currentUser.role === 'vendor';
  const initialVendorId = isVendorRole ? (currentUser.vendor_id || currentUser.id) : 'all';
  const [selectedVendorId, setSelectedVendorId] = useState(initialVendorId);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [blockedModal, setBlockedModal] = useState({
    show: false,
    balance: 0,
    negativeBookingCount: 0,
    maxNegativeBookings: 2
  });
  const [minBalanceModal, setMinBalanceModal] = useState({
    show: false,
    balance: 0,
    threshold: 1000,
    alertId: null
  });

  useEffect(() => {
    const vId = currentUser?.vendor_id || currentUser?.id;
    if (!vId) return;

    fetch(`${API_BASE}?resource=vendor_wallet_info&vendor_id=${encodeURIComponent(vId)}`)
      .then(res => res.json())
      .then(info => {
        if (info && info.active_portal_alert && info.active_portal_alert.active) {
          setMinBalanceModal({
            show: true,
            balance: info.active_portal_alert.balance,
            threshold: info.active_portal_alert.threshold,
            alertId: info.active_portal_alert.alert_id
          });
        }
      })
      .catch(() => {});
  }, [currentUser]);
  const [editVehicle, setEditVehicle] = useState(null); // { vehicle, type }
  const activeVendor = (!selectedVendorId || selectedVendorId === 'all')
    ? { id: 'all', name: 'All Vendors', role: 'admin' }
    : ((vendors || []).find(v => v.id === selectedVendorId) || (vendors || [])[0] || currentUser);

  const isVendorMatch = (vehVendorId) => {
    if (!selectedVendorId || selectedVendorId === 'all') return true;
    const target = String(selectedVendorId).trim().toLowerCase();
    const vId = String(vehVendorId || '').trim().toLowerCase();
    if (vId === target) return true;
    // Map main vendor aliases
    if ((target === 'u-4' || target === 'vendor') && (vId === 'u-4' || vId === 'vendor' || vId === 'vendor-1' || vId === 'vendor-2' || !vId)) {
      return true;
    }
    return false;
  };

  const vendorCars = (!selectedVendorId || selectedVendorId === 'all')
    ? cars
    : cars.filter(c => isVendorMatch(c.vendor_id || c.vendorId));

  const vendorBikes = (!selectedVendorId || selectedVendorId === 'all')
    ? bikes
    : bikes.filter(b => isVendorMatch(b.vendor_id || b.vendorId));

  const isMyVehicleBooking = (b) => {
    // Standard direct bookings
    if (vendorCars.some(c => c.id === b.item_id) || vendorBikes.some(bk => bk.id === b.item_id)) {
      return true;
    }
    // Craft My Trip custom bookings
    if (b.item_id && b.item_id.startsWith('craft-')) {
      try {
        const cust = JSON.parse(b.customizations || '{}');
        if (cust.vehicle) {
           if (vendorCars.some(c => c.id === cust.vehicle.id) || vendorBikes.some(bk => bk.id === cust.vehicle.id)) {
             return true;
           }
        }
      } catch (e) {}
    }
    return false;
  };

  // Fleet form states
  const [vehName, setVehName] = useState('');
  const [submittingVeh, setSubmittingVeh] = useState(false);
  const [vehType, setVehType] = useState('car-suv');
  const [vehPrice, setVehPrice] = useState('');
  const [vehTransmission, setVehTransmission] = useState('Automatic');
  const [vehFuel, setVehFuel] = useState('Petrol');
  const [vehSeating, setVehSeating] = useState('5 Seater');
  const [vehEngine, setVehEngine] = useState('150cc');
  const [vehMileage, setVehMileage] = useState('40 km/l');
  const [vehImage, setVehImage] = useState('');
  const [vehFiles, setVehFiles] = useState([]);
  const [vehDocs, setVehDocs] = useState([]);
  const [vehLocation, setVehLocation] = useState('Panaji, Goa');

  const handleVehFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const mediaPromises = files.map(async file => {
        if (file.type && file.type.startsWith('video/')) {
          // Fallback for video or upload if supported
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = ev => resolve({ type: 'video', url: ev.target.result });
            reader.readAsDataURL(file);
          });
        }
        const resUrl = await uploadImage(file);
        const finalUrl = typeof resUrl === 'string' ? resUrl : (resUrl?.url || '');
        return { type: 'image', url: finalUrl };
      });
      const media = await Promise.all(mediaPromises);
      setVehFiles(prev => [...prev, ...media.filter(m => m.url)]);
    } catch (err) {
      alert("Error uploading files: " + err.message);
    }
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!vehName || !vehPrice) { alert("Please fill out the vehicle name and price."); return; }
    if (!selectedVendorId) { alert("No vendor profile selected."); return; }
    if (vehDocs.length === 0) { alert("Please upload RC Book / Permit documentation before listing your vehicle."); return; }

    setSubmittingVeh(true);
    try {
      const priceNum = parseInt(vehPrice, 10);
      const isCarType = vehType.startsWith('car-');
      const mediaList = vehFiles.length > 0 ? vehFiles : (vehImage ? [{ type: 'image', url: vehImage }] : []);
      const primaryImage = mediaList[0]?.url || vehImage || '';

      let typeLabel = 'Car';
      if (vehType === 'car-hatchback') typeLabel = 'Hatchback';
      else if (vehType === 'car-sedan') typeLabel = 'Sedan';
      else if (vehType === 'car-suv') typeLabel = 'SUV';
      else if (vehType === 'car-thar') typeLabel = 'SUV';
      else if (vehType === 'car-luxury') typeLabel = 'Luxury';
      else if (vehType === 'bike-scooter') typeLabel = 'Scooter';
      else if (vehType === 'bike-cruiser') typeLabel = 'Cruiser';
      else if (vehType === 'bike-sports') typeLabel = 'Sports';
      else if (vehType === 'bike-adventure') typeLabel = 'Adventure';

      const targetVendorId = (selectedVendorId && selectedVendorId !== 'all') ? selectedVendorId : (vendors[0]?.id || 'vendor-1');

      if (isCarType) {
        await onAddCar({
          id: 'car-vendor-' + Date.now(),
          vendorId: targetVendorId,
          name: vehName,
          category: typeLabel,
          image: primaryImage,
          mediaList: mediaList,
          documents: vehDocs,
          price: priceNum,
          seating: vehSeating,
          fuel: vehFuel,
          transmission: vehTransmission,
          rating: 4.8,
          badge: 'Verified Vendor',
          location: vehLocation
        });
      } else {
        await onAddBike({
          id: 'bike-vendor-' + Date.now(),
          vendorId: targetVendorId,
          name: vehName,
          category: typeLabel,
          image: primaryImage,
          mediaList: mediaList,
          documents: vehDocs,
          price: priceNum,
          engine: vehEngine,
          fuel: vehFuel,
          mileage: vehMileage,
          rating: 4.7,
          badge: 'Verified Vendor',
          location: vehLocation
        });
      }

      setVehName('');
      setVehPrice('');
      setVehImage('');
      setVehFiles([]);
      setVehDocs([]);
      setVehLocation('Panaji, Goa');
      if (setActiveTab) setActiveTab('fleet');
    } catch (err) {
      alert("Failed to list vehicle: " + err.message);
    } finally {
      setSubmittingVeh(false);
    }
  };

  const [loadingToggle, setLoadingToggle] = useState(null);

  const handleToggle = async (id, type, currentStatus) => {
    setLoadingToggle(id);
    try {
      await toggleVehicleAvailability(id, type, !currentStatus);
      if (type === 'car' && onUpdateCar) {
        await onUpdateCar({ id, is_available: !currentStatus ? 1 : 0 });
      } else if (type === 'bike' && onUpdateBike) {
        await onUpdateBike({ id, is_available: !currentStatus ? 1 : 0 });
      }
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setLoadingToggle(null);
    }
  };

  return (
    <div className="row g-4 text-start">
      {!activeVendor ? (
        <div className="col-12 py-5 text-center bg-white border rounded-4 shadow-sm">
          <AlertCircle className="text-warning mx-auto mb-2" size={40} />
          <h5 className="fw-bold">No Operator Found</h5>
          <p className="text-muted small">Ask an Admin/Superadmin user to register your vendor account first.</p>
        </div>
      ) : (
        <>
          {activeTab === 'add_vehicle' && (
            /* Add Fleet Form */
            <div className="col-12">
              <div className="card luxury-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h5 className="fw-bold m-0 d-flex align-items-center gap-2 text-primary font-heading">
                    <Sparkles className="text-warning" size={20} />
                    Add Fleet Vehicle Listing
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveTab('fleet')}>
                    <X size={16} className="me-1" /> Cancel
                  </button>
                </div>
                <form onSubmit={handleAddVehicleSubmit}>
                  <div className="row g-2">
                    <div className="col-12 mb-2 text-start">
                      <label className="form-label small fw-bold text-secondary">Vehicle Name / Model</label>
                      <input type="text" className="form-control premium-input-field" placeholder="e.g. Mahindra Thar 4x4" value={vehName} onChange={(e) => setVehName(e.target.value)} required />
                    </div>

                    <div className="col-12 mb-2 text-start">
                      <label className="form-label small fw-bold text-secondary">Vehicle Type & Category</label>
                      <select className="form-select premium-input-field" value={vehType} onChange={(e) => setVehType(e.target.value)}>
                        <option value="car-compact">Compact Car (Self Drive)</option>
                        <option value="car-premium-hatchback">Premium Hatchback (Self Drive)</option>
                        <option value="car-premium-sedan">Premium Sedan (Self Drive)</option>
                        <option value="car-muv">MUV Car (Self Drive)</option>
                        <option value="car-mpv">MPV Car (Self Drive)</option>
                        <option value="car-7-seater">7-Seater Car (Self Drive)</option>
                        <option value="car-jeep">Open Jeep (Self Drive)</option>
                        <option value="car-4x4">4×4 Vehicle (Self Drive)</option>
                        <option value="car-pickup">Pickup Truck (Self Drive)</option>
                        <option value="car-minivan">Minivan (Self Drive)</option>
                        <option value="car-electric">Electric Car (Self Drive)</option>
                        <option value="car-premium-suv">Premium SUV (Self Drive)</option>
                        <option value="car-luxury-sedan">Luxury Sedan (Self Drive)</option>
                        <option value="car-wedding">Wedding Car (Self Drive)</option>
                        <option value="bike-electric-scooter">Electric Scooter (Rental)</option>
                        <option value="bike-commuter">Commuter Bike (Rental)</option>
                        <option value="bike-street">Street Bike (Rental)</option>
                        <option value="bike-naked">Naked Sports Bike (Rental)</option>
                        <option value="bike-retro">Retro Classic Bike (Rental)</option>
                        <option value="bike-touring">Touring Motorbike (Rental)</option>
                        <option value="bike-offroad">Off-road Bike (Rental)</option>
                        <option value="bike-dirt">Dirt Bike (Rental)</option>
                        <option value="bike-superbike">Superbike (Rental)</option>
                        <option value="bike-electric">Electric Motorbike (Rental)</option>
                        <option value="bike-moped">Moped (Rental)</option>
                        <option value="bike-gearless">Gearless Scooter (Rental)</option>
                        <option value="cycle-standard">Standard Bicycle (Rental)</option>
                        <option value="cycle-mountain">Mountain Bicycle (Rental)</option>
                        <option value="cycle-electric">Electric Bicycle (Rental)</option>
                        <option value="cycle-tandem">Tandem Bicycle (Rental)</option>
                      </select>
                    </div>

                    {/* 📍 Location — Goa Only Selector */}
                    <div className="col-12 mb-2 text-start">
                      <label className="form-label small fw-bold text-secondary d-flex align-items-center gap-1">
                        <MapPin size={13} style={{ color: '#0052ff' }} /> Pickup Location (Goa)
                      </label>
                      <select className="form-select premium-input-field" value={vehLocation} onChange={(e) => setVehLocation(e.target.value)}>
                        {GOA_LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>📍 Customers will see this location on your vehicle card</small>
                    </div>

                    <div className="col-6 mb-2">
                      <label className="form-label small fw-bold text-secondary">Price per Day (₹)</label>
                      <input type="number" className="form-control premium-input-field" placeholder="e.g. 1500" value={vehPrice} onChange={(e) => setVehPrice(e.target.value)} required />
                    </div>

                    {vehType.startsWith('car-') ? (
                      <>
                        <div className="col-6 mb-2">
                          <label className="form-label small fw-bold text-secondary">Seating Cap</label>
                          <input type="text" list="seatingCapOptions" className="form-control premium-input-field" value={vehSeating} onChange={(e) => setVehSeating(e.target.value)} placeholder="e.g. 4 Seater" />
                          <datalist id="seatingCapOptions">
                            <option value="2 Seater" />
                            <option value="4 Seater" />
                            <option value="5 Seater" />
                            <option value="6 Seater" />
                            <option value="7 Seater" />
                          </datalist>
                        </div>
                        <div className="col-6 mb-2">
                          <label className="form-label small fw-bold text-secondary">Gearbox</label>
                          <select className="form-select premium-input-field" value={vehTransmission} onChange={(e) => setVehTransmission(e.target.value)}>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-6 mb-2">
                          <label className="form-label small fw-bold text-secondary">Engine CC</label>
                          <input type="text" className="form-control premium-input-field" placeholder="e.g. 350cc" value={vehEngine} onChange={(e) => setVehEngine(e.target.value)} />
                        </div>
                        <div className="col-6 mb-2">
                          <label className="form-label small fw-bold text-secondary">Mileage</label>
                          <input type="text" className="form-control premium-input-field" placeholder="e.g. 35 km/l" value={vehMileage} onChange={(e) => setVehMileage(e.target.value)} />
                        </div>
                      </>
                    )}

                    {/* RC Documents */}
                    <div className="col-12 mb-3">
                      <label className="form-label small fw-bold text-secondary mb-1">
                        Upload Vehicle Documents (RC Book / Permit) <span className="text-danger">* Required</span>
                      </label>
                      <input type="file" className="form-control premium-input-field" accept=".pdf,image/*" required multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          const docs = files.map(file => ({ type: 'document', name: file.name, url: URL.createObjectURL(file) }));
                          setVehDocs(docs);
                        }}
                      />
                      {vehDocs.length > 0 ? (
                        <span className="text-xxs text-success fw-bold d-block mt-1">✓ {vehDocs.length} Document(s) Attached</span>
                      ) : (
                        <span className="text-xxs text-danger d-block mt-1">You must attach validation documentation before listing.</span>
                      )}
                    </div>

                    {/* Media uploads */}
                    <div className="col-12 mb-3">
                      <label className="form-label small fw-bold text-secondary mb-1">Upload Media from Device (Images/Videos)</label>
                      <input type="file" className="form-control premium-input-field" accept="image/*,video/*" multiple onChange={handleVehFilesChange} />
                      <span className="text-xxs text-muted d-block mt-1">Or provide a direct image link below:</span>
                      <input type="url" className="form-control premium-input-field mt-1.5" placeholder="e.g. https://domain.com/car.jpg" value={vehImage} onChange={(e) => setVehImage(e.target.value)} />
                      {vehFiles.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-3 p-2 bg-light rounded-3 border">
                          {vehFiles.map((m, idx) => (
                            <div key={idx} className="position-relative border rounded overflow-hidden" style={{ width: '60px', height: '60px' }}>
                              {m.type === 'video' ? (
                                <div className="bg-dark text-white w-100 h-100 d-flex align-items-center justify-content-center text-xxs fw-bold">Video</div>
                              ) : (
                                <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                              <button type="button" className="position-absolute top-0 right-0 bg-danger text-white border-0 text-xxs p-0.5 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '15px', height: '15px', lineHeight: 1 }}
                                onClick={() => setVehFiles(vehFiles.filter((_, i) => i !== idx))}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fuel Choice */}
                    <div className="col-12 mb-2">
                      <label className="form-label small fw-bold text-secondary">Engine Fuel</label>
                      <select className="form-select premium-input-field" value={vehFuel} onChange={(e) => setVehFuel(e.target.value)}>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric (EV)">Electric (EV)</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={submittingVeh} className="btn btn-amber-gradient w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm mt-2">
                    {submittingVeh ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Listing Vehicle...
                      </>
                    ) : (
                      'Submit Listing'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'fleet' && (
            /* Active Fleet List Table */
            <div className="col-12">
              {/* Top Header Card */}
              <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
                <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
                  <div>
                    <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Active Fleet Listings</h4>
                    <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                      Manage your rental cars and bikes, update availability status, edit details, and add new inventory.
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    {(!isVendorRole && vendors && vendors.length > 0) && (
                      <div className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded-pill shadow-sm border">
                        <label className="text-secondary small fw-bold text-nowrap mb-0" style={{ fontSize: '0.78rem' }}>Operator:</label>
                        <select
                          className="form-select form-select-sm border-0 fw-bold text-dark"
                          style={{ maxWidth: '210px', fontSize: '0.82rem', background: 'transparent', cursor: 'pointer' }}
                          value={selectedVendorId}
                          onChange={(e) => setSelectedVendorId(e.target.value)}
                        >
                          <option value="all">All Operators ({cars.length + bikes.length} Total)</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name || v.username} ({v.id})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn px-4 py-2.5 rounded-pill fw-bold text-white shadow hover-scale d-flex align-items-center gap-2"
                      onClick={() => setActiveTab('add_vehicle')}
                      style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none' }}
                    >
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Vehicle
                    </button>
                  </div>
                </div>
              </div>

              <div className="card luxury-card p-4 h-100">
                {vendorCars.length === 0 && vendorBikes.length === 0 ? (
                  <p className="text-muted text-center py-5">No listings submitted yet by this vendor operator.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Vehicle</th>
                          <th>Category</th>
                          <th>Rates</th>
                          <th>Specs</th>
                          <th>📍 Location</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorCars.map(car => (
                          <tr key={car.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {car.image && <img src={car.image} alt={car.name} style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }} onError={e => e.target.style.display = 'none'} />}
                                <span className="fw-bold text-primary">{car.name}</span>
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{car.category}</span></td>
                            <td className="fw-bold">₹{car.price}/day</td>
                            <td><span className="text-muted text-xs">{car.transmission} • {car.fuel} • {car.seating}</span></td>
                            <td>
                              {car.location ? (
                                <span className="d-flex align-items-center gap-1 text-xs" style={{ color: '#0052ff', fontWeight: 600 }}>
                                  <MapPin size={11} /> {car.location}
                                </span>
                              ) : (
                                <span className="text-muted text-xs fst-italic">Not set</span>
                              )}
                            </td>
                            <td>
                              {Number(car.is_available) !== 0 ?
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"><Check size={12} className="me-1" />Available</span> :
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"><XCircle size={12} className="me-1" />Unavailable</span>
                              }
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
                                  onClick={() => setEditVehicle({ vehicle: car, type: 'car' })}
                                  title="Edit vehicle"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary py-1 px-2"
                                  onClick={() => handleToggle(car.id, 'car', Number(car.is_available) !== 0)}
                                  disabled={loadingToggle === car.id}
                                  title="Toggle availability"
                                >
                                  Toggle
                                </button>
                                {onDeleteCar && (
                                  <button
                                    className="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
                                    onClick={() => { if(window.confirm('Delete this car?')) onDeleteCar(car.id); }}
                                    title="Delete vehicle"
                                  >
                                    <XCircle size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {vendorBikes.map(bike => (
                          <tr key={bike.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {bike.image && <img src={bike.image} alt={bike.name} style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }} onError={e => e.target.style.display = 'none'} />}
                                <span className="fw-bold text-primary">{bike.name}</span>
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{bike.category}</span></td>
                            <td className="fw-bold">₹{bike.price}/day</td>
                            <td><span className="text-muted text-xs">{bike.engine} • {bike.mileage}</span></td>
                            <td>
                              {bike.location ? (
                                <span className="d-flex align-items-center gap-1 text-xs" style={{ color: '#f97316', fontWeight: 600 }}>
                                  <MapPin size={11} /> {bike.location}
                                </span>
                              ) : (
                                <span className="text-muted text-xs fst-italic">Not set</span>
                              )}
                            </td>
                            <td>
                              {Number(bike.is_available) !== 0 ?
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"><Check size={12} className="me-1" />Available</span> :
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"><XCircle size={12} className="me-1" />Unavailable</span>
                              }
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
                                  onClick={() => setEditVehicle({ vehicle: bike, type: 'bike' })}
                                  title="Edit vehicle"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary py-1 px-2"
                                  onClick={() => handleToggle(bike.id, 'bike', Number(bike.is_available) !== 0)}
                                  disabled={loadingToggle === bike.id}
                                  title="Toggle availability"
                                >
                                  Toggle
                                </button>
                                {onDeleteBike && (
                                  <button
                                    className="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
                                    onClick={() => { if(window.confirm('Delete this bike?')) onDeleteBike(bike.id); }}
                                    title="Delete vehicle"
                                  >
                                    <XCircle size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="col-12">
              {/* Top Header Card */}
              <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
                <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
                  <div>
                    <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>My Vehicle Bookings</h4>
                    <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>View all customer reservations for your listed fleet vehicles.</p>
                  </div>
                </div>
              </div>

              <div className="card luxury-card p-4">
                <div className="table-responsive">
                  <table className="table align-middle table-hover small border">
                    <thead className="table-light">
                      <tr>
                        <th>Booking ID</th>
                        <th>Customer Name</th>
                        <th>Contact & License</th>
                        <th>Vehicle Name</th>
                        <th>Pickup Loc & Time</th>
                        <th>Drop Loc & Time</th>
                        <th>Total Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.filter(isMyVehicleBooking).length === 0 ? (
                        <tr><td colSpan="8" className="text-center text-muted py-4">No bookings for your vehicles yet.</td></tr>
                      ) : (
                        bookings.filter(isMyVehicleBooking).map(b => {
                          let cust = {};
                          try { cust = b.customizations ? JSON.parse(b.customizations) : {}; } catch (e) {}
                          return (
                            <tr key={b.id} onClick={() => setSelectedBooking({ ...b, cust })} className="cursor-pointer">
                              <td className="fw-bold">{b.id}</td>
                              <td>{b.name}</td>
                              <td>
                                <div>{b.phone}</div>
                                {cust.drivingLicense && <div className="text-muted small">DL: {cust.drivingLicense.startsWith('data:image') ? <span className="badge bg-warning text-dark">Image Uploaded (Pending)</span> : cust.drivingLicense}</div>}
                                {b.license && !cust.drivingLicense && <div className="text-muted small">DL: {b.license}</div>}
                              </td>
                              <td className="text-primary fw-bold">{b.item_name}</td>
                              <td>
                                <div>{b.pickup_date} {b.pickup_time}</div>
                                <div className="text-muted small">{cust.vehiclePickupLoc || b.pickup_loc || 'Not specified'}</div>
                              </td>
                              <td>
                                <div>{b.drop_date} {b.drop_time}</div>
                                <div className="text-muted small">{cust.vehicleDropLoc || 'Not specified'}</div>
                              </td>
                              <td className="fw-bold text-success">₹{b.total_paid}</td>
                              <td>
                                <span className={`badge ${
                                  (b.status || '').toLowerCase() === 'completed' ? 'bg-success text-white' :
                                  (b.status || '').toLowerCase() === 'confirmed' ? 'bg-primary text-white' :
                                  (b.status || '').toLowerCase() === 'cancelled' || (b.status || '').toLowerCase() === 'rejected' ? 'bg-danger text-white' :
                                  'bg-warning text-dark'
                                } text-capitalize px-2.5 py-1 rounded-pill fw-bold`}>
                                  {b.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Vehicle Modal */}
      {editVehicle && (
        <EditVehicleModal
          vehicle={editVehicle.vehicle}
          vehicleType={editVehicle.type}
          onClose={() => setEditVehicle(null)}
          onSaved={() => setEditVehicle(null)}
          onUpdateCar={onUpdateCar}
          onUpdateBike={onUpdateBike}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
               <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Booking Details - {selectedBooking.id}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedBooking(null)}></button>
               </div>
               <div className="modal-body p-4 pt-3 text-start">
                  <div className="row g-4">
                    <div className="col-md-6">
                        <h6 className="fw-bold text-primary mb-3">Customer Information</h6>
                        <p className="mb-1"><strong>Name:</strong> {selectedBooking.name}</p>
                        <p className="mb-1"><strong>Phone:</strong> {selectedBooking.phone}</p>
                        <div className="mb-1">
                           <strong>License:</strong>{' '}
                           {selectedBooking.cust?.drivingLicense ? (
                             selectedBooking.cust.drivingLicense.startsWith('data:image') ? (
                               <div className="mt-2">
                                 <img src={selectedBooking.cust.drivingLicense} alt="Driving License" style={{maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', border: '1px solid #dee2e6', borderRadius: '4px'}} />
                                 <div className="badge bg-warning text-dark mt-1">Pending Verification</div>
                               </div>
                             ) : selectedBooking.cust.drivingLicense
                           ) : selectedBooking.license || 'N/A'}
                        </div>
                      </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">Booking Information</h6>
                      <p className="mb-1"><strong>Vehicle:</strong> {selectedBooking.item_name}</p>
                      <p className="mb-1"><strong>Status:</strong> <span className={`badge ${
                        (selectedBooking.status || '').toLowerCase() === 'completed' ? 'bg-success text-white' :
                        (selectedBooking.status || '').toLowerCase() === 'confirmed' ? 'bg-primary text-white' :
                        (selectedBooking.status || '').toLowerCase() === 'cancelled' || (selectedBooking.status || '').toLowerCase() === 'rejected' ? 'bg-danger text-white' :
                        'bg-warning text-dark'
                      } text-capitalize px-2.5 py-1 rounded-pill fw-bold`}>{selectedBooking.status || 'Pending'}</span></p>
                      <p className="mb-1"><strong>Total Paid:</strong> <span className="text-success fw-bold">₹{selectedBooking.total_paid}</span></p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">Pickup Details</h6>
                      <p className="mb-1"><strong>Date & Time:</strong> {selectedBooking.pickup_date} {selectedBooking.pickup_time}</p>
                      <p className="mb-1"><strong>Location:</strong> {selectedBooking.cust?.vehiclePickupLoc || selectedBooking.pickup_loc || 'Not specified'}</p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">Drop Details</h6>
                      <p className="mb-1"><strong>Date & Time:</strong> {selectedBooking.drop_date} {selectedBooking.drop_time}</p>
                      <p className="mb-1"><strong>Location:</strong> {selectedBooking.cust?.vehicleDropLoc || 'Not specified'}</p>
                    </div>
                  </div>
               </div>
               <div className="modal-footer border-0 pt-0 d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-2">
                    {(selectedBooking.status || '').toLowerCase() !== 'completed' && (selectedBooking.status || '').toLowerCase() !== 'cancelled' && (
                      <>
                        {(selectedBooking.status || '').toLowerCase() !== 'confirmed' && (
                          <button 
                            className="btn btn-sm btn-outline-success fw-bold rounded-pill px-3" 
                            onClick={async () => {
                              try {
                                await updateBookingStatus(selectedBooking.id, 'Confirmed');
                                setSelectedBooking(prev => ({ ...prev, status: 'Confirmed' }));
                                const target = bookings.find(b => b.id === selectedBooking.id);
                                if (target) target.status = 'Confirmed';
                                window.dispatchEvent(new CustomEvent('new-booking-created'));
                                window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId: selectedBooking.id, status: 'Confirmed' } }));
                                window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId: selectedBooking.id, status: 'Confirmed' } }));
                                alert(`Booking #${selectedBooking.id} Confirmed!`);
                              } catch (e) {
                                if (e.code === 'WALLET_BLOCKED' || (e.message && e.message.includes('WALLET_BLOCKED'))) {
                                  setBlockedModal({
                                    show: true,
                                    balance: e.balance !== undefined ? e.balance : (e.data?.balance ?? 0),
                                    negativeBookingCount: e.negative_booking_count !== undefined ? e.negative_booking_count : (e.data?.negative_booking_count ?? 0),
                                    maxNegativeBookings: e.max_negative_bookings !== undefined ? e.max_negative_bookings : (e.data?.max_negative_bookings ?? 2)
                                  });
                                } else {
                                  alert('Error: ' + e.message);
                                }
                              }
                            }}
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {(selectedBooking.status || '').toLowerCase() === 'confirmed' && (
                          <button 
                            className="btn btn-sm btn-success fw-bold text-white rounded-pill px-3" 
                            onClick={async () => {
                              try {
                                await updateBookingStatus(selectedBooking.id, 'Completed');
                                setSelectedBooking(prev => ({ ...prev, status: 'Completed' }));
                                const target = bookings.find(b => b.id === selectedBooking.id);
                                if (target) target.status = 'Completed';
                                window.dispatchEvent(new CustomEvent('new-booking-created'));
                                window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId: selectedBooking.id, status: 'Completed' } }));
                                window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId: selectedBooking.id, status: 'Completed' } }));
                                alert(`Booking #${selectedBooking.id} marked as Completed!`);
                              } catch (e) {
                                if (e.code === 'WALLET_BLOCKED' || (e.message && e.message.includes('WALLET_BLOCKED'))) {
                                  setBlockedModal({
                                    show: true,
                                    balance: e.balance !== undefined ? e.balance : (e.data?.balance ?? 0),
                                    negativeBookingCount: e.negative_booking_count !== undefined ? e.negative_booking_count : (e.data?.negative_booking_count ?? 0),
                                    maxNegativeBookings: e.max_negative_bookings !== undefined ? e.max_negative_bookings : (e.data?.max_negative_bookings ?? 2)
                                  });
                                } else {
                                  alert('Error: ' + e.message);
                                }
                              }
                            }}
                          >
                            ✓ Mark as Completed
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedBooking(null)}>Close</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="col-12 mt-2 text-start">
          <div className="p-4 rounded-4 mb-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe0cc 100%)', border: '1px solid rgba(255, 99, 51, 0.1)' }}>
            <div className="position-absolute top-0 end-0 h-100 opacity-25" style={{ width: '40%', background: 'radial-gradient(circle at right, #FF8A00 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
              <div>
                <h4 className="fw-extrabold mb-2 text-dark font-heading" style={{ letterSpacing: '0.5px' }}>Vendor Billing Details</h4>
                <p className="mb-0 text-secondary fw-medium" style={{ fontSize: '0.95rem' }}>
                  Your current subscription and billing information.
                </p>
              </div>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card luxury-card p-4">
                <h5 className="fw-bold mb-3">Subscription Overview</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Monthly Plan Price</span>
                  <span className="fw-bold fs-5 text-success">₹{activeVendor?.monthly_plan_price || 0}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Status</span>
                  <span className="badge bg-success">Active</span>
                </div>
                <hr />
                <p className="text-muted small">
                  This amount is billed monthly for your vendor access. For any upgrades or changes, please contact the Superadmin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <WalletRechargeRequiredModal
        show={blockedModal.show}
        isOpen={blockedModal.show}
        balance={blockedModal.balance}
        negativeBookingCount={blockedModal.negativeBookingCount}
        maxNegativeBookings={blockedModal.maxNegativeBookings}
        onClose={() => setBlockedModal(prev => ({ ...prev, show: false }))}
        onAddMoney={() => {
          setBlockedModal(prev => ({ ...prev, show: false }));
          window.dispatchEvent(new CustomEvent('navigate-vendor-tab', { detail: 'wallet' }));
          window.dispatchEvent(new CustomEvent('tripgalileo-navigate', { detail: { tab: 'wallet' } }));
        }}
      />
      <VendorMinimumBalanceAlertModal
        show={minBalanceModal.show}
        isOpen={minBalanceModal.show}
        balance={minBalanceModal.balance}
        threshold={minBalanceModal.threshold}
        alertId={minBalanceModal.alertId}
        vendorId={currentUser?.vendor_id || currentUser?.id}
        onClose={() => setMinBalanceModal(prev => ({ ...prev, show: false }))}
        onRecharge={() => {
          setMinBalanceModal(prev => ({ ...prev, show: false }));
          if (setActiveTab) setActiveTab('wallet');
        }}
      />
    </div>
  );
}
