import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, CheckCircle, XCircle, Clock, AlertTriangle, PlusCircle,
  Edit2, Trash2, ExternalLink, Search, RefreshCw, Send, Check, X,
  Waves, Landmark, ShoppingBag, Utensils, Sparkles, Compass, Info,
  AlertCircle
} from 'lucide-react';
import * as api from '../../../services/api';

const DESTINATION_CATEGORIES = [
  { id: 'Beaches', label: 'Beaches', icon: <Waves size={15} /> },
  { id: 'Tourist Attractions', label: 'Tourist Attractions', icon: <Compass size={15} /> },
  { id: 'Historical Places', label: 'Historical Places', icon: <Landmark size={15} /> },
  { id: 'Forts', label: 'Forts', icon: <Landmark size={15} /> },
  { id: 'Churches', label: 'Churches', icon: <Landmark size={15} /> },
  { id: 'Shopping Areas', label: 'Shopping Areas', icon: <ShoppingBag size={15} /> },
  { id: 'Markets', label: 'Markets', icon: <ShoppingBag size={15} /> },
  { id: 'Restaurants', label: 'Restaurants', icon: <Utensils size={15} /> },
  { id: 'Water Sports', label: 'Water Sports', icon: <Waves size={15} /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <Sparkles size={15} /> },
  { id: 'Other Attractions', label: 'Other Attractions', icon: <MapPin size={15} /> }
];

