import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, Plus, Search, Filter, Edit3, Trash2, CheckCircle2,
  Clock, MapPin, Hotel, Car, Plane, Users, Eye, AlertCircle,
  Tag, DollarSign, Layers, Sparkles, RefreshCw
} from 'lucide-react';
import TripPackageBuilderModal from './TripPackageBuilderModal';
import * as api from '../../services/api';

export default function TripPackagesManagementView({
  packages = [],
  hotels = [],
  cars = [],
  bikes = [],
  flights = [],
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  portalTitle = 'Package Management'
}) {
  const [currentPackages, setCurrentPackages] = useState(packages || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Keep currentPackages synced when parent packages prop changes
  useEffect(() => {
    setCurrentPackages(packages || []);
  }, [packages]);

  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // Filter packages
  const filteredPackages = useMemo(() => {
    return (currentPackages || []).filter(pkg => {
      const name = (pkg.name || pkg.package_name || '').toLowerCase();
      const dest = (pkg.destination || '').toLowerCase();
      const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || dest.includes(searchTerm.toLowerCase());

      const status = (pkg.status || 'published').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && (status === 'published' || !pkg.status)) ||
        (statusFilter === 'draft' && status === 'draft');

      const cat = (pkg.package_type || 'Trip Package').toLowerCase();
      const matchesCat = categoryFilter === 'all' || cat.includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCat;
    });
  }, [currentPackages, searchTerm, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = currentPackages?.length || 0;
    const published = (currentPackages || []).filter(p => !p.status || p.status === 'published').length;
    const drafts = (currentPackages || []).filter(p => p.status === 'draft').length;
    const totalPrice = (currentPackages || []).reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    return { total, published, drafts, avgPrice };
  }, [currentPackages]);

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsBuilderOpen(true);
  };

  const handleDelete = async (pkg) => {
    const pkgId = pkg?.id || pkg?.package_id;
    const pkgName = pkg?.name || pkg?.package_name || 'this package';
    if (!window.confirm(`Are you sure you want to delete the package "${pkgName}"? This action cannot be undone.`)) {
      return;
    }
    // Optimistic UI update: instantly remove package from screen
    setCurrentPackages(prev => prev.filter(p => String(p.id) !== String(pkgId)));
    try {
      if (typeof onDeletePackage === 'function') {
        await onDeletePackage(pkgId);
      } else {
        await api.deletePackage(pkgId);
      }
      // Re-fetch to ensure fresh data
      try {
        const fresh = await api.fetchPackages();
        if (Array.isArray(fresh)) {
          setCurrentPackages(fresh);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Delete error:', err);
      // Revert on error
      setCurrentPackages(packages || []);
      alert('Failed to delete package: ' + (err.message || 'Server error'));
    }
  };

  const handleToggleStatus = async (pkg) => {
    const pkgId = pkg?.id || pkg?.package_id;
    const currentStatus = (pkg.status || 'published').toLowerCase();
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const updatedPkg = { ...pkg, status: newStatus };

    // Optimistic UI update
    setCurrentPackages(prev => prev.map(p => String(p.id) === String(pkgId) ? updatedPkg : p));
    try {
      if (typeof onUpdatePackage === 'function') {
        await onUpdatePackage(updatedPkg);
      } else {
        await api.updatePackage(updatedPkg);
      }
    } catch (err) {
      console.error('Update status error:', err);
      setCurrentPackages(packages || []);
      alert('Failed to update package status: ' + (err.message || 'Server error'));
    }
  };

  const handleSavePackage = async (payload) => {
    if (editingPackage) {
      if (typeof onUpdatePackage === 'function') {
        await onUpdatePackage(payload);
      } else {
        await api.updatePackage(payload);
      }
    } else {
      if (typeof onAddPackage === 'function') {
        await onAddPackage(payload);
      } else {
        await api.addPackage(payload);
      }
    }
    try {
      const fresh = await api.fetchPackages();
      if (Array.isArray(fresh)) {
        setCurrentPackages(fresh);
      }
    } catch (e) {}
  };

  return (
    <div className="p-2 p-sm-3 p-md-4 w-100" style={{ background: '#f8fafc', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* ─── HEADER & ACTIONS ─── */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4 w-100">
        <div className="min-w-0 flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <div
              className="rounded-3 p-2 d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #172F4F 100%)' }}
            >
              <Compass size={22} style={{ color: '#FF6333' }} />
            </div>
            <h4 className="fw-bold mb-0 text-dark font-heading text-wrap" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}>
              {portalTitle}
            </h4>
          </div>
          <p className="text-muted small mb-0">
            Create, configure, and publish complete travel packages with hotel, vehicle, itinerary, and driver service.
          </p>
        </div>

        <button
          type="button"
          className="btn px-4 py-2.5 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
          onClick={handleOpenAdd}
        >
          <Plus size={18} />
          <span>Create New Package</span>
        </button>
      </div>

      {/* ─── STATS OVERVIEW CARDS ─── */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-3 border shadow-xs h-100">
            <span className="text-muted text-uppercase fw-bold text-truncate d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              Total Packages
            </span>
            <div className="fw-extrabold text-dark fs-4 mt-1">{stats.total}</div>
            <span className="text-secondary small text-truncate d-block" style={{ fontSize: '0.72rem' }}>In catalog</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-3 border shadow-xs h-100">
            <span className="text-success text-uppercase fw-bold text-truncate d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              ● Published & Live
            </span>
            <div className="fw-extrabold text-success fs-4 mt-1">{stats.published}</div>
            <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.72rem' }}>Visible on website</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-3 border shadow-xs h-100">
            <span className="text-warning text-uppercase fw-bold text-truncate d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              ● Drafts & Inactive
            </span>
            <div className="fw-extrabold text-warning fs-4 mt-1">{stats.drafts}</div>
            <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.72rem' }}>Hidden from customers</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-3 border shadow-xs h-100">
            <span className="text-primary text-uppercase fw-bold text-truncate d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
              Avg Starting Price
            </span>
            <div className="fw-extrabold text-primary fs-4 mt-1">₹{stats.avgPrice.toLocaleString('en-IN')}</div>
            <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.72rem' }}>Across packages</span>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="p-3 bg-white rounded-4 border shadow-sm mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search packages by title or destination..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-sm-7 col-lg-4">
            <div className="d-flex align-items-center gap-1 flex-wrap">
              <button
                type="button"
                className={`btn btn-sm px-2.5 px-sm-3 rounded-pill fw-semibold border ${
                  statusFilter === 'all' ? 'btn-dark text-white' : 'btn-light text-muted'
                }`}
                onClick={() => setStatusFilter('all')}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                className={`btn btn-sm px-2.5 px-sm-3 rounded-pill fw-semibold border ${
                  statusFilter === 'published' ? 'btn-success text-white' : 'btn-light text-muted'
                }`}
                onClick={() => setStatusFilter('published')}
              >
                Published ({stats.published})
              </button>
              <button
                type="button"
                className={`btn btn-sm px-2.5 px-sm-3 rounded-pill fw-semibold border ${
                  statusFilter === 'draft' ? 'btn-warning text-dark' : 'btn-light text-muted'
                }`}
                onClick={() => setStatusFilter('draft')}
              >
                Drafts ({stats.drafts})
              </button>
            </div>
          </div>

          <div className="col-12 col-sm-5 col-lg-3">
            <select
              className="form-select form-select-sm"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Package Types</option>
              <option value="trip">Trip Packages</option>
              <option value="self drive">Self Drive Packages</option>
              <option value="honeymoon">Honeymoon Specials</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── PACKAGE CARDS LIST ─── */}
      <div className="d-flex flex-column gap-3 w-100">
        {filteredPackages.length === 0 ? (
          <div className="p-5 text-center bg-white rounded-4 border">
            <Compass size={40} className="text-muted opacity-50 mb-2" />
            <h6 className="fw-bold text-dark">No packages found</h6>
            <p className="text-muted small mb-3">Try adjusting your search criteria or create a new trip package.</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-semibold"
              onClick={handleOpenAdd}
            >
              + Create Trip Package
            </button>
          </div>
        ) : (
          filteredPackages.map(pkg => {
            const isPublished = !pkg.status || pkg.status.toLowerCase() === 'published';
            const price = Number(pkg.price) || 0;
            const cover = pkg.imageUrl || pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={pkg.id}
                className="pkg-mgmt-card p-3 mb-3"
              >
                {/* 1. Thumbnail Section */}
                <div className="pkg-mgmt-card-thumb rounded-3 position-relative">
                  <img
                    src={cover}
                    alt={pkg.name}
                    onError={e => {
                      e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="position-absolute top-0 start-0 m-1.5">
                    <span
                      className={`badge rounded-pill fw-bold text-uppercase px-2 py-0.5 shadow-sm ${
                        isPublished ? 'bg-success text-white' : 'bg-warning text-dark'
                      }`}
                      style={{ fontSize: '0.62rem' }}
                    >
                      ● {isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                </div>

                {/* 2. Main Card Content (reflows between Desktop, Tablet, and Mobile) */}
                <div className="pkg-mgmt-card-content">
                  {/* Package Info & Badges */}
                  <div className="pkg-mgmt-info-col">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem', overflowWrap: 'anywhere' }}>
                        {pkg.name}
                      </h6>
                      <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5 flex-shrink-0" style={{ fontSize: '0.68rem' }}>
                        {pkg.package_type || 'Trip Package'}
                      </span>
                    </div>

                    <div className="text-muted small d-flex align-items-center gap-2 flex-wrap mb-2" style={{ fontSize: '0.78rem' }}>
                      <span className="d-flex align-items-center gap-1 flex-shrink-0">
                        <Clock size={13} className="text-warning flex-shrink-0" /> {pkg.duration}
                      </span>
                      <span className="d-none d-sm-inline text-muted opacity-50">•</span>
                      <span className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '280px' }}>
                        <MapPin size={13} className="text-danger flex-shrink-0" /> {pkg.destination || 'Goa, India'}
                      </span>
                    </div>

                    {/* Component Inclusions Badges with WRAPPING */}
                    <div className="d-flex flex-wrap gap-1.5 min-w-0">
                      <span className="badge bg-light text-dark border px-2 py-1 rounded-pill pkg-mgmt-badge">
                        <Hotel size={12} className="text-primary me-1 flex-shrink-0" /> Stay: {pkg.hotel?.category || pkg.hotel_included || 'Included'}
                      </span>
                      {pkg.car_included && (
                        <span className="badge bg-light text-dark border px-2 py-1 rounded-pill pkg-mgmt-badge">
                          <Car size={12} className="text-success me-1 flex-shrink-0" /> Vehicle: {pkg.vehicle?.name || pkg.car_included}
                        </span>
                      )}
                      {pkg.driver_included ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill pkg-mgmt-badge">
                          <Users size={12} className="me-1 flex-shrink-0" /> Driver: Included ({pkg.driver_type || 'Full Day'})
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill pkg-mgmt-badge">
                          Self-Drive (No Driver)
                        </span>
                      )}
                      {pkg.flights_included && (
                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill pkg-mgmt-badge">
                          <Plane size={12} className="me-1 flex-shrink-0" /> Flight: {pkg.flights_included}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Bottom Bar / Sub-Container (contains Price & Actions) */}
                  <div className="pkg-mgmt-bottom-bar">
                    {/* Price Section */}
                    <div className="pkg-mgmt-price-col">
                      <span className="text-muted text-uppercase fw-semibold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                        Starts from
                      </span>
                      <div className="fw-extrabold text-nowrap" style={{ color: '#FF6333', fontSize: '1.3rem', lineHeight: 1.15 }}>
                        ₹{price.toLocaleString('en-IN')}
                      </div>
                      <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0.5 mt-1" style={{ fontSize: '0.66rem' }}>
                        {pkg.advance_percentage || 25}% Advance
                      </span>
                    </div>

                    {/* Actions Section */}
                    <div className="pkg-mgmt-actions-col">
                      <button
                        type="button"
                        className={`btn btn-sm px-3 py-1 rounded-pill fw-semibold border w-100 ${
                          isPublished
                            ? 'btn-outline-warning text-dark'
                            : 'btn-outline-success text-success'
                        }`}
                        style={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                        onClick={() => handleToggleStatus(pkg)}
                        title="Toggle Draft/Published status"
                      >
                        {isPublished ? 'Switch to Draft' : 'Publish Live'}
                      </button>

                      <div className="d-flex align-items-center gap-2 w-100 flex-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-dark text-white rounded-pill px-3 py-1 fw-semibold d-flex align-items-center justify-content-center gap-1.5 text-nowrap flex-grow-1"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleOpenEdit(pkg)}
                        >
                          <Edit3 size={13} />
                          <span>Edit Package</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 fw-semibold d-flex align-items-center justify-content-center gap-1.5 text-nowrap flex-shrink-0"
                          style={{ fontSize: '0.78rem' }}
                          title="Delete Package"
                          onClick={() => handleDelete(pkg)}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── TRIP PACKAGE BUILDER MODAL ─── */}
      <TripPackageBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSavePackage}
        editingPackage={editingPackage}
        hotels={hotels}
        cars={cars}
        bikes={bikes}
        flights={flights}
      />
    </div>
  );
}
