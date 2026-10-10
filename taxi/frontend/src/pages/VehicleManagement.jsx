import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { 
  Car, Plus, Search, Filter, Fuel, Gauge, AlertCircle, CheckCircle2, 
  ShieldAlert, X, Eye, Calendar, FileText, Wrench, ShieldCheck, UserCheck, 
  LayoutGrid, Table, Zap, Crown, Bus, ChevronLeft, ChevronRight, Star, User,
  ArrowLeft, Check, Radio, Navigation, Camera, Layers, Sparkles, DollarSign, Settings,
  UploadCloud, Trash2, Image as ImageIcon, UserPlus, UserMinus
} from 'lucide-react';

const AVAILABLE_FEATURES = [
  'GPS Telemetry & Live Tracker',
  'Automated FASTag Toll Pass',
  'Dual-Zone Climate Control',
  'Dual Dashcam & Fleet Telematics',
  'Leather Reclining Seats',
  'High-Speed Wi-Fi Hotspot',
  'Speed Governor (80 km/h)',
  'ISOFIX Child Seat Support',
  'Commercial Fleet Insurance',
  'SOS Emergency Response Switch'
];

const PRESET_PHOTO_PACKS = {
  SEDAN: {
    photo_front: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
    photo_side: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    photo_rear: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
    photo_interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    rate: 2500,
    km_rate: 15
  },
  SUV: {
    photo_front: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
    photo_side: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    photo_rear: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    photo_interior: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
    rate: 4500,
    km_rate: 18
  },
  EV: {
    photo_front: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    photo_side: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
    photo_rear: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800',
    photo_interior: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    rate: 3200,
    km_rate: 16
  },
  VAN: {
    photo_front: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    photo_side: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    photo_rear: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    photo_interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    rate: 5500,
    km_rate: 22
  },
  LUXURY: {
    photo_front: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
    photo_side: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
    photo_rear: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    photo_interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    rate: 8500,
    km_rate: 30
  }
};