export default function PMSNearbyDestinations({
  vendorId = 'u-5',
  myHotels = [],
  initialHotelId = null
}) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialHotelId) {
      setSelectedHotelId(initialHotelId);
    }
  }, [initialHotelId]);

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [selectedDest, setSelectedDest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    hotel_id: '',
    destination_name: '',
    destination_category: 'Beaches',
    distance_value: '',
    distance_unit: 'Metres',
    travel_mode: 'Walking',
    walking_time_minutes: '',
    driving_time_minutes: '',
    description: '',
    image: '',
    latitude: '',
    longitude: '',
    submit_for_approval: true
  });

  // Load Vendor Destinations
  const loadDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const hotelFilterParam = selectedHotelId !== 'all' ? selectedHotelId : '';
      const list = await api.fetchVendorHotelDestinations(vendorId, hotelFilterParam);
      setDestinations(list || []);
    } catch (err) {
      setError(err.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, [vendorId, selectedHotelId]);

  // Auto clear alerts
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = destinations.length;
    const approved = destinations.filter(d => d.approval_status === 'APPROVED').length;
    const pending = destinations.filter(d => d.approval_status === 'PENDING_APPROVAL').length;
    const rejected = destinations.filter(d => d.approval_status === 'REJECTED').length;
    const draft = destinations.filter(d => d.approval_status === 'DRAFT').length;
    return { total, approved, pending, rejected, draft };
  }, [destinations]);

  // Open Add Modal
  const handleOpenAdd = (preferredHotelId = null) => {
    const targetHotel = (typeof preferredHotelId === 'string' && preferredHotelId)
      ? preferredHotelId
      : (selectedHotelId !== 'all' ? selectedHotelId : (myHotels.length > 0 ? myHotels[0].id : (destinations[0]?.hotel_id || 'hotel-3star')));
    setFormData({
      hotel_id: targetHotel,
      destination_name: '',
      destination_category: 'Beaches',
      distance_value: '',
      distance_unit: 'Metres',
      travel_mode: 'Walking',
      walking_time_minutes: '',
      driving_time_minutes: '',
      description: '',
      image: '',
      latitude: '',
      longitude: '',
      submit_for_approval: true
    });
    setSelectedDest(null);
    setModalMode('add');
  };

  // Open Edit Modal
  const handleOpenEdit = (dest) => {
    setSelectedDest(dest);
    setFormData({
      id: dest.id,
      hotel_id: dest.hotel_id,
      destination_name: dest.destination_name,
      destination_category: dest.destination_category,
      distance_value: dest.distance_value,
      distance_unit: dest.distance_unit || 'Metres',
      travel_mode: dest.travel_mode || 'Walking',
      walking_time_minutes: dest.walking_time_minutes || '',
      driving_time_minutes: dest.driving_time_minutes || '',
      description: dest.description || '',
      image: dest.image || '',
      latitude: dest.latitude || '',
      longitude: dest.longitude || '',
      submit_for_approval: true
    });
    setModalMode('edit');
  };

  // Distance helper
  const handleDistanceChange = (val, unit) => {
    const num = parseFloat(val);
    let meters = 0;
    if (!isNaN(num) && num > 0) {
      meters = (unit === 'Kilometres' || unit === 'km') ? Math.round(num * 1000) : Math.round(num);
    }
    const walkEst = meters > 0 ? Math.max(1, Math.round(meters / 75)) : '';
    const driveEst = meters > 0 ? Math.max(1, Math.round(meters / 350)) : '';

    setFormData(prev => ({
      ...prev,
      distance_value: val,
      distance_unit: unit,
      walking_time_minutes: prev.walking_time_minutes || walkEst,
      driving_time_minutes: prev.driving_time_minutes || driveEst
    }));
  };

  // Save Add/Edit
  const handleSaveDestination = async (e) => {
    e.preventDefault();
    if (!formData.hotel_id) {
      alert('Please select your hotel property');
      return;
    }
    if (!formData.destination_name.trim()) {
      alert('Please enter a destination name');
      return;
    }
    if (!formData.distance_value || parseFloat(formData.distance_value) <= 0) {
      alert('Please enter a valid distance');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const payload = {
          ...formData,
          vendor_id: vendorId,
          auth_user_id: vendorId
        };
        const res = await api.addHotelDestination(payload);
        setSuccessMsg(res.message || 'Destination added successfully!');
      } else {
        const payload = {
          ...formData,
          id: selectedDest.id,
          vendor_id: vendorId,
          auth_user_id: vendorId
        };
        const res = await api.updateHotelDestination(payload);
        setSuccessMsg(res.message || 'Destination updated successfully!');
      }
      setModalMode(null);
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Failed to save destination');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Draft or Resubmit Rejected for Approval
  const handleSubmitForApproval = async (destId) => {
    setIsSubmitting(true);
    try {
      const res = await api.submitHotelDestinationApproval(destId);
      setSuccessMsg(res.message || 'Submitted for Admin approval!');
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Destination
  const handleDelete = async (destId, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your hotel's nearby destinations?`)) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteHotelDestination(destId);
      setSuccessMsg(res.message || 'Destination removed.');
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return destinations.filter(d => {
      if (statusFilter !== 'all' && d.approval_status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dName = (d.destination_name || '').toLowerCase();
        const hName = (d.hotel_name || '').toLowerCase();
        if (!dName.includes(q) && !hName.includes(q)) return false;
      }
      return true;
    });
  }, [destinations, statusFilter, searchQuery]);

  return (
    <div className="p-3 p-md-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ─── 1. VENDOR HEADER ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill px-2.5 py-1 text-xs fw-bold" style={{ background: '#0D9488', color: '#fff' }}>
              🏖️ Location &amp; Proximity Highlights
            </span>
            <span className="text-muted text-xs">
              Attract more guests by highlighting nearby beaches &amp; attractions
            </span>
          </div>
          <h3 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '1.5rem' }}>
            Nearby Destinations &amp; Attractions
          </h3>
          <p className="text-muted text-xs mb-0 mt-1">
            Add verified distances to beaches, forts, markets, and dining hotspots. Approved items appear prominently on your customer hotel cards.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadDestinations}
            disabled={loading}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold d-flex align-items-center gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 text-xs fw-bold d-flex align-items-center gap-1.5 shadow"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', border: 'none' }}
          >
            <PlusCircle size={15} /> Add Nearby Attraction
          </button>
        </div>
      </div>

      {/* ─── 2. KPI STATUS CARDS ─── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div 
            onClick={() => setStatusFilter('all')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'all' ? 'border-primary shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #0D9488' }}
          >
            <div className="text-muted text-xxs fw-bold text-uppercase">Total Added</div>
            <div className="fs-4 fw-black text-dark mt-1">{stats.total}</div>
            <div className="text-muted text-xxs mt-0.5">Across your hotels</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div 
            onClick={() => setStatusFilter('APPROVED')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'APPROVED' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #10B981', background: statusFilter === 'APPROVED' ? '#D1FAE5' : '#fff' }}
          >
            <div className="text-success text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <CheckCircle size={12} /> Approved &amp; Live
            </div>
            <div className="fs-4 fw-black text-success mt-1">{stats.approved}</div>
            <div className="text-muted text-xxs mt-0.5">Showing to customers</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div 
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'PENDING_APPROVAL' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #F59E0B', background: statusFilter === 'PENDING_APPROVAL' ? '#FEF3C7' : '#fff' }}
          >
            <div className="text-warning text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <Clock size={12} /> Under Review
            </div>
            <div className="fs-4 fw-black text-warning mt-1">{stats.pending}</div>
            <div className="text-muted text-xxs mt-0.5">Admin verifying distance</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div 
            onClick={() => setStatusFilter('REJECTED')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'REJECTED' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #EF4444', background: statusFilter === 'REJECTED' ? '#FEE2E2' : '#fff' }}
          >
            <div className="text-danger text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <XCircle size={12} /> Action Required
            </div>
            <div className="fs-4 fw-black text-danger mt-1">{stats.rejected}</div>
            <div className="text-muted text-xxs mt-0.5">Feedback provided</div>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 shadow-sm d-flex align-items-center gap-2 text-xs py-2 mb-3" role="alert">
          <CheckCircle size={16} className="text-success flex-shrink-0" />
          <span className="fw-semibold">{successMsg}</span>
          <button type="button" className="btn-close ms-auto p-2" onClick={() => setSuccessMsg(null)}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 shadow-sm d-flex align-items-center gap-2 text-xs py-2 mb-3" role="alert">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <span className="fw-semibold">{error}</span>
          <button type="button" className="btn-close ms-auto p-2" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* ─── 3. SEARCH & HOTEL SELECTOR ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 text-xs"
                placeholder="Search attraction name or hotel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-light border-start-0 text-muted" onClick={() => setSearchQuery('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select form-select-sm text-xs bg-light border"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
            >
              <option value="all">All My Properties</option>
              {myHotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2 text-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill text-xs px-3 w-100"
              onClick={() => {
                setStatusFilter('all');
                setSelectedHotelId('all');
                setSearchQuery('');
              }}
            >
              Clear
            </button>
          </div>

        </div>
      </div>

      {/* ─── 4. VENDOR DESTINATIONS TABLE ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <div className="fw-bold text-dark text-xs">
            Showing {filteredList.length} destinations
          </div>
          <span className="text-muted text-xxs">
            Items approved by Admin are automatically featured on hotel cards
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <RefreshCw size={24} className="animate-spin text-primary mb-2 mx-auto" />
            <div className="text-muted text-xs">Loading destinations...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-5">
            <MapPin size={36} className="text-muted mb-2 mx-auto opacity-50" />
            <div className="fw-bold text-dark text-sm">No nearby destinations found for this filter</div>
            <div className="text-muted text-xs mt-1">Click the button below to add walking or driving distances to popular beaches, forts, and markets.</div>
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="btn btn-sm rounded-pill px-4 py-2 text-xs fw-bold mt-3 text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', border: 'none' }}
            >
              <PlusCircle size={15} className="me-1 d-inline" /> + Add Nearby Attraction Now
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-light text-muted text-xxs text-uppercase fw-bold">
                <tr>
                  <th style={{ width: '28%' }}>Destination &amp; Category</th>
                  <th style={{ width: '22%' }}>Distance &amp; Mode</th>
                  <th style={{ width: '25%' }}>Status &amp; Feedback</th>
                  <th style={{ width: '25%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((dest) => {
                  const hasPendingEdits = Boolean(dest.pending_changes_parsed);
                  return (
                    <tr key={dest.id} style={{ background: hasPendingEdits ? '#FFFBEB' : 'transparent' }}>
                      
                      {/* Destination Name & Photo */}
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          {dest.image ? (
                            <img
                              src={dest.image}
                              alt={dest.destination_name}
                              className="rounded-3 shadow-xs"
                              style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-teal" style={{ width: '42px', height: '42px' }}>
                              <MapPin size={20} className="text-muted" />
                            </div>
                          )}
                          <div>
                            <div className="fw-bold text-dark">{dest.destination_name}</div>
                            <div className="d-flex align-items-center gap-1.5 text-muted text-xxs mt-0.5">
                              <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5 text-xxs">
                                {dest.destination_category}
                              </span>
                              <span>· For {dest.hotel_name || dest.hotel_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Distance & Travel Time */}
                      <td>
                        <div className="fw-bold text-dark">
                          {dest.distance_value} {dest.distance_unit}
                          <span className="text-muted fw-normal text-xxs ms-1">({dest.distance_meters} m)</span>
                        </div>
                        <div className="text-muted text-xxs mt-0.5">
                          {dest.travel_mode === 'Walking' ? (
                            <span className="text-success fw-semibold">🚶 ~{dest.walking_time_minutes || 2} min walk</span>
                          ) : (
                            <span className="text-primary fw-semibold">🚗 ~{dest.driving_time_minutes || 5} min drive</span>
                          )}
                        </div>
                      </td>

                      {/* Approval Status & Feedback */}
                      <td>
                        {dest.approval_status === 'APPROVED' ? (
                          <div>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <CheckCircle size={11} /> Published &amp; Live
                            </span>
                            {hasPendingEdits && (
                              <div className="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-40 rounded-pill px-2 py-0.5 text-xxs fw-bold mt-1 d-block">
                                ⏳ Updated details under review
                              </div>
                            )}
                          </div>
                        ) : dest.approval_status === 'PENDING_APPROVAL' ? (
                          <div>
                            <span className="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-40 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <Clock size={11} /> Verification in Progress
                            </span>
                            <div className="text-muted text-xxs mt-1">Admin will verify proximity</div>
                          </div>
                        ) : dest.approval_status === 'REJECTED' ? (
                          <div>
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <XCircle size={11} /> Action Needed: Rejected
                            </span>
                            {dest.rejection_reason && (
                              <div className="alert alert-danger p-1.5 rounded-2 text-xxs mt-1.5 mb-0" style={{ lineHeight: '1.25' }}>
                                <strong>Admin Note:</strong> {dest.rejection_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <Edit2 size={11} /> Draft
                            </span>
                            <div className="text-muted text-xxs mt-0.5">Not submitted yet</div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          
                          {/* Submit for approval button (for Draft or Rejected items) */}
                          {(dest.approval_status === 'DRAFT' || dest.approval_status === 'REJECTED') && (
                            <button
                              type="button"
                              onClick={() => handleSubmitForApproval(dest.id)}
                              disabled={isSubmitting}
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 text-xxs fw-bold d-flex align-items-center gap-1"
                            >
                              <Send size={11} /> {dest.approval_status === 'REJECTED' ? 'Resubmit' : 'Submit for Review'}
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dest)}
                            className="btn btn-light border btn-sm rounded-pill p-1.5 text-muted hover-text-dark"
                            title="Edit details"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(dest.id, dest.destination_name)}
                            disabled={isSubmitting}
                            className="btn btn-light border btn-sm rounded-pill p-1.5 text-danger"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 5. ADD / EDIT DESTINATION MODAL ─── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              
              <div className="modal-header border-bottom p-3.5 bg-light">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-3 bg-teal bg-opacity-10 text-teal p-2" style={{ color: '#0D9488' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-black text-dark mb-0 font-heading" style={{ fontSize: '1.15rem' }}>
                      {modalMode === 'add' ? 'Add Nearby Attraction' : `Edit: ${selectedDest?.destination_name}`}
                    </h5>
                    <div className="text-muted text-xxs">
                      {selectedDest?.approval_status === 'APPROVED' ? (
                        <span className="text-primary fw-semibold">Note: Editing an approved item will submit an update for review while keeping your live listing active.</span>
                      ) : (
                        'Enter accurate distance from your hotel property'
                      )}
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setModalMode(null)}></button>
              </div>

              <form onSubmit={handleSaveDestination}>
                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  
                  <div className="row g-3">
                    
                    {/* Hotel Property */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark">Select Your Hotel *</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.hotel_id}
                        onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                        required
                        disabled={modalMode === 'edit'}
                      >
                        <option value="">Select Property</option>
                        {myHotels.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Category */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark">Category *</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.destination_category}
                        onChange={(e) => setFormData({ ...formData, destination_category: e.target.value })}
                        required
                      >
                        {DESTINATION_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Name */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold text-dark">Attraction / Beach / Landmark Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. Baga Beach, Saturday Night Market, Chapora Fort"
                        value={formData.destination_name}
                        onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                        required
                      />
                    </div>

                    {/* Distance & Unit */}
                    <div className="col-6 col-md-4">
                      <label className="form-label text-xs fw-bold text-dark">Distance *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. 150 or 1.2"
                        value={formData.distance_value}
                        onChange={(e) => handleDistanceChange(e.target.value, formData.distance_unit)}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <label className="form-label text-xs fw-bold text-dark">Unit *</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.distance_unit}
                        onChange={(e) => handleDistanceChange(formData.distance_value, e.target.value)}
                        required
                      >
                        <option value="Metres">Metres (m)</option>
                        <option value="Kilometres">Kilometres (km)</option>
                      </select>
                    </div>

                    {/* Travel Mode */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-xs fw-bold text-dark">Travel Mode *</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.travel_mode}
                        onChange={(e) => setFormData({ ...formData, travel_mode: e.target.value })}
                        required
                      >
                        <option value="Walking">Walking 🚶</option>
                        <option value="Driving">Driving 🚗</option>
                      </select>
                    </div>

                    {/* Travel Times */}
                    <div className="col-6">
                      <label className="form-label text-xs fw-bold text-dark">Walking Time (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. 2"
                        value={formData.walking_time_minutes}
                        onChange={(e) => setFormData({ ...formData, walking_time_minutes: e.target.value })}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-xs fw-bold text-dark">Driving Time (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. 5"
                        value={formData.driving_time_minutes}
                        onChange={(e) => setFormData({ ...formData, driving_time_minutes: e.target.value })}
                      />
                    </div>

                    {/* Image URL */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold text-dark">Photo URL (Optional)</label>
                      <input
                        type="url"
                        className="form-control form-control-sm text-xs"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      />
                    </div>

                    {/* Description / Access Notes */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold text-dark">Access Description &amp; Tips (Optional)</label>
                      <textarea
                        rows={2}
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. Direct beachfront walkway from resort pool area, beach towels provided."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {/* Action on Save */}
                    <div className="col-12">
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="submitApprovalSwitch"
                          checked={formData.submit_for_approval}
                          onChange={(e) => setFormData({ ...formData, submit_for_approval: e.target.checked })}
                        />
                        <label className="form-check-label text-xs fw-bold text-dark ms-1" htmlFor="submitApprovalSwitch">
                          Submit immediately for Admin verification &amp; publication
                        </label>
                        <div className="text-muted text-xxs">
                          If unchecked, it will be saved as a private Draft until you are ready to submit.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-top p-3 bg-light d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill text-xs px-3" onClick={() => setModalMode(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-sm rounded-pill px-4 text-xs fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', border: 'none' }}
                  >
                    {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Save Destination' : 'Update Destination'}
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

