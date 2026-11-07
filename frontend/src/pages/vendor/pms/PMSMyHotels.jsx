import React, { useState } from 'react';
import {
  Building, MapPin, Star, CheckCircle, Clock, XCircle, Eye, Edit,
  BedDouble, DollarSign, BarChart2, PlusCircle, Trash2, Send, Pause,
  Play, AlertTriangle, Image, Calendar, ArrowRight, MoreVertical
} from 'lucide-react';
import * as api from '../../../services/api';

const STATUS_CONFIG = {
  'Draft': { color: '#6c757d', bg: '#f8f9fa', icon: <Edit size={12} /> },
  'Submitted': { color: '#0984e3', bg: '#e3f2fd', icon: <Send size={12} /> },
  'Under Review': { color: '#fdcb6e', bg: '#fff9e6', icon: <Clock size={12} /> },
  'Changes Required': { color: '#e17055', bg: '#fff3f0', icon: <AlertTriangle size={12} /> },
  'Approved': { color: '#00b894', bg: '#edf7f0', icon: <CheckCircle size={12} /> },
  'Live': { color: '#00b894', bg: '#edf7f0', icon: <CheckCircle size={12} /> },
  'Paused': { color: '#fdcb6e', bg: '#fff9e6', icon: <Pause size={12} /> },
  'Rejected': { color: '#d63031', bg: '#fff0f0', icon: <XCircle size={12} /> },
  'Suspended': { color: '#d63031', bg: '#fff0f0', icon: <XCircle size={12} /> }
};

