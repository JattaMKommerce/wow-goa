import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, CheckCircle, XCircle, Clock, AlertTriangle, PlusCircle,
  Edit2, Trash2, ExternalLink, Search, Filter, Compass, Waves,
  Landmark, ShoppingBag, Utensils, Sparkles, Navigation, RefreshCw,
  Check, X, Eye, FileText, ChevronRight, ShieldCheck, Info
} from 'lucide-react';
import * as api from '../../services/api';

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

export default function HotelDestinationsManagement({
  hotels = [],
  currentUser = null,
  portalTitle = 'Admin Portal',
  initialHotelId = null,
  onBack = null
}) {
  const [destinations, setDestinations] = useState([]);
  const [counts, setCounts] = useState({ TOTAL: 0, APPROVED: 0, PENDING_APPROVAL: 0, DRAFT: 0, REJECTED: 0, PENDING_EDITS: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState(initialHotelId || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialHotelId) {
      setHotelFilter(initialHotelId);
    }
  }, [initialHotelId]);

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'reject' | 'view'
  const [selectedDest, setSelectedDest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
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
    approval_status: 'APPROVED'
  });

  // Load destinations from authoritative API
  const loadDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchAdminHotelDestinations(statusFilter, hotelFilter);
      if (res.destinations) {
        setDestinations(res.destinations);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hotel destinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, [statusFilter, hotelFilter]);

  // Auto clear alerts
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Open Add Modal
  const handleOpenAdd = (preferredHotelId = null) => {
    const targetHotel = (typeof preferredHotelId === 'string' && preferredHotelId)
      ? preferredHotelId
      : (hotelFilter !== 'all' ? hotelFilter : (hotels && hotels.length > 0 ? hotels[0].id : ''));
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
      approval_status: 'APPROVED'
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
      approval_status: dest.approval_status
    });
    setModalMode('edit');
  };

  // Distance change auto-calc helper
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
      alert('Please select a hotel property');
      return;
    }
    if (!formData.destination_name.trim()) {
      alert('Please enter a destination name');
      return;
    }
    if (!formData.distance_value || parseFloat(formData.distance_value) <= 0) {
      alert('Please enter a valid distance greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const payload = {
          ...formData,
          auth_user_id: currentUser?.id || 'admin'
        };
        const res = await api.addHotelDestination(payload);
        setSuccessMsg(res.message || 'Destination added successfully');
      } else {
        const payload = {
          ...formData,
          id: selectedDest.id,
          auth_user_id: currentUser?.id || 'admin'
        };
        const res = await api.updateHotelDestination(payload);
        setSuccessMsg(res.message || 'Destination updated successfully');
      }
      setModalMode(null);
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve Destination
  const handleApprove = async (destId) => {
    if (!window.confirm('Approve and publish this destination to the customer-facing hotel listing?')) return;
    setIsSubmitting(true);
    try {
      const res = await api.approveHotelDestination(destId);
      setSuccessMsg(res.message || 'Destination approved and published!');
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (dest) => {
    setSelectedDest(dest);
    setRejectReason('');
    setModalMode('reject');
  };

  // Submit Rejection
  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection so the vendor understands how to correct it.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.rejectHotelDestination(selectedDest.id, rejectReason.trim());
      setSuccessMsg(res.message || 'Destination rejected');
      setModalMode(null);
      await loadDestinations();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Destination
  const handleDelete = async (destId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove it from customer highlights.`)) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteHotelDestination(destId);
      setSuccessMsg(res.message || 'Destination deleted successfully');
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
      // Category filter
      if (categoryFilter !== 'all' && d.destination_category !== categoryFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dName = (d.destination_name || '').toLowerCase();
        const hName = (d.hotel_name || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        if (!dName.includes(q) && !hName.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [destinations, categoryFilter, searchQuery]);

  return (
    <div className="p-3 p-md-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ─── 1. HEADER & KPI CARDS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill px-2.5 py-1 text-xs fw-bold" style={{ background: '#0284c7', color: '#fff' }}>
              🏨 Hotel Proximity System
            </span>
            <span className="text-muted text-xs">
              Live distance highlights across customer listings
            </span>
          </div>
          <h3 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '1.65rem' }}>
            Nearby Destinations &amp; Distance Highlights
          </h3>
          <p className="text-muted text-xs mb-0 mt-1">
            Manage nearby beaches, forts, churches, and landmarks with verified walking &amp; driving distances for hotels.
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
            style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
          >
            <PlusCircle size={15} /> Add Destination
          </button>
        </div>
      </div>

      {/* KPI Status Badges */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-2.4 col-lg">
          <div 
            onClick={() => setStatusFilter('all')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'all' ? 'border-primary shadow' : 'bg-white'}`}
            style={{ borderLeft: statusFilter === 'all' ? '4px solid #0284c7' : '1px solid #e2e8f0' }}
          >
            <div className="text-muted text-xxs fw-bold text-uppercase">Total Destinations</div>
            <div className="fs-4 fw-black text-dark mt-1">{counts.TOTAL}</div>
            <div className="text-muted text-xxs mt-1">Across all hotels</div>
          </div>
        </div>

        <div className="col-6 col-md-2.4 col-lg">
          <div 
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'PENDING_APPROVAL' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #F59E0B', background: statusFilter === 'PENDING_APPROVAL' ? '#FEF3C7' : '#fff' }}
          >
            <div className="text-warning text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <Clock size={12} /> Pending Approval
            </div>
            <div className="fs-4 fw-black text-warning mt-1">{counts.PENDING_APPROVAL}</div>
            <div className="text-muted text-xxs mt-1">Awaiting verification</div>
          </div>
        </div>

        <div className="col-6 col-md-2.4 col-lg">
          <div 
            onClick={() => setStatusFilter('APPROVED')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'APPROVED' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #10B981', background: statusFilter === 'APPROVED' ? '#D1FAE5' : '#fff' }}
          >
            <div className="text-success text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <CheckCircle size={12} /> Approved &amp; Live
            </div>
            <div className="fs-4 fw-black text-success mt-1">{counts.APPROVED}</div>
            <div className="text-muted text-xxs mt-1">Visible to customers</div>
          </div>
        </div>

        <div className="col-6 col-md-2.4 col-lg">
          <div 
            onClick={() => setStatusFilter('DRAFT')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'DRAFT' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #64748B', background: statusFilter === 'DRAFT' ? '#F1F5F9' : '#fff' }}
          >
            <div className="text-secondary text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <Edit2 size={12} /> Drafts
            </div>
            <div className="fs-4 fw-black text-secondary mt-1">{counts.DRAFT}</div>
            <div className="text-muted text-xxs mt-1">Unsubmitted records</div>
          </div>
        </div>

        <div className="col-6 col-md-2.4 col-lg">
          <div 
            onClick={() => setStatusFilter('REJECTED')}
            className={`card border-0 rounded-3 shadow-sm p-3 cursor-pointer transition-all ${statusFilter === 'REJECTED' ? 'shadow' : 'bg-white'}`}
            style={{ borderLeft: '4px solid #EF4444', background: statusFilter === 'REJECTED' ? '#FEE2E2' : '#fff' }}
          >
            <div className="text-danger text-xxs fw-bold text-uppercase d-flex align-items-center gap-1">
              <XCircle size={12} /> Rejected
            </div>
            <div className="fs-4 fw-black text-danger mt-1">{counts.REJECTED}</div>
            <div className="text-muted text-xxs mt-1">Feedback provided</div>
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

      {/* ─── 2. FILTERS & SEARCH BAR ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          
          {/* Search box */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 text-xs"
                placeholder="Search attraction name, hotel, or notes..."
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

          {/* Hotel Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm text-xs bg-light border"
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
            >
              <option value="all">All Hotels ({hotels.length})</option>
              {hotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm text-xs bg-light border"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {DESTINATION_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="col-12 col-md-2 text-md-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill text-xs px-3 w-100"
              onClick={() => {
                setStatusFilter('all');
                setHotelFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. DESTINATIONS DATA TABLE / CARDS ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <div className="fw-bold text-dark text-xs d-flex align-items-center gap-2">
            <span>Listing {filteredList.length} destinations</span>
            {statusFilter !== 'all' && (
              <span className="badge bg-light text-dark border rounded-pill text-xxs">
                Filter: {statusFilter}
              </span>
            )}
          </div>
          <span className="text-muted text-xxs">
            {destinations.filter(d => d.approval_status === 'APPROVED').length} active live attractions
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <RefreshCw size={24} className="animate-spin text-primary mb-2 mx-auto" />
            <div className="text-muted text-xs">Loading hotel destinations...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-5">
            <MapPin size={36} className="text-muted mb-2 mx-auto opacity-50" />
            <div className="fw-bold text-dark text-sm">No destinations found for this filter</div>
            <div className="text-muted text-xs mt-1">Try adjusting your hotel or status filters, or click below to register a nearby point of interest.</div>
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="btn btn-primary btn-sm rounded-pill px-4 py-2 text-xs fw-bold mt-3 shadow"
              style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
            >
              <PlusCircle size={15} className="me-1 d-inline" /> + Add Destination Now
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-light text-muted text-xxs text-uppercase fw-bold">
                <tr>
                  <th style={{ width: '22%' }}>Destination &amp; Category</th>
                  <th style={{ width: '20%' }}>Hotel Property</th>
                  <th style={{ width: '18%' }}>Distance &amp; Travel Time</th>
                  <th style={{ width: '15%' }}>Approval Status</th>
                  <th style={{ width: '12%' }}>Submitted By</th>
                  <th style={{ width: '13%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((dest) => {
                  const hasPendingEdits = Boolean(dest.pending_changes_parsed);
                  return (
                    <tr key={dest.id} style={{ background: hasPendingEdits ? '#FFFBEB' : 'transparent' }}>
                      
                      {/* Destination Name & Category */}
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
                            <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px' }}>
                              <MapPin size={20} />
                            </div>
                          )}
                          <div>
                            <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                              {dest.destination_name}
                              {dest.latitude && dest.longitude && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${dest.latitude},${dest.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary"
                                  title="Open in Google Maps"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-1 text-muted text-xxs mt-0.5">
                              <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5 text-xxs">
                                {dest.destination_category}
                              </span>
                              {dest.travel_mode === 'Walking' ? (
                                <span className="text-success text-xxs">🚶 Walking</span>
                              ) : (
                                <span className="text-primary text-xxs">🚗 Driving</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hotel Property */}
                      <td>
                        <div className="fw-semibold text-dark">{dest.hotel_name || dest.hotel_id}</div>
                        <div className="text-muted text-xxs">{dest.hotel_area || dest.hotel_location || 'Goa, India'}</div>
                      </td>

                      {/* Distance & Travel Time */}
                      <td>
                        <div className="fw-bold text-dark">
                          {dest.distance_value} {dest.distance_unit}
                          <span className="text-muted fw-normal text-xxs ms-1">({dest.distance_meters} m)</span>
                        </div>
                        <div className="text-muted text-xxs mt-0.5">
                          {dest.travel_mode === 'Walking'
                            ? `~${dest.walking_time_minutes || 2} min walk`
                            : `~${dest.driving_time_minutes || 5} min drive`}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td>
                        {dest.approval_status === 'APPROVED' ? (
                          <div>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <CheckCircle size={11} /> Live &amp; Approved
                            </span>
                            {hasPendingEdits && (
                              <div className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-0.5 text-xxs fw-bold mt-1 d-block">
                                ⚠️ Pending Edit Awaiting Review
                              </div>
                            )}
                          </div>
                        ) : dest.approval_status === 'PENDING_APPROVAL' ? (
                          <span className="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-50 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                            <Clock size={11} /> Pending Admin Review
                          </span>
                        ) : dest.approval_status === 'REJECTED' ? (
                          <div>
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                              <XCircle size={11} /> Rejected
                            </span>
                            {dest.rejection_reason && (
                              <div className="text-danger text-xxs mt-1 fw-semibold" style={{ maxWidth: '180px', lineHeight: '1.2' }}>
                                Reason: {dest.rejection_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                            <Edit2 size={11} /> Draft
                          </span>
                        )}
                      </td>

                      {/* Submitted By */}
                      <td>
                        <div className="text-muted text-xs">
                          {dest.submitted_by === 'admin' ? 'Admin' : (dest.submitted_by || 'Vendor')}
                        </div>
                        <div className="text-muted text-xxs">
                          {dest.updated_at ? dest.updated_at.split(' ')[0] : ''}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          
                          {/* Approve Action */}
                          {(dest.approval_status === 'PENDING_APPROVAL' || hasPendingEdits) && (
                            <button
                              type="button"
                              onClick={() => handleApprove(dest.id)}
                              disabled={isSubmitting}
                              className="btn btn-success btn-sm rounded-pill px-2.5 py-1 text-xxs fw-bold d-flex align-items-center gap-1 shadow-xs"
                              title="Approve & Publish to customer cards"
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}

                          {/* Reject Action */}
                          {(dest.approval_status === 'PENDING_APPROVAL' || hasPendingEdits) && (
                            <button
                              type="button"
                              onClick={() => handleOpenReject(dest)}
                              disabled={isSubmitting}
                              className="btn btn-outline-danger btn-sm rounded-pill px-2 py-1 text-xxs fw-bold d-flex align-items-center gap-1"
                              title="Reject with feedback"
                            >
                              <X size={12} /> Reject
                            </button>
                          )}

                          {/* Edit Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dest)}
                            className="btn btn-light border btn-sm rounded-pill p-1.5 text-muted hover-text-dark"
                            title="Edit destination details"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDelete(dest.id, dest.destination_name)}
                            disabled={isSubmitting}
                            className="btn btn-light border btn-sm rounded-pill p-1.5 text-danger hover-bg-danger"
                            title="Delete destination"
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

      {/* ─── 4. ADD / EDIT DESTINATION MODAL ─── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              
              <div className="modal-header border-bottom p-3.5 bg-light">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-2">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-black text-dark mb-0 font-heading" style={{ fontSize: '1.15rem' }}>
                      {modalMode === 'add' ? 'Add Nearby Destination & Attraction' : `Edit Destination: ${selectedDest?.destination_name}`}
                    </h5>
                    <div className="text-muted text-xxs">
                      Verified proximity information for hotel listing cards &amp; details page
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
                      <label className="form-label text-xs fw-bold text-dark">Hotel Property *</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.hotel_id}
                        onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                        required
                        disabled={modalMode === 'edit'}
                      >
                        <option value="">Select Hotel</option>
                        {hotels.map(h => (
                          <option key={h.id} value={h.id}>{h.name} ({h.area || h.location})</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Category */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold text-dark">Destination Category *</label>
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
                      <label className="form-label text-xs fw-bold text-dark">Destination / Attraction Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. Baga Beach, Aguada Fort, Britto's Seafood Shack"
                        value={formData.destination_name}
                        onChange={(e) => setFormData({ ...formData, destination_name: e.target.value })}
                        required
                      />
                    </div>

                    {/* Distance Value & Unit */}
                    <div className="col-6 col-md-4">
                      <label className="form-label text-xs fw-bold text-dark">Distance *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. 100 or 1.5"
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

                    {/* Travel Time Estimates */}
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
                      <span className="text-muted text-xxs">Estimated time on foot</span>
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
                      <span className="text-muted text-xxs">Estimated time by car / taxi</span>
                    </div>

                    {/* Destination Image URL */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold text-dark">Destination Photo URL (Optional)</label>
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
                      <label className="form-label text-xs fw-bold text-dark">Description &amp; Access Information (Optional)</label>
                      <textarea
                        rows={2}
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. Direct private beach access gate from resort gardens, ideal for sunset views."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {/* Coordinates */}
                    <div className="col-6">
                      <label className="form-label text-xs fw-bold text-dark">Latitude (Optional)</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-control form-control-sm text-xs"
                        placeholder="15.555300"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label text-xs fw-bold text-dark">Longitude (Optional)</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="form-control form-control-sm text-xs"
                        placeholder="73.751700"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </div>

                    {/* Approval Status */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold text-dark">Publication Status</label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={formData.approval_status}
                        onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                      >
                        <option value="APPROVED">APPROVED (Live Immediately on Customer Stays)</option>
                        <option value="DRAFT">DRAFT (Keep in private draft)</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL (Hold for verification)</option>
                      </select>
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
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', border: 'none' }}
                  >
                    {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Save & Publish Destination' : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ─── 5. REJECTION REASON MODAL ─── */}
      {modalMode === 'reject' && selectedDest && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom p-3.5 bg-danger bg-opacity-10">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-3 bg-danger text-white p-2">
                    <XCircle size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-black text-danger mb-0 font-heading" style={{ fontSize: '1.1rem' }}>
                      Reject Destination Submission
                    </h5>
                    <div className="text-muted text-xxs">
                      Rejecting "{selectedDest.destination_name}"
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setModalMode(null)}></button>
              </div>

              <form onSubmit={handleSubmitReject}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-xs fw-bold text-dark">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows={3}
                      className="form-control text-xs"
                      placeholder="e.g. Distance inaccurate. Map route confirms Baga Beach is 450m walking distance from this property, not 50m."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="text-muted text-xxs mt-1">
                      This explanation will be displayed in the hotel vendor console so they can verify the distance and resubmit.
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
                    className="btn btn-danger btn-sm rounded-pill px-4 text-xs fw-bold shadow-sm"
                  >
                    {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
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