const VehicleManagement = ({ setActiveTab }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Showcase Slider) or 'table'
  
  // Selected vehicle for Full Screen Detail View
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Multi-angle photo gallery index (. . . pagination)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // File Upload & Gallery state (Unlimited Photos + Drag & Drop)
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);

  // Legal Compliance Documents State (RC Book, Insurance, PUC, Permit, Fitness)
  const [complianceDocs, setComplianceDocs] = useState([]);

  // Initial Form State for Add Vehicle
  const initialFormState = {
    registration_number: '',
    vin: '',
    make: '',
    model: '',
    year: 2025,
    vehicle_class: 'SEDAN',
    transmission: 'AUTOMATIC',
    seating_capacity: 4,
    fuel_type: 'DIESEL',
    status: 'AVAILABLE',
    current_odometer: 0,
    shift_rate_inr: 2500,
    extra_km_rate_inr: 15,
    features: [
      'GPS Telemetry & Live Tracker',
      'Automated FASTag Toll Pass',
      'Dual-Zone Climate Control',
      'Commercial Fleet Insurance'
    ],
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showAddModal, setShowAddModal] = useState(false);

  // Driver Assignment State
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [selectedDriverIdToAssign, setSelectedDriverIdToAssign] = useState(null);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // Category horizontal scroll refs
  const scrollRefs = useRef({});

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('fleet/vehicles/');
      const data = res.data.results || res.data;
      setVehicles(data);
      if (selectedVehicle) {
        const updated = data.find(v => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAssignDriverModal = async () => {
    setShowAssignDriverModal(true);
    setSelectedDriverIdToAssign(null);
    setDriverSearchQuery('');
    setLoadingDrivers(true);
    try {
      const res = await api.get('drivers/drivers/');
      setAvailableDrivers(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch drivers for assignment:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleConfirmDriverAssignment = async () => {
    if (!selectedDriverIdToAssign || !selectedVehicle) return;
    setAssignmentSubmitting(true);
    try {
      const res = await api.post(`fleet/vehicles/${selectedVehicle.id}/assign_driver/`, {
        driver_id: selectedDriverIdToAssign
      });
      setShowAssignDriverModal(false);
      if (res.data?.vehicle) {
        setSelectedVehicle(res.data.vehicle);
      }
      fetchVehicles();
    } catch (err) {
      alert('Error assigning driver: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleUnassignDriver = async () => {
    if (!selectedVehicle) return;
    if (!window.confirm(`Are you sure you want to unassign the driver from vehicle ${selectedVehicle.registration_number}?`)) {
      return;
    }
    try {
      const res = await api.post(`fleet/vehicles/${selectedVehicle.id}/unassign_driver/`);
      if (res.data?.vehicle) {
        setSelectedVehicle(res.data.vehicle);
      }
      fetchVehicles();
    } catch (err) {
      alert('Error unassigning driver: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleOpenVehicle = (v) => {
    setSelectedVehicle(v);
    setActivePhotoIndex(0);
  };

  const handleScroll = (catKey, direction) => {
    const container = scrollRefs.current[catKey];
    if (container) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Drag & Drop / Device Gallery File Upload Handlers
  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const readers = fileArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(newBase64Photos => {
      setUploadedPhotos(prev => [...prev, ...newBase64Photos]);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setUploadedPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (primaryPhotoIndex >= indexToRemove && primaryPhotoIndex > 0) {
      setPrimaryPhotoIndex(prev => prev - 1);
    }
  };

  const handleApplyPhotoPreset = () => {
    const pack = PRESET_PHOTO_PACKS[formData.vehicle_class] || PRESET_PHOTO_PACKS.SEDAN;
    const presetList = [pack.photo_front, pack.photo_side, pack.photo_rear, pack.photo_interior];
    setUploadedPhotos(presetList);
    setPrimaryPhotoIndex(0);
    setFormData(prev => ({
      ...prev,
      shift_rate_inr: pack.rate,
      extra_km_rate_inr: pack.km_rate
    }));
  };

  // Legal Compliance Documents Handlers
  const handleAddComplianceDocEntry = () => {
    setComplianceDocs(prev => [
      ...prev,
      {
        document_type: 'RC_BOOK',
        document_number: '',
        issue_date: '2025-01-01',
        expiry_date: '2030-01-01',
        issuer_authority: 'RTO Panaji, Goa'
      }
    ]);
  };

  const handleUpdateComplianceDoc = (index, field, val) => {
    setComplianceDocs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveComplianceDoc = (index) => {
    setComplianceDocs(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleApplyCompliancePreset = () => {
    setComplianceDocs([
      {
        document_type: 'RC_BOOK',
        document_number: `RC-GA03-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_date: '2025-01-15',
        expiry_date: '2035-01-14',
        issuer_authority: 'RTO Panaji, Goa'
      },
      {
        document_type: 'INSURANCE',
        document_number: `POL-ICICI-${Math.floor(100000 + Math.random() * 900000)}`,
        issue_date: '2026-01-01',
        expiry_date: '2027-12-31',
        issuer_authority: 'ICICI Lombard Commercial Insurance'
      },
      {
        document_type: 'PUC',
        document_number: `PUC-GOA-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_date: '2026-06-01',
        expiry_date: '2027-05-31',
        issuer_authority: 'State Pollution Control Board'
      },
      {
        document_type: 'PERMIT',
        document_number: 'ALL-INDIA-TOURIST-PERMIT-2026',
        issue_date: '2025-04-01',
        expiry_date: '2030-03-31',
        issuer_authority: 'Transport Dept Goa'
      }
    ]);
  };

  const handleToggleFeature = (featureName) => {
    setFormData(prev => {
      const exists = prev.features.includes(featureName);
      if (exists) {
        return { ...prev, features: prev.features.filter(f => f !== featureName) };
      } else {
        return { ...prev, features: [...prev.features, featureName] };
      }
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const mainImage = uploadedPhotos.length > 0
      ? (uploadedPhotos[primaryPhotoIndex] || uploadedPhotos[0])
      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800';

    const payload = {
      registration_number: formData.registration_number,
      vin: formData.vin,
      make: formData.make,
      model: formData.model,
      year: Number(formData.year),
      vehicle_class: formData.vehicle_class,
      transmission: formData.transmission,
      seating_capacity: Number(formData.seating_capacity),
      fuel_type: formData.fuel_type,
      status: formData.status,
      current_odometer: Number(formData.current_odometer),
      shift_rate_inr: Number(formData.shift_rate_inr),
      extra_km_rate_inr: Number(formData.extra_km_rate_inr),
      image_url: mainImage,
      gallery_images: uploadedPhotos.length > 0 ? uploadedPhotos : [mainImage],
      features: formData.features,
      compliance_docs: complianceDocs,
      notes: formData.notes
    };

    try {
      await api.post('fleet/vehicles/', payload);
      setShowAddModal(false);
      fetchVehicles();
      setFormData(initialFormState);
      setUploadedPhotos([]);
      setPrimaryPhotoIndex(0);
      setComplianceDocs([]);
    } catch (err) {
      alert('Error saving vehicle: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      await api.patch(`fleet/vehicles/${vehicleId}/`, { status: newStatus });
      fetchVehicles();
    } catch (err) {
      alert('Error updating status: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge badge-success">Available</span>;
      case 'ON_DUTY':
        return <span className="badge badge-info">On Duty</span>;
      case 'IN_MAINTENANCE':
        return <span className="badge badge-warning">In Maintenance</span>;
      case 'DECOMMISSIONED':
        return <span className="badge badge-danger">Decommissioned</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  // Category Configurations with Indian Rupee (₹ INR) Pricing Slabs & Material 3 Palette
  const categoryConfigs = {
    SEDAN: {
      title: 'Executive Sedans',
      subtitle: 'Premium corporate comfort & airport transfers',
      bgContainer: 'rgba(241, 245, 249, 0.9)',
      iconColor: '#1e293b',
      icon: Car,
      rate: '₹2,500 / shift'
    },
    EV: {
      title: 'Electric Fleet',
      subtitle: 'Zero emissions & eco executive dispatches',
      bgContainer: 'var(--color-success-bg)',
      iconColor: 'var(--color-success)',
      icon: Zap,
      rate: '₹3,200 / shift'
    },
    SUV: {
      title: 'Premium SUVs',
      subtitle: 'Spacious 6-7 seater luxury & long distance',
      bgContainer: 'var(--color-warning-bg)',
      iconColor: 'var(--color-warning)',
      icon: Car,
      rate: '₹4,500 / shift'
    },
    VAN: {
      title: 'Passenger Vans',
      subtitle: 'Corporate shuttles & multi-group transfers',
      bgContainer: 'var(--color-info-bg)',
      iconColor: 'var(--color-info)',
      icon: Bus,
      rate: '₹5,500 / shift'
    },
    LUXURY: {
      title: 'Luxury Fleet',
      subtitle: 'VIP & Executive Class dispatches',
      bgContainer: '#f3e8fd',
      iconColor: '#7c3aed',
      icon: Crown,
      rate: '₹8,500 / shift'
    }
  };

  // Group vehicles by category
  const groupedVehicles = Object.keys(categoryConfigs).reduce((acc, catKey) => {
    const items = filteredVehicles.filter(v => (v.vehicle_class || 'SEDAN') === catKey);
    if (items.length > 0) acc[catKey] = items;
    return acc;
  }, {});

  // FULL SCREEN DETAIL VIEW WITH MULTI-ANGLE GALLERY & DOTS (. . .)
  if (selectedVehicle) {
    const cat = categoryConfigs[selectedVehicle.vehicle_class] || categoryConfigs.SEDAN;
    const CatIcon = cat.icon;

    const galleryList = (selectedVehicle.gallery_images && selectedVehicle.gallery_images.length > 0)
      ? selectedVehicle.gallery_images
      : [selectedVehicle.image_url].filter(Boolean);

    const activePhotoUrl = galleryList[activePhotoIndex] || selectedVehicle.image_url;
    const angleLabels = ['Front View (Main)', 'Side Profile', 'Rear Angle', 'Interior Cabin', 'Boot Space', 'Wheel Detail'];

    return (
      <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '28px', background: 'var(--bg-primary)', minHeight: '100vh' }}>
        
        {/* Full Screen Top Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
          <button 
            onClick={() => setSelectedVehicle(null)} 
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 18px', borderRadius: '24px' }}
          >
            <ArrowLeft size={18} />
            <span>Back to Fleet Showcase</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{selectedVehicle.vehicle_class_display || selectedVehicle.vehicle_class}</span>
            <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{selectedVehicle.fuel_type_display || selectedVehicle.fuel_type}</span>
            {getStatusBadge(selectedVehicle.status)}
          </div>
        </div>

        {/* Hero Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
            </h1>
            <p className="font-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.95rem', fontWeight: 600, marginTop: '6px' }}>
              Registration Plate: {selectedVehicle.registration_number} &nbsp;|&nbsp; VIN: {selectedVehicle.vin}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>B2B CONTRACT RATE SLAB</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '2px', letterSpacing: '-0.01em' }}>
              ₹{Number(selectedVehicle.shift_rate_inr || 2500).toLocaleString('en-IN')} / shift
            </p>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              Extra KM: ₹{selectedVehicle.extra_km_rate_inr || 15}/KM
            </span>
          </div>
        </div>

        {/* Main 2-Column Showcase Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '28px' }}>
          
          {/* Left Column: Multi-Angle Photo Frame + Dot Pagination (. . .) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Big Vehicle Photo Frame with Active Angle Overlay */}
            <div className="md3-card" style={{ overflow: 'hidden', height: '400px', position: 'relative', background: 'var(--md-surface-container-low)', padding: 0 }}>
              {activePhotoUrl ? (
                <img
                  src={activePhotoUrl}
                  alt={`${selectedVehicle.make} ${selectedVehicle.model} - ${angleLabels[activePhotoIndex] || 'Photo'}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={80} color="var(--text-dim)" />
                </div>
              )}

              {/* Photo Angle Label Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '20px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--elevation-1)',
                border: '1px solid var(--border-color)'
              }}>
                <Camera size={15} color="var(--accent-primary)" />
                <span>{angleLabels[activePhotoIndex] || `Photo ${activePhotoIndex + 1}`}</span>
              </div>

              {/* Verified Fleet Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '20px',
                color: 'var(--color-success)',
                fontSize: '0.78rem',
                fontWeight: 700,
                boxShadow: 'var(--elevation-1)'
              }}>
                ★ 4.9 Verified Commercial Unit
              </div>

              {/* MULTI-ANGLE CAROUSEL DOTS PAGINATION (. . . . ) */}
              {galleryList.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--elevation-2)'
                }}>
                  {galleryList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      title={`View ${angleLabels[idx] || `Angle ${idx + 1}`}`}
                      style={{
                        width: activePhotoIndex === idx ? '26px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        background: activePhotoIndex === idx ? 'var(--accent-primary)' : '#c4c7c5',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Strip Selector */}
            {galleryList.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${galleryList.length}, 1fr)`, gap: '12px' }}>
                {galleryList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    style={{
                      padding: 0,
                      background: '#ffffff',
                      border: activePhotoIndex === idx ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '74px',
                      cursor: 'pointer',
                      opacity: activePhotoIndex === idx ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      boxShadow: activePhotoIndex === idx ? 'var(--elevation-2)' : 'none'
                    }}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.65)',
                      fontSize: '0.65rem',
                      color: '#fff',
                      padding: '3px 0',
                      textAlign: 'center'
                    }}>
                      {angleLabels[idx] || `Angle ${idx + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Spec Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <Gauge size={18} color="var(--accent-primary)" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>ODOMETER</span>
                <strong className="font-mono" style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{Number(selectedVehicle.current_odometer).toLocaleString()} KM</strong>
              </div>

              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <User size={18} color="var(--color-info)" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>SEATING</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{selectedVehicle.seating_capacity} Seats</strong>
              </div>

              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <Layers size={18} color="#9333ea" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>GEARBOX</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{selectedVehicle.transmission || 'AUTOMATIC'}</strong>
              </div>

              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <Fuel size={18} color="var(--color-warning)" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>FUEL TYPE</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{selectedVehicle.fuel_type_display || selectedVehicle.fuel_type}</strong>
              </div>

              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <CatIcon size={18} color="#7c3aed" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>CLASS</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{selectedVehicle.vehicle_class_display || selectedVehicle.vehicle_class}</strong>
              </div>

              <div className="md3-card" style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--md-surface-container-low)' }}>
                <CheckCircle2 size={18} color="var(--color-success)" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>EXTRA KM</span>
                <strong style={{ color: 'var(--color-success)', fontSize: '0.88rem' }}>₹{selectedVehicle.extra_km_rate_inr || 15}/KM</strong>
              </div>
            </div>

            {/* Vehicle Telematics & Equipment Checklist */}
            <div className="md3-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={20} color="var(--accent-primary)" />
                <span>Vehicle Telematics & Equipment Features</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {((selectedVehicle.features && selectedVehicle.features.length > 0)
                  ? selectedVehicle.features
                  : [
                      'GPS Telemetry & Live Tracker',
                      'Automated FASTag Toll Pass',
                      'Dual-Zone Climate Control',
                      'Commercial Fleet Insurance'
                    ]
                ).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--md-surface-container-low)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedVehicle.notes && (
              <div className="md3-card" style={{ padding: '22px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Operational Remarks & Dispatch Notes
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{selectedVehicle.notes}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Status Control, Driver Pairing & Legal Compliance Vault */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Status Control Card */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                Duty Status Control
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  className="select-field"
                  value={selectedVehicle.status}
                  onChange={(e) => handleStatusChange(selectedVehicle.id, e.target.value)}
                  style={{ flex: 1, borderRadius: '10px' }}
                >
                  <option value="AVAILABLE">Available for Shift Dispatch</option>
                  <option value="ON_DUTY">On Duty / Active Shift</option>
                  <option value="IN_MAINTENANCE">In Service / Maintenance</option>
                  <option value="DECOMMISSIONED">Decommissioned</option>
                </select>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                Updating status automatically notifies the dispatch board & driver shift roster.
              </p>
            </div>

            {/* Driver Assignment Card */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="var(--color-info)" />
                  <span>Assigned Fleet Driver</span>
                </h3>
                {selectedVehicle.current_driver && selectedVehicle.current_driver.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenAssignDriverModal}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '16px' }}
                  >
                    Change Driver
                  </button>
                )}
              </div>

              {selectedVehicle.current_driver && selectedVehicle.current_driver.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {selectedVehicle.current_driver[0].avatar_url ? (
                      <img
                        src={selectedVehicle.current_driver[0].avatar_url}
                        alt={selectedVehicle.current_driver[0].user_detail?.first_name || 'Driver'}
                        style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', fontWeight: 700, fontSize: '1.1rem' }}>
                        {(selectedVehicle.current_driver[0].user_detail?.first_name?.[0] || selectedVehicle.current_driver[0].user_detail?.username?.[0] || 'D').toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.98rem' }}>
                          {selectedVehicle.current_driver[0].user_detail?.first_name 
                            ? `${selectedVehicle.current_driver[0].user_detail.first_name} ${selectedVehicle.current_driver[0].user_detail.last_name || ''}`
                            : selectedVehicle.current_driver[0].user_detail?.username}
                        </strong>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                          {selectedVehicle.current_driver[0].duty_status_display || selectedVehicle.current_driver[0].duty_status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                        License: <span className="font-mono">{selectedVehicle.current_driver[0].license_number}</span>
                        {selectedVehicle.current_driver[0].badge_number && ` • Badge: ${selectedVehicle.current_driver[0].badge_number}`}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>⭐ {selectedVehicle.current_driver[0].rating} ★</span>
                        <span>🛡️ {selectedVehicle.current_driver[0].safety_score}/100 Safety</span>
                        {selectedVehicle.current_driver[0].user_detail?.phone_number && (
                          <span>📞 {selectedVehicle.current_driver[0].user_detail.phone_number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleUnassignDriver}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        color: 'var(--color-danger)',
                        borderRadius: '16px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      Unassign Driver
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '22px 16px', background: 'var(--md-surface-container-low)', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '14px' }}>
                    No active driver currently assigned to this vehicle.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAssignDriverModal}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <UserPlus size={16} />
                    <span>Assign Driver</span>
                  </button>
                </div>
              )}
            </div>

            {/* Legal Compliance Vault Card */}
            <div className="md3-card" style={{ padding: '26px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--accent-primary)" />
                <span>Legal Compliance Vault & Documents</span>
              </h3>

              {selectedVehicle.compliance_docs && selectedVehicle.compliance_docs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedVehicle.compliance_docs.map((doc) => (
                    <div key={doc.id} style={{
                      padding: '14px 16px',
                      background: 'var(--md-surface-container-low)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{doc.document_type_display || doc.document_type}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No: {doc.document_number}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {doc.computed_status === 'EXPIRED' ? (
                          <span className="badge badge-danger">EXPIRED ({doc.expiry_date})</span>
                        ) : doc.computed_status === 'EXPIRING_SOON' ? (
                          <span className="badge badge-warning">EXPIRING SOON ({doc.expiry_date})</span>
                        ) : (
                          <span className="badge badge-success">VALID ({doc.expiry_date})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '18px', background: 'var(--md-surface-container-low)', borderRadius: '10px', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No legal documents filed in vault yet.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & View Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Vehicle Master Registry
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', margin: 0, fontWeight: 500 }}>
            Category-wise horizontal fleet showcase, commercial tariff slabs, and maintenance registry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Switcher Toggle - Google Style Segmented Control */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.85)', 
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '4px', 
            borderRadius: '24px', 
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--elevation-1)',
            gap: '4px'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '20px',
                border: 'none',
                background: viewMode === 'grid' ? '#1e293b' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                fontWeight: viewMode === 'grid' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutGrid size={15} />
              <span>Showcase Slider</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '20px',
                border: 'none',
                background: viewMode === 'table' ? '#1e293b' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                fontWeight: viewMode === 'table' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Table size={15} />
              <span>Table View</span>
            </button>
          </div>

          {setActiveTab && (
            <button 
              onClick={() => setActiveTab('telematics')} 
              className="btn-secondary" 
              style={{ padding: '10px 18px', borderRadius: '24px', fontSize: '0.88rem', gap: '8px' }}
            >
              <Navigation size={16} color="#2563eb" />
              <span>Live GPS Map</span>
            </button>
          )}

          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '10px 22px', borderRadius: '24px', fontSize: '0.88rem', gap: '8px' }}>
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by Registration Plate, VIN, Make, Model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="select-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Vehicle Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="IN_MAINTENANCE">In Maintenance</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: SLEEK HORIZONTAL CATEGORY SLIDERS WITH < AND > ARROWS */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading fleet data from Django API...</div>
          ) : Object.keys(groupedVehicles).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles found matching your search.</div>
          ) : (
            Object.entries(groupedVehicles).map(([catKey, vehicleList]) => {
              const cat = categoryConfigs[catKey] || categoryConfigs.SEDAN;
              const CatIcon = cat.icon;

              return (
                <div key={catKey} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '18px 20px' }}>
                  
                  {/* Category Header Bar with Left Title & Right < > Slide Arrows */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: cat.bgContainer || 'rgba(241, 245, 249, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center'
                      }}>
                        <CatIcon size={18} color={cat.iconColor || '#1e293b'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                            {cat.title}
                          </h3>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{vehicleList.length} Vehicles</span>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{cat.rate}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', margin: 0, fontWeight: 500 }}>{cat.subtitle}</p>
                      </div>
                    </div>

                    {/* Horizontal Slide Arrow Controls < > */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleScroll(catKey, 'left')}
                        title="Slide Left"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => handleScroll(catKey, 'right')}
                        title="Slide Right"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Cards Strip */}
                  <div
                    ref={(el) => (scrollRefs.current[catKey] = el)}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      paddingBottom: '4px'
                    }}
                  >
                    {vehicleList.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => handleOpenVehicle(vehicle)}
                        className="glass-card"
                        style={{
                          width: '260px',
                          flexShrink: 0,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                          borderRadius: '14px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Vehicle Photo Container */}
                        <div style={{ position: 'relative', height: '138px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', marginBottom: '10px' }}>
                          {vehicle.image_url ? (
                            <img
                              src={vehicle.image_url}
                              alt={vehicle.registration_number}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Car size={36} color="var(--text-dim)" />
                            </div>
                          )}

                          <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                            {getStatusBadge(vehicle.status)}
                          </div>

                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(6px)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            letterSpacing: '0.04em'
                          }} className="font-mono">
                            {vehicle.registration_number}
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                              {vehicle.make} {vehicle.model}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706', fontSize: '0.74rem', fontWeight: 700 }}>
                              <Star size={11} fill="#d97706" />
                              <span>4.9</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>{vehicle.fuel_type_display || vehicle.fuel_type}</span>
                            <span className="badge badge-warning" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>{vehicle.seating_capacity} Seats</span>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '10px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem' }}>
                            ₹{Number(vehicle.shift_rate_inr || 2500).toLocaleString('en-IN')}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>/shift</span>
                          </span>
                          <span style={{ color: '#334155', fontWeight: 600 }}>Inspect ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW MODE 2: HIGH-DENSITY OPERATIONAL TABLE VIEW */
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading fleet data from Django API...</div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles found matching your criteria.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle Photo</th>
                  <th>Registration Plate</th>
                  <th>Make & Model</th>
                  <th>Class / Fuel</th>
                  <th>Odometer</th>
                  <th>Rate Slab</th>
                  <th>Status</th>
                  <th>Compliance Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  return (
                    <tr 
                      key={vehicle.id}
                      onClick={() => handleOpenVehicle(vehicle)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ width: '90px' }}>
                        {vehicle.image_url ? (
                          <img
                            src={vehicle.image_url}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            style={{
                              width: '74px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '74px',
                            height: '48px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center'
                          }}>
                            <Car size={22} color="#3b82f6" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong className="font-mono" style={{ color: '#0f172a', fontSize: '0.9rem' }}>{vehicle.registration_number}</strong>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>VIN: {vehicle.vin}</p>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{vehicle.make} {vehicle.model}</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year: {vehicle.year} ({vehicle.seating_capacity} Seats)</p>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{vehicle.vehicle_class_display || vehicle.vehicle_class}</span>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{vehicle.fuel_type_display || vehicle.fuel_type}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <Gauge size={14} color="var(--text-muted)" />
                          <span className="font-mono" style={{ fontWeight: 600 }}>{Number(vehicle.current_odometer).toLocaleString()} KM</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 700 }}>₹{Number(vehicle.shift_rate_inr || 2500).toLocaleString('en-IN')}/shift</strong>
                      </td>
                      <td>{getStatusBadge(vehicle.status)}</td>
                      <td>
                        {vehicle.compliance_docs && vehicle.compliance_docs.length > 0 ? (
                          vehicle.compliance_docs.some(d => d.computed_status === 'EXPIRED') ? (
                            <span className="badge badge-danger"><ShieldAlert size={12} /> Expired Doc</span>
                          ) : vehicle.compliance_docs.some(d => d.computed_status === 'EXPIRING_SOON') ? (
                            <span className="badge badge-warning"><AlertCircle size={12} /> Expiry Soon</span>
                          ) : (
                            <span className="badge badge-success"><CheckCircle2 size={12} /> Compliant</span>
                          )
                        ) : (
                          <span className="badge badge-success"><CheckCircle2 size={12} /> Valid</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVehicle(vehicle);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ULTRA-DETAILED ENTERPRISE ADD VEHICLE MODAL */}
      {showAddModal && createPortal(
        <div className="portal-modal-overlay">
          <div className="glass-panel portal-modal-card" style={{ 
            padding: '28px',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Car size={22} color="#1e293b" />
                  <span>Add Fleet Vehicle - Detailed Entry</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Specify complete technical parameters, multi-angle photo URLs, Indian Rupee (₹) contract rates, and telematics equipment.
                </p>
              </div>

              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* SECTION 1: CORE VEHICLE IDENTIFICATION & SPECS */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={16} />
                  <span>1. Technical & Registration Specifications</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Registration Plate *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. GA-03-AX-8899"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>VIN Number *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 1HGCR2F83HA009988"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Make (Brand) *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Toyota / Mercedes"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Model Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Camry Hybrid / E-Class"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Manufacturing Year</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2025 })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Vehicle Class Category</label>
                    <select
                      className="select-field"
                      value={formData.vehicle_class}
                      onChange={(e) => setFormData({ ...formData, vehicle_class: e.target.value })}
                    >
                      <option value="SEDAN">Executive Sedan</option>
                      <option value="SUV">Premium SUV</option>
                      <option value="EV">Electric Vehicle (EV)</option>
                      <option value="VAN">Multi-Passenger Van</option>
                      <option value="LUXURY">Luxury Class</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Transmission Gearbox</label>
                    <select
                      className="select-field"
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    >
                      <option value="AUTOMATIC">Automatic Transmission</option>
                      <option value="MANUAL">Manual Shift</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seating Capacity (Pass.)</label>
                    <input
                      type="number"
                      className="input-field"
                      min="2"
                      max="20"
                      value={formData.seating_capacity}
                      onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) || 4 })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fuel Type</label>
                    <select
                      className="select-field"
                      value={formData.fuel_type}
                      onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    >
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="ELECTRIC">Electric (EV)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Initial Odometer (KM)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.current_odometer}
                      onChange={(e) => setFormData({ ...formData, current_odometer: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                </div>
              </div>

              {/* SECTION 2: VEHICLE PHOTO GALLERY */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Camera size={16} />
                      <span>2. Vehicle Photo Gallery</span>
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Upload vehicle photos for client showcase & verification.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPhotoPreset}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Load Sample High-Res Pack</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFiles(e.target.files);
                    }
                  }}
                />

                {/* Drag & Drop Dropzone Box */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '24px',
                    borderRadius: '10px',
                    border: isDragging ? '2px dashed #38bdf8' : '2px dashed rgba(255, 255, 255, 0.15)',
                    background: isDragging ? 'rgba(30, 41, 59, 0.05)' : '#ffffff', border: isDragging ? '2px dashed #1e293b' : '2px dashed #cbd5e1',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '14px'
                  }}
                >
                  <UploadCloud size={36} color="#38bdf8" style={{ margin: '0 auto 8px auto' }} />
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    Drag & Drop Car Photos Here, or <span style={{ color: '#38bdf8', textDecoration: 'underline' }}>Browse Gallery Files</span>
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Select multiple photos from your device (JPG, PNG, WEBP, HEIC).
                  </p>
                </div>

                {/* Mandatory & Recommended Photo Checklist Guide */}
                <div style={{ marginBottom: uploadedPhotos.length > 0 ? '16px' : '0', padding: '12px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <AlertCircle size={14} />
                    <span>Mandatory Photo Upload Checklist</span>
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.73rem', color: '#e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span><strong>Front View</strong> (Mandatory *)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span><strong>Side Profile</strong> (Mandatory *)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span><strong>Rear View</strong> (Mandatory *)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span><strong>Interior Cabin</strong> (Mandatory *)</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    💡 <em>Optional photos recommended: Dashboard, Trunk Space, Engine Bay, Telematics Unit.</em>
                  </p>
                </div>

                {/* Uploaded Gallery Grid */}
                {uploadedPhotos.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                        ✓ {uploadedPhotos.length} Photo{uploadedPhotos.length > 1 ? 's' : ''} Uploaded to Gallery
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Click star ⭐ on any photo to set as Primary Showcase Thumbnail
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {uploadedPhotos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            height: '110px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: primaryPhotoIndex === idx ? '2px solid #34d399' : '1px solid var(--border-color)',
                            background: '#000'
                          }}
                        >
                          <img src={photoUrl} alt={`Uploaded ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                          {/* Primary Star Badge Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryPhotoIndex(idx);
                            }}
                            title={primaryPhotoIndex === idx ? 'Primary Main Thumbnail' : 'Set as Primary Thumbnail'}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              background: primaryPhotoIndex === idx ? 'rgba(52, 211, 153, 0.9)' : 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 6px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Star size={11} fill={primaryPhotoIndex === idx ? '#fff' : 'none'} />
                            <span>{primaryPhotoIndex === idx ? 'Primary' : 'Set Main'}</span>
                          </button>

                          {/* Trash / Delete Photo Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            title="Remove Photo"
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(239, 68, 68, 0.85)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>

                          <div style={{
                            position: 'absolute',
                            bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.7)',
                            fontSize: '0.62rem',
                            color: '#fff',
                            padding: '2px 6px',
                            textAlign: 'center'
                          }}>
                            Photo #{idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Add More Photos Card */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          height: '110px',
                          borderRadius: '8px',
                          border: '2px dashed rgba(255, 255, 255, 0.2)',
                          background: 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justify: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Plus size={22} color="#38bdf8" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '4px', color: '#38bdf8' }}>Add More</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: COMMERCIAL TARIFF RATES (INR ₹) */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} />
                  <span>3. Commercial Contract Tariff Rates (INR ₹)</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Shift Rate Slab (₹ / 8-Hour Shift)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 3500"
                      value={formData.shift_rate_inr}
                      onChange={(e) => setFormData({ ...formData, shift_rate_inr: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Extra Mileage Rate (₹ / KM)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 18"
                      value={formData.extra_km_rate_inr}
                      onChange={(e) => setFormData({ ...formData, extra_km_rate_inr: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: TELEMATICS & AMENITIES CHECKLIST */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={16} />
                  <span>4. Telematics Equipment & Passenger Amenities</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {AVAILABLE_FEATURES.map((feature) => {
                    const isChecked = formData.features.includes(feature);
                    return (
                      <label
                        key={feature}
                        onClick={() => handleToggleFeature(feature)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(30, 41, 59, 0.06)' : '#ffffff',
                          border: isChecked ? '1px solid #1e293b' : '1px solid #cbd5e1',
                          color: '#1e293b',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          background: isChecked ? '#a855f7' : 'transparent',
                          border: isChecked ? 'none' : '1px solid var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center'
                        }}>
                          {isChecked && <Check size={14} color="#fff" />}
                        </div>
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: LEGAL COMPLIANCE VAULT & PROOF DOCUMENTS (RC BOOK, INSURANCE, PUC, PERMIT) */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} />
                      <span>5. Legal Compliance Vault & Proof Documents (RC Book, Insurance, PUC, Permit)</span>
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Record Registration Certificate (RC Book), Commercial Insurance, PUC, RTO Fitness & Tourist Permits.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCompliancePreset}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      color: '#facc15',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Auto-Fill Sample RC & Legal Vault</span>
                  </button>
                </div>

                {complianceDocs.length === 0 ? (
                  <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed var(--border-color)', background: '#1e293b', textAlign: 'center' }}>
                    <FileText size={28} color="var(--text-dim)" style={{ margin: '0 auto 6px auto' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      No legal compliance documents filed yet. Click below or use preset to record RC Book & Insurance.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddComplianceDocEntry}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      <Plus size={14} />
                      <span>Add First Compliance Document</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {complianceDocs.map((doc, idx) => (
                      <div key={idx} style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1.2fr 40px', gap: '10px', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Document Type *</label>
                          <select
                            className="select-field"
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            value={doc.document_type}
                            onChange={(e) => handleUpdateComplianceDoc(idx, 'document_type', e.target.value)}
                          >
                            <option value="RC_BOOK">Registration Certificate (RC Book)</option>
                            <option value="INSURANCE">Vehicle Insurance Policy</option>
                            <option value="PUC">Pollution Under Control (PUC)</option>
                            <option value="FITNESS">RTO Fitness Certificate</option>
                            <option value="PERMIT">Commercial Tourist Permit</option>
                            <option value="TAX_REC">Road Tax Receipt</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Document No. *</label>
                          <input
                            type="text"
                            className="input-field"
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            placeholder="e.g. RC-GA03AX8899"
                            value={doc.document_number}
                            onChange={(e) => handleUpdateComplianceDoc(idx, 'document_number', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Issue Date</label>
                          <input
                            type="date"
                            className="input-field"
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            value={doc.issue_date}
                            onChange={(e) => handleUpdateComplianceDoc(idx, 'issue_date', e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Expiry Date *</label>
                          <input
                            type="date"
                            className="input-field"
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            value={doc.expiry_date}
                            onChange={(e) => handleUpdateComplianceDoc(idx, 'expiry_date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Issuer RTO / Authority</label>
                          <input
                            type="text"
                            className="input-field"
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            placeholder="e.g. RTO Panaji / ICICI"
                            value={doc.issuer_authority}
                            onChange={(e) => handleUpdateComplianceDoc(idx, 'issuer_authority', e.target.value)}
                          />
                        </div>

                        <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveComplianceDoc(idx)}
                            title="Remove document record"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddComplianceDocEntry}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '8px 14px', width: 'fit-content', marginTop: '4px' }}
                    >
                      <Plus size={14} />
                      <span>+ Add Another Legal Document Record</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 6: DUTY STATUS & REMARKS */}
              <div style={{ background: 'rgba(248, 250, 252, 0.9)', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} />
                  <span>6. Operational Status & Fleet Notes</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Initial Operational Status</label>
                    <select
                      className="select-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="AVAILABLE">Available for Shift Dispatch</option>
                      <option value="ON_DUTY">On Duty / Active</option>
                      <option value="IN_MAINTENANCE">In Maintenance</option>
                      <option value="DECOMMISSIONED">Decommissioned</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Operational Remarks / Vehicle History</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Executive airport unit, regular service done Sep 2026."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Save & Publish Vehicle
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DRIVER ASSIGNMENT MODAL (Material Design 3 Dialog) */}
      {showAssignDriverModal && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowAssignDriverModal(false)}>
          <div 
            className="md3-card portal-modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '680px',
              padding: '32px',
              borderRadius: '28px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={22} color="#1e293b" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                    Assign Driver to Vehicle
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {selectedVehicle?.make} {selectedVehicle?.model} • <span className="font-mono">{selectedVehicle?.registration_number}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignDriverModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Filter */}
            <div style={{ marginBottom: '18px' }}>
              <div className="search-box" style={{ background: 'var(--md-surface-container)', borderRadius: '24px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search driver by name, license number, or badge..."
                  value={driverSearchQuery}
                  onChange={(e) => setDriverSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', padding: '10px 4px' }}
                />
              </div>
            </div>

            {/* Drivers List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '24px' }}>
              {loadingDrivers ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading available drivers roster...
                </div>
              ) : availableDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', background: 'var(--md-surface-container-low)', borderRadius: '12px' }}>
                  No drivers found.
                </div>
              ) : (
                availableDrivers
                  .filter((d) => {
                    const name = `${d.user_detail?.first_name || ''} ${d.user_detail?.last_name || ''} ${d.user_detail?.username || ''}`.toLowerCase();
                    const q = driverSearchQuery.toLowerCase();
                    return name.includes(q) || d.license_number?.toLowerCase().includes(q) || d.badge_number?.toLowerCase().includes(q);
                  })
                  .map((d) => {
                    const isSelected = selectedDriverIdToAssign === d.id;
                    const isCurrentlyThisVehicle = selectedVehicle?.current_driver?.[0]?.id === d.id;
                    const isAssignedToOther = d.assigned_vehicle && d.assigned_vehicle !== selectedVehicle?.id;
                    const driverName = d.user_detail?.first_name ? `${d.user_detail.first_name} ${d.user_detail.last_name || ''}` : d.user_detail?.username;

                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDriverIdToAssign(d.id)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #1e293b' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(241, 245, 249, 0.95)' : 'var(--md-surface-container-low)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {d.avatar_url ? (
                            <img
                              src={d.avatar_url}
                              alt={driverName}
                              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                              {(d.user_detail?.first_name?.[0] || d.user_detail?.username?.[0] || 'D').toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>{driverName}</strong>
                              {isCurrentlyThisVehicle && (
                                <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Currently Assigned</span>
                              )}
                              {isAssignedToOther && (
                                <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Paired elsewhere</span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              Lic: <span className="font-mono">{d.license_number}</span> • Duty: {d.duty_status_display || d.duty_status}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <div>🛡️ {d.safety_score}/100</div>
                            <div>⭐ {d.rating} ★</div>
                          </div>
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: isSelected ? '6px solid #1e293b' : '2px solid var(--border-color)',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }} />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <button
                type="button"
                onClick={() => setShowAssignDriverModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '24px', padding: '10px 22px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedDriverIdToAssign || assignmentSubmitting}
                onClick={handleConfirmDriverAssignment}
                className="btn-primary"
                style={{
                  borderRadius: '24px',
                  padding: '10px 26px',
                  opacity: (!selectedDriverIdToAssign || assignmentSubmitting) ? 0.6 : 1,
                  cursor: (!selectedDriverIdToAssign || assignmentSubmitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {assignmentSubmitting ? 'Assigning Driver...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default VehicleManagement;