function HotelCard({ hotel, onNavigate, onAction, vendorBookings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hotelStatus = hotel.hotel_status || 'Draft';
  const sc = STATUS_CONFIG[hotelStatus] || STATUS_CONFIG['Draft'];
  const bookingCount = vendorBookings.filter(b => b.item_id === hotel.id).length;
  const images = (() => {
    try { return hotel.images_json ? JSON.parse(hotel.images_json) : []; } catch { return []; }
  })();
  const coverImg = hotel.image || images[0] || null;

  const actions = [
    { label: 'Edit Hotel', icon: <Edit size={14} />, action: 'edit' },
    { label: 'Nearby Attractions & Distances', icon: <MapPin size={14} />, tab: 'nearby_destinations' },
    { label: 'Manage Rooms', icon: <BedDouble size={14} />, tab: 'room_types' },
    { label: 'Manage Pricing', icon: <DollarSign size={14} />, tab: 'rate_plans' },
    { label: 'Manage Availability', icon: <Calendar size={14} />, tab: 'availability' },
    { label: 'View Bookings', icon: <BarChart2 size={14} />, tab: 'all_bookings' },
    ...(hotelStatus === 'Draft' || hotelStatus === 'Changes Required'
      ? [{ label: 'Submit for Approval', icon: <Send size={14} />, action: 'submit' }]
      : []),
    ...(hotelStatus === 'Live'
      ? [{ label: 'Pause Listing', icon: <Pause size={14} />, action: 'pause' }]
      : hotelStatus === 'Paused'
      ? [{ label: 'Resume Listing', icon: <Play size={14} />, action: 'resume' }]
      : []),
    { label: hotelStatus === 'Draft' ? 'Delete Draft' : 'Delete Hotel', icon: <Trash2 size={14} />, action: 'delete', danger: true }
  ];

  return (
    <div className="card border-0 rounded-4 overflow-hidden shadow-sm h-100" style={{ background: '#fff' }}>
      {/* Cover Image */}
      <div className="position-relative" style={{ height: '160px', background: '#e9ecef' }}>
        {coverImg
          ? <img src={coverImg} alt={hotel.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
          : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><Building size={40} className="text-muted opacity-25" /></div>
        }
        <div className="position-absolute top-0 start-0 m-2">
          <span className="badge d-flex align-items-center gap-1 py-1 px-2 rounded-pill" style={{ background: sc.bg, color: sc.color, fontSize: '0.7rem', fontWeight: 700 }}>
            {sc.icon} {hotelStatus}
          </span>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <div className="position-relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff' }}>
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="position-absolute end-0 bg-white rounded-3 shadow-lg py-1 mt-1 z-3" style={{ minWidth: '200px', top: '36px' }}>
                {actions.map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMenuOpen(false);
                      if (a.tab) onNavigate(a.tab, hotel.id);
                      else if (a.action) onAction(hotel, a.action);
                    }}
                    className="btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 border-0 rounded-0"
                    style={{ fontSize: '0.82rem', color: a.danger ? '#d63031' : '#2d3748', background: 'transparent' }}
                  >
                    <span style={{ color: a.danger ? '#d63031' : '#6c757d' }}>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Profile completion bar */}
        <div className="position-absolute bottom-0 start-0 end-0 px-3 pb-2">
          <div className="d-flex align-items-center gap-2">
            <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.3)' }}>
              <div style={{ width: `${hotel.profile_completion || 20}%`, height: '100%', background: '#00b894' }}></div>
            </div>
            <span className="text-white fw-bold" style={{ fontSize: '0.65rem' }}>{hotel.profile_completion || 20}%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-1">
          <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem', color: '#1a2b4a' }}>{hotel.name}</h6>
          {hotel.stars && (
            <div className="d-flex gap-0">
              {[...Array(Math.min(parseInt(hotel.stars), 5))].map((_, i) => (
                <Star key={i} size={10} fill="#FFC107" color="#FFC107" />
              ))}
            </div>
          )}
        </div>
        <div className="text-muted d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.75rem' }}>
          <MapPin size={11} /> {hotel.location || 'Goa'} • {hotel.property_type || 'Hotel'}
        </div>

        {/* Stats Row */}
        <div className="d-flex justify-content-between py-2 px-2 rounded-3 mb-3" style={{ background: '#f8f9fa' }}>
          <div className="text-center">
            <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#1a2b4a' }}>{bookingCount}</div>
            <div className="text-muted" style={{ fontSize: '0.65rem' }}>Bookings</div>
          </div>
          <div className="text-center">
            <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#1a2b4a' }}>₹{(parseInt(hotel.price) || 0).toLocaleString('en-IN')}</div>
            <div className="text-muted" style={{ fontSize: '0.65rem' }}>From/Night</div>
          </div>
          <div className="text-center">
            <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#1a2b4a' }}>{parseFloat(hotel.rating || 0).toFixed(1)}</div>
            <div className="text-muted" style={{ fontSize: '0.65rem' }}>Rating</div>
          </div>
        </div>

        {/* Approval Remarks */}
        {(hotelStatus === 'Changes Required' || hotelStatus === 'Rejected') && hotel.approval_remarks && (
          <div className="alert alert-warning py-2 px-3 mb-2 d-flex align-items-start gap-2" style={{ fontSize: '0.75rem' }}>
            <AlertTriangle size={13} className="mt-0 flex-shrink-0" />
            <span><strong>Remark:</strong> {hotel.approval_remarks}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="d-flex flex-column gap-2">
          <button
            onClick={() => onNavigate('nearby_destinations', hotel.id)}
            className="btn btn-sm rounded-pill fw-bold w-100 d-flex align-items-center justify-content-center gap-1.5 shadow-sm text-white"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', fontSize: '0.78rem', border: 'none' }}
          >
            <MapPin size={13} /> Nearby Attractions &amp; Distances
          </button>
          <div className="d-flex gap-2">
            <button onClick={() => onNavigate('room_types', hotel.id)} className="btn btn-sm flex-grow-1 rounded-pill fw-bold" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.78rem' }}>
              Manage Rooms
            </button>
            <button onClick={() => onNavigate('availability', hotel.id)} className="btn btn-sm rounded-pill" style={{ background: '#f0f2f5', color: '#2d3748', fontSize: '0.78rem' }} title="Manage Availability">
              <Calendar size={13} />
            </button>
            <button onClick={() => onNavigate('all_bookings', hotel.id)} className="btn btn-sm rounded-pill" style={{ background: '#f0f2f5', color: '#2d3748', fontSize: '0.78rem' }} title="View Bookings">
              <BarChart2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PMSMyHotels({ currentUser, vendorHotels, vendorBookings, onNavigate, onDeleteHotel }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const handleAction = async (hotel, action) => {
    if (action === 'delete') {
      if (!window.confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
      try {
        await onDeleteHotel(hotel.id);
      } catch (e) { alert('Error: ' + e.message); }
      return;
    }
    if (action === 'edit') {
      onNavigate('add_hotel', hotel.id);
      return;
    }
    setActionLoading(hotel.id);
    try {
      const statusMap = { submit: 'Submitted', pause: 'Paused', resume: 'Live' };
      if (statusMap[action]) {
        await api.pmsUpdateHotelStatus(hotel.id, currentUser.id, statusMap[action], null);
        if (onUpdateHotel) {
          await onUpdateHotel({ ...hotel, hotel_status: statusMap[action] });
        }
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statuses = ['All', 'Draft', 'Submitted', 'Under Review', 'Changes Required', 'Approved', 'Live', 'Paused', 'Rejected'];
  const filtered = statusFilter === 'All' ? vendorHotels : vendorHotels.filter(h => (h.hotel_status || 'Draft') === statusFilter);

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>My Hotels</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{vendorHotels.length} properties • {vendorHotels.filter(h => (h.hotel_status || 'Live') === 'Live').length} live</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => onNavigate('nearby_destinations')}
            className="btn d-flex align-items-center gap-2 rounded-pill fw-bold px-3 py-2 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', fontSize: '0.88rem' }}
          >
            <MapPin size={16} /> Nearby Destinations
          </button>
          <button onClick={() => onNavigate('add_hotel')} className="btn d-flex align-items-center gap-2 rounded-pill fw-bold px-4 py-2" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.88rem' }}>
            <PlusCircle size={16} /> Add Hotel
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm rounded-pill px-3" style={{ background: statusFilter === s ? '#0D1B2E' : '#fff', color: statusFilter === s ? '#fff' : '#6c757d', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
            {s} {s !== 'All' ? `(${vendorHotels.filter(h => (h.hotel_status || 'Draft') === s).length})` : `(${vendorHotels.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center" style={{ background: '#fff' }}>
          <Building size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No hotels found</h5>
          <p className="text-muted small mb-4">Start by adding your first hotel property</p>
          <button onClick={() => onNavigate('add_hotel')} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            <PlusCircle size={16} className="me-2" /> Add Your First Hotel
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map(hotel => (
            <div key={hotel.id} className="col-12 col-md-6 col-xl-4">
              <HotelCard hotel={hotel} onNavigate={onNavigate} onAction={handleAction} vendorBookings={vendorBookings} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
