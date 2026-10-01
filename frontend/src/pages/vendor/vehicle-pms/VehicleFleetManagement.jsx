import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, X, Save, Camera, Car, Bike, Upload, Loader2, CheckCircle2, Star, Image as ImageIcon } from 'lucide-react';
import { toggleVehicleAvailability, updateVehicle, deleteVehicle, uploadImage, apiFetch, API_BASE } from '../../../services/api';

function VehicleCard({ vehicle, type, onEdit, onToggle, onDelete, isSuspended }) {
  const available = vehicle.is_available !== 0 && vehicle.is_available !== false && vehicle.is_available !== '0';
  const [imgFailed, setImgFailed] = useState(false);

  let allImages = [];
  if (vehicle.images_json) {
    try {
      const parsed = JSON.parse(vehicle.images_json);
      if (Array.isArray(parsed) && parsed.length > 0) allImages = parsed;
    } catch (e) {}
  }
  if (allImages.length === 0 && vehicle.image) {
    allImages = [vehicle.image];
  }

  const displayImage = allImages[0] || vehicle.image;

  return (
    <div className="rounded-3 overflow-hidden shadow-sm h-100 d-flex flex-column justify-content-between" style={{ background: '#fff', border: `1px solid ${available ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.07)'}` }}>
      <div>
        <div className="position-relative" style={{ height: '160px', background: '#f8fafc', overflow: 'hidden' }}>
          {displayImage && !imgFailed ? (
            <img
              src={displayImage}
              alt={vehicle.name}
              onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-3" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', color: '#64748b' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-xs" style={{ width: '44px', height: '44px', background: 'rgba(100,116,139,0.1)', border: '1px dashed rgba(100,116,139,0.25)' }}>
                <Camera size={20} className="text-secondary opacity-75" />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', letterSpacing: '0.2px' }}>No Photo Uploaded</span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>Click Edit to upload</span>
            </div>
          )}
          <div className="position-absolute top-0 start-0 m-2 d-flex gap-1">
            {isSuspended ? (
              <span className="px-2 py-1 rounded-pill fw-bold text-white shadow-sm" style={{ background: '#dc2626', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                HIDDEN — ADMIN REACTIVATION REQUIRED
              </span>
            ) : (
              <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: available ? '#dcfce7' : '#fee2e2', color: available ? '#16a34a' : '#dc2626', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                {available ? 'Available' : 'Unavailable'}
              </span>
            )}
            {allImages.length > 1 && (
              <span className="px-2 py-1 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center gap-1" style={{ background: 'rgba(13,27,46,0.75)', backdropFilter: 'blur(4px)', fontSize: '0.62rem' }}>
                <ImageIcon size={10} /> {allImages.length} Photos
              </span>
            )}
          </div>
          <div className="position-absolute top-0 end-0 m-2">
            <span className="px-2 py-1 rounded-pill fw-bold text-white" style={{ background: type === 'car' ? '#2563eb' : '#7c3aed', fontSize: '0.62rem', textTransform: 'uppercase' }}>
              {type}
            </span>
          </div>
        </div>
        <div className="p-3 pb-1">
          <div className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '14px' }}>{vehicle.name}</div>
          <div className="d-flex gap-1 flex-wrap mb-2">
            <span className="px-2 py-1 rounded-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem', fontWeight: 700 }}>
              Fleet: {vehicle.fleet_count || 1} {(vehicle.fleet_count || 1) === 1 ? 'Unit' : 'Units'}
            </span>
            {vehicle.category && <span className="px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{vehicle.category}</span>}
            {vehicle.fuel && <span className="px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{vehicle.fuel}</span>}
            {vehicle.transmission && <span className="px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{vehicle.transmission}</span>}
            {vehicle.seating && <span className="px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{vehicle.seating}</span>}
            {vehicle.engine && <span className="px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{vehicle.engine}</span>}
          </div>
        </div>
      </div>
      <div className="p-3 pt-0">
        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
          <div>
            <div className="fw-bold" style={{ color: '#FF6333', fontSize: '1.1rem' }}>₹{vehicle.price}<span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400 }}>/day</span></div>
            {vehicle.location && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>📍 {vehicle.location}</div>}
          </div>
          <div className="d-flex gap-1">
            <button onClick={() => onToggle(vehicle)} className="btn btn-sm p-1 border-0" title={available ? 'Mark Unavailable' : 'Mark Available'} style={{ background: 'transparent', color: available ? '#16a34a' : '#94a3b8' }}>
              {available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
            <button onClick={() => onEdit(vehicle)} className="btn btn-sm px-2 py-1 rounded-2" title="Edit Vehicle" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.68rem' }}><Edit size={12} /></button>
            <button onClick={() => onDelete(vehicle.id, type)} className="btn btn-sm px-2 py-1 rounded-2" title="Delete Vehicle" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.68rem' }}><Trash2 size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CAR_CATEGORIES = [
  'Hatchback',
  'Sedan',
  'Compact Sedan',
  'Premium Sedan',
  'SUV',
  'Compact SUV',
  'Mid-Size SUV',
  'Luxury SUV',
  '4x4 Off-Roader',
  'MUV / 7-Seater',
  'Minivan / MPV',
  'Electric Vehicle (EV)',
  'Convertible / Cabriolet',
  'Coupe',
  'Sports Car',
  'Luxury / VIP Limousine',
  'Vintage / Classic'
];

const BIKE_CATEGORIES = [
  'Scooter / Moped',
  'Cruiser',
  'Sports Bike',
  'Tourer / Adventure',
  'Electric Scooter (EV)',
  'Cafe Racer',
  'Standard / Commuter',
  'Superbike',
  'Dirt / Off-Road',
  'Vintage / Classic'
];

function getSuggestedCategories(name, type) {
  const n = (name || '').toLowerCase().trim();
  if (type === 'bike') {
    if (n.includes('activa') || n.includes('jupiter') || n.includes('access') || n.includes('dio') || n.includes('pleasure') || n.includes('ntorq') || n.includes('fascino') || n.includes('burgman') || n.includes('vespa') || n.includes('xl 100') || n.includes('scooter') || n.includes('moped')) {
      return ['Scooter / Moped', 'Electric Scooter (EV)', 'Standard / Commuter', 'Cruiser', 'Tourer / Adventure'];
    }
    if (n.includes('bullet') || n.includes('classic') || n.includes('hunter') || n.includes('meteor') || n.includes('interceptor') || n.includes('avenger') || n.includes('jawa') || n.includes('yezdi') || n.includes('cruiser')) {
      return ['Cruiser', 'Standard / Commuter', 'Tourer / Adventure', 'Cafe Racer', 'Vintage / Classic'];
    }
    if (n.includes('himalayan') || n.includes('adv') || n.includes('adventure') || n.includes('xpulse') || n.includes('v-strom') || n.includes('gs') || n.includes('tiger')) {
      return ['Tourer / Adventure', 'Dirt / Off-Road', 'Cruiser', 'Sports Bike', 'Standard / Commuter'];
    }
    if (n.includes('ninja') || n.includes('r15') || n.includes('duke') || n.includes('rc') || n.includes('ktm') || n.includes('apache') || n.includes('pulsar') || n.includes('gixxer') || n.includes('sports') || n.includes('rr')) {
      return ['Sports Bike', 'Superbike', 'Standard / Commuter', 'Cafe Racer', 'Tourer / Adventure'];
    }
    if (n.includes('ather') || n.includes('ola') || n.includes('iqube') || n.includes('chetak') || n.includes('ev') || n.includes('electric')) {
      return ['Electric Scooter (EV)', 'Scooter / Moped', 'Standard / Commuter', 'Cafe Racer', 'Tourer / Adventure'];
    }
    return ['Scooter / Moped', 'Cruiser', 'Sports Bike', 'Tourer / Adventure', 'Standard / Commuter'];
  }

  // Car category matching
  if (n.includes('thar') || n.includes('jimny') || n.includes('wrangler') || n.includes('rubicon') || n.includes('gypsy') || n.includes('gurkha') || n.includes('4x4') || n.includes('offroad') || n.includes('defender')) {
    return ['4x4 Off-Roader', 'SUV', 'Luxury SUV', 'Mid-Size SUV', 'Compact SUV'];
  }
  if (n.includes('innova') || n.includes('ertiga') || n.includes('carens') || n.includes('rumion') || n.includes('xl6') || n.includes('marazzo') || n.includes('triber') || n.includes('7 seater') || n.includes('muv') || n.includes('carnival')) {
    return ['MUV / 7-Seater', 'Minivan / MPV', 'SUV', 'Luxury SUV', 'Mid-Size SUV'];
  }
  if (n.includes('creta') || n.includes('seltos') || n.includes('brezza') || n.includes('nexon') || n.includes('venue') || n.includes('sonet') || n.includes('grand vitara') || n.includes('hyryder') || n.includes('taigun') || n.includes('kushaq') || n.includes('punch') || n.includes('fronx') || n.includes('exter') || n.includes('magnite') || n.includes('kiger')) {
    return ['Compact SUV', 'SUV', 'Mid-Size SUV', 'Electric Vehicle (EV)', 'Hatchback'];
  }
  if (n.includes('fortuner') || n.includes('endeavour') || n.includes('scorpio') || n.includes('xuv700') || n.includes('xuv') || n.includes('safari') || n.includes('harrier') || n.includes('hector') || n.includes('gloster') || n.includes('tucson') || n.includes('kodiaq') || n.includes('compass') || n.includes('meridian')) {
    return ['SUV', 'Luxury SUV', 'Mid-Size SUV', '4x4 Off-Roader', 'MUV / 7-Seater'];
  }
  if (n.includes('bmw') || n.includes('mercedes') || n.includes('audi') || n.includes('jaguar') || n.includes('land rover') || n.includes('volvo') || n.includes('porsche') || n.includes('lexus') || n.includes('range rover')) {
    return ['Luxury SUV', 'Luxury / VIP Limousine', 'Premium Sedan', 'Convertible / Cabriolet', 'Sports Car'];
  }
  if (n.includes('dzire') || n.includes('city') || n.includes('verna') || n.includes('amaze') || n.includes('aura') || n.includes('slavia') || n.includes('virtus') || n.includes('ciaz') || n.includes('camry') || n.includes('accord') || n.includes('sedan')) {
    return ['Sedan', 'Compact Sedan', 'Premium Sedan', 'Electric Vehicle (EV)', 'Luxury / VIP Limousine'];
  }
  if (n.includes('swift') || n.includes('baleno') || n.includes('i20') || n.includes('i10') || n.includes('wagon r') || n.includes('wagonr') || n.includes('alto') || n.includes('tiago') || n.includes('altroz') || n.includes('kwid') || n.includes('ignis') || n.includes('glanza') || n.includes('polo') || n.includes('hatchback')) {
    return ['Hatchback', 'Compact SUV', 'Sedan', 'Electric Vehicle (EV)', 'Compact Sedan'];
  }
  if (n.includes('ev') || n.includes('electric') || n.includes('zs ev') || n.includes('ioniq') || n.includes('curvv') || n.includes('byd') || n.includes('tigor ev') || n.includes('nexon ev') || n.includes('punch ev')) {
    return ['Electric Vehicle (EV)', 'Compact SUV', 'SUV', 'Hatchback', 'Sedan'];
  }
  if (n.includes('mustang') || n.includes('ferrari') || n.includes('lamborghini') || n.includes('sport') || n.includes('cooper') || n.includes('mini') || n.includes('convertible') || n.includes('cabriolet') || n.includes('coupe') || n.includes('thar convertible')) {
    return ['Convertible / Cabriolet', 'Sports Car', 'Coupe', 'Luxury / VIP Limousine', '4x4 Off-Roader'];
  }

  // Default top 5 categories
  return ['Hatchback', 'Sedan', 'SUV', 'Compact SUV', 'MUV / 7-Seater'];
}

const BIKE_CATEGORIES_SET = new Set([
  'scooter', 'scooter / moped', 'sports bike', 'cruiser', 'tourer / adventure',
  'electric scooter (ev)', 'superbike', 'dirt / off-road', 'cafe racer', 'standard / commuter', 'bike'
]);

function isBikeItem(item) {
  if (!item) return false;
  if (item._type === 'bike' || item.type === 'bike') return true;
  const cat = (item.category || '').toLowerCase().trim();
  if (BIKE_CATEGORIES_SET.has(cat) || cat.includes('bike') || cat.includes('scooter') || cat.includes('moped')) return true;
  const name = (item.name || '').toLowerCase().trim();
  if (name.includes('ninja') || name.includes('kavasaki') || name.includes('kawasaki') || name.includes('activa') || name.includes('jupiter') || name.includes('bullet') || name.includes('ktm') || name.includes('duke') || name.includes('r15') || name.includes('pulsar')) return true;
  return false;
}

export default function VehicleFleetManagement({ currentUser, cars = [], bikes = [], initialFilter, onAddCar, onAddBike, onUpdateCar, onUpdateBike, onDeleteCar, onDeleteBike }) {
  const [activeTab, setActiveTab] = useState(initialFilter || 'all');
  const [search, setSearch] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      apiFetch(`${API_BASE}?resource=vendor_wallet_info&vendor_id=${currentUser.id}`)
        .then(r => r.json())
        .then(d => { if (d && !d.error) setWalletInfo(d); })
        .catch(console.error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (initialFilter) {
      setActiveTab(initialFilter);
    }
  }, [initialFilter]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    fleet_quantity: 1,
    category: 'Hatchback',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seating: '5 Seater',
    engine: '150cc',
    mileage: '40 km/l',
    location: 'Goa Delivery',
    image: '',
    images: []
  });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('car');
  const [addForm, setAddForm] = useState({
    name: '',
    price: '',
    fleet_quantity: 1,
    category: 'Hatchback',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seating: '5 Seater',
    engine: '150cc',
    mileage: '40 km/l',
    location: 'Goa Delivery',
    image: '',
    images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Flexible Vehicle Vendor Inventory Isolation
  const isVehicleOwner = (v) => {
    if (!currentUser || currentUser.role !== 'vendor') return true;
    const vId = String(v?.vendor_id || v?.vendorId || '').trim().toLowerCase();
    const uId = String(currentUser?.id || '').trim().toLowerCase();
    const uName = String(currentUser?.username || '').trim().toLowerCase();
    const uVendorId = String(currentUser?.vendor_id || '').trim().toLowerCase();
    if (vId && (vId === uId || vId === uName || (uVendorId && vId === uVendorId))) return true;
    const isMainVendor = uId === 'u-4' || uName === 'vendor';
    if (isMainVendor && (vId === 'u-4' || vId === 'vendor' || vId === 'vendor-1' || vId === 'vendor-2' || !vId)) return true;
    return false;
  };

  const displayCars = (cars || []).filter(isVehicleOwner).filter(c => !isBikeItem(c));
  const displayBikes = [
    ...(bikes || []).filter(isVehicleOwner),
    ...(cars || []).filter(isVehicleOwner).filter(c => isBikeItem(c))
  ];

  const allCombined = [...displayCars.map(v => ({ ...v, _type: 'car' })), ...displayBikes.map(v => ({ ...v, _type: 'bike' }))];
  const availableCount = allCombined.filter(v => v.is_available !== 0 && v.is_available !== false && v.is_available !== '0').length;
  const unavailableCount = allCombined.filter(v => v.is_available === 0 || v.is_available === false || v.is_available === '0').length;

  const filtered = (() => {
    let src = allCombined;
    if (activeTab === 'cars') src = displayCars.map(v => ({ ...v, _type: 'car' }));
    else if (activeTab === 'bikes') src = displayBikes.map(v => ({ ...v, _type: 'bike' }));
    else if (activeTab === 'available') src = allCombined.filter(v => v.is_available !== 0 && v.is_available !== false && v.is_available !== '0');
    else if (activeTab === 'unavailable') src = allCombined.filter(v => v.is_available === 0 || v.is_available === false || v.is_available === '0');
    return src.filter(v => (v.name || '').toLowerCase().includes(search.toLowerCase()));
  })();

  const handleImageUpload = async (e, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalid = files.find(f => !validTypes.includes(f.type));
    if (invalid) {
      setUploadError('Please select valid image files (JPG, PNG, WEBP, GIF).');
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    try {
      // Upload all selected files concurrently
      const uploadPromises = files.map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      if (isEdit) {
        setEditForm(prev => {
          const currentImages = prev.images && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
          const merged = [...currentImages, ...uploadedUrls];
          return {
            ...prev,
            images: merged,
            image: merged[0] || ''
          };
        });
      } else {
        setAddForm(prev => {
          const currentImages = prev.images && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
          const merged = [...currentImages, ...uploadedUrls];
          return {
            ...prev,
            images: merged,
            image: merged[0] || ''
          };
        });
      }
    } catch (err) {
      setUploadError('Image upload failed: ' + (err.message || 'Server error'));
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => {
        const updated = (prev.images || []).filter((_, i) => i !== index);
        return {
          ...prev,
          images: updated,
          image: updated[0] || ''
        };
      });
    } else {
      setAddForm(prev => {
        const updated = (prev.images || []).filter((_, i) => i !== index);
        return {
          ...prev,
          images: updated,
          image: updated[0] || ''
        };
      });
    }
  };

  const setPrimaryImage = (index, isEdit = false) => {
    if (index === 0) return;
    if (isEdit) {
      setEditForm(prev => {
        const list = [...(prev.images || [])];
        const [chosen] = list.splice(index, 1);
        list.unshift(chosen);
        return {
          ...prev,
          images: list,
          image: list[0] || ''
        };
      });
    } else {
      setAddForm(prev => {
        const list = [...(prev.images || [])];
        const [chosen] = list.splice(index, 1);
        list.unshift(chosen);
        return {
          ...prev,
          images: list,
          image: list[0] || ''
        };
      });
    }
  };

  const handleToggle = async (vehicle) => {
    try {
      const isCurrentlyAvail = vehicle.is_available !== 0 && vehicle.is_available !== false && vehicle.is_available !== '0';
      const newState = !isCurrentlyAvail;
      await toggleVehicleAvailability(vehicle.id, vehicle._type, newState);
      if (vehicle._type === 'car' && onUpdateCar) {
        onUpdateCar({ ...vehicle, is_available: newState ? 1 : 0 });
      } else if (vehicle._type === 'bike' && onUpdateBike) {
        onUpdateBike({ ...vehicle, is_available: newState ? 1 : 0 });
      }
    } catch (e) {
      alert('Failed to update availability: ' + e.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.price) {
      alert('Vehicle name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const imagesList = editForm.images && editForm.images.length > 0 ? editForm.images : (editForm.image ? [editForm.image] : []);
      const primaryImage = imagesList[0] || editForm.image || '';

      const updatedData = {
        id: editing.id,
        type: editing._type,
        name: editForm.name,
        price: parseInt(editForm.price, 10),
        fleet_quantity: parseInt(editForm.fleet_quantity, 10) || 1,
        category: editForm.category,
        fuel: editForm.fuel,
        transmission: editForm.transmission,
        seating: editForm.seating,
        engine: editForm.engine,
        mileage: editForm.mileage,
        location: editForm.location,
        image: primaryImage,
        images: imagesList,
        images_json: JSON.stringify(imagesList)
      };

      if (editing._type === 'car') {
        if (onUpdateCar) await onUpdateCar(updatedData);
        else await updateVehicle(updatedData);
      } else {
        if (onUpdateBike) await onUpdateBike(updatedData);
        else await updateVehicle(updatedData);
      }
      setEditing(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;
    try {
      if (type === 'car') {
        if (onDeleteCar) await onDeleteCar(id);
        else await deleteVehicle(id, 'car');
      } else {
        if (onDeleteBike) await onDeleteBike(id);
        else await deleteVehicle(id, 'bike');
      }
    } catch (e) {
      alert('Failed to delete vehicle: ' + e.message);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.price) {
      alert('Vehicle name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const imagesList = addForm.images && addForm.images.length > 0 ? addForm.images : (addForm.image ? [addForm.image] : []);
      const primaryImage = imagesList[0] || addForm.image || '';

      const newVehicleData = {
        ...addForm,
        type: addType,
        price: parseInt(addForm.price, 10),
        fleet_quantity: parseInt(addForm.fleet_quantity, 10) || 1,
        image: primaryImage,
        images: imagesList,
        images_json: JSON.stringify(imagesList),
        vendorId: currentUser?.id || currentUser?.username || 'vendor-1'
      };

      if (addType === 'car') {
        await onAddCar(newVehicleData);
      } else {
        await onAddBike(newVehicleData);
      }
      setShowAdd(false);
      setAddForm({
        name: '',
        price: '',
        fleet_quantity: 1,
        category: 'Hatchback',
        fuel: 'Petrol',
        transmission: 'Automatic',
        seating: '5 Seater',
        engine: '150cc',
        mileage: '40 km/l',
        location: 'Goa Delivery',
        image: '',
        images: []
      });
      setUploadError('');
    } catch (e) {
      alert('Failed to add vehicle: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const currentAddCategories = addType === 'car' ? CAR_CATEGORIES : BIKE_CATEGORIES;
  const currentAddSuggestions = getSuggestedCategories(addForm.name, addType);

  const currentEditCategories = editing?._type === 'car' ? CAR_CATEGORIES : BIKE_CATEGORIES;
  const currentEditSuggestions = getSuggestedCategories(editForm.name, editing?._type || 'car');

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Fleet Management</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>{displayCars.length} cars · {displayBikes.length} bikes in your fleet</p>
        </div>
        <button onClick={() => { setShowAdd(true); setUploadError(''); }} className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3 shadow-sm" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
          <Plus size={14} /> Add Vehicle
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', label: `All (${displayCars.length + displayBikes.length})` },
          { id: 'cars', label: `Cars (${displayCars.length})` },
          { id: 'bikes', label: `Bikes (${displayBikes.length})` },
          { id: 'available', label: `Available (${availableCount})` },
          { id: 'unavailable', label: `Unavailable (${unavailableCount})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.78rem', background: activeTab === t.id ? '#0D1B2E' : '#fff', color: activeTab === t.id ? '#fff' : '#475569', border: '1px solid rgba(0,0,0,0.1)' }}>
            {t.label}
          </button>
        ))}
        <div className="position-relative ms-auto" style={{ minWidth: '220px' }}>
          <Search size={14} className="position-absolute" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control form-control-sm" style={{ paddingLeft: '30px', borderRadius: '10px', fontSize: '0.82rem' }} placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grid */}
      <div className="row g-3">
        {filtered.map(v => (
          <div key={`${v._type}-${v.id}`} className="col-sm-6 col-md-4 col-xl-3">
            <VehicleCard
              vehicle={v}
              type={v._type}
              onEdit={veh => {
                setEditing(veh);
                let initialImages = [];
                if (veh.images_json) {
                  try {
                    const parsed = JSON.parse(veh.images_json);
                    if (Array.isArray(parsed) && parsed.length > 0) initialImages = parsed;
                  } catch (e) {}
                }
                if (initialImages.length === 0 && veh.image) {
                  initialImages = [veh.image];
                }

                setEditForm({
                  name: veh.name || '',
                  price: veh.price || '',
                  fleet_quantity: veh.fleet_count || 1,
                  category: veh.category || (veh._type === 'car' ? 'Hatchback' : 'Scooter'),
                  fuel: veh.fuel || 'Petrol',
                  transmission: veh.transmission || 'Automatic',
                  seating: veh.seating || '5 Seater',
                  engine: veh.engine || '150cc',
                  mileage: veh.mileage || '40 km/l',
                  image: initialImages[0] || veh.image || '',
                  images: initialImages,
                  location: veh.location || 'Goa Delivery'
                });
                setUploadError('');
              }}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isSuspended={Number(walletInfo?.services_suspended) === 1}
            />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-12 text-center py-5">
            <span style={{ fontSize: '3rem' }}>🚗</span>
            <div className="mt-2 fw-bold" style={{ color: '#64748b' }}>No vehicles found</div>
            <button onClick={() => { setShowAdd(true); setUploadError(''); }} className="btn mt-3 px-4 py-2 rounded-3 fw-bold text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
              <Plus size={14} className="me-2" /> Add First Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-2 p-md-3" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setEditing(null)}>
          <div className="rounded-4 shadow-lg d-flex flex-column" style={{ width: '100%', maxWidth: '580px', background: '#fff', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Edit {editing._type === 'car' ? 'Car' : 'Bike'} — {editing.name}</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="p-4 flex-grow-1 vehicle-modal-scrollbar" style={{ overflowY: 'auto', minHeight: 0 }}>
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Vehicle Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                    value={editForm.name || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(f => ({ ...f, name: val }));
                    }}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Price/Day (₹) *</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.price || ''} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Fleet Quantity (Units) *</label>
                  <input type="number" min="1" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.fleet_quantity || 1} onChange={e => setEditForm(f => ({ ...f, fleet_quantity: e.target.value }))} required />
                </div>
              </div>

              {/* Category with 5 Smart Suggestions */}
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-bold mb-0" style={{ fontSize: '0.78rem', color: '#475569' }}>Category *</label>
                  <span className="fw-semibold" style={{ fontSize: '0.7rem', color: '#FF6333' }}>
                    💡 Suggestions for "{editForm.name || (editing._type === 'car' ? 'Car' : 'Bike')}"
                  </span>
                </div>
                <select
                  className="form-select mb-1"
                  style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                  value={editForm.category || (editing._type === 'car' ? 'Hatchback' : 'Scooter / Moped')}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                >
                  {currentEditCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="d-flex flex-wrap gap-1 align-items-center mt-1">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.68rem', marginRight: '4px' }}>Quick Select:</span>
                  {currentEditSuggestions.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, category: cat }))}
                      className="btn btn-sm py-0 px-2 rounded-pill fw-bold"
                      style={{
                        fontSize: '0.7rem',
                        background: editForm.category === cat ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : '#f1f5f9',
                        color: editForm.category === cat ? '#fff' : '#334155',
                        border: editForm.category === cat ? 'none' : '1px solid #cbd5e1'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Fuel Type</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.fuel || 'Petrol'} onChange={e => setEditForm(f => ({ ...f, fuel: e.target.value }))}>
                    {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {editing._type === 'car' ? (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Transmission</label>
                    <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.transmission || 'Automatic'} onChange={e => setEditForm(f => ({ ...f, transmission: e.target.value }))}>
                      {['Automatic', 'Manual'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Engine CC</label>
                    <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.engine || ''} onChange={e => setEditForm(f => ({ ...f, engine: e.target.value }))} placeholder="e.g. 350cc" />
                  </div>
                )}
              </div>

              <div className="row g-2 mb-3">
                {editing._type === 'car' ? (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Seating</label>
                    <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.seating || '5 Seater'} onChange={e => setEditForm(f => ({ ...f, seating: e.target.value }))}>
                      {['2 Seater', '4 Seater', '5 Seater', '6 Seater', '7 Seater', '8 Seater'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Mileage</label>
                    <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.mileage || ''} onChange={e => setEditForm(f => ({ ...f, mileage: e.target.value }))} placeholder="e.g. 40 km/l" />
                  </div>
                )}
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Location</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.location || 'Goa Delivery'} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Panaji, Goa" />
                </div>
              </div>

              {/* Local Multi-File Picker for Image Upload */}
              <div className="mb-3">
                <label className="form-label fw-bold d-flex align-items-center justify-content-between" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  <span>Vehicle Images ({editForm.images?.length || 0} selected)</span>
                  {uploadingImage && <span className="text-primary d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}><Loader2 size={12} className="spinner-border spinner-border-sm" /> Uploading images...</span>}
                </label>

                {/* Upload Action Box */}
                <div className="p-3 rounded-3 mb-2" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>Select Vehicle Photos</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Select one or multiple images from your computer</div>
                    </div>
                    <div>
                      <input
                        type="file"
                        multiple
                        ref={editFileInputRef}
                        style={{ display: 'none' }}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={e => handleImageUpload(e, true)}
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => editFileInputRef.current?.click()}
                        className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1"
                        style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.78rem' }}
                      >
                        <Upload size={13} /> {editForm.images?.length > 0 ? '+ Add More Photos' : 'Choose Photos from Computer'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gallery Previews Grid */}
                {editForm.images && editForm.images.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 p-2 rounded-3" style={{ background: '#f1f5f9', maxHeight: '170px', overflowY: 'auto' }}>
                    {editForm.images.map((imgUrl, idx) => (
                      <div key={idx} className="position-relative rounded-2 overflow-hidden shadow-sm" style={{ width: '82px', height: '65px', border: idx === 0 ? '2px solid #16a34a' : '1px solid #cbd5e1' }}>
                        <img src={imgUrl} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '0.52rem', padding: '2px 4px', borderRadius: '0 0 4px 0' }}>
                            Primary
                          </span>
                        )}
                        <div className="position-absolute top-0 end-0 d-flex gap-1 p-1">
                          {idx !== 0 && (
                            <button type="button" onClick={() => setPrimaryImage(idx, true)} className="btn btn-dark btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" title="Set as primary cover photo" style={{ width: '18px', height: '18px', fontSize: '0.6rem', opacity: 0.85 }}>
                              <Star size={9} style={{ color: '#fbbf24' }} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeImage(idx, true)} className="btn btn-danger btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" title="Remove photo" style={{ width: '18px', height: '18px', fontSize: '0.6rem', opacity: 0.85 }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadError && <div className="text-danger mt-1" style={{ fontSize: '0.72rem' }}>{uploadError}</div>}
              </div>
            </div>

            <div className="px-4 py-3 flex-shrink-0 border-top bg-white">
                <button type="submit" disabled={saving || uploadingImage} className="btn w-100 py-2.5 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                  <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-2 p-md-3" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setShowAdd(false)}>
          <div className="rounded-4 shadow-lg d-flex flex-column" style={{ width: '100%', maxWidth: '580px', background: '#fff', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Add Vehicle to Fleet</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="p-4 flex-grow-1 vehicle-modal-scrollbar" style={{ overflowY: 'auto', minHeight: 0 }}>
              <div className="d-flex gap-2 mb-3">
                {[{ id: 'car', label: '🚗 Car' }, { id: 'bike', label: '🏍️ Bike' }].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setAddType(t.id);
                      const defaultCat = t.id === 'car' ? 'Hatchback' : 'Scooter / Moped';
                      setAddForm(f => ({ ...f, category: defaultCat }));
                    }}
                    className="btn flex-grow-1 py-2 rounded-3 fw-bold"
                    style={{ background: addType === t.id ? '#0D1B2E' : '#f1f5f9', color: addType === t.id ? '#fff' : '#475569', fontSize: '0.85rem', border: 'none' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Vehicle Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                    value={addForm.name}
                    onChange={e => {
                      const val = e.target.value;
                      setAddForm(f => ({
                        ...f,
                        name: val
                      }));
                    }}
                    placeholder={addType === 'car' ? 'e.g. Swift Dzire' : 'e.g. Royal Enfield Classic'}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Price/Day (₹) *</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 1500" required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Fleet Quantity (Units) *</label>
                  <input type="number" min="1" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.fleet_quantity || 1} onChange={e => setAddForm(f => ({ ...f, fleet_quantity: e.target.value }))} required />
                </div>
              </div>

              {/* Category with 5 Smart Suggestions */}
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-bold mb-0" style={{ fontSize: '0.78rem', color: '#475569' }}>Category *</label>
                  <span className="fw-semibold" style={{ fontSize: '0.7rem', color: '#FF6333' }}>
                    💡 Suggestions for "{addForm.name || (addType === 'car' ? 'Car' : 'Bike')}"
                  </span>
                </div>
                <select
                  className="form-select mb-1"
                  style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                >
                  {currentAddCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="d-flex flex-wrap gap-1 align-items-center mt-1">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.68rem', marginRight: '4px' }}>Quick Select:</span>
                  {currentAddSuggestions.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, category: cat }))}
                      className="btn btn-sm py-0 px-2 rounded-pill fw-bold"
                      style={{
                        fontSize: '0.7rem',
                        background: addForm.category === cat ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : '#f1f5f9',
                        color: addForm.category === cat ? '#fff' : '#334155',
                        border: addForm.category === cat ? 'none' : '1px solid #cbd5e1'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Fuel Type</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.fuel} onChange={e => setAddForm(f => ({ ...f, fuel: e.target.value }))}>
                    {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {addType === 'car' ? (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Transmission</label>
                    <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.transmission} onChange={e => setAddForm(f => ({ ...f, transmission: e.target.value }))}>
                      {['Automatic', 'Manual'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Engine CC</label>
                    <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.engine} onChange={e => setAddForm(f => ({ ...f, engine: e.target.value }))} placeholder="e.g. 350cc" />
                  </div>
                )}
              </div>

              <div className="row g-2 mb-3">
                {addType === 'car' ? (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Seating</label>
                    <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.seating} onChange={e => setAddForm(f => ({ ...f, seating: e.target.value }))}>
                      {['2 Seater', '4 Seater', '5 Seater', '6 Seater', '7 Seater', '8 Seater'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="col-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Mileage</label>
                    <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.mileage} onChange={e => setAddForm(f => ({ ...f, mileage: e.target.value }))} placeholder="e.g. 40 km/l" />
                  </div>
                )}
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Location</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Goa Delivery" />
                </div>
              </div>

              {/* Local Multi-File Picker for Image Upload */}
              <div className="mb-4">
                <label className="form-label fw-bold d-flex align-items-center justify-content-between" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  <span>Vehicle Images ({addForm.images?.length || 0} selected)</span>
                  {uploadingImage && <span className="text-primary d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}><Loader2 size={12} className="spinner-border spinner-border-sm" /> Uploading images...</span>}
                </label>

                {/* Upload Action Box */}
                <div className="p-3 rounded-3 mb-2" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>Select Vehicle Photos</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Select one or multiple images from your computer</div>
                    </div>
                    <div>
                      <input
                        type="file"
                        multiple
                        ref={addFileInputRef}
                        style={{ display: 'none' }}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={e => handleImageUpload(e, false)}
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => addFileInputRef.current?.click()}
                        className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1"
                        style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.78rem' }}
                      >
                        <Upload size={13} /> {addForm.images?.length > 0 ? '+ Add More Photos' : 'Choose Photos from Computer'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gallery Previews Grid */}
                {addForm.images && addForm.images.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 p-2 rounded-3" style={{ background: '#f1f5f9', maxHeight: '170px', overflowY: 'auto' }}>
                    {addForm.images.map((imgUrl, idx) => (
                      <div key={idx} className="position-relative rounded-2 overflow-hidden shadow-sm" style={{ width: '82px', height: '65px', border: idx === 0 ? '2px solid #16a34a' : '1px solid #cbd5e1' }}>
                        <img src={imgUrl} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '0.52rem', padding: '2px 4px', borderRadius: '0 0 4px 0' }}>
                            Primary
                          </span>
                        )}
                        <div className="position-absolute top-0 end-0 d-flex gap-1 p-1">
                          {idx !== 0 && (
                            <button type="button" onClick={() => setPrimaryImage(idx, false)} className="btn btn-dark btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" title="Set as primary cover photo" style={{ width: '18px', height: '18px', fontSize: '0.6rem', opacity: 0.85 }}>
                              <Star size={9} style={{ color: '#fbbf24' }} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeImage(idx, false)} className="btn btn-danger btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" title="Remove photo" style={{ width: '18px', height: '18px', fontSize: '0.6rem', opacity: 0.85 }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadError && <div className="text-danger mt-1" style={{ fontSize: '0.72rem' }}>{uploadError}</div>}
              </div>
            </div>

            <div className="px-4 py-3 flex-shrink-0 border-top bg-white">
                <button type="submit" disabled={saving || uploadingImage} className="btn w-100 py-2.5 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                  <Plus size={14} />{saving ? 'Adding to Fleet...' : `Add ${addType === 'car' ? 'Car' : 'Bike'} to Fleet`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


